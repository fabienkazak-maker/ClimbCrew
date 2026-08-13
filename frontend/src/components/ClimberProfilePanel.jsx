import React, { useMemo } from "react";
import { formatRouteForRealisation } from "../lib/domain.js";
import { calculateClimberProfile, recommendRoutesForNextSession } from "../lib/climber-profile.js";

function scoreLabel(score) {
  if (!Number.isFinite(score)) return "À découvrir";
  if (score >= 80) return "Très à l'aise";
  if (score >= 65) return "À l'aise";
  if (score >= 50) return "En progression";
  return "À travailler";
}

function SkillRow({ item }) {
  const detail = item.attempts > 0
    ? `${item.attempts} réalisation${item.attempts > 1 ? "s" : ""} analysée${item.attempts > 1 ? "s" : ""}`
    : "Aucune réalisation sur une voie portant cette caractéristique.";

  return (
    <div className="climber-profile-skill">
      <div className="climber-profile-skill-heading">
        <strong>{item.label}</strong>
        <span className="small">
          {Number.isFinite(item.score) ? `${item.score} % · ${scoreLabel(item.score)}` : "À découvrir"}
        </span>
      </div>
      <div
        className="climber-profile-bar"
        role="progressbar"
        aria-label={item.label}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Number.isFinite(item.score) ? item.score : undefined}
      >
        <span
          className="climber-profile-bar-fill"
          style={{ width: `${Number.isFinite(item.score) ? item.score : 0}%` }}
        />
      </div>
      <span className="small">{detail}</span>
    </div>
  );
}

function SummaryBox({ title, items, emptyText }) {
  return (
    <div className="muted-box">
      <strong>{title}</strong>
      <div className="small" style={{ marginTop: 5 }}>
        {items.length
          ? items.map((item) => `${item.label} ${item.score} %`).join(" · ")
          : emptyText}
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation, index }) {
  return (
    <div className="muted-box climber-recommendation">
      <span className="badge climber-recommendation-number">{index + 1}</span>
      <div className="climber-recommendation-copy">
        <strong>{formatRouteForRealisation(recommendation.route)}</strong>
        <div className="small" style={{ marginTop: 4 }}>{recommendation.reason}</div>
      </div>
    </div>
  );
}

export default function ClimberProfilePanel({ realisations = [], routesById = {}, cprGrade = "" }) {
  const routes = useMemo(() => Object.values(routesById || {}), [routesById]);
  const profile = useMemo(
    () => calculateClimberProfile({ realisations, routesById, cprGrade }),
    [realisations, routesById, cprGrade],
  );
  const recommendations = useMemo(
    () => recommendRoutesForNextSession({
      routes,
      realisations,
      routesById,
      cprGrade,
      profile,
      limit: 5,
    }),
    [routes, realisations, routesById, cprGrade, profile],
  );

  return (
    <section className="card climber-profile-card">
      <div className="card-header">
        <div>
          <h3>Profil du grimpeur</h3>
          <div className="small">
            Indice d'aisance par caractéristique et sélection de voies pour préparer la prochaine séance.
          </div>
        </div>
        {profile.referenceGrade && (
          <span className="badge">
            Référence {profile.referenceSource === "cpr" ? "CPR" : "niveau"} : {profile.referenceGrade}
          </span>
        )}
      </div>

      <div className="climber-profile-layout">
        <div className="subcard climber-profile-skills">
          <strong>Caractéristiques</strong>
          <div className="small">
            50 % est une zone neutre. Le score se stabilise progressivement avec le nombre de réalisations enregistrées.
          </div>
          {profile.characteristics.map((item) => <SkillRow key={item.value} item={item} />)}

          <div className="climber-profile-summary-grid">
            <SummaryBox
              title="Points forts"
              items={profile.strengths}
              emptyText="Pas encore de point fort suffisamment documenté."
            />
            <SummaryBox
              title="Axes à travailler"
              items={profile.developmentAreas}
              emptyText="Aucun axe faible marqué pour le moment."
            />
          </div>
        </div>

        <div className="subcard climber-recommendations">
          <strong>5 voies pour la prochaine séance</strong>
          <div className="small">
            La sélection privilégie les voies non encore réussies, les projets, les axes faibles et une progression autour du niveau de référence.
          </div>

          {recommendations.length > 0
            ? recommendations.map((recommendation, index) => (
                <RecommendationCard key={recommendation.route.id} recommendation={recommendation} index={index} />
              ))
            : <div className="muted-box">Pas assez de voies cotées pour proposer une sélection.</div>}

          <div className="small">
            Cette proposition est une aide à la préparation : elle reste à adapter à l'échauffement, à la forme du jour et aux consignes d'encadrement.
          </div>
        </div>
      </div>

      {!cprGrade && profile.referenceGrade && (
        <div className="small climber-profile-reference-note">
          Le CPR n'étant pas disponible, la référence {profile.referenceGrade} est déduite de l'historique du grimpeur.
        </div>
      )}
    </section>
  );
}
