interface AuthFieldProps {
  label: string;
  value: string;
  type?: "text" | "password";
  onChange(value: string): void;
}

export function AuthField({
  label,
  value,
  type = "text",
  onChange,
}: AuthFieldProps) {
  return (
    <label>
      {label}
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
