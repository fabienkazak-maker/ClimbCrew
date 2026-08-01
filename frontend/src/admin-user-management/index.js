import { adminFetch } from "./api-client.js";
import { addAdminCheckbox } from "./admin-right-control.js";
import { findAccountsCard } from "./dom-utils.js";
import { addExportButton } from "./export-control.js";

let requestRunning = false;
let lastSignature = "";

/**
 * Enrichit l'écran existant sans dupliquer sa logique React.
 * La signature évite de reconstruire les contrôles lorsque les données n'ont pas changé.
 */
async function enhanceAccountManagement() {
  const accountsCard = findAccountsCard();
  if (!accountsCard || requestRunning) return;

  addExportButton(accountsCard);
  requestRunning = true;

  try {
    const payload = await adminFetch("/admin/auth/users");
    const users = payload.users || [];
    const signature = users
      .map((user) => `${user.id}:${user.role}:${user.isAdmin}:${user.status}`)
      .join("|");

    if (signature !== lastSignature || !accountsCard.querySelector(".admin-user-right-control")) {
      users.forEach((user) => addAdminCheckbox(accountsCard, user));
      lastSignature = signature;
    }
  } catch (error) {
    console.error("Enrichissement de la gestion des comptes :", error);
  } finally {
    requestRunning = false;
  }
}

let scheduled = false;
function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;

  requestAnimationFrame(() => {
    scheduled = false;
    enhanceAccountManagement();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleEnhancement, { once: true });
} else {
  scheduleEnhancement();
}

// React remplace régulièrement des nœuds : l'observateur réapplique seulement ce qui manque.
new MutationObserver(scheduleEnhancement).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
