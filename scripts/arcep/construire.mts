#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-148 · CONSTRUIRE `data/arcep-fibre.json` DEPUIS LE CACHE DE `telecharger.mjs`.
//
// Lit le fichier par commune (DBF du shapefile), le recoupe avec le classeur de l'observatoire du même
// trimestre, contrôle, puis publie la table D'UN BLOC : écriture dans un fichier temporaire, renommage
// ensuite. Une construction interrompue laisse l'ancienne table intacte, jamais une table à moitié écrite.
//
// Ce qui fait échouer la construction (rien n'est écrit) : un code en double, un effectif invalide,
// plus de raccordables que de locaux, une classe publiée qui contredit ftth/Locaux, une somme des
// arrondissements de Paris, Lyon ou Marseille qui ne redonne pas la ligne communale de l'observatoire,
// une couverture du référentiel futur•e sous 99,5 % (le signe d'un changement de géographie communale
// à traiter avant de publier, pas d'une commune à taire).
//
//   node scripts/arcep/construire.mts [--cache <dossier>] [--sortie data/arcep-fibre.json] [--rapport <fichier.json>]
// ════════════════════════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import {
  construireTableFibre, lireDbf, type LigneFichierCommune, type LigneObservatoire, type TableFibre,
} from "../../src/lib/data/arcep-fibre.ts";
import { arrondissementsDe } from "../../src/lib/plm.ts";

const arg = (nom: string, defaut: string): string => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1]! : defaut;
};
const CACHE = arg("cache", join(tmpdir(), "futuree-arcep"));
const SORTIE = arg("sortie", "data/arcep-fibre.json");
const RAPPORT = arg("rapport", "");
const COUVERTURE_MIN = 0.995;

type Fichier = { titre: string; url: string; fichier: string; sha256: string; octets: number; modifieLe: string | null; luLe: string };
const manifeste = JSON.parse(readFileSync(join(CACHE, "manifeste.json"), "utf8")) as {
  jeu: string; licence: string; producteur: string; trimestre: string; fichiers: { commune: Fichier; observatoire: Fichier };
};
const { trimestre } = manifeste;
const m = /^(\d{4})T([1-4])$/.exec(trimestre);
if (!m) throw new Error(`trimestre illisible : ${trimestre}`);
const annee = m[1]!;
const arrete = `${annee}-${["03-31", "06-30", "09-30", "12-31"][Number(m[2]) - 1]}`;
const colonneTrimestre = `T${m[2]} ${annee}`;

// ── 1. Le fichier par commune ───────────────────────────────────────────────────────────────
const dbfs = Object.entries(unzipSync(readFileSync(manifeste.fichiers.commune.fichier))).filter(([nom]) => nom.toLowerCase().endsWith(".dbf"));
if (dbfs.length !== 1) throw new Error(`un seul .dbf attendu dans ${manifeste.fichiers.commune.titre}, ${dbfs.length} trouvés`);
const num = (v: string | undefined): number => (v == null || v.trim() === "" ? Number.NaN : Number(v));
const fichierCommune: LigneFichierCommune[] = lireDbf(dbfs[0]![1]).map((l) => ({
  insee: l.INSEE_COM ?? "", locaux: num(l.Locaux), ftth: num(l.ftth), couv: l.couv ? num(l.couv) : null,
}));

