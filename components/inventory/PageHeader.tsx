import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ back, title, children }: { back: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-2">
      <Link
        href={back}
        aria-label="ย้อนกลับ"
        className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink-2 hover:text-ink"
      >
        <ChevronLeft className="size-5" />
      </Link>
      <h1 className="flex-1 text-[1.375rem] font-bold leading-tight tracking-[-0.02em]">{title}</h1>
      {children}
    </header>
  );
}
