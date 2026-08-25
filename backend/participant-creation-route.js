import { validateParticipantPayload } from "./validation.js";

function participantDbToApi(row) {
  return {
    id: String(row.id),
    nom: row.nom,
    prenom: row.prenom,
    email: row.email || "",
    passport: row.passport,
    sexe: row.sexe || "",
    cotisation: row.cotisation,
    ffme: row.ffme,
    canEncadrer: row.can_encadrer,
    canReferer: row.can_referer,
    canAdmin: row.can_admin,
    avatarId: row.avatar_id || "gecko",
    crestId: row.crest_id || "cristal",
    profilePublic: row.profile_public !== false,
    customAvatarImage: row.custom_avatar_image || "",
  };
}

/** Installe la création administrateur d'une fiche participant. */
export function installParticipantCreationRoute(app, { requireAuth, requireAdmin, pool }) {
  app.post("/participants", requireAuth, requireAdmin, async (req, res) => {
    try {
      const {
        nom,
        prenom,
        email,
        passport,
        sexe,
        cotisation,
        ffme,
        canEncadrer,
        canReferer,
        canAdmin,
        avatarId = "gecko",
        crestId = "cristal",
        profilePublic = true,
      } = validateParticipantPayload(req.body || {});

      const result = await pool.query(
        `
          insert into participants
          (nom, prenom, email, passport, sexe, cotisation, ffme, can_encadrer, can_referer, can_admin, avatar_id, crest_id, profile_public)
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          returning id, nom, prenom, email, passport, sexe, cotisation, ffme, can_encadrer, can_referer, can_admin, avatar_id, crest_id, profile_public
        `,
        [
          nom,
          prenom,
          String(email || "").trim().toLowerCase(),
          passport,
          sexe,
          cotisation,
          ffme,
          canEncadrer,
          canReferer,
          canAdmin,
          avatarId,
          crestId,
          profilePublic,
        ]
      );

      res.status(201).json(participantDbToApi(result.rows[0]));
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.message || String(error),
        fields: error.fields || undefined,
      });
    }
  });
}
