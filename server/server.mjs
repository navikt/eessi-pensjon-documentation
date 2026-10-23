// Production server for eessi-pensjon-documentation.
//
// Runs behind Wonderwall (the NAIS login proxy). Wonderwall handles /oauth2/*
// and forwards the employee's Entra ID token in the Authorization header.
// This server:
//   - serves the Vite build (SPA with index.html fallback)
//   - validates the user token through Texas introspection
//   - exposes GET /api/me with the logged-in employee
//   - proxies /api/* to eessi-pensjon-documentation-api with an on-behalf-of token
//
// Plain Node, no dependencies. Without NAIS_TOKEN_* variables it runs in local
// mode: a placeholder user and no token exchange.

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const FORWARDED_REQUEST_HEADERS = ["accept", "accept-language", "content-type", "x-request-id"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "cache-control", "x-request-id"];

export function configFromEnv(env = process.env) {
  return {
    port: Number(env.PORT ?? 3000),
    staticDir: resolve(env.STATIC_DIR ?? join(fileURLToPath(new URL(".", import.meta.url)), "..", "dist")),
    apiUrl: (env.DOCUMENTATION_API_URL ?? "http://localhost:8080").replace(/\/$/, ""),
    apiScope: env.DOCUMENTATION_API_SCOPE ?? "",
    tokenExchangeEndpoint: env.NAIS_TOKEN_EXCHANGE_ENDPOINT ?? "",
    tokenIntrospectionEndpoint: env.NAIS_TOKEN_INTROSPECTION_ENDPOINT ?? "",
  };
}

const log = (level, message, extra = {}) =>
  console.log(JSON.stringify({ "@timestamp": new Date().toISOString(), level, message, ...extra }));

function bearerToken(req) {
  const header = req.headers.authorization ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return { ok: response.ok, status: response.status, body: await response.json().catch(() => null) };
}

/** Returns the token claims when Texas says the token is active, otherwise null. */
async function introspect(config, token) {
  const { body } = await postJson(config.tokenIntrospectionEndpoint, { identity_provider: "entra_id", token });
  return body?.active ? body : null;
}

async function exchange(config, token) {
  const { ok, status, body } = await postJson(config.tokenExchangeEndpoint, {
    identity_provider: "entra_id",
    target: config.apiScope,
    user_token: token,
  });
  if (!ok || !body?.access_token) {
    throw new Error(`Token exchange failed with status ${status}: ${body?.error ?? "unknown"}`);
  }
  return body.access_token;
}

function loginRedirect(res, path) {
  res.writeHead(302, { location: `/oauth2/login?redirect=${encodeURIComponent(path)}` });
  res.end();
}

async function handleMe(config, req, res) {
  if (config.local) {
    return sendJson(res, 200, { user: { name: "Utvikler, Lokal", email: null, navIdent: "Z990000", local: true } });
  }
  const token = bearerToken(req);
  const claims = token ? await introspect(config, token) : null;
  if (!claims) return sendJson(res, 200, { user: null });
  sendJson(res, 200, {
    user: {
      name: claims.name ?? claims.preferred_username ?? "Ukjent",
      email: claims.preferred_username ?? null,
      navIdent: claims.NAVident ?? null,
    },
  });
}

async function proxyToApi(config, req, res) {
  const headers = {};
  for (const name of FORWARDED_REQUEST_HEADERS) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }

  if (!config.local) {
    const token = bearerToken(req);
    if (!token) return sendJson(res, 401, { message: "Ikke innlogget" });
    try {
      headers.authorization = `Bearer ${await exchange(config, token)}`;
    } catch (error) {
      log("WARN", "On-behalf-of token exchange failed", { error: error.message });
      return sendJson(res, 401, { message: "Kunne ikke hente token for API-et" });
    }
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream;
  try {
    upstream = await fetch(config.apiUrl + req.url, {
      method: req.method,
      headers,
      body: hasBody ? req : undefined,
      duplex: hasBody ? "half" : undefined,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    log("ERROR", "Request to documentation API failed", { error: error.message, path: req.url });
    return sendJson(res, 502, { message: "API-et svarer ikke" });
  }

  const responseHeaders = {};
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders[name] = value;
  }
  res.writeHead(upstream.status, responseHeaders);
  res.end(Buffer.from(await upstream.arrayBuffer()));
}

/** Resolves a URL path to a file inside staticDir, or null if it is missing or escapes the directory. */
async function staticFile(config, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const file = normalize(join(config.staticDir, decoded));
  if (file !== config.staticDir && !file.startsWith(config.staticDir + sep)) return null;
  const info = await stat(file).catch(() => null);
  return info?.isFile() ? file : null;
}

function sendFile(res, file, cacheControl) {
  res.writeHead(200, {
    "content-type": MIME_TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": cacheControl,
    "x-content-type-options": "nosniff",
  });
  createReadStream(file).pipe(res);
}

async function handleStatic(config, req, res, pathname) {
  const file = await staticFile(config, pathname);
  if (file && !file.endsWith(".html")) {
    const immutable = pathname.startsWith("/assets/");
    return sendFile(res, file, immutable ? "public, max-age=31536000, immutable" : "public, max-age=300");
  }
  if (extname(pathname) && pathname !== "/index.html") {
    return sendJson(res, 404, { message: "Fant ikke filen" });
  }

  // HTML: every client-side route gets index.html, but only for a valid session.
  if (!config.local) {
    const token = bearerToken(req);
    if (!token || !(await introspect(config, token))) return loginRedirect(res, req.url);
  }
  const index = join(config.staticDir, "index.html");
  res.setHeader("x-frame-options", "DENY");
  sendFile(res, index, "no-store");
}

/** The request handler, exported separately so tests can drive it without opening sockets. */
export function createHandler(config) {
  config = { ...config, local: !config.tokenExchangeEndpoint || !config.tokenIntrospectionEndpoint };

  return async (req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    try {
      if (pathname === "/internal/isalive" || pathname === "/internal/isready") {
        res.writeHead(200, { "content-type": "text/plain" });
        return res.end("OK");
      }
      if (pathname === "/api/me") return await handleMe(config, req, res);
      if (pathname.startsWith("/api/")) return await proxyToApi(config, req, res);
      if (req.method !== "GET" && req.method !== "HEAD") return sendJson(res, 405, { message: "Metoden er ikke tillatt" });
      return await handleStatic(config, req, res, pathname);
    } catch (error) {
      log("ERROR", "Unhandled error", { error: error.message, path: pathname });
      if (!res.headersSent) sendJson(res, 500, { message: "Noe gikk galt" });
      else res.end();
    }
  };
}

export function createApp(config) {
  return createServer(createHandler(config));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const config = configFromEnv();
  createApp(config).listen(config.port, () => {
    log("INFO", `eessi-pensjon-documentation started on port ${config.port}`, {
      mode: config.tokenExchangeEndpoint ? "nais" : "local",
    });
  });
}
