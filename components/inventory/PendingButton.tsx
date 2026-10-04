"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

// Disables while the server action runs so a double tap can't deduct twice.
export function PendingButton({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} aria-busy={pending || undefined} className={`${className} disabled:cursor-wait disabled:opacity-60`}>
      {pending ? <LoaderCircle className="size-4.5 animate-spin" aria-label="กำลังบันทึก" /> : children}
    </button>
  );
}
