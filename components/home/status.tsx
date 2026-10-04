import { CircleCheck, Clock, Minus, TriangleAlert } from "lucide-react";
import { daysLeft, type HomeTone } from "@/lib/expiry";

export const fmt = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

/** "ควรบริโภคภายใน N วัน" copy per tone (§5). Colour always ships with an icon and words. */
export function statusText(expiresAt: string | null, today: string) {
  if (!expiresAt) return "ไม่ได้ระบุวันหมดอายุ";
  const d = daysLeft(expiresAt, today);
  if (d < 0) return `หมดอายุแล้ว ${-d} วัน`;
  if (d === 0) return "ควรบริโภควันนี้";
  return `ควรบริโภคภายใน ${d} วัน`;
}

const ROW = {
  fresh: { cls: "bg-brand-soft text-brand-ink", Icon: CircleCheck },
  week: { cls: "bg-week-soft text-week-ink", Icon: Clock },
  urgent: { cls: "bg-urgent-soft text-urgent-ink", Icon: TriangleAlert },
  expired: { cls: "bg-expired text-white", Icon: TriangleAlert },
  none: { cls: "bg-ice text-ink-2", Icon: Minus },
} as const;

export function StatusRow({ tone, expiresAt, today }: { tone: HomeTone; expiresAt: string | null; today: string }) {
  const { cls, Icon } = ROW[tone];
  const d = expiresAt ? daysLeft(expiresAt, today) : 0;
  const stat = "font-display text-[1.5rem] font-semibold leading-none tabular-nums";
  return (
    <p className={`flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium ${cls}`}>
      <Icon className="size-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      <span>
        {tone === "none" ? (
          "ไม่ได้ระบุวันหมดอายุ"
        ) : d < 0 ? (
          <>
            <b className="font-semibold">หมดอายุแล้ว <span className={stat}>{-d}</span> วัน</b> · ตรวจสภาพก่อนกิน
          </>
        ) : d === 0 ? (
          <>
            ควรบริโภค <b className="font-display text-[1.25rem] font-semibold">วันนี้</b>
          </>
        ) : (
          <>
            ควรบริโภคภายใน <span className={stat}>{d}</span> วัน{tone === "urgent" && " · รีบใช้นะ"}
          </>
        )}
      </span>
    </p>
  );
}

/** Round outlined badge for a fridge item: nothing when calm. */
export function ToneBadge({ tone, expiresAt, today, className = "" }: { tone: HomeTone; expiresAt: string | null; today: string; className?: string }) {
  if (tone === "fresh" || tone === "none" || !expiresAt) return null;
  const d = daysLeft(expiresAt, today);
  const Icon = tone === "week" ? Clock : TriangleAlert;
  return (
    <span data-tone={tone} className={`badge ${className}`} aria-hidden="true">
      <Icon className="size-3.5" strokeWidth={3} />
      {tone === "expired" ? "หมด" : d === 0 ? "วันนี้" : d}
    </span>
  );
}
