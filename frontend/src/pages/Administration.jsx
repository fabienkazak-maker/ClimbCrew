import React, { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import { API_BASE, apiFetch, readCookie } from "../lib/api.js";
import { fullName } from "../lib/domain.js";

function formatBackupSize(bytes) {
  const size = Number(bytes || 0);
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

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
  publishBroadcastMessage,
}) {
  const [broadcastDraft, setBroadcastDraft] = useState({ title: "", body: "" });
  const [broadcastStatus, setBroadcastStatus] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [backups, setBackups] = useState([]);
  const [backupConfig, setBackupConfig] = useState(null);
  const [backupStatus, setBackupStatus] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);

  async function loadBackups() {
    const result = await apiFetch("/admin/backups");
    setBackups(result.backups || []);
    setBackupConfig(result.config || null);
  }

  useEffect(() => {
    if (!adminUnlocked) return;
    loadBackups().catch((error) => setBackupStatus(`Sauvegardes indisponibles : ${error.message || error}`));
  }, [adminUnlocked]);

  async function createBackupNow() {
    try {
      setBackupBusy(true);
      setBackupStatus("Sauvegarde PostgreSQL en cours…");
      const result = await apiFetch("/admin/backups", {
        method: "POST",
        body: JSON.stringify({ sendEmail: true }),
      });
      const backup = result.backup || {};
      setBackupStatus(
        backup.emailSent
          ? `Sauvegarde ${backup.fileName} créée localement et envoyée par e-mail.`
          : `Sauvegarde ${backup.fileName} créée localement. L’envoi e-mail n’a pas abouti${backup.emailError ? ` : ${backup.emailError}` : "."}`,
      );
      await loadBackups();
    } catch (error) {
      setBackupStatus(`Sauvegarde impossible : ${error.message || error}`);
    } finally {
      setBackupBusy(false);
    }
  }

  async function sendBackupAgain(fileName) {
    try {
      setBackupBusy(true);
      setBackupStatus(`Envoi de ${fileName}…`);
      await apiFetch(`/admin/backups/${encodeURIComponent(fileName)}/email`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setBackupStatus(`${fileName} envoyé à ${backupConfig?.recipient || "l’adresse de sauvegarde"}.`);
      await loadBackups();
    } catch (error) {
      setBackupStatus(`Envoi impossible : ${error.message || error}`);
    } finally {
      setBackupBusy(false);
    }
  }

  async function importDatabaseBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setBackupBusy(true);
      setBackupStatus(`Vérification et import local de ${file.name}…`);
      const response = await fetch(`${API_BASE}/admin/backups/import?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-CSRF-Token": readCookie("climbcrew_csrf"),
        },
        body: file,
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text || `Erreur API ${response.status}`);
      const result = JSON.parse(text);
      setBackupStatus(`Sauvegarde importée et vérifiée : ${result.backup?.fileName}. Elle peut maintenant être restaurée.`);
      await loadBackups();
    } catch (error) {
      setBackupStatus(`Import impossible : ${error.message || error}`);
    } finally {
      setBackupBusy(false);
    }
  }

  async function restoreDatabaseBackup(fileName) {
    const accepted = window.confirm(
      `Restaurer ${fileName} ?\n\nLa base actuelle sera d’abord sauvegardée automatiquement. Ensuite toutes les données seront remplacées par la sauvegarde choisie et toutes les sessions utilisateur seront déconnectées.`,
    );
    if (!accepted) return;
    const confirmation = window.prompt("Pour confirmer la restauration, saisir exactement : RESTAURER");
    if (confirmation !== "RESTAURER") {
      setBackupStatus("Restauration annulée : confirmation incorrecte.");
      return;
    }

    try {
      setBackupBusy(true);
      setBackupStatus(`Restauration de ${fileName}… Ne pas fermer cette page.`);
      const result = await apiFetch(`/admin/backups/${encodeURIComponent(fileName)}/restore`, {
        method: "POST",
        body: JSON.stringify({ confirm: "RESTAURER" }),
      });
      setBackupStatus(`${result.message || "Restauration terminée."} Reconnexion dans quelques secondes…`);
      setTimeout(() => window.location.reload(), 6000);
    } catch (error) {
      setBackupStatus(`Restauration impossible : ${error.message || error}`);
      setBackupBusy(false);
    }
  }

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
      <AdminSection
        title="Sauvegardes serveur"
        summary={`${backups.length} sauvegarde${backups.length > 1 ? "s" : ""} locale${backups.length > 1 ? "s" : ""}`}
      >
        <div className="small" style={{ marginBottom: 10 }}>
          Sauvegarde PostgreSQL automatique tous les jours à {String(backupConfig?.hour ?? 3).padStart(2, "0")}:00 ({backupConfig?.timezone || "Europe/Paris"}).
          {` La sauvegarde du lundi est envoyée à ${backupConfig?.recipient || "cristal.climbcrew@gmail.com"}.`}
        </div>
        <div className="group" style={{ marginBottom: 12 }}>
          <Button onClick={createBackupNow} disabled={backupBusy}>Sauvegarder maintenant</Button>
          <Button variant="secondary" onClick={loadBackups} disabled={backupBusy}>Actualiser la liste</Button>
          <label className="pill" style={{ cursor: backupBusy ? "default" : "pointer", opacity: backupBusy ? 0.6 : 1 }}>
            Importer une sauvegarde .dump
            <input
              type="file"
              accept=".dump,application/octet-stream"
              disabled={backupBusy}
              style={{ display: "none" }}
              onChange={importDatabaseBackup}
            />
          </label>
        </div>

        <div className="small" style={{ marginBottom: 10 }}>
          Le bouton crée un dump complet local sur le serveur et l’envoie également par e-mail. Conservation locale : {backupConfig?.retentionDays || 35} jours.
        </div>

        {backupStatus && <div className="muted-box" style={{ marginBottom: 12 }}>{backupStatus}</div>}

        <div className="stack">
          {backups.length === 0 ? (
            <div className="small">Aucune sauvegarde locale disponible.</div>
          ) : backups.slice(0, 20).map((backup) => (
            <div className="subcard" key={backup.fileName}>
              <div className="card-header">
                <div>
                  <div style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{backup.fileName}</div>
                  <div className="small">
                    {formatBackupSize(backup.size)} · {backup.modifiedAt ? new Date(backup.modifiedAt).toLocaleString("fr-FR") : "date inconnue"}
                    {backup.emailed ? " · e-mail envoyé" : ""}
                  </div>
                </div>
                <div className="group">
                  <Button variant="secondary" onClick={() => sendBackupAgain(backup.fileName)} disabled={backupBusy}>Envoyer</Button>
                  <Button variant="danger" onClick={() => restoreDatabaseBackup(backup.fileName)} disabled={backupBusy}>Restaurer</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Diffuser un message">
        <div className="small" style={{ marginBottom: 12 }}>
          Le message sera présenté une seule fois à chaque utilisateur actif lors de sa prochaine utilisation de l’application.
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
      </AdminSection>

      <AdminSection title="Ajouter un participant">
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
      </AdminSection>

      <AdminSection
        title="Gestion des participants"
        summary={`${adminParticipants.length} participant${adminParticipants.length > 1 ? "s" : ""}`}
      >
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
      </AdminSection>

      <AdminSection title="Import / export">
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
