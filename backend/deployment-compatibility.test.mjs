import test from "node:test";
import assert from "node:assert/strict";
import {
  configureDeploymentEnvironment,
  createCrossOriginCsrfBridge,
  describeDeploymentCompatibility,
} from "./deployment-compatibility.js";

/**
 * Tests du module de compatibilité de déploiement.
 *
 * Rôle : vérifier que Render peut utiliser un frontend séparé sans désactiver
 * les protections CORS et CSRF, et que les valeurs explicites du serveur Linux
 * restent prioritaires.
 *
 * Impact visuel : aucun rendu n'est testé ici. Ces scénarios protègent toutefois
 * contre les régressions qui produiraient un écran vide ou des boutons refusés
 * par une erreur HTTP 403.
 */

/** Variables modifiées par les tests et restaurées après chaque scénario. */
const MANAGED_ENV_KEYS = [
  "RENDER",
  "CORS_ORIGIN",
  "FRONTEND_ORIGIN",
  "RENDER_FRONTEND_URL",
  "PUBLIC_URL",
  "TRUST_PROXY",
  "SECURE_COOKIES",
  "COOKIE_SAMESITE",
  "CROSS_ORIGIN_CSRF_BRIDGE",
  "CSRF_COOKIE_NAME",
];

function saveEnvironment() {
  return Object.fromEntries(MANAGED_ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnvironment(snapshot) {
  for (const key of MANAGED_ENV_KEYS) {
    const value = snapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

/** Exécute un middleware Express simplifié et attend l'appel de next(). */
function runMiddleware(middleware, req) {
  return new Promise((resolve, reject) => {
    try {
      middleware(req, {}, resolve);
    } catch (error) {
      reject(error);
    }
  });
}

test("fusionne les origines Render et Linux sans doublon", () => {
  const previousEnvironment = saveEnvironment();
  try {
    process.env.RENDER = "true";
    process.env.CORS_ORIGIN = "https://climbcrew.onrender.com";
    process.env.RENDER_FRONTEND_URL = "https://climbcrew.onrender.com/";
    process.env.PUBLIC_URL = "https://climbcrew.dip-tcs.com";

    configureDeploymentEnvironment();

    assert.equal(
      process.env.CORS_ORIGIN,
      "https://climbcrew.onrender.com,https://climbcrew.dip-tcs.com,http://localhost:5173"
    );
    assert.equal(process.env.TRUST_PROXY, "1");
    assert.equal(process.env.SECURE_COOKIES, "true");
    assert.equal(process.env.COOKIE_SAMESITE, "none");
  } finally {
    restoreEnvironment(previousEnvironment);
  }
});

test("conserve les valeurs de cookies explicitement définies sur Linux", () => {
  const previousEnvironment = saveEnvironment();
  try {
    process.env.RENDER = "true";
    process.env.SECURE_COOKIES = "false";
    process.env.COOKIE_SAMESITE = "lax";

    configureDeploymentEnvironment();

    assert.equal(process.env.SECURE_COOKIES, "false");
    assert.equal(process.env.COOKIE_SAMESITE, "lax");
  } finally {
    restoreEnvironment(previousEnvironment);
  }
});

test("complète le jeton CSRF uniquement pour une origine autorisée", async () => {
  const previousEnvironment = saveEnvironment();
  try {
    process.env.RENDER = "true";
    process.env.CORS_ORIGIN = "https://climbcrew.onrender.com";
    process.env.CSRF_COOKIE_NAME = "climbcrew_csrf";

    const middleware = createCrossOriginCsrfBridge();
    const req = {
      method: "POST",
      headers: {
        origin: "https://climbcrew.onrender.com",
        cookie: "climbcrew_session=session-secret; climbcrew_csrf=csrf-secret",
      },
    };

    await runMiddleware(middleware, req);
    assert.equal(req.headers["x-csrf-token"], "csrf-secret");
  } finally {
    restoreEnvironment(previousEnvironment);
  }
});

test("ne complète jamais le jeton pour une origine non autorisée", async () => {
  const previousEnvironment = saveEnvironment();
  try {
    process.env.RENDER = "true";
    process.env.CORS_ORIGIN = "https://climbcrew.onrender.com";

    const middleware = createCrossOriginCsrfBridge();
    const req = {
      method: "DELETE",
      headers: {
        origin: "https://site-malveillant.example",
        cookie: "climbcrew_csrf=csrf-secret",
      },
    };

    await runMiddleware(middleware, req);
    assert.equal(req.headers["x-csrf-token"], undefined);
  } finally {
    restoreEnvironment(previousEnvironment);
  }
});

test("préserve un jeton CSRF déjà envoyé par le frontend Linux", async () => {
  const previousEnvironment = saveEnvironment();
  try {
    process.env.RENDER = "true";
    process.env.CORS_ORIGIN = "https://climbcrew.dip-tcs.com";

    const middleware = createCrossOriginCsrfBridge();
    const req = {
      method: "PUT",
      headers: {
        origin: "https://climbcrew.dip-tcs.com",
        cookie: "climbcrew_csrf=cookie-token",
        "x-csrf-token": "frontend-token",
      },
    };

    await runMiddleware(middleware, req);
    assert.equal(req.headers["x-csrf-token"], "frontend-token");
  } finally {
    restoreEnvironment(previousEnvironment);
  }
});

test("le diagnostic n'expose que la plateforme et les origines publiques", () => {
  const previousEnvironment = saveEnvironment();
  try {
    process.env.RENDER = "true";
    process.env.CORS_ORIGIN = "https://climbcrew.onrender.com";

    const diagnostic = describeDeploymentCompatibility();
    assert.deepEqual(diagnostic, {
      platform: "render",
      allowedOrigins: ["https://climbcrew.onrender.com"],
      crossOriginCsrfBridgeEnabled: true,
    });
  } finally {
    restoreEnvironment(previousEnvironment);
  }
});
