export type UserRole = "admin" | "user";
export type UserStatus = "pending" | "active" | "revoked";
export type ThemePreference = "auto" | "light" | "dark";

export interface UserRow {
  id: string | number;
  participant_id: string | number | null;
  email: string;
  prenom: string;
  nom: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  must_reset_password: boolean;
  created_at: Date | string;
  approved_at: Date | string | null;
  revoked_at: Date | string | null;
  revoked_reason: string | null;
  last_login_at: Date | string | null;
  theme_preference: ThemePreference;
}

export interface ApiUser {
  id: string;
  participantId: string | null;
  email: string;
  prenom: string;
  nom: string;
  role: UserRole;
  status: UserStatus;
  mustResetPassword: boolean;
  createdAt: string;
  approvedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  lastLoginAt: string | null;
  themePreference: ThemePreference;
}

export interface AuthSessionRow extends UserRow {
  session_id: string | number;
}

export interface RequestAuth {
  token: string;
  sessionId: string;
  user: ApiUser;
}

export interface ParticipantBody {
  nom: string;
  prenom: string;
  passport: string;
  cotisation: boolean;
  ffme: boolean;
  canEncadrer: boolean;
  canReferer: boolean;
  canAdmin: boolean;
}

export interface SessionBody {
  id: string;
  date: string;
  slot: "matin" | "midi" | "soir";
  status: "fermee" | "libre" | "encadree";
  encadrantId: string | null;
  referentId: string | null;
  participantIds: string[];
}

export interface RouteBody {
  id: string;
  numeroVoieUnique: string;
  numeroCorde: number | null;
  couleurPrises: string;
  cotationReference: string;
  cotationAjustee: string;
  nomVoie: string;
  nomOuvreur: string;
  moulinetteOnly: boolean;
  active: boolean;
  dateCreation: string;
}

export interface AchievementBody {
  id: string;
  participantId: string;
  sessionId: string;
  voieId: string;
  dateRealisation: string;
  styleRealisation: string;
  commentaire: string;
  cotationProposee: string;
  nbEssais?: number;
}
