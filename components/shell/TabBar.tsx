"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, History, LogOut, Refrigerator } from "lucide-react";
import { LogoMark } from "@/components/auth/Logo";

const TABS = [
  { href: "/today", label: "ตู้เย็น", Icon: Refrigerator, match: ["/today", "/fridge", "/item"] },
  { href: "/history", label: "ประวัติ", Icon: History, match: ["/history"] },
  { href: "/recipes", label: "เมนู AI", Icon: ChefHat, match: ["/recipes"] },
];

/** 3-tab shell: navy glass bar at the bottom on phones, a transparent top bar on desktop. */
export function TabBar({ ai, signOut }: { ai: boolean; signOut: () => Promise<void> }) {
  const path = usePathname();
  const tabs = TABS.filter((t) => ai || t.href !== "/recipes"); // no dead buttons without a key
  const active = (m: string[]) => m.some((p) => path === p || path.startsWith(`${p}/`));

  return (
    <>
      {/* desktop top bar */}
      <header className="relative z-30 hidden h-16 items-center justify-between px-8 lg:flex">
        <Link href="/today" className="on-wall flex items-center gap-2 rounded-xl">
          <LogoMark className="size-9" />
          <span className="font-display text-[1.375rem] font-semibold text-outline">frezill</span>
        </Link>
        <nav aria-label="แท็บหลัก" className="flex gap-2">
          {tabs.map(({ href, label, Icon, match }) => {
            const on = active(match);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={on ? "btn-candy btn-wall !min-h-11 !px-4 !text-base" : "chip !bg-cream/80 !px-4"}
              >
                <Icon className="size-5" strokeWidth={2.5} aria-hidden="true" /> {label}
              </Link>
            );
          })}
        </nav>
        <form action={signOut}>
          <button type="submit" className="chip">
            <LogOut className="size-4.5" strokeWidth={2.5} aria-hidden="true" /> ออกจากระบบ
          </button>
        </form>
      </header>

      {/* phone tab bar */}
      <nav
        aria-label="แท็บหลัก"
        className="panel fixed inset-x-0 bottom-0 z-40 flex h-[var(--tabbar-h)] !rounded-b-none !border-x-0 !border-b-0 pb-[env(safe-area-inset-bottom)] !shadow-[inset_0_2px_0_var(--panel-rim)] lg:hidden"
      >
        {tabs.map(({ href, label, Icon, match }) => {
          const on = active(match);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <span
                className={`grid h-8 w-14 place-items-center rounded-full ${
                  on ? "btn-candy btn-wall !min-h-8 !border-2 !px-0 after:!hidden" : ""
                }`}
              >
                <Icon className={`size-6 ${on ? "text-outline" : "text-white"}`} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className={`text-[0.875rem] leading-tight ${on ? "font-semibold text-wall" : "font-medium text-white"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
