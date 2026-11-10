// FUT-177 : les CONCLUSIONS tirées de l'occupation des sols. FUT-175 a fixé la mesure (parts OSO sur les terres, eau à
// part) ; ce fichier garde ce qu'on en DIT : la catégorie, la projection, le texte déterministe, les contrôles de la
// synthèse et la carte. Deux défauts de l'audit FUT-53 :
//   A5 : « Faible présence d'espaces naturels » échappait au refus du « très bâti », alors que ses terres se partagent
//        entre cultures et espaces urbanisés sans que ces derniers dominent (Carpiquet) ;
//   A7 : « urbanisé » (OSO) compte routes, parkings et zones d'activité ; la projection ne le disait qu'à moitié.
// Tests sur l'index RÉEL : chaque assertion part des faits de la commune, jamais d'une valeur supposée.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { buildTerritoireSnapshot, landCategory, landShares, LAND_LABEL, type LandCategory, type TerritoireInputs } from "./territoire/facts.ts";
import { grilleDensiteDe } from "./territoire/grille-densite.ts";
import { derivedOf } from "./facts/contract.ts";
import { buildTerritoryCards, buildTerritoryIdentity } from "./territory-identity.ts";
import { LAND_CATEGORY_MEANING, OSO_LIMITES_SYNTHESE, projectForSynthesis } from "./territoire/synthesis-contract.ts";
import { allowedNumbers, checkAssertions, checkSynthesis, describeViolations } from "./territoire/synthesis-checks.ts";
import { deterministicSynthesis } from "./territoire/synthesis-deterministe.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";

type Nature = { brut_pct: number; radius_pct: number | null; composition: Record<string, number> };
type Entree = { insee: string; nom: string; densite: number | null; population: number | null; nature?: Nature | null };

const racine = new URL("../../", import.meta.url);
const communes = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")).communes as Entree[];
const par = new Map(communes.map((c) => [c.insee, c]));

const T0 = "2026-11-09T00:00:00.000Z";
/** Le snapshot d'une commune réelle : sa nature, sa densité et sa population de l'index ; le reste, le fixture. */
function snapDe(insee: string) {
  const c = par.get(insee);
  assert.ok(c?.nature, insee);
  const i: TerritoireInputs = chatelaillonInputs();
  i.insee = insee;
  i.communeName = c!.nom;
  i.entry = {
    ...i.entry!,
    population: c!.population,
    densite: c!.densite,
    nature: { brut_pct: c!.nature!.brut_pct, radius_pct: c!.nature!.radius_pct, composition: c!.nature!.composition },
  };
  i.ademe = i.ademe ? { ...i.ademe, densite: null, population: null } : null;
  i.grilleDensite = grilleDensiteDe(insee); // FUT-184 : la grille de la commune lue, comme le chargeur
  return buildTerritoireSnapshot(i, T0);
}
const projDe = (insee: string) => projectForSynthesis(snapDe(insee), "gwl20") as Record<string, any>;
const regles = (text: string, p: Record<string, unknown>) => [...new Set(checkAssertions(text, p).map((v) => v.rule))];
const COUVERT = /^couvert:/;
const reglesCouvert = (text: string, p: Record<string, unknown>) => regles(text, p).filter((r) => COUVERT.test(r));

// ── Les faits réellement présents (index du 09/11/2026), avant toute conclusion ─────────────────

// FUT-184 : `densite` est la classe de la grille Insee (plus le palier 150 / 1 500 hab/km²).
type Panel = { insee: string; nom: string; cat: LandCategory; urb: number; agri: number; nat: number; eau: number; densite: string };
const PANEL: Panel[] = [
  { insee: "14137", nom: "Carpiquet", cat: "low_natural", urb: 41.2, agri: 44.8, nat: 13.9, eau: 0.1, densite: "Ceinture urbaine" },
  { insee: "02100", nom: "Bony", cat: "agricultural", urb: 4.1, agri: 89, nat: 6.8, eau: 0, densite: "Commune rurale de faible densité" },
  { insee: "28199", nom: "Janville-en-Beauce", cat: "agricultural", urb: 7.2, agri: 90, nat: 2.8, eau: 0, densite: "Bourg rural" },
  { insee: "17094", nom: "Châtelaillon-Plage", cat: "mixed", urb: 49.3, agri: 14.3, nat: 36.4, eau: 0.2, densite: "Ceinture urbaine" },
  { insee: "34301", nom: "Sète", cat: "mostly_built", urb: 50.4, agri: 15.8, nat: 33.8, eau: 50.6, densite: "Centre urbain intermédiaire" },
  // « Roissy » du ticket : Roissy-en-France (l'aéroport), le cas A7. Roissy-en-Brie sert de contre-exemple dense et boisé.
  { insee: "95527", nom: "Roissy-en-France", cat: "mostly_built", urb: 55.2, agri: 14.3, nat: 30.5, eau: 0.4, densite: "Bourg rural" },
  { insee: "77390", nom: "Roissy-en-Brie", cat: "high_natural", urb: 30.7, agri: 11.5, nat: 57.7, eau: 0.4, densite: "Grand centre urbain" },
];

