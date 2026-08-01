const PASSWORD_POLICY_TEXT = "Au moins 12 caractères, avec au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial.";

function normalizedText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
}

function findLabel(card, predicate) {
  return [...card.querySelectorAll("label")].find((label) => predicate(normalizedText(label.textContent), label));
}

function enhancePasswordPolicy(card) {
  const label = findLabel(card, (text) => text.includes("politique mot de passe") || text.includes("règles du mot de passe"));
  if (!label) return false;

  if (label.textContent !== "Règles du mot de passe") {
    label.textContent = "Règles du mot de passe";
  }

  const container = label.parentElement;
  const input = container?.querySelector('input[readonly]');
  if (!container || !input) return false;

  input.classList.add("issue13-password-policy-input");
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;

  let message = container.querySelector(".issue13-password-policy-text");
  if (!message) {
    message = document.createElement("p");
    message.className = "issue13-password-policy-text";
    container.appendChild(message);
  }
  if (message.textContent !== PASSWORD_POLICY_TEXT) {
    message.textContent = PASSWORD_POLICY_TEXT;
  }
  return true;
}

function enhanceConsent(card) {
  const label = findLabel(card, (text, node) => node.querySelector('input[type="checkbox"]') && text.includes("j’accepte"));
  if (!label) return;

  const checkbox = label.querySelector('input[type="checkbox"]');
  if (!checkbox) return;

  label.classList.add("issue13-consent-label");

  let copy = label.querySelector(".issue13-consent-copy");
  if (!copy) {
    for (const child of [...label.childNodes]) {
      if (child !== checkbox) child.remove();
    }

    copy = document.createElement("span");
    copy.className = "issue13-consent-copy";
    copy.textContent = "J’accepte les conditions d’utilisation";

    const link = document.createElement("a");
    link.className = "issue13-consent-link";
    link.href = "/rgpd.html";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Consulter le texte RGPD";
    link.addEventListener("click", (event) => event.stopPropagation());

    copy.appendChild(document.createTextNode(" — "));
    copy.appendChild(link);
    label.appendChild(copy);
  }
}

function enhanceButtons(card, requestFormVisible) {
  const submitButton = card.querySelector(".auth-submit-row button");
  if (requestFormVisible && submitButton && submitButton.textContent !== "Demander la création d’un compte") {
    submitButton.textContent = "Demander la création d’un compte";
  }

  const switchButtons = [...card.querySelectorAll(".auth-switcher button")];
  const requestSwitchButton = switchButtons.find((button) => {
    const text = normalizedText(button.textContent);
    return text.includes("demander un accès") || text.includes("création d’un compte");
  });
  const forgotPasswordButton = switchButtons.find((button) => normalizedText(button.textContent).includes("mot de passe perdu"));

  if (requestSwitchButton) {
    requestSwitchButton.classList.toggle("issue13-hidden", requestFormVisible);
    requestSwitchButton.classList.remove("secondary");

    if (!requestFormVisible && requestSwitchButton.textContent !== "Demander la création d’un compte") {
      requestSwitchButton.textContent = "Demander la création d’un compte";
    }
  }

  if (forgotPasswordButton) {
    forgotPasswordButton.classList.add("issue13-hidden");
    forgotPasswordButton.setAttribute("aria-hidden", "true");
    forgotPasswordButton.tabIndex = -1;
  }
}

function hideVersion(card) {
  for (const element of card.querySelectorAll(".small")) {
    if (normalizedText(element.textContent).startsWith("version ")) {
      element.classList.add("issue13-hidden");
    }
  }
}

function enhanceAccessPage() {
  const card = document.querySelector(".auth-card");
  if (!card) return;

  const requestFormVisible = enhancePasswordPolicy(card);
  if (requestFormVisible) enhanceConsent(card);
  enhanceButtons(card, requestFormVisible);
  hideVersion(card);
}

let scheduled = false;
function scheduleEnhancement() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    enhanceAccessPage();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleEnhancement, { once: true });
} else {
  scheduleEnhancement();
}

const root = document.documentElement;
if (root) {
  new MutationObserver(scheduleEnhancement).observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}
