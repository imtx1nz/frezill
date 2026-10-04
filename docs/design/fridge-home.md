# Fridge Home: design spec (`/today`)

Owner: Designer · Builder implements · Status: ready to build · 2026-10-04 (rev 2: game-UI style from `ref-style.jpg`, side bar from `ref-sidebar.jpg`)
Scope: the app shell (3 tabs), Fridge Home (`/today`), History (`/history`, new), the AI restyle (`/recipes`) and the ingredient-picture system that all of them use. `/fridge`, `/item/[id]` and `/fridge/add` keep their layouts. They get the tokens (§2), pictures (§4) and the tab bar (§3.0).

## 1. Concept

**"Open the fridge on a sunny kitchen wall, drawn like a mobile game."** The home page *is* the fridge: a white, rounded, slightly 2.5D fridge stands open against a confident egg-yolk wall (`--wall`). The UI around it speaks casual-game (user reference `ref-style.jpg`, a Cookie Run: Kingdom resource sheet: "แนวนี้นะ"): every shape and icon carries a **thick dark outline**, buttons are **candy-bright bevel pills** with a top highlight and a darker bottom lip that presses down, status and counts sit in **round outlined badges**, ingredients are **outlined stickers**, and containers are **deep-navy rounded panels with a light inner rim**. The fridge stays white with the same outline, so it reads as the hero "game object" on the yellow board. Stars and ribbons appear only as rewards (all-clear, "ไม่มีของเสียมา N วัน"), never as decoration.
The ingredient **side bar** copies the structure of Tinkercad's shape panel (`ref-sidebar.jpg`: "bar แบบนี้"): a navy panel docked on the right on desktop (a bottom sheet on phones), a header row with a category dropdown and search, and a scrolling grid of big square sticker tiles you drag onto the fridge. Long-press drags; tap shows details. Food that is going off announces itself three ways: a number badge with an icon, a colour and one or two tiny flies circling it. The tone is warm and a little cheeky about leftovers. It never scolds. **No Cookie Run or Tinkercad assets, logos, characters or icon art are copied**; only the visual grammar (outline, bevel, panel, grid) is borrowed.

**Anti-slop rules for this page (each one is a hard rule):**
1. No gradients except the fridge interior's light falloff (§2). Bevels are built from flat fills plus inset shadows (§2.6), never `linear-gradient`. No purple, no blue-to-pink, no gradient text.
2. No emoji anywhere: not as icons, not as ingredient pictures and not in copy. Icons come from `lucide-react` at `stroke-width: 2.5`, and in badges they sit inside an outlined circle. Every ingredient, everywhere, is shown through the single `IngredientPicture` component in §4: the user's own drawings, or until those exist, an outlined category sticker. No stock photos, no AI-generated images and no second illustration style.
3. One container material: the navy panel (§2.5) for the side bar, the mobile sheet and the tab bar. Cards, the form and the details card are cream/white with the dark outline. No glass, no backdrop blur.
4. There is no hero, no "3 feature cards" and no centred marketing stack. The first thing on screen is the household's own fridge, holding its real items.
5. Each colour has a single job. Yolk means "wall/brand moment", green means "fresh/primary action", mustard means "this week" and red means "now". Never use yellow for warnings, because the wall is yellow. Warnings are mustard ink on cream.
6. Don't use more than 2 font families or more than 3 type weights on screen.
7. No drop shadow may be bigger than the ones in §2. No glow effects and no neon. Outlines are always `--outline` at the widths in §2.4; never mix outline colours.
8. Copy is short, in Thai and in a human voice: "ต้องรีบใช้", not "Items requiring attention".
9. Accents (star, ribbon) appear at most once per screen, and only for a reward moment.

## 2. Tokens

### 2.1 Palette (light mode; add to `:root` in `app/globals.css`)
Keep every existing token and add these:

