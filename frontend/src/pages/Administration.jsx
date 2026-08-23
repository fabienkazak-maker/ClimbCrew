import React from "react";
import Button from "../components/Button.jsx";
import { fullName } from "../lib/domain.js";

function AdminSection({ title, summary, children }) {
  return (
    <details className="card admin-section-details">
      <summary
        className="card-header"
        style={{ cursor: "pointer", userSelect: "none", marginBottom: 0 }}
      >
        <div>
          <h2>{title}</h2>
          {summary ? <div className="small">{summary}</div> : null}
        </div>
      </summary>
      <div style={{ marginTop: 12 }}>
        {children}
      </div>
    </details>
  );
}

export default function Administration({
  adminUnlocked,
  adminInput,
  setAdminInput,
  unlockAdmin,
  adminError,
  newParticipant,
  setNewParticipant,
  addParticipant,
  adminParticipants,
  updateParticipant,
  deleteParticipant,
  exportAllData,
  importJsonFile,
  importMessage,
}) {
  if (!adminUnlocked) {
    return (
      <div className="card">
        <div className="card-header"><h2>Accès administration</h2></div>
        <div className="grid two">
          <div>
            <label>Code administrateur</label>
            <input
              type="password"
              maxLength={8}
              value={adminInput}
              onChange={(event) => setAdminInput(event.target.value.replace(/\D/g, "").slice(0, 8))}
            />
          </div>
          <div style={{ display: "flex", alignItems: "end" }}>
            <Button onClick={unlockAdmin}>Déverrouiller</Button>
          </div>
        </div>
        {adminError && <div className="error" style={{ marginTop: 10 }}>{adminError}</div>}
      </div>
    );
  }

  return (
    <>
      <AdminSection title="Ajouter un participant">
        <div className="grid four">
          <div>
            <label>Nom</label>
            <input
              value={newParticipant.nom}
              onChange={(event) => setNewParticipant((participant) => ({ ...participant, nom: event.target.value }))}
            />
          </div>
          <div>
            <label>Prénom</label>
            <input
              value={newParticipant.prenom}
              onChange={(event) => setNewParticipant((participant) => ({ ...participant, prenom: event.target.value }))}
            />
          </div>
          <div>
            <label>Adresse e-mail</label>
            <input
              type="email"
              value={newParticipant.email}
              onChange={(event) => setNewParticipant((participant) => ({ ...participant, email: event.target.value }))}
            />
          </div>
          <div>
            <label>Passeport</label>
            <select
              value={newParticipant.passport}
              onChange={(event) => setNewParticipant((participant) => ({ ...participant, passport: event.target.value }))}
            >
              <option value="sans">Sans</option>
              <option value="jaune">Jaune</option>
              <option value="orange">Orange</option>
              <option value="vert">Vert</option>
              <option value="bleu">Bleu</option>
              <option value="decouverte">Découverte</option>
            </select>
          </div>
          <div>
            <label>Sexe</label>
            <div className="group">
              <label><input type="radio" name="new-participant-sexe" checked={newParticipant.sexe === "h"} onChange={() => setNewParticipant((participant) => ({ ...participant, sexe: "h" }))} /> H</label>
              <label><input type="radio" name="new-participant-sexe" checked={newParticipant.sexe === "f"} onChange={() => setNewParticipant((participant) => ({ ...participant, sexe: "f" }))} /> F</label>
              <label><input type="radio" name="new-participant-sexe" checked={!newParticipant.sexe} onChange={() => setNewParticipant((participant) => ({ ...participant, sexe: "" }))} /> Non précisé</label>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "end" }}>
            <Button onClick={addParticipant}>Ajouter</Button>
          </div>
        </div>
        <div className="group" style={{ marginTop: 12 }}>
          <label><input type="checkbox" checked={newParticipant.cotisation} onChange={(event) => setNewParticipant((participant) => ({ ...participant, cotisation: event.target.checked }))} /> Cotisation</label>
          <label><input type="checkbox" checked={newParticipant.ffme} onChange={(event) => setNewParticipant((participant) => ({ ...participant, ffme: event.target.checked }))} /> FFME</label>
          <label><input type="checkbox" checked={newParticipant.canEncadrer} onChange={(event) => setNewParticipant((participant) => ({ ...participant, canEncadrer: event.target.checked }))} /> Encadrant</label>
          <label><input type="checkbox" checked={newParticipant.canReferer} onChange={(event) => setNewParticipant((participant) => ({ ...participant, canReferer: event.target.checked }))} /> Référent</label>
          <label><input type="checkbox" checked={newParticipant.canAdmin} onChange={(event) => setNewParticipant((participant) => ({ ...participant, canAdmin: event.target.checked }))} /> Administrateur</label>
        </div>
      </AdminSection>

      <AdminSection
        title="Gestion des participants"
        summary={`${adminParticipants.length} participant${adminParticipants.length > 1 ? "s" : ""}`}
      >
        <div className="stack">
          {adminParticipants.map((participant) => (
            <details className="subcard participant-admin-details" key={participant.id}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                {fullName(participant)}
              </summary>
              <div className="grid four" style={{ marginTop: 10 }}>
                <div><label>Nom</label><input value={participant.nom} onChange={(event) => updateParticipant(participant.id, { nom: event.target.value })} /></div>
                <div><label>Prénom</label><input value={participant.prenom} onChange={(event) => updateParticipant(participant.id, { prenom: event.target.value })} /></div>
                <div><label>Adresse e-mail</label><input type="email" value={participant.email || ""} onChange={(event) => updateParticipant(participant.id, { email: event.target.value })} /></div>
                <div>
                  <label>Passeport</label>
                  <select value={participant.passport} onChange={(event) => updateParticipant(participant.id, { passport: event.target.value })}>
                    <option value="sans">Sans</option>
                    <option value="jaune">Jaune</option>
                    <option value="orange">Orange</option>
                    <option value="vert">Vert</option>
                    <option value="bleu">Bleu</option>
                    <option value="decouverte">Découverte</option>
                  </select>
                </div>
                <div>
                  <label>Sexe</label>
                  <div className="group">
                    <label><input type="radio" name={`participant-sexe-${participant.id}`} checked={participant.sexe === "h"} onChange={() => updateParticipant(participant.id, { sexe: "h" })} /> H</label>
                    <label><input type="radio" name={`participant-sexe-${participant.id}`} checked={participant.sexe === "f"} onChange={() => updateParticipant(participant.id, { sexe: "f" })} /> F</label>
                    <label><input type="radio" name={`participant-sexe-${participant.id}`} checked={!participant.sexe} onChange={() => updateParticipant(participant.id, { sexe: "" })} /> Non précisé</label>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "end" }}>
                  <Button variant="danger" onClick={() => deleteParticipant(participant.id)}>Supprimer</Button>
                </div>
              </div>
              <div className="group" style={{ marginTop: 12 }}>
                <label><input type="checkbox" checked={participant.cotisation} onChange={(event) => updateParticipant(participant.id, { cotisation: event.target.checked })} /> Cotisation</label>
                <label><input type="checkbox" checked={participant.ffme} onChange={(event) => updateParticipant(participant.id, { ffme: event.target.checked })} /> FFME</label>
                <label><input type="checkbox" checked={participant.canEncadrer} onChange={(event) => updateParticipant(participant.id, { canEncadrer: event.target.checked })} /> Encadrant</label>
                <label><input type="checkbox" checked={participant.canReferer} onChange={(event) => updateParticipant(participant.id, { canReferer: event.target.checked })} /> Référent</label>
                <label><input type="checkbox" checked={Boolean(participant.canAdmin)} onChange={(event) => updateParticipant(participant.id, { canAdmin: event.target.checked })} /> Administrateur</label>
              </div>
            </details>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Import / export des données métier">
        <div className="group">
          <Button variant="secondary" onClick={exportAllData}>Export JSON</Button>
          <label className="pill" style={{ cursor: "pointer" }}>
            Import JSON
            <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={importJsonFile} />
          </label>
        </div>
        {importMessage && <div className="success" style={{ marginTop: 10 }}>{importMessage}</div>}
      </AdminSection>
    </>
  );
}
