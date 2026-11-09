// FUT-41 V5 · tests du modèle (fixtures fictives). État ET phrase rendue (AGENTS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { confronter, enBref, ouVousEnEtes, bilan, alertes, ecarts, etSi5, prudente, simuler, TITRE_SEAU5, type Recherche, type Piste } from "./modele5.ts";
import { etatInitial5, reduire5, vueVersHash5, hashVersVue5 } from "./etat5.ts";
import { aFaire5 } from "./modele5.ts";
import { PROJET, COMMUNES, LOGEMENTS } from "./scenarios5.ts";

const R = (c: string[], l: string[]): Recherche => ({
  projet: structuredClone(PROJET),
  communes: COMMUNES.filter((x) => c.includes(x.insee)).map((x) => structuredClone(x)),
  logements: LOGEMENTS.filter((x) => l.includes(x.id)).map((x) => structuredClone(x)),
});
const P = (r: Recherche, id: string): Piste => (id.startsWith("c:") ? { type: "commune", commune: r.communes.find((c) => `c:${c.insee}` === id)! } : { type: "logement", logement: r.logements.find((l) => l.id === id)! });

test("S7 : un logement dont seule la commune est lue n'a rien aux abords", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor"]);
  const c = confronter(r, ["fosse", "convention", "thabor"].map((id) => P(r, id)));
  const gare = c.lignes.find((x) => x.cle === "gare")!.couches.find((x) => x.couche === "abords")!;
  assert.deepEqual(gare.cellules.map((x) => x.etat), ["lu", "a_lire", "adresse_manquante"]);
  assert.notEqual(gare.verdict, "distingue");
});

test("deux logements de Nantes partagent une seule cellule communale", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor"]);
  const c = confronter(r, ["fosse", "convention", "thabor"].map((id) => P(r, id)));
  const nuits = c.lignes.find((x) => x.cle === "nuits")!.couches.find((x) => x.couche === "commune")!;
  assert.deepEqual(nuits.cellules[0]!.ids, ["fosse", "convention"]);
});

test("ancien Projet : Saint-Félix est « à revoir », ni reconduit ni bloqué", () => {
  const r = R(["44109"], ["fosse", "felix"]);
  const a = alertes(r, [P(r, "felix")]);
  assert.equal(a[0]!.genre, "a_revoir");
  assert.match(a[0]!.phrase, /quand votre limite était de 30 min ; mesuré à 23 min, il pourrait ne plus tenir/);
  assert.ok(bilan(r, P(r, "felix"), "unite").apporte.every((x) => !/la gare/.test(x)));
});

test("synthèses : trois phrases au plus, aucun classement", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor"]);
  const o = ouVousEnEtes(r);
  assert.ok(o.length <= 3);
  assert.match(o[0]!.texte, /Deux communes et trois logements en vue ; un seul est analysé/);
  const b = enBref(r, [P(r, "c:44109"), P(r, "c:35238")]);
  assert.ok(b.length <= 3);
  assert.doesNotMatch([...o, ...b].map((x) => x.texte).join(" "), /meilleur|recommand|gagnant/i);
});

test("une commune en lecture gratuite n'entre pas dans « ce qui fait la différence »", () => {
  const r = R(["44109", "35238", "49007"], []);
  const o = ouVousEnEtes(r);
  assert.ok(o.some((x) => x.titre === "Entre Nantes et Rennes"));
  assert.ok(!o.some((x) => /Angers/.test(x.titre)));
});

test("S8 : « sur cour » ne conclut pas au calme de nuit", () => {
  const fosse = LOGEMENTS.find((l) => l.id === "fosse")!;
  const cour = fosse.verifications.find((v) => v.id === "v-fen")!.reponses.find((x) => x.valeur === "cour")!;
  assert.match(cour.reste, /bruit de la cour la nuit/);
  assert.doesNotMatch(cour.effet, /ne touche pas la chambre/);
});

