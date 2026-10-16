import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-112 (16/10/2026) : LE MODULE LOGEMENT N'AFFIRME PLUS UNE ÉVOLUTION CLIMATIQUE NON LUE.
//
// Reproduit sur main 0ec2d2fe : le bloc « Dans le climat futur » de `ThermalComfortSection`
// écrivait « Avec la progression des nuits chaudes à {commune} » pour TOUTE adresse, au seul vu du
// niveau de diagnostic. Briançon (0,2 nuit tropicale en 2050, référence 0) et Jausiers (0) le
// recevaient comme Nîmes (69, référence 33). Audit FUT-85, §D.2 et §D.7.
//
// On rend le VRAI composant (react-dom/server) et on lit son TEXTE, pour les trois niveaux de
// preuve et pour chaque situation climatique, alimentée par les vraies données DRIAS (lecture seule
// de `drias-json.ts`). Les communes passent aussi leur nom et leur signal climat au composant : si
// une phrase climatique revenait sans s'appuyer sur un fait, elle se verrait ici.
//
// Hook de résolution : celui de `logement-source-indisponible.test.ts`, plus le chargement des
// `.tsx` (transpilés par `typescript`, déjà dépendance du dépôt). Aucun réseau, aucun appel Anthropic.
// ════════════════════════════════════════════════════════════════════════════════════════════

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(racine)} + "package.json")("typescript");
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

type Evidence = import("./thermal-evidence.ts").ThermalEvidence;
type ClimatProjete = import("./logement-synthesis-cache.ts").ClimatProjete;
let rendre: (props: Record<string, unknown>) => string;
let deriveThermalEvidence: (dpe: unknown) => Evidence;
let getClimatDataCommune: (insee: string) => Promise<{ commune: { s?: Record<string, { v: Record<string, number> }> } } | null>;
let deriveClimatProjete: (insee: string) => Promise<ClimatProjete | null>;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { ThermalComfortSection } = await import("../components/report/ThermalComfortSection.tsx");
  rendre = (props) => renderToStaticMarkup(createElement(ThermalComfortSection, props as never));
  ({ deriveThermalEvidence } = await import("./thermal-evidence.ts"));
  ({ getClimatDataCommune, deriveClimatProjete } = await import("./drias-json.ts"));
});

