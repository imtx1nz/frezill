"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Search } from "lucide-react";
import { IngredientPicture } from "@/components/IngredientPicture";
import { CATALOG, type CatalogItem } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/inventory";

export type TileHandlers = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>, cat: CatalogItem) => void;
  onPointerEnter: (e: React.PointerEvent<HTMLElement>, cat: CatalogItem) => void;
  onPointerLeave: () => void;
  onClick: (e: React.MouseEvent<HTMLElement>, cat: CatalogItem) => void;
  onPlus: (cat: CatalogItem) => void;
};

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Ingredient side bar (§3.7, Tinkercad shape-panel structure): category dropdown + search + sticker tiles.
 * Desktop: docked right, collapsible. Phone: bottom sheet (peek / expanded) above the tab bar.
 */
export function SideBar({
  collapsed,
  setCollapsed,
  openKey,
  liftedId,
  armedId,
  tiles,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  openKey: string | null;
  liftedId: string | null;
  armedId: string | null;
  tiles: TileHandlers;
}) {
  // Sheet state lives here so opening/closing re-renders only the bar, not the whole home.
  const [sheet, setSheet] = useState<"peek" | "expanded">("peek");
  if (liftedId && sheet === "expanded") setSheet("peek"); // picking a tile up docks the sheet
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const sheetRef = useRef<HTMLElement>(null);
  const grab = useRef<{ y: number; dy: number } | null>(null);

  const shown = useMemo(
    () => CATALOG.filter((c) => (cat === "all" || c.category === cat) && (!q.trim() || [c.name, ...c.aliases].some((n) => norm(n).includes(norm(q))))),
    [cat, q],
  );
  const expanded = sheet === "expanded";

  // Grabber drag: follow the finger with translateY only, then snap to the nearer state.
  const onGrabDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    grab.current = { y: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onGrabMove = (e: React.PointerEvent) => {
    const g = grab.current;
    const el = sheetRef.current;
    if (!g || !el) return;
    g.dy = e.clientY - g.y;
    const travel = el.offsetHeight - parseFloat(getComputedStyle(el).getPropertyValue("--peek"));
    const base = expanded ? 0 : travel;
    el.style.transition = "none";
    el.style.translate = `0 ${Math.min(Math.max(base + g.dy, 0), travel)}px`; // inline wins over the class
  };
  const onGrabUp = () => {
    const g = grab.current;
    const el = sheetRef.current;
    grab.current = null;
    if (!g || !el) return;
    el.style.transition = "";
    el.style.translate = "";
    if (Math.abs(g.dy) < 6) setSheet(expanded ? "peek" : "expanded");
    else setSheet(g.dy < 0 ? "expanded" : "peek");
  };

  // Memoized so a sheet open/close (only data-sheet changes) re-renders none of the tiles.
  const grid = useMemo(
    () => (
      <ul className="flex min-h-0 flex-1 gap-2.5 overflow-x-auto overscroll-contain px-3 pb-4 pt-2.5 group-data-[sheet=expanded]:grid group-data-[sheet=expanded]:grid-cols-3 group-data-[sheet=expanded]:content-start group-data-[sheet=expanded]:overflow-y-auto lg:grid lg:grid-cols-3 lg:content-start lg:overflow-y-auto">
        {shown.map((c) => (
          <li key={c.id} className="relative max-lg:group-data-[sheet=peek]:w-[84px] max-lg:group-data-[sheet=peek]:shrink-0">
            <div
              role="button"
              tabIndex={0}
              aria-label={`${c.name} ดูรายละเอียด`}
              aria-expanded={openKey === `cat:${c.id}`}
              aria-controls="details"
              data-lifted={liftedId === c.id || undefined}
              data-armed={armedId === c.id || undefined}
              onPointerDown={(e) => tiles.onPointerDown(e, c)}
              onPointerEnter={(e) => tiles.onPointerEnter(e, c)}
              onPointerLeave={tiles.onPointerLeave}
              onClick={(e) => tiles.onClick(e, c)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  tiles.onClick(e as unknown as React.MouseEvent<HTMLElement>, c);
                }
              }}
              onContextMenu={(e) => e.preventDefault()}
              className="tile aspect-square w-full cursor-grab touch-pan-x group-data-[sheet=expanded]:touch-pan-y lg:touch-pan-y"
            >
              {/* sticker fills ~85% of the well; the name sits below the tile, never on the picture */}
              {/* all sizes rendered, CSS picks one, so opening the sheet changes no DOM */}
              <IngredientPicture name={c.name} category={c.category} size={64} className="max-lg:group-data-[sheet=expanded]:hidden lg:hidden" />
              <IngredientPicture name={c.name} category={c.category} size={96} className="max-lg:group-data-[sheet=peek]:hidden lg:hidden" />
              <IngredientPicture name={c.name} category={c.category} size={80} className="max-lg:hidden" />
            </div>
            <span
              aria-hidden="true"
              className="mt-1.5 block truncate text-center text-[0.875rem] font-semibold leading-[1.2] text-white group-data-[sheet=expanded]:line-clamp-2 group-data-[sheet=expanded]:whitespace-normal lg:line-clamp-2 lg:whitespace-normal"
            >
              {c.name}
            </span>
            <button
              type="button"
              data-plus
              onClick={() => tiles.onPlus(c)}
              aria-label={`เพิ่ม${c.name}เข้าตู้`}
              className="absolute -right-1.5 -top-1.5 z-[1] grid size-[26px] place-items-center rounded-full border-2 border-outline bg-[var(--candy-green)] text-outline before:absolute before:-inset-[9px] before:content-['']"
            >
              <Plus className="size-3.5" strokeWidth={3.5} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    ),
    [shown, openKey, liftedId, armedId, tiles],
  );

  return (
    <aside
      ref={sheetRef}
      id="ingredients"
      aria-label="แถบวัตถุดิบ"
      data-sheet={sheet}
      className={`panel group fixed inset-x-0 bottom-[var(--tabbar-h)] z-30 flex h-[70dvh] flex-col !rounded-b-none !border-x-0 !border-b-0 transition-transform duration-200 ease-[var(--ease-out)] ${
        expanded ? "" : "translate-y-[calc(70dvh-var(--peek))]"
      } lg:inset-x-auto lg:bottom-auto lg:right-4 lg:top-[80px] lg:h-auto lg:max-h-[calc(100vh-100px)] lg:w-[340px] lg:translate-y-0 lg:!rounded-[24px] lg:!border-[length:var(--ow-lg)] lg:duration-[240ms] ${
        collapsed ? "lg:translate-x-[calc(100%+16px)]" : ""
      }`}
    >
      {/* desktop collapse tab */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-controls="ingredients"
        aria-label={collapsed ? "แสดงแถบของ" : "ซ่อนแถบของ"}
        className="absolute right-full top-1/2 hidden h-16 w-7 -translate-y-1/2 place-items-center rounded-l-xl border-[length:var(--ow-md)] border-r-0 border-outline bg-panel text-white lg:grid"
      >
        <ChevronRight className={`size-5 transition-transform ${collapsed ? "rotate-180" : ""}`} strokeWidth={3} aria-hidden="true" />
      </button>

      {/* phone grabber */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="ingredients"
        aria-label={expanded ? "ย่อแถบของ" : "ขยายแถบของ"}
        onPointerDown={onGrabDown}
        onPointerMove={onGrabMove}
        onPointerUp={onGrabUp}
        onPointerCancel={onGrabUp}
        className="grid h-6 shrink-0 touch-none place-items-center lg:hidden"
      >
        <span className="h-[5px] w-10 rounded-full bg-white/60" />
      </button>

      <div className="flex shrink-0 gap-2 px-3 lg:pt-3">
        <label className="relative shrink-0">
          <span className="sr-only">หมวด</span>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="btn-candy btn-cream !h-11 !min-h-11 max-w-[9.5rem] appearance-none truncate !pl-4 !pr-9 !text-base after:hidden"
          >
            <option value="all">ทั้งหมด</option>
            {Object.entries(CATEGORIES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-outline" strokeWidth={3} aria-hidden="true" />
        </label>
        <label className="panel-well flex h-11 min-w-0 flex-1 items-center gap-2 px-3">
          <Search className="size-[18px] shrink-0 text-[#C9D2F0]" strokeWidth={2.5} aria-hidden="true" />
          <span className="sr-only">ค้นหาของ</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาของ"
            className="h-full min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-[#C9D2F0]"
          />
        </label>
      </div>
      <p className={`px-4 pt-1 text-[0.875rem] font-semibold ${expanded ? "" : "max-lg:sr-only"}`} aria-live="polite">
        {shown.length} อย่าง
      </p>

      {shown.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3">
          <p>ไม่เจอ “{q}”</p>
          <button type="button" className="chip !min-h-9" onClick={() => setQ("")}>
            ล้างคำค้น
          </button>
        </div>
      ) : (
        grid
      )}
    </aside>
  );
}
