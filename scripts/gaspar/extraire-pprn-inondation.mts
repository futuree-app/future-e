// Plans de prévention des inondations par commune (FUT-127). Lit l'export public GASPAR et écrit
// `data/gaspar-pprn-inondation.json`, lu par le dossier de décision (`src/lib/gaspar-pprn-commune.ts`).
//
//   curl -L -o /tmp/gaspar.zip https://files.georisques.fr/GASPAR/gaspar.zip
//   unzip -d /tmp/gaspar /tmp/gaspar.zip
//   node scripts/gaspar/extraire-pprn-inondation.mts /tmp/gaspar/pprn_gaspar_AAAA-MM-JJ.csv
//
// La date de l'export est lue dans le NOM du fichier : c'est elle que le dossier affiche, jamais la
// date d'exécution du script. Écriture atomique (fichier temporaire, puis renommage).
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  extrairePlansInondation, PPRN_INONDATION_CONVENTION, type LigneExportPprn, type TablePlansInondation,
} from "../../src/lib/data/gaspar-pprn-inondation.ts";

const fichier = process.argv[2];
const date = fichier ? /pprn_gaspar_(\d{4}-\d{2}-\d{2})\.csv$/.exec(fichier)?.[1] : undefined;
if (!fichier || !date) {
  console.error("Usage : node scripts/gaspar/extraire-pprn-inondation.mts <chemin>/pprn_gaspar_AAAA-MM-JJ.csv");
  process.exit(2);
}

// CSV à point-virgule, avec des champs entre guillemets (un libellé peut contenir « ; » ou un retour à la
// ligne). Lecteur minimal à états ; une ligne au nombre de colonnes inattendu arrête tout.
function lireCsv(texte: string): string[][] {
  const rangs: string[][] = [];
  let rang: string[] = [], champ = "", guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]!;
    if (guillemets) {
      if (c === '"' && texte[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ";") { rang.push(champ); champ = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texte[i + 1] === "\n") i++;
      rang.push(champ); champ = "";
      if (rang.some((v) => v !== "")) rangs.push(rang);
      rang = [];
    } else champ += c;
  }
  rang.push(champ);
  if (rang.some((v) => v !== "")) rangs.push(rang);
  return rangs;
}
const [entete, ...corps] = lireCsv(readFileSync(fichier, "utf8").replace(/^\uFEFF/, ""));
const colonnes = entete!;
const lignes: LigneExportPprn[] = corps.map((v, i) => {
  if (v.length !== colonnes.length) throw new Error(`Ligne ${i + 2} : ${v.length} colonnes au lieu de ${colonnes.length}.`);
  return Object.fromEntries(colonnes.map((c, j) => [c, v[j]]));
});

const table: TablePlansInondation = {
  meta: {
    source: "Géorisques, export public GASPAR (files.georisques.fr/GASPAR/gaspar.zip), fichier pprn",
    export: date,
    convention: PPRN_INONDATION_CONVENTION,
  },
  communes: extrairePlansInondation(lignes),
};

const sortie = path.join(process.cwd(), "data", "gaspar-pprn-inondation.json");
const tmp = `${sortie}.${process.pid}.tmp`;
writeFileSync(tmp, JSON.stringify(table));
renameSync(tmp, sortie);
const plans = Object.values(table.communes).flat();
console.log(JSON.stringify({
  export: date, communes: Object.keys(table.communes).length, plans: plans.length,
  approuves: plans.filter((p) => p.statut === "approuve").length,
  anticipes: plans.filter((p) => p.statut === "anticipe").length,
  prescrits: plans.filter((p) => p.statut === "prescrit").length,
}));