test("panel : les faits OSO et la catégorie de chaque commune, lus dans l'index réel", () => {
  for (const c of PANEL) {
    const e = par.get(c.insee)!;
    assert.equal(e.nom, c.nom);
    const s = landShares(e.nature!.brut_pct, e.nature!.composition)!;
    assert.equal(s.composition.artificialise, c.urb, `${c.nom} urbanisé`);
    assert.equal(s.composition.agricole, c.agri, `${c.nom} cultures`);
    assert.equal(s.naturalLandPct, c.nat, `${c.nom} naturel`);
    assert.equal(s.waterPct, c.eau, `${c.nom} eau`);
    assert.equal(landCategory(s.naturalLandPct, s.composition), c.cat, c.nom);
    const p = projDe(c.insee);
    assert.equal(p.occupation_des_sols.categorie, LAND_LABEL[c.cat], c.nom);
    assert.equal(p.commune.grille_densite_insee.categorie, c.densite, `${c.nom} grille de densité`);
  }
});

test("Carpiquet (A5) : peu d'espaces naturels, mais des cultures devant l'urbanisé ; rien ne la dit bâtie", () => {
  const e = par.get("14137")!;
  const s = landShares(e.nature!.brut_pct, e.nature!.composition)!;
  assert.ok(s.composition.agricole > s.composition.artificialise);
  assert.ok(s.composition.artificialise < 50 && s.composition.agricole < 50);
});

test("Roissy-en-France (A7) : majoritairement urbanisée (l'aéroport), mais « Bourg rural » pour la grille Insee (190 hab/km²)", () => {
  const p = projDe("95527");
  assert.equal(p.occupation_des_sols.categorie, "Majoritairement urbanisé");
  // FUT-184 : deux mesures, deux objets. Les sols comptent l'aéroport ; la grille, l'endroit où vivent les habitants.
  assert.equal(p.commune.grille_densite_insee.categorie, "Bourg rural");
  assert.equal(Math.round(p.commune.densite.habitants_par_km2), 190);
});

// ── La projection : la catégorie dite en mots, et les limites de la mesure ────────────────────

test("chaque libellé de catégorie a son sens écrit, sans aucun chiffre (aucun seuil ne devient un nombre admis)", () => {
  assert.deepEqual(Object.keys(LAND_CATEGORY_MEANING).sort(), Object.values(LAND_LABEL).sort());
  for (const [label, sens] of Object.entries(LAND_CATEGORY_MEANING)) assert.doesNotMatch(sens, /\d/, label);
  for (const v of Object.values(OSO_LIMITES_SYNTHESE)) assert.doesNotMatch(v.replace("OSO 2023", "OSO"), /\d/, v);
  assert.match(LAND_CATEGORY_MEANING["Faible présence d'espaces naturels"], /cultures et espaces urbanisés/);
  assert.match(LAND_CATEGORY_MEANING["Faible présence d'espaces naturels"], /ne dit pas que la commune est bâtie ou très urbanisée/);
  assert.match(LAND_CATEGORY_MEANING["À dominante agricole"], /pas des espaces naturels/);
  assert.match(LAND_CATEGORY_MEANING["Majoritairement urbanisé"], /routes, parkings/);
});

test("projection : la catégorie arrive avec son sens et les limites OSO (source, échelle, urbanisé, ce que la mesure ne dit pas)", () => {
  for (const c of PANEL) {
    const o = projDe(c.insee).occupation_des_sols;
    assert.equal(o.ce_que_dit_la_categorie, LAND_CATEGORY_MEANING[o.categorie], c.nom);
    assert.deepEqual(o.limites, OSO_LIMITES_SYNTHESE, c.nom);
    assert.match(o.limites.source, /OSO 2023/);
    assert.match(o.limites.source, /satellite/);
    assert.match(o.limites.espaces_urbanises, /routes, parkings/);
    assert.match(o.limites.espaces_urbanises, /OCS GE/);
    assert.match(o.limites.ce_que_la_mesure_ne_dit_pas, /accès à la nature/);
    assert.match(o.definition, /Trois familles se partagent les terres/);
    // Le mot que le contrôle `interdit:impermeabilisation` refuse n'est plus soufflé au modèle.
    assert.doesNotMatch(JSON.stringify(o), /imperméabilis/);
  }
});

