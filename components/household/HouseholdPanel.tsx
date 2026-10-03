"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Crown, Eye, Link2, LogOut, Pencil, Share2, Trash2, UserRound, X } from "lucide-react";
import {
  createInvite,
  leaveHousehold,
  removeMember,
  renameHousehold,
  revokeInvite,
  setMemberRole,
  switchHousehold,
  type ActionResult,
} from "@/app/(app)/household/actions";
import { ROLE_LABEL, type CurrentHousehold, type Role } from "@/lib/household";

const card = "rounded-2xl bg-surface p-5 shadow-[0_10px_30px_-18px_rgb(4_40_30/0.35)]";
const ghostBtn =
  "flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-[0.9375rem] font-semibold text-ink transition-colors hover:border-ink-3 disabled:opacity-60";

function useAction() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const run = (fn: () => Promise<ActionResult | void>) =>
    start(async () => {
      const r = await fn();
      if (r) setResult(r);
    });
  return { pending, result, run, setResult };
}

function Status({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p role={result.error ? "alert" : "status"} className={`text-[0.9375rem] font-medium ${result.error ? "text-danger" : "text-brand-ink"}`}>
      {result.error ?? result.ok}
    </p>
  );
}

const thDate = (iso: string) =>
  new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function HouseholdPanel({ household, userId }: { household: CurrentHousehold; userId: string }) {
  const isOwner = household.myRole === "owner";
  return (
    <div className="flex flex-col gap-5">
      <NameCard household={household} isOwner={isOwner} />
      {isOwner && <InviteCard household={household} />}
      <MembersCard household={household} isOwner={isOwner} />
      {household.others.length > 0 && <OtherHouses others={household.others} />}
      <LeaveCard household={household} userId={userId} />
    </div>
  );
}

