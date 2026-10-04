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

/**
 * Collapse a burst of identical actions into one row: same lot + action + person + reason,
 * each within `windowMin` of the previous one → one event with the summed qty and the latest time.
 * Newest-first in, newest-first out.
 */
export function collapseRuns<T extends HistoryEvent>(events: T[], windowMin = 10): T[] {
  const out: T[] = [];
  const open = new Map<string, { row: T; oldest: number }>();
  for (const e of [...events].sort((a, b) => b.at.localeCompare(a.at))) {
    const key = [e.lotId, e.kind, e.who, e.reason ?? ""].join("|");
    const t = Date.parse(e.at);
    const run = open.get(key);
    if (run && run.oldest - t <= windowMin * 60_000) {
      run.row.qty += e.qty;
      run.oldest = t;
      continue;
    }
    const row = { ...e };
    out.push(row);
    open.set(key, { row, oldest: t });
  }
  return out;
}
