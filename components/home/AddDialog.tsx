"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { IngredientPicture } from "@/components/IngredientPicture";
import { Notice } from "@/components/auth/Notice";
import { PendingButton } from "@/components/inventory/PendingButton";
import { addLotFromHome, type AddState } from "@/app/(app)/fridge/actions";
import { guessExpiry, shelfDays, type CatalogItem, type Zone } from "@/lib/catalog";
import { CATEGORIES, UNITS, ZONES } from "@/lib/inventory";
import { thaiDate } from "@/lib/expiry";
import type { HomeItem } from "@/lib/home";
import { fmt } from "./status";

const field =
  "h-11 min-w-0 appearance-none rounded-xl border-2 border-outline bg-white px-3 text-base text-ink outline-none shadow-[inset_0_3px_0_rgb(27_31_59/0.08),0_2px_0_var(--outline)] focus:shadow-[inset_0_3px_0_rgb(27_31_59/0.08),0_2px_0_var(--outline),0_0_0_4px_var(--brand-soft)] [&::-webkit-calendar-picker-indicator]:opacity-70";
const step = "grid size-11 shrink-0 place-items-center rounded-xl border-2 border-outline bg-white text-outline shadow-[0_2px_0_var(--outline)] active:translate-y-0.5 active:shadow-none";

/** Short add form (§6): native <dialog>, preset zone, guessed expiry from catalog shelf life. */
export function AddDialog({
  cat,
  zone: zone0,
  today,
  items,
  onClose,
  onSaved,
}: {
  cat: CatalogItem;
  zone: Zone;
  today: string;
  items: HomeItem[];
  onClose: () => void;
  onSaved: (id: string, name: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState<AddState, FormData>(addLotFromHome, {});
  const [zone, setZone] = useState<Zone>(zone0);
  const [qty, setQty] = useState(1);
  const [bought, setBought] = useState(today);
  const [manual, setManual] = useState<string | null>(null);
  const guess = guessExpiry(cat, zone, bought);
  const expires = manual ?? guess;

  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => {
    if (state.ok && state.id) {
      ref.current?.close();
      onSaved(state.id, cat.name);
    }
  }, [state, cat.name, onSaved]);

  const have = items.filter((i) => i.soon.name === cat.name);

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="add-title" onClose={onClose}>
      <form action={action} className="flex flex-col gap-4 overflow-y-auto p-4 pb-[calc(16px+env(safe-area-inset-bottom))] lg:p-5">
        <input type="hidden" name="name" value={cat.name} />
        <input type="hidden" name="category" value={cat.category} />
        <input type="hidden" name="expiry_guessed" value={manual === null ? "1" : "0"} />

        <div className="flex items-start gap-3">
          <IngredientPicture name={cat.name} category={cat.category} size={72} className="m-1.5" />
          <div className="min-w-0 flex-1">
            <h2 id="add-title" className="font-display text-[1.25rem] font-medium leading-tight text-outline">
              เพิ่ม {cat.name}
            </h2>
            <p className="text-[0.9375rem] text-ink-2">{CATEGORIES[cat.category]}</p>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="ปิด"
            className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-outline bg-white text-outline"
          >
            <X className="size-5" strokeWidth={3} aria-hidden="true" />
          </button>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[0.9375rem] font-semibold">เก็บใน</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ZONES) as Zone[]).map((z) => (
              <label
                key={z}
                className="flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-outline bg-white font-semibold text-outline has-checked:bg-panel has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-brand"
              >
                <input type="radio" name="zone" value={z} checked={zone === z} onChange={() => setZone(z)} className="sr-only" />
                {ZONES[z]}
              </label>
            ))}
          </div>
          {zone === "freezer" && cat.freezerDays === null && (
            <p className="mt-1.5 text-[0.9375rem] text-week-ink">ไม่แนะนำให้แช่แข็ง</p>
          )}
        </fieldset>

        {have.map((i) => (
          <p key={i.key} role="status" className="rounded-xl bg-week-soft px-3 py-2 font-medium text-week-ink">
            ยังมี{cat.name} {fmt(i.total)} {i.soon.unit}
            {i.soon.expires_at ? ` หมด ${thaiDate(i.soon.expires_at)}` : ""}
          </p>
        ))}

        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="add-qty" className="text-[0.9375rem] font-semibold">
              จำนวน
            </label>
            <div className="flex gap-1.5">
              <button type="button" className={step} aria-label="ลดจำนวน" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="size-5" strokeWidth={3} aria-hidden="true" />
              </button>
              <input
                id="add-qty"
                name="qty"
                type="number"
                inputMode="decimal"
                min="0.001"
                step="any"
                required
                autoFocus
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className={`${field} w-20 text-center tabular-nums`}
              />
              <button type="button" className={step} aria-label="เพิ่มจำนวน" onClick={() => setQty((q) => q + 1)}>
                <Plus className="size-5" strokeWidth={3} aria-hidden="true" />
              </button>
            </div>
          </div>
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[0.9375rem] font-semibold">
            หน่วย
            <select name="unit" defaultValue={cat.unit} className={`${field} w-full`}>
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-[0.9375rem] font-semibold">
          <span>
            วันหมดอายุ{" "}
            <span className="font-medium text-ink-2">
              {manual === null ? `≈ เดา จากอายุเก็บ ${shelfDays(cat, zone)} วัน` : "แก้เอง"}
            </span>
          </span>
          <input name="expires_at" type="date" value={expires} onChange={(e) => setManual(e.target.value)} className={`${field} w-full`} />
        </label>
        <label className="flex flex-col gap-1.5 text-[0.9375rem] font-semibold">
          วันที่ซื้อ
          <input
            name="bought_on"
            type="date"
            max={today}
            value={bought}
            onChange={(e) => setBought(e.target.value || today)}
            className={`${field} w-full`}
          />
        </label>

        {state.error && <Notice tone="error">{state.error}</Notice>}
        <PendingButton className="btn-candy !min-h-[52px] w-full">บันทึกเข้าตู้</PendingButton>
      </form>
    </dialog>
  );
}
