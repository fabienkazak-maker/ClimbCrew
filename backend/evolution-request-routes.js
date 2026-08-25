function cleanEvolutionText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

async function evolutionRequestsForUser(pool, userId) {
  const result = await pool.query(
    `select er.id, er.title, er.description, er.status, er.created_at as "createdAt",
            concat(u.prenom, ' ', u.nom) as "authorName",
            coalesce(sum(ev.value), 0)::integer as score,
            count(ev.user_id)::integer as "opinionCount",
            coalesce(max(case when ev.user_id = $1 then ev.value end), 0)::integer as "myVote"
       from evolution_requests er
       join users u on u.id = er.author_id
       left join evolution_votes ev on ev.request_id = er.id
      group by er.id, u.prenom, u.nom
      order by score desc, er.created_at desc`,
    [userId],
  );
  return result.rows;
}

export function installEvolutionRequestRoutes(app, { requireAuth, requireAdmin, pool }) {
  app.get("/evolution-requests", requireAuth, async (req, res) => {
    try {
      const requests = await evolutionRequestsForUser(pool, Number(req.auth.user.id));
      const comments = await pool.query(
        `select ec.id, ec.request_id as "requestId", ec.body, ec.created_at as "createdAt",
                concat(u.prenom, ' ', u.nom) as "authorName"
           from evolution_comments ec join users u on u.id = ec.author_id
          order by ec.created_at asc`,
      );
      const byRequest = new Map();
      comments.rows.forEach((comment) => {
        const list = byRequest.get(String(comment.requestId)) || [];
        list.push(comment);
        byRequest.set(String(comment.requestId), list);
      });
      res.json(requests.map((request) => ({ ...request, comments: byRequest.get(String(request.id)) || [] })));
    } catch (error) {
      res.status(500).json({ error: error.message || "Chargement des demandes impossible" });
    }
  });

  app.post("/evolution-requests", requireAuth, async (req, res) => {
    try {
      const title = cleanEvolutionText(req.body?.title, 140);
      const description = cleanEvolutionText(req.body?.description, 4000);
      if (title.length < 3 || description.length < 3) {
        return res.status(400).json({ error: "Le titre et la description doivent contenir au moins 3 caractères." });
      }
      const result = await pool.query(
        `insert into evolution_requests (author_id, title, description) values ($1, $2, $3) returning id`,
        [Number(req.auth.user.id), title, description],
      );
      res.status(201).json({ ok: true, id: result.rows[0].id });
    } catch (error) {
      res.status(500).json({ error: error.message || "Création de la demande impossible" });
    }
  });

  app.put("/evolution-requests/:id/vote", requireAuth, async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const value = Number(req.body?.value);
      if (!Number.isInteger(requestId) || ![-1, 0, 1].includes(value)) {
        return res.status(400).json({ error: "Vote invalide" });
      }
      if (value === 0) {
        await pool.query(`delete from evolution_votes where request_id = $1 and user_id = $2`, [requestId, Number(req.auth.user.id)]);
      } else {
        await pool.query(
          `insert into evolution_votes (request_id, user_id, value) values ($1, $2, $3)
           on conflict (request_id, user_id) do update set value = excluded.value, updated_at = now()`,
          [requestId, Number(req.auth.user.id), value],
        );
      }
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Vote impossible" });
    }
  });

  app.post("/evolution-requests/:id/comments", requireAuth, async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const body = cleanEvolutionText(req.body?.body, 2000);
      if (!Number.isInteger(requestId) || !body) return res.status(400).json({ error: "Commentaire invalide" });
      const exists = await pool.query(`select 1 from evolution_requests where id = $1`, [requestId]);
      if (!exists.rowCount) return res.status(404).json({ error: "Demande introuvable" });
      await pool.query(
        `insert into evolution_comments (request_id, author_id, body) values ($1, $2, $3)`,
        [requestId, Number(req.auth.user.id), body],
      );
      res.status(201).json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Ajout du commentaire impossible" });
    }
  });

  app.put("/admin/evolution-requests/:id/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const status = String(req.body?.status || "");
      const allowedStatuses = new Set(["a_voir", "approuve", "integre", "trop_creatif"]);
      if (!Number.isInteger(requestId) || !allowedStatuses.has(status)) {
        return res.status(400).json({ error: "État invalide" });
      }
      const result = await pool.query(
        `update evolution_requests set status = $2, updated_at = now() where id = $1 returning id`,
        [requestId, status],
      );
      if (!result.rowCount) return res.status(404).json({ error: "Demande introuvable" });
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Mise à jour de l’état impossible" });
    }
  });
}
