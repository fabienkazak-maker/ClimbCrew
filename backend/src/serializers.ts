import type { ApiUser, SessionBody, UserRow } from "./domain";

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeUser(row: UserRow): ApiUser {
  return {
    id: String(row.id),
    participantId:
      row.participant_id === null ? null : String(row.participant_id),
    email: row.email,
    prenom: row.prenom,
    nom: row.nom,
    role: row.role,
    status: row.status,
    mustResetPassword: row.must_reset_password,
    createdAt: iso(row.created_at) ?? "",
    approvedAt: iso(row.approved_at),
    revokedAt: iso(row.revoked_at),
    revokedReason: row.revoked_reason,
    lastLoginAt: iso(row.last_login_at),
    themePreference: row.theme_preference,
  };
}

interface ParticipantRow {
  id: string | number;
  nom: string;
  prenom: string;
  passport: string;
  cotisation: boolean;
  ffme: boolean;
  can_encadrer: boolean;
  can_referer: boolean;
  can_admin: boolean;
}

export function serializeParticipant(row: ParticipantRow) {
  return {
    id: String(row.id),
    nom: row.nom,
    prenom: row.prenom,
    passport: row.passport,
    cotisation: row.cotisation,
    ffme: row.ffme,
    canEncadrer: row.can_encadrer,
    canReferer: row.can_referer,
    canAdmin: row.can_admin,
  };
}

interface SessionRow {
  id: string;
  date: string;
  slot: "matin" | "midi" | "soir";
  status: "fermee" | "libre" | "encadree";
  encadrant_id: string | null;
  referent_id: string | null;
}

export function serializeSession(
  row: SessionRow,
  participantIds: string[],
): SessionBody {
  return {
    id: row.id,
    date: row.date,
    slot: row.slot,
    status: row.status,
    encadrantId: row.encadrant_id === null ? null : String(row.encadrant_id),
    referentId: row.referent_id === null ? null : String(row.referent_id),
    participantIds,
  };
}
