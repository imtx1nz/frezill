import { z } from "zod";

/** Staples assumed to be in every Thai kitchen: usable in menus, never deducted, never "missing". */
export const PANTRY = ["ข้าวสวย", "ข้าวสาร", "น้ำ", "น้ำมันพืช", "เกลือ", "น้ำตาล", "น้ำปลา", "ซีอิ๊วขาว", "ซอสหอยนางรม", "พริกไทย", "กระเทียม"];

export const ACTIONS = ["prep", "cut", "mix", "fry", "boil", "steam", "bake", "season", "rest", "serve"] as const;
export type Action = (typeof ACTIONS)[number];
const nullish = <T extends z.ZodType>(t: T) => t.nullish().transform((v) => v ?? undefined);
const objStep = z.object({ text: z.string().trim().min(1), action: z.enum(ACTIONS), heat: nullish(z.enum(["low", "medium", "high"])), minutes: nullish(z.number().int().positive().max(600)) });

// Old cached/AI output had plain-string steps: guess the action from a Thai keyword.
const GUESS: [RegExp, Action][] = [[/หั่น|สับ|ซอย|ปอก/, "cut"], [/ผสม|หมัก|คลุก|ตี/, "mix"], [/ผัด|ทอด|เจียว/, "fry"], [/ต้ม|ลวก|แกง/, "boil"], [/นึ่ง/, "steam"], [/อบ|ย่าง|ปิ้ง/, "bake"], [/ปรุง|เติม|ชิม/, "season"], [/พัก|รอ|แช่/, "rest"], [/เสิร์ฟ|ตัก|จัด|โรย/, "serve"]];
const stepSchema = z.union([objStep, z.string().trim().min(1).transform((text) => ({ text, action: (GUESS.find(([re]) => re.test(text))?.[1] ?? "prep") as Action, heat: undefined, minutes: undefined }))]);

const menuSchema = z.object({
  name: z.string().trim().min(1).max(80),
  uses_urgent: z.array(z.string().trim().min(1)),
  ingredients: z.array(z.object({ name: z.string().trim().min(1), qty: z.number().positive(), unit: z.string().trim().min(1) })).min(1),
  missing: z.array(z.string().trim().min(1)).max(2),
  minutes: z.number().int().positive().max(600),
  difficulty: z.enum(["ง่าย", "ปานกลาง", "ยาก"]),
  steps: z.array(stepSchema).min(1).max(10),
});
export const aiOutputSchema = z.object({ menus: z.array(menuSchema).length(3) });

export type Item = { name: string; unit: string; qty: number; urgent: boolean };
export type Menu = Omit<z.infer<typeof menuSchema>, "ingredients"> & {
  ingredients: { name: string; qty: number; unit: string; inFridge: boolean }[];
};

/** Raw Gemini text → 3 valid menus, or null (bad JSON / wrong shape). */
export function parseMenus(text: string | undefined) {
  try {
    const r = aiOutputSchema.safeParse(JSON.parse(text ?? ""));
    return r.success ? r.data.menus : null;
  } catch {
    return null;
  }
}

// unit → [group, factor to the group's base unit (g / ml)]
const UNITS: Record<string, [string, number]> = { กรัม: ["w", 1], g: ["w", 1], กิโลกรัม: ["w", 1000], กก: ["w", 1000], "กก.": ["w", 1000], kg: ["w", 1000], มิลลิลิตร: ["v", 1], มล: ["v", 1], "มล.": ["v", 1], ml: ["v", 1], ลิตร: ["v", 1000], l: ["v", 1000] };

/** AI qty expressed in the fridge unit, capped at what the fridge has, max 2 decimals. */
function fitQty(ing: { qty: number; unit: string }, hit: Item) {
  const a = UNITS[ing.unit.trim().toLowerCase()], b = UNITS[hit.unit.trim().toLowerCase()];
  // Same unit: as is. Convertible: scale. Otherwise (e.g. ฟอง vs แผง) the number is meaningless in the fridge unit, so use 1 (or all that's left if less).
  const q = ing.unit === hit.unit ? ing.qty : a && b && a[0] === b[0] ? (ing.qty * a[1]) / b[1] : 1;
  return Math.round(Math.min(q, hit.qty) * 100) / 100;
}

/** Anything the AI used that is neither in the fridge nor a pantry staple goes to `missing`; fridge items get the fridge's unit. */
export function normalize(menus: z.infer<typeof menuSchema>[], items: Item[]): Menu[] {
  return menus.map((m) => {
    const missing = new Set(m.missing);
    const ingredients: Menu["ingredients"] = [];
    for (const ing of m.ingredients) {
      const own = items.filter((i) => i.name === ing.name);
      const hit = own.find((i) => i.unit === ing.unit) ?? own[0];
      if (hit) ingredients.push({ ...ing, qty: fitQty(ing, hit), unit: hit.unit, inFridge: true });
      else if (PANTRY.includes(ing.name)) ingredients.push({ ...ing, inFridge: false });
      else missing.add(ing.name);
    }
    return { ...m, ingredients, missing: [...missing] };
  });
}

