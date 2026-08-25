export function createAuthMiddleware({
  pool,
  hashToken,
  getRequestToken,
  isSafeMethod,
  getCookie,
  csrfCookieName,
  constantTimeEqual,
  serializeUser,
}) {
  async function loadSessionFromToken(rawToken) {
    const tokenHash = hashToken(rawToken);

    const result = await pool.query(
      `
        select
          us.id as session_id,
          us.user_id,
          us.expires_at,
          us.revoked_at,
          u.id,
          u.participant_id,
          u.email,
          u.prenom,
          u.nom,
          u.role,
          u.status,
          u.created_at,
          u.approved_at,
          u.revoked_at as user_revoked_at,
          u.revoked_reason,
          u.last_login_at,
          u.must_reset_password,
          u.theme_preference
        from user_sessions us
        join users u on u.id = us.user_id
        where us.token_hash = $1
          and us.revoked_at is null
          and us.expires_at > now()
        limit 1
      `,
      [tokenHash]
    );

    return result.rows[0] || null;
  }

  async function requireAuth(req, res, next) {
    const rawToken = getRequestToken(req);

    if (!rawToken) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    const session = await loadSessionFromToken(rawToken);

    if (!session || session.status !== "active") {
      return res.status(401).json({ error: "Session invalide ou compte non actif" });
    }

    if (!isSafeMethod(req.method)) {
      const csrfHeader = req.headers["x-csrf-token"];
      const csrfCookie = getCookie(req, csrfCookieName);
      if (!csrfHeader || !csrfCookie || !constantTimeEqual(csrfHeader, csrfCookie)) {
        return res.status(403).json({ error: "Protection CSRF : jeton absent ou invalide" });
      }
    }

    req.auth = {
      token: rawToken,
      sessionId: session.session_id,
      user: serializeUser(session),
    };

    next();
  }

  function requireAdmin(req, res, next) {
    if (req.auth?.user?.role !== "admin") {
      return res.status(403).json({ error: "Accès administrateur requis" });
    }
    next();
  }

  return { requireAuth, requireAdmin };
}
