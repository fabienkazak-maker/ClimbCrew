export const MAX_SESSION_PARTICIPANTS = 18;

function normalizeSessionPersonId(value) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

export function getSessionAttendanceIds(session) {
  const participantIds = (session?.participantIds || []).map(String);
  const encadrantId = normalizeSessionPersonId(session?.encadrantId ?? session?.encadrant_id);
  const referentId = normalizeSessionPersonId(session?.referentId ?? session?.referent_id);

  return [...new Set([...participantIds, encadrantId, referentId].filter(Boolean))];
}
