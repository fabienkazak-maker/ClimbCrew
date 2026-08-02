import crypto from "node:crypto";

/**
 * Compatibilité des environnements de déploiement.
 *
 * Ce fichier est chargé avant le serveur principal. Il prépare les variables
 * d'environnement communes à Render et au serveur Linux sans imposer de
 * valeurs lorsque l'administrateur les a déjà définies.
 *
 * Impact visuel : aucun style n'est modifié. En revanche, ces réglages évitent
 * l'écran noir ou le retour permanent à la connexion lorsque le frontend ne
 * parvient pas à dialoguer avec l'API.
 */

/** Méthodes HTTP qui ne modifient pas les données et ne nécessitent pas de jeton CSRF. */
const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Supprime les espaces et le slash final afin de comparer deux origines de façon fiable. */
function normalizeOrigin(value = "") {
  return String(value || "").trim().replace(/\/$/, "");
}

/**
 * Transforme une ou plusieurs listes séparées par des virgules en liste unique.
 * Les doublons sont retirés pour produire une configuration CORS lisible dans les logs.
 */
function collectOrigins(...values) {
  return [...new Set(
    values
      .flatMap((value) => String(value || "").split(","))
      .map(normalizeOrigin)
      .filter(Boolean)
  )];
}

/**
 * Décode une valeur de cookie sans faire tomber le serveur si un navigateur
 * transmet une séquence d'échappement incorrecte.
 */
function safeDecodeCookie(value = "") {
  try {
    return decodeURIComponent(value);
  } catch {
    return String(value || "");
  }
}

/** Convertit l'en-tête Cookie en objet clé/valeur. */
function parseCookieHeader(header = "") {
  return Object.fromEntries(
    String(header || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator < 0) return [part, ""];
        return [part.slice(0, separator), safeDecodeCookie(part.slice(separator + 1))];
      })
  );
}

/** Comparaison résistante aux attaques temporelles pour les jetons de sécurité. */
function constantTimeEqual(leftValue, rightValue) {
  const left = Buffer.from(String(leftValue || ""));
  const right = Buffer.from(String(rightValue || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/** Indique si le processus est exécuté par la plateforme Render. */
function isRenderDeployment() {
  return String(process.env.RENDER || "").toLowerCase() === "true";
}

/**
 * Prépare les variables lues ensuite par server.js.
 *
 * - Render fournit l'URL du frontend par RENDER_FRONTEND_URL ;
 * - le serveur Linux utilise généralement PUBLIC_URL ou FRONTEND_ORIGIN ;
 * - CORS_ORIGIN reste prioritaire lorsqu'il est défini manuellement ;
 * - les valeurs de cookies spécifiques à Render ne remplacent jamais une
 *   configuration explicite du serveur Linux.
 */
export function configureDeploymentEnvironment() {
  const allowedOrigins = collectOrigins(
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_ORIGIN,
    process.env.RENDER_FRONTEND_URL,
    process.env.PUBLIC_URL,
    "http://localhost:5173"
  );

  if (allowedOrigins.length) {
    process.env.CORS_ORIGIN = allowedOrigins.join(",");
  }

  if (isRenderDeployment()) {
    process.env.TRUST_PROXY ||= "1";
    process.env.SECURE_COOKIES ||= "true";
    process.env.COOKIE_SAMESITE ||= "none";
  }
}

/**
 * Retourne les origines autorisées après normalisation.
 * Cette liste est recalculée à la création du middleware afin de prendre en
 * compte la configuration préparée juste avant le chargement du serveur.
 */
function getAllowedOrigins() {
  return new Set(collectOrigins(
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_ORIGIN,
    process.env.RENDER_FRONTEND_URL,
    process.env.PUBLIC_URL
  ));
}

/**
 * Crée un middleware de compatibilité CSRF pour les déploiements multi-domaines.
 *
 * Le frontend Render et l'API Render utilisent deux origines différentes. Le
 * navigateur envoie bien les cookies de session avec `credentials: include`,
 * mais le JavaScript du frontend ne peut pas lire le cookie CSRF appartenant au
 * domaine de l'API. Sans adaptation, les écritures sont refusées avec une erreur
 * 403 alors que la connexion paraît réussie.
 *
 * Sécurité : le middleware ne recopie le cookie dans l'en-tête interne que si :
 * - la méthode modifie les données ;
 * - aucun en-tête CSRF n'a déjà été fourni ;
 * - l'en-tête Origin appartient exactement à la liste CORS autorisée ;
 * - le cookie CSRF existe.
 *
 * Le contrôle historique cookie/en-tête reste ensuite exécuté par server.js.
 * Une origine non autorisée ne bénéficie donc jamais de cette compatibilité.
 */
export function createCrossOriginCsrfBridge() {
  const enabled = isRenderDeployment()
    || String(process.env.CROSS_ORIGIN_CSRF_BRIDGE || "").toLowerCase() === "true";
  const allowedOrigins = getAllowedOrigins();
  const csrfCookieName = process.env.CSRF_COOKIE_NAME || "climbcrew_csrf";

  return function crossOriginCsrfBridge(req, _res, next) {
    if (!enabled || SAFE_HTTP_METHODS.has(String(req.method || "GET").toUpperCase())) {
      return next();
    }

    if (req.headers["x-csrf-token"]) {
      return next();
    }

    const requestOrigin = normalizeOrigin(req.headers.origin);
    if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
      return next();
    }

    const csrfCookie = parseCookieHeader(req.headers.cookie)[csrfCookieName];
    if (csrfCookie) {
      // L'en-tête est ajouté uniquement dans la requête serveur interne.
      // Il n'est jamais exposé dans la réponse HTTP ni dans les logs.
      req.headers["x-csrf-token"] = csrfCookie;
    }

    return next();
  };
}

/** Export réservé aux tests et aux diagnostics sans exposer de secret. */
export function describeDeploymentCompatibility() {
  return {
    platform: isRenderDeployment() ? "render" : "linux-or-local",
    allowedOrigins: [...getAllowedOrigins()],
    crossOriginCsrfBridgeEnabled: isRenderDeployment()
      || String(process.env.CROSS_ORIGIN_CSRF_BRIDGE || "").toLowerCase() === "true",
  };
}
