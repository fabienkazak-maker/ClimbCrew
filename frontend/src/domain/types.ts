export type Identifier = string;
export type SessionSlot = "matin" | "midi" | "soir";
export type SessionStatus = "fermee" | "libre" | "encadree";
export type UserRole = "admin" | "user";
export type UserStatus = "pending" | "active" | "revoked";
export type ThemePreference = "auto" | "light" | "dark";

export interface Participant {
  id: Identifier;
  nom: string;
  prenom: string;
  passport: string;
  cotisation: boolean;
  ffme: boolean;
  canEncadrer: boolean;
  canReferer: boolean;
  canAdmin: boolean;
}

export interface ClimbingSession {
  id: Identifier;
  date: string;
  slot: SessionSlot;
  status: SessionStatus;
  encadrantId: Identifier | null;
  referentId: Identifier | null;
  participantIds: Identifier[];
}

export interface Rope {
  numeroCorde: number;
  actif: boolean;
  couleurCorde: string;
}

export interface ClimbingRoute {
  id: Identifier;
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

export interface Achievement {
  id: Identifier;
  participantId: Identifier;
  sessionId: Identifier;
  voieId: Identifier;
  dateRealisation: string;
  styleRealisation: string;
  commentaire: string;
  cotationProposee: string;
  nbEssais?: number;
}

export interface AppData {
  exportedAt: string | null;
  version: string;
  participants: Participant[];
  sessions: ClimbingSession[];
  ropes: Rope[];
  routes: ClimbingRoute[];
  realisations: Achievement[];
  selectedDate: string;
  selectedParticipantProgress: string;
}

export interface AuthUser {
  id: Identifier;
  participantId: Identifier | null;
  email: string;
  prenom: string;
  nom: string;
  role: UserRole;
  status: UserStatus;
  mustResetPassword: boolean;
  themePreference: ThemePreference;
}

export interface AdminUser extends AuthUser {
  createdAt: string;
  approvedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  lastLoginAt: string | null;
}

export interface AccessLog {
  id: Identifier;
  eventType: string;
  success: boolean;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string;
}

export interface NewParticipant {
  nom: string;
  prenom: string;
  passport: string;
  cotisation: boolean;
  ffme: boolean;
  canEncadrer: boolean;
  canReferer: boolean;
  canAdmin: boolean;
}

export interface NewRoute {
  numeroVoieUnique: string;
  numeroCorde: string;
  couleurPrises: string;
  cotationReference: string;
  nomVoie: string;
  nomOuvreur: string;
  moulinetteOnly: boolean;
}

export interface NewAchievement {
  participantId: string;
  selectedDay: string;
  voieId: string;
  styleRealisation: string;
  commentaire: string;
  cotationProposee: string;
  nbEssais: string;
}
