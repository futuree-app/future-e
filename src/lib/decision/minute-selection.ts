// LA SÉLECTION DE « EN UNE MINUTE ».
//
// Le bloc était un dossier RACCOURCI : chaque section gardait ses meilleures cartes sous son propre
// plafond (2 + 3 + 3 + 3 + 3 + 4). Chaque rubrique optimisait son volume sans regarder le total, si bien
// que le bloc grossissait mécaniquement avec le nombre de priorités déclarées. Mesuré le 25/07 : un
// projet à 15 critères produisait 8 cartes et près de 3 minutes de lecture, contre 81 secondes pour un
// projet à 2 critères. Celui qui avait le plus réfléchi à ce qu'il cherchait était le plus mal servi.
//
// La minute est désormais une SÉLECTION DÉCISIONNELLE : le plus petit ensemble de faits qui rend le
// verdict compréhensible, équilibré et actionnable. Le reste n'est pas perdu — il vit dans le dossier
// (`dossier.sections`), que cette fonction ne modifie jamais.
//
// CE QUI NE TRIE PAS, ET POURQUOI. La matérialité et le lien à une priorité sont d'excellents critères
// d'ÉLIGIBILITÉ — ils décident qu'un fait mérite d'exister — mais de mauvais critères de SÉLECTION :
// mesuré sur quatre dossiers réels, un projet à 15 priorités fortes produit des faits TOUS `structuring`
// et TOUS rattachés à une priorité. Ils s'aplatissent exactement là où on aurait besoin d'eux.
import type { DecisionFact } from "./decision-fact.ts";
import type { FactComposition } from "./fact-composition.ts";
import type { Orientation } from "./criteria-registry.ts";

// QUATRE CARTES, plafond GLOBAL. Le chiffre vient de la MESURE, pas d'un principe : sur quatre dossiers
// réels à 15 priorités, le bloc rendu (verdict compris) tient en 87 à 95 secondes à quatre cartes, contre
// 101 à 123 à cinq — au-delà de la borne de 1 min 45 fixée par le porteur, « en une minute » s'entendant
// comme une expression et non comme un chronomètre.
//
// ATTENTION AUX SIMULATIONS : compter les `statement` donnait 67-94 s là où le rendu réel en fait 101-123.
// L'écart, ce sont les étiquettes, les preuves, les actions, les intros de section et les dépliables. Un
// budget se mesure SUR L'ÉCRAN, jamais sur le texte des faits.
//
// Le plafond est GLOBAL et non par section : c'est tout le passage de « les meilleurs faits de chaque
// tiroir » à « les faits les plus importants du dossier ».
export const MINUTE_MAX_CARTES = 4;

// UNE SEULE CARTE POUR CE QU'ON N'A PAS DEMANDÉ. Le reste de la minute appartient au projet déclaré.
//
// Trois cartes sur les priorités, une vigilance sur le lieu : c'est la répartition qui garde à « en une
// minute » le sens d'une RÉPONSE. Sans ce plafond, un projet précis (l'inondation, disons) pouvait voir
// sa minute occupée par la chaleur, le feu et la sécheresse — trois constats justes, aucun demandé, et
// la réponse à la question posée reléguée au dossier.
//
// Le plafond ne s'applique QUE si le dossier a des cartes rattachées à une priorité : sur un projet sans
// aucun critère déclaré, tout est ambiant par construction, et n'en montrer qu'une viderait l'écran.
export const MINUTE_MAX_AMBIANTES = 1;

type Role = DecisionFact["role"] | "composition";

