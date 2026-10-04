# Handoff — frezill (2026-10-04)

## เป้าหมาย
เว็บแอป (PWA) ตู้เย็นที่คนในบ้านใช้ร่วมกัน เตือนก่อนของหมดอายุ และ AI เสนอเมนูจากของในตู้ · กฎการพัฒนา: `.claude/skills/frezill-dev/SKILL.md` · สเปก UI: `docs/design/fridge-home.md` · แผนเต็ม: `PROJECT_PLAN.md`

## สถานะตอนนี้ (live: https://frezill.vercel.app, main = `69b808b`)
- ✅ M0–M5 ขึ้น production และทดสอบด้วย Playwright + บัญชี QA แล้ว: auth (อีเมล+Google), เพิ่ม/ลด/แก้/ทิ้ง/ลบของ, FEFO, วันหมดอายุ+สถานะ, วันที่ซื้อ (`bought_on`, ว่าง = วันนี้), AI เมนู 3 อย่าง + "ทำเมนูนี้แล้ว" + จำกัด 10 ครั้ง/บ้าน/วัน
- ✅ UI ใหม่ "Fridge Home" (แนวเกม Cookie Run + แถบข้างแบบ Tinkercad + glass) ขึ้น production แล้ว (`eac617b`): แท็บ 3 อัน ตู้เย็น/ประวัติ/AI, ตู้ 2.5D มีของจริงบนชั้น, แถบวัตถุดิบ 30 อย่าง (มือถือ = bottom sheet), การ์ดรายละเอียด (hover/แตะ), ลากเข้าตู้ (มือถือกดค้าง) → ฟอร์มสั้นมีชิปวันหมดอายุ + "− n +", แมลงวันบนของ ≤3 วัน/หมดอายุ (ไม่เกิน 6 ตัว), หน้า `/history`, `/recipes` แต่งใหม่
  - ผ่าน Reviewer 1 รอบ + แก้ครบ P1–P3 + 5 ท่าจาก Glovo (ป้ายวันซ้ายบน/จำนวนขวาล่าง, ชื่อใต้ช่อง, แถวตัวเลขบนหัว, − n +, ชิปวันหมดอายุ)
  - ✅ Tester บน production (มือถือ CPU ×4): การ์ด, กดค้างลากเพิ่มของ (DB ตรง), แท็บ, hover/ลาก desktop, ไม่มี error · 🐞 แผงวัตถุดิบกระตุก (เปิด/ปิด 23 fps, เลื่อน 20 fps) → แก้ใน `19872f4` (branch `perf-sheet`): มือถือแผงเป็นกรมท่าทึบ (desktop/แท็บยังเป็น glass), ไม่ render ช่อง 30 อันใหม่ทุกครั้งที่เปิดแผง, แมลงวันหยุดตอนเปิดแผง · วัดใหม่ (build ในเครื่อง): เปิด/ปิด 51–52 fps, เลื่อน 60 fps · ประวัติพับรายวันได้ (`<details>`) · deploy แล้ว (`5762552`) ยังไม่ได้วัด FPS ซ้ำบน production
