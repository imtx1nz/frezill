"use client";

import { useActionState } from "react";
import { resetPassword } from "../actions";
import { Field } from "@/components/auth/Field";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import type { FormState } from "@/lib/auth/schemas";

export default function ResetPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(resetPassword, {});

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-[1.875rem] font-bold leading-tight tracking-[-0.02em]">ตั้งรหัสผ่านใหม่</h1>
        <p className="mt-1.5 text-ink-2">ตั้งแล้วจะเข้าสู่ระบบให้อัตโนมัติ</p>
      </header>
      <form action={action} noValidate className="flex flex-col gap-5">
        {state.error && <Notice tone="error">{state.error}</Notice>}
        <Field label="รหัสผ่านใหม่" name="password" type="password" autoComplete="new-password" error={state.fieldErrors?.password} hint="อย่างน้อย 8 ตัวอักษร" autoFocus />
        <Field label="ยืนยันรหัสผ่านใหม่" name="confirm" type="password" autoComplete="new-password" error={state.fieldErrors?.confirm} />
        <SubmitButton pendingText="กำลังบันทึก…">บันทึกรหัสผ่าน</SubmitButton>
      </form>
    </div>
  );
}
