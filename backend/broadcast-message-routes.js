export function installBroadcastMessageRoutes(app, { requireAuth, requireAdmin, pool }) {
  /**
   * Messages ponctuels diffusés par les administrateurs.
   * Les destinataires sont figés lors de la publication afin que seuls les comptes
   * actifs à cet instant reçoivent le message à leur prochaine utilisation.
   */
  app.post("/admin/broadcast-messages", requireAuth, requireAdmin, async (req, res) => {
    const title = String(req.body?.title || "").trim().slice(0, 120);
    const body = String(req.body?.body || "").trim().slice(0, 2000);
    if (title.length < 3 || body.length < 3) {
      return res.status(400).json({ error: "Le titre et le message doivent contenir au moins 3 caractères." });
    }

    const client = await pool.connect();
    try {
      await client.query("begin");
      const messageResult = await client.query(
        `insert into broadcast_messages (title, body, created_by)
         values ($1, $2, $3)
         returning id, title, body, created_at as "createdAt"`,
        [title, body, Number(req.auth.user.id)],
      );
      const message = messageResult.rows[0];
      const recipientsResult = await client.query(
        `insert into broadcast_message_recipients (message_id, user_id)
         select $1, id from users where status = 'active'
         on conflict do nothing
         returning user_id`,
        [message.id],
      );
      await client.query("commit");
      res.status(201).json({ ok: true, message, recipientCount: recipientsResult.rowCount });
    } catch (error) {
      await client.query("rollback");
      res.status(500).json({ error: error.message || "Diffusion du message impossible" });
    } finally {
      client.release();
    }
  });

  app.get("/auth/broadcast-messages/pending", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `select bm.id, bm.title, bm.body, bm.created_at as "createdAt"
           from broadcast_message_recipients bmr
           join broadcast_messages bm on bm.id = bmr.message_id
          where bmr.user_id = $1 and bmr.read_at is null
          order by bm.created_at asc, bm.id asc`,
        [Number(req.auth.user.id)],
      );
      res.json({ messages: result.rows });
    } catch (error) {
      res.status(500).json({ error: error.message || "Chargement des messages impossible" });
    }
  });

  app.post("/auth/broadcast-messages/:id/read", requireAuth, async (req, res) => {
    try {
      const messageId = Number(req.params.id);
      if (!Number.isInteger(messageId) || messageId <= 0) {
        return res.status(400).json({ error: "Message invalide" });
      }
      const result = await pool.query(
        `update broadcast_message_recipients
            set read_at = coalesce(read_at, now())
          where message_id = $1 and user_id = $2
          returning read_at as "readAt"`,
        [messageId, Number(req.auth.user.id)],
      );
      if (!result.rowCount) return res.status(404).json({ error: "Message introuvable ou déjà traité" });
      res.json({ ok: true, readAt: result.rows[0].readAt });
    } catch (error) {
      res.status(500).json({ error: error.message || "Validation de la lecture impossible" });
    }
  });
}
