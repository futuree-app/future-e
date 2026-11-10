// FUT-190 · les invariants du prototype « envies ». Ce que ces tests gardent : la carte DIT VRAI, pas
// seulement qu'elle apparaît (AGENTS.md, corollaire de test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOGUE, HORS_LECTURE, LIEUX, LIGNES_PROJET, SOURCES } from "./donnees.ts";
import {
  LIMITE_PAR_RYTHME, SITUATIONS, TITRE_ECART, aRetenir, comparer, faceAAujourdhui, lireLieu, nouvelleEnvie, ouVousEnEtes, questionUtile, reconnaitre, reglerEnvie, texteReponse,
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

test("théâtre mensuel et hebdomadaire : limite temporelle et compromis modal restent distincts", () => {
  const mois = comparer(theatre("mois"));
  const semaine = comparer(theatre("semaine"));
  const annee = comparer(theatre("annee"));
  assert.equal(LIMITE_PAR_RYTHME.semaine, 20);
  assert.deepEqual(mois.lectures.map((l) => l.plusProche!.minutes), semaine.lectures.map((l) => l.plusProche!.minutes), "mêmes repères");
  assert.equal(semaine.ecart, "distingue");
  assert.equal(semaine.lectures[1].etat, "hors_portee");
  assert.equal(mois.lectures[1].etat, "a_portee");
  assert.equal(mois.lectures[1].deJustesse, true, "35 min pour une limite de 40 : dit « tout près de votre limite »");
  assert.equal(mois.ecart, "nuance");
  assert.equal(annee.ecart, "nuance");
  assert.match(semaine.phrase, /35 min en voiture, au-delà de vos 20 min depuis Chalonnes-sur-Loire/);
  assert.match(mois.phrase, /5 min à pied, dans votre limite de 40 min depuis Angers/);
  assert.match(mois.phrase, /35 min en voiture, dans votre limite de 40 min depuis Chalonnes/);
  for (const c of [mois, semaine, annee]) {
    assert.match(c.phrase, /ce trajet exige la voiture et entre en tension avec votre priorité « moins dépendre de la voiture »/);
    assert.match(c.phrase, /transports collectifs ne sont pas disponibles/);
    assert.match(c.phrase, /inconnue, pas impossible/);
    assert.match(c.phrase, /ne prouvent pas que la pratique est accessible/);
    assert.doesNotMatch(c.phrase + TITRE_ECART[c.ecart], /possible des deux côtés|est à votre portée|chaque sortie demande/i);
  }
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

test("une réponse personnelle s'ajoute avec sa date, sans provenance inventée ni modification du fait public", () => {
  const avant = lireLieu(potager, "angers");
  const rep: Reponses = { "q-potager-parcelle": { valeur: "long", date: "2026-11-06" } };
  const apres = lireLieu(potager, "angers", rep);
  assert.equal(apres.etat, avant.etat, "l'état public reste « futur•e ne sait pas »");
  assert.deepEqual(apres.lecture, avant.lecture);
  assert.equal(apres.verifiees.length, 1);
  const c = comparer(potager, rep);
  assert.equal(c.ecart, "a_verifier");
  assert.match(c.phrase, /Votre réponse du 6 nov\. \(source non renseignée\)/);
  assert.match(c.phrase, /Si ce délai est confirmé/);
  assert.doesNotMatch(c.phrase, /seul Chalonnes|D'après la mairie/);
  const ouvre = comparer(potager, { "q-potager-parcelle": { valeur: "court", date: "2026-11-06" } });
  assert.equal(ouvre.ecart, "a_verifier");
  assert.match(ouvre.phrase, /si l'attribution et les conditions de culture sont confirmées/);
  assert.match(ouvre.phrase, /ne garantit pas de cultiver dès l'emménagement/);
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
    for (const r of l.reperes) {
      assert.ok(r.illustratif || (r.source && SOURCES[r.source]));
      if (r.illustratif) assert.equal(r.source, undefined, "l'annonce fictive ne vient pas du service IGN");
    }
    for (const f of [...l.possible, ...l.demande, ...l.inconnu]) if (f.echelle === "logement") assert.ok(f.illustratif || f.statut === "inconnu", "un fait de logement vient de l'annonce fictive, ou reste inconnu");
  }
  assert.equal(LIEUX.length, 2);
});

test("les exemples reconnus et deux envies non mesurables restent distincts", () => {
  assert.equal(reconnaitre("aller à l'opéra plus souvent"), "theatre");
  assert.equal(reconnaitre("un potager et des poules"), "potager");
  assert.equal(reconnaitre("continuer la natation"), "nager");
  assert.equal(reconnaitre("observer les oiseaux"), "libre");
  assert.equal(reconnaitre("m'engager dans la vie de ma commune"), "libre");
});

test("changer le rythme conserve une limite choisie, jusqu'à une modification explicite", () => {
  const mensuelle = reglerEnvie(theatre("mois"), { limite: 60 });
  const hebdomadaire = reglerEnvie(mensuelle, { rythme: "semaine" });
  assert.equal(hebdomadaire.limite, 60);
  assert.match(comparer(hebdomadaire).phrase, /chaque semaine.*dans votre limite de 60 min/);
  const courte = reglerEnvie(hebdomadaire, { limite: 20 });
  assert.match(comparer(courte).phrase, /au-delà de vos 20 min/);
  assert.equal(mensuelle.rythme, "mois", "pas de mutation de l'envie d'origine");
});

test("potager : aucune combinaison de réponses ne prouve la cultivabilité de l'annonce fictive", () => {
  for (const parcelle of [undefined, "court", "long", "aucun"]) for (const eau of [undefined, "eau", "sec", "inonde"]) {
    const rep: Reponses = {};
    if (parcelle) rep["q-potager-parcelle"] = { valeur: parcelle, date: "2026-11-06" };
    if (eau) rep["q-potager-eau"] = { valeur: eau, date: "2026-11-07" };
    const c = comparer(potager, rep);
    assert.equal(c.ecart, "a_verifier");
    assert.match(c.phrase, /annonce fictive/);
    assert.match(c.phrase, /si sa disponibilité et sa cultivabilité sont confirmées/);
    assert.match(c.phrase, /Sol, eau, exposition et droit d'usage restent à vérifier/);
    assert.doesNotMatch(c.phrase, /seul Chalonnes|devient possible|vous permet de cultiver|D'après (la mairie|le vendeur)/);
    assert.match(c.lectures[1].court, /cultivabilité non établie/);
    assert.match(faceAAujourdhui(potager, c.lectures[1]).phrase, /ne prouve pas que vous pourriez le cultiver/);
    if (eau === "inonde") assert.match(c.phrase, /rien n'établit ici que la maison a été touchée/);
  }
});

test("natation : les créneaux déclarés changent la conclusion, jamais les trajets publics", () => {
  const avant = comparer(nager);
  assert.match(avant.phrase, /À Angers et à Chalonnes-sur-Loire, ce trajet exige la voiture/);
  assert.match(aRetenir([nager], {}).perte!, /contre la marche aujourd'hui/);
  for (const valeur of ["oui", "non"]) {
    const rep = { "q-nager-creneaux": { valeur, date: "2026-11-10" } };
    const c = comparer(nager, rep);
    assert.equal(c.ecart, "a_verifier");
    assert.deepEqual(c.lectures.map(l => l.lecture), avant.lectures.map(l => l.lecture));
    assert.match(c.phrase, /source non renseignée/);
    assert.match(c.phrase, /Reste à vérifier/);
    assert.doesNotMatch(c.phrase + TITRE_ECART[c.ecart], /habitude tient|ne distingue pas les deux lieux|D'après le centre/);
    if (valeur === "non") assert.match(c.phrase, /ne permettrait pas de préserver votre habitude à ces heures-là, même avec un trajet de 14 minutes/);
    else assert.match(c.phrase, /S'ils sont confirmés aux jours souhaités/);
    assert.ok(aRetenir([nager], rep).aVerifier.includes(c.phrase), "le résumé porte aussi la réponse");
  }
});

test("toute réponse conserve ses inconnues et ne transforme pas le contact suggéré en source consultée", () => {
  const publics = structuredClone(CATALOGUE);
  for (const c of Object.values(CATALOGUE)) for (const q of c.questions) for (const r of q.reponses) {
    const e = nouvelleEnvie(c.compris, "developper", "mois", 10);
    const rep = { [q.id]: { valeur: r.valeur, date: "2026-11-07" } };
    const l = lireLieu(e, q.lieu, rep);
    const t = texteReponse(l.verifiees[0]!);
    assert.match(t, /Votre réponse du 7 nov\. \(source non renseignée\)/);
    assert.match(t, /Reste à vérifier : .+/);
    assert.doesNotMatch(t, /D'après (la mairie|le vendeur|le centre)|auprès de :/);
    assert.ok(l.reserve.includes(t), "réserve visible aussi hors du détail de comparaison");
    assert.ok(comparer(e, rep).phrase.includes(t));
    assert.match(ouVousEnEtes([e], rep), /réponse personnelle.*sans source vérifiée/);
  }
  assert.deepEqual(CATALOGUE, publics);
});

test("un retour TC déclaré n'invente ni un temps de trajet ni une accessibilité démontrée", () => {
  const e = theatre("mois");
  const c = comparer(e, { "q-theatre-retour": { valeur: "oui", date: "2026-11-10" } });
  assert.match(c.phrase, /S'il est confirmé et compatible avec le spectacle/);
  assert.match(c.phrase, /la durée totale, l'aller, les correspondances/);
  assert.deepEqual(c.lectures.map(l => l.plusProche), comparer(e).lectures.map(l => l.plusProche));
  assert.doesNotMatch(c.phrase, /reste possible sans voiture|envie tient/);
});

test("une envie non mesurable reste une note, même après des réponses sur d'autres envies", () => {
  const c = comparer(libre, SITUATIONS.find(s => s.id === "apres")!.reponses);
  assert.equal(c.ecart, "non_lu");
  assert.match(c.phrase, /aucune donnée.*reste dans votre Projet/);
  assert.doesNotMatch(c.phrase, /possible à|hors de portée|avantage|voiture/);
  assert.equal(questionUtile([libre], {}), null);
});

test("toutes les situations de démonstration se lisent", () => {
  for (const sc of SITUATIONS) {
    for (const e of sc.envies) assert.ok(comparer(e, sc.reponses).phrase.length > 20, sc.id);
    assert.ok(ouVousEnEtes(sc.envies, sc.reponses).length > 20);
  }
});
