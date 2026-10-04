import { daysLeft, thaiDate } from "./expiry";

export const SITE = "https://frezill.vercel.app";

export type DueLot = { name: string; qty: number; unit: string; expires_at: string | null };
export type Mail = { subject: string; html: string; text: string };

/** "Name <a@b.c>" or "a@b.c" → { name?, email }; null when it isn't an address. */
export function parseFrom(raw: string | undefined) {
  const s = raw?.trim() ?? "";
  const m = s.match(/^(?:"?([^"<]*?)"?\s*<([^<>\s]+@[^<>\s]+)>|([^<>\s]+@[^<>\s]+))$/);
  if (!m) return null;
  const email = m[2] ?? m[3];
  const name = m[1]?.trim();
  return name ? { name, email } : { email };
}

export const mailReady = () => Boolean(process.env.BREVO_API_KEY?.trim() && parseFrom(process.env.MAIL_FROM));

/** Lots with stock that expire within `days` (already expired included), soonest first. */
export const pickDue = (lots: DueLot[], today: string, days: number) =>
  lots
    .filter((l) => l.qty > 0 && l.expires_at && daysLeft(l.expires_at, today) <= days)
    .sort((a, b) => a.expires_at!.localeCompare(b.expires_at!));

const fmt = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);

function groups(items: DueLot[], today: string) {
  const out = new Map<string, DueLot[]>();
  for (const it of items) {
    const d = daysLeft(it.expires_at!, today);
    const key = d < 0 ? "หมดอายุแล้ว" : d === 0 ? "หมดวันนี้" : `อีก ${d} วัน`;
    out.set(key, [...(out.get(key) ?? []), it]);
  }
  return [...out];
}

/** Thai summary email; `items` come from pickDue (sorted, so groups read expired → later). */
export function buildEmail(items: DueLot[], today: string): Mail {
  const subject = `frezill: มีของใกล้หมดอายุ ${items.length} อย่าง`;
  const g = groups(items, today);
  const text = [
    "ของในตู้เย็นที่ควรใช้ก่อน",
    ...g.flatMap(([h, list]) => ["", h, ...list.map((i) => `- ${i.name} ${fmt(i.qty)} ${i.unit} (${thaiDate(i.expires_at!)})`)]),
    "",
    `เปิดตู้เย็น: ${SITE}/today`,
    `ปิดการแจ้งเตือนทางอีเมลได้ที่ ${SITE}/settings`,
  ].join("\n");
  const html = `<div style="font-family:sans-serif;max-width:480px;margin:auto;color:#12201a;font-size:16px;line-height:1.5">
<h1 style="font-size:22px;margin:0 0 12px">ของในตู้เย็นที่ควรใช้ก่อน</h1>
${g
  .map(
    ([h, list]) => `<h2 style="font-size:17px;margin:16px 0 4px;color:${h === "หมดอายุแล้ว" || h === "หมดวันนี้" ? "#b42318" : "#6b5000"}">${esc(h)}</h2>
<ul style="margin:0;padding-left:20px">${list
      .map((i) => `<li><b>${esc(i.name)}</b> ${fmt(i.qty)} ${esc(i.unit)} <span style="color:#47594f">· ${thaiDate(i.expires_at!)}</span></li>`)
      .join("")}</ul>`,
  )
  .join("\n")}
<p style="margin:24px 0"><a href="${SITE}/today" style="display:inline-block;background:#4cc764;color:#1b1f3b;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:999px;border:3px solid #1b1f3b">เปิดตู้เย็น</a></p>
<p style="font-size:13px;color:#6b7d73">ปิดการแจ้งเตือนทางอีเมลได้ที่ <a href="${SITE}/settings" style="color:#0b7a5c">การตั้งค่า</a></p>
</div>`;
  return { subject, html, text };
}

/** Brevo transactional send. Server-only (reads the API key). */
export async function sendMail(to: string, mail: Mail) {
  const sender = parseFrom(process.env.MAIL_FROM);
  const key = process.env.BREVO_API_KEY?.trim();
  if (!sender || !key) throw new Error("mail not configured");
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender, to: [{ email: to }], subject: mail.subject, htmlContent: mail.html, textContent: mail.text }),
  });
  if (!res.ok) throw new Error(`brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
