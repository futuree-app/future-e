// FUT-45 : la couverture d'un dossier, sur la VRAIE chaîne (parseur réel → buildCommuneDossier → conclusion).
// Lecture seule (aucune base). Usage (racine du dépôt) : node scripts/fut45/reproduire.mjs <.env> "<texte>" <insee> [...]
import { createJiti } from "jiti";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const tf = await jiti.import(racine + "src/lib/decision/territory-facts.ts");
const up = await jiti.import(racine + "src/lib/user-project.ts");
const { parserReel } = await jiti.import(racine + "scripts/fut45/parseur-reel.mts");
const [env, texte, ...insees] = process.argv.slice(2);
const parsed = await parserReel(texte, env);
console.log(`« ${texte} »`);
console.log(`  compris : préférences ${JSON.stringify(parsed.preferences.map((p) => `${p.key}:${p.weight}`))} · contraintes ${JSON.stringify(parsed.hardConstraints)} · horsMesure ${JSON.stringify(parsed.horsMesure ?? [])}`);
const project = up.normalizeUserProject({ posture: "recherche", intent: null, rawText: texte, parsed, updatedAt: "2026-10-03T00:00:00.000Z" });
for (const insee of insees) {
  const r = await tf.buildCommuneDossier(insee, project);
  if (!r) { console.log(`  ${insee} : pas de dossier`); continue; }
  const d = r.dossier, v = d.narrativePlan.verdict;
  console.log(`  ${r.moduleFacts.nom} : couverture ${d.criteria.coverage} · orientation ${d.criteria.orientation}`);
  for (const c of d.criteria.registry) console.log(`     - ${c.label} : ${c.coverage}/${c.outcome}/${c.capability}${c.unexaminedReason ? " (" + c.unexaminedReason + ")" : ""}`);
  console.log(`     verdict [${v.label}] ${v.headline.text ?? v.headline} | ${v.detail}`);
  console.log(`     conclusion : ${(d.conclusion ?? "").slice(0, 400)}`);
}
