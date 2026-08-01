/**
 * Rend les erreurs HTTP de l'API lisibles par l'interface.
 *
 * Le composant principal lit le corps des réponses en texte. Lorsque l'API
 * renvoie du JSON comme {"error":"Identifiants invalides"}, cette couche
 * conserve le statut HTTP mais remplace le corps par un message utilisateur.
 */
const STATUS_MESSAGES = {
  400: "La demande contient des informations invalides.",
  401: "Email ou mot de passe incorrect.",
  403: "Vous n’avez pas l’autorisation d’effectuer cette action.",
  404: "Le service demandé est introuvable.",
  409: "Cette opération entre en conflit avec des données existantes.",
  422: "Certaines informations saisies sont invalides.",
  429: "Trop de tentatives. Réessayez dans quelques instants.",
};

const KNOWN_MESSAGES = new Map([
  ["identifiants invalides", "Email ou mot de passe incorrect."],
  ["compte pending", "Votre demande d’accès est en attente d’approbation."],
  ["compte revoked", "Votre accès a été désactivé. Contactez un administrateur."],
  ["authentification requise", "Votre session a expiré. Reconnectez-vous."],
  ["session invalide ou compte non actif", "Votre session n’est plus valide. Reconnectez-vous."],
]);

function firstMessage(value, depth = 0) {
  if (depth > 3 || value == null) return "";
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    return value.map((item) => firstMessage(item, depth + 1)).find(Boolean) || "";
  }

  if (typeof value === "object") {
    for (const key of ["error", "message", "detail", "title", "errors"]) {
      const message = firstMessage(value[key], depth + 1);
      if (message) return message;
    }

    for (const child of Object.values(value)) {
      const message = firstMessage(child, depth + 1);
      if (message) return message;
    }
  }

  return "";
}

function messageFromBody(rawBody) {
  const body = String(rawBody || "").trim();
  if (!body) return "";

  try {
    return firstMessage(JSON.parse(body));
  } catch {
    const looksLikeHtml = /^(?:<!doctype\s+html|<html|<body)/i.test(body);
    return !looksLikeHtml && body.length <= 500 ? body : "";
  }
}

function normalizeKnownMessage(message) {
  const compact = String(message || "").trim().replace(/\s+/g, " ");
  if (!compact) return "";
  return KNOWN_MESSAGES.get(compact.toLocaleLowerCase("fr")) || compact;
}

function fallbackMessage(status) {
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return "Le serveur a rencontré une erreur. Réessayez plus tard.";
  return "Une erreur est survenue. Réessayez.";
}

async function readableErrorResponse(response) {
  let rawBody = "";

  try {
    rawBody = await response.clone().text();
  } catch {
    // Une réponse sans corps reste gérée grâce au statut HTTP.
  }

  const message = normalizeKnownMessage(messageFromBody(rawBody)) || fallbackMessage(response.status);
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    if (!["content-length", "content-encoding"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.set("content-type", "text/plain; charset=utf-8");

  return new Response(message, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

if (typeof window !== "undefined" && typeof window.fetch === "function" && !window.__climbCrewReadableErrors) {
  const originalFetch = window.fetch.bind(window);
  window.__climbCrewReadableErrors = true;

  window.fetch = async (...args) => {
    let response;

    try {
      response = await originalFetch(...args);
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      const networkError = new Error("Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.");
      networkError.cause = error;
      throw networkError;
    }

    return response.ok ? response : readableErrorResponse(response);
  };
}
