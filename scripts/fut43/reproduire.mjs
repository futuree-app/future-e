// FUT-43 : snapshot Territoire réel (sans modèle) pour quelques communes. Usage : node scripts/fut43/reproduire.mjs <sortie.json>
import { createJiti } from "jiti";
import { writeFileSync } from "node:fs";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const { loadTerritoireSnapshot } = await jiti.import(racine + "src/lib/server/territoire-snapshot.ts");
const { screenFromSnapshot } = await jiti.import(racine + "src/lib/territoire/screen.ts");
const { projectForSynthesis } = await jiti.import(racine + "src/lib/territoire/synthesis-contract.ts");
const { deterministicSynthesis } = await jiti.import(racine + "src/lib/territoire/synthesis-deterministe.ts");
const out = {};
for (const [insee, nom] of [["75056", "Paris"], ["69123", "Lyon"], ["13055", "Marseille"], ["31555", "Toulouse"]]) {
  const s = await loadTerritoireSnapshot(insee, nom);
  const faits = Object.fromEntries((s.facts ?? []).map((f) => [f.key, f.value === null || f.value === undefined ? null : f.value]));
  const synth = deterministicSynthesis(projectForSynthesis(s, "gwl20"), "gwl20");
  out[nom] = { hash: s.hash, faits, synthese: synth };
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
