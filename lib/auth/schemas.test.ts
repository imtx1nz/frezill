import { describe, expect, it } from "vitest";
import { resetPasswordSchema, signUpSchema, toFieldErrors } from "./schemas";
import { safeNext } from "./redirect";
import { authErrorMessage } from "./errors";

describe("signUpSchema", () => {
  it("normalises email and accepts valid input", () => {
    const r = signUpSchema.parse({ displayName: " น้อย ", email: " Noi@Mail.COM ", password: "12345678" });
    expect(r).toEqual({ displayName: "น้อย", email: "noi@mail.com", password: "12345678" });
  });

  it("reports one Thai message per field", () => {
    const r = signUpSchema.safeParse({ displayName: "", email: "x", password: "123" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(toFieldErrors(r.error)).toEqual({
        displayName: "ใส่ชื่อเล่นด้วยนะ",
        email: "อีเมลไม่ถูกต้อง",
        password: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร",
      });
    }
  });
});

describe("resetPasswordSchema", () => {
  it("flags mismatched confirmation on the confirm field", () => {
    const r = resetPasswordSchema.safeParse({ password: "abcdefgh", confirm: "abcdefgx" });
    expect(r.success).toBe(false);
    if (!r.success) expect(toFieldErrors(r.error).confirm).toBe("รหัสผ่านสองช่องไม่ตรงกัน");
  });
});

describe("safeNext", () => {
  it.each([
    [null, "/today"],
    ["/fridge?x=1", "/fridge?x=1"],
    ["https://evil.com", "/today"],
    ["//evil.com", "/today"],
    ["/\\evil.com", "/today"],
  ])("%s → %s", (input, expected) => expect(safeNext(input)).toBe(expected));
});

describe("authErrorMessage", () => {
  it("maps known codes and falls back for unknown ones", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toContain("ไม่ถูกต้อง");
    expect(authErrorMessage({ code: "???" })).toBe("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
  });
});
