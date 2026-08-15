import React, { useState } from "react";
import Button from "../components/Button.jsx";
import { fullName } from "../lib/domain.js";

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
  publishBroadcastMessage,
}) {
  const [broadcastDraft, setBroadcastDraft] = useState({ title: "", body: "" });
  const [broadcastStatus, setBroadcastStatus] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);

  async function sendBroadcastMessage() {
    const title = broadcastDraft.title.trim();
    const body = broadcastDraft.body.trim();
    if (title.length < 3 || body.length < 3) {
      setBroadcastStatus("Le titre et le message doivent contenir au moins 3 caractères.");
      return;
    }

    try {
      setBroadcastSending(true);
      setBroadcastStatus("");
      const result = await publishBroadcastMessage({ title, body });
      setBroadcastDraft({ title: "", body: "" });
      setBroadcastStatus(`Message diffusé à ${result.recipientCount || 0} utilisateur${result.recipientCount > 1 ? "s" : ""}.`);
    } catch (error) {
      setBroadcastStatus(`Diffusion impossible : ${error.message || error}`);
    } finally {
      setBroadcastSending(false);
    }
  }

  if (!adminUnlocked) {
    return (
      <div className="card">
        <div className="card-header"><h2>Accès administration</h2></div>
        <div className="grid two">
          <div>
            <label>Code administrateur</label>
            <input type="password" maxLength={8} value={adminInput} onChange={(e) => setAdminInput(e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </div>
          <div style={{ display: "flex", alignItems: "end" }}><Button onClick={unlockAdmin}>Déverrouiller</Button></div>
        </div>
        {adminError && <div className="error" style={{ marginTop: 10 }}>{adminError}</div>}
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Diffuser un message</h2>
            <div className="small">Le message sera présenté une seule fois à chaque utilisateur actif lors de sa prochaine utilisation de l’application.</div>
          </div>
        </div>
        <div className="stack">
          <div>
            <label htmlFor="broadcast-title">Titre</label>
            <input
              id="broadcast-title"
              maxLength={120}
              value={broadcastDraft.title}
              onChange={(event) => setBroadcastDraft((draft) => ({ ...draft, title: event.target.value }))}
              placeholder="Ex. Information importante"
            />
          </div>
          <div>
            <label htmlFor="broadcast-body">Message</label>
            <textarea
              id="broadcast-body"
              rows={5}
              maxLength={2000}
              value={broadcastDraft.body}
              onChange={(event) => setBroadcastDraft((draft) => ({ ...draft, body: event.target.value }))}
              placeholder="Saisir le message qui sera affiché aux utilisateurs…"
            />
            <div className="small">{broadcastDraft.body.length} / 2 000 caractères</div>
          </div>
          <div className="group" style={{ justifyContent: "space-between" }}>
            {broadcastStatus ? <div className="small">{broadcastStatus}</div> : <span />}
            <Button onClick={sendBroadcastMessage} disabled={broadcastSending}>
              {broadcastSending ? "Diffusion…" : "Diffuser"}
            </Button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Ajouter un participant</h2></div>
        <div className="grid four">
          <div><label>Nom</label><input value={newParticipant.nom} onChange={(e) => setNewParticipant((p) => ({ ...p, nom: e.target.value }))} /></div>
          <div><label>Prénom</label><input value={newParticipant.prenom} onChange={(e) => setNewParticipant((p) => ({ ...p, prenom: e.target.value }))} /></div>
          <div><label>Adresse e-mail</label><input type="email" value={newParticipant.email} onChange={(e) => setNewParticipant((p) => ({ ...p, email: e.target.value }))} /></div>
          <div><label>Passeport</label><select value={newParticipant.passport} onChange={(e) => setNewParticipant((p) => ({ ...p, passport: e.target.value }))}><option value="sans">Sans</option><option value="jaune">Jaune</option><option value="orange">Orange</option><option value="vert">Vert</option><option value="bleu">Bleu</option><option value="decouverte">Découverte</option></select></div>
          <div><label>Sexe</label><div className="group"><label><input type="radio" name="new-participant-sexe" checked={newParticipant.sexe === "h"} onChange={() => setNewParticipant((p) => ({ ...p, sexe: "h" }))} /> H</label><label><input type="radio" name="new-participant-sexe" checked={newParticipant.sexe === "f"} onChange={() => setNewParticipant((p) => ({ ...p, sexe: "f" }))} /> F</label><label><input type="radio" name="new-participant-sexe" checked={!newParticipant.sexe} onChange={() => setNewParticipant((p) => ({ ...p, sexe: "" }))} /> Non précisé</label></div></div>
          <div style={{ display: "flex", alignItems: "end" }}><Button onClick={addParticipant}>Ajouter</Button></div>
        </div>
        <div className="group" style={{ marginTop: 12 }}>
          <label><input type="checkbox" checked={newParticipant.cotisation} onChange={(e) => setNewParticipant((p) => ({ ...p, cotisation: e.target.checked }))} /> Cotisation</label>
          <label><input type="checkbox" checked={newParticipant.ffme} onChange={(e) => setNewParticipant((p) => ({ ...p, ffme: e.target.checked }))} /> FFME</label>
          <label><input type="checkbox" checked={newParticipant.canEncadrer} onChange={(e) => setNewParticipant((p) => ({ ...p, canEncadrer: e.target.checked }))} /> Encadrant</label>
          <label><input type="checkbox" checked={newParticipant.canReferer} onChange={(e) => setNewParticipant((p) => ({ ...p, canReferer: e.target.checked }))} /> Référent</label>
          <label><input type="checkbox" checked={newParticipant.canAdmin} onChange={(e) => setNewParticipant((p) => ({ ...p, canAdmin: e.target.checked }))} /> Administrateur</label>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Gestion des participants</h2></div>
        <div className="stack">
          {adminParticipants.map((p) => (
            <details className="subcard participant-admin-details" key={p.id}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                {fullName(p)}
              </summary>
              <div className="grid four" style={{ marginTop: 10 }}>
                <div><label>Nom</label><input value={p.nom} onChange={(e) => updateParticipant(p.id, { nom: e.target.value })} /></div>
                <div><label>Prénom</label><input value={p.prenom} onChange={(e) => updateParticipant(p.id, { prenom: e.target.value })} /></div>
                <div><label>Adresse e-mail</label><input type="email" value={p.email || ""} onChange={(e) => updateParticipant(p.id, { email: e.target.value })} /></div>
                <div><label>Passeport</label><select value={p.passport} onChange={(e) => updateParticipant(p.id, { passport: e.target.value })}><option value="sans">Sans</option><option value="jaune">Jaune</option><option value="orange">Orange</option><option value="vert">Vert</option><option value="bleu">Bleu</option><option value="decouverte">Découverte</option></select></div>
                <div><label>Sexe</label><div className="group"><label><input type="radio" name={`participant-sexe-${p.id}`} checked={p.sexe === "h"} onChange={() => updateParticipant(p.id, { sexe: "h" })} /> H</label><label><input type="radio" name={`participant-sexe-${p.id}`} checked={p.sexe === "f"} onChange={() => updateParticipant(p.id, { sexe: "f" })} /> F</label><label><input type="radio" name={`participant-sexe-${p.id}`} checked={!p.sexe} onChange={() => updateParticipant(p.id, { sexe: "" })} /> Non précisé</label></div></div>
                <div style={{ display: "flex", alignItems: "end" }}><Button variant="danger" onClick={() => deleteParticipant(p.id)}>Supprimer</Button></div>
              </div>
              <div className="group" style={{ marginTop: 12 }}>
                <label><input type="checkbox" checked={p.cotisation} onChange={(e) => updateParticipant(p.id, { cotisation: e.target.checked })} /> Cotisation</label>
                <label><input type="checkbox" checked={p.ffme} onChange={(e) => updateParticipant(p.id, { ffme: e.target.checked })} /> FFME</label>
                <label><input type="checkbox" checked={p.canEncadrer} onChange={(e) => updateParticipant(p.id, { canEncadrer: e.target.checked })} /> Encadrant</label>
                <label><input type="checkbox" checked={p.canReferer} onChange={(e) => updateParticipant(p.id, { canReferer: e.target.checked })} /> Référent</label>
                <label><input type="checkbox" checked={Boolean(p.canAdmin)} onChange={(e) => updateParticipant(p.id, { canAdmin: e.target.checked })} /> Administrateur</label>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Import / export</h2></div>
        <div className="group">
          <Button variant="secondary" onClick={exportAllData}>Export JSON</Button>
          <label className="pill" style={{ cursor: "pointer" }}>
            Import JSON
            <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={importJsonFile} />
          </label>
        </div>
        {importMessage && <div className="success" style={{ marginTop: 10 }}>{importMessage}</div>}
      </div>
    </>
  );
}
