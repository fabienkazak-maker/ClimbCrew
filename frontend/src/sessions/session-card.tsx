import { MAX_PARTICIPANTS } from "../config/constants";
import type { SessionActions } from "../data/use-session-actions";
import type {
  ClimbingSession,
  Participant,
  SessionStatus,
} from "../domain/types";
import {
  fullName,
  getSessionParticipantStyle,
  isEligibleForFreeSession,
} from "../lib/presentation";

interface SessionCardProps {
  session: ClimbingSession;
  participants: Participant[];
  actions: SessionActions;
}

export function SessionCard({
  session,
  participants,
  actions,
}: SessionCardProps) {
  const byId = new Map(
    participants.map((participant) => [participant.id, participant]),
  );
  const registered = session.participantIds
    .map((id) => byId.get(id))
    .filter((participant) => participant !== undefined);
  const available = participants
    .filter((participant) => !session.participantIds.includes(participant.id))
    .sort((left, right) => fullName(left).localeCompare(fullName(right), "fr"));
  const occupied =
    registered.length +
    Number(Boolean(session.encadrantId)) +
    Number(Boolean(session.referentId));

  function changeStatus(status: SessionStatus): void {
    void actions.updateSession(session.id, {
      status,
      ...(status !== "encadree" ? { encadrantId: null } : {}),
      ...(status !== "libre" ? { referentId: null } : {}),
    });
  }

  function readStatus(value: string): SessionStatus {
    if (value === "libre" || value === "encadree") return value;
    return "fermee";
  }

  return (
    <article className="card session-card">
      <header className="card-header">
        <h2>Séance {session.slot}</h2>
        <span className="badge">
          {occupied}/{MAX_PARTICIPANTS}
        </span>
      </header>
      <div className="session-fields">
        <label>
          Statut
          <select
            value={session.status}
            onChange={(event) => changeStatus(readStatus(event.target.value))}
          >
            <option value="fermee">Fermée</option>
            <option value="libre">Libre</option>
            <option value="encadree">Encadrée</option>
          </select>
        </label>
        {session.status === "encadree" && (
          <RoleSelect
            label="Encadrant"
            value={session.encadrantId}
            participants={participants.filter((item) => item.canEncadrer)}
            onChange={(encadrantId) =>
              void actions.updateSession(session.id, { encadrantId })
            }
          />
        )}
        {session.status === "libre" && (
          <RoleSelect
            label="Référent"
            value={session.referentId}
            participants={participants.filter((item) => item.canReferer)}
            onChange={(referentId) =>
              void actions.updateSession(session.id, { referentId })
            }
          />
        )}
        <label>
          Ajouter un inscrit
          <select
            defaultValue=""
            onChange={(event) => {
              void actions.addParticipant(session.id, event.target.value);
              event.target.value = "";
            }}
          >
            <option value="" disabled>
              Choisir un participant
            </option>
            {available.map((participant) => (
              <option
                disabled={
                  session.status === "libre" &&
                  !isEligibleForFreeSession(participant)
                }
                key={participant.id}
                value={participant.id}
              >
                {fullName(participant)}
                {session.status === "libre" &&
                !isEligibleForFreeSession(participant)
                  ? " · passeport requis"
                  : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="participant-list">
        {registered.length === 0 && <p className="muted-box">Aucun inscrit.</p>}
        {registered.map((participant) => (
          <div
            className="participant-row"
            key={participant.id}
            style={getSessionParticipantStyle(
              participant,
              session.status === "libre",
            )}
          >
            <strong>{fullName(participant)}</strong>
            <button
              type="button"
              className="remove-button"
              aria-label={`Retirer ${fullName(participant)}`}
              onClick={() =>
                void actions.removeParticipant(session.id, participant.id)
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}

interface RoleSelectProps {
  label: string;
  value: string | null;
  participants: Participant[];
  onChange(value: string | null): void;
}

function RoleSelect({ label, value, participants, onChange }: RoleSelectProps) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Aucun</option>
        {participants.map((participant) => (
          <option key={participant.id} value={participant.id}>
            {fullName(participant)}
          </option>
        ))}
      </select>
    </label>
  );
}
