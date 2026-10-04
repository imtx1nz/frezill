import { describe, expect, it } from "vitest";
import { CATALOG, blockLabel, catalogMatch, guessExpiry, pictureId, shelfDays, spacingLength } from "./catalog";
import { homeTone } from "./expiry";
import { flyCounts, groupItems, placeOf, type HomeLot } from "./home";
import { dayLabel, groupByDay, minusDays } from "./history";

describe("catalog", () => {
  it("has 30 unique ids and short labels within 5 spacing chars per line", () => {
    expect(CATALOG).toHaveLength(30);
    expect(new Set(CATALOG.map((c) => c.id)).size).toBe(30);
    for (const c of CATALOG) for (const line of c.short.split("\n")) expect(spacingLength(line)).toBeLessThanOrEqual(5);
  });

  it("maps names to picture ids: exact, alias, longest contains, category fallback", () => {
    expect(pictureId("ไข่ไก่", "dairy_egg")).toBe("egg");
    expect(pictureId("  นมสด ", "dairy_egg")).toBe("milk");
    expect(pictureId("หมูสับอนามัย", "meat")).toBe("pork-minced");
    expect(pictureId("อกไก่ CP", "meat")).toBe("chicken");
    expect(pictureId("ปลาหมึกย่าง", "seafood")).toBe("squid");
    expect(pictureId("เต้าหู้ไข่", "other")).toBe("tofu");
    expect(pictureId("ICE-CREAM", "dairy_egg")).toBe("cat-dairy-egg");
    expect(pictureId("ไอติม", "dairy_egg")).toBe("ice-cream");
    expect(pictureId("แยมสตรอว์เบอร์รี", "sauce")).toBe("cat-sauce");
    expect(pictureId("ขนมปัง", "dairy_egg")).toBe("cat-dairy-egg"); // "นม" inside a word
    expect(pictureId("นมสดเมจิ", "dairy_egg")).toBe("milk");
    expect(pictureId("ไข่ไก่เบอร์ 0", "dairy_egg")).toBe("egg");
  });

  it("does not alias bare น้ำ (น้ำปลา is sauce)", () => {
    expect(catalogMatch("น้ำปลา")?.id).toBe("sauce");
    expect(catalogMatch("น้ำเปล่า")).toBeUndefined();
  });

  it("guesses expiry from shelf life and zone", () => {
    const egg = CATALOG.find((c) => c.id === "egg")!;
    const chicken = CATALOG.find((c) => c.id === "chicken")!;
    expect(guessExpiry(egg, "chill", "2026-10-04")).toBe("2026-10-25");
    expect(guessExpiry(egg, "freezer", "2026-10-04")).toBe("2026-10-25"); // freezing not recommended
    expect(guessExpiry(chicken, "freezer", "2026-10-04")).toBe("2027-04-02");
    expect(guessExpiry(chicken, "chill", "2026-12-30")).toBe("2027-01-01");
    expect(shelfDays(chicken, "freezer")).toBe(180);
  });
});

describe("blockLabel", () => {
  it("uses the catalog short label for exact matches", () => {
    expect(blockLabel("โยเกิร์ต", 48)).toEqual(["โย", "เกิร์ต"]);
    expect(blockLabel("ไข่ไก่", 96)).toEqual(["ไข่"]);
  });

  it("packs free Thai text into lines within the cap and truncates line 2", () => {
    for (const size of [48, 56, 72, 96] as const) {
      const lines = blockLabel("น้ำพริกหนุ่มเชียงใหม่ของคุณยาย", size);
      expect(lines.length).toBeLessThanOrEqual(2);
      const cap = { 48: 5, 56: 5, 72: 6, 96: 7 }[size];
      for (const l of lines) expect(spacingLength(l)).toBeLessThanOrEqual(cap);
      expect(lines[1].endsWith("…")).toBe(true);
    }
  });

  it("counts Thai combining marks as zero width and hard-splits long words", () => {
    expect(spacingLength("กิ่ง")).toBe(2);
    expect(blockLabel("ABCDEFGH", 48)).toEqual(["abcde", "fgh"]);
    expect(blockLabel("ขนม", 48)).toEqual(["ขนม"]);
  });
});

describe("home", () => {
  const lot = (o: Partial<HomeLot>): HomeLot => ({
    id: "x",
    name: "ไข่ไก่",
    qty: 1,
    unit: "ฟอง",
    category: "dairy_egg",
    zone: "chill",
    expires_at: null,
    expiry_guessed: false,
    bought_on: "2026-10-01",
    ...o,
  });

  it("homeTone bands: fresh > 7, week 4–7, urgent 0–3, expired < 0", () => {
    const t = "2026-10-04";
    expect(homeTone(null, t)).toBe("none");
    expect(homeTone("2026-10-12", t)).toBe("fresh");
    expect(homeTone("2026-10-11", t)).toBe("week");
    expect(homeTone("2026-10-08", t)).toBe("week");
    expect(homeTone("2026-10-07", t)).toBe("urgent");
    expect(homeTone("2026-10-04", t)).toBe("urgent");
    expect(homeTone("2026-10-03", t)).toBe("expired");
  });

  it("places lots by zone and category", () => {
    expect(placeOf("freezer", "veg")).toBe("freezer");
    expect(placeOf("chill", "meat")).toBe("bottom");
    expect(placeOf("chill", "fruit")).toBe("drawer");
    expect(placeOf("chill", "sauce")).toBe("door");
    expect(placeOf("chill", "cooked")).toBe("middle");
    expect(placeOf("chill", "other")).toBe("top");
  });

  it("groups same name+unit+zone, soonest lot first, and caps flies at 6", () => {
    const items = groupItems(
      [
        lot({ id: "a", expires_at: "2026-10-20", qty: 4 }),
        lot({ id: "b", expires_at: "2026-10-05", qty: 6 }),
        ...["c", "d", "e", "f"].map((id) => lot({ id, name: id, expires_at: "2026-10-01" })),
      ],
      "2026-10-04",
    );
    const egg = items.find((i) => i.soon.name === "ไข่ไก่")!;
    expect(egg.soon.id).toBe("b");
    expect(egg.total).toBe(10);
    expect(egg.tone).toBe("urgent");
    const flies = flyCounts(items);
    expect([...flies.values()].reduce((s, n) => s + n, 0)).toBe(6);
    expect(flies.get(egg.key)).toBeUndefined(); // four expired items took all 6 first
  });
});

describe("history", () => {
  it("groups by household-local day, newest first", () => {
    const g = groupByDay(
      [
        { at: "2026-10-03T16:59:00Z" }, // 23:59 Bangkok, Oct 3
        { at: "2026-10-03T17:00:00Z" }, // 00:00 Bangkok, Oct 4
        { at: "2026-10-04T05:00:00Z" },
      ],
      "Asia/Bangkok",
    );
    expect(g.map((d) => [d.day, d.items.length])).toEqual([
      ["2026-10-04", 2],
      ["2026-10-03", 1],
    ]);
    expect(g[0].items[0].at).toBe("2026-10-04T05:00:00Z");
  });

  it("labels days", () => {
    expect(dayLabel("2026-10-04", "2026-10-04")).toBe("วันนี้");
    expect(dayLabel("2026-10-03", "2026-10-04")).toBe("เมื่อวาน");
    expect(dayLabel("2026-10-02", "2026-10-04")).toMatch(/2 ต\.ค\./);
    expect(minusDays("2026-03-01", 1)).toBe("2026-02-28");
  });
});
