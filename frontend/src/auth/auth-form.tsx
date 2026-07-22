import { useState } from "react";
import { APP_VERSION_LABEL } from "../config/constants";
import { AccessRequestFormView } from "./access-request-form";
import { useAuth } from "./auth-context";
import type { AuthView } from "./auth-types";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginFormView } from "./login-form";
import { ResetPasswordFormView } from "./reset-password-form";

export function AuthForm() {
  const auth = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [localError, setLocalError] = useState("");

  async function submit(action: () => Promise<void>): Promise<void> {
    setLocalError("");
    try {
      await action();
    } catch (reason) {
      setLocalError(
        reason instanceof Error ? reason.message : "Action impossible",
      );
    }
  }

  function changeView(next: AuthView): void {
    auth.clearFeedback();
    setLocalError("");
    setView(next);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <img
            src="/logo-climbcrew.png"
            alt="Logo ClimbCrew"
            className="app-logo"
          />
          <h1>ClimbCrew</h1>
        </div>
        {(auth.error || localError) && (
          <p className="error">{localError || auth.error}</p>
        )}
        {auth.message && <p className="success">{auth.message}</p>}
        {view === "login" && (
          <LoginFormView onSubmit={(form) => submit(() => auth.login(form))} />
        )}
        {view === "request" && (
          <AccessRequestFormView
            onSubmit={(form) => submit(() => auth.requestAccess(form))}
          />
        )}
        {view === "forgot" && (
          <ForgotPasswordForm
            onSubmit={(email) => submit(() => auth.forgotPassword(email))}
          />
        )}
        {view === "reset" && (
          <ResetPasswordFormView
            onSubmit={(form) => submit(() => auth.resetPassword(form))}
          />
        )}
        <div className="auth-switcher">
          <button
            type="button"
            className="secondary"
            onClick={() => changeView("login")}
          >
            Connexion
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => changeView("request")}
          >
            Demander un accès
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => changeView("forgot")}
          >
            Mot de passe perdu
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => changeView("reset")}
          >
            Réinitialiser
          </button>
        </div>
        <p className="small centered">{APP_VERSION_LABEL}</p>
      </section>
    </main>
  );
}
