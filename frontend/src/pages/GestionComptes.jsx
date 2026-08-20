import React from "react";
import Button from "../components/Button.jsx";
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

  const pendingUsers = adminAuthUsers.filter((user) => user.status === "pending");
  const otherUsers = adminAuthUsers.filter((user) => user.status !== "pending");

  const renderAccountActions = (user) => (
    <div className="group">
      {user.status === "pending" && <Button onClick={() => approveAccessRequest(user.id)}>Approuver</Button>}
      {user.status !== "revoked" ? (
        <Button variant="danger" onClick={() => revokeUserAccess(user.id)}>Répudier</Button>
      ) : (
        <Button onClick={() => reactivateUserAccess(user.id)}>Réactiver</Button>
      )}
      <Button variant="secondary" onClick={() => generatePasswordResetToken(user.id)}>Code reset</Button>
      {Number(authUser?.id) !== Number(user.id) && (
        <Button variant="danger" onClick={() => deleteUserAccount(user)}>Supprimer le compte</Button>
      )}
    </div>
  );

  const renderAccountBody = (user) => (
    <div style={{ marginTop: 10 }}>
      <div className="card-header">
        <div className="small">{user.email} · rôle {user.role} · statut {user.status}</div>
        {renderAccountActions(user)}
      </div>
      <div className="small">
        Créé le {user.created_at ? formatDateFr(user.created_at.slice(0, 10)) : "-"}
        {user.last_login_at ? ` · dernière connexion le ${formatDateFr(user.last_login_at.slice(0, 10))}` : " · aucune connexion"}
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <h2>Gestion des comptes</h2>
        <Button variant="secondary" onClick={loadAdminAccessData}>Actualiser</Button>
      </div>
      <div className="small" style={{ marginBottom: 10 }}>
        Les comptes standards sont activés automatiquement après vérification de l’adresse e-mail. Les actions d’approbation manuelle restent disponibles pour les cas qui en ont encore besoin.
      </div>
      {generatedResetToken && <div className="success" style={{ marginBottom: 12 }}>{generatedResetToken}</div>}
      <div className="stack">
        {adminAuthUsers.length === 0 ? (
          <div className="muted-box">Aucun compte utilisateur chargé.</div>
        ) : (
          <>
            {pendingUsers.map((user) => (
              <div className="subcard account-admin-details" key={user.id}>
                <div className="card-header">
                  <div>
                    <div style={{ fontWeight: 700 }}>{user.prenom} {user.nom}</div>
                    <div className="small">En attente d’une intervention administrateur</div>
                  </div>
                </div>
                {renderAccountBody(user)}
              </div>
            ))}

            {otherUsers.map((user) => (
              <details className="subcard account-admin-details" key={user.id}>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                  {user.prenom} {user.nom}
                </summary>
                {renderAccountBody(user)}
              </details>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
