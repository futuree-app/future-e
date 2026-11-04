// FUT-137 · Construit data/successeurs-cog2026.json : pour chaque code de commune disparu du COG, la commune
// ACTUELLE de l'index qui porte son territoire, ou le motif de l'abstention. La règle est dans
// scripts/lib/successeurs-cog.mjs (pure, testée) ; populate-vie-locale.py la lit pour ranger les associations
// du RNA dans la bonne commune.
//
// SOURCES : le COG Insee au 01/01/2026, deux fichiers ÉPINGLÉS par leur empreinte (refus sinon) et mis en cache
// dans data/cache-logement/cog/, le même cache que FUT-138 (prix DVF) :
//   v_mvt_commune_2026.csv  https://www.insee.fr/fr/statistiques/fichier/8740222/v_mvt_commune_2026.csv
//   v_commune_2026.csv      https://www.insee.fr/fr/statistiques/fichier/8740222/v_commune_2026.csv
// L'index est au COG du 01/01/2025. Le COG 2026 n'a aucun mouvement territorial depuis (34 875 communes
// identiques) : `verifierGeographieCompatible` le vérifie et REFUSE sinon, comme pour les prix DVF. Le COG 2026
// est retenu parce qu'il est le plus récent pour les communes déléguées (règle 1) et qu'il est déjà épinglé.
//
// PREUVES, sinon REFUS (rien n'est écrit) :
//  - aucune commune rattachée hors de l'index, aucun code rattaché qui soit une commune de l'index ;
//  - les 68 codes repris de FUT-109 (data/population-referentiel-cog2025.json) vont à la même commune ;
//  - La Neuville-Garnier (60455) va dans Les Hauts-Talican (60694), pas dans la commune qui a gardé le code.
//
// Usage : node scripts/fut137/construire-successeurs.mjs [--verifier]
//   --verifier : reconstruit en mémoire et compare au fichier versionné, octet pour octet (reproductibilité).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { CACHE, COG_MVT, fichierEpingle, mouvementsCog, verifierGeographieCompatible } from "../lib/logement-index.mjs";
import { lireLigneCsv } from "../lib/dvf-prix.mjs";
import { construireSuccesseurs, REGLE_SUCCESSEURS } from "../lib/successeurs-cog.mjs";

export const COG_COMMUNES = {
  url: "https://www.insee.fr/fr/statistiques/fichier/8740222/v_commune_2026.csv",
  sha256: "7be1153de3a63df48fa0ca77f8490c8a0c5c9c4eb12f5cec1ca7f70b0237b1d3",
};
const SORTIE = path.join(process.cwd(), "data", "successeurs-cog2026.json");

const die = (m) => {
  console.error(`REFUS: ${m}`);
  process.exit(1);
};

async function communesCog() {
  const { chemin, sha256 } = await fichierEpingle(path.join(CACHE, "cog", "v_commune_2026.csv"), COG_COMMUNES.url, COG_COMMUNES.sha256);
  const lignes = fs.readFileSync(chemin, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const entete = lignes[0].split(",").map((x) => x.replace(/"/g, ""));
  const rows = lignes.slice(1).map((l) => {
    const v = lireLigneCsv(l);
    return Object.fromEntries(entete.map((h, i) => [h, v[i] ?? ""]));
  });
  const communes = new Set(rows.filter((r) => r.TYPECOM === "COM").map((r) => r.COM));
  // Un code délégué identique à celui de sa commune (le chef-lieu) n'est pas un code disparu : écarté.
  const parents = new Map(rows.filter((r) => (r.TYPECOM === "COMD" || r.TYPECOM === "COMA") && !communes.has(r.COM)).map((r) => [r.COM, r.COMPARENT]));
  return { communes, parents, sha256 };
}

export async function construireTable() {
  const { mouvements, sha256: shaMvt } = await mouvementsCog();
  verifierGeographieCompatible(mouvements);
  const { communes, parents, sha256: shaCom } = await communesCog();
  const index = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(process.cwd(), "data", "comparateur-index.json.gz"))).toString("utf8"));
  const referentiel = new Set(index.communes.map((c) => c.insee));

  const t = construireSuccesseurs({ communes, parents, mouvements, referentiel });

  for (const [ancien, actuel] of Object.entries(t.rattaches)) {
    if (referentiel.has(ancien)) die(`${ancien} est une commune de l'index, pas un code disparu`);
    if (!referentiel.has(actuel)) die(`${ancien} -> ${actuel}, hors de l'index`);
  }
  const fut109 = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "population-referentiel-cog2025.json"), "utf8")).communes;
  for (const [k, c] of Object.entries(fut109)) {
    for (const ancien of c.codesRepris) if (t.rattaches[ancien] !== k) die(`code repris FUT-109 ${ancien} : ${k} attendu, ${t.rattaches[ancien] ?? JSON.stringify(t.abstentions[ancien])} obtenu`);
  }
  if (t.rattaches["60455"] !== "60694") die(`60455 La Neuville-Garnier : 60694 attendu, ${t.rattaches["60455"]} obtenu`);

  const motifs = {};
  for (const a of Object.values(t.abstentions)) motifs[a.motif] = (motifs[a.motif] ?? 0) + 1;
  return {
    schema: 1,
    description: "FUT-137 · commune actuelle de l'index pour chaque code de commune disparu du COG (fusions, changements de code, communes déléguées), ou motif d'abstention",
    regle: REGLE_SUCCESSEURS,
    sources: {
      mouvements: { url: COG_MVT.url, sha256: shaMvt },
      communes: { url: COG_COMMUNES.url, sha256: shaCom },
    },
    referentiel: `index du comparateur (${referentiel.size} communes et arrondissements, COG au 01/01/2025) ; aucun mouvement territorial du COG 2026 après le 01/01/2025`,
    comptes: {
      codesDisparus: Object.keys(t.rattaches).length + Object.keys(t.abstentions).length,
      rattaches: Object.keys(t.rattaches).length,
      parRattachementOfficiel: t.parRattachementOfficiel.length,
      abstentions: motifs,
    },
    rattaches: t.rattaches,
    parRattachementOfficiel: t.parRattachementOfficiel,
    abstentions: t.abstentions,
    communesHorsIndex: t.communesHorsIndex,
  };
}

export const serialiser = (table) => JSON.stringify(table, null, 1) + "\n";

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  const texte = serialiser(await construireTable());
  if (process.argv.includes("--verifier")) {
    const versionne = fs.readFileSync(SORTIE, "utf8");
    if (versionne !== texte) die(`${path.relative(process.cwd(), SORTIE)} diffère de la reconstruction depuis les sources épinglées`);
    console.log(`✓ ${path.relative(process.cwd(), SORTIE)} reproduit à l'identique`);
  } else {
    fs.writeFileSync(SORTIE, texte);
    const t = JSON.parse(texte);
    console.log(`✓ ${path.relative(process.cwd(), SORTIE)} : ${t.comptes.codesDisparus} codes disparus, ${t.comptes.rattaches} rattachés (dont ${t.comptes.parRattachementOfficiel} par la commune de rattachement officielle), abstentions ${JSON.stringify(t.comptes.abstentions)}`);
  }
}
