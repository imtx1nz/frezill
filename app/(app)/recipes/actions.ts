"use server";

import { createClient } from "@/lib/supabase/server";
import { dayStartIn, expiryStatus, todayIn } from "@/lib/expiry";
import { suggestMenus, type Item, type Menu } from "@/lib/ai/recipes";

const LIMIT = 10;
export type State = { error?: string; menus?: Menu[]; fridgeId?: string; left?: number };

export async function suggest(): Promise<State> {
  const supabase = await createClient();
  const { data: m } = await supabase.from("memberships").select("households(id, timezone, fridges(id))").limit(1).maybeSingle();
  const h = m?.households as unknown as { id: string; timezone: string; fridges: { id: string }[] } | undefined;
  const fridgeId = h?.fridges?.[0]?.id;
  if (!h || !fridgeId) return { error: "ไม่พบตู้เย็นของบ้านนี้" };

  const [{ count }, { data: lots }] = await Promise.all([
    supabase.from("recipe_requests").select("id", { count: "exact", head: true }).eq("household_id", h.id).gte("created_at", dayStartIn(h.timezone)),
    supabase.from("lots").select("name, unit, qty, expires_at").eq("fridge_id", fridgeId).gt("qty", 0),
  ]);
  const used = count ?? 0;
  if (used >= LIMIT) return { error: `วันนี้บ้านนี้ขอเมนูครบ ${LIMIT} ครั้งแล้ว ลองใหม่พรุ่งนี้` };

  // Only names of items that haven't expired go to the AI; urgent = expires within 3 days.
  const today = todayIn(h.timezone);
  const byKey = new Map<string, Item>();
  for (const l of lots ?? []) {
    const s = expiryStatus(l.expires_at, today);
    if (s === "expired") continue;
    const k = `${l.name}\u0000${l.unit}`;
    const it = byKey.get(k) ?? { name: l.name, unit: l.unit, qty: 0, urgent: false };
    it.qty += Number(l.qty);
    it.urgent ||= s === "today" || s === "soon";
    byKey.set(k, it);
  }
  const items = [...byKey.values()];
  if (!items.length) return { error: "ยังไม่มีของในตู้ที่ยังไม่หมดอายุ เพิ่มของก่อนแล้วค่อยขอเมนู" };

  const r = await suggestMenus(items);
  if ("error" in r) return { error: r.error === "quota" ? "วันนี้ AI ใช้ครบโควตาแล้ว ลองใหม่พรุ่งนี้" : "AI ไม่ว่าง ลองใหม่อีกครั้ง" };

  // Insert only on success so failures don't burn the household's 10/day (no DELETE policy). Small race: parallel requests can exceed LIMIT by a few.
  const { error } = await supabase.from("recipe_requests").insert({ household_id: h.id });
  if (error) return { error: "ขอเมนูไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง" };
  return { menus: r.menus, fridgeId, left: LIMIT - used - 1 };
}
