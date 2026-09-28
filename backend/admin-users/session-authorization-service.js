import { getPool } from "./database.js";
import { validateSessionPayload } from "../validation.js";
import { getDefaultSessionStatus } from "../../shared/session-default-status.js";
import { MAX_SESSION_PARTICIPANTS } from "../../shared/session-rules.js";

function normalizedId(value) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function sameId(left, right) {
  return normalizedId(left) === normalizedId(right);
}

export function assertSessionCapacity(participantIds) {
  const uniqueParticipantIds = [...new Set((participantIds || [])
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(String))];
  if (uniqueParticipantIds.length > MAX_SESSION_PARTICIPANTS) {
    const error = new Error(`Une séance ne peut pas dépasser ${MAX_SESSION_PARTICIPANTS} participants.`);
    error.status = 409;
    throw error;
  }
  return uniqueParticipantIds;
}


function sessionAuditSnapshot(session, participantIds = []) {
  if (!session) return null;
  return {
    id: String(session.id),
    date: session.date,
    slot: session.slot,
    status: session.status,
    encadrantId: normalizedId(session.encadrant_id ?? session.encadrantId),
    referentId: normalizedId(session.referent_id ?? session.referentId),
    participantIds: [...new Set((participantIds || []).filter(Boolean).map(String))].sort(),
  };
}

function sessionAuditChanges(before, after) {
  if (!before) return ["creation"];
  const changes = [];
  if (before.date !== after.date) changes.push("date");
  if (before.slot !== after.slot) changes.push("creneau");
  if (before.status !== after.status) changes.push("statut");
  if (before.encadrantId !== after.encadrantId) changes.push("encadrant");
  if (before.referentId !== after.referentId) changes.push("referent");
  if (JSON.stringify(before.participantIds) !== JSON.stringify(after.participantIds)) changes.push("participants");
  return changes;
}

async function writePlanningAuditLog(client, req, eventType, details) {
  await client.query(
    `insert into access_logs (user_id, event_type, success, ip_address, user_agent, details)
     values ($1,$2,true,$3,$4,$5::jsonb)`,
    [
      req.auth?.user?.id || null,
      eventType,
      req.ip || null,
      req.headers?.["user-agent"] || null,
      JSON.stringify(details || {}),
    ],
  );
}

function symmetricDifference(left, right) {
  const changed = [];
  for (const value of left) if (!right.has(value)) changed.push(value);
  for (const value of right) if (!left.has(value)) changed.push(value);
  return changed;
}

/**
 * Politique d'autorisation indépendante de PostgreSQL, afin d'être testable.
 *
 * - administrateur : gestion complète de la séance hors changement de statut, qui reste soumis aux qualifications métier ;
 * - référent : peut uniquement passer une séance au statut libre ;
 * - encadrant : peut passer une séance à libre ou à tout autre statut ;
 * - membre standard : peut uniquement s'inscrire ou se désinscrire lui-même ;
 * - une séance fermée refuse toute nouvelle inscription non administrateur ;
 * - création d'une séance : administrateur, ou référent/encadrant selon le statut demandé.
 */
export function evaluateSessionMutation({
  existingSession,
  requestedSession,
  previousParticipantIds = [],
  actorParticipantId,
  isAdmin = false,
  canEncadrer = false,
  canReferer = false,
}) {
  const previous = new Set(previousParticipantIds.map(String));
  const requested = new Set((requestedSession.participantIds || []).map(String));
  const actorId = normalizedId(actorParticipantId);

  if (!existingSession) {
    const requestedStatus = requestedSession.status || getDefaultSessionStatus(
      requestedSession.date,
      requestedSession.slot,
    );
    const canCreateRequestedStatus = requestedStatus === "libre"
      ? Boolean(canEncadrer || canReferer)
      : Boolean(canEncadrer);

    if (isAdmin || canCreateRequestedStatus) {
      return {
        allowed: true,
        canManageAll: true,
        canChangeStatus: true,
        statusChanged: true,
      };
    }

    return {
      allowed: false,
      status: 403,
      error: requestedStatus === "libre"
        ? "Seuls les référents, encadrants ou administrateurs peuvent créer une séance libre."
        : "Seuls les encadrants ou administrateurs peuvent créer une séance encadrée ou fermée.",
    };
  }

  const requestedStatus = requestedSession.status || existingSession.status;
  const statusChanged = requestedStatus !== existingSession.status;
  const canChangeRequestedStatus = requestedStatus === "libre"
    ? Boolean(canEncadrer || canReferer)
    : Boolean(canEncadrer);

  if (statusChanged && !canChangeRequestedStatus) {
    return {
      allowed: false,
      status: 403,
      error: requestedStatus === "libre"
        ? "Seuls les référents ou encadrants peuvent passer une séance au statut libre."
        : "Seuls les encadrants peuvent passer une séance dans un autre statut.",
    };
  }

  if (isAdmin) {
    return {
      allowed: true,
      canManageAll: true,
      canChangeStatus: canChangeRequestedStatus,
      statusChanged,
    };
  }

  if (
    requestedSession.date !== existingSession.date
    || requestedSession.slot !== existingSession.slot
    || !sameId(requestedSession.encadrantId, existingSession.encadrant_id)
    || !sameId(requestedSession.referentId, existingSession.referent_id)
  ) {
    return {
      allowed: false,
      status: 403,
      error: "La date, le créneau, l’encadrant et le référent ne peuvent être modifiés que par un administrateur.",
    };
  }

  if (!actorId) {
    return {
      allowed: false,
      status: 403,
      error: "Le compte doit être associé à un grimpeur pour modifier une inscription.",
    };
  }

  const participantChanges = symmetricDifference(previous, requested);
  if (participantChanges.some((participantId) => participantId !== actorId)) {
    return {
      allowed: false,
      status: 403,
      error: "Un utilisateur ne peut modifier que sa propre inscription à une séance.",
    };
  }

  const actorJoins = requested.has(actorId) && !previous.has(actorId);
  const actorLeaves = previous.has(actorId) && !requested.has(actorId);
  if (actorJoins && requestedStatus === "fermee") {
    return {
      allowed: false,
      status: 409,
      error: "Cette séance est fermée : aucune nouvelle inscription n’est autorisée.",
    };
  }

  return {
    allowed: true,
    canManageAll: false,
    canChangeStatus: canChangeRequestedStatus,
    statusChanged,
    actorJoins,
    actorLeaves,
  };
}

