# HANDOFF — frezill

**อัปเดต:** 2026-10-04 · กฎการพัฒนาอยู่ที่ `.claude/skills/frezill-dev/SKILL.md`

## สถานะ
- ✅ M0: Next.js 16 + Tailwind 4 + Supabase client + Vitest, deploy แล้วที่ https://frezill.vercel.app (Vercel project `frezill`)
- ✅ M1 (ส่วนพื้นฐาน) ใช้งานได้จริงบน production (ผู้ใช้ล็อกอินด้วย Google ผ่านเมื่อ 2026-10-04): สมัครและล็อกอิน (อีเมล + Google), ลืมรหัสและตั้งรหัสใหม่, ออกจากระบบ, proxy กันหน้าที่ต้องล็อกอิน, trigger สร้างบ้านและตู้ให้อัตโนมัติ, RLS
- ⏸ ระบบเชิญ/บทบาท/หลายบ้าน: **พักไว้ที่ branch `m1-invites`** (ผู้ใช้เลือกทำแค่พื้นฐาน) ถ้าจะใช้ต้องรัน migration 0002 ใน branch นั้นก่อน
- ✅ M2 + M3+M4 ขึ้น production แล้ว (2026-10-04): migration 0002 รันบน Supabase แล้ว (ตรวจแล้ว: `lots` RLS 4 policy, `usage_logs` 2 policy), merge เข้า main (`8a0e488`), deploy แล้ว · curl เช็กแล้ว: /today /fridge /fridge/add /item/[id] redirect ไป login, /login 200
  - ⚠️ **ยังไม่ได้กดทดสอบตอนล็อกอิน** → ผู้ใช้ต้องกดตามรายการ "กดเช็กบน…" ด้านล่าง
  - เวลา: M2 agent ~6 นาที, M3+M4 agent ~5 นาที (agent รายงาน ~77k และ ~75k token ไม่รวม cache read)
- ✅ QA อัตโนมัติบน production (2026-10-04, Playwright + บัญชีทดสอบ `frezill.qa.*@gmail.com`): login, เพิ่ม, เตือนซ้ำ, FEFO (ตรวจใน DB แล้ว), แถบเตือน, เรียงวัน, แก้วัน, ทิ้ง, ลบ ผ่านหมด
  - 🐞 พบ: กดปุ่ม −1/ใช้ครึ่งหนึ่ง/หมดแล้ว แล้วหน้าจอเปลี่ยนช้า 4–5 วินาที และปุ่มไม่ล็อก (กดซ้ำ = ตัดซ้ำ) เพราะ function รันที่ iad1 แต่ DB อยู่โซล
  - ✅ แก้แล้วและขึ้น production (`04fe406`): `vercel.json` regions `icn1` + `PendingButton` ล็อกปุ่มระหว่างบันทึก · วัดซ้ำ: ปุ่มอัปเดตใน 1.1–1.8 วินาที (เดิม 3.9–4.8)
