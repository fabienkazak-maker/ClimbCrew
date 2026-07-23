import type {
  ErrorRequestHandler,
  Request,
  RequestHandler,
  Response,
} from "express";
import { isRecord } from "./validation";

type AsyncHandler = (request: Request, response: Response) => Promise<void>;

export function asyncRoute(handler: AsyncHandler): RequestHandler {
  return (request, response, next) => {
    handler(request, response).catch(next);
  };
}

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  response.status(500).json({ error: message });
};

export function bodyRecord(request: Request): Record<string, unknown> {
  return isRecord(request.body) ? request.body : {};
}

export function pathParam(request: Request, name: string): string {
  const value = request.params[name];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
