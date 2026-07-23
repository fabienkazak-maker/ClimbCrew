import type { Request, Response } from "express";
import { config } from "../config";

function cookieValue(request: Request, name: string): string {
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of (request.headers.cookie ?? "").split(";")) {
    const candidate = part.trim();
    if (candidate.startsWith(prefix)) {
      return decodeURIComponent(candidate.slice(prefix.length));
    }
  }
  return "";
}

export function sessionToken(request: Request): string {
  const bearer = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  return bearer ?? cookieValue(request, config.sessionCookieName);
}

export function csrfToken(request: Request): string {
  return cookieValue(request, config.csrfCookieName);
}

export function setAuthCookies(
  response: Response,
  session: string,
  csrf: string,
  expiresAt: string,
): void {
  const common = {
    secure: config.secureCookies,
    sameSite: config.cookieSameSite,
    expires: new Date(expiresAt),
    path: "/",
  };
  response.cookie(config.sessionCookieName, session, {
    ...common,
    httpOnly: true,
  });
  response.cookie(config.csrfCookieName, csrf, {
    ...common,
    httpOnly: false,
  });
}

export function setCsrfCookie(
  response: Response,
  csrf: string,
  expiresAt: string,
): void {
  response.cookie(config.csrfCookieName, csrf, {
    httpOnly: false,
    secure: config.secureCookies,
    sameSite: config.cookieSameSite,
    expires: new Date(expiresAt),
    path: "/",
  });
}

export function clearAuthCookies(response: Response): void {
  const common = {
    secure: config.secureCookies,
    sameSite: config.cookieSameSite,
    path: "/",
  };
  response.clearCookie(config.sessionCookieName, { ...common, httpOnly: true });
  response.clearCookie(config.csrfCookieName, { ...common, httpOnly: false });
}
