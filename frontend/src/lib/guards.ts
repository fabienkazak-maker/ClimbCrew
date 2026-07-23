export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasString(
  value: Record<string, unknown>,
  key: string,
): boolean {
  return typeof value[key] === "string";
}

export function hasBoolean(
  value: Record<string, unknown>,
  key: string,
): boolean {
  return typeof value[key] === "boolean";
}

export function hasNumber(
  value: Record<string, unknown>,
  key: string,
): boolean {
  return typeof value[key] === "number";
}

export function hasNullableString(
  value: Record<string, unknown>,
  key: string,
): boolean {
  return value[key] === null || typeof value[key] === "string";
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function readString(
  value: Record<string, unknown>,
  camelKey: string,
  snakeKey = camelKey,
): string | null {
  const candidate = value[camelKey] ?? value[snakeKey];
  return typeof candidate === "string" ? candidate : null;
}

export function readBoolean(
  value: Record<string, unknown>,
  camelKey: string,
  snakeKey = camelKey,
): boolean | null {
  const candidate = value[camelKey] ?? value[snakeKey];
  return typeof candidate === "boolean" ? candidate : null;
}
