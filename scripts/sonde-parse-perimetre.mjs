// Sonde (FUT-5) : des DESTINATIONS énumérées se réunissent, des PROPRIÉTÉS se combinent.
//
// Mesure le COMPORTEMENT du parseur, ce que le test de prompt ne peut pas faire. Coûte un appel
// modèle par formulation, donc hors suite de tests.
// Prérequis : npm run dev (port 3000). Usage : node scripts/sonde-parse-perimetre.mjs
// (SONDE_BASE=http://localhost:3001 pour un autre port).
//
// Ce qui est vérifié : le SENS du périmètre, pas la forme exacte du JSON. Une liste de départements
// seule est déjà une union ; ce qui compte est qu'aucune « destination » ne devienne une intersection.

const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

const CAS = [
  { text: "Je veux vivre en Bretagne et en Loire-Atlantique, au calme.", attendu: "union" },
  { text: "Je cherche en Bretagne et en Normandie.", attendu: "union" },
  { text: "Je veux vivre dans le 35 et le 44.", attendu: "union" },
  { text: "Je veux vivre en Bretagne ou en Normandie.", attendu: "union" },
  { text: "Je veux vivre en Bretagne sur la côte atlantique.", attendu: "intersection" },
  { text: "Je cherche dans le Sud-Ouest, près des Pyrénées.", attendu: "intersection" },
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

// Le sens du périmètre, tel que le moteur l'appliquera (cf. departementsDansLesZones).
function sens(hc) {
  const zonesDures = (hc?.zones ?? []).filter((z) => z?.strength === "hard");
  const depts = hc?.departements ?? [];
  const lieux = zonesDures.length + (depts.length > 0 ? 1 : 0);
  if (hc?.zonesMatch === "any") return "union";
  if (zonesDures.length === 0 && depts.length > 1) return "union"; // une liste seule est une union
  if (lieux >= 2 || zonesDures.length >= 1) return "intersection";
  return "aucun";
}

let echecs = 0;
for (const { text, attendu } of CAS) {
  let hc;
  try {
    hc = (await parse(text))?.hardConstraints ?? {};
  } catch (e) {
    console.log(`✖ ${text}\n   ERREUR ${e.message}`);
    echecs++;
    continue;
  }
  const obtenu = sens(hc);
  const ok = obtenu === attendu;
  if (!ok) echecs++;
  console.log(`${ok ? "✔" : "✖"} ${text}\n   attendu ${attendu}, obtenu ${obtenu} · ${JSON.stringify(hc)}`);
}

console.log(`\n${CAS.length - echecs}/${CAS.length} conformes.`);
process.exit(echecs === 0 ? 0 : 1);
