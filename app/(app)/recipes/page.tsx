import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IngredientPicture } from "@/components/IngredientPicture";
import { ToneBadge } from "@/components/home/status";
import { todayIn } from "@/lib/expiry";
import { groupItems, type HomeLot } from "@/lib/home";
import { Recipes, type Known } from "./Recipes";

export const metadata: Metadata = { title: "เมนูแนะนำ" };

export default async function RecipesPage() {
  await connection(); // check the key at request time, not build time
  if (!process.env.GEMINI_API_KEY?.trim()) notFound();
  const supabase = await createClient();
  const [{ data: lots }, { data: home }] = await Promise.all([
    supabase.from("lots").select("id, name, qty, unit, category, zone, expires_at, expiry_guessed, bought_on").gt("qty", 0),
    supabase.from("households").select("timezone").limit(1).maybeSingle(),
  ]);
  const today = todayIn(home?.timezone);
  const items = groupItems((lots ?? []).map((l) => ({ ...l, qty: Number(l.qty) })) as HomeLot[], today);
  const soon = items.filter((i) => i.tone === "urgent" || i.tone === "week");
  const known: Known = Object.fromEntries(
    items.map((i) => [i.soon.name, { category: i.soon.category, tone: i.tone, expires_at: i.soon.expires_at }]),
  );

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-5 px-4 pb-10 pt-5">
      <header>
        <h1 className="font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.01em] lg:text-[2.25rem]">เมนูจากของในตู้</h1>
        <p className="text-ink-2">AI ช่วยคิด ใช้ของที่ต้องรีบใช้ก่อน</p>
      </header>
      {soon.length > 0 && (
        <section aria-label="ต้องรีบใช้">
          <h2 className="mb-1 text-[0.9375rem] font-semibold text-ink-2">ต้องรีบใช้</h2>
          <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 pt-3">
            {soon.map((i) => (
              <li key={i.key} className="relative shrink-0 p-1.5" aria-label={i.soon.name}>
                <IngredientPicture name={i.soon.name} category={i.soon.category} size={56} className="lg:hidden" />
                <IngredientPicture name={i.soon.name} category={i.soon.category} size={96} className="max-lg:hidden" />
                <ToneBadge tone={i.tone} expiresAt={i.soon.expires_at} today={today} className="absolute -right-1 -top-1 z-[1]" />
                <span className="sr-only">{i.soon.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Recipes known={known} today={today} />
    </main>
  );
}
