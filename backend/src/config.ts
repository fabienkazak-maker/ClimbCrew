import type { CookieOptions } from "express";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is missing`);
  return value;
}

function integer(name: string, fallback: number, minimum = 1): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${name} is invalid`);
  }
  return value;
}

function boolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} is invalid`);
}

function sameSite(): CookieOptions["sameSite"] {
  const value = process.env.COOKIE_SAMESITE?.toLowerCase() ?? "lax";
  if (value === "lax" || value === "strict" || value === "none") return value;
  throw new Error("COOKIE_SAMESITE is invalid");
}

const production = process.env.NODE_ENV === "production";

export const config = {
  databaseUrl: required("DATABASE_URL"),
  port: integer("PORT", 3000),
  trustProxy: integer("TRUST_PROXY", 1),
  corsOrigins: (
    process.env.CORS_ORIGIN ??
    process.env.FRONTEND_ORIGIN ??
    "http://localhost:5173"
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
  setupToken: process.env.SETUP_TOKEN?.trim() ?? "",
  firstAdminEmail: process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase() ?? "",
  firstAdminPassword: process.env.FIRST_ADMIN_PASSWORD ?? "",
  bcryptRounds: integer("BCRYPT_ROUNDS", production ? 12 : 10, 10),
  sessionDurationMs: integer("SESSION_DURATION_DAYS", 7) * 24 * 60 * 60 * 1000,
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "climbcrew_session",
  csrfCookieName: process.env.CSRF_COOKIE_NAME ?? "climbcrew_csrf",
  cookieSameSite: sameSite(),
  secureCookies: boolean("SECURE_COOKIES", production),
  maxJsonBodySize: process.env.MAX_JSON_BODY_SIZE ?? "512kb",
  writeLimitPerMinute: integer("WRITE_RATE_LIMIT_PER_MINUTE", 120),
  production,
  postgresTls: boolean("PG_SSL", false),
};