// Le millésime 2023 passe de `definition` (avant FUT-177 : « Mesure OSO 2023 ») à `limites.source` : il était déjà admis.
test("projection : les champs ajoutés n'introduisent aucun nombre admis de plus que le millésime, déjà admis avant", () => {
  const p = projDe("14137");
  const sans = structuredClone(p);
  delete sans.occupation_des_sols.ce_que_dit_la_categorie;
  delete sans.occupation_des_sols.limites;
  const valeurs = (x: Record<string, unknown>) => new Set(allowedNumbers(x).map((n) => `${n.value}|${n.unit}`));
  assert.deepEqual([...valeurs(p)].filter((v) => !valeurs(sans).has(v)), ["2023|other"]);
});

test("cohérence nationale : le sens écrit de chaque catégorie est vrai pour toutes les communes qui la portent", () => {
  let n = 0;
  for (const c of communes) {
    const s = c.nature ? landShares(c.nature.brut_pct, c.nature.composition) : null;
    if (!s) continue;
    n++;
    const { artificialise: urb, agricole: agri } = s.composition;
    const nat = s.naturalLandPct;
    const cat = landCategory(nat, s.composition);
    const ok = {
      mostly_built: urb >= 50,
      high_natural: urb < 50 && nat >= 45,
      agricultural: urb < 50 && nat < 45 && agri >= 50,
      low_natural: urb < 50 && agri < 50 && nat < 20,
      mixed: urb < 50 && agri < 50 && nat >= 20 && nat < 45,
    }[cat];
    assert.ok(ok, `${c.nom} (${c.insee}) : ${cat} contredit urb ${urb}, cultures ${agri}, naturel ${nat}`);
  }
  assert.equal(n, 34743);
});

// ── Le texte déterministe : les trois familles, et les phrases attendues ──────────────────────

const ligneSols = (t: string) => t.split(/(?<=\.)\s+/).find((x) => /terres\.$/.test(x)) ?? "";

test("texte déterministe : la phrase des sols de chaque commune du panel", () => {
  const attendu: Record<string, string> = {
    "14137": "Les espaces naturels y sont peu présents, ses terres se partageant entre cultures et espaces urbanisés : 41,2 % d'espaces urbanisés, 44,8 % de cultures et 13,9 % d'espaces naturels sur ses terres.",
    "02100": "Les terres agricoles y dominent : 4,1 % d'espaces urbanisés, 89 % de cultures et 6,8 % d'espaces naturels sur ses terres.",
    "28199": "Les terres agricoles y dominent : 7,2 % d'espaces urbanisés, 90 % de cultures et 2,8 % d'espaces naturels sur ses terres.",
    "17094": "Ses sols mêlent espaces urbanisés, espaces naturels et cultures : 49,3 % d'espaces urbanisés, 14,3 % de cultures et 36,4 % d'espaces naturels sur ses terres.",
    "34301": "Ses sols sont majoritairement urbanisés (bâtiments, routes, parkings et zones d'activité confondus) : 50,4 % d'espaces urbanisés, 15,8 % de cultures et 33,8 % d'espaces naturels sur ses terres.",
    "95527": "Ses sols sont majoritairement urbanisés (bâtiments, routes, parkings et zones d'activité confondus) : 55,2 % d'espaces urbanisés, 14,3 % de cultures et 30,5 % d'espaces naturels sur ses terres.",
    "77390": "Les espaces naturels y tiennent une grande place : 30,7 % d'espaces urbanisés, 11,5 % de cultures et 57,7 % d'espaces naturels sur ses terres.",
  };
  for (const c of PANEL) assert.equal(ligneSols(deterministicSynthesis(projDe(c.insee), "gwl20")), attendu[c.insee], c.nom);
});

