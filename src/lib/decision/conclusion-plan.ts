// Le PLAN NARRATIF : ce que le déterministe a décidé, avant qu'un LLM n'ouvre la bouche (slice 2).
// Il porte la présence, l'ORDRE, les sources, la matière obligatoire et le texte de repli de chaque
// registre. L'IA reçoit ce plan et ne renvoie que { key, text }. Fonctions PURES, aucun LLM.
//
// La hiérarchie éditoriale des réserves (du plus grave au moins grave) :
//   1. verdict                     l'état de conclusion, borné au périmètre réellement examiné
//   2. unexamined_hard_constraints une condition ABSOLUE n'a pas pu être testée : elle diminue la
//                                  valeur du verdict, donc elle le suit immédiatement
//   3. reserves_found              ce qu'on a examiné et qui appelle un regard
//   4. uncovered_priorities        réduit la personnalisation, n'invalide pas le verdict
// Une contrainte dure non examinée et une préférence non couverte sont deux absences de couverture.
// Elles ne partagent JAMAIS le même bloc.
import type { DecisionFact, ConclusionState, MaterialityTier, UncoveredConstraint } from "./decision-fact.ts";
import type { FactComposition } from "./fact-composition.ts";
import type { ProjectPosture } from "../user-project.ts";
import type { CoverageLevel, Orientation } from "./criteria-registry.ts";
import { deCommune, aCommune } from "../typography.ts";

export type BlockKey = "verdict" | "unexamined_hard_constraints" | "compositions_found" | "reserves_found" | "uncovered_priorities";

export type NarrativeBlock = {
  key: BlockKey;
  fallbackText: string;       // le texte déterministe de CE registre, affichable seul
  sourceIds: string[];        // factIds / HardConstraintKey / PreferenceKey. JAMAIS produits par l'IA.
  requiredPhrases: string[];  // matière qui doit SURVIVRE à la rédaction, textuellement
  allowedNumbers: string[];   // les nombres VRAIS de ce registre, en chiffres ET en lettres
  maxChars: number;
  generable: boolean;         // false = déterministe, hors de portée du modèle
};

// Le fait saillant est DÉSIGNÉ par le déterministe, jamais élu par l'IA. `tied` existe parce que
// prendre le premier d'un tri à égalité transformerait un ordre de DÉCLARATION dans le registre en
// PRIORITÉ MÉTIER : si deux faits sont decision_critical, écrire « à commencer par le PPRN » ment.
//
// Le lead porte le SUJET de chaque fait (`topic`), pas son constat. Deux défauts, l'un après l'autre,
// ont conduit là. D'abord la conclusion annonçait « 3 points se placent à égalité en tête » sans en
// citer un seul : elle parlait d'elle-même au lieu de parler du lieu (ne pas COURONNER un fait quand
// trois pèsent pareil est juste, refuser de les NOMMER ne l'est pas). Puis, en citant les constats
// entiers, elle recopiait mot pour mot les cartes situées trois centimètres plus bas.
//
// La conclusion NOMME, les cartes DÉMONTRENT.
//
// `subject` est CE QUI S'ÉCRIT ; `topic` reste l'identité du candidat (tri, journalisation). Pour un
// fait les deux coïncident ; pour une composition le `topic` est son `title`, écrit pour coiffer une
// carte, donc capitalisé et long : servi tel quel après un deux-points, il mettait une majuscule au
// milieu de la phrase (« À regarder ensuite : Un sol argileux, et la règle qui l'encadre. »).
export type LeadSelection =
  | { kind: "single"; factId: string; topic: string; subject: string; statement: string; materialityTier: MaterialityTier }
  | { kind: "tied"; facts: { factId: string; topic: string; subject: string }[]; materialityTier: MaterialityTier }
  | { kind: "none" };

export type VerdictTone = "critical" | "caution" | "neutral" | "positive";

// LE HÉROS DU BLOC. Il dit le cœur de la décision, en une phrase que le lecteur saisit d'un coup
// d'œil. Il n'est JAMAIS généré : un texte aussi visible ne peut pas changer de ton selon un tirage.
//
// `consumed*` porte l'invariant de NON-RÉPÉTITION : tout sujet nommé ici est consommé et ne peut plus
// être nommé par une strate voisine. Il réapparaît librement dans les cartes plus bas, qui portent la
// preuve. La comparaison se fait sur des IDENTIFIANTS, jamais sur des textes. Les identifiants de
// faits (y compris les absorbés d'une composition) vont dans `consumedFactIds` ; ceux de compositions
// dans `consumedCompositionIds`.
//
// `consumedFrom` dit DANS QUEL POOL le headline a puisé. La strate voisine en a besoin : si elle
// puise dans le même pool, elle est la SUITE d'une hiérarchie déjà ouverte (« À regarder ensuite »),
// et non une seconde hiérarchie globale (« Parmi ces 4 points, 2 pèsent le plus ») qui contredirait
// le « principal point » que le héros vient de désigner.
export type VerdictHeadline = {
  kind: "named_issues" | "posture";
  text: string;
  consumedFactIds: string[];
  consumedCompositionIds: string[];
  consumedFrom: "reserves" | "mismatches" | "constraint" | "alignments" | null;
};

// Le headline et le détail sont deux sorties COORDONNÉES d'un même constructeur, jamais l'une dérivée
// de l'autre par manipulation de chaîne (fragile dès qu'une formulation évolue).
export type VerdictPresentation = { headline: VerdictHeadline; detail: string };

// Deux enjeux nommés au maximum : trois en grand Serif recréeraient le paragraphe qu'on supprime.
// Et un plafond de longueur, nom de commune compris : deux sujets longs débordent la mesure du héros.
//
// Le plafond est calé sur les phrases RÉELLEMENT produites, pas sur une intuition. À 95, deux cas
// courants passaient à un caractère de basculer à tort en posture : l'incompatibilité nommée sur une
// commune à article (« Une condition de votre projet n'est pas remplie aux Sables-d'Olonne : la
// proximité d'une gare. », 94 car.), soit le cas le plus grave privé de son nom, et l'arbitrage
// nominal à deux sujets (94 aussi).
//
// 110 -> 130 après la passe sur les SUJETS : nommer la priorité du lecteur plutôt que la mesure les a
// allongés (« la taille de la ville » 21 -> « une ville à taille humaine » 26 ; « la faible dépendance
// à la voiture » 33 -> « la possibilité de se passer de la voiture » 41), et la part des arbitrages à
// deux priorités qui restaient nommés tombait de 85 % à 55 % sur une commune de longueur médiane.
// Mesure validée à l'écran : la colonne de 540 px tient la phrase la plus longue.
export const HEADLINE_MAX_ISSUES = 2;
export const HEADLINE_MAX_CHARS = 130;

export type ConclusionNarrativePlan = {
  scope: "commune" | "commune+adresse";
  communeNom: string;
  conclusionState: ConclusionState;
  posture: ProjectPosture;
  blocks: NarrativeBlock[];
  reservesCount: number; // faits AFFICHÉS (post-caps), jamais faits émis
  lead: LeadSelection;
  verdict: VerdictPresentation;
  verdictLabel: string;   // le statut qui coiffe la carte, dérivé de la MÊME table que la phrase
  verdictTone: VerdictTone;
};

