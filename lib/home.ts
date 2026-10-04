import { byExpiry, homeTone, type HomeTone } from "./expiry";
import type { Category, Zone } from "./catalog";

export type HomeLot = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  category: Category;
  zone: Zone;
  expires_at: string | null;
  expiry_guessed: boolean;
  bought_on: string;
};

export type Place = "freezer" | "top" | "middle" | "bottom" | "drawer" | "door";
export const PLACES: Place[] = ["freezer", "top", "middle", "bottom", "drawer", "door"];

export function placeOf(zone: Zone, category: Category): Place {
  if (zone === "freezer") return "freezer";
  if (category === "cooked") return "middle";
  if (category === "meat" || category === "seafood") return "bottom";
  if (category === "veg" || category === "fruit") return "drawer";
  if (category === "drink" || category === "sauce") return "door";
  return "top";
}

/** One fridge item = every lot with the same name + unit + zone; soonest lot first (FEFO order). */
export type HomeItem = { key: string; lots: HomeLot[]; soon: HomeLot; total: number; tone: HomeTone; place: Place };

export function groupItems(lots: HomeLot[], today: string): HomeItem[] {
  const map = new Map<string, HomeLot[]>();
  for (const l of lots) {
    const key = `${l.name}|${l.unit}|${l.zone}`;
    map.set(key, [...(map.get(key) ?? []), l]);
  }
  return [...map]
    .map(([key, ls]) => {
      const sorted = [...ls].sort((a, b) => byExpiry(a, b) || a.bought_on.localeCompare(b.bought_on));
      const soon = sorted[0];
      return {
        key,
        lots: sorted,
        soon,
        total: Math.round(sorted.reduce((s, l) => s + l.qty, 0) * 1000) / 1000,
        tone: homeTone(soon.expires_at, today),
        place: placeOf(soon.zone, soon.category),
      };
    })
    .sort((a, b) => byExpiry(a.soon, b.soon));
}

/** Flies per item (expired 2, urgent 1), assigned most-expired first, at most `cap` on screen. */
export function flyCounts(items: HomeItem[], cap = 6) {
  const out = new Map<string, number>();
  let left = cap;
  for (const it of items) {
    const want = it.tone === "expired" ? 2 : it.tone === "urgent" ? 1 : 0;
    const n = Math.min(want, left);
    if (n) out.set(it.key, n);
    left -= n;
  }
  return out;
}
