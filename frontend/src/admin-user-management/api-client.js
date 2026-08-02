import { API_BASE, CSRF_COOKIE_NAME } from "./config.js";

/**
 * Client HTTP des fonctions d'administration.
 *
 * Rôle : centraliser l'envoi des cookies de session, du jeton CSRF, du contenu
 * JSON et la traduction des erreurs HTTP en messages exploitables par l'interface.
 *
 * Impact visuel : les composants restent inchangés. Les erreurs levées ici sont
 * affichées par les écrans concernés au lieu de laisser un bouton sans réaction.
 */

/**
 * Lit un cookie accessible au JavaScript du domaine courant.
 *
 * Sur le serveur Linux, frontend et API partagent le même domaine : le cookie
 * CSRF est donc lisible normalement. Sur Render, le cookie appartient au domaine
 * de l'API ; il peut être absent de document.cookie et le pont sécurisé du
 * backend complète alors l'en-tête uniquement pour une origine CORS autorisée.
 */
function getCookie(name) {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
}

/**
 * Envoie une requête vers une route réservée aux administrateurs.
 *
 * - ajoute Content-Type uniquement lorsqu'un corps est présent ;
 * - ajoute le jeton CSRF pour les méthodes qui modifient des données ;
 * - transmet toujours les cookies avec credentials: include ;
 * - convertit une réponse d'erreur en exception contenant le message backend.
 */
export async function adminFetch(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  // Les corps envoyés par ces écrans sont au format JSON. Ne pas imposer cet
  // en-tête en l'absence de corps évite des requêtes CORS préliminaires inutiles.
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Les lectures sont sans effet de bord. Les créations, modifications et
  // suppressions doivent en revanche présenter le jeton CSRF lorsqu'il est
  // accessible depuis le domaine du frontend.
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = getCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      headers.set("X-CSRF-Token", decodeURIComponent(csrfToken));
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    // Indispensable pour envoyer le cookie HttpOnly de session au backend.
    credentials: "include",
  });

  // Certaines erreurs de proxy ne contiennent pas de JSON. Le repli sur un
  // objet vide permet de produire tout de même un message HTTP compréhensible.
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Erreur HTTP ${response.status}`);
  }

  return payload;
}
