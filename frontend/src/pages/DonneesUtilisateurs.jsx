import React, { useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";

const BOOLEAN_KEYS = new Set(["cotisation","ffme","canEncadrer","canReferer","canAdmin","initiateurSae","initiateurSne"]);
const COLUMNS = [
  ["nom","Nom"],["prenom","Prénom"],["email","E-mail"],["sexe","Sexe"],["passport","Passeport"],
  ["cotisation","Cotisation"],["ffme","FFME"],["canEncadrer","Encadrant"],["canReferer","Référent"],
  ["canAdmin","Administrateur"],["initiateurSae","Initiateur SAE"],["initiateurSne","Initiateur SNE"],["sessions","Séances"],
];
const PASSPORTS = ["sans","decouverte","jaune","orange","vert","bleu"];
const FILTER_CHOICES = {
  sexe: [["h","H"],["f","F"]],
  passport: PASSPORTS.map((value) => [value, value]),
};

function yesNo(value) { return value ? "Oui" : "Non"; }
function display(p,key) {
  if (BOOLEAN_KEYS.has(key)) return yesNo(Boolean(p[key]));
  if (key === "sexe") return p[key] === "h" ? "H" : p[key] === "f" ? "F" : "";
  return p[key] ?? "";
}

const COLUMN_WIDTHS = {
  nom: "8%",
  prenom: "8%",
  email: "18%",
  sexe: "4%",
  passport: "7%",
  cotisation: "5%",
  ffme: "4%",
  canEncadrer: "5%",
  canReferer: "5%",
  canAdmin: "6%",
  initiateurSae: "6%",
  initiateurSne: "6%",
  sessions: "5%",
};

function compactWidth(key) {
  return COLUMN_WIDTHS[key] || "6%";
}

function stickyColumnStyle(key, header = false) {
  if (key !== "nom" && key !== "prenom") return {};
  return {
    position: "sticky",
    left: key === "nom" ? 0 : COLUMN_WIDTHS.nom,
    zIndex: header ? 5 : 3,
    background: header ? "var(--card-bg, #eee)" : "var(--surface, white)",
    boxShadow: key === "prenom" ? "2px 0 0 var(--border, #bbb)" : undefined,
  };
}

export default function DonneesUtilisateurs({ participants = [], sessions = [], onSaved, newParticipant, setNewParticipant, addParticipant }) {
  const [sortKey, setSortKey] = useState("nom");
  const [ascending, setAscending] = useState(true);
  const [filters, setFilters] = useState({});
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const sessionCountByParticipantId = useMemo(() => {
    const counts = {};
    sessions.forEach((session) => {
      (session.participantIds || []).forEach((id) => { counts[String(id)] = (counts[String(id)] || 0) + 1; });
    });
    return counts;
  }, [sessions]);

  const valueFor = (p,key) => key === "sessions" ? (sessionCountByParticipantId[String(p.id)] || 0) : display(p,key);
  const rows = useMemo(() => participants.filter((p) =>
    COLUMNS.every(([key]) => {
      if (BOOLEAN_KEYS.has(key)) {
        const filter = filters[key];
        if (filter !== "oui" && filter !== "non") return true;
        return Boolean(p[key]) === (filter === "oui");
      }
      const q = String(filters[key] ?? "").trim().toLocaleLowerCase("fr");
      return !q || String(valueFor(p,key)).toLocaleLowerCase("fr").includes(q);
    })
  ).slice().sort((a,b) => String(valueFor(a,sortKey)).localeCompare(String(valueFor(b,sortKey)), "fr", {numeric:true}) * (ascending ? 1 : -1)),
  [participants, filters, sortKey, ascending, sessionCountByParticipantId]);

  function draftFor(p) { return drafts[p.id] || p; }
  function setField(p,key,value) {
    setDrafts(current => ({...current,[p.id]:{...p,...(current[p.id] || {}),[key]:value}}));
    setMessage(""); setError("");
  }
  async function removeParticipant(p) {
    const label = `${p.prenom || ""} ${p.nom || ""}`.trim() || "cet utilisateur";
    if (!window.confirm(`Supprimer ${label} ? Cette action est irréversible.`)) return;
    setSavingId(p.id); setMessage(""); setError("");
    try {
      await apiFetch(`/participants/${encodeURIComponent(p.id)}`, { method:"DELETE" });
      setDrafts(current => { const next={...current}; delete next[p.id]; return next; });
      if (onSaved) await onSaved();
      setMessage(`${label} supprimé.`);
    } catch (e) { setError(String(e.message || e)); }
    finally { setSavingId(null); }
  }
  async function save(p) {
    const d=draftFor(p);
    setSavingId(p.id); setMessage(""); setError("");
    try {
      await apiFetch(`/participants/${encodeURIComponent(p.id)}`, {
        method:"PUT",
        body:JSON.stringify({
          ...p,...d,
          nom:String(d.nom||"").trim(), prenom:String(d.prenom||"").trim(), email:String(d.email||"").trim(),
          sexe:d.sexe||"", passport:d.passport||"sans",
          cotisation:Boolean(d.cotisation), ffme:Boolean(d.ffme), canEncadrer:Boolean(d.canEncadrer),
          canReferer:Boolean(d.canReferer), canAdmin:Boolean(d.canAdmin),
        }),
      });
      if (Boolean(d.initiateurSae) !== Boolean(p.initiateurSae) || Boolean(d.initiateurSne) !== Boolean(p.initiateurSne)) {
        await apiFetch(`/admin/participants/${encodeURIComponent(p.id)}/qualifications`, {
          method:"PUT", body:JSON.stringify({initiateurSae:Boolean(d.initiateurSae),initiateurSne:Boolean(d.initiateurSne)}),
        });
      }
      setDrafts(current => { const next={...current}; delete next[p.id]; return next; });
      if (onSaved) await onSaved();
      setMessage(`${d.prenom} ${d.nom} enregistré.`);
    } catch (e) { setError(String(e.message || e)); }
    finally { setSavingId(null); }
  }
  function editor(p,key) {
    if (key === "sessions") return sessionCountByParticipantId[String(p.id)] || 0;
    const d=draftFor(p), value=d[key];
    if (BOOLEAN_KEYS.has(key)) return <input type="checkbox" checked={Boolean(value)} onChange={e=>setField(p,key,e.target.checked)} aria-label={`${COLUMNS.find(c=>c[0]===key)?.[1]} ${p.prenom} ${p.nom}`} />;
    if (key==="sexe") return <select value={value||""} onChange={e=>setField(p,key,e.target.value)} style={{width:"100%",minWidth:0,fontSize:"inherit",padding:"4px 2px"}}><option value="">-</option><option value="h">H</option><option value="f">F</option></select>;
    if (key==="passport") return <select value={value||"sans"} onChange={e=>setField(p,key,e.target.value)} style={{width:"100%",minWidth:0,fontSize:"inherit",padding:"4px 2px"}}>{PASSPORTS.map(v=><option key={v} value={v}>{v}</option>)}</select>;
    const text = String(value ?? "");
    return <input value={text} onChange={e=>setField(p,key,e.target.value)} style={{width:"100%",minWidth:0,boxSizing:"border-box",fontSize:"inherit",padding:"4px 5px"}} />;
  }
  function exportCsv() {
    const quote=v=>`"${String(v??"").replaceAll('"','""')}"`;
    const csv=[COLUMNS.map(([,label])=>quote(label)).join(";"),...rows.map(p=>COLUMNS.map(([key])=>quote(display(draftFor(p),key))).join(";"))].join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download="utilisateurs-climbcrew.csv"; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="card">
    {newParticipant && setNewParticipant && addParticipant && <details className="subcard" style={{marginBottom:12}}>
      <summary style={{cursor:"pointer",fontWeight:700}}>Nouvel utilisateur</summary>
      <div className="grid four" style={{marginTop:10}}>
        <div><label>Nom</label><input value={newParticipant.nom || ""} onChange={e=>setNewParticipant(p=>({...p,nom:e.target.value}))} /></div>
        <div><label>Prénom</label><input value={newParticipant.prenom || ""} onChange={e=>setNewParticipant(p=>({...p,prenom:e.target.value}))} /></div>
        <div><label>E-mail</label><input type="email" value={newParticipant.email || ""} onChange={e=>setNewParticipant(p=>({...p,email:e.target.value}))} /></div>
        <div><label>Passeport</label><select value={newParticipant.passport || "sans"} onChange={e=>setNewParticipant(p=>({...p,passport:e.target.value}))}>{PASSPORTS.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
        <div><label>Sexe</label><select value={newParticipant.sexe || ""} onChange={e=>setNewParticipant(p=>({...p,sexe:e.target.value}))}><option value="">-</option><option value="h">H</option><option value="f">F</option></select></div>
      </div>
      <div className="group" style={{marginTop:10}}>
        <label><input type="checkbox" checked={Boolean(newParticipant.cotisation)} onChange={e=>setNewParticipant(p=>({...p,cotisation:e.target.checked}))} /> Cotisation</label>
        <label><input type="checkbox" checked={Boolean(newParticipant.ffme)} onChange={e=>setNewParticipant(p=>({...p,ffme:e.target.checked}))} /> FFME</label>
        <label><input type="checkbox" checked={Boolean(newParticipant.canEncadrer)} onChange={e=>setNewParticipant(p=>({...p,canEncadrer:e.target.checked}))} /> Encadrant</label>
        <label><input type="checkbox" checked={Boolean(newParticipant.canReferer)} onChange={e=>setNewParticipant(p=>({...p,canReferer:e.target.checked}))} /> Référent</label>
        <label><input type="checkbox" checked={Boolean(newParticipant.canAdmin)} onChange={e=>setNewParticipant(p=>({...p,canAdmin:e.target.checked}))} /> Administrateur</label>
        <button type="button" onClick={addParticipant}>Ajouter l’utilisateur</button>
      </div>
    </details>}
    <div className="card-header"><div><h2>Données utilisateurs</h2><div className="small">{rows.length} utilisateur{rows.length>1?"s":""}</div></div>
      <button type="button" onClick={exportCsv}>Export CSV</button></div>
    {message && <div className="success" style={{marginBottom:10}}>{message}</div>}
    {error && <div className="error" style={{marginBottom:10}}>{error}</div>}
    <div style={{overflowY:"auto",overflowX:"hidden",maxHeight:"70vh",border:"1px solid var(--border, #bbb)",borderRadius:8}}>
      <table style={{borderCollapse:"collapse",width:"100%",tableLayout:"fixed",background:"var(--surface, white)",fontSize:"clamp(.68rem, .75vw, .82rem)"}}>
        <thead style={{position:"sticky",top:0,zIndex:10,background:"var(--card-bg, #eee)"}}>
          <tr>{COLUMNS.map(([key,label])=><th key={key} style={{padding:BOOLEAN_KEYS.has(key)?"5px 2px":"6px 3px",whiteSpace:"normal",overflowWrap:"anywhere",textAlign:"center",lineHeight:1.05,border:"1px solid #bbb",background:"var(--card-bg, #eee)",cursor:"pointer",width:compactWidth(key),...stickyColumnStyle(key,true)}}
            title={`Trier par ${label}`}
            onClick={()=>{if(sortKey===key)setAscending(v=>!v);else{setSortKey(key);setAscending(true);}}}>
              <span style={{display:"inline-flex",alignItems:"center",gap:4}}>{label}<span aria-hidden="true" style={{opacity:sortKey===key?1:.45,fontSize:".85em"}}>{sortKey===key?(ascending?"↑":"↓"):"↕"}</span></span>
            </th>)}<th style={{whiteSpace:"nowrap"}}>Action</th></tr>
          <tr>{COLUMNS.map(([key,label])=><th key={key} style={{padding:2,background:"var(--card-bg, #eee)",border:"1px solid #bbb",width:compactWidth(key),...stickyColumnStyle(key,true)}}>
            {BOOLEAN_KEYS.has(key)
              ? <select aria-label={`Filtrer ${label}`} value={filters[key] || ""} onChange={e=>setFilters(v=>({...v,[key]:e.target.value}))} onClick={e=>e.stopPropagation()} style={{width:"100%",minWidth:0,boxSizing:"border-box",fontSize:"inherit",padding:"3px 2px"}}>
                  <option value="">Tout</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              : FILTER_CHOICES[key]
                ? <select aria-label={`Filtrer ${label}`} value={filters[key] || ""} onChange={e=>setFilters(v=>({...v,[key]:e.target.value}))} onClick={e=>e.stopPropagation()} style={{width:"100%",minWidth:0,boxSizing:"border-box",fontSize:"inherit",padding:"3px 2px"}}>
                    <option value="">Tous</option>{FILTER_CHOICES[key].map(([value,text])=><option key={value} value={value}>{text}</option>)}
                  </select>
                : <input aria-label={`Filtrer ${label}`} placeholder="Filtrer" value={filters[key]||""} onChange={e=>setFilters(v=>({...v,[key]:e.target.value}))} onClick={e=>e.stopPropagation()} style={{width:"100%",minWidth:0,boxSizing:"border-box",fontSize:"inherit",padding:"3px 2px"}} />}
          </th>)}<th style={{background:"var(--card-bg, #eee)",border:"1px solid #bbb",width:"12%"}}><button type="button" onClick={()=>setFilters({})} style={{width:"100%",padding:"4px 2px",fontSize:"inherit"}}>Effacer</button></th></tr>
        </thead>
        <tbody>{rows.map(p=><tr key={p.id}>{COLUMNS.map(([key])=><td key={key} style={{padding:(BOOLEAN_KEYS.has(key) || key==="sessions")?"2px":"3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textAlign:(BOOLEAN_KEYS.has(key) || key==="sessions")?"center":"left",border:"1px solid #ccc",width:compactWidth(key),...stickyColumnStyle(key,false)}}>{editor(p,key)}</td>)}
          <td style={{padding:2,border:"1px solid #ccc",width:"12%"}}><div style={{display:"grid",gridTemplateColumns:"1fr",gap:3}}><button type="button" disabled={!drafts[p.id] || savingId===p.id} onClick={()=>save(p)} style={{padding:"4px 2px",fontSize:"inherit",minWidth:0}}>{savingId===p.id?"Enregistrement…":"Enregistrer"}</button><button type="button" className="danger" disabled={savingId===p.id} onClick={()=>removeParticipant(p)} style={{padding:"4px 2px",fontSize:"inherit",minWidth:0}}>Supprimer</button></div></td></tr>)}</tbody>
      </table>
    </div>
  </div>;
}
