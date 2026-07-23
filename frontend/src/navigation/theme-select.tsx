import type { ThemePreference } from "../domain/types";

interface ThemeSelectProps {
  value: ThemePreference;
  onChange(theme: ThemePreference): void;
}

function readTheme(value: string): ThemePreference {
  if (value === "light" || value === "dark") return value;
  return "auto";
}

export function ThemeSelect({ value, onChange }: ThemeSelectProps) {
  return (
    <label>
      Thème
      <select
        value={value}
        onChange={(event) => onChange(readTheme(event.target.value))}
      >
        <option value="auto">Système</option>
        <option value="light">Clair</option>
        <option value="dark">Sombre</option>
      </select>
    </label>
  );
}
