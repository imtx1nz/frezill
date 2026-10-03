---
name: frezill-dev
description: Build plan and rules for frezill, the shared-fridge web app (Supabase + Gemini + Vercel). Use when writing, changing, reviewing, or planning any frezill code or feature (auth, inventory, expiry, notifications, AI recipes, daily summary), or when picking up the next milestone.
---

# frezill — Dev Skill

frezill คือเว็บแอป (PWA) สำหรับตรวจสอบวัตถุดิบในตู้เย็น คนในบ้านใช้ตู้เย็นร่วมกันได้ แอปเตือนก่อนของหมดอายุ และ AI เสนอเมนูที่ใช้ของใกล้หมดอายุก่อน
แผนไอเดียฉบับเต็มอยู่ที่ `PROJECT_PLAN.md` (persona, user flow และตารางอายุการเก็บตัวอย่าง)

## เมื่อเริ่มงานแต่ละครั้ง
1. อ่าน `HANDOFF.md` เพื่อดูว่าตอนนี้อยู่ milestone ไหน และค้างอะไรอยู่
2. ทำ milestone ถัดไปตามตาราง [Milestones](#milestones) **ทีละ milestone** และงานจะเสร็จเมื่อเกณฑ์ในช่อง "เสร็จเมื่อ" ผ่านจริง
3. เมื่อผ่านเกณฑ์แล้ว ให้อัปเดต `HANDOFF.md`, commit ลง git ของโปรเจกต์ แล้วรายงานผู้ใช้ จากนั้นรอให้ผู้ใช้สั่งก่อนเริ่ม milestone ถัดไป

## ขอบเขต
**ทำตอนนี้**
1. สรุปรายวัน: หน้า `today` เป็นหน้าแรกหลังล็อกอิน
2. สมัครสมาชิก / เข้าสู่ระบบ: แต่ละคนมีบัญชีของตัวเอง โครงสร้างคือ ผู้ใช้ → บ้าน → ตู้เย็น
3. จัดการวัตถุดิบ: เพิ่ม ลด แก้ไข จำนวน หมวดหมู่ โซน
4. บันทึกวันหมดอายุแยกตามล็อต พร้อมเดาวันให้
5. คำนวณสถานะและแจ้งเตือนวันหมดอายุ (web push + ในแอป)
6. AI แนะนำเมนูพื้นฐาน โดยให้ของใกล้หมดอายุมาก่อน

**ไว้ทีหลัง:** What-If Filter, Fridge Capacity Meter, Parallel Dinner, Local Food Trade & Chat, Fridge Mood/Mascot
ฟีเจอร์กลุ่มนี้ทำแค่เผื่อคอลัมน์ไว้ใน schema (`fridges.capacity_liters`, `item_master.avg_volume`, `recipe_requests.filters`) โค้ดฟีเจอร์จะเริ่มเขียนเมื่อผู้ใช้สั่งเท่านั้น

## Stack (ล็อกแล้ว)
| ส่วน | ใช้ |
|---|---|
| Web | Next.js App Router + TypeScript + Tailwind ทำเป็น PWA (`app/manifest.ts`, `public/sw.js`) |
| DB / Auth | Supabase: Postgres, Auth (email+password, Google), RLS, `@supabase/ssr` |
| Push | Web Push + VAPID (`web-push`) |
| ตั้งเวลา | Supabase `pg_cron` + `pg_net` เรียก `POST /api/cron/notify` ทุก 15 นาที ป้องกันด้วย header `CRON_SECRET` (Vercel Hobby รัน cron ได้แค่วันละครั้ง) |
| AI | Gemini `@google/genai` รุ่น `gemini-2.5-flash` + `responseSchema` แล้ว validate ด้วย Zod อีกชั้น |
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
lib/ai/recipes.ts    prompt + schema + validate + fallback
supabase/migrations/*.sql
supabase/seed/{item_master,shelf_life,fallback_recipes}.sql
```
เก็บ business logic ไว้ใน `lib/` เป็น pure function ที่เทสได้ ส่วน component และ route เรียกใช้ logic จาก `lib/` อีกที

## Database
- `profiles` (id = auth.uid, display_name, easy_mode, diet_prefs jsonb)
- `households` (name, timezone default `Asia/Bangkok`, invite_code, invite_expires_at)
- `memberships` (user_id, household_id, role `owner` | `member` | `viewer`)
- `fridges` (household_id, name, capacity_liters null)
- `categories`, `item_master` (name, aliases, category_id, default_unit, default_zone, avg_volume null)
- `shelf_life_rules` (item_master_id | category_id, zone, opened bool, days)
- `items` (fridge_id, item_master_id | custom_name, category_id, zone `freezer` | `chill` | `veg` | `door`)
- `lots` (item_id, qty, unit, purchased_at, expires_at, expiry_type `EXP` | `BBE`, expiry_source `user` | `guessed`, opened_at, price null, status)
- `usage_logs` (lot_id, user_id, action `use` | `finish` | `discard`, qty, reason)
- `notification_settings`, `push_subscriptions`, `notification_log`
- `recipe_requests` (household_id, input_hash, filters jsonb, output jsonb, cooked)

## กฎ

### ความปลอดภัย
- เปิด RLS **ทุกตาราง** ใน migration เดียวกับที่สร้างตาราง โดย policy ใช้ helper `is_member(household_id)` ร่วมกัน: `viewer` อ่านได้อย่างเดียว ส่วน `member` และ `owner` เขียนได้
- ใช้ `SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, VAPID private key และ `CRON_SECRET` เฉพาะฝั่ง server เท่านั้น ฝั่ง client มีได้แค่ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_*`
- invite code ต้องมีวันหมดอายุ และ owner ยกเลิกได้
- ลบบัญชีแล้วต้องลบข้อมูลของผู้ใช้จริง (PDPA)

### เวลาและวันหมดอายุ
- คำนวณ "วันนี้" จาก `households.timezone` ทุกครั้ง ทั้งฝั่ง server และ cron
- สถานะ: `safe` (> 3 วัน) / `soon` (1–3 วัน) / `today` (0) / `expired` (< 0) ตัวเลข 3 วันเป็นค่าเริ่มต้นที่ปรับได้ตามหมวด
- ลำดับการเดาวันหมดอายุ: `item_master` × zone → category × zone เมื่อเดาแล้วตั้ง `expiry_source = 'guessed'` และ UI แสดงป้าย "≈ เดา"
- ถ้าเปิดใช้แล้ว วันหมดอายุที่ใช้ = ค่าที่น้อยกว่าระหว่าง (วันตามฉลาก) กับ (opened_at + อายุหลังเปิด)
- ถ้าเป็น `BBE` ที่เลยวันแล้ว ให้แสดง "ตรวจสภาพก่อนกิน" ส่วน `EXP` ที่เลยวันแล้วแสดงเป็นหมดอายุ

### วัตถุดิบ
- ของชนิดเดียวกันที่ซื้อต่างวันกันต้องเป็น **lot แยกกัน**
- ทุกการลดจำนวนตัดแบบ **FEFO** (ล็อตที่หมดอายุเร็วที่สุดก่อน) และเขียน `usage_logs` ทุกครั้ง
- การกระทำหลักต้องเสร็จภายใน 3 แตะ ได้แก่ −1 / ใช้ไปครึ่งหนึ่ง / หมดแล้ว / ทิ้ง (ถามเหตุผลแบบไม่บังคับ)
- ตอนเพิ่มของที่ยังมีอยู่ในตู้ ให้เตือนในแอปทันที (เช่น "ยังมีไข่ไก่ 4 ฟอง หมด 5 ต.ค.")

### แจ้งเตือน
- ส่งสรุปรวม **วันละครั้ง** ตามเวลาที่ผู้ใช้ตั้ง (ค่าเริ่มต้น 16:30) โดยรวมของทุกชิ้นไว้ในข้อความเดียว
- ข้ามการส่งเมื่อไม่มีของ `soon` / `today` / `expired` หรือเมื่ออยู่ในช่วงห้ามรบกวน (ค่าเริ่มต้น 21:00–07:00)
- บันทึกทุกการส่งลง `notification_log` แล้วเช็กก่อนส่งทุกครั้งเพื่อกันส่งซ้ำ
- ถ้า push ได้ error 404 หรือ 410 ให้ลบ subscription นั้น แล้วแสดงในแอปให้ผู้ใช้เปิดแจ้งเตือนใหม่
- ผู้ใช้ iPhone ต้องติดตั้ง PWA ก่อนจึงรับ push ได้ จึงต้องมีหน้าคู่มือทีละขั้นที่ตรวจสถานะการติดตั้งให้ด้วย

### AI เมนู
- ส่งให้ Gemini เฉพาะ **ชื่อวัตถุดิบที่ยังไม่หมดอายุ** + ป้าย `urgent` (≤ 3 วัน) + pantry + ความต้องการด้านอาหาร ข้อมูลส่วนตัวของผู้ใช้อยู่ฝั่ง server
- output: 3 เมนู แต่ละเมนูมี name, uses_urgent[], ingredients[{name, qty}], missing[] (ไม่เกิน 2), minutes, difficulty, steps[]
- validate ด้วย Zod ถ้าไม่ผ่านให้ลองใหม่ 1 ครั้ง ถ้ายังไม่ผ่านใช้ `fallback_recipes` แทน
- วัตถุดิบที่ไม่มีในตู้และไม่อยู่ใน pantry ต้องย้ายไปไว้ใน `missing`
- cache ผลด้วย `input_hash` ภายในวันเดียวกัน และจำกัดบ้านละ 10 ครั้งต่อวัน
- ปุ่ม "ทำเมนูนี้แล้ว" ตัดของออกจากตู้แบบ FEFO โดยให้ผู้ใช้ยืนยันหรือแก้ปริมาณก่อน
- ทุกการ์ดเมนูต้องแสดง "เมนูนี้แนะนำโดย AI โปรดตรวจสภาพวัตถุดิบก่อนปรุง"

### UI
- โหลด skill `impeccable` ก่อนสร้างหรือแก้หน้าจอ
- สไตล์ Illustrative + **2.5D** parallax ใช้ CSS 3D transforms + เลเยอร์ SVG/PNG (ไม่ใช้ WebGL)
- Mobile-first, ฟอนต์ไทย (IBM Plex Sans Thai หรือ Anuphan) ขนาดอย่างน้อย 16px (โหมดง่าย ≥ 20px), ปุ่มกดได้ ≥ 44px, คอนทราสต์ WCAG AA
- สีบอกสถานะต้องมีไอคอนหรือข้อความกำกับเสมอ
- รองรับ `prefers-reduced-motion` โดยปิดเอฟเฟกต์ และเครื่องช้าก็ต้องลื่น
- มาตรฐานคุณภาพคือระดับผลงาน portfolio ทดสอบบนมือถือจริงก่อนบอกว่าเสร็จ

### เอกสาร
- แผนและเอกสารเขียนว่า **จะสร้างอะไร** ไม่ต้องมีหัวข้อ "ปัญหา"

## Milestones
| M | งาน | เสร็จเมื่อ |
|---|---|---|
| M0 | scaffold Next.js + Tailwind + Supabase client, `.env.example`, `git init`, deploy Vercel เปล่าๆ | ลิงก์ Vercel เปิดได้ |
| M1 | Auth + สร้างบ้านและตู้อัตโนมัติตอนสมัคร + เชิญด้วยลิงก์/รหัส + บทบาท + RLS | 2 บัญชีใช้ตู้เดียวกันได้ และเทส RLS ยืนยันว่าบ้านอื่นอ่านข้อมูลไม่ได้ |
| M2 | schema วัตถุดิบ + seed `item_master`/`shelf_life` + เพิ่ม/ลด/แก้ไข + FEFO + filter/ค้นหา | เพิ่มของ 10 อย่างได้ใน 2 นาที และ unit test ของ FEFO ผ่าน |
| M3 | EXP/BBE, เดาวัน, เปิดแล้ว, สถานะ/สี + หน้า `today` | unit test ของ `lib/expiry.ts` ผ่านทุกกรณีขอบ (ข้ามเที่ยงคืน, timezone, opened) |
| M4 | PWA + push subscribe + cron notify + ตั้งค่า + คู่มือ iPhone + เตือนของซ้ำ | ได้ push จริงบน Android และ iPhone |
| M5 | AI เมนู Gemini + validate + cache + rate limit + fallback + "ทำเมนูนี้แล้ว" | ได้ 3 เมนูที่ใช้ของ urgent และไม่มีวัตถุดิบที่ไม่มีอยู่จริงในตู้ |
| M6 | ขัด UI 2.5D + โหมดง่าย + accessibility + Playwright flow หลัก + deploy production | เทสทั้งหมดผ่าน, Lighthouse PWA/A11y ผ่าน และลิงก์ production ใช้ได้บนมือถือ |

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
