export function parseTime(str: string): Date {
  const [hours, minutes] = str.split(":").map(Number);
  return new Date(0, 0, 0, hours, minutes);
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}