// Ce que l'assembleur fournit. Un `Dossier` ne peut pas être l'entrée : il PORTERA ce plan (cycle).
export type ConclusionPlanInput = {
  scope: "commune" | "commune+adresse";
  // Le NOM de la commune. « Ce lieu » et « la commune » sont des catégories : le lecteur regarde
  // Toulouse, et le dossier doit le lui dire. Même exigence que les topics et les libellés de
  // contraintes : on nomme, on ne catégorise pas.
  communeNom: string;
  conclusionState: ConclusionState;
  posture: ProjectPosture;
  shownFacts: DecisionFact[]; // les faits réellement affichés, après plafonnement des sections
  // Les compositions AFFICHÉES. REQUIS, jamais optionnel : un optionnel créerait un troisième état
  // entre « aucune composition » et « champ oublié par l'appelant ».
  shownCompositions: FactComposition[];
  uncovered: UncoveredConstraint[];
  uncoveredPriorities: { key: string; label: string }[];
  // LA CONDITION TELLE QUE LE LECTEUR L'A POSÉE, jamais le `topic` du fait. Les topics de contraintes
  // dures portent déjà le nom de la commune (hard-constraints.ts, tous en `deCommune(c.nom)`), et le
  // héros le nomme lui aussi : « … n'est pas satisfaite à Toulouse : la distance de Toulouse au
  // littoral. » L'appelant résout donc le libellé (hardConstraintLabel) et le passe ici, comme le
  // bloc `unexamined_hard_constraints` le fait déjà pour les contraintes non examinées.
  establishedIncompatibility: { factId: string; statement: string; constraintLabel: string } | null;
  // Les deux mesures du verdict (criteria-registry.ts), plus les comptes qui accordent ses phrases.
  coverage: CoverageLevel;
  orientation: Orientation;
  hasFavorable: boolean;     // au moins un critère examiné rend `favorable`
  favorableCount: number;    // combien : « plusieurs dimensions » exige >= 2, jamais un booléen
  majorReserveCount: number; // réserves AFFICHÉES structurantes/critiques
  reservesShown: number;     // réserves AFFICHÉES, tous tiers confondus
  mismatchTotal: number;     // mismatchs ÉMIS (le verdict compte dessus, pas sur l'affiché)
  mismatchShown: number;     // mismatchs AFFICHÉS (post-cap 3)
};

const TIER_ORDER: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };
const RESERVE_ROLES = new Set<DecisionFact["role"]>(["verification", "compromise", "unknown"]);

// La matière obligatoire porte sur le NOYAU du libellé, pas sur sa grammaire. Les libellés sont
// écrits pour une liste (« la proximité de la mer »), mais une phrase les décline (« votre exigence
// DE proximité de la mer »). Exiger l'article rejetterait une reformulation parfaitement fidèle :
// c'est ce que la sonde a montré, 3 fois sur 3. On exige donc « proximité de la mer », ce qu'aucune
// tournure honnête ne peut perdre, et ce qu'une déformation (« la proximité du littoral ») perd.
function coreLabel(label: string): string {
  return label.replace(/^(les |le |la |l'|un |une |des |du |de la |d')/i, "").trim();
}

// Les nombres VRAIS d'un registre, sous les deux formes qu'une phrase française peut prendre.
// L'invariant que le slice 2 doit tenir n'est pas « aucun nombre absent du repli », c'est « aucun
// nombre FAUX » : « Deux de vos priorités » est exact et bien écrit quand il y en a deux, et le
// rejeter censurerait une tournure naturelle (la sonde l'a produite 2 fois sur 3). Un « Trois
// priorités » inventé, lui, reste rejeté : seul le compte réel est déclaré ici.
const NUMBER_WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
function numberForms(n: number): string[] {
  const word = NUMBER_WORDS[n];
  return word ? [String(n), word] : [String(n)];
}

function reserves(facts: DecisionFact[]): DecisionFact[] {
  return facts.filter((f) => RESERVE_ROLES.has(f.role));
}

