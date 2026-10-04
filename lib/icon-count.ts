const TO_BASE: Record<string, number> = { กรัม: 1, g: 1, กิโลกรัม: 1000, กก: 1000, kg: 1000, มล: 1, ml: 1, ลิตร: 1000, l: 1000 };

/** How many icons the fridge draws for a stack: counts 1–5, mass/volume 1–3 by size, 0 when empty. */
export function iconCount(qty: number, unit: string): number {
  if (!(qty > 0)) return 0;
  const f = TO_BASE[unit.trim().toLowerCase().replace(/\.$/, "").replace(/\./g, "")];
  if (f) {
    const b = qty * f;
    return b <= 250 ? 1 : b <= 750 ? 2 : 3;
  }
  return Math.min(5, Math.max(1, Math.ceil(qty)));
}
