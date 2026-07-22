import { useMemo, useState } from "react";
import { EMPTY_PARTICIPANT } from "../config/constants";
import { useClimbData } from "../data/data-context";
import {
  downloadData,
  exportData,
  importData as persistImport,
} from "../data/data-transfer";
import { isAppData } from "../data/default-data";
import { useParticipantActions } from "../data/use-participant-actions";
import type { NewParticipant } from "../domain/types";
import { fullName } from "../lib/presentation";
import { ParticipantForm } from "./participant-form";
import { ParticipantRow } from "./participant-row";

export function AdministrationView() {
  const { data, setData, setSyncStatus } = useClimbData();
  const actions = useParticipantActions();
  const [form, setForm] = useState<NewParticipant>({ ...EMPTY_PARTICIPANT });
  const [feedback, setFeedback] = useState("");
  const participants = useMemo(
    () =>
      [...data.participants].sort((a, b) =>
        fullName(a).localeCompare(fullName(b), "fr"),
      ),
    [data.participants],
  );

  async function add(): Promise<void> {
    try {
      setForm(await actions.addParticipant(form));
      setFeedback("Participant ajouté.");
    } catch (reason) {
      setFeedback(
        reason instanceof Error ? reason.message : "Ajout impossible",
      );
    }
  }

  async function importData(file: File): Promise<void> {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isAppData(parsed)) throw new Error("Format de fichier invalide");
      const synchronized = await persistImport(parsed);
      setData(synchronized);
      setSyncStatus("Import synchronisé");
      setFeedback("Import terminé.");
    } catch (reason) {
      setFeedback(
        reason instanceof Error ? reason.message : "Import impossible",
      );
    }
  }

  async function downloadExport(): Promise<void> {
    try {
      downloadData(await exportData(data));
      setFeedback("Export terminé.");
    } catch (reason) {
      setFeedback(
        reason instanceof Error ? reason.message : "Export impossible",
      );
    }
  }

  return (
    <>
      <section className="card">
        <div className="card-header">
          <h2>Ajouter un participant</h2>
          <span className="badge">{data.participants.length}</span>
        </div>
        <ParticipantForm
          value={form}
          setValue={setForm}
          onSubmit={() => void add()}
        />
        {feedback && <p className="small">{feedback}</p>}
      </section>
      <section className="card">
        <div className="card-header">
          <h2>Données</h2>
          <div className="button-group">
            <button
              type="button"
              className="secondary"
              onClick={() => void downloadExport()}
            >
              Exporter
            </button>
            <label className="file-button">
              Importer
              <input
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importData(file);
                }}
              />
            </label>
          </div>
        </div>
      </section>
      <section className="card stack">
        <h2>Participants</h2>
        {participants.map((participant) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            onSave={actions.updateParticipant}
            onDelete={actions.deleteParticipant}
          />
        ))}
      </section>
    </>
  );
}
