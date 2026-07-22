import { useState } from "react";
import { AuthField } from "./auth-field";
import type { ResetPasswordForm } from "./auth-types";

interface ResetPasswordFormProps {
  onSubmit(form: ResetPasswordForm): Promise<void>;
}

const EMPTY_FORM: ResetPasswordForm = {
  email: "",
  token: "",
  password: "",
  confirmPassword: "",
};

export function ResetPasswordFormView({ onSubmit }: ResetPasswordFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(form);
      }}
    >
      <AuthField
        label="Email"
        value={form.email}
        onChange={(email) => setForm({ ...form, email })}
      />
      <AuthField
        label="Code"
        value={form.token}
        onChange={(token) => setForm({ ...form, token })}
      />
      <AuthField
        label="Nouveau mot de passe"
        type="password"
        value={form.password}
        onChange={(password) => setForm({ ...form, password })}
      />
      <AuthField
        label="Confirmation"
        type="password"
        value={form.confirmPassword}
        onChange={(confirmPassword) => setForm({ ...form, confirmPassword })}
      />
      <button type="submit">Mettre à jour</button>
    </form>
  );
}
