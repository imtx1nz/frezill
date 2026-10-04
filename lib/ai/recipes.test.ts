import { describe, expect, it, vi } from "vitest";
import { normalize, parseMenus } from "./recipes";

const menu = (over = {}) => ({
  name: "ไข่เจียวหมูสับ",
  uses_urgent: ["ไข่ไก่"],
  ingredients: [
    { name: "ไข่ไก่", qty: 2, unit: "ฟอง" },
    { name: "หมูสับ", qty: 100, unit: "กรัม" },
  ],
  missing: [],
  minutes: 10,
  difficulty: "ง่าย",
  steps: ["ตีไข่", "ทอด"],
  ...over,
});
const ok = (m = menu()) => JSON.stringify({ menus: [m, m, m] });

describe("parseMenus (AI output gate)", () => {
  it("accepts 3 well-formed menus", () => expect(parseMenus(ok())).toHaveLength(3));
  it("rejects malformed JSON / empty", () => {
    expect(parseMenus("{menus: [")).toBeNull();
    expect(parseMenus(undefined)).toBeNull();
    expect(parseMenus("```json\n" + ok() + "\n```")).toBeNull();
  });
  it("rejects missing fields", () => {
    const noSteps: Record<string, unknown> = menu();
    delete noSteps.steps;
    expect(parseMenus(ok(noSteps as never))).toBeNull();
    expect(parseMenus(JSON.stringify({}))).toBeNull();
  });
  it("rejects wrong count, types and limits", () => {
    expect(parseMenus(JSON.stringify({ menus: [menu(), menu()] }))).toBeNull();
    expect(parseMenus(ok(menu({ minutes: "10" })))).toBeNull();
    expect(parseMenus(ok(menu({ difficulty: "easy" })))).toBeNull();
    expect(parseMenus(ok(menu({ missing: ["a", "b", "c"] })))).toBeNull();
    expect(parseMenus(ok(menu({ ingredients: [{ name: "ไข่ไก่", qty: -1, unit: "ฟอง" }] })))).toBeNull();
  });
});

describe("steps", () => {
  const step = (over = {}) => ({ text: "ผัดหมู", action: "fry", heat: "high", minutes: 3, ...over });
  it("accepts object steps with optional heat/minutes", () => {
    const r = parseMenus(ok(menu({ steps: [step(), { text: "ล้างผัก", action: "prep", heat: null }] })));
    expect(r?.[0].steps[0]).toEqual(step());
    expect(r?.[0].steps[1]).toEqual({ text: "ล้างผัก", action: "prep", heat: undefined, minutes: undefined });
  });
  it("normalizes old string steps", () => {
    const r = parseMenus(ok(menu({ steps: ["หั่นหมู", "ทอดไข่"] })));
    expect(r?.[0].steps).toEqual([
      { text: "หั่นหมู", action: "cut", heat: undefined, minutes: undefined },
      { text: "ทอดไข่", action: "fry", heat: undefined, minutes: undefined },
    ]);
  });
  it("rejects bad action, heat, minutes and >10 steps", () => {
    expect(parseMenus(ok(menu({ steps: [step({ action: "grill" })] })))).toBeNull();
    expect(parseMenus(ok(menu({ steps: [step({ heat: "max" })] })))).toBeNull();
    expect(parseMenus(ok(menu({ steps: [step({ minutes: 0 })] })))).toBeNull();
    expect(parseMenus(ok(menu({ steps: Array(11).fill(step()) })))).toBeNull();
  });
});

describe("normalize", () => {
  const items = [
    { name: "ไข่ไก่", unit: "ฟอง", qty: 4, urgent: true },
    { name: "ไข่ไก่", unit: "แพ็ค", qty: 1, urgent: false },
  ];
  it("moves items not in fridge or pantry to missing, keeps pantry, uses fridge unit", () => {
    const [m] = normalize(
      [{ ...menu(), ingredients: [{ name: "ไข่ไก่", qty: 2, unit: "ใบ" }, { name: "น้ำปลา", qty: 1, unit: "ช้อน" }, { name: "หมูสับ", qty: 1, unit: "ก." }], missing: ["ต้นหอม"] } as never],
      items,
    );
    expect(m.ingredients).toEqual([
      { name: "ไข่ไก่", qty: 1, unit: "ฟอง", inFridge: true },
      { name: "น้ำปลา", qty: 1, unit: "ช้อน", inFridge: false },
    ]);
    expect(m.missing).toEqual(["ต้นหอม", "หมูสับ"]);
  });
  it("prefers the fridge lot with the same unit", () => {
    const [m] = normalize([{ ...menu(), ingredients: [{ name: "ไข่ไก่", qty: 1, unit: "แพ็ค" }] } as never], items);
    expect(m.ingredients[0].unit).toBe("แพ็ค");
  });
  describe("qty vs fridge unit", () => {
    const q = (qty: number, unit: string, fq: number, fu: string) =>
      normalize([{ ...menu(), ingredients: [{ name: "x", qty, unit }] } as never], [{ name: "x", unit: fu, qty: fq, urgent: false }])[0].ingredients[0];
    it("converts g to kg", () => expect(q(100, "กรัม", 1, "กิโลกรัม")).toMatchObject({ qty: 0.1, unit: "กิโลกรัม" }));
    it("caps at available", () => expect(q(2, "กิโลกรัม", 0.5, "กิโลกรัม").qty).toBe(0.5));
    it("converts ml to l", () => expect(q(500, "มล.", 1, "ลิตร").qty).toBe(0.5));
    it("caps same unit", () => expect(q(10, "ฟอง", 4, "ฟอง").qty).toBe(4));
    it("unconvertible: min(1, available)", () => {
      expect(q(6, "ฟอง", 3, "แผง").qty).toBe(1);
      expect(q(6, "ฟอง", 0.5, "แผง").qty).toBe(0.5);
    });
  });
});

describe("suggestMenus errors", () => {
  const items = [{ name: "ไข่ไก่", unit: "ฟอง", qty: 2, urgent: true }];
  const run = async (status: number) => {
    process.env.GEMINI_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status })));
    const { suggestMenus } = await import("./recipes");
    return suggestMenus(items);
  };
  it("all 429 → quota", async () => expect(await run(429)).toEqual({ error: "quota" }));
  it("503 → busy", async () => expect(await run(503)).toEqual({ error: "busy" }), 15000); // real backoff 1+2+3s
});
