/**
 * Version affichée dans l'interface.
 * La variable d'environnement permet au déploiement de la remplacer si nécessaire.
 */
const configuredVersion = String(import.meta.env?.VITE_APP_VERSION || "").trim();

export const APP_VERSION = configuredVersion || "260820.018";
export const APP_VERSION_PATTERN = /^\d{6}\.\d{3}$/;
