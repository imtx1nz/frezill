import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-[1.875rem] font-bold leading-tight tracking-[-0.02em]">สร้างบัญชี</h1>
        <p className="mt-1.5 text-ink-2">สมัครแล้วได้ “บ้าน” กับตู้เย็นของคุณทันที ชวนคนในบ้านมาใช้ร่วมกันได้</p>
      </header>
      <GoogleButton label="สมัครด้วย Google" />
      <OrDivider />
      <SignupForm />
      <p className="text-center text-ink-2">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
