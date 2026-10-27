// Compare, adresse par adresse, la lecture de la mesure du 27/10 (code e3f347a1, rejoué sur e73ec075)
// à celle du code corrigé. Les API sont vivantes : un écart peut venir de la donnée, il est alors dit.
// Usage : node comparer-mesures.mjs <avant.json> <apres.json>
import { readFileSync } from "node:fs";
const [av, ap] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, "utf8")).resultats);
const resume = (l) => l && ({
  statut: l.statut, grain: l.grain, ambiguites: l.ambiguites,
  zones: l.zones.map((z) => `${z.libelle} ${z.part}`), enLimite: l.zonesEnLimite.map((z) => `${z.libelle} ${z.surfaceM2}`),
  nonMesurables: l.zonesNonMesurables,
  prescriptions: l.prescriptions.map((p) => `${p.categorie}:${p.etendue}:${p.part}:${p.surfaceM2 ?? p.longueurM}`),
  contact: l.prescriptionsContact,
});
for (const a of av) {
  const b = ap.find((x) => x.id === a.id);
  const [ra, rb] = [resume(a.lecture), resume(b?.lecture)];
  const diff = Object.keys(ra ?? {}).filter((k) => JSON.stringify(ra[k]) !== JSON.stringify(rb?.[k]));
  console.log(`${a.id.padEnd(28)} ${diff.length === 0 ? "identique" : diff.map((k) => `${k}: ${JSON.stringify(ra[k])} → ${JSON.stringify(rb?.[k])}`).join(" | ")}`);
}
