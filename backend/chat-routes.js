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
    editedAt: row.editedAt || null,
    pinned: Boolean(row.pinned),
    poll: row.poll || null,
    eventRef: row.eventRef || null,
  };
}

export function installChatRoutes(app, { requireAuth, pool }) {
  app.get("/chat/messages", requireAuth, async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `select id, participant_id as "participantId", message, created_at as "createdAt",
                attachment_name as "attachmentName", attachment_mime_type as "attachmentMimeType",
                attachment_size as "attachmentSize", kind, event_type as "eventType", event_ref as "eventRef",
                edited_at as "editedAt", pinned, poll,
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


  app.patch("/chat/messages/:id", requireAuth, async (req, res) => {
    try {
      const participantId = participantIdFromRequest(req);
      const message = String(req.body?.message || "").trim();
      if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur." });
      if (!message || message.length > 2000) return res.status(400).json({ error: "Message invalide." });
      const { rows } = await pool.query(
        `update chat_messages set message=$1, edited_at=now()
         where id=$2 and participant_id=$3 and kind='user'
         returning id, participant_id as "participantId", message, created_at as "createdAt",
          edited_at as "editedAt", pinned, poll, kind, event_type as "eventType", event_ref as "eventRef",
          attachment_name as "attachmentName", attachment_mime_type as "attachmentMimeType", attachment_size as "attachmentSize"`,
        [message, req.params.id, participantId],
      );
      if (!rows[0]) return res.status(404).json({ error: "Message introuvable ou non modifiable." });
      return res.json(publicMessageRow(rows[0]));
    } catch (error) { console.error("chat edit error:", error); return res.status(500).json({ error: "Modification impossible." }); }
  });

  app.delete("/chat/messages/:id", requireAuth, async (req, res) => {
    try {
      const participantId = participantIdFromRequest(req);
      if (!participantId) return res.status(403).json({ error: "Compte non relié à un grimpeur." });
      const result = await pool.query("delete from chat_messages where id=$1 and participant_id=$2 and kind='user'", [req.params.id, participantId]);
      if (!result.rowCount) return res.status(404).json({ error: "Message introuvable ou non supprimable." });
      return res.json({ ok: true });
    } catch (error) { console.error("chat delete error:", error); return res.status(500).json({ error: "Suppression impossible." }); }
  });

  app.post("/chat/messages/:id/pin", requireAuth, async (req, res) => {
    try {
      const pinned = req.body?.pinned !== false;
      const { rows } = await pool.query("update chat_messages set pinned=$1 where id=$2 returning id, pinned", [pinned, req.params.id]);
      if (!rows[0]) return res.status(404).json({ error: "Message introuvable." });
      return res.json(rows[0]);
    } catch (error) { return res.status(500).json({ error: "Épinglage impossible." }); }
  });

  app.post("/chat/polls", requireAuth, async (req, res) => {
    try {
      const participantId = participantIdFromRequest(req);
      const question = String(req.body?.question || "").trim().slice(0, 500);
      const options = (Array.isArray(req.body?.options) ? req.body.options : []).map(x => String(x).trim().slice(0,120)).filter(Boolean).slice(0,8);
      if (!participantId || !question || options.length < 2) return res.status(400).json({ error: "Sondage invalide." });
      const poll = { question, options: options.map((label, index) => ({ id: index + 1, label, votes: [] })) };
      const { rows } = await pool.query(
        `insert into chat_messages(participant_id,message,kind,event_type,poll) values($1,$2,'user','poll',$3::jsonb)
         returning id, participant_id as "participantId", message, created_at as "createdAt", kind, event_type as "eventType", poll, pinned, edited_at as "editedAt"`,
        [participantId, question, JSON.stringify(poll)],
      );
      return res.status(201).json(publicMessageRow(rows[0]));
    } catch (error) { console.error("chat poll error:", error); return res.status(500).json({ error: "Création du sondage impossible." }); }
  });

  app.post("/chat/messages/:id/poll-vote", requireAuth, async (req, res) => {
    try {
      const participantId = participantIdFromRequest(req);
      const optionId = Number(req.body?.optionId);
      const { rows } = await pool.query("select poll from chat_messages where id=$1 and event_type='poll'", [req.params.id]);
      const poll = rows[0]?.poll;
      if (!participantId || !poll || !Number.isInteger(optionId)) return res.status(400).json({ error: "Vote invalide." });
      poll.options = (poll.options || []).map(o => ({ ...o, votes: o.id === optionId ? [...new Set([...(o.votes || []).filter(id => String(id) !== String(participantId)), participantId])] : (o.votes || []).filter(id => String(id) !== String(participantId)) }));
      await pool.query("update chat_messages set poll=$1::jsonb where id=$2", [JSON.stringify(poll), req.params.id]);
      return res.json({ ok: true, poll });
    } catch (error) { console.error("chat vote error:", error); return res.status(500).json({ error: "Vote impossible." }); }
  });

  app.get("/chat/kudos", requireAuth, async (_req, res) => {
    try {
      const { rows } = await pool.query(`select participant_id as "participantId", count(*)::int as kudos from chat_message_reactions where reaction='👍' group by participant_id order by kudos desc`);
      return res.json(rows);
    } catch (error) { return res.status(500).json({ error: "Classement Kudos indisponible." }); }
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
