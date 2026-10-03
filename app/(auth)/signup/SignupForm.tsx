"use client";

import { useActionState } from "react";
import { signUp } from "../actions";
import { Field } from "@/components/auth/Field";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import type { FormState } from "@/lib/auth/schemas";

export function SignupForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, {});

  if (state.success) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="success">{state.success}</Notice>
        <p className="text-[0.9375rem] text-ink-2">ไม่เจออีเมล? ลองดูในโฟลเดอร์สแปมหรือโปรโมชัน</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Field label="ชื่อเล่น" name="displayName" autoComplete="nickname" defaultValue={state.values?.displayName} error={state.fieldErrors?.displayName} hint="คนในบ้านจะเห็นชื่อนี้" />
      <Field label="อีเมล" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <Field label="รหัสผ่าน" name="password" type="password" autoComplete="new-password" error={state.fieldErrors?.password} hint="อย่างน้อย 8 ตัวอักษร" />
      <SubmitButton pendingText="กำลังสร้างบัญชี…">สร้างบัญชี</SubmitButton>
    </form>
  );
}
