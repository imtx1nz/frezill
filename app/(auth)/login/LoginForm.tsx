"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "../actions";
import { Field } from "@/components/auth/Field";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import type { FormState } from "@/lib/auth/schemas";

export function LoginForm({ next, linkError }: { next?: string; linkError?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  const error = state.error ?? linkError;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {error && <Notice tone="error">{error}</Notice>}
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="อีเมล" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <div className="flex flex-col gap-2">
        <Field label="รหัสผ่าน" name="password" type="password" autoComplete="current-password" error={state.fieldErrors?.password} />
        <Link href="/forgot-password" className="self-end py-1 text-[0.9375rem] font-medium text-brand underline-offset-4 hover:underline">
          ลืมรหัสผ่าน?
        </Link>
      </div>
      <SubmitButton pendingText="กำลังเข้าสู่ระบบ…">เข้าสู่ระบบ</SubmitButton>
    </form>
  );
}
