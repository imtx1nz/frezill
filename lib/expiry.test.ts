import { describe, expect, it } from "vitest";
import { byExpiry, daysLeft, expiryBadge, expiryStatus, thaiDate, todayIn } from "./expiry";

describe("todayIn (Asia/Bangkok day boundary)", () => {
  it("is already the next day in Bangkok at 17:00 UTC", () => {
    expect(todayIn("Asia/Bangkok", new Date("2026-10-04T17:00:00Z"))).toBe("2026-10-05");
  });
  it("is still the same day at 16:59 UTC (23:59 Bangkok)", () => {
    expect(todayIn("Asia/Bangkok", new Date("2026-10-04T16:59:59Z"))).toBe("2026-10-04");
  });
  it("defaults to Bangkok", () => {
    expect(todayIn(undefined, new Date("2026-12-31T20:00:00Z"))).toBe("2027-01-01");
  });
});

describe("expiryStatus", () => {
  const today = "2026-10-04";
  it.each([
    [null, "none"],
    ["2026-10-01", "expired"],
    ["2026-10-03", "expired"],
    ["2026-10-04", "today"],
    ["2026-10-05", "soon"],
    ["2026-10-07", "soon"],
    ["2026-10-08", "safe"],
  ] as const)("%s → %s", (exp, want) => {
    expect(expiryStatus(exp, today)).toBe(want);
  });
  it("soon window is adjustable", () => {
    expect(expiryStatus("2026-10-08", today, 5)).toBe("soon");
  });
  it("counts across month/year ends", () => {
    expect(daysLeft("2027-01-01", "2026-12-31")).toBe(1);
    expect(daysLeft("2026-11-01", "2026-10-31")).toBe(1);
  });
});

describe("expiryBadge", () => {
  const today = "2026-10-04";
  it("labels in Thai", () => {
    expect(expiryBadge("2026-10-02", today).label).toBe("หมดอายุแล้ว 2 วัน");
    expect(expiryBadge("2026-10-04", today).label).toBe("หมดอายุวันนี้");
    expect(expiryBadge("2026-10-05", today).label).toBe("หมดพรุ่งนี้");
    expect(expiryBadge("2026-10-06", today).label).toBe("อีก 2 วัน");
    expect(expiryBadge(null, today).label).toBe("ไม่ระบุวันหมด");
  });
  it("uses danger tone for expired", () => {
    expect(expiryBadge("2026-10-01", today).tone).toContain("danger");
  });
});

it("byExpiry puts soonest first and no date last", () => {
  const rows = [{ expires_at: null }, { expires_at: "2026-10-09" }, { expires_at: "2026-10-01" }];
  expect(rows.sort(byExpiry).map((r) => r.expires_at)).toEqual(["2026-10-01", "2026-10-09", null]);
});

it("thaiDate does not shift the day", () => {
  expect(thaiDate("2026-10-05")).toBe("5 ต.ค.");
});
