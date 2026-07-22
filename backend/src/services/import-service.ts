import { pool } from "../database";
import type { ImportDataset, ImportResult } from "./import-types";
import {
  clearBusinessData,
  writeActivity,
  writeParticipants,
  writeRoutes,
} from "./import-writers";

export async function importDataset(
  data: ImportDataset,
): Promise<ImportResult> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await clearBusinessData(client);
    const identifiers = await writeParticipants(client, data.participants);
    await writeRoutes(client, data);
    await writeActivity(client, data, identifiers);
    await client.query("commit");
    return {
      participantsImported: data.participants.length,
      sessionsImported: data.sessions.length,
      ropesImported: data.ropes.length,
      routesImported: data.routes.length,
      achievementsImported: data.achievements.length,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
