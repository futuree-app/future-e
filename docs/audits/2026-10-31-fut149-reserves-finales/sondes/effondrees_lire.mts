// FUT-149, 31/10/2026 · § 1 : lit les points d'épreuve des limites effacées avec la VRAIE lib sur l'édition
// nationale construite. État juste à moins de 50 m d'un bord : « en_limite ». Dangereux : un point hors zone lu
// « en_zone », ou un point dans une zone lu « hors_zone ».
//   node effondrees_lire.mts <worktree> <édition> <points.json>
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const [W, ED, P] = process.argv.slice(2);
const { lireDebroussaillement, tuilesALire } = await import(`${W}/src/lib/debroussaillement.ts`);
const man = JSON.parse(readFileSync(`${ED}/manifest.json`, "utf8"));
const cache = new Map<string, unknown>();
const pts = JSON.parse(readFileSync(P, "utf8"));
let dangereux = 0;
for (const p of pts) {
  // Le département n'importe pas ici : on prend un code couvert du manifeste pour ne pas tomber en « non couvert ».
  const e = { point: [p.lon, p.lat] as [number, number], geocodage: "housenumber", insee: `${man.couverture[0]}001`, parcelle: null };
  const charge = new Map(tuilesALire(man, e).map((k: string) => {
    if (!cache.has(k)) cache.set(k, JSON.parse(gunzipSync(readFileSync(`${ED}/t/${k}.json.gz`)).toString()));
    return [k, cache.get(k)];
  }));
  const l = lireDebroussaillement(man, charge, e);
  const etat = `${l.etat}${l.limite ? `(${l.limite.distanceM == null ? "dans la zone" : "à " + l.limite.distanceM + " m"})` : ""}`;
  const danger = (!p.veriteDedans && l.etat === "en_zone") || (p.veriteDedans && l.etat === "hors_zone");
  if (danger) dangereux++;
  console.log(`${danger ? "DANGER" : "ok    "} #${p.k} ${p.cellule} ${p.nature} ${p.essai} vérité ${p.veriteDedans ? "dedans" : "dehors"} à ${p.distanceBordMm} mm du bord → ${etat}`);
}
console.log(`\n${pts.length} points, ${dangereux} lectures dangereuses`);
