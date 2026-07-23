import type {
  AuthUser,
  ThemePreference,
  UserRole,
  UserStatus,
} from "../domain/types";
import { isRecord, readBoolean, readString } from "../lib/guards";

function isRole(value: string): value is UserRole {
  return value === "admin" || value === "user";
}

function isStatus(value: string): value is UserStatus {
  return value === "pending" || value === "active" || value === "revoked";
}

function readTheme(value: string | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "auto";
}

export function parseAuthUser(value: unknown): AuthUser | null {
  if (!isRecord(value)) return null;
  const id = readString(value, "id");
  const email = readString(value, "email");
  const prenom = readString(value, "prenom");
  const nom = readString(value, "nom");
  const role = readString(value, "role");
  const status = readString(value, "status");
  const participantId = readString(value, "participantId", "participant_id");
  const mustResetPassword = readBoolean(
    value,
    "mustResetPassword",
    "must_reset_password",
  );
  if (
    !id ||
    !email ||
    !prenom ||
    !nom ||
    !role ||
    !status ||
    !isRole(role) ||
    !isStatus(status) ||
    mustResetPassword === null
  ) {
    return null;
  }
  return {
    id,
    participantId,
    email,
    prenom,
    nom,
    role,
    status,
    mustResetPassword,
    themePreference: readTheme(
      readString(value, "themePreference", "theme_preference"),
    ),
  };
}

export function parseAuthPayload(value: unknown): AuthUser | null {
  if (!isRecord(value)) return null;
  return parseAuthUser(value.user);
}
