"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft } from "lucide-react";
import { forgotPassword } from "../actions";
import { Field } from "@/components/auth/Field";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import type { FormState } from "@/lib/auth/schemas";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(forgotPassword, {});

  return (
    <div className="flex flex-col gap-7">
      <Link href="/login" className="-ml-1 flex w-fit items-center gap-1.5 py-1 font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-5" /> กลับไปเข้าสู่ระบบ
      </Link>
      <header>
        <h1 className="text-[1.875rem] font-bold leading-tight tracking-[-0.02em]">ลืมรหัสผ่าน</h1>
        <p className="mt-1.5 text-ink-2">ใส่อีเมลที่ใช้สมัคร เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้</p>
      </header>
      {state.success ? (
        <Notice tone="success">{state.success}</Notice>
      ) : (
        <form action={action} noValidate className="flex flex-col gap-5">
          {state.error && <Notice tone="error">{state.error}</Notice>}
          <Field label="อีเมล" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.fieldErrors?.email} />
          <SubmitButton pendingText="กำลังส่ง…">ส่งลิงก์ตั้งรหัสใหม่</SubmitButton>
        </form>
      )}
    </div>
  );
}
