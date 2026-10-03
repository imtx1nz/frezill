"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type JoinState = { error?: string };

export async function joinHousehold(_prev: JoinState, fd: FormData): Promise<JoinState> {
  const code = String(fd.get("code") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("join_household", { invite: code });
  if (error) {
    return {
      error: error.message.includes("expired")
        ? "ลิงก์เชิญนี้หมดอายุหรือถูกยกเลิกแล้ว ขอลิงก์ใหม่จากเจ้าของบ้าน"
        : "เข้าร่วมบ้านไม่สำเร็จ ลองใหม่อีกครั้ง",
    };
  }
  redirect("/today?joined=1");
}
