/**
 * Configuration centralisée des évolutions liées aux comptes utilisateurs.
 *
 * Rôle : partager les mêmes noms de cookies, niveaux de sécurité et indicateurs
 * d'installation entre les modules séparés du backend.
 *
 * Impact visuel : aucun style n'est produit ici. Une incohérence sur ces valeurs
 * se traduirait cependant par une connexion qui semble fonctionner puis par des
 * erreurs 401/403 dans les écrans Administration et Gestion des comptes.
 */

/** Nom du cookie HttpOnly qui contient le jeton de session utilisateur. */
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "climbcrew_session";

/** Nom du cookie lisible utilisé pour la protection contre les requêtes CSRF. */
export const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || "climbcrew_csrf";

/**
 * Coût de hachage bcrypt.
 * La production utilise une valeur plus élevée afin de ralentir les attaques
 * par essais successifs, au prix d'un temps de connexion légèrement supérieur.
 */
export const BCRYPT_ROUNDS = Number(
  process.env.BCRYPT_ROUNDS || (process.env.NODE_ENV === "production" ? 12 : 10)
);

/** Durée de validité, en millisecondes, d'un code de réinitialisation. */
export const RESET_TOKEN_DURATION_MS = 1000 * 60 * Number(
  process.env.RESET_TOKEN_DURATION_MINUTES || 60
);

/** Empêche l'ajout plusieurs fois des routes complémentaires sur une même application. */
export const INSTALL_FLAG = Symbol.for("climbcrew.adminUserEnhancements.installed");

/** Empêche l'installation répétée du middleware de compatibilité CSRF. */
export const CSRF_BRIDGE_FLAG = Symbol.for("climbcrew.crossOriginCsrfBridge.installed");

/** Empêche de modifier plusieurs fois les méthodes du prototype Express. */
export const EXPRESS_PATCH_FLAG = Symbol.for("climbcrew.expressIntegration.patched");
