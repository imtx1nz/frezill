import { z } from "zod";

const email = z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง");
const password = z
  .string()
  .min(8, "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร")
  .max(72, "รหัสผ่านยาวเกิน 72 ตัวอักษร");

export const signUpSchema = z.object({
  displayName: z.string().trim().min(1, "ใส่ชื่อเล่นด้วยนะ").max(40, "ชื่อยาวเกิน 40 ตัวอักษร"),
  email,
  password,
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "ใส่รหัสผ่านด้วยนะ"),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "รหัสผ่านสองช่องไม่ตรงกัน",
    path: ["confirm"],
  });

export type FieldErrors = Partial<Record<string, string>>;

export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
