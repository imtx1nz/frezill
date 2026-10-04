import { describe, expect, it } from "vitest";
import { collapseRuns, type HistoryEvent } from "./history";

const ev = (id: string, at: string, over: Partial<HistoryEvent> = {}): HistoryEvent => ({
  id,
  kind: "use",
  at: `2026-10-04T${at}:00Z`,
  name: "ไข่ไก่",
  unit: "ฟอง",
  category: "dairy_egg",
  qty: 1,
  who: "คุณ",
  reason: null,
  lotId: "L1",
  live: true,
  ...over,
});

describe("collapseRuns", () => {
  it("sums the same lot + action within the window, keeps the newest time", () => {
    const out = collapseRuns([ev("a", "10:00"), ev("b", "10:04"), ev("c", "10:09")]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: "c", qty: 3, at: "2026-10-04T10:09:00Z" });
  });

  it("chains gaps of ≤ 10 min but splits a longer gap", () => {
    const out = collapseRuns([ev("a", "09:00"), ev("b", "10:00"), ev("c", "10:08")]);
    expect(out.map((e) => [e.id, e.qty])).toEqual([["c", 2], ["a", 1]]);
  });

  it("keeps different lots, actions and people apart", () => {
    const out = collapseRuns([
      ev("a", "10:00"),
      ev("b", "10:01", { lotId: "L2" }),
      ev("c", "10:02", { kind: "discard" }),
      ev("d", "10:03", { who: "แม่" }),
    ]);
    expect(out).toHaveLength(4);
  });

  it("does not mutate its input", () => {
    const input = [ev("a", "10:00"), ev("b", "10:01")];
    collapseRuns(input);
    expect(input.map((e) => e.qty)).toEqual([1, 1]);
  });
});
