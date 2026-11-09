// FUT-41 V5.1 · la première lecture range ce que la V5 sait ; elle n'affirme rien de plus.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lecture51, connaissance51, suivi51, lireAnnonce51, type Lecture51 } from "./lecture51.ts";
import { etatInitial5 } from "../fut41-v5/etat5.ts";
import { COUCHE_ADRESSE, estEtabli, type Piste } from "../fut41-v5/modele5.ts";

const lg = (e: ReturnType<typeof etatInitial5>, ids: string[]): Piste[] => ids.map((id) => ({ type: "logement", logement: e.logements.find((l) => l.id === id)! }));
const cm = (e: ReturnType<typeof etatInitial5>): Piste[] => e.communes.map((commune) => ({ type: "commune", commune }));
const cles = (xs: { ligne: { cle: string } }[]) => xs.map((x) => x.ligne.cle).sort();

/** Les garde-fous qui valent pour toute lecture, quelle que soit la situation. */
function gardeFous(l: Lecture51, logements: boolean) {
  for (const x of l.etablis) {
    assert.ok(x.couche.cellules.filter((c) => c.ligne).every((c) => estEtabli(c.ligne) && !c.perime), `${x.ligne.cle} : un écart établi ne repose que sur des issues établies et à jour`);
    if (logements) assert.ok(x.couche.couche !== "commune" || COUCHE_ADRESSE[x.ligne.cle] == null, `${x.ligne.cle} : une lecture communale n'établit pas un écart entre logements`);
  }
  for (const x of [...l.etablis, ...l.incertains]) assert.ok(!x.ligne.sansCompromis, "la condition sans compromis a sa propre ligne");
  assert.ok(!l.pareils.some((p) => /vérifier/i.test(p.texte)), "deux inconnues ne sont pas « pareilles »");
}

test("arbitrage : deux écarts établis, les nuits et le médecin restent incertains, rien de pareil n'est inventé", () => {
  const e = etatInitial5("arbitrage");
  const l = lecture51(e, lg(e, ["fosse", "convention"]));
  gardeFous(l, true);
  assert.deepEqual(cles(l.etablis), ["calme", "quartier"]);
  assert.deepEqual(cles(l.incertains), ["medecin", "nuits"]);
  assert.equal(l.nonEtudies.length, 0);
  assert.match(l.sansCompromis!, /la tiennent/);
  assert.match(l.distingue!, /répond mieux pour le calme, qui compte pour vous/);
  assert.equal(l.avancer[0]!.genre, "question");
  assert.equal(l.avancer[0]!.pisteId, "fosse");
});

test("référence : rien n'est établi entre un logement analysé et un autre qui ne l'est pas ; ce qui manque est dit une fois", () => {
  const e = etatInitial5("ref");
  const l = lecture51(e, lg(e, ["fosse", "convention"]));
  gardeFous(l, true);
  assert.equal(l.etablis.length, 0);
  assert.equal(l.distingue, null, "aucune différence n'est annoncée");
  assert.ok(l.incertains.some((x) => x.ligne.cle === "calme"), "le calme connu pour la Fosse seulement reste incertain");
  assert.deepEqual(l.nonEtudies.map((x) => x.pisteId), ["convention"]);
  assert.equal(l.nonEtudies[0]!.raison, "adresse pas encore analysée");
  assert.ok(!l.nonEtudies[0]!.conditions.includes("la gare"), "la gare est dite par la ligne sans compromis");
});

test("sans adresse : la raison est l'adresse inconnue, et la commune n'est pas prêtée au logement", () => {
  const e = etatInitial5("ref");
  const l = lecture51(e, lg(e, ["convention", "thabor"]));
  gardeFous(l, true);
  assert.equal(l.etablis.length, 0, "Nantes et Rennes diffèrent, mais pas ces deux logements, tant que leurs adresses ne sont pas étudiées");
  assert.equal(l.nonEtudies.find((x) => x.pisteId === "thabor")!.raison, "adresse exacte inconnue");
});

test("communes : les différences communales sont établies ; une analyse d'une autre année reste incertaine", () => {
  const e = etatInitial5("communes");
  const l = lecture51(e, cm(e));
  gardeFous(l, false);
  assert.deepEqual(cles(l.etablis), ["calme", "nuits"]);
  assert.ok(l.incertains.some((x) => x.ligne.cle === "quartier" && x.couche.verdict === "pas_comparable"));
  assert.ok(l.incertains.some((x) => x.ligne.cle === "medecin"), "un médecin présent n'est pas un médecin disponible");
});

test("dix logements : aucune catégorie n'affirme plus que la confrontation", () => {
  const e = etatInitial5("dix");
  const actifs = e.logements.filter((x) => x.statut !== "ecarte").map((x) => x.id);
  for (let i = 0; i < actifs.length; i++) for (let j = i + 1; j < actifs.length; j++) gardeFous(lecture51(e, lg(e, [actifs[i]!, actifs[j]!])), true);
});

test("deux dimensions : votre suivi et ce que futur•e en sait, chacune avec son mot", () => {
  const e = etatInitial5("dix");
  const L = (id: string) => e.logements.find((x) => x.id === id)!;
  assert.equal(suivi51(L("fosse")).libelle, "Visite le 14 nov.");
  assert.equal(suivi51(L("convention")).libelle, "Repéré");
  assert.equal(connaissance51(e, L("fosse")).libelle, "Adresse analysée");
  assert.equal(connaissance51(e, L("felix")).libelle, "Analyse à actualiser");
  assert.equal(connaissance51(e, L("convention")).libelle, "Adresse connue, pas encore analysée");
  assert.equal(connaissance51(e, L("thabor")).libelle, "Adresse inconnue");
  assert.deepEqual(connaissance51(e, L("doutre")).paliers, [false, false, false], "Angers n'est pas étudiée : aucun palier");
});

test("ajouter une annonce : lien invalide, illisible, reconnu avec ou sans miniature ; rien n'est ouvert", () => {
  assert.equal(lireAnnonce51("pas un lien").etat, "invalide");
  assert.equal(lireAnnonce51("ftp://x.fr/a").etat, "invalide");
  assert.deepEqual(lireAnnonce51("https://www.annonces.fr/123"), { etat: "illisible", site: "annonces.fr" });
  const a = lireAnnonce51("https://annonces-exemple.fr/t3");
  assert.ok(a.etat === "reconnue" && a.miniature);
  const b = lireAnnonce51("https://annonces-exemple.fr/maison-sans-photo");
  assert.ok(b.etat === "reconnue" && !b.miniature);
});
