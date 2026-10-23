import type { IncomingMessage, Server, ServerResponse } from "node:http";

export type ServerConfig = {
  port?: number;
  staticDir: string;
  apiUrl: string;
  apiScope: string;
  tokenExchangeEndpoint?: string;
  tokenIntrospectionEndpoint?: string;
};

export function configFromEnv(env?: Record<string, string | undefined>): Required<ServerConfig>;
export function createHandler(config: ServerConfig): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
export function createApp(config: ServerConfig): Server;
