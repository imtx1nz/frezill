import { describe, expect, it } from "vitest";
import { iconCount } from "./icon-count";

describe("iconCount", () => {
  it("counts units clamp 1..5", () => {
    expect(iconCount(6, "ฟอง")).toBe(5);
    expect(iconCount(0.5, "ชิ้น")).toBe(1);
    expect(iconCount(2.2, "ขวด")).toBe(3);
    expect(iconCount(3, "อะไรก็ไม่รู้")).toBe(3);
  });
  it("mass/volume tiers", () => {
    expect(iconCount(250, "กรัม")).toBe(1);
    expect(iconCount(300, "g")).toBe(2);
    expect(iconCount(0.5, "กก.")).toBe(2);
    expect(iconCount(1, "kg")).toBe(3);
    expect(iconCount(750, "มล.")).toBe(2);
    expect(iconCount(2, "ลิตร")).toBe(3);
    expect(iconCount(1, "L")).toBe(3);
  });
  it("zero renders nothing", () => {
    expect(iconCount(0, "ฟอง")).toBe(0);
    expect(iconCount(0, "กรัม")).toBe(0);
  });
});
