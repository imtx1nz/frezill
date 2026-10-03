export type ExpiryStatus = "expired" | "today" | "soon" | "safe" | "none";

/** YYYY-MM-DD of `now` in the household's timezone (en-CA formats as ISO date). */
export const todayIn = (tz = "Asia/Bangkok", now = new Date()) => now.toLocaleDateString("en-CA", { timeZone: tz });

/** Whole days from `today` to `expiresAt` (both YYYY-MM-DD); negative = past. */
export const daysLeft = (expiresAt: string, today: string) =>
  Math.round((Date.parse(expiresAt) - Date.parse(today)) / 86_400_000);

export function expiryStatus(expiresAt: string | null, today: string, soonDays = 3): ExpiryStatus {
  if (!expiresAt) return "none";
  const d = daysLeft(expiresAt, today);
  return d < 0 ? "expired" : d === 0 ? "today" : d <= soonDays ? "soon" : "safe";
}

/** Thai label + token classes. Colour always ships with text (WCAG: never colour alone). */
export function expiryBadge(expiresAt: string | null, today: string) {
  const s = expiryStatus(expiresAt, today);
  const d = expiresAt ? daysLeft(expiresAt, today) : 0;
  const label = {
    expired: `หมดอายุแล้ว ${-d} วัน`,
    today: "หมดอายุวันนี้",
    soon: d === 1 ? "หมดพรุ่งนี้" : `อีก ${d} วัน`,
    safe: `อีก ${d} วัน`,
    none: "ไม่ระบุวันหมด",
  }[s];
  const tone = {
    expired: "bg-danger-soft text-danger",
    today: "bg-warn-soft text-warn",
    soon: "bg-soon-soft text-soon",
    safe: "bg-brand-soft text-brand-ink",
    none: "bg-ice text-ink-3",
  }[s];
  return { status: s, label, tone };
}

/** Sort key: soonest first, no date last. */
export const byExpiry = (a: { expires_at: string | null }, b: { expires_at: string | null }) =>
  (a.expires_at ?? "9999-12-31").localeCompare(b.expires_at ?? "9999-12-31");

export const thaiDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });
