# HANDOFF — frezill

**อัปเดต:** 2026-10-04 · กฎการพัฒนาอยู่ที่ `.claude/skills/frezill-dev/SKILL.md`

## สถานะ
- ✅ M0: Next.js 16 + Tailwind 4 + Supabase client + Vitest, deploy แล้วที่ https://frezill.vercel.app (Vercel project `frezill`)
- ✅ M1 (ส่วนพื้นฐาน) ใช้งานได้จริงบน production (ผู้ใช้ล็อกอินด้วย Google ผ่านเมื่อ 2026-10-04): สมัครและล็อกอิน (อีเมล + Google), ลืมรหัสและตั้งรหัสใหม่, ออกจากระบบ, proxy กันหน้าที่ต้องล็อกอิน, trigger สร้างบ้านและตู้ให้อัตโนมัติ, RLS
- ⏸ ระบบเชิญ/บทบาท/หลายบ้าน: **พักไว้ที่ branch `m1-invites`** (ผู้ใช้เลือกทำแค่พื้นฐาน) ถ้าจะใช้ต้องรัน migration 0002 ใน branch นั้นก่อน
- 🟡 M2 โค้ดเสร็จแล้วที่ branch **`m2-lots`** (ยังไม่ merge, ยังไม่ deploy เพราะต้องรัน migration 0002 ก่อน ไม่งั้น production พัง): ✅ migration `0002_lots.sql` · ✅ FEFO + เทส · ✅ หน้า /fridge, /fridge/add, /item/[id] · ✅ test/tsc/lint/build ผ่าน
- 🟡 M3+M4 กำลังทำที่ branch **`m3-expiry`** (แตกจาก `m2-lots`): ✅ `lib/expiry.ts` + เทส · ✅ ช่องวันหมดอายุในฟอร์ม · ⏳ หน้า today
- ➡️ ถัดไป: ทำ 3 ขั้นด้านล่างให้ M2 ขึ้น production แล้วค่อยเปิด session ใหม่ทำ **M3+M4**

## เช้านี้ทำ 3 ขั้น (M2)
1. [ ] เปิด Supabase → SQL Editor → วางเนื้อหาทั้งไฟล์ `supabase/migrations/0002_lots.sql` → Run (รันซ้ำได้ ไม่พัง)
2. [ ] `git checkout main && git merge m2-lots && git push`
3. [ ] `npx vercel deploy --prod`

**กดเช็กบน https://frezill.vercel.app** (ล็อกอินก่อน)
- หน้า today → กดการ์ดตู้เย็น → ไปหน้า "ของในตู้เย็น" (ว่าง มีข้อความชวนเพิ่ม)
- กด "เพิ่ม" → ใส่ ไข่ไก่ 4 ฟอง → บันทึก → เห็นในรายการ
- เพิ่ม ไข่ไก่ 6 ฟอง อีกครั้ง → รวมเป็น 10 ฟอง มี 2 ล็อต
- กด −1 → 9 ฟอง (ล็อตแรกที่เพิ่มเหลือ 3 = FEFO; ตอนนี้ยังไม่มีช่องวันหมดอายุ จึงตัดล็อตที่ซื้อก่อน)
- กด "ใช้ครึ่งหนึ่ง" → เหลือ 4.5 · กด "หมดแล้ว" → รายการหายไป
- เพิ่มของใหม่ → กดล็อต "แก้ไข ›" → เปลี่ยนจำนวน/หมวด/โซน → บันทึก · ลองปุ่ม "ทิ้ง" (ใส่เหตุผลหรือไม่ก็ได้) และ "ลบรายการนี้"

