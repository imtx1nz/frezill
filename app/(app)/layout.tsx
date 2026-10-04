import { TabBar } from "@/components/shell/TabBar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Name + household for the ≡ menu (desktop top bar). The proxy already gates signed-out users.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { data: m }] = user
    ? await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("memberships").select("households(name)").eq("user_id", user.id).limit(1).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];
  const household = (m?.households as unknown as { name: string } | null)?.name ?? "";

  return (
    <>
      <TabBar
        ai={Boolean(process.env.GEMINI_API_KEY?.trim())}
        name={profile?.display_name || user?.email?.split("@")[0] || ""}
        household={household}
      />
      <div className="flex flex-1 flex-col pb-[var(--tabbar-h)] lg:pb-0">{children}</div>
    </>
  );
}
