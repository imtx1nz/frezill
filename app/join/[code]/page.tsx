import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/auth/Logo";
import { JoinButton } from "./JoinButton";

export const metadata: Metadata = { title: "เข้าร่วมบ้าน" };

export default async function JoinPage({ params }: PageProps<"/join/[code]">) {
  const { code: raw } = await params;
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  const supabase = await createClient();

  const [{ data: preview }, { data: auth }] = await Promise.all([
    supabase.rpc("invite_preview", { invite: code }),
    supabase.auth.getUser(),
  ]);
  const invite = (preview as { household_name: string; member_count: number }[] | null)?.[0];
  const next = `/join/${code}`;

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-4 pb-10 pt-6">
      <Wordmark />
      <div className="mt-12 flex flex-col gap-6">
        {!invite ? (
          <>
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.02em]">ลิงก์เชิญใช้ไม่ได้แล้ว</h1>
            <p className="text-ink-2">ลิงก์นี้อาจหมดอายุ (ใช้ได้ 7 วัน) หรือเจ้าของบ้านยกเลิกไปแล้ว ขอลิงก์ใหม่จากคนที่ชวนคุณ</p>
            <Link href={auth.user ? "/today" : "/login"} className="font-semibold text-brand underline-offset-4 hover:underline">
              {auth.user ? "กลับหน้าวันนี้" : "ไปหน้าเข้าสู่ระบบ"}
            </Link>
          </>
        ) : (
          <>
            <header>
              <p className="text-ink-2">คุณได้รับคำเชิญให้ใช้ตู้เย็นร่วมกับ</p>
              <h1 className="mt-1 text-[2rem] font-bold leading-tight tracking-[-0.02em]">{invite.household_name}</h1>
              <p className="mt-1 text-ink-2">ตอนนี้มีสมาชิก {invite.member_count} คน</p>
            </header>
            {auth.user ? (
              <JoinButton code={code} name={invite.household_name} />
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href={`/signup?next=${encodeURIComponent(next)}`}
                  className="flex h-13 items-center justify-center rounded-xl bg-brand text-[1.0625rem] font-semibold text-white hover:bg-brand-ink"
                >
                  สมัครแล้วเข้าร่วม
                </Link>
                <Link
                  href={`/login?next=${encodeURIComponent(next)}`}
                  className="flex h-13 items-center justify-center rounded-xl border border-line bg-surface text-base font-semibold text-ink hover:border-ink-3"
                >
                  มีบัญชีแล้ว เข้าสู่ระบบ
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