test("texte déterministe : il passe ses contrôles pour toutes les communes, et nomme les cultures quand elles comptent", () => {
  let vus = 0;
  for (const c of communes) {
    if (!c.nature || !landShares(c.nature.brut_pct, c.nature.composition)) continue;
    // Toutes les communes « Faible présence » et « Majoritairement urbanisé », une sur vingt pour les autres.
    const s = landShares(c.nature.brut_pct, c.nature.composition)!;
    const cat = landCategory(s.naturalLandPct, s.composition);
    if (cat !== "low_natural" && cat !== "mostly_built" && Number.parseInt(c.insee.replace(/\D/g, ""), 10) % 20 !== 0) continue;
    vus++;
    const p = projDe(c.insee);
    const t = deterministicSynthesis(p, "gwl20");
    assert.deepEqual(checkSynthesis(t, p), [], `${c.nom} (${c.insee})`);
    if (s.composition.agricole >= 1) assert.match(ligneSols(t), /% de cultures/, c.nom);
    if (cat === "low_natural") assert.doesNotMatch(t, /majoritairement urbanis|très urbanis|bâti/, c.nom);
  }
  assert.ok(vus > 2000, `${vus} communes vues`);
});

test("cohérence carte ↔ identité ↔ synthèse : la même catégorie partout, et la carte ne dit plus « le bâti domine »", () => {
  for (const c of PANEL) {
    const snap = snapDe(c.insee);
    const label = derivedOf(snap, "land.category")!.label;
    assert.equal(buildTerritoryIdentity(snap).solDominant, label, c.nom);
    assert.equal(buildTerritoryCards(snap).couvertNaturel?.headlineLabel, label, c.nom);
    assert.equal(projDe(c.insee).occupation_des_sols.categorie, label, c.nom);
  }
  const carte = readFileSync(new URL("src/components/report/QuartierClimatData.tsx", racine), "utf8");
  assert.doesNotMatch(carte, /Là où le bâti domine/);
  assert.match(carte, /Les espaces urbanisés comptent routes, parkings et zones d'activité autant que les bâtiments/);
});

// ── Les contrôles de la synthèse : contradictions refusées, phrases justes permises ───────────

type Cas = { refuse: [string, string][]; permis: string[] };
const CAS: Record<string, Cas> = {
  // Carpiquet, « Faible présence d'espaces naturels » (A5).
  "14137": {
    refuse: [
      ["Carpiquet est une commune très urbanisée.", "couvert:faible-nature-lue-comme-bati"],
      ["Le territoire est très urbanisé.", "couvert:faible-nature-lue-comme-bati"],
      ["Ses sols sont majoritairement urbanisés.", "couvert:faible-nature-lue-comme-bati"],
      ["Le bâti domine le territoire.", "couvert:faible-nature-lue-comme-bati"],
      ["C'est un territoire dominé par l'urbanisation.", "couvert:faible-nature-lue-comme-bati"],
      ["Les espaces urbanisés dominent ses terres.", "couvert:faible-nature-lue-comme-bati"],
      ["Carpiquet est une commune urbaine.", "couvert:faible-nature-lue-comme-bati"],
      ["La faible présence d'espaces naturels traduit une forte urbanisation.", "couvert:peu-naturel-donc-urbanise"],
      ["Le peu d'espaces naturels s'explique par l'étendue du bâti.", "couvert:peu-naturel-donc-urbanise"],
      ["L'urbanisation laisse peu de place aux espaces naturels.", "couvert:peu-naturel-donc-urbanise"],
      ["Carpiquet est une forte présence naturelle.", "couvert:territoire-tres-naturel"],
    ],
    permis: [
      "Les espaces naturels y sont peu présents.",
      "Carpiquet compte très peu d'espaces naturels : 14 % de ses terres.",
      "Ses terres se partagent entre cultures, 45 %, et espaces urbanisés, 41 %.",
      "La commune n'est pas très urbanisée : les cultures y tiennent la première place.",
      "La faible présence d'espaces naturels ne traduit pas une forte urbanisation.",
    ],
  },
  // Bony, « À dominante agricole » : des cultures ne sont pas de la nature.
  "02100": {
    refuse: [
      ["Bony est un territoire très naturel.", "couvert:territoire-tres-naturel"],
      ["Les espaces naturels dominent la commune.", "couvert:territoire-tres-naturel"],
      ["Bony est une commune largement naturelle, faite de champs.", "couvert:territoire-tres-naturel"],
      ["Le territoire est très urbanisé.", "couvert:territoire-tres-bati"],
      ["Bony offre un accès direct à la nature.", "couvert:cadre-de-vie-non-mesure"],
      ["Bony est une commune paisible.", "couvert:cadre-de-vie-non-mesure"],
    ],
    permis: [
      "Les terres agricoles y dominent : 89 % de ses terres sont cultivées.",
      "Les espaces naturels n'y couvrent que 7 % des terres.",
      "La commune n'est pas très naturelle au sens de la mesure : les cultures n'en font pas partie.",
    ],
  },
  "28199": {
    refuse: [
      ["Janville-en-Beauce a une forte présence naturelle.", "couvert:territoire-tres-naturel"],
      ["Les champs font de Janville-en-Beauce une commune très verte.", "couvert:territoire-tres-naturel"],
      ["La biodiversité y est riche.", "couvert:ecologie-non-mesuree"],
    ],
    permis: ["Les cultures couvrent 90 % de ses terres.", "Les espaces urbanisés y restent limités, à 7 % des terres."],
  },
  // Châtelaillon-Plage, « Occupation mixte » : le masculin singulier échappait à la borne de mot.
  "17094": {
    refuse: [
      ["Le territoire est très urbanisé.", "couvert:territoire-tres-bati"],
      ["Le territoire est fortement urbanisé.", "couvert:territoire-tres-bati"],
      ["Les espaces urbanisés dominent.", "couvert:territoire-tres-bati"],
      ["Châtelaillon-Plage garde un cadre de vie verdoyant.", "couvert:cadre-de-vie-non-mesure"],
      ["Les espaces verts y sont nombreux.", "couvert:cadre-de-vie-non-mesure"],
      ["La nature reste toute proche.", "couvert:cadre-de-vie-non-mesure"],
      ["Les prairies abritent une faune variée.", "couvert:ecologie-non-mesuree"],
    ],
    permis: [
      "Les espaces urbanisés couvrent près de la moitié de ses terres, les prairies un cinquième.",
      "Loin d'être très urbanisé, le territoire garde une part réelle de prairies.",
      "La proximité d'un espace vert dépend de l'adresse, qu'examine le module Autour de l'adresse.",
      "La composition des sols ne dit rien du cadre de vie.",
    ],
  },
  // Sète, « Majoritairement urbanisé » : urbanisé n'est pas bâti, et l'étang n'est pas de la nature.
  "34301": {
    refuse: [
      ["Sète est majoritairement bâtie.", "couvert:urbanise-lu-comme-batiments"],
      ["La moitié de ses terres est couverte de bâtiments.", "couvert:urbanise-lu-comme-batiments"],
      ["50 % de ses terres sont des bâtiments.", "couvert:urbanise-lu-comme-batiments"],
      ["Les espaces urbanisés, c'est-à-dire des bâtiments, couvrent la moitié des terres.", "couvert:urbanise-lu-comme-batiments"],
      ["La densité du bâti y est élevée.", "couvert:urbanise-lu-comme-batiments"],
      ["L'étang de Thau fait de Sète une commune très naturelle.", "couvert:territoire-tres-naturel"],
    ],
    permis: [
      "Ses sols sont majoritairement urbanisés.",
      "La moitié de ses terres est urbanisée, routes et parkings compris.",
      "Les espaces urbanisés comptent bâtiments, routes et parkings : ils couvrent la moitié de ses terres.",
      "Sète est une commune dense.",
    ],
  },
  // Roissy-en-France (A7) : 55 % d'urbanisé, aéroport compris, pour une densité intermédiaire.
  "95527": {
    refuse: [
      ["Roissy-en-France est densément bâtie.", "couvert:urbanise-lu-comme-batiments"],
      ["55 % de ses terres sont couvertes de constructions.", "couvert:urbanise-lu-comme-batiments"],
      ["Roissy-en-France est essentiellement construite.", "couvert:urbanise-lu-comme-batiments"],
      ["Roissy-en-France est très bâtie.", "couvert:urbanise-lu-comme-batiments"],
    ],
    permis: [
      "Les espaces urbanisés, routes, parkings et zones d'activité compris, couvrent 55 % de ses terres.",
      "Ses sols sont majoritairement urbanisés.",
      "Roissy-en-France a une densité intermédiaire.",
    ],
  },
  // Roissy-en-Brie, « Forte présence naturelle » : le boisement n'est ni un accès ni un cadre de vie.
  "77390": {
    refuse: [
      ["Les forêts sont accessibles à quelques minutes.", "couvert:cadre-de-vie-non-mesure"],
      ["Roissy-en-Brie offre un accès facile à la forêt.", "couvert:cadre-de-vie-non-mesure"],
      ["Ses forêts sont un poumon vert pour l'agglomération.", "couvert:cadre-de-vie-non-mesure"],
      ["Le territoire est très urbanisé.", "couvert:territoire-tres-bati"],
    ],
    permis: ["Les espaces naturels y tiennent une grande place : 58 % de ses terres.", "Les forêts couvrent plus de la moitié de ses terres."],
  },
};

test("contrôles : chaque contradiction est refusée par la bonne règle, commune par commune", () => {
  for (const [insee, cas] of Object.entries(CAS)) {
    const p = projDe(insee);
    for (const [phrase, regle] of cas.refuse) assert.ok(regles(phrase, p).includes(regle), `${par.get(insee)!.nom} : « ${phrase} » → ${regle}, vu ${regles(phrase, p)}`);
  }
});

test("contrôles (négatifs) : les phrases justes de chaque commune ne sont refusées par aucune règle du couvert", () => {
  for (const [insee, cas] of Object.entries(CAS)) {
    const p = projDe(insee);
    for (const phrase of cas.permis) assert.deepEqual(reglesCouvert(phrase, p), [], `${par.get(insee)!.nom} : « ${phrase} »`);
  }
});

test("contrôles (négatifs) : « peu d'espaces naturels » reste permis à « Faible présence », pas à « Occupation mixte »", () => {
  const phrase = "La commune compte très peu d'espaces naturels.";
  assert.deepEqual(reglesCouvert(phrase, projDe("14137")), []);
  assert.deepEqual(reglesCouvert(phrase, projDe("17094")), ["couvert:territoire-tres-bati"]);
});

test("contrôles : « majoritairement urbanisé » se dit d'une commune qui l'est, jamais des autres", () => {
  const phrase = "Ses sols sont majoritairement urbanisés.";
  for (const c of PANEL) {
    const refuse = reglesCouvert(phrase, projDe(c.insee)).length > 0;
    assert.equal(refuse, c.cat !== "mostly_built", c.nom);
  }
});

test("contrôles : sans occupation des sols, les règles OSO ne s'appliquent pas ; celles du cadre de vie, si", () => {
  const p = projDe("14137");
  p.occupation_des_sols = null;
  assert.deepEqual(regles("La moitié de ses terres est couverte de bâtiments.", p).filter((r) => r === "couvert:urbanise-lu-comme-batiments"), []);
  assert.deepEqual(regles("La faible présence d'espaces naturels traduit une forte urbanisation.", p).filter((r) => r === "couvert:peu-naturel-donc-urbanise"), []);
  assert.ok(regles("La commune garde un cadre de vie verdoyant.", p).includes("couvert:cadre-de-vie-non-mesure"));
});

test("contrôles : chaque refus du couvert dit au modèle quoi corriger", () => {
  const p = projDe("14137");
  const v = checkAssertions(
    "Carpiquet est très urbanisée. La faible présence d'espaces naturels traduit une forte urbanisation. La moitié de ses terres est couverte de bâtiments. Elle garde un cadre de vie verdoyant. La biodiversité y est riche. Carpiquet est un territoire très naturel.",
    p,
  ).filter((x) => COUVERT.test(x.rule));
  assert.deepEqual([...new Set(v.map((x) => x.rule))].sort(), [
    "couvert:cadre-de-vie-non-mesure",
    "couvert:ecologie-non-mesuree",
    "couvert:faible-nature-lue-comme-bati",
    "couvert:peu-naturel-donc-urbanise",
    "couvert:territoire-tres-naturel",
    "couvert:urbanise-lu-comme-batiments",
  ]);
  for (const d of describeViolations(v)) assert.match(d, / → /, d);
});

test("une synthèse fautive sur Carpiquet est refusée en entier ; sa version juste passe tous les contrôles", () => {
  const p = projDe("14137");
  const fautive = `Carpiquet à l'horizon 2050

## Ce qui domine

Carpiquet est une commune très urbanisée : la faible présence d'espaces naturels traduit une forte urbanisation.

## Ce qui tient, ce qui se tend

Le bâti domine le territoire, ce qui laisse peu d'accès à la nature.

## Ce qu'on sous-estime ici

L'effet concret dépendra du quartier et du logement.`;
  const juste = `Carpiquet à l'horizon 2050

## Ce qui domine

Les espaces naturels y sont peu présents : 14 % de ses terres. Ses terres se partagent entre cultures, 45 %, et espaces urbanisés, 41 %.

## Ce qui tient, ce qui se tend

Les cultures y tiennent la première place, devant les espaces urbanisés.

## Ce qu'on sous-estime ici

L'effet concret dépendra du quartier et du logement.`;
  const rf = checkSynthesis(fautive, p).map((v) => v.rule);
  for (const r of ["couvert:faible-nature-lue-comme-bati", "couvert:peu-naturel-donc-urbanise", "couvert:cadre-de-vie-non-mesure"]) assert.ok(rf.includes(r), r);
  assert.deepEqual(checkSynthesis(juste, p), []);
});

// ── Contre-revue du 09/11 (SHA audité dbb45803) : deux exceptions trop larges et la carte ──
// Chaque cas « refusé » ci-dessous PASSAIT sur dbb45803 ; chaque cas « permis » doit le rester.
const COMMUNES_CONTRE_REVUE = ["14137", "02100", "28199", "17094", "34301", "95527", "77390"];

test("contre-revue 1 : nommer les routes pour les mettre à part ne rachète pas « couverte de bâtiments »", () => {
  const refuse = [
    "La moitié de ses terres est couverte de bâtiments, sans compter les routes.",
    "La moitié de ses terres est couverte de bâtiments, hors routes et parkings.",
    "55 % de ses terres sont des bâtiments, sans parler des parkings.",
    "Les bâtiments couvrent la moitié de ses terres, les routes en plus.",
    "La moitié de ses terres est couverte de bâtiments ; les routes sont à part.",
    "La moitié de ses terres est couverte de bâtiments, près des routes.",
  ];
  const permis = [
    "La moitié de ses terres est urbanisée, routes et parkings compris.",
    "Les espaces urbanisés comptent bâtiments, routes et parkings : ils couvrent la moitié de ses terres.",
    "Les espaces urbanisés, routes, parkings et zones d'activité compris, couvrent 55 % de ses terres.",
    "Ses sols sont majoritairement urbanisés (bâtiments, routes, parkings et zones d'activité confondus) : 55 % d'espaces urbanisés.",
    "La moitié de ses terres est urbanisée, y compris les routes, les parkings et les bâtiments.",
    "Les espaces urbanisés regroupent bâtiments, routes et parkings ; ils couvrent la moitié de ses terres.",
  ];
  for (const insee of COMMUNES_CONTRE_REVUE) {
    const p = projDe(insee);
    for (const phrase of refuse) assert.ok(regles(phrase, p).includes("couvert:urbanise-lu-comme-batiments"), `${par.get(insee)!.nom} : « ${phrase} »`);
    for (const phrase of permis) assert.ok(!regles(phrase, p).includes("couvert:urbanise-lu-comme-batiments"), `${par.get(insee)!.nom} : « ${phrase} »`);
  }
});

test("contre-revue 2 : une réserve sur le quartier ne rachète pas une affirmation sur l'accès à la nature", () => {
  const refuse = [
    "La commune offre un accès direct à la nature, mais cela dépend du quartier.",
    "La commune offre un accès direct à la nature, même si cela varie selon le quartier.",
    "La commune offre un accès direct à la nature qui dépend du quartier.",
    "Le cadre de vie est verdoyant ; tout dépend de l'adresse.",
    "Les espaces verts y sont nombreux, à vérifier selon l'adresse.",
    "Dans certains quartiers, la nature reste toute proche.",
    "La commune garde un cadre de vie paisible, quel que soit le quartier.",
  ];
  const permis = [
    "L'accès à la nature dépend de l'adresse et ne peut pas être déduit de la composition communale des sols.",
    "La proximité d'un espace vert dépend de l'adresse, qu'examine le module Autour de l'adresse.",
    "L'accès aux espaces verts se vérifie à l'adresse.",
    "Le cadre de vie dépend du quartier.",
    "La composition des sols ne dit rien du cadre de vie.",
  ];
  for (const insee of COMMUNES_CONTRE_REVUE) {
    const p = projDe(insee);
    for (const phrase of refuse) assert.ok(regles(phrase, p).includes("couvert:cadre-de-vie-non-mesure"), `${par.get(insee)!.nom} : « ${phrase} »`);
    for (const phrase of permis) assert.ok(!regles(phrase, p).includes("couvert:cadre-de-vie-non-mesure"), `${par.get(insee)!.nom} : « ${phrase} »`);
  }
});

test("contre-revue 3 : la carte et son repli expliquent la composition des terres sans lui prêter d'effet climatique ou écologique", () => {
  const source = readFileSync(new URL("src/components/report/QuartierClimatData.tsx", racine), "utf8");
  const debutCarte = source.indexOf('title: "Espaces naturels"');
  const why = /why: "([^"]+)"/.exec(source.slice(debutCarte))![1];
  const debutRepli = source.indexOf('label: "Taux de boisement"');
  const tip = /tip: "([^"]+)"/.exec(source.slice(debutRepli))![1];
  for (const texte of [why, tip]) {
    assert.doesNotMatch(texte, /rafraîchiss|retien(nen)?t l'eau|abrit|confort|en dit long|quotidien/, texte);
  }
  // L'explication pédagogique reste : les trois familles, et « peu de nature » n'est pas « très urbanisé ».
  assert.match(why, /espaces naturels, cultures et espaces urbanisés/);
  assert.match(why, /sans être très urbanisée : les cultures/);
  // Et elle passe elle-même les contrôles de la synthèse, commune par commune.
  for (const insee of COMMUNES_CONTRE_REVUE) {
    const p = projDe(insee);
    for (const texte of [why, tip]) assert.deepEqual(reglesCouvert(texte, p), [], `${par.get(insee)!.nom} : « ${texte} »`);
  }
});