| Token | Hex | Role | Contrast checked |
|---|---|---|---|
| `--wall` | `#FFD23F` | Today page background (the "kitchen wall"), the Glovo cue | ink on it 11.7:1 |
| `--wall-ink` | `#3D2F00` | Secondary text placed directly on the wall | 9.1:1 on wall |
| `--cab` | `#F6FBF8` | Fridge body and door | — |
| `--cab-in-top` / `--cab-in-bot` | `#E3F1EA` / `#D2E7DC` | Interior vertical light falloff (gradient #1 of 2) | ink 13:1 on bot |
| `--freezer` | `#C7E2F0` | Freezer compartment fill | `--freezer-ink` 6.4:1 |
| `--freezer-ink` | `#24506A` | Freezer label text | |
| `--shelf` | `#FFFFFF` | Shelf lips and door-bin rims | — |
| `--week-ink` | `#6B5000` | Text for ≤ 7 days ("dark mustard") | 7.6:1 on white, 6.9:1 on `--week-soft` |
| `--week-soft` | `#FFF4CC` | Background of the ≤ 7-day badge and chip | |
| `--week-line` | `#F0D27A` | 1px ring around week badges | |
| `--urgent-ink` | `#B42318` (= `--danger`) | Text for ≤ 3 days and "today" | 6.6:1 on white, 5.8:1 on soft |
| `--urgent-soft` | `#FDECEA` (= `--danger-soft`) | Background of the ≤ 3-day badge | |
| `--expired` | `#8F1A10` | **Filled** expired badge, with white text | 9.0:1 |
| `--outline` | `#1B1F3B` | The one outline colour: shapes, icons, stickers, buttons, fridge | 11.1:1 on wall, 16.1:1 on white |
| `--panel` | `#22305E` | Navy panel fill (side bar, mobile sheet, tab bar) | white 12.7:1, `--wall` 8.8:1 |
| `--panel-rim` | `#4A5C9E` | 2px inner border of the panel | decorative |
| `--panel-well` | `#18224A` | Recessed well inside a panel (search field, dropdown) | white 15:1 |
| `--cream` | `#FFF7E6` | Card, details card, form and tile face | outline 15.1:1 |
| `--candy-green` / `--candy-green-lip` | `#4CC764` / `#2A8A43` | Primary button face / its bottom lip | `--outline` text 7.4:1 |
| `--candy-blue` / `--candy-blue-lip` | `#7CC8FF` / `#3B86C9` | Secondary button (ดูเป็นรายการ, ยกเลิก) | `--outline` text 8.9:1 |
| `--candy-red` / `--candy-red-lip` | `#FF7A6B` / `#C8402F` | Destructive button (ทิ้ง) | `--outline` text 6.3:1 |
| `--star` | `#FFC21A` | Reward accent only (rule 9) | outline 9.9:1 |

Global fix: change `--soon` from `#A77B06` to `#6B5000`. The old value is 3.6:1 on `--soon-soft`, which fails AA. This also fixes `ExpiryBadge` on the other pages.
Don't use green text on the wall (3.7:1, which fails). On the wall, text is `--ink` or `--wall-ink` only.
Button text is always `--outline` on candy faces, never white (white on `--candy-green` is 2.2:1). The brand green `#0b7a5c` stays for links and the `--brand-ink` status text.

**Dark mode: deferred, on purpose.** The use scene is a daytime kitchen (PRODUCT.md), and the app ships light only. Don't add `prefers-color-scheme` rules. Set `<meta name="color-scheme" content="light">` so Android doesn't force-darken the ingredient pictures.

### 2.2 Fonts (Google Fonts via `next/font/google` in `app/layout.tsx`)
- **Display: Mitr** at weights 500 and 600, subsets thai and latin, variable `--font-mitr`. Its chunky, rounded, friendly strokes are the Glovo "bold friendly type" cue, and it is not Kanit or Prompt. Use it only for the greeting, the summary numbers, card titles and the form title.
- **Body: Anuphan** (already loaded) at 400, 500 and 600. Use it for everything else.
- Tailwind: add `--font-display: var(--font-mitr), var(--font-anuphan), sans-serif;` inside `@theme inline`.

### 2.3 Type scale (rem; the body is 16px)
| Name | Mobile | Desktop | Font/weight | Use |
|---|---|---|---|---|
| display | 1.75 / lh 1.15 | 2.25 / 1.1 | Mitr 600, tracking −0.01em | "สวัสดี น้อย" |
| title | 1.25 / 1.3 | 1.375 | Mitr 500 | Card and form titles, item name in the details card |
| stat | 1.5 / 1 | 1.75 | Mitr 600, tabular-nums | Day number in the details card |
| body | 1 / 1.6 | 1 | Anuphan 400/500 | Everything |
| meta | 0.9375 / 1.5 | same | Anuphan 500 | Secondary lines |
| tag | 0.875 / 1.2 | same | Anuphan 600 | Shelf stickers, badges, chips. **This is the only text below 16px.** It is a label, never a sentence (an approved exception to the 16px rule). |

### 2.4 Radii, spacing and shadows
- Radii: `--r-fridge: 32px` (cabinet), `--r-card: 20px` (cards, details card, form sheet top), `--r-tile: 18px` (side-bar tiles), `--r-btn: 16px`, chips and badges are `999px`, shelf lips `6px`.
- **Outline widths** (`--ow-*`, always `--outline`, solid): `--ow-lg: 4px` (fridge cabinet, navy panels, dialogs), `--ow-md: 3px` (buttons, cards, tiles, stickers ≥ 56), `--ow-sm: 2px` (badges, chips, stickers at 48, the details-card caret). Draw it with `border`, or `box-shadow: 0 0 0 var(--ow)` where a border would shift layout. Lucide icons use `stroke-width: 2.5` in `--outline` (or white on navy).
- Spacing is a 4px base. The page gutter is 16px on mobile and 32px on desktop. Use a 12px gap inside cards and 8px between chips.
- Shadows (all ink-tinted, never black):
  - `--sh-card: 0 1px 0 rgb(18 32 26 / .05), 0 12px 28px -12px rgb(18 32 26 / .28)`
  - `--sh-lift: 0 20px 32px -12px rgb(18 32 26 / .38)` (dragged ghost, open details card)
  - `--sh-fridge: 0 30px 60px -20px rgb(4 40 30 / .45)` (from `FridgeScene`)
  - `--sh-item: 0 3px 0 -1px rgb(18 32 26 / .18)` (the contact shadow under an item on its shelf)

### 2.5 Navy panel recipe (side bar, mobile sheet, tab bar)
```css
.panel {
  background: var(--panel);
  border: var(--ow-lg) solid var(--outline);           /* outer dark outline */
  border-radius: 24px;
  box-shadow:
    inset 0 0 0 2px var(--panel-rim),                   /* the light inner border */
    inset 0 3px 0 2px rgb(255 255 255 / .08),           /* faint top sheen */
    0 6px 0 var(--outline);                             /* chunky drop "plinth", no blur */
  color: #fff;
}
.panel-well { background: var(--panel-well); border-radius: 14px; box-shadow: inset 0 2px 0 rgb(0 0 0 / .25); }
```
Contrast guarantee: text on the panel is white (12.7:1) or `--wall` for the active state (8.8:1); tile labels sit on `--cream` faces (15.1:1). The panel is opaque, so nothing behind it can lower contrast. No blur anywhere.

### 2.6 Candy bevel recipe (buttons, active tab, category dropdown)
```css
.btn-candy {
  --face: var(--candy-green); --lip: var(--candy-green-lip);
  background: var(--face); color: var(--outline);
  font: 600 1.0625rem/1 var(--font-display);
  min-height: 48px; padding: 0 20px; border-radius: 999px;
  border: var(--ow-md) solid var(--outline);
  box-shadow:
    inset 0 -4px 0 var(--lip),                          /* bottom lip, inside the outline */
    inset 0 3px 0 rgb(255 255 255 / .55),               /* top highlight */
    0 3px 0 var(--outline);                             /* outer plinth = press depth */
  transition: transform 80ms var(--ease-out);
}
.btn-candy:active { transform: translateY(3px); box-shadow: inset 0 -1px 0 var(--lip), inset 0 2px 0 rgb(255 255 255 / .45), 0 0 0 var(--outline); }
```
Press is a `translateY(3px)` (transform only); the shadow swap is a discrete state change, never transitioned. The highlight can also be a 40%-wide white pill pseudo-element at the top-left (opacity .5) for the glossy look. Variants swap `--face/--lip` only. Disabled: `--face: #D9D6CE; --lip: #B5B1A6`, no plinth, plus the word state on the label.

### 2.7 Badges and sticker chips
- **Round badge icon:** a circle (22px in the fridge, 28px in cards) filled with the state colour, `--ow-sm` outline, a 12–16px lucide icon centred. Count text sits beside it in a pill that shares the outline (e.g. `[◷| 5]`).
- **Sticker chip** (summary chips, filter chips, shelf stickers): `--cream` fill, `--ow-sm` outline, pill, `0 2px 0 var(--outline)` plinth, `tag` or meta text in `--outline` or the state ink. Pressed (`aria-pressed`): `--panel` fill, white text, no plinth, `translateY(2px)`.

## 3. Layout

### 3.0 App shell: 3 tabs (`app/(app)/layout.tsx`, `components/shell/TabBar.tsx`)
| Tab | Route | lucide icon | Label |
|---|---|---|---|
| 1 Fridge | `/today` (also active on `/fridge`, `/fridge/add`, `/item/*`) | Refrigerator | ตู้เย็น |
| 2 History | `/history` | History | ประวัติ |
| 3 AI | `/recipes` | ChefHat | เมนู AI |
- The AI tab renders only when `GEMINI_API_KEY` is set (no dead buttons). With the key unset, the bar has 2 tabs.
- **Mobile tab bar:** `fixed bottom-0`, 64px + `env(safe-area-inset-bottom)`, a `.panel` (§2.5) with only the top corners rounded (24px) and the outline on the top edge only. Each tab is a full-height link, a 24px white icon inside a 56×32 pill, and a label in `tag` text, white (12.7:1). Active: the pill becomes a small candy bevel (§2.6) with `--face: var(--wall)`, `--lip: #C99A00`, an `--outline` icon, and the label turns `--wall` 600 (8.8:1), plus `aria-current="page"`. Inactive: white icon and label at full opacity (no dimmed greys on navy).
- **Desktop (≥ 1024):** a 64px top bar replaces the tab bar. LogoMark + "frezill" (Mitr 600) on the left; the 3 tabs as 44px pills in the centre (same active style, with icon + label in one row); "ออกจากระบบ" on the right. The background is transparent over the page (the wall on Home, `--ice` elsewhere).
- **Where the old pages live now:** `/fridge` (the full list with −1/ครึ่ง/หมด) and `/item/[id]` (edit) are sub-pages of the Fridge tab. They are reached from Home through the header's list button ("ดูเป็นรายการ"), the "ดูของทั้งหมด ›" link, the `+N` overflow chips and "จัดการ ›" in the details card. Their `PageHeader` back button now goes to `/today`. Sign-out moves out of the Home header into the desktop top bar, and on mobile into a "ออกจากระบบ" link at the bottom of `/fridge`.

### 3.1 Mobile, 390 × 844 (designed first)
```
┌──────────────── wall (#FFD23F) ────────────────┐
│ สวัสดี น้อย                          [≡ list]   │  header 16px gutter, icon button 44×44 white r16
│ บ้านนายดี · อา. 4 ต.ค.                          │  meta, --wall-ink
│ (! 2 ต้องรีบใช้) (◷ 3 ภายในสัปดาห์)              │  summary chips (3.5)
│ ┌── fridge (open, door strip right) ───┬────┐   │
│ │ ช่องแช่แข็ง  −18°      [pic][pic]     │bin │   │  freezer 22% of the interior height
│ │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│ ▭▭ │   │
│ │ [pic][pic][pic][+2]   top shelf      │bin │   │
│ │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│ ▭▭ │   │
│ │ [pic][pic]            middle shelf   │bin │   │
│ │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│ ▭▭ │   │
│ │ [pic][pic]            bottom shelf   │    │   │
│ │╭ crisper drawer ─────────────────────╮│    │   │
│ │╰ [pic][pic][pic]                     ╯│    │   │
│ └──────────────────────────────────────┴────┘   │
│ ต้องใช้ก่อน (urgent text list, max 5)  ›ดูทั้งหมด │  scrolls under the sheet
╭──────────── navy side-bar sheet (peek) ────────╮
│            ▬▬ grabber (drag up = expand)        │
│ [ทั้งหมด ▾]  [⌕ ค้นหาของ           ]             │  header row 48px (§3.7)
│ [tile][tile][tile][tile] ↓ (expanded: 3-col grid) │  peek shows 1 row of 80px tiles
├──────────── tab bar (navy panel) ───────────────┤
│   [ตู้เย็น]        ประวัติ        เมนู AI          │  64px + safe area (§3.0)
└─────────────────────────────────────────────────┘
```
- The page is `min-h-dvh` with a `--wall` background. Inner column: `max-w-xl`, 16px gutter.
- Fridge box: full column width (358px). Height = `clamp(400px, 100dvh − header(~150) − sheet peek(156) − tabbar(64 + safe area) − 24px, 600px)`, so on an 844px phone the whole fridge is visible above the sheet. The cabinet gets a `--ow-lg` `--outline` border; shelf lips, bins and the drawer get `--ow-sm`.
- The fridge is front-facing. Cabinet `--cab`, padding 10px, `--r-fridge`, `--sh-fridge`, with a static `transform: rotateX(2deg)` inside `perspective: 1200px` for the 2.5D feel. **No rotateY on mobile** (it wastes width).
- Interior: `linear-gradient(var(--cab-in-top), var(--cab-in-bot))`, radius 22px, `inset 0 8px 24px -8px rgb(4 40 30/.25)` (as in `FridgeScene`), plus one static top light: a `radial-gradient(60% 30% at 50% 0, rgb(255 255 255 /.7), transparent)` overlay.
- Door strip: a 64px column on the right, separated by a 2px `--shelf` line, holding 3 bins. Each bin is a white rim 10px tall at its bottom, with 48px pictures standing in it (the door strip widens to 64px to fit them).
- Shelves: the lip is a 6px white bar with `0 2px 4px rgb(4 40 30/.15)`. Items stand on the lip, aligned to the bottom, with an 8px gap.
- Crisper drawer: a 70px box with a `rgb(255 255 255/.55)` fill, a 1px white border and a 14px radius. Items show from the waist up and are clipped by the drawer's top edge with `overflow:hidden` plus `padding-top`.
- Side bar: on mobile it is the bottom sheet described in §3.7. Page bottom padding = sheet peek + tab bar.
- "ต้องใช้ก่อน" list: a `--cream` card (`--r-card`, `--ow-md` outline, `0 4px 0 var(--outline)` plinth) below the fridge, with a 48px picture at the start of each row and the existing `ExpiryBadge`. It shows only the ≤ 3-day and expired items (max 5) plus "ดูของทั้งหมด ›" (/fridge). Hide the card if it would be empty.

### 3.2 Desktop, 1280 × 800
```
wall ─────────────────────────────────────────────────────────────────
│ 32px │ left col 340px          │ fridge 520×700        │❮│ side bar 340px │
│      │ สวัสดี น้อย (display)    │ 2.5D: rotateY(-8deg)  │ │ navy, docked   │
│      │ meta                    │ door open on the left │ │ right, sticky  │
│      │ summary chips           │ (150px, rotateY 55deg)│ │ [ทั้งหมด ▾][⌕] │
│      │ AI card (if key)        │                       │ │ 3-col grid of  │
│      │ ต้องใช้ก่อน list          │                       │ │ 96px tiles     │
│      │ nav links               │                       │ │ (scroll inside)│
```
- Grid: `grid-cols-[340px_1fr_auto]` (the side bar column is 340px open, 28px collapsed), gap 40px, max width 1280, centred. The fridge column centres the fridge.
- Fridge: 520 × 700 interior, `rotateY(-8deg) rotateX(3deg)`, perspective 1400px. The door hangs open on the **left**, 150px wide, `rotateY(55deg)`, `origin-right`, so the side bar on the right faces the shelves. The door holds 3 bins for drink and sauce.
- The side bar is specified in §3.7.
- The left column replaces the header and the scrolling list from mobile. It holds one text link with an icon, "ดูเป็นรายการ ›" → /fridge. The tabs live in the top bar (§3.0), and the page grid starts below it.
- Breakpoints: `< 1024` uses the mobile layout (fridge centred, max 480 wide). `≥ 1024` uses the 3-column layout.

### 3.3 Where lots go (deterministic; group same name+unit into one item)
| Zone / category | Placement |
|---|---|
| `freezer` (any category) | Freezer compartment |
| chill + `dairy_egg`, `other` | Top shelf |
| chill + `cooked` | Middle shelf |
| chill + `meat`, `seafood` | Bottom shelf (coldest) |
| chill + `veg`, `fruit` | Crisper drawer |
| chill + `drink`, `sauce` | Door bins (fill top bin first) |

- Inside each place, sort with `byExpiry`, so the most urgent item sits on the left, nearest the front.
- Capacity: on mobile, each shelf, the freezer and the drawer hold 4 items and each bin holds 1. On desktop, places hold 6 and bins hold 2. Overflow becomes a `+N` chip: 44 × 44, white, `tag` text, linking to `/fridge`.
- A grouped item shows a qty pip only when it has more than 1 lot (the lot count, e.g. "2"). Badge status comes from its soonest lot.
- **Viewer role:** render the fridge and the details cards, but **hide the side bar** and the add buttons (no dead buttons).

### 3.4 Items in the fridge
- Each item is an `IngredientPicture` (§4) at 48px on mobile and 56px on desktop. It stands on its shelf with a contact-shadow ellipse below it (`--sh-item`).
- **Shelf sticker** (only when the picture is a real image file, because the text block already shows the name): a sticker chip (§2.7) under the picture with the name in `tag` text, truncated by the §4.4 rule, max width = picture width + 12px.
- **Status badge** (§2.7 round badge: a 22px outlined circle with the icon, joined to a count pill sharing the `--ow-sm` outline; top-right of the picture, overlapping by −6px):
  - > 7 days or no date: no badge (calm).
  - 4–7 days: `--week-soft` bg, `--week-ink` text (dark mustard, 6.9:1). Clock icon 12px + "N".
  - 0–3 days: `--urgent-soft` bg, `--urgent-ink`. TriangleAlert 12px + "N" ("0" shows as "วันนี้").
  - Expired (stronger): filled `--expired` with white text, the outline goes to `--ow-md`, and the badge sits 2px larger. TriangleAlert + "หมด".
- A grouped item with more than 1 lot gets a `--cream` outlined count pip at the bottom-left showing the number of lots.

### 3.5 Header and the daily summary
- Greeting `display`: "สวัสดี {name}". Meta line: `{household} · {thaiDate(today)}` in `--wall-ink`.
- Summary chips (sticker chips §2.7, 44px tall, meta 15px/600):
  - `!` "ต้องรีบใช้ N" (count of expired + 0–3 days) with `--urgent-ink` text and a TriangleAlert icon
  - `◷` "ภายในสัปดาห์ N" (4–7 days) with `--week-ink` text and a Clock icon
  - All clear (0 + 0): a single chip "ตู้นี้สดทั้งหมด" with `--brand-ink` text and a CircleCheck icon.
- Tapping a chip **spotlights** that group: other items go to opacity .3 (200ms) and the chip turns pressed (`aria-pressed`, ink bg, white text). Tap again to clear.
- AI card (only if `GEMINI_API_KEY` is set and the urgent count is > 0): a white card with a ChefHat icon in `--brand-soft`: "มีของต้องรีบใช้ N อย่าง" / "ให้ AI คิดเมนูจากของพวกนี้ ›" → /recipes. On mobile it sits between the chips and the fridge, max 64px tall. On desktop it is in the left column.
- The old `role="alert"` banner is replaced by these chips. Keep the `reset` Notice.

### 3.6 Empty fridge
The middle shelf shows a dashed 2px `--brand` outline box (r16) with the text "ลากของจากแถบขวามาวางในตู้" (desktop) or "กดค้างที่ของด้านล่างแล้วลากมาใส่" (mobile), plus a small ArrowDown or ArrowRight icon pointing at the side bar. Viewers see "ตู้ยังว่างอยู่" instead.

### 3.7 Ingredient side bar (`components/home/SideBar.tsx`; structure from `ref-sidebar.jpg`)
One component, two placements. It is a `.panel` (§2.5) and lists the 30 catalog items.

**Header row** (48px, 12px padding, gap 8):
- **Category dropdown** (the "Basic Shapes" slot): a candy-bevel pill (§2.6, `--face: var(--cream)`, `--lip: #D9C9A3`, `--outline` text) showing the current category + ChevronDown. Options: ทั้งหมด · ผัก · ผลไม้ · เนื้อสัตว์ · อาหารทะเล · ไข่และนม · เครื่องดื่ม · ซอส · อาหารปรุงแล้ว · อื่นๆ. Use a native `<select>` styled as the pill (no custom listbox), so keyboard and screen readers work for free.
- **Search:** a `.panel-well` input, 44px tall, white text, placeholder "ค้นหาของ" in `#C9D2F0` (10.2:1 on the well), Search icon 18px. Filters by name and aliases. On mobile it can collapse to a 44px icon button that expands over the dropdown.
- Result count under the row in `tag` white: "30 อย่าง". Empty result: "ไม่เจอ \"{q}\"" + a cream "ล้างคำค้น" chip.

**Tile grid** (scrolls inside the panel, `overscroll-behavior: contain`, 12px padding, gap 10):
- Tiles are big squares: 96 × 96 on desktop in **3 columns**; on mobile 80 × 80 in 4 columns (peek) and 3 columns of 104 when expanded. `--cream` face, `--r-tile`, `--ow-md` outline, `0 4px 0 var(--outline)` plinth.
- Inside: the `IngredientPicture` sticker at 56 centred in the top 70%, the full name below in `tag` `--outline` (1 line, ellipsis). A **"+" badge** at the top-right: a 26px `--candy-green` circle, `--ow-sm` outline, `--outline` Plus 14px, 44×44 hit area via `::before`.
- Hover (fine pointer): `translateY(-2px)`, plinth stays (the tile "lifts"). Pressed: `translateY(3px)`, plinth 0.
- **Interactions:** tap / click → details card in catalog mode (§5). Long-press 350ms (mobile) or 4px move with the button held (desktop) → drag (§9). "+" → the add form directly (the keyboard and no-drag path).

**Desktop placement (≥ 1024):** docked to the right edge, `position: sticky; top: 88px` (below the top bar), height `calc(100dvh - 112px)`, 340px wide, with the outline and radius on the left side only (the right side runs to the viewport edge). A **collapse chevron** sits on the panel's left edge, vertically centred: a 28 × 64 navy tab with `--ow-md` outline (no right border), ChevronRight 20px white, `aria-expanded`, `aria-controls`, `aria-label="ซ่อนแถบของ"/"แสดงแถบของ"`. Collapsed, the panel slides out with `translateX(calc(100% - 28px))` (240ms ease-out) leaving only the tab, and the fridge column recentres (layout change happens once at the end, not animated). Remember the state in `localStorage` (try/catch).

**Mobile placement (< 1024):** a bottom sheet fixed above the tab bar, full width, 24px top radius, outline on top only. Two snap states: **peek** (156px: grabber + header + one row of tiles, scroll-x) and **expanded** (70dvh: 3-column grid, scroll-y). The grabber is a 44px-tall button (`aria-expanded`, a 40×5 white/60% bar) that toggles; dragging it moves the sheet with `translateY` only and snaps to the nearer state (200ms ease-out). Starting an ingredient drag from the expanded sheet drops it to peek, so the fridge is visible.

**Contrast check:** white on `--panel` 12.7, white on `--panel-well` 15.4, `--outline` on `--cream` 15.1, dropdown text `--outline` on cream 15.1.

## 4. Ingredient pictures + catalog

Every ingredient, everywhere (side-bar tiles, fridge items, details card, add form, History rows, AI ingredients), renders through **one** component, `components/IngredientPicture.tsx`, with props `{ name, category, size: 48|56|72|96 }`. The user draws the art. Until a file exists, the component shows an outlined text sticker (§4.4). Nothing else is allowed.

### 4.1 Catalog (`lib/catalog.ts`)
`export const CATALOG: { id; name; aliases: string[]; short: string; category; unit; zone; days; freezerDays: number|null }[]`.
- `days` is the shelf life in the default zone. `freezerDays` applies when the user drops the item into the freezer. `null` means "freezing not recommended": keep the chill days and show the hint "ไม่แนะนำให้แช่แข็ง".
- `short` is the text-block label, with `\n` as a hand-placed line break. Each line is ≤ 5 spacing characters, so it never truncates at 48px.
- The days follow PROJECT_PLAN §5.3 and are conservative. **Check them against a food-safety source before release.**

| id (fixed) | name | aliases | short | category | unit | zone | days | freezerDays |
|---|---|---|---|---|---|---|---|---|
| egg | ไข่ไก่ | ไข่, ไข่เป็ด | ไข่ | dairy_egg | ฟอง | chill | 21 | null |
| milk | นมจืด | นม, นมสด | นม | dairy_egg | กล่อง | chill | 7 | null |
| yogurt | โยเกิร์ต | นมเปรี้ยว | โย\nเกิร์ต | dairy_egg | ชิ้น | chill | 10 | null |
| cheese | ชีส | เชดดาร์ | ชีส | dairy_egg | ชิ้น | chill | 21 | 90 |
| butter | เนย | เนยจืด, เนยเค็ม | เนย | dairy_egg | ชิ้น | chill | 30 | 180 |
| pork-minced | หมูสับ | หมูบด | หมูสับ | meat | กรัม | chill | 2 | 90 |
| pork | เนื้อหมู | หมูสามชั้น, สันนอก, หมูชิ้น, หมู | หมู | meat | กรัม | chill | 3 | 90 |
| chicken | เนื้อไก่ | อกไก่, น่องไก่, สะโพกไก่, ไก่ | ไก่ | meat | กรัม | chill | 2 | 180 |
| beef | เนื้อวัว | เนื้อ, เนื้อสัน | เนื้อ\nวัว | meat | กรัม | chill | 3 | 180 |
| sausage | ไส้กรอก | ไส้อั่ว, ลูกชิ้น | ไส้\nกรอก | meat | แพ็ค | chill | 7 | 60 |
| shrimp | กุ้ง | กุ้งขาว, กุ้งแม่น้ำ | กุ้ง | seafood | กรัม | chill | 2 | 90 |
| fish | ปลา | ปลานิล, ปลาทับทิม, ปลาทู, ปลาแซลมอน | ปลา | seafood | ชิ้น | chill | 2 | 90 |
| squid | ปลาหมึก | หมึก | ปลา\nหมึก | seafood | กรัม | chill | 2 | 90 |
| napa-cabbage | ผักกาดขาว | ผักกาด | ผักกาด\nขาว | veg | ชิ้น | chill | 7 | null |
| kale | คะน้า | ผักบุ้ง, กวางตุ้ง | คะน้า | veg | ถุง | chill | 4 | null |
| cabbage | กะหล่ำปลี | กะหล่ำ | กะหล่ำ\nปลี | veg | ชิ้น | chill | 14 | null |
| carrot | แครอท | แคร์รอต | แครอท | veg | กก. | chill | 21 | null |
| tomato | มะเขือเทศ | มะเขือ | มะเขือ\nเทศ | veg | ชิ้น | chill | 7 | null |
| cucumber | แตงกวา | แตง | แตง\nกวา | veg | ชิ้น | chill | 7 | null |
| herbs | ต้นหอม ผักชี | ต้นหอม, ผักชี, โหระพา, กะเพรา, ใบมะกรูด | หอม\nผักชี | veg | ถุง | chill | 5 | null |
| chili | พริก | พริกขี้หนู, พริกแดง, พริกหยวก | พริก | veg | กรัม | chill | 10 | 90 |
| lime | มะนาว | — | มะนาว | fruit | ชิ้น | chill | 21 | null |
| banana | กล้วย | กล้วยหอม, กล้วยน้ำว้า | กล้วย | fruit | ชิ้น | chill | 5 | 60 |
| apple | แอปเปิล | แอปเปิ้ล | แอป\nเปิล | fruit | ชิ้น | chill | 21 | null |
| orange | ส้ม | ส้มเขียวหวาน | ส้ม | fruit | กก. | chill | 14 | null |
| tofu | เต้าหู้ | เต้าหู้ไข่, เต้าหู้แข็ง | เต้าหู้ | other | ชิ้น | chill | 5 | 60 |
| leftovers | อาหารเหลือ | ข้าวเหลือ, แกงเหลือ, กับข้าว, ของเหลือ | ของ\nเหลือ | cooked | กล่อง | chill | 3 | 60 |
| soda | น้ำอัดลม | โซดา, โค้ก, เป๊ปซี่ | น้ำ\nอัดลม | drink | ขวด | chill | 30 | null |
| sauce | ซอส น้ำพริก | ซอส, น้ำพริก, น้ำปลา, ซีอิ๊ว, ซอสหอยนางรม, กะปิ | ซอส | sauce | ขวด | chill | 90 | null |
| ice-cream | ไอศกรีม | ไอติม | ไอติม | dairy_egg | กล่อง | freezer | 60 | 60 |

Don't alias the bare word "น้ำ", because it would catch น้ำปลา. Also export `guessExpiry(item, zone, boughtOn) = boughtOn + (zone === 'freezer' ? item.freezerDays ?? item.days : item.days)`.

### 4.2 Name → picture id (`pictureId(name, category)` in `lib/catalog.ts`; pure, tested)
1. Normalise: trim, collapse spaces, lowercase Latin.
2. **Exact match** on `name` or any alias → the catalog `id`.
3. **Contains match**: the longest `name`/alias that is a substring of the input wins (e.g. "หมูสับอนามัย" → pork-minced; "อกไก่ CP" → chicken).
4. Otherwise → the category fallback: `veg→cat-veg, fruit→cat-fruit, meat→cat-meat, seafood→cat-seafood, dairy_egg→cat-dairy-egg, drink→cat-drink, sauce→cat-sauce, cooked→cat-cooked, other→cat-other`.

### 4.3 File-first loader (dropping in a file is all it takes, no code change)
- Art lives in `public/ingredients/<id>.svg`, or `<id>.png` at 512×512 with a transparent background. This covers both the 30 item ids and the 9 `cat-*` ids.
- `scripts/ingredients-manifest.mjs` lists `public/ingredients/` and writes `lib/ingredients-manifest.json` (`{ "egg": "svg", "cat-meat": "png", … }`). Run it from the `predev` and `prebuild` npm scripts, and commit the empty `{}` the first time. Adding a file plus a deploy picks it up. Don't probe for files at runtime and don't use `onError` chains, because both cost 404s per item.
- Resolution: item id `.svg` → item id `.png` → category `.svg` → category `.png` → **text block** (4.4). Render images as `<img src alt="" width height loading="lazy" decoding="async" draggable="false">` with `object-fit: contain`. The accessible name sits on the parent control.

### 4.4 Text-block placeholder (what ships now)
A rounded, outlined sticker in the category's colours with the Thai label centred.

| size | used in | radius | font (Mitr 600, lh 1.05) | max spacing chars / line | lines |
|---|---|---|---|---|---|
| 48 | fridge (mobile), door bins, History rows, AI ingredient rows | 14 | 14px | 5 | 2 |
| 56 | fridge (desktop), side-bar tiles, drag ghost, AI card cluster | 16 | 15px | 5 | 2 |
| 72 | details card, add form | 20 | 18px | 6 | 2 |
| 96 | History "week" card hero, AI urgent strip on desktop | 26 | 22px | 7 | 2 |

- **Outlined sticker chip** (matches ref 1): box `size × size`, padding 4px, `display:grid; place-items:center`, text centred, `word-break: keep-all`. A `--outline` border (`--ow-sm` at 48, `--ow-md` at 56+), then a white die-cut ring outside it (`box-shadow: 0 0 0 3px #fff, 0 0 0 5px var(--outline)` at 56+; at 48 drop the white ring and keep only the border), a top highlight `inset 0 3px 0 rgb(255 255 255 / .6)` and a bottom lip `inset 0 -4px 0` of the ink colour at 18%. Label text is the category ink (≥ 6.4:1). It must read as a deliberate game sticker, not a broken image.
- Category colours (bg / ink, all ≥ 6.4:1):

| category | bg | ink | contrast |
|---|---|---|---|
| veg | `#D9F2D4` | `#1F5A2A` | 6.9 |
| fruit | `#FFE2C4` | `#7A3A05` | 7.0 |
| meat | `#FADCD3` | `#7E2A16` | 7.3 |
| seafood | `#D3F0EC` | `#0E5A52` | 6.7 |
| dairy_egg | `#E4ECFF` | `#24468C` | 7.6 |
| drink | `#D8F1FA` | `#13506A` | 7.5 |
| sauce | `#EFDFD2` | `#5E2A12` | 8.9 |
| cooked | `#DCEFE6` | `#075F47` | 6.4 |
| other | `#ECE9E4` | `#45403A` | 8.5 |
These are block colours only. They never mean status, which is always a badge (§3.4).
- **Label and truncation rule** (`blockLabel(name, size)`, pure, tested). "Spacing chars" means code points other than the Thai combining marks U+0E31 and U+0E34–U+0E3A, U+0E47–U+0E4E.
  1. A catalog match uses `short`, split on `\n`, as is.
  2. Free text: split into words with `Intl.Segmenter('th', { granularity: 'word' })` and greedily pack words into lines of ≤ cap spacing chars. A word longer than the cap is hard-split at a grapheme boundary (`granularity: 'grapheme'`).
  3. More than 2 lines: keep 2, and cut line 2 to cap − 1 spacing chars + "…".
  4. Never shrink the font below the table value.
- The full name is always available in the tile's accessible name, the sticker (once real art exists) and the details card.

### 4.5 Illustration guide (for the user, who draws the 30 items + 9 category pictures)
- **Canvas:** 512 × 512, transparent background, saved as `public/ingredients/<id>.svg` (preferred) or `.png`, using the exact ids in §4.1 and `cat-*` for categories. Keep a 40px empty margin on every side (the drawing fits inside 432 × 432) and sit the object on an imaginary floor at y = 472, so things line up on a shelf.
- **Viewpoint:** a ¾ view from slightly above (about 20°), the way you'd see an item on a fridge shelf. Draw one object per picture (an egg can be 2–3 eggs, herbs one bunch). No hands, no faces, no plates, no background.
- **Style: outlined game sticker** (the look of ref 1, drawn by you, nothing traced or copied). Flat colour shapes with a **16px** outer outline in `#1B1F3B` (`--outline`) and **8px** inner lines between parts, round caps and joins. Around the whole object add a **white die-cut border, 14px**, and then a second 6px `#1B1F3B` line around that, so it looks like a cut-out sticker on any background (the margin below already leaves room). One flat shade per shape (base colour darkened about 20%, lower-right) and one glossy white highlight blob at the top-left (a short rounded stroke, 100% white). No gradients, no textures, no drop shadow (the app adds the shelf shadow).
- **Palette:** candy-bright, like the buttons: start from the category block colours in 4.4 and push them brighter for the object: greens `#3FAE5A`/`#2E8B57`, reds `#E5462F`, oranges `#F08A24`, yolk `#FFD23F`, meat pink `#F29B9B`, sea blue `#9DB8C9`, milk blue `#3D7EE0`, brown `#8A3B1D`, white `#FFFFFF`. Avoid purple and neon.
- **Category pictures (`cat-*`):** a generic member of the group (a leaf for veg, an apple-ish fruit for fruit, a steak on a tray for meat, a fish for seafood, a carton for dairy-egg, a bottle for drink, a jar for sauce, a lidded box for cooked, a paper bag for other).
- **Do:** keep shapes chunky and readable at 48px (squint test: shrink it to thumbnail size and you should still know what it is). **Don't:** draw thin details, text, logos or brand packaging, copy shapes from Cookie Run or any game, or mix in other styles or photos.

## 5. Details card (hover / tap / keyboard)
One component, `DetailsCard`, with two modes. The card is `--cream`, `--r-card`, `--ow-md` `--outline` border plus `0 5px 0 var(--outline)` plinth, 272px wide, padding 16, anchored 10px above the item with an 8px caret. It flips below the item if `top < 72px`, and it clamps 16px from the viewport edges. Position it with `getBoundingClientRect` (no library).

**Lot mode (an item in the fridge):**
```
[pic 72]  หมูสับ                         (title, Mitr 500)
          เนื้อสัตว์ · ช่องธรรมดา            (meta, ink-2)
┌ status row (r12, padding 10×12, bg per state) ─────────┐
│ [icon] ควรบริโภคภายใน  2  วัน                           │  "2" uses the stat style
└────────────────────────────────────────────────────────┘
ซื้อเมื่อ 3 ต.ค.            300 กรัม   (2 rows, label ink-3 / value ink, 15px)
หมดอายุ 6 ต.ค. ≈ เดา                    ("≈ เดา" chip if expiry_guessed)
[ จัดการ › ]  (48px, full width, candy-blue bevel §2.6, --outline text → /item/{id})
```
- If the group has more than 1 lot, show "มี 2 ล็อต · ล็อตที่ใกล้หมดที่สุด", and the qty row shows that lot's qty plus "(รวม N {unit})".
- Status row per state. The **text colour** carries the rule, and an icon plus words always go with it:

| Days (d) | bg | text | icon | copy |
|---|---|---|---|---|
| d > 7 | `--brand-soft` | `--brand-ink` | CircleCheck | ควรบริโภคภายใน **d** วัน |
| 4 ≤ d ≤ 7 | `--week-soft` | `--week-ink` (#6B5000, 6.9:1) | Clock | ควรบริโภคภายใน **d** วัน |
| 1 ≤ d ≤ 3 | `--urgent-soft` | `--urgent-ink` (5.8:1) | TriangleAlert | ควรบริโภคภายใน **d** วัน · รีบใช้นะ |
| d = 0 | `--urgent-soft` | `--urgent-ink` | TriangleAlert | ควรบริโภค **วันนี้** |
| d < 0 | `--expired` (filled) | white (9.0:1) | TriangleAlert | **หมดอายุแล้ว −d วัน** · ตรวจสภาพก่อนกิน |
| no date | `--ice` | `--ink-2` | Minus | ไม่ได้ระบุวันหมดอายุ |

- Put the pure tone function in `lib/expiry.ts`: `homeTone(expiresAt, today): "fresh"|"week"|"urgent"|"expired"|"none"` (urgent = 0–3). Don't change `expiryStatus`, because notifications and tests depend on it.

**Catalog mode (a side-bar tile):** picture 72 + name + "ประเภท: ผัก" + a status row in `--ice` with a Snowflake/Refrigerator icon: "เก็บในช่องธรรมดาได้ประมาณ **N** วัน". Add a second line if `freezerDays` exists: "ช่องแช่แข็ง ~N วัน". Below that is a primary candy button "เพิ่มเข้าตู้" (§2.6, 48px, `--candy-green`, `--outline` text) that opens the add form.

**Triggers**
- Desktop (`(hover: hover) and (pointer: fine)`): `pointerenter` + 250ms delay opens the card. Leaving item and card closes it after 120ms of grace. Click on a fridge item → /item/{id}. Click on a side-bar tile body → opens the card pinned.
- Mobile: tap toggles the card. Tapping outside, scrolling or pressing Esc closes it. Only one card is open at a time. A long-press (350ms) starts a drag instead and never opens the card.

## 6. Add form (opened by a drop, the "+" button or "เพิ่มเข้าตู้")
A native `<dialog>` via `showModal()`. On mobile it is a bottom sheet (full width, `--r-card` top corners, max-height 85dvh). On desktop it is centred, 400px wide. A 40% ink scrim with **no blur**.
```
[pic 72]  เพิ่ม ไข่ไก่                     (title)  [× 44px]
          ไข่และนม · เก็บใน [ช่องธรรมดา|ช่องแช่แข็ง]  (segmented, preset by drop zone or catalog zone)
"ยังมีไข่ไก่ 4 ฟอง หมด 5 ต.ค." (existing-lot notice, --week-soft, only if one exists)
จำนวน   [ − ]  [ 10 ]  [ + ]   หน่วย [ฟอง ▾]   (steppers 44px, default qty 1, unit = catalog unit)
วันหมดอายุ [ 2026-10-25 ] ≈ เดา จากอายุเก็บ 21 วัน
วันที่ซื้อ   [ 2026-10-04 ]  (default todayIn(), max today)
[ บันทึกเข้าตู้ ]  (52px, candy-green bevel §2.6, --outline text, full width)
```
- Changing the zone or the purchase date re-guesses the expiry, unless the user has edited the expiry field (then show "แก้เอง" instead of "≈ เดา").
- Hidden fields: `name`, `category`, `expiry_guessed` ("1"/"0"). Extend `lotSchema` with `expiry_guessed: z.preprocess(v => v === "1", z.boolean())` and pass it through `fields()`.
- Submit with a new server action `addLotFromHome(prev, fd)` in `app/(app)/fridge/actions.ts`, called through `useActionState`. It validates with `lotSchema`, inserts, `revalidatePath("/today")` and returns `{ ok: true, id }` or `{ error }`. **Don't redirect.** On ok: close the dialog, `router.refresh()`, and pop the new item (§9).
- On error: a `Notice tone="error"` inside the sheet: "บันทึกไม่สำเร็จ ลองอีกครั้ง". Keep the inputs.

## 7. History tab (`app/(app)/history/page.tsx`, new)
**Game-UI mapping for §7–8:** every "white card, `--sh-card`" below is a `--cream` card with an `--ow-md` outline and a `0 4px 0 var(--outline)` plinth; every pill is a sticker chip (§2.7); every primary button is a candy bevel (§2.6). The "ไม่มีของเสียมา N วันแล้ว" line earns the screen's one `--star` accent (an outlined star badge, rule 9).
A diary of the fridge, not a table. Background `--ice`, column `max-w-xl` with a 16px gutter. On desktop it is centred with the same 640px max width.

**Data** (server, RLS-scoped, last 30 days, newest first):
- Additions come from `lots` (`id, name, unit, category, zone, bought_on, created_at, created_by`). The added qty = the current `qty` + the sum of that lot's `usage_logs.qty`.
- Removals come from `usage_logs` (`action, qty, reason, created_at, user_id`) joined to `lots(name, unit, category)`.
- Who: `profiles.display_name` for `created_by` / `user_id`, shown as "คุณ" for the current user.
- Group by the day of `created_at` in the household's timezone. Older pages load through "ดูเก่ากว่านี้" (`?before=YYYY-MM-DD`, a link, not infinite scroll).

**Layout, top to bottom:**
1. Title "ประวัติตู้เย็น" (display) + meta "30 วันล่าสุด".
2. **"7 วันนี้" card** (white, `--r-card`, `--sh-card`, padding 20): two stats side by side in `stat` style, "ใช้ทัน **N**" (`--brand-ink`, CircleCheck; counts use + finish) and "ทิ้ง **N**" (`--urgent-ink`, Trash2). Below them, one friendly line: if nothing was discarded in the last N days, "ไม่มีของเสียมา N วันแล้ว เก่งมาก"; otherwise "ของที่ทิ้งบ่อย: {most-discarded name}". On the right, a 96px picture of the most-used item of the week.
3. **Filter chips** (sticky under the top edge, on `--ice`): ทั้งหมด · เพิ่มเข้า · ใช้ · ทิ้ง (`aria-pressed`, pill, 44px).
4. **Day groups.** The heading row is Mitr 500 18px: "วันนี้", "เมื่อวาน" or `thaiDate` with the weekday ("ศ. 2 ต.ค."), and on its right a meta summary "+3 · ใช้ 2 · ทิ้ง 1".
5. **Event rows** inside one white card per day. Each row is 64px min:
   ```
   [pic 48]  หมูสับ  ใช้ไป 150 กรัม            18:40
     ┆       [⊖ ใช้] · น้อย                      
   ```
   - A 2px dashed `--line` vertical line connects the pictures of consecutive rows (the timeline spine), centred under the picture column.
   - Line 1 has the name (600) and the verb phrase (400): "เพิ่ม 10 ฟอง", "ใช้ไป 150 กรัม", "ใช้หมดแล้ว", "ทิ้ง 2 ชิ้น". The time is right-aligned in `--ink-2`.
   - Line 2 has an action pill + who. Pills (pill, `tag`, icon 14px): เพิ่ม = `--brand-soft`/`--brand-ink` with Plus; ใช้ = `--ice`/`--ink-2` with Minus; หมดแล้ว = `--brand-soft`/`--brand-ink` with CircleCheck; ทิ้ง = `--urgent-soft`/`--urgent-ink` with Trash2.
   - If a discard has a reason, it goes on line 3 as a quote in `--ink-2`: "“เหม็นแล้ว”".
   - The whole row links to `/item/{lot_id}` while the lot still has qty > 0. Otherwise the row is not a link.
6. Empty state: a 96px `cat-other` picture plus "ยังไม่มีประวัติ เริ่มจากเพิ่มของเข้าตู้" and a button to `/today`.

## 8. AI tab (`/recipes`, restyle of `Recipes.tsx`; logic unchanged)
Background `--ice`, max width 640px.
1. Title "เมนูจากของในตู้" (display) + meta "AI ช่วยคิด ใช้ของที่ต้องรีบใช้ก่อน".
2. **"ต้องรีบใช้" strip:** a horizontal scroll row of the urgent (≤ 3 days) and week (4–7 days) items as 56px pictures (96px on desktop) with their §3.4 status badges. Hide it when the row is empty.
3. Primary candy button (§2.6, 56px, full width, `--candy-green`, `--outline` text, Mitr 600 18px) with a ChefHat icon: "คิดเมนูให้หน่อย" or "ขอเมนูใหม่". **Replace the current Sparkles icon** (an AI cliché). Under it: "วันนี้ขอได้อีก N ครั้ง" in `--ink-2`.
4. **Loading:** 3 skeleton cards whose blocks pulse in opacity from .5 to 1 (900ms alternate). No shimmer gradient.
5. **Recipe card** (white, `--r-card`, `--sh-card`, padding 20):
   - Top: a picture cluster of up to 4 ingredients at 56px, overlapping by −12px, each with a 3px white ring. `uses_urgent` items go first, carrying their badges.
   - Name (title, Mitr 500 20px). A meta row of chips: Clock "N นาที" and a difficulty chip, both in `--ice`/`--ink-2`.
   - "ใช้ของใกล้หมด: หมูสับ, ผักบุ้ง": `--urgent-soft` bg, `--urgent-ink` text, TriangleAlert icon (this replaces the current `soon` styling).
   - Ingredients: rows of 48px picture + name + qty right-aligned in `--ink-2`.
   - "ต้องซื้อเพิ่ม": the same rows, but the picture box gets a 2px dashed `--line` border and the qty is replaced by the word "ซื้อเพิ่ม".
   - Steps: an `<ol>`. Each number sits in a 28px `--wall` circle with ink Mitr 600 text (11.7:1).
   - The disclaimer stays verbatim, in an `--ice` box with an Info icon.
   - "ทำเมนูนี้แล้ว" keeps its current `<details>` flow, restyled with a 48px picture on each qty row.

## 9. Motion
Animate only `transform` and `opacity`. Never animate blur, shadows, width/height or top/left. Easings:
`--ease-out: cubic-bezier(.2,.8,.2,1)` · `--ease-spring: cubic-bezier(.34,1.56,.64,1)` · `--ease-in: cubic-bezier(.4,0,1,1)`.

**Drag and drop** (Pointer Events for mouse and touch; no DnD library, and not the HTML5 drag API):
| Phase | Behaviour |
|---|---|
| Arm | Mobile: `pointerdown` on a tile starts a 350ms timer, and the tile scales to .96 (150ms ease-out). Moving > 8px before the timer ends cancels it, so the scroll wins (tiles have `touch-action: pan-x` in the peek row, `pan-y` in the grid). Desktop: drag starts after a 4px move with the button held. |
| Pickup | `setPointerCapture`; `navigator.vibrate?.(10)`. A ghost (fixed-position clone: picture 56 on a white tile) goes from scale 1 to 1.12 with rotate −4deg in 160ms ease-spring, `--sh-lift`. The source tile goes to opacity .35. Announce "หยิบ{name}แล้ว ลากไปวางในตู้" via aria-live. |
| Move | Use `translate3d` inside one rAF per frame. Tilt = clamp(velocityX × 0.04, −8deg, 8deg), eased 20% per frame. Body `user-select:none`. |
| Over the fridge | The target place (freezer or the chill interior) shows a dashed 2px `--brand` outline overlay (opacity 0→1, 120ms). The freezer overlay label reads "แช่แข็ง". Only 2 drop targets: **freezer** and **everything else = chill**. |
| Drop | The ghost moves to the drop point and lands in 200ms ease-out, then squashes from scale(1.08,.92) to (1,1) in 160ms ease-spring. The shelf under it does translateY 2px→0 in 140ms. Then the form opens with zone preset. |
| Cancel (drop outside / Esc) | The ghost flies back to its tile, 280ms ease-spring, fading to 0 in the last 80ms. The tile returns to opacity 1. |
| New item appears | After save, the new item pops in on its shelf: scale .6→1 and opacity 0→1, 320ms ease-spring. |

**Details card:** opening = opacity 0→1, translateY(6px)→0, scale .96→1, 200ms ease-out, `transform-origin` at the caret. Closing = opacity→0 in 120ms ease-in. The form sheet on mobile: translateY(100%)→0 in 280ms ease-out, closing 200ms ease-in. On desktop: scale .96→1 + fade, 200ms.

**Spotlight:** item opacity transitions over 200ms ease-out.

**Flies** (`components/home/Flies.tsx`, CSS + inline SVG, aria-hidden):
- A fly is an 8×8 SVG: an ink body ellipse 4×5 (`#12201A`, opacity .85) and two white wings 3×2.5 (opacity .75).
- Who gets flies: an expired item gets 2, a 0–3 day item gets 1. **Global cap: 6 flies on screen.** Assign them in `byExpiry` order (the most expired first). Items past the cap get none. Badges still carry the meaning, so the flies are decoration.
- Path, transform only: the outer span is centred on the item picture, with `animation: orbit 2.6s linear infinite` (rotate 0→360deg). The inner span is `translateX(26px)` (desktop 32px) with `animation: bob .9s ease-in-out infinite alternate` (translateY −3px→3px). The second fly on the same item uses `orbit 3.4s linear infinite reverse` with a radius of 20px and a −1.2s delay. The wings flutter with `animation: buzz 80ms steps(2) infinite` (scaleY 1↔.6).
- Add `will-change: transform` only on the orbit span. Pause every fly (`animation-play-state: paused`) while a drag is active or the dialog is open.

**`prefers-reduced-motion: reduce`:** no flies animate. One static fly sits at the item's top-left (it still reads as "going off"). The ghost follows the pointer with no tilt and no scale. All other transitions become instant swaps (the existing global rule already does this; the flies must check the media query in CSS, not JS).

**Performance budget:** 60fps on a mid-range Android (e.g. Galaxy A15, Chrome). Measure with `performance_start_trace` during a drag plus 6 flies; no frame may exceed 16ms on scripting. There is no blur to cost frames; the bevel press is a transform.

## 10. Accessibility
- The fridge is `<section aria-label="ในตู้เย็น">`. Each place is a `<ul aria-label="ช่องแช่แข็ง|ชั้นบน|ชั้นกลาง|ชั้นล่าง|ลิ้นชักผัก|ช่องประตู">`. Each item is a `<button aria-expanded aria-controls="details">` with `aria-label="หมูสับ 300 กรัม, ควรบริโภคภายใน 2 วัน"`. Its picture, sticker and flies are `aria-hidden`.
- **Keyboard alternative to drag:** each side-bar tile's "+" badge (`aria-label="เพิ่ม{name}เข้าตู้"`) opens the same form, with the zone preset from the catalog. Tab order: header → chips → fridge items (DOM order = place order, then byExpiry) → side-bar collapse chevron → category dropdown → search → tiles.
- Enter or Space on an item or tile opens the details card. Esc closes it and returns focus to the trigger. The card is `role="dialog" aria-modal="false" aria-labelledby` the item name. Its "จัดการ ›" or "เพิ่มเข้าตู้" button takes focus on open (keyboard and tap only, not on hover).
- The form dialog uses native `<dialog>` (focus trap + Esc). The first focus is the qty input.
- Focus ring: the global `:focus-visible` (3px green mix). On the wall and on items, add `outline-offset: 3px` and a 2px white inner ring (`box-shadow: 0 0 0 2px #fff`) so it is visible on yellow and on the interior.
- Use one `<p aria-live="polite" class="sr-only">` for drag pickup, drop, cancel and "บันทึก{name}เข้าตู้แล้ว".
- State is never shown by colour alone: badges carry a number and an icon, status rows carry an icon and words, and the summary chips carry words.
- Hit areas are ≥ 44×44 for everything clickable, including fridge items (the 48px picture is the button; desktop 56px).

## 11. Build checklist (ship in this order, most visible first; each slice deploys on its own)
1. **Tab shell + fridge scene + side bar.** Tokens §2 (palette incl. `--outline`, `--panel*`, `--candy-*`, `--cream`; outline widths; `.panel`, `.btn-candy`, badge/sticker classes; change `--soon` to `#6B5000`; load Mitr). `lib/catalog.ts` (§4.1 table, `pictureId`, `blockLabel`, `guessExpiry`) + `homeTone` with Vitest tests (aliases, longest contains-match, Thai truncation). `IngredientPicture` with the manifest loader (`scripts/ingredients-manifest.mjs`, `predev`/`prebuild`, empty `public/ingredients/.gitkeep`) and the outlined sticker (§4.4). Shell §3.0 (navy tab bar on mobile, top bar on desktop, AI tab hidden without key, back links → /today, sign-out moved). Static Fridge Home §3.1–3.6 (wall, outlined fridge, placement §3.3, badges, overflow chips, summary chips + spotlight, AI card, ต้องใช้ก่อน list, empty state). Side bar §3.7 (dropdown, search, tile grid, desktop collapse chevron, mobile peek/expanded sheet). The "+" badge opens the add form (§6, `addLotFromHome`, `expiry_guessed`, pop-in) so adding works from day one without drag.
2. **Details card + colours.** §5 lot and catalog modes, hover/tap/keyboard, flip and clamp; the status rows; candy button variants; AA spot-check of every state (week mustard, urgent red, expired filled) on cream, wall and navy.
3. **Drag-to-add.** §9 drag and drop from the side bar: long-press arming, ghost, freezer/chill drop targets, land + squash, cancel, sheet drops to peek on drag start, live region.
4. **Flies.** §9 Flies with the global cap of 6, paused during drag and dialog, the reduced-motion static fly.
5. **History + AI restyle.** §7 and §8 in the new language (cream outlined cards, candy buttons, sticker pictures, the star/ribbon reward used once on the "7 วันนี้" card when nothing was discarded). Add pictures to `/fridge` list rows.
6. **QA (one batched pass):** screenshots of all 3 tabs at 390×844 and 1280×800 (side bar open and collapsed, sheet peek and expanded), a click through every control on the production URL, a Chrome trace with drag + 6 flies on a throttled mobile profile, the `impeccable detect` run, and an AA spot-check on wall, navy panel, candy buttons, badges and stickers.
