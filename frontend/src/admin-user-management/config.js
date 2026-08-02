/**
 * Configuration réseau partagée par les composants d'administration.
 *
 * Rôle : fournir une seule adresse d'API aux écrans Gestion des comptes,
 * Administration et Export afin d'éviter que chaque composant construise sa
 * propre URL.
 *
 * Impact visuel : aucune couleur ou mise en page n'est modifiée ici. Une URL
 * incorrecte empêche toutefois les listes et boutons d'administration de
 * charger leurs données, ce qui peut donner l'impression d'un écran vide.
 */

/**
 * VITE_API_URL est injectée au moment de la compilation :
 * - sur Linux, sa valeur est /api et le reverse proxy conserve le même domaine ;
 * - sur Render, render.yaml la construit avec le vrai sous-domaine de l'API ;
 * - VITE_API_BASE_URL reste accepté pour les anciennes configurations.
 *
 * Le slash final est supprimé pour éviter des URL contenant //auth ou //admin.
 */
export const API_BASE = (
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

/**
 * Nom du cookie CSRF attendu par le frontend.
 * Il doit rester identique à CSRF_COOKIE_NAME côté backend. Le déploiement
 * Render utilise en complément un pont serveur sécurisé, car le JavaScript ne
 * peut pas lire le cookie appartenant à un autre sous-domaine.
 */
export const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME || "climbcrew_csrf";
