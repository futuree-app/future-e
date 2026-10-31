// FUT-149, 31/10/2026 · § 1 : lit, avec la VRAIE lib, le centre de chaque micro-trou construit par
// `micro_trous_monde.py`. Vérité : le point est STRICTEMENT hors zone, à moins de 25 mm de la zone → l'état juste
// est « en_limite » (point_proche). Dangereux : « en_zone ».
//   node micro_trous_lire.mts <worktree> <dossier>
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const [W, D] = process.argv.slice(2);
const { lireDebroussaillement } = await import(`${W}/src/lib/debroussaillement.ts`);
const ed = `${D}/2026-03-01`;
const man = JSON.parse(readFileSync(`${ed}/manifest.json`, "utf8"));
const charge = new Map(Object.keys(man.tuiles).filter((k) => !("plein" in man.tuiles[k])).map((k) => [k, JSON.parse(gunzipSync(readFileSync(`${ed}/t/${k}.json.gz`)).toString())]));
const trous: { lon: number; lat: number; largeurMm: number; forme: string }[] = JSON.parse(readFileSync(`${D}/trous.json`, "utf8"));
const bilan: Record<string, Record<string, number>> = {};
const dangereux: unknown[] = [];
for (const t of trous) {
  const l = lireDebroussaillement(man, charge, { point: [t.lon, t.lat], geocodage: "housenumber", insee: "83065", parcelle: null });
  const etat = l.statut === "indisponible" ? "INDISPONIBLE" : `${l.etat}${l.limite ? `(${l.limite.distanceM == null ? "dans la zone" : "à " + l.limite.distanceM + " m"})` : ""}`;
  const cle = `${t.largeurMm} mm`;
  (bilan[cle] ??= {})[etat] = (bilan[cle][etat] ?? 0) + 1;
  if (l.etat === "en_zone") dangereux.push(t);
}
console.log(JSON.stringify({ trous: trous.length, cellules: Object.keys(man.tuiles).length, bilan, dangereux: dangereux.length, exemples: dangereux.slice(0, 5) }, null, 1));
