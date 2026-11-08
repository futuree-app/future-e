// FUT-41 V4.1 · tests du modèle (fixtures fictives). État ET phrase rendue (AGENTS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { voies, lire, synthese, gestePrincipal, savoirLogement, etSi, motifSimple, aFaire, type Recherche, type Piste, type Logement } from "./modele41.ts";
import { PROJET, COMMUNES, LOGEMENTS, AUJOURDHUI } from "./scenarios41.ts";

const R = (communes: string[], logements: string[], ajuste?: (l: Logement) => Logement): Recherche => ({
  projet: structuredClone(PROJET),
  communes: COMMUNES.filter((c) => communes.includes(c.insee)).map((c) => structuredClone(c)),
  logements: LOGEMENTS.filter((l) => logements.includes(l.id)).map((l) => structuredClone(l)).map((l) => (ajuste ? ajuste(l) : l)),
});
const ref = () => R(["44109", "35238"], ["fosse", "convention", "thabor"]);
const P = (r: Recherche, id: string): Piste => (id.startsWith("c:") ? { type: "commune", commune: r.communes.find((c) => `c:${c.insee}` === id)! } : { type: "logement", logement: r.logements.find((l) => l.id === id)! });

test("référence : la voie « commune » a une colonne par commune, jamais une par logement", () => {
  const r = ref();
  const v = voies(r, ["fosse", "convention", "thabor"].map((id) => P(r, id)));
  const t = v.find((x) => x.echelle === "territoire")!;
  assert.deepEqual(t.colonnes.map((c) => c.nom), ["Nantes", "Rennes"]);
  assert.match(t.note, /n'est compté qu'une fois/);
});

test("Nantes / Rennes : les nuits font la différence ; la gare et les commerces ne se comparent pas encore, et la phrase dit pourquoi", () => {
  const r = ref();
  const t = voies(r, [P(r, "c:44109"), P(r, "c:35238")]).find((x) => x.echelle === "territoire")!;
  assert.equal(t.lignes.find((x) => x.cle === "nuits")!.difference, "fait_la_difference");
  const gare = t.lignes.find((x) => x.cle === "gare")!;
  assert.equal(gare.difference, "pas_comparable");
  assert.match(gare.pourquoi, /Votre condition n'était pas la même lors des deux analyses/);
  const q = t.lignes.find((x) => x.cle === "quartier")!;
  assert.equal(q.difference, "pas_comparable", "même conclusion, mais pas les mêmes années de données");
  assert.match(q.pourquoi, /ne reposent pas sur les mêmes années de données : BPE 2025.*BPE 2024/);
});

test("aux abords, un logement non analysé ou sans adresse reste « pas lu », jamais favorable", () => {
  const r = ref();
  const a = voies(r, ["fosse", "convention", "thabor"].map((id) => P(r, id))).find((x) => x.echelle === "abords")!;
  const calme = a.lignes.find((x) => x.cle === "calme")!;
  assert.deepEqual(calme.cellules.map((c) => c.lu), [true, false, false]);
  assert.notEqual(calme.difference, "fait_la_difference");
  assert.match(calme.pourquoi, /Lu pour 1 sur 3/);
});

test("ce que futur•e sait d'un logement : la commune par son rapport, et ce qui manque", () => {
  const r = ref();
  const s2 = savoirLogement(r, r.logements.find((l) => l.id === "convention")!);
  assert.equal(s2[0]!.etat, "lu");
  assert.match(s2[0]!.detail, /rapport de Nantes/);
  assert.equal(s2[1]!.etat, "non_lu");
  const s3 = savoirLogement(r, r.logements.find((l) => l.id === "thabor")!);
  assert.equal(s3[1]!.etat, "impossible");
});

test("le bon geste, et un appel commercial qui dit ce qu'il apprendra ET ce qu'il ne dira pas", () => {
  const r = R(["44109", "35238", "49007"], ["fosse", "convention", "thabor", "felix"]);
  assert.equal(gestePrincipal(r, P(r, "thabor"), "unite").cle, "adresse");
  const g = gestePrincipal(r, P(r, "convention"), "unite");
  assert.equal(g.cle, "analyser");
  assert.match(g.libelle, /39 €/);
  assert.match(g.apport, /Lirait le trajet jusqu'à la gare depuis l'adresse/);
  assert.match(g.apport, /Ne dira pas si un médecin accepte de nouveaux patients/);
  assert.match(gestePrincipal(r, P(r, "convention"), "pass").libelle, /inclus/);
  assert.equal(gestePrincipal(r, P(r, "felix"), "unite").cle, "mettre_a_jour");
  assert.equal(gestePrincipal(r, P(r, "c:49007"), "unite").cle, "examiner_commune");
  assert.equal(gestePrincipal(r, P(r, "c:35238"), "unite").cle, "mettre_a_jour", "Rennes lue sous l'ancienne gare");
  assert.equal(gestePrincipal(r, P(r, "fosse"), "unite").cle, "ouvrir");
});

test("Z12 : une condition sans compromis non tenue est dite une fois ; l'écart entre les autres reste visible", () => {
  const r = R(["44109"], ["fosse", "viarme", "felix"], (l) => (l.id === "viarme" ? { ...l, statut: "a_etudier" } : l));
  const lec = lire(r, ["fosse", "viarme", "felix"].map((id) => P(r, id)));
  assert.equal(lec.bloque.filter((b) => b.pisteId === "viarme").length, 1);
  assert.ok(lec.difference.every((d) => !(d.cle === "gare" && /Viarme/.test(d.phrase))), "la gare de Viarme n'est pas répétée dans « fait la différence »");
});

test("et si la gare passait à 30 min : chaque piste dans un seau, avec sa raison", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor", "viarme", "felix"]);
  const s = etSi(r, "gare", 30);
  const de = (id: string) => s.find((x) => x.pisteId === id)!;
  assert.equal(de("viarme").seau, "ecarte_a_revoir");
  assert.match(de("viarme").raison, /quand votre limite était 20 min ; mesuré à 24 min, il tiendrait/);
  assert.equal(de("fosse").seau, "inchange");
  assert.equal(de("c:44109").seau, "nouvelle_analyse");
  assert.equal(de("convention").seau, "pas_lu");
  assert.equal(de("thabor").seau, "pas_lu");
  assert.deepEqual(r.projet.criteres.find((c) => c.cle === "gare")!.valeur, 20, "le Projet n'a pas changé");
});

