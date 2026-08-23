export function installAdminAccessLogRoutes(app, { requireAuth, requireAdmin, pool }) {
  app.get("/admin/auth/logs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit || 200), 500);
      const result = await pool.query(
        `
          select
            al.id,
            al.event_type,
            al.success,
            al.ip_address,
            al.user_agent,
            al.created_at,
            al.details,
            coalesce(u.email, al.details->>'email') as email,
            coalesce(al.details::text, '') as details_text
          from access_logs al
          left join users u on u.id = al.user_id
          order by al.created_at desc
          limit $1
        `,
        [limit]
      );

      res.json({ ok: true, logs: result.rows });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || String(error), fields: error.fields || undefined });
    }
  });
}
