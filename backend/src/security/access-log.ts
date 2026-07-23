import type { Request } from "express";
import { pool } from "../database";

interface AccessEvent {
  userId: string | number | null;
  eventType: string;
  success?: boolean;
  request: Request;
  details?: Record<string, string | number | boolean | null>;
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string")
    return forwarded.split(",")[0]?.trim() || null;
  return request.ip ?? null;
}

export async function logAccess(event: AccessEvent): Promise<void> {
  await pool.query(
    `
      insert into access_logs (user_id, event_type, success, ip_address, user_agent, details)
      values ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [
      event.userId,
      event.eventType,
      event.success ?? true,
      clientIp(event.request),
      event.request.headers["user-agent"] ?? null,
      event.details ? JSON.stringify(event.details) : null,
    ],
  );
}

export function requestIp(request: Request): string | null {
  return clientIp(request);
}
