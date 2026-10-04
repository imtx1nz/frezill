import { CircleCheck, Clock, Minus, TriangleAlert } from "lucide-react";
import { expiryBadge } from "@/lib/expiry";

const ICONS = { expired: TriangleAlert, today: TriangleAlert, soon: Clock, safe: CircleCheck, none: Minus };

export function ExpiryBadge({ expiresAt, today, compact = false }: { expiresAt: string | null; today: string; compact?: boolean }) {
  const { status, label, tone } = expiryBadge(expiresAt, today);
  const Icon = ICONS[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-lg font-semibold ${compact ? "gap-0.5 px-1.5 text-[0.8125rem] leading-5" : "gap-1 px-2 py-0.5 text-[0.875rem]"} ${tone}`}
    >
      <Icon className={compact ? "size-3.5" : "size-4"} /> {label}
    </span>
  );
}
