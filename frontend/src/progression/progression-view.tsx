import { useMemo } from "react";
import { ACHIEVEMENT_STYLES, GRADES } from "../config/constants";
import { useClimbData } from "../data/data-context";
import { fullName } from "../lib/presentation";

function gradeIndex(grade: string): number {
  return GRADES.indexOf(grade);
}

export function ProgressionView() {
  const { data, setData } = useClimbData();
  const participantId = data.selectedParticipantProgress;
  const participants = useMemo(
    () =>
      [...data.participants].sort((a, b) =>
        fullName(a).localeCompare(fullName(b), "fr"),
      ),
    [data.participants],
  );
  const achievements = useMemo(
    () =>
      data.realisations
        .filter((item) => item.participantId === participantId)
        .sort((left, right) =>
          right.dateRealisation.localeCompare(left.dateRealisation),
        ),
    [data.realisations, participantId],
  );
  const routes = new Map(data.routes.map((route) => [route.id, route]));
  const bestGrade = achievements.reduce<string | null>((best, achievement) => {
    const grade = routes.get(achievement.voieId)?.cotationAjustee;
    if (!grade) return best;
    return !best || gradeIndex(grade) > gradeIndex(best) ? grade : best;
  }, null);

  return (
    <>
      <section className="toolbar">
        <label>
          Participant
          <select
            value={participantId}
            onChange={(event) =>
              setData((current) => ({
                ...current,
                selectedParticipantProgress: event.target.value,
              }))
            }
          >
            <option value="">Choisir</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {fullName(participant)}
              </option>
            ))}
          </select>
        </label>
      </section>
      <div className="stats-grid">
        <article className="stat">
          <span>Réalisations</span>
          <strong>{achievements.length}</strong>
        </article>
        <article className="stat">
          <span>Meilleure cotation</span>
          <strong>{bestGrade ?? "-"}</strong>
        </article>
      </div>
      <section className="card stack">
        <h2>Historique</h2>
        {!participantId && (
          <p className="muted-box">Choisissez un participant.</p>
        )}
        {participantId && achievements.length === 0 && (
          <p className="muted-box">Aucune réalisation.</p>
        )}
        {achievements.map((achievement) => {
          const route = routes.get(achievement.voieId);
          return (
            <article className="subcard" key={achievement.id}>
              <div className="card-header">
                <strong>
                  {route?.cotationAjustee ?? "-"} ·{" "}
                  {route?.nomVoie || route?.numeroVoieUnique || "Voie inconnue"}
                </strong>
                <span>{achievement.dateRealisation}</span>
              </div>
              <p className="small">
                {ACHIEVEMENT_STYLES[achievement.styleRealisation] ??
                  achievement.styleRealisation}
                {achievement.nbEssais
                  ? ` · ${achievement.nbEssais} essais`
                  : ""}
              </p>
              {achievement.commentaire && <p>{achievement.commentaire}</p>}
            </article>
          );
        })}
      </section>
    </>
  );
}
