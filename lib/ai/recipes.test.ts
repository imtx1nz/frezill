import { describe, expect, it } from "vitest";
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
      { name: "ไข่ไก่", qty: 2, unit: "ฟอง", inFridge: true },
      { name: "น้ำปลา", qty: 1, unit: "ช้อน", inFridge: false },
    ]);
    expect(m.missing).toEqual(["ต้นหอม", "หมูสับ"]);
  });
  it("prefers the fridge lot with the same unit", () => {
    const [m] = normalize([{ ...menu(), ingredients: [{ name: "ไข่ไก่", qty: 1, unit: "แพ็ค" }] } as never], items);
    expect(m.ingredients[0].unit).toBe("แพ็ค");
  });
});
