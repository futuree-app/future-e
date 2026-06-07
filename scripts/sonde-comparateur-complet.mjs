// Sonde de la comparaison complète : pour des projets réels, imprime le chapeau et,
// par thème, la phrase de synthèse puis chaque dimension (palier par commune + avantage).
// Sert à calibrer les paliers incarnés et la règle d'égalité avec le porteur.
// Prérequis : npm run dev (port 3000). Usage : node scripts/sonde-comparateur-complet.mjs
const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

const PROJETS = [
  "Un coin calme près de la mer pour ma retraite, avec de bons médecins.",
  "Je cherche une petite ville vivante avec une gare et un climat supportable l'été.",
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
  return { text, cc: out.comparaisonComplete, trio: (out.results ?? []).slice(0, 3) };
}

function nom(trio, insee) {
  return trio.find((r) => r.insee === insee)?.nom ?? insee;
}

async function main() {
  for (const text of PROJETS) {
    const r = await probe(text);
    console.log("\n==================================================");
    console.log("PROJET » " + r.text);
    if (r.error) { console.log("  ERREUR:", r.error); continue; }
    console.log("  TRIO : " + r.trio.map((c) => c.nom).join(" · "));
    console.log("  EN RÉSUMÉ :");
    for (const s of r.cc.resume) console.log("    " + s);
    for (const th of r.cc.themes) {
      console.log(`\n  ${th.titre}`);
      console.log(`    » ${th.synthese}`);
      for (const l of th.lignes) {
        const av = l.avantage.type === "avantage"
          ? `Avantage ${l.avantage.insees.map((i) => nom(r.trio, i)).join(" et ")}`
          : "À égalité";
        console.log(`    ${l.label}  [${av}]`);
        for (const cell of l.cellules) {
          const q = cell.qualifier ? `, ${cell.qualifier}` : "";
          console.log(`        ${nom(r.trio, cell.insee)} : ${cell.palier}${q}`);
        }
      }
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
