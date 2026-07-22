import type { Dispatch, SetStateAction } from "react";
import { useMemo } from "react";
import { ACHIEVEMENT_STYLES, GRADES } from "../config/constants";
import type { AppData, NewAchievement } from "../domain/types";
import { fullName } from "../lib/presentation";

interface AchievementFieldsProps {
  data: AppData;
  form: NewAchievement;
  setForm: Dispatch<SetStateAction<NewAchievement>>;
}

export function AchievementFields({
  data,
  form,
  setForm,
}: AchievementFieldsProps) {
  const days = useMemo(
    () => [...new Set(data.sessions.map((item) => item.date))].sort().reverse(),
    [data.sessions],
  );
  const participants = useMemo(
    () =>
      data.participants.filter(
        (participant) =>
          participant.cotisation &&
          data.sessions.some(
            (session) =>
              session.date === form.selectedDay &&
              session.participantIds.includes(participant.id),
          ),
      ),
    [data.participants, data.sessions, form.selectedDay],
  );
  return (
    <>
      <label>
        Jour
        <select
          required
          value={form.selectedDay}
          onChange={(event) =>
            setForm({
              ...form,
              selectedDay: event.target.value,
              participantId: "",
            })
          }
        >
          <option value="">Choisir</option>
          {days.map((day) => (
            <option key={day}>{day}</option>
          ))}
        </select>
      </label>
      <label>
        Participant
        <select
          required
          value={form.participantId}
          onChange={(event) =>
            setForm({ ...form, participantId: event.target.value })
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
      <label>
        Voie
        <select
          required
          value={form.voieId}
          onChange={(event) => setForm({ ...form, voieId: event.target.value })}
        >
          <option value="">Choisir</option>
          {data.routes
            .filter((route) => route.active)
            .map((route) => (
              <option key={route.id} value={route.id}>
                {route.cotationAjustee} ·{" "}
                {route.nomVoie || route.numeroVoieUnique}
              </option>
            ))}
        </select>
      </label>
      <label>
        Style
        <select
          value={form.styleRealisation}
          onChange={(event) =>
            setForm({ ...form, styleRealisation: event.target.value })
          }
        >
          {Object.entries(ACHIEVEMENT_STYLES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Cotation proposée
        <select
          value={form.cotationProposee}
          onChange={(event) =>
            setForm({ ...form, cotationProposee: event.target.value })
          }
        >
          <option value="">Aucune</option>
          {GRADES.map((grade) => (
            <option key={grade}>{grade}</option>
          ))}
        </select>
      </label>
      <label>
        Nombre d’essais
        <input
          type="number"
          min="1"
          value={form.nbEssais}
          onChange={(event) =>
            setForm({ ...form, nbEssais: event.target.value })
          }
        />
      </label>
      <label className="wide">
        Commentaire
        <input
          value={form.commentaire}
          onChange={(event) =>
            setForm({ ...form, commentaire: event.target.value })
          }
        />
      </label>
    </>
  );
}
