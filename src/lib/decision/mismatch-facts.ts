// LA DOCTRINE DU MISMATCH. Lib PURE : aucune I/O, aucun LLM.
//
// Un mismatch dit une POSITION RELATIVE, et l'assume. Là où une incompatibilité oppose un fait du MONDE
// (« à 240 km de la mer que vous exigez »), un mismatch dit « parmi les communes les moins bien dotées » :
// le percentile n'est plus caché derrière un verdict inventé, il EST le constat.
//
// LE RANG A DEUX BORNES, et c'est ce qui PORTE les ex æquo. Si 300 communes partagent la même valeur, la
// bande [low, high] est large, et une commune à cheval sur un seuil rend neutral : la bande ne prétend
// jamais à une précision qu'un score arrondi n'a pas.

export const MISMATCH_CONVENTIONS_VERSION = "mismatch-conv-1"; // la DOCTRINE (extrême, ex æquo)
export const MISMATCH_DISTRIBUTION_VERSION = "mismatch-dist-2026-07-15"; // le MILLÉSIME des données classées
export const EXTREME_SHARE = 0.2;

export type RankBand = { low: number; high: number };

export type RelativeCriterionFact = {
  key: string;
  rawValue: number | null;
  band: RankBand | null;
  universe: "communes_france";
  distributionVersion: string;
};

export type PositionVerdict = "mismatch" | "satisfied" | "neutral" | "uncertain";

export function bandValide(b: RankBand | null): b is RankBand {
  return (
    b != null &&
    Number.isFinite(b.low) && Number.isFinite(b.high) &&
    b.low >= 0 && b.high <= 1 && b.low <= b.high
  );
}

export function classifyPosition(f: RelativeCriterionFact): PositionVerdict {
  // Une donnée absente ou une bande invalide n'est JAMAIS une position : jamais un rang inventé.
  if (f.rawValue == null || !bandValide(f.band)) return "uncertain";
  if (f.band.high <= EXTREME_SHARE) return "mismatch"; // tout le groupe d'ex æquo est dans le bas
  if (f.band.low >= 1 - EXTREME_SHARE) return "satisfied";
  return "neutral"; // centre, ou intervalle à cheval sur un seuil
}

const FRACTIONS: { max: number; label: string }[] = [
  { max: 0.05, label: "les 5 % de communes" },
  { max: 0.1, label: "les 10 % de communes" },
  { max: 0.2, label: "les 20 % de communes" },
  { max: 0.25, label: "le quart des communes" },
];
export function rankPhrase(high: number): string {
  return (FRACTIONS.find((x) => high <= x.max) ?? { label: "le quart des communes" }).label;
}

// LA TABLE DE PHRASES. PREFERENCE_LABELS n'est pas grammatical dans « Vous avez placé {…} parmi vos
// priorités ». topic = le SUJET nommé (<= 70 car., cf. assertFactValid). projectPhrase = la priorité,
// tournée pour l'ouverture. indicator = ce sur quoi porte la comparaison.
// subject = le groupe nominal qui se lit APRÈS un deux-points dans le headline du verdict
// (« Toulouse répond moins bien à deux de vos priorités : le calme et l'accès aux espaces naturels. »). Il nomme
// LA PRIORITÉ DU LECTEUR, jamais l'indicateur défavorable ni la mesure : « la possibilité de se
// passer de la voiture », et non « la dépendance à la voiture », que le lecteur n'a jamais demandée.
// Deux garde-fous de plus, appris du rendu réel : ne pas empiler deux négations (« la faible
// dépendance à… » oblige le lecteur à inverser deux fois sous un « répond moins bien »), et ne pas
// promettre une grandeur que le calcul ne contient pas. Borné à 45 caractères.
export type MismatchLabel = { topic: string; projectPhrase: string; indicator: string; subject: string; limitation?: string };
// Record<string, MismatchLabel> : vérifie la FORME de chaque valeur (une limitation mal typée échoue) tout en
// restant indexable par PreferenceKey dans la fabrique. L'exhaustivité (chaque MISMATCH_KEY a un label) est
// garantie par un test de garde (mismatch-rules.test.ts), pas par le type (éviterait un cycle facts<->rules).
export const MISMATCH_LABELS: Record<string, MismatchLabel> = {
  nature: { topic: "les espaces naturels", projectPhrase: "la proximité des espaces naturels", indicator: "l'accès aux espaces naturels", subject: "l'accès aux espaces naturels" },
  acces_ecoles: { topic: "l'accès aux collèges et lycées", projectPhrase: "l'accès aux collèges et lycées", indicator: "l'accès aux collèges et lycées", subject: "l'accès aux collèges et lycées" },
  acces_soins: { topic: "l'accès aux soins", projectPhrase: "un bon accès aux soins", indicator: "l'accès aux soins", subject: "l'accès aux soins" },
  acces_culture: { topic: "l'accès à la culture", projectPhrase: "l'accès à une offre culturelle", indicator: "l'accès à l'offre culturelle", subject: "l'accès à l'offre culturelle" },
  acces_transports: { topic: "l'accès au train", projectPhrase: "l'accès au train et aux gares", indicator: "la desserte ferroviaire", subject: "l'accès au train" },
  faible_dependance_auto: { topic: "la dépendance à la voiture", projectPhrase: "une faible dépendance à la voiture", indicator: "la possibilité de se déplacer sans voiture", subject: "la possibilité de se passer de la voiture" },
  croissance_demographique: { topic: "la trajectoire démographique", projectPhrase: "un territoire qui gagne des habitants", indicator: "la trajectoire démographique", subject: "un territoire qui gagne des habitants" },
  vie_locale: { topic: "la vie locale", projectPhrase: "une vie locale animée", indicator: "l'intensité de la vie locale", subject: "une vie locale animée" },
  cadre_calme: { topic: "le cadre calme", projectPhrase: "un cadre calme", indicator: "le calme du cadre de vie", subject: "le calme" },
  viabilite_emploi: { topic: "le bassin d'emploi", projectPhrase: "un bassin d'emploi dynamique", indicator: "le dynamisme du bassin d'emploi", subject: "le dynamisme du bassin d'emploi" },
  acces_services: { topic: "l'accès aux services du quotidien", projectPhrase: "un bon accès aux services du quotidien", indicator: "l'accès aux services et commerces du quotidien", subject: "l'accès aux services du quotidien" },
  ensoleillement_recherche: {
    topic: "l'ensoleillement",
    projectPhrase: "un territoire ensoleillé",
    indicator: "l'ensoleillement du territoire",
    subject: "l'ensoleillement",
    limitation: "Cette position décrit la climatologie solaire de référence issue de la réanalyse ERA5-Land, normale 1991-2020. Elle ne constitue pas une projection de l'ensoleillement futur.",
  },
  douceur_climat: {
    topic: "la douceur des hivers",
    projectPhrase: "des hivers doux",
    indicator: "la douceur des hivers",
    subject: "la douceur des hivers",
    limitation: "Cette position décrit la douceur hivernale (température moyenne de décembre à février) sur la période de référence 1976-2005. Les fortes chaleurs estivales, notamment futures, sont traitées à part.",
  },
};
