// FUT-152 · Construit `data/irep-registre.json` depuis l'export annuel officiel du registre IREP (Géorisques).
// Toute la règle vit dans `src/lib/data/irep-registre.ts` (pur, testé) ; ce script lit, vérifie et écrit.
//
//   curl -o /tmp/irep/2025.zip https://files.georisques.fr/irep/2025.zip
//   node scripts/fut152/construire-irep.mts --zip /tmp/irep/2025.zip --annee 2025 [--sha256 <attendu>]
//
// N'UTILISER QU'UN MILLÉSIME DONT L'ARCHIVE EST TÉLÉCHARGEABLE : la liste vient du service de téléchargement
// de la page Géorisques (`/webappReport/ws/telechargement/irep`). Le 28/10/2026 : 2003 à 2025 publiés, 2026
// annoncé « données non disponibles ».
//
// REFUSE (exit 1) : archive absente, empreinte différente de celle attendue, fichier manquant dans l'archive,
// export incohérent (cf. `construireIndexIrep`). Écriture atomique ; le résumé des exclusions est imprimé.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { IREP_SOURCE, construireIndexIrep } from "../../src/lib/data/irep-registre.ts";

const arg = (nom: string, defaut?: string): string | undefined => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1] : defaut;
};
const die = (m: string): never => {
  console.error(`REFUS: ${m}`);
  process.exit(1);
};

const zip = arg("zip") ?? die("--zip requis");
const annee = Number(arg("annee") ?? die("--annee requis"));
if (!existsSync(zip!)) die(`${zip} absent`);
const sha256 = createHash("sha256").update(readFileSync(zip!)).digest("hex");
const attendu = arg("sha256");
if (attendu && attendu !== sha256) die(`empreinte ${sha256}, attendue ${attendu}`);

const lire = (fichier: string): string => {
  try {
    return execFileSync("unzip", ["-p", zip!, `${annee}/${fichier}`], { maxBuffer: 256 * 1024 * 1024 }).toString("utf8");
  } catch {
    return die(`${annee}/${fichier} absent de l'archive`);
  }
};

const index = construireIndexIrep({
  annee,
  etablissementsCsv: lire("etablissements.csv"),
  emissionsCsv: lire("emissions.csv"),
  source: { archive: IREP_SOURCE.archive(annee), sha256, recupereLe: statSync(zip!).mtime.toISOString().slice(0, 10) },
});

const SORTIE = path.join(process.cwd(), "data", "irep-registre.json");
writeFileSync(`${SORTIE}.tmp`, JSON.stringify(index));
renameSync(`${SORTIE}.tmp`, SORTIE);
console.log(`${SORTIE} : ${JSON.stringify(index.meta.comptes)}`);
for (const e of index.meta.exclus) console.log(`  exclu ${e.id} ${e.nom} (${e.commune}, ${e.lon}, ${e.lat}) : ${e.motif}`);
