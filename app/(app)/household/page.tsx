import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentHousehold } from "@/lib/household";
import { HouseholdPanel } from "@/components/household/HouseholdPanel";

export const metadata: Metadata = { title: "บ้านของฉัน" };

export default async function HouseholdPage() {
  const data = await getCurrentHousehold();
  if (!data) redirect("/login?next=/household");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-12 pt-5">
      <Link href="/today" className="-ml-1 flex w-fit items-center gap-1.5 py-1 font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-5" /> กลับหน้าวันนี้
      </Link>
      {data.household ? (
        <HouseholdPanel household={data.household} userId={data.userId} />
      ) : (
        <p className="text-ink-2">คุณยังไม่ได้อยู่ในบ้านไหน ขอลิงก์เชิญจากคนในบ้าน แล้วกดเปิดลิงก์นั้น</p>
      )}
    </main>
  );
}
