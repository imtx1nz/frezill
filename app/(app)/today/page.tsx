import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Refrigerator } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { LogoMark } from "@/components/auth/Logo";
import { Notice } from "@/components/auth/Notice";

export const metadata: Metadata = { title: "วันนี้" };

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("role, households(id, name, fridges(id, name))")
      .eq("user_id", user.id),
  ]);

  // Without generated DB types the embedded relation is typed as an array; it is a single row here.
  type Household = { id: string; name: string; fridges: { id: string; name: string }[] };
  const household = memberships?.[0]?.households as unknown as Household | undefined;
  const name = profile?.display_name || user.email?.split("@")[0];
  const { reset } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pb-10 pt-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10" />
          <div>
            <h1 className="text-[1.375rem] font-bold leading-tight tracking-[-0.02em]">สวัสดี {name}</h1>
            <p className="text-[0.9375rem] text-ink-2">{household?.name ?? "กำลังเตรียมบ้านของคุณ…"}</p>
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

      {reset && <Notice tone="success">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</Notice>}

      <Link
        href="/fridge"
        className="rounded-2xl bg-surface p-5 shadow-[0_10px_30px_-18px_rgb(4_40_30/0.35)] hover:shadow-[0_12px_32px_-16px_rgb(4_40_30/0.45)]"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
            <Refrigerator className="size-6" />
          </span>
          <div>
            <p className="font-semibold">{household?.fridges?.[0]?.name ?? "ตู้เย็น"}</p>
            <p className="text-[0.9375rem] text-ink-2">ดูของในตู้ เพิ่ม ลด หรือแก้ไข ›</p>
          </div>
        </div>
      </Link>
    </main>
  );
}
