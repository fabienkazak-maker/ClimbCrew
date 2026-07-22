import type { CSSProperties } from "react";
import type { Participant } from "../domain/types";

const PASSPORT_COLORS: Record<string, string> = {
  sans: "#e2e8f0",
  blanc: "#f8fafc",
  jaune: "#facc15",
  orange: "#fb923c",
  vert: "#4ade80",
  bleu: "#60a5fa",
  violet: "#a78bfa",
  rouge: "#f87171",
  decouverte: "#64748b",
};

const ROUTE_COLORS: Record<string, string> = {
  bleu: "#60a5fa",
  rouge: "#f87171",
  vert: "#4ade80",
  jaune: "#facc15",
  orange: "#fb923c",
  violet: "#a78bfa",
  rose: "#f472b6",
  noir: "#94a3b8",
  blanc: "#f8fafc",
  blanche: "#f8fafc",
  gris: "#cbd5e1",
  ocre: "#d97706",
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTextColor(backgroundColor: string): string {
  const hex = backgroundColor.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#0f172a";
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 >= 160
    ? "#0f172a"
    : "#f8fafc";
}

export function fullName(participant: Participant | undefined): string {
  return participant ? `${participant.nom} ${participant.prenom}`.trim() : "";
}

export function getPassportStyle(participant: Participant): CSSProperties {
  const key = normalize(participant.passport);
  const backgroundColor =
    PASSPORT_COLORS[key] ?? PASSPORT_COLORS.sans ?? "#e2e8f0";
  const borderColor = participant.cotisation ? "#22c55e" : "#ef4444";
  return {
    backgroundColor,
    color: getTextColor(backgroundColor),
    border: `2px solid ${borderColor}`,
  };
}

export function isEligibleForFreeSession(participant: Participant): boolean {
  return ["jaune", "orange", "vert", "bleu"].includes(
    normalize(participant.passport),
  );
}

export function getSessionParticipantStyle(
  participant: Participant,
  freeSession: boolean,
): CSSProperties {
  const style = getPassportStyle(participant);
  if (!freeSession || isEligibleForFreeSession(participant)) return style;
  return {
    ...style,
    backgroundImage:
      "repeating-linear-gradient(135deg, transparent 0 7px, rgba(15, 23, 42, 0.28) 7px 11px)",
  };
}

export function getRouteStyle(color: string): CSSProperties {
  const backgroundColor = ROUTE_COLORS[normalize(color)] ?? "#f8fafc";
  return { backgroundColor, color: getTextColor(backgroundColor) };
}
