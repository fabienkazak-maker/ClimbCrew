import { USE_API } from "./lib/api.js";

/**
 * Données métier historiques autrefois persistées dans le navigateur.
 * En mode API, PostgreSQL est l'unique source de vérité : ces données ne doivent
 * ni être relues ni rester présentes sur un poste partagé.
 */
export const LEGACY_BUSINESS_STORAGE_KEY = "climbcrew_local_data_v2";

const STORAGE_POLICY_FLAG = Symbol.for("climbcrew.business-storage-policy");

export function installBusinessStoragePolicy() {
  if (!USE_API || typeof window === "undefined" || typeof Storage === "undefined") return;
  if (Storage.prototype[STORAGE_POLICY_FLAG]) return;

  try {
    window.localStorage.removeItem(LEGACY_BUSINESS_STORAGE_KEY);
  } catch (error) {
    console.warn("Nettoyage du cache métier local impossible", error);
  }

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function climbcrewSetItem(key, value) {
    if (String(key) === LEGACY_BUSINESS_STORAGE_KEY) return undefined;
    return originalSetItem.call(this, key, value);
  };

  Storage.prototype[STORAGE_POLICY_FLAG] = true;
}

installBusinessStoragePolicy();
