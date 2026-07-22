import type { AdminData } from "./use-admin-data";

interface LogsViewProps {
  admin: AdminData;
}

export function LogsView({ admin }: LogsViewProps) {
  return (
    <section className="card stack">
      <div className="card-header">
        <h2>Journal des accès</h2>
        <span className="badge">{admin.logs.length}</span>
      </div>
      {admin.logs.map((log) => (
        <article className="subcard" key={log.id}>
          <div className="card-header">
            <strong>{log.eventType}</strong>
            <span className={log.success ? "success" : "error"}>
              {log.success ? "Succès" : "Échec"}
            </span>
          </div>
          <p className="small">
            {log.email ?? "Utilisateur inconnu"} ·{" "}
            {log.createdAt.replace("T", " ").slice(0, 19)}
          </p>
          <p className="small">
            {log.ipAddress ?? "IP inconnue"} ·{" "}
            {log.userAgent ?? "Client inconnu"}
          </p>
          {log.details && <p className="small">{log.details}</p>}
        </article>
      ))}
    </section>
  );
}
