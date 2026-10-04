"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { IngredientPicture, pictureFile } from "@/components/IngredientPicture";
import type { HomeItem, Place } from "@/lib/home";
import { Flies } from "./Flies";
import { QtyBadge, ToneBadge, fmt, statusText } from "./status";

export type ItemHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerEnter: (e: React.PointerEvent, item: HomeItem) => void;
  onPointerLeave: () => void;
  onClick: (e: React.MouseEvent<HTMLButtonElement>, item: HomeItem) => void;
};

type Props = Omit<FridgeProps, "freezerRef" | "chillRef">;
type FridgeProps = {
  byPlace: Record<Place, HomeItem[]>;
  today: string;
  flies: Map<string, number>;
  spot: "urgent" | "week" | null;
  popId: string | null;
  over: "freezer" | "chill" | null;
  openKey: string | null;
  canWrite: boolean;
  freezerRef: React.RefObject<HTMLDivElement | null>;
  chillRef: React.RefObject<HTMLDivElement | null>;
  handlers: ItemHandlers;
};

const SPOT = { urgent: ["urgent", "expired"], week: ["week"] };

/** The open fridge (§3.1–3.4): freezer, 3 shelves, crisper drawer, door bins; mobile caps 4, desktop 6. */
export function Fridge({ freezerRef, chillRef, ...p }: FridgeProps) {
  const empty = Object.values(p.byPlace).every((l) => l.length === 0);
  const list = (place: Place, label: string, cls: string, mcap: number, dcap: number, small = false) => (
    <ItemList {...p} items={p.byPlace[place]} label={label} className={cls} mcap={mcap} dcap={dcap} small={small} />
  );
  const shelf = (place: Place, label: string, extra?: React.ReactNode) => (
    <div className="relative flex min-h-0 flex-1 flex-col justify-end px-1">
      {extra}
      {list(place, label, "flex items-end gap-2 px-1 pb-1.5", 3, 5)}
      <div className="shelf-lip" />
    </div>
  );

  return (
    <section
      aria-label="ในตู้เย็น"
      className="mx-auto w-full max-w-[480px] [perspective:1200px] lg:max-w-[440px] lg:[perspective:1400px]"
    >
      <div className="fridge-cab relative h-[clamp(540px,calc(100dvh-150px-var(--peek)-var(--tabbar-h)-24px),640px)] [transform-style:preserve-3d] [transform:rotateX(2deg)] lg:h-[clamp(560px,calc(100dvh-120px),720px)] lg:[transform:rotateY(-8deg)_rotateX(3deg)]">
        <div ref={chillRef} className="fridge-in grid h-full grid-cols-[1fr_64px] lg:grid-cols-1 lg:[transform-style:preserve-3d]">
          <div className="relative z-[1] flex min-h-0 flex-col gap-1.5 p-2">
            {/* freezer */}
            <div
              ref={freezerRef}
              className="relative flex h-[22%] min-h-[104px] flex-col rounded-2xl border-2 border-outline bg-[var(--freezer)] px-2 pb-1.5 pt-1"
            >
              <p className="flex items-center justify-between text-[0.875rem] font-semibold text-[var(--freezer-ink)]">
                ช่องแช่แข็ง <span className="rounded-full bg-white/70 px-2 tabular-nums">−18°</span>
              </p>
              {list("freezer", "ช่องแช่แข็ง", "flex flex-1 items-end gap-2 px-1", 3, 5)}
              <div className="drop-target" data-on={p.over === "freezer" || undefined}>
                แช่แข็ง
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col gap-1.5">
              {shelf("top", "ชั้นบน")}
              {shelf(
                "middle",
                "ชั้นกลาง",
                empty && (
                  <p className="absolute inset-x-2 top-1/2 flex -translate-y-1/2 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand bg-white/60 px-3 py-3 text-center font-medium text-brand-ink">
                    {p.canWrite ? (
                      <>
                        <span className="lg:hidden">กดค้างที่ของด้านล่างแล้วลากมาใส่</span>
                        <span className="max-lg:hidden">ลากของจากแถบขวามาวางในตู้</span>
                        <ArrowDown className="size-5 shrink-0 lg:hidden" strokeWidth={2.5} aria-hidden="true" />
                        <ArrowRight className="size-5 shrink-0 max-lg:hidden" strokeWidth={2.5} aria-hidden="true" />
                      </>
                    ) : (
                      "ตู้ยังว่างอยู่"
                    )}
                  </p>
                ),
              )}
              {shelf("bottom", "ชั้นล่าง")}
              {/* crisper drawer */}
              <div className="h-[84px] shrink-0 rounded-[14px] border-2 border-outline bg-white/55 px-1 lg:h-[92px]">
                {list("drawer", "ลิ้นชักผัก", "flex h-full items-end gap-2 px-1 pb-1", 3, 5)}
              </div>
              <div className="drop-target !inset-0" data-on={p.over === "chill" || undefined}>
                ช่องธรรมดา
              </div>
            </div>
          </div>

          {/* door: a strip on the right on phones; hangs open on the left on desktop */}
          <div className="relative border-l-2 border-white py-2 lg:absolute lg:-inset-y-[14px] lg:right-[calc(100%+14px)] lg:w-[150px] lg:origin-right lg:rounded-l-[28px] lg:border-[length:var(--ow-lg)] lg:border-outline lg:bg-[var(--cab)] lg:px-2 lg:[transform:rotateY(55deg)]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-1 inset-y-2 grid grid-rows-3 lg:inset-x-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-2.5 self-end rounded-md border-2 border-outline bg-white" />
              ))}
            </div>
            {list("door", "ช่องประตู", "relative grid h-full grid-rows-3 justify-items-center pb-2 lg:grid-cols-2", 3, 6, true)}
          </div>
        </div>
      </div>
    </section>
  );
}

