// FUT-179 : snapshot Territoire réel (sans modèle) des trois villes, d'arrondissements et d'un témoin.
// Usage : node scripts/fut179/reproduire.mjs <sortie.json>
import { createJiti } from "jiti";
import { writeFileSync } from "node:fs";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const { loadTerritoireSnapshot } = await jiti.import(racine + "src/lib/server/territoire-snapshot.ts");
const { projectForSynthesis } = await jiti.import(racine + "src/lib/territoire/synthesis-contract.ts");
const { deterministicSynthesis } = await jiti.import(racine + "src/lib/territoire/synthesis-deterministe.ts");
const { buildTerritoryIdentity } = await jiti.import(racine + "src/lib/territory-identity.ts");
const CAS = [["75056", "Paris"], ["69123", "Lyon"], ["13055", "Marseille"], ["75111", "Paris 11e Arrondissement"], ["75116", "Paris 16e Arrondissement"],
  ["69381", "Lyon 1er Arrondissement"], ["13209", "Marseille 9e Arrondissement"], ["13216", "Marseille 16e Arrondissement"], ["31555", "Toulouse"]];
const out = {};
for (const [insee, nom] of CAS) {
  const s = await loadTerritoireSnapshot(insee, nom);
  const f = (k) => s.facts.find((x) => x.key === k);
  const d = f("place.density");
  out[insee] = {
    nom, hash: s.hash,
    densite: { value: d.value, status: d.status, source: d.source, limits: d.limits ?? null, provenance: d.provenance ?? null },
    categorie: s.derived.find((x) => x.key === "density.category") ?? null,
    sols: { composition: f("land.composition")?.value ?? null, statut: f("land.composition")?.status },
    identite: buildTerritoryIdentity(s),
    synthese: deterministicSynthesis(projectForSynthesis(s, "gwl20"), "gwl20").split("\n\n").slice(1, 3).join("\n"),
  };
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
