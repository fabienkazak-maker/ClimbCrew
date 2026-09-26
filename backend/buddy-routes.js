function participantIdFromRequest(req) {
  return req.auth?.user?.participantId || req.enhancementAuth?.user?.participantId || null;
}
const DAYS = new Set(["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]);
const SLOTS = new Set(["matin","midi","soir"]);
function cleanList(value, allowed) {
  return [...new Set((Array.isArray(value) ? value : []).map(String).filter((item) => allowed.has(item)))];
}
export function installBuddyRoutes(app, { requireAuth, pool }) {
  app.get("/buddy/me", requireAuth, async (req, res) => {
    const participantId = participantIdFromRequest(req);
    if (!participantId) return res.status(400).json({ error: "Compte non associé à un grimpeur." });
    const { rows } = await pool.query(
      `select days, slots, note from buddy_availability where participant_id = $1`, [participantId]
    );
    res.json(rows[0] || { days: [], slots: [], note: "" });
  });

  app.put("/buddy/me", requireAuth, async (req, res) => {
    const participantId = participantIdFromRequest(req);
    if (!participantId) return res.status(400).json({ error: "Compte non associé à un grimpeur." });
    const days = cleanList(req.body?.days, DAYS);
    const slots = cleanList(req.body?.slots, SLOTS);
    const note = String(req.body?.note || "").trim().slice(0, 240);
    const { rows } = await pool.query(
      `insert into buddy_availability (participant_id, days, slots, note, updated_at)
       values ($1,$2,$3,$4,now())
       on conflict (participant_id) do update set days=excluded.days, slots=excluded.slots, note=excluded.note, updated_at=now()
       returning days, slots, note`, [participantId, days, slots, note]
    );
    res.json(rows[0]);
  });

  app.get("/buddy", requireAuth, async (req, res) => {
    const participantId = participantIdFromRequest(req);
    const { rows } = await pool.query(
      `select b.participant_id as "participantId",
              trim(concat_ws(' ', p.prenom, p.nom)) as name,
              b.days, b.slots, b.note
       from buddy_availability b
       join participants p on p.id = b.participant_id
       where b.participant_id <> $1
         and cardinality(b.days) > 0 and cardinality(b.slots) > 0
       order by p.prenom, p.nom`, [participantId]
    );
    res.json(rows);
  });
}
