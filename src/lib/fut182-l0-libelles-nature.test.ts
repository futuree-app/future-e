// FUT-182 · LOT L0 : les libellés « nature » qui affirmaient plus que leur donnée, ou citaient une source
// qu'ils ne lisaient pas. Aucun index, score, seuil ni catégorie ne change : seuls des textes et des sources.
//
//   L0-1  AskFuture : le boisement ADEME se nomme et se distingue du couvert forestier OSO de Territoire.
//   L0-2  reporté à B3 (voir la PR) : le grain « secteur » désigne les abords d'une adresse, pas le rang nature.
//   L0-3  Accueil : la carte « Nature » dit le classement qui la déclenche, sous sa vraie source (plus « OSM / IGN »),
//         et ne naît que des catégories que l'index a mesurées (contre-revue : ni table manuelle, ni département).
//   L0-4  Où vivre : « au plus près de la nature » et « cadre rural préservé » sont retirées.
//   L0-5  Territoire : la carte OSO ne cite plus l'ADEME, qu'elle n'affiche pas.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import gzip from "node:zlib";
import {
  SOURCE_NATURE,
  carteNature,
  carteNatureMachineASous,
  carteNatureMesuree,
  getPreviewCards,
  type VarianteNature,
} from "./accueil/recits.ts";
import type { IndexCommune } from "./comparateur-vie.ts";