// LE RÔLE SE LIT PAR RAPPORT À L'ORIENTATION. Une hiérarchie universelle (« écart > vérification >
// correspondance ») sous-documenterait le dossier FAVORABLE, où les correspondances FONDENT le verdict :
// vérifié sur un projet à 4 priorités bien servies, où le héros les nomme lui-même. Ce qui domine, c'est
// ce qui EXPLIQUE l'orientation produite.
function rangRole(role: Role, orientation: Orientation): number {
  const favorable: Record<string, number> = {
    incompatibility: 0, alignment: 1, composition: 2, mismatch: 2, verification: 3, compromise: 3, unknown: 4,
  };
  const autre: Record<string, number> = {
    incompatibility: 0, composition: 1, mismatch: 1, verification: 2, compromise: 2, unknown: 3, alignment: 4,
  };
  return (orientation === "favorable" ? favorable : autre)[role] ?? 9;
}

// L'ORDRE DES CONSTATS NON DEMANDÉS, quand il n'y a qu'une place et plusieurs candidats.
//
// Le plafond d'une carte ambiante a créé une concurrence sans arbitre : deux candidats de même rôle et
// de même rattachement retournaient 0 au comparateur, donc le TRI STABLE tranchait — c'est-à-dire
// l'ordre de déclaration des règles dans le registre. Sur une commune à la fois très chaude et très
// exposée au feu, le feu disparaissait de la minute parce que `ruleFeuAmbiant` est déclarée trois lignes
// sous `ruleChaleurAmbiante`. Un arbitrage éditorial rendu par la position d'un `export const`.
//
// CE QUI NE PEUT PAS ARBITRER : le dépassement relatif du seuil. 42 nuits tropicales, 30 jours d'indice
// forêt-météo et 82 mm de pluie ne se comparent pas. Le percentile mesure la RARETÉ du lieu par rapport
// aux autres, jamais l'importance de la chose pour celui qui y vivra — et c'est bien cette importance
// qu'il faut pour prendre l'unique place.
//
// CE QUI ARBITRE, donc : un ordre ÉDITORIAL, déclaré ici et motivé.
//
// LA CHALEUR AVANT LE FEU — et cet ordre a été inversé deux fois, la seconde sur une MESURE.
//
// Premier jet : chaleur devant, au motif qu'elle se subit tous les étés à toutes les adresses là où
// l'indice forêt-météo ne devient un risque vécu qu'en présence d'un massif.
//
// Deuxième : feu devant, quand la règle a commencé à lire le risque RECENSÉ par l'État — un fait établi,
// vérifiable en mairie, indépendant de tout scénario. La doctrine invoquée était « à matérialité
// décisionnelle COMPARABLE, un constat établi et directement vérifiable prime une projection ».
//
// Troisième, celui-ci : la condition « comparable » a été MESURÉE, et elle n'est pas remplie. Sur les 88
// communes à risque feu recensé de l'échantillon (docs/mesures/), 97,7 % n'ont AUCUN plan de prévention
// incendie — une seule porte un PPRIF avec servitude opposable, une autre un PPRIF prescrit. Le
// recensement est donc, presque toujours, une mention communale : ni intensité, ni étendue, ni zonage,
// ni distance à l'habitat. Face à 39 nuits tropicales projetées — les 5 % de communes les plus exposées,
// un phénomène subi chaque été à toutes les adresses — sa matérialité décisionnelle est plus faible.
//
// CE QUE CETTE MESURE NE REMET PAS EN CAUSE : l'ouverture du recensement en constat non demandé. Une
// mention communale reste vérifiable et actionnable, et Lège-Cap-Ferret continue de parler à qui n'a
// rien déclaré. Elle ne prime simplement pas une projection exceptionnelle.
//
// DETTE : un PPRIF OPPOSABLE, lui, mériterait la première place — c'est une servitude qui contraint ce
// qu'on peut bâtir. Il concerne 1,1 % des communes à risque recensé, et le produit ne lit pas les plans
// par commune aujourd'hui. À rouvrir quand la distinction sera lisible, pas avant.
//
// Un axe ambiant qui ne figure pas ici passe en dernier, dans l'ordre du registre. C'est le comportement
// d'avant, mais assumé pour les seuls cas non tranchés au lieu de gouverner tous les cas par accident.
const ORDRE_AMBIANT: readonly string[] = [
  "territoire.verification-chaleur-future",
  "territoire.verification-feu-futur",
];

