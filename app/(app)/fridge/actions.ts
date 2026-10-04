"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fefo, lotSchema } from "@/lib/inventory";

const fields = (fd: FormData) => Object.fromEntries(["name", "qty", "unit", "category", "zone", "expires_at", "expiry_guessed", "bought_on"].map((k) => [k, fd.get(k)]));

function done(): never {
  revalidatePath("/fridge");
  redirect("/fridge");
}

export async function addLot(fd: FormData) {
  const parsed = lotSchema.safeParse(fields(fd));
  if (!parsed.success) redirect("/fridge/add?error=1");
  const supabase = await createClient();
  // ponytail: one fridge per household for now (invites/multi-fridge live on m1-invites)
  const { data: fridge } = await supabase.from("fridges").select("id").order("created_at").limit(1).maybeSingle();
  if (!fridge) redirect("/fridge/add?error=1");
  const { error } = await supabase.from("lots").insert({ ...parsed.data, fridge_id: fridge.id });
  if (error) redirect("/fridge/add?error=1");
  done();
}

export type AddState = { ok?: true; id?: string; error?: string };

/** Fridge Home add form: same validation as addLot, but returns instead of redirecting. */
export async function addLotFromHome(_prev: AddState, fd: FormData): Promise<AddState> {
  const parsed = lotSchema.safeParse(fields(fd));
  if (!parsed.success) return { error: "บันทึกไม่สำเร็จ ลองอีกครั้ง" };
  const supabase = await createClient();
  const { data: fridge } = await supabase.from("fridges").select("id").order("created_at").limit(1).maybeSingle();
  if (!fridge) return { error: "บันทึกไม่สำเร็จ ลองอีกครั้ง" };
  const { data, error } = await supabase
    .from("lots")
    .insert({ ...parsed.data, fridge_id: fridge.id })
    .select("id")
    .single();
  if (error || !data) return { error: "บันทึกไม่สำเร็จ ลองอีกครั้ง" };
  revalidatePath("/today");
  return { ok: true, id: data.id };
}

export async function updateLot(id: string, fd: FormData) {
  const parsed = lotSchema.safeParse(fields(fd));
  if (!parsed.success) redirect(`/item/${id}?error=1`);
  const supabase = await createClient();
  const { error } = await supabase.from("lots").update(parsed.data).eq("id", id);
  if (error) redirect(`/item/${id}?error=1`);
  done();
}

export async function deleteLot(id: string) {
  const supabase = await createClient();
  await supabase.from("lots").delete().eq("id", id);
  done();
}

export async function discardLot(id: string, fd: FormData) {
  const supabase = await createClient();
  const { data: lot } = await supabase.from("lots").select("qty").eq("id", id).maybeSingle();
  if (lot && lot.qty > 0) {
    const reason = String(fd.get("reason") ?? "").trim().slice(0, 200) || null;
    await supabase.from("lots").update({ qty: 0 }).eq("id", id);
    await supabase.from("usage_logs").insert({ lot_id: id, action: "discard", qty: lot.qty, reason });
  }
  done();
}

/** FEFO-deduct `amountOf(total)` from every lot of name+unit and log it. */
async function deduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fridgeId: string,
  name: string,
  unit: string,
  amountOf: (total: number) => number,
) {
  const { data: lots } = await supabase
    .from("lots")
    .select("id, qty, expires_at, bought_on, created_at")
    .eq("fridge_id", fridgeId)
    .eq("name", name)
    .eq("unit", unit)
    .gt("qty", 0);
  if (!lots?.length) return;
  const total = lots.reduce((s, l) => s + Number(l.qty), 0);
  const amount = amountOf(total);
  const plan = fefo(lots.map((l) => ({ ...l, qty: Number(l.qty) })), amount);
  if (!plan.length) return;
  // ponytail: sequential writes, no transaction; move into a Postgres function if two people tap at once often
  for (const p of plan) {
    await supabase.from("lots").update({ qty: p.left }).eq("id", p.id);
  }
  await supabase
    .from("usage_logs")
    .insert(plan.map((p) => ({ lot_id: p.id, action: amount >= total ? "finish" : "use", qty: p.take })));
}

/** −1 / ใช้ครึ่งหนึ่ง / หมดแล้ว across every lot of the same item, soonest-expiring first. */
export async function consume(fridgeId: string, name: string, unit: string, mode: "one" | "half" | "all") {
  await deduct(await createClient(), fridgeId, name, unit, (total) => (mode === "one" ? 1 : mode === "half" ? total / 2 : total));
  done();
}

/** "ทำเมนูนี้แล้ว": the user confirmed/edited amounts per ingredient; each is deducted FEFO. */
export async function cookMenu(fridgeId: string, fd: FormData) {
  const supabase = await createClient();
  const names = fd.getAll("name").map(String);
  const units = fd.getAll("unit").map(String);
  const qtys = fd.getAll("qty").map(Number);
  for (const [i, name] of names.entries()) {
    const qty = qtys[i];
    if (Number.isFinite(qty) && qty > 0) await deduct(supabase, fridgeId, name, units[i], () => qty);
  }
  done();
}
