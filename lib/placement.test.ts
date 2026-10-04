import { describe, expect, it } from "vitest";
import { placementWarning } from "./placement";

describe("placementWarning", () => {
  it("warns on bad spots", () => {
    expect(placementWarning("pork", "meat", "top")).toMatch(/ชั้นล่าง/);
    expect(placementWarning("carrot", "veg", "freezer")).toMatch(/เละ/);
    expect(placementWarning("ice-cream", "dairy_egg", "middle")).toMatch(/ละลาย/);
    expect(placementWarning("egg", "dairy_egg", "door")).toMatch(/ไข่/);
  });
  it("is quiet on good spots", () => {
    expect(placementWarning("pork", "meat", "bottom")).toBeNull();
    expect(placementWarning("pork", "meat", "freezer")).toBeNull();
    expect(placementWarning("ice-cream", "dairy_egg", "freezer")).toBeNull();
    expect(placementWarning("egg", "dairy_egg", "top")).toBeNull();
  });
});
