#!/usr/bin/env node
/**
 * populate-hlm.mjs — taux de logements sociaux (HLM) par commune.
 *
 * POURQUOI. Demandé au dogfood Brest/Lorient (2026-06-27) pour « comparer la
 * politique du logement ». La donnée existe déjà côté app (`commune-data.ts`,
 * ADEME data_communes / RPLS 2023) mais n'était pas portée dans l'index du
 * comparateur. On la pose ici en bulk.
 *
 * QUOI. Récupère en bulk (ADEME data_communes, API publique sans clé) le taux et
 * le nombre de logements sociaux, et les injecte dans l'index existant :
 *   hlm_pct (taux de logements sociaux, %), hlm_nb (nombre, RPLS 2023).
 *
 * DOCTRINE (ADR-0001, anti-note). Champ DESCRIPTIF NEUTRE, jamais scoré ni
 * directionnel : « plus de HLM » n'est ni bien ni mal (la loi SRU ne s'applique
 * pas partout ; selon le projet de vie, un fort taux peut être recherché ou évité).
 * À afficher comme un fait, pas comme un avantage.
 *
 * Non destructif / idempotent : relit l'index, ajoute les champs, réécrit
 * { meta, communes }. N'efface aucun enrichissement existant.
 *   node scripts/populate-hlm.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const DS = "https://data.ademe.fr/data-fair/api/v1/datasets/8ggfo546-mtjxy4lbqxcl462";
const SELECT = [
  "code_commune_insee",
  "taux_de_logements_sociaux_percent",
  "nombre_de_logements_sociaux_rpls_2023",
].join(",");
const PAGE_SIZE = 10000;

const num = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));

async function fetchAll() {
  const out = {};
  let after = 0;
  let total = 0;
  for (;;) {
    const url = new URL(`${DS}/lines`);
    url.searchParams.set("size", String(PAGE_SIZE));
    url.searchParams.set("select", SELECT);
    if (after > 0) url.searchParams.set("after", String(after));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`ADEME ${res.status} ${res.statusText}`);
    const json = await res.json();
    const batch = json.results ?? [];
    for (const r of batch) {
      const insee = String(r.code_commune_insee ?? "").padStart(5, "0");
      if (insee.length !== 5) continue;
      out[insee] = {
        hlm_pct: num(r.taux_de_logements_sociaux_percent),
        hlm_nb: num(r.nombre_de_logements_sociaux_rpls_2023),
      };
    }
    total += batch.length;
    process.stdout.write(`\r  ${total} communes…`);
    if (batch.length < PAGE_SIZE) break;
    after += batch.length;
  }
  process.stdout.write("\n");
  return out;
}

async function main() {
  const root = process.cwd();
  const file = path.join(root, "data", "comparateur-index.json");
  const { meta, communes } = JSON.parse(await fs.readFile(file, "utf8"));

  const hlm = await fetchAll();

  let withHlm = 0;
  for (const c of communes) {
    const h = hlm[c.insee];
    c.hlm_pct = h?.hlm_pct ?? null;
    c.hlm_nb = h?.hlm_nb ?? null;
    if (c.hlm_pct != null) withHlm++;
  }

  meta.hlm = {
    source: "ADEME data_communes (taux RPLS 2023)",
    champ: "hlm_pct (taux de logements sociaux, %), hlm_nb (nombre, RPLS 2023)",
    usage:
      "descriptif neutre de la politique du logement — NON scoré, NON directionnel (ADR-0001)",
    note: "plus de HLM n'est ni un avantage ni un défaut ; la loi SRU ne s'applique pas partout",
  };

  await fs.writeFile(file, JSON.stringify({ meta, communes }), "utf8");

  const probe = ["29019", "56121", "22278", "17300"];
  for (const ic of probe) {
    const c = communes.find((x) => x.insee === ic);
    if (c) console.log(`${c.nom.padEnd(14)} HLM ${c.hlm_pct}% (${c.hlm_nb} logements)`);
  }
  console.log(`✓ hlm écrit : ${withHlm}/${communes.length} communes avec taux.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
