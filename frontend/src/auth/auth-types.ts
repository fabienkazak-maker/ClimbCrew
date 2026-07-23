export type AuthView = "login" | "request" | "forgot" | "reset";

export interface LoginForm {
  email: string;
  password: string;
}

export interface AccessRequestForm extends LoginForm {
  prenom: string;
  nom: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ResetPasswordForm extends LoginForm {
  token: string;
  confirmPassword: string;
}

export interface AuthActions {
  login(form: LoginForm): Promise<void>;
  logout(): Promise<void>;
  requestAccess(form: AccessRequestForm): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(form: ResetPasswordForm): Promise<void>;
}
