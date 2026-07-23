import { useState } from "react";
import { AuthField } from "./auth-field";
import type { AccessRequestForm } from "./auth-types";

interface AccessRequestFormProps {
  onSubmit(form: AccessRequestForm): Promise<void>;
}

const EMPTY_FORM: AccessRequestForm = {
  prenom: "",
  nom: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export function AccessRequestFormView({ onSubmit }: AccessRequestFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(form);
      }}
    >
      <AuthField
        label="Prénom"
        value={form.prenom}
        onChange={(prenom) => setForm({ ...form, prenom })}
      />
      <AuthField
        label="Nom"
        value={form.nom}
        onChange={(nom) => setForm({ ...form, nom })}
      />
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
      <AuthField
        label="Confirmation"
        type="password"
        value={form.confirmPassword}
        onChange={(confirmPassword) => setForm({ ...form, confirmPassword })}
      />
      <label className="checkbox">
        <input
          type="checkbox"
          checked={form.acceptTerms}
          onChange={(event) =>
            setForm({ ...form, acceptTerms: event.target.checked })
          }
        />
        J’accepte les conditions d’utilisation.
      </label>
      <button type="submit">Envoyer la demande</button>
    </form>
  );
}
