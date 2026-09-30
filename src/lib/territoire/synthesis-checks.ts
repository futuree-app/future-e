// ════════════════════════════════════════════════════════════════════════════════════════════
// LES CONTRÔLES DÉTERMINISTES DE LA SYNTHÈSE TERRITOIRE (FUT-6, D8, conventions validées le 27/09).
//
// Deux familles, et aucun appel IA :
//   1. ASSERTIONS : une affirmation incompatible avec une catégorie déterministe de la projection
//      (couvert, densité, démographie, saisonnalité, risques recensés), ou interdite faute de fait
//      dédié (attractivité, marché, imperméabilisation, classement national, « rural », « station
//      balnéaire »).
//   2. NOMBRES : tout nombre écrit en chiffres doit venir de la projection, tel quel ou après une
//      transformation admise.
//
// UNE ASSERTION, PAS UN MOT. « Aucun périmètre de submersion n'est recensé » est permis quand la
// submersion n'est pas recensée ; « le territoire est exposé à la submersion » ne l'est pas. Chaque
// règle dit donc sa POLARITÉ : `affirmative` (une négation dans la proposition l'annule) ou `any`
// (la règle vise justement une formulation négative, ou une notion interdite quelle que soit la
// tournure).
//
// Limite V1, assumée : les nombres écrits en LETTRES (« quatorze ») ne sont pas contrôlés.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type Violation = { rule: string; excerpt: string };

type Projection = Record<string, unknown>;

type Rule = {
  id: string;
  /** La règle ne s'applique que si la projection porte le fait qui la fonde. */
  when: (p: Projection) => boolean;
  patterns: RegExp[];
  polarity: "affirmative" | "any";
  /** Une phrase qui porte cette précision échappe à la règle. */
  unless?: RegExp;
};

// ── Lecture de la projection ─────────────────────────────────────────────────────────────────