**การตัดสินใจคืนนี้ (agent ตัดสินเอง ผู้ใช้หลับอยู่)**
- ของ = แถวใน `lots` ของชื่อ+หน่วยเดียวกันรวมเป็นรายการเดียวในหน้า /fridge และแสดงล็อตย่อยข้างใต้
- ปุ่ม −1 / ใช้ครึ่งหนึ่ง / หมดแล้ว ทำงานกับทั้งรายการ ตัดแบบ FEFO (`lib/inventory.ts` → `fefo()`: หมดอายุก่อนตัดก่อน, ไม่มีวันหมดอายุไว้ท้าย, เสมอกันตัดล็อตเก่าก่อน) และเขียน `usage_logs` ทุกครั้ง
- "ทิ้ง" (พร้อมเหตุผลไม่บังคับ) ทำทีละล็อตที่หน้าแก้ไข เพราะของเสียมักเป็นล็อตเดียว · "ลบ" = ลบแถวที่ใส่ผิด (log ของล็อตนั้นถูกลบตาม)
- ล็อตที่ใช้หมดไม่ลบ แต่ตั้ง `qty = 0` และซ่อนจากรายการ เพื่อให้ `usage_logs` ยังผูกกับล็อตได้
- ใส่คอลัมน์ `expires_at`, `expiry_guessed` ไว้ใน 0002 เลย (FEFO ต้องใช้) แต่ช่องกรอกวันหมดอายุทำใน M3 ตามแผน
- หมวดหมู่ 9 หมวด (ผัก ผลไม้ เนื้อสัตว์ อาหารทะเล ไข่และนม เครื่องดื่ม เครื่องปรุง อาหารปรุงสุก อื่น ๆ) เป็น check constraint · โซน ช่องธรรมดา/ช่องแช่แข็ง · หน่วยพิมพ์เองได้ มีตัวเลือกให้ (datalist)
- เพิ่ม helper `fridge_household(fridge_id)` แบบ SECURITY DEFINER ให้ policy ของ lots ใช้ `is_member`/`can_write` ตามแบบ 0001
- ใช้ตู้แรกของบ้าน (บ้านละ 1 ตู้ตอนนี้)
- ยังไม่ทำ: เตือนตอนเพิ่มของที่มีอยู่แล้ว ("ยังมีไข่ไก่ 4 ฟอง…") ทำพร้อม M3 เพราะต้องแสดงวันหมดอายุ, datalist รายชื่อของจาก `lib/catalog.ts` (M3)

**ความเสี่ยง / ยังไม่ได้ทดสอบ**
- ยังไม่ได้กดจริงบน production (รัน migration ไม่ได้) ตรวจแล้วด้วย: Vitest 15 เทส, tsc, lint, build, curl ว่าหน้าใหม่ redirect ไป /login เมื่อยังไม่ล็อกอิน, และรัน 0001+0002 (สองรอบ) ใน PGlite จำลอง: user B เพิ่ม/อ่าน/แก้ ของบ้าน A ไม่ได้, check constraint ทำงาน
- การตัดหลายล็อตเป็นการเขียนทีละแถว ไม่มี transaction ถ้าสองคนกดพร้อมกันอาจเพี้ยนเล็กน้อย (ย้ายไปเป็น Postgres function ถ้าเจอจริง)
- branch `m1-invites` มี migration ชื่อ `0002_...` อยู่แล้ว ถ้าจะ merge ทีหลังต้องเปลี่ยนเลขเป็น 0003

- 📊 ของจริง M0+M1 (session เดียว, Opus 5.5, ไม่มี subagent): ประมาณ 32M token (98% เป็น cache read), ทำงานจริงประมาณ 3 ชม. 20 นาที
- ⚙️ 2026-10-04: เปลี่ยน skill เป็น ponytail ระดับ ultra, ไม่โหลด impeccable, อัปเดต HANDOFF ทุกครั้งที่งานย่อยเสร็จ

## ไฟล์สำคัญ
- `proxy.ts` + `lib/supabase/proxy.ts`: refresh session, คนที่ยังไม่ล็อกอินถูกส่งไป /login, คนที่ล็อกอินแล้วเข้า /login หรือ /signup จะถูกส่งไป /today
- `app/(auth)/actions.ts`: server actions ทั้งหมดของระบบ auth
- `app/auth/callback/route.ts`: รับลิงก์ยืนยันอีเมล, ลิงก์ reset และ Google (PKCE)
- `supabase/migrations/0001_auth_households.sql`: ตาราง + RLS + trigger `handle_new_user`
- `app/(app)/fridge/actions.ts`: server actions เพิ่ม/แก้/ลบ/ทิ้ง/ตัด FEFO · `lib/inventory.ts`: หมวด, โซน, zod schema, `fefo()` (มีเทส) · `components/inventory/*`: ฟอร์มและหัวหน้า
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
- Supabase project ref: `wlprvlbdohsjjljrggpk` ตอนนี้ migration 0001 รันแล้ว · 0002 (M2) **ยังไม่รัน**

## Gotchas
- Next 16 เปลี่ยนชื่อ middleware เป็น `proxy.ts` และ `PageProps`/`LayoutProps` เป็น global type ที่ได้จาก `next typegen`
- ใน Supabase ไปที่ Authentication → URL Configuration ใส่ Site URL และ Redirect URL `http://localhost:3000/**` (ตอน deploy ต้องเพิ่มโดเมน Vercel ด้วย)
- ถ้า signUp ด้วยอีเมลที่มีบัญชีอยู่แล้ว Supabase ไม่คืน error แต่คืน user ที่ `identities` ว่าง โค้ดจัดการกรณีนี้แล้ว
