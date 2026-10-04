# Glovo UI notes for frezill (secondary influence)

Researcher · 2026-10-04 · Input to the frezill dev skill. The primary direction stays `fridge-home.md` (game-UI: outlines, candy bevels, navy panels). Glovo supplies clarity, card anatomy, flow and copy tone, not its look.

## 1. Sources (all real images, read by eye)
- **Apple App Store**, "Glovo: Food & Grocery Delivery": https://apps.apple.com/us/app/glovo-food-grocery-delivery/id951812684. There are 8 marketing screenshots (H1-2025/H1-2026 "Organics" set, 1242×2688), saved at 600px as `as-1.jpg` … `as-8.jpg`, plus the grocery screen at full size as `big-6.jpg` and a close crop of it as `crop-grocery.jpg`.
- **Google Play**, `com.glovo`: https://play.google.com/store/apps/details?id=com.glovo&hl=en. This is the same 8-screen set in a 9:16 crop, saved as `gp-1.jpg` … `gp-8.jpg`.
- Contact sheets: `sheetA.jpg`, `sheetB.jpg` and `sheetGP.jpg`.
- Folder: `/tmp/claude-1000/-home-ct/009a9a48-296e-4a50-9e4a-15e701b4a43d/scratchpad/glovo/`
- Screens seen: store-list cards, "Delivery free" promo, Prime perks, restaurant menu (Smash Paradise), feedback form, grocery store with "Shop by category", live order tracking, and restaurant home with a category rail and filter chips.
- **Not visible in any screenshot:** the bottom nav, empty states, loading states and motion. Points about those below are marked *(memory)*.
- Hex values are sampled from the pixels. Sizes are converted to pt from the framed phone (≈2.4 px/pt in the full-size crop), so treat them as ±2.

## 2. What Glovo does well
**Home/store structure.** Top to bottom: a full-bleed photo header; a white sheet that overlaps it with about 24pt top corners; the store logo tile overlapping the seam; the name (bold, about 28pt); 1–2 deal chips; a 3–4 item **stat row**; a search pill; and then content sections. Each section is a bold heading plus a "→" circle button on the right ("Order again →", "Best in your city →").

