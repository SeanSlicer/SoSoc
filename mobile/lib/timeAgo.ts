/**
 * Returns a compact human-readable relative time string (e.g. "just now", "5m", "2h", "3d").
 * Falls back to a short date string for dates older than 7 days.
 *
 * Mirrors `src/lib/shared/timeAgo.ts` on the web side — kept as a local copy
 * so the mobile bundle doesn't depend on `src/` at runtime.
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