async function loadActorPrivileges(client, participantId) {
  const id = Number(participantId);
  if (!Number.isInteger(id) || id <= 0) return { canEncadrer: false, canReferer: false };

  const result = await client.query(
    `select can_encadrer, can_referer from participants where id = $1 limit 1`,
    [id],
  );
  return {
    canEncadrer: Boolean(result.rows[0]?.can_encadrer),
    canReferer: Boolean(result.rows[0]?.can_referer),
  };
}

async function assertLibreEligibility(client, participantId) {
  const result = await client.query(
    `select id from participants where id = $1 and lower(passport) in ('jaune', 'orange', 'vert', 'bleu')`,
    [participantId],
  );
  if (!result.rowCount) {
    const error = new Error(
      "Une séance libre est réservée aux passeports Jaune, Orange, Vert ou Bleu pour toute nouvelle inscription.",
    );
    error.status = 400;
    throw error;
  }
}

export async function registerParticipantForSession(client, {
  sessionId,
  participantId,
  session = null,
  participantIds = null,
  allowClosed = false,
} = {}) {
  const actorId = normalizedId(participantId);
  if (!actorId) {
    const error = new Error("Le compte doit être associé à un grimpeur pour s’inscrire.");
    error.status = 403;
    throw error;
  }

  const resolvedSession = session || (await client.query(
    `select id, status, encadrant_id, referent_id from sessions where id = $1 for update`,
    [sessionId],
  )).rows[0];
  if (!resolvedSession) {
    const error = new Error("Séance introuvable.");
    error.status = 404;
    throw error;
  }

  const listedParticipants = participantIds === null
    ? (await client.query(
      `select participant_id from session_participants where session_id = $1`,
      [resolvedSession.id],
    )).rows.map((row) => String(row.participant_id))
    : participantIds.map(String);

  const registeredParticipantIds = [...new Set(listedParticipants.map(String))];

  if (registeredParticipantIds.includes(actorId)) {
    return { registered: false, session: resolvedSession };
  }
  if (resolvedSession.status === "fermee" && !allowClosed) {
    const error = new Error("Cette séance est fermée : aucune nouvelle inscription n’est autorisée.");
    error.status = 409;
    throw error;
  }

  assertSessionCapacity([...registeredParticipantIds, actorId]);
  if (resolvedSession.status === "libre") {
    await assertLibreEligibility(client, actorId);
  }

  const registration = await client.query(
    `insert into session_participants (session_id, participant_id, created_at)
     values ($1, $2, clock_timestamp())
     on conflict (session_id, participant_id) do nothing
     returning session_id`,
    [resolvedSession.id, actorId],
  );
  return { registered: registration.rowCount > 0, session: resolvedSession };
}

