import { useState } from "react";
import type { Participant } from "../domain/types";
import { fullName, getPassportStyle } from "../lib/presentation";

interface ParticipantRowProps {
  participant: Participant;
  onSave(value: Participant): Promise<void>;
  onDelete(id: string): Promise<void>;
}

export function ParticipantRow({
  participant,
  onSave,
  onDelete,
}: ParticipantRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(participant);
  return (
    <div
      className="participant-admin-row"
      style={getPassportStyle(participant)}
    >
      {editing ? (
        <>
          <input
            value={draft.nom}
            onChange={(event) =>
              setDraft({ ...draft, nom: event.target.value })
            }
          />
          <input
            value={draft.prenom}
            onChange={(event) =>
              setDraft({ ...draft, prenom: event.target.value })
            }
          />
          <input
            value={draft.passport}
            onChange={(event) =>
              setDraft({ ...draft, passport: event.target.value })
            }
          />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.cotisation}
              onChange={(event) =>
                setDraft({ ...draft, cotisation: event.target.checked })
              }
            />{" "}
            Cotisation
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.ffme}
              onChange={(event) =>
                setDraft({ ...draft, ffme: event.target.checked })
              }
            />{" "}
            FFME
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.canEncadrer}
              onChange={(event) =>
                setDraft({ ...draft, canEncadrer: event.target.checked })
              }
            />{" "}
            Encadrant
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.canReferer}
              onChange={(event) =>
                setDraft({ ...draft, canReferer: event.target.checked })
              }
            />{" "}
            Référent
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.canAdmin}
              onChange={(event) =>
                setDraft({ ...draft, canAdmin: event.target.checked })
              }
            />{" "}
            Administrateur
          </label>
          <button
            type="button"
            onClick={() => {
              void onSave(draft).then(() => setEditing(false));
            }}
          >
            Enregistrer
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setDraft(participant);
              setEditing(false);
            }}
          >
            Annuler
          </button>
        </>
      ) : (
        <>
          <strong>{fullName(participant)}</strong>
          <span>Passeport {participant.passport}</span>
          <span>
            {participant.cotisation
              ? "Cotisation à jour"
              : "Cotisation absente"}
          </span>
          <span>{participant.ffme ? "FFME" : "Sans FFME"}</span>
          <button
            type="button"
            className="secondary"
            onClick={() => setEditing(true)}
          >
            Modifier
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => void onDelete(participant.id)}
          >
            Supprimer
          </button>
        </>
      )}
    </div>
  );
}
