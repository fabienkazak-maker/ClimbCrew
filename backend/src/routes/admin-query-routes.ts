import { Router, type Router as RouterType } from "express";
import { pool } from "../database";
import type { UserRow } from "../domain";
import { asyncRoute } from "../http";
import { requireAdmin, requireAuth } from "../security/auth-middleware";
import { serializeUser } from "../serializers";

interface AccessLogRow {
  id: string | number;
  event_type: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date | string;
  email: string | null;
  details_text: string | null;
}

export const adminQueryRouter: RouterType = Router();
adminQueryRouter.use(requireAuth, requireAdmin);

adminQueryRouter.get(
  "/users",
  asyncRoute(async (_request, response) => {
    const result = await pool.query<UserRow>(`
    select id, participant_id, email, prenom, nom, role, status,
      must_reset_password, created_at, approved_at, revoked_at,
      revoked_reason, last_login_at, theme_preference
    from users
    order by case status when 'pending' then 0 when 'active' then 1 else 2 end,
      created_at desc, email asc
  `);
    response.json({ ok: true, users: result.rows.map(serializeUser) });
  }),
);

adminQueryRouter.get(
  "/logs",
  asyncRoute(async (request, response) => {
    const rawLimit =
      typeof request.query.limit === "string"
        ? Number(request.query.limit)
        : 200;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 500)
      : 200;
    const result = await pool.query<AccessLogRow>(
      `select al.id, al.event_type, al.success, al.ip_address, al.user_agent,
      al.created_at, coalesce(u.email, al.details->>'email') as email,
      coalesce(al.details::text, '') as details_text
     from access_logs al left join users u on u.id = al.user_id
     order by al.created_at desc limit $1`,
      [limit],
    );
    response.json({
      ok: true,
      logs: result.rows.map((row) => ({
        id: String(row.id),
        eventType: row.event_type,
        success: row.success,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : row.created_at,
        email: row.email,
        details: row.details_text,
      })),
    });
  }),
);
