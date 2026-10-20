// FUT-118 · COMPARER DEUX EMPREINTES VISUELLES (avant / après un lot).
// Usage : node scripts/fut118/comparer-empreintes.mjs <avant> <après> [rapport.md]
// Pour chaque capture : dimensions, nombre de pixels différents (tolérance 0) ; pour chaque page :
// éléments ajoutés, retirés, et propriétés calculées qui diffèrent. Code de sortie 1 si un écart existe.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const [avant, apres, rapport] = process.argv.slice(2);
const lignes = ["| Page | Pixels différents | Éléments | Propriétés différentes |", "| --- | --- | --- | --- |"];
let ecarts = 0;
const details = [];
for (const f of readdirSync(avant).filter((n) => n.endsWith(".png")).sort()) {
  const id = f.replace(/\.png$/, "");
  const [a, b] = await Promise.all([avant, apres].map((d) => sharp(`${d}/${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  let pixels;
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    pixels = `dimensions ${a.info.width}×${a.info.height} → ${b.info.width}×${b.info.height}`;
    ecarts++;
  } else {
    let n = 0;
    for (let i = 0; i < a.data.length; i += 4) {
      if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2] || a.data[i + 3] !== b.data[i + 3]) n++;
    }
    pixels = `${n} / ${a.info.width * a.info.height}`;
    if (n) ecarts++;
  }
  const ja = JSON.parse(readFileSync(`${avant}/${id}.json`, "utf8"));
  const jb = JSON.parse(readFileSync(`${apres}/${id}.json`, "utf8"));
  const ia = new Map(ja.map((e) => [e.k, e]));
  const ib = new Map(jb.map((e) => [e.k, e]));
  let diffs = 0;
  for (const [k, ea] of ia) {
    const eb = ib.get(k);
    if (!eb) { diffs++; details.push(`${id} · retiré · ${k}`); continue; }
    for (const p of Object.keys(ea)) {
      if (p === "k") continue;
      if (JSON.stringify(ea[p]) !== JSON.stringify(eb[p])) { diffs++; if (details.length < 400) details.push(`${id} · ${k} · ${p} : ${JSON.stringify(ea[p])} → ${JSON.stringify(eb[p])}`); }
    }
  }
  for (const k of ib.keys()) if (!ia.has(k)) { diffs++; details.push(`${id} · ajouté · ${k}`); }
  if (diffs) ecarts++;
  lignes.push(`| ${id} | ${pixels} | ${ja.length} → ${jb.length} | ${diffs} |`);
}
const texte = `${lignes.join("\n")}\n\n${details.length ? `Écarts (400 premiers) :\n\n${details.map((d) => `- ${d}`).join("\n")}\n` : "Aucun écart.\n"}`;
if (rapport) writeFileSync(rapport, texte);
console.log(texte);
process.exit(ecarts ? 1 : 0);