/** Contrôleur sécurisé remplaçant PUT /sessions/:id. */
export async function updateSessionWithAuthorization(req, res) {
  const client = await getPool().connect();
  try {
    const requested = validateSessionPayload(req.body || {}, req.params.id);
    const isAdmin = req.auth?.user?.role === "admin";
    const actorParticipantId = req.auth?.user?.participantId || null;

    await client.query("begin");

    const existingResult = await client.query(
      `select id, date, slot, status, encadrant_id, referent_id from sessions where id = $1 for update`,
      [requested.id],
    );
    const existing = existingResult.rows[0] || null;

    const participantsResult = existing
      ? await client.query(
        `select participant_id
         from session_participants
         where session_id = $1
         order by created_at asc, participant_id asc`,
        [requested.id],
      )
      : { rows: [] };
    const previousParticipantIds = [...new Set(
      participantsResult.rows.map((row) => String(row.participant_id)),
    )];

    const privileges = await loadActorPrivileges(client, actorParticipantId);
    const policy = evaluateSessionMutation({
      existingSession: existing,
      requestedSession: requested,
      previousParticipantIds,
      actorParticipantId,
      isAdmin,
      ...privileges,
    });

    if (!policy.allowed) {
      await client.query("rollback");
      return res.status(policy.status || 403).json({ error: policy.error || "Action non autorisée" });
    }

    const resolvedStatus = requested.status
      || existing?.status
      || getDefaultSessionStatus(requested.date, requested.slot);

    let sessionRow;
    if (policy.canManageAll) {
      const result = await client.query(
        `
          insert into sessions (id, date, slot, status, encadrant_id, referent_id)
          values ($1,$2,$3,$4,$5,$6)
          on conflict (id) do update set
            date = excluded.date,
            slot = excluded.slot,
            status = excluded.status,
            encadrant_id = excluded.encadrant_id,
            referent_id = excluded.referent_id,
            updated_at = now()
          returning id, date, slot, status, encadrant_id, referent_id
        `,
        [
          requested.id,
          requested.date,
          requested.slot,
          resolvedStatus,
          requested.encadrantId || null,
          requested.referentId || null,
        ],
      );
      sessionRow = result.rows[0];

      const nextParticipantIds = assertSessionCapacity(requested.participantIds.map(String));
      const previousParticipantSet = new Set(previousParticipantIds);
      const nextParticipantSet = new Set(nextParticipantIds);
      const newlyAdded = nextParticipantIds.filter((id) => !previousParticipantSet.has(id));
      const removedParticipantIds = previousParticipantIds.filter((id) => !nextParticipantSet.has(id));
      if (resolvedStatus === "libre") {
        for (const participantId of newlyAdded) await assertLibreEligibility(client, participantId);
      }

      for (const participantId of removedParticipantIds) {
        await client.query(
          `delete from session_participants where session_id = $1 and participant_id = $2`,
          [requested.id, participantId],
        );
      }
      for (const participantId of newlyAdded) {
        await client.query(
          `insert into session_participants (session_id, participant_id, created_at)
           values ($1,$2,clock_timestamp())
           on conflict do nothing`,
          [requested.id, participantId],
        );
      }
    } else {
      if (policy.statusChanged) {
        const result = await client.query(
          `update sessions set status = $2, updated_at = now() where id = $1 returning id, date, slot, status, encadrant_id, referent_id`,
          [requested.id, resolvedStatus],
        );
        sessionRow = result.rows[0];
      } else {
        sessionRow = existing;
      }

      const actorId = String(actorParticipantId);
      if (policy.actorJoins) {
        await registerParticipantForSession(client, {
          sessionId: requested.id,
          participantId: actorId,
          session: sessionRow,
          participantIds: previousParticipantIds,
        });
      } else if (policy.actorLeaves) {
        await client.query(
          `delete from session_participants where session_id = $1 and participant_id = $2`,
          [requested.id, actorId],
        );
      }
    }

    const finalParticipants = await client.query(
      `select participant_id
       from session_participants
       where session_id = $1
       order by created_at asc, participant_id asc`,
      [requested.id],
    );
    const finalParticipantIds = [...new Set(
      finalParticipants.rows.map((row) => String(row.participant_id)),
    )];
    const beforeAudit = sessionAuditSnapshot(existing, previousParticipantIds);
    const afterAudit = sessionAuditSnapshot(sessionRow, finalParticipantIds);
    const changes = sessionAuditChanges(beforeAudit, afterAudit);
    if (changes.length > 0) {
      await writePlanningAuditLog(
        client,
        req,
        existing ? "planning_session_updated" : "planning_session_created",
        {
          sessionId: String(requested.id),
          changes,
          before: beforeAudit,
          after: afterAudit,
        },
      );
    }

    await client.query("commit");
    return res.json({
      id: sessionRow.id,
      date: sessionRow.date,
      slot: sessionRow.slot,
      status: sessionRow.status,
      encadrantId: sessionRow.encadrant_id ? String(sessionRow.encadrant_id) : null,
      referentId: sessionRow.referent_id ? String(sessionRow.referent_id) : null,
      participantIds: finalParticipantIds,
    });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    return res.status(error.status || 500).json({
      error: error.message || "Mise à jour de la séance impossible",
      fields: error.fields || undefined,
    });
  } finally {
    client.release();
  }
}