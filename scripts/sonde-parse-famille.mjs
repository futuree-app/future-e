// Sonde : un projet FAMILIAL n'active jamais acces_services.
//
// Mesure le COMPORTEMENT du parseur, ce que le test de prompt ne peut pas faire. Coûte un appel
// modèle par formulation, donc hors suite de tests.
// Prérequis : npm run dev (port 3000). Usage : node scripts/sonde-parse-famille.mjs
//
// Pourquoi cette sonde existe : le critère acces_services vaut 100/100 pour 80,1 % des communes
// (palier intermédiaire vide, source = part de population à plus de 20 min d'au moins un service,
// panier et mode de déplacement non documentés par l'ADEME). Il était injecté au poids 2 sur le seul
// mot « enfant » : il ne classait rien et diluait les critères qui discriminent.
//
// AUCUN test positif ici (« je veux des services proches » -> acces_services) : ce serait graver la
// correspondance sémantique précisément mise en cause, avant que la source ne soit établie.

const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

const PROJETS_FAMILLE = [
  "Nous cherchons une ville pour élever nos deux enfants",
  "Un endroit agréable pour une famille",
  "Je veux que mes enfants puissent grandir dans un environnement sain",
];

async function parse(text) {
  const r = await fetch(`${BASE}/api/comparateur-vie/parse`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`parse ${r.status} ${r.statusText}`);
  const { parsed } = await r.json();
  return parsed;
}

let echecs = 0;
for (const text of PROJETS_FAMILLE) {
  let parsed;
  try {
    parsed = await parse(text);
  } catch (e) {
    console.log(`✖ ${text}\n   ERREUR ${e.message}`);
    echecs++;
    continue;
  }
  const prefs = parsed?.preferences ?? [];
  const services = prefs.find((p) => p.key === "acces_services");
  const resume = prefs.map((p) => `${p.key}:${p.weight ?? p.poids ?? "?"}`).join(" · ");
  if (services) {
    console.log(`✖ ${text}\n   acces_services INJECTÉ (poids ${services.weight ?? services.poids})\n   ${resume}`);
    echecs++;
  } else {
    console.log(`✔ ${text}\n   ${resume || "(aucune préférence)"}`);
  }
}

console.log(`\n${PROJETS_FAMILLE.length - echecs}/${PROJETS_FAMILLE.length} conformes.`);
process.exit(echecs === 0 ? 0 : 1);
