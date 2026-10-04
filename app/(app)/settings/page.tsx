import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { mailReady } from "@/lib/notify";
import { signOut } from "@/app/(auth)/actions";
import { NotifySettings } from "./NotifySettings";

export const metadata: Metadata = { title: "การตั้งค่า" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Before migration 0005 runs, the select errors → defaults.
  const { data: p } = await supabase.from("profiles").select("notify_email, notify_days").eq("id", user.id).maybeSingle();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 pb-10 pt-5">
      <h1 className="font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.01em] lg:text-[2.25rem]">การตั้งค่า</h1>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[1.25rem] font-medium text-outline">การแจ้งเตือน</h2>
        {mailReady() ? (
          <NotifySettings email={user.email ?? ""} on={p?.notify_email ?? true} days={p?.notify_days ?? 3} />
        ) : (
          <p className="card-game p-5 text-ink-2">ยังไม่ได้ตั้งค่าระบบอีเมล</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[1.25rem] font-medium text-outline">บัญชี</h2>
        <div className="card-game p-5">
          <p className="text-[0.9375rem] text-ink-2">อีเมล</p>
          <p className="font-semibold [overflow-wrap:anywhere]">{user.email}</p>
        </div>
      </section>

      <form action={signOut} className="mt-auto">
        <button type="submit" className="btn-candy btn-red w-full">
          <LogOut className="size-5" strokeWidth={2.5} aria-hidden="true" /> ออกจากระบบ
        </button>
      </form>
    </main>
  );
}
