import { describe, expect, it } from "vitest";
import { todayIn } from "./expiry";
import { fefo, lotSchema } from "./inventory";

const lot = (id: string, qty: number, expires_at: string | null, created_at = "2026-10-01T00:00:00Z", bought_on = created_at.slice(0, 10)) => ({
  id,
  qty,
  expires_at,
  bought_on,
  created_at,
});

describe("fefo", () => {
  it("takes from the soonest-expiring lot first", () => {
    const plan = fefo([lot("late", 5, "2026-10-20"), lot("soon", 2, "2026-10-05")], 1);
    expect(plan).toEqual([{ id: "soon", take: 1, left: 1 }]);
  });

  it("spills over into the next lot", () => {
    const plan = fefo([lot("late", 5, "2026-10-20"), lot("soon", 2, "2026-10-05")], 4);
    expect(plan).toEqual([
      { id: "soon", take: 2, left: 0 },
      { id: "late", take: 2, left: 3 },
    ]);
  });

  it("puts lots without an expiry date last, oldest purchase first on ties", () => {
    const plan = fefo(
      [
        lot("none", 1, null),
        lot("newer", 1, "2026-10-05", "2026-10-03T00:00:00Z"),
        lot("older", 1, "2026-10-05", "2026-10-01T00:00:00Z"),
      ],
      3,
    );
    expect(plan.map((p) => p.id)).toEqual(["older", "newer", "none"]);
  });

  it("never takes more than available and skips empty lots", () => {
    const plan = fefo([lot("empty", 0, "2026-10-01"), lot("a", 2, "2026-10-09")], 10);
    expect(plan).toEqual([{ id: "a", take: 2, left: 0 }]);
  });

  it("handles fractional quantities without float drift", () => {
    const plan = fefo([lot("a", 0.3, "2026-10-05"), lot("b", 1, "2026-10-06")], 0.5);
    expect(plan).toEqual([
      { id: "a", take: 0.3, left: 0 },
      { id: "b", take: 0.2, left: 0.8 },
    ]);
  });

  it("does nothing for zero amount and does not mutate input", () => {
    const lots = [lot("b", 1, "2026-10-09"), lot("a", 1, "2026-10-05")];
    expect(fefo(lots, 0)).toEqual([]);
    expect(lots[0].id).toBe("b");
  });
});

describe("fefo bought_on tie-break", () => {
  it("equal expiry: earlier bought_on first, then created_at", () => {
    const a = fefo([lot("new", 1, "2026-10-05", "2026-10-01T00:00:00Z", "2026-10-03"), lot("old", 1, "2026-10-05", "2026-10-02T00:00:00Z", "2026-10-01")], 2);
    expect(a.map((p) => p.id)).toEqual(["old", "new"]);
    const b = fefo([lot("y", 1, null, "2026-10-02T00:00:00Z", "2026-10-01"), lot("x", 1, null, "2026-10-01T00:00:00Z", "2026-10-01")], 2);
    expect(b.map((p) => p.id)).toEqual(["x", "y"]);
  });
});

describe("lotSchema bought_on", () => {
  const base = { name: "ไข่ไก่", qty: "4", unit: "ฟอง", category: "dairy_egg", zone: "chill" };
  it("empty = today (Bangkok)", () => {
    expect(lotSchema.parse({ ...base, bought_on: "" }).bought_on).toBe(todayIn());
    expect(lotSchema.parse({ ...base, bought_on: null }).bought_on).toBe(todayIn());
  });
  it("rejects future and malformed", () => {
    expect(lotSchema.safeParse({ ...base, bought_on: "2999-01-01" }).success).toBe(false);
    expect(lotSchema.safeParse({ ...base, bought_on: "1/1/2026" }).success).toBe(false);
    expect(lotSchema.parse({ ...base, bought_on: "2026-01-01" }).bought_on).toBe("2026-01-01");
  });
});

describe("lotSchema expires_at", () => {
  const base = { name: "ไข่ไก่", qty: "4", unit: "ฟอง", category: "dairy_egg", zone: "chill" };
  it("empty date input = null", () => {
    expect(lotSchema.parse({ ...base, expires_at: "" }).expires_at).toBeNull();
    expect(lotSchema.parse({ ...base, expires_at: null }).expires_at).toBeNull();
  });
  it("keeps a valid date and rejects garbage", () => {
    expect(lotSchema.parse({ ...base, expires_at: "2026-10-05" }).expires_at).toBe("2026-10-05");
    expect(lotSchema.safeParse({ ...base, expires_at: "5/10/2026" }).success).toBe(false);
  });
});
