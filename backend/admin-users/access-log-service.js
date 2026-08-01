import { getPool } from "./database.js";

/** Journalise une action sensible sans bloquer la réponse si le journal échoue. */
export async function writeAccessLog({ userId, eventType, req, details, success = true }) {
  try {
    await getPool().query(
      `
        insert into access_logs (user_id, event_type, success, ip_address, user_agent, details)
        values ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        userId,
        eventType,
        Boolean(success),
        req.ip || null,
        req.headers["user-agent"] || null,
        JSON.stringify(details || {}),
      ]
    );
  } catch (error) {
    console.error(`Journalisation ${eventType} impossible :`, error);
  }
}
