---
name: frezill-dev
description: Build plan and rules for frezill, the shared-fridge web app (Supabase + Gemini + Vercel). Use when writing, changing, reviewing, or planning any frezill code or feature (auth, inventory, expiry, notifications, AI recipes, daily summary), or when picking up the next milestone.
---

# frezill — Dev Skill

frezill คือเว็บแอป (PWA) สำหรับตรวจสอบวัตถุดิบในตู้เย็น คนในบ้านใช้ตู้เย็นร่วมกันได้ แอปเตือนก่อนของหมดอายุ และ AI เสนอเมนูที่ใช้ของใกล้หมดอายุก่อน
แผนไอเดียฉบับเต็มอยู่ที่ `PROJECT_PLAN.md` (persona, user flow และตารางอายุการเก็บตัวอย่าง)

## เมื่อเริ่มงานแต่ละครั้ง
1. อ่าน `HANDOFF.md` เพื่อดูว่าตอนนี้อยู่ milestone ไหน และค้างอะไรอยู่
2. โหลด skill `ponytail` (ระดับ full) แล้วทำ milestone ถัดไปตามตาราง [Milestones](#milestones) **1 milestone ต่อ 1 session** งานจะเสร็จเมื่อเกณฑ์ในช่อง "เสร็จเมื่อ" ผ่านจริงบน production
3. ก่อนบอกว่าเสร็จ ให้กดทุกปุ่มที่เพิ่งทำบน URL production (ฟีเจอร์ที่ยังตั้งค่าไม่ครบต้องซ่อนไว้)
4. เมื่อผ่านเกณฑ์แล้ว ให้อัปเดต `HANDOFF.md` (บันทึก token และเวลาที่ใช้จริงด้วย), commit, push, deploy แล้วรายงานผู้ใช้ จากนั้นบอกให้ผู้ใช้เปิด **session ใหม่** สำหรับ milestone ถัดไป

### ประหยัด token
- โหลด `impeccable` เฉพาะใน M2 และ M6 ส่วน M อื่นให้ใช้ token และคอมโพเนนต์ที่มีอยู่แล้วใน `app/globals.css` และ `components/`
- ถ่ายภาพหน้าจอ **1 รอบต่อ M** ตอนจบ (ถ่ายมือถือกับ desktop พร้อมกัน) ระหว่างทางให้เช็กด้วย `curl`/`grep`/เทส
- รวมคำสั่งที่ไม่ขึ้นต่อกันไว้ใน Bash ครั้งเดียว และอ่านเฉพาะส่วนของไฟล์ที่ต้องใช้

## ขอบเขต
**ทำตอนนี้**
1. สรุปรายวัน: หน้า `today` เป็นหน้าแรกหลังล็อกอิน
2. สมัครสมาชิก / เข้าสู่ระบบ: แต่ละคนมีบัญชีของตัวเอง โครงสร้างคือ ผู้ใช้ → บ้าน → ตู้เย็น
3. จัดการวัตถุดิบ: เพิ่ม ลด แก้ไข จำนวน หมวดหมู่ โซน
4. บันทึกวันหมดอายุแยกตามล็อต พร้อมเดาวันให้
5. คำนวณสถานะและแจ้งเตือนวันหมดอายุ (web push + ในแอป)
6. AI แนะนำเมนูพื้นฐาน โดยให้ของใกล้หมดอายุมาก่อน

**ตัดออกแล้ว (ผู้ใช้ตัดสินใจ 2026-10-04):** ภาพตู้เย็น 2.5D ในแอป (เหลือแค่หน้า login), การแยก EXP/BBE และวันที่เปิด (เก็บวันหมดอายุเดียว), โหมดง่าย (เหลือบทบาท "ดูอย่างเดียว")

**ไว้ทีหลัง:** What-If Filter, Fridge Capacity Meter, Parallel Dinner, Local Food Trade & Chat, Fridge Mood/Mascot
ฟีเจอร์กลุ่มนี้ห้ามเขียนโค้ด และห้ามเผื่อคอลัมน์ล่วงหน้า (YAGNI) ยกเว้น `fridges.capacity_liters` ที่มีอยู่แล้ว

## Stack (ล็อกแล้ว)
| ส่วน | ใช้ |
|---|---|
| Web | Next.js App Router + TypeScript + Tailwind ทำเป็น PWA (`app/manifest.ts`, `public/sw.js`) |
| DB / Auth | Supabase: Postgres, Auth (email+password, Google), RLS, `@supabase/ssr` |
| Push | Web Push + VAPID (`web-push`) |
| ตั้งเวลา | **Vercel Cron วันละครั้ง** `30 9 * * *` (UTC = 16:30 เวลาไทย) เรียก `GET /api/cron/notify` ป้องกันด้วย header `Authorization: Bearer $CRON_SECRET` |
| AI | Gemini REST ผ่าน `fetch` (ไม่ใช้ SDK) รุ่น `gemini-2.5-flash` + `responseSchema` แล้ว validate ด้วย Zod อีกชั้น |
| Validation | Zod (schema เดียวกันใช้ทั้งฟอร์มและ API) |
| วันที่ | `date-fns` + `date-fns-tz` |
| Test | Vitest (logic) + Playwright (flow) |
| Deploy | Vercel + Supabase cloud |

ถ้าจะเปลี่ยน stack หรือเพิ่ม dependency ตัวใหญ่ ต้องถามผู้ใช้ก่อน

## โครงสร้างโปรเจกต์
```
app/(auth)/{login,signup,forgot-password,auth/callback}
app/(app)/{today,fridge,fridge/add,item/[id],recipes,household,settings}
app/join/[code]
app/api/{cron/notify,push/subscribe,recipes}
lib/supabase/{server,client,middleware}.ts
lib/expiry.ts        สถานะ + เดาวันหมดอายุ (pure function)
lib/inventory.ts     ตัดของแบบ FEFO (pure function)
lib/notify.ts        สร้างข้อความสรุป + ส่ง push
lib/ai/recipes.ts    prompt + schema + validate
supabase/migrations/*.sql
lib/catalog.ts       รายชื่อของตั้งต้น ~60 รายการ + ตารางอายุการเก็บ (หมวด × โซน → วัน) ใช้กับ <datalist>
```
เก็บ business logic ไว้ใน `lib/` เป็น pure function ที่เทสได้ ส่วน component และ route เรียกใช้ logic จาก `lib/` อีกที

## Database
- `profiles` (id = auth.uid, display_name, easy_mode, diet_prefs jsonb)
- `households` (name, timezone default `Asia/Bangkok`, invite_code, invite_expires_at)
- `memberships` (user_id, household_id, role `owner` | `member` | `viewer`)
- `fridges` (household_id, name, capacity_liters null)
- `lots` **ตารางเดียวสำหรับวัตถุดิบ** (fridge_id, name, category check-constraint, zone `freezer` | `chill`, qty, unit, expires_at date, expiry_guessed bool, created_by, created_at) ของชื่อเดียวกันหลายแถว = หลายล็อต
- `usage_logs` (lot_id, user_id, action `use` | `finish` | `discard`, qty, reason)
- `push_subscriptions` (user_id, endpoint, keys)
- `recipe_requests` (household_id, created_at) ใช้นับ rate limit อย่างเดียว

## กฎ

### ความปลอดภัย
- เปิด RLS **ทุกตาราง** ใน migration เดียวกับที่สร้างตาราง โดย policy ใช้ helper `is_member(household_id)` ร่วมกัน: `viewer` อ่านได้อย่างเดียว ส่วน `member` และ `owner` เขียนได้
- ใช้ `SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, VAPID private key และ `CRON_SECRET` เฉพาะฝั่ง server เท่านั้น ฝั่ง client มีได้แค่ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_*`
- invite code ต้องมีวันหมดอายุ และ owner ยกเลิกได้
- ลบบัญชีแล้วต้องลบข้อมูลของผู้ใช้จริง (PDPA)

### เวลาและวันหมดอายุ
- คำนวณ "วันนี้" จาก `households.timezone` ทุกครั้ง ทั้งฝั่ง server และ cron
- สถานะ: `safe` (> 3 วัน) / `soon` (1–3 วัน) / `today` (0) / `expired` (< 0) ตัวเลข 3 วันเป็นค่าเริ่มต้นที่ปรับได้ตามหมวด
- เดาวันหมดอายุจาก `lib/catalog.ts` (หมวด × โซน) แล้วตั้ง `expiry_guessed = true` และ UI แสดงป้าย "≈ เดา"

### วัตถุดิบ
- ของชนิดเดียวกันที่ซื้อต่างวันกันต้องเป็น **lot แยกกัน**
- ทุกการลดจำนวนตัดแบบ **FEFO** (ล็อตที่หมดอายุเร็วที่สุดก่อน) และเขียน `usage_logs` ทุกครั้ง
- การกระทำหลักต้องเสร็จภายใน 3 แตะ ได้แก่ −1 / ใช้ไปครึ่งหนึ่ง / หมดแล้ว / ทิ้ง (ถามเหตุผลแบบไม่บังคับ)
- ตอนเพิ่มของที่ยังมีอยู่ในตู้ ให้เตือนในแอปทันที (เช่น "ยังมีไข่ไก่ 4 ฟอง หมด 5 ต.ค.")

### แจ้งเตือน
- ส่งสรุปรวม **วันละครั้ง ตอน 16:30** (เวลาเดียวกันทุกคน) โดยรวมของทุกชิ้นไว้ในข้อความเดียว
- ข้ามการส่งเมื่อไม่มีของ `soon` / `today` / `expired`
- ถ้า push ได้ error 404 หรือ 410 ให้ลบ subscription นั้น แล้วแสดงในแอปให้ผู้ใช้เปิดแจ้งเตือนใหม่
- ผู้ใช้ iPhone ต้องติดตั้ง PWA ก่อนจึงรับ push ได้ จึงต้องมีหน้าคู่มือทีละขั้นที่ตรวจสถานะการติดตั้งให้ด้วย

### AI เมนู
- ส่งให้ Gemini เฉพาะ **ชื่อวัตถุดิบที่ยังไม่หมดอายุ** + ป้าย `urgent` (≤ 3 วัน) + pantry + ความต้องการด้านอาหาร ข้อมูลส่วนตัวของผู้ใช้อยู่ฝั่ง server
- output: 3 เมนู แต่ละเมนูมี name, uses_urgent[], ingredients[{name, qty}], missing[] (ไม่เกิน 2), minutes, difficulty, steps[]
- validate ด้วย Zod ถ้าไม่ผ่านให้ลองใหม่ 1 ครั้ง ถ้ายังไม่ผ่านให้แสดง "AI ไม่ว่าง ลองใหม่อีกครั้ง"
- วัตถุดิบที่ไม่มีในตู้และไม่อยู่ใน pantry ต้องย้ายไปไว้ใน `missing`
- จำกัดบ้านละ 10 ครั้งต่อวัน (นับจาก `recipe_requests`)
- ปุ่ม "ทำเมนูนี้แล้ว" ตัดของออกจากตู้แบบ FEFO โดยให้ผู้ใช้ยืนยันหรือแก้ปริมาณก่อน
- ทุกการ์ดเมนูต้องแสดง "เมนูนี้แนะนำโดย AI โปรดตรวจสภาพวัตถุดิบก่อนปรุง"

### UI
- โหลด skill `impeccable` ก่อนสร้างหรือแก้หน้าจอ
- ภาพ 2.5D มีแค่หน้า login (`components/auth/FridgeScene.tsx`) หน้าในแอปเป็นรายการที่สะอาดและอ่านง่าย
- Mobile-first, ฟอนต์ไทย (IBM Plex Sans Thai หรือ Anuphan) ขนาดอย่างน้อย 16px, ปุ่มกดได้ ≥ 44px, คอนทราสต์ WCAG AA
- สีบอกสถานะต้องมีไอคอนหรือข้อความกำกับเสมอ
- รองรับ `prefers-reduced-motion` โดยปิดเอฟเฟกต์ และเครื่องช้าก็ต้องลื่น
- มาตรฐานคุณภาพคือระดับผลงาน portfolio ทดสอบบนมือถือจริงก่อนบอกว่าเสร็จ

### เอกสาร
- แผนและเอกสารเขียนว่า **จะสร้างอะไร** ไม่ต้องมีหัวข้อ "ปัญหา"

## Milestones (แผนพื้นฐาน + ponytail ultra, ตัดสินใจ 2026-10-04)
ทำเฉพาะสิ่งที่โจทย์ 6 ข้อบังคับ ระบบเชิญ/บทบาท/หลายบ้านเก็บไว้ที่ branch `m1-invites` (ยังไม่ merge) ส่วน web push, PWA, cron, M6 ไม่ทำ

| Session | M | งาน | เสร็จเมื่อ |
|---|---|---|---|
| — | M0+M1 | scaffold, deploy, สมัคร/ล็อกอิน (อีเมล + Google) | ✅ เสร็จแล้ว |
| 1 | M2 | ตาราง `lots` + RLS, เพิ่ม/ลด/แก้ไข/ลบ, จำนวน, หน่วย, หมวดหมู่, ตัดแบบ FEFO | เพิ่ม ลด แก้ไข ได้บน production และเทส FEFO ผ่าน |
| 2 | M3+M4 | ช่องวันหมดอายุ (`<input type="date">`), `lib/expiry.ts` สถานะ/สี, หน้า `today` = สรุปรายวัน + แถบเตือนใกล้หมด/หมดแล้วในแอป | เทส `expiry.ts` ผ่าน และหน้า today แสดงของเรียงตามวันหมดอายุพร้อมคำเตือน |
| 3 | M5 | AI เมนู Gemini (fetch + Zod) ใช้ของใกล้หมดก่อน | ได้ 3 เมนูจากของในตู้จริงบน production |

## งานที่ผู้ใช้ต้องทำเอง
การสมัครบัญชีภายนอกเป็นงานของผู้ใช้ เมื่อถึงขั้นนั้นให้ใช้ skill `wizard` บอกทีละขั้น:
1. สร้างโปรเจกต์ Supabase → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (เปิด Google provider ถ้าต้องการ)
2. สร้าง Gemini API key ที่ Google AI Studio → `GEMINI_API_KEY`
3. สมัคร Vercel + เชื่อม GitHub repo

ส่วนที่ agent ทำเองได้: gen VAPID keys (`npx web-push generate-vapid-keys`) และ `CRON_SECRET`

## Verification
- `npm run test` (Vitest): expiry, FEFO, การ validate output ของ AI
- เทส RLS: ใช้ user A query ข้อมูลบ้านของ B แล้วต้องได้ผลว่าง
- Playwright: สมัคร → เพิ่มของ → เห็นในหน้า today → ขอเมนู → ทำเมนูนี้แล้ว → จำนวนในตู้ลดลง
- `curl -X POST /api/cron/notify` พร้อม `CRON_SECRET` → ได้ push จริงบนมือถือ
