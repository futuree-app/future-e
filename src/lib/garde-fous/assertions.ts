// LES CONTRÔLES D'ASSERTION PARTAGÉS (FUT-37). Module PUR : aucune I/O, aucun appel IA.
//
// Ils vivaient dans src/lib/territoire/synthesis-checks.ts, qui contrôle la synthèse du dossier. Quatre
// de ses règles ne dépendent d'aucun fait du dossier (`when: always`) : elles disent ce qu'AUCUNE donnée
// de futur•e ne permet d'affirmer. Elles sont déplacées ici, verbatim, pour que l'accueil et /qna passent
// les mêmes que le dossier au lieu d'en recopier une version qui divergerait.
//
//   REGLES_UNIVERSELLES   : partagées par le dossier, l'accueil et /qna.
//   REGLES_RECITS_PUBLICS : propres aux récits publics (accueil, /qna). Le dossier ne les applique pas
//                           encore : les ajouter à sa synthèse changerait ce qu'elle accepte, ce qui
//                           relève d'un autre ticket.
//
// UNE ASSERTION, PAS UN MOT : chaque règle dit sa POLARITÉ. `affirmative` = une négation dans la
// proposition l'annule (« futur•e ne mesure pas l'enneigement » reste permis) ; `any` = la tournure est
// refusée même niée. Le moteur (négation, découpage en phrases) est celui du dossier, déplacé ici.

export type Violation = { rule: string; excerpt: string };

export type RegleAssertion = {
  id: string;
  patterns: RegExp[];
  polarity: "affirmative" | "any";
  /** Une phrase qui porte cette précision échappe à la règle. */
  unless?: RegExp;
};

// ── Moteur (déplacé de synthesis-checks.ts) ─────────────────────────────────────────────────

// Négation au sens large : les tournures de CONTRASTE (« ce qui la distingue d'un territoire
// entièrement bâti », « loin d'être très dense ») écartent l'assertion au lieu de l'affirmer.
// Vu en réel le 28/09 : la première formule faisait refuser une phrase juste, au prix d'un second appel.
const NEGATION = /(\bn'|\bne\b|\baucune?\b|\bpas\b|\bjamais\b|\bni\b|\bsans\b|\bnon\b|\brien\b|\bdistingu\w*|\bloin d'|\bplutôt que\b|\bcontrairement\b|\bà la différence\b|\bmoins\b)/;
const CLAUSE_BREAK = /[,;:()]/g;

/** La proposition qui contient la correspondance est-elle niée ? (début de proposition → fin de phrase) */
export function isNegated(sentence: string, index: number): boolean {
  let start = 0;
  CLAUSE_BREAK.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CLAUSE_BREAK.exec(sentence)) && m.index < index) start = m.index + 1;
  const breakAfter = sentence.slice(index).search(/[,;:()]/);
  const end = breakAfter === -1 ? sentence.length : index + breakAfter;
  return NEGATION.test(sentence.slice(start, end));
}

export function normalizeText(t: string): string {
  return t
    .toLowerCase()
    .replace(/[’ʼ]/g, "'")
    .replace(/[  ]/g, " ");
}