test("une mise à jour d'un rapport de commune ne promet pas les abords", async () => {
  const { portee } = await import("./modele5.ts");
  const r = R(["44109", "35238"], []);
  const p = portee(r, P(r, "c:35238"), "mettre_a_jour");
  assert.match(p.nePasDire.join(" "), /ne lit pas plus loin que l'analyse d'origine/);
});

// ── Consolidation après la revue Work (09/11) ────────────────────────────────────────────────
const tous = () => R(["44109", "35238", "49007"], LOGEMENTS.map((l) => l.id));

test("A : un logement peu documenté ne paraît pas plus favorable : on sait combien de conditions sont lues", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor"]);
  const [fosse, conv, thabor] = ["fosse", "convention", "thabor"].map((id) => bilan(r, P(r, id), "unite"));
  assert.equal(fosse!.lus, fosse!.total, "la Fosse est lue sur toutes ses conditions");
  assert.ok(conv!.lus < conv!.total && thabor!.lus < thabor!.total, "Convention et Thabor ne le sont pas");
  assert.equal(thabor!.accepte.length, 0);
  assert.ok(thabor!.pasLu.length >= 3, "son « rien à accepter » vient de ce qui n'est pas lu, et c'est dit");
});

test("B : une issue écrite sous l'ancienne limite est « périmée » dans la confrontation, jamais « correspond » actuel", () => {
  const r = R(["44109"], ["fosse", "felix"]);
  const gare = confronter(r, [P(r, "fosse"), P(r, "felix")]).lignes.find((x) => x.cle === "gare")!.couches.find((x) => x.couche === "abords")!;
  const felix = gare.cellules.find((c) => c.ids.includes("felix"))!;
  assert.equal(felix.perime, true);
  assert.equal(felix.limiteAlors, 30);
  assert.equal(felix.bloque, false, "une mesure ancienne au-dessus de la limite n'est pas « ne tient pas »");
  assert.equal(gare.cellules.find((c) => c.ids.includes("fosse"))!.perime, false);
});

test("B : la synthèse dit « à revoir » pour Saint-Félix, sans le dire tenu ni non tenu", () => {
  const r = R(["44109"], ["fosse", "felix", "convention"]);
  const sc = enBref(r, ["fosse", "felix", "convention"].map((id) => P(r, id)))[0]!.texte;
  assert.match(sc, /T3 Saint-Félix \(23 min\), mesuré sous une ancienne limite, est à revoir/);
  assert.doesNotMatch(sc, /Saint-Félix[^;]*la tient|Saint-Félix[^;]*ne la tient pas/);
});

