import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageHeader } from "@/components/inventory/PageHeader";
import { Recipes } from "./Recipes";

export const metadata: Metadata = { title: "เมนูแนะนำ" };

export default async function RecipesPage() {
  await connection(); // check the key at request time, not build time
  if (!process.env.GEMINI_API_KEY?.trim()) notFound();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pb-10 pt-5">
      <PageHeader back="/today" title="เมนูแนะนำ" />
      <p className="-mt-3 text-ink-2">AI เสนอ 3 เมนูจากของในตู้ โดยใช้ของใกล้หมดอายุก่อน</p>
      <Recipes />
    </main>
  );
}
