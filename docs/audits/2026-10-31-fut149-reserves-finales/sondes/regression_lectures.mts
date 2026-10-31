// FUT-149, 31/10/2026 · § 1 : NON-RÉGRESSION du correctif des limites ponctuelles. Lit les mêmes points sur deux
// éditions nationales (avant / après le correctif) avec la VRAIE lib, et classe chaque changement de lecture.
// Points : 10 tirés au hasard dans chaque cellule qui a un fichier (graine fixe), 2 000 dans chacune des cellules
// modifiées, et 400 dans un rayon de 60 m autour de chaque limite ponctuelle.
//   node regression_lectures.mts <worktree> <édition avant> <édition après> <effondrees.json>
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const [W, A, B, EFF] = process.argv.slice(2);
const { lireDebroussaillement, tuilesALire } = await import(`${W}/src/lib/debroussaillement.ts`);
const charger = (ed: string) => {
  const man = JSON.parse(readFileSync(`${ed}/manifest.json`, "utf8"));
  const cache = new Map<string, unknown>();
  return { man, tuile: (k: string) => { if (!cache.has(k)) cache.set(k, JSON.parse(gunzipSync(readFileSync(`${ed}/t/${k}.json.gz`)).toString())); return cache.get(k); } };
};
const [ea, eb] = [charger(A), charger(B)];
let graine = 149;
const alea = () => { graine = (graine * 1103515245 + 12345) % 2 ** 31; return graine / 2 ** 31; };
const changees = readdirSync(`${A}/t`).filter((f) => !readFileSync(`${A}/t/${f}`).equals(readFileSync(`${B}/t/${f}`))).map((f) => f.replace(".json.gz", ""));
const pts: [number, number, string][] = [];
for (const k of Object.keys(ea.man.tuiles)) {
  const [ix, iy] = k.split("_").map(Number);
  const n = changees.includes(k) ? 2000 : 10;
  for (let i = 0; i < n; i++) pts.push([(ix + alea()) / 10, (iy + alea()) / 10, changees.includes(k) ? "cellule modifiée" : "national"]);
}
for (const o of JSON.parse(readFileSync(EFF, "utf8")).effondrees) {
  for (let i = 0; i < 400; i++) {
    const r = 60 * Math.sqrt(alea()), a = 2 * Math.PI * alea();
    pts.push([o.lon + (r * Math.cos(a)) / (111_320 * Math.cos((o.lat * Math.PI) / 180)), o.lat + (r * Math.sin(a)) / 111_132, "60 m d'une limite ponctuelle"]);
  }
}
const etat = (l: { statut: string; etat: string; limite: { distanceM: number | null } | null; part: number | null }) =>
  l.statut === "indisponible" ? "indisponible" : `${l.etat}${l.limite ? (l.limite.distanceM == null ? "(dans la zone)" : `(à ${l.limite.distanceM} m)`) : ""}`;
const bilan: Record<string, number> = {};
const changements: Record<string, number> = {};
for (const [lon, lat, groupe] of pts) {
  const e = { point: [lon, lat] as [number, number], geocodage: "housenumber", insee: `${ea.man.couverture[0]}001`, parcelle: null };
  const lire = (x: typeof ea) => lireDebroussaillement(x.man, new Map(tuilesALire(x.man, e).map((k: string) => [k, x.tuile(k)])), e);
  const [la, lb] = [etat(lire(ea)), etat(lire(eb))];
  bilan[groupe] = (bilan[groupe] ?? 0) + 1;
  if (la !== lb) { const c = `${groupe} : ${la} → ${lb}`; changements[c] = (changements[c] ?? 0) + 1; }
}
console.log(JSON.stringify({ cellulesModifiees: changees, points: pts.length, parGroupe: bilan, changements }, null, 1));
