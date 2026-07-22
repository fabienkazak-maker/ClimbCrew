import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import type { AccessLog, AdminUser } from "../domain/types";
import { requestJson } from "../lib/api";
import { isRecord } from "../lib/guards";
import { parseAdminUsersPayload, parseLogsPayload } from "./admin-parser";

export interface AdminData {
  users: AdminUser[];
  logs: AccessLog[];
  loading: boolean;
  error: string;
  resetToken: string;
  reload(): Promise<void>;
  approve(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  generateResetToken(id: string): Promise<void>;
}

export function useAdminData(): AdminData {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");

  const reload = useCallback(async () => {
    if (user?.role !== "admin") return;
    setLoading(true);
    setError("");
    try {
      const [usersValue, logsValue] = await Promise.all([
        requestJson("/admin/auth/users"),
        requestJson("/admin/auth/logs?limit=200"),
      ]);
      const parsedUsers = parseAdminUsersPayload(usersValue);
      const parsedLogs = parseLogsPayload(logsValue);
      if (!parsedUsers || !parsedLogs)
        throw new Error("Contrat API administrateur invalide");
      setUsers(parsedUsers);
      setLogs(parsedLogs);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Chargement impossible",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const mutate = useCallback(
    async (id: string, action: string, body?: object) => {
      await requestJson(`/admin/auth/users/${id}/${action}`, {
        method: "POST",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      await reload();
    },
    [reload],
  );

  const generateResetToken = useCallback(async (id: string) => {
    const value = await requestJson(`/admin/auth/users/${id}/reset-token`, {
      method: "POST",
    });
    if (
      !isRecord(value) ||
      typeof value.resetToken !== "string" ||
      typeof value.expiresAt !== "string"
    ) {
      throw new Error("Réponse de réinitialisation invalide");
    }
    setResetToken(`${value.resetToken} · expiration ${value.expiresAt}`);
  }, []);

  return {
    users,
    logs,
    loading,
    error,
    resetToken,
    reload,
    approve: (id) => mutate(id, "approve"),
    revoke: (id) =>
      mutate(id, "revoke", { reason: "Révocation administrateur" }),
    reactivate: (id) => mutate(id, "reactivate"),
    generateResetToken,
  };
}
