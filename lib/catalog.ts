import type { CATEGORIES } from "./inventory";

export type Category = keyof typeof CATEGORIES;
export type Zone = "chill" | "freezer";
export type CatalogItem = {
  id: string;
  name: string;
  aliases: string[];
  /** Text-block label; "\n" is a hand-placed line break, each line ≤ 5 spacing chars. */
  short: string;
  category: Category;
  unit: string;
  zone: Zone;
  /** Shelf life in the default zone. */
  days: number;
  /** Shelf life when frozen; null = freezing not recommended (keep chill days). */
  freezerDays: number | null;
};

const row = (
  id: string,
  name: string,
  aliases: string,
  short: string,
  category: Category,
  unit: string,
  zone: Zone,
  days: number,
  freezerDays: number | null,
): CatalogItem => ({ id, name, aliases: aliases ? aliases.split(", ") : [], short, category, unit, zone, days, freezerDays });

// Days follow PROJECT_PLAN §5.3 and are conservative. Check against a food-safety source before release.
export const CATALOG: CatalogItem[] = [
  row("egg", "ไข่ไก่", "ไข่, ไข่เป็ด", "ไข่", "dairy_egg", "ฟอง", "chill", 21, null),
  row("milk", "นมจืด", "นม, นมสด", "นม", "dairy_egg", "กล่อง", "chill", 7, null),
  row("yogurt", "โยเกิร์ต", "นมเปรี้ยว", "โย\nเกิร์ต", "dairy_egg", "ชิ้น", "chill", 10, null),
  row("cheese", "ชีส", "เชดดาร์", "ชีส", "dairy_egg", "ชิ้น", "chill", 21, 90),
  row("butter", "เนย", "เนยจืด, เนยเค็ม", "เนย", "dairy_egg", "ชิ้น", "chill", 30, 180),
  row("pork-minced", "หมูสับ", "หมูบด", "หมูสับ", "meat", "กรัม", "chill", 1, 90),
  row("pork", "เนื้อหมู", "หมูสามชั้น, สันนอก, หมูชิ้น, หมู", "หมู", "meat", "กรัม", "chill", 3, 120),
  row("chicken", "เนื้อไก่", "อกไก่, น่องไก่, สะโพกไก่, ไก่", "ไก่", "meat", "กรัม", "chill", 2, 180),
  row("beef", "เนื้อวัว", "เนื้อ, เนื้อสัน", "เนื้อ\nวัว", "meat", "กรัม", "chill", 3, 180),
  row("sausage", "ไส้กรอก", "ไส้อั่ว, ลูกชิ้น", "ไส้\nกรอก", "meat", "แพ็ค", "chill", 7, 60),
  row("shrimp", "กุ้ง", "กุ้งขาว, กุ้งแม่น้ำ", "กุ้ง", "seafood", "กรัม", "chill", 2, 90),
  row("fish", "ปลา", "ปลานิล, ปลาทับทิม, ปลาทู, ปลาแซลมอน", "ปลา", "seafood", "ชิ้น", "chill", 2, 90),
  row("squid", "ปลาหมึก", "หมึก", "ปลา\nหมึก", "seafood", "กรัม", "chill", 2, 90),
  row("napa-cabbage", "ผักกาดขาว", "ผักกาด", "ผักกาด\nขาว", "veg", "ชิ้น", "chill", 3, null),
  row("kale", "คะน้า", "ผักบุ้ง, กวางตุ้ง", "คะน้า", "veg", "ถุง", "chill", 3, null),
  row("cabbage", "กะหล่ำปลี", "กะหล่ำ", "กะหล่ำ\nปลี", "veg", "ชิ้น", "chill", 7, null),
  row("carrot", "แครอท", "แคร์รอต", "แครอท", "veg", "กก.", "chill", 7, null),
  row("tomato", "มะเขือเทศ", "มะเขือ", "มะเขือ\nเทศ", "veg", "ชิ้น", "chill", 7, null),
  row("cucumber", "แตงกวา", "แตง", "แตง\nกวา", "veg", "ชิ้น", "chill", 7, null),
  row("herbs", "ต้นหอม ผักชี", "ต้นหอม, ผักชี, โหระพา, กะเพรา, ใบมะกรูด", "หอม\nผักชี", "veg", "ถุง", "chill", 3, null),
  row("chili", "พริก", "พริกขี้หนู, พริกแดง, พริกหยวก", "พริก", "veg", "กรัม", "chill", 14, 90),
  row("lime", "มะนาว", "", "มะนาว", "fruit", "ชิ้น", "chill", 14, null),
  row("banana", "กล้วย", "กล้วยหอม, กล้วยน้ำว้า", "กล้วย", "fruit", "ชิ้น", "chill", 5, 60),
  row("apple", "แอปเปิล", "แอปเปิ้ล", "แอป\nเปิล", "fruit", "ชิ้น", "chill", 21, null),
  row("orange", "ส้ม", "ส้มเขียวหวาน", "ส้ม", "fruit", "กก.", "chill", 14, null),
  row("tofu", "เต้าหู้", "เต้าหู้ไข่, เต้าหู้แข็ง", "เต้าหู้", "other", "ชิ้น", "chill", 5, 60),
  row("leftovers", "อาหารเหลือ", "ข้าวเหลือ, แกงเหลือ, กับข้าว, ของเหลือ", "ของ\nเหลือ", "cooked", "กล่อง", "chill", 3, 60),
  row("soda", "น้ำอัดลม", "โซดา, โค้ก, เป๊ปซี่", "น้ำ\nอัดลม", "drink", "ขวด", "chill", 30, null),
  row("sauce", "ซอส น้ำพริก", "ซอส, น้ำพริก, น้ำปลา, ซีอิ๊ว, ซอสหอยนางรม, กะปิ", "ซอส", "sauce", "ขวด", "chill", 90, null),
  row("ice-cream", "ไอศกรีม", "ไอติม", "ไอติม", "dairy_egg", "กล่อง", "freezer", 60, 60),
];

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

