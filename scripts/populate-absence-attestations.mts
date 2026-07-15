// Enrichit data/comparateur-index.json avec les attestations d'absence (réseau + études), depuis les caches
// producteurs. AUCUN re-fetch OSM/BPE. ATOMIQUE : tmp UNIQUE -> round-trip -> rename (finally cleanup). REFUSE
// sur anomalie (set-equality, prévalence divergente, meta.complete faux). En .mts pour importer les constantes
// TS (source unique de la prévalence), comme populate-mismatch-rank.mts.
import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { buildAbsenceAttestations } from "./lib/absence-attestations.mjs";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";
import { ABSENCE_NATIONAL_CONTEXT, ABSENCE_DISTRIBUTION_VERSION, NETWORK_CONVENTION_ID, HIGHER_ED_CONVENTION_ID } from "../src/lib/decision/absence-facts.ts";

const ROOT = process.cwd();
const INDEX = path.join(ROOT, "data", "comparateur-index.json");
const NET = path.join(ROOT, "data", ".cache", "communes-reseau-local.json");
const BPE = path.join(ROOT, "data", ".cache", "communes-bpe.json");
const PREVALENCE_TOL = 0.005; // 0,5 point

const sha256 = (buf: string) => crypto.createHash("sha256").update(buf).digest("hex");
// Accepte la forme plate (insee->valeur) ET la forme future { meta, communes }.
const records = (cache: Record<string, unknown>) =>
  (cache.communes && typeof cache.communes === "object" ? cache.communes : cache) as Record<string, unknown>;
const metaOf = (cache: Record<string, unknown>) => (cache.meta ?? null) as { complete?: boolean; failedTiles?: unknown[] } | null;

async function main() {
  assertIndexWorktree(); // garde clone frais : message clair plutôt qu'un ENOENT brut

  const [idxRaw, netRaw, bpeRaw] = await Promise.all([fs.readFile(INDEX, "utf8"), fs.readFile(NET, "utf8"), fs.readFile(BPE, "utf8")]);
  const idx = JSON.parse(idxRaw);
  const netCache = JSON.parse(netRaw), bpeCache = JSON.parse(bpeRaw);
  const networkRecords = records(netCache), bpeRecords = records(bpeCache);

  // Si un cache porte déjà un meta de complétude, l'exiger.
  for (const [name, m] of [["réseau", metaOf(netCache)], ["BPE", metaOf(bpeCache)]] as const) {
    if (m && (m.complete !== true || (Array.isArray(m.failedTiles) && m.failedTiles.length > 0))) {
      console.error(`REFUS: cache ${name} incomplet (complete=${m.complete}, failedTiles=${m.failedTiles?.length})`); process.exit(1);
    }
  }

  // Set-equality strict : index == réseau == BPE, mêmes codes uniques.
  const idxSet = new Set(idx.communes.map((c: { insee: string }) => c.insee));
  for (const [name, rec] of [["réseau", networkRecords], ["BPE", bpeRecords]] as const) {
    const keys = Object.keys(rec);
    if (keys.length !== idxSet.size) { console.error(`REFUS: record ${name} a ${keys.length} codes, index ${idxSet.size}`); process.exit(1); }
    for (const k of keys) if (!idxSet.has(k)) { console.error(`REFUS: ${k} dans le record ${name}, absent de l'index`); process.exit(1); }
  }

  let out;
  try {
    out = buildAbsenceAttestations({ communes: idx.communes, networkRecords, bpeRecords });
  } catch (e) { console.error(`REFUS: ${(e as Error).message}`); process.exit(1); }

  // GARDE DE PRÉVALENCE : les constantes TS (source unique) doivent coller au calcul, sinon le texte ment.
  const nP = out.prevalence.networkAbsent / out.prevalence.communeCount;
  const hP = out.prevalence.higherEdAbsent / out.prevalence.communeCount;
  if (Math.abs(nP - ABSENCE_NATIONAL_CONTEXT.network!.prevalence) > PREVALENCE_TOL ||
      Math.abs(hP - ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence) > PREVALENCE_TOL) {
    console.error(`REFUS: prévalence divergente (réseau ${nP.toFixed(3)} vs ${ABSENCE_NATIONAL_CONTEXT.network!.prevalence}, études ${hP.toFixed(3)} vs ${ABSENCE_NATIONAL_CONTEXT.higherEd!.prevalence}). Mettre à jour ABSENCE_NATIONAL_CONTEXT + ABSENCE_DISTRIBUTION_VERSION.`);
    process.exit(1);
  }

  idx.meta = { ...(idx.meta ?? {}), absenceAttestations: {
    version: "absence-attestations-v1", distributionVersion: ABSENCE_DISTRIBUTION_VERSION,
    networkConventionId: NETWORK_CONVENTION_ID, higherEdConventionId: HIGHER_ED_CONVENTION_ID,
    communeCount: out.prevalence.communeCount,
    network: { measuredCount: out.prevalence.communeCount, absentCount: out.prevalence.networkAbsent },
    higherEd: { measuredCount: out.prevalence.communeCount, absentCount: out.prevalence.higherEdAbsent },
    networkCacheSha256: sha256(netRaw), bpeCacheSha256: sha256(bpeRaw),
  } };

  console.log(out.report);

  const tmp = `${INDEX}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(idx));
    const check = JSON.parse(await fs.readFile(tmp, "utf8"));
    if (!check.communes.some((c: { reseauLocalMeasured?: boolean }) => c.reseauLocalMeasured) ||
        !check.communes.some((c: { etudesSup?: unknown }) => c.etudesSup)) {
      console.error("REFUS: attestation perdue à l'écriture"); process.exit(1);
    }
    if (!check.communes.some((c: { nature?: unknown }) => c.nature)) { console.error("REFUS: enrichissement existant perdu"); process.exit(1); }
    await fs.rename(tmp, INDEX);
  } finally {
    await fs.rm(tmp, { force: true });
  }
  console.log("✓ index patché (absenceAttestations)");
}
main();
