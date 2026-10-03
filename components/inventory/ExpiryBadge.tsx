import { CircleCheck, Clock, Minus, TriangleAlert } from "lucide-react";
import { expiryBadge } from "@/lib/expiry";

const ICONS = { expired: TriangleAlert, today: TriangleAlert, soon: Clock, safe: CircleCheck, none: Minus };

export function ExpiryBadge({ expiresAt, today }: { expiresAt: string | null; today: string }) {
  const { status, label, tone } = expiryBadge(expiresAt, today);
  const Icon = ICONS[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-[0.875rem] font-semibold ${tone}`}>
      <Icon className="size-4" /> {label}
    </span>
  );
}
