// FUT-167 · Extraction nationale des installations classées (Géorisques, API v1 `installations_classees`),
// réduite aux champs utiles. Écrit un fichier brut horodaté, relu ensuite par `construire-seveso.mjs`.
// Usage : node scripts/fut167/extraire-icpe.mjs <sortie.json>   (IP française requise, cf. FUT-158)
//
// UNE PAGE PEUT ÉCHOUER CHAQUE FOIS (30/10/2026 : la page 66 de 1 000 lignes rompt le flux HTTP/2 à chaque essai).
// Elle est alors relue en tranches de 100, puis de 10, puis ligne à ligne : seules les lignes réellement
// illisibles manquent, et elles sont COMPTÉES dans `illisibles` (jamais une absence silencieuse).
import { writeFileSync } from "node:fs";
const SORTIE = process.argv[2];
if (!SORTIE) throw new Error("chemin de sortie requis");
const URL_ = "https://www.georisques.gouv.fr/api/v1/installations_classees";
const CHAMPS = ["codeAIOT", "raisonSociale", "commune", "codeInsee", "latitude", "longitude", "statutSeveso", "ied", "regime", "etatActivite", "industrie", "date_maj"];

async function page(numero, taille, essais) {
  for (let essai = 1; essai <= essais; essai++) {
    try {
      const r = await fetch(`${URL_}?page=${numero}&page_size=${taille}`, { headers: { "Accept-Encoding": "identity", "User-Agent": "futur-e/fut167" }, signal: AbortSignal.timeout(120_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      console.error(`page ${numero} (x${taille}) essai ${essai} : ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 1500 * essai));
    }
  }
  return null;
}

const lignes = [];
const illisibles = [];
const garder = (doc) => { for (const x of doc.data ?? []) lignes.push(Object.fromEntries(CHAMPS.map((k) => [k, x[k] ?? null]))); };

/** Relit la plage [debut, debut + taille) en tranches plus petites. */
async function relire(debut, taille) {
  const sous = taille / 10;
  if (sous < 1) { illisibles.push({ position: debut }); return; }
  for (let k = 0; k < 10; k++) {
    const d = debut + k * sous;
    const doc = await page(d / sous + 1, sous, 2);
    if (doc) garder(doc); else await relire(d, sous);
  }
}

let total = null, totalLignes = null;
for (let p = 1; total === null || p <= total; p++) {
  const doc = await page(p, 1000, 3);
  if (doc) {
    total ??= doc.total_pages; totalLignes ??= doc.results;
    garder(doc);
  } else {
    if (total === null) throw new Error("première page illisible");
    await relire((p - 1) * 1000, 1000);
  }
  if (p % 10 === 0) console.error(`page ${p}/${total} (${lignes.length})`);
}
writeFileSync(SORTIE, JSON.stringify({ extraitLe: new Date().toISOString(), source: URL_, annonce: totalLignes, total: lignes.length, illisibles, lignes }));
console.error(`écrit : ${lignes.length} installations sur ${totalLignes} annoncées, ${illisibles.length} illisibles`);