// comparateur-vie.ts importe `server-only` : même crochet de résolution que fut176-statuts-urbains.test.ts.
const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
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
}`;
let buildIdentiteCandidates: (c: IndexCommune) => string[];
let deriveCategoriesFromEntry: (c: IndexCommune) => string[];
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  ({ buildIdentiteCandidates, deriveCategoriesFromEntry } = await import("./comparateur-vie.ts"));
});

const lire = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const VARIANTES: VarianteNature[] = ["littoral", "montagne", "cultures_forets"];
// Ce qu'aucune carte Nature ne peut dire : un effet sur la vie, un accès, une proximité, une qualité.
const EXCESSIF = /façonn|rythm|accès à la nature|au plus près|préserv|à proximité|cadre de vie/i;

test("L0-3 · chaque variante de la carte Nature cite la source de son classement, jamais « OSM / IGN »", () => {
  assert.deepEqual(SOURCE_NATURE, {
    littoral: "Loi Littoral (DGALN) · communes classées « Mer »",
    montagne: "IGN (altitudes) · classement futur•e",
    cultures_forets: "OSO 2023 (CESBIO) · occupation des sols",
  });
  for (const v of VARIANTES) {
    const c = carteNature("Saint-Exemple", v);
    assert.equal(c.cle, "nature");
    assert.equal(c.source, SOURCE_NATURE[v]);
    assert.doesNotMatch(c.source, /OSM|OpenStreetMap/);
    assert.doesNotMatch(`${c.titre} ${c.fait}`, EXCESSIF, `${v} : ${c.fait}`);
    assert.ok(c.limite && /ne dit/.test(c.limite), `${v} : la limite dit ce que le classement ne mesure pas`);
  }
});

test("L0-3 · le texte de chaque variante dit le classement, et seulement lui", () => {
  assert.equal(carteNature("Sète", "littoral").fait, "Sète est classée commune littorale maritime au titre de la loi Littoral.");
  assert.equal(carteNature("Chamonix-Mont-Blanc", "montagne").fait, "Chamonix-Mont-Blanc est en altitude, ou proche d'un relief élevé.");
  // Le seuil dit est celui que l'index a constaté, et lui seul (contre-revue L0).
  const cf = (cultures: boolean, foret: boolean) => carteNature("Chartres", "cultures_forets", { cultures, foret });
  assert.equal(cf(true, false).fait, "Selon la carte OSO 2023, les cultures couvrent au moins 30 % de la surface cartographiée de Chartres.");
  assert.equal(cf(false, true).fait, "Selon la carte OSO 2023, la forêt couvre au moins 35 % de la surface cartographiée de Chartres.");
  assert.equal(cf(true, true).fait, "Selon la carte OSO 2023, les cultures couvrent au moins 30 % et la forêt au moins 35 % de la surface cartographiée de Chartres.");
  assert.deepEqual([cf(true, false).titre, cf(false, true).titre, cf(true, true).titre], ["Cultures", "Forêts", "Cultures et forêts"]);
  assert.match(cf(true, false).limite!, /ne fait pas de la commune une commune rurale/);
});

const SANS = {} as never;
const nature = (categories: string[], natureMesuree: string[] | null) =>
  getPreviewCards("Saint-Exemple", ["all", ...categories], SANS, null as never, "2050" as never, null, natureMesuree).find((c) => c.cle === "nature");

test("L0-3 · la carte Nature ne naît que des catégories que l'index a MESURÉES", () => {
  assert.equal(nature([], ["all", "littoral"])?.source, SOURCE_NATURE.littoral);
  assert.equal(nature([], ["all", "littoral", "littoral_atlantique"])?.source, SOURCE_NATURE.littoral);
  assert.equal(nature([], ["all", "montagne"])?.source, SOURCE_NATURE.montagne);
  assert.equal(nature([], ["all", "littoral", "montagne"])?.source, SOURCE_NATURE.littoral);
  assert.equal(nature([], ["all", "rural_agricole"])?.titre, "Cultures");
  assert.equal(nature([], ["all", "rural_forestier"])?.titre, "Forêts");
  assert.equal(nature([], ["all", "urbain_dense_nord"]), undefined, "sans classement mesuré, pas de carte Nature");
});

test("L0-3 · ni la table manuelle ni le repli par département ne fondent une carte Nature", () => {
  // Rodez : `rural_agricole` dans la table manuelle, 0,7 % de cultures selon OSO ; l'index ne l'émet pas.
  assert.equal(nature(["rural_agricole"], ["all", "urbain_dense_nord"]), undefined);
  // Lambesc : `rural_agricole` manuel, 23,5 % de cultures ; l'index n'émet que `rural_forestier` (45,5 % de forêt).
  assert.equal(nature(["rural_agricole"], ["all", "rural_forestier"])?.titre, "Forêts");
  // Repli par département (index muet) : `montagne` posée sur tout un département ne fait pas de carte.
  assert.equal(nature(["montagne"], null), undefined);
  // `rural_viticole`, `littoral_mediterranee` : catégories manuelles sans mesure derrière, jamais lues ici.
  assert.equal(nature(["rural_viticole", "littoral_mediterranee"], ["all"]), undefined);
  // Le branchement de l'accueil : seules les catégories d'une réponse `source: "index"` arrivent à la carte.
  const accueil = lire("../components/FutureELanding.tsx");
  assert.match(accueil, /const natureMesuree = signaux\?\.source === 'index' && Array\.isArray\(signaux\?\.categories\) \? signaux\.categories : null;/);
  assert.match(accueil, /natureMesuree: communeMeta\?\.natureMesuree \?\? null,/);
});

test("L0-3 · sur tout l'index, la carte Nature ne dit que ce que la commune mesure", () => {
  const idx = JSON.parse(gzip.gunzipSync(readFileSync(new URL("../../data/comparateur-index.json.gz", import.meta.url))).toString("utf8")) as { communes: IndexCommune[] };
  const vu = { littoral: 0, montagne: 0, cultures: 0, forets: 0 };
  for (const c of idx.communes) {
    const carte = carteNatureMesuree(c.nom, deriveCategoriesFromEntry(c));
    if (!carte) continue;
    const comp = c.nature?.composition;
    if (carte.source === SOURCE_NATURE.littoral) {
      vu.littoral++;
      assert.ok((c.loi_effective ?? []).includes("Mer"), `${c.insee} : classée « Mer »`);
    } else if (carte.source === SOURCE_NATURE.montagne) {
      vu.montagne++;
      assert.ok((c.altitude ?? 0) >= 800 || (c.relief_proximite ?? 0) >= 70, `${c.insee} : altitude ou relief`);
    } else {
      if (/cultures couvrent au moins 30/.test(carte.fait)) { vu.cultures++; assert.ok((comp?.agricole ?? 0) >= 30, `${c.insee} : cultures ≥ 30`); }
      if (/forêt (couvre )?au moins 35/.test(carte.fait)) { vu.forets++; assert.ok((comp?.foret ?? 0) >= 35, `${c.insee} : forêt ≥ 35`); }
    }
  }
  assert.ok(Object.values(vu).every((n) => n > 500), JSON.stringify(vu));
});

// Marseille (ses 16 arrondissements dans l'index) et La Rochelle (17300) sont classées « Mer » : vérifié dans l'index.
test("L0-3 · la machine à sous de l'accueil : Marseille et La Rochelle, classées « Mer », sous la même carte", () => {
  for (const v of ["Marseille", "La Rochelle"] as const) {
    const c = carteNatureMachineASous(v);
    assert.equal(c.titre, `Commune littorale · ${v}`);
    assert.equal(c.source, SOURCE_NATURE.littoral);
  }
  const accueil = lire("../components/FutureELanding.tsx");
  assert.doesNotMatch(accueil, /OSM \/ IGN/);
  assert.doesNotMatch(accueil, /l'accès à la nature (pèse|marque)/);
  assert.match(accueil, /carteNatureMachineASous\('Marseille'\)/);
  assert.match(accueil, /carteNatureMachineASous\('La Rochelle'\)/);
  assert.doesNotMatch(lire("./accueil/recits.ts"), /source: "OSM \/ IGN"/);
});

test("L0-1 · AskFuture : la ligne de boisement nomme l'ADEME et refuse la comparaison avec la forêt OSO", () => {
  const src = lire("./ask/system-prompt.ts");
  assert.doesNotMatch(src, /push\("Taux boisement \(%\)"/);
  assert.match(src, /"Taux de boisement selon l'ADEME \(%, définition et millésime non documentés ; ce n'est pas le couvert forestier OSO de l'écran Territoire, ne les comparez pas\)"/);
});

test("L0-4 · Où vivre : aucune commune ne reçoit plus « au plus près de la nature » ni « cadre rural préservé »", () => {
  const idx = JSON.parse(gzip.gunzipSync(readFileSync(new URL("../../data/comparateur-index.json.gz", import.meta.url))).toString("utf8")) as { communes: IndexCommune[] };
  let natureForte = 0;
  for (const c of idx.communes) {
    const promesses = buildIdentiteCandidates(c);
    assert.ok(!promesses.includes("Pour vivre au plus près de la nature."), c.insee);
    assert.ok(!promesses.includes("Pour un cadre rural préservé, loin de l'agitation."), c.insee);
    assert.ok(promesses.length > 0, `${c.insee} : le repli neutre reste toujours disponible`);
    if ((c.nature?.score ?? 0) >= 60) natureForte++;
  }
  assert.ok(natureForte > 10_000, "le test parcourt bien des communes où la nature est forte");
});

test("L0-5 · Territoire : la carte OSO ne cite plus l'ADEME ; le repli ADEME garde sa carte et sa source", () => {
  const src = lire("../components/report/QuartierClimatData.tsx");
  assert.doesNotMatch(src, /OSO · ADEME/);
  assert.doesNotMatch(src, /ADEME \(taux de boisement\)/);
  assert.match(src, /src: "OSO 2023 · échelle communale"/);
  assert.match(src, /label: "Taux de boisement"/);
});
