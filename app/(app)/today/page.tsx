import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Refrigerator, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { LogoMark } from "@/components/auth/Logo";
import { Notice } from "@/components/auth/Notice";
import { ExpiryBadge } from "@/components/inventory/ExpiryBadge";
import { byExpiry, expiryStatus, thaiDate, todayIn } from "@/lib/expiry";

export const metadata: Metadata = { title: "วันนี้" };

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: memberships }, { data: lots }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("role, households(id, name, timezone, fridges(id, name))")
      .eq("user_id", user.id),
    supabase.from("lots").select("id, name, qty, unit, expires_at").gt("qty", 0),
  ]);

  // Without generated DB types the embedded relation is typed as an array; it is a single row here.
  type Household = { id: string; name: string; timezone: string; fridges: { id: string; name: string }[] };
  const household = memberships?.[0]?.households as unknown as Household | undefined;
  const name = profile?.display_name || user.email?.split("@")[0];
  const { reset } = await searchParams;

  const today = todayIn(household?.timezone);
  const rows = (lots ?? []).sort(byExpiry);
  const count = { expired: 0, today: 0, soon: 0, safe: 0, none: 0 };
  for (const l of rows) count[expiryStatus(l.expires_at, today)]++;
  const warnings = [
    count.expired && `หมดอายุแล้ว ${count.expired} รายการ`,
    count.today && `หมดวันนี้ ${count.today} รายการ`,
    count.soon && `ใกล้หมดใน 3 วัน ${count.soon} รายการ`,
  ].filter(Boolean);
  const card = "rounded-2xl bg-surface p-5 shadow-[0_10px_30px_-18px_rgb(4_40_30/0.35)]";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pb-10 pt-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10" />
          <div>
            <h1 className="text-[1.375rem] font-bold leading-tight tracking-[-0.02em]">สวัสดี {name}</h1>
            <p className="text-[0.9375rem] text-ink-2">{household?.name ?? "กำลังเตรียมบ้านของคุณ…"}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-[0.9375rem] font-medium text-ink-2 hover:border-ink-3 hover:text-ink"
          >
            <LogOut className="size-4.5" /> ออกจากระบบ
          </button>
        </form>
      </header>

      {reset && <Notice tone="success">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</Notice>}

      {warnings.length > 0 && (
        <div
          role="alert"
          className={`flex gap-3 rounded-xl px-4 py-3 leading-relaxed ${
            count.expired || count.today ? "bg-danger-soft text-danger" : "bg-soon-soft text-soon"
          }`}
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <p className="font-semibold">{warnings.join(" · ")}</p>
        </div>
      )}

      <Link href="/fridge" className={`${card} hover:shadow-[0_12px_32px_-16px_rgb(4_40_30/0.45)]`}>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
            <Refrigerator className="size-6" />
          </span>
          <div>
            <p className="font-semibold">{household?.fridges?.[0]?.name ?? "ตู้เย็น"}</p>
            <p className="text-[0.9375rem] text-ink-2">ดูของในตู้ เพิ่ม ลด หรือแก้ไข ›</p>
          </div>
        </div>
      </Link>

      {rows.length > 0 && (
        <section className={card}>
          <h2 className="text-lg font-semibold">
            สรุปวันนี้ <span className="font-normal text-ink-3">· {thaiDate(today)} · เรียงตามวันหมดอายุ</span>
          </h2>
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {rows.map((l) => (
              <li key={l.id}>
                <Link href={`/item/${l.id}`} className="flex min-h-12 items-center justify-between gap-3 py-1.5 hover:text-brand-ink">
                  <span>
                    {l.name}{" "}
                    <span className="text-[0.9375rem] text-ink-3">
                      {Number(l.qty).toLocaleString("th-TH", { maximumFractionDigits: 2 })} {l.unit}
                      {l.expires_at ? ` · ${thaiDate(l.expires_at)}` : ""}
                    </span>
                  </span>
                  <ExpiryBadge expiresAt={l.expires_at} today={today} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