function rangAmbiant(ruleId: string): number {
  const i = ORDRE_AMBIANT.indexOf(ruleId);
  return i === -1 ? ORDRE_AMBIANT.length : i;
}

type Candidat = {
  cle: string;      // l'identifiant de la carte (fait ou composition)
  role: Role;
  heros: boolean;   // le verdict le NOMME : il fonde la conclusion
  prio: boolean;    // il répond à une priorité déclarée
  sujet: string;    // pour la non-redondance
  rangAmbiant: number; // cf. ORDRE_AMBIANT — ne départage QUE les constats non demandés
};

// CE DONT LA SÉLECTION A BESOIN — et rien de plus. Elle prend les faits AFFICHÉS, pas le dossier
// assemblé : c'est ce qui lève la circularité entre elle et le verdict. Le verdict doit connaître le
// périmètre de la synthèse pour en parler juste (« deux points à contrôler ici, trois autres dans le
// dossier »), et la sélection doit connaître le héros pour savoir ce qui fonde la conclusion. En
// travaillant sur les mêmes entrées que le plan, elle s'insère AU MILIEU de sa construction : après le
// héros, avant le détail.
export type EntreesSelection = {
  faits: DecisionFact[];
  compositions: FactComposition[];
  orientation: Orientation;
  // Les identifiants que le HÉROS nomme (faits et compositions confondus).
  nommes: Set<string>;
  // Les règles qui ont examiné un critère DÉCLARÉ : c'est ce qui rattache une carte à une priorité,
  // y compris pour les rôles qui ne portent pas de `projectKey` (une verification, par exemple).
  reglesDeclarees: Set<string>;
};

// LE SUJET SERT À LA NON-REDONDANCE, et il doit toujours exister : un fait dont le sujet manquerait
// ferait planter la sélection — donc l'écran entier — pour une comparaison de chaînes. Repli sur
// l'identifiant, qui est unique par construction : deux cartes sans sujet ne se dédoublonnent pas
// entre elles, ce qui est le comportement le moins destructeur.
function sujetDe(x: { headlineSubject?: string; topic?: string; title?: string; id: string }): string {
  return x.headlineSubject ?? x.topic ?? x.title ?? x.id;
}

function candidats(e: EntreesSelection): Candidat[] {
  return [
    ...e.faits.map((f): Candidat => ({
      cle: f.id, role: f.role, heros: e.nommes.has(f.id), prio: e.reglesDeclarees.has(f.ruleId),
      rangAmbiant: rangAmbiant(f.ruleId),
      sujet: sujetDe(f.role === "mismatch" || f.role === "alignment" ? f : { topic: f.topic, id: f.id }),
    })),
    ...e.compositions.map((c): Candidat => ({
      cle: c.id, role: "composition", heros: e.nommes.has(c.id),
      // `referencedRuleIds` est obligatoire sur le type, mais une composition mal formée ne doit pas
      // faire tomber l'écran entier pour un rattachement de priorité : sans elle, la carte est
      // simplement considérée comme non rattachée.
      prio: (c.referencedRuleIds ?? []).some((r) => e.reglesDeclarees.has(r)),
      rangAmbiant: Math.min(...[...(c.referencedRuleIds ?? []).map(rangAmbiant), ORDRE_AMBIANT.length]),
      sujet: c.kind === "shared_evidence" ? (c.headlineCause ?? c.title ?? c.id) : sujetDe(c),
    })),
  ];
}

