import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/expiry";
import type { HomeLot } from "@/lib/home";
import { myIngredients } from "@/lib/catalog";
import { FridgeHome } from "@/components/home/FridgeHome";

export const metadata: Metadata = { title: "ตู้เย็น" };

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: memberships }, { data: lots }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("memberships").select("role, households(id, name, timezone)").eq("user_id", user.id),
    supabase
      .from("lots")
      .select("id, name, qty, unit, category, zone, expires_at, expiry_guessed, bought_on")
      .gt("qty", 0),
    // every past lot (used up too), so "ของฉัน" keeps items that are out of the fridge
    supabase.from("lots").select("name, unit, category, zone").order("bought_on", { ascending: false }).order("created_at", { ascending: false }).limit(500),
  ]);

  // Without generated DB types the embedded relation is typed as an array; it is a single row here.
  type Household = { id: string; name: string; timezone: string };
  const household = memberships?.[0]?.households as unknown as Household | undefined;
  const { reset } = await searchParams;

  return (
    <FridgeHome
      name={profile?.display_name || user.email?.split("@")[0] || ""}
      household={household?.name ?? "กำลังเตรียมบ้านของคุณ…"}
      today={todayIn(household?.timezone)}
      lots={(lots ?? []).map((l) => ({ ...l, qty: Number(l.qty) })) as HomeLot[]}
      mine={myIngredients((history ?? []) as Parameters<typeof myIngredients>[0])}
      canWrite={memberships?.[0]?.role !== "viewer"}
      ai={Boolean(process.env.GEMINI_API_KEY?.trim())}
      reset={Boolean(reset)}
    />
  );
}
