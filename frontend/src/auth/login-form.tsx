import { useState } from "react";
import { AuthField } from "./auth-field";
import type { LoginForm } from "./auth-types";

interface LoginFormProps {
  onSubmit(form: LoginForm): Promise<void>;
}

export function LoginFormView({ onSubmit }: LoginFormProps) {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
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
        label="Mot de passe"
        type="password"
        value={form.password}
        onChange={(password) => setForm({ ...form, password })}
      />
      <button type="submit">Se connecter</button>
    </form>
  );
}