- ✅ ปุ่ม "+ กำหนดเอง" (ช่องแรกในแถบ) + หมวด "ของฉัน" (ดึงจากชื่อใน lots ที่ไม่ตรง catalog) + "+ เพิ่ม "<คำค้น>" เอง" (`c84e61e`)
- ✅ รูปวัตถุดิบ: Microsoft Fluent Emoji **Flat** SVG (MIT, เครดิตใน `public/ingredients/CREDITS.md`) ครบ 39 ไฟล์ · หมูสับ = รูปหมู, กะหล่ำ = รูปผักใบ, เต้าหู้ = รูปเนยเปลี่ยนสีเป็นขาว (ทำเอง) · ผู้ใช้วาดเองแล้ววางทับชื่อไฟล์เดิมได้ (ดู `public/ingredients/README.txt`)
- ✅ ของในตู้: ไม่มีกรอบ เหลือรูปลอย+เงา, จำนวนมาก = รูปซ้อนเป็นกอง (`lib/icon-count.ts`: ชิ้น ≤5, น้ำหนัก/ปริมาตร 1–3) · ลากลงชั้น: ไฮไลต์เขียว/แดง, ของเดิมเด้งหลบ, ชั้นเต็ม = สั่น+ลอยกลับแถบ+"ชั้นนี้เต็มแล้ว" · คำเตือนวางไม่เหมาะ (`lib/placement.ts`) ไม่บล็อก · ชั้นไม่ถูกจำ (รีเฟรชแล้วจัดตามหมวด) แต่โซนจำ · **ยังไม่ได้ลองลากเด้ง/ชั้นเต็มในเบราว์เซอร์จริง**
- ✅ ล็อกชื่อของมาตรฐาน 30 อย่าง (ฟอร์ม+หน้าแก้ไข+กันที่ server, `isLockedName`) + กฎใน skill ห้ามเปลี่ยน id/ชื่อ (`97f29d1`)
- ✅ การ์ดเมนู AI ละเอียดขึ้น (`d11f88e`): วัตถุดิบมีรูป+ปริมาณตัวหนา (รวมของในครัว), ขั้นตอนเป็น `{text, action, heat?, minutes?}` มีไอคอน `public/steps/*.svg` (Fluent Flat) + ชิปไฟ/เวลา · สตริงขั้นตอนแบบเก่ายังรับได้ · **ยังไม่ได้ลองกับ Gemini จริง** (โควตาหมดวันนั้น)
- 🗒️ ข้อมูล: ของในตู้ผู้ใช้ชื่อ "ไส้กรอกห" (พิมพ์ผิด) → ผู้ใช้แก้เองในหน้าแก้ไข
- ✅ เมนู ≡ (หน้าแรกมือถือ + แถบบน desktop: ชื่อ/บ้าน, การตั้งค่า, ดูเป็นรายการ, **ออกจากระบบสีแดงล่างสุด**) + หน้า `/settings` (สวิตช์อีเมล, เตือนล่วงหน้า 1/2/3 วัน, ส่งเมลทดสอบ 5 นาที/ครั้ง) + cron `0 1 * * *` (08:00 ไทย) `app/api/cron/notify` (ต้อง `Authorization: Bearer $CRON_SECRET`) · migration 0005 รันแล้ว · merge main แล้ว (`69b808b`) — **ยังไม่แน่ใจว่าผู้ใช้ deploy แล้วหรือยัง** (เช็ก `npx vercel ls frezill --prod`) · ยังไม่ได้ดูหน้าจอจริง/ส่งเมลจริง · ไม่มี env อีเมล = หน้าตั้งค่าขึ้น "ยังไม่ได้ตั้งค่าระบบอีเมล" (ไม่มีปุ่มตาย)
  - ไฟล์: `lib/notify.ts` (เลือกของ + สร้างหัวเรื่อง/HTML, มีเทส), `lib/supabase/admin.ts` (service role, server only), `app/(app)/settings/*`, `components/shell/Menu.tsx`, `supabase/migrations/0005_notify_settings.sql`
- 🚧 **ผู้ใช้เปลี่ยนใจ: ส่งเมลด้วย Gmail App Password แทน Brevo** (ยังไม่ได้เริ่ม) → งานถัดไปข้อ 1
- 🚧 branch `sheet-rb` (แผงวัตถุดิบบนมือถือเหลือ 75%: peek 196→147px, ขยาย 70→52dvh, 3→4 คอลัมน์, ช่อง 84→63px, ตัวหนังสือ 12px, desktop ไม่เปลี่ยน) · test 84 + tsc ผ่าน · build กำลังรันตอนเขียนไฟล์นี้ · ยังไม่ได้ push แน่ชัด → เช็ก `git ls-remote origin sheet-rb` ถ้าไม่มี ให้ใช้ `origin/sheet-75` แล้ว rebase บน main · ต้อง rebase บน main ก่อน merge (main มี commit handoff นี้เพิ่ม)

## ถัดไป
1. **เปลี่ยนจาก Brevo เป็น Gmail SMTP (App Password):** ใช้ `nodemailer` (เพิ่ม dep ได้) หรือ SMTP ตรง · env ใหม่: `GMAIL_USER`, `GMAIL_APP_PASSWORD` (16 ตัว ไม่มีช่องว่าง, trim) · `MAIL_FROM` ไม่บังคับ (ค่าเริ่มต้น = `frezill <GMAIL_USER>`) · ลบโค้ด/ข้อความ Brevo ออก, ซ่อนส่วนอีเมลถ้าไม่มี env · ทำใน worktree แยก + Builder Sonnet ponytail lite · เทส `lib/notify.ts` เดิมยังใช้ได้
   - ผู้ใช้ทำ: Google Account → Security → เปิด 2-Step Verification → App passwords → สร้าง "frezill" → ได้รหัส 16 ตัว → `npx vercel env add GMAIL_USER production`, `npx vercel env add GMAIL_APP_PASSWORD production`, `npx vercel env add SUPABASE_SERVICE_ROLE_KEY production` (Supabase → Settings → API → service_role), `openssl rand -hex 32 | npx vercel env add CRON_SECRET production` → deploy → ≡ → การตั้งค่า → ส่งอีเมลทดสอบ
   - Gmail ส่งได้ ~500 ฉบับ/วัน, เมลอาจเข้า spam ครั้งแรก