function NameCard({ household, isOwner }: { household: CurrentHousehold; isOwner: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(household.name);
  const { pending, result, run } = useAction();

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.02em]">{household.name}</h1>
          <p className="mt-1 text-ink-2">
            สมาชิก {household.members.length} คน · คุณเป็น{ROLE_LABEL[household.myRole]}
          </p>
          <Status result={result} />
        </div>
        {isOwner && (
          <button type="button" onClick={() => setEditing(true)} className={ghostBtn} aria-label="เปลี่ยนชื่อบ้าน">
            <Pencil className="size-4.5" /> แก้ชื่อ
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      className={`${card} flex flex-col gap-3`}
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const r = await renameHousehold(household.id, name);
          if (r.ok) setEditing(false);
          return r;
        });
      }}
    >
      <label htmlFor="hh-name" className="font-semibold">
        ชื่อบ้าน
      </label>
      <input
        id="hh-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        autoFocus
        className="h-13 rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-brand focus:shadow-[0_0_0_4px_var(--brand-soft)]"
      />
      <Status result={result} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="h-11 flex-1 rounded-xl bg-brand font-semibold text-white hover:bg-brand-ink disabled:opacity-70">
          {pending ? "กำลังบันทึก…" : "บันทึก"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={`${ghostBtn} flex-1`}>
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

function InviteCard({ household }: { household: CurrentHousehold }) {
  const { pending, result, run } = useAction();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
  }, []);

  const active =
    household.inviteCode && household.inviteExpiresAt && new Date(household.inviteExpiresAt) > new Date();
  const link = active ? `${origin}/join/${household.inviteCode}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the link stays visible to copy by hand */
    }
  };

  return (
    <section className={`${card} flex flex-col gap-4`} aria-labelledby="invite-h">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
          <Link2 className="size-5.5" />
        </span>
        <div>
          <h2 id="invite-h" className="font-semibold">
            ชวนคนในบ้าน
          </h2>
          <p className="text-[0.9375rem] text-ink-2">ส่งลิงก์ทาง LINE แล้วกดเข้าบ้านได้ทันที</p>
        </div>
      </div>

      {active ? (
        <>
          <div className="rounded-xl bg-ice px-4 py-3">
            <p className="text-sm text-ink-2">รหัสเชิญ</p>
            <p className="font-mono text-[1.625rem] font-bold tracking-[0.18em] text-ink tabular-nums">{household.inviteCode}</p>
            <p className="mt-1 break-all text-sm text-ink-2">{link}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={copy} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white hover:bg-brand-ink">
              {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
              {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={() => navigator.share({ title: `เข้าบ้าน ${household.name} บน frezill`, url: link }).catch(() => {})}
                className={`${ghostBtn} h-12`}
              >
                <Share2 className="size-5" /> แชร์
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-2">
            <span>ใช้ได้ถึง {thDate(household.inviteExpiresAt!)}</span>
            <span className="flex gap-1">
              <button type="button" disabled={pending} onClick={() => run(() => createInvite(household.id))} className="rounded-lg px-2.5 py-2 font-semibold text-brand hover:bg-brand-soft">
                สร้างรหัสใหม่
              </button>
              <button type="button" disabled={pending} onClick={() => run(() => revokeInvite(household.id))} className="rounded-lg px-2.5 py-2 font-semibold text-danger hover:bg-danger-soft">
                ยกเลิกลิงก์
              </button>
            </span>
          </div>
        </>
      ) : (
        <button type="button" disabled={pending} onClick={() => run(() => createInvite(household.id))} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white hover:bg-brand-ink disabled:opacity-70">
          <Link2 className="size-5" /> {pending ? "กำลังสร้าง…" : "สร้างลิงก์เชิญ (ใช้ได้ 7 วัน)"}
        </button>
      )}
      <Status result={result} />
    </section>
  );
}

const roleIcon: Record<Role, React.ReactNode> = {
  owner: <Crown className="size-4" />,
  member: <UserRound className="size-4" />,
  viewer: <Eye className="size-4" />,
};

function MembersCard({ household, isOwner }: { household: CurrentHousehold; isOwner: boolean }) {
  const { pending, result, run } = useAction();
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <section className={card} aria-labelledby="members-h">
      <h2 id="members-h" className="font-semibold">
        สมาชิกในบ้าน
      </h2>
      <ul className="mt-2 divide-y divide-line">
        {household.members.map((m) => (
          <li key={m.userId} className="flex flex-wrap items-center gap-3 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand-ink">
              {m.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {m.name} {m.isMe && <span className="font-normal text-ink-2">(คุณ)</span>}
              </p>
              <p className="flex items-center gap-1 text-sm text-ink-2">
                {roleIcon[m.role]} {ROLE_LABEL[m.role]}
              </p>
            </div>

            {isOwner && !m.isMe && m.role !== "owner" && (
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`role-${m.userId}`}>
                  บทบาทของ {m.name}
                </label>
                <select
                  id={`role-${m.userId}`}
                  defaultValue={m.role}
                  disabled={pending}
                  onChange={(e) => run(() => setMemberRole(household.id, m.userId, e.target.value))}
                  className="h-11 rounded-xl border border-line bg-surface px-3 text-[0.9375rem] outline-none focus:border-brand"
                >
                  <option value="member">สมาชิก</option>
                  <option value="viewer">ดูอย่างเดียว</option>
                </select>
                {confirming === m.userId ? (
                  <span className="flex gap-1">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => removeMember(household.id, m.userId))}
                      className="h-11 rounded-xl bg-danger px-3 text-[0.9375rem] font-semibold text-white"
                    >
                      นำออก
                    </button>
                    <button type="button" onClick={() => setConfirming(null)} aria-label="ยกเลิก" className="grid size-11 place-items-center rounded-xl border border-line">
                      <X className="size-4.5" />
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirming(m.userId)} aria-label={`นำ ${m.name} ออกจากบ้าน`} className="grid size-11 place-items-center rounded-xl border border-line text-ink-2 hover:border-danger hover:text-danger">
                    <Trash2 className="size-4.5" />
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {household.members.length === 1 && (
        <p className="text-[0.9375rem] text-ink-2">ยังมีคุณคนเดียว {isOwner ? "สร้างลิงก์เชิญด้านบนเพื่อชวนคนในบ้าน" : ""}</p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-ink-3">
        <b className="font-semibold text-ink-2">ดูอย่างเดียว</b> เหมาะกับผู้สูงอายุ: เห็นของในตู้และรับแจ้งเตือนได้ แต่กดแก้ไขไม่ได้ กันกดผิด
      </p>
      <Status result={result} />
    </section>
  );
}

function OtherHouses({ others }: { others: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  return (
    <section className={card} aria-labelledby="other-h">
      <h2 id="other-h" className="font-semibold">
        บ้านอื่นของคุณ
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        {others.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3">
            <span className="truncate">{o.name}</span>
            <button type="button" disabled={pending} onClick={() => start(() => switchHousehold(o.id))} className={ghostBtn}>
              สลับไปบ้านนี้
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LeaveCard({ household, userId }: { household: CurrentHousehold; userId: string }) {
  const { pending, result, run } = useAction();
  const [confirm, setConfirm] = useState(false);
  const soleOwner = household.myRole === "owner" && household.members.filter((m) => m.role === "owner").length === 1;
  if (soleOwner) return null;

  return (
    <section className="flex flex-col gap-2">
      {confirm ? (
        <div className={`${card} flex flex-col gap-3`}>
          <p>ออกจาก “{household.name}”? คุณจะไม่เห็นของในตู้นี้อีก จนกว่าจะมีคนเชิญใหม่</p>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={() => run(() => leaveHousehold(household.id, userId))} className="h-11 flex-1 rounded-xl bg-danger font-semibold text-white">
              ออกจากบ้าน
            </button>
            <button type="button" onClick={() => setConfirm(false)} className={`${ghostBtn} flex-1`}>
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className="flex h-11 w-fit items-center gap-2 rounded-xl px-2 font-semibold text-danger hover:bg-danger-soft">
          <LogOut className="size-4.5" /> ออกจากบ้านนี้
        </button>
      )}
      <Status result={result} />
    </section>
  );
}
