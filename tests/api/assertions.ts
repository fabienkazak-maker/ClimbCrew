export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function jsonRecord(response: Response) {
  const value: unknown = await response.json();
  if (!isRecord(value)) throw new Error("Objet JSON attendu");
  return value;
}

export async function jsonArray(response: Response): Promise<unknown[]> {
  const value: unknown = await response.json();
  if (!Array.isArray(value)) throw new Error("Tableau JSON attendu");
  return value;
}

export function stringField(
  value: Record<string, unknown>,
  key: string,
): string {
  const field = value[key];
  if (typeof field !== "string") throw new Error(`${key} doit être textuel`);
  return field;
}

export function arrayField(
  value: Record<string, unknown>,
  key: string,
): unknown[] {
  const field = value[key];
  if (!Array.isArray(field)) throw new Error(`${key} doit être un tableau`);
  return field;
}

export function findRecord(
  values: unknown[],
  field: string,
  expected: string,
): Record<string, unknown> {
  const match = values.find(
    (value) => isRecord(value) && value[field] === expected,
  );
  if (!isRecord(match)) throw new Error(`${field}=${expected} introuvable`);
  return match;
}

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
