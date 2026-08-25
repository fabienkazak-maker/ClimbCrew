export function installDatabaseMaintenanceRoutes(app, {
  requireSetupAccess,
  ensureSchema,
  ensureDefaultAdmin,
  pool,
  firstAdminEmail,
}) {
  app.get("/setup-db", requireSetupAccess, async (_req, res) => {
    try {
      await ensureSchema();
      await ensureDefaultAdmin();
      res.json({
        ok: true,
        message: "Schéma prêt. Si aucun admin n'existait, le compte FIRST_ADMIN_EMAIL a été créé uniquement si les variables FIRST_ADMIN_EMAIL et FIRST_ADMIN_PASSWORD sont configurées.",
        firstAdminEmailConfigured: Boolean(firstAdminEmail),
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get("/db-status", requireSetupAccess, async (_req, res) => {
    try {
      const result = await pool.query(`
        select
          current_database() as database,
          to_regclass('public.participants') as participants,
          to_regclass('public.sessions') as sessions,
          to_regclass('public.session_participants') as session_participants,
          to_regclass('public.users') as users,
          to_regclass('public.user_sessions') as user_sessions,
          to_regclass('public.password_reset_tokens') as password_reset_tokens,
          to_regclass('public.access_logs') as access_logs,
          to_regclass('public.ropes') as ropes,
          to_regclass('public.routes') as routes,
          to_regclass('public.realisations') as realisations
      `);

      res.json({ ok: true, ...result.rows[0] });
    } catch (error) {
      res.status(500).json({ ok: false, error: String(error) });
    }
  });
}
