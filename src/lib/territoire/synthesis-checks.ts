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

import {
  isNegated,
  normalizeText,
  sentencesOf,
  REGLE_CLASSEMENT_NATIONAL,
  REGLE_MARCHE_LOGEMENT,
  REGLE_RACCORD,
  REGLE_TENSION_EAU,
  type Violation,
} from "../garde-fous/assertions.ts";

// Les quatre règles sans condition de fait (eau, raccord, marché, classement) et le moteur d'assertion
// vivent désormais dans src/lib/garde-fous/assertions.ts, partagés avec l'accueil et /qna (FUT-37).
export { normalizeText, type Violation };

type Projection = Record<string, unknown>;

type Rule = {
  id: string;
  /** La règle ne s'applique que si la projection porte le fait qui la fonde. */
  when: (p: Projection) => boolean;
  patterns: RegExp[];
  polarity: "affirmative" | "any";
  /** Une phrase qui porte cette précision échappe à la règle. Une fonction quand une regex ne suffit pas. */
  unless?: RegExp | ((sentence: string) => boolean);
};

// Les marqueurs d'une DISTINCTION affirmée entre deux faits (texte normalisé, en minuscules).
const DISTINCTION = /\b(deux|des) (mesures|faits|objets|indicateurs|données|phénomènes|réalités|grandeurs) distincte?s\b|\b(objets|faits|indicateurs|phénomènes) distincts\b|\bmesures distinctes\b|\blue?s? séparément\b|\bne (sont|désignent|mesurent|décrivent|disent) pas (le même|la même|les mêmes)\b|\bsans que l'une? (n')?(annonce|prolonge|explique|découle de) l'autre\b|\bsans (en faire|y voir|établir|faire) (la |une |de )?(continuité|lien|prolongement)\b/;
// Une continuité AFFIRMÉE entre les deux. Les tournures négatives (« sans que l'un annonce l'autre »,
// « sans en faire la continuité ») sont retirées avant ce test : elles sont la distinction elle-même.
const CONTINUITE = /annonc|prolong|s'inscri|continuité|amplifi|s'intensifi|s'accentu|aggrav|préfigur|présag/;
const NEGATIONS = /\bsans (que |en |y |établir |faire )[^,;:.]*|\bni (l'une?|l'autre)[^,;:.]*|\bpas (le |la |un |une )?(prolongement|continuité|annonce)[^,;:.]*/g;

/** La phrase affirme-t-elle que les deux faits sont distincts, sans affirmer ailleurs leur continuité ? */
export function distinctionExplicite(sentence: string): boolean {
  return DISTINCTION.test(sentence) && !CONTINUITE.test(sentence.replace(NEGATIONS, " "));
}

const escapes = (rule: Rule, s: string): boolean =>
  rule.unless == null ? false : typeof rule.unless === "function" ? rule.unless(s) : rule.unless.test(s);

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
// FUT-177 : la FIN d'un mot. En JavaScript, `\b` ne voit pas une lettre accentuée comme une lettre : « très urbanisé »
// (masculin singulier, suivi d'une espace) échappait à `très urbanisé${A}\b`. Le texte est en minuscules.
const FIN = "(?![a-zà-ÿœæ0-9])";

