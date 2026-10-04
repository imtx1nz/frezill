import { PendingButton } from "@/components/inventory/PendingButton";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Refrigerator } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, ZONES } from "@/lib/inventory";
import { todayIn } from "@/lib/expiry";
import { ExpiryBadge } from "@/components/inventory/ExpiryBadge";
import { PageHeader } from "@/components/inventory/PageHeader";
import { IngredientPicture } from "@/components/IngredientPicture";
import { signOut } from "@/app/(auth)/actions";
import { consume } from "./actions";

export const metadata: Metadata = { title: "ตู้เย็น" };

type Lot = {
  id: string;
  fridge_id: string;
  name: string;
  qty: number;
  unit: string;
  category: keyof typeof CATEGORIES;
  zone: keyof typeof ZONES;
  expires_at: string | null;
  bought_on: string;
  created_at: string;
};

const fmt = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
const day = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" });
const btn =
  "flex h-11 flex-1 items-center justify-center rounded-xl border border-line bg-surface px-2 text-[0.9375rem] font-medium text-ink-2 hover:border-ink-3 hover:text-ink";

export default async function FridgePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, { data: home }] = await Promise.all([
    supabase
      .from("lots")
      .select("id, fridge_id, name, qty, unit, category, zone, expires_at, bought_on, created_at")
      .gt("qty", 0)
      .order("name")
      .order("expires_at", { nullsFirst: false }) // FEFO order inside each item
      .order("bought_on")
      .order("created_at"),
    supabase.from("households").select("timezone").limit(1).maybeSingle(),
  ]);
  const today = todayIn(home?.timezone);

  // Same name + unit = one item with several lots.
  const groups = new Map<string, Lot[]>();
  for (const l of (data ?? []) as Lot[]) {
    const key = `${l.fridge_id}|${l.name}|${l.unit}`;
    groups.set(key, [...(groups.get(key) ?? []), { ...l, qty: Number(l.qty) }]);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-10 pt-5">
      <PageHeader back="/today" title="ของในตู้เย็น">
        <Link
          href="/fridge/add"
          className="flex h-11 items-center gap-1.5 rounded-xl bg-brand px-3.5 font-semibold text-white hover:bg-brand-ink"
        >
          <Plus className="size-5" /> เพิ่ม
        </Link>
      </PageHeader>

      {groups.size === 0 && (
        <section className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-8 text-center shadow-[0_10px_30px_-18px_rgb(4_40_30/0.35)]">
          <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand">
            <Refrigerator className="size-6" />
          </span>
          <p className="text-ink-2">ตู้เย็นยังว่างอยู่ กด “เพิ่ม” เพื่อใส่ของชิ้นแรก</p>
        </section>
      )}

      <ul className="flex flex-col gap-3">
        {[...groups.values()].map((lots) => {
          const { fridge_id, name, unit, category, zone } = lots[0];
          const total = lots.reduce((s, l) => s + l.qty, 0);
          return (
            <li key={lots[0].id} className="rounded-2xl bg-surface p-4 shadow-[0_10px_30px_-18px_rgb(4_40_30/0.35)]">
              <div className="flex items-center gap-3">
                <IngredientPicture name={name} category={category} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold">{name}</h2>
                    <p className="shrink-0 font-semibold">
                      {fmt(total)} {unit}
                    </p>
                  </div>
                  <p className="text-[0.9375rem] text-ink-3">
                    {CATEGORIES[category] ?? category} · {ZONES[zone] ?? zone}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <form action={consume.bind(null, fridge_id, name, unit, "one")} className="flex flex-1">
                  <PendingButton className={btn}>−1</PendingButton>
                </form>
                <form action={consume.bind(null, fridge_id, name, unit, "half")} className="flex flex-1">
                  <PendingButton className={btn}>ใช้ครึ่งหนึ่ง</PendingButton>
                </form>
                <form action={consume.bind(null, fridge_id, name, unit, "all")} className="flex flex-1">
                  <PendingButton className={btn}>หมดแล้ว</PendingButton>
                </form>
              </div>
              <ul className="mt-3 flex flex-col border-t border-line pt-1">
                {lots.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/item/${l.id}`}
                      className="flex min-h-11 items-center justify-between gap-3 text-[0.9375rem] text-ink-2 hover:text-ink"
                    >
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        ซื้อ {day(l.bought_on)} <ExpiryBadge expiresAt={l.expires_at} today={today} />
                      </span>
                      <span className="shrink-0">
                        {fmt(l.qty)} {l.unit} · แก้ไข ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      {/* sign-out lives in the desktop top bar; on phones it sits here */}
      <form action={signOut} className="mt-4 lg:hidden">
        <button type="submit" className="flex min-h-11 items-center text-ink-2 underline hover:text-ink">
          ออกจากระบบ
        </button>
      </form>
    </main>
  );
}
