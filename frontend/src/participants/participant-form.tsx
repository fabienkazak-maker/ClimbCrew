import type { Dispatch, SetStateAction } from "react";
import type { NewParticipant } from "../domain/types";

interface ParticipantFormProps {
  value: NewParticipant;
  setValue: Dispatch<SetStateAction<NewParticipant>>;
  onSubmit(): void;
}

export function ParticipantForm({
  value,
  setValue,
  onSubmit,
}: ParticipantFormProps) {
  return (
    <form
      className="grid-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label>
        Nom
        <input
          value={value.nom}
          onChange={(event) =>
            setValue((current) => ({ ...current, nom: event.target.value }))
          }
        />
      </label>
      <label>
        Prénom
        <input
          value={value.prenom}
          onChange={(event) =>
            setValue((current) => ({ ...current, prenom: event.target.value }))
          }
        />
      </label>
      <label>
        Passeport
        <input
          value={value.passport}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              passport: event.target.value,
            }))
          }
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.cotisation}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              cotisation: event.target.checked,
            }))
          }
        />{" "}
        Cotisation
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.ffme}
          onChange={(event) =>
            setValue((current) => ({ ...current, ffme: event.target.checked }))
          }
        />{" "}
        Licence FFME
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.canEncadrer}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              canEncadrer: event.target.checked,
            }))
          }
        />{" "}
        Encadrant
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.canReferer}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              canReferer: event.target.checked,
            }))
          }
        />{" "}
        Référent
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.canAdmin}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              canAdmin: event.target.checked,
            }))
          }
        />{" "}
        Administrateur
      </label>
      <button type="submit">Ajouter</button>
    </form>
  );
}
