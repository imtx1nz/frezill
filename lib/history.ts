import { daysLeft, todayIn } from "./expiry";

export type HistoryKind = "add" | "use" | "finish" | "discard";
export type HistoryEvent = {
  id: string;
  kind: HistoryKind;
  at: string; // ISO timestamp
  name: string;
  unit: string;
  category: string;
  qty: number;
  who: string;
  reason: string | null;
  lotId: string;
  live: boolean; // lot still has qty > 0
};

/** Newest-first day groups, keyed by the calendar day of `at` in the household timezone. */
export function groupByDay<T extends { at: string }>(events: T[], tz: string) {
  const days = new Map<string, T[]>();
  for (const e of [...events].sort((a, b) => b.at.localeCompare(a.at))) {
    const day = todayIn(tz, new Date(e.at));
    days.set(day, [...(days.get(day) ?? []), e]);
  }
  return [...days].map(([day, items]) => ({ day, items }));
}

/** "วันนี้" / "เมื่อวาน" / "ศ. 2 ต.ค." */
export function dayLabel(day: string, today: string) {
  const d = daysLeft(day, today);
  if (d === 0) return "วันนี้";
  if (d === -1) return "เมื่อวาน";
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** YYYY-MM-DD `n` days before `day`. */
export function minusDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
