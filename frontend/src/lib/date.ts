export function toLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  const date = new Date();
  if (date.getDay() === 6) date.setDate(date.getDate() + 2);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return toLocalIso(date);
}

export function nextBusinessDay(dateValue: string, delta: number): string {
  const date = new Date(`${dateValue}T12:00:00`);
  do date.setDate(date.getDate() + delta);
  while (date.getDay() === 0 || date.getDay() === 6);
  return toLocalIso(date);
}

export function shiftBusinessDays(dateValue: string, count: number): string {
  const delta = count < 0 ? -1 : 1;
  let result = dateValue;
  for (let index = 0; index < Math.abs(count); index += 1) {
    result = nextBusinessDay(result, delta);
  }
  return result;
}

export function formatDateFr(dateValue: string): string {
  const formatted = new Date(`${dateValue}T12:00:00`).toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
    },
  );
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getWeekDates(dateValue: string): string[] {
  const current = new Date(`${dateValue}T12:00:00`);
  const offset = current.getDay() === 0 ? -6 : 1 - current.getDay();
  current.setDate(current.getDate() + offset);
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(current);
    date.setDate(current.getDate() + index);
    return toLocalIso(date);
  });
}
