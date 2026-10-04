// Lists public/ingredients/<id>.svg|.png into lib/ingredients-manifest.json so the app
// only requests files that exist (zero 404s). Runs from predev/prebuild.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../public/ingredients/", import.meta.url);
const out = new URL("../lib/ingredients-manifest.json", import.meta.url);
const map = {};
for (const f of readdirSync(dir).sort()) {
  const m = f.match(/^([a-z0-9-]+)\.(svg|png)$/);
  if (m && map[m[1]] !== "svg") map[m[1]] = m[2]; // .svg wins over .png
}
const json = JSON.stringify(map, null, 2) + "\n";
let prev = "";
try {
  prev = readFileSync(out, "utf8");
} catch {}
if (json !== prev) writeFileSync(out, json);
console.log(`ingredients manifest: ${Object.keys(map).length} file(s)`);
