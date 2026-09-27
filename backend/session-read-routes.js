function parseIsoDateQuery(value, name) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const error = new Error(`${name} doit être au format AAAA-MM-JJ.`);
    error.status = 400;
    throw error;
  }
  const date = new Date(`${text}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    const error = new Error(`${name} contient une date invalide.`);
    error.status = 400;
    throw error;
  }
  return text;
}

export function parseSessionWindow(query = {}) {
  const from = parseIsoDateQuery(query.from, "from");
  const to = parseIsoDateQuery(query.to, "to");
  if (from && to && from > to) {
    const error = new Error("La date from doit être antérieure ou égale à to.");
    error.status = 400;
    throw error;
  }
  return { from, to };
}

function sessionDbToApi(row, participantIds = []) {
  const effectiveParticipantIds = [...new Set([
    ...participantIds.map(String),
    row.encadrant_id ? String(row.encadrant_id) : null,
    row.referent_id ? String(row.referent_id) : null,
  ].filter(Boolean))];

  return {
    id: row.id,
    date: row.date,
    slot: row.slot,
    status: row.status,
    encadrantId: row.encadrant_id ? String(row.encadrant_id) : null,
    referentId: row.referent_id ? String(row.referent_id) : null,
    participantIds: effectiveParticipantIds,
  };
}

/**
 * Installe les opérations de lecture et de suppression des séances.
 *
 * PUT /sessions/:id reste volontairement dans le flux de remplacement sécurisé
 * d'admin-user-enhancements.js et n'est donc pas réimplémenté ici.
 */
export function installSessionReadRoutes(app, { requireAuth, requireAdmin, pool }) {
  app.get("/sessions", requireAuth, async (req, res) => {
    try {
      const window = parseSessionWindow(req.query || {});
      const sessionsResult = await pool.query(
        `
          select id, date, slot, status, encadrant_id, referent_id
          from sessions
          where ($1::date is null or date >= $1::date)
            and ($2::date is null or date <= $2::date)
          order by date asc, slot asc
        `,
        [window.from, window.to],
      );

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
      const history = await pool.query(
        "select count(*)::integer as count from realisations where session_id = $1",
        [id],
      );
      const retainedRealisations = Number(history.rows[0]?.count || 0);
      if (retainedRealisations > 0) {
        return res.status(409).json({
          error: `Cette séance contient ${retainedRealisations} réalisation(s) et ne peut pas être supprimée.`,
          retainedRealisations,
        });
      }

      const result = await pool.query("delete from sessions where id = $1 returning id", [id]);
      if (!result.rowCount) return res.status(404).json({ error: "Séance introuvable" });
      return res.status(204).send();
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || "Suppression de la séance impossible",
        fields: error.fields || undefined,
      });
    }
  });
}
