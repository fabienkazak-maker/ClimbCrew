import React from "react";
import { formatDateFr } from "../lib/domain.js";

export default function GestionComptes({
  USE_API,
  canManageAccountsAndLogs,
  loadAdminAccessData,
  generatedResetToken,
  adminAuthUsers,
  approveAccessRequest,
  revokeUserAccess,
  reactivateUserAccess,
  generatePasswordResetToken,
  deleteUserAccount,
  authUser,
}) {
  if (!USE_API) {
    return <div className="card"><div className="muted-box">La gestion des comptes est disponible avec le backend API.</div></div>;
  }
  if (!canManageAccountsAndLogs) {
    return <div className="card"><div className="muted-box">Cette section est réservée aux administrateurs authentifiés.</div></div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Gestion des comptes</h2>
        <button className="secondary" onClick={loadAdminAccessData}>Actualiser</button>
      </div>
      <div className="small" style={{ marginBottom: 10 }}>
        L’administrateur peut approuver, révoquer, réactiver ou supprimer définitivement un compte.
      </div>
      {generatedResetToken && <div className="success" style={{ marginBottom: 12 }}>{generatedResetToken}</div>}
      <div className="stack">
        {adminAuthUsers.length === 0 ? (
          <div className="muted-box">Aucun compte utilisateur chargé.</div>
        ) : (
          adminAuthUsers.map((user) => (
            <details className="subcard account-admin-details" key={user.id}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                {user.prenom} {user.nom}
              </summary>
              <div style={{ marginTop: 10 }}>
                <div className="card-header">
                  <div className="small">{user.email} · rôle {user.role} · statut {user.status}</div>
                  <div className="group">
                    {user.status === "pending" && <button onClick={() => approveAccessRequest(user.id)}>Approuver</button>}
                    {user.status !== "revoked" ? (
                      <button className="danger" onClick={() => revokeUserAccess(user.id)}>Répudier</button>
                    ) : (
                      <button onClick={() => reactivateUserAccess(user.id)}>Réactiver</button>
                    )}
                    <button className="secondary" onClick={() => generatePasswordResetToken(user.id)}>Code reset</button>
                    {Number(authUser?.id) !== Number(user.id) && (
                      <button className="danger" onClick={() => deleteUserAccount(user)}>Supprimer le compte</button>
                    )}
                  </div>
                </div>
                <div className="small">
                  Créé le {user.created_at ? formatDateFr(user.created_at.slice(0, 10)) : "-"}
                  {user.last_login_at ? ` · dernière connexion le ${formatDateFr(user.last_login_at.slice(0, 10))}` : " · aucune connexion"}
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
