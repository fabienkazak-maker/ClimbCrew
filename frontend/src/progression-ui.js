let scheduled = false;

function updateProgressionUi() {
  document.querySelectorAll(".card-header h3").forEach((heading) => {
    if (String(heading.textContent || "").trim() === "Saisir une réalisation") {
      heading.classList.add("progression-entry-heading-hidden");
      heading.setAttribute("aria-hidden", "true");
    }
  });

  document
    .querySelectorAll(".realisation-delete-button, .progression-realisation-remove")
    .forEach((button) => {
      const details = button.closest("details.editable-realisation-card");
      const summary = button.closest("summary.realisation-summary");
      const actionGroup = button.closest(".group");

      if (details) details.classList.add("progression-realisation-card");
      if (summary) summary.classList.add("progression-realisation-summary");
      if (actionGroup) actionGroup.classList.add("progression-realisation-actions");

      // Même bouton que dans la liste des inscrits : une croix compacte et neutre.
      button.classList.remove("danger", "realisation-delete-button");
      button.classList.add("remove-button", "progression-realisation-remove");
      button.textContent = "×";
      button.setAttribute("title", "Supprimer cette réalisation");
      button.setAttribute("aria-label", "Supprimer cette réalisation");
    });
}

function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;

  requestAnimationFrame(() => {
    scheduled = false;
    updateProgressionUi();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleUpdate, { once: true });
} else {
  scheduleUpdate();
}

new MutationObserver(scheduleUpdate).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
