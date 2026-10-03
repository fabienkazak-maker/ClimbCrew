import { isSuccessfulRealisation } from "../shared/realisation-mode.js";

function isoDate(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function normalizeChallenge(row) {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || "",
    startsOn: isoDate(row.starts_on ?? row.startsOn),
    endsOn: isoDate(row.ends_on ?? row.endsOn),
    status: row.status,
    targetMode: row.target_mode ?? row.targetMode ?? "snapshot",
    criteria: row.criteria || {},
    closedAt: row.closed_at ?? row.closedAt ?? null,
    targetRouteCount: Number(row.target_route_count ?? row.targetRouteCount ?? 0),
  };
}

function compareParticipantIds(a, b) {
  const aNumber = Number(a);
  const bNumber = Number(b);
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
  return String(a).localeCompare(String(b), "fr");
}

export function normalizeChallengeCriteria(value) {
  const criteria = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const color = String(criteria.color || "").trim().slice(0, 80);
  const opener = String(criteria.opener || "").trim().slice(0, 120);
  const activeOnly = criteria.activeOnly !== false;

  if (!color && !opener) {
    const error = new Error("Choisissez au moins une couleur ou un ouvreur.");
    error.statusCode = 400;
    throw error;
  }

  return { color, opener, activeOnly };
}

export async function findMatchingRoutes(db, criteria) {
  const normalized = normalizeChallengeCriteria(criteria);
  const result = await db.query(
    `select id,
            numero_voie_unique as "numeroVoieUnique",
            numero_corde as "numeroCorde",
            couleur_prises as "couleurPrises",
            coalesce(cotation_ajustee, cotation_reference, '') as cotation,
            nom_voie as "nomVoie",
            nom_ouvreur as "nomOuvreur",
            active
       from routes
      where ($1::text = '' or lower(trim(couleur_prises)) = lower(trim($1)))
        and ($2::text = '' or lower(trim(nom_ouvreur)) = lower(trim($2)))
        and (not $3::boolean or active = true)
      order by numero_corde asc nulls last, numero_voie_unique asc`,
    [normalized.color, normalized.opener, normalized.activeOnly],
  );
  return result.rows;
}

export async function listChallenges(db) {
  const result = await db.query(
    `select c.*,
            count(cr.route_id)::integer as target_route_count
       from challenges c
       left join challenge_routes cr on cr.challenge_id = c.id
      group by c.id
      order by case when c.status = 'active' then 0 else 1 end,
               c.starts_on desc,
               c.created_at desc`,
  );
  return result.rows.map(normalizeChallenge);
}

async function loadChallengeRow(db, challengeId, { forUpdate = false } = {}) {
  const result = await db.query(
    `select c.*,
            (select count(*) from challenge_routes cr where cr.challenge_id = c.id)::integer as target_route_count
       from challenges c
      where c.id = $1
      ${forUpdate ? "for update" : ""}`,
    [challengeId],
  );
  return result.rows[0] ? normalizeChallenge(result.rows[0]) : null;
}

export async function loadChallengeRoutes(db, challengeId) {
  const result = await db.query(
    `select route_id as id, route_snapshot as snapshot
       from challenge_routes
      where challenge_id = $1
      order by coalesce((route_snapshot->>'numeroCorde')::integer, 9999),
               route_snapshot->>'numeroVoieUnique'`,
    [challengeId],
  );
  return result.rows.map((row) => ({ id: String(row.id), ...(row.snapshot || {}) }));
}

