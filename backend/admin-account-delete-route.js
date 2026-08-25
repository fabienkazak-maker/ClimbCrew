export function installAdminAccountDeleteRoute(app, { requireAuth, requireAdmin, pool, logAccess }) {
  app.delete("/admin/auth/users/:id", requireAuth, requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({ error: "Identifiant du compte invalide" });
      }
      if (Number(req.auth.user.id) === userId) {
        return res.status(409).json({ error: "Vous ne pouvez pas supprimer votre propre compte." });
      }

      await client.query("begin");
      const userResult = await client.query(
        "select id, email, role, status from users where id = $1 for update",
        [userId],
      );
      if (!userResult.rowCount) {
        await client.query("rollback");
        return res.status(404).json({ error: "Compte introuvable" });
      }

      const user = userResult.rows[0];
      if (user.role === "admin" && user.status === "active") {
        const adminsResult = await client.query(
          "select count(*)::integer as count from users where role = 'admin' and status = 'active'",
        );
        if (adminsResult.rows[0].count <= 1) {
          await client.query("rollback");
          return res.status(409).json({ error: "Le dernier compte administrateur actif ne peut pas être supprimé." });
        }
      }

      await client.query("delete from users where id = $1", [userId]);
      await client.query("commit");

      await logAccess({
        userId: req.auth.user.id,
        eventType: "account_deleted",
        success: true,
        req,
        details: { deletedUserId: userId, deletedEmail: user.email },
      });
      res.json({ ok: true });
    } catch (error) {
      await client.query("rollback");
      res.status(500).json({ error: error.message || "Suppression du compte impossible" });
    } finally {
      client.release();
    }
  });
}