**Category tiles** ("Shop by category"): a 4-column grid with about 80pt square tiles, radius about 16, and a **flat warm-cream fill (#FFF4DE)**. Each tile holds one cut-out product object that nearly fills it and overlaps its edges. The label sits **below** the tile, centred, regular weight, 2 lines max, about 14pt. On the restaurant home, categories become a horizontal rail of round icons (about 56pt) with a label under each ("Offers, Healthy, Asian, Burger…"). The first one is "Offers", shown active with a yellow ring.

**Card anatomy (store card).** Photo about 16:9 with radius about 12. Top-left: a yellow discount chip "-20%" welded to a white chip "in some items". Bottom-right: a white rating pill (thumb icon + "98%" bold + "(435)" grey). Bottom-left: the logo tile (about 40pt, radius 10) overlapping the photo. Under the photo: the name (bold, about 17pt) left and a category tag (grey, small) right on the same baseline, then "15–25 min" (regular, grey). Each card has exactly **one bold line**.

**Menu row.** The photo (about 80pt, radius 8) sits on the left. Next to it: the name (medium) and price (right, regular), then 2–3 lines of grey description. A small green "+" sits at the bottom-right. Once added, the row turns into "1x" plus a "− / +" stepper in place, so there is no modal.

**Typography.** One rounded geometric sans throughout. Only 2 weights do the work: **bold** for names, headings and numbers, and regular for everything else. Headings are about 20pt and store names about 28pt. Secondary text is mid-grey, never lighter. Numbers are bold and short ("98%", "20-30'", "2 minutes left").

**Color roles.**
- Yellow (#FFC244 brand; #FFCE68 on the bg) is the **brand stage** behind the phone and the "deal" chip fill. It is never used as a big UI fill inside the app.
- Green (#00A082 to #00A794) is **only the primary CTA** (Submit, Order 3, Try Prime for free), positive state (on-time progress bar, active thumb-up) and the "+" add. Text on green is white.
- Purple (#5A47DE) is reserved for Prime and nothing else.
- Neutrals: white sheets, #F5F5F5 search and input wells, and cream #FFF4DE tile wells.

**Spacing rhythm.** The gutter is about 16pt, the grid gaps are about 12pt, and there are about 24–32pt between sections. Sections are separated by whitespace and headings, not by dividers. Inside lists, the only separator is a thin hairline between menu rows.

**Iconography and illustration.** UI icons are simple 2pt-stroke line icons inside soft tinted circles (about 32pt): green for the thumb, cream for the timer, purple for Prime. Perks use small **3D-ish object illustrations** (scooter, tag, piggy jar) in yellow and blue, about 48pt, on the right of each row. Real food is always a **cut-out photo** on cream, never photo-in-a-box clutter. The map pin and courier bike are flat, chunky and outlined.

**Feedback flow.** The form asks **one question** ("How was Smash Paradise?") with a picture of the order. Quick-pick reason chips come first ("Good quality", "Delicious" in yellow when selected, "Handled with care" grey when not). Thumb up/down per item comes next, then an optional text box with a green hint ("Mention taste, size, quality, etc..."), and one full-width green Submit.

**Status screen (tracking).** A small "On time" green chip sits above a big bold "2 minutes left", then a thick progress bar (about 6pt, rounded, green on light grey). Under it is a human line with an avatar ("Moussa is arriving with your order") and a chat button. The map is below.

**Scannability of a busy catalog.** It comes from repetition: every card has the same slots in the same corners. Image does the identifying, one bold line names it, and grey carries the rest. Deals live in chips at fixed corners. Filters are a single row of pill chips ("Offers ×", "Cuisines ⌄", "Sort by ⌄", "Prime"), and the active one is yellow with a ×.

**Bottom nav** *(memory)*: 3–4 tabs with line icons and small labels, white bar, active tab tinted. It isn't distinctive, and frezill's navy tab bar already beats it.

**Empty/loading/motion** *(memory)*: grey skeleton blocks in card shapes, and friendly object illustrations on empty states with one action. Add-to-cart animates the count; it does not show a toast.

## 3. Steal list (each one fits the game-UI grammar)
1. **Home header stat row.** Under the greeting, show 3 stats as outlined round icon badges with a bold number below ("ต้องรีบใช้ 3", "สัปดาห์นี้ 5", "ทั้งหมด 24"). They replace any sentence summary, and tapping one spotlights those items.
2. **Side-bar tile = Glovo category tile.** Use a flat `--cream` square well with a 3px outline and the sticker filling about 85% of it, allowed to overlap the top edge by 4px. Put the label **below** the tile in white `tag`, 2 lines max, centred. Never put the label on the picture.
3. **Side-bar category rail.** Above the grid, make one horizontal row of round outlined category icons at 48px with labels under them. The first one is "ใกล้หมด" (like Glovo's "Offers"), and the active one gets a `--wall` ring instead of a dropdown when there are 6 or fewer categories.
4. **Fixed badge corners on every item picture.** Expiry badge top-left, quantity bottom-right, nothing else. Keep the same corners on the fridge, side bar, History and AI so the eye learns them once.
5. **Details card = Glovo store header in miniature.** Picture, then the name (Mitr), then 1–2 sticker chips (zone, "≈ เดา"), then the status row, with one candy button at the bottom. Keep exactly one bold line plus the stat number.
6. **Add sheet: in-place stepper.** The qty field starts as a single green "+" candy circle. After the first tap it expands into "− 1 +" in the same spot, like Glovo's "+" turning into "1x − +". No separate qty screen.
7. **Add sheet: quick-pick chips before inputs.** Expiry is offered as chips ("3 วัน", "1 สัปดาห์", "≈ เดา 21 วัน" preselected) with the date field as the fallback, the way Glovo's feedback puts reason chips before the text box.
8. **History section headers.** Use the day heading (Mitr 500) with its summary at the right, plus a "→" round outlined button only when there is a deeper page. Separate days with whitespace, not dividers.
9. **History "7 วันนี้" card as a tracking bar.** Show a thick (8px) rounded progress bar of ใช้ทัน vs ทิ้ง, green on `--ice`, with the 3px outline, plus one bold human headline ("ใช้ทัน 12 จาก 14 ชิ้น").
10. **AI recipe card anatomy = Glovo store card.** The picture cluster is the "photo". Put a top-left urgent chip ("ใช้ของใกล้หมด 2") and a bottom-right time pill ("15 นาที") as fixed corners, then the name as the one bold line and grey meta under it.
11. **AI "ทำเมนูนี้แล้ว" feedback** uses Glovo's one-question pattern: "ทำ{เมนู}แล้วใช่ไหม" with a picture, quick qty chips per ingredient, and one green Submit.
12. **Copy voice.** Use one short human line under a status, with a person when it's household data: "น้อยเพิ่งใส่ไข่ 10 ฟอง", like "Moussa is arriving". Numbers are bold, and the words around them stay regular.

## 4. Don't copy
- Glovo's **flat, borderless, shadowless** cards and white sheets: in frezill every card keeps the outline and plinth, or it reads as a generic delivery app.
- **Cut-out stock photos** of food: frezill uses only `IngredientPicture` stickers (spec rule 2).
- **White-on-green buttons** and Glovo teal #00A082: frezill buttons are candy bevels with `--outline` text.
- **Yellow deal chips and yellow-as-selected** inside content: yellow is the wall in frezill, so a yellow chip on cream reads as a warning (spec rule 5). Use the wall colour only as an active-tab or active-rail ring.
- Purple accent, full-bleed photo headers, promo/marketing hero ("DELIVERY FREE"), rating pills, "Order again" upsell rails.
- The grey `#F5F5F5` search pill: on navy panels use `--panel-well`.
- The mixed 3D-ish perk illustrations: they add a second illustration style.
- A plain white bottom nav with grey inactive icons.

## 5. Proposed UI rules (paste into the frezill dev skill)
- Every repeated item (fridge item, side-bar tile, history row, recipe card) uses the **same slot layout**: picture first, expiry badge top-left, qty bottom-right, one bold name line, grey meta under it.
- **One bold line per card or row.** Everything else is regular weight; numbers may be bold.
- Category and ingredient tiles are a flat `--cream` square well with the outline. The sticker fills about 85% and the label sits **below** the tile, never on the picture.
- Summaries are **stat rows** (round outlined icon badge + bold number + short label), not sentences.
- Offer **quick-pick chips before free inputs** (expiry, qty, discard reason); the typed field is the fallback.
- Increment in place: "+" becomes "− n +" where it stands. Never open a new screen or modal just to set a quantity.
- Sections are a heading + optional round "→" button, separated by 24–32px of space, not dividers.
- One primary candy-green action per screen or sheet, full width at the bottom.
- Status copy is one human Thai line, naming a person when it's household data ("น้อยเพิ่งใช้หมูสับ"). Never use system phrasing.
- Use progress bars (8px, rounded, outlined) for ratios like ใช้ทัน vs ทิ้ง, not pie charts.
- Glovo is a reference for structure and flow only. Never import its flat borderless cards, photos, teal, purple or yellow-on-content chips.
- Loading is skeletons in the exact shape of the final card (opacity pulse), and empty states are one sticker + one line + one candy button.
