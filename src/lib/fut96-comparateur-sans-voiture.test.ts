// FUT-96 : LE COMPARATEUR DIT LA PLACE DE LA VOITURE DANS LES TRAJETS DOMICILE-TRAVAIL, PAS UNE VIE SANS VOITURE.
//
// La ligne « Sans voiture » classe `mobilite.part_voiture` : la part des actifs occupés qui vont travailler
// principalement en voiture (INSEE MOBPRO 2022), en percentile national. Avant FUT-96, elle écrivait « Voiture
// indispensable » et « Part des trajets du quotidien faisables autrement qu'en voiture », et les raisons
// transmises à la synthèse disaient « peu dépendante de la voiture au quotidien » ou « la voiture reste quasi
// indispensable ». La ligne « Transports du quotidien », bâtie sur des arrêts relevés autour du centre de la
// commune, promettait de « se déplacer sans voiture au quotidien ». Étude La Rochelle du 13/10/2026
// (`etude/larochelle-mobilite` ade5e42e), observations n° 1 et matrice n° 10.
//
// Le moteur s'importe sous le même hook que `comparateur-demographie-causalite.test.ts`, sur l'index versionné.
// Aucun appel au modèle : on vérifie ce que le moteur ÉCRIT et ce qu'il TRANSMET à la synthèse.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { PREFERENCE_LABELS, PREFERENCE_TOOLTIP } from "./comparateur-labels.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;
before(() => { register(`data:text/javascript,${encodeURIComponent(hook)}`); });

