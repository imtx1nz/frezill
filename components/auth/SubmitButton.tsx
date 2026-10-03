"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[1.0625rem] font-semibold text-white shadow-[0_6px_16px_-6px_rgb(11_122_92/0.55)] transition-[background-color,transform,box-shadow] duration-150 hover:bg-brand-ink active:translate-y-px active:shadow-[0_3px_10px_-6px_rgb(11_122_92/0.6)] disabled:cursor-wait disabled:opacity-80"
    >
      {pending && <LoaderCircle className="size-5 animate-spin" />}
      {pending ? pendingText : children}
    </button>
  );
}
