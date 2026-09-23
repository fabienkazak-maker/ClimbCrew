export function installChatRoutes(app, { requireAuth, pool }) {
  app.get("/chat/messages", requireAuth, async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `select id, participant_id as "participantId", message, created_at as "createdAt"
         from chat_messages
         order by created_at desc
         limit 200`
      );
      res.json(rows.reverse());
    } catch (error) {
      console.error("chat list error:", error);
      res.status(500).json({ error: "Lecture du chat impossible." });
    }
  });

  app.post("/chat/messages", requireAuth, async (req, res) => {
    try {
      const participantId = req.auth?.participantId || req.user?.participantId;
      if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur." });
      const message = String(req.body?.message || "").trim();
      if (!message || message.length > 2000) {
        return res.status(400).json({ error: "Le message doit contenir entre 1 et 2000 caractères." });
      }
      const { rows } = await pool.query(
        `insert into chat_messages (participant_id, message)
         values ($1, $2)
         returning id, participant_id as "participantId", message, created_at as "createdAt"`,
        [participantId, message]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("chat send error:", error);
      res.status(500).json({ error: "Envoi du message impossible." });
    }
  });
}
