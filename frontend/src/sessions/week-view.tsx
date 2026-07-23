import { MAX_PARTICIPANTS } from "../config/constants";
import type { ClimbingSession, Participant } from "../domain/types";
import { formatDateFr } from "../lib/date";
import { fullName } from "../lib/presentation";

interface WeekViewProps {
  dates: string[];
  sessions: ClimbingSession[];
  participants: Participant[];
}

export function WeekView({ dates, sessions, participants }: WeekViewProps) {
  const names = new Map(participants.map((item) => [item.id, fullName(item)]));
  return (
    <div className="week-grid">
      {dates.map((date) => (
        <article className="card" key={date}>
          <h2>{formatDateFr(date)}</h2>
          {sessions
            .filter((session) => session.date === date)
            .map((session) => {
              const occupied =
                session.participantIds.length +
                Number(Boolean(session.encadrantId)) +
                Number(Boolean(session.referentId));
              return (
                <div className="subcard" key={session.id}>
                  <div className="card-header">
                    <strong>{session.slot}</strong>
                    <span className="badge">
                      {occupied}/{MAX_PARTICIPANTS}
                    </span>
                  </div>
                  <p className="small">Statut: {session.status}</p>
                  {session.participantIds.length === 0 ? (
                    <p className="small">Aucun inscrit</p>
                  ) : (
                    <p className="small">
                      {session.participantIds
                        .map((id) => names.get(id) ?? id)
                        .join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
        </article>
      ))}
    </div>
  );
}
