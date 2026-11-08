// FUT-41 V4 · tests du modèle du prototype (fixtures fictives). Ils vérifient l'ÉTAT rendu ET la
// PHRASE rendue : « la ligne apparaît » et « la ligne dit vrai » sont deux assertions (AGENTS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  comparerCritere, ceQuiDepartage, conditionsNonTenues, trier, examinerMaintenant, simuler, faireLePoint,
  extraireAnnonce, urlAnnonceValide, criteresDepasses, connaissance, analyseServie, perimetreComparable,
  type Lieu,
} from "./modele.ts";
import { TOUS, PROJET, AUJOURDHUI, SCENARIOS, ANALYSE_SIMULEE_LAVOIR } from "./scenarios.ts";

const L = (id: string): Lieu => structuredClone(TOUS.find((x) => x.id === id)!);
const actif = (l: Lieu): Lieu => ({ ...l, statut: "a_etudier" });

test("même commune : la lecture communale est partagée et ne départage rien", () => {
  const r = comparerCritere("mer", L("sternes"), L("goelands"));
  assert.equal(r.etat, "non_comparable");
  assert.equal(r.motifs[0]!.type, "lecture_partagee");
  assert.match(r.motifs[0]!.texte, /Une seule lecture de Port-Anvel/);
  // Même pour une condition à vérifier des deux côtés : c'est UNE question, pas deux.
  assert.equal(comparerCritere("medecin", L("sternes"), L("goelands")).motifs[0]!.type, "lecture_partagee");
});

test("même commune : les abords et le logement, eux, se comparent", () => {
  assert.equal(comparerCritere("calme", L("sternes"), L("goelands")).etat, "difference_demontree");
  assert.equal(comparerCritere("nuits", L("sternes"), L("goelands")).etat, "difference_possible");
  assert.equal(comparerCritere("gare", L("sternes"), L("goelands")).etat, "meme_lecture");
});

test("projet modifié entre deux analyses : SEULE la gare sort du cadre, et la phrase nomme les deux valeurs", () => {
  const a = L("sternes"); const c = L("kervily");
  const gare = comparerCritere("gare", a, c);
  assert.equal(gare.etat, "non_comparable");
  assert.equal(gare.motifs[0]!.type, "projet");
  assert.match(gare.motifs[0]!.texte, /moins de 20 min.*moins de 30 min/);
  assert.equal(comparerCritere("calme", a, c).etat, "difference_demontree");
  assert.equal(comparerCritere("mer", a, c).etat, "meme_lecture");
});

test("accord hors cadre : deux issues égales sous deux empreintes ne donnent jamais « même lecture »", () => {
  // Kervily (rev 2) et les Sternes (rev 3) sont tous deux « favorable » pour la gare.
  const r = comparerCritere("gare", L("sternes"), L("kervily"));
  assert.equal(r.a!.issue, r.b!.issue);
  assert.notEqual(r.etat, "meme_lecture");
});

test("données non comparables : moteur, millésime et échelle sont chacun nommés", () => {
  const a = L("sternes"); const d = L("lavoir");
  const quartier = comparerCritere("quartier", a, d);
  assert.equal(quartier.etat, "non_comparable");
  const types = quartier.motifs.map((m) => m.type);
  assert.ok(types.includes("millesime"));
  assert.ok(types.includes("grain"));
  assert.match(quartier.motifs.find((m) => m.type === "millesime")!.texte, /BPE 2025.*BPE 2024/);
  // Le moteur engine-5 → engine-6 ne touche que les nuits (table fictive) : la mer reste comparable.
  assert.equal(comparerCritere("mer", a, d).etat, "meme_lecture");
  // Un critère lu aux abords d'un seul côté : « un seul est examiné », jamais un avantage.
  const calme = comparerCritere("calme", a, d);
  assert.equal(calme.etat, "indisponible");
  assert.match(calme.motifs[0]!.texte, /Un seul est examiné ici/);
});

