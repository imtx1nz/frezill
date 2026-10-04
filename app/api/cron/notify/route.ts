import { todayIn } from "@/lib/expiry";
import { buildEmail, mailReady, pickDue, sendMail, type DueLot } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_USERS = 200; // ponytail: one batch per daily run; page through if users outgrow it

const plusDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

/** Vercel Cron, daily 01:00 UTC (08:00 Bangkok): one summary email per opted-in user. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!mailReady() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "mail not configured" }, { status: 503 });
  }

  const db = createAdminClient();
  const today = todayIn("Asia/Bangkok");
  const summary = { checked: 0, sent: 0, skipped: 0, errors: 0 };

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, notify_days")
    .eq("notify_email", true)
    .or(`last_notified_on.is.null,last_notified_on.lt.${today}`)
    .limit(MAX_USERS);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!profiles.length) return Response.json(summary);

  // Bulk-load memberships → fridges → due lots (max window 3 days), then group in memory.
  const ids = profiles.map((p) => p.id);
  const { data: members } = await db.from("memberships").select("user_id, household_id").in("user_id", ids);
  const hids = [...new Set((members ?? []).map((m) => m.household_id))];
  const { data: fridges } = hids.length ? await db.from("fridges").select("id, household_id").in("household_id", hids) : { data: [] };
  const fids = (fridges ?? []).map((f) => f.id);
  const { data: lots } = fids.length
    ? await db.from("lots").select("fridge_id, name, qty, unit, expires_at").in("fridge_id", fids).gt("qty", 0).lte("expires_at", plusDays(today, 3))
    : { data: [] };

  const fridgeHome = new Map((fridges ?? []).map((f) => [f.id, f.household_id as string]));
  const byHome = new Map<string, DueLot[]>();
  for (const l of lots ?? []) {
    const h = fridgeHome.get(l.fridge_id)!;
    byHome.set(h, [...(byHome.get(h) ?? []), { ...l, qty: Number(l.qty) }]);
  }

  for (const p of profiles) {
    summary.checked++;
    try {
      const homes = (members ?? []).filter((m) => m.user_id === p.id).map((m) => m.household_id);
      const due = pickDue(homes.flatMap((h) => byHome.get(h) ?? []), today, p.notify_days);
      const { data: u } = await db.auth.admin.getUserById(p.id);
      const email = u.user?.email;
      if (due.length && email) {
        await sendMail(email, buildEmail(due, today));
        summary.sent++;
      } else summary.skipped++;
      await db.from("profiles").update({ last_notified_on: today }).eq("id", p.id);
    } catch (e) {
      summary.errors++;
      console.error("notify", p.id, e);
    }
  }
  return Response.json(summary);
}
