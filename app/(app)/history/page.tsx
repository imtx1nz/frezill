import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, CircleCheck, Minus, Plus, Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IngredientPicture } from "@/components/IngredientPicture";
import { fmt } from "@/components/home/status";
import type { Category } from "@/lib/catalog";
import { dayStartIn, daysLeft, todayIn } from "@/lib/expiry";
import { dayLabel, groupByDay, minusDays, type HistoryEvent, type HistoryKind } from "@/lib/history";

export const metadata: Metadata = { title: "ประวัติ" };

const DAYS = 30;
const FILTERS = [
  { key: "", label: "ทั้งหมด" },
  { key: "add", label: "เพิ่มเข้า" },
  { key: "use", label: "ใช้" },
  { key: "discard", label: "ทิ้ง" },
] as const;
const PILL: Record<HistoryKind, { label: string; cls: string; Icon: typeof Plus }> = {
  add: { label: "เพิ่ม", cls: "bg-brand-soft text-brand-ink", Icon: Plus },
  use: { label: "ใช้", cls: "bg-ice text-ink-2", Icon: Minus },
  finish: { label: "หมดแล้ว", cls: "bg-brand-soft text-brand-ink", Icon: CircleCheck },
  discard: { label: "ทิ้ง", cls: "bg-urgent-soft text-urgent-ink", Icon: Trash2 },
};
const verb = (e: HistoryEvent) =>
  ({
    add: `เพิ่ม ${fmt(e.qty)} ${e.unit}`,
    use: `ใช้ไป ${fmt(e.qty)} ${e.unit}`,
    finish: "ใช้หมดแล้ว",
    discard: `ทิ้ง ${fmt(e.qty)} ${e.unit}`,
  })[e.kind];
/** Start of a calendar day in the household timezone (noon UTC is the same calendar day for UTC−12…+11). */
const startOf = (day: string, tz: string) => dayStartIn(tz, new Date(`${day}T12:00:00Z`));

