import express from "express";

const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

function participantIdFromRequest(req) {
  return req.auth?.user?.participantId || req.enhancementAuth?.user?.participantId || null;
}

function decodeHeader(value, fallback = "") {
  try {
    return decodeURIComponent(String(value || fallback)).replace(/[\r\n]/g, "").slice(0, 240);
  } catch {
    return fallback;
  }
}

function publicMessageRow(row) {
  return {
    id: row.id,
    participantId: row.participantId,
    message: row.message,
    createdAt: row.createdAt,
    attachmentName: row.attachmentName || null,
    attachmentMimeType: row.attachmentMimeType || null,
    attachmentSize: row.attachmentSize == null ? null : Number(row.attachmentSize),
    attachmentUrl: row.attachmentName ? `/chat/messages/${row.id}/attachment` : null,
    kind: row.kind || "user",
    eventType: row.eventType || null,
    reactions: row.reactions || [],
  };
}

export function installChatRoutes(app, { requireAuth, pool }) {
  app.get("/chat/messages", requireAuth, async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `select id, participant_id as "participantId", message, created_at as "createdAt",
                attachment_name as "attachmentName", attachment_mime_type as "attachmentMimeType",
                attachment_size as "attachmentSize", kind, event_type as "eventType",
                coalesce((select json_agg(json_build_object('reaction', r.reaction, 'participantId', r.participant_id))
                  from chat_message_reactions r where r.message_id = chat_messages.id), '[]'::json) as reactions
         from chat_messages
         order by created_at desc
         limit 200`
      );
      res.json(rows.reverse().map(publicMessageRow));
    } catch (error) {
      console.error("chat list error:", error);
      res.status(500).json({ error: "Lecture du chat impossible." });
    }
  });

  app.get("/chat/messages/:id/attachment", requireAuth, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `select attachment_name, attachment_mime_type, attachment_content
         from chat_messages where id = $1 limit 1`,
        [req.params.id],
      );
      const item = rows[0];
      if (!item?.attachment_content) return res.status(404).json({ error: "Fichier introuvable." });
      const safeName = String(item.attachment_name || "fichier").replace(/[\r\n"]/g, "_");
      res.set("Content-Type", item.attachment_mime_type || "application/octet-stream");
      res.set("Content-Disposition", `inline; filename="${safeName}"`);
      res.set("Cache-Control", "private, max-age=300");
      return res.send(item.attachment_content);
    } catch (error) {
      console.error("chat attachment read error:", error);
      return res.status(500).json({ error: "Lecture du fichier impossible." });
    }
  });

  app.post("/chat/messages", requireAuth, async (req, res) => {
    try {
      const participantId = participantIdFromRequest(req);
      if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur." });
      const message = String(req.body?.message || "").trim();
      if (!message || message.length > 2000) {
        return res.status(400).json({ error: "Le message doit contenir entre 1 et 2000 caractères." });
      }
      const { rows } = await pool.query(
        `insert into chat_messages (participant_id, message)
         values ($1, $2)
         returning id, participant_id as "participantId", message, created_at as "createdAt",
                   attachment_name as "attachmentName", attachment_mime_type as "attachmentMimeType",
                   attachment_size as "attachmentSize"`,
        [participantId, message]
      );
      res.status(201).json(publicMessageRow(rows[0]));
    } catch (error) {
      console.error("chat send error:", error);
      res.status(500).json({ error: "Envoi du message impossible." });
    }
  });

  app.post("/chat/messages/:id/reactions", requireAuth, async (req, res) => {
    try {
      const participantId = participantIdFromRequest(req);
      if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur." });
      const reaction = String(req.body?.reaction || "").trim();
      if (!reaction || reaction.length > 24) return res.status(400).json({ error: "Réaction invalide." });
      const exists = await pool.query("select 1 from chat_messages where id = $1", [req.params.id]);
      if (!exists.rowCount) return res.status(404).json({ error: "Message introuvable." });
      await pool.query(
        `insert into chat_message_reactions (message_id, participant_id, reaction)
         values ($1,$2,$3) on conflict (message_id, participant_id, reaction) do nothing`,
        [req.params.id, participantId, reaction],
      );
      return res.json({ ok: true });
    } catch (error) {
      console.error("chat reaction error:", error);
      return res.status(500).json({ error: "Réaction impossible." });
    }
  });

  app.delete("/chat/messages/:id/reactions", requireAuth, async (req, res) => {
    try {
      const participantId = participantIdFromRequest(req);
      const reaction = String(req.body?.reaction || "").trim();
      if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur." });
      await pool.query(
        "delete from chat_message_reactions where message_id = $1 and participant_id = $2 and reaction = $3",
        [req.params.id, participantId, reaction],
      );
      return res.json({ ok: true });
    } catch (error) {
      console.error("chat reaction delete error:", error);
      return res.status(500).json({ error: "Retrait de la réaction impossible." });
    }
  });

  app.post(
    "/chat/messages/attachment",
    requireAuth,
    express.raw({ type: () => true, limit: CHAT_ATTACHMENT_MAX_BYTES }),
    async (req, res) => {
      try {
        const participantId = participantIdFromRequest(req);
        if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur." });
        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
          return res.status(400).json({ error: "Fichier vide." });
        }
        if (req.body.length > CHAT_ATTACHMENT_MAX_BYTES) {
          return res.status(413).json({ error: "Fichier trop volumineux. Maximum 10 Mo." });
        }
        const fileName = decodeHeader(req.headers["x-file-name"], "fichier") || "fichier";
        const message = decodeHeader(req.headers["x-chat-message"], "").trim();
        if (message.length > 2000) {
          return res.status(400).json({ error: "Le message ne peut pas dépasser 2000 caractères." });
        }
        const mimeType = String(req.headers["content-type"] || "application/octet-stream")
          .split(";")[0].trim().toLowerCase().slice(0, 160);
        const { rows } = await pool.query(
          `insert into chat_messages (
             participant_id, message, attachment_name, attachment_mime_type, attachment_size, attachment_content
           ) values ($1,$2,$3,$4,$5,$6)
           returning id, participant_id as "participantId", message, created_at as "createdAt",
                     attachment_name as "attachmentName", attachment_mime_type as "attachmentMimeType",
                     attachment_size as "attachmentSize"`,
          [participantId, message, fileName, mimeType, req.body.length, req.body],
        );
        return res.status(201).json(publicMessageRow(rows[0]));
      } catch (error) {
        console.error("chat attachment send error:", error);
        return res.status(error.type === "entity.too.large" ? 413 : 500)
          .json({ error: error.type === "entity.too.large" ? "Fichier trop volumineux. Maximum 10 Mo." : "Envoi du fichier impossible." });
      }
    },
  );
}