function ItemList({
  items,
  label,
  className,
  mcap,
  dcap,
  small,
  ...p
}: Props & { items: HomeItem[]; label: string; className: string; mcap: number; dcap: number; small: boolean }) {
  const n = items.length;
  const mShow = n > mcap ? mcap - 1 : mcap;
  const dShow = n > dcap ? dcap - 1 : dcap;
  const more = "chip grid size-11 shrink-0 place-items-center self-center !p-0 !text-[0.875rem]";
  return (
    <ul aria-label={label} className={className}>
      {items.slice(0, dShow).map((it, i) => (
        <li key={it.key} className={`relative self-end ${i >= mShow ? "max-lg:hidden" : ""}`}>
          <Item item={it} small={small} {...p} />
        </li>
      ))}
      {n > mShow && (
        <li className="self-end pb-0.5 lg:hidden">
          <Link href="/fridge" className={more} aria-label={`ดูอีก ${n - mShow} อย่าง`}>
            +{n - mShow}
          </Link>
        </li>
      )}
      {n > dShow && (
        <li className="self-end pb-0.5 max-lg:hidden">
          <Link href="/fridge" className={more} aria-label={`ดูอีก ${n - dShow} อย่าง`}>
            +{n - dShow}
          </Link>
        </li>
      )}
    </ul>
  );
}

/** Shelf items: 64 phone / 72 desktop; door-bin items stay 48 / 56 to fit the narrow door. */
function Item({ item, small, ...p }: Props & { item: HomeItem; small: boolean }) {
  const l = item.soon;
  const art = pictureFile(l.name, l.category);
  const dim = p.spot && !SPOT[p.spot].includes(item.tone);
  const flies = p.flies.get(item.key);
  return (
    <button
      type="button"
      className={`fitem ${small ? "size-12 lg:size-14" : "size-16 lg:size-[72px]"}`}
      data-dim={dim || undefined}
      data-pop={item.lots.some((x) => x.id === p.popId) || undefined}
      aria-expanded={p.openKey === item.key}
      aria-controls="details"
      aria-label={`${l.name} ${fmt(item.total)} ${l.unit}, ${statusText(l.expires_at, p.today)}`}
      onPointerDown={p.handlers.onPointerDown}
      onPointerEnter={(e) => p.handlers.onPointerEnter(e, item)}
      onPointerLeave={p.handlers.onPointerLeave}
      onClick={(e) => p.handlers.onClick(e, item)}
    >
      <IngredientPicture name={l.name} category={l.category} size={small ? 48 : 64} className="lg:hidden" />
      <IngredientPicture name={l.name} category={l.category} size={small ? 56 : 72} className="max-lg:hidden" />
      {art && (
        <span
          aria-hidden="true"
          className="chip absolute bottom-0.5 left-0.5 z-[1] block !min-h-0 max-w-[calc(100%-30px)] truncate !px-1.5 !text-[0.75rem] !leading-[1.2]"
        >
          {l.name}
        </span>
      )}
      <ToneBadge tone={item.tone} expiresAt={l.expires_at} today={p.today} className="absolute -left-1.5 -top-1.5 z-[2] !h-[18px] !gap-px !pl-0.5 !pr-1 !text-[0.75rem] [&>svg]:size-3" />
      <QtyBadge n={item.total} className="!h-[18px] !text-[0.75rem]" />
      {flies && <Flies n={flies} />}
    </button>
  );
}