function at(p: Projection, path: string): unknown {
  let cur: unknown = p;
  for (const k of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

const catIs = (path: string, ...labels: string[]) => (p: Projection) => labels.includes(String(at(p, path)));
const riskIs = (which: "inondation" | "submersion_marine", v: "recensé" | "non recensé") => (p: Projection) =>
  at(p, `risques_recenses_echelle_communale.${which}`) === v;
const always = () => true;

// Libellés des catégories, tels que le registre les produit (src/lib/territoire/facts.ts).
const LAND = "occupation_des_sols.categorie";
const DENSITY = "commune.densite.categorie";
const DEMO = "demographie.categorie";
const SEASON = "residences_secondaires.categorie";

// Accords : e?s? couvre masculin/féminin/pluriel.
const A = "e?s?";

const RULES: Rule[] = [
  // ── Couvert (D4) ──
  {
    id: "couvert:territoire-tres-bati",
    when: catIs(LAND, "Occupation mixte", "Forte présence naturelle", "À dominante agricole"),
    polarity: "affirmative",
    patterns: [
      new RegExp(`\\b(presque|quasi(ment)?|entièrement|totalement|essentiellement|largement) (bâti${A}|urbanisé${A}|construit${A}|minéral${A}|minérale${A})\\b`),
      new RegExp(`\\btrès (urbanisé${A}|bâti${A}|minéral${A}|minérale${A}|construit${A})\\b`),
      new RegExp(`\\bmajoritairement (bâti${A}|urbanisé${A})\\b`),
      /\b(l'essentiel|la majeure partie|la majorité) (du territoire|de la commune) (est |reste )?(bâti|urbanisé|construit|couvert)/,
      /\b(très|si|trop) peu d(e |')(espaces? (verts?|naturels?|ouverts?)|végétation|verdure|nature|couvert végétal)/,
      /\b(presque|quasi(ment)?) (pas|plus|aucun) d?(e |')?(nature|verdure|végétation|espaces? verts?|terre)/,
      /\ble bâti (domine|l'emporte|prédomine)/,
      new RegExp(`\\bdensément (bâti${A}|construit${A})`),
    ],
  },
  {
    id: "couvert:territoire-tres-naturel",
    when: catIs(LAND, "Majoritairement urbanisé", "Faible présence d'espaces naturels"),
    polarity: "affirmative",
    patterns: [
      /\bforte présence (naturelle|d'espaces naturels)/,
      new RegExp(`\\b(largement|majoritairement|très) (naturel${A}|naturelle${A}|verte${A}|boisé${A})\\b`),
      /\ble naturel (domine|l'emporte)/,
    ],
  },
  // ── Densité (D3) ──
  {
    id: "densite:requalifiee-dense",
    when: catIs(DENSITY, "Densité intermédiaire", "Commune peu dense"),
    polarity: "affirmative",
    patterns: [
      /\btrès denses?\b/,
      new RegExp(`\\bdensément (bâti${A}|peuplé${A}|construit${A})`),
      /\b(commune|ville|territoire|agglomération)s? (très )?denses?\b/,
    ],
  },
  {
    id: "densite:requalifiee-peu-dense",
    when: catIs(DENSITY, "Densité intermédiaire", "Commune dense"),
    polarity: "affirmative",
    patterns: [new RegExp(`\\b(peu|faiblement) (denses?|peuplé${A})\\b`)],
  },
  // ── Démographie (D7) ──
  {
    id: "demographie:declin-contredit",
    when: catIs(DEMO, "Croissance récente", "Population stable"),
    polarity: "affirmative",
    patterns: [
      /\bperd (des|de ses) habitants/,
      /\b(en )?déclin démographique/,
      /\bse dépeuple/,
      /\b(sa |la )?population (diminue|baisse|recule|décline)/,
    ],
  },
  {
    id: "demographie:croissance-contredite",
    when: catIs(DEMO, "Population en recul", "Population stable"),
    polarity: "affirmative",
    patterns: [
      /\bgagne (des|de nouveaux) habitants/,
      /\b(sa |la )?population (augmente|croît|progresse|grandit)/,
      /\bcroissance démographique/,
    ],
  },
  // ── Saisonnalité ──
  {
    id: "saisonnalite:surestimee",
    when: catIs(SEASON, "Faible", "Modérée"),
    polarity: "affirmative",
    patterns: [
      /\btrès touristiques?\b/,
      /\b(forte|très marquée|importante) saisonnalité/,
      /\b(fréquentation touristique|tourisme) (massi(f|ve)|très (important|forte?))/,
    ],
  },
  {
    id: "saisonnalite:sous-estimee",
    when: catIs(SEASON, "Forte", "Marquée"),
    polarity: "any",
    patterns: [/\bpeu touristiques?\b/, /\b(peu|pas) marquée? par le tourisme/],
  },
  // ── Risques recensés : l'ASSERTION et sa polarité ──
  {
    id: "inondation:exposition-non-recensee",
    when: riskIs("inondation", "non recensé"),
    polarity: "affirmative",
    patterns: [
      /\b(zones?|territoires?|communes?|secteurs?|quartiers?) inondables?\b/,
      new RegExp(`\\bexposé${A} aux (crues|inondations)`),
      /\brisque d'inondation (est )?(classé|recensé|identifié|avéré)/,
      /\bune partie (du territoire|de la commune) (est |peut être )?(concernée|touchée|atteinte) par (les |une |des )?(crues?|inondations?)/,
    ],
  },
  {
    id: "inondation:exposition-niee",
    when: riskIs("inondation", "recensé"),
    polarity: "any",
    patterns: [
      /\b(aucun|pas de|sans) (risque|périmètre|zone) (d'inondation|inondable|de crue)/,
      new RegExp(`\\bépargné${A} par les (crues|inondations)`),
    ],
  },
  {
    id: "submersion:exposition-non-recensee",
    when: riskIs("submersion_marine", "non recensé"),
    polarity: "affirmative",
    patterns: [
      new RegExp(`\\b(exposé${A}|soumis${A}|soumise${A}|menacé${A}|vulnérables?) à la submersion`),
      /\brisque de submersion( marine)? (est )?(classé|recensé|identifié|avéré)/,
      /\bsubmersion marine (menace|touche|concerne|guette)/,
      /\bla mer (peut|pourrait) (envahir|submerger|atteindre)/,
    ],
  },
  {
    id: "submersion:exposition-niee",
    when: riskIs("submersion_marine", "recensé"),
    polarity: "any",
    patterns: [
      /\b(aucun|pas de|sans) (risque|périmètre) de submersion/,
      new RegExp(`\\bépargné${A} par la (mer|submersion)`),
    ],
  },
  // ── Temporalité des arrivants récents (correction du 28/09) ──
  {
    id: "demographie:periode-arrivants",
    when: (p) => at(p, "demographie.arrivants_recents") != null,
    polarity: "any",
    patterns: [
      /(arrivants?|arrivés?|nouveaux habitants|installés?|vivaient ailleurs|habitaient ailleurs)[^.]*(entre 2015 et 2021|2015-2021|2015 et 2021|depuis 2015|sur la période|en six ans|ces dernières années|au fil des années)/,
      /(entre 2015 et 2021|2015-2021|depuis 2015|sur la période)[^.]*(arrivants?|arrivés?|nouveaux habitants|vivaient ailleurs|habitaient ailleurs)/,
    ],
    // Une phrase qui DIT l'année de référence des arrivants est juste, même si elle cite aussi la
    // période de l'évolution : « progressé de 0,62 % par an entre 2015 et 2021, et 9,8 % des habitants
    // vivaient ailleurs un an plus tôt » (vue en réel le 28/09, refusée à tort).
    unless: /\bun an (plus tôt|avant|auparavant)|l'année (précédente|d'avant|précédant)/,
  },
  // ── CatNat « sécheresse » ≠ jours de sols secs projetés (correction du 28/09) ──
  // La reconnaissance CatNat « sécheresse des sols » vise surtout des dommages liés aux argiles ; les
  // jours de sols secs sont un indicateur climatique DRIAS. Les présenter comme un même phénomène qui
  // se prolonge est un raccord que les données n'établissent pas.
  {
    id: "catnat:secheresse-prolongee",
    when: always,
    polarity: "any",
    patterns: [
      /sécheresse[^.]*(catastrophes? naturelles?|arrêtés?|reconnue?s?|reconnaissances?)[^.]*(sols secs|projet|horizon|2030|2050|2100|futur|s'intensifi|s'accentu|prolong|annonc|amplifi|à venir|devrai)/,
      /(sols secs|projet|horizon|2030|2050|2100)[^.]*sécheresse[^.]*(catastrophes? naturelles?|arrêtés?|reconnue?s?|reconnaissances?)/,
      /(catastrophes? naturelles?|arrêtés?|reconnue?s?|reconnaissances?)[^.]*sécheresse[^.]*(sols secs|s'intensifi|s'accentu|prolong|annonc|amplifi|à venir|devrai)/,
      /sécheresse[^.]*(sols secs|futur|projet|horizon|2030|2050|2100|s'intensifi|s'accentu|à venir)[^.]*(catastrophes? naturelles?|arrêtés?|reconnue?s?|reconnaissances?)/,
      // L'anaphore : « Cette sécheresse des sols […] catastrophe naturelle », juste après une phrase sur
      // les jours de sols secs projetés (vu en réel le 28/09).
      /\bcette sécheresse[^.]*(catastrophes? naturelles?|arrêtés?|reconnue?s?|reconnaissances?)/,
    ],
  },
  // ── Eau : aucune conclusion sur la ressource (décision du 30/09) ──
  // Sols secs, CatNat et restrictions en vigueur ne prouvent pas une tension future sur la ressource
  // ou l'accès à l'eau (chantier Explore2 / Eau 2050). On juxtapose les faits, on ne fabrique pas la
  // conclusion. « Des restrictions d'eau sont en vigueur » reste permis : c'est un fait.
  {
    id: "interdit:tension-eau",
    when: always,
    polarity: "affirmative",
    patterns: [
      /\b(tension|pression|stress)s? (sur|de|autour de) (l'|la )?(eau|ressource)/,
      /\bressource en eau (sous tension|menacée|fragilisée|sous pression)/,
      /\b(raréfaction|rareté|manque|pénurie) (de l'|d')eau\b/,
      /\bl'eau (devient|deviendra|devenir|se fait) (plus )?(rare|précieuse)/,
      /\baccès à l'eau\b/,
    ],
  },
  // ── Raccords implicites non autorisés par le contrat de faits (décision du 30/09) ──
  // « Ces deux réalités décrivent une tension », « ces deux lectures pointent dans une direction
  // commune » : un raccord n'est permis qu'entre faits mesurant la même grandeur. Seule exception
  // outillée ici : le réchauffement OBSERVÉ et les températures PROJETÉES.
  {
    id: "raccord:non-autorise",
    when: always,
    polarity: "any",
    patterns: [
      /\bces deux (réalités|lectures|signaux|phénomènes|indicateurs|faits|dynamiques)\b[^.]*(direction commune|même (direction|mouvement|sens)|tension|pression|pointent|convergent)/,
      // Vu en réel à Nantes : sols secs et pluies intenses « décrivent ensemble un régime hydrique ».
      /\b(décrivent|dessinent|forment|composent|racontent) ensemble\b/,
      /(direction commune|même direction|même mouvement)[^.]*\b(sécheresse|sols secs|restrictions|catastrophes? naturelles?)/,
      /\b(sécheresse|sols secs|restrictions|catastrophes? naturelles?)[^.]*(direction commune|même direction|même mouvement)/,
    ],
    unless: /réchauffement|températures?|°c/,
  },
  // ── Psychologie collective (interdite par la consigne ; contrôlée sur les tournures vues en réel) ──
  {
    id: "interdit:psychologie-collective",
    when: always,
    polarity: "any",
    patterns: [
      /\brarement (pensée?s?|le premier|la première|lue?s?|pris en compte|mise? en avant|évoquée?s?)/,
      /\b(on|les habitants|la ville|les élus) (oublie|oublient|sous-estime|sous-estiment|ignore|ignorent|croit|croient|pense|pensent)\b/,
      // Vu en réel à Nantes : « que les résidents de villes compactes comptent sur leur environnement ».
      /\b(on|les (habitants|résidents|gens|ménages|familles)[^.,]{0,40}) (compte|comptent|attend|attendent|recherche|recherchent|espère|espèrent) (sur|de|que)?/,
      // Vu en réel à Nantes et Aurillac : « ce fait attire moins l'attention », « de façon moins remarquée ».
      /\b(attire|attirent|retient|retiennent) (moins |plus |peu |davantage )?l'attention\b/,
      // « moins visible dans la lecture d'ensemble » parle des données, pas des gens : il reste libre.
      /\bmoins (remarqué|perçu)e?s?\b/,
    ],
  },
  // ── Hiérarchie OBJECTIVE (liberté éditoriale préservée, décision du 30/09) ──
  // « ressort parmi les évolutions les plus visibles », « un fil conducteur » restent permis : ce sont
  // des choix de lecture. Refusé : le superlatif qui prétend à une importance calculée.
  {
    id: "hierarchie:objective",
    when: always,
    polarity: "affirmative",
    patterns: [
      /\b(le|la) (fait|phénomène|changement|évolution|enjeu|signal|transformation|dynamique) (le |la )?plus (structurant|structurante|important|importante|déterminant|déterminante|décisi\w*|concret|concrète|marquant|marquante|significatif|significative)/,
      /\b(l'enjeu|le phénomène|le fait|le signal) (principal|dominant|majeur)\b/,
      /\bce qui pèse le plus\b/,
    ],
  },
  // ── Comparaison sans donnée comparative (benchmark absent) ──
  {
    id: "benchmark:absent",
    when: always,
    polarity: "any",
    patterns: [
      /\bpour une (commune|ville|agglomération) (de cette|de sa|aussi|si) (densité|taille|dense|grande|petite)/,
      // Vu en réel à Aurillac : « pour une ville de l'intérieur à cette altitude ».
      /\bpour une (commune|ville|agglomération) (de l'intérieur|littorale|de montagne|du littoral|à cette altitude|de ce type)/,
      /\bcompte tenu de (sa|la|cette) (densité|taille|population)/,
      /\b(supérieure?s?|inférieure?s?|plus|moins) (à ce|qu'on) (qu'on )?(attendrait|pourrait attendre)/,
      /\b(négligeable|remarquable|considérable|exceptionnel\w*) pour (une|un)\b/,
    ],
  },
  // ── Interdits faute de fait dédié ──
  {
    id: "interdit:attractivite",
    when: always,
    polarity: "affirmative",
    patterns: [
      /\battir(e|ent|ait|aient|er|ant)\b/,
      new RegExp(`\\battiré${A}\\b`),
      /\battracti(f|fs|ve|ves|vité)\b/,
      new RegExp(`\\brecherché${A}\\b`),
      new RegExp(`\\bprisé${A}\\b`),
      new RegExp(`\\bconvoité${A}\\b`),
    ],
  },
  {
    id: "interdit:marche-logement",
    when: always,
    polarity: "affirmative",
    patterns: [
      /\btension (sur |du |de )?(le |l'|la )?(logement|marché|parc)/,
      /\bmarché (immobilier |du logement )?tendu/,
      /\bpeu de (biens|logements) disponibles/,
      /\bperte d'attractivité/,
    ],
  },
  {
    id: "interdit:impermeabilisation",
    when: always,
    polarity: "any",
    patterns: [
      /\bimperméabilis/,
      /\babsorb(e|ent|er|ant)\b[^.]{0,25}\bmal\b/,
      /\bpeu absorbants?\b/,
      /\b(peine|peinent) à absorber/,
      /\bbéton et (le |du )?bitume/,
      /\bruissel/,
      /\bs'infiltr(e|ent|er) mal/,
    ],
  },
  {
    id: "interdit:classement-national",
    when: always,
    polarity: "any",
    patterns: [
      /\bparmi les (communes|villes|territoires) (les )?(plus|moins)/,
      /\bl'une? des (communes|villes|territoires) (les )?(plus|moins)/,
      /\b(record|première|premier|dernière|dernier) de france/,
    ],
  },
  {
    id: "interdit:rural",
    when: always,
    polarity: "affirmative",
    patterns: [/\brur(al|ale|aux|ales)\b/],
  },
  {
    id: "interdit:station-balneaire",
    when: always,
    polarity: "any",
    patterns: [/\bstations? balnéaires?\b/],
  },
];

// ── Négation dans la proposition ─────────────────────────────────────────────────────────────

// Négation au sens large : les tournures de CONTRASTE (« ce qui la distingue d'un territoire
// entièrement bâti », « loin d'être très dense ») écartent l'assertion au lieu de l'affirmer.
// Vu en réel le 28/09 : la première formule faisait refuser une phrase juste, au prix d'un second appel.
const NEGATION = /(\bn'|\bne\b|\baucune?\b|\bpas\b|\bjamais\b|\bni\b|\bsans\b|\bnon\b|\brien\b|\bdistingu\w*|\bloin d'|\bplutôt que\b|\bcontrairement\b|\bà la différence\b|\bmoins\b)/;
const CLAUSE_BREAK = /[,;:()]/g;

/** La proposition qui contient la correspondance est-elle niée ? (début de proposition → fin de phrase) */
function isNegated(sentence: string, index: number): boolean {
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
    .replace(/[  ]/g, " ");
}

function sentencesOf(text: string): string[] {
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

// ── Composition par FAMILLES (décision du 30/09) ─────────────────────────────────────────────
// Deux faits ne se relient que s'ils mesurent la même grandeur. Plutôt qu'une regex par phrase
// fautive, des familles de notions et la liste des paires qu'aucun fait ne relie aujourd'hui :
// une phrase qui nomme les deux familles d'une paire ET un connecteur de causalité ou de
// continuité compose ce que les données ne composent pas. Les citer séparément reste permis.
const FAMILY: Record<string, RegExp> = {
  chaleur: /\bnuits?\b|chaleur|jours? au-dessus de 30|°\s*c\b|fraîcheur|récupération thermique/,
  morphologie: /\bdenses?\b|densité|urbanisé|compacte?s?|bâti\b/,
  pluie: /pluies? intenses?|précipitations? (extrêmes?|intenses?)/,
  inondation_reconnue: /inondations?[^.]*(reconnu|arrêtés?|catastrophes? naturelles?)|(reconnu|arrêtés?|catastrophes? naturelles?)[^.]*inondations?|enjeu depuis|depuis plusieurs décennies/,
  arrivants: /arrivants?|nouveaux habitants|vivaient (ailleurs|dans une autre commune)|accueill/,
  besoins: /besoins?|services|consommation|\beau\b|fraîcheur|logements? supplémentaires/,
};
const FORBIDDEN_PAIRS: [string, string][] = [
  ["morphologie", "chaleur"],
  ["pluie", "inondation_reconnue"],
  ["arrivants", "besoins"],
];
const CONNECTOR = /\b(pèse\w*|poids particulier|amplifi\w*|aggrav\w*|accentu\w*|renforc\w*|s'inscri\w*|prolong\w*|confirm\w*|annonc\w*|donc|d'où|rend\w* (plus|d'autant)|d'autant plus|dont les besoins|évolu\w* rapidement|conséquence|traduit)\b/;

function checkCompositions(sentences: string[]): Violation[] {
  const out: Violation[] = [];
  for (const s of sentences) {
    if (!CONNECTOR.test(s)) continue;
    for (const [a, b] of FORBIDDEN_PAIRS) {
      if (FAMILY[a].test(s) && FAMILY[b].test(s)) {
        out.push({ rule: `composition:non-autorisee:${a}×${b}`, excerpt: s });
      }
    }
  }
  return out;
}

export function checkAssertions(text: string, projection: Projection): Violation[] {
  const out: Violation[] = [];
  const sentences = sentencesOf(text);
  out.push(...checkCompositions(sentences));
  for (const rule of RULES) {
    if (!rule.when(projection)) continue;
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

// ── Nombres ──────────────────────────────────────────────────────────────────────────────────

/**
 * L'UNITÉ D'UNE VALEUR, déduite du nom de son champ. Sans elle, un « 2 % » inventé retrouvait un
 * « 2 » quelconque (deux arrêtés « chocs liés aux vagues ») et passait. Trois familles suffisent :
 * pourcentage, température, et le reste (jours, nuits, habitants, années), laissé ouvert.
 */
export type NumberUnit = "%" | "°C" | "jours" | "nuits" | "habitants" | "mm" | "other";

function unitOfPath(path: string): NumberUnit {
  if (/pct|part_/.test(path)) return "%";
  if (/_C\b|_C$|_C\.|rechauffement|temperature|scenario/.test(path)) return "°C";
  if (/nuits/.test(path)) return "nuits";
  if (/jours/.test(path)) return "jours";
  if (/habitants|population/.test(path)) return "habitants";
  if (/_mm/.test(path)) return "mm";
  return "other";
}

/** L'unité ÉCRITE juste après un nombre. « other » = aucune unité reconnue. */
function unitAfter(after: string): NumberUnit | "forbidden" {
  if (FORBIDDEN_UNIT.test(after)) return "forbidden";
  if (/^\s*%/.test(after)) return "%";
  if (/^\s*°/.test(after)) return "°C";
  if (/^\s*nuits?\b/.test(after)) return "nuits";
  if (/^\s*jours?\b/.test(after)) return "jours";
  if (/^\s*habitants?\b/.test(after)) return "habitants";
  if (/^\s*(mm|millimètres?)\b/.test(after)) return "mm";
  return "other";
}

/**
 * CE QUE DÉSIGNE UNE VALEUR (FUT-6, correction du 28/09). « 19 jours au-dessus de 30 °C » et « 19 jours
 * supplémentaires » citent le même nombre et ne disent pas la même chose. Vu en réel : la valeur
 * absolue (18,8 jours) présentée comme un écart, alors que l'écart vaut +11,6. Chaque valeur de la
 * projection porte donc sa NATURE, déduite de son champ :
 *   - `ecart` : un écart à la période de référence (« ecart_par_rapport_a_1976_2005 »), un
 *     réchauffement (le scénario « +2,7 °C », la tendance observée) ;
 *   - `reference` : la valeur de la période 1976-2005 ;
 *   - `valeur` : tout le reste (valeurs absolues, comptes, années, parts).
 */
export type NumberKind = "valeur" | "ecart" | "reference";
export type AllowedNumber = { value: number; unit: NumberUnit; kind: NumberKind };

function kindOfPath(path: string): NumberKind {
  if (/ecart_par_rapport|scenario_france|rechauffement_observe/.test(path)) return "ecart";
  if (/valeur_de_reference/.test(path)) return "reference";
  return "valeur";
}

/** Toutes les valeurs numériques de la projection, avec leur unité et leur nature, y compris dans les chaînes (« 2015-2021 ») et les noms de champ. */
export function allowedNumbers(p: Projection): AllowedNumber[] {
  const out: AllowedNumber[] = [];
  const walk = (v: unknown, path: string) => {
    const unit = unitOfPath(path);
    const kind = kindOfPath(path);
    // La valeur ET sa valeur absolue : « la population a reculé de 0,4 % » cite -0,4 sans son signe.
    if (typeof v === "number" && Number.isFinite(v)) out.push({ value: v, unit, kind }, { value: Math.abs(v), unit, kind });
    else if (typeof v === "string") for (const n of numbersIn(v)) out.push({ value: Math.abs(n.value), unit, kind });
    else if (Array.isArray(v)) v.forEach((x) => walk(x, path));
    else if (v && typeof v === "object") {
      // Les NOMS de champ font partie de ce que le modèle lit : « jours_au_dessus_de_30C » fonde le
      // « 30 °C » d'une phrase, « ecart_par_rapport_a_1976_2005 » la période de référence.
      for (const [k, x] of Object.entries(v)) {
        for (const m of k.matchAll(/(\d+)(C?)/g)) out.push({ value: Number(m[1]), unit: m[2] ? "°C" : "other", kind: "valeur" });
        walk(x, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(p, "");
  return out;
}

type WrittenNumber = {
  value: number; raw: string; index: number; qualifier: string | null;
  unit: NumberUnit | "forbidden";
  /** Ce que la PHRASE dit de ce nombre : un écart (« +12 », « 12 de plus », « une hausse de 12 ») ou une valeur. */
  sense: "ecart" | "valeur";
  /** La phrase parle de RÉCHAUFFEMENT : une grandeur qui est, par nature, un écart de température. */
  warming: boolean;
};

const NUMBER = /(?<![\d.,])([+\-\u2212]?)(\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:[.,](\d+))?/g;
const QUALIFIER = /(environ|près de|presque|plus de|moins de|autour de|quelque)\s*$/;
// Des unités qu'aucun fait ne porte : les écrire, c'est avoir calculé (jours → mois, ratio).
// « reconnue 14 fois » est un compte ; « 4 fois plus » est un ratio.
const FORBIDDEN_UNIT = /^\s*(mois|semaines?|fois (plus|moins))\b/;
// Les marqueurs d'ÉCART, avant ou après le nombre. « passer de 7 à 19 » n'en est pas un : il cite
// deux valeurs. Convention ciblée, sans analyse générale de la langue.
const ECART_BEFORE = /(hausse|augmentation|progression|gain|baisse|recul|diminution|écart|ecart|réchauffement)s?(\s+[^\s]+){0,3}\s+d(e |')\s*$|(hausse|augmentation|écart|réchauffement)s? d(e |')\s*$|\b(augment|progress|gagn|grimp|recul|baiss|diminu)\w* de\s*$|\b(a|ont|aurait|auraient) (déjà )?(gagné|pris|grimpé)\s*$|\b(ajout|rajout)\w*\s*$/;
// « 2,6 °C au-dessus de la référence » est un écart (vu en réel à Aurillac, 30/09) ; « 5 nuits au-dessus
// de 20 °C » reste un seuil, d'où les degrés exigés avant et la référence exigée après.
const ECART_AFTER = /^\s*(jours?|nuits?|°\s*c|degrés?)?\s*(supplémentaires?|de plus|en plus|additionnel|de réchauffement|de hausse)|^\s*(°\s*c|degrés?)\s+(au-dessus|au-dessous|en dessous|en deçà) d(e|u)\s+(la |cette |sa |leur )?(même |valeur |période |moyenne )?(de )?(référence|1976)/;

function numbersIn(text: string): WrittenNumber[] {
  const out: WrittenNumber[] = [];
  NUMBER.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NUMBER.exec(text))) {
    const sign = m[1] === "-" || m[1] === "\u2212" ? -1 : 1;
    // Un tiret entre deux nombres est une période (« 2015-2021 »), pas un signe.
    const signIsRange = m[1] && m.index > 0 && /\d/.test(text[m.index - 1] ?? "");
    const intPart = m[2].replace(/[ \u00a0\u202f]/g, "");
    const value = Number(`${intPart}${m[3] ? `.${m[3]}` : ""}`) * (signIsRange ? 1 : sign);
    const before = normalizeText(text.slice(Math.max(0, m.index - 16), m.index));
    const beforeLong = normalizeText(text.slice(Math.max(0, m.index - 40), m.index));
    const after = normalizeText(text.slice(m.index + m[0].length, m.index + m[0].length + 45));
    const q = QUALIFIER.exec(before);
    const unit = unitAfter(after);
    const signed = (m[1] === "+" || m[1] === "-" || m[1] === "\u2212") && !signIsRange;
    const sense = signed || ECART_BEFORE.test(beforeLong) || ECART_AFTER.test(after) ? "ecart" : "valeur";
    out.push({ value, raw: m[0], index: m.index, qualifier: q ? q[1] : null, unit, sense, warming: /réchauff/.test(normalizeText(text)) });
  }
  return out;
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * Transformations admises (conventions validées le 27/09) : la valeur exacte ; l'arrondi à l'entier
 * ou à une décimale ; avec « environ / près de / autour de », un écart de 10 % au plus ; avec « plus
 * de » / « moins de », une borne STRICTEMENT vraie, à 20 % près. L'unité écrite doit être celle de la
 * valeur (un pourcentage n'est pas un nombre de jours). Aucune autre transformation (ratio, différence,
 * conversion en mois) : son résultat n'existe pas dans la projection, il est refusé.
 */
function matches(w: WrittenNumber, allowed: AllowedNumber[]): boolean {
  if (w.unit === "forbidden") return false;
  const x = w.value;
  // UN NOMBRE SANS UNITÉ ÉCRITE n'a droit qu'à la valeur exacte ou à l'arrondi, jamais à une marge :
  // avec une marge, « moins de 6 » retrouvait n'importe quel 5 de la projection.
  const tolerant = w.unit !== "other";
  for (const { value: v, unit, kind } of allowed) {
    if (w.unit !== "other" && unit !== w.unit) continue;
    // LE SENS DOIT CONCORDER. Un nombre présenté comme un écart ne se valide que sur un écart ; un
    // nombre présenté comme une valeur, jamais sur un écart. Les taux d'évolution en % (« progresse de
    // 0,62 % par an ») sont des valeurs de la source : la règle ne s'applique pas aux pourcentages.
    if (w.unit !== "%") {
      if (w.sense === "ecart" && kind !== "ecart") continue;
      // « Le réchauffement observé atteint 1,7 °C » : un réchauffement EST un écart. En °C, et dans une
      // phrase qui parle de réchauffement, le nombre peut donc se valider sur un écart de température.
      // Jours et nuits restent stricts : « 19 jours supplémentaires » reste refusé.
      const warmingException = w.warming && w.unit === "°C" && unit === "°C";
      if (w.sense === "valeur" && kind === "ecart" && !warmingException) continue;
    }
    if (close(x, v) || close(x, round(v, 0)) || close(x, round(v, 1))) {
      if (w.qualifier !== "plus de" && w.qualifier !== "moins de") return true;
    }
    // « 677 000 habitants » pour 677 080 : au-delà de 10 000 habitants, l'arrondi au millier est une
    // liberté de rédaction, pas un nombre inventé (refus à tort vu en réel à Nantes, 30/09).
    if (unit === "habitants" && Math.abs(v) >= 10000 && !w.qualifier && close(x, Math.round(v / 1000) * 1000)) return true;
    if (!tolerant) {
      // Sans unité, une borne n'est admise que si c'est l'entier le plus proche : 5,6 → « moins de 6 »
      // (vrai), mais un 5 pris ailleurs ne fonde pas « moins de 6 ».
      if (w.qualifier === "moins de" && x > v && close(x, Math.ceil(v))) return true;
      if (w.qualifier === "plus de" && x < v && close(x, Math.floor(v))) return true;
      continue;
    }
    if (w.qualifier === "plus de") { if (x < v && x >= v * 0.8) return true; continue; }
    if (w.qualifier === "moins de") { if (x > v && x <= v * 1.2) return true; continue; }
    if (w.qualifier && v !== 0 && Math.abs(x - v) / Math.abs(v) <= 0.1) return true;
    // « environ 5 » pour 5,6 : l'entier inférieur ou supérieur reste un arrondi raisonnable.
    if (w.qualifier && w.qualifier !== "plus de" && w.qualifier !== "moins de" && (close(x, Math.floor(v)) || close(x, Math.ceil(v)))) return true;
  }
  return false;
}

export function checkNumbers(text: string, projection: Projection): Violation[] {
  const allowed = allowedNumbers(projection);
  const out: Violation[] = [];
  for (const s of text.split(/\n+|(?<=[.!?])\s+/)) {
    for (const w of numbersIn(s)) {
      if (!matches(w, allowed)) {
        const rule = w.unit === "forbidden"
          ? "nombre:transformation-non-admise"
          : allowed.some((a) => close(Math.abs(w.value), Math.round(a.value)) || close(Math.abs(w.value), a.value))
            ? "nombre:sens-incoherent" // le nombre existe, mais pas avec le sens que la phrase lui donne
            : "nombre:absent-des-donnees";
        out.push({ rule, excerpt: `« ${w.raw.trim()} » dans : ${s.replace(/^#+\s*/, "").trim()}` });
      }
    }
  }
  return out;
}

// ── Forme ────────────────────────────────────────────────────────────────────────────────────

export function checkFormat(text: string): Violation[] {
  const blocks = text.split(/\n##\s+/).slice(1);
  return blocks.length === 3 ? [] : [{ rule: "format:trois-blocs", excerpt: `${blocks.length} bloc(s) au lieu de 3` }];
}

export function checkSynthesis(text: string, projection: Projection): Violation[] {
  return [...checkFormat(text), ...checkAssertions(text, projection), ...checkNumbers(text, projection)];
}

/** Les violations, dites au modèle pour sa seconde tentative. */
export function describeViolations(v: Violation[]): string[] {
  return v.map((x) => `${x.rule} : ${x.excerpt.length > 180 ? `${x.excerpt.slice(0, 177)}…` : x.excerpt}`);
}
