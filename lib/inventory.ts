import { z } from "zod";
import { todayIn } from "./expiry";

export const CATEGORIES = {
  veg: "ผัก",
  fruit: "ผลไม้",
  meat: "เนื้อสัตว์",
  seafood: "อาหารทะเล",
  dairy_egg: "ไข่และนม",
  drink: "เครื่องดื่ม",
  sauce: "เครื่องปรุง",
  cooked: "อาหารปรุงสุก",
  other: "อื่น ๆ",
} as const;
export const ZONES = { chill: "ช่องธรรมดา", freezer: "ช่องแช่แข็ง" } as const;
export const UNITS = ["ชิ้น", "ฟอง", "กรัม", "กก.", "มล.", "ลิตร", "แพ็ค", "ขวด", "กล่อง", "ถุง"];

export const lotSchema = z.object({
  name: z.string().trim().min(1).max(60),
  qty: z.coerce.number().positive().max(100000),
  unit: z.string().trim().min(1).max(20),
  category: z.enum(Object.keys(CATEGORIES) as [keyof typeof CATEGORIES]),
  zone: z.enum(["chill", "freezer"]),
  // "" from an empty <input type="date"> = no expiry date
  expires_at: z.preprocess((v) => v || null, z.iso.date().nullable()),
  // "1" only when the date came from the catalog guess and the user didn't edit it
  expiry_guessed: z.preprocess((v) => v === "1", z.boolean()),
  // blank = bought today (Bangkok); never null, never in the future
  bought_on: z.preprocess(
    (v) => v || todayIn(),
    z.iso.date({ error: "วันที่ซื้อไม่ถูกต้อง" }).refine((d) => d <= todayIn(), "วันที่ซื้อเป็นอนาคตไม่ได้"),
  ),
});

export type FefoLot = { id: string; qty: number; expires_at: string | null; bought_on: string; created_at: string };

/** Avoids 0.1 + 0.2 style drift on fractional quantities. */
const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * First-Expired-First-Out: take `amount` from the lots that expire soonest
 * (no expiry date = last), earlier bought_on, then created_at, on ties. Returns how much to
 * take from each lot and what remains. Never takes more than is available.
 */
export function fefo(lots: FefoLot[], amount: number) {
  const sorted = [...lots]
    .filter((l) => l.qty > 0)
    .sort(
      (a, b) =>
        (a.expires_at ?? "9999-12-31").localeCompare(b.expires_at ?? "9999-12-31") ||
        a.bought_on.localeCompare(b.bought_on) ||
        a.created_at.localeCompare(b.created_at),
    );
  const plan: { id: string; take: number; left: number }[] = [];
  let need = round(amount);
  for (const lot of sorted) {
    if (need <= 0) break;
    const take = Math.min(lot.qty, need);
    need = round(need - take);
    plan.push({ id: lot.id, take, left: round(lot.qty - take) });
  }
  return plan;
}
