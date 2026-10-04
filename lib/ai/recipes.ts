import { z } from "zod";

/** Staples assumed to be in every Thai kitchen: usable in menus, never deducted, never "missing". */
export const PANTRY = ["ข้าวสวย", "ข้าวสาร", "น้ำ", "น้ำมันพืช", "เกลือ", "น้ำตาล", "น้ำปลา", "ซีอิ๊วขาว", "ซอสหอยนางรม", "พริกไทย", "กระเทียม"];

const menuSchema = z.object({
  name: z.string().trim().min(1).max(80),
  uses_urgent: z.array(z.string().trim().min(1)),
  ingredients: z.array(z.object({ name: z.string().trim().min(1), qty: z.number().positive(), unit: z.string().trim().min(1) })).min(1),
  missing: z.array(z.string().trim().min(1)).max(2),
  minutes: z.number().int().positive().max(600),
  difficulty: z.enum(["ง่าย", "ปานกลาง", "ยาก"]),
  steps: z.array(z.string().trim().min(1)).min(1).max(12),
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

/** Anything the AI used that is neither in the fridge nor a pantry staple goes to `missing`; fridge items get the fridge's unit. */
export function normalize(menus: z.infer<typeof menuSchema>[], items: Item[]): Menu[] {
  return menus.map((m) => {
    const missing = new Set(m.missing);
    const ingredients: Menu["ingredients"] = [];
    for (const ing of m.ingredients) {
      const own = items.filter((i) => i.name === ing.name);
      const hit = own.find((i) => i.unit === ing.unit) ?? own[0];
      if (hit) ingredients.push({ ...ing, unit: hit.unit, inFridge: true });
      else if (PANTRY.includes(ing.name)) ingredients.push({ ...ing, inFridge: false });
      else missing.add(ing.name);
    }
    return { ...m, ingredients, missing: [...missing] };
  });
}

export function buildPrompt(items: Item[], diet?: string) {
  const list = items.map((i) => `- ${i.name} (${i.qty} ${i.unit})${i.urgent ? " [urgent]" : ""}`).join("\n");
  return `คุณคือผู้ช่วยทำอาหารไทยในบ้าน เสนอเมนูง่าย ๆ 3 เมนูจากของในตู้เย็นนี้
ของในตู้เย็น (ชื่อ (จำนวนที่มี หน่วย)) ของที่มี [urgent] ใกล้หมดอายุ ต้องใช้ก่อน:
${list}
ของในครัวที่มีเสมอ: ${PANTRY.join(", ")}
${diet ? `ข้อจำกัดด้านอาหาร: ${diet}\n` : ""}กติกา:
- ทุกเมนูควรใช้ของ [urgent] อย่างน้อย 1 อย่าง ถ้ามี และใส่ชื่อของ [urgent] ที่ใช้ใน uses_urgent
- ingredients ใช้ชื่อให้ตรงกับรายการด้านบนทุกตัวอักษร ใช้หน่วยเดียวกับในตู้ และ qty ไม่เกินที่มี
- ของที่ไม่มีในตู้และไม่ใช่ของในครัว ใส่ใน missing เท่านั้น (ไม่เกิน 2 อย่าง)
- difficulty เป็น "ง่าย" "ปานกลาง" หรือ "ยาก" · minutes เป็นจำนวนเต็ม · steps สั้น กระชับ ไม่เกิน 8 ขั้น
- ตอบเป็นภาษาไทย`;
}

// gemini-2.5-flash now 404s for new keys ("no longer available to new users"); Google points to 3.8-flash.
const model = () => process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

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
          steps: LIST,
        },
      },
    },
  },
};

/** Server only. 3 menus that use urgent items first, or null after one retry ("AI ไม่ว่าง"). */
export async function suggestMenus(items: Item[], diet?: string): Promise<Menu[] | null> {
  const key = process.env.GEMINI_API_KEY?.trim(); // Vercel value had a leading \r
  if (!key) return null;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(items, diet) }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema },
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent`, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key }, body });
      if (!res.ok) continue;
      const json = await res.json();
      const menus = parseMenus(json?.candidates?.[0]?.content?.parts?.[0]?.text);
      if (menus) return normalize(menus, items);
    } catch {}
  }
  return null;
}