/* eslint-disable @typescript-eslint/no-explicit-any */
type Moteur = {
  seedComparaison: (i: string[]) => Promise<{ trio: any[]; comparaison: any } | null>;
  matchProjects: (p: unknown) => Promise<any>;
  getCommuneEntry: (insee: string) => Promise<any>;
  buildTerritorySignals: (c: unknown) => Record<string, any>;
};
const moteur = async () => (await import(`${racine}src/lib/comparateur-vie.ts`)) as Moteur;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Ce que futur•e ne doit plus affirmer à partir de ces mesures.
const PROMESSE_EXCESSIVE =
  /indispensable|faisables?|trajets du quotidien|au quotidien sans voiture|peu d[ée]pendante? de la voiture|possibilit[ée] de (s'y |se )?d[ée]placer|à portée de marche/i;

// Communes témoins, relevées dans l'index le 22/10/2026 (`mobilite`).
const LA_ROCHELLE = "17300"; // 53 % des actifs en voiture, percentile 2 : parmi les moins motorisées
const PUILBOREAU = "17291"; //  83 % des actifs en voiture, percentile 29 : tiers favorable malgré tout
const DONZERE = "26116"; //     95 % des actifs en voiture, percentile 89
const ARMIX = "01019"; //       26 habitants, aucune donnée de mobilité
const BOURCEFRANC = "17058"; // 88 % des actifs en voiture, percentile 52 : palier intermédiaire

const ligne = (comparaison: any, id: string) => // eslint-disable-line @typescript-eslint/no-explicit-any
  comparaison.themes.flatMap((t: { lignes: unknown[] }) => t.lignes).find((l: { id: string }) => l.id === id);

test("C1. peu dépendante, fortement dépendante, donnée absente : trois paliers qui disent une pratique comparée", async () => {
  const r = (await (await moteur()).seedComparaison([LA_ROCHELLE, DONZERE, ARMIX]))!;
  const sv = ligne(r.comparaison, "sans_voiture");
  const par = Object.fromEntries(sv.cellules.map((c: { insee: string }) => [c.insee, c]));
  assert.equal(sv.label, "Sans voiture"); // le souhait du lecteur reste le nom de la ligne
  assert.equal(par[LA_ROCHELLE].palier, "Moins de voiture qu'ailleurs pour aller travailler");
  assert.equal(par[DONZERE].palier, "Plus de voiture qu'ailleurs pour aller travailler");
  // Le palier du milieu dit une POSITION intermédiaire parmi les communes, jamais une moyenne calculée.
  const milieu = (await (await moteur()).seedComparaison([LA_ROCHELLE, BOURCEFRANC]))!;
  const cMilieu = ligne(milieu.comparaison, "sans_voiture").cellules.find((c: { insee: string }) => c.insee === BOURCEFRANC);
  assert.equal(cMilieu.palier, "Usage intermédiaire de la voiture pour aller travailler");
  assert.doesNotMatch(cMilieu.palier, /moyenne/);
  assert.equal(
    PREFERENCE_TOOLTIP.faible_dependance_auto,
    "Part des actifs qui vont travailler principalement en voiture, comparée aux autres communes.",
  );
  // Donnée indisponible : la cellule le dit, aucun palier n'est inventé.
  assert.equal(par[ARMIX].disponible, false);
  assert.equal(par[ARMIX].palier, "Non concernée");
  assert.equal(
    sv.aide,
    "La place de la voiture dans les trajets domicile-travail des habitants, comparée aux autres communes. Elle ne dit pas si vos propres déplacements peuvent se faire sans voiture.",
  );
  assert.doesNotMatch(JSON.stringify(sv), PROMESSE_EXCESSIVE);
});

test("C2. un rang n'est pas une part : Puilboreau, à 83 % de voiture, n'est jamais dite « peu dépendante »", async () => {
  const r = (await (await moteur()).seedComparaison([LA_ROCHELLE, PUILBOREAU]))!;
  const cellule = ligne(r.comparaison, "sans_voiture").cellules.find((c: { insee: string }) => c.insee === PUILBOREAU);
  // Le palier favorable est un rang national : il porte la comparaison (« qu'ailleurs »), jamais un niveau absolu.
  assert.equal(cellule.palier, "Moins de voiture qu'ailleurs pour aller travailler");
  assert.doesNotMatch(cellule.palier, /^Peu |faible/i);
});

test("C3. transports du quotidien : la présence d'arrêts, jamais des horaires ni la desserte de l'adresse", async () => {
  const m = await moteur();
  const r = (await m.seedComparaison([LA_ROCHELLE, DONZERE]))!;
  const tc = ligne(r.comparaison, "tc_quotidien");
  assert.equal(
    tc.aide,
    "La présence d'arrêts de bus, tram ou métro autour du centre de la commune. Les horaires et la desserte de votre adresse restent à vérifier.",
  );
  assert.equal(
    PREFERENCE_TOOLTIP.mobilite_quotidienne,
    "Indique si des arrêts de bus, tram ou métro se trouvent autour du centre de la commune. Les horaires et la desserte de votre adresse restent à vérifier.",
  );
  // Les paliers comptent des arrêts : ni « desserte partielle » ni « réseau présent ».
  const paliers = tc.cellules.map((c: { insee: string; palier: string }) => [c.insee, c.palier]);
  assert.deepEqual(Object.fromEntries(paliers)[LA_ROCHELLE], "Nombreux arrêts près du centre");
  for (const [, p] of paliers) assert.match(p, /^(Nombreux arrêts|Quelques arrêts|Peu ou pas d'arrêts) près du centre$/);
  assert.doesNotMatch(`${tc.aide} ${PREFERENCE_TOOLTIP.mobilite_quotidienne}`, PROMESSE_EXCESSIVE);
});

test("C4. priorité « sans voiture » : le souhait est entendu, les raisons transmises à la synthèse disent la pratique", async () => {
  const m = await moteur();
  // Le souhait du lecteur garde ses mots (puce, synthèse) : c'est l'affirmation de futur•e qui se borne.
  assert.equal(PREFERENCE_LABELS.faible_dependance_auto, "une faible dépendance à la voiture");
  const o = await m.matchProjects({ reformulation: "Vivre sans voiture.", hardConstraints: {}, preferences: [{ key: "faible_dependance_auto", weight: 3 }] });
  assert.ok(o.results.length > 0);
  for (const r of o.results) {
    assert.ok(r.reasons.includes("trajets domicile-travail moins souvent faits en voiture qu'ailleurs"), `${r.nom} : ${r.reasons}`);
  }
  // Tout ce qui part vers `/api/comparateur-vie/synthesize` (raisons, compromis, comparaison du trio).
  const matiere = JSON.stringify({ results: o.results, pistes: o.pistes, comparaison: o.comparaisonComplete });
  assert.doesNotMatch(matiere, PROMESSE_EXCESSIVE);
});

test("C5. le compromis « voiture » se dit en pratique domicile-travail comparée, jamais en nécessité", async () => {
  const m = await moteur();
  // Un projet littoral et naturel, où la voiture n'est qu'une priorité secondaire : le compromis peut la nommer.
  const o = await m.matchProjects({
    reformulation: "x", hardConstraints: {},
    preferences: [
      { key: "faible_dependance_auto", weight: 2 }, { key: "nature", weight: 3 },
      { key: "cadre_calme", weight: 3 }, { key: "proximite_mer", weight: 3 },
    ],
  });
  const textes: string[] = [...o.results, ...o.pistes].flatMap((r: { compromis?: string | null; tradeoff?: string | null }) =>
    [r.compromis, r.tradeoff].filter((t): t is string => typeof t === "string"));
  const voiture = textes.filter((t) => /voiture/.test(t));
  assert.ok(voiture.length > 0, "le cas de référence nomme un compromis sur la voiture");
  for (const t of voiture) {
    assert.match(t, /^En échange, (on y va plus souvent travailler en voiture qu'à .+|trajets domicile-travail plus souvent faits en voiture qu'ailleurs)\.$/, t);
    assert.doesNotMatch(t, PROMESSE_EXCESSIVE, t);
  }
});

test("C6. signaux transmis aux réponses /qna : la desserte est située au centre de la commune, sans horaires", async () => {
  const m = await moteur();
  const lr = m.buildTerritorySignals(await m.getCommuneEntry(LA_ROCHELLE));
  assert.equal(lr.transports_commun.niveau, "nombreux arrêts autour du centre de la commune");
  // Des arrêts, jamais un « réseau dense » ni une « desserte » : l'indicateur ne connaît pas le service.
  assert.doesNotMatch(JSON.stringify(lr.transports_commun), /réseau|desserte (partielle|crédible)/);
  assert.equal(lr.transports_commun.mesure, "arrêts de bus, tram ou métro autour du centre de la commune ; ni horaires, ni fréquence, ni desserte à l'adresse");
  // Aucun réseau relevé : rien d'autre que l'absence.
  const sans = m.buildTerritorySignals(await m.getCommuneEntry(DONZERE));
  if (sans.transports_commun.desservie === false) assert.deepEqual(sans.transports_commun, { desservie: false });
  // Ni la part de voiture brute ni son rang ne partent vers le modèle par ce canal.
  assert.doesNotMatch(JSON.stringify(lr), /part_voiture|dependance/);
  assert.doesNotMatch(JSON.stringify(lr), PROMESSE_EXCESSIVE);
});