test("B : « Et si » ne dit plus « restent valables » ; une mesure place d'un côté du seuil, sans garantir", () => {
  const r = R(["44109"], ["fosse", "felix"]);
  assert.doesNotMatch(Object.values(TITRE_SEAU5).join(" "), /valables/);
  const fosse = etSi5(r, "gare", 30).find((x) => x.pisteId === "fosse")!;
  assert.equal(fosse.seau, "inchange");
  assert.match(fosse.raison, /sous 20 comme sous 30 min, d'après cette mesure/);
});

test("C : aucun « médecin disponible » favorable sur la seule présence de généralistes, dans aucune situation", () => {
  const r = tous();
  const pistes: Piste[] = [...r.communes.map((commune) => ({ type: "commune" as const, commune })), ...r.logements.map((logement) => ({ type: "logement" as const, logement }))];
  for (const p of pistes) {
    for (const li of confronter(r, [p]).lignes.filter((x) => x.cle === "medecin")) for (const c of li.couches) for (const k of c.cellules) assert.notEqual(k.ligne?.issue, "favorable", `médecin favorable pour ${p.type === "commune" ? p.commune.nom : p.logement.libelle}`);
    assert.ok(bilan(r, p, "unite").apporte.every((x) => !/médecin/.test(x)));
  }
  const garde = prudente({ cle: "medecin", issue: "favorable", grain: "commune", constat: "Des généralistes nombreux.", sources: [] });
  assert.equal(garde!.issue, "to_confirm");
  assert.match(garde!.constat!, /Leur disponibilité n'est pas connue/);
});

test("D : jamais « aucun ne bloque » quand la condition n'est mesurée que pour certains ; on dit pour qui", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor"]);
  const t = enBref(r, ["fosse", "convention", "thabor"].map((id) => P(r, id))).map((x) => x.texte).join(" ");
  assert.doesNotMatch(t, /Aucun ne bloque/);
  assert.match(t, /T3 quai de la Fosse \(9 min\) la tient ; pour T4 rue de la Convention et T3 près du Thabor, elle reste à mesurer depuis l'adresse/);
});

test("D : entre des logements, une différence communale est dite comme telle", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor"]);
  const d = enBref(r, ["fosse", "convention", "thabor"].map((id) => P(r, id)))[1]!.texte;
  assert.match(d, /^À l'échelle des communes, Rennes répond mieux que Nantes pour les nuits fraîches l'été \(qui comptent beaucoup pour vous\) et le calme \(qui compte pour vous\)\./);
  assert.match(d, /Pour vos logements, cela s'étudie à l'adresse : c'est fait pour T3 quai de la Fosse seulement\./);
});

test("D : des communes seules ne prétendent rien sur la gare d'un logement, et Rennes est dite à revoir", () => {
  const r = R(["44109", "35238"], []);
  const sc = enBref(r, [P(r, "c:44109"), P(r, "c:35238")])[0]!.texte;
  assert.match(sc, /se mesure depuis une adresse/);
  assert.match(sc, /Rennes a été lue quand votre condition était « une gare à moins de 30 min » : sa conclusion est à revoir/);
});

test("D : avec dix logements, la ligne reste lisible (on compte au-delà de deux noms)", () => {
  const t = ouVousEnEtes(tous()).map((x) => x.texte).join(" ");
  assert.match(t, /pour cinq logements, elle reste à mesurer/);
  assert.ok(t.length < 700, `longueur ${t.length}`);
});

// ── Deuxième revue Work (09/11) : lecture naturelle, examinées / à vérifier, scénario d'arbitrage ──

test("examinées et à vérifier : la Fosse est examinée sur tout, mais deux réponses manquent", () => {
  const r = R(["44109", "35238"], ["fosse"]);
  const b = bilan(r, P(r, "fosse"), "unite");
  assert.equal(b.lus, 5);
  assert.equal(b.aVerifier, 2, "des nuits fraîches et un médecin restent à vérifier");
});

test("arbitrage : deux écarts établis, de sens opposés, sans total", () => {
  const e = etatInitial5("arbitrage");
  const ps: Piste[] = e.logements.map((logement) => ({ type: "logement", logement }));
  const ec = ecarts(e, ps);
  assert.deepEqual(ec.map((x) => `${x.cle}:${x.mieux}>${x.moins}`).sort(), ["calme:T4 rue de la Convention>T3 quai de la Fosse", "quartier:T3 quai de la Fosse>T4 rue de la Convention"]);
  const t = enBref(e, ps).map((x) => x.texte).join(" ");
  assert.match(t, /Aux abords, T4 rue de la Convention répond mieux pour le calme, qui compte pour vous ; T3 quai de la Fosse répond mieux pour la vie de quartier, qui compte un peu pour vous\./);
  assert.match(t, /Pour les nuits fraîches l'été, qui comptent beaucoup pour vous : T4 rue de la Convention y répond dans le logement ; à vérifier pour T3 quai de la Fosse avant de trancher \(deux questions prêtes pour la visite\)\./);
  assert.doesNotMatch(t, /meilleur|recommand|gagnant|au total/i);
});

test("arbitrage : une différence encore possible n'est jamais rangée parmi les écarts établis", () => {
  const e = etatInitial5("arbitrage");
  const ec = ecarts(e, e.logements.map((logement) => ({ type: "logement" as const, logement })));
  assert.ok(!ec.some((x) => x.cle === "nuits"), "les nuits de la Fosse ne sont pas connues");
});

test("arbitrage : et si la vie de quartier devenait sans compromis, seul ce qui est un compromis est dit, au conditionnel", () => {
  const e = etatInitial5("arbitrage");
  const fx = simuler(e.logements, e.projet, { type: "nature", cle: "quartier", nature: "sans_compromis" }).effets;
  assert.equal(fx.length, 1);
  assert.match(fx[0]!.phrase, /T4 rue de la Convention : une vie de quartier y est un compromis ; sans compromis, il pourrait ne plus tenir/);
  assert.equal(e.projet.criteres.find((c) => c.cle === "quartier")!.nature, "priorite", "le Projet n'a pas changé");
});

// ── Troisième revue Work : continuité des parcours et textes concrets ──────────────────────

test("continuité : revenir dans Comparer retrouve le mode, la sélection et le duo affiché", () => {
  let e = etatInitial5("dix");
  e = reduire5(e, { type: "naviguer", vue: { ecran: "comparer", mode: "logements", selection: ["fosse", "convention", "felix"] } });
  e = reduire5(e, { type: "duel", duel: [1, 2] });
  e = reduire5(e, { type: "naviguer", vue: { ecran: "projet" } });
  e = reduire5(e, { type: "naviguer", vue: { ecran: "comparer", mode: "logements" } });
  assert.deepEqual(e.vue.selection, ["fosse", "convention", "felix"]);
  assert.deepEqual(e.comparaison?.duel, [1, 2]);
  e = reduire5(e, { type: "naviguer", vue: { ecran: "comparer", mode: "logements", selection: ["fosse", "felix"] } });
  assert.deepEqual(e.comparaison?.duel, [0, 1], "une autre sélection repart du premier duo");
});

test("continuité : l'essai fait dans Comparer est transmis tel quel à Mon Projet", () => {
  const vue = { ecran: "projet" as const, ancre: "et-si", essai: "nature.quartier" };
  assert.equal(vueVersHash5(vue), "#/projet/et-si/nature.quartier");
  assert.deepEqual(hashVersVue5("#/projet/et-si/valeur.gare.30"), { ecran: "projet", ancre: "et-si", essai: "valeur.gare.30" });
  assert.deepEqual(hashVersVue5("#/projet/et-si"), { ecran: "projet", ancre: "et-si" });
});

test("bilan : ce qu'un logement apporte est dit par le fait mesuré, pas par le nom du critère seul", () => {
  const e = etatInitial5("arbitrage");
  const b = bilan(e, { type: "logement", logement: e.logements.find((l) => l.id === "fosse")! }, "unite");
  assert.ok(b.apporte.includes("Commerces, marché et tramway à moins de 5 min à pied"), b.apporte.join(" | "));
  assert.ok(b.apporte.every((x) => !/^(la|le|les) [a-zé]+$/.test(x)), "jamais le nom du critère seul quand le fait est connu");
});

test("à faire : le geste court ne répète pas le nom du lieu, et l'on note une réponse", () => {
  const e = etatInitial5("ref");
  const f = aFaire5(e, "2026-11-09", "unite");
  for (const a of f) {
    const nom = e.logements.find((l) => l.id === a.pisteId)?.libelle ?? e.communes.find((c) => `c:${c.insee}` === a.pisteId)?.nom ?? "";
    assert.ok(!a.court.includes(nom), a.court);
  }
  assert.ok(!f.some((a) => a.bouton === "Répondre"));
});

test("et si : le seau inchangé dit un effet estimé, sans « du même côté »", () => {
  assert.equal(TITRE_SEAU5.inchange, "L'effet estimé resterait le même");
});

test("synthèse : chaque écart porte le poids déclaré de sa condition, des deux côtés, et l'inconnue aussi", () => {
  const e = etatInitial5("arbitrage");
  const t = enBref(e, e.logements.map((logement) => ({ type: "logement" as const, logement }))).map((x) => x.texte).join(" ");
  for (const p of ["le calme, qui compte pour vous", "la vie de quartier, qui compte un peu pour vous", "les nuits fraîches l'été, qui comptent beaucoup pour vous"]) assert.ok(t.includes(p), p);
  assert.doesNotMatch(t, /gare[^.]*compte/, "la condition sans compromis n'a pas de poids");
});
