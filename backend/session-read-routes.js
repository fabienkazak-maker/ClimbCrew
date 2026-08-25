function sessionDbToApi(row, participantIds = []) {
  return {
    id: row.id,
    date: row.date,
    slot: row.slot,
    status: row.status,
    encadrantId: row.encadrant_id ? String(row.encadrant_id) : null,
    referentId: row.referent_id ? String(row.referent_id) : null,
    participantIds: participantIds.map(String),
  };
}

/**
 * Installe les opérations de lecture et de suppression des séances.
 *
 * PUT /sessions/:id reste volontairement dans le flux de remplacement sécurisé
 * d'admin-user-enhancements.js et n'est donc pas réimplémenté ici.
 */
export function installSessionReadRoutes(app, { requireAuth, requireAdmin, pool }) {
  app.get("/sessions", requireAuth, async (_req, res) => {
    try {
      const sessionsResult = await pool.query(`
        select id, date, slot, status, encadrant_id, referent_id
        from sessions
        order by date asc, slot asc
      `);

      const inscriptionsResult = await pool.query(`
        select session_id, participant_id
        from session_participants
        order by session_id asc
      `);

      const participantIdsBySession = new Map();
      for (const inscription of inscriptionsResult.rows) {
        const list = participantIdsBySession.get(inscription.session_id) || [];
        list.push(String(inscription.participant_id));
        participantIdsBySession.set(inscription.session_id, list);
      }

      const sessions = sessionsResult.rows.map((session) =>
        sessionDbToApi(session, participantIdsBySession.get(session.id) || [])
      );
      res.json(sessions);
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.message || String(error),
        fields: error.fields || undefined,
      });
    }
  });

  app.delete("/sessions/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("delete from sessions where id = $1", [id]);
      res.status(204).send();
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.message || String(error),
        fields: error.fields || undefined,
      });
    }
  });
}