// ── Dernière reprise (SHA audité b97ab528) : la portée des deux exceptions est la PROPOSITION, pas la phrase ──
// Chaque cas « refusé » PASSAIT sur b97ab528 ; chaque cas « permis » doit le rester.
test("contre-revue 4 : une définition juste dans une autre proposition ne rachète pas « couverte de bâtiments »", () => {
  const refuse = [
    "La moitié de ses terres est couverte de bâtiments ; les espaces urbanisés comptent aussi les routes et les parkings.",
    "La moitié de ses terres est couverte de bâtiments, et les espaces urbanisés comptent aussi les routes.",
    "La moitié de ses terres est couverte de bâtiments : les espaces urbanisés comprennent aussi routes et parkings.",
    "La moitié de ses terres est couverte de bâtiments, mais l'urbanisé compte aussi les routes.",
    "Les espaces urbanisés incluent routes et parkings, alors que 55 % de ses terres sont des bâtiments.",
  ];
  const permis = [
    "La moitié de ses terres est urbanisée, routes et parkings compris.",
    "Les espaces urbanisés comptent bâtiments, routes et parkings : ils couvrent la moitié de ses terres.",
    "Les espaces urbanisés, routes, parkings et zones d'activité compris, couvrent 55 % de ses terres.",
    "50 % de ses terres sont urbanisées, bâtiments, routes et parkings confondus.",
    "La moitié de ses terres est faite de bâtiments, de routes et de parkings confondus.",
    "La moitié de ses terres est urbanisée, y compris les routes, les parkings et les bâtiments.",
  ];
  for (const insee of COMMUNES_CONTRE_REVUE) {
    const p = projDe(insee);
    for (const phrase of refuse) assert.ok(regles(phrase, p).includes("couvert:urbanise-lu-comme-batiments"), `${par.get(insee)!.nom} : « ${phrase} »`);
    for (const phrase of permis) assert.ok(!regles(phrase, p).includes("couvert:urbanise-lu-comme-batiments"), `${par.get(insee)!.nom} : « ${phrase} »`);
  }
});

