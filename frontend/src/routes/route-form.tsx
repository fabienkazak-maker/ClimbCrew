import type { Dispatch, SetStateAction } from "react";
import { GRADES } from "../config/constants";
import type { NewRoute, Rope } from "../domain/types";

interface RouteFormProps {
  value: NewRoute;
  ropes: Rope[];
  setValue: Dispatch<SetStateAction<NewRoute>>;
  onSubmit(): void;
}

export function RouteForm({
  value,
  ropes,
  setValue,
  onSubmit,
}: RouteFormProps) {
  return (
    <form
      className="grid-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label>
        Numéro unique
        <input
          value={value.numeroVoieUnique}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              numeroVoieUnique: event.target.value,
            }))
          }
        />
      </label>
      <label>
        Corde
        <select
          value={value.numeroCorde}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              numeroCorde: event.target.value,
            }))
          }
        >
          {ropes.map((rope) => (
            <option key={rope.numeroCorde} value={rope.numeroCorde}>
              Corde {rope.numeroCorde} · {rope.couleurCorde}
            </option>
          ))}
        </select>
      </label>
      <label>
        Couleur
        <input
          value={value.couleurPrises}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              couleurPrises: event.target.value,
            }))
          }
        />
      </label>
      <label>
        Cotation
        <select
          value={value.cotationReference}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              cotationReference: event.target.value,
            }))
          }
        >
          {GRADES.map((grade) => (
            <option key={grade}>{grade}</option>
          ))}
        </select>
      </label>
      <label>
        Nom
        <input
          value={value.nomVoie}
          onChange={(event) =>
            setValue((current) => ({ ...current, nomVoie: event.target.value }))
          }
        />
      </label>
      <label>
        Ouvreur
        <input
          value={value.nomOuvreur}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              nomOuvreur: event.target.value,
            }))
          }
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.moulinetteOnly}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              moulinetteOnly: event.target.checked,
            }))
          }
        />{" "}
        Moulinette uniquement
      </label>
      <button type="submit">Ajouter</button>
    </form>
  );
}
