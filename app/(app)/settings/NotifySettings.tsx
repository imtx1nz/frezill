"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Notice } from "@/components/auth/Notice";
import { saveNotify, sendTest } from "./actions";

type S = { on: boolean; days: number };

export function NotifySettings({ email, on, days }: { email: string; on: boolean; days: number }) {
  const [s, setS] = useOptimistic<S, Partial<S>>({ on, days }, (cur, p) => ({ ...cur, ...p }));
  const [, start] = useTransition();
  const [sending, startSend] = useTransition();
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const save = (p: Partial<S>) =>
    start(async () => {
      setS(p);
      const r = await saveNotify({ notify_email: p.on, notify_days: p.days });
      if (!r.ok) setMsg({ tone: "error", text: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" });
    });

  return (
    <div className="card-game flex flex-col gap-4 p-5">
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
        <span className="font-semibold">แจ้งเตือนทางอีเมล</span>
        <input
          type="checkbox"
          role="switch"
          checked={s.on}
          onChange={(e) => save({ on: e.target.checked })}
          className="relative h-8 w-14 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-outline bg-[#d9d6ce] shadow-[0_2px_0_var(--outline)] transition-colors before:absolute before:left-0.5 before:top-0.5 before:size-6 before:rounded-full before:border-2 before:border-outline before:bg-white before:transition-transform checked:bg-[var(--candy-green)] checked:before:translate-x-6 motion-reduce:before:transition-none"
        />
      </label>

      {s.on && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-[0.9375rem] text-ink-2">เตือนล่วงหน้า</span>
            <div className="flex gap-2">
              {[1, 2, 3].map((d) => (
                <button key={d} type="button" aria-pressed={s.days === d} onClick={() => save({ days: d })} className="chip">
                  {d} วัน
                </button>
              ))}
            </div>
          </div>
          <p className="text-[0.9375rem] text-ink-2 [overflow-wrap:anywhere]">
            ส่งทุกเช้าประมาณ 08:00 ไปที่ {email}
          </p>
        </>
      )}

      <button
        type="button"
        disabled={sending}
        onClick={() =>
          startSend(async () => {
            const r = await sendTest();
            setMsg(r.ok ? { tone: "success", text: `ส่งแล้ว ลองเช็กอีเมล ${email}` } : { tone: "error", text: r.error ?? "ส่งไม่สำเร็จ" });
          })
        }
        className="btn-candy btn-cream w-full"
      >
        <Send className="size-5" strokeWidth={2.5} aria-hidden="true" /> {sending ? "กำลังส่ง…" : "ส่งอีเมลทดสอบ"}
      </button>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </div>
  );
}
