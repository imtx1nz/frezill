"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { safeNext } from "@/lib/auth/redirect";
import { enabledProviders } from "@/lib/auth/providers";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  toFieldErrors,
  type FormState,
} from "@/lib/auth/schemas";

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "");

export async function signUp(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = { displayName: text(fd, "displayName"), email: text(fd, "email") };
  const parsed = signUpSchema.safeParse({ ...values, password: text(fd, "password") });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(safeNext(text(fd, "next")))}`,
    },
  });
  if (error) return { error: authErrorMessage(error), values };

  // Supabase returns a user with no identities when the email is already registered.
  if (data.user && data.user.identities?.length === 0) {
    return { error: authErrorMessage({ code: "user_already_exists" }), values };
  }
  if (data.session) redirect(safeNext(text(fd, "next")));

  return {
    success: `ส่งลิงก์ยืนยันไปที่ ${parsed.data.email} แล้ว เปิดอีเมลแล้วกดลิงก์เพื่อเริ่มใช้งาน`,
    values,
  };
}

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = { email: text(fd, "email") };
  const parsed = signInSchema.safeParse({ ...values, password: text(fd, "password") });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error), values };

  redirect(safeNext(text(fd, "next")));
}

export async function signInWithGoogle(fd: FormData) {
  if (!(await enabledProviders()).google) redirect("/login?error=oauth");
  const supabase = await createClient();
  const next = safeNext(text(fd, "next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function forgotPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = { email: text(fd, "email") };
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  // Same reply whether or not the account exists, so the form cannot be used to probe emails.
  if (error && error.code?.startsWith("over_")) return { error: authErrorMessage(error), values };

  return { success: `ถ้ามีบัญชีของ ${parsed.data.email} อยู่ เราส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว`, values };
}

export async function resetPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: text(fd, "password"),
    confirm: text(fd, "confirm"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error) };

  redirect("/today?reset=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
