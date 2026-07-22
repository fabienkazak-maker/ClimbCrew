import type { ApiClient } from "./api-client";

export interface TestContext {
  baseUrl: string;
  setupToken: string;
  adminEmail: string;
  adminPassword: string;
  admin: ApiClient;
  user: ApiClient;
  userId: string;
  userEmail: string;
  userPassword: string;
}

export function emptyDataset() {
  return {
    exportedAt: null,
    version: "test",
    participants: [],
    sessions: [],
    ropes: [],
    routes: [],
    realisations: [],
  };
}