/** Le texte que lit le lecteur : balises et feuilles de style retirées, entités décodées. */
function texteRendu(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

// ── Les trois niveaux de preuve, dérivés par la vraie fonction depuis un DPE ─────────────────────
const ENVELOPPE = { type_batiment: "appartement", inertie: "Lourde", ventilation: "VMC SF Hygro A", isolation_murs: "Bonne", isolation_menuiseries: "Moyenne" };
const DPE_A = { ...ENVELOPPE, methode_dpe: "dpe appartement individuel", confort_ete: "insuffisant", traversant: false, protection_solaire: true, brasseur_air: null };
const DPE_B1 = { ...ENVELOPPE, methode_dpe: "dpe appartement généré à partir des données DPE immeuble", confort_ete: null };

// LE TEXTE DPE ET SES LIMITES, À L'IDENTIQUE DE main 0ec2d2fe, phrase climatique en moins. Épinglé
// entier : une phrase ajoutée, retirée ou modifiée ailleurs dans la section fait échouer le test.
const ATTENDU = {
  A: "Faire face à la chaleur D'après le diagnostic, ce logement garde mal la fraîcheur quand il fait chaud. Voici les caractéristiques du logement qui l'expliquent. Logement non traversant Protections solaires renseignées Inertie lourde VMC hygroréglable À confirmer Ces caractéristiques proviennent du DPE établi en 2023. Elles peuvent avoir changé depuis. ▸ Comprendre cette lecture D'où vient cette lecture ? Diagnostic individuel attribué à ce logement, établi en 2023. L'indicateur « bon / moyen / insuffisant » est celui du DPE, pas une catégorie calculée par futur•e. Source : ADEME (base DPE logements existants). Ce qu'elle ne permet pas de conclure Aucune température intérieure mesurée, aucun contrôle de l'état actuel des équipements, aucune prédiction du confort en 2030, 2050 ou 2100, aucune prise en compte du comportement réel des occupants.",
  B1: "Faire face à la chaleur Ce que le diagnostic décrit du bâtiment Inertie lourde VMC hygroréglable Isolation des murs : bonne Menuiseries : moyenne Ce diagnostic reprend principalement des caractéristiques de l'immeuble. Elles ne permettent pas de qualifier précisément le confort d'été de ce logement. ▸ Comprendre cette lecture D'où vient cette lecture ? Diagnostic attribué à cette adresse, établi en 2023, à partir des caractéristiques de l'immeuble. Champs utilisés : Inertie lourde, VMC hygroréglable, Isolation des murs : bonne, Menuiseries : moyenne. Source : ADEME. Ce qu'elle ne permet pas de conclure Aucune température intérieure mesurée, aucun contrôle de l'état actuel des équipements, aucune prédiction du confort en 2030, 2050 ou 2100, aucune prise en compte du comportement réel des occupants.",
  C: "Faire face à la chaleur Les données publiques retrouvées ne permettent pas de qualifier le confort d'été de ce logement. La position sous toiture, les protections solaires et la capacité du logement à se rafraîchir la nuit permettraient d'affiner cette lecture. ▸ Pourquoi cette information manque-t-elle ? Aucun diagnostic de performance énergétique attribuable à cette adresse, ou suffisamment renseigné, n'a été retrouvé dans les données publiques. Ce n'est pas une anomalie : la couverture des DPE reste partielle.",
} as const;

// Une affirmation climatique, sous toutes les formes que prenait la phrase retirée.
const CLIMATIQUE = /progression|nuits? (chaudes?|tropicales?)|climat futur|deviendra|compteront davantage|prendront davantage/i;

// ── Les situations climatiques, lues dans les vraies données DRIAS (palier gwl20, horizon 2050) ──
type Situation = { nom: string; insee: string | null; commune: string };
const SITUATIONS: Situation[] = [
  { nom: "1. hausse importante des nuits tropicales", insee: "30189", commune: "Nîmes" },
  { nom: "2. hausse très faible", insee: "05023", commune: "Briançon" },
  { nom: "3. évolution nulle", insee: "04096", commune: "Jausiers" },
  { nom: "4a. donnée absente (commune hors index)", insee: "99999", commune: "Commune inconnue" },
  { nom: "4b. donnée illisible (la page rend null sur erreur)", insee: null, commune: "Commune illisible" },
  { nom: "5. signal « marquee » dû aux seules journées > 30 °C", insee: "05008", commune: "Aspremont" },
  { nom: "hausse nette sous le seuil « marquee » (null n'est pas une absence)", insee: "17300", commune: "La Rochelle" },
];

/** Ce que la page `/rapport/logement` passe au module : `deriveClimatProjete(...).catch(() => null)`. */
async function climatDeLaPage(s: Situation): Promise<ClimatProjete | null> {
  const avertir = console.warn;
  console.warn = () => {}; // « Commune introuvable » attendu pour 99999
  try {
    return s.insee ? await deriveClimatProjete(s.insee).catch(() => null) : await Promise.reject(new Error("JSON illisible")).catch(() => null);
  } finally { console.warn = avertir; }
}

test("Les situations de référence sont bien celles annoncées (données DRIAS réelles, 2050)", async () => {
  const v = async (insee: string) => (await getClimatDataCommune(insee))!.commune.s!.gwl20.v;
  // Nîmes : 69,1 nuits tropicales projetées, +36,1 → « marquee ».
  assert.equal((await v("30189")).NORTR_yr, 69.1);
  assert.equal((await v("30189")).ATR_yr, 36.1);
  assert.equal((await deriveClimatProjete("30189"))?.chaleur, "marquee");
  // Briançon : +0,2 nuit par an. Jausiers : 0 nuit, aucun écart.
  assert.equal((await v("05023")).ATR_yr, 0.2);
  assert.equal((await v("04096")).NORTR_yr, 0);
  assert.equal((await v("04096")).ATR_yr, 0);
  // Aspremont : « marquee » par les journées > 30 °C (+24,6) alors que les nuits tropicales
  // progressent de moins d'une par an (+0,8). Le signal ne prouve donc pas une hausse des nuits.
  assert.equal((await v("05008")).ATX30D_yr, 24.6);
  assert.ok((await v("05008")).ATR_yr < 1);
  assert.equal((await deriveClimatProjete("05008"))?.chaleur, "marquee");
  // La Rochelle : +18,1 nuits, et pourtant `null` : null ne veut pas dire « pas de réchauffement ».
  assert.equal((await v("17300")).ATR_yr, 18.1);
  assert.equal(await deriveClimatProjete("17300"), null);
  // Briançon, Jausiers, commune absente et donnée illisible donnent aussi `null` : trois réalités différentes.
  for (const s of SITUATIONS.filter((x) => ["05023", "04096", "99999", null].includes(x.insee))) {
    assert.equal(await climatDeLaPage(s), null, s.nom);
  }
});

for (const [niveau, dpe] of [["A", DPE_A], ["B1", DPE_B1], ["C", null]] as const) {
  test(`Niveau ${niveau} : aucune affirmation climatique, quelle que soit la situation de la commune`, async () => {
    const evidence = deriveThermalEvidence(dpe);
    assert.equal(evidence.level, { A: "A_EXACT_UNIT", B1: "B1_EXACT_BUILDING", C: "C_NO_DATA" }[niveau]);
    for (const s of SITUATIONS) {
      const climatProjete = await climatDeLaPage(s);
      // Le nom et le signal climat sont TENDUS au composant : rien ne doit en sortir sans fait.
      const texte = texteRendu(rendre({ evidence, dpeYear: "2023", communeName: s.commune, climatProjete }));
      assert.doesNotMatch(texte, CLIMATIQUE, `${niveau} · ${s.nom}`);
      assert.ok(!texte.includes(s.commune), `${niveau} · ${s.nom} : la commune n'est pas citée`);
      assert.equal(texte, ATTENDU[niveau], `${niveau} · ${s.nom} : le texte DPE et ses limites sont inchangés`);
    }
  });
}

test("Niveau C, base des diagnostics en panne (FUT-65) : le texte de la panne reste, sans phrase climatique", () => {
  const texte = texteRendu(rendre({ evidence: deriveThermalEvidence(null), dpeYear: null, dpeNonVerifiable: true, communeName: "Nîmes" }));
  assert.equal(texte, "Faire face à la chaleur Les données publiques retrouvées ne permettent pas de qualifier le confort d'été de ce logement. La position sous toiture, les protections solaires et la capacité du logement à se rafraîchir la nuit permettraient d'affiner cette lecture. ▸ Pourquoi cette information manque-t-elle ? La base des diagnostics de performance énergétique (ADEME) n'a pas répondu lors de cette collecte : aucun diagnostic n'a pu être lu pour cette adresse.");
});

test("Niveaux A et B1 : les indicateurs et les variantes du diagnostic restent rendus", () => {
  const a = (confort_ete: string) => texteRendu(rendre({ evidence: deriveThermalEvidence({ ...DPE_A, confort_ete }), dpeYear: null }));
  assert.match(a("bon"), /D'après le diagnostic, ce logement garde plutôt bien la fraîcheur en été\./);
  assert.match(a("moyen"), /D'après le diagnostic, ce logement garde moyennement la fraîcheur en été\./);
  assert.match(a("bon"), /Ces caractéristiques proviennent du DPE établi en sa date d'établissement\./);
  const b1 = texteRendu(rendre({ evidence: deriveThermalEvidence({ ...DPE_B1, methode_dpe: "dpe maison individuelle", type_batiment: "maison" }), dpeYear: "2021" }));
  assert.match(b1, /Ce diagnostic ne renseigne pas le confort d'été de ce logement\./);
  for (const t of [a("bon"), a("moyen"), b1]) assert.doesNotMatch(t, CLIMATIQUE);
});
