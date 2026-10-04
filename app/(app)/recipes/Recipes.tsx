"use client";

import { useActionState } from "react";
import { Clock, Sparkles, TriangleAlert } from "lucide-react";
import { Notice } from "@/components/auth/Notice";
import { PendingButton } from "@/components/inventory/PendingButton";
import { inputClass } from "@/components/inventory/LotFields";
import { cookMenu } from "../fridge/actions";
import { suggest, type State } from "./actions";

const card = "rounded-2xl bg-surface p-5 shadow-[0_10px_30px_-18px_rgb(4_40_30/0.35)]";
const primary =
  "flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white hover:bg-brand-ink";
const fmt = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

export function Recipes() {
  const [state, action] = useActionState<State>(suggest, {});
  return (
    <>
      <form action={action}>
        <PendingButton className={primary}>
          <Sparkles className="size-5" /> {state.menus ? "ขอเมนูใหม่" : "ขอเมนูจากของในตู้"}
        </PendingButton>
      </form>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.left !== undefined && <p className="-mt-3 text-[0.9375rem] text-ink-3">วันนี้ขอได้อีก {state.left} ครั้ง</p>}

      {state.menus?.map((m, i) => {
        const own = m.ingredients.filter((g) => g.inFridge);
        return (
          <article key={i} className={card}>
            <h2 className="text-lg font-semibold">{m.name}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[0.9375rem] text-ink-3">
              <Clock className="size-4" /> {m.minutes} นาที · {m.difficulty}
            </p>
            {m.uses_urgent.length > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-soon-soft px-2.5 py-1 text-[0.9375rem] font-medium text-soon">
                <TriangleAlert className="size-4 shrink-0" /> ใช้ของใกล้หมด: {m.uses_urgent.join(", ")}
              </p>
            )}
            <ul className="mt-3 flex flex-col gap-1 text-[0.9375rem]">
              {m.ingredients.map((g) => (
                <li key={g.name} className="flex justify-between gap-3">
                  <span>{g.name}</span>
                  <span className="text-ink-3">
                    {fmt(g.qty)} {g.unit} · {g.inFridge ? "ในตู้" : "ของในครัว"}
                  </span>
                </li>
              ))}
            </ul>
            {m.missing.length > 0 && (
              <p className="mt-2 text-[0.9375rem] text-ink-2">ต้องซื้อเพิ่ม: {m.missing.join(", ")}</p>
            )}
            <ol className="mt-3 list-decimal space-y-1 pl-5 leading-relaxed">
              {m.steps.map((s, j) => (
                <li key={j}>{s}</li>
              ))}
            </ol>
            <p className="mt-3 rounded-xl bg-ice px-3 py-2 text-[0.9375rem] text-ink-2">
              เมนูนี้แนะนำโดย AI โปรดตรวจสภาพวัตถุดิบก่อนปรุง
            </p>
            {own.length > 0 && state.fridgeId && (
              <details className="mt-3">
                <summary className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-line font-semibold text-brand-ink hover:border-brand">
                  ทำเมนูนี้แล้ว
                </summary>
                <form action={cookMenu.bind(null, state.fridgeId)} className="mt-3 flex flex-col gap-3">
                  <p className="text-[0.9375rem] text-ink-2">ตรวจหรือแก้ปริมาณที่ใช้จริง แล้วกดยืนยันเพื่อตัดออกจากตู้ (ของที่หมดอายุก่อนตัดก่อน)</p>
                  {own.map((g) => (
                    <label key={g.name} className="flex items-center gap-3 text-[0.9375rem]">
                      <span className="flex-1 font-semibold">{g.name}</span>
                      <input type="hidden" name="name" value={g.name} />
                      <input type="hidden" name="unit" value={g.unit} />
                      <input name="qty" type="number" inputMode="decimal" min={0} step="any" defaultValue={g.qty} className={`${inputClass} !w-28`} />
                      <span className="w-12 text-ink-3">{g.unit}</span>
                    </label>
                  ))}
                  <PendingButton className={primary}>ยืนยัน ตัดของออกจากตู้</PendingButton>
                </form>
              </details>
            )}
          </article>
        );
      })}
    </>
  );
}
