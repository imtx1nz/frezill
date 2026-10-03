import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "member" | "viewer";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "เจ้าของบ้าน",
  member: "สมาชิก",
  viewer: "ดูอย่างเดียว",
};

export type Member = { userId: string; name: string; role: Role; isMe: boolean };

export type CurrentHousehold = {
  id: string;
  name: string;
  myRole: Role;
  inviteCode: string | null;
  inviteExpiresAt: string | null;
  fridges: { id: string; name: string }[];
  members: Member[];
  others: { id: string; name: string }[]; // other households I belong to
};

/** The signed-in user's active household (profiles.current_household_id, else their first). */
export async function getCurrentHousehold(): Promise<{ userId: string; displayName: string; household: CurrentHousehold | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: mine }] = await Promise.all([
    supabase.from("profiles").select("display_name, current_household_id").eq("id", user.id).maybeSingle(),
    supabase.from("memberships").select("household_id, role, created_at, households(name)").eq("user_id", user.id).order("created_at"),
  ]);

  const displayName = profile?.display_name || user.email?.split("@")[0] || "";
  if (!mine?.length) return { userId: user.id, displayName, household: null };

  const active = mine.find((m) => m.household_id === profile?.current_household_id) ?? mine[0];
  const hid = active.household_id as string;

  const [{ data: h }, { data: roster }, { data: fridges }] = await Promise.all([
    supabase.from("households").select("id, name, invite_code, invite_expires_at").eq("id", hid).single(),
    supabase.from("memberships").select("user_id, role, created_at").eq("household_id", hid).order("created_at"),
    supabase.from("fridges").select("id, name").eq("household_id", hid).order("created_at"),
  ]);

  const ids = (roster ?? []).map((r) => r.user_id as string);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, display_name").in("id", ids)
    : { data: [] as { id: string; display_name: string }[] };
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const roleOrder: Record<Role, number> = { owner: 0, member: 1, viewer: 2 };
  const members: Member[] = (roster ?? [])
    .map((r) => ({
      userId: r.user_id as string,
      name: nameOf.get(r.user_id) || "สมาชิก",
      role: r.role as Role,
      isMe: r.user_id === user.id,
    }))
    .sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

  const nameFromJoin = (m: (typeof mine)[number]) =>
    (m.households as unknown as { name: string } | null)?.name ?? "บ้าน";

  return {
    userId: user.id,
    displayName,
    household: {
      id: hid,
      name: h?.name ?? nameFromJoin(active),
      myRole: active.role as Role,
      inviteCode: h?.invite_code ?? null,
      inviteExpiresAt: h?.invite_expires_at ?? null,
      fridges: fridges ?? [],
      members,
      others: mine.filter((m) => m.household_id !== hid).map((m) => ({ id: m.household_id as string, name: nameFromJoin(m) })),
    },
  };
}
