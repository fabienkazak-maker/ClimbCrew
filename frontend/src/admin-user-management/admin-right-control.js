import { adminFetch } from "./api-client.js";
import { findUserCard, normalizeText } from "./dom-utils.js";

/**
 * Ajoute la case Administrateur sur une carte utilisateur.
 * Cette fonction n'est appelée que dans l'onglet déjà protégé par React.
 */
export function addAdminCheckbox(accountsCard, user) {
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

        const refresh = [...accountsCard.querySelectorAll("button")].find(
          (button) => normalizeText(button.textContent) === "actualiser"
        );
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
