// Collecte GASPAR CatNat → index du comparateur (FUT-60). Remplace scripts/populate-inondation.py.
//
//   node scripts/gaspar/collecter-catnat.mts --nouvelle     collecte complète, publiée si complète
//   node scripts/gaspar/collecter-catnat.mts --reprendre    reprend la collecte EN COURS (ce qui manque)
//   ajouter --sans-publier pour collecter sans toucher l'index
//
// Aucun mode implicite : relancer sans option n'a aucun effet (le script historique laissait croire
// qu'il rafraîchissait). Le fichier de travail (data/.cache/gaspar-catnat-collecte.json, non
// versionné) ne sert qu'à reprendre une collecte interrompue ; la donnée canonique est l'index,
// dont `meta.sources.gaspar_catnat` dit la date de collecte.
//
// Panne de Géorisques : un lot en échec est réessayé, puis laissé « à faire ». L'index n'est écrit
// que si TOUS les codes ont répondu ; sinon il reste tel quel, et le script sort en erreur.
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  appliquerCollecte, codesAInterroger, codesRestants, collecteComplete, enregistrerEchec, enregistrerLot,
  lotsDe, nouvelleCollecte, type Collecte, type LigneGaspar,
} from "../../src/lib/data/gaspar-catnat-collecte.ts";
import { CATNAT_EVIDENCE_VERSION } from "../../src/lib/decision/catnat-evidence.ts";
import { INDEX_GZ_PATH, packJson, sha256, unpackGz, assertIndexInvariants } from "../lib/index-io.mjs";

const TRAVAIL = path.join(process.cwd(), "data", ".cache", "gaspar-catnat-collecte.json");
const API = "https://georisques.gouv.fr/api/v1/gaspar/catnat";
const PAUSE_MS = 200; // politesse : ~5 requêtes/s au plus, ~1 750 requêtes pour la France
const ESSAIS = 3;

const args = new Set(process.argv.slice(2));
if (!args.has("--nouvelle") && !args.has("--reprendre")) {
  console.error("Usage : --nouvelle (collecte complète) ou --reprendre (collecte en cours), [--sans-publier]");
  process.exit(2);
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function interrogerLot(codes: string[]): Promise<LigneGaspar[]> {
  const lignes: LigneGaspar[] = [];
  for (let page = 1; ; page++) {
    const url = `${API}?${new URLSearchParams({ code_insee: codes.join(","), page: String(page), page_size: "1000" })}`;
    const r = await fetch(url, { headers: { "User-Agent": "futur-e/collecte-gaspar-catnat" }, signal: AbortSignal.timeout(60_000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = (await r.json()) as { data?: LigneGaspar[] | null; total_pages?: number | null };
    if (!Array.isArray(d.data)) throw new Error("réponse sans tableau data");
    lignes.push(...d.data);
    if (!d.total_pages || page >= d.total_pages) return lignes;
  }
}

function lireIndex() {
  const gz = readFileSync(INDEX_GZ_PATH);
  return JSON.parse(unpackGz(gz).toString("utf8"));
}

function ecrireTravail(c: Collecte) {
  mkdirSync(path.dirname(TRAVAIL), { recursive: true });
  const tmp = `${TRAVAIL}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(c));
  renameSync(tmp, TRAVAIL);
}

const index = lireIndex();
const codes = codesAInterroger(index.communes.map((c: { insee: string }) => c.insee));

let collecte: Collecte;
if (args.has("--reprendre") && existsSync(TRAVAIL)) {
  collecte = JSON.parse(readFileSync(TRAVAIL, "utf8"));
  if (collecte.version !== 1) throw new Error("Fichier de travail d'un autre format : relancer avec --nouvelle.");
  console.error(`Reprise de la collecte commencée le ${collecte.debut}.`);
} else {
  if (args.has("--reprendre")) console.error("Aucune collecte en cours : une nouvelle commence.");
  collecte = nouvelleCollecte(new Date().toISOString());
}

const lots = lotsDe(codesRestants(collecte, codes));
console.error(`${codes.length} codes GASPAR, ${lots.length} lot(s) à interroger.`);
const t0 = Date.now();
for (const [i, lot] of lots.entries()) {
  let ok = false;
  for (let essai = 1; essai <= ESSAIS && !ok; essai++) {
    try {
      collecte = enregistrerLot(collecte, lot, await interrogerLot(lot), new Date().toISOString());
      ok = true;
    } catch (e) {
      if (essai === ESSAIS) {
        collecte = enregistrerEchec(collecte, lot);
        console.error(`  lot ${i + 1} en échec (${(e as Error).message}) : ${lot[0]}…`);
      } else await attendre(1500 * essai);
    }
  }
  if ((i + 1) % 100 === 0) {
    ecrireTravail(collecte);
    console.error(`  ${i + 1}/${lots.length} (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
  await attendre(PAUSE_MS);
}
ecrireTravail(collecte);

if (!collecteComplete(collecte, codes)) {
  console.error(`Collecte INCOMPLÈTE : ${codesRestants(collecte, codes).length} code(s) sans réponse. Index inchangé ; relancer avec --reprendre.`);
  process.exit(1);
}
console.error(`Collecte complète en ${Math.round((Date.now() - t0) / 1000)} s.`);
if (args.has("--sans-publier")) process.exit(0);

// PUBLICATION ATOMIQUE : nouvel index validé en mémoire, écrit à côté, relu, puis renommé.
const { index: nouveau, ecarts } = appliquerCollecte(index, collecte, CATNAT_EVIDENCE_VERSION);
assertIndexInvariants(nouveau.communes);
const json = Buffer.from(JSON.stringify(nouveau), "utf8");
const gz = packJson(json);
const tmp = `${INDEX_GZ_PATH}.${process.pid}.tmp`;
try {
  writeFileSync(tmp, gz);
  if (sha256(unpackGz(readFileSync(tmp))) !== sha256(json)) throw new Error("Relecture de l'index écrit différente.");
  renameSync(tmp, INDEX_GZ_PATH);
} finally {
  if (existsSync(tmp)) rmSync(tmp);
}
rmSync(TRAVAIL, { force: true });
console.log(JSON.stringify({ publie: true, collecte_fin: collecte.dernierLot, ...ecarts }, null, 2));
