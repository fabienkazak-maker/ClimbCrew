const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME || "climbcrew_csrf";

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
}

function getCookie(name) {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
}

async function adminFetch(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRF-Token", decodeURIComponent(getCookie(CSRF_COOKIE_NAME)));
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.message || `Erreur HTTP ${response.status}`);
  return payload;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function findAccountsCard() {
  return [...document.querySelectorAll(".card")].find((card) =>
    [...card.querySelectorAll("h2")].some((heading) => normalize(heading.textContent) === "gestion des comptes")
  );
}

function findUserCard(accountsCard, email) {
  return [...accountsCard.querySelectorAll(".subcard")].find((card) =>
    [...card.querySelectorAll(".small")].some((element) => normalize(element.textContent).includes(normalize(email)))
  );
}

function addExportButton(accountsCard) {
  const header = accountsCard.querySelector(":scope > .card-header");
  if (!header || header.querySelector(".admin-complete-export-button")) return;

  const actions = document.createElement("div");
  actions.className = "group admin-account-header-actions";

  const currentRefresh = [...header.querySelectorAll("button")].find((button) => normalize(button.textContent) === "actualiser");
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

function addAdminCheckbox(accountsCard, user) {
  const userCard = findUserCard(accountsCard, user.email);
  if (!userCard) return;

  let wrapper = userCard.querySelector(".admin-user-right-control");
  if (!wrapper) {
    wrapper = document.createElement("label");
    wrapper.className = "admin-user-right-control";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("aria-label", `Droit administrateur pour ${user.prenom} ${user.nom}`);

    const text = document.createElement("span");
    text.textContent = "Administrateur";

    wrapper.append(input, text);
    const header = userCard.querySelector(":scope > .card-header");
    (header || userCard).appendChild(wrapper);

    input.addEventListener("change", async () => {
      const nextValue = input.checked;
      input.disabled = true;
      wrapper.classList.add("is-saving");
      try {
        await adminFetch(`/admin/auth/users/${user.id}/admin`, {
          method: "POST",
          body: JSON.stringify({ isAdmin: nextValue }),
        });
        wrapper.classList.add("is-saved");
        const refresh = [...accountsCard.querySelectorAll("button")].find((button) => normalize(button.textContent) === "actualiser");
        refresh?.click();
      } catch (error) {
        input.checked = !nextValue;
        window.alert(error.message || String(error));
      } finally {
        input.disabled = false;
        wrapper.classList.remove("is-saving");
        window.setTimeout(() => wrapper.classList.remove("is-saved"), 1200);
      }
    });
  }

  const checkbox = wrapper.querySelector('input[type="checkbox"]');
  checkbox.checked = Boolean(user.isAdmin || user.role === "admin");
  wrapper.dataset.userId = String(user.id);
}

let running = false;
let lastSignature = "";

async function enhanceAccountManagement() {
  const accountsCard = findAccountsCard();
  if (!accountsCard || running) return;

  addExportButton(accountsCard);
  running = true;
  try {
    const payload = await adminFetch("/admin/auth/users");
    const users = payload.users || [];
    const signature = users.map((user) => `${user.id}:${user.role}:${user.isAdmin}:${user.status}`).join("|");
    if (signature !== lastSignature || !accountsCard.querySelector(".admin-user-right-control")) {
      users.forEach((user) => addAdminCheckbox(accountsCard, user));
      lastSignature = signature;
    }
  } catch (error) {
    console.error("ClimbCrew admin user enhancement:", error);
  } finally {
    running = false;
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

new MutationObserver(scheduleEnhancement).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
