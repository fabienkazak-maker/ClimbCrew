/** Configuration réseau partagée par les composants d'administration. */
export const API_BASE = (
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

export const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME || "climbcrew_csrf";
