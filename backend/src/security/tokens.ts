import crypto from "node:crypto";
import { config } from "../config";

export const SESSION_DURATION_MS = config.sessionDurationMs;
export const RESET_TOKEN_DURATION_MS = 1000 * 60 * 60;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function expiresAt(duration: number): string {
  return new Date(Date.now() + duration).toISOString();
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}