test("annonce sans analyse : information indisponible, jamais une conclusion", () => {
  const r = comparerCritere("calme", L("sternes"), L("landeven"));
  assert.equal(r.etat, "indisponible");
  assert.match(r.motifs[0]!.texte, /T2 avec balcon n'est pas analysé/);
});

test("ce qui départage, à N : une phrase par critère, qui cite des lieux réellement comparés", () => {
  const lieux = [L("sternes"), L("kervily"), L("lavoir")];
  const lecture = ceQuiDepartage(lieux, PROJET);
  assert.deepEqual(lecture.map((x) => x.cle), PROJET.criteres.map((c) => c.cle), "ordre du Projet, jamais un tri");
  const calme = lecture.find((x) => x.cle === "calme")!;
  assert.equal(calme.classe, "departage");
  assert.match(calme.phrase, /12 rue des Sternes \(compromis aux abords\) et 31 route de Kervily \(correspond aux abords\)/);
  const gare = lecture.find((x) => x.cle === "gare")!;
  assert.notEqual(gare.classe, "departage", "la gare n'est démontrée entre aucune paire");
  // Aucune phrase ne cite un lieu écarté.
  const avecEcarte = ceQuiDepartage([L("sternes"), L("thoniers")], PROJET);
  assert.ok(avecEcarte.every((x) => !x.phrase.includes("Thoniers")));
});

test("condition sans compromis : jamais compensée, toujours dite, et dite POSSIBLE quand l'analyse est ancienne", () => {
  const studio = actif(L("thoniers"));
  const nt = conditionsNonTenues(studio, PROJET);
  assert.equal(nt.length, 1);
  assert.match(nt[0]!.phrase, /ne tient pas votre condition sans compromis : une gare à moins de 20 min/);
  // Kervily : mesuré 26 min, analysé sous 30, Projet à 20 → possible, jamais conclu.
  const k = conditionsNonTenues(L("kervily"), PROJET);
  assert.equal(k.length, 1);
  assert.equal(k[0]!.aJour, false);
  assert.match(k[0]!.phrase, /26 min.*limite actuelle de 20 min.*la mettre à jour le confirmerait/);
});

test("« à examiner maintenant » : des règles, et le lieu bloqué reste en dernier malgré ses points favorables", () => {
  const lieux = [L("sternes"), L("goelands"), actif(L("thoniers")), L("landeven")];
  const g = examinerMaintenant(lieux, PROJET, AUJOURDHUI);
  assert.equal(g[g.length - 1]!.titre, "Ne tient pas une condition sans compromis");
  assert.equal(g[g.length - 1]!.lieux[0]!.lieu.id, "thoniers");
  assert.equal(g[0]!.titre, "Une visite approche");
  assert.match(g[0]!.lieux[0]!.raison!, /Visite le 14 nov\. : 2 points à vérifier sur place/);
  // Aucune valeur numérique triable n'est exposée.
  assert.ok(g.every((x) => x.lieux.every((y) => y.valeur === null)));
});

test("tri par montant : un loyer et un prix de vente ne sont jamais rangés ensemble", () => {
  const g = trier([L("sternes"), L("lavoir"), L("landeven")], "montant", PROJET, AUJOURDHUI);
  assert.deepEqual(g.map((x) => x.titre), ["À louer", "À vendre"]);
  assert.deepEqual(g[0]!.lieux.map((x) => x.lieu.id), ["landeven", "sternes"]);
  assert.match(g[0]!.note!, /ne se rangent pas sur la même échelle/);
  assert.match(g[0]!.note!, /n'entre dans aucune conclusion/);
});

test("tri par trajet : seul ce qui est mesuré à l'adresse se range ; le reste est à part, avec sa raison", () => {
  const g = trier([L("sternes"), L("kervily"), L("lavoir"), L("landeven")], "trajet", PROJET, AUJOURDHUI);
  assert.deepEqual(g[0]!.lieux.map((x) => x.lieu.id), ["sternes", "kervily"]);
  assert.match(g[0]!.lieux[1]!.raison!, /26 min/);
  assert.deepEqual(g[1]!.lieux.map((x) => x.lieu.id).sort(), ["landeven", "lavoir"]);
});

test("et si : la simulation ne modifie pas le Projet et dit ce qui POURRAIT changer", () => {
  const avant = structuredClone(PROJET);
  const lieux = TOUS.map((x) => structuredClone(x));
  const r = simuler(lieux, PROJET, { type: "valeur", cle: "gare", valeur: 40 });
  assert.deepEqual(PROJET, avant);
  assert.equal(r.projet.criteres.find((c) => c.cle === "gare")!.valeur, 40);
  const studio = r.effets.find((e) => e.lieuId === "thoniers")!;
  assert.equal(studio.certitude, "raison_a_revoir");
  assert.match(studio.phrase, /quand votre limite était 20 min.*35 min.*vous pourriez le réactiver/);
  assert.ok(r.effets.every((e) => !/devient|est désormais/.test(e.phrase)), "aucun effet n'est dit acquis");
});

test("et si budget : information sur les montants déclarés, aucune conclusion ne change", () => {
  const r = simuler([L("sternes"), L("goelands")], PROJET, { type: "budget", montant: 1200 });
  assert.equal(r.effets.length, 1);
  assert.match(r.effets[0]!.phrase, /5 allée des Goélands.*passerait sous votre budget.*aucune conclusion ne change/);
});

test("péremption par critère : une analyse de rev 2 n'est dépassée que pour la gare", () => {
  const d = criteresDepasses(analyseServie(L("kervily"))!, PROJET);
  assert.deepEqual(d.map((x) => x.cle), ["gare"]);
  assert.equal(d[0]!.avant, "Une gare à moins de 30 min");
});

test("faire le point : chaque lieu nommé dans les hésitations porte le même état que dans la rangée", () => {
  const lieux = TOUS.map((x) => structuredClone(x));
  const p = faireLePoint(lieux, PROJET, AUJOURDHUI);
  assert.match(p.situation, /^Six logements en course, dont 4 analysés ; 1 écarté\.$/);
  assert.ok(p.hesitations.some((h) => /Kervily.*26 min/.test(h)));
  assert.ok(p.nonMesure.some((n) => /une annonce dit le contraire/.test(n)));
  assert.match(p.provenance, /aucun texte rédigé par une IA/);
  for (const r of p.rangee) if (r.lieu.statut === "ecarte") assert.match(r.etat, /^écarté le/);
});

test("ajout assisté : chaque valeur proposée garde l'extrait exact qui la fonde", () => {
  const x = extraireAnnonce("Bel appartement T3 lumineux de 62 m², à louer 980 € charges comprises, proche gare.");
  assert.equal(x.montant!.valeur, 980);
  assert.equal(x.nature!.valeur, "location");
  assert.equal(x.surface!.valeur, 62);
  assert.equal(x.pieces!.valeur, 3);
  assert.match(x.montant!.extrait, /980 €/);
  const v = extraireAnnonce("Maison à vendre 245 000 €, 4 pièces, 96 m2.");
  assert.equal(v.montant!.valeur, 245000);
  assert.equal(v.nature!.valeur, "vente");
  // Rien n'est deviné quand le texte ne dit rien.
  assert.deepEqual(extraireAnnonce("Joli logement, contactez-nous."), {});
  // Ambigu (loyer ET vente) : la nature n'est pas proposée.
  assert.equal(extraireAnnonce("Location ou vente, 900 € par mois").nature, undefined);
});

test("URL d'annonce : http(s) seulement, bornée", () => {
  assert.ok(urlAnnonceValide("https://annonces.exemple/x"));
  assert.ok(!urlAnnonceValide("javascript:alert(1)"));
  assert.ok(!urlAnnonceValide(`https://a.exemple/${"x".repeat(600)}`));
});

test("l'analyse simulée fait passer l'adresse de la commune aux trois échelles", () => {
  const d = L("lavoir");
  assert.equal(connaissance(d), "commune_analysee");
  d.analyses.push(ANALYSE_SIMULEE_LAVOIR);
  assert.equal(connaissance(d), "analyse");
  assert.equal(comparerCritere("calme", L("sternes"), d).etat, "difference_demontree");
});

test("se compare / ne se compare pas : deux adresses d'une commune comparent les abords et le logement, pas la commune", () => {
  const p = perimetreComparable(L("sternes"), L("goelands"), PROJET);
  assert.ok(p.seCompare.includes("les abords"));
  assert.ok(p.seCompare.includes("le logement"));
  assert.ok(!p.seCompare.includes("la commune"));
  assert.ok(p.neSeComparePas.some((x) => x.startsWith("la commune")));
});

test("les scénarios désignent des lieux qui existent", () => {
  const ids = new Set(TOUS.map((x) => x.id));
  for (const s of SCENARIOS) for (const id of [...s.lieux, ...(s.vue.selection ?? []), ...(s.vue.lieu ? [s.vue.lieu] : [])]) assert.ok(ids.has(id), `${s.id} : ${id}`);
});

test("aucun texte système ne présume un achat", () => {
  const lieux = TOUS.map((x) => structuredClone(x));
  const p = faireLePoint(lieux, PROJET, AUJOURDHUI);
  const textes = [p.situation, ...p.hesitations, ...p.actions.map((a) => a.texte), ...p.nonMesure, p.provenance,
    ...ceQuiDepartage(lieux, PROJET).map((x) => x.phrase)].join(" ");
  assert.doesNotMatch(textes, /\b(acheter|acquéreur|compromis de vente|offre d'achat)\b/i);
});

test("à N : une paire hors cadre à issue égale empêche « en commun » (règle 4)", () => {
  const lc = ceQuiDepartage([L("sternes"), L("goelands"), L("kervily")], PROJET).find((x) => x.cle === "gare")!;
  assert.equal(lc.classe, "hors_cadre");
  assert.match(lc.phrase, /concluent pareil, mais pas dans le même cadre/);
  assert.match(lc.phrase, /moins de 20 min.*moins de 30 min/);
});

test("et si : une analyse ancienne se lit sous la limite actuelle (Kervily, 26 min, limite 20 → 40)", () => {
  const r = simuler([L("kervily")], PROJET, { type: "valeur", cle: "gare", valeur: 40 });
  assert.equal(r.effets.length, 1);
  assert.match(r.effets[0]!.phrase, /mesuré à 26 min, il pourrait tenir « une gare à moins de 40 min »/);
});