2. rebase+deploy `sheet-rb` (ด้านบน)
3. ส่ง Tester (Sonnet) ลองบน production: ลากเด้ง/ชั้นเต็ม/คำเตือน, ล็อกชื่อ, การ์ดเมนูใหม่ (ถ้าโควตา AI เหลือ), เมนู ≡ + ตั้งค่า + ส่งเมลทดสอบ, แผง 75% + วัด FPS มือถือซ้ำ
4. แจ้งเตือน web push — ถามผู้ใช้ก่อน (อาจไม่จำเป็นแล้วเพราะมีอีเมล)
5. เมื่อมีผู้ใช้หลายบ้าน: เปิด billing Google AI Studio

## วิธีทำงานกับผู้ใช้คนนี้
- ผู้ใช้ให้ผม (main) เป็นผู้จัดการ: แจกงานให้ agent ตามบทบาท (Designer/Builder = Opus, Reviewer/Tester = Sonnet) เสนอทีม+โมเดล+เวลา+token ก่อน
- ตอบภาษาไทย · รายงานเมื่อเสร็จเท่านั้น (ผู้ใช้ห่วง token: แชตยาว ข้อความละ ~0.2M) · ใช้ ponytail lite สำหรับงาน UI, ultra สำหรับงานอื่น
- **agent แก้ production เองไม่ได้** (auto-mode บล็อก: SQL เขียน, merge main, deploy) → ส่งคำสั่งให้ผู้ใช้รันผ่าน `!` (ต้องให้ `!` เป็นตัวแรกของข้อความ)
- **agent แต่ละตัวต้องใช้ worktree ของตัวเอง** (เคยชนกันเพราะสองตัวใช้โฟลเดอร์หลักพร้อมกัน) · ผู้ใช้รันคำสั่งในเทอร์มินัลปกติ (Ctrl+Alt+T) ดีกว่า `!` เพราะแป้นไทยทำให้มี "ั" ติดหน้า `!`
- ผู้ใช้อยากให้ Claude deploy เอง แต่ auto-mode บล็อกการแก้ settings และสร้างสคริปต์ deploy → ผู้ใช้ต้องเพิ่มเองผ่าน `/permissions` (Allow, Project local): `Bash(npx vercel deploy --prod)`, `Bash(git merge --ff-only:*)`, `Bash(git push:*)` — ยังไม่ยืนยันว่าเพิ่มแล้ว
- build ใน worktree: ห้าม symlink node_modules (Turbopack พัง) ใช้ `cp -al /home/ct/frez-zill/node_modules node_modules` (hardlink เร็ว) · ไม่มี .env ใช้ dummy `NEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=x`
- agent ชอบทิ้งลูปรอ/โปรเซสค้าง (build ค้าง load ~10) (เช่น `until … pgrep -f "next build"` ที่ match ตัวเอง วนไม่จบ) → เช็ก `pgrep -af next` หลังงานเสร็จ
- deploy จาก clone สะอาดเสมอ (agent อาจกำลังแก้ไฟล์ในโฟลเดอร์หลัก):
```
! cd ~/frez-zill && git checkout main && git pull --ff-only && git merge --ff-only origin/<branch> && git push && rm -rf /tmp/fz && git worktree add -f /tmp/fz main && cp -r .vercel /tmp/fz/ && cd /tmp/fz && npx vercel deploy --prod; cd ~/frez-zill && git worktree remove --force /tmp/fz
```
- migration: `! cd ~/frez-zill && npx supabase db query --linked --project-ref wlprvlbdohsjjljrggpk -f supabase/migrations/<file>` · agent รัน SQL แบบอ่านอย่างเดียวได้ด้วยคำสั่งเดียวกัน + `"<select>"`

## ไฟล์สำคัญ
- `components/home/*` (FridgeHome, Fridge, SideBar, DetailsCard, AddDialog, Flies, status) · `components/shell/TabBar.tsx` · `components/IngredientPicture.tsx` (svg → png → cat-* → สติกเกอร์ตัวหนังสือ, อ่าน `lib/ingredients-manifest.json` กัน 404)
- `lib/catalog.ts` (30 วัตถุดิบ: id, ชื่อ, alias, หมวด, หน่วย, โซน, อายุเก็บ; `guessExpiry`) · `lib/history.ts` (รวมแถว lot+action เดียวกันใน 10 นาที) · `lib/home.ts`
- `app/(app)/fridge/actions.ts` (เพิ่ม/แก้/ลบ/ทิ้ง/`consume`/`cookMenu`/`addLotFromHome`, FEFO ผ่าน `deduct`) · `lib/inventory.ts` (`fefo`, zod) · `lib/expiry.ts`
- `lib/ai/recipes.ts` (prompt, Zod, `normalize`/`fitQty` แปลงหน่วย, `suggestMenus` คืน `{menus}|{error:"quota"|"busy"}`) · `app/(app)/recipes/actions.ts` (นับ `recipe_requests` เฉพาะเมื่อสำเร็จ)
- `supabase/migrations/0001–0004` (รันบน prod ครบแล้ว) · `vercel.json` (region `icn1` ใกล้ DB โซล)
- `docs/design/fridge-home.md` (สเปก UI) · `docs/design/glovo-notes.md` · `docs/design/ref-style.jpg`, `ref-sidebar.jpg`

