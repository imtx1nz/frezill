"use client";

import { useActionState } from "react";
import { ChefHat, Clock, Gauge, Info, TriangleAlert } from "lucide-react";
import { Notice } from "@/components/auth/Notice";
import { PendingButton } from "@/components/inventory/PendingButton";
import { IngredientPicture } from "@/components/IngredientPicture";
import { ToneBadge, fmt } from "@/components/home/status";
import { catalogMatch, type Category } from "@/lib/catalog";
import type { HomeTone } from "@/lib/expiry";
import { cookMenu } from "../fridge/actions";
import { suggest, type State } from "./actions";

export type Known = Record<string, { category: Category; tone: HomeTone; expires_at: string | null }>;

const metaChip = "inline-flex items-center gap-1 rounded-full bg-ice px-2.5 py-0.5 text-[0.9375rem] font-medium text-ink-2";

export function Recipes({ known, today }: { known: Known; today: string }) {
  const [state, action, pending] = useActionState<State>(suggest, {});
  const cat = (name: string): Category => known[name]?.category ?? catalogMatch(name)?.category ?? "other";

  return (
    <>
      <form action={action} className="flex flex-col gap-2">
        <PendingButton className="btn-candy !min-h-14 w-full !text-[1.125rem]">
          <ChefHat className="size-6" strokeWidth={2.5} aria-hidden="true" /> {state.menus ? "ขอเมนูใหม่" : "คิดเมนูให้หน่อย"}
        </PendingButton>
        {state.left !== undefined && <p className="text-center text-[0.9375rem] text-ink-2">วันนี้ขอได้อีก {state.left} ครั้ง</p>}
      </form>
      {state.error && <Notice tone="error">{state.error}</Notice>}

      {pending &&
        [0, 1, 2].map((i) => (
          <div key={i} aria-hidden="true" className="card-game flex flex-col gap-3 p-5">
            {["h-14 w-40", "h-6 w-3/4", "h-4 w-1/2", "h-4 w-full", "h-4 w-5/6"].map((c, j) => (
              <div key={j} className={`${c} animate-[pulse-soft_900ms_ease-in-out_infinite_alternate] rounded-lg bg-line`} />
            ))}
          </div>
        ))}
      {pending && <p className="sr-only" role="status">กำลังคิดเมนู</p>}

      {!pending && !state.menus && !state.error && (
        <section
          aria-label="ยังไม่มีเมนู"
          className="card-game flex min-h-64 flex-1 flex-col items-center justify-center gap-5 border-dashed px-6 py-8 text-center"
        >
          <div aria-hidden="true" className="relative flex items-end pt-3">
            <IngredientPicture name="ไข่ไก่" category="dairy_egg" size={72} className="-rotate-6" />
            <IngredientPicture name="คะน้า" category="veg" size={96} className="z-[1] mx-1 -translate-y-2" />
            <IngredientPicture name="หมูสับ" category="meat" size={72} className="rotate-6" />
            <span className="absolute -top-3 right-[72px] z-[2] grid size-11 translate-x-1/2 place-items-center rounded-full border-[length:var(--ow-md)] border-outline bg-wall text-outline shadow-[0_3px_0_var(--outline)]">
              <ChefHat className="size-6" strokeWidth={2.5} />
            </span>
          </div>
          <p className="max-w-[20rem] font-medium text-ink-2">กดปุ่มด้านบน แล้ว AI จะหยิบของในตู้มาคิดเป็นเมนูให้ ของใกล้หมดได้ไปก่อน</p>
        </section>
      )}

      {!pending &&
        state.menus?.map((m, i) => {
          const own = m.ingredients.filter((g) => g.inFridge);
          const cluster = [...m.ingredients]
            .sort((a, b) => Number(m.uses_urgent.includes(b.name)) - Number(m.uses_urgent.includes(a.name)))
            .slice(0, 4);
          return (
            <article key={i} className="card-game p-5">
              <div className="flex pl-1.5 pt-1.5" aria-hidden="true">
                {cluster.map((g, j) => (
                  <span key={g.name} className={`relative ${j ? "-ml-3" : ""}`} style={{ zIndex: 4 - j }}>
                    <IngredientPicture name={g.name} category={cat(g.name)} size={56} />
                    {m.uses_urgent.includes(g.name) && known[g.name] && (
                      <ToneBadge tone={known[g.name].tone} expiresAt={known[g.name].expires_at} today={today} className="absolute -right-2 -top-2" />
                    )}
                  </span>
                ))}
              </div>
              <h2 className="mt-3 font-display text-[1.25rem] font-medium leading-tight text-outline">{m.name}</h2>
              <p className="mt-1.5 flex flex-wrap gap-2">
                <span className={metaChip}>
                  <Clock className="size-4" strokeWidth={2.5} aria-hidden="true" /> {m.minutes} นาที
                </span>
                <span className={metaChip}>
                  <Gauge className="size-4" strokeWidth={2.5} aria-hidden="true" /> {m.difficulty}
                </span>
              </p>
              {m.uses_urgent.length > 0 && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-urgent-soft px-3 py-2 font-medium text-urgent-ink">
                  <TriangleAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2.5} aria-hidden="true" /> ใช้ของใกล้หมด: {m.uses_urgent.join(", ")}
                </p>
              )}
              <ul className="mt-3 flex flex-col gap-1.5">
                {m.ingredients.map((g) => (
                  <li key={g.name} className="flex items-center gap-3">
                    <IngredientPicture name={g.name} category={cat(g.name)} size={48} />
                    <span className="min-w-0 flex-1">{g.name}</span>
                    <span className="text-right text-[0.9375rem] text-ink-2">
                      {fmt(g.qty)} {g.unit}
                      {!g.inFridge && <span className="block">ของในครัว</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {m.missing.length > 0 && (
                <>
                  <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-2">ต้องซื้อเพิ่ม</h3>
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {m.missing.map((n) => (
                      <li key={n} className="flex items-center gap-3">
                        <span className="rounded-2xl border-2 border-dashed border-line p-0.5">
                          <IngredientPicture name={n} category={cat(n)} size={48} className="opacity-70" />
                        </span>
                        <span className="min-w-0 flex-1">{n}</span>
                        <span className="text-[0.9375rem] text-ink-2">ซื้อเพิ่ม</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <ol className="mt-4 flex flex-col gap-2 leading-relaxed">
                {m.steps.map((s, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-outline bg-wall font-display font-semibold text-ink">
                      {j + 1}
                    </span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 flex gap-2 rounded-xl bg-ice px-3 py-2 text-[0.9375rem] text-ink-2">
                <Info className="mt-0.5 size-4.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                เมนูนี้แนะนำโดย AI โปรดตรวจสภาพวัตถุดิบก่อนปรุง
              </p>
              {own.length > 0 && state.fridgeId && (
                <details className="mt-3">
                  <summary className="btn-candy btn-blue w-full list-none [&::-webkit-details-marker]:hidden">ทำเมนูนี้แล้ว</summary>
                  <form action={cookMenu.bind(null, state.fridgeId)} className="mt-3 flex flex-col gap-3">
                    <p className="text-[0.9375rem] text-ink-2">ตรวจหรือแก้ปริมาณที่ใช้จริง แล้วกดยืนยันเพื่อตัดออกจากตู้ (ของที่หมดอายุก่อนตัดก่อน)</p>
                    {own.map((g) => (
                      <label key={g.name} className="flex items-center gap-3 text-[0.9375rem]">
                        <IngredientPicture name={g.name} category={cat(g.name)} size={48} />
                        <span className="min-w-0 flex-1 font-semibold">{g.name}</span>
                        <input type="hidden" name="name" value={g.name} />
                        <input type="hidden" name="unit" value={g.unit} />
                        <input
                          name="qty"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          defaultValue={g.qty}
                          className="h-11 w-24 rounded-xl border-2 border-outline bg-white px-3 text-base"
                        />
                        <span className="w-12 text-ink-2">{g.unit}</span>
                      </label>
                    ))}
                    <PendingButton className="btn-candy w-full">ยืนยัน ตัดของออกจากตู้</PendingButton>
                  </form>
                </details>
              )}
            </article>
          );
        })}
    </>
  );
}
