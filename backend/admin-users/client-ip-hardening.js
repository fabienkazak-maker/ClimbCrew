import express from "express";

const EXPRESS_CLIENT_IP_PATCH = Symbol.for("climbcrew.client-ip-patch");
const APP_CLIENT_IP_MIDDLEWARE = Symbol.for("climbcrew.client-ip-middleware");

/**
 * Réécrit les en-têtes d'adresse à partir de req.ip, donc après application de
 * la configuration Express `trust proxy`. Les anciennes fonctions du serveur
 * qui lisaient directement le premier X-Forwarded-For reçoivent ainsi une
 * valeur déjà validée par Express et ne peuvent plus être pilotées par une
 * entrée arbitraire placée à gauche de la chaîne par le client.
 */
export function trustedClientIpMiddleware(req, _res, next) {
  const trustedIp = String(req.ip || req.socket?.remoteAddress || "").trim();
  if (trustedIp) {
    req.headers["x-forwarded-for"] = trustedIp;
    req.headers["x-real-ip"] = trustedIp;
  } else {
    delete req.headers["x-forwarded-for"];
    delete req.headers["x-real-ip"];
  }
  next();
}

/**
 * Installe le middleware avant le premier app.use() déclaré dans server.js.
 * Ce mécanisme transitoire suit le même modèle de préchargement que les autres
 * adaptations historiques ; il pourra disparaître lorsque server.js sera
 * découpé en routeurs explicites.
 */
export function installClientIpHardening() {
  if (express.application[EXPRESS_CLIENT_IP_PATCH]) return;
  express.application[EXPRESS_CLIENT_IP_PATCH] = true;

  const originalUse = express.application.use;
  express.application.use = function patchedUseWithTrustedClientIp(...handlers) {
    if (!this[APP_CLIENT_IP_MIDDLEWARE]) {
      originalUse.call(this, trustedClientIpMiddleware);
      this[APP_CLIENT_IP_MIDDLEWARE] = true;
    }
    return originalUse.apply(this, handlers);
  };
}
