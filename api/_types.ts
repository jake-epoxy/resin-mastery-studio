import type { IncomingMessage, ServerResponse } from "node:http";

export interface VercelRequest extends IncomingMessage {
  body?: any;
  query: Record<string, string | string[]>;
  cookies?: Record<string, string>;
}

export interface VercelResponse extends ServerResponse {
  status(statusCode: number): VercelResponse;
  json(body: unknown): VercelResponse;
  send(body: unknown): VercelResponse;
  redirect(statusOrUrl: number | string, url?: string): VercelResponse;
}
