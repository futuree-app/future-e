import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-116 (20/10/2026) : LE MODULE TERRITOIRE NE RACONTE PLUS UNE ÉVOLUTION QU'IL N'A PAS MESURÉE.
//
// Reproduit sur main bdf3fd4a : le récit « Ce que cela raconte » des volets climat
// (`buildClimatWhy`, `QuartierClimatData.tsx`) se choisissait sur le seul archétype du lieu
// (Littoral, Méditerranéen, Montagne, Intérieur), jamais sur la donnée du volet. Il écrivait :
//   · « La progression s'accélère, elle ne fait pas que monter. » à TOUTES les communes, alors
//     qu'aucune accélération n'est calculée (trois paliers de réchauffement, pas une série) ;
//     à Jausiers, 0 jour au-dessus de 30 °C à tous les horizons, sous une face « Restent rares » ;
//   · « les nuits d'été gardent de plus en plus la chaleur du jour » à tout le littoral, y compris
//     à Cherbourg en 2030 (+0,8 nuit, face « Quasi inexistantes ») ;
//   · des durées, des dates et des causes (« s'installent plus tôt et durent plus longtemps »,
//     « l'altitude a longtemps tenu les fortes chaleurs à distance ») qu'aucune colonne ne porte,
//     et que les données contredisent (Latour-de-France, classée montagne : 25 jours chauds de
//     référence ; Sault, classée méditerranéenne : aucune nuit tropicale de référence).
//
// Le récit suit désormais la RÈGLE DE LA FACE (`movementOrLevel`) : rare, écart faible, hausse
// nette, écart inconnu. On rend ici le VRAI volet (`MetricDrawer`, react-dom/server) avec le
// détail construit par `buildFactors` sur les vraies données DRIAS (lecture seule de
// `drias-json.ts`), et la VRAIE grille de cartes (`QuartierAside`) pour la face. Aucun réseau,
// aucun appel Anthropic.
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

type Horizon = "gwl15" | "gwl20" | "gwl30";
type Scenarios = Record<string, { h: string; v: Record<string, number> }>;
type Detail = { eyebrow: string; headline: string; why: string; breakdown?: { label: string; value: string }[] };
type Facteur = { label: string; val: string; detail?: Detail };

type Era5 = { delta_c: number; baseline_mean_c: number; recent_mean_c: number; data_through_year: number };
type Autres = { era5?: Era5 | null; vigieau?: unknown; onde?: unknown };
let facteurs: (scenarios: Scenarios | null, horizon: Horizon, commune: string, autres?: Autres) => Facteur[];
let volet: (detail: Detail) => string;
let grille: (scenarios: Scenarios | null, commune: string) => string;
let drias: (insee: string) => Promise<Scenarios>;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const mod = await import("../components/report/QuartierClimatData.tsx");
  const { MetricDrawer } = await import("../components/MetricDrawer.tsx");
  // Mêmes arguments que `QuartierAside` : seules les données climat sont fournies, le reste est absent.
  facteurs = (scenarios, horizon, commune, autres = {}) =>
    (mod.buildFactors as (...a: unknown[]) => Facteur[])(
      scenarios, horizon, null, null, autres.vigieau ?? null, autres.onde ?? null, commune,
      null, null, null, null, null, null, null, null, null, autres.era5 ?? null, null,
    );
  volet = (detail) => texteRendu(renderToStaticMarkup(createElement(MetricDrawer, { detail: detail as never, onClose: () => {} })));
  // La page rend la grille à l'horizon par défaut (2050) : c'est ce que voit le lecteur en arrivant.
  grille = (scenarios, commune) =>
    texteRendu(renderToStaticMarkup(createElement(mod.QuartierAside, { communeName: commune, scenarios, georisques: null, drought: null, territoire: null, vigieau: null } as never)));
  const { getClimatDataCommune } = await import("./drias-json.ts");
  drias = async (insee) => {
    const c = await getClimatDataCommune(insee);
    assert.ok(c?.commune.s, `données DRIAS de ${insee}`);
    return c.commune.s as Scenarios;
  };
});