export function buildPrompt(items: Item[], diet?: string) {
  const list = items.map((i) => `- ${i.name} (${i.qty} ${i.unit})${i.urgent ? " [urgent]" : ""}`).join("\n");
  return `คุณคือผู้ช่วยทำอาหารไทยในบ้าน เสนอเมนูง่าย ๆ 3 เมนูจากของในตู้เย็นนี้
ของในตู้เย็น (ชื่อ (จำนวนที่มี หน่วย)) ของที่มี [urgent] คือใกล้หมดอายุ:
${list}
ของในครัวที่มีเสมอ: ${PANTRY.join(", ")}
${diet ? `ข้อจำกัดด้านอาหาร: ${diet}\n` : ""}กติกา:
- คิดเมนูจากของอะไรก็ได้ในตู้ ไม่จำเป็นต้องใช้ของ [urgent] ถ้าใส่ของ [urgent] ได้อย่างลงตัวก็ดี และใส่ชื่อของ [urgent] ที่ใช้ใน uses_urgent (ไม่ได้ใช้ก็ให้เป็น [])
- ingredients ของจากตู้ใช้ชื่อให้ตรงกับรายการด้านบนทุกตัวอักษร ใช้หน่วยเดียวกับในตู้ และ qty ไม่เกินที่มี ส่วนของในครัวใช้หน่วยทำอาหารปกติ
- ของที่ไม่มีในตู้และไม่ใช่ของในครัว ใส่ใน missing เท่านั้น (ไม่เกิน 2 อย่าง)
- difficulty เป็น "ง่าย" "ปานกลาง" หรือ "ยาก" · minutes เป็นจำนวนเต็ม · steps สั้น กระชับ ไม่เกิน 10 ขั้น แต่ละขั้นเป็น object: text (ภาษาไทย บอกสิ่งที่ทำจริง ๆ), action (prep ล้าง/เตรียม, cut หั่น/สับ, mix ผสม/หมัก, fry ผัด/ทอด, boil ต้ม/ลวก, steam นึ่ง, bake อบ/ย่าง, season ปรุงรส, rest พัก/รอ, serve จัดเสิร์ฟ), heat (low/medium/high เฉพาะขั้นที่ใช้ไฟ), minutes (เวลาของขั้นนั้น เป็นจำนวนเต็ม ถ้ามี)
- ingredients ทุกตัว รวมของในครัว ต้องระบุ qty และ unit ที่ชัดเจน เช่น น้ำปลา 1 ช้อนโต๊ะ, กระเทียม 3 กลีบ, ไข่ไก่ 2 ฟอง
- ตอบเป็นภาษาไทย`;
}

// Fallback chain: Gemini often 503s on one model while another is fine; free tier is 20 req/day/model (429). Not gemini-flash-latest (shares 3.8's quota).
const models = () => [...new Set([process.env.GEMINI_MODEL?.trim(), "gemini-3.8-flash", "gemini-flash-lite-latest", "gemini-3.1-flash-lite-preview", "gemini-3-flash-preview"].filter(Boolean) as string[])];

// Gemini's own schema (OpenAPI subset) — guides the model; Zod above is the real gate.
const S = { type: "STRING" };
const LIST = { type: "ARRAY", items: S };
const responseSchema = {
  type: "OBJECT",
  required: ["menus"],
  properties: {
    menus: {
      type: "ARRAY",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "OBJECT",
        required: ["name", "uses_urgent", "ingredients", "missing", "minutes", "difficulty", "steps"],
        properties: {
          name: S,
          uses_urgent: LIST,
          ingredients: {
            type: "ARRAY",
            items: { type: "OBJECT", required: ["name", "qty", "unit"], properties: { name: S, qty: { type: "NUMBER" }, unit: S } },
          },
          missing: { ...LIST, maxItems: 2 },
          minutes: { type: "INTEGER" },
          difficulty: { type: "STRING", enum: ["ง่าย", "ปานกลาง", "ยาก"] },
          steps: {
            type: "ARRAY",
            maxItems: 10,
            items: {
              type: "OBJECT",
              required: ["text", "action"],
              properties: { text: S, action: { type: "STRING", enum: [...ACTIONS] }, heat: { type: "STRING", enum: ["low", "medium", "high"], nullable: true }, minutes: { type: "INTEGER", nullable: true } },
            },
          },
        },
      },
    },
  },
};

/** Server only. 3 menus from anything in the fridge (urgent items are a bonus), or an error: "quota" = every model hit its daily 429, "busy" = anything else. Worst case ~25s. */
export async function suggestMenus(items: Item[], diet?: string): Promise<{ menus: Menu[] } | { error: "quota" | "busy" }> {
  const key = process.env.GEMINI_API_KEY?.trim(); // Vercel value had a leading \r
  if (!key) return { error: "busy" };
  const body = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(items, diet) }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema, thinkingConfig: { thinkingLevel: "minimal" } }, // thinking made calls ~20s; all 4 models accept minimal
  });
  const start = Date.now();
  let why = "", backoff = 0, quota = 0, tried = 0;
  for (const model of models()) {
    if (Date.now() - start > 12000) break;
    if (backoff) await new Promise((r) => setTimeout(r, backoff * 1000));
    tried++;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, body, signal: AbortSignal.timeout(12000) });
      why = `${res.status} ${model}`;
      if (res.status === 429) { quota++; continue; } // daily quota: next model now, no backoff
      if (!res.ok) { backoff++; continue; }
      const json = await res.json();
      const menus = parseMenus(json?.candidates?.[0]?.content?.parts?.[0]?.text);
      if (menus) return { menus: normalize(menus, items) };
      why = `bad output ${model}`;
    } catch {
      why = `network/timeout ${model}`;
      backoff++;
    }
  }
  console.warn("suggestMenus gave up:", why);
  return { error: quota === tried ? "quota" : "busy" };
}
