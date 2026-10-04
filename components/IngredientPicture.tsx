import { blockLabel, catalogExact, pictureId, type Category, type PictureSize } from "@/lib/catalog";
import manifest from "@/lib/ingredients-manifest.json";

const FILES = manifest as Record<string, "svg" | "png">;

// Block colours only (never status). Ink on bg ≥ 6.4:1.
const COLORS: Record<Category, [bg: string, ink: string]> = {
  veg: ["#D9F2D4", "#1F5A2A"],
  fruit: ["#FFE2C4", "#7A3A05"],
  meat: ["#FADCD3", "#7E2A16"],
  seafood: ["#D3F0EC", "#0E5A52"],
  dairy_egg: ["#E4ECFF", "#24468C"],
  drink: ["#D8F1FA", "#13506A"],
  sauce: ["#EFDFD2", "#5E2A12"],
  cooked: ["#DCEFE6", "#075F47"],
  other: ["#ECE9E4", "#45403A"],
};
const TYPE = { 48: [14, 14], 56: [16, 15], 64: [18, 16], 72: [20, 18], 80: [22, 19], 96: [26, 22] } as const; // radius, font px

/** Art file path if one exists (from the build-time manifest, so no 404 probing), else null. */
export function pictureFile(name: string, category: Category) {
  const id = pictureId(name, category);
  const cat = `cat-${category.replace("_", "-")}`;
  for (const k of [id, cat]) if (FILES[k]) return `/ingredients/${k}.${FILES[k]}`;
  return null;
}

/**
 * The single way an ingredient is drawn: the user's art (public/ingredients/<id>.svg|png,
 * then the category's cat-<category> file), else an outlined text-block sticker.
 * Decorative: the accessible name lives on the parent control.
 */
export function IngredientPicture({
  name,
  category,
  size,
  className = "",
}: {
  name: string;
  category: Category;
  size: PictureSize;
  className?: string;
}) {
  const src = pictureFile(name, category);
  if (src)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny local art, next/image adds nothing here
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`shrink-0 object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  // Lots saved as "อื่น ๆ" still get their catalog colour, so the fridge isn't all grey.
  const tint = category === "other" ? (catalogExact(name)?.category ?? category) : category;
  const [bg, ink] = COLORS[tint] ?? COLORS.other;
  const [radius, font] = TYPE[size];
  return (
    <span
      aria-hidden="true"
      data-size={size}
      className={`sticker shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: font,
        ["--st-bg" as string]: bg,
        ["--st-ink" as string]: ink,
      }}
    >
      <span>
        {blockLabel(name, size).map((l, i) => (
          <span key={i} className="block whitespace-nowrap">
            {l}
          </span>
        ))}
      </span>
    </span>
  );
}
