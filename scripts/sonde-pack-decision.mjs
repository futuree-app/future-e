// Sonde Pack Decision : verifie le VERROU (le /match gratuit ne fuit ni la matrice
// complete ni les pistes) et que l'apercu renvoie bien un tronque (2 themes) + un
// trio. Ne teste pas le paiement (Stripe) ni la possession (auth) : ces chemins se
// valident manuellement avec un compte de test + webhook Stripe CLI.
// Prerequis : npm run dev (port 3000). Usage : node scripts/sonde-pack-decision.mjs
const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

const PROJETS = [
  "Un coin calme pres de la mer pour ma retraite, avec de bons medecins.",
  "Je cherche une petite ville vivante avec une gare et un climat supportable l'ete.",
];

async function probe(text) {
  const pr = await fetch(`${BASE}/api/comparateur-vie/parse`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!pr.ok) return { text, error: `parse ${pr.status}` };
  const { parsed } = await pr.json();

  const mr = await fetch(`${BASE}/api/comparateur-vie/match`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ parsed }),
  });
  const match = await mr.json();

  const ar = await fetch(`${BASE}/api/comparateur-vie/apercu`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ parsed }),
  });
  const apercu = await ar.json();

  return { text, match, apercu };
}

async function main() {
  let ok = true;
  for (const text of PROJETS) {
    const r = await probe(text);
    console.log("\n==================================================");
    console.log("PROJET > " + r.text);
    if (r.error) {
      console.log("  ERREUR:", r.error);
      ok = false;
      continue;
    }

    const leakCC = r.match.comparaisonComplete !== undefined;
    const leakPistes = r.match.pistes !== undefined;
    const resultsCount = (r.match.results ?? []).length;
    const apercuThemes = r.apercu.apercu?.themes?.length ?? 0;
    const trioCount = r.apercu.trio?.length ?? 0;

    console.log(
      `  VERROU match : comparaisonComplete fuite? ${leakCC} | pistes fuite? ${leakPistes} | results=${resultsCount}`,
    );
    console.log(
      `  APERCU       : themes tronques=${apercuThemes} | trio=${trioCount} (${(r.apercu.trio ?? [])
        .map((t) => t.nom)
        .join(", ")})`,
    );

    if (leakCC || leakPistes) {
      console.log("  x FUITE DU PAYLOAD PAYANT");
      ok = false;
    }
    if (resultsCount > 3) {
      console.log("  x results > 3 (le gratuit ne doit montrer que le trio)");
      ok = false;
    }
    if (apercuThemes !== 2) {
      console.log("  x apercu non tronque a 2 themes");
      ok = false;
    }
    if (trioCount !== 3) {
      console.log("  x trio apercu != 3");
      ok = false;
    }
  }
  console.log("\n" + (ok ? "OK SONDE VERTE" : "KO SONDE ROUGE"));
  process.exit(ok ? 0 : 1);
}

main();