// ── 2. Le classeur de l'observatoire (xlsx = zip de XML), onglets « Communes » et « Arrondissements » ─
const xlsx = unzipSync(readFileSync(manifeste.fichiers.observatoire.fichier));
const texte = (nom: string): string => {
  const f = xlsx[nom];
  if (!f) throw new Error(`${nom} absent du classeur`);
  return strFromU8(f);
};
const decoder = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const partages = [...texte("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)]
  .map((x) => decoder([...x[1]!.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")));
const classeur = texte("xl/workbook.xml");
const liens = texte("xl/_rels/workbook.xml.rels");
function onglet(nom: string): string[][] {
  const rid = new RegExp(`<sheet [^>]*name="${nom}"[^>]*r:id="([^"]+)"`).exec(classeur)?.[1];
  const cible = rid && new RegExp(`<Relationship [^>]*Id="${rid}"[^>]*Target="([^"]+)"`).exec(liens)?.[1];
  if (!cible) throw new Error(`onglet « ${nom} » introuvable`);
  const xml = texte(`xl/${cible.replace(/^\/?xl\//, "")}`);
  const col = (ref: string) => [...ref.replace(/\d+/g, "")].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
  const lignes: string[][] = [];
  for (const r of xml.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
    const ligne: string[] = [];
    for (const c of r[1]!.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const t = /t="([^"]+)"/.exec(c[2]!)?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(c[3] ?? "")?.[1] ?? /<t[^>]*>([\s\S]*?)<\/t>/.exec(c[3] ?? "")?.[1] ?? "";
      ligne[col(c[1]!)] = t === "s" ? partages[Number(v)]! : decoder(v);
    }
    lignes.push(ligne);
  }
  return lignes;
}
function lignesObservatoire(nom: string, colonneCode: string): LigneObservatoire[] {
  const lignes = onglet(nom);
  const iEntete = lignes.findIndex((l) => l.some((v) => v?.trim() === colonneCode));
  const entete = lignes[iEntete]!.map((v) => v?.trim());
  const i = (titre: string) => {
    const k = entete.indexOf(titre);
    if (k < 0) throw new Error(`colonne « ${titre} » absente de l'onglet ${nom}`);
    return k;
  };
  const [iCode, iLocaux, iSource, iFtth] = [i(colonneCode), i(`Meilleure estimation des locaux ${colonneTrimestre}`), i(`Source retenue ${colonneTrimestre}`), i(colonneTrimestre)];
  return lignes.slice(iEntete + 1).filter((l) => l[iCode]).map((l) => ({
    insee: l[iCode]!.trim(), locaux: Number(l[iLocaux]), ftth: Number(l[iFtth]), source: l[iSource] ?? "",
  }));
}
const observatoire = [...lignesObservatoire("Communes", "Code commune"), ...lignesObservatoire("Arrondissements", "Code arrondissement")];

// ── 3. La table, ses contrôles, sa publication ──────────────────────────────────────────────
const referentiel = Object.keys((JSON.parse(readFileSync("src/data/accueil-communes.json", "utf8")) as { communes: Record<string, unknown> }).communes);
const ressource = (f: Fichier) => ({ titre: f.titre, url: f.url, sha256: f.sha256, octets: f.octets, modifieLe: f.modifieLe });
const { table, rapport } = construireTableFibre(fichierCommune, observatoire, referentiel, {
  producteur: manifeste.producteur,
  jeu: manifeste.jeu,
  licence: manifeste.licence === "fr-lo" ? "Licence Ouverte / Open Licence (Etalab)" : manifeste.licence,
  trimestre,
  arrete,
  fichierCommune: ressource(manifeste.fichiers.commune),
  observatoire: ressource(manifeste.fichiers.observatoire),
  extraitLe: manifeste.fichiers.commune.luLe,
  couverture: "Toutes les communes du fichier communal de l'Arcep, outre-mer compris ; Paris, Lyon et Marseille par arrondissements (la commune se lit en les sommant).",
});

// Paris, Lyon, Marseille : la somme des arrondissements doit redonner la ligne communale du classeur.
const obsParCode = new Map(observatoire.map((o) => [o.insee, o]));
for (const ville of ["75056", "69123", "13055"]) {
  const arr = arrondissementsDe(ville).map((c) => table.communes[c]);
  if (arr.some((l) => !l)) throw new Error(`${ville} : un arrondissement manque à la table`);
  const somme = arr.reduce((s, l) => [s[0] + l![0], s[1] + l![1]], [0, 0]);
  const o = obsParCode.get(ville);
  if (!o || Math.abs(o.locaux - somme[0]) > 0.5 || o.ftth !== somme[1]) {
    throw new Error(`${ville} : arrondissements ${somme.join("/")} ≠ observatoire ${o ? `${o.locaux}/${o.ftth}` : "absent"}`);
  }
}
const couverture = 1 - rapport.referentielAbsents.length / referentiel.length;
if (couverture < COUVERTURE_MIN) {
  throw new Error(`couverture du référentiel ${(couverture * 100).toFixed(2)} % < ${COUVERTURE_MIN * 100} % : ${rapport.referentielAbsents.slice(0, 20).join(", ")}`);
}

// Une commune par ligne : un trimestre suivant se relit en diff, commune par commune.
function serialiser(t: TableFibre): string {
  // Tri explicite : un objet JS range les clés entières (« 10002 ») avant « 01001 ».
  const corps = Object.entries(t.communes).sort(([a], [b]) => (a < b ? -1 : 1)).map(([c, l]) => `${JSON.stringify(c)}:${JSON.stringify(l)}`).join(",\n");
  return `{"meta":${JSON.stringify(t.meta)},\n"champs":${JSON.stringify(t.champs)},\n"discordantes":${JSON.stringify(t.discordantes)},\n"communes":{\n${corps}\n}}\n`;
}
const contenu = serialiser(table);
JSON.parse(contenu); // la table publiée se relit, ou rien n'est publié
writeFileSync(`${SORTIE}.tmp`, contenu);
renameSync(`${SORTIE}.tmp`, SORTIE);

const resume = {
  ...rapport,
  communesPubliees: Object.keys(table.communes).length,
  octets: Buffer.byteLength(contenu),
  national: table.meta.national,
  partNationale: Math.round((table.meta.national.raccordables / table.meta.national.locaux) * 10000) / 100,
};
if (RAPPORT) writeFileSync(RAPPORT, `${JSON.stringify(resume, null, 2)}\n`);
console.log(JSON.stringify({ ...resume, referentielAbsents: resume.referentielAbsents.length }, null, 2));
console.log(`Écrit : ${SORTIE}`);
