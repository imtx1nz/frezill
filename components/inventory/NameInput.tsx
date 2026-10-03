"use client";

import { useState } from "react";
import { thaiDate } from "@/lib/expiry";

type Existing = { name: string; qty: number; unit: string; expires_at: string | null };

/** Name field that suggests what's already in the fridge and warns "ยังมี … อยู่" before adding a duplicate. */
export function NameInput({ className, existing }: { className: string; existing: Existing[] }) {
  const [name, setName] = useState("");
  const same = existing.filter((l) => l.name === name.trim());
  const byUnit = new Map<string, { qty: number; exp: string | null }>();
  for (const l of same) {
    const cur = byUnit.get(l.unit) ?? { qty: 0, exp: null };
    const exp = l.expires_at && (!cur.exp || l.expires_at < cur.exp) ? l.expires_at : cur.exp;
    byUnit.set(l.unit, { qty: cur.qty + Number(l.qty), exp });
  }
  return (
    <>
      <input
        name="name"
        required
        maxLength={60}
        list="names"
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="เช่น ไข่ไก่"
        className={className}
      />
      <datalist id="names">
        {[...new Set(existing.map((l) => l.name))].map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      {[...byUnit].map(([unit, { qty, exp }]) => (
        <p key={unit} role="status" className="rounded-xl bg-soon-soft px-3 py-2 font-medium text-soon">
          ยังมี{name.trim()} {qty.toLocaleString("th-TH", { maximumFractionDigits: 2 })} {unit}
          {exp ? ` หมด ${thaiDate(exp)}` : ""} อยู่ในตู้
        </p>
      ))}
    </>
  );
}
