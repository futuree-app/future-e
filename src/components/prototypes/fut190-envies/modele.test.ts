// FUT-190 · les invariants du prototype « envies ». Ce que ces tests gardent : la carte DIT VRAI, pas
// seulement qu'elle apparaît (AGENTS.md, corollaire de test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOGUE, HORS_LECTURE, LIEUX, LIGNES_PROJET, SOURCES } from "./donnees.ts";
import {
  LIMITE_PAR_RYTHME, SITUATIONS, aRetenir, comparer, faceAAujourdhui, lireLieu, nouvelleEnvie, ouVousEnEtes, questionUtile, reconnaitre,
  type Envie, type Reponses,
} from "./modele.ts";

const theatre = (rythme: Envie["rythme"], limite?: number): Envie => ({ ...nouvelleEnvie("aller plus souvent au théâtre", "developper", rythme, 1), ...(limite ? { limite } : {}) });
const potager = nouvelleEnvie("cultiver une partie de mon alimentation", "developper", "semaine", 2);
const nager = nouvelleEnvie("nager deux fois par semaine", "garder", "semaine", 3);
const libre = nouvelleEnvie("m'engager dans la vie de ma commune", "decouvrir", "mois", 4);

/** Tout le texte que le modèle peut produire, pour toutes les situations et tous les réglages. */
function toutLeTexte(): string {
  const out: string[] = [];
  const jeux: Reponses[] = [{}];
  for (const c of Object.values(CATALOGUE)) for (const q of c.questions) for (const r of q.reponses) { jeux.push({ [q.id]: { valeur: r.valeur, date: "2026-11-10" } }); out.push(q.question, q.pourquoi, r.libelle, r.effet, r.reste); }
  for (const c of Object.values(CATALOGUE)) {
    out.push(c.compris, c.capacite.lit, c.capacite.neLitPas, c.aujourdhui.texte, c.moteurActuel.lecture, ...c.adresse.ajouterait, c.adresse.neDiraPas);
    for (const l of Object.values(c.lieux)) out.push(...[...l.possible, ...l.demande, ...l.inconnu].map((f) => f.texte), l.inconnuRegle ?? "");
  }
  for (const p of LIGNES_PROJET) out.push(p.libelle, ...Object.values(p.lectures).map((f) => f.texte));
  for (const rythme of ["semaine", "mois", "annee"] as const) for (const limite of [15, 20, 30, 40, 60]) for (const rep of jeux) {
    const es = [{ ...theatre(rythme), limite }, potager, { ...nager, rythme, limite }, libre];
    for (const e of es) { const c = comparer(e, rep); out.push(c.phrase, ...c.lectures.map((l) => l.court), ...c.lectures.map((l) => faceAAujourdhui(e, l).phrase)); }
    const r = aRetenir(es, rep); out.push(...r.distinguent, ...r.aVerifier, ...r.pareils, ...r.nonLus, r.perte ?? "", ouVousEnEtes(es, rep));
  }
  return out.join("\n");
}

