import express from "express";

const EXPRESS_COOKIE_PATCH = Symbol.for("climbcrew.cookie-hardening-patch");
const APP_COOKIE_MIDDLEWARE = Symbol.for("climbcrew.cookie-hardening-middleware");

/**
 * Vérifie que chaque valeur de cookie peut être décodée par les anciens parseurs
 * de server.js. Une valeur percent-encodée invalide ne doit jamais provoquer une
 * exception avant l'authentification.
 *
 * Si un seul cookie est malformé, l'en-tête complet est retiré : la requête sera
 * simplement considérée comme non authentifiée. Aucun cookie fourni par le
 * client n'est réécrit ou interprété partiellement.
 */
export function sanitizeMalformedCookieHeader(req, _res, next) {
  const header = String(req?.headers?.cookie || "");
  if (!header) return next();

  try {
    for (const part of header.split(";")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const separator = trimmed.indexOf("=");
      if (separator < 0) continue;
      decodeURIComponent(trimmed.slice(separator + 1));
    }
  } catch {
    delete req.headers.cookie;
  }

  return next();
}

/** Installe le filtre avant le premier middleware déclaré par server.js. */
export function installCookieHardening() {
  if (express.application[EXPRESS_COOKIE_PATCH]) return;
  express.application[EXPRESS_COOKIE_PATCH] = true;

  const originalUse = express.application.use;
  express.application.use = function patchedUseWithCookieHardening(...handlers) {
    if (!this[APP_COOKIE_MIDDLEWARE]) {
      originalUse.call(this, sanitizeMalformedCookieHeader);
      this[APP_COOKIE_MIDDLEWARE] = true;
    }
    return originalUse.apply(this, handlers);
  };
}
