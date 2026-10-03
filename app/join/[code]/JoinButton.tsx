"use client";

import { useActionState } from "react";
import { joinHousehold, type JoinState } from "./actions";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";

export function JoinButton({ code, name }: { code: string; name: string }) {
  const [state, action] = useActionState<JoinState, FormData>(joinHousehold, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <input type="hidden" name="code" value={code} />
      <SubmitButton pendingText="กำลังเข้าร่วม…">เข้าร่วม “{name}”</SubmitButton>
    </form>
  );
}
