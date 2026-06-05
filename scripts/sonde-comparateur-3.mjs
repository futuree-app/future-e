// Sonde du révélateur d'arbitrages : pour des projets réels, imprime par commune
// l'identite (promesse), les 2 forces (reason confirmation + signal découverte) et
// le compromis. Sert à calibrer la table d'archétypes et les phrases de compromis.
// Usage : node scripts/sonde-comparateur-3.mjs
const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

const PROJETS = [
  "Un coin calme près de la mer pour ma retraite, avec de bons médecins.",
  "Je cherche une petite ville vivante avec une gare et un climat supportable l'été.",
  "Élever mes enfants dans un environnement sain, sans être isolé des services.",
  "Vivre sans voiture, dans une ville qui attire de nouveaux habitants.",
  "Rester dans le Sud sans subir les canicules, près de la nature.",
];

async function probe(text) {
  const pr = await fetch(`${BASE}/api/comparateur-vie/parse`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!pr.ok) return { text, error: `parse ${pr.status}` };
  const { parsed } = await pr.json();
  const mr = await fetch(`${BASE}/api/comparateur-vie/match`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ parsed }),
  });
  if (!mr.ok) return { text, error: `match ${mr.status}` };
  const out = await mr.json();
  return { text, top: (out.results ?? []).slice(0, 3) };
}

async function main() {
  for (const text of PROJETS) {
    const r = await probe(text);
    console.log("\n==================================================");
    console.log("PROJET » " + r.text);
    if (r.error) { console.log("  ERREUR:", r.error); continue; }
    for (const c of r.top) {
      console.log(`\n  ${c.nom}`);
      console.log(`    identité : ${c.identite}`);
      console.log(`    force 1  : ${c.reasons?.[0] ?? "(aucune)"}`);
      console.log(`    découv.  : ${c.decouverte ?? "(aucune)"}`);
      console.log(`    compromis: ${c.compromis}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
