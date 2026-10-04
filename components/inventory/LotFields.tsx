import { CATEGORIES, UNITS, ZONES } from "@/lib/inventory";
import { todayIn } from "@/lib/expiry";
import { NameInput } from "./NameInput";

export const inputClass =
  "h-13 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-brand focus:shadow-[0_0_0_4px_var(--brand-soft)]";
const labelClass = "flex flex-col gap-1.5 text-[0.9375rem] font-semibold";

type Lot = { name: string; qty: number; unit: string; category: string; zone: string; expires_at: string | null; bought_on?: string };

type Existing = Pick<Lot, "name" | "qty" | "unit" | "expires_at">;

/** `existing` (add page only) turns on name suggestions + the "ยังมี … อยู่" warning. */
export function LotFields({ lot, existing }: { lot?: Lot; existing?: Existing[] }) {
  return (
    <>
      <label className={labelClass}>
        ชื่อวัตถุดิบ
        {existing ? (
          <NameInput className={inputClass} existing={existing} />
        ) : (
          <input name="name" required maxLength={60} defaultValue={lot?.name} placeholder="เช่น ไข่ไก่" className={inputClass} />
        )}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          จำนวน
          <input
            name="qty"
            type="number"
            inputMode="decimal"
            required
            min="0.001"
            step="any"
            defaultValue={lot?.qty ?? 1}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          หน่วย
          <input name="unit" required maxLength={20} list="units" defaultValue={lot?.unit ?? "ชิ้น"} className={inputClass} />
          <datalist id="units">
            {UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </label>
      </div>
      <label className={labelClass}>
        วันหมดอายุ (ไม่บังคับ)
        <input name="expires_at" type="date" defaultValue={lot?.expires_at ?? ""} className={inputClass} />
      </label>
      <label className={labelClass}>
        วันที่ซื้อ
        <input name="bought_on" type="date" max={todayIn()} defaultValue={lot?.bought_on ?? todayIn()} className={inputClass} />
      </label>
      <label className={labelClass}>
        หมวดหมู่
        <select name="category" defaultValue={lot?.category ?? "other"} className={inputClass}>
          {Object.entries(CATEGORIES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[0.9375rem] font-semibold">เก็บที่</legend>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(ZONES).map(([v, l]) => (
            <label
              key={v}
              className="flex h-13 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface font-medium has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-ink"
            >
              <input type="radio" name="zone" value={v} defaultChecked={(lot?.zone ?? "chill") === v} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
