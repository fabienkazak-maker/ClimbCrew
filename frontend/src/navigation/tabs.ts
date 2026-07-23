export type TabKey =
  | "inscriptions"
  | "voies"
  | "progression"
  | "administration"
  | "comptes"
  | "logs"
  | "statistiques"
  | "faq";

export interface TabDefinition {
  key: TabKey;
  label: string;
  adminOnly: boolean;
}

export const TABS: TabDefinition[] = [
  { key: "inscriptions", label: "Inscriptions", adminOnly: false },
  { key: "voies", label: "Voies", adminOnly: false },
  { key: "progression", label: "Progression", adminOnly: false },
  { key: "administration", label: "Administration", adminOnly: true },
  { key: "comptes", label: "Gestion des comptes", adminOnly: true },
  { key: "logs", label: "Logs", adminOnly: true },
  { key: "statistiques", label: "Statistiques", adminOnly: false },
  { key: "faq", label: "FAQ", adminOnly: false },
];