// Every name/alias once, longest first, so the first contains-hit is the longest one.
const KEYS = CATALOG.flatMap((item) => [item.name, ...item.aliases].map((k) => ({ k: norm(k), item }))).sort(
  (a, b) => b.k.length - a.k.length,
);

/** Exact name/alias match only. */
export const catalogExact = (name: string) => KEYS.find((e) => e.k === norm(name))?.item;

/** Index set of Thai/Latin word boundaries, so "นม" doesn't match inside "ขนมปัง". */
function boundaries(s: string) {
  const b = new Set([s.length]);
  for (const { index } of new Intl.Segmenter("th", { granularity: "word" }).segment(s)) b.add(index);
  return b;
}

/** Exact match, else the longest name/alias found in the input on word boundaries ("อกไก่ CP" → chicken). */
export function catalogMatch(name: string) {
  const n = norm(name);
  const exact = catalogExact(n);
  if (exact) return exact;
  const b = boundaries(n);
  return KEYS.find(({ k }) => {
    for (let i = n.indexOf(k); i >= 0; i = n.indexOf(k, i + 1)) if (b.has(i) && b.has(i + k.length)) return true;
    return false;
  })?.item;
}

export const catalogById = (id: string) => CATALOG.find((c) => c.id === id);

/** Picture id: a catalog id, or the category fallback `cat-<category>` (underscores become dashes). */
export const pictureId = (name: string, category: Category) =>
  catalogMatch(name)?.id ?? `cat-${category.replace("_", "-")}`;

/** boughtOn + shelf life for the zone (freezer falls back to chill days when freezing isn't recommended). */
export function guessExpiry(item: Pick<CatalogItem, "days" | "freezerDays">, zone: Zone, boughtOn: string) {
  const d = new Date(`${boughtOn}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (zone === "freezer" ? (item.freezerDays ?? item.days) : item.days));
  return d.toISOString().slice(0, 10);
}

/** Shelf life used by guessExpiry, for the "≈ เดา จากอายุเก็บ N วัน" hint. */
export const shelfDays = (item: Pick<CatalogItem, "days" | "freezerDays">, zone: Zone) =>
  zone === "freezer" ? (item.freezerDays ?? item.days) : item.days;

// Thai above/below marks take no horizontal space.
const COMBINING = /[ัิ-ฺ็-๎]/u;
/** Count of characters that take horizontal space. */
export const spacingLength = (s: string) => [...s].filter((c) => !COMBINING.test(c)).length;

const CAP = { 48: 5, 56: 5, 64: 6, 72: 6, 80: 6, 96: 7 } as const;
export type PictureSize = keyof typeof CAP;

/** Cut `s` to at most `n` spacing chars without splitting a grapheme. */
function cut(s: string, n: number) {
  let out = "";
  for (const { segment } of new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)) {
    if (spacingLength(out + segment) > n) break;
    out += segment;
  }
  return out;
}

/** Lines for the text-block sticker: catalog `short` for exact matches, else Thai word-wrapped to ≤ 2 lines. */
export function blockLabel(name: string, size: PictureSize): string[] {
  const exact = catalogExact(name);
  if (exact) return exact.short.split("\n");
  const cap = CAP[size];
  const lines: string[] = [];
  let cur = "";
  for (const { segment, isWordLike } of new Intl.Segmenter("th", { granularity: "word" }).segment(norm(name))) {
    const w = isWordLike ? segment : segment.trim() ? segment : " ";
    if (spacingLength((cur + w).trim()) <= cap) {
      cur += w;
      continue;
    }
    if (cur.trim()) lines.push(cur.trim());
    cur = w.trim();
    while (spacingLength(cur) > cap) {
      const head = cut(cur, cap);
      lines.push(head);
      cur = cur.slice(head.length);
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  if (lines.length > 2) return [lines[0], cut(lines[1], cap - 1) + "…"];
  return lines;
}