test("langage courant : un motif technique redit sans jargon, sans perdre la vérité", () => {
  assert.equal(motifSimple({ type: "millesime", texte: "Les données lues ne sont pas du même millésime : BPE 2025 pour A, BPE 2024 pour B." }), "Ces deux analyses ne reposent pas sur les mêmes années de données : BPE 2025 pour A, BPE 2024 pour B.");
  assert.doesNotMatch(motifSimple({ type: "moteur", texte: "x" }), /engine|moteur/);
});

test("synthèse : courte, sans présumer, et elle nomme ce qui manque", () => {
  const r = ref();
  const s = synthese(r, ["fosse", "convention", "thabor"].map((id) => P(r, id)));
  assert.ok(s.length >= 2 && s.length <= 4);
  assert.ok(s.some((x) => /T4 rue de la Convention attend l'analyse de son adresse/.test(x)));
  assert.ok(s.some((x) => /T3 près du Thabor attend son adresse exacte/.test(x)));
  assert.doesNotMatch(s.join(" "), /meilleur|recommand|gagnant/i);
});

test("à faire maintenant : trois actions au plus, la visite d'abord", () => {
  const r = ref();
  const a = aFaire(r, AUJOURDHUI, "unite");
  assert.ok(a.length <= 3);
  assert.match(a[0]!.texte, /Préparer la visite du 14 nov\./);
});

test("compromis par option : une commune apporte ce qui est lu à la commune, et rien n'est inventé pour le logement", () => {
  const r = ref();
  const lec = lire(r, [P(r, "c:35238"), P(r, "thabor")]);
  const thabor = lec.compromis.find((c) => c.pisteId === "thabor")!;
  assert.ok(thabor.apporte.every((x) => /à la commune/.test(x)), "sans adresse, seul ce qui est lu à la commune");
});

test("compromis : une inconnue au logement rappelle ce que dit la commune, sans en faire un fait du logement", () => {
  const r = ref();
  const lec = lire(r, [P(r, "fosse"), P(r, "convention")]);
  const fosse = lec.compromis.find((c) => c.pisteId === "fosse")!;
  assert.ok(fosse.inconnu.some((x) => /Des nuits fraîches l'été dans le logement \(la commune : moins bien\)/.test(x)));
  assert.equal(fosse.limite, null);
  assert.match(lec.compromis.find((c) => c.pisteId === "convention")!.limite!, /attendent l'analyse de l'adresse/);
});
