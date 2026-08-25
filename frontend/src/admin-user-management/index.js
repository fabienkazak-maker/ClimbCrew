import { adminFetch } from "./api-client.js";
import { addAdminCheckbox } from "./admin-right-control.js";
import { findAccountsCard } from "./dom-utils.js";
import { addExportButton } from "./export-control.js";

let requestRunning = false;
let lastSignature = "";

function accountStatusForDetails(details, users) {
  const content = String(details?.textContent || "").toLowerCase();
  const user = users.find((item) => {
    const email = String(item?.email || "").trim().toLowerCase();
    return email && content.includes(email);
  });
  return String(user?.status || "").toLowerCase();
}

/**
 * Les demandes qui attendent une validation administrateur sont toujours
 * présentées en premier et restent dépliées afin que l'action à effectuer
 * soit immédiatement visible.
 */
function prioritizeAccountsNeedingAction(accountsCard, users) {
  const details = [...accountsCard.querySelectorAll(".account-admin-details")];
  if (details.length === 0) return;

  const pending = [];
  const others = [];

  details.forEach((item) => {
    const status = accountStatusForDetails(item, users);
    const needsAction = status === "pending";

    item.dataset.accountStatus = status || "unknown";
    item.classList.toggle("account-needs-action", needsAction);

    if (needsAction) {
      item.open = true;
      pending.push(item);
    } else {
      others.push(item);
    }
  });

  const parent = details[0]?.parentElement;
  if (!parent) return;

  const desiredOrder = [...pending, ...others];
  const currentOrder = [...parent.querySelectorAll(":scope > .account-admin-details")];
  const alreadyOrdered = desiredOrder.every((item, index) => currentOrder[index] === item);

  if (!alreadyOrdered) {
    desiredOrder.forEach((item) => parent.appendChild(item));
  }
}

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

    prioritizeAccountsNeedingAction(accountsCard, users);
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

// Une demande en attente doit rester ouverte : un clic sur son résumé ne la replie pas.
document.addEventListener("click", (event) => {
  const summary = event.target.closest?.(".account-needs-action > summary");
  const details = summary?.closest?.(".account-needs-action");
  if (details?.open) event.preventDefault();
});

// React remplace régulièrement des nœuds : l'observateur réapplique seulement ce qui manque.
new MutationObserver(scheduleEnhancement).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
