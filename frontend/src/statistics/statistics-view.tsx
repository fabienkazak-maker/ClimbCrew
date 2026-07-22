import { useMemo, useState } from "react";
import { useClimbData } from "../data/data-context";
import type { Participant } from "../domain/types";
import { fullName, getPassportStyle } from "../lib/presentation";

type SortField = "name" | "passport" | "cotisation" | "ffme" | "participations";

export function StatisticsView() {
  const { data } = useClimbData();
  const [sortField, setSortField] = useState<SortField>("name");
  const [ascending, setAscending] = useState(true);
  const participationCount = useMemo(() => {
    const result = new Map<string, number>();
    data.sessions.forEach((session) => {
      session.participantIds.forEach((id) => {
        result.set(id, (result.get(id) ?? 0) + 1);
      });
    });
    return result;
  }, [data.sessions]);
  const participants = useMemo(
    () =>
      [...data.participants].sort((left, right) => {
        const direction = ascending ? 1 : -1;
        return compare(left, right, sortField, participationCount) * direction;
      }),
    [data.participants, ascending, sortField, participationCount],
  );
  const uniqueParticipants = new Set(
    data.sessions.flatMap((session) => session.participantIds),
  );

  return (
    <>
      <div className="stats-grid">
        <Stat label="Inscrits uniques" value={uniqueParticipants.size} />
        <Stat
          label="Cotisations"
          value={data.participants.filter((item) => item.cotisation).length}
        />
        <Stat
          label="Licences FFME"
          value={data.participants.filter((item) => item.ffme).length}
        />
        <Stat
          label="Voies actives"
          value={data.routes.filter((item) => item.active).length}
        />
        <Stat label="Réalisations" value={data.realisations.length} />
      </div>
      <section className="card stack">
        <div className="card-header">
          <h2>Participants</h2>
          <div className="button-group">
            <select
              value={sortField}
              onChange={(event) =>
                setSortField(readSortField(event.target.value))
              }
            >
              <option value="name">Nom</option>
              <option value="passport">Passeport</option>
              <option value="cotisation">Cotisation</option>
              <option value="ffme">FFME</option>
              <option value="participations">Participations</option>
            </select>
            <button
              type="button"
              className="secondary"
              onClick={() => setAscending((value) => !value)}
            >
              {ascending ? "Croissant" : "Décroissant"}
            </button>
          </div>
        </div>
        {participants.map((participant) => (
          <div
            className="participant-row"
            style={getPassportStyle(participant)}
            key={participant.id}
          >
            <strong>{fullName(participant)}</strong>
            <span>
              {participant.passport} ·{" "}
              {participationCount.get(participant.id) ?? 0} participations
            </span>
          </div>
        ))}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function readSortField(value: string): SortField {
  return value === "passport" ||
    value === "cotisation" ||
    value === "ffme" ||
    value === "participations"
    ? value
    : "name";
}

function compare(
  left: Participant,
  right: Participant,
  field: SortField,
  counts: Map<string, number>,
): number {
  if (field === "name")
    return fullName(left).localeCompare(fullName(right), "fr");
  if (field === "passport")
    return left.passport.localeCompare(right.passport, "fr");
  if (field === "participations")
    return (counts.get(left.id) ?? 0) - (counts.get(right.id) ?? 0);
  return Number(left[field]) - Number(right[field]);
}