export async function calculateChallengeRanking(db, challenge, targetRoutes) {
  const routeIds = targetRoutes.map((route) => String(route.id));
  if (routeIds.length === 0) return [];

  const result = await db.query(
    `select r.id,
            r.participant_id as "participantId",
            r.voie_id as "voieId",
            r.date_realisation as "dateRealisation",
            r.style_realisation as "styleRealisation",
            r.mode_realisation as "modeRealisation",
            p.nom,
            p.prenom
       from realisations r
       join participants p on p.id::text = r.participant_id
      where r.voie_id = any($1::text[])
        and r.date_realisation >= $2::date
        and ($3::date is null or r.date_realisation <= $3::date)
      order by r.date_realisation asc, r.created_at asc`,
    [routeIds, challenge.startsOn, challenge.endsOn],
  );

  const routeIdSet = new Set(routeIds);
  const byParticipant = new Map();

  result.rows.forEach((realisation) => {
    if (!routeIdSet.has(String(realisation.voieId))) return;
    if (!isSuccessfulRealisation(realisation)) return;

    const participantId = String(realisation.participantId);
    const current = byParticipant.get(participantId) || {
      participantId,
      participantName: `${realisation.prenom || ""} ${realisation.nom || ""}`.trim(),
      completed: new Map(),
    };
    const routeId = String(realisation.voieId);
    const date = isoDate(realisation.dateRealisation);
    const previous = current.completed.get(routeId);
    if (!previous || date < previous) current.completed.set(routeId, date);
    byParticipant.set(participantId, current);
  });

  const ranking = [...byParticipant.values()].map((entry) => {
    const completionDates = [...entry.completed.values()].filter(Boolean).sort();
    return {
      participantId: entry.participantId,
      participantName: entry.participantName,
      score: entry.completed.size,
      completedRouteIds: [...entry.completed.keys()],
      finalScoringAt: completionDates.at(-1) || null,
    };
  });

  ranking.sort((a, b) => (
    b.score - a.score
    || String(a.finalScoringAt || "9999-12-31").localeCompare(String(b.finalScoringAt || "9999-12-31"))
    || compareParticipantIds(a.participantId, b.participantId)
  ));

  return ranking.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

async function loadFrozenRanking(db, challengeId) {
  const result = await db.query(
    `select cr.participant_id::text as "participantId",
            concat(p.prenom, ' ', p.nom) as "participantName",
            cr.rank,
            cr.score,
            cr.completed_route_ids as "completedRouteIds",
            cr.final_scoring_at as "finalScoringAt",
            exists (
              select 1 from participant_badges pb
               where pb.participant_id = cr.participant_id
                 and pb.badge_type = 'challenge'
                 and pb.source_type = 'challenge'
                 and pb.source_id = cr.challenge_id::text
            ) as "challengeBadge"
       from challenge_results cr
       join participants p on p.id = cr.participant_id
      where cr.challenge_id = $1
      order by cr.rank asc`,
    [challengeId],
  );
  return result.rows.map((row) => ({
    ...row,
    rank: Number(row.rank),
    score: Number(row.score),
    finalScoringAt: isoDate(row.finalScoringAt),
    completedRouteIds: (row.completedRouteIds || []).map(String),
  }));
}

export async function getChallengeDetail(db, challengeId, currentParticipantId = null) {
  const challenge = await loadChallengeRow(db, challengeId);
  if (!challenge) return null;

  const targetRoutes = await loadChallengeRoutes(db, challengeId);
  const ranking = challenge.status === "closed"
    ? await loadFrozenRanking(db, challengeId)
    : await calculateChallengeRanking(db, challenge, targetRoutes);

  const participantId = currentParticipantId ? String(currentParticipantId) : "";
  const myRanking = ranking.find((entry) => String(entry.participantId) === participantId) || null;
  const myProgress = participantId
    ? {
        participantId,
        score: myRanking?.score || 0,
        rank: myRanking?.rank || null,
        completedRouteIds: myRanking?.completedRouteIds || [],
        challengeBadge: Boolean(myRanking?.challengeBadge),
      }
    : null;

  return {
    ...challenge,
    targetRoutes,
    ranking,
    myProgress,
  };
}

export async function createChallenge(db, { name, description, startsOn, endsOn, criteria, createdBy }) {
  const normalizedCriteria = normalizeChallengeCriteria(criteria);
  const routes = await findMatchingRoutes(db, normalizedCriteria);
  if (routes.length === 0) {
    const error = new Error("Aucune voie ne correspond aux critères du challenge.");
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    `insert into challenges (name, description, starts_on, ends_on, criteria, target_mode, created_by)
     values ($1, $2, $3::date, $4::date, $5::jsonb, 'snapshot', $6)
     returning id`,
    [name, description, startsOn, endsOn || null, JSON.stringify(normalizedCriteria), createdBy],
  );
  const challengeId = result.rows[0].id;

  for (const route of routes) {
    const snapshot = {
      numeroVoieUnique: route.numeroVoieUnique,
      numeroCorde: route.numeroCorde,
      couleurPrises: route.couleurPrises,
      cotation: route.cotation,
      nomVoie: route.nomVoie,
      nomOuvreur: route.nomOuvreur,
    };
    await db.query(
      `insert into challenge_routes (challenge_id, route_id, route_snapshot)
       values ($1, $2, $3::jsonb)`,
      [challengeId, String(route.id), JSON.stringify(snapshot)],
    );
  }

  return String(challengeId);
}

export async function closeChallenge(db, challengeId) {
  const challenge = await loadChallengeRow(db, challengeId, { forUpdate: true });
  if (!challenge) {
    const error = new Error("Challenge introuvable.");
    error.statusCode = 404;
    throw error;
  }

  if (challenge.status === "closed") return challenge;

  const targetRoutes = await loadChallengeRoutes(db, challengeId);
  const ranking = await calculateChallengeRanking(db, challenge, targetRoutes);

  for (const entry of ranking) {
    await db.query(
      `insert into challenge_results
         (challenge_id, participant_id, rank, score, completed_route_ids, final_scoring_at)
       values ($1, $2::bigint, $3, $4, $5::text[], $6::date)
       on conflict (challenge_id, participant_id) do nothing`,
      [challengeId, entry.participantId, entry.rank, entry.score, entry.completedRouteIds, entry.finalScoringAt],
    );
  }

  for (const winner of ranking.slice(0, 3)) {
    await db.query(
      `insert into participant_badges
         (participant_id, badge_type, label, source_type, source_id, metadata)
       values ($1::bigint, 'challenge', 'Challenge', 'challenge', $2::text, $3::jsonb)
       on conflict (participant_id, badge_type, source_type, source_id) do nothing`,
      [winner.participantId, String(challengeId), JSON.stringify({
        challengeName: challenge.name,
        rank: winner.rank,
        score: winner.score,
      })],
    );
  }

  await db.query(
    `update challenges
        set status = 'closed', closed_at = now(), updated_at = now()
      where id = $1`,
    [challengeId],
  );

  return { ...challenge, status: "closed" };
}

export async function listParticipantChallengeBadges(db, participantId) {
  const result = await db.query(
    `select pb.id::text,
            pb.label,
            pb.badge_type as "badgeType",
            pb.source_id as "sourceId",
            pb.metadata,
            pb.awarded_at as "awardedAt"
       from participant_badges pb
      where pb.participant_id = $1::bigint
        and pb.badge_type = 'challenge'
      order by pb.awarded_at desc`,
    [participantId],
  );
  return result.rows;
}
