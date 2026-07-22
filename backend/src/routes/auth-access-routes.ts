import bcrypt from "bcryptjs";
import { Router, type Router as RouterType } from "express";
import { config } from "../config";
import { pool } from "../database";
import type { UserRow } from "../domain";
import { asyncRoute, bodyRecord } from "../http";
import { logAccess } from "../security/access-log";
import { serializeUser } from "../serializers";
import { cleanEmail, isStrongPassword } from "../validation";

export const authAccessRouter: RouterType = Router();

async function participantId(
  prenom: string,
  nom: string,
): Promise<string | null> {
  const result = await pool.query<{ id: string | number }>(
    `select id from participants
     where lower(prenom) = lower($1) and lower(nom) = lower($2) limit 1`,
    [prenom, nom],
  );
  const participant = result.rows[0];
  return participant ? String(participant.id) : null;
}

authAccessRouter.post(
  "/request-access",
  asyncRoute(async (request, response) => {
    const body = bodyRecord(request);
    const prenom = typeof body.prenom === "string" ? body.prenom.trim() : "";
    const nom = typeof body.nom === "string" ? body.nom.trim() : "";
    const email = cleanEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const confirmation =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    if (!prenom || !nom || !email) {
      response.status(400).json({ error: "Prénom, nom et email sont requis" });
      return;
    }
    if (body.acceptTerms !== true) {
      response
        .status(400)
        .json({ error: "Les conditions doivent être acceptées" });
      return;
    }
    if (!isStrongPassword(password)) {
      response
        .status(400)
        .json({ error: "Mot de passe insuffisamment robuste" });
      return;
    }
    if (password !== confirmation) {
      response
        .status(400)
        .json({ error: "Les mots de passe ne correspondent pas" });
      return;
    }
    const existing = await pool.query(
      "select id from users where lower(email) = $1",
      [email],
    );
    if ((existing.rowCount ?? 0) > 0) {
      response
        .status(409)
        .json({ error: "Un compte existe déjà pour cet email" });
      return;
    }
    const linkedParticipantId = await participantId(prenom, nom);
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const result = await pool.query<UserRow>(
      `insert into users (participant_id, email, prenom, nom, password_hash, role, status)
     values ($1, $2, $3, $4, $5, 'user', 'pending') returning *`,
      [linkedParticipantId, email, prenom, nom, passwordHash],
    );
    const user = result.rows[0];
    if (!user) throw new Error("Création du compte impossible");
    await logAccess({
      userId: user.id,
      eventType: "request_access",
      request,
      details: { email, participantId: linkedParticipantId },
    });
    response.status(201).json({
      ok: true,
      message: "Demande enregistrée",
      user: serializeUser(user),
    });
  }),
);

authAccessRouter.post(
  "/forgot-password",
  asyncRoute(async (request, response) => {
    const email = cleanEmail(bodyRecord(request).email);
    const result = await pool.query<{ id: string | number }>(
      "select id from users where lower(email) = $1 limit 1",
      [email],
    );
    await logAccess({
      userId: result.rows[0]?.id ?? null,
      eventType: "forgot_password_requested",
      request,
      details: { email },
    });
    response.json({ ok: true, message: "Demande enregistrée" });
  }),
);