// LES CLÉS DES CARTES RETENUES POUR LA MINUTE.
//
// Tri LEXICOGRAPHIQUE, jamais un score : chaque critère domine le suivant, et l'inclusion de chaque carte
// se raconte en une phrase. Une addition pondérée produirait des inversions que personne ne saurait
// expliquer — dans un produit dont c'est justement la promesse.
export function selectionMinute(entrees: EntreesSelection): Set<string> {
  const orientation = entrees.orientation;
  const tries = candidats(entrees).sort((a, b) => {
    if (a.heros !== b.heros) return a.heros ? -1 : 1;        // 1. il fonde le verdict
    const ra = rangRole(a.role, orientation), rb = rangRole(b.role, orientation);
    if (ra !== rb) return ra - rb;                            // 2. sa nature explique l'orientation
    if (a.prio !== b.prio) return a.prio ? -1 : 1;            // 3. il répond à une priorité déclarée
    // 4. entre CONSTATS NON DEMANDÉS seulement : l'ordre éditorial déclaré (cf. ORDRE_AMBIANT). Le test
    // `a.prio` suffit à borner la portée — deux cartes rattachées à une priorité ne sont jamais
    // départagées par ce rang, elles gardent l'ordre des sections.
    if (!a.prio && a.rangAmbiant !== b.rangAmbiant) return a.rangAmbiant - b.rangAmbiant;
    return 0;                                                 // sinon : l'ordre éditorial des sections
  });

  // LA PLACE RÉSERVÉE AU CONTREPOIDS. Sans elle, un dossier d'arbitrage n'affiche que des écarts : cinq
  // cartes négatives d'affilée, alors que le verdict dit « la décision se joue entre ces correspondances
  // et les écarts relevés ». Chaque carte serait vraie et l'écran pencherait — le défaut de composition
  // que ce dossier a passé une journée à fermer. Mesuré : sans réservation, le contrepoids n'apparaissait
  // que dans deux dossiers d'arbitrage sur quatre.
  const arbitrage = orientation === "arbitration" || orientation === "major_reserves" || orientation === "minor_reserves";
  const contrepoids = arbitrage ? tries.find((c) => c.role === "alignment") : undefined;

  // Un dossier FAVORABLE se fonde sur ses correspondances : elles peuvent occuper la majorité des places.
  // Ailleurs, une seule — le verdict nomme déjà le côté favorable dans son détail, et deux cartes de plus
  // rediraient ce qu'il vient de dire.
  const maxAlignments = orientation === "favorable" ? 3 : 1;

  // Cf. MINUTE_MAX_AMBIANTES : sans carte rattachée à une priorité, il n'y a pas de « demandé » dont
  // l'ambiant prendrait la place.
  const maxAmbiantes = tries.some((c) => c.prio) ? MINUTE_MAX_AMBIANTES : MINUTE_MAX_CARTES;

  const retenues = new Set<string>();
  const sujets = new Set<string>();
  let alignments = 0;
  let ambiantes = 0;
  const prendre = (c: Candidat): void => {
    retenues.add(c.cle);
    sujets.add(c.sujet.toLowerCase());
    if (c.role === "alignment") alignments++;
    if (!c.prio) ambiantes++;
  };
  if (contrepoids) prendre(contrepoids); // sa place est acquise avant le remplissage

  for (const c of tries) {
    if (retenues.size >= MINUTE_MAX_CARTES) break;
    if (retenues.has(c.cle)) continue;
    // NON-REDONDANCE. Cinq cartes qui disent au fond « la chaleur mérite votre attention » ne valent pas
    // mieux qu'une : la sélection n'est pas un classement, c'est un ensemble qui doit COUVRIR.
    if (sujets.has(c.sujet.toLowerCase())) continue;
    if (c.role === "alignment" && alignments >= maxAlignments) continue;
    if (!c.prio && ambiantes >= maxAmbiantes) continue;
    prendre(c);
  }
  return retenues;
}

// LES SECTIONS DE LA MINUTE : les mêmes que le dossier, réduites aux cartes retenues. Les sections vides
// disparaissent. `dossier.sections` n'est jamais modifié — il reste la restitution complète, et c'est lui
// que le dossier détaillé affichera.
export function estDansLaMinute(retenues: ReadonlySet<string>) {
  return (card: { kind: "fact"; fact: { id: string } } | { kind: "composition"; composition: { id: string } }): boolean =>
    retenues.has(card.kind === "composition" ? card.composition.id : card.fact.id);
}