## วิธีรัน
```bash
npm run dev        # สร้าง manifest รูปด้วย
npm test           # Vitest 68 เทส
npx tsc --noEmit && npm run lint && npm run build
```
- QA: บัญชี `frezill.qa.*@gmail.com` (รหัสอยู่ใน scratchpad ของ session ก่อน — ถ้าหาย สมัครใหม่ผ่าน `/auth/v1/signup` ได้ เพราะ Supabase ยืนยันอีเมลอัตโนมัติ) · playwright-core + chromium ที่ `~/.cache/ms-playwright/chromium_headless_shell-1243/` · ล็อกอินด้วยการกด Enter ในช่องรหัส (ปุ่มที่มีคำว่า "เข้าสู่ระบบ" ตัวแรกคือ Google)

## Gotchas & การตัดสินใจ
- Next 16: middleware = `proxy.ts`; `PageProps`/`LayoutProps` มาจาก `next typegen` · อ่าน `node_modules/next/dist/docs/` ก่อนเขียน (AGENTS.md)
- `vercel deploy` อัปโหลดไฟล์ในโฟลเดอร์ ไม่ใช่จาก git → ใช้ worktree สะอาด (ด้านบน) · ยังไม่ได้ต่อ GitHub auto-deploy
- Gemini: key ต้องมาจาก project ของ **Gmail ส่วนตัว** (บัญชีโรงเรียน = 403) · key รูปแบบใหม่ขึ้นต้น `AQ.` ใช้ได้ · ค่าใน Vercel เคยมี `\r` → โค้ด `.trim()` เสมอ · `gemini-2.5-*` = 404 · ปิด thinking (`minimal`) ไม่งั้นช้า ~21 วิ · ลำดับ: `gemini-3.8-flash` → `gemini-flash-lite-latest` → `gemini-3.1-flash-lite-preview` → `gemini-3-flash-preview`
- บัญชี QA ใช้โควตา AI ของวันที่ 2026-10-04 ครบแล้ว
- ล็อตที่ใช้หมด = `qty 0` (ไม่ลบ เพื่อให้ usage_logs ผูกอยู่) · ตัดหลายล็อตไม่มี transaction (สองคนกดพร้อมกันอาจเพี้ยน)
- branch `m1-invites` (ระบบเชิญ/หลายบ้าน) พักไว้ มี `0002_*` ชนกับ main ต้องเปลี่ยนเป็น `0005_*` ก่อนใช้
- เล็กน้อยที่รู้แล้ว: แก้ล็อตที่ `/item` แล้ว `expiry_guessed` กลายเป็น false · วันซื้ออนาคตที่หลุดถึง server ขึ้น error กลาง ๆ · ตู้ desktop กว้าง 440px · ชั้นละ 3 ชิ้น (มือถือ)/5 ชิ้น (desktop) เกิน = +N
- Supabase Auth → URL Configuration ต้องมีโดเมน Vercel ใน Redirect URLs

## คำถามค้างถึงผู้ใช้
- จะทำ web push เป็น M6 ไหม
- ป้ายบนชั้นและแท็บใช้ตัว 14px (ต่ำกว่ากฎ 16px) โอเคไหม
- 2026-10-04 (branch custom-ingredient): ปุ่ม "+ กำหนดเอง" ในแถบวัตถุดิบ (กดหรือลากลงตู้ หรือกด +) เปิดฟอร์มกำหนดเอง (ชื่อ/หมวด/หน่วย/โซน/วันหมดอายุเดาจากหมวด) พร้อมหมวด "ของฉัน" จาก lots เดิมและปุ่ม "+ เพิ่ม ... เอง" ในผลค้นหา; ไม่มี migration
- 2026-10-04 (branch fridge-items): ของในตู้เหลือแค่รูปลอย (ไม่มีกรอบ/พื้นหลัง) มีเงาใต้รูป และจำนวนมากขึ้นแสดงเป็นกองไอคอนซ้อนกันสูงสุด 5 ใบ (`lib/icon-count.ts`); ไอเท็มที่ยังไม่มีรูปใช้ป้ายชื่อทรงแคปซูลแทน; แถบข้าง/การ์ด/ประวัติยังใช้สติกเกอร์เดิม
- 2026-10-04 (branch recipe-details): การ์ดเมนู AI มีปริมาณ+หน่วยทุกวัตถุดิบ และขั้นตอนเป็น object {text, action, heat?, minutes?} พร้อมไอคอน (public/steps); ขั้นตอนแบบสตริงเก่ายังรับได้; ไม่มี migration
