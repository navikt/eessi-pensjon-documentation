// Drives the request handler in-process: no sockets are opened and fetch() is
// replaced by a fake Texas and a fake documentation API.
import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHandler } from "./server.mjs";

const TEXAS = "http://texas.test";
const API = "http://api.test";
const SCOPE = "dev-gcp:eessipensjon:eessi-pensjon-documentation-api";
const USER_TOKEN = "user-token";
const OBO_TOKEN = "obo-token";

class FakeResponse extends Writable {
  statusCode = 200;
  headers = {};
  headersSent = false;
  chunks = [];

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  }

  writeHead(status, headers = {}) {
    this.statusCode = status;
    for (const [name, value] of Object.entries(headers)) this.setHeader(name, value);
    this.headersSent = true;
    return this;
  }

  _write(chunk, _encoding, callback) {
    this.chunks.push(Buffer.from(chunk));
    callback();
  }
}

async function call(handler, url, { method = "GET", token } = {}) {
  const req = Readable.from([]);
  Object.assign(req, { url, method, headers: token ? { authorization: `Bearer ${token}` } : {} });
  const res = new FakeResponse();
  const finished = new Promise((resolve) => res.on("finish", resolve));
  await handler(req, res);
  await finished;
  const text = Buffer.concat(res.chunks).toString();
  return { status: res.statusCode, headers: res.headers, text, json: () => JSON.parse(text) };
}

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let staticDir;
let calls;
const realFetch = globalThis.fetch;

before(async () => {
  staticDir = await mkdtemp(join(tmpdir(), "ep-docs-"));
  await mkdir(join(staticDir, "assets"));
  await writeFile(join(staticDir, "index.html"), "<!doctype html><title>EP</title>");
  await writeFile(join(staticDir, "assets", "app.js"), "console.log('hi')");

  globalThis.fetch = async (url, init = {}) => {
    const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
    calls.push({ url: String(url), headers: init.headers ?? {}, body });
    if (url === `${TEXAS}/introspect`) {
      return jsonResponse(
        200,
        body.token === USER_TOKEN
          ? { active: true, name: "Nordmann, Kari", preferred_username: "kari@nav.no", NAVident: "Z123456" }
          : { active: false },
      );
    }
    if (url === `${TEXAS}/exchange`) {
      return body.user_token === USER_TOKEN
        ? jsonResponse(200, { access_token: OBO_TOKEN })
        : jsonResponse(400, { error: "invalid_grant" });
    }
    if (String(url).startsWith(API)) return jsonResponse(200, { status: "OK" });
    throw new TypeError(`Unexpected fetch to ${url}`);
  };
});

beforeEach(() => {
  calls = [];
});

after(() => {
  globalThis.fetch = realFetch;
});

const apiCalls = () => calls.filter((c) => c.url.startsWith(API));

describe("local mode", () => {
  let handler;
  before(() => {
    handler = createHandler({ staticDir, apiUrl: API, apiScope: "" });
  });

  test("health endpoints answer", async () => {
    assert.equal((await call(handler, "/internal/isalive")).status, 200);
    assert.equal((await call(handler, "/internal/isready")).status, 200);
  });

  test("/api/me returns a placeholder user", async () => {
    const { user } = (await call(handler, "/api/me")).json();
    assert.equal(user.navIdent, "Z990000");
    assert.equal(user.local, true);
  });

  test("proxies /api/* without a token", async () => {
    assert.equal((await call(handler, "/api/ping")).status, 200);
    assert.equal(apiCalls()[0].url, `${API}/api/ping`);
    assert.equal(apiCalls()[0].headers.authorization, undefined);
  });

  test("serves index.html for client routes", async () => {
    const res = await call(handler, "/arkitektur");
    assert.equal(res.status, 200);
    assert.equal(res.headers["cache-control"], "no-store");
    assert.match(res.text, /<title>EP<\/title>/);
  });

  test("serves assets as immutable", async () => {
    const res = await call(handler, "/assets/app.js");
    assert.equal(res.status, 200);
    assert.match(res.headers["cache-control"], /immutable/);
  });

  test("returns 404 for missing files and path traversal", async () => {
    assert.equal((await call(handler, "/assets/missing.js")).status, 404);
    assert.equal((await call(handler, "/..%2F..%2Fetc%2Fhosts.txt")).status, 404);
  });

  test("rejects other methods than GET for pages", async () => {
    assert.equal((await call(handler, "/", { method: "POST" })).status, 405);
  });
});

describe("nais mode", () => {
  let handler;
  before(() => {
    handler = createHandler({
      staticDir,
      apiUrl: API,
      apiScope: SCOPE,
      tokenExchangeEndpoint: `${TEXAS}/exchange`,
      tokenIntrospectionEndpoint: `${TEXAS}/introspect`,
    });
  });

  test("/api/me returns the introspected user", async () => {
    const { user } = (await call(handler, "/api/me", { token: USER_TOKEN })).json();
    assert.deepEqual(user, { name: "Nordmann, Kari", email: "kari@nav.no", navIdent: "Z123456" });
  });

  test("/api/me returns no user for an inactive token", async () => {
    assert.equal((await call(handler, "/api/me", { token: "expired" })).json().user, null);
  });

  test("proxies /api/* with an on-behalf-of token", async () => {
    assert.equal((await call(handler, "/api/ping", { token: USER_TOKEN })).status, 200);
    const exchange = calls.find((c) => c.url === `${TEXAS}/exchange`);
    assert.deepEqual(exchange.body, { identity_provider: "entra_id", target: SCOPE, user_token: USER_TOKEN });
    assert.equal(apiCalls()[0].headers.authorization, `Bearer ${OBO_TOKEN}`);
  });

  test("rejects /api/* without a token", async () => {
    assert.equal((await call(handler, "/api/ping")).status, 401);
    assert.equal(apiCalls().length, 0);
  });

  test("rejects /api/* when the exchange fails", async () => {
    assert.equal((await call(handler, "/api/ping", { token: "bad" })).status, 401);
    assert.equal(apiCalls().length, 0);
  });

  test("serves documentation pages without a session", async () => {
    const res = await call(handler, "/applikasjoner");
    assert.equal(res.status, 200);
    assert.match(res.text, /<title>EP<\/title>/);
    assert.equal(calls.length, 0);
  });

  test("redirects protected pages without a valid session to login", async () => {
    const res = await call(handler, "/status?x=1");
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, "/oauth2/login?redirect=%2Fstatus%3Fx%3D1");
    assert.equal((await call(handler, "/status/", { token: "expired" })).status, 302);
  });

  test("serves the app with a valid session", async () => {
    const res = await call(handler, "/status", { token: USER_TOKEN });
    assert.equal(res.status, 200);
    assert.equal(res.headers["x-frame-options"], "DENY");
  });

  test("serves assets without a session", async () => {
    assert.equal((await call(handler, "/assets/app.js")).status, 200);
  });
});
