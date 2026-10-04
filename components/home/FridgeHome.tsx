"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChefHat, ChevronRight, CircleCheck, Clock, List, TriangleAlert } from "lucide-react";
import { Notice } from "@/components/auth/Notice";
import { IngredientPicture } from "@/components/IngredientPicture";
import { ExpiryBadge } from "@/components/inventory/ExpiryBadge";
import type { CatalogItem, Zone } from "@/lib/catalog";
import { thaiDate } from "@/lib/expiry";
import { PLACES, flyCounts, groupItems, type HomeItem, type HomeLot, type Place } from "@/lib/home";
import { AddDialog } from "./AddDialog";
import { DetailsCard, type CardBase, type CardTarget } from "./DetailsCard";
import { Fridge } from "./Fridge";
import { SideBar } from "./SideBar";

type Drag = {
  cat: CatalogItem;
  tile: HTMLElement;
  pid: number;
  x0: number;
  y0: number;
  x: number;
  y: number;
  lastX: number;
  tilt: number;
  picked: boolean;
  timer: number;
  raf: number;
  over: "freezer" | "chill" | null;
};

const fine = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
const STORE = "frezill.sidebar.collapsed";

export function FridgeHome({
  name,
  household,
  today,
  lots,
  canWrite,
  ai,
  reset,
}: {
  name: string;
  household: string;
  today: string;
  lots: HomeLot[];
  canWrite: boolean;
  ai: boolean;
  reset: boolean;
}) {
  const router = useRouter();
  const items = useMemo(() => groupItems(lots, today), [lots, today]);
  const byPlace = useMemo(() => {
    const m = Object.fromEntries(PLACES.map((p) => [p, [] as HomeItem[]])) as Record<Place, HomeItem[]>;
    for (const it of items) m[it.place].push(it);
    return m;
  }, [items]);
  const flies = useMemo(() => flyCounts(items), [items]);
  const urgent = items.filter((i) => i.tone === "urgent" || i.tone === "expired");
  const week = items.filter((i) => i.tone === "week");

  const [spot, setSpot] = useState<"urgent" | "week" | null>(null);
  const [card, setCard] = useState<CardTarget | null>(null);
  const [form, setForm] = useState<{ cat: CatalogItem; zone: Zone; n: number } | null>(null);
  const [drag, setDrag] = useState<{ cat: CatalogItem; over: Drag["over"] } | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [popId, setPopId] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const [sheet, setSheet] = useState<"peek" | "expanded">("peek");
  const [collapsed, setCollapsedState] = useState(false);

  const freezerRef = useRef<HTMLDivElement>(null);
  const chillRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const d = useRef<Drag | null>(null);
  const blockClick = useRef(false);
  const lastPointer = useRef("mouse");
  const hoverT = useRef(0);
  const closeT = useRef(0);

  // Remembered collapse state (desktop). Read after mount so server and client HTML match.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a per-viewer preference
      if (localStorage.getItem(STORE) === "1") setCollapsedState(true);
    } catch {}
  }, []);
  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem(STORE, v ? "1" : "0");
    } catch {}
  };

  /* ───── details card ───── */
  const closeCard = useCallback((refocus = false) => {
    setCard((c) => {
      if (refocus) c?.anchor.focus();
      return null;
    });
  }, []);

  useEffect(() => {
    if (!card) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!card.anchor.contains(t) && !document.getElementById("details")?.contains(t)) closeCard();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && closeCard(true);
    const scroll = (e: Event) => {
      if (!document.getElementById("details")?.contains(e.target as Node)) closeCard();
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", scroll, true);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [card, closeCard]);

  const hoverIn = (e: React.PointerEvent, target: CardBase) => {
    if (e.pointerType !== "mouse" || !fine() || d.current?.picked) return;
    const anchor = e.currentTarget as HTMLElement;
    clearTimeout(closeT.current);
    clearTimeout(hoverT.current);
    hoverT.current = window.setTimeout(
      () => setCard((c) => (c?.pinned && c.key !== target.key ? c : ({ ...target, anchor, pinned: false, focus: false } as CardTarget))),
      250,
    );
  };
  const hoverOut = () => {
    clearTimeout(hoverT.current);
    clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setCard((c) => (c?.pinned ? c : null)), 120);
  };
  const toggle = (target: CardTarget) => setCard((c) => (c?.key === target.key && c.pinned ? null : target));

  /* ───── drag from the side bar (Pointer Events, no library) ───── */
  const zoneAt = (x: number, y: number): Drag["over"] => {
    const inside = (el: HTMLElement | null) => {
      const r = el?.getBoundingClientRect();
      return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    return inside(freezerRef.current) ? "freezer" : inside(chillRef.current) ? "chill" : null;
  };

  const frame = () => {
    const g = d.current;
    const el = ghostRef.current;
    if (!g || !el) return;
    g.raf = 0;
    const vx = g.x - g.lastX;
    g.lastX = g.x;
    g.tilt += (Math.max(-8, Math.min(8, vx * 0.6)) - g.tilt) * 0.2;
    el.style.transform = `translate3d(${g.x - 40}px, ${g.y - 40}px, 0) rotate(${g.tilt}deg)`;
    const over = zoneAt(g.x, g.y);
    if (over !== g.over) {
      g.over = over;
      setDrag((s) => s && { ...s, over });
    }
  };

  const pickup = () => {
    const g = d.current;
    if (!g) return;
    g.picked = true;
    setArmed(null);
    try {
      g.tile.setPointerCapture(g.pid);
    } catch {}
    navigator.vibrate?.(10);
    clearTimeout(hoverT.current);
    setCard(null);
    setSheet("peek");
    setDrag({ cat: g.cat, over: null });
    document.documentElement.dataset.dragging = "";
    setLive(`หยิบ${g.cat.name}แล้ว ลากไปวางในตู้`);
    requestAnimationFrame(frame);
  };

  const finish = () => {
    const g = d.current;
    d.current = null;
    if (g) {
      clearTimeout(g.timer);
      cancelAnimationFrame(g.raf);
    }
    delete document.documentElement.dataset.dragging;
    setArmed(null);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    window.removeEventListener("keydown", onKey);
  };

  const flyBack = (g: Drag) => {
    const el = ghostRef.current;
    const r = g.tile.getBoundingClientRect();
    setLive(`ยกเลิก วาง${g.cat.name}กลับที่เดิม`);
    const done = () => setDrag(null);
    if (!el) return done();
    el.animate(
      [
        { transform: el.style.transform, opacity: 1 },
        { transform: `translate3d(${r.left + r.width / 2 - 40}px, ${r.top + r.height / 2 - 40}px, 0)`, opacity: 1, offset: 0.7 },
        { transform: `translate3d(${r.left + r.width / 2 - 40}px, ${r.top + r.height / 2 - 40}px, 0)`, opacity: 0 },
      ],
      { duration: 280, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "forwards" },
    ).onfinish = done;
  };

  function onMove(e: PointerEvent) {
    const g = d.current;
    if (!g || e.pointerId !== g.pid) return;
    g.x = e.clientX;
    g.y = e.clientY;
    const dist = Math.hypot(g.x - g.x0, g.y - g.y0);
    if (!g.picked) {
      if (e.pointerType === "mouse" ? dist > 4 : false) pickup();
      else if (e.pointerType !== "mouse" && dist > 8) finish(); // scroll wins
      return;
    }
    if (!g.raf) g.raf = requestAnimationFrame(frame);
  }
  function onUp(e: PointerEvent) {
    const g = d.current;
    if (!g || e.pointerId !== g.pid) return;
    finish();
    if (!g.picked) return; // a plain tap/click: onClick handles it
    blockClick.current = true;
    setTimeout(() => (blockClick.current = false), 0);
    const over = zoneAt(e.clientX, e.clientY);
    if (!over) return flyBack(g);
    const el = ghostRef.current?.firstElementChild as HTMLElement | null;
    chillRef.current?.animate([{ transform: "translateY(2px)" }, { transform: "none" }], { duration: 140, easing: "ease-out" });
    const open = () => {
      setDrag(null);
      setForm({ cat: g.cat, zone: over, n: Date.now() });
    };
    if (!el) return open();
    el.animate([{ transform: "scale(1.08,.92)" }, { transform: "scale(1)" }], { duration: 160, easing: "cubic-bezier(.34,1.56,.64,1)" }).onfinish = open;
  }
  function onCancel(e: PointerEvent) {
    const g = d.current;
    if (!g || e.pointerId !== g.pid) return;
    finish();
    if (g.picked) flyBack(g);
  }
  function onKey(e: KeyboardEvent) {
    const g = d.current;
    if (e.key !== "Escape" || !g) return;
    finish();
    if (g.picked) flyBack(g);
  }

  // Once picked up, stop the page from scrolling under a touch drag.
  useEffect(() => {
    const block = (e: TouchEvent) => d.current?.picked && e.preventDefault();
    window.addEventListener("touchmove", block, { passive: false });
    return () => window.removeEventListener("touchmove", block);
  }, []);

  const tileDown = (e: React.PointerEvent<HTMLElement>, cat: CatalogItem) => {
    lastPointer.current = e.pointerType;
    if (!canWrite || e.button !== 0 || d.current) return;
    const g: Drag = {
      cat,
      tile: e.currentTarget,
      pid: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      tilt: 0,
      picked: false,
      timer: 0,
      raf: 0,
      over: null,
    };
    if (e.pointerType !== "mouse") {
      setArmed(cat.id);
      g.timer = window.setTimeout(pickup, 350);
    }
    d.current = g;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
  };

  const openForm = (cat: CatalogItem, zone: Zone = cat.zone) => {
    setCard(null);
    setForm({ cat, zone, n: Date.now() });
  };
  const onSaved = useCallback(
    (id: string, n: string) => {
      setPopId(id);
      setLive(`บันทึก${n}เข้าตู้แล้ว`);
      router.refresh();
    },
    [router],
  );

  const spotChip = (key: "urgent" | "week", n: number, Icon: typeof Clock, label: string, ink: string) => (
    <button
      type="button"
      aria-pressed={spot === key}
      onClick={() => setSpot(spot === key ? null : key)}
      className={`chip on-wall ${spot === key ? "" : ink}`}
    >
      <Icon className="size-4.5" strokeWidth={2.5} aria-hidden="true" /> {label} {n}
    </button>
  );
  const firstUp = urgent.slice(0, 5);

  return (
    <main
      data-busy={drag || form ? "" : undefined}
      className={`relative flex w-full flex-1 flex-col gap-4 px-4 pt-5 ${canWrite ? "pb-[184px]" : "pb-8"} lg:mx-auto lg:grid lg:max-w-[1280px] lg:grid-cols-[280px_1fr] lg:grid-rows-[auto_auto_auto_auto_1fr] lg:gap-x-10 lg:gap-y-5 lg:pl-8 lg:pb-8 lg:pt-2 lg:[grid-template-areas:'head_fridge''chips_fridge''ai_fridge''list_fridge''rest_fridge'] ${
        canWrite ? (collapsed ? "lg:pr-[60px]" : "lg:pr-[372px]") : "lg:pr-8"
      }`}
    >
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-wall" />

      <header className="flex items-start justify-between gap-3 lg:[grid-area:head]">
        <div className="min-w-0">
          <h1 className="font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.01em] text-ink lg:text-[2.25rem] lg:leading-[1.1]">
            สวัสดี {name}
          </h1>
          <p className="text-[0.9375rem] font-medium text-wall-ink">
            {household} · {thaiDate(today)}
          </p>
        </div>
        <Link
          href="/fridge"
          aria-label="ดูเป็นรายการ"
          className="on-wall grid size-11 shrink-0 place-items-center rounded-2xl border-[length:var(--ow-md)] border-outline bg-white text-outline shadow-[0_3px_0_var(--outline)] lg:hidden"
        >
          <List className="size-5" strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </header>

      <div className="flex flex-col gap-3 lg:[grid-area:chips]">
        {reset && <Notice tone="success">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</Notice>}
        <div className="flex flex-wrap gap-2">
          {urgent.length + week.length === 0 ? (
            <p className="chip text-brand-ink">
              <CircleCheck className="size-4.5" strokeWidth={2.5} aria-hidden="true" /> ตู้นี้สดทั้งหมด
            </p>
          ) : (
            <>
              {urgent.length > 0 && spotChip("urgent", urgent.length, TriangleAlert, "ต้องรีบใช้", "text-urgent-ink")}
              {week.length > 0 && spotChip("week", week.length, Clock, "ภายในสัปดาห์", "text-week-ink")}
            </>
          )}
        </div>
      </div>

      {ai && urgent.length > 0 && (
        <Link
          href="/recipes"
          className="card-game on-wall flex items-center gap-3 px-3 py-2.5 hover:-translate-y-0.5 lg:[grid-area:ai]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-outline bg-brand-soft text-brand-ink">
            <ChefHat className="size-6" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="min-w-0 leading-snug">
            <span className="block font-semibold">มีของต้องรีบใช้ {urgent.length} อย่าง</span>
            <span className="block text-[0.9375rem] text-ink-2">ให้ AI คิดเมนูจากของพวกนี้ ›</span>
          </span>
        </Link>
      )}

      <div className="lg:flex lg:items-start lg:justify-center lg:pl-[110px] lg:[grid-area:fridge]">
        <Fridge
          byPlace={byPlace}
          today={today}
          flies={flies}
          spot={spot}
          popId={popId}
          over={drag?.over ?? null}
          openKey={card?.key ?? null}
          canWrite={canWrite}
          freezerRef={freezerRef}
          chillRef={chillRef}
          handlers={{
            onPointerDown: (e) => (lastPointer.current = e.pointerType),
            onPointerEnter: (e, item) => hoverIn(e, { mode: "lot", item, key: item.key }),
            onPointerLeave: hoverOut,
            onClick: (e, item) => {
              if (lastPointer.current === "mouse" && e.detail > 0) return router.push(`/item/${item.soon.id}`);
              toggle({ mode: "lot", item, key: item.key, anchor: e.currentTarget, pinned: true, focus: true });
            },
          }}
        />
      </div>

      {(firstUp.length > 0 || items.length > 0) && (
        <div className="flex flex-col gap-3 lg:[grid-area:list]">
          {firstUp.length > 0 && (
            <section className="card-game p-4">
              <h2 className="font-display text-[1.25rem] font-medium text-outline">ต้องใช้ก่อน</h2>
              <ul className="mt-2 flex flex-col">
                {firstUp.map((i) => (
                  <li key={i.key}>
                    <Link href={`/item/${i.soon.id}`} className="flex min-h-14 items-center gap-3 py-1 hover:text-brand-ink">
                      <IngredientPicture name={i.soon.name} category={i.soon.category} size={48} />
                      <span className="min-w-0 flex-1 truncate font-medium">{i.soon.name}</span>
                      <ExpiryBadge expiresAt={i.soon.expires_at} today={today} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <Link href="/fridge" className="on-wall flex min-h-11 items-center gap-1 self-start rounded-lg font-semibold text-ink underline">
            {firstUp.length > 0 ? "ดูของทั้งหมด" : "ดูเป็นรายการ"}
            <ChevronRight className="size-5" strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
      )}

      {canWrite && (
        <SideBar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sheet={sheet}
          setSheet={setSheet}
          openKey={card?.key ?? null}
          liftedId={drag?.cat.id ?? null}
          armedId={armed}
          tiles={{
            onPointerDown: tileDown,
            onPointerEnter: (e, cat) => hoverIn(e, { mode: "cat", cat, key: `cat:${cat.id}` }),
            onPointerLeave: hoverOut,
            onClick: (e, cat) => {
              if (blockClick.current) return;
              const key = `cat:${cat.id}`;
              const viaPointer = "detail" in e && e.detail > 0;
              toggle({ mode: "cat", cat, key, anchor: e.currentTarget, pinned: true, focus: !viaPointer || lastPointer.current !== "mouse" });
            },
            onPlus: (cat) => openForm(cat),
          }}
        />
      )}

      {card && (
        <DetailsCard
          key={card.key}
          card={card}
          today={today}
          canWrite={canWrite}
          onAdd={(cat) => openForm(cat)}
          onEnter={() => clearTimeout(closeT.current)}
          onLeave={hoverOut}
        />
      )}

      {drag && (
        <div ref={ghostRef} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[60] size-20" style={{ transform: "translate3d(-200px,-200px,0)" }}>
          <div className="tile size-20 animate-[lift_160ms_var(--ease-spring)_forwards] !shadow-[0_4px_0_var(--outline),var(--sh-lift)]">
            <span className="grid h-full place-items-center">
              <IngredientPicture name={drag.cat.name} category={drag.cat.category} size={56} />
            </span>
          </div>
        </div>
      )}

      {form && (
        <AddDialog
          key={form.n}
          cat={form.cat}
          zone={form.zone}
          today={today}
          items={items}
          onClose={() => setForm(null)}
          onSaved={onSaved}
        />
      )}

      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </main>
  );
}
