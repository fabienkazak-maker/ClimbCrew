import React from "react";

export default function Logs({ USE_API, canManageAccountsAndLogs, adminAccessLogs }) {
  if (!USE_API) {
    return <div className="card"><div className="muted-box">Les logs de connexion sont disponibles avec le backend API.</div></div>;
  }
  if (!canManageAccountsAndLogs) {
    return <div className="card"><div className="muted-box">Cette section est réservée aux administrateurs authentifiés.</div></div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Logs de connexion</h2>
        <span className="badge">{adminAccessLogs.length}</span>
      </div>
      <div className="stack">
        {adminAccessLogs.length === 0 ? (
          <div className="muted-box">Aucun log disponible.</div>
        ) : (
          adminAccessLogs.map((log) => (
            <div className="subcard" key={log.id}>
              <div className="card-header">
                <strong>{log.event_type}</strong>
                <span className={`badge ${log.success ? "" : "danger"}`}>{log.success ? "OK" : "Échec"}</span>
              </div>
              <div className="small">
                {log.email || "utilisateur inconnu"} · {log.created_at ? log.created_at.replace("T", " ").slice(0, 19) : "-"}
              </div>
              <div className="small">
                {log.ip_address || "IP inconnue"} · {log.user_agent || "navigateur inconnu"}
              </div>
              {log.details_text && <div className="small">Détails : {log.details_text}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
