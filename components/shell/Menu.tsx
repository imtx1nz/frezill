"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronRight, List, LogOut, Menu as MenuIcon, Settings, X } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const item = "flex min-h-12 items-center gap-3 rounded-2xl border-2 border-outline bg-white px-4 font-semibold text-outline shadow-[0_2px_0_var(--outline)]";

/** ≡ button + sheet: who you are, settings, list view, sign-out at the bottom. */
export function Menu({ name, household, className = "" }: { name: string; household: string; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        aria-label="เมนู"
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
        className={`on-wall grid size-11 shrink-0 place-items-center rounded-2xl border-[length:var(--ow-md)] border-outline bg-white text-outline shadow-[0_3px_0_var(--outline)] ${className}`}
      >
        <MenuIcon className="size-5" strokeWidth={2.5} aria-hidden="true" />
      </button>
      <dialog ref={ref} className="sheet" aria-labelledby="menu-name" onClick={(e) => e.target === ref.current && close()}>
        <div className="flex flex-col gap-6 p-4 pb-[calc(16px+env(safe-area-inset-bottom))] lg:p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 id="menu-name" className="font-display text-[1.25rem] font-medium leading-tight text-outline [overflow-wrap:anywhere]">
                {name}
              </h2>
              <p className="text-[0.9375rem] text-ink-2">{household}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="ปิด"
              className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-outline bg-white text-outline"
            >
              <X className="size-5" strokeWidth={3} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="เมนู" className="flex flex-col gap-3">
            <Link href="/settings" onClick={close} className={item}>
              <Settings className="size-5" strokeWidth={2.5} aria-hidden="true" />
              <span className="flex-1">การตั้งค่า</span>
              <ChevronRight className="size-5" strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <Link href="/fridge" onClick={close} className={item}>
              <List className="size-5" strokeWidth={2.5} aria-hidden="true" />
              <span className="flex-1">ดูของเป็นรายการ</span>
              <ChevronRight className="size-5" strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </nav>

          <form action={signOut}>
            <button type="submit" className="btn-candy btn-red w-full">
              <LogOut className="size-5" strokeWidth={2.5} aria-hidden="true" /> ออกจากระบบ
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
