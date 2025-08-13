export function isMoreThanOneDayOld(date: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000; // 1 jour en millisecondes
  return diffMs > oneDayMs;
}