type LotRow = { id: string; name: string; unit: string; category: string; qty: number; created_at: string; created_by: string | null; usage_logs: { qty: number }[] };
type LogRow = { id: string; action: "use" | "finish" | "discard"; qty: number; reason: string | null; created_at: string; user_id: string | null; lot_id: string; lots: { name: string; unit: string; category: string; qty: number } };

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const type = typeof sp.type === "string" && ["add", "use", "discard"].includes(sp.type) ? sp.type : "";
  const { data: m } = await supabase.from("memberships").select("households(timezone)").eq("user_id", user.id).limit(1).maybeSingle();
  const tz = (m?.households as unknown as { timezone: string } | undefined)?.timezone ?? "Asia/Bangkok";
  const today = todayIn(tz);
  const before = typeof sp.before === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.before) && sp.before <= today ? sp.before : null;
  const endDay = before ?? minusDays(today, -1);
  const startDay = minusDays(endDay, DAYS);
  const [from, to] = [startOf(startDay, tz), startOf(endDay, tz)];

  const [{ data: lots }, { data: logs }, { data: people }, { count: older }] = await Promise.all([
    supabase
      .from("lots")
      .select("id, name, unit, category, qty, created_at, created_by, usage_logs(qty)")
      .gte("created_at", from)
      .lt("created_at", to),
    supabase
      .from("usage_logs")
      .select("id, action, qty, reason, created_at, user_id, lot_id, lots!inner(name, unit, category, qty)")
      .gte("created_at", from)
      .lt("created_at", to),
    supabase.from("profiles").select("id, display_name"),
    supabase.from("lots").select("id", { count: "exact", head: true }).lt("created_at", from),
  ]);

  const names = new Map((people ?? []).map((p) => [p.id, p.display_name as string]));
  const who = (id: string | null) => (id === user.id ? "คุณ" : (id && names.get(id)) || "คนในบ้าน");
  const all: HistoryEvent[] = [
    ...((lots ?? []) as unknown as LotRow[]).map((l) => ({
      id: `a${l.id}`,
      kind: "add" as const,
      at: l.created_at,
      name: l.name,
      unit: l.unit,
      category: l.category,
      qty: Number(l.qty) + l.usage_logs.reduce((s, u) => s + Number(u.qty), 0),
      who: who(l.created_by),
      reason: null,
      lotId: l.id,
      live: Number(l.qty) > 0,
    })),
    ...((logs ?? []) as unknown as LogRow[]).map((u) => ({
      id: u.id,
      kind: u.action,
      at: u.created_at,
      name: u.lots.name,
      unit: u.lots.unit,
      category: u.lots.category,
      qty: Number(u.qty),
      who: who(u.user_id),
      reason: u.reason,
      lotId: u.lot_id,
      live: Number(u.lots.qty) > 0,
    })),
  ];
  const shown = all.filter((e) => !type || e.kind === type || (type === "use" && e.kind === "finish"));
  const days = groupByDay(shown, tz);

  // "7 วันนี้" card (current window only)
  const weekStart = startOf(minusDays(today, 6), tz);
  const week = all.filter((e) => e.at >= weekStart);
  const used = week.filter((e) => e.kind === "use" || e.kind === "finish");
  const tossed = week.filter((e) => e.kind === "discard");
  const top = (list: HistoryEvent[]) => {
    const c = new Map<string, { n: number; e: HistoryEvent }>();
    for (const e of list) c.set(e.name, { n: (c.get(e.name)?.n ?? 0) + 1, e });
    return [...c.values()].sort((a, b) => b.n - a.n)[0]?.e;
  };
  const favorite = top(used);
  const lastToss = all.filter((e) => e.kind === "discard").sort((a, b) => b.at.localeCompare(a.at))[0];
  const oldest = all.reduce((o, e) => (e.at < o ? e.at : o), new Date().toISOString());
  const cleanDays = -daysLeft(todayIn(tz, new Date(lastToss?.at ?? oldest)), today);
  const time = (iso: string) => new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  const href = (q: { type?: string; before?: string | null }) => {
    const p = new URLSearchParams();
    if (q.type) p.set("type", q.type);
    if (q.before) p.set("before", q.before);
    const s = p.toString();
    return s ? `/history?${s}` : "/history";
  };

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-10 pt-5">
      <header>
        <h1 className="font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.01em] lg:text-[2.25rem]">ประวัติตู้เย็น</h1>
        <p className="text-[0.9375rem] text-ink-2">{before ? `30 วันก่อน ${dayLabel(minusDays(before, 1), today)}` : "30 วันล่าสุด"}</p>
      </header>

      {all.length === 0 ? (
        <section className="card-game flex flex-col items-center gap-4 p-8 text-center">
          <IngredientPicture name="ของ" category="other" size={96} />
          <p className="text-ink-2">ยังไม่มีประวัติ เริ่มจากเพิ่มของเข้าตู้</p>
          <Link href="/today" className="btn-candy">
            ไปที่ตู้เย็น
          </Link>
        </section>
      ) : (
        <>
          {!before && (
            <section className="card-game flex items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[1.25rem] font-medium text-outline">7 วันนี้</h2>
                <div className="mt-2 flex gap-6">
                  <p className="flex items-center gap-1.5 font-medium text-brand-ink">
                    <CircleCheck className="size-5" strokeWidth={2.5} aria-hidden="true" /> ใช้ทัน
                    <span className="font-display text-[1.5rem] font-semibold tabular-nums">{used.length}</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-medium text-urgent-ink">
                    <Trash2 className="size-5" strokeWidth={2.5} aria-hidden="true" /> ทิ้ง
                    <span className="font-display text-[1.5rem] font-semibold tabular-nums">{tossed.length}</span>
                  </p>
                </div>
                {tossed.length === 0 && cleanDays > 0 ? (
                  <p className="mt-2 flex items-center gap-2 font-medium">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-outline bg-[var(--star)]">
                      <Star className="size-4 fill-outline text-outline" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    ไม่มีของเสียมา {cleanDays} วันแล้ว เก่งมาก
                  </p>
                ) : tossed.length > 0 ? (
                  <p className="mt-2 text-ink-2">ของที่ทิ้งบ่อย: {top(tossed)?.name}</p>
                ) : null}
              </div>
              {favorite && (
                <IngredientPicture name={favorite.name} category={favorite.category as Category} size={96} className="m-1.5 max-[380px]:hidden" />
              )}
            </section>
          )}

          <nav aria-label="กรองประวัติ" className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-ice px-4 py-2 lg:top-0">
            {FILTERS.map((f) => (
              <Link key={f.key} href={href({ type: f.key, before })} aria-current={type === f.key ? "page" : undefined} className="chip shrink-0">
                {f.label}
              </Link>
            ))}
          </nav>

          {days.length === 0 && <p className="text-ink-2">ไม่มีรายการในช่วงนี้</p>}
          {days.map(({ day, items }) => {
            const n = (k: HistoryKind[]) => items.filter((e) => k.includes(e.kind)).length;
            const sum = [n(["add"]) && `+${n(["add"])}`, n(["use", "finish"]) && `ใช้ ${n(["use", "finish"])}`, n(["discard"]) && `ทิ้ง ${n(["discard"])}`]
              .filter(Boolean)
              .join(" · ");
            return (
              <section key={day} aria-label={dayLabel(day, today)}>
                <h2 className="mb-2 flex items-baseline justify-between gap-3 px-1">
                  <span className="font-display text-[1.125rem] font-medium">{dayLabel(day, today)}</span>
                  <span className="text-[0.9375rem] text-ink-2">{sum}</span>
                </h2>
                <ul className="card-game px-3 py-1">
                  {items.map((e) => {
                    const { label, cls, Icon } = PILL[e.kind];
                    const body = (
                      <>
                        <IngredientPicture name={e.name} category={e.category as Category} size={48} className="relative z-[1]" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="min-w-0 truncate">
                              <b className="font-semibold">{e.name}</b> {verb(e)}
                            </span>
                            <span className="shrink-0 text-[0.9375rem] tabular-nums text-ink-2">{time(e.at)}</span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[0.9375rem] text-ink-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 text-[0.875rem] font-semibold ${cls}`}>
                              <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" /> {label}
                            </span>
                            · {e.who}
                          </span>
                          {e.reason && <span className="mt-0.5 block text-[0.9375rem] text-ink-2">“{e.reason}”</span>}
                        </span>
                      </>
                    );
                    return (
                      <li
                        key={e.id}
                        className="relative not-last:border-b not-last:border-line not-last:after:absolute not-last:after:-bottom-3 not-last:after:left-[23px] not-last:after:top-12 not-last:after:border-l-2 not-last:after:border-dashed not-last:after:border-line"
                      >
                        {e.live ? (
                          <Link href={`/item/${e.lotId}`} className="flex min-h-16 items-start gap-3 py-2 hover:text-brand-ink">
                            {body}
                          </Link>
                        ) : (
                          <div className="flex min-h-16 items-start gap-3 py-2">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {(older ?? 0) > 0 && (
            <Link href={href({ type, before: startDay })} className="btn-candy btn-cream self-center">
              ดูเก่ากว่านี้ <ChevronRight className="size-5" strokeWidth={3} aria-hidden="true" />
            </Link>
          )}
        </>
      )}
    </main>
  );
}
