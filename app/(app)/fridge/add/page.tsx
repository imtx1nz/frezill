import type { Metadata } from "next";
import { Notice } from "@/components/auth/Notice";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { LotFields } from "@/components/inventory/LotFields";
import { PageHeader } from "@/components/inventory/PageHeader";
import { addLot } from "../actions";

export const metadata: Metadata = { title: "เพิ่มของ" };

export default async function AddPage({ searchParams }: PageProps<"/fridge/add">) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-10 pt-5">
      <PageHeader back="/fridge" title="เพิ่มของเข้าตู้" />
      {error && <Notice tone="error">บันทึกไม่สำเร็จ ตรวจข้อมูลแล้วลองอีกครั้ง</Notice>}
      <form action={addLot} className="flex flex-col gap-4">
        <LotFields />
        <SubmitButton pendingText="กำลังบันทึก…">บันทึก</SubmitButton>
      </form>
    </main>
  );
}
