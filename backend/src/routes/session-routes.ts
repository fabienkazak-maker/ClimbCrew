import { Router, type Router as RouterType } from "express";
import { pool } from "../database";
import { asyncRoute, pathParam } from "../http";
import { requireAdmin, requireAuth } from "../security/auth-middleware";
import { serializeSession } from "../serializers";
import { sessionBody } from "../validation";

interface InscriptionRow {
  session_id: string;
  participant_id: string | number;
}

const MAX_PARTICIPANTS = 18;

async function validateNewFreeParticipants(
  client: import("pg").PoolClient,
  sessionId: string,
  participantIds: string[],
): Promise<string[]> {
  const current = await client.query<{ participant_id: string | number }>(
    "select participant_id from session_participants where session_id = $1",
    [sessionId],
  );
  const existing = new Set(
    current.rows.map((row) => String(row.participant_id)),
  );
  const additions = participantIds.filter((id) => !existing.has(id));
  if (additions.length === 0) return [];
  const eligible = await client.query<{ id: string | number }>(
    `select id from participants where id = any($1::bigint[])
     and lower(passport) in ('jaune', 'orange', 'vert', 'bleu')`,
    [additions],
  );
  const eligibleIds = new Set(eligible.rows.map((row) => String(row.id)));
  return additions.filter((id) => !eligibleIds.has(id));
}

export const sessionRouter: RouterType = Router();
sessionRouter.use(requireAuth);

sessionRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    const [sessions, inscriptions] = await Promise.all([
      pool.query(`select id, date, slot, status, encadrant_id, referent_id
      from sessions order by date asc, slot asc`),
      pool.query<InscriptionRow>(`select session_id, participant_id
      from session_participants order by session_id asc`),
    ]);
    const participantIds = new Map<string, string[]>();
    inscriptions.rows.forEach((row) => {
      const current = participantIds.get(row.session_id) ?? [];
      current.push(String(row.participant_id));
      participantIds.set(row.session_id, current);
    });
    response.json(
      sessions.rows.map((row) =>
        serializeSession(row, participantIds.get(row.id) ?? []),
      ),
    );
  }),
);

sessionRouter.put(
  "/:id",
  asyncRoute(async (request, response) => {
    const body = sessionBody(pathParam(request, "id"), request.body);
    if (!body) {
      response.status(400).json({ error: "Séance invalide" });
      return;
    }
    const client = await pool.connect();
    try {
      await client.query("begin");
      const uniqueIds = [...new Set(body.participantIds)];
      const occupied =
        uniqueIds.length +
        Number(Boolean(body.encadrantId)) +
        Number(Boolean(body.referentId));
      if (occupied > MAX_PARTICIPANTS) {
        await client.query("rollback");
        response.status(400).json({ error: "La séance est complète" });
        return;
      }
      if (body.status === "libre") {
        const ineligible = await validateNewFreeParticipants(
          client,
          body.id,
          uniqueIds,
        );
        if (ineligible.length > 0) {
          await client.query("rollback");
          response.status(400).json({
            error:
              "Une séance libre est réservée aux passeports Jaune, Orange, Vert ou Bleu.",
          });
          return;
        }
      }
      const sessionResult = await client.query(
        `insert into sessions (id, date, slot, status, encadrant_id, referent_id)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set date = excluded.date, slot = excluded.slot,
         status = excluded.status, encadrant_id = excluded.encadrant_id,
         referent_id = excluded.referent_id, updated_at = now()
       returning id, date, slot, status, encadrant_id, referent_id`,
        [
          body.id,
          body.date,
          body.slot,
          body.status,
          body.encadrantId,
          body.referentId,
        ],
      );
      await client.query(
        "delete from session_participants where session_id = $1",
        [body.id],
      );
      for (const participantId of uniqueIds) {
        await client.query(
          `insert into session_participants (session_id, participant_id)
         values ($1, $2) on conflict do nothing`,
          [body.id, participantId],
        );
      }
      await client.query("commit");
      const row = sessionResult.rows[0];
      if (!row) throw new Error("Enregistrement de la séance impossible");
      response.json(serializeSession(row, uniqueIds));
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }),
);

sessionRouter.delete(
  "/:id",
  requireAdmin,
  asyncRoute(async (request, response) => {
    await pool.query("delete from sessions where id = $1", [
      pathParam(request, "id"),
    ]);
    response.status(204).send();
  }),
);
