// Contre-revue FUT-149, option A de R3 : les lectures qui changent entre deux versions (lib + édition chacune), sur
// les 14 958 positions de `egalite.mts` (toutes les cellules, six positions dont les bords et les coins).
//   node diff_classif.mts <worktree A> <édition A> <worktree B> <édition B> <sortie.json>
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const [WA, EA, WB, EB, OUT] = process.argv.slice(2);
const charger = async (w: string, ed: string) => {
  const lib = await import(`${w}/src/lib/debroussaillement.ts`);
  const man = JSON.parse(readFileSync(`${ed}/manifest.json`, "utf8"));
  const cache = new Map();
  const tuile = (k: string) => { if (!cache.has(k)) cache.set(k, JSON.parse(gunzipSync(readFileSync(`${ed}/t/${k}.json.gz`)).toString())); return cache.get(k); };
  return (e: unknown) => lib.lireDebroussaillement(man, new Map(lib.tuilesALire(man, e).map((k: string) => [k, tuile(k)])), e);
};
const [la, lb] = [await charger(WA, EA), await charger(WB, EB)];
const man = JSON.parse(readFileSync(`${EA}/manifest.json`, "utf8"));
const resume = (r: { etat: string; limite: { distanceM: number | null } | null; zone: { departement: string } | null }) => `${r.etat}${r.etat === "en_limite" ? (r.limite?.distanceM == null ? "·dedans" : "·dehors") : ""}`;
let n = 0;
const changes: Record<string, number> = {};
const points: unknown[] = [];
for (const k of Object.keys(man.tuiles)) {
  const [ix, iy] = k.split("_").map(Number);
  for (const [fx, fy] of [[0.5, 0.5], [0.0003, 0.5], [0.5, 0.9997], [0.0003, 0.0003], [0.9999, 0.3], [0.2, 0.0001]]) {
    const e = { point: [(ix + fx) / 10, (iy + fy) / 10] as [number, number], geocodage: null, insee: "83000", parcelle: null };
    const [a, b] = [la(e), lb(e)];
    n++;
    if (resume(a) !== resume(b) || a.limite?.distanceM !== b.limite?.distanceM) {
      const c = `${resume(a)} → ${resume(b)}`;
      changes[c] = (changes[c] ?? 0) + 1;
      points.push({ lon: e.point[0], lat: e.point[1], avant: resume(a), apres: resume(b), distAvant: a.limite?.distanceM ?? null, distApres: b.limite?.distanceM ?? null });
    }
  }
}
writeFileSync(OUT, JSON.stringify(points));
console.log(JSON.stringify({ lectures: n, changees: points.length, changes }));
