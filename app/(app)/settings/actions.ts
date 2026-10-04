"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/expiry";
import { buildEmail, mailReady, pickDue, sendMail } from "@/lib/notify";

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");
  return { supabase, user };
}

export async function saveNotify(patch: { notify_email?: boolean; notify_days?: number }) {
  const clean: typeof patch = {};
  if (typeof patch.notify_email === "boolean") clean.notify_email = patch.notify_email;
  if ([1, 2, 3].includes(patch.notify_days as number)) clean.notify_days = patch.notify_days;
  const { supabase, user } = await me();
  const { error } = await supabase.from("profiles").update(clean).eq("id", user.id);
  revalidatePath("/settings");
  return { ok: !error };
}

const COOLDOWN_MS = 5 * 60_000;

/** Sends today's summary to the signed-in user now (same builder as the cron), 1 per 5 minutes. */
export async function sendTest(): Promise<{ ok?: boolean; error?: string }> {
  if (!mailReady()) return { error: "ยังไม่ได้ตั้งค่าระบบอีเมล" };
  const { supabase, user } = await me();
  if (!user.email) return { error: "บัญชีนี้ไม่มีอีเมล" };

  const { data: p } = await supabase.from("profiles").select("notify_days, last_test_sent_at").eq("id", user.id).single();
  const wait = p?.last_test_sent_at ? Date.parse(p.last_test_sent_at) + COOLDOWN_MS - Date.now() : 0;
  if (wait > 0) return { error: `ส่งได้อีกครั้งในอีก ${Math.ceil(wait / 60_000)} นาที` };
  await supabase.from("profiles").update({ last_test_sent_at: new Date().toISOString() }).eq("id", user.id);

  const today = todayIn("Asia/Bangkok");
  const { data: lots } = await supabase.from("lots").select("name, qty, unit, expires_at").gt("qty", 0).not("expires_at", "is", null);
  const due = pickDue((lots ?? []).map((l) => ({ ...l, qty: Number(l.qty) })), today, p?.notify_days ?? 3);
  const mail = due.length
    ? buildEmail(due, today)
    : { subject: "frezill: อีเมลทดสอบ", text: "ตอนนี้ไม่มีของใกล้หมดอายุ ระบบอีเมลใช้ได้แล้ว", html: "<p>ตอนนี้ไม่มีของใกล้หมดอายุ ระบบอีเมลใช้ได้แล้ว</p>" };
  try {
    await sendMail(user.email, mail);
    return { ok: true };
  } catch (e) {
    console.error("sendTest", e);
    return { error: "ส่งไม่สำเร็จ ลองใหม่ภายหลัง" };
  }
}