/** Le texte que lit le lecteur : balises et feuilles de style retirées, entités décodées. */
function texteRendu(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

const carte = (fs: Facteur[], label: string) => fs.find((f) => f.label === label)!;
const CHALEUR = "Chaleurs estivales";
const NUITS = "Nuits tropicales";
const TEMP = "Températures moyennes";
const recit = (fs: Facteur[], label: string) => carte(fs, label).detail!.why;

// Toutes les propositions retirées, sous leurs formes connues. Aucune ne doit revenir, nulle part.
const NON_DEMONTRE = new RegExp([
  "accél", "ne fait pas que monter",
  "de plus en plus", "peu à peu", "part ordinaire",
  "plus tôt", "durent plus longtemps", "longueur des épisodes", "la saison s'étire", "sa durée",
  "font déjà partie", "fait déjà partie", "désormais", "commencent à céder", "étés les plus chauds",
  "a longtemps", "plus souvent", "les extrêmes gagnent", "l'une après l'autre",
  // Surtitres, sous-titres, infobulle et note du même volet (revue PR #70).
  "s'intensifi", "intensification", "ne retombent plus", "rafraîchit plus", "a déjà commencé", "climat qui change",
  "transforme le paysage",
  "s'assèche", "changement de fond", "dans la durée", "faiblissent", "se rétracte",
].join("|"), "i");

const TOUS_LES_HORIZONS: Horizon[] = ["gwl15", "gwl20", "gwl30"];
const ANNEE: Record<Horizon, string> = { gwl15: "2030", gwl20: "2050", gwl30: "2100" };

// ── Les situations, lues dans les vraies données DRIAS ──────────────────────────────────────────
test("Les situations de référence sont bien celles annoncées (données DRIAS réelles)", async () => {
  const v = async (insee: string, h: Horizon) => (await drias(insee))[h].v;
  // La Rochelle (Littoral) : hausse nette des jours chauds et des nuits tropicales.
  assert.equal((await v("17300", "gwl20")).ATX30D_yr, 11.3);
  assert.equal((await v("17300", "gwl20")).ATR_yr, 18.1);
  // Jausiers (Montagne) : aucun jour au-dessus de 30 °C, à aucun horizon ; nuits tropicales au plus 0,1.
  for (const h of TOUS_LES_HORIZONS) assert.equal((await v("04096", h)).NORTX30D_yr, 0);
  assert.equal((await v("04096", "gwl30")).NORTR_yr, 0.1);
  // Cherbourg-en-Cotentin (Littoral) : 1,3 jour chaud en 2050 (« Restent rares »), 0,9 nuit tropicale en 2030
  // (+0,8), mais 3 nuits en 2050 : le volet des nuits s'ouvre donc aussi en 2030.
  assert.equal((await v("50129", "gwl20")).NORTX30D_yr, 1.3);
  assert.equal((await v("50129", "gwl15")).NORTR_yr, 0.9);
  assert.equal((await v("50129", "gwl15")).ATR_yr, 0.8);
  assert.equal((await v("50129", "gwl20")).NORTR_yr, 3);
  // Géfosse-Fontenay : 1,6 jour chaud en 2050, à +1,4 seulement (écart faible, face au niveau).
  assert.equal((await v("14298", "gwl20")).NORTX30D_yr, 1.6);
  assert.equal((await v("14298", "gwl20")).ATX30D_yr, 1.4);
  // Binic-Étables-sur-Mer : 1,5 nuit tropicale en 2030, à +1,3 (écart faible).
  assert.equal((await v("22055", "gwl15")).NORTR_yr, 1.5);
  assert.equal((await v("22055", "gwl15")).ATR_yr, 1.3);
  // Nîmes (Méditerranéen) : +31,7 jours chauds, +36,1 nuits tropicales en 2050.
  assert.equal((await v("30189", "gwl20")).ATX30D_yr, 31.7);
  assert.equal((await v("30189", "gwl20")).ATR_yr, 36.1);
  // Latour-de-France, classée montagne : 51,7 jours chauds en 2050 dont +26,9, soit ≈ 25 de référence.
  assert.equal((await v("66096", "gwl20")).NORTX30D_yr, 51.7);
  assert.equal((await v("66096", "gwl20")).ATX30D_yr, 26.9);
  // Sault, classée méditerranéenne : 2,1 nuits tropicales en 2050, toutes d'écart (aucune de référence).
  assert.equal((await v("84123", "gwl20")).NORTR_yr, 2.1);
  assert.equal((await v("84123", "gwl20")).ATR_yr, 2.1);
});

// ── 1. Aucune proposition non démontrée, sur aucun cas, à aucun horizon ─────────────────────────
const TEMOINS = [
  ["17300", "La Rochelle"], ["04096", "Jausiers"], ["50129", "Cherbourg-en-Cotentin"], ["14298", "Géfosse-Fontenay"],
  ["22055", "Binic-Étables-sur-Mer"], ["30189", "Nîmes"], ["66096", "Latour-de-France"], ["84123", "Sault"],
] as const;

test("Aucun volet climat n'affirme une accélération, une tendance, une durée ou une cause non calculées", async () => {
  for (const [insee, nom] of TEMOINS) {
    const s = await drias(insee);
    for (const h of TOUS_LES_HORIZONS) {
      for (const f of facteurs(s, h, nom) as (Facteur & { tip?: string })[]) {
        if (f.tip) assert.doesNotMatch(f.tip, NON_DEMONTRE, `${nom} · ${ANNEE[h]} · ${f.label} (infobulle)`);
        if (!f.detail) continue;
        assert.doesNotMatch(volet(f.detail), NON_DEMONTRE, `${nom} · ${ANNEE[h]} · ${f.label}`);
      }
    }
  }
});

// ── 2. « Restent rares » : le récit dit la rareté, pas une progression ──────────────────────────
test("Jausiers : « Restent rares » à tous les horizons, et le volet le dit sans rien ajouter", async () => {
  const s = await drias("04096");
  for (const h of TOUS_LES_HORIZONS) {
    const fs = facteurs(s, h, "Jausiers");
    assert.equal(carte(fs, CHALEUR).val, "Restent rares");
    assert.equal(
      recit(fs, CHALEUR),
      `À Jausiers, les jours au-dessus de 30 °C resteraient très rares à l'horizon ${ANNEE[h]} : moins de deux par an en moyenne dans les projections.`,
    );
    // Les nuits tropicales n'y dépassent jamais 0,1 : pas de volet, la face dit la rareté.
    assert.equal(carte(fs, NUITS).val, "Quasi inexistantes");
    assert.equal(carte(fs, NUITS).detail, undefined);
  }
});

test("Cherbourg-en-Cotentin 2050 : « Restent rares » côté chaleur, la phrase d'accélération a disparu", async () => {
  const fs = facteurs(await drias("50129"), "gwl20", "Cherbourg-en-Cotentin");
  assert.equal(carte(fs, CHALEUR).val, "Restent rares");
  const texte = volet(carte(fs, CHALEUR).detail!);
  assert.match(texte, /À Cherbourg-en-Cotentin, les jours au-dessus de 30 °C resteraient très rares à l'horizon 2050 : moins de deux par an en moyenne dans les projections\./);
  assert.doesNotMatch(texte, /accél|part ordinaire|peu à peu/);
});

test("Cherbourg-en-Cotentin 2030 (Littoral) : volet des nuits ouvert sur « Quasi inexistantes », sans « de plus en plus »", async () => {
  const fs = facteurs(await drias("50129"), "gwl15", "Cherbourg-en-Cotentin");
  assert.equal(carte(fs, NUITS).val, "Quasi inexistantes");
  assert.equal(
    recit(fs, NUITS),
    "À Cherbourg-en-Cotentin, les nuits tropicales resteraient très rares à l'horizon 2030 : moins de deux par an en moyenne dans les projections.",
  );
});

// ── 3. Écart faible : le récit respecte la faiblesse du signal ──────────────────────────────────
test("Géfosse-Fontenay 2050 (écart +1,4 jour) et Binic 2030 (écart +1,3 nuit) : le récit dit un écart faible", async () => {
  const g = facteurs(await drias("14298"), "gwl20", "Géfosse-Fontenay");
  assert.equal(carte(g, CHALEUR).val, "2 jours chauds/an en 2050");
  assert.equal(
    recit(g, CHALEUR),
    "À Géfosse-Fontenay, le nombre de jours au-dessus de 30 °C bougerait peu à l'horizon 2050 : l'écart avec la période 1976-2005 resterait inférieur à deux par an dans les projections.",
  );
  const b = facteurs(await drias("22055"), "gwl15", "Binic-Étables-sur-Mer");
  assert.equal(carte(b, NUITS).val, "2 nuits/an en 2030");
  assert.equal(
    recit(b, NUITS),
    "À Binic-Étables-sur-Mer, le nombre de nuits tropicales bougerait peu à l'horizon 2030 : l'écart avec la période 1976-2005 resterait inférieur à deux par an dans les projections.",
  );
});

// ── 4. Hausse nette : le signal défavorable reste visible, chiffré, daté ────────────────────────
test("La Rochelle 2050 (Littoral) : la hausse mesurée est décrite, avec le même chiffre et le même horizon que la face", async () => {
  const fs = facteurs(await drias("17300"), "gwl20", "La Rochelle");
  assert.equal(carte(fs, CHALEUR).val, "+11 jours chauds d'ici 2050");
  assert.equal(
    recit(fs, CHALEUR),
    "À La Rochelle, les projections indiquent environ 11 jours de plus par an au-dessus de 30 °C à l'horizon 2050, par rapport à la période 1976-2005. On ne sait toutefois pas si ces journées seraient isolées ou concentrées dans plusieurs épisodes.",
  );
  assert.equal(carte(fs, NUITS).val, "+18 nuits d'ici 2050");
  assert.equal(
    recit(fs, NUITS),
    "À La Rochelle, les projections indiquent environ 18 nuits tropicales de plus par an à l'horizon 2050, par rapport à la période 1976-2005. On ne sait toutefois pas si ces nuits seraient isolées ou successives.",
  );
  // Le volet garde sa trajectoire chiffrée : référence reconstruite, puis chaque horizon.
  const nuits = volet(carte(fs, NUITS).detail!);
  assert.match(nuits, /≈ 5 → 23 nuits par an d'ici 2050/);
  assert.match(nuits, /Fin du XXe siècle ≈ 5 nuits Horizon 2030 14 nuits Horizon 2050 23 nuits Horizon 2100 42 nuits/);
});

test("Nîmes 2100 (Méditerranéen) : la hausse forte n'est pas atténuée", async () => {
  const fs = facteurs(await drias("30189"), "gwl30", "Nîmes");
  assert.equal(carte(fs, CHALEUR).val, "+52 jours chauds d'ici 2100");
  assert.match(recit(fs, CHALEUR), /^À Nîmes, les projections indiquent environ 52 jours de plus par an au-dessus de 30 °C à l'horizon 2100, par rapport à la période 1976-2005\./);
  assert.equal(carte(fs, NUITS).val, "+59 nuits d'ici 2100");
  assert.match(recit(fs, NUITS), /^À Nîmes, les projections indiquent environ 59 nuits tropicales de plus par an à l'horizon 2100, par rapport à la période 1976-2005\./);
});

// ── 5. L'archétype ne décide plus d'une cause ni d'un passé ─────────────────────────────────────
test("Latour-de-France (Montagne, ≈ 25 jours chauds de référence) et Sault (Méditerranéen, aucune nuit de référence)", async () => {
  const l = facteurs(await drias("66096"), "gwl20", "Latour-de-France");
  assert.match(recit(l, CHALEUR), /^À Latour-de-France, les projections indiquent environ 27 jours de plus par an au-dessus de 30 °C/);
  for (const f of l) if (f.detail) assert.doesNotMatch(f.detail.why, /altitude|froid/i, f.label);
  const s = facteurs(await drias("84123"), "gwl20", "Sault");
  assert.match(recit(s, NUITS), /^À Sault, les projections indiquent environ 2 nuits tropicales de plus par an/);
  for (const f of s) if (f.detail) assert.doesNotMatch(f.detail.why, /déjà|méditerran/i, f.label);
});

// ── 6. Températures : le réchauffement des deux saisons, à l'horizon de la face ─────────────────
test("Températures moyennes : le récit date le réchauffement et garde la nuance été/hiver", async () => {
  const j = facteurs(await drias("04096"), "gwl20", "Jausiers");
  assert.equal(carte(j, TEMP).val, "Été +3 °C · hiver +2,3 °C d'ici 2050");
  assert.equal(
    recit(j, TEMP),
    "À Jausiers, les projections indiquent un été et un hiver plus chauds à l'horizon 2050 que sur la période 1976-2005. Ici, l'été se réchaufferait plus vite que l'hiver.",
  );
  const r = facteurs(await drias("17300"), "gwl20", "La Rochelle");
  assert.equal(recit(r, TEMP), "À La Rochelle, les projections indiquent un été et un hiver plus chauds à l'horizon 2050 que sur la période 1976-2005.");
});

// ── 6 bis. LE PANNEAU ENTIER (revue PR #70) : surtitre, sous-titre, trajectoire, récit, note ────────
// Le récit était juste, mais le surtitre et le sous-titre AU-DESSUS de lui disaient encore « Des étés qui
// s'intensifient », « Des nuits qui ne retombent plus », « l'air ne se rafraîchit plus », et la note ERA5
// concluait « Le réchauffement projeté a déjà commencé » quel que soit le signe de l'écart. On épingle donc
// le TEXTE ENTIER du volet : une phrase ajoutée ou modifiée n'importe où le fait échouer.
const PIED_CHALEUR = "Méthodologie et sources Projections DRIAS-TRACC, Météo-France · jours de forte chaleur (Tmax > 30°C), période de référence 1976-2005 Poser une question à futur•e →";
const PIED_NUITS = "Méthodologie et sources Projections DRIAS-TRACC, Météo-France · nuits tropicales (Tmin > 20°C), période de référence 1976-2005 Poser une question à futur•e →";
const SOUS_TITRE_CHALEUR = "Combien de jours par an dépasseraient 30 °C ?";
const SOUS_TITRE_NUITS = "Une nuit tropicale est une nuit où la température ne descend pas sous 20 °C.";

test("Panneau entier · Cherbourg-en-Cotentin 2030, nuits « Quasi inexistantes »", async () => {
  const fs = facteurs(await drias("50129"), "gwl15", "Cherbourg-en-Cotentin");
  assert.equal(
    volet(carte(fs, NUITS).detail!),
    `✕ Le seuil des 20 °C Nuits tropicales ≈ 0 → 1 nuits par an d'ici 2030 ${SOUS_TITRE_NUITS} Nuits au-dessus de 20°C, par an Fin du XXe siècle ≈ 0 nuits Horizon 2030 1 nuits Horizon 2050 3 nuits Horizon 2100 8 nuits Ce que cela raconte À Cherbourg-en-Cotentin, les nuits tropicales resteraient très rares à l'horizon 2030 : moins de deux par an en moyenne dans les projections. ${PIED_NUITS}`,
  );
});

test("Panneau entier · Jausiers 2050, chaleur « Restent rares » ; et l'infobulle des nuits sans volet", async () => {
  const fs = facteurs(await drias("04096"), "gwl20", "Jausiers");
  assert.equal(
    volet(carte(fs, CHALEUR).detail!),
    `✕ Le seuil des 30 °C Chaleurs estivales ≈ 0 → 0 jours chauds par an d'ici 2050 ${SOUS_TITRE_CHALEUR} Jours au-dessus de 30°C, par an Fin du XXe siècle ≈ 0 jours Horizon 2030 0 jours Horizon 2050 0 jours Horizon 2100 0 jours Ce que cela raconte À Jausiers, les jours au-dessus de 30 °C resteraient très rares à l'horizon 2050 : moins de deux par an en moyenne dans les projections. ${PIED_CHALEUR}`,
  );
  // Sans volet, la carte des nuits porte une infobulle : elle disait « l'air ne rafraîchit plus le territoire »
  // et « un climat qui change près de chez soi » sous « Quasi inexistantes ».
  assert.equal(
    (carte(fs, NUITS) as Facteur & { tip?: string }).tip,
    "Une nuit tropicale est une nuit où la température ne descend pas sous 20 °C. La carte en donne le nombre moyen par an, selon les projections.",
  );
});

test("Panneau entier · Nîmes 2100, hausse forte : la trajectoire et le chiffre restent intacts", async () => {
  const fs = facteurs(await drias("30189"), "gwl30", "Nîmes");
  assert.equal(
    volet(carte(fs, CHALEUR).detail!),
    `✕ Le seuil des 30 °C Chaleurs estivales ≈ 36 → 89 jours chauds par an d'ici 2100 ${SOUS_TITRE_CHALEUR} Jours au-dessus de 30°C, par an Fin du XXe siècle ≈ 36 jours Horizon 2030 56 jours Horizon 2050 68 jours Horizon 2100 89 jours Jours au-dessus de 35°C Environ 31 par an en 2100 Ce que cela raconte À Nîmes, les projections indiquent environ 52 jours de plus par an au-dessus de 30 °C à l'horizon 2100, par rapport à la période 1976-2005. On ne sait toutefois pas si ces journées seraient isolées ou concentrées dans plusieurs épisodes. ${PIED_CHALEUR}`,
  );
});

// ERA5 vient de Supabase (`commune_era5_trend`), hors de portée d'un test sans réseau : les trois écarts
// ci-dessous sont des FIXTURES SYNTHÉTIQUES déclarées, pour couvrir les signes que la note doit restituer tels quels.
test("Panneau entier · note ERA5 (fixtures synthétiques) : la mesure et ses périodes, signe compris, sans conclusion", async () => {
  const s = await drias("30189");
  const panneau = (delta_c: number) =>
    volet(carte(facteurs(s, "gwl20", "Nîmes", { era5: { delta_c, baseline_mean_c: 14, recent_mean_c: 14 + delta_c, data_through_year: 2024 } }), TEMP).detail!);
  const attendu = (ecart: string) =>
    `✕ Trajectoire climatique Températures moyennes Été +2,4 °C d'ici 2050 Hiver +1,9 °C Comment les températures d'été et d'hiver pourraient évoluer. Été moyen, par horizon Fin du XXe siècle 23,3 °C Horizon 2030 25 °C Horizon 2050 25,7 °C Horizon 2100 27,4 °C Été 2050 25,7 °C (+2,4) Hiver 2050 8,6 °C (+1,9) Ce que cela raconte À Nîmes, les projections indiquent un été et un hiver plus chauds à l'horizon 2050 que sur la période 1976-2005. Ici, l'été se réchaufferait plus vite que l'hiver. Observé Température moyenne annuelle 2015-2024 : ${ecart} °C par rapport à 1961-1990 (réanalyse Copernicus / ERA5-Land). Méthodologie et sources Projections DRIAS-TRACC, Météo-France (moyennes saisonnières, période de référence 1976-2005) · réanalyse ERA5-Land, Copernicus (écart observé) Poser une question à futur•e →`;
  assert.equal(panneau(1.42), attendu("+1,4"));
  assert.equal(panneau(-0.3), attendu("-0,3"));
  assert.equal(panneau(0), attendu("+0"));
  for (const d of [1.42, -0.3, 0]) assert.doesNotMatch(panneau(d), /déjà|a commencé|valide|confirme/i);
});

// ── 6 ter. SÉCHERESSE (revue PR #70) : trois sources, jamais confondues ─────────────────────────
// VigiEau (restriction du moment), ONDE (relevé de terrain), DRIAS (sols secs projetés). Le volet
// affirmait une tendance (« Un territoire qui s'assèche », « un changement de fond »), et son titre
// retombait PAR DÉFAUT sur « Cours d'eau à sec observé » sans regarder ONDE. VigiEau et ONDE sont des
// données vivantes, hors de portée d'un test sans réseau : leurs objets ci-dessous sont des FIXTURES
// SYNTHÉTIQUES déclarées, au format exact de `VigieauSummary` et `EaufranceSummary["drought"]`.
const SECHERESSE = "Sécheresse des sols";
const vigieau = (maxLevel: string | null, status: "ok" | "unavailable" = "ok") =>
  ({ inseeCode: "00000", maxLevel, topZone: null, zones: [], status, consultedAt: "2026-10-20T09:00:00.000Z" });
const onde = (isDry: boolean) => ({ lastObservationDate: "2026-08-12", riverName: "Le Ruisseau", status: isDry ? "Assec" : "Écoulement visible", isDry });
const RECIT_SECHERESSE = "Une restriction est une décision préfectorale prise pour la période en cours. L'état d'un cours d'eau est un relevé ponctuel sur le terrain. Les jours de sols secs sont une moyenne annuelle projetée. L'une de ces lectures ne permet pas de déduire les autres.";
const TETE_SECHERESSE = "✕ L'eau et les sols Sécheresse des sols";
const SOUS_TITRE_SECHERESSE = "Restrictions d'eau, cours d'eau et sols : trois lectures à ne pas confondre.";
const PIED_SECHERESSE = "Ce que cela change " + RECIT_SECHERESSE + " Méthodologie et sources VigiEau (arrêtés préfectoraux) · réseau ONDE, Hub'Eau (cours d'eau) · projections DRIAS, Météo-France Poser une question à futur•e →";

test("Sécheresse · VigiEau seule (vigilance, sans ONDE ni DRIAS) : jamais « Cours d'eau à sec observé »", () => {
  const f = carte(facteurs(null, "gwl20", "Commune test", { vigieau: vigieau("vigilance") }), SECHERESSE);
  assert.equal(f.val, "Vigilance");
  assert.equal(
    volet(f.detail!),
    `${TETE_SECHERESSE} Vigilance sécheresse, sans restriction ${SOUS_TITRE_SECHERESSE} Le fil de la sécheresse État consulté le 20 octobre 2026 Vigilance sécheresse, sans restriction ${PIED_SECHERESSE}`,
  );
});

test("Sécheresse · registre VigiEau en panne portant un niveau : le titre dit l'indisponibilité, pas un cours d'eau à sec", () => {
  // Objet incohérent (panne + niveau) : aujourd'hui `getVigieauSummary` ne le produit pas, mais c'est
  // exactement la branche où l'ancien titre affirmait l'observation par défaut.
  const f = carte(facteurs(null, "gwl20", "Commune test", { vigieau: vigieau("alerte", "unavailable") }), SECHERESSE);
  const texte = volet(f.detail!);
  assert.match(texte, /^✕ L'eau et les sols Sécheresse des sols État des restrictions non disponible /);
  assert.doesNotMatch(texte, /à sec/);
});

test("Sécheresse · ONDE seule, cours d'eau réellement à sec : l'observation est dite, datée", () => {
  const f = carte(facteurs(null, "gwl20", "Commune test", { onde: onde(true) }), SECHERESSE);
  assert.equal(f.val, "Cours d'eau à sec");
  assert.equal(
    volet(f.detail!),
    `${TETE_SECHERESSE} Cours d'eau à sec observé ${SOUS_TITRE_SECHERESSE} Le fil de la sécheresse Aujourd'hui État des restrictions non disponible Relevé de terrain du 12 août 2026 Cours d'eau à sec par endroits ${PIED_SECHERESSE}`,
  );
  // ONDE qui ne relève rien de sec, sans autre source : pas de volet (rien à raconter, la face dit « — »).
  const sec = carte(facteurs(null, "gwl20", "Commune test", { onde: onde(false) }), SECHERESSE);
  assert.equal(sec.val, "—");
  assert.equal(sec.detail, undefined);
});

test("Sécheresse · DRIAS seule (La Rochelle 2050) : la projection, à son horizon, sans tendance", async () => {
  const s = await drias("17300");
  const jours = Math.round(s.gwl20.v.NORSWI04_yr);
  const f = carte(facteurs(s, "gwl20", "La Rochelle"), SECHERESSE);
  assert.equal(f.val, `${jours} jours/an en 2050`);
  assert.equal(
    volet(f.detail!),
    `${TETE_SECHERESSE} Environ ${jours} jours de sols secs par an à l'horizon 2050 ${SOUS_TITRE_SECHERESSE} Le fil de la sécheresse Aujourd'hui État des restrictions non disponible À l'horizon 2050 Environ ${jours} jours de sols secs par an ${PIED_SECHERESSE}`,
  );
  assert.doesNotMatch(volet(f.detail!), /s'assèche|changement de fond|dans la durée|faiblissent|se rétracte|à sec/);
});

// ── 7. Données absentes ou incomplètes : jamais une situation favorable implicite ───────────────
test("Sans données climat : aucune carte climat ne raconte quoi que ce soit, la face affiche « — »", () => {
  const fs = facteurs(null, "gwl20", "Commune sans données");
  for (const label of [CHALEUR, NUITS, TEMP]) {
    assert.equal(carte(fs, label).val, "—", label);
    assert.equal(carte(fs, label).detail, undefined, label);
  }
});

test("Écart non publié pour l'horizon : le récit dit qu'il ne peut pas qualifier l'évolution", async () => {
  // La Rochelle, privée de ses colonnes d'écart : le niveau reste, la comparaison manque.
  const s = await drias("17300");
  const sansEcart: Scenarios = Object.fromEntries(
    Object.entries(s).map(([h, x]) => [h, { ...x, v: Object.fromEntries(Object.entries(x.v).filter(([k]) => !/^A(TX30D|TR|TMm)/.test(k))) }]),
  );
  const fs = facteurs(sansEcart, "gwl20", "La Rochelle");
  assert.equal(carte(fs, CHALEUR).val, "18 jours chauds/an en 2050");
  assert.equal(
    recit(fs, CHALEUR),
    "À La Rochelle, les projections donnent environ 18 jours au-dessus de 30 °C par an à l'horizon 2050. Faute d'écart publié avec la période 1976-2005, on ne peut pas dire s'il y en aurait plus ou moins qu'avant.",
  );
  assert.equal(
    recit(fs, NUITS),
    "À La Rochelle, les projections donnent environ 23 nuits tropicales par an à l'horizon 2050. Faute d'écart publié avec la période 1976-2005, on ne peut pas dire s'il y en aurait plus ou moins qu'avant.",
  );
  for (const label of [CHALEUR, NUITS]) assert.doesNotMatch(recit(fs, label), /proche|rares?|davantage|de plus par an/, label);
});

// ── 8. La grille réellement rendue (2050, horizon par défaut de la page) ────────────────────────
test("La grille rendue garde les faces chiffrées : La Rochelle en hausse, Jausiers « Restent rares »", async () => {
  const lr = grille(await drias("17300"), "La Rochelle");
  assert.match(lr, /Chaleurs estivales \+11 jours chauds d'ici 2050/);
  assert.match(lr, /Nuits tropicales \+18 nuits d'ici 2050/);
  const ja = grille(await drias("04096"), "Jausiers");
  assert.match(ja, /Chaleurs estivales Restent rares/);
  assert.match(ja, /Nuits tropicales Quasi inexistantes/);
  for (const t of [lr, ja]) assert.doesNotMatch(t, NON_DEMONTRE);
});
