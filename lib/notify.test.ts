import { describe, expect, it } from "vitest";
import { buildEmail, parseFrom, pickDue } from "./notify";
import { todayIn } from "./expiry";

const lot = (name: string, expires_at: string | null, qty = 1) => ({ name, qty, unit: "ชิ้น", expires_at });

describe("parseFrom", () => {
  it("parses name + address, bare address, rejects junk", () => {
    expect(parseFrom("frezill <hi@frezill.app>")).toEqual({ name: "frezill", email: "hi@frezill.app" });
    expect(parseFrom('"ตู้เย็น" <a@b.co>')).toEqual({ name: "ตู้เย็น", email: "a@b.co" });
    expect(parseFrom(" a@b.co ")).toEqual({ email: "a@b.co" });
    expect(parseFrom("<a@b.co>")).toEqual({ email: "a@b.co" });
    expect(parseFrom("nope")).toBeNull();
    expect(parseFrom(undefined)).toBeNull();
  });
});

describe("pickDue", () => {
  const today = "2026-10-04";
  const lots = [lot("c", "2026-10-07"), lot("late", "2026-10-08"), lot("a", "2026-10-01"), lot("b", "2026-10-04"), lot("none", null), lot("gone", "2026-10-02", 0)];
  it("keeps expired + within notify_days, sorted, stock only", () => {
    expect(pickDue(lots, today, 3).map((l) => l.name)).toEqual(["a", "b", "c"]);
    expect(pickDue(lots, today, 1).map((l) => l.name)).toEqual(["a", "b"]);
  });
  it("uses the Bangkok date (UTC 17:30 is already tomorrow)", () => {
    expect(todayIn("Asia/Bangkok", new Date("2026-10-03T17:30:00Z"))).toBe("2026-10-04");
  });
});

describe("buildEmail", () => {
  it("groups by expired / today / N days and escapes names", () => {
    const m = buildEmail(pickDue([lot("ไข่<ไก่>", "2026-10-01"), lot("นม", "2026-10-04"), lot("หมู", "2026-10-06", 2)], "2026-10-04", 3), "2026-10-04");
    expect(m.subject).toBe("frezill: มีของใกล้หมดอายุ 3 อย่าง");
    expect(m.html).toContain("หมดอายุแล้ว");
    expect(m.html).toContain("หมดวันนี้");
    expect(m.html).toContain("อีก 2 วัน");
    expect(m.html).toContain("ไข่&lt;ไก่&gt;");
    expect(m.html).toContain("https://frezill.vercel.app/today");
    expect(m.text).toContain("- หมู 2 ชิ้น");
    expect(m.text).toContain("/settings");
  });
});
