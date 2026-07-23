import { USE_API } from "../config/constants";
import type { AppData } from "../domain/types";
import { requestJson } from "../lib/api";
import { isAppData } from "./default-data";

function requireData(value: unknown): AppData {
  if (!isAppData(value)) throw new Error("Contrat d’export invalide");
  return value;
}

export async function importData(value: AppData): Promise<AppData> {
  if (!USE_API) return value;
  await requestJson("/admin/import-data", {
    method: "POST",
    body: JSON.stringify(value),
  });
  return requireData(await requestJson("/admin/export-data"));
}

export async function exportData(localData: AppData): Promise<AppData> {
  return USE_API
    ? requireData(await requestJson("/admin/export-data"))
    : localData;
}

export function downloadData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "climbcrew-export.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