// Les `statement` des règles ne finissent pas tous par un point. Le repli est du texte AFFICHÉ : il ne
// peut pas se permettre une phrase qui s'arrête net.
function endWithPeriod(s: string): string {
  return /[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`;
}

// « a, b et c » : une énumération française, pas une liste séparée par des virgules jusqu'au bout.
function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

// LE LEAD PEUT ÊTRE UNE COMPOSITION PORTEUSE DE RÉSERVES (tradeoff, grouped_verification), JAMAIS un
// shared_evidence : les mismatchs sont exclus du lead par doctrine (RESERVE_ROLES), et un mismatch
// COMPOSÉ n'obtient pas un accès que les mismatchs simples n'ont pas. Si un jour les mismatchs doivent
// pouvoir mener la conclusion, la décision se prend ICI, pour tous, jamais par effet de bord d'un
// patron. Le candidat composé porte son TITRE en topic et son SUMMARY en statement.
export type LeadCandidate = {
  factId: string;
  topic: string;
  // Le sujet à NOMMER dans le headline. Un mismatch et une composition de mismatchs portent leur
  // `headlineSubject` (la priorité du lecteur) ; toute autre réserve est nommée par son `topic`,
  // déjà écrit comme un groupe nominal court.
  subject: string;
  statement: string;
  materialityTier: MaterialityTier;
  role: DecisionFact["role"] | "composition";
  absorbedFactIds?: string[];
  // Ce candidat porte une CAUSE COMMUNE, pas une priorité du lecteur (shared_evidence). Il ne peut
  // donc pas entrer dans une énumération de priorités : il a son propre gabarit, et il s'y lit seul.
  causeCommune?: boolean;
};

// LA PRIMITIVE DE TRI, partagée par les deux sélecteurs (headline et strate résiduelle). Elle rend
// les candidats du MEILLEUR tier, dans l'ordre d'entrée : l'ordre des sections EST l'ordre éditorial,
// et retrier à l'intérieur d'un tier transformerait une déclaration en priorité métier. Le tier
// `secondary` ne couronne rien : il n'y a alors rien d'assez matériel pour être cité.
export function rankLeadCandidates(
  shownFacts: DecisionFact[],
  shownCompositions: FactComposition[] = [],
): LeadCandidate[] {
  const candidates: LeadCandidate[] = [
    ...reserves(shownFacts).map((f) => ({
      factId: f.id, topic: f.topic, subject: f.topic, statement: f.statement,
      materialityTier: f.materialityTier, role: f.role,
    })),
    // Le `subject` vient du `headlineSubject`, JAMAIS du `title` : un titre est écrit pour coiffer une
    // carte, donc capitalisé (« … : Des hivers doux, avec … » mettait une majuscule au milieu de la
    // phrase du héros), et un titre de tradeoff annonce les deux côtés du compromis.
    ...shownCompositions.filter((c) => c.kind === "tradeoff" || c.kind === "grouped_verification")
      .map((c) => ({
        factId: c.id, topic: c.title, subject: c.headlineSubject, statement: c.summary,
        materialityTier: c.materialityTier, role: "composition" as const, absorbedFactIds: c.absorbedFactIds,
      })),
  ];
  if (candidates.length === 0) return [];
  const best = Math.min(...candidates.map((f) => TIER_ORDER[f.materialityTier]));
  if (best === TIER_ORDER.secondary) return [];
  return candidates.filter((f) => TIER_ORDER[f.materialityTier] === best);
}

export function selectLead(shownFacts: DecisionFact[], shownCompositions: FactComposition[] = []): LeadSelection {
  return leadFromCandidates(rankLeadCandidates(shownFacts, shownCompositions));
}

// LA STRATE DE POIDS EST RÉSIDUELLE. Le headline a déjà nommé ce qui définit la décision ; cette
// strate dit la PROCHAINE priorité à instruire. Répéter un sujet nommé trois centimètres plus haut
// ferait lire deux fois la même chose, et laisserait croire à deux niveaux de réserve distincts.
//
// La consommation est NARRATIVE : elle retire un sujet d'un résumé voisin, jamais d'un compteur, d'un
// état métier ou d'une carte. Le résiduel n'est jamais exhaustif : il nomme les dominants restants.
export function selectResidualLead(
  shownFacts: DecisionFact[],
  shownCompositions: FactComposition[],
  consumed: { consumedFactIds: string[]; consumedCompositionIds: string[] },
): LeadSelection {
  const out = new Set([...consumed.consumedFactIds, ...consumed.consumedCompositionIds]);
  if (out.size === 0) return selectLead(shownFacts, shownCompositions);
  // On filtre AVANT le rang : le survivant d'un tier inférieur devient légitimement le dominant
  // résiduel quand le tier supérieur est entièrement consommé, ce qui est exactement le cas visé.
  return leadFromCandidates(rankLeadCandidates(
    shownFacts.filter((f) => !out.has(f.id)),
    shownCompositions.filter((c) => !out.has(c.id)),
  ));
}

function leadFromCandidates(top: LeadCandidate[]): LeadSelection {
  if (top.length === 0) return { kind: "none" };
  if (top.length === 1) {
    const f = top[0]!;
    // `statement` reste porté (des consommateurs hors strate peuvent en avoir besoin), mais la strate
    // ne l'écrit plus : elle recopiait mot pour mot la carte affichée trois centimètres plus bas.
    return { kind: "single", factId: f.factId, topic: f.topic, subject: f.subject, statement: f.statement, materialityTier: f.materialityTier };
  }
  // `tied` ne garde que les SUJETS : trois constats entiers recopieraient les trois cartes qui suivent.
  return {
    kind: "tied",
    facts: top.map((f) => ({ factId: f.factId, topic: f.topic, subject: f.subject })),
    materialityTier: top[0]!.materialityTier,
  };
}

type VerdictBuild = { label: string; tone: VerdictTone; headline: VerdictHeadline; detail: string };

const POSTURE = (text: string): VerdictHeadline =>
  ({ kind: "posture", text, consumedFactIds: [], consumedCompositionIds: [], consumedFrom: null });

// LA DOUBLE GATE. Un headline qui nomme doit tenir les DEUX conditions, sinon la branche entière
// retombe en posture : jamais un héros à moitié nommé, jamais une phrase qui déborde sa mesure.
function nameIssues(
  text: string,
  candidates: LeadCandidate[],
  from: "reserves" | "mismatches" | "constraint" | "alignments",
): VerdictHeadline | null {
  if (candidates.length === 0 || candidates.length > HEADLINE_MAX_ISSUES) return null;
  if (text.length > HEADLINE_MAX_CHARS) return null;
  return {
    kind: "named_issues",
    text,
    // Une composition consommée emporte ses faits absorbés : ce sont des FAITS, et ils vont donc dans
    // `consumedFactIds`. Son propre identifiant est le seul à entrer dans `consumedCompositionIds`.
    consumedFactIds: candidates.flatMap((c) =>
      c.role === "composition" ? (c.absorbedFactIds ?? []) : [c.factId]),
    consumedCompositionIds: candidates.filter((c) => c.role === "composition").map((c) => c.factId),
    consumedFrom: from,
  };
}

// LES CANDIDATS DU HEADLINE D'ARBITRAGE. Une composition `shared_evidence` est une CARTE de mismatch
// (displaySection: "mismatches") qui a ABSORBÉ ses faits élémentaires : les chercher seulement dans
// `shownFacts` ferait retomber le héros en posture sur un dossier dont une carte nomme pourtant très
// bien l'enjeu. Elle porte son `headlineSubject` propre : son `title` raconte le patron, trop long
// pour une phrase de héros.
function mismatchCandidates(
  shownFacts: DecisionFact[],
  shownCompositions: FactComposition[],
): LeadCandidate[] {
  return [
    ...shownFacts.filter((f) => f.role === "mismatch").map((f) => ({
      factId: f.id, topic: f.topic, subject: f.role === "mismatch" ? f.headlineSubject : f.topic,
      statement: f.statement, materialityTier: f.materialityTier, role: f.role,
    })),
    ...shownCompositions.filter((c) => c.kind === "shared_evidence").map((c) => ({
      factId: c.id, topic: c.title, subject: c.headlineCause, statement: c.summary,
      materialityTier: c.materialityTier, role: "composition" as const, absorbedFactIds: c.absorbedFactIds,
      causeCommune: true,
    })),
  ];
}

// LES SUJETS FAVORABLES AFFICHÉS (lot C). On ne nomme QUE des faits à l'écran (doctrine de séquencement
// du lot B) : un AlignmentFact absorbé par un tradeoff reste dans `shownFacts` (l'absorption est un masquage
// d'affichage, pas un retrait), donc le verdict continue à pouvoir le nommer. `favorableCount` garde son
// rôle de COMPTE, il ne fournit jamais un sujet.
function alignmentCandidates(shownFacts: DecisionFact[]): LeadCandidate[] {
  return shownFacts.filter((f) => f.role === "alignment").map((f) => ({
    factId: f.id, topic: f.topic, subject: f.role === "alignment" ? f.headlineSubject : f.topic,
    statement: f.statement, materialityTier: f.materialityTier, role: f.role,
  }));
}

// LE HÉROS POSITIF (cas 4). Il nomme jusqu'à 2 sujets favorables STRUCTURANTS affichés — un poids 2
// (secondary) reste visible en carte mais ne couronne jamais le héros. Deux-points quand on nomme TOUT ce
// qu'on compte, « dont » sinon (même règle que l'arbitrage). `favorableCount` donne le COMPTE ; les SUJETS
// viennent des faits affichés, jamais de lui. Null si aucun alignment structurant : la branche appelante
// garde alors sa formulation de repli (posture). Partagé par la branche favorable ET les réserves mineures.
function herosPositif(input: ConclusionPlanInput, nom: string): VerdictHeadline | null {
  const structurants = alignmentCandidates(input.shownFacts).filter((c) => c.materialityTier === "structuring");
  if (structurants.length === 0) return null;
  const nommes = structurants.slice(0, HEADLINE_MAX_ISSUES);
  const compte = input.favorableCount;
  const sujets = joinFr(nommes.map((c) => c.subject));
  // « l'une de vos priorités » et non « votre priorité » : le lecteur peut en avoir déclaré plusieurs,
  // même si une seule est nommable (décision D2 du porteur).
  const phrase = compte === 1
    ? `${nom} répond à l'une de vos priorités : ${sujets}.`
    : nommes.length === compte
      ? `${nom} répond à ${enLettres(compte)} de vos priorités : ${sujets}.`
      : `${nom} répond à ${enLettres(compte)} de vos priorités, dont ${sujets}.`;
  return nameIssues(phrase, nommes, "alignments");
}

// LES NOMBRES SE DISENT EN LETTRES dans ce bloc, jusqu'à dix. Le héros écrivait « Deux priorités » et
// le détail « 2 constats » à deux lignes d'écart : deux registres typographiques dans le même bloc.
// `numberForms` déclare les deux formes, donc la validation accepte l'une comme l'autre.
function enLettres(n: number): string {
  return numberForms(n)[1] ?? String(n);
}

// Ce qui reste à contrôler, dit sans jamais laisser croire que le point nommé par le héros s'ajoute
// au compte. `named` = le headline a déjà nommé un élément de CE pool.
function resteAControler(r: number, named: boolean): string {
  if (r === 0) return "";
  if (named) return r > 1 ? ` Ce point fait partie de ${enLettres(r)} constats à contrôler.` : " C'est le seul constat à contrôler.";
  return r > 1 ? ` ${capitalize(enLettres(r))} constats restent à contrôler.` : " Un constat reste à contrôler.";
}

// `points(n, adj, verb)` vivait ici : il accordait « N points structurants empêchent/demandent ».
// « structurants » est le nom d'un materialityTier, c'est-à-dire une décision interne de matérialité
// que le lecteur ne peut ni expliquer ni opposer : de la tuyauterie affichée en 32 px, au même titre
// que le score que le lot A retire des pastilles. Les branches qui l'appelaient disent maintenant
// « des points qui pèsent », en prose, et accordent elles-mêmes leur nombre.

// LE PROJET D'UN HABITANT N'EST PAS UN PROJET. La posture vivait sur le plan sans être lue : quelqu'un
// qui a coché « j'y habite déjà » lisait « Il est encore trop tôt pour dire que Toulouse correspond à
// votre projet » — il n'a pas de projet, il a un lieu de vie, et la question n'est pas s'il
// correspond mais ce qu'il faut en savoir.
//
// Deux fragments suffisent à couvrir les onze branches : ce que le lecteur a POSÉ, et le verbe qui le
// relie au lieu. Les autres postures (recherche, adresse, quartier) décrivent bien un projet.
// `habitant` est la seule à basculer ; l'écrire comme un défaut d'aiguillage plutôt qu'en dupliquant
// la table évite d'entretenir deux tables de vérité qui divergeront.
// SIX FRAGMENTS, PAS UN SEUL MOT SUBSTITUÉ. Un unique « ce que vous avez demandé » glissé partout où
// se lisait « votre projet » rendait « les critères DE ce que vous avez demandé » et « une condition
// DE ce que vous avez demandé » : la substitution marche sur le sens, jamais sur la syntaxe. Chaque
// tournure a donc son fragment, et chacune se lit bien dans les deux postures.
//
// Le hedge en fait partie : « Toulouse correspond à votre projet, semble-t-il » est plus lourd que
// « Toulouse semble bien correspondre à votre projet ». La nuance se place dans le verbe, pas en
// incise de fin de phrase.
type Vocabulaire = {
  repond: (nom: string) => string;        // « … correspond à votre projet »
  sembleRepondre: (nom: string) => string; // avec le hedge, dans le verbe
  condition: string;                       // ouvre la branche incompatibilité
  criteresExamines: string;                // sujet complet : la relative est DANS le fragment
  autresCriteres: string;                  // « … d'autres critères … »
  elementFavorable: (nom: string) => string;
};
function vocabulaire(posture: ProjectPosture): Vocabulaire {
  return posture === "habitant"
    ? {
        repond: (nom) => `${nom} répond à ce que vous avez demandé`,
        sembleRepondre: (nom) => `${nom} répond bien à ce que vous avez demandé`,
        condition: "Une condition que vous avez posée",
        criteresExamines: "Les critères que vous avez posés, et qui ont pu être examinés,",
        autresCriteres: "d'autres critères que vous avez posés",
        elementFavorable: (nom) => `${nom} présente un élément favorable`,
      }
    : {
        repond: (nom) => `${nom} correspond à votre projet`,
        sembleRepondre: (nom) => `${nom} semble bien correspondre à votre projet`,
        condition: "Une condition de votre projet",
        criteresExamines: "Les critères de votre projet qui ont pu être examinés",
        autresCriteres: "d'autres critères de votre projet",
        elementFavorable: (nom) => `${nom} présente un élément favorable pour votre projet`,
      };
}

// LA TABLE DE VÉRITÉ DU VERDICT (spec 2.1 §5, révisée par le lot « verdict héros »). Déterministe,
// mot pour mot, JAMAIS générée. Chaque branche produit EXPLICITEMENT son couple headline + détail :
// le détail n'est jamais une version tronquée du headline, ce qui serait fragile dès qu'une
// formulation évolue.
//
// « Aucune contrainte n'est contredite » décrivait l'absence d'un problème. Le lecteur, lui, demande
// si ce lieu lui convient. Le déterministe gagne donc le droit de répondre « ce lieu correspond », à
// une condition : pouvoir le PROUVER. La preuve tient en deux mesures (couverture × orientation) et
// un couperet (une contrainte dure non examinée interdit la couverture élevée).
//
// LE SUJET DE LA PHRASE EST LE LIEU, OU LE LECTEUR. JAMAIS LE MOTEUR : « les éléments examinés
// indiquent que… » ferait entendre futur•e commenter son propre travail au lieu de répondre. Seule
// exception, celle où l'objet de la phrase EST notre incapacité (une donnée manque) : là, s'effacer
// serait de la lâcheté, pas de l'élégance.
//
// Et AUCUNE PHRASE NE PROMET UN POSITIF QUI N'EXISTE PAS. L'architecture ne produit aucun fait
// favorable déterministe (cf. coast-rules) : les cas favorables tombent donc en POSTURE, et nommer
// les positifs reste hors périmètre.
function verdictPresentation(input: ConclusionPlanInput): VerdictBuild {
  const nom = input.communeNom;
  const a = aCommune(nom);
  const voc = vocabulaire(input.posture);

  if (input.conclusionState === "project_not_structured") {
    return {
      label: "À préciser", tone: "neutral",
      headline: POSTURE(
        input.posture === "habitant"
          ? `Dites ce qui compte pour vous, et ${nom} se lira à cette aune.`
          : `Décrivez votre projet pour mettre ${nom} en regard de ce qui compte pour vous.`,
      ),
      detail: "",
    };
  }
  if (input.conclusionState === "insufficient_evidence") {
    return {
      label: "Impossible de conclure", tone: "neutral",
      headline: POSTURE(`Des éléments essentiels manquent encore pour trancher ${a}.`),
      // Aucun détail : « Une donnée déterminante manque encore pour conclure sur Toulouse » redisait le
      // héros au singulier. Un bloc qui répète n'ajoute rien, il dilue.
      detail: "",
    };
  }

  // INCOMPATIBILITÉ. Le blocage EST la réponse : le headline nomme la contrainte, le détail porte le
  // constat qui l'établit.
  if (input.orientation === "incompatible") {
    const inc = input.establishedIncompatibility;
    // Libellé vide = rien à nommer : la branche retombe en posture plutôt que d'ouvrir un deux-points
    // sur le vide. Les fixtures de test échappent au typecheck (tsconfig exclut *.test.ts) : cette
    // garde est la seule qui vaille au runtime.
    const label = inc?.constraintLabel?.trim();
    const named = inc && label
      ? nameIssues(`${voc.condition} n'est pas remplie ${a} : ${label}.`, [{
          factId: inc.factId, topic: label, subject: label, statement: inc.statement,
          materialityTier: "decision_critical", role: "incompatibility",
        }], "constraint")
      : null;
    return {
      label: "Condition non respectée", tone: "critical",
      headline: named ?? POSTURE(`${voc.condition} n'est pas remplie ${a}.`),
      detail: inc ? endWithPeriod(inc.statement) : "L'une de vos conditions non négociables n'est pas respectée ici.",
    };
  }

  if (input.coverage === "none") {
    return {
      label: "Lecture non disponible", tone: "neutral",
      // LE SUJET EST LE CRITÈRE DU LECTEUR, et le verbe est « lire ». « Toulouse ne peut pas encore
      // être évalué » posait deux problèmes : un accord instable d'une commune à l'autre, dont le genre
      // n'est pas dérivable, et le mot « évalué », que le positionnement récuse (on lit des données, on
      // n'attribue pas de note à un lieu).
      headline: POSTURE(`Vos critères n'ont pas encore pu être lus ${a}.`),
      detail: "Les données qui permettraient de répondre manquent encore pour cette commune.",
    };
  }

  // ARBITRAGE. Le headline NOMME les priorités moins bien servies (1 ou 2), et le détail cesse alors
  // de les décrire : il porte l'articulation. La branche de posture compte le TOTAL des mismatchs
  // ÉMIS, jamais l'affiché : 5 déclenchés ne doivent pas dire « trois ».
  if (input.orientation === "arbitration") {
    const candidates = mismatchCandidates(input.shownFacts, input.shownCompositions);
    // LE COMPTE VIENT DES MISMATCHS ÉMIS, jamais du nombre de cartes : une composition
    // shared_evidence en absorbe plusieurs sous une seule, et compter les cartes ferait dire
    // « Deux priorités » là où le lecteur en a trois. Un nombre faux, dans le plus grand texte de
    // l'écran, que rien n'irait contredire.
    const m = Math.max(input.mismatchTotal, candidates.length);
    // QUI EST NOMMÉ. Tant que tout tient dans le plafond, on nomme tout : aucune sélection, donc
    // aucun arbitraire. Au-delà, seuls les candidats du MEILLEUR tier sont nommables, et seulement
    // s'ils tiennent eux-mêmes dans le plafond : couronner deux candidats parmi trois de même tier
    // transformerait un ordre de déclaration en priorité métier (doctrine du lead `tied`).
    //
    // Le tier `secondary` n'est PAS exclu ici, à la différence de rankLeadCandidates : un mismatch
    // affiché est matériel par construction (les poids 1 sont silencieux dans les règles), alors
    // qu'une réserve secondaire ne l'est pas.
    // UNE CAUSE COMMUNE NE S'ÉNUMÈRE PAS AVEC DES PRIORITÉS. Une composition `shared_evidence` porte
    // la RAISON qui en dessert plusieurs (« sa petite taille »), pas une priorité de plus : servie
    // dans un « dont », elle se faisait passer pour l'une d'elles, et le lecteur qui avait coché « une
    // grande ville » et « ne pas être isolé » lisait un troisième mot qu'il n'avait jamais écrit.
    //
    // Elle a donc son propre gabarit, et elle s'y lit SEULE. Quand d'autres mismatchs coexistent, on
    // nomme ceux-là et la cause reste à sa carte : mieux vaut nommer moins que nommer faux.
    const cause = candidates.find((c) => c.causeCommune) ?? null;
    const simples = candidates.filter((c) => !c.causeCommune);
    const pool = cause && simples.length === 0 ? [cause] : simples;
    const best = pool.length > 0 ? Math.min(...pool.map((c) => TIER_ORDER[c.materialityTier])) : 0;
    const top = pool.filter((c) => TIER_ORDER[c.materialityTier] === best);
    const nommes = pool.length <= HEADLINE_MAX_ISSUES ? pool
      : top.length <= HEADLINE_MAX_ISSUES ? top
      : [];
    const sujets = joinFr(nommes.map((c) => c.subject));
    const compte = enLettres(m);
    // LE SUJET DE LA PHRASE EST LE LIEU. « Deux priorités correspondent moins bien à Toulouse » fait
    // des priorités du lecteur les sujets qui échouent, et de la commune un décor : c'est l'inverse de
    // ce qui se passe. C'est le lieu qui répond, ou non, à ce que le lecteur demande.
    //
    // Deux-points quand le héros nomme TOUT ce qu'il compte ; « dont » quand il n'en nomme qu'une
    // partie. « dont » ne suppose aucun ordre entre les sujets nommés. Et « pour la même raison »
    // quand une cause unique explique tout le compte : la phrase dit alors ce que la composition
    // affirme, une raison et plusieurs conséquences.
    const parCause = nommes.length === 1 && nommes[0]!.causeCommune === true && m > 1;
    const phrase = parCause
      ? `${nom} répond moins bien à ${compte} de vos priorités, pour la même raison : ${sujets}.`
      : m === 1
        ? `${nom} répond moins bien à une de vos priorités : ${sujets}.`
        : nommes.length === m
          ? `${nom} répond moins bien à ${compte} de vos priorités : ${sujets}.`
          : `${nom} répond moins bien à ${compte} de vos priorités, dont ${sujets}.`;
    const named = nameIssues(phrase, nommes, "mismatches");

    // Le pool des réserves est DISTINCT de celui des mismatchs : le point nommé par le héros n'en
    // fait pas partie, d'où « par ailleurs », et jamais « ce point fait partie de ».
    const suite = input.reservesShown > 0
      ? ` ${input.reservesShown > 1 ? `${capitalize(enLettres(input.reservesShown))} constats restent` : "Un constat reste"} par ailleurs à contrôler.`
      : "";
    // UN ARBITRAGE A DEUX CÔTÉS. N'en nommer qu'un décrit un renoncement : le lecteur ne voit jamais
    // ce que le lieu offre en échange. Le côté favorable est nommé quand il est PROUVÉ (hasFavorable
    // et favorableCount, les mêmes garanties que coverage=high), et seulement là.
    //
    // « vos AUTRES priorités » : sans « autres », le lecteur peut croire que le favorable et l'écart
    // portent sur les mêmes critères, et l'arbitrage devient illisible. « à peser contre ce que vous y
    // gagnez » nomme les deux côtés, ce que « appelle un arbitrage » annonçait sans le faire. Le « y »
    // évite à la fois une seconde occurrence du nom de commune et un accord de genre indérivable.
    const ecart = m > 1 ? "Ces écarts sont" : "Cet écart est";
    // LE CÔTÉ FAVORABLE EST NOMMÉ (lot C), depuis les faits AFFICHÉS, jamais depuis `favorableCount` : « L'accès
    // aux soins et la vie locale répondent en revanche à votre projet. » Avant, un compteur disait
    // « plusieurs de vos autres priorités » sans dire lesquelles. Repli sur l'ancien registre quand aucun
    // alignment n'est affiché (le compte peut être >0 sur un satisfied de poids 1, silencieux).
    const favSujets = alignmentCandidates(input.shownFacts).slice(0, HEADLINE_MAX_ISSUES).map((c) => c.subject);
    const arbitrage = favSujets.length > 0
      ? `${capitalize(joinFr(favSujets))} ${favSujets.length > 1 ? "répondent" : "répond"} en revanche à votre projet. La décision se joue entre ces correspondances et les écarts relevés.`
      : input.hasFavorable
        ? `${nom} répond bien à ${input.favorableCount >= 2 ? "plusieurs de vos autres priorités" : "une autre de vos priorités"}. ${ecart} à peser contre ce que vous y gagnez.`
      // « Aucune de vos conditions n'est contredite ici » rassure sur un risque INEXISTANT quand le
      // lecteur n'a posé aucune condition non négociable : c'est décrire l'absence d'un problème qu'il
      // n'a jamais soulevé. L'état `no_hard_constraint_declared` le dit déjà, sans champ nouveau.
      : input.conclusionState === "no_hard_constraint_declared"
        ? `${ecart} à peser avant de vous décider.`
        : `Aucune de vos conditions n'est contredite ici. ${ecart} à peser avant de vous décider.`;
    // QUAND LE HÉROS RENONCE À NOMMER, LE DÉTAIL NOMME. La gate protège la mesure du héros ; elle n'a
    // pas le droit de faire disparaître du dossier l'information qu'on possède. En 17 px, trois sujets
    // tiennent sans faire paragraphe. Le gabarit est SANS ACCORD à dériver (« ces priorités … servies »
    // porte le féminin pluriel quels que soient les sujets listés), et la liste tombe en fin de phrase.
    // Même règle dans le détail : on liste des PRIORITÉS, jamais une cause au milieu d'elles.
    const tousLesSujets = joinFr(simples.map((c) => c.subject));
    return {
      label: "Arbitrage", tone: "neutral",
      // « Un arbitrage réel à X, sans incompatibilité établie. » : une phrase sans verbe, qui commente
      // le statut du calcul et décrit l'absence d'un problème par une double négation. La posture dit
      // maintenant le compte qu'elle connaît déjà, dans la même famille sonore que la version nommée.
      headline: named ?? POSTURE(
        m === 1
          ? `${nom} répond moins bien à une de vos priorités.`
          : `${nom} répond moins bien à ${compte} de vos priorités.`,
      ),
      // En posture, NOMMER PASSE AVANT le côté favorable : trois phrases feraient reparaître le
      // paragraphe que la refonte supprime, et l'information qui manque au lecteur est la liste.
      detail: named
        ? `${arbitrage}${suite}`
        : tousLesSujets
          ? `Ces priorités sont moins bien servies ici qu'ailleurs : ${tousLesSujets}. ${ecart} à peser avant de vous décider.${suite}`
          : `${arbitrage}${suite}`,
    };
  }

  // NEUTRAL : examiné, données disponibles, mais aucun signal marqué. Rien à nommer.
  if (input.orientation === "neutral") {
    return {
      label: "Correspondance sans signal marqué", tone: "neutral",
      // « ne se distingue nettement ni favorablement ni défavorablement » est du langage de
      // distribution : trois adverbes en -ment et une double négation corrélative, pour l'information
      // la MOINS dense du produit affichée dans le plus grand corps de l'écran. L'information est
      // réelle (rien ici ne tranche), elle se dit du point de vue de la décision.
      // « Rien, dans ce que vous avez demandé » serait trop absolu quand la couverture est partielle :
      // la restriction passe en tête et qualifie tout ce qui suit, comme dans la branche favorable.
      headline: POSTURE(`Dans ce qui a pu être examiné, rien ne penche nettement pour ou contre ${nom}.`),
      // « dimensions » est le mot de la matrice interne (les 27 dimensions du Pack) : le lecteur a des
      // priorités. Et pas de « toutes » : `neutral` ne garantit pas une couverture élevée.
      detail: "Vos priorités ont pu être examinées ici. Aucun écart marqué n'apparaît, aucun avantage net non plus.",
    };
  }

  // FAVORABLE. CAS 4 (lot C) : le héros NOMME le positif, quand des faits d'alignement STRUCTURANTS sont
  // affichés. Avant le lot C, cette branche restait en posture faute de fait favorable déterministe —
  // l'AlignmentFact en fournit un. Un poids 2 (secondary) reste visible dans la carte « Ce qui correspond »
  // mais NE couronne PAS le héros (le cas 4 exige un tier structurant, sans quoi le héros couronnerait un
  // signal faible). `favorableCount` reste le COMPTE ; les SUJETS viennent des faits affichés, jamais de lui.
  if (input.orientation === "favorable") {
    const named = herosPositif(input, nom);
    if (named) {
      return { label: "Correspondance favorable", tone: "positive", headline: named, detail: `${voc.criteresExamines} vont dans ce sens.` };
    }
    return input.coverage === "high"
      ? {
          label: "Bonne correspondance", tone: "positive",
          headline: POSTURE(`${voc.sembleRepondre(nom)}.`),
          detail: `${voc.criteresExamines} vont dans ce sens.`,
        }
      : {
          label: "Signaux favorables", tone: "neutral",
          // La restriction passe EN TÊTE : elle qualifie tout ce qui suit, et la phrase se termine sur
          // le lecteur au lieu de finir sur « les critères déjà couverts », vocabulaire de couverture
          // qui recevait l'accent de fin de phrase.
          headline: POSTURE(`Sur ce qui a pu être examiné, ${nom} va dans le sens de ce que vous avez demandé.`),
          detail: `La lecture reste incomplète : ${voc.autresCriteres} n'ont pas encore pu être examinés.`,
        };
  }

  // CAS 4 EN RÉSERVES MINEURES (décision porteur). L'orientation `minor_reserves` garantit que seules des
  // réserves SECONDAIRES subsistent (aucune structurante/critique — sinon ce serait `major_reserves`). Quand
  // des alignments STRUCTURANTS sont affichés, le POSITIF prime dans le héros : le secondaire ne reprend
  // jamais le héros, il descend au détail (« N constats restent néanmoins à contrôler »).
  if (input.orientation === "minor_reserves") {
    const named = herosPositif(input, nom);
    if (named) {
      const r = input.reservesShown;
      const engage = input.posture === "habitant" ? "à surveiller" : "à contrôler avant de vous engager";
      const detail = r > 1
        ? `${capitalize(enLettres(r))} constats restent néanmoins ${engage}.`
        : r === 1
          ? `Un constat reste néanmoins ${engage}.`
          : `${voc.criteresExamines} vont dans ce sens.`;
      return { label: "Correspondance favorable", tone: "positive", headline: named, detail };
    }
  }

  // RÉSERVES. Le headline nomme la réserve DOMINANTE quand une seule domine ; à égalité, il n'y a
  // rien à couronner, et la strate de poids fait son travail plus bas.
  const dominants = rankLeadCandidates(input.shownFacts, input.shownCompositions);
  const dominant = dominants.length === 1 ? dominants[0]! : null;
  // QUAND LE DOSSIER PENCHE FAVORABLEMENT, LE HÉROS DIT LA CORRESPONDANCE, PAS LA VIGILANCE. Nommer
  // « le principal point à contrôler » sur un dossier à réserves mineures dont un côté favorable est
  // PROUVÉ reléguerait au détail le cœur de la décision (ce lieu correspond) et noircirait le dossier
  // par le seul effet de la mise en forme. La réserve redescend alors dans la strate de poids, à sa
  // place. Le héros ne nomme une réserve que lorsque la réserve EST le message.
  const penchFavorable = input.orientation === "minor_reserves" && input.hasFavorable;
  const namedReserve = dominant && !penchFavorable
    ? nameIssues(`Le principal point à contrôler ${a} : ${dominant.subject}.`, [dominant], "reserves")
    : null;
  const nommee = namedReserve != null;

  const n = input.majorReserveCount;
  const r = input.reservesShown;
  const plusieurs = input.favorableCount >= 2;

  if (input.coverage === "high") {
    if (input.orientation === "minor_reserves") {
      return {
        label: input.hasFavorable ? "Correspondance favorable" : "Correspondance à confirmer",
        tone: input.hasFavorable ? "positive" : "neutral",
        // « sous réserve » est un mot d'acte notarié, et il PRÉ-ANNONÇAIT le détail qui dit exactement
        // cela deux lignes plus bas. Trois niveaux (héros, détail, strate) disaient une seule chose.
        headline: namedReserve ?? POSTURE(
          input.hasFavorable
            ? `${voc.sembleRepondre(nom)}.`
            : `Ce que ${nom} vaut sur ce que vous avez demandé reste à confirmer.`,
        ),
        // Le détail ne REDIT PAS le héros : en posture, le héros porte déjà la correspondance, et le
        // détail n'a plus qu'à dire ce qui reste, avec le but du contrôle (« avant de conclure »).
        detail: nommee
          ? `${input.hasFavorable ? `${voc.sembleRepondre(nom)}.` : `Rien ne permet encore de dire que ${voc.repond(nom)}.`}${resteAControler(r, true)}`
          : r > 1
            ? `${capitalize(enLettres(r))} constats restent à contrôler avant de conclure.`
            : r === 1
              ? "Un constat reste à contrôler avant de conclure."
              : `${voc.criteresExamines} vont dans ce sens.`,
      };
    }
    // Le détail recopiait le héros mot pour mot (« 2 points structurants empêchent … de conclure
    // nettement »), à un adverbe près : l'invariant « le détail n'est jamais une version tronquée du
    // héros » n'était nulle part violé aussi littéralement. Deux autres fautes tombent avec :
    // « structurants » (un nom de tier, cf. enLettres/points plus haut) et « empêchent de conclure »,
    // qui met l'incapacité du côté de futur•e alors que la couverture est ÉLEVÉE : les données sont
    // là, c'est la situation qui est mitigée. L'effacement n'est légitime que quand l'objet de la
    // phrase EST notre incapacité.
    return {
      label: "Correspondance à nuancer", tone: "caution",
      // « conclure à Toulouse » se lit comme « tirer une conclusion sur place » : la conclusion porte
      // SUR la commune, elle ne s'y tient pas.
      headline: namedReserve ?? POSTURE(
        n > 1
          ? `${capitalize(enLettres(n))} points restent à contrôler avant de conclure sur ${nom}.`
          : `Un point reste à contrôler avant de conclure sur ${nom}.`,
      ),
      // « Ces contrôles portent sur des points qui pèsent » reste le moteur qui décrit son propre
      // travail. La phrase dit maintenant ce que le lecteur en fait : ils pèsent dans SA décision.
      // « rien ne permet de dire » garde l'honnêteté épistémique sans faire de futur•e le sujet.
      //
      // Le sujet de la 2e phrase est NOMMÉ (« Ces points / Ce point ») et non un pronom : « Ils »
      // tombait juste après une clause favorable (« un élément favorable »), donc se lisait comme un
      // désaccord de nombre et un antécédent flottant. « Ces points » renvoie sans équivoque aux points
      // à contrôler que le héros vient de compter, et l'accord suit toujours le nombre de réserves (n).
      detail: !input.hasFavorable
        ? `Tant que ${n > 1 ? "ces points ne sont pas levés" : "ce point n'est pas levé"}, rien ne permet de dire que ${voc.repond(nom)}.`
        : `${plusieurs ? `${nom} répond bien à plusieurs de vos priorités.` : `${voc.elementFavorable(nom)}.`} ${n > 1 ? "Ces points peuvent encore peser" : "Ce point peut encore peser"} dans votre décision.`,
    };
  }

  // coverage === "partial"
  if (input.orientation === "minor_reserves") {
    return {
      label: "Correspondance à confirmer", tone: "neutral",
      headline: namedReserve ?? POSTURE(`La lecture ${deCommune(nom)} reste incomplète pour trancher.`),
      // Idem : le héros porte déjà l'incomplétude quand il est en posture.
      detail: nommee
        ? `La lecture ${deCommune(nom)} reste incomplète.${resteAControler(r, true)}`
        : input.hasFavorable
          ? `Sur ce qui a pu être examiné, ${nom} va plutôt dans le sens de ce que vous avez demandé.${resteAControler(r, false)}`
          : `${capitalize(voc.autresCriteres)} n'ont pas encore pu être examinés.${resteAControler(r, false)}`,
    };
  }
  return {
    label: "Lecture encore partielle", tone: "caution",
    headline: namedReserve ?? POSTURE(`Il est encore trop tôt pour dire que ${voc.repond(nom)}.`),
    // « 2 points structurants demandent attention » : sans déterminant, la phrase n'est pas française,
    // et « structurants » est le nom d'un materialityTier, soit la tuyauterie que le lot A retire
    // partout ailleurs. Le compte se dit en lettres, comme dans le reste du bloc.
    detail: n >= 1
      ? `La lecture reste incomplète, et ${n > 1 ? `${enLettres(n)} points demandent` : "un point demande"} votre attention.`
      : "La lecture reste incomplète.",
  };
}

export function buildConclusionPlan(input: ConclusionPlanInput): ConclusionNarrativePlan {
  const v = verdictPresentation(input);

  // LE VERDICT N'EST JAMAIS GÉNÉRÉ. C'est la phrase qui peut renverser une décision perçue : un modèle
  // qui reformulerait « la lecture reste incomplète » en « ce lieu vous correspond » mentirait sur ce
  // qui a été établi, et aucune validation structurelle ne le verrait passer. Il le reçoit en lecture
  // seule, pour que les registres suivants s'y articulent. Le déterministe, lui, a le droit de dire la
  // correspondance : il la PROUVE (couverture × orientation). Le bloc porte le DÉTAIL ; le headline
  // vit à part sur le plan, il n'est pas un registre confié au modèle.
  const blocks: NarrativeBlock[] = [{
    key: "verdict",
    fallbackText: v.detail,
    sourceIds: input.establishedIncompatibility ? [input.establishedIncompatibility.factId] : [],
    requiredPhrases: [],
    allowedNumbers: [],
    maxChars: 320,
    generable: false,
  }];

  // Un projet non structuré n'est pas une analyse, c'est une invite. Aucun autre registre.
  if (input.conclusionState === "project_not_structured") {
    return {
      scope: input.scope, communeNom: input.communeNom, conclusionState: input.conclusionState,
      posture: input.posture, blocks, reservesCount: 0, lead: { kind: "none" }, verdict: v,
      verdictLabel: v.label, verdictTone: v.tone,
    };
  }

  if (input.uncovered.length > 0) {
    // LA CONTRAINTE EST LE SUJET DE LA PHRASE. « Nous n'avons pas encore examiné : la proximité d'un
    // lieu » fait parler futur•e d'elle-même, et nomme une catégorie là où le lecteur a écrit « la gare
    // Matabiau ». Le libellé est instancié depuis SON projet (hardConstraintLabel), et la tournure
    // « reste à vérifier » évite l'accord de participe qu'un passif imposerait sur des libellés de
    // genre inconnu (« le département » / « la proximité »).
    const labels = input.uncovered.map((u) => u.label);
    const verbe = labels.length > 1 ? "restent" : "reste";
    blocks.push({
      key: "unexamined_hard_constraints",
      fallbackText: `${capitalize(joinFr(labels))} ${verbe} à vérifier à ce niveau de détail.`,
      sourceIds: input.uncovered.map((u) => u.key),
      // Chaque contrainte doit SURVIVRE à la rédaction : « une condition importante reste à examiner »
      // ferait disparaître la gare, sans qu'aucune autre validation ne s'en aperçoive.
      requiredPhrases: input.uncovered.map((u) => coreLabel(u.label)),
      allowedNumbers: numberForms(input.uncovered.length),
      maxChars: 260,
      generable: true,
    });
  }

  // LE DÉCOMPTE DES RÉSERVES A CHANGÉ DE FONCTION : il est devenu l'intertitre des cartes qui suivent
  // (« Les 4 points à examiner avant de décider »). Ce registre ne garde donc que ce que le décompte ne
  // dit pas : le POIDS RELATIF. En `lead.none`, il n'aurait plus rien à dire, et il n'existe pas.
  //
  // `tied` ne veut PAS dire « toutes les réserves pèsent pareil » : il dit que plusieurs faits partagent
  // le rang MAXIMAL. Écrire « quatre points d'un poids comparable » quand deux dominent et deux sont
  // secondaires serait faux. On compte lead.factIds, jamais rs.length.
  const rs = reserves(input.shownFacts);
  const lead = selectResidualLead(input.shownFacts, input.shownCompositions, v.headline);
  // Le héros a-t-il déjà couronné un point de CE pool ? Alors cette strate est la SUITE d'une
  // hiérarchie ouverte, et n'en ouvre pas une seconde : « deux pèsent le plus » juste après « le
  // principal point à contrôler » ferait lire deux classements concurrents.
  const suiteDuHeros = v.headline.consumedFrom === "reserves";

  // LES COMPOSITIONS NOMMÉES. Une composition désignée lead single est déjà narrée : la re-narrer ici
  // la dirait deux fois (le défaut exact que la composition existe pour éviter). Placement : une
  // composition est ÉTABLIE (elle limite moins le verdict qu'une contrainte non vérifiée, elle pèse
  // plus qu'une réserve à vérifier), d'où sa place entre les deux.
  const leadCompId = lead.kind === "single" ? lead.factId : null;
  const narratedComps = input.shownCompositions.filter((c) => c.id !== leadCompId);
  if (narratedComps.length > 0) {
    blocks.push({
      key: "compositions_found",
      fallbackText: narratedComps.map((c) => endWithPeriod(c.summary)).join(" "),
      sourceIds: narratedComps.flatMap((c) => [c.id, ...c.absorbedFactIds]),
      requiredPhrases: [],
      // Les nombres du fallback sont autorisés par construction (conclusion-validate) ; on n'autorise
      // en plus que le compte des compositions.
      allowedNumbers: numberForms(narratedComps.length),
      maxChars: 340,
      generable: true,
    });
  }

  // UN SEUL MOULE, DEUX VARIANTES D'ORDRE (lot D). Quatre moules coexistaient ici, dont deux qui
  // faisaient le travail de quelqu'un d'autre :
  //
  //   « Parmi ces quatre points, deux pèsent le plus : … » demandait au lecteur de tenir deux comptes
  //   en tête pour lui dire quoi regarder d'abord, et le compte est DÉJÀ dit deux fois autour (le
  //   détail du verdict, et l'intertitre des cartes). Trois occurrences du même nombre dans un écran
  //   d'une minute.
  //
  //   « Un point pèse plus que les autres. {statement} » recopiait la carte située juste dessous, ce
  //   que le commentaire de selectResidualLead interdit explicitement pour les sujets.
  //
  // Reste une phrase de NAVIGATION, qui ne recompte rien et ne recouronne rien. « ensuite » quand le
  // héros a déjà nommé le principal constat de ce registre ; « d'abord » quand il n'en a nommé aucun
  // (héros de posture, ou héros qui a puisé dans les mismatchs ou la contrainte dure).
  const sujetsDeLaStrate =
    lead.kind === "single" ? [lead.subject]
    : lead.kind === "tied" ? lead.facts.map((f) => f.subject)
    : [];
  if (sujetsDeLaStrate.length > 0) {
    blocks.push({
      key: "reserves_found",
      fallbackText: `${suiteDuHeros ? "À regarder ensuite" : "À regarder d'abord"} : ${joinFr(sujetsDeLaStrate)}.`,
      sourceIds: lead.kind === "single" ? [lead.factId] : lead.kind === "tied" ? lead.facts.map((f) => f.factId) : [],
      // Chaque sujet doit SURVIVRE : c'est le seul endroit du dossier où le lecteur apprend, en une
      // phrase, CE QUI pèse. Un « plusieurs risques naturels » qui les avalerait ramènerait le bloc à
      // son défaut d'origine (parler de lui-même), et aucune autre validation ne le verrait.
      //
      // L'exigence vaut maintenant AUSSI pour un sujet seul. Elle était impossible tant que `single`
      // portait le `statement` entier : l'exiger mot pour mot réclamait une COPIE, qu'aucun rédacteur
      // n'écrit et que la sonde a rejetée 3 fois sur 3. Sur un groupe nominal court, elle est tenable.
      requiredPhrases: sujetsDeLaStrate.map(coreLabel),
      // AUCUN NOMBRE. Les deux moules n'en portent pas : en autoriser un ouvrirait la porte à un
      // compte inventé par le modèle, que rien n'irait contredire.
      allowedNumbers: [],
      // 340 était la mesure d'un registre. C'est une phrase : trois sujets longs et le préfixe font
      // ~150, et un plafond bas empêche le modèle d'y ajouter du commentaire.
      maxChars: 220,
      generable: true,
    });
  }

  // LES MISMATCHS NE SONT PLUS UN REGISTRE. Leur matière (les priorités moins bien servies) est
  // nommée par le HEADLINE du verdict, en tête du bloc. Un registre construit, généré, validé et
  // stocké, mais rendu nulle part, coûtait un appel au modèle pour un texte que personne ne lisait.

  if (input.uncoveredPriorities.length > 0) {
    const top = input.uncoveredPriorities.slice(0, 3);
    blocks.push({
      key: "uncovered_priorities",
      fallbackText: `Vos priorités concernant ${top.map((p) => p.label).join(", ")} ne sont pas encore couvertes dans cette synthèse.`,
      sourceIds: top.map((p) => p.key),
      requiredPhrases: top.map((p) => coreLabel(p.label)),
      allowedNumbers: numberForms(top.length),
      maxChars: 260,
      generable: true,
    });
  }

  return {
    scope: input.scope,
    communeNom: input.communeNom,
    conclusionState: input.conclusionState,
    posture: input.posture,
    blocks,
    reservesCount: rs.length,
    lead,
    verdict: v,
    verdictLabel: v.label,
    verdictTone: v.tone,
  };
}

// LA RÈGLE : on appelle l'IA seulement quand plusieurs éléments DÉJÀ HIÉRARCHISÉS doivent être
// ARTICULÉS. Jamais pour maquiller un dossier pauvre : reformuler brillamment « verdict + vos priorités
// ne sont pas couvertes » ne ferait que rendre élégante une absence de couverture.
//
// Deux repêchages vivaient ici (reservesCount >= 3, et « une réserve domine ») : ils existaient parce
// que le registre des réserves portait alors le DÉCOMPTE, donc de la matière même sans autre registre.
// Le décompte est parti dans l'intertitre des cartes ; ces repêchages désignaient un bloc qui n'existe
// plus dans ces cas. Un seul registre rédigeable n'articule rien : le déterministe le dit très bien.
export function shouldGenerateNarrative(plan: ConclusionNarrativePlan): boolean {
  if (plan.conclusionState === "project_not_structured") return false;
  return plan.blocks.filter((b) => b.generable).length >= 2;
}
