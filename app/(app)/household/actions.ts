"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string; ok?: string };

const uuid = z.string().uuid();
const roleSchema = z.enum(["member", "viewer"]);

const FAIL = "ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง";

function rpcError(message?: string) {
  if (!message) return FAIL;
  if (message.includes("last owner")) return "คุณเป็นเจ้าของบ้านคนเดียว ออกจากบ้านไม่ได้";
  if (message.includes("only the owner")) return "เฉพาะเจ้าของบ้านทำรายการนี้ได้";
  return FAIL;
}

export async function createInvite(hid: string): Promise<ActionResult> {
  if (!uuid.safeParse(hid).success) return { error: FAIL };
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_invite", { hid });
  if (error) return { error: rpcError(error.message) };
  revalidatePath("/household");
  return { ok: "สร้างลิงก์เชิญแล้ว" };
}

export async function revokeInvite(hid: string): Promise<ActionResult> {
  if (!uuid.safeParse(hid).success) return { error: FAIL };
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invite", { hid });
  if (error) return { error: rpcError(error.message) };
  revalidatePath("/household");
  return { ok: "ยกเลิกลิงก์เชิญแล้ว ลิงก์เดิมใช้ไม่ได้อีก" };
}

export async function setMemberRole(hid: string, member: string, role: string): Promise<ActionResult> {
  const parsed = z.object({ hid: uuid, member: uuid, role: roleSchema }).safeParse({ hid, member, role });
  if (!parsed.success) return { error: FAIL };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role", { hid, member, new_role: parsed.data.role });
  if (error) return { error: rpcError(error.message) };
  revalidatePath("/household");
  return { ok: "เปลี่ยนบทบาทแล้ว" };
}

export async function removeMember(hid: string, member: string): Promise<ActionResult> {
  if (!uuid.safeParse(hid).success || !uuid.safeParse(member).success) return { error: FAIL };
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { hid, member });
  if (error) return { error: rpcError(error.message) };
  revalidatePath("/household");
  return { ok: "นำออกจากบ้านแล้ว" };
}

export async function leaveHousehold(hid: string, me: string): Promise<ActionResult> {
  const res = await removeMember(hid, me);
  if (res.error) return res;
  redirect("/today");
}

export async function switchHousehold(hid: string) {
  if (!uuid.safeParse(hid).success) return;
  const supabase = await createClient();
  await supabase.rpc("switch_household", { hid });
  revalidatePath("/", "layout");
  redirect("/today");
}

export async function renameHousehold(hid: string, name: string): Promise<ActionResult> {
  if (!uuid.safeParse(hid).success) return { error: FAIL };
  const parsed = z.string().trim().min(1, "ตั้งชื่อบ้านด้วยนะ").max(40, "ชื่อยาวเกิน 40 ตัวอักษร").safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error, count } = await supabase.from("households").update({ name: parsed.data }, { count: "exact" }).eq("id", hid);
  if (error || count === 0) return { error: "เฉพาะเจ้าของบ้านเปลี่ยนชื่อได้" };
  revalidatePath("/household");
  return { ok: "เปลี่ยนชื่อบ้านแล้ว" };
}
