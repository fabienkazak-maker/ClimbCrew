/**
 * Format public d'un compte utilisateur.
 * Les empreintes de mot de passe et les jetons ne sont jamais sérialisés.
 */
export function serializeUser(row) {
  return {
    id: String(row.id),
    participantId: row.participant_id ? String(row.participant_id) : null,
    email: row.email,
    prenom: row.prenom,
    nom: row.nom,
    role: row.role,
    isAdmin: Boolean(row.is_admin || row.role === "admin"),
    status: row.status,
    created_at: row.created_at,
    approved_at: row.approved_at,
    revoked_at: row.revoked_at,
    revoked_reason: row.revoked_reason,
    last_login_at: row.last_login_at,
    must_reset_password: row.must_reset_password,
    theme_preference: row.theme_preference || "auto",
  };
}
