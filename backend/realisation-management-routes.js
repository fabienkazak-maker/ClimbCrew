import { validateRealisationPayload } from "./validation.js";

/**
 * Installe les écritures liées aux réalisations.
 *
 * La lecture GET /realisations reste volontairement gérée par le contrôleur de
 * confidentialité injecté via admin-user-enhancements.js. Ce module reprend
 * uniquement les opérations POST/PUT/DELETE historiquement présentes dans
 * server.js, sans modifier leur comportement.
 */
export function installRealisationManagementRoutes(app, { requireAuth, pool }) {
  app.post("/realisations", requireAuth, async (req, res) => {
    try {
      const realisation = validateRealisationPayload(req.body || {});
      const participantId = req.auth?.user?.participantId;
      if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur" });
      realisation.participantId = String(participantId);
      await pool.query(
        `
          insert into realisations (
            id, participant_id, session_id, voie_id, date_realisation, style_realisation,
            commentaire, cotation_proposee, nb_essais, rating, chute, assureur_id
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        `,
        [
          realisation.id,
          realisation.participantId,
          realisation.sessionId,
          realisation.voieId,
          realisation.dateRealisation,
          realisation.styleRealisation,
          realisation.commentaire || "",
          realisation.cotationProposee || "",
          realisation.nbEssais || "",
          realisation.rating ?? null,
          Boolean(realisation.chute),
          realisation.assureurId || null,
        ]
      );
      res.json(realisation);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || String(error), fields: error.fields || undefined });
    }
  });

  app.put("/realisations/:id", requireAuth, async (req, res) => {
    try {
      const patch = validateRealisationPayload(req.body || {}, { partial: true });
      const participantId = req.auth?.user?.participantId;
      if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur" });
      delete patch.participantId;
      const result = await pool.query(
        `
          update realisations
          set
            participant_id = coalesce($2, participant_id),
            session_id = coalesce($3, session_id),
            voie_id = coalesce($4, voie_id),
            date_realisation = coalesce($5, date_realisation),
            style_realisation = coalesce($6, style_realisation),
            commentaire = coalesce($7, commentaire),
            cotation_proposee = coalesce($8, cotation_proposee),
            nb_essais = coalesce($9, nb_essais),
            rating = coalesce($10, rating),
            chute = coalesce($11, chute),
            assureur_id = case when $11 = false then null else coalesce($12, assureur_id) end,
            updated_at = now()
          where id = $1 and participant_id = $13
        `,
        [
          req.params.id,
          patch.participantId ?? null,
          patch.sessionId ?? null,
          patch.voieId ?? null,
          patch.dateRealisation ?? null,
          patch.styleRealisation ?? null,
          patch.commentaire ?? null,
          patch.cotationProposee ?? null,
          patch.nbEssais ?? null,
          patch.rating ?? null,
          patch.chute ?? null,
          patch.assureurId ?? null,
          participantId,
        ]
      );
      if (result.rowCount === 0) return res.status(403).json({ error: "Cette réalisation ne vous appartient pas" });
      res.json({ ok: true });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || String(error), fields: error.fields || undefined });
    }
  });

  app.delete("/realisations/:id", requireAuth, async (req, res) => {
    try {
      const participantId = req.auth?.user?.participantId;
      if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur" });
      const result = await pool.query(
        `delete from realisations where id = $1 and participant_id = $2`,
        [req.params.id, participantId],
      );
      if (result.rowCount === 0) return res.status(403).json({ error: "Cette réalisation ne vous appartient pas" });
      res.json({ ok: true });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || String(error), fields: error.fields || undefined });
    }
  });
}
