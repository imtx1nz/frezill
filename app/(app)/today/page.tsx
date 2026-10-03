import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, LogOut, Refrigerator, UsersRound } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { LogoMark } from "@/components/auth/Logo";
import { Notice } from "@/components/auth/Notice";
import { getCurrentHousehold } from "@/lib/household";

export const metadata: Metadata = { title: "วันนี้" };

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const [data, sp] = await Promise.all([getCurrentHousehold(), searchParams]);
  if (!data) redirect("/login");
  const { household, displayName } = data;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pb-10 pt-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark className="size-10 shrink-0" />
          <div className="min-w-0">
            <h1 className="truncate text-[1.375rem] font-bold leading-tight tracking-[-0.02em]">สวัสดี {displayName}</h1>
            <p className="truncate text-[0.9375rem] text-ink-2">{household?.name ?? "ยังไม่มีบ้าน"}</p>
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

      {sp.reset && <Notice tone="success">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</Notice>}
      {sp.joined && household && <Notice tone="success">เข้าร่วม “{household.name}” แล้ว ตู้เย็นของบ้านนี้แสดงอยู่ด้านล่าง</Notice>}

      <section className="rounded-2xl bg-surface p-5 shadow-[0_10px_30px_-18px_rgb(4_40_30/0.35)]">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
            <Refrigerator className="size-6" />
          </span>
          <div>
            <p className="font-semibold">{household?.fridges[0]?.name ?? "ตู้เย็น"}</p>
            <p className="text-[0.9375rem] text-ink-2">ยังว่างอยู่ ระบบเพิ่มวัตถุดิบจะมาใน M2</p>
          </div>
        </div>
      </section>

      {household && (
        <Link
          href="/household"
          className="flex items-center gap-3 rounded-2xl bg-surface p-5 shadow-[0_10px_30px_-18px_rgb(4_40_30/0.35)] transition-shadow hover:shadow-[0_14px_34px_-16px_rgb(4_40_30/0.4)]"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
            <UsersRound className="size-6" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">คนในบ้าน · {household.members.length} คน</p>
            <p className="text-[0.9375rem] text-ink-2">
              {household.myRole === "owner" ? "ชวนคนในบ้านมาใช้ตู้เย็นร่วมกัน" : "ดูสมาชิกและบ้านอื่นของคุณ"}
            </p>
          </div>
          <ChevronRight className="size-5 text-ink-3" />
        </Link>
      )}
    </main>
  );
}
