import { API_BASE, CSRF_COOKIE_NAME } from "../config/constants";
import { isRecord } from "./guards";

function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(";")) {
    const candidate = part.trim();
    if (candidate.startsWith(prefix)) {
      return decodeURIComponent(candidate.slice(prefix.length));
    }
  }
  return null;
}

function isUnsafeMethod(method: string | undefined): boolean {
  const normalized = (method ?? "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(normalized);
}

function getErrorMessage(value: unknown, status: number): string {
  if (isRecord(value) && typeof value.error === "string") return value.error;
  return `Erreur API ${status}`;
}

export async function requestJson(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const csrfToken = isUnsafeMethod(options.method)
    ? readCookie(CSRF_COOKIE_NAME)
    : null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
  });
  if (response.status === 204) return null;
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getErrorMessage(payload, response.status));
  return payload;
}
