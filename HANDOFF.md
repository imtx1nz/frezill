# Handoff — frezill (2026-10-04)

## เป้าหมาย
เว็บแอป (PWA) ตู้เย็นที่คนในบ้านใช้ร่วมกัน เตือนก่อนของหมดอายุ และ AI เสนอเมนูจากของในตู้ · กฎการพัฒนา: `.claude/skills/frezill-dev/SKILL.md` · สเปก UI: `docs/design/fridge-home.md` · แผนเต็ม: `PROJECT_PLAN.md`

## สถานะตอนนี้ (live: https://frezill.vercel.app, main = `19872f4` หลัง deploy perf-sheet)
- ✅ M0–M5 ขึ้น production และทดสอบด้วย Playwright + บัญชี QA แล้ว: auth (อีเมล+Google), เพิ่ม/ลด/แก้/ทิ้ง/ลบของ, FEFO, วันหมดอายุ+สถานะ, วันที่ซื้อ (`bought_on`, ว่าง = วันนี้), AI เมนู 3 อย่าง + "ทำเมนูนี้แล้ว" + จำกัด 10 ครั้ง/บ้าน/วัน
- ✅ UI ใหม่ "Fridge Home" (แนวเกม Cookie Run + แถบข้างแบบ Tinkercad + glass) ขึ้น production แล้ว (`eac617b`): แท็บ 3 อัน ตู้เย็น/ประวัติ/AI, ตู้ 2.5D มีของจริงบนชั้น, แถบวัตถุดิบ 30 อย่าง (มือถือ = bottom sheet), การ์ดรายละเอียด (hover/แตะ), ลากเข้าตู้ (มือถือกดค้าง) → ฟอร์มสั้นมีชิปวันหมดอายุ + "− n +", แมลงวันบนของ ≤3 วัน/หมดอายุ (ไม่เกิน 6 ตัว), หน้า `/history`, `/recipes` แต่งใหม่
  - ผ่าน Reviewer 1 รอบ + แก้ครบ P1–P3 + 5 ท่าจาก Glovo (ป้ายวันซ้ายบน/จำนวนขวาล่าง, ชื่อใต้ช่อง, แถวตัวเลขบนหัว, − n +, ชิปวันหมดอายุ)
  - ✅ Tester บน production (มือถือ CPU ×4): การ์ด, กดค้างลากเพิ่มของ (DB ตรง), แท็บ, hover/ลาก desktop, ไม่มี error · 🐞 แผงวัตถุดิบกระตุก (เปิด/ปิด 23 fps, เลื่อน 20 fps) → แก้ใน `19872f4` (branch `perf-sheet`): มือถือแผงเป็นกรมท่าทึบ (desktop/แท็บยังเป็น glass), ไม่ render ช่อง 30 อันใหม่ทุกครั้งที่เปิดแผง, แมลงวันหยุดตอนเปิดแผง · วัดใหม่ (build ในเครื่อง): เปิด/ปิด 51–52 fps, เลื่อน 60 fps · ประวัติพับรายวันได้ (`<details>`) · deploy แล้ว (`5762552`) ยังไม่ได้วัด FPS ซ้ำบน production
- ✅ AI: คิดเมนูจาก**ของอะไรก็ได้ในตู้** (ของใกล้หมดเป็นโบนัส ไม่บังคับ) · โมเดลสำรองเมื่อโควตาหมด
- ✅ ตารางอายุเก็บใน `lib/catalog.ts` ใช้ค่าฝั่งปลอดภัยจากตารางที่ผู้ใช้ให้ (หมูสับ 1 วัน, หมูชิ้น 3, ผักใบ 3, กะหล่ำ/แครอท 7, พริก/มะนาว 14, ไข่ 21 ไม่แช่แข็ง)

## ถัดไป
1. ดูผล Tester → ถ้ามีบั๊ก ส่ง Builder แก้ → ผู้ใช้ deploy
2. ผู้ใช้วาดรูปวัตถุดิบ 39 รูป (30 ชิ้น + 9 หมวด) ตามรายการ id ใน `lib/catalog.ts` → วางใน `public/ingredients/<id>.svg|png` (512×512 พื้นใส) → `node scripts/ingredients-manifest.mjs` → commit รูป+`lib/ingredients-manifest.json` → deploy (ไม่ต้องแก้โค้ด; ยังไม่มีรูป = สติกเกอร์ตัวหนังสือ) · คู่มือวาด: สเปก §4.5
3. แจ้งเตือน web push (ขอบเขต "ทำตอนนี้" ข้อสุดท้าย ยังไม่มีแถว milestone) — ถามผู้ใช้ก่อน
4. เมื่อมีผู้ใช้หลายบ้าน: เปิด billing ใน Google AI Studio (free tier 20 ครั้ง/วัน/โมเดล/project)

## วิธีทำงานกับผู้ใช้คนนี้
- ผู้ใช้ให้ผม (main) เป็นผู้จัดการ: แจกงานให้ agent ตามบทบาท (Designer/Builder = Opus, Reviewer/Tester = Sonnet) เสนอทีม+โมเดล+เวลา+token ก่อน
- ตอบภาษาไทย · รายงานเมื่อเสร็จเท่านั้น (ผู้ใช้ห่วง token: แชตยาว ข้อความละ ~0.2M) · ใช้ ponytail lite สำหรับงาน UI, ultra สำหรับงานอื่น
- **agent แก้ production เองไม่ได้** (auto-mode บล็อก: SQL เขียน, merge main, deploy) → ส่งคำสั่งให้ผู้ใช้รันผ่าน `!` (ต้องให้ `!` เป็นตัวแรกของข้อความ)
- deploy จาก clone สะอาดเสมอ (agent อาจกำลังแก้ไฟล์ในโฟลเดอร์หลัก):
```
! cd ~/frez-zill && git checkout main && git merge --ff-only <branch> && git push && rm -rf /tmp/fz && git worktree add -f /tmp/fz main && cp -r .vercel /tmp/fz/ && cd /tmp/fz && npx vercel deploy --prod; cd ~/frez-zill && git worktree remove --force /tmp/fz
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