// ── Couvert : les deux familles de requalification (D4, FUT-177) ──
// TERRITOIRE BÂTI OU URBANISÉ : vrai seulement pour « Majoritairement urbanisé ». Ces tournures étaient déjà
// refusées pour trois catégories ; FUT-177 les étend à « Faible présence d'espaces naturels », qui y échappait
// alors que ses terres se partagent entre cultures et espaces urbanisés sans que ces derniers dominent
// (Carpiquet : 41 % d'urbanisé, 45 % de cultures). « Peu d'espaces naturels » n'est pas « beaucoup de bâti ».
const COUVERT_BATI: RegExp[] = [
  new RegExp(`\\b(presque|quasi(ment)?|entièrement|totalement|essentiellement|largement) (bâti${A}|urbanisé${A}|construit${A}|minéral${A}|minérale${A})${FIN}`),
  new RegExp(`\\btrès (urbanisé${A}|bâti${A}|minéral${A}|minérale${A}|construit${A})${FIN}`),
  new RegExp(`\\bmajoritairement (bâti${A}|urbanisé${A})${FIN}`),
  /\b(l'essentiel|la majeure partie|la majorité) (du territoire|de la commune) (est |reste )?(bâti|urbanisé|construit|couvert)/,
  /\ble bâti (domine|l'emporte|prédomine)/,
  new RegExp(`\\bdensément (bâti${A}|construit${A})`),
  // FUT-177 : la dominance et l'intensité, sous d'autres mots.
  new RegExp(`\\b(principalement|surtout|avant tout|fortement|en majorité) (bâti${A}|urbanisé${A}|construit${A}|minéral${A}|minérale${A})${FIN}`),
  /\bforte urbanisation\b/,
  new RegExp(`\\b(dominé${A}|façonné${A}) par (l'urbanisation|le bâti|les espaces urbanisés|les surfaces urbanisées|la ville|le béton|les constructions)`),
  /\b(l'urbanisation|les espaces urbanisés|les surfaces urbanisées) (domine|dominent|l'emporte|l'emportent|prédomine|prédominent)\b/,
];
// Le manque de nature : refusé quand la catégorie le contredit, permis pour « Faible présence d'espaces naturels ».
const COUVERT_PEU_NATUREL: RegExp[] = [
  /\b(très|si|trop) peu d(e |')(espaces? (verts?|naturels?|ouverts?)|végétation|verdure|nature|couvert végétal)/,
  /\b(presque|quasi(ment)?) (pas|plus|aucun) d?(e |')?(nature|verdure|végétation|espaces? verts?|terre)/,
];
const OSO_PRESENT = (p: Projection) => at(p, "occupation_des_sols") != null;
// Une phrase qui RANGE routes et parkings DANS l'urbanisé en donne la bonne définition (FUT-177). Nommer les routes
// ne suffit pas : « couverte de bâtiments, sans compter les routes » les met à part et laisse entier le contresens.
// L'exception exige une tournure d'inclusion (« compris », « confondus », « comptent… routes ») et aucune d'exclusion.
const INFRA = "(routes?|voiries?|parkings?|zones? d'activités?|voies? ferrées?|pistes?)";
const INCLUSION_INFRA: RegExp[] = [
  new RegExp(`\\b${INFRA}[^.]{0,60}\\b(compris|comprises|confondus|inclus|incluses)${FIN}`),
  new RegExp(`\\by compris (les |des |la |le )?${INFRA}`),
  new RegExp(`\\burbanisée?s?${FIN}[^.]{0,30}\\b(compte|comptent|comprend|comprennent|inclut|incluent|englobe|englobent|regroupe|regroupent|réunit|réunissent|rassemble|rassemblent|mêle|mêlent|désigne|désignent|recouvre|recouvrent)\\b[^.]{0,80}\\b${INFRA}`),
  new RegExp(`\\b${INFRA}[^.]{0,40}\\b(autant que|aussi bien que|au même titre que)\\b`),
];
const EXCLUSION_INFRA: RegExp[] = [
  new RegExp(`\\b(sans compter|sans parler|sans|hors|en dehors|à l'exclusion|excepté|exceptées?|sauf|outre|en plus|à part|non compris|non comprises)${FIN}[^.]{0,15}\\b${INFRA}`),
  new RegExp(`\\b${INFRA}[^.]{0,20}\\b(exclus|exclue?s?|non compris|non comprises|à part|en plus|en sus|mis à part)${FIN}`),
];
// Ce que la règle refuse : l'urbanisé lu comme des bâtiments ou une densité de constructions.
const URBANISE_BATIMENTS: RegExp[] = [
  /(\d+(,\d+)? ?%|la moitié|un tiers|un quart|l'essentiel|la majeure partie|la majorité)[^.]{0,40}\b(de |des )?(bâtiments|constructions|immeubles|maisons)\b/,
  /\b(couvert|couverte|couverts|couvertes|occupée?s?) (de|par des|par les) (bâtiments|constructions|immeubles|maisons)/,
  /\b(les )?(bâtiments|constructions|immeubles|maisons) (couvrent|occupent|recouvrent|représentent)[^.]{0,30}(\d+(,\d+)? ?%|la moitié|un tiers|un quart|l'essentiel|la majeure partie|la majorité)/,
  new RegExp(`\\b(majoritairement|essentiellement|en majorité|pour moitié|à moitié|largement|principalement) (bâti${A}|construit${A})${FIN}`),
  /\b(espaces|surfaces) urbanisée?s?,? (c'est-à-dire|soit|autrement dit|donc|autant de) (des |les |de )?(bâtiments|constructions|immeubles|maisons)/,
  /\bdensité (du bâti|des constructions|des bâtiments|bâtie|de construction)\b/,
  new RegExp(`\\b(densément|fortement|très) (bâti${A}|construit${A})${FIN}`),
];
// PORTÉE de l'exception (contre-revue du 09/11) : une définition juste dans une proposition ne rachète pas une
// assertion fausse dans une autre. « La moitié de ses terres est couverte de bâtiments ; les espaces urbanisés
// comptent aussi les routes et les parkings » : la définition est dans la seconde proposition, l'assertion sur les
// bâtiments dans la première. Chaque proposition qui porte une assertion sur les bâtiments doit porter elle-même
// l'inclusion. Les virgules ne coupent pas (« bâtiments, routes et parkings confondus » est une seule énumération) ;
// « et » coupe quand il ouvre une nouvelle proposition (« et les espaces urbanisés… », « et il… »).
const PROPOSITIONS_URBANISE = new RegExp(
  `[;:]|\\b(?:mais|car|alors que|tandis que|cependant|toutefois|pourtant|même si|bien que)\\b|\\bet (?=(?:(?:les|le|la|il|elle|ils|elles|ce|cela|on|ses|son|sa)(?![a-zà-ÿœæ])|l'|c')(?! ?${INFRA}))`,
);
const DEFINITION_URBANISE = (s: string): boolean => {
  if (EXCLUSION_INFRA.some((r) => r.test(s))) return false;
  const assertions = s.split(PROPOSITIONS_URBANISE).filter((c) => c != null && URBANISE_BATIMENTS.some((r) => r.test(c)));
  return assertions.length > 0 && assertions.every((c) => INCLUSION_INFRA.some((r) => r.test(c)));
};

// Le cadre de vie : ce qu'une mesure des sols à l'échelle communale ne dit pas.
// « à deux pas » n'y figure pas : son « pas » se lit comme une négation (`isNegated`), la règle ne le verrait jamais.
const CADRE_DE_VIE: RegExp[] = [
  /\baccès (direct |facile |rapide |immédiat )?(à la |aux |à des |à une )(nature|espaces? (naturels?|verts?)|forêts?|campagne|bois)\b/,
  /\b(nature|forêts?|campagne|espaces? naturels?|bois)( est| sont| reste| restent)? (à portée( de main)?|à proximité( immédiate)?|tout proches?|toute proches?|aux portes|accessibles?|à quelques minutes)\b/,
  // La même conclusion, quelques mots plus loin : « La nature dépend du quartier et reste toute proche ».
  /\b(nature|forêts?|campagne|espaces? naturels?|bois)\b[^.]{0,40}\b(est|sont|reste|restent|demeure|demeurent) (tout |toute |très )?(à portée( de main)?|à proximité( immédiate)?|proches?|accessibles?|aux portes|à quelques minutes)(?![a-zà-ÿœæ])/,
  /\bespaces? verts?\b/,
  /\bverdure\b|\bverdoyante?s?\b|\bpoumons? verts?\b/,
  /\bcadre de vie\b/,
  new RegExp(`\\b(commune|ville|territoire|lieu|village|environnement|cadre)s? (calme|paisible|tranquille|préservé${A}|bucolique|champêtre)s?${FIN}`),
  new RegExp(`\\b(au |du |le )calme\\b|\\btranquillité${FIN}|\\bquiétude\\b`),
];
// Le RENVOI à l'adresse ou au quartier reste permis : c'est là que ces questions se posent. Une RÉSERVE ne l'est pas :
// « La commune offre un accès direct à la nature, mais cela dépend du quartier » affirme d'abord, puis nuance.
// La phrase est coupée en propositions (virgule, point-virgule, deux-points, « mais », « même si »…) : chaque
// proposition qui parle du cadre de vie doit elle-même le renvoyer à l'adresse, sans rien en affirmer.
const PROPOSITIONS = /[,;:()]|\b(?:mais|cependant|toutefois|néanmoins|pourtant|même si|bien que|quoique|alors que|tandis que)\b/;
const RENVOI = new RegExp(
  `\\b(dépend|dépendent|dépendra|dépendront|varie|varient|variera|se (vérifie|vérifient|mesure|mesurent|juge|jugent|lit|lisent|regarde|regardent|apprécie|apprécient|joue|jouent)|relève|relèvent|(est|sont) à (vérifier|regarder|apprécier)|examine|examinent|regardez|consultez|vérifiez)${FIN}[^.]{0,40}\\b(adresses?|quartiers?|rues?)${FIN}`,
);
const AFFIRMATION = new RegExp(
  `\\b(offre|offrent|garde|gardent|conserve|conservent|bénéficie|bénéficient|jouit|jouissent|profite|profitent|dispose|disposent|propose|proposent|possède|possèdent|assure|assurent|garantit|garantissent)${FIN}`,
);
// Une CONCLUSION sur le cadre de vie, dans la proposition même du renvoi (contre-revue du 09/11) : « Le cadre de vie
// dépend du quartier et reste paisible », « L'accès à la nature dépend de l'adresse et le cadre de vie est verdoyant ».
// Le renvoi y est présent, mais la proposition conclut quand même. Un renvoi vrai ne qualifie rien.
const QUALIFIE = "(verte?s?|proches?|accessibles?|à portée|à proximité|calmes?|préservée?s?|agréables?|nombreu(x|ses)|abondante?s?|riches?)";
const CONCLUSION_CADRE: RegExp[] = [
  // Après un verbe d'état : « reste paisible », « est verdoyant », « sont nombreux ». « espaces verts » seul n'en est pas une.
  new RegExp(`\\b(est|sont|reste|restent|demeure|demeurent|semble|semblent|paraît|paraissent|s'avère|s'avèrent)( très| plutôt| particulièrement| assez| bien| toute?s?| tout)? (${QUALIFIE.slice(1, -1)}|paisibles?|tranquilles?|verdoyante?s?)${FIN}`),
  // Des qualificatifs qui concluent à eux seuls, où qu'ils soient.
  new RegExp(`\\b(paisibles?|tranquilles?|verdoyante?s?|bucoliques?|champêtres?|idylliques?|privilégiée?s?)${FIN}`),
];
const RENVOI_ADRESSE = (s: string): boolean => {
  const concernees = s.split(PROPOSITIONS).filter((c) => c != null && CADRE_DE_VIE.some((r) => r.test(c)));
  return concernees.length > 0 && concernees.every((c) => RENVOI.test(c) && !AFFIRMATION.test(c) && !CONCLUSION_CADRE.some((r) => r.test(c)));
};

const RULES: Rule[] = [
  // ── Couvert (D4) ──
  {
    id: "couvert:territoire-tres-bati",
    when: catIs(LAND, "Occupation mixte", "Forte présence naturelle", "À dominante agricole"),
    polarity: "affirmative",
    patterns: [...COUVERT_BATI, ...COUVERT_PEU_NATUREL],
  },
  {
    // FUT-177 (A5) : la faible présence d'espaces naturels n'établit ni un territoire bâti ni un territoire urbanisé.
    id: "couvert:faible-nature-lue-comme-bati",
    when: catIs(LAND, "Faible présence d'espaces naturels"),
    polarity: "affirmative",
    patterns: [
      ...COUVERT_BATI,
      new RegExp(`\\b(commune|territoire|ville)s? (très |surtout |essentiellement |principalement |avant tout )?urbaine${A}${FIN}`),
    ],
  },
  {
    id: "couvert:territoire-tres-naturel",
    // FUT-177 : « À dominante agricole » y entre. Des cultures ne sont pas des espaces naturels (Bony : 89 % de
    // cultures, 6,8 % d'espaces naturels) ; dire le territoire « très naturel » confondait les deux.
    when: catIs(LAND, "Majoritairement urbanisé", "Faible présence d'espaces naturels", "À dominante agricole"),
    polarity: "affirmative",
    patterns: [
      /\bforte présence (naturelle|d'espaces naturels)/,
      new RegExp(`\\b(largement|majoritairement|très|essentiellement|principalement) (naturel${A}|naturelle${A}|verte${A}|boisé${A})${FIN}`),
      /\ble naturel (domine|l'emporte)/,
      /\bles espaces naturels (dominent|l'emportent|prédominent)\b/,
    ],
  },
  {
    // FUT-177 (A5) : le raisonnement « peu de nature, donc urbanisé » (ou l'inverse), quelle que soit la catégorie.
    // Les terres d'une commune se partagent entre TROIS postes : l'un ne se déduit pas de l'absence d'un autre.
    id: "couvert:peu-naturel-donc-urbanise",
    when: OSO_PRESENT,
    polarity: "affirmative",
    patterns: [
      /\b(peu|faible (part|place|présence)|rareté|manque|absence) (d(e |')|des )?(espaces? naturels?|nature|milieux naturels)[^.]*\b(traduit|reflète|témoigne|signe|révèle|montre|indique|illustre|s'explique|dû|due|car|parce|conséquence|résultat|au profit)(?![a-zà-ÿœæ0-9])[^.]*\b(urbanis\w*|bâti\w*|construit\w*|construction\w*|béton\w*|minéral\w*|ville)/,
      /\b(urbanisation|bâti|constructions?|espaces urbanisés|la ville)(?![a-zà-ÿœæ0-9])[^.]*\b(explique|expliquent|réduit|réduisent|laisse peu|laissent peu|grignote|grignotent|a remplacé|ont remplacé|au détriment)\b[^.]*\b(espaces? naturels?|nature|milieux naturels)/,
    ],
  },
  {
    // FUT-177 (A7) : la part « urbanisée » d'OSO compte routes, parkings, zones d'activité et pistes autant que les
    // bâtiments (Roissy-en-France : 55 % d'urbanisé, l'aéroport en tête, pour une densité intermédiaire). Elle ne dit
    // ni la part couverte de bâtiments, ni une densité de constructions. Une phrase qui range routes ou parkings dans
    // l'urbanisé en donne la bonne définition et passe ; une phrase qui les met à part, non (voir DEFINITION_URBANISE).
    id: "couvert:urbanise-lu-comme-batiments",
    when: OSO_PRESENT,
    polarity: "affirmative",
    unless: DEFINITION_URBANISE,
    patterns: URBANISE_BATIMENTS,
  },
  {
    // FUT-177 : une mesure satellite des sols, à l'échelle de la commune, ne dit ni l'accès à la nature, ni les
    // espaces verts urbains (parcs, jardins : la carte ne les distingue pas), ni le calme, ni le cadre de vie. Le renvoi au
    // quartier ou à l'adresse reste permis, une réserve ajoutée à une affirmation ne l'est pas (voir RENVOI_ADRESSE).
    id: "couvert:cadre-de-vie-non-mesure",
    when: always,
    polarity: "affirmative",
    unless: RENVOI_ADRESSE,
    patterns: CADRE_DE_VIE,
  },
  {
    // FUT-177 : la composition des sols n'est pas une mesure écologique.
    id: "couvert:ecologie-non-mesuree",
    when: always,
    polarity: "affirmative",
    patterns: [
      /\bbiodiversité(?![a-zà-ÿœæ0-9])/,
      /\b(richesse|qualité|valeur|intérêt|patrimoine) (écologique|naturel(le)? remarquable)/,
      /\b(corridors?|continuités?) écologiques?\b|\bréservoirs? de (biodiversité|vie)\b/,
      /\b(faune|flore)\b/,
      /\babrit(e|ent) (la |une )?(vie|faune|flore)\b/,
    ],
  },
  // ── Densité (D3) ──
  {
    id: "densite:requalifiee-dense",
    when: catIs(DENSITY, "Densité intermédiaire", "Commune peu dense", "Arrondissement peu dense"),
    polarity: "affirmative",
    patterns: [
      /\btrès denses?\b/,
      new RegExp(`\\bdensément (bâti${A}|peuplé${A}|construit${A})`),
      /\b(commune|ville|territoire|agglomération|arrondissement)s? (très )?denses?\b/,
    ],
  },
  {
    id: "densite:requalifiee-peu-dense",
    when: catIs(DENSITY, "Densité intermédiaire", "Commune dense", "Arrondissement dense"),
    polarity: "affirmative",
    patterns: [new RegExp(`\\b(peu|faiblement) (denses?|peuplé${A})${FIN}`)],
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
  // ── CatNat « sécheresse » ≠ jours de sols secs projetés (correction du 28/09, exception FUT-76) ──
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
    // UNE PHRASE QUI DIT EXPLICITEMENT QUE CE SONT DEUX CHOSES DISTINCTES fait exactement ce que la
    // consigne demande (FUT-76). Les 5 refus de cette règle journalisés en base au 06/10/2026, sur
    // Toulouse et Paris, étaient tous de cette forme : « sont deux mesures distinctes », « lues
    // séparément […] sans en faire la continuité », « sans que l'un annonce l'autre ». Paris 2050 s'est
    // fait refuser deux fois de suite pour cela, et Toulouse 2030 y a perdu sa première tentative.
    // L'exception reste fermée dès qu'une continuité est AFFIRMÉE hors d'une négation : « deux faits
    // distincts, mais la sécheresse reconnue annonce celle à venir » est toujours refusé.
    unless: distinctionExplicite,
  },
  // ── Eau et raccords (décisions du 30/09) : règles universelles, partagées avec l'accueil et /qna ──
  { ...REGLE_TENSION_EAU, when: always },
  { ...REGLE_RACCORD, when: always },
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
  { ...REGLE_MARCHE_LOGEMENT, when: always },
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
  { ...REGLE_CLASSEMENT_NATIONAL, when: always },
  {
    id: "interdit:rural",
    when: always,
    polarity: "affirmative",
    patterns: [/\brur(al|ale|aux|ales)\b/],
  },
  // FUT-176 : un statut d'agglomération n'est ni un isolement, ni un rôle de pôle, ni une offre de services.
  {
    id: "interdit:statut-urbain-surinterprete",
    when: always,
    polarity: "affirmative",
    patterns: [
      /\b(commune|ville|village|bourg|territoire)s? (très |plutôt |assez |relativement )?isolée?s?\b/,
      /\b(la commune|la ville|le village|le bourg|le territoire|elle|il) (est|reste|semble|demeure) (très |plutôt |assez |relativement )?isolée?s?\b/,
      /\bpôles? (urbain|local|de services|d'attraction|de vie)s?\b/,
      /\bprincipal pôle\b/,
      /\bstructure (la vie locale|son territoire|les environs)\b/,
      /\bconcentre (les|des) (fonctions|services|commerces|équipements)\b/,
    ],
  },
  // FUT-176 (contre-revue) : le statut de ville-centre est celui de Paris, Lyon ou Marseille, pas de l'arrondissement lu.
  {
    id: "interdit:arrondissement-ville-centre",
    when: (p) => /^arrondissement\b/.test(String(at(p, "commune.role_territorial.role") ?? "")),
    polarity: "affirmative",
    patterns: [
      // RÈGLE SUR LE SUJET de l'affirmation, jamais une exception sur la phrase entière (contre-revues FUT-176). Toute
      // attribution du rôle de ville-centre est refusée, SAUF quand son sujet est la ville elle-même, nommée seule juste
      // avant le verbe (« Paris est la ville-centre », « Paris, ville-centre, est au centre de son agglomération »).
      // « Paris 20e est la ville-centre », « Le 20e arrondissement est la ville-centre », « Lyon 9e constitue la
      // ville-centre », « l'arrondissement est la ville-centre », « il est au centre de son agglomération » : refusés.
      /(?<!\b(paris|lyon|marseille)(, [^,]*,)? )\b(est|constitue|forme|reste|demeure|devient) (la |une |lui-même |elle-même )?ville-centre\b/,
      /(?<!\b(paris|lyon|marseille)(, [^,]*,)? )\b(est|se situe|se trouve|reste) au (centre|cœur) de (son |l')agglomération\b/,
      /\barrondissement,? ville-centre\b/,
    ],
  },
  // FUT-179 (contre-revue) : une densité ne change jamais de périmètre. Lu à l'arrondissement, le texte ne la prête
  // ni à une « commune » ni à la ville ; lu à Paris, Lyon ou Marseille entière, il ne la prête à aucun arrondissement
  // (la projection d'une ville ne porte aucune densité d'arrondissement).
  {
    id: "interdit:densite-arrondissement-pretee-a-la-commune",
    when: (p) => /^arrondissement\b/.test(String(at(p, "commune.role_territorial.role") ?? "")) && at(p, "commune.densite") != null,
    polarity: "affirmative",
    patterns: [
      /\b(commune|ville)s? (très |peu |plutôt |assez |relativement |moyennement )?denses?\b/,
      /\b(commune|ville)s? (de|à) (forte |faible |moyenne )?densité\b/,
      /\bdensité (moyenne )?(de la|d'une|de cette) (commune|ville)\b/,
      /\bdensité (moyenne )?(de|à) (paris|lyon|marseille)\b/,
    ],
  },
  {
    id: "interdit:densite-ville-pretee-a-un-arrondissement",
    when: (p) => /^(paris|lyon|marseille)$/i.test(String(at(p, "commune.nom") ?? "").trim()) && at(p, "commune.densite") != null,
    polarity: "affirmative",
    patterns: [/\barrondissements?\b.*\bdens/, /\bdens.*\barrondissements?\b/],
  },
  {
    id: "interdit:station-balneaire",
    when: always,
    polarity: "any",
    patterns: [/\bstations? balnéaires?\b/],
  },
];

// ── Négation, normalisation, découpage : déplacés dans src/lib/garde-fous/assertions.ts (FUT-37) ──

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
      if (escapes(rule, s)) continue;
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
// « soit 2 °C d'écart », « 12,7 jours d'écart » (FUT-76, refusés à tort à Toulouse et Paris le 05/10).
const ECART_AFTER = /^\s*(jours?|nuits?|°\s*c|degrés?)?\s*(supplémentaires?|de plus|en plus|additionnel|de réchauffement|de hausse|d'écarts?\b|d'ecarts?\b)|^\s*(°\s*c|degrés?)\s+(au-dessus|au-dessous|en dessous|en deçà) d(e|u)\s+(la |cette |sa |leur )?(même |valeur |période |moyenne )?(de )?(référence|1976)/;

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
    // « l'écart est de PRESQUE 15 jours » : le qualificatif s'intercale entre le marqueur et le nombre.
    // Il reste porté par `qualifier` (et sa tolérance) ; il ne doit pas masquer le sens (FUT-76, Toulouse).
    const beforeSansQualif = beforeLong.replace(QUALIFIER, "");
    const sense = signed || ECART_BEFORE.test(beforeSansQualif) || ECART_AFTER.test(after) ? "ecart" : "valeur";
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
        const proche = (a: AllowedNumber) => close(Math.abs(w.value), Math.round(a.value)) || close(Math.abs(w.value), a.value);
        const rule = w.unit === "forbidden"
          ? "nombre:transformation-non-admise"
          : allowed.some((a) => a.unit === w.unit && proche(a))
            ? "nombre:sens-incoherent" // le nombre existe dans cette unité, mais pas avec le sens que la phrase lui donne
            // LE BON NOMBRE, AU BON SENS, DANS UNE AUTRE UNITÉ (FUT-76) : « 29,5 jours d'écart » pour des
            // NUITS. Le refus est juste, mais l'appeler « sens incohérent » ne disait pas au modèle quoi
            // corriger, et il recommençait. Le diagnostic nomme maintenant l'unité.
            : w.unit !== "other" && matches({ ...w, unit: "other" }, allowed.filter((a) => a.unit !== w.unit && a.unit !== "other"))
              ? "nombre:unite-incoherente"
              : allowed.some(proche)
                ? "nombre:sens-incoherent"
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

/**
 * CE QU'IL FAUT CORRIGER, PAR FAMILLE DE RÈGLE (FUT-76). La seconde tentative recevait « règle :
 * extrait », sans dire quoi changer : à Paris 2050, le même refus CatNat est revenu deux fois, et
 * les refus de nombres (« sens incohérent ») ne disaient pas si c'était l'unité ou le sens.
 */
const CONSIGNES: [RegExp, string][] = [
  [/^nombre:unite-incoherente$/, "l'unité ne correspond pas à la donnée (les nuits au-dessus de 20 °C se comptent en nuits, pas en jours) ; reprenez l'unité du champ"],
  [/^nombre:sens-incoherent$/, "ce nombre existe dans les données, mais pas avec ce sens : un écart à la référence se cite depuis le champ ecart_…, une valeur depuis le champ valeur ; ne recalculez rien"],
  [/^nombre:absent-des-donnees$/, "ce nombre ne figure pas dans les données : n'écrivez que des valeurs présentes (ou leur arrondi), sans différence, ratio ni conversion"],
  [/^nombre:transformation-non-admise$/, "aucune conversion (mois, semaines) ni ratio (« x fois plus ») : citez la valeur dans son unité"],
  [/^catnat:/, "citez les jours de sols secs projetés et la sécheresse reconnue en catastrophe naturelle dans deux phrases séparées, sans lien entre elles"],
  [/^interdit:psychologie-collective$/, "ne prêtez ni attention, ni perception, ni attente aux habitants ou aux lecteurs : décrivez les données"],
  [/^format:/, "respectez le format : un titre puis exactement trois blocs « ## »"],
  [/^interdit:arrondissement-ville-centre$/, "le statut de ville-centre est celui de la commune entière (Paris, Lyon, Marseille) : ne le prêtez pas à l'arrondissement"],
  [/^couvert:(territoire-tres-bati|faible-nature-lue-comme-bati|peu-naturel-donc-urbanise)$/, "reprenez la catégorie d'occupation des sols telle quelle et lisez la composition : les terres se partagent entre espaces urbanisés, cultures et espaces naturels, et le peu de l'un ne prouve pas la dominance d'un autre"],
  [/^couvert:territoire-tres-naturel$/, "reprenez la catégorie d'occupation des sols telle quelle : les cultures ne sont pas des espaces naturels"],
  [/^couvert:urbanise-lu-comme-batiments$/, "les espaces urbanisés comptent routes, parkings et zones d'activité autant que les bâtiments : ne parlez ni de bâtiments ni de densité de constructions"],
  [/^couvert:(cadre-de-vie-non-mesure|ecologie-non-mesuree)$/, "la composition des sols ne mesure ni l'accès à la nature, ni les espaces verts, ni le calme, ni le cadre de vie, ni la biodiversité : citez les parts sans les interpréter"],
  [/^interdit:densite-arrondissement-pretee-a-la-commune$/, "la densité transmise est celle de l'arrondissement, pas de la commune entière : dites « arrondissement », ni « commune » ni « ville »"],
  [/^interdit:densite-ville-pretee-a-un-arrondissement$/, "la densité transmise est celle de la commune entière : ne l'attribuez à aucun arrondissement, et n'en citez aucune autre"],
  [/^interdit:statut-urbain-surinterprete$/, "reprenez le rôle territorial tel quel : ni « isolée », ni « pôle », ni services ou animation déduits d'un statut statistique"],
];

/** Les violations, dites au modèle pour sa seconde tentative : la règle, la phrase, et quoi corriger. */
export function describeViolations(v: Violation[]): string[] {
  return v.map((x) => {
    const extrait = x.excerpt.length > 180 ? `${x.excerpt.slice(0, 177)}…` : x.excerpt;
    const consigne = CONSIGNES.find(([re]) => re.test(x.rule))?.[1];
    return consigne ? `${x.rule} : ${extrait} → ${consigne}` : `${x.rule} : ${extrait}`;
  });
}
