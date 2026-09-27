import React from "react";
import Button from "./Button.jsx";
import AvailableParticipantOptions from "./AvailableParticipantOptions.jsx";
import {
  MAX_PARTICIPANTS,
  fullName,
  getPassportDotStyle,
  getPassportStyle,
  normalizePassport,
} from "../lib/domain.js";
import { hasBuddyAvailabilityForSession } from "../lib/buddy-preferences.js";
import { getSessionParticipantIds } from "../lib/realisation-workflow.js";

export default function SessionCard({
  session,
  compact = false,
  participants,
  participantsById,
  alphabeticalParticipants,
  currentParticipantId,
  preferencesByParticipantId,
  onUpdate,
  onAddParticipant,
  onRemoveParticipant,
}) {
  const sessionParticipantIds = getSessionParticipantIds(session);
  const inscrits = sessionParticipantIds.map((id) => participantsById[id]).filter(Boolean);
  const occupied = inscrits.length;
  const missingSupervisor = (session.status === "encadree" && !session.encadrantId)
    || (session.status === "libre" && !session.referentId);
  const freeSessionPassports = new Set(["jaune", "orange", "vert", "bleu"]);
  const availableParticipants = participants.filter((participant) => (
    !sessionParticipantIds.includes(String(participant.id))
    && (session.status !== "libre" || freeSessionPassports.has(normalizePassport(participant.passport)))
  ));

  return (
    <div className={`card session-card session-status-${String(session.status || "fermee").trim().toLowerCase()} ${missingSupervisor ? "session-card-missing-supervisor" : ""} ${compact ? "session-card-compact" : ""}`}>
      <div className="card-header">
        <h3>Séance {session.slot}</h3>
        <span className="badge">{occupied}/{MAX_PARTICIPANTS}</span>
      </div>

      <div className="session-form-row">
        <div className="inline-field">
          <label>Statut</label>
          <select
            value={session.status}
            onChange={(event) => {
              const value = event.target.value;
              onUpdate(session.id, {
                status: value,
                ...(value !== "encadree" ? { encadrantId: null } : {}),
                ...(value !== "libre" ? { referentId: null } : {}),
              });
            }}
          >
            <option value="fermee">Fermée</option>
            <option value="libre">Libre</option>
            <option value="encadree">Encadrée</option>
            <option value="passeport">Passeport</option>
            <option value="challenge">Challenge</option>
            <option value="renouvellement">Renouvellement</option>
          </select>
        </div>

        {session.status === "encadree" && (
          <div className="inline-field">
            <label>Encadrant</label>
            <select
              value={session.encadrantId || ""}
              onChange={(event) => onUpdate(session.id, { encadrantId: event.target.value || null })}
            >
              <option value="">Aucun</option>
              {alphabeticalParticipants.filter((participant) => participant.canEncadrer).map((participant) => (
                <option key={participant.id} value={participant.id}>{fullName(participant)}</option>
              ))}
            </select>
          </div>
        )}

        {session.status === "libre" && (
          <div className="inline-field">
            <label>RÉFÉRENT</label>
            <select
              value={session.referentId || ""}
              onChange={(event) => onUpdate(session.id, { referentId: event.target.value || null })}
            >
              <option value="">Aucun</option>
              {alphabeticalParticipants.filter((participant) => participant.canReferer).map((participant) => (
                <option key={participant.id} value={participant.id}>{fullName(participant)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="inline-field add-participant-field">
          <label>Inscription</label>
          <select
            defaultValue=""
            disabled={availableParticipants.length === 0 || occupied >= MAX_PARTICIPANTS}
            onChange={(event) => {
              const participantId = event.currentTarget.value;
              if (!participantId) return;
              onAddParticipant(session.id, participantId);
              event.currentTarget.value = "";
            }}
          >
            <option value="">
              {availableParticipants.length === 0 ? "Aucune personne disponible" : "S'inscrire"}
            </option>
            <AvailableParticipantOptions
              participants={availableParticipants}
              currentParticipantId={currentParticipantId}
              session={session}
              preferencesByParticipantId={preferencesByParticipantId}
            />
          </select>
        </div>
      </div>

      <div className="stack session-participant-list">
        {inscrits.length === 0 ? (
          <div className="muted-box">Aucun inscrit.</div>
        ) : (
          inscrits.map((participant) => (
            <div
              className={`participant-row passport-row ${session.status === "libre" && normalizePassport(participant.passport) === "sans" ? "passport-warning-hatched" : ""}`}
              key={participant.id}
              style={{ ...getPassportStyle(participant), borderStyle: "solid" }}
              title={participant.cotisation ? "Cotisation payée" : "Cotisation non payée"}
              data-passport={normalizePassport(participant.passport)}
            >
              <span className="participant-identity">
                <span className="passport-dot" style={getPassportDotStyle(participant)} aria-hidden="true" />
                <span
                  className="participant-name"
                  style={hasBuddyAvailabilityForSession(preferencesByParticipantId, participant.id, session)
                    ? { textDecoration: "underline" }
                    : undefined}
                >
                  {fullName(participant)}
                </span>
              </span>
              <Button variant="remove" onClick={() => onRemoveParticipant(session.id, participant.id)} aria-label="Retirer">×</Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
