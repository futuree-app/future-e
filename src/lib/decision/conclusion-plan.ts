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
export type LeadSelection =
  | { kind: "single"; factId: string; topic: string; statement: string; materialityTier: MaterialityTier }
  | { kind: "tied"; facts: { factId: string; topic: string }[]; materialityTier: MaterialityTier }
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
  consumedFrom: "reserves" | "mismatches" | "constraint" | null;
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
// nominal à deux sujets (94 aussi). À 110, la mesure de 540 px tient trois lignes courtes en Serif,
// ce qui reste un signal.
export const HEADLINE_MAX_ISSUES = 2;
export const HEADLINE_MAX_CHARS = 110;

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
    // `single` garde le constat : UN fait cité seul peut être dit en entier sans noyer la conclusion,
    // et le lecteur mérite de savoir ce qui pèse, pas seulement de quoi ça parle.
    return { kind: "single", factId: f.factId, topic: f.topic, statement: f.statement, materialityTier: f.materialityTier };
  }
  // `tied` ne garde que les SUJETS : trois constats entiers recopieraient les trois cartes qui suivent.
  return {
    kind: "tied",
    facts: top.map((f) => ({ factId: f.factId, topic: f.topic })),
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
  from: "reserves" | "mismatches" | "constraint",
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
      factId: c.id, topic: c.title, subject: c.headlineSubject, statement: c.summary,
      materialityTier: c.materialityTier, role: "composition" as const, absorbedFactIds: c.absorbedFactIds,
    })),
  ];
}

// Ce qui reste à contrôler, dit sans jamais laisser croire que le point nommé par le héros s'ajoute
// au compte. `named` = le headline a déjà nommé un élément de CE pool.
function resteAControler(r: number, named: boolean): string {
  if (r === 0) return "";
  if (named) return r > 1 ? ` Ce point fait partie de ${r} constats à contrôler.` : " C'est le seul constat à contrôler.";
  return r > 1 ? ` ${r} constats restent à contrôler.` : " Un constat reste à contrôler.";
}