test("aucun score, aucun gagnant, aucune ponctuation interdite", () => {
  const t = toutLeTexte();
  for (const mot of [/meilleur/i, /gagnant/i, /recommand/i, /\bscore\b/i, /\bnote\b.*\/\s*\d/i, /au total/i, /\d\s*sur\s*\d\s+envies/i, /idéal/i]) assert.doesNotMatch(t, mot);
  assert.doesNotMatch(t, /—/, "pas de tiret cadratin");
  assert.doesNotMatch(t, /!/, "pas de point d'exclamation");
  assert.ok(!/(^|[\s'’])(tu|ton|tes|toi)[\s,.]/i.test(t), "vouvoiement");
});

test("le rythme change la lecture, pas la donnée", () => {
  const mois = comparer(theatre("mois"));
  const semaine = comparer(theatre("semaine"));
  const annee = comparer(theatre("annee"));
  assert.equal(LIMITE_PAR_RYTHME.semaine, 20);
  assert.deepEqual(mois.lectures.map((l) => l.plusProche!.minutes), semaine.lectures.map((l) => l.plusProche!.minutes), "mêmes repères");
  assert.equal(semaine.ecart, "distingue");
  assert.equal(semaine.lectures[1].etat, "hors_portee");
  assert.equal(mois.lectures[1].etat, "a_portee");
  assert.equal(mois.lectures[1].deJustesse, true, "35 min pour une limite de 40 : dit « tout près de votre limite »");
  assert.equal(mois.ecart, "nuance", "à pied d'un côté, en voiture de l'autre : possible des deux côtés, pas de la même façon");
  assert.equal(annee.ecart, "nuance");
  assert.match(semaine.phrase, /Chalonnes-sur-Loire \(35 min en voiture\)/);
});

test("ce que futur•e ignore n'est ni un défaut ni un atout", () => {
  const c = comparer(potager);
  assert.equal(c.lectures[0].etat, "non_su");
  assert.equal(c.ecart, "a_verifier");
  assert.doesNotMatch(c.phrase, /impossible|pas possible|ne permet pas/i);
  assert.equal(faceAAujourdhui(potager, c.lectures[0]).changement, "inconnu");
  const l = comparer(libre);
  assert.equal(l.ecart, "non_lu");
  assert.ok(l.lectures.every((x) => x.etat === "non_su"));
  assert.match(HORS_LECTURE.limite, /ne déduit rien/);
});

test("une vérification s'ajoute, attribuée et datée, sans toucher au fait public", () => {
  const avant = lireLieu(potager, "angers");
  const rep: Reponses = { "q-potager-parcelle": { valeur: "long", date: "2026-11-06" } };
  const apres = lireLieu(potager, "angers", rep);
  assert.equal(apres.etat, avant.etat, "l'état public reste « futur•e ne sait pas »");
  assert.deepEqual(apres.lecture, avant.lecture);
  assert.equal(apres.verifiees.length, 1);
  const c = comparer(potager, rep);
  assert.equal(c.ecart, "distingue");
  assert.match(c.phrase, /^D'après votre vérification du 6 nov\./);
  const ouvre = comparer(potager, { "q-potager-parcelle": { valeur: "court", date: "2026-11-06" } });
  assert.equal(ouvre.ecart, "nuance");
  assert.match(ouvre.phrase, /devient possible à Angers aussi/);
});

test("une habitude à garder : la perte commune se dit avant le reste", () => {
  const r = aRetenir([potager, nager], {});
  assert.ok(r.perte && /dans les deux cas/.test(r.perte));
  const [a, b] = comparer(nager).lectures;
  assert.equal(faceAAujourdhui(nager, a).changement, "autrement", "9 min en voiture contre 10 à pied : jamais dit « plus loin »");
  assert.match(faceAAujourdhui(nager, a).phrase, /le moyen change/);
  assert.equal(faceAAujourdhui(nager, b).changement, "plus_loin");
});

test("la question la plus utile est celle qui peut départager", () => {
  const q = questionUtile([nager, theatre("mois"), potager], {});
  assert.equal(q?.question.id, "q-potager-parcelle", "l'envie que futur•e ne sait pas trancher passe d'abord");
  const q2 = questionUtile([nager, theatre("mois"), potager], { "q-potager-parcelle": { valeur: "long", date: "2026-11-06" } });
  assert.equal(q2?.question.id, "q-theatre-retour");
  assert.equal(questionUtile([libre], {}), null, "aucune question inventée pour une envie non lue");
  assert.equal(questionUtile([], {}), null);
});

test("chaque fait réel porte sa source ; chaque fait fictif est marqué", () => {
  for (const c of Object.values(CATALOGUE)) for (const [id, l] of Object.entries(c.lieux)) {
    for (const f of [...l.possible, ...l.demande]) assert.ok(f.source || f.illustratif, `${c.cle}/${id} : « ${f.texte.slice(0, 40)} » sans source`);
    for (const f of l.inconnu) assert.equal(f.statut, "inconnu");
    for (const r of l.reperes) assert.ok(SOURCES[r.source]);
    for (const f of [...l.possible, ...l.demande, ...l.inconnu]) if (f.echelle === "logement") assert.ok(f.illustratif || f.statut === "inconnu", "un fait de logement vient de l'annonce fictive, ou reste inconnu");
  }
  assert.equal(LIEUX.length, 2);
});

test("la reconnaissance d'un texte libre ne force jamais une envie", () => {
  assert.equal(reconnaitre("aller à l'opéra plus souvent"), "theatre");
  assert.equal(reconnaitre("un potager et des poules"), "potager");
  assert.equal(reconnaitre("continuer la natation"), "nager");
  assert.equal(reconnaitre("observer les oiseaux"), "libre");
  assert.equal(reconnaitre("m'engager dans la vie de ma commune"), "libre");
});

test("toutes les situations de démonstration se lisent", () => {
  for (const sc of SITUATIONS) {
    for (const e of sc.envies) assert.ok(comparer(e, sc.reponses).phrase.length > 20, sc.id);
    assert.ok(ouVousEnEtes(sc.envies, sc.reponses).length > 20);
  }
});
