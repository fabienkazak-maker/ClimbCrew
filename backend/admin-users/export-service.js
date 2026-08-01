import { getPool } from "./database.js";

/**
 * Requêtes volontairement explicites pour exclure les secrets d'authentification.
 * Ne jamais remplacer la requête users par un `select *`.
 */
const EXPORT_QUERIES = {
  participants: `select * from participants order by id`,
  users: `
    select id, participant_id, email, prenom, nom, role, is_admin, status,
           must_reset_password, created_at, approved_at, revoked_at,
           revoked_reason, last_login_at, theme_preference
    from users
    order by id
  `,
  sessions: `select * from sessions order by date, slot, id`,
  sessionParticipants: `select * from session_participants order by session_id, participant_id`,
  ropes: `select * from ropes order by numero_corde`,
  routes: `select * from routes order by numero_corde nulls last, numero_voie_unique`,
  realisations: `select * from realisations order by date_realisation, id`,
  accessLogs: `
    select id, user_id, event_type, success, ip_address, user_agent, details, created_at
    from access_logs
    order by created_at desc
  `,
};

/** Produit un export global réservé aux administrateurs. */
export async function exportAllData(_req, res) {
  try {
    const pool = getPool();
    const entries = await Promise.all(
      Object.entries(EXPORT_QUERIES).map(async ([key, query]) => [key, (await pool.query(query)).rows])
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="climbcrew-export-complet-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.json({
      ok: true,
      data: {
        exportedAt: new Date().toISOString(),
        version: "climbcrew-complete-export-v2",
        securityNotice: "Les mots de passe et jetons de session ne sont jamais exportés.",
        ...Object.fromEntries(entries),
      },
    });
  } catch (error) {
    res.status(500).json({ error: String(error.message || error) });
  }
}