// L'ACCORD EN NOMBRE est calculé, jamais laissé à une formule générique : « 1 points structurants »
// détruit en un caractère la confiance que tout le reste essaie de construire.
function points(n: number, adj: string, verb: string): string {
  return n > 1 ? `${n} points ${adj}s ${verb}nt` : `${n} point ${adj} ${verb}`;
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

  if (input.conclusionState === "project_not_structured") {
    return {
      label: "À préciser", tone: "neutral",
      headline: POSTURE(`Décrivez votre projet pour mettre ${nom} en regard de ce qui compte pour vous.`),
      detail: "",
    };
  }
  if (input.conclusionState === "insufficient_evidence") {
    return {
      label: "Impossible de conclure", tone: "neutral",
      headline: POSTURE(`Des éléments essentiels manquent encore pour trancher ${a}.`),
      detail: `Une donnée déterminante manque encore pour conclure sur ${nom}.`,
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
      ? nameIssues(`Une condition de votre projet n'est pas remplie ${a} : ${label}.`, [{
          factId: inc.factId, topic: label, subject: label, statement: inc.statement,
          materialityTier: "decision_critical", role: "incompatibility",
        }], "constraint")
      : null;
    return {
      label: "Condition non respectée", tone: "critical",
      headline: named ?? POSTURE(`Une condition de votre projet n'est pas remplie ${a}.`),
      detail: inc ? endWithPeriod(inc.statement) : "L'une de vos conditions non négociables n'est pas respectée ici.",
    };
  }

  if (input.coverage === "none") {
    return {
      label: "Lecture non disponible", tone: "neutral",
      // « ne peut pas encore » et non « n'a pas encore pu » : le présent parle de l'état du dossier,
      // le passé composé raconterait un échec du moteur.
      headline: POSTURE(`${nom} ne peut pas encore être évalué au regard de vos critères.`),
      detail: "Les critères de votre projet n'ont pas encore de lecture disponible sur cette commune.",
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
    const best = Math.min(...candidates.map((c) => TIER_ORDER[c.materialityTier]));
    const top = candidates.filter((c) => TIER_ORDER[c.materialityTier] === best);
    const nommes = candidates.length <= HEADLINE_MAX_ISSUES ? candidates
      : top.length <= HEADLINE_MAX_ISSUES ? top
      : [];
    const sujets = joinFr(nommes.map((c) => c.subject));
    const compte = numberForms(m)[1] ?? String(m);
    // LE SUJET DE LA PHRASE EST LE LIEU. « Deux priorités correspondent moins bien à Toulouse » fait
    // des priorités du lecteur les sujets qui échouent, et de la commune un décor : c'est l'inverse de
    // ce qui se passe. C'est le lieu qui répond, ou non, à ce que le lecteur demande.
    //
    // Deux-points quand le héros nomme TOUT ce qu'il compte ; « dont » quand il n'en nomme qu'une
    // partie. « dont » ne suppose aucun ordre entre les sujets nommés.
    const phrase = m === 1
      ? `${nom} répond moins bien à une de vos priorités : ${sujets}.`
      : nommes.length === m
        ? `${nom} répond moins bien à ${compte} de vos priorités : ${sujets}.`
        : `${nom} répond moins bien à ${compte} de vos priorités, dont ${sujets}.`;
    const named = nameIssues(phrase, nommes, "mismatches");

    // Le pool des réserves est DISTINCT de celui des mismatchs : le point nommé par le héros n'en
    // fait pas partie, d'où « par ailleurs », et jamais « ce point fait partie de ».
    const suite = input.reservesShown > 0
      ? ` ${input.reservesShown > 1 ? `${input.reservesShown} constats restent` : "Un constat reste"} par ailleurs à contrôler.`
      : "";
    const ecarts = m > 1 ? "Ces écarts appellent un arbitrage" : "Cet écart appelle un arbitrage";
    // UN ARBITRAGE A DEUX CÔTÉS. N'en nommer qu'un décrit un renoncement : le lecteur ne voit jamais
    // ce que le lieu offre en échange. Le côté favorable est nommé quand il est PROUVÉ (hasFavorable
    // et favorableCount, les mêmes garanties que coverage=high), et seulement là.
    const ouverture = input.hasFavorable
      ? (input.favorableCount >= 2
          ? `${nom} répond à plusieurs dimensions de votre projet, et aucune incompatibilité n'a été établie`
          : `${nom} présente un élément favorable pour votre projet, et aucune incompatibilité n'a été établie`)
      : `Aucune incompatibilité n'a été établie ${a}`;
    return {
      label: "Arbitrage", tone: "neutral",
      headline: named ?? POSTURE(`Un arbitrage réel ${a}, sans incompatibilité établie.`),
      detail: named
        ? `${ouverture}. ${ecarts} entre vos priorités, sans rendre ${nom} incompatible avec votre projet.${suite}`
        : `${ouverture}, mais ${m > 1 ? `${m} de vos priorités sont` : "une de vos priorités est"} nettement moins bien servie${m > 1 ? "s" : ""} qu'ailleurs. Cela appelle un arbitrage entre vos priorités, sans rendre ${nom} incompatible avec votre projet.${suite}`,
    };
  }

  // NEUTRAL : examiné, données disponibles, mais aucun signal marqué. Rien à nommer.
  if (input.orientation === "neutral") {
    return {
      label: "Correspondance sans signal marqué", tone: "neutral",
      headline: POSTURE(`${nom} ne se distingue nettement ni favorablement ni défavorablement.`),
      detail: "Vos priorités ont pu être examinées sur ces dimensions. Aucun écart notable n'apparaît, ni avantage net.",
    };
  }

  // FAVORABLE : posture, toujours. Nommer un positif exigerait un fait favorable déterministe, que
  // l'architecture ne produit pas.
  if (input.orientation === "favorable") {
    return input.coverage === "high"
      ? {
          label: "Bonne correspondance", tone: "positive",
          headline: POSTURE(`${nom} semble bien correspondre à votre projet.`),
          detail: "Les critères de votre projet qui ont pu être examinés vont dans ce sens.",
        }
      : {
          label: "Signaux favorables", tone: "neutral",
          headline: POSTURE(`${nom} va dans le sens de votre projet sur les critères déjà couverts.`),
          detail: "La lecture reste incomplète : d'autres critères de votre projet n'ont pas encore pu être examinés.",
        };
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
        headline: namedReserve ?? POSTURE(
          input.hasFavorable
            ? `${nom} semble bien correspondre à votre projet, sous réserve.`
            : `La correspondance ${deCommune(nom)} avec votre projet reste à confirmer.`,
        ),
        // Le détail ne REDIT PAS le héros : en posture, le héros porte déjà « semble bien
        // correspondre » ou « reste à confirmer », et le détail n'a plus qu'à dire ce qui reste.
        detail: nommee
          ? `${input.hasFavorable ? `${nom} semble bien correspondre à votre projet.` : `La correspondance ${deCommune(nom)} avec votre projet reste à confirmer.`}${resteAControler(r, true)}`
          : resteAControler(r, false).trim() || "Les critères de votre projet qui ont pu être examinés vont dans ce sens.",
      };
    }
    return {
      label: "Correspondance à nuancer", tone: "caution",
      headline: namedReserve ?? POSTURE(`${capitalize(points(n, "structurant", "empêche"))} de conclure nettement ${a}.`),
      detail: !input.hasFavorable
        ? `${capitalize(points(n, "structurant", "empêche"))} encore de considérer ${nom} comme une bonne correspondance avec votre projet.`
        : plusieurs
          ? `${nom} répond à plusieurs dimensions de votre projet, mais ${points(n, "structurant", "empêche")} encore de conclure nettement.`
          : `${nom} présente des éléments favorables pour votre projet, mais ${points(n, "structurant", "empêche")} encore de conclure nettement.`,
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
          ? `${nom} va plutôt dans le sens de votre projet sur les critères déjà couverts.${resteAControler(r, false)}`
          : `D'autres critères de votre projet n'ont pas encore pu être examinés.${resteAControler(r, false)}`,
    };
  }
  return {
    label: "Lecture encore partielle", tone: "caution",
    headline: namedReserve ?? POSTURE(`Il est encore trop tôt pour dire que ${nom} correspond à votre projet.`),
    // « 2 points structurants demandent attention » : sans déterminant, la phrase n'est pas française,
    // et « structurants » est le nom d'un materialityTier, soit la tuyauterie que le lot A retire
    // partout ailleurs. Le compte se dit en lettres, comme dans le reste du bloc.
    detail: n >= 1
      ? `La lecture reste incomplète, et ${n > 1 ? `${numberForms(n)[1] ?? String(n)} points demandent` : "un point demande"} votre attention.`
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

  if (lead.kind === "single") {
    blocks.push({
      key: "reserves_found",
      // Deux phrases, pas un deux-points : le constat est déjà une phrase, avec sa majuscule. « Un point
      // pèse plus que les autres : Le logement porte… » mettrait une capitale au milieu d'une phrase.
      fallbackText: suiteDuHeros
        ? `À regarder ensuite : ${lead.topic}.`
        : `Un point pèse plus que les autres. ${endWithPeriod(lead.statement)}`,
      sourceIds: [lead.factId],
      // Aucune matière obligatoire : exiger le `statement` mot pour mot exigerait une COPIE, ce
      // qu'aucun rédacteur n'écrit, et la sonde l'a rejeté 3 fois sur 3. La garantie tient sans :
      // le modèle ne reçoit QUE le lead, il lui est structurellement impossible d'en couronner un autre.
      requiredPhrases: [],
      allowedNumbers: [],
      maxChars: 300,
      generable: true,
    });
  } else if (lead.kind === "tied") {
    const n = lead.facts.length;
    // ON LISTE, ON NE COMMENTE PAS LA HIÉRARCHIE. « 3 points pèsent autant, aucun ne domine » est de la
    // TUYAUTERIE : le `lead` existe pour empêcher le moteur de couronner un fait au hasard, c'est notre
    // problème, pas celui du lecteur. Lui demande quoi regarder ; « aucun ne prend le dessus » est une
    // absence d'information formulée comme une information. L'égalité se DIT en listant, point.
    // (En `single`, la phrase garde du sens : elle dit par où COMMENCER.)
    //
    // QUAND LE VERDICT ANNONCE PLUS DE POINTS QUE LA TÊTE N'EN COMPTE (« 4 points restent à vérifier »
    // puis « 3 points demandent votre attention »), le lecteur lit une contradiction : les 3 sont un
    // sous-ensemble des 4, mais rien ne le disait. La phrase porte alors la relation, avec les deux
    // comptes VRAIS déclarés. À comptes égaux, il n'y a pas de relation à porter : phrase courte.
    const total = input.reservesShown;
    const sujets = joinFr(lead.facts.map((f) => f.topic));
    blocks.push({
      key: "reserves_found",
      fallbackText: suiteDuHeros
        ? `À regarder ensuite : ${sujets}.`
        : total > n
          ? `Parmi ces ${numberForms(total)[1] ?? String(total)} points, ${numberForms(n)[1] ?? String(n)} pèsent le plus : ${sujets}.`
          : `${capitalize(numberForms(n)[1] ?? String(n))} points demandent votre attention : ${sujets}.`,
      sourceIds: lead.facts.map((f) => f.factId),
      // Chaque sujet doit SURVIVRE : c'est le seul endroit du dossier où le lecteur apprend, en une
      // phrase, CE QUI pèse. Un « plusieurs risques naturels » qui les avalerait ramènerait la carte à
      // son défaut d'origine (parler d'elle-même), et aucune autre validation ne le verrait.
      requiredPhrases: lead.facts.map((f) => coreLabel(f.topic)),
      // En mode suite, la phrase ne porte AUCUN nombre : en autoriser un ouvrirait la porte à un
      // compte inventé par le modèle, que rien n'irait contredire.
      allowedNumbers: suiteDuHeros ? [] : total > n ? [...numberForms(n), ...numberForms(total)] : numberForms(n),
      maxChars: 340,
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
