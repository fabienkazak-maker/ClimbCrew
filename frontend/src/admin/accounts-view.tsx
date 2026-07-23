import type { AdminData } from "./use-admin-data";

interface AccountsViewProps {
  admin: AdminData;
}

export function AccountsView({ admin }: AccountsViewProps) {
  return (
    <section className="card stack">
      <div className="card-header">
        <h2>Gestion des comptes</h2>
        <button
          type="button"
          className="secondary"
          onClick={() => void admin.reload()}
        >
          Actualiser
        </button>
      </div>
      {admin.loading && <p>Chargement</p>}
      {admin.error && <p className="error">{admin.error}</p>}
      {admin.resetToken && (
        <p className="success">Code temporaire: {admin.resetToken}</p>
      )}
      {admin.users.map((user) => (
        <article className="subcard" key={user.id}>
          <div className="card-header">
            <div>
              <strong>
                {user.prenom} {user.nom}
              </strong>
              <p className="small">
                {user.email} · {user.role} · {user.status}
              </p>
            </div>
            <div className="button-group">
              {user.status === "pending" && (
                <button
                  type="button"
                  onClick={() => void admin.approve(user.id)}
                >
                  Approuver
                </button>
              )}
              {user.status === "active" && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => void admin.revoke(user.id)}
                >
                  Révoquer
                </button>
              )}
              {user.status === "revoked" && (
                <button
                  type="button"
                  onClick={() => void admin.reactivate(user.id)}
                >
                  Réactiver
                </button>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => void admin.generateResetToken(user.id)}
              >
                Code temporaire
              </button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
