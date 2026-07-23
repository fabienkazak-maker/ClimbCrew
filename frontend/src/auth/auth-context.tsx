import { createContext, useContext } from "react";
import type { AuthUser, ThemePreference } from "../domain/types";
import type { AuthActions } from "./auth-types";

export interface AuthContextValue extends AuthActions {
  user: AuthUser | null;
  loading: boolean;
  error: string;
  message: string;
  clearFeedback(): void;
  updateTheme(theme: ThemePreference): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthContext absent");
  return value;
}