test("contre-revue 5 : un renvoi à l'adresse qui conclut dans la même proposition reste une affirmation", () => {
  const refuse = [
    "Le cadre de vie dépend du quartier et reste paisible.",
    "L'accès à la nature dépend de l'adresse et le cadre de vie est verdoyant.",
    "Le cadre de vie dépend du quartier et reste très calme.",
    "L'accès aux espaces verts dépend de l'adresse et ils sont nombreux.",
    "La nature dépend du quartier et reste toute proche.",
  ];
  const permis = [
    "Le cadre de vie dépend du quartier.",
    "L'accès à la nature dépend de l'adresse et ne peut pas être déduit de la composition communale des sols.",
    "La proximité d'un espace vert dépend de l'adresse, qu'examine le module Autour de l'adresse.",
    "L'accès aux espaces verts se vérifie à l'adresse.",
    "La présence d'un espace vert à proximité dépend de l'adresse.",
    "La composition des sols ne dit rien du cadre de vie.",
  ];
  for (const insee of COMMUNES_CONTRE_REVUE) {
    const p = projDe(insee);
    for (const phrase of refuse) assert.ok(regles(phrase, p).includes("couvert:cadre-de-vie-non-mesure"), `${par.get(insee)!.nom} : « ${phrase} »`);
    for (const phrase of permis) assert.ok(!regles(phrase, p).includes("couvert:cadre-de-vie-non-mesure"), `${par.get(insee)!.nom} : « ${phrase} »`);
  }
});
