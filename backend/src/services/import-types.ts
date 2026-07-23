import type { AchievementBody, ParticipantBody, RouteBody } from "../domain";

export interface ImportedParticipant {
  sourceId: string;
  body: ParticipantBody;
}

export interface ImportedSession {
  sourceId: string;
  date: string;
  slot: "matin" | "midi" | "soir";
  status: "fermee" | "libre" | "encadree";
  encadrantId: string | null;
  referentId: string | null;
  participantIds: string[];
}

export interface ImportedRope {
  numeroCorde: number;
  actif: boolean;
  couleurCorde: string;
}

export interface ImportDataset {
  participants: ImportedParticipant[];
  sessions: ImportedSession[];
  ropes: ImportedRope[];
  routes: RouteBody[];
  achievements: AchievementBody[];
}

export interface ImportResult {
  participantsImported: number;
  sessionsImported: number;
  ropesImported: number;
  routesImported: number;
  achievementsImported: number;
}
