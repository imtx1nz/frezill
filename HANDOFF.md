# HANDOFF — frezill

**อัปเดต:** 2026-10-04 · กฎการพัฒนาอยู่ที่ `.claude/skills/frezill-dev/SKILL.md`

## สถานะ
- ✅ M0: Next.js 16 + Tailwind 4 + Supabase client + Vitest, deploy แล้วที่ https://frezill.vercel.app (Vercel project `frezill`)
- ✅ M1 (ส่วนพื้นฐาน) ใช้งานได้จริงบน production (ผู้ใช้ล็อกอินด้วย Google ผ่านเมื่อ 2026-10-04): สมัครและล็อกอิน (อีเมล + Google), ลืมรหัสและตั้งรหัสใหม่, ออกจากระบบ, proxy กันหน้าที่ต้องล็อกอิน, trigger สร้างบ้านและตู้ให้อัตโนมัติ, RLS
- ⏸ ระบบเชิญ/บทบาท/หลายบ้าน: **พักไว้ที่ branch `m1-invites`** (ผู้ใช้เลือกทำแค่พื้นฐาน) ถ้าจะใช้ต้องรัน migration 0002 ใน branch นั้นก่อน
- 🚧 M2 กำลังทำที่ branch `m2-lots`: ✅ เขียน `supabase/migrations/0002_lots.sql` แล้ว (ยังไม่ได้รัน) · ✅ `lib/inventory.ts` (FEFO) + เทสผ่าน · ⏳ CRUD UI
- ➡️ ถัดไป: **Session 1 = M2** (ดูตารางใน skill) เปิด session ใหม่ทุกครั้งที่ขึ้น M ใหม่
- 📊 ของจริง M0+M1 (session เดียว, Opus 5.5, ไม่มี subagent): ประมาณ 32M token (98% เป็น cache read), ทำงานจริงประมาณ 3 ชม. 20 นาที
- ⚙️ 2026-10-04: เปลี่ยน skill เป็น ponytail ระดับ ultra, ไม่โหลด impeccable, อัปเดต HANDOFF ทุกครั้งที่งานย่อยเสร็จ

## ไฟล์สำคัญ
- `proxy.ts` + `lib/supabase/proxy.ts`: refresh session, คนที่ยังไม่ล็อกอินถูกส่งไป /login, คนที่ล็อกอินแล้วเข้า /login หรือ /signup จะถูกส่งไป /today
- `app/(auth)/actions.ts`: server actions ทั้งหมดของระบบ auth
- `app/auth/callback/route.ts`: รับลิงก์ยืนยันอีเมล, ลิงก์ reset และ Google (PKCE)
- `supabase/migrations/0001_auth_households.sql`: ตาราง + RLS + trigger `handle_new_user`
- `lib/auth/*`: zod schema, แปล error เป็นไทย, `safeNext` กัน open redirect (มีเทส)

## วิธีรัน
```bash
cp .env.example .env.local   # ใส่ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
npm test
```

## Deploy
- `npx vercel deploy --prod` (CLI ล็อกอินบัญชี imtx1nz และ link ไว้ใน `.vercel/` แล้ว)
- env บน Vercel (Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ตัวหลังเป็น publishable key)
- Google OAuth เปิดแล้ว (client อยู่ใน Google Cloud ของผู้ใช้ ปุ่มแสดงอัตโนมัติจาก `lib/auth/providers.ts`)
- ยังไม่ได้ต่อ GitHub auto-deploy: `vercel git connect` ไม่ผ่าน ต้องติดตั้ง Vercel GitHub App ก่อน
- Supabase project ref: `wlprvlbdohsjjljrggpk` ตอนนี้ migration 0001 รันแล้ว

## Gotchas
- Next 16 เปลี่ยนชื่อ middleware เป็น `proxy.ts` และ `PageProps`/`LayoutProps` เป็น global type ที่ได้จาก `next typegen`
- ใน Supabase ไปที่ Authentication → URL Configuration ใส่ Site URL และ Redirect URL `http://localhost:3000/**` (ตอน deploy ต้องเพิ่มโดเมน Vercel ด้วย)
- ถ้า signUp ด้วยอีเมลที่มีบัญชีอยู่แล้ว Supabase ไม่คืน error แต่คืน user ที่ `identities` ว่าง โค้ดจัดการกรณีนี้แล้ว
