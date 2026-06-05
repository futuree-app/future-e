// Sonde de validation des chips/phrases de /ou-vivre : chaque candidat est une
// PROMESSE, on vérifie qu'il parse vers de vrais critères et sort un résultat
// fort et divergent sur le moteur réel. Usage : node scripts/sonde-richesse-chips.mjs
const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

// Corpus = chips (8) + phrases machine à écrire (5). « pollutions industrielles »
// déjà corrigé en « sites industriels à risque » (honnêteté : le critère mesure
// la présence de sites à risque, pas une pollution mesurée).
const CHIPS = [
  "Je veux vivre sans voiture au quotidien",
  "Une petite ville vivante près de l'océan",
  "Élever mes enfants dans un environnement sain",
  "Un coin calme avec gare et vie étudiante",
  "Rester dans le Sud sans subir les canicules",
  "Une ville qui attire de nouveaux habitants",
  "Près de la nature mais avec des médecins accessibles",
  "Préparer ma retraite dans un climat tempéré",
];
const PHRASES = [
  "Je cherche une petite ville vivante, avec une gare, des médecins accessibles et un climat supportable l'été.",
  "Nous voulons élever nos enfants loin des sites industriels à risque, sans être isolés des services.",
  "Je voudrais vivre sans voiture, près de l'océan, dans une ville qui attire encore de nouveaux habitants.",
  "Un endroit calme pour la retraite, avec des étudiants, des commerces et peu de risque d'inondation.",
  "Rester dans le Sud, mais éviter les canicules les plus intenses.",
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
  if (!mr.ok) return { text, error: `match ${mr.status}` };
  const out = await mr.json();
  return {
    text,
    keys: (parsed.preferences ?? []).map((p) => p.key),
    horsMesure: (parsed.horsMesure ?? []).map((h) => h.term),
    top: (out.results ?? []).slice(0, 3).map((r) => ({
      nom: r.nom,
      compat: r.compatibility,
      reason: r.reasons?.[0] ?? "",
    })),
  };
}

async function main() {
  const corpus = [...CHIPS, ...PHRASES];
  for (const text of corpus) {
    const r = await probe(text);
    console.log("\n========================================");
    console.log("» " + r.text);
    if (r.error) { console.log("  ERREUR:", r.error); continue; }
    console.log("  critères:", r.keys.join(", ") || "(aucun)");
    if (r.horsMesure.length) console.log("  HORS-MESURE:", r.horsMesure.join(", "));
    for (const t of r.top) console.log(`  - ${t.nom} (${t.compat}) ${t.reason}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
