import React, { useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";

const BOOLEAN_KEYS = new Set(["cotisation","ffme","canEncadrer","canReferer","canAdmin","initiateurSae","initiateurSne"]);
const COLUMNS = [
  ["nom","Nom"],["prenom","Prénom"],["email","E-mail"],["sexe","Sexe"],["passport","Passeport"],
  ["cotisation","Cotisation"],["ffme","FFME"],["canEncadrer","Encadrant"],["canReferer","Référent"],
  ["canAdmin","Administrateur"],["initiateurSae","Initiateur SAE"],["initiateurSne","Initiateur SNE"],
];
const PASSPORTS = ["sans","decouverte","jaune","orange","vert","bleu"];

function yesNo(value) { return value ? "Oui" : "Non"; }
function display(p,key) {
  if (BOOLEAN_KEYS.has(key)) return yesNo(Boolean(p[key]));
  if (key === "sexe") return p[key] === "h" ? "H" : p[key] === "f" ? "F" : "";
  return p[key] ?? "";
}

export default function DonneesUtilisateurs({ participants = [], onSaved, newParticipant, setNewParticipant, addParticipant }) {
  const [sortKey, setSortKey] = useState("nom");
  const [ascending, setAscending] = useState(true);
  const [filters, setFilters] = useState({});
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(() => participants.filter((p) =>
    COLUMNS.every(([key]) => {
      const q = String(filters[key] ?? "").trim().toLocaleLowerCase("fr");
      return !q || String(display(p,key)).toLocaleLowerCase("fr").includes(q);
    })
  ).slice().sort((a,b) => String(display(a,sortKey)).localeCompare(String(display(b,sortKey)), "fr", {numeric:true}) * (ascending ? 1 : -1)),
  [participants, filters, sortKey, ascending]);

  function draftFor(p) { return drafts[p.id] || p; }
  function setField(p,key,value) {
    setDrafts(current => ({...current,[p.id]:{...p,...(current[p.id] || {}),[key]:value}}));
    setMessage(""); setError("");
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
    const d=draftFor(p), value=d[key];
    if (BOOLEAN_KEYS.has(key)) return <input type="checkbox" checked={Boolean(value)} onChange={e=>setField(p,key,e.target.checked)} aria-label={`${COLUMNS.find(c=>c[0]===key)?.[1]} ${p.prenom} ${p.nom}`} />;
    if (key==="sexe") return <select value={value||""} onChange={e=>setField(p,key,e.target.value)}><option value="">-</option><option value="h">H</option><option value="f">F</option></select>;
    if (key==="passport") return <select value={value||"sans"} onChange={e=>setField(p,key,e.target.value)}>{PASSPORTS.map(v=><option key={v} value={v}>{v}</option>)}</select>;
    return <input value={value??""} onChange={e=>setField(p,key,e.target.value)} style={{minWidth:key==="email"?190:110}} />;
  }
  function exportCsv() {
    const quote=v=>`"${String(v??"").replaceAll('"','""')}"`;
    const csv=[COLUMNS.map(([,label])=>quote(label)).join(";"),...rows.map(p=>COLUMNS.map(([key])=>quote(display(draftFor(p),key))).join(";"))].join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download="utilisateurs-climbcrew.csv"; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="card">
    {newParticipant && setNewParticipant && addParticipant && <details className="subcard" open style={{marginBottom:12}}>
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
    <div style={{overflow:"auto",maxHeight:"70vh",border:"1px solid var(--border, #bbb)",borderRadius:8}}>
      <table style={{borderCollapse:"collapse",width:"max-content",minWidth:"100%",background:"var(--surface, white)"}}>
        <thead style={{position:"sticky",top:0,zIndex:2}}>
          <tr>{COLUMNS.map(([key,label])=><th key={key} style={{padding:"8px 10px",whiteSpace:"nowrap",border:"1px solid #bbb",background:"var(--card-bg, #eee)",cursor:"pointer"}}
            onClick={()=>{if(sortKey===key)setAscending(v=>!v);else{setSortKey(key);setAscending(true);}}}>{label}{sortKey===key?(ascending?" ▲":" ▼"):""}</th>)}<th>Action</th></tr>
          <tr>{COLUMNS.map(([key,label])=><th key={key} style={{padding:4,background:"var(--card-bg, #eee)",border:"1px solid #bbb"}}>
            <input aria-label={`Filtrer ${label}`} placeholder="Filtrer…" value={filters[key]||""} onChange={e=>setFilters(v=>({...v,[key]:e.target.value}))} onClick={e=>e.stopPropagation()} style={{width:"100%",minWidth:80}} />
          </th>)}<th style={{background:"var(--card-bg, #eee)",border:"1px solid #bbb"}}><button type="button" onClick={()=>setFilters({})}>Effacer</button></th></tr>
        </thead>
        <tbody>{rows.map(p=><tr key={p.id}>{COLUMNS.map(([key])=><td key={key} style={{padding:"5px",whiteSpace:"nowrap",border:"1px solid #ccc"}}>{editor(p,key)}</td>)}
          <td style={{padding:5,border:"1px solid #ccc"}}><button type="button" disabled={!drafts[p.id] || savingId===p.id} onClick={()=>save(p)}>{savingId===p.id?"Enregistrement…":"Enregistrer"}</button></td></tr>)}</tbody>
      </table>
    </div>
  </div>;
}
