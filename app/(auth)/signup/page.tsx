import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { enabledProviders } from "@/lib/auth/providers";
import { safeNext } from "@/lib/auth/redirect";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const [sp, { google }] = await Promise.all([searchParams, enabledProviders()]);
  const next = typeof sp.next === "string" ? safeNext(sp.next) : undefined;
  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-[1.875rem] font-bold leading-tight tracking-[-0.02em]">สร้างบัญชี</h1>
        <p className="mt-1.5 text-ink-2">สมัครแล้วได้ “บ้าน” กับตู้เย็นของคุณทันที ชวนคนในบ้านมาใช้ร่วมกันได้</p>
      </header>
      {google && (
        <>
          <GoogleButton next={next} label="สมัครด้วย Google" />
          <OrDivider />
        </>
      )}
      <SignupForm next={next} />
      <p className="text-center text-ink-2">
        มีบัญชีแล้ว?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-brand underline-offset-4 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
