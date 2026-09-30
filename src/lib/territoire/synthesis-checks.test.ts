// FUT-6, D8 : les contrôles portent sur des ASSERTIONS et leur polarité, et sur les nombres. On teste
// la détection ET les faux rejets : une règle trop large punirait des phrases justes.
import test from "node:test";
import assert from "node:assert/strict";
import { buildTerritoireSnapshot } from "./facts.ts";
import { projectForSynthesis } from "./synthesis-contract.ts";
import { checkAssertions, checkNumbers, checkSynthesis } from "./synthesis-checks.ts";
import { auditSyntheses, chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";

const P = projectForSynthesis(buildTerritoireSnapshot(chatelaillonInputs(), "2026-09-28T00:00:00.000Z"), "gwl20");
const rules = (text: string, p = P) => [...new Set(checkAssertions(text, p).map((v) => v.rule))];
const numberErrors = (text: string, p = P) => checkNumbers(text, p).length;

/** Une projection modifiée, pour tester les autres valeurs de catégorie et de risque. */
function withProjection(patch: (p: Record<string, any>) => void): Record<string, unknown> {
  const p = structuredClone(P) as Record<string, any>;
  patch(p);
  return p;
}

// ── Les cinq synthèses de l'audit sont TOUTES rejetées, pour les bons motifs ────────────────

test("les 5 synthèses réelles de l'audit sont rejetées", () => {
  const audit = auditSyntheses();
  assert.equal(audit.length, 5);
  for (const [i, t] of audit.entries()) assert.ok(checkSynthesis(t, P).length > 0, `génération ${i + 1} acceptée à tort`);
});

test("chaque synthèse de l'audit est rejetée pour ses contradictions avec l'écran", () => {
  const [g1, g2, g3, g4, g5] = auditSyntheses().map((t) => rules(t));
  // « petite commune très dense » ; « sols absorbent mal » ; « l'une des communes les plus urbanisées »
  assert.ok(g1.includes("densite:requalifiee-dense") && g1.includes("interdit:impermeabilisation") && g1.includes("interdit:classement-national"));
  // « très urbanisée », « beaucoup de bâti »
  assert.ok(g2.includes("couvert:territoire-tres-bati") && g2.includes("densite:requalifiee-dense"));
  // « l'une des communes les plus densément bâties de France, avec très peu d'espaces verts »
  assert.ok(g3.includes("couvert:territoire-tres-bati") && g3.includes("interdit:classement-national") && g3.includes("interdit:impermeabilisation"));
  // « si peu de couvert végétal », « attire »
  assert.ok(g4.includes("couvert:territoire-tres-bati") && g4.includes("interdit:attractivite"));
  // « très urbanisée », « le béton et le bitume dominent »
  assert.ok(g5.includes("couvert:territoire-tres-bati") && g5.includes("interdit:impermeabilisation"));
});

test("le « moins de 2 % de boisement » de l'audit est un nombre refusé (le boisement ADEME est hors projection)", () => {
  assert.ok(numberErrors("Avec moins de 2 % de boisement, la commune a peu d'ombre.") > 0);
});

// ── Un texte conforme passe ──────────────────────────────────────────────────────────────────

const CONFORME = `Châtelaillon-Plage à l'horizon 2050

## Ce qui domine

Châtelaillon-Plage, 6 227 habitants dans l'agglomération de La Rochelle, présente une densité intermédiaire et une occupation mixte de ses sols : près de la moitié d'espaces urbanisés, mais aussi 21 % de prairies et 10 % de forêts. D'ici 2050, les sols resteraient secs 136 jours par an, et les nuits au-dessus de 20 °C gagneraient 19 unités par rapport à 1976-2005.

## Ce qui tient, ce qui se tend

La population progresse de 0,62 % par an, et près de 10 % des habitants vivaient ailleurs un an plus tôt. Des périmètres d'inondation et de submersion marine sont recensés à l'échelle de la commune, qui a connu 14 reconnaissances de catastrophe naturelle depuis 1982.

## Ce qu'on sous-estime ici

Les restrictions d'eau de niveau crise en vigueur rappellent que la sécheresse des sols n'attend pas 2050. L'effet concret dépendra du quartier et du logement.`;

test("un texte conforme, chiffres arrondis compris, passe tous les contrôles", () => {
  assert.deepEqual(checkSynthesis(CONFORME, P), []);
});

// ── Polarité : le risque NON recensé autorise la négation, interdit l'exposition ────────────

const SANS_SUBMERSION = withProjection((p) => { p.risques_recenses_echelle_communale.submersion_marine = "non recensé"; });
const SANS_INONDATION = withProjection((p) => { p.risques_recenses_echelle_communale.inondation = "non recensé"; });

test("submersion non recensée : « aucun périmètre de submersion n'est recensé » est permis", () => {
  assert.deepEqual(rules("Aucun périmètre de submersion n'est recensé sur la commune.", SANS_SUBMERSION), []);
  assert.deepEqual(rules("La commune n'est pas exposée à la submersion marine selon les données communales.", SANS_SUBMERSION), []);
});

test("submersion non recensée : « le territoire est exposé à la submersion » est refusé", () => {
  assert.deepEqual(rules("Le territoire est exposé à la submersion marine.", SANS_SUBMERSION), ["submersion:exposition-non-recensee"]);
});

test("submersion recensée : la nier est refusé, l'affirmer est permis", () => {
  assert.deepEqual(rules("Il n'y a aucun risque de submersion ici."), ["submersion:exposition-niee"]);
  assert.deepEqual(rules("Le littoral fait partie des zones concernées par la submersion marine."), []);
});

test("inondation non recensée : négation permise, exposition refusée", () => {
  assert.deepEqual(rules("Aucun périmètre d'inondation n'est recensé.", SANS_INONDATION), []);
  assert.deepEqual(rules("Plusieurs quartiers inondables bordent la rivière.", SANS_INONDATION), ["inondation:exposition-non-recensee"]);
});

test("inondation recensée : « sans risque d'inondation » est refusé", () => {
  assert.deepEqual(rules("La commune est sans risque d'inondation."), ["inondation:exposition-niee"]);
});

// ── Faux positifs : des phrases justes ne doivent pas tomber ────────────────────────────────

test("faux positifs : phrases justes sur Châtelaillon, toutes acceptées", () => {
  for (const ok of [
    "Sa densité est intermédiaire, sans être celle d'une commune dense.",
    "La commune n'est pas très dense.",
    "Les espaces urbanisés couvrent près de la moitié de la commune, les prairies un cinquième.",
    "Le territoire n'est pas entièrement bâti : prairies et forêts y tiennent une place réelle.",
    "La recherche d'un logement ici dépend du quartier.",
    "Les résidences secondaires représentent une part marquée des logements.",
    "La population progresse et la part d'arrivants récents est parmi les plus élevées.",
    "Les pluies intenses restent un sujet à suivre.",
    // Phrase réelle du 28/09, refusée à tort par la première version (un appel au modèle perdu) :
    "L'occupation des sols est classée occupation mixte, ce qui distingue ce profil d'un front entièrement bâti.",
    "Loin d'être très urbanisée, la commune garde une part réelle de prairies.",
  ]) {
    assert.deepEqual(rules(ok), [], ok);
  }
});

test("« rural » et « station balnéaire » ne se déduisent pas : refusés faute de fait dédié", () => {
  assert.deepEqual(rules("Une commune au caractère rural."), ["interdit:rural"]);
  assert.deepEqual(rules("Une station balnéaire de la côte."), ["interdit:station-balneaire"]);
  assert.deepEqual(rules("Une station balnéaire recherchée.").sort(), ["interdit:attractivite", "interdit:station-balneaire"]);
});

test("densité : « peu dense » est refusé pour une densité intermédiaire, « dense » accepté pour une commune dense", () => {
  assert.deepEqual(rules("Une commune peu dense."), ["densite:requalifiee-peu-dense"]);
  const DENSE = withProjection((p) => { p.commune.densite.categorie = "Commune dense"; });
  assert.deepEqual(rules("Une commune dense de l'agglomération.", DENSE), []);
});

test("marché du logement : aucune conclusion n'est permise (D5)", () => {
  assert.deepEqual(rules("Le marché est tendu et il y a peu de biens disponibles."), ["interdit:marche-logement"]);
});

// ── Nombres ───────────────────────────────────────────────────────────────────────────────────

test("nombres : valeur exacte, arrondi, et « environ » cohérent sont admis", () => {
  assert.equal(numberErrors("Les résidences secondaires représentent 37,9 % des logements."), 0);
  assert.equal(numberErrors("Les résidences secondaires représentent 38 % des logements."), 0);
  assert.equal(numberErrors("La densité atteint près de 1 000 habitants au km²."), 0);
  assert.equal(numberErrors("Environ 6 200 habitants."), 0);
});

test("nombres : la conversion jours → mois est refusée (136 jours ne font pas 4,5 mois)", () => {
  assert.ok(numberErrors("Les sols resteront secs 4,5 mois par an.") > 0);
  assert.ok(numberErrors("Les sols resteront secs environ 5 mois par an.") > 0);
});

test("nombres : ratio et « x fois plus » refusés quand le résultat n'est pas un fait", () => {
  assert.ok(numberErrors("Les nuits au-dessus de 20 °C seront 4 fois plus nombreuses.") > 0);
});

test("nombres : un « environ » incohérent est refusé", () => {
  assert.ok(numberErrors("Environ 9 000 habitants vivent ici.") > 0);
});

test("limite V1 assumée : un nombre écrit en lettres n'est pas contrôlé", () => {
  assert.equal(numberErrors("La commune compte quatre-vingt-dix mille habitants."), 0);
});

test("forme : trois blocs exigés", () => {
  assert.ok(checkSynthesis("Titre\n\n## Un\n\nTexte.", P).some((v) => v.rule === "format:trois-blocs"));
});

test("nombres : une référence reconstruite par le modèle est refusée, celle de la projection admise", () => {
  // Valeurs de référence 1976-2005 données au modèle (celles que le volet de la carte affiche) :
  // nuits > 20 °C ≈ 5,6 ; jours > 30 °C = 7. « Plus de 7 » est faux (c'est 7), « moins de 6 » est vrai.
  assert.ok(numberErrors("Contre un peu plus de 7 auparavant.") > 0);
  assert.equal(numberErrors("Contre moins de 6 en référence."), 0);
  assert.equal(numberErrors("Contre environ 7 jours au-dessus de 30 °C sur la période 1976-2005."), 0);
});

test("nombres : l'unité compte (des nuits ne se valident pas sur des jours de pluie)", () => {
  assert.ok(numberErrors("On compterait 5 nuits de plus.") > 0); // 5 n'existe qu'en jours (pluie, feu)
});


// ── Corrections du 28/09 : le sens du nombre, la temporalité, le raccord CatNat ──────────────

import { fautivesDu28 } from "./__fixtures__/chatelaillon.ts";

test("réel du 28/09 : « 19 jours supplémentaires » (valeur présentée comme un écart) est rejeté", () => {
  const f = fautivesDu28().valeur_presentee_comme_ecart;
  assert.ok(checkSynthesis(f.texte, P).some((v) => v.rule === "nombre:sens-incoherent" && /19/.test(v.excerpt)), f.defaut);
});

test("réel du 28/09 : « 10 % d'arrivants récents entre 2015 et 2021 » est rejeté", () => {
  const f = fautivesDu28().periode_arrivants;
  assert.ok(checkSynthesis(f.texte, P).some((v) => v.rule === "demographie:periode-arrivants"), f.defaut);
});

test("réel du 28/09 : le raccord CatNat sécheresse ↔ évolution projetée est rejeté", () => {
  const f = fautivesDu28().catnat_secheresse_prolongee;
  assert.ok(checkSynthesis(f.texte, P).some((v) => v.rule === "catnat:secheresse-prolongee"), f.defaut);
});

test("valeur ou écart : les formulations d'écart ne se valident que sur l'écart", () => {
  // jours > 30 °C : valeur 18,8 ; écart +11,6. Nuits > 20 °C : valeur 25,1 ; écart +19,4.
  for (const faux of [
    "19 jours supplémentaires au-dessus de 30 °C.",
    "+19 jours au-dessus de 30 °C.",
    "19 jours de plus au-dessus de 30 °C.",
    "Une hausse de 19 jours au-dessus de 30 °C.",
    "Les jours au-dessus de 30 °C augmentent de 19 jours.",
    "25 nuits supplémentaires au-dessus de 20 °C.",
  ]) assert.ok(numberErrors(faux) > 0, faux);
  for (const juste of [
    "19 jours au-dessus de 30 °C par an.",
    "12 jours supplémentaires au-dessus de 30 °C.",
    "+12 jours par rapport à 1976-2005.",
    "Une hausse de 19,4 nuits au-dessus de 20 °C.",
    "25 nuits au-dessus de 20 °C, soit 19 de plus qu'en 1976-2005.",
    "Les jours au-dessus de 30 °C passent de 7 à 19.",
  ]) assert.equal(numberErrors(juste), 0, juste);
});

test("valeur ou écart : une valeur absolue ne se valide pas sur un écart", () => {
  assert.ok(numberErrors("19 nuits au-dessus de 20 °C par an.") > 0); // 19 est l'écart, la valeur est 25
});

test("arrivants récents : la formulation sur une année est admise", () => {
  assert.deepEqual(rules("9,8 % des habitants vivaient ailleurs un an plus tôt."), []);
  assert.deepEqual(rules("La population a progressé de 0,62 % par an entre 2015 et 2021."), []);
  assert.ok(rules("Près de 10 % d'arrivants récents sur la période 2015-2021.").includes("demographie:periode-arrivants"));
});

test("CatNat : citer séparément les reconnaissances et les jours de sols secs reste permis", () => {
  assert.deepEqual(rules("La commune a été reconnue 5 fois pour sécheresse des sols."), []);
  assert.deepEqual(rules("Les projections comptent 136 jours de sols secs par an."), []);
});

test("faux rejets réels du 28/09 : ces phrases justes sont acceptées", () => {
  for (const ok of [
    "La commune a par ailleurs connu 1,7 °C de réchauffement observé depuis la période 1961-1990.",
    "Depuis 1961-1990, la commune a déjà enregistré 1,7 °C de hausse observée.",
    "La population a progressé de 0,62 % par an entre 2015 et 2021, et 9,8 % des habitants recensés en 2021 vivaient ailleurs un an plus tôt.",
    "Près de 36 % du territoire restent en espaces naturels, ce qui donne à la commune une composition moins entièrement urbanisée que sa densité intermédiaire pourrait le laisser croire.",
    "Là où la période 1976-2005 comptait environ 5 nuits au-dessus de 20 °C, la projection en donne 25 pour 2050.",
  ]) {
    assert.deepEqual(checkSynthesis(`T\n\n## A\n\n${ok}\n\n## B\n\nx.\n\n## C\n\ny.`, P), [], ok);
  }
});

// ── Décisions du 30/09 : eau, raccords, psychologie collective ─────────────────────────────

test("la projection ne présente plus la répartition des jours comme un fait", () => {
  const note = String((P as any).climat_projete.note);
  assert.doesNotMatch(note, /répartis dans l'année|ne forment pas/);
  assert.match(note, /ne permettent pas, à eux seuls, de déduire la durée ni la continuité/);
});

test("eau : une tension future sur la ressource est refusée, les faits restent permis", () => {
  for (const faux of [
    "Ces deux réalités décrivent une tension sur l'eau qui existe indépendamment du littoral.",
    "La pression sur la ressource en eau s'exercera sur un territoire mixte.",
    "L'eau devient plus rare.",
  ]) assert.ok(rules(faux).includes("interdit:tension-eau"), faux);
  for (const ok of [
    "Des restrictions d'eau de niveau crise sont en vigueur sur le bassin de Charente-aval.",
    "Les projections comptent 136 jours de sols secs par an.",
  ]) assert.deepEqual(rules(ok), [], ok);
});

test("raccords : entre objets voisins refusés, entre mêmes grandeurs permis", () => {
  assert.ok(rules("Ces deux lectures pointent dans une direction commune sans se confondre.").includes("raccord:non-autorise"));
  assert.ok(rules("Ces deux réalités, restrictions en vigueur et sécheresse reconnue, décrivent une même tension.").includes("raccord:non-autorise"));
  assert.deepEqual(rules("Le réchauffement observé depuis 1961-1990 et les températures projetées vont dans la même direction."), []);
});

test("psychologie collective : les tournures réelles du 28/09 sont refusées", () => {
  assert.ok(rules("Ce déséquilibre est rarement le premier élément qu'on lit sur un territoire de ce type.").includes("interdit:psychologie-collective"));
  assert.ok(rules("Ce poids est rarement pensé dans sa dimension climatique.").includes("interdit:psychologie-collective"));
  assert.deepEqual(rules("Les résidences secondaires représentent 38 % des logements."), []);
});

test("faux rejets réels du 30/09 acceptés, vrai rejet d'unité conservé", () => {
  const wrap = (x: string) => `T\n\n## A\n\n${x}\n\n## B\n\nx.\n\n## C\n\ny.`;
  assert.deepEqual(checkSynthesis(wrap("Ce changement s'inscrit dans un réchauffement déjà mesuré de 1,7 °C depuis la période 1961-1990."), P), []);
  assert.deepEqual(checkSynthesis(wrap("Depuis 1961-1990, le territoire a déjà gagné 1,7 °C."), P), []);
  assert.deepEqual(checkSynthesis(wrap("Le réchauffement déjà observé depuis 1961-1990 atteint 1,7 °C."), P), []);
  // L'exception ne vaut que pour la température : des jours restent stricts.
  assert.ok(numberErrors("Le réchauffement ajoute 19 jours au-dessus de 30 °C.") > 0);
  // 19 est l'écart des NUITS ; écrit « 19 jours », l'unité est fausse (l'écart des jours vaut 11,6).
  assert.ok(numberErrors("Elles seraient 25 à l'horizon 2050, soit un écart de 19 jours.") > 0);
});


// ── Test réel Nantes du 30/09 : les inférences qui passaient, et la liberté éditoriale à garder ──

const NANTES_FAUTIVES: [string, string][] = [
  ["La chaleur estivale est le fait le plus structurant que les données projettent pour Nantes.", "hierarchie:objective"],
  ["Dans une commune dense, où les espaces urbanisés couvrent près de 72 % du territoire, ces nuits plus chaudes pèsent d'un poids particulier.", "composition:non-autorisee:morphologie×chaleur"],
  ["Elle touche la récupération thermique nocturne, que les résidents de villes compactes comptent sur leur environnement pour offrir.", "interdit:psychologie-collective"],
  ["Ce n'est pas négligeable pour une commune de cette densité.", "benchmark:absent"],
  ["Ce que le climat projette en matière de pluies intenses s'inscrit dans un territoire qui connaît cet enjeu depuis plusieurs décennies.", "composition:non-autorisee:pluie×inondation_reconnue"],
  ["Une commune dense qui accueille une part importante de nouveaux habitants chaque année est aussi une commune dont les besoins en eau, en fraîcheur et en services évoluent rapidement.", "composition:non-autorisee:arrivants×besoins"],
];

test("Nantes (réel) : chaque inférence est rejetée pour son motif", () => {
  for (const [phrase, regle] of NANTES_FAUTIVES) assert.ok(rules(phrase).includes(regle), `${regle} : ${phrase}`);
});

test("liberté éditoriale : sélection prudente, juxtaposition et composition autorisée restent permises", () => {
  for (const ok of [
    "La chaleur estivale ressort parmi les évolutions les plus visibles de la projection.",
    "La chaleur estivale constitue un fil conducteur de cette projection.",
    "Les projections indiquent 4,8 jours de pluie intense par an. Par ailleurs, la commune compte 14 reconnaissances de catastrophe naturelle liées aux inondations depuis 1982.",
    "Le réchauffement observé depuis 1961-1990 se prolonge dans les températures projetées.",
    "8,7 % des habitants vivaient dans une autre commune un an avant le recensement de 2021.",
    "La commune est dense, et les nuits au-dessus de 20 °C deviennent plus fréquentes.",
  ]) assert.deepEqual(rules(ok), [], ok);
  const DENSE = withProjection((p) => { p.commune.densite.categorie = "Commune dense"; });
  assert.deepEqual(rules("Nantes est une commune dense et 27,4 % de son territoire est classé en espaces naturels.", DENSE), []);
});

test("réel du 30/09 (Nantes, Aurillac) : les inférences restantes sont rejetées, la sélection éditoriale reste permise", () => {
  for (const [phrase, regle] of [
    ["Dans une commune dense, ces étés plus lourds constituent le changement le plus concret pour le quotidien.", "hierarchie:objective"],
    ["Ce fait attire moins l'attention que les étés.", "interdit:psychologie-collective"],
    ["Ces deux faits sont distincts, mais ils décrivent ensemble un régime hydrique qui évolue.", "raccord:non-autorise"],
    ["Pour une ville de l'intérieur à cette altitude, ce déplacement a des effets sur les paysages.", "benchmark:absent"],
  ] as [string, string][]) assert.ok(rules(phrase).includes(regle), `${regle} : ${phrase}`);
  assert.deepEqual(rules("Ce déplacement des températures estivales constitue le fil conducteur le plus lisible de cette projection."), []);
  assert.deepEqual(rules("Les mouvements de terrain constituent un signal moins visible dans la lecture d'ensemble."), []);
  assert.ok(rules("Ce déplacement se produit de façon moins remarquée.").includes("interdit:psychologie-collective"));
});


test("« 2 °C au-dessus de la référence » se lit comme un écart ; « au-dessus de 20 °C » reste un seuil (Aurillac, 30/09)", () => {
  assert.equal(numberErrors("L'été atteindrait 21,7 °C, soit 2 °C au-dessus de la référence 1976-2005."), 0);
  assert.equal(numberErrors("La température estivale, qui était de 19,7 °C, passerait à 21,7 °C, 2 °C au-dessus de cette même référence."), 0);
  // Sans référence nommée, « 2 °C au-dessus » n'est pas un écart reconnu : 2 n'est pas une valeur.
  assert.equal(numberErrors("L'été serait à 2 °C au-dessus."), 1);
  assert.equal(numberErrors("La période 1976-2005 comptait environ 5 nuits au-dessus de 20 °C."), 0);
});

test("population d'agglomération arrondie au millier : admise au-delà de 10 000 (Nantes, 30/09)", () => {
  assert.equal(numberErrors("La commune appartient à une agglomération de 138 000 habitants."), 0);
  assert.equal(numberErrors("La commune appartient à une agglomération de 140 000 habitants."), 1);
  // En dessous de 10 000, pas d'arrondi au millier : 6 000 ne vaut pas 6 227.
  assert.equal(numberErrors("La commune compte 6 000 habitants."), 1);
});
