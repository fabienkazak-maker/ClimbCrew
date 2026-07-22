import type { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { constantTimeEqual } from "./tokens";

export function requireSetupAccess(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!config.setupToken) {
    response.status(503).json({ error: "SETUP_TOKEN non configuré" });
    return;
  }
  const header = request.headers["x-setup-token"];
  const query = request.query.setupToken ?? request.query.token;
  const provided =
    typeof header === "string"
      ? header
      : typeof query === "string"
        ? query
        : "";
  if (!constantTimeEqual(provided, config.setupToken)) {
    response.status(403).json({ error: "Jeton de maintenance invalide" });
    return;
  }
  next();
}
