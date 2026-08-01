/** Normalise un texte pour fiabiliser la recherche dans le DOM React existant. */
export function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
}

/** Localise la carte réservée à la gestion des comptes. */
export function findAccountsCard() {
  return [...document.querySelectorAll(".card")].find((card) =>
    [...card.querySelectorAll("h2")].some(
      (heading) => normalizeText(heading.textContent) === "gestion des comptes"
    )
  );
}

/** Localise la carte d'un utilisateur à partir de son adresse de connexion. */
export function findUserCard(accountsCard, email) {
  return [...accountsCard.querySelectorAll(".subcard")].find((card) =>
    [...card.querySelectorAll(".small")].some((element) =>
      normalizeText(element.textContent).includes(normalizeText(email))
    )
  );
}
