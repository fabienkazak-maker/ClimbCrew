import type { NextFunction, Request, Response } from "express";
import { pool } from "../database";
import type { AuthSessionRow, RequestAuth } from "../domain";
import { serializeUser } from "../serializers";
import { csrfToken, sessionToken } from "./cookies";
import { constantTimeEqual, hashToken } from "./tokens";

async function sessionFromToken(token: string): Promise<AuthSessionRow | null> {
  const result = await pool.query<AuthSessionRow>(
    `select us.id as session_id, u.* from user_sessions us
     join users u on u.id = us.user_id
     where us.token_hash = $1 and us.revoked_at is null
       and us.expires_at > now() limit 1`,
    [hashToken(token)],
  );
  return result.rows[0] ?? null;
}

function safeMethod(method: string): boolean {
  return ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

async function requestAuth(request: Request): Promise<RequestAuth | null> {
  const token = sessionToken(request);
  if (!token) return null;
  const session = await sessionFromToken(token);
  if (session?.status !== "active") return null;
  return {
    token,
    sessionId: String(session.session_id),
    user: serializeUser(session),
  };
}

export async function optionalAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = await requestAuth(request);
    if (auth) request.auth = auth;
    else delete request.auth;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = await requestAuth(request);
    if (!auth) {
      response
        .status(401)
        .json({ error: "Session invalide ou compte non actif" });
      return;
    }
    if (!safeMethod(request.method)) {
      const header = request.headers["x-csrf-token"];
      const cookie = csrfToken(request);
      if (
        typeof header !== "string" ||
        !cookie ||
        !constantTimeEqual(header, cookie)
      ) {
        response.status(403).json({ error: "Protection CSRF invalide" });
        return;
      }
    }
    request.auth = auth;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (request.auth?.user.role !== "admin") {
    response.status(403).json({ error: "Accès administrateur requis" });
    return;
  }
  next();
}
