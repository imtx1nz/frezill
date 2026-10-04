import { PendingButton } from "@/components/inventory/PendingButton";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { LotFields, inputClass } from "@/components/inventory/LotFields";
import { PageHeader } from "@/components/inventory/PageHeader";
import { deleteLot, discardLot, updateLot } from "../../fridge/actions";

export const metadata: Metadata = { title: "แก้ไขของ" };

export default async function ItemPage({ params, searchParams }: PageProps<"/item/[id]">) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: lot } = await supabase
    .from("lots")
    .select("id, name, qty, unit, category, zone, expires_at, bought_on")
    .eq("id", id)
    .maybeSingle();
  if (!lot) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-10 pt-5">
      <PageHeader back="/today" title={`แก้ไข ${lot.name}`} />
      {error && <Notice tone="error">บันทึกไม่สำเร็จ ตรวจข้อมูลแล้วลองอีกครั้ง</Notice>}
      <form action={updateLot.bind(null, id)} className="flex flex-col gap-4">
        <LotFields lot={{ ...lot, qty: Number(lot.qty) }} />
        <SubmitButton pendingText="กำลังบันทึก…">บันทึก</SubmitButton>
      </form>

      <form
        action={discardLot.bind(null, id)}
        className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-[0_10px_30px_-18px_rgb(4_40_30/0.35)]"
      >
        <label className="flex flex-col gap-1.5 text-[0.9375rem] font-semibold">
          ทิ้งล็อตนี้ (เหตุผล ไม่บังคับ)
          <input name="reason" maxLength={200} placeholder="เช่น เสีย, ขึ้นรา" className={inputClass} />
        </label>
        <PendingButton className="h-11 rounded-xl border border-warn bg-warn-soft font-semibold text-warn hover:brightness-95">
          ทิ้ง
        </PendingButton>
      </form>

      <form action={deleteLot.bind(null, id)}>
        <PendingButton className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-danger bg-danger-soft font-semibold text-danger hover:brightness-95">
          <Trash2 className="size-4.5" /> ลบรายการนี้ (ใส่ผิด)
        </PendingButton>
      </form>
    </main>
  );
}
