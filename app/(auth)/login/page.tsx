import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { enabledProviders } from "@/lib/auth/providers";
import { safeNext } from "@/lib/auth/redirect";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

const LINK_ERRORS: Record<string, string> = {
  link: "ลิงก์หมดอายุหรือถูกใช้ไปแล้ว ลองเข้าสู่ระบบ หรือขอลิงก์ใหม่อีกครั้ง",
  oauth: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ ลองอีกครั้ง",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [sp, { google }] = await Promise.all([searchParams, enabledProviders()]);
  const next = typeof sp.next === "string" ? safeNext(sp.next) : undefined;
  const linkError = typeof sp.error === "string" ? LINK_ERRORS[sp.error] : undefined;

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-[1.875rem] font-bold leading-tight tracking-[-0.02em]">ยินดีต้อนรับกลับ</h1>
        <p className="mt-1.5 text-ink-2">เข้าสู่ระบบเพื่อดูว่าวันนี้ในตู้มีอะไรต้องใช้ก่อน</p>
      </header>
      {google && (
        <>
          <GoogleButton next={next} label="เข้าสู่ระบบด้วย Google" />
          <OrDivider />
        </>
      )}
      <LoginForm next={next} linkError={linkError} />
      <p className="text-center text-ink-2">
        ยังไม่มีบัญชี?{" "}
        <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-semibold text-brand underline-offset-4 hover:underline">
          สมัครฟรี
        </Link>
      </p>
    </div>
  );
}
