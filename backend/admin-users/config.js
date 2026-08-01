/**
 * Configuration centralisée des évolutions liées aux comptes utilisateurs.
 * Garder les noms de cookies identiques à ceux du serveur principal garantit
 * la compatibilité avec les sessions déjà ouvertes.
 */
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "climbcrew_session";
export const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || "climbcrew_csrf";
export const BCRYPT_ROUNDS = Number(
  process.env.BCRYPT_ROUNDS || (process.env.NODE_ENV === "production" ? 12 : 10)
);
export const INSTALL_FLAG = Symbol.for("climbcrew.adminUserEnhancements.installed");
