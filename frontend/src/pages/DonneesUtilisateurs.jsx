import React, { useMemo, useState } from "react";

function yesNo(value) { return value ? "Oui" : "Non"; }

export default function DonneesUtilisateurs({ participants = [] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("nom");
  const [ascending, setAscending] = useState(true);

  const columns = [
    ["nom","Nom"],["prenom","Prénom"],["email","E-mail"],["sexe","Sexe"],["passport","Passeport"],
    ["cotisation","Cotisation"],["ffme","FFME"],["canEncadrer","Encadrant"],["canReferer","Référent"],
    ["canAdmin","Administrateur"],["initiateurSae","Initiateur SAE"],["initiateurSne","Initiateur SNE"],
  ];
  const rows = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("fr");
    return participants.filter(p => !q || columns.some(([key]) => String(p[key] ?? "").toLocaleLowerCase("fr").includes(q)))
      .slice().sort((a,b) => String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), "fr", {numeric:true}) * (ascending ? 1 : -1));
  }, [participants, search, sortKey, ascending]);

  function display(p,key) {
    if (["cotisation","ffme","canEncadrer","canReferer","canAdmin","initiateurSae","initiateurSne"].includes(key)) return yesNo(Boolean(p[key]));
    if (key === "sexe") return p[key] === "h" ? "H" : p[key] === "f" ? "F" : "";
    return p[key] ?? "";
  }
  function exportCsv() {
    const quote=v=>`"${String(v??"").replaceAll('"','""')}"`;
    const csv=[columns.map(([,label])=>quote(label)).join(";"),...rows.map(p=>columns.map(([key])=>quote(display(p,key))).join(";"))].join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download="utilisateurs-climbcrew.csv"; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="card">
    <div className="card-header"><div><h2>Données utilisateurs</h2><div className="small">{rows.length} utilisateur{rows.length>1?"s":""}</div></div>
      <button type="button" onClick={exportCsv}>Export CSV</button></div>
    <input aria-label="Rechercher dans les utilisateurs" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:12}} />
    <div style={{overflow:"auto",maxHeight:"70vh",border:"1px solid var(--border, #bbb)",borderRadius:8}}>
      <table style={{borderCollapse:"collapse",width:"max-content",minWidth:"100%",background:"var(--surface, white)"}}>
        <thead style={{position:"sticky",top:0,zIndex:2}}>
          <tr>{columns.map(([key,label])=><th key={key} style={{padding:"8px 10px",whiteSpace:"nowrap",border:"1px solid #bbb",background:"var(--card-bg, #eee)",cursor:"pointer"}}
            onClick={()=>{if(sortKey===key)setAscending(v=>!v);else{setSortKey(key);setAscending(true);}}}>{label}{sortKey===key?(ascending?" ▲":" ▼"):""}</th>)}</tr>
        </thead>
        <tbody>{rows.map(p=><tr key={p.id}>{columns.map(([key])=><td key={key} style={{padding:"7px 10px",whiteSpace:"nowrap",border:"1px solid #ccc"}}>{display(p,key)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </div>;
}
