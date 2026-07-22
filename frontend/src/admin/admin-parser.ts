import { parseAuthUser } from "../auth/auth-parser";
import type { AccessLog, AdminUser } from "../domain/types";
import { isRecord, readBoolean, readString } from "../lib/guards";

function nullableString(
  value: Record<string, unknown>,
  camel: string,
  snake: string,
): string | null {
  return readString(value, camel, snake);
}

export function parseAdminUser(value: unknown): AdminUser | null {
  const user = parseAuthUser(value);
  if (!user || !isRecord(value)) return null;
  const createdAt = readString(value, "createdAt", "created_at");
  if (!createdAt) return null;
  return {
    ...user,
    createdAt,
    approvedAt: nullableString(value, "approvedAt", "approved_at"),
    revokedAt: nullableString(value, "revokedAt", "revoked_at"),
    revokedReason: nullableString(value, "revokedReason", "revoked_reason"),
    lastLoginAt: nullableString(value, "lastLoginAt", "last_login_at"),
  };
}

export function parseAccessLog(value: unknown): AccessLog | null {
  if (!isRecord(value)) return null;
  const id = readString(value, "id");
  const eventType = readString(value, "eventType", "event_type");
  const success = readBoolean(value, "success");
  const createdAt = readString(value, "createdAt", "created_at");
  if (!id || !eventType || success === null || !createdAt) return null;
  return {
    id,
    eventType,
    success,
    createdAt,
    email: nullableString(value, "email", "email"),
    ipAddress: nullableString(value, "ipAddress", "ip_address"),
    userAgent: nullableString(value, "userAgent", "user_agent"),
    details: nullableString(value, "details", "details_text"),
  };
}

export function parseAdminUsersPayload(value: unknown): AdminUser[] | null {
  if (!isRecord(value) || !Array.isArray(value.users)) return null;
  const users = value.users.map(parseAdminUser);
  return users.every((item) => item !== null)
    ? users.filter((item) => item !== null)
    : null;
}

export function parseLogsPayload(value: unknown): AccessLog[] | null {
  if (!isRecord(value) || !Array.isArray(value.logs)) return null;
  const logs = value.logs.map(parseAccessLog);
  return logs.every((item) => item !== null)
    ? logs.filter((item) => item !== null)
    : null;
}