- ➡️ ถัดไป: เปิด session ใหม่ทำ **M5** · **ต้องมี `GEMINI_API_KEY` ก่อน** (สร้างที่ https://aistudio.google.com/apikey แล้วใส่ใน `.env.local` และ Vercel env)
- 🔧 Supabase CLI ล็อกอินแล้ว: รัน migration ได้ด้วย `npx supabase db query --linked --project-ref wlprvlbdohsjjljrggpk -f <file>` (agent โดนบล็อกตอนแก้ production ต้องให้ผู้ใช้รันเองผ่าน `!`)

## ขั้นขึ้น production (ทำเสร็จแล้ว 2026-10-04)
1. [x] เปิด Supabase → SQL Editor → วางเนื้อหาทั้งไฟล์ `supabase/migrations/0002_lots.sql` → Run (รันซ้ำได้ ไม่พัง) · **M3 ไม่มี 0003** (คอลัมน์ `expires_at`, `expiry_guessed` อยู่ใน 0002 แล้ว)
2. [x] `git checkout main && git merge m3-expiry && git push` (merge `m3-expiry` อย่างเดียวพอ เพราะมี `m2-lots` อยู่ข้างในแล้ว)
3. [x] `npx vercel deploy --prod`

**กดเช็กบน https://frezill.vercel.app** (ล็อกอินก่อน)
- หน้า today ตอนตู้ว่าง → ไม่มีแถบเตือน ไม่มีรายการสรุป · กดการ์ดตู้เย็น → หน้า "ของในตู้เย็น" (ว่าง มีข้อความชวนเพิ่ม)
- กด "เพิ่ม" → ไข่ไก่ 4 ฟอง วันหมดอายุ = **พรุ่งนี้** → บันทึก → ล็อตมีป้ายเหลือง "หมดพรุ่งนี้"
- กด "เพิ่ม" อีกครั้ง → พิมพ์ "ไข่" → มีชื่อ "ไข่ไก่" ให้เลือก → เลือกแล้วขึ้น "ยังมีไข่ไก่ 4 ฟอง หมด … อยู่ในตู้" → ใส่ 6 ฟอง วันหมดอายุอีก 10 วัน → บันทึก → รวม 10 ฟอง 2 ล็อต (ล็อตหมดพรุ่งนี้อยู่บน)
- กด −1 → ล็อตหมดพรุ่งนี้เหลือ 3 (FEFO) · กด "ใช้ครึ่งหนึ่ง" → เหลือ 4.5 · กด "หมดแล้ว" → รายการหายไป
- เพิ่ม นม 1 ขวด วันหมดอายุ = **เมื่อวาน**, ผัก 1 ถุง = **วันนี้**, ซอส 1 ขวด **ไม่ใส่วัน**
- กลับหน้า today → แถบแดง "หมดอายุแล้ว 1 รายการ · หมดวันนี้ 1 รายการ" · รายการสรุปเรียง นม (แดง "หมดอายุแล้ว 1 วัน") → ผัก (ส้ม "หมดอายุวันนี้") → ซอส ("ไม่ระบุวันหมด") อยู่ท้าย · ทุกป้ายมีไอคอน+ข้อความ
- กดรายการในสรุป → ไปหน้าแก้ไข → วันหมดอายุเดิมขึ้นในช่อง → เปลี่ยนวัน/ลบวัน → บันทึก → ป้ายเปลี่ยนตาม · ลองปุ่ม "ทิ้ง" และ "ลบรายการนี้"
- เช็กบนมือถือ: ช่องวันที่เปิดปฏิทินของเครื่อง, ป้ายไม่ล้นจอ, แถบเตือนอ่านออก

**การตัดสินใจ M3+M4 (agent ตัดสินเอง ผู้ใช้หลับอยู่)**
- ไม่มี migration ใหม่ · ใช้ `expires_at` จาก 0002 · `expiry_guessed` ยังเป็น false เสมอ
- **ยังไม่ทำการเดาวันหมดอายุ + `lib/catalog.ts`**: เกณฑ์ "เสร็จเมื่อ" ของ M3+M4 ไม่ได้บังคับ (ponytail ultra) วันหมดอายุเป็นช่องไม่บังคับ ถ้าไม่ใส่จะแสดง "ไม่ระบุวันหมด" และอยู่ท้ายรายการ · ถ้าจะทำทีหลัง: ตาราง หมวด×โซน → วัน แล้วเติมให้ตอนช่องว่าง + ตั้ง `expiry_guessed=true` + ป้าย "≈ เดา"
- รายชื่อแนะนำตอนพิมพ์ชื่อ ใช้**ชื่อของที่มีอยู่ในตู้ตอนนี้**แทน catalog (ถูกกว่าและตรงกับบ้านจริง)
- "วันนี้" คิดจาก `households.timezone` (ค่าเริ่มต้น Asia/Bangkok) ด้วย `Intl` ไม่ได้ลง `date-fns` (ไม่ต้องเพิ่ม dependency)
- สถานะ: หมดแล้ว (<0, แดง) / วันนี้ (0, ส้ม) / ใกล้หมด 1–3 วัน (เหลือง) / ปลอดภัย (>3, เขียว) / ไม่ระบุ (เทา) · ตัวเลข 3 วันเป็นพารามิเตอร์ `soonDays` ใน `expiryStatus()` ยังไม่ได้แยกตามหมวด
- หน้า today แสดง**ทุกล็อต**เรียงตามวันหมดอายุ (ไม่รวมกลุ่ม เพราะแต่ละล็อตหมดไม่พร้อมกัน) กดแล้วไปหน้าแก้ไขล็อตนั้น · แถบเตือนแดงถ้ามีของหมดแล้ว/หมดวันนี้ เหลืองถ้ามีแค่ใกล้หมด
- หน้า /fridge: ล็อตในแต่ละรายการเรียงตามวันหมดอายุ (ลำดับ FEFO) และมีป้ายสถานะ
- คำเตือน "ยังมี…" ขึ้นเมื่อชื่อตรงกันทุกตัวอักษร (ตัดช่องว่างหัวท้าย) แยกตามหน่วย บอกวันหมดที่เร็วที่สุด

**ความเสี่ยง / ยังไม่ได้ทดสอบ (M3+M4)**
- ยังไม่ได้กดจริงหลังล็อกอิน (ไม่มี session/migration) ตรวจแล้วด้วย: Vitest 33 เทส (รวมขอบวันที่ไทย 23:59/00:00, ข้ามเดือน/ปี, วันนี้/พรุ่งนี้/หมดแล้ว/ไม่มีวัน, ช่องวันที่ว่าง), tsc, lint, build, curl `next start` ว่า /today /fridge /fridge/add /item/[id] redirect ไป /login
- ยังไม่ได้ดูหน้าจอจริง (ไม่ได้ถ่ายภาพ) ป้ายสถานะยาว ๆ บนจอแคบอาจตัดบรรทัด ใส่ `flex-wrap` ไว้แล้ว
- `<input type="date">` บน iOS Safari แสดงแบบของเครื่อง ยังไม่ได้ลอง
- branch `m1-invites` ก็มี `0002_...` ถ้าจะ merge ทีหลังต้องเปลี่ยนชื่อเป็น `0003_...`

**การตัดสินใจ M2**
- ของ = แถวใน `lots` ของชื่อ+หน่วยเดียวกันรวมเป็นรายการเดียวในหน้า /fridge และแสดงล็อตย่อยข้างใต้
- ปุ่ม −1 / ใช้ครึ่งหนึ่ง / หมดแล้ว ทำงานกับทั้งรายการ ตัดแบบ FEFO (`lib/inventory.ts` → `fefo()`: หมดอายุก่อนตัดก่อน, ไม่มีวันหมดอายุไว้ท้าย, เสมอกันตัดล็อตเก่าก่อน) และเขียน `usage_logs` ทุกครั้ง
- "ทิ้ง" (พร้อมเหตุผลไม่บังคับ) ทำทีละล็อตที่หน้าแก้ไข เพราะของเสียมักเป็นล็อตเดียว · "ลบ" = ลบแถวที่ใส่ผิด (log ของล็อตนั้นถูกลบตาม)
- ล็อตที่ใช้หมดไม่ลบ แต่ตั้ง `qty = 0` และซ่อนจากรายการ เพื่อให้ `usage_logs` ยังผูกกับล็อตได้
- ใส่คอลัมน์ `expires_at`, `expiry_guessed` ไว้ใน 0002 เลย (FEFO ต้องใช้) แต่ช่องกรอกวันหมดอายุทำใน M3 ตามแผน
- หมวดหมู่ 9 หมวด (ผัก ผลไม้ เนื้อสัตว์ อาหารทะเล ไข่และนม เครื่องดื่ม เครื่องปรุง อาหารปรุงสุก อื่น ๆ) เป็น check constraint · โซน ช่องธรรมดา/ช่องแช่แข็ง · หน่วยพิมพ์เองได้ มีตัวเลือกให้ (datalist)
- เพิ่ม helper `fridge_household(fridge_id)` แบบ SECURITY DEFINER ให้ policy ของ lots ใช้ `is_member`/`can_write` ตามแบบ 0001
- ใช้ตู้แรกของบ้าน (บ้านละ 1 ตู้ตอนนี้)
- (ทำแล้วใน M3) เตือนตอนเพิ่มของที่มีอยู่แล้ว ("ยังมีไข่ไก่ 4 ฟอง…") ทำพร้อม M3 เพราะต้องแสดงวันหมดอายุ, datalist รายชื่อของจาก `lib/catalog.ts` (M3)

**ความเสี่ยง / ยังไม่ได้ทดสอบ (M2)**
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
- `lib/expiry.ts`: `todayIn(tz)`, `expiryStatus`, `expiryBadge` (ข้อความไทย+สี), `byExpiry`, `thaiDate` (มีเทส) · `components/inventory/ExpiryBadge.tsx`, `NameInput.tsx` (client: datalist + เตือน "ยังมี…") · หน้า `app/(app)/today/page.tsx` = สรุปรายวัน
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
- Supabase project ref: `wlprvlbdohsjjljrggpk` ตอนนี้ migration 0001 รันแล้ว · 0002 (M2) **ยังไม่รัน** · M3 ไม่มี migration เพิ่ม

## Gotchas
- Next 16 เปลี่ยนชื่อ middleware เป็น `proxy.ts` และ `PageProps`/`LayoutProps` เป็น global type ที่ได้จาก `next typegen`
- ใน Supabase ไปที่ Authentication → URL Configuration ใส่ Site URL และ Redirect URL `http://localhost:3000/**` (ตอน deploy ต้องเพิ่มโดเมน Vercel ด้วย)
- ถ้า signUp ด้วยอีเมลที่มีบัญชีอยู่แล้ว Supabase ไม่คืน error แต่คืน user ที่ `identities` ว่าง โค้ดจัดการกรณีนี้แล้ว