export function sentencesOf(text: string): string[] {
  // Les INTITULÉS de bloc (« ## Ce qu'on sous-estime ici ») sont imposés par le format : ils ne sont
  // pas des assertions du texte, et une règle ne doit jamais les refuser.
  return normalizeText(text)
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n")
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Les violations d'un texte pour une liste de règles. */
export function checkRegles(text: string, regles: readonly RegleAssertion[]): Violation[] {
  const out: Violation[] = [];
  const sentences = sentencesOf(text);
  for (const rule of regles) {
    for (const s of sentences) {
      if (rule.unless?.test(s)) continue;
      for (const re of rule.patterns) {
        const m = re.exec(s);
        if (!m) continue;
        if (rule.polarity === "affirmative" && isNegated(s, m.index)) continue;
        out.push({ rule: rule.id, excerpt: s });
        break;
      }
    }
  }
  return out;
}

// ── Règles universelles (déplacées de synthesis-checks.ts, verbatim) ────────────────────────

// Eau : aucune conclusion sur la ressource (décision du 30/09).
// Sols secs, CatNat et restrictions en vigueur ne prouvent pas une tension future sur la ressource
// ou l'accès à l'eau (chantier Explore2 / Eau 2050). On juxtapose les faits, on ne fabrique pas la
// conclusion. « Des restrictions d'eau sont en vigueur » reste permis : c'est un fait.
export const REGLE_TENSION_EAU: RegleAssertion = {
  id: "interdit:tension-eau",
  polarity: "affirmative",
  patterns: [
    /\b(tension|pression|stress)s? (sur|de|autour de) (l'|la )?(eau|ressource)/,
    /\bressource en eau (sous tension|menacée|fragilisée|sous pression)/,
    /\b(raréfaction|rareté|manque|pénurie) (de l'|d')eau\b/,
    /\bl'eau (devient|deviendra|devenir|se fait) (plus )?(rare|précieuse)/,
    /\baccès à l'eau\b/,
  ],
};

// Raccords implicites non autorisés par le contrat de faits (décision du 30/09).
// « Ces deux réalités décrivent une tension », « ces deux lectures pointent dans une direction
// commune » : un raccord n'est permis qu'entre faits mesurant la même grandeur. Seule exception
// outillée ici : le réchauffement OBSERVÉ et les températures PROJETÉES.
export const REGLE_RACCORD: RegleAssertion = {
  id: "raccord:non-autorise",
  polarity: "any",
  patterns: [
    /\bces deux (réalités|lectures|signaux|phénomènes|indicateurs|faits|dynamiques)\b[^.]*(direction commune|même (direction|mouvement|sens)|tension|pression|pointent|convergent)/,
    // Vu en réel à Nantes : sols secs et pluies intenses « décrivent ensemble un régime hydrique ».
    /\b(décrivent|dessinent|forment|composent|racontent) ensemble\b/,
    /(direction commune|même direction|même mouvement)[^.]*\b(sécheresse|sols secs|restrictions|catastrophes? naturelles?)/,
    /\b(sécheresse|sols secs|restrictions|catastrophes? naturelles?)[^.]*(direction commune|même direction|même mouvement)/,
  ],
  unless: /réchauffement|températures?|°c/,
};

export const REGLE_MARCHE_LOGEMENT: RegleAssertion = {
  id: "interdit:marche-logement",
  polarity: "affirmative",
  patterns: [
    /\btension (sur |du |de )?(le |l'|la )?(logement|marché|parc)/,
    /\bmarché (immobilier |du logement )?tendu/,
    /\bpeu de (biens|logements) disponibles/,
    /\bperte d'attractivité/,
  ],
};

export const REGLE_CLASSEMENT_NATIONAL: RegleAssertion = {
  id: "interdit:classement-national",
  polarity: "any",
  patterns: [
    /\bparmi les (communes|villes|territoires) (les )?(plus|moins)/,
    /\bl'une? des (communes|villes|territoires) (les )?(plus|moins)/,
    /\b(record|première|premier|dernière|dernier) de france/,
  ],
};

export const REGLES_UNIVERSELLES: readonly RegleAssertion[] = [
  REGLE_TENSION_EAU,
  REGLE_RACCORD,
  REGLE_MARCHE_LOGEMENT,
  REGLE_CLASSEMENT_NATIONAL,
];

// ── Règles des récits publics (FUT-37) ──────────────────────────────────────────────────────
// Chacune répond à un récit RÉELLEMENT produit par l'accueil avant FUT-37 (audit du 02/10/2026). Elles
// visent une ASSERTION (polarité), pas un vocabulaire : « futur•e ne prédit pas les prix » passe,
// « les prix vont baisser » non.

export const REGLES_RECITS_PUBLICS: readonly RegleAssertion[] = [
  // Immobilier et assurance : aucune donnée de prix ni d'assurabilité n'est lue par l'accueil.
  // Avant : « les biens … pourraient perdre significativement de leur valeur », « quasi invendables »,
  // « difficiles à assurer ou à revendre », « le coût de l'assurance grimpe ».
  {
    id: "interdit:prediction-immobiliere",
    polarity: "affirmative",
    patterns: [
      /\b(perdr\w*|perte) (\w+ ){0,2}(de )?(leur |sa |de la )?valeur/,
      /\bprix\b[^.]{0,40}\b(baiss\w*|chut\w*|recul\w*|stagn\w*|diminu\w*|s'effondr\w*|pèse\w*|peser)/,
      /\b(baiss\w*|chute|recul|effondrement) (des|du) prix\b/,
      /\b(peser|pèsent|pèsera\w*|vont peser) sur (les|le) (prix|valeur)/,
      /\b(primes?|coûts?|cotisations?|tarifs?) (de l'|d')?assurances?\b[^.]{0,30}\b(grimp\w*|augment\w*|flamb\w*|progress\w*|hausse)/,
    ],
  },
  // Les mêmes, sans échappatoire par la négation : « quasi invendables SANS travaux » porte un « sans » qui
  // n'annule rien. Aucune donnée de l'accueil ne permet d'écrire ces mots, même niés.
  {
    id: "interdit:prediction-immobiliere",
    polarity: "any",
    patterns: [
      /\bdécotes?\b/,
      /\b(quasi[- ])?invendables?\b/,
      /\b(in|non[- ])assurables?\b/,
      /\bassurabilité\b/,
      /\bdifficiles? à (assurer|revendre|vendre)/,
    ],
  },
  // Jours ≠ durée : un nombre de jours dans l'année ne dit ni la durée ni la continuité d'une période.
  // Avant : « les chaleurs extrêmes pourraient durer plusieurs semaines par an », « une grande partie
  // de l'été ».
  {
    id: "interdit:duree-continue",
    polarity: "affirmative",
    patterns: [
      /\bplusieurs semaines\b/,
      /\b(durer|durent|durera\w*|durerait\w*)\b/,
      /\b(une grande partie|la majeure partie|l'essentiel|tout) de l'été/,
      /\b(des|plusieurs) mois (entiers|de suite|d'affilée)/,
    ],
  },
  // Température d'hiver ≠ neige : futur•e ne mesure ni l'enneigement ni l'économie des stations.
  // Polarité `any` : « moins fiable » porte le mot « moins », que le moteur lit comme une négation. On vise
  // donc la PRÉDICTION (un verbe d'évolution après « enneigement »), pas la simple mention : « futur•e ne
  // mesure pas l'enneigement » reste permis.
  {
    id: "interdit:neige-sans-donnee",
    polarity: "any",
    patterns: [
      /\benneigement\b[^.]*\b(pourrai\w*|va|vont|devien\w*|deviendr\w*|sera\w*|rédui\w*|réduir\w*|diminu\w*|recul\w*|fiable|plus rare)\b/,
      /\bmanteau neigeux\b/,
      /\bneiges?\b[^.]*\b(fiable|rare|pourrai\w*|va|vont|devien\w*|deviendr\w*|dispar\w*|se fera\w*|manque\w*|recul\w*)\b/,
      /\b(hivers?|saisons?) sans neige\b/,
      // Pas de \b devant « é » : sans le drapeau u, une lettre accentuée n'est pas un caractère de mot.
      /(^|[\s'])économie (montagnarde|des stations|de la montagne)\b/,
      /\bstations? (de ski )?(fragilisée|menacée|ferm\w*|condamnée)s?/,
    ],
  },
  // IFM ≠ occurrence d'incendie. Avant : « le risque d'incendie pourrait fortement progresser ».
  {
    id: "interdit:occurrence-feu",
    polarity: "affirmative",
    patterns: [
      /\brisque d'incendie\b[^.]{0,30}\b(progress\w*|augment\w*|s'accro\w*|s'intensifi\w*|grandi\w*|explos\w*)/,
      /\b(les |le )?feux? (vont|va|pourraient|pourrait|risquent de|risque d') ?(atteindre|toucher|frapper|menacer)/,
      /\bincendies? (plus fréquents?|plus nombreux|se multipli\w*)/,
    ],
  },
  // Intensité de pluie ≠ crue ni inondation. Avant : « les pluies extrêmes pourraient accentuer les
  // risques de crue », « le risque d'inondation pourrait s'intensifier avec des pluies plus violentes ».
  {
    id: "interdit:crue-depuis-pluie",
    polarity: "affirmative",
    patterns: [
      /\bpluies?[^.]*\b(accentu\w*|aggrav\w*|augment\w*|renforc\w*|provoqu\w*|entraîn\w*|multipli\w*)\b[^.]*\b(crues?|inondations?|débordements?)/,
      /\b(crues?|inondations?)\b[^.]*\b(s'intensifi\w*|plus fréquent\w*|plus nombreu\w*)\b[^.]*\bpluies?/,
    ],
  },
  // Un risque recensé est un fait ACTUEL : il ne devient pas une emprise ni une fréquence futures.
  // Avant : « la submersion marine pourrait s'étendre à de nouvelles zones », « des quartiers
  // pourraient être régulièrement submergés », « toucher des zones aujourd'hui épargnées ».
  {
    id: "interdit:projection-risque-recense",
    polarity: "affirmative",
    patterns: [
      /\b(s'étendr\w*|s'étend) (à|vers) (de )?nouv\w* (zones?|quartiers?|secteurs?)/,
      /\bnouvelles zones\b/,
      // La FRÉQUENCE future d'un aléa recensé : aucune donnée de l'accueil ne la projette.
      /\b(crues?|inondations?|submersions?)\b[^.]*\b(pourraient|pourrait|vont|va|deviendr\w*) (devenir |être )?plus (fréquent|nombreu)/,
      /\bzones? (aujourd'hui|actuellement) épargnées?/,
      /\brégulièrement (submergé|inondé)\w*/,
      /\bquartiers?\b[^.]*\b(submerg\w*|inond\w*)/,
      /\bmontée des eaux\b[^.]*\b(aggrav\w*|accentu\w*|augment\w*)/,
    ],
  },
  // Grain : une donnée communale ne parle pas d'un logement ni d'une adresse.
  {
    id: "grain:logement-depuis-commune",
    polarity: "affirmative",
    patterns: [
      /\b(votre|ce|ton) (logement|maison|bien|immeuble|appartement)\b[^.]*\b(sera|serait|seront|est|va|pourrait|risque)\b[^.]*\b(exposé|inondé|submergé|touché|fissur\w*|menacé|concerné)/,
      /\bautour de (ce|votre) logement\b/,
      /(^|\s)à votre adresse\b[^.]*\b(exposé|inond\w*|submerg\w*|risque)/,
    ],
  },
  // L'eau du robinet, les nappes et les rivières ne se déduisent d'aucun indicateur de l'accueil.
  {
    id: "interdit:ressource-eau-affirmee",
    polarity: "affirmative",
    patterns: [
      /\b(nappes?|rivières?|eau potable|eau du robinet)\b[^.]*\s(baiss\w*|diminu\w*|manqu\w*|se tari\w*|plus rares?|menacée?s?|tendue?s?|sous tension|à sec)\b/,
      /\bpénuries?\b/,
    ],
  },
];

export function checkRecitPublic(text: string): Violation[] {
  return checkRegles(text, [...REGLES_UNIVERSELLES, ...REGLES_RECITS_PUBLICS]);
}
