// FUT-33 : contrôle de fermeture sur le VRAI moteur (src/lib/comparateur-vie.ts, chargé hors du site par jiti),
// le vrai index et le vrai parseur. Lecture seule ; aucun appel à la base.
// Usage (racine du dépôt) : node scripts/mer/smoke-fermeture.mjs <.env contenant ANTHROPIC_API_KEY>
import { createJiti } from "jiti";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../../src/", import.meta.url));
const ici = fileURLToPath(new URL("./etude-courbe/", import.meta.url));
const jiti = createJiti(import.meta.url, { alias: { "server-only": ici + "vide.mjs", "@/": src } });
const vie = await jiti.import(src + "lib/comparateur-vie.ts");
const hc = await jiti.import(src + "lib/hard-constraints.ts");
const hydr = await jiti.import(src + "lib/hard-constraints-hydrate.ts");
const attrs = await jiti.import(src + "lib/commune-attributes.ts");
const rivage = await jiti.import(src + "lib/mer-rivage.ts");
const { parserReel } = await jiti.import(fileURLToPath(new URL("./parseur-reel.mts", import.meta.url)));

const index = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const par = new Map(index.map((c) => [c.insee, c]));
const dir = { byName: () => null, plmByName: () => null };
const ctx = (h, c, adresse) => ({ constraints: hydr.hydrateHardConstraints(h, dir), point: adresse ? { ...adresse, grain: "address", source: "address_geocoder", label: "adresse" } : { lat: c.lat, lon: c.lon, grain: "commune_reference", source: "commune_centroid", label: c.nom }, ...(adresse ? { merAuPoint: adresse.mer } : {}), conventionsVersion: hc.PRODUCT_CONVENTIONS_VERSION });
const phrase = (a) => a.statement ?? `${a.status}${a.observedLabel ? " · " + a.observedLabel : ""}`;

console.log("── Communes");
for (const insee of ["22113", "14118", "33063", "13004", "11262"]) {
  const c = par.get(insee), a = attrs.communeAttributesFrom(c, null);
  console.log(`${c.nom} : centre ${c.mer_centre_km} km, loi ${JSON.stringify(c.loi_effective)}, façade ${c.mer_facade ?? "—"}, catégories ${vie.deriveCategoriesFromEntry(c).filter((x) => /littoral|medit/.test(x)).join(", ") || "aucune"}`);
  console.log(`   « à moins de 10 km » : ${phrase(hc.evaluateNearSea(ctx({ nearSea: { active: true, maxKm: 10 } }, c), a))}`);
  console.log(`   « pas le littoral »  : ${phrase(hc.evaluateExcludeSea(ctx({ excludeSea: true }, c), a))}`);
}

console.log("\n── Châtelaillon-Plage, deux adresses (rivage 5 m)");
const brut = gunzipSync(readFileSync("data/mer/rivage-5m.f32.gz"));
const seg = new Float32Array(brut.byteLength / 4); new Uint8Array(seg.buffer).set(brut);
const idx = rivage.construireIndexRivage(seg);
const chat = par.get("17094");
for (const [nom, lat, lon] of [["front de mer", 46.0745, -1.0915], ["est de la commune", 46.0790, -1.0640]]) {
  const km = rivage.distanceAuRivageKm(idx, lat, lon);
  const mer = { status: "measured", km, grain: "address", version: "mer-v2" };
  const a = hc.evaluateNearSea(ctx({ nearSea: { active: true, maxKm: 1 } }, chat, { lat, lon, mer }), attrs.communeAttributesFrom(chat, null));
  console.log(`${nom} : ${km.toFixed(2)} km ; « à moins de 1 km » : ${phrase(a)}`);
}

console.log("\n── Où vivre (vrai parseur, vrai moteur)");
for (const texte of ["Une petite ville près de la mer.", "Je veux vivre loin de la mer, au calme.", "Pas sur le littoral, une ville moyenne."]) {
  const parsed = await parserReel(texte, process.argv[2]);
  const out = await vie.matchProjects(parsed);
  console.log(`« ${texte} » → ${JSON.stringify({ hc: parsed.hardConstraints, prefs: parsed.preferences.map((p) => `${p.key}:${p.weight}`) })}`);
  for (const r of out.results) {
    const c = par.get(r.insee);
    console.log(`   ${r.nom} (${r.dept}) · centre ${c.mer_centre_km} km · loi ${JSON.stringify(c.loi_effective)} · raisons : ${r.reasons.join(" ; ")}`);
  }
  if (out.appliedPlaces) console.log(`   périmètre : ${out.appliedPlaces.join(" | ")}`);
  if (out.unappliedConstraints) console.log(`   non appliqué : ${out.unappliedConstraints.join(" | ")}`);
}
