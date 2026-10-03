import {
  closeChallenge,
  createChallenge,
  getChallengeDetail,
  listChallenges,
  listParticipantChallengeBadges,
} from "./challenge-service.js";

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanIsoDate(value, { required = false } = {}) {
  const date = String(value || "").trim();
  if (!date) {
    if (required) {
      const error = new Error("La date de début est obligatoire.");
      error.statusCode = 400;
      throw error;
    }
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00Z`).getTime())) {
    const error = new Error("Date invalide.");
    error.statusCode = 400;
    throw error;
  }
  return date;
}

function sendChallengeError(res, error, fallback) {
  const status = Number(error?.statusCode) || 500;
  res.status(status).json({ error: error?.message || fallback });
}

async function currentParticipantId(pool, authUser) {
  if (authUser?.participantId) return String(authUser.participantId);
  const result = await pool.query(`select participant_id from users where id = $1`, [Number(authUser?.id)]);
  return result.rows[0]?.participant_id ? String(result.rows[0].participant_id) : null;
}

export function installChallengeRoutes(app, { requireAuth, requireAdmin, pool }) {
  app.get("/challenges", requireAuth, async (_req, res) => {
    try {
      res.json(await listChallenges(pool));
    } catch (error) {
      sendChallengeError(res, error, "Chargement des challenges impossible.");
    }
  });

  app.get("/challenges/:id", requireAuth, async (req, res) => {
    try {
      const challengeId = Number(req.params.id);
      if (!Number.isInteger(challengeId) || challengeId <= 0) {
        return res.status(400).json({ error: "Challenge invalide." });
      }
      const participantId = await currentParticipantId(pool, req.auth.user);
      const challenge = await getChallengeDetail(pool, challengeId, participantId);
      if (!challenge) return res.status(404).json({ error: "Challenge introuvable." });
      res.json(challenge);
    } catch (error) {
      sendChallengeError(res, error, "Chargement du challenge impossible.");
    }
  });

  app.get("/challenge-badges/me", requireAuth, async (req, res) => {
    try {
      const participantId = await currentParticipantId(pool, req.auth.user);
      if (!participantId) return res.json([]);
      res.json(await listParticipantChallengeBadges(pool, participantId));
    } catch (error) {
      sendChallengeError(res, error, "Chargement des badges challenge impossible.");
    }
  });

  app.post("/admin/challenges", requireAuth, requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const name = cleanText(req.body?.name, 120);
      const description = cleanText(req.body?.description, 2000);
      const startsOn = cleanIsoDate(req.body?.startsOn, { required: true });
      const endsOn = cleanIsoDate(req.body?.endsOn);
      if (name.length < 3) return res.status(400).json({ error: "Le nom doit contenir au moins 3 caractères." });
      if (endsOn && endsOn < startsOn) return res.status(400).json({ error: "La date de fin doit être postérieure à la date de début." });

      await client.query("begin");
      const challengeId = await createChallenge(client, {
        name,
        description,
        startsOn,
        endsOn,
        criteria: req.body?.criteria,
        createdBy: Number(req.auth.user.id),
      });
      await client.query("commit");
      const participantId = await currentParticipantId(pool, req.auth.user);
      res.status(201).json(await getChallengeDetail(pool, Number(challengeId), participantId));
    } catch (error) {
      await client.query("rollback");
      sendChallengeError(res, error, "Création du challenge impossible.");
    } finally {
      client.release();
    }
  });

  app.post("/admin/challenges/:id/close", requireAuth, requireAdmin, async (req, res) => {
    const challengeId = Number(req.params.id);
    if (!Number.isInteger(challengeId) || challengeId <= 0) {
      return res.status(400).json({ error: "Challenge invalide." });
    }

    const client = await pool.connect();
    try {
      await client.query("begin");
      await closeChallenge(client, challengeId);
      await client.query("commit");
      const participantId = await currentParticipantId(pool, req.auth.user);
      res.json(await getChallengeDetail(pool, challengeId, participantId));
    } catch (error) {
      await client.query("rollback");
      sendChallengeError(res, error, "Clôture du challenge impossible.");
    } finally {
      client.release();
    }
  });
}
