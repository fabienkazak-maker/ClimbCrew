import crypto from "node:crypto";
import type { RequestHandler } from "express";
import { config } from "../config";

export const securityHeaders: RequestHandler = (_request, response, next) => {
  response.setHeader("X-Request-Id", crypto.randomUUID());
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.setHeader("Cross-Origin-Resource-Policy", "same-site");
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );
  response.setHeader("Cache-Control", "no-store");
  if (config.secureCookies || config.production) {
    response.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  next();
};

export const normalizeApiPath: RequestHandler = (request, _response, next) => {
  const queryIndex = request.url.indexOf("?");
  const path =
    queryIndex === -1 ? request.url : request.url.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : request.url.slice(queryIndex);
  let normalized = path;
  for (const prefix of ["/api", "/v1"]) {
    if (normalized === prefix) normalized = "/";
    else if (normalized.startsWith(`${prefix}/`))
      normalized = normalized.slice(prefix.length);
  }
  request.url = `${normalized.startsWith("/") ? normalized : `/${normalized}`}${query}`;
  next();
};
