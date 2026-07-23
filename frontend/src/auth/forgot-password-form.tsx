import { useState } from "react";
import { AuthField } from "./auth-field";

interface ForgotPasswordFormProps {
  onSubmit(email: string): Promise<void>;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(email);
      }}
    >
      <AuthField label="Email" value={email} onChange={setEmail} />
      <button type="submit">Signaler la perte du mot de passe</button>
    </form>
  );
}
