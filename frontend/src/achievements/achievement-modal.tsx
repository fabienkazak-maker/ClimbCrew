import { useState } from "react";
import { EMPTY_ACHIEVEMENT } from "../config/constants";
import { useClimbData } from "../data/data-context";
import type { NewAchievement } from "../domain/types";
import { AchievementFields } from "./achievement-fields";
import { useAchievementActions } from "./use-achievement-actions";

interface AchievementModalProps {
  initialRouteId?: string;
  onClose(): void;
}

export function AchievementModal({
  initialRouteId = "",
  onClose,
}: AchievementModalProps) {
  const { data } = useClimbData();
  const actions = useAchievementActions();
  const [form, setForm] = useState<NewAchievement>({
    ...EMPTY_ACHIEVEMENT,
    voieId: initialRouteId,
  });
  const [error, setError] = useState("");

  async function submit(): Promise<void> {
    try {
      await actions.addAchievement(form);
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Enregistrement impossible",
      );
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true">
        <div className="card-header">
          <h2>Nouvelle réalisation</h2>
          <button type="button" className="ghost" onClick={onClose}>
            Fermer
          </button>
        </div>
        <form
          className="grid-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <AchievementFields data={data} form={form} setForm={setForm} />
          {error && <p className="error wide">{error}</p>}
          <button type="submit">Enregistrer</button>
        </form>
      </section>
    </div>
  );
}
