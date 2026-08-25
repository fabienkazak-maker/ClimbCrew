export function normalizeParticipantFieldLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Seuls les champs dont le rôle est de choisir le grimpeur concerné sont
// préremplis. Les champs d'action (inscription, référent, encadrant) restent
// volontairement neutres afin d'éviter toute action automatique.
export function shouldDefaultConnectedParticipant(label) {
  const normalized = normalizeParticipantFieldLabel(label);
  return normalized === "participant"
    || normalized === "grimpeur"
    || normalized === "grimpeuse"
    || normalized === "participant / grimpeur";
}

// Conserve une éventuelle option vide en première position puis place le
// grimpeur connecté immédiatement après. Le tri relatif des autres noms ne
// change pas.
export function prioritizeConnectedParticipantValues(values, participantId) {
  const requestedId = String(participantId || "");
  const source = values.map((value) => String(value));
  if (!requestedId || !source.includes(requestedId)) return source;

  const withoutConnected = source.filter((value) => value !== requestedId);
  const emptyIndex = withoutConnected.indexOf("");

  if (emptyIndex >= 0) {
    return [
      ...withoutConnected.slice(0, emptyIndex + 1),
      requestedId,
      ...withoutConnected.slice(emptyIndex + 1),
    ];
  }

  return [requestedId, ...withoutConnected];
}
