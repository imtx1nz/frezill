import type { Place } from "./home";

/** Items per shelf as [phone, desktop]; mirrors the caps in components/home/Fridge.tsx. */
export const SHELF_CAP: Record<Place, [number, number]> = {
  freezer: [3, 5], top: [3, 5], middle: [3, 5], bottom: [3, 5], drawer: [3, 5], door: [3, 6],
};

// First matching rule wins. `key` is a catalog id or a category.
const RULES: { key: string[]; bad: (p: Place) => boolean; msg: string }[] = [
  { key: ["meat", "seafood"], bad: (p) => p !== "bottom" && p !== "freezer", msg: "เนื้อดิบควรอยู่ชั้นล่าง กันน้ำหยดใส่ของอื่น" },
  { key: ["veg", "fruit"], bad: (p) => p === "freezer", msg: "ผักผลไม้สดแช่แข็งแล้วจะเละ" },
  { key: ["ice-cream"], bad: (p) => p !== "freezer", msg: "ไอศกรีมจะละลาย ควรอยู่ช่องแช่แข็ง" },
  { key: ["egg"], bad: (p) => p === "door", msg: "ประตูอุณหภูมิไม่คงที่ ไข่ควรอยู่ชั้นใน" },
];

/** Non-blocking hint for dropping an item (catalog id and category) onto a place; null when fine. */
export function placementWarning(id: string, category: string, place: Place): string | null {
  return RULES.find((r) => (r.key.includes(id) || r.key.includes(category)) && r.bad(place))?.msg ?? null;
}
