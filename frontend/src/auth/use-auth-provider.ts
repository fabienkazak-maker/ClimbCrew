import { useCallback, useEffect, useMemo, useState } from "react";
import { USE_API } from "../config/constants";
import type { AuthUser, ThemePreference } from "../domain/types";
import { requestJson } from "../lib/api";
import type { AuthContextValue } from "./auth-context";
import { parseAuthPayload } from "./auth-parser";
import type {
  AccessRequestForm,
  LoginForm,
  ResetPasswordForm,
} from "./auth-types";

const LOCAL_USER: AuthUser = {
  id: "local",
  participantId: null,
  email: "local@climbcrew.invalid",
  prenom: "Mode",
  nom: "local",
  role: "admin",
  status: "active",
  mustResetPassword: false,
  themePreference: "auto",
};

function requireUser(value: unknown): AuthUser {
  const user = parseAuthPayload(value);
  if (!user) throw new Error("Réponse utilisateur invalide");
  return user;
}

export function useAuthProvider(): AuthContextValue {
  const [user, setUser] = useState<AuthUser | null>(
    USE_API ? null : LOCAL_USER,
  );
  const [loading, setLoading] = useState(USE_API);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const clearFeedback = useCallback(() => {
    setError("");
    setMessage("");
  }, []);

  useEffect(() => {
    if (!USE_API) return;
    let active = true;
    requestJson("/auth/me")
      .then((payload) => active && setUser(requireUser(payload)))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const preference = user?.themePreference ?? "auto";
      document.documentElement.dataset.theme =
        preference === "auto" ? (media.matches ? "dark" : "light") : preference;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [user?.themePreference]);

  const login = useCallback(
    async (form: LoginForm) => {
      clearFeedback();
      const payload = await requestJson("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setUser(requireUser(payload));
    },
    [clearFeedback],
  );

  const logout = useCallback(async () => {
    if (USE_API) await requestJson("/auth/logout", { method: "POST" });
    setUser(USE_API ? null : LOCAL_USER);
  }, []);

  const updateTheme = useCallback(async (theme: ThemePreference) => {
    if (!USE_API) {
      setUser((current) =>
        current ? { ...current, themePreference: theme } : current,
      );
      return;
    }
    const payload = await requestJson("/auth/theme", {
      method: "PUT",
      body: JSON.stringify({ themePreference: theme }),
    });
    setUser(requireUser(payload));
  }, []);

  const requestAccess = useCallback(
    async (form: AccessRequestForm) => {
      clearFeedback();
      await requestJson("/auth/request-access", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage("Demande envoyée. Un administrateur doit la valider.");
    },
    [clearFeedback],
  );

  const forgotPassword = useCallback(
    async (email: string) => {
      clearFeedback();
      await requestJson("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage("Demande enregistrée.");
    },
    [clearFeedback],
  );

  const resetPassword = useCallback(
    async (form: ResetPasswordForm) => {
      clearFeedback();
      await requestJson("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage("Mot de passe mis à jour.");
    },
    [clearFeedback],
  );

  return useMemo(
    () => ({
      user,
      loading,
      error,
      message,
      clearFeedback,
      updateTheme,
      login,
      logout,
      requestAccess,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      loading,
      error,
      message,
      clearFeedback,
      updateTheme,
      login,
      logout,
      requestAccess,
      forgotPassword,
      resetPassword,
    ],
  );
}
