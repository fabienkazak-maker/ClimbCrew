import { adminFetch } from "./api-client.js";
import { downloadJson } from "./download.js";
import { normalizeText } from "./dom-utils.js";

/** Ajoute le bouton d'export global dans l'en-tête de la gestion des comptes. */
export function addExportButton(accountsCard) {
  const header = accountsCard.querySelector(":scope > .card-header");
  if (!header || header.querySelector(".admin-complete-export-button")) return;

  const actions = document.createElement("div");
  actions.className = "group admin-account-header-actions";

  const currentRefresh = [...header.querySelectorAll("button")].find(
    (button) => normalizeText(button.textContent) === "actualiser"
  );
  if (currentRefresh) actions.appendChild(currentRefresh);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "secondary admin-complete-export-button";
  button.textContent = "Exporter toutes les données";

  button.addEventListener("click", async () => {
    const initialText = button.textContent;
    button.disabled = true;
    button.textContent = "Export en cours…";

    try {
      const payload = await adminFetch("/admin/export-data");
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(`climbcrew-export-complet-${date}.json`, payload.data || payload);
      button.textContent = "Export terminé";
    } catch (error) {
      button.textContent = "Échec de l’export";
      window.alert(error.message || String(error));
    } finally {
      window.setTimeout(() => {
        button.disabled = false;
        button.textContent = initialText;
      }, 1500);
    }
  });

  actions.appendChild(button);
  header.appendChild(actions);
}
