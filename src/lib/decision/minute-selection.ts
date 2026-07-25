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
import type { Dossier, DossierCard, DecisionFact } from "./decision-fact.ts";
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

type Candidat = {
  cle: string;      // l'identifiant de la carte (fait ou composition)
  role: Role;
  heros: boolean;   // le verdict le NOMME : il fonde la conclusion
  prio: boolean;    // il répond à une priorité déclarée
  sujet: string;    // pour la non-redondance
};

function candidats(dossier: Dossier): Candidat[] {
  const h = dossier.narrativePlan.verdict.headline;
  const nommes = new Set([...h.consumedFactIds, ...h.consumedCompositionIds]);
  const reglesDeclarees = new Set(dossier.criteria.registry.flatMap((c) => c.ruleIds));
  return dossier.sections.flatMap((s) => s.cards.map((card): Candidat =>
    card.kind === "composition"
      ? {
          cle: card.composition.id, role: "composition",
          heros: nommes.has(card.composition.id),
          prio: card.composition.referencedRuleIds.some((r) => reglesDeclarees.has(r)),
          sujet: (card.composition.kind === "shared_evidence"
            ? card.composition.headlineCause
            : card.composition.headlineSubject) ?? card.composition.title,
        }
      : {
          cle: card.fact.id, role: card.fact.role,
          heros: nommes.has(card.fact.id),
          prio: reglesDeclarees.has(card.fact.ruleId),
          sujet: card.fact.role === "mismatch" || card.fact.role === "alignment"
            ? card.fact.headlineSubject : card.fact.topic,
        }));
}

// LES CLÉS DES CARTES RETENUES POUR LA MINUTE.
//
// Tri LEXICOGRAPHIQUE, jamais un score : chaque critère domine le suivant, et l'inclusion de chaque carte
// se raconte en une phrase. Une addition pondérée produirait des inversions que personne ne saurait
// expliquer — dans un produit dont c'est justement la promesse.
export function selectionMinute(dossier: Dossier): Set<string> {
  const orientation = dossier.criteria.orientation;
  const tries = candidats(dossier).sort((a, b) => {
    if (a.heros !== b.heros) return a.heros ? -1 : 1;        // 1. il fonde le verdict
    const ra = rangRole(a.role, orientation), rb = rangRole(b.role, orientation);
    if (ra !== rb) return ra - rb;                            // 2. sa nature explique l'orientation
    if (a.prio !== b.prio) return a.prio ? -1 : 1;            // 3. il répond à une priorité déclarée
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

  const retenues = new Set<string>();
  const sujets = new Set<string>();
  let alignments = 0;
  const prendre = (c: Candidat): void => {
    retenues.add(c.cle);
    sujets.add(c.sujet.toLowerCase());
    if (c.role === "alignment") alignments++;
  };
  if (contrepoids) prendre(contrepoids); // sa place est acquise avant le remplissage

  for (const c of tries) {
    if (retenues.size >= MINUTE_MAX_CARTES) break;
    if (retenues.has(c.cle)) continue;
    // NON-REDONDANCE. Cinq cartes qui disent au fond « la chaleur mérite votre attention » ne valent pas
    // mieux qu'une : la sélection n'est pas un classement, c'est un ensemble qui doit COUVRIR.
    if (sujets.has(c.sujet.toLowerCase())) continue;
    if (c.role === "alignment" && alignments >= maxAlignments) continue;
    prendre(c);
  }
  return retenues;
}

// LES SECTIONS DE LA MINUTE : les mêmes que le dossier, réduites aux cartes retenues. Les sections vides
// disparaissent. `dossier.sections` n'est jamais modifié — il reste la restitution complète, et c'est lui
// que le dossier détaillé affichera.
export function cartesDeLaMinute(dossier: Dossier, retenues: Set<string>): (card: DossierCard) => boolean {
  return (card) => retenues.has(card.kind === "composition" ? card.composition.id : card.fact.id);
}
