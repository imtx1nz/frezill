"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { ChevronRight, Plus, Refrigerator, Snowflake } from "lucide-react";
import { IngredientPicture } from "@/components/IngredientPicture";
import { CATEGORIES, ZONES } from "@/lib/inventory";
import { thaiDate } from "@/lib/expiry";
import type { CatalogItem } from "@/lib/catalog";
import type { HomeItem } from "@/lib/home";
import { StatusRow, fmt } from "./status";

export type CardBase = ({ mode: "lot"; item: HomeItem } | { mode: "cat"; cat: CatalogItem }) & { key: string };
export type CardTarget = CardBase & {
  anchor: HTMLElement;
  pinned: boolean;
  focus: boolean;
};

const W = 272;

/** Hover/tap details (§5). Positioned from the trigger's rect: above with a caret, flips below near the top. */
export function DetailsCard({
  card,
  today,
  canWrite,
  onAdd,
  onEnter,
  onLeave,
}: {
  card: CardTarget;
  today: string;
  canWrite: boolean;
  onAdd: (cat: CatalogItem) => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const action = useRef<HTMLAnchorElement & HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const el = ref.current!;
    const r = card.anchor.getBoundingClientRect();
    const h = el.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const left = Math.min(Math.max(r.left + r.width / 2 - W / 2, 16), vw - 16 - W);
    let top = r.top - 10 - h;
    const below = top < 72;
    if (below) top = r.bottom + 10;
    el.style.left = `${left}px`;
    el.style.top = `${Math.max(16, Math.min(top, window.innerHeight - h - 16))}px`;
    el.style.setProperty("--caret", `${Math.min(Math.max(r.left + r.width / 2 - left, 24), W - 24)}px`);
    el.dataset.below = below ? "1" : "";
    el.style.transformOrigin = `var(--caret) ${below ? "0" : "100%"}`;
    el.style.visibility = "visible";
  }, [card]);

  useEffect(() => {
    if (card.focus) action.current?.focus();
  }, [card]);

  const caret =
    "absolute left-[calc(var(--caret)-8px)] size-4 rotate-45 border-outline bg-cream";

  return (
    <div
      ref={ref}
      id="details"
      role="dialog"
      aria-modal="false"
      aria-labelledby="details-title"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className="details-card card-game fixed z-50 flex w-[272px] flex-col gap-3 p-4 !shadow-[0_5px_0_var(--outline),var(--sh-lift)]"
      style={{ visibility: "hidden", left: 0, top: 0 }}
    >
      {card.mode === "lot" ? <LotBody item={card.item} today={today} actionRef={action} /> : <CatBody cat={card.cat} />}
      {card.mode === "cat" && canWrite && (
        <button ref={action} type="button" onClick={() => onAdd(card.cat)} className="btn-candy w-full">
          <Plus className="size-5" strokeWidth={3} aria-hidden="true" /> เพิ่มเข้าตู้
        </button>
      )}
      {/* caret: two variants, shown by data-below on the card */}
      <span aria-hidden="true" className={`${caret} -bottom-[10px] border-r-[3px] border-b-[3px] [[data-below='1']_&]:hidden`} />
      <span aria-hidden="true" className={`${caret} -top-[10px] hidden border-l-[3px] border-t-[3px] [[data-below='1']_&]:block`} />
    </div>
  );
}

function Head({ name, category, sub }: { name: string; category: CatalogItem["category"]; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <IngredientPicture name={name} category={category} size={72} className="m-1.5" />
      <div className="min-w-0">
        <h2 id="details-title" className="font-display text-[1.25rem] font-medium leading-tight text-outline">
          {name}
        </h2>
        <p className="text-[0.9375rem] text-ink-2">{sub}</p>
      </div>
    </div>
  );
}

function LotBody({
  item,
  today,
  actionRef,
}: {
  item: HomeItem;
  today: string;
  actionRef: React.RefObject<(HTMLAnchorElement & HTMLButtonElement) | null>;
}) {
  const l = item.soon;
  const many = item.lots.length > 1;
  return (
    <>
      <Head name={l.name} category={l.category} sub={`${CATEGORIES[l.category] ?? l.category} · ${ZONES[l.zone]}`} />
      {many && <p className="-mt-1 text-[0.9375rem] font-medium text-ink-2">มี {item.lots.length} ล็อต · ล็อตที่ใกล้หมดที่สุด</p>}
      <StatusRow tone={item.tone} expiresAt={l.expires_at} today={today} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.9375rem]">
        <dt className="text-ink-2">ซื้อเมื่อ</dt>
        <dd className="text-right">{thaiDate(l.bought_on)}</dd>
        <dt className="text-ink-2">จำนวน</dt>
        <dd className="text-right">
          {fmt(l.qty)} {l.unit}
          {many && (
            <span className="text-ink-2">
              {" "}
              (รวม {fmt(item.total)} {l.unit})
            </span>
          )}
        </dd>
        {l.expires_at && (
          <>
            <dt className="text-ink-2">หมดอายุ</dt>
            <dd className="flex items-center justify-end gap-1.5">
              {thaiDate(l.expires_at)}
              {l.expiry_guessed && (
                <span className="rounded-full border-2 border-outline bg-week-soft px-1.5 text-[0.875rem] font-semibold leading-tight text-week-ink">
                  ≈ เดา
                </span>
              )}
            </dd>
          </>
        )}
      </dl>
      <Link ref={actionRef} href={`/item/${l.id}`} className="btn-candy btn-blue w-full">
        จัดการ <ChevronRight className="size-5" strokeWidth={3} aria-hidden="true" />
      </Link>
    </>
  );
}

function CatBody({ cat }: { cat: CatalogItem }) {
  const frozen = cat.zone === "freezer";
  const Icon = frozen ? Snowflake : Refrigerator;
  return (
    <>
      <Head name={cat.name} category={cat.category} sub={`ประเภท: ${CATEGORIES[cat.category]}`} />
      <div className="flex gap-2 rounded-xl bg-ice px-3 py-2.5 text-ink">
        <Icon className="mt-0.5 size-5 shrink-0 text-ink-2" strokeWidth={2.5} aria-hidden="true" />
        <p className="leading-snug">
          เก็บใน{ZONES[cat.zone]}ได้ประมาณ <b className="font-display text-[1.25rem] font-semibold tabular-nums">{cat.days}</b> วัน
          {!frozen && (
            <span className="block text-[0.9375rem] text-ink-2">
              {cat.freezerDays ? `ช่องแช่แข็ง ~${cat.freezerDays} วัน` : "ไม่แนะนำให้แช่แข็ง"}
            </span>
          )}
        </p>
      </div>
    </>
  );
}
