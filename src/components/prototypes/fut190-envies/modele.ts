// FUT-190 · PROTOTYPE « ENVIES » · MODÈLE PUR.
//
// Hypothèse : la portée éclaire certaines envies, avec les compromis du Projet et aujourd'hui.
// Un rythme ne prouve ni une limite acceptable ni l'accessibilité réelle d'une pratique.
//
//   envie + rythme  →  une limite de trajet déclarée  →  ce qui est recensé en deçà, lieu par lieu
//                   →  ce que le lieu demande, ce qu'on ignore  →  la question qui peut départager.
//
// Invariants (testés dans `modele.test.ts`) :
//   - aucun score, aucun total, aucun décompte d'envies « tenues » ; aucun lieu n'est dit meilleur ;
//   - ce que futur•e ne sait pas lire n'est jamais rangé comme un défaut du lieu, ni comme un atout ;
//   - une réponse personnelle ne modifie pas le fait public ; sa date ne prouve pas sa provenance ;
//   - la limite est celle de la personne : le rythme n'en propose qu'une valeur de départ.
import {
  CATALOGUE, LIEUX, PROJET, type CatalogueEnvie, type CleEnvie, type IdLieu, type LectureLieu, type Question, type Repere, type Reponse,
} from "./donnees.ts";

export type Intention = "garder" | "developper" | "decouvrir";
export type Rythme = "semaine" | "mois" | "annee";
export type Envie = { id: string; cle: CleEnvie; texte: string; intention: Intention; rythme: Rythme; limite: number };
export type Reponses = Record<string, { valeur: string; date: string }>;

export const LIBELLE_INTENTION: Record<Intention, string> = { garder: "À garder", developper: "À développer", decouvrir: "À découvrir" };
export const QUESTION_INTENTION: Record<Intention, string> = { garder: "Oui, et je veux le garder", developper: "Un peu, j'en voudrais plus", decouvrir: "Pas encore" };
export const LIBELLE_RYTHME: Record<Rythme, string> = { semaine: "chaque semaine", mois: "chaque mois", annee: "quelques fois par an" };
/** Valeur de départ de la limite : une hypothèse de conception, que la personne corrige. */
export const LIMITE_PAR_RYTHME: Record<Rythme, number> = { semaine: 20, mois: 40, annee: 60 };
export const LIMITES = [15, 20, 30, 40, 60] as const;

const sansAccent = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Reconnaître une envie dans un texte libre. Prototype : des mots, aucun modèle de langage. */
export function reconnaitre(texte: string): CleEnvie {
  const t = sansAccent(texte);
  for (const c of Object.values(CATALOGUE)) if (c.mots.some((m) => t.includes(sansAccent(m)))) return c.cle;
  return "libre";
}

export function nouvelleEnvie(texte: string, intention: Intention, rythme: Rythme, n: number): Envie {
  const cle = reconnaitre(texte);
  return { id: `e${n}`, cle, texte: texte.trim(), intention, rythme, limite: LIMITE_PAR_RYTHME[rythme] };
}

/** Le rythme ne remplace jamais la limite déjà présentée ou choisie. */
export function reglerEnvie(e: Envie, reglage: Partial<Pick<Envie, "rythme" | "limite" | "intention">>): Envie {
  return { ...e, ...reglage };
}

export const catalogue = (e: Envie): CatalogueEnvie | null => (e.cle === "libre" ? null : CATALOGUE[e.cle]);
export const titreEnvie = (e: Envie) => catalogue(e)?.compris ?? majuscule(e.texte);
const majuscule = (t: string) => (t ? t[0]!.toUpperCase() + t.slice(1) : t);

export const MODE: Record<Repere["mode"] | "en_transport", string> = { a_pied: "à pied", en_voiture: "en voiture", en_transport: "en transport" };

// ── La lecture d'un lieu pour une envie ──────────────────────────────────────────────────────

export type EtatPortee = "sur_place" | "a_portee" | "hors_portee" | "non_su";
export type LecturePortee = {
  lieu: IdLieu; nom: string; etat: EtatPortee;
  plusProche: Repere | null;
  /** À portée, mais à moins de cinq minutes de la limite. */
  deJustesse: boolean;
  /** Une phrase courte, pour le tableau d'ensemble. */
  court: string;
  /** Réserves pratiques, distinctes de l'état temporel et des faits publics. */
  reserve: string;
  lecture: LectureLieu | null;
  /** Les vérifications déjà répondues pour ce lieu : elles s'ajoutent à la lecture, sans la remplacer. */
  verifiees: { question: Question; reponse: Reponse; date: string }[];
};

export function texteReponse(r: LecturePortee["verifiees"][number]): string {
  return `Votre réponse du ${dateFr(r.date)} (source non renseignée) : ${r.reponse.effet} Reste à vérifier : ${r.reponse.reste}`;
}

export function lireLieu(e: Envie, id: IdLieu, reponses: Reponses = {}): LecturePortee {
  const nom = LIEUX.find((l) => l.id === id)!.nom;
  const c = catalogue(e);
  if (!c) return { lieu: id, nom, etat: "non_su", plusProche: null, deJustesse: false, court: "futur•e ne sait pas le lire", reserve: "Aucune conclusion sur ce lieu.", lecture: null, verifiees: [] };
  const lecture = c.lieux[id];
  const verifiees = c.questions.filter((q) => q.lieu === id && reponses[q.id]).map((q) => ({ question: q, reponse: q.reponses.find((r) => r.valeur === reponses[q.id]!.valeur)!, date: reponses[q.id]!.date })).filter((v) => v.reponse);
  const plusProche = lecture.reperes.length ? [...lecture.reperes].sort((a, b) => a.minutes - b.minutes)[0]! : null;
  const tension = plusProche?.mode === "en_voiture" && PROJET.priorites.includes("moins dépendre de la voiture")
    ? `À ${nom}, le trajet retenu se fait en voiture : il entre en tension avec votre priorité « moins dépendre de la voiture », pour une pratique ${LIBELLE_RYTHME[e.rythme]}. ` : "";
  const reserve = [
    c.porteeUtile ? `${tension}Les trajets en transports collectifs ne sont pas calculés : une autre solution reste inconnue, pas impossible. Le trajet ne garantit ni les horaires, ni les places, ni la pratique réelle.`
      : "La disponibilité et la cultivabilité restent à établir : sol, eau, exposition et droit d'usage ne sont pas vérifiés.",
    ...verifiees.map(texteReponse),
  ].join(" ");
  if (!plusProche) return { lieu: id, nom, etat: "non_su", plusProche: null, deJustesse: false, court: "aucun repère connu de futur•e", reserve, lecture, verifiees };
  if (!c.porteeUtile || plusProche.minutes === 0) return { lieu: id, nom, etat: "sur_place", plusProche, deJustesse: false, court: `sur place (${plusProche.illustratif ? "jardin déclaré dans une annonce fictive, cultivabilité non établie" : "recensé"})`, reserve, lecture, verifiees };
  const dedans = plusProche.minutes <= e.limite;
  const trajet = `${plusProche.minutes} min ${MODE[plusProche.mode]}`;
  return {
    lieu: id, nom, etat: dedans ? "a_portee" : "hors_portee", plusProche, deJustesse: dedans && e.limite - plusProche.minutes <= 5,
    court: dedans ? `à ${trajet}, dans votre limite de ${e.limite} min` : `à ${trajet}, au-delà de vos ${e.limite} min`, reserve, lecture, verifiees,
  };
}

// ── Ce que l'envie change entre les deux lieux ───────────────────────────────────────────────

export type Ecart = "distingue" | "nuance" | "pareil" | "a_verifier" | "non_lu";
export type Comparaison = { envie: Envie; lectures: [LecturePortee, LecturePortee]; ecart: Ecart; phrase: string };

export const TITRE_ECART: Record<Ecart, string> = {
  distingue: "Des trajets différents face à votre limite",
  nuance: "Des trajets et des compromis différents",
  pareil: "Des temps proches, une pratique à confirmer",
  a_verifier: "Des possibilités qui restent à vérifier",
  non_lu: "futur•e ne sait pas comparer les deux lieux sur ce point",
};

const dansLaLimite = (l: LecturePortee) => l.etat === "a_portee";

export function comparer(e: Envie, reponses: Reponses = {}): Comparaison {
  const [a, b] = LIEUX.map((l) => lireLieu(e, l.id, reponses)) as [LecturePortee, LecturePortee];
  const base = { envie: e, lectures: [a, b] as [LecturePortee, LecturePortee] };
  const c = catalogue(e);
  if (!c) return { ...base, ecart: "non_lu", phrase: "futur•e n'a aucune donnée pour lire cette envie. Elle reste dans votre Projet, avec vos propres vérifications." };
  const reponsesPersonnelles = [a, b].flatMap((l) => l.verifiees.map(texteReponse)).join(" ");
  if (!c.porteeUtile) return {
    ...base, ecart: "a_verifier",
    phrase: `À Chalonnes-sur-Loire, le jardin de 400 m² est déclaré dans une annonce fictive : une piste pour cultiver, si sa disponibilité et sa cultivabilité sont confirmées. À Angers, aucun jardin partagé n'est recensé dans les sources examinées ; ce n'est pas une preuve d'absence. Sol, eau, exposition et droit d'usage restent à vérifier. ${reponsesPersonnelles}`.trim(),
  };
  const avecReponse = a.verifiees.length + b.verifiees.length > 0;
  const ecart: Ecart = avecReponse ? "a_verifier" : dansLaLimite(a) !== dansLaLimite(b) ? "distingue"
    : a.plusProche?.mode !== b.plusProche?.mode || Math.abs((a.plusProche?.minutes ?? 0) - (b.plusProche?.minutes ?? 0)) >= 15 ? "nuance" : "pareil";
  const voiture = [a, b].filter((l) => l.plusProche?.mode === "en_voiture");
  const compromis = voiture.length && PROJET.priorites.includes("moins dépendre de la voiture")
    ? `À ${voiture.map((l) => l.nom).join(" et à ")}, ce trajet exige la voiture et entre en tension avec votre priorité « moins dépendre de la voiture ».` : "";
  return {
    ...base, ecart,
    phrase: `Pour ${c.verbe} ${LIBELLE_RYTHME[e.rythme]}, le trajet calculé est ${a.court} depuis ${a.nom} ; ${b.court} depuis ${b.nom}. ${compromis} Les temps en transports collectifs ne sont pas disponibles : une autre solution reste inconnue, pas impossible. Ces temps ne prouvent pas que la pratique est accessible : horaires et places restent à vérifier. ${reponsesPersonnelles}`.trim(),
  };
}

// ── Par rapport à aujourd'hui ────────────────────────────────────────────────────────────────

export type Changement = "plus_pres" | "plus_loin" | "pareil" | "autrement" | "nouveau" | "perdu" | "inconnu";
export const TITRE_CHANGEMENT: Record<Changement, string> = {
  plus_pres: "Plus près qu'aujourd'hui", plus_loin: "Plus loin qu'aujourd'hui", pareil: "Comme aujourd'hui", autrement: "Le même temps, un autre moyen",
  nouveau: "Ce que vous n'avez pas aujourd'hui", perdu: "Ce que vous perdriez", inconnu: "Inconnu pour l'instant",
};

export function faceAAujourdhui(e: Envie, l: LecturePortee): { changement: Changement; phrase: string } {
  const c = catalogue(e);
  if (!c || l.etat === "non_su") return { changement: "inconnu", phrase: `À ${l.nom}, futur•e ne sait pas dire ce qui changerait pour vous.` };
  const auj = c.aujourdhui;
  if (auj.minutes == null) {
    return l.etat === "sur_place"
      ? { changement: "nouveau", phrase: `À ${l.nom}, l'annonce fictive déclare un jardin, contrairement à aujourd'hui. Cela ne prouve pas que vous pourriez le cultiver : sol, eau, exposition et droit d'usage restent à vérifier.` }
      : { changement: "inconnu", phrase: `À ${l.nom}, rien n'est établi.` };
  }
  const p = l.plusProche!;
  const modeAuj = auj.mode ? MODE[auj.mode] : "";
  const change = auj.mode && auj.mode !== p.mode;
  const avant = `${auj.minutes} min ${modeAuj}`.trim(), apres = `${p.minutes} min ${MODE[p.mode]}`;
  if (l.etat === "hors_portee" && e.intention === "garder") return { changement: "perdu", phrase: `Aujourd'hui ${avant}. À ${l.nom}, ${apres} : au-delà de ce que vous acceptez pour le faire ${LIBELLE_RYTHME[e.rythme]}.` };
  if (p.minutes <= auj.minutes - 4) return { changement: "plus_pres", phrase: `Aujourd'hui ${avant}. À ${l.nom}, ${apres}.` };
  if (p.minutes >= auj.minutes + 4) return { changement: "plus_loin", phrase: `Aujourd'hui ${avant}. À ${l.nom}, ${apres}.` };
  return { changement: change ? "autrement" : "pareil", phrase: `Aujourd'hui ${avant}. À ${l.nom}, ${apres}${change ? " : le temps est proche, le moyen change" : ""}.` };
}

// ── La question qui peut départager ──────────────────────────────────────────────────────────

const RANG_INTENTION: Record<Intention, number> = { garder: 0, developper: 1, decouvrir: 2 };
const RANG_RYTHME: Record<Rythme, number> = { semaine: 0, mois: 1, annee: 2 };

/** L'ordre des envies : ce que l'on veut garder d'abord (une perte se voit avant un gain), puis le plus fréquent. */
export const ordonner = (es: Envie[]) => [...es].sort((a, b) => RANG_INTENTION[a.intention] - RANG_INTENTION[b.intention] || RANG_RYTHME[a.rythme] - RANG_RYTHME[b.rythme]);

export function questionsDe(e: Envie): Question[] { return catalogue(e)?.questions ?? []; }

/**
 * LA question la plus utile : d'abord celle dont la réponse peut changer ce qui distingue les lieux,
 * pour une envie que futur•e ne sait pas trancher ; sinon la première encore ouverte.
 */
export function questionUtile(envies: Envie[], reponses: Reponses): { envie: Envie; question: Question } | null {
  const ouvertes = ordonner(envies).flatMap((e) => questionsDe(e).filter((q) => !reponses[q.id]).map((q) => ({ envie: e, question: q })));
  const poids = (x: { envie: Envie; question: Question }) => {
    const ecart = comparer(x.envie, reponses).ecart;
    return (x.question.departage ? 0 : 2) + (ecart === "a_verifier" ? 0 : 1);
  };
  return ouvertes.sort((a, b) => poids(a) - poids(b))[0] ?? null;
}

// ── La première lecture ──────────────────────────────────────────────────────────────────────

export type ARetenir = { distinguent: string[]; aVerifier: string[]; pareils: string[]; nonLus: string[]; perte: string | null };

export function aRetenir(envies: Envie[], reponses: Reponses): ARetenir {
  const r: ARetenir = { distinguent: [], aVerifier: [], pareils: [], nonLus: [], perte: null };
  const pertes: string[] = [];
  for (const e of ordonner(envies)) {
    const c = comparer(e, reponses);
    if (c.ecart === "distingue" || c.ecart === "nuance") r.distinguent.push(c.phrase);
    else if (c.ecart === "a_verifier") r.aVerifier.push(c.phrase);
    else if (c.ecart === "pareil") r.pareils.push(c.phrase);
    else r.nonLus.push(`« ${majuscule(e.texte)} » : ${c.phrase}`);
    if (e.intention === "garder") {
      const f = c.lectures.map((l) => faceAAujourdhui(e, l));
      if (c.lectures.every((l, i) => f[i]!.changement === "plus_loin" || f[i]!.changement === "perdu" || (f[i]!.changement === "autrement" && l.plusProche?.mode === "en_voiture"))) pertes.push(`${titreEnvie(e)} : dans les deux cas, les trajets retenus utilisent la voiture, contre la marche aujourd'hui (${c.lectures.map((l) => `${l.nom}, ${l.court.replace(/^à /, "")}`).join(" ; ")}). Cela entre en tension avec votre priorité « moins dépendre de la voiture ». Les alternatives en transports collectifs et la pratique réelle restent à vérifier.`);
    }
  }
  r.perte = pertes[0] ?? null;
  return r;
}

export function ouVousEnEtes(envies: Envie[], reponses: Reponses): string {
  if (!envies.length) return "Deux communes, une annonce dans chacune. Votre Projet les distingue déjà sur la voiture, le prix et la verdure.";
  const n = envies.flatMap(questionsDe).filter((q) => reponses[q.id]).length;
  const k = envies.length === 1 ? `l'envie que vous avez ajoutée` : `vos ${["", "", "deux", "trois", "quatre", "cinq"][envies.length] ?? envies.length} envies`;
  return `Deux communes, une annonce dans chacune, et ${k}. ${n ? `${n === 1 ? "Une réponse personnelle est enregistrée" : `${n} réponses personnelles sont enregistrées`}, sans source vérifiée.` : "Aucune réponse personnelle n'est encore enregistrée."}`;
}

export function dateFr(iso: string): string {
  const [, m, j] = iso.split("-");
  const mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."][Number(m) - 1];
  return `${Number(j)} ${mois}`;
}

// ── Situations de démonstration ──────────────────────────────────────────────────────────────

export type Vue = { ecran: "ensemble" | "comparer" | "projet" } | { ecran: "lieu"; id: IdLieu };
export type Situation = { id: string; titre: string; resume: string; envies: Envie[]; reponses: Reponses; vue: Vue };

const E_THEATRE = nouvelleEnvie("aller plus souvent au théâtre", "developper", "mois", 1);
const E_POTAGER = nouvelleEnvie("cultiver une partie de mon alimentation", "developper", "semaine", 2);
const E_NAGER = nouvelleEnvie("nager deux fois par semaine", "garder", "semaine", 3);
const E_LIBRE = nouvelleEnvie("m'engager dans la vie de ma commune", "decouvrir", "mois", 4);

export const SITUATIONS: Situation[] = [
  { id: "depart", titre: "Point de départ : aucune envie", resume: "Deux communes déjà gardées. L'entrée par les envies est facultative : elle se trouve dans Mon Projet et, discrètement, sur la vue d'ensemble.", envies: [], reponses: {}, vue: { ecran: "ensemble" } },
  { id: "theatre", titre: "Une envie culturelle : le théâtre (lieux recensés, pratique à vérifier)", resume: "Les lieux sont recensés et les trajets estimés. Ajustez rythme et limite : le compromis avec la voiture reste visible.", envies: [E_THEATRE], reponses: {}, vue: { ecran: "comparer" } },
  { id: "potager", titre: "Une envie d'autonomie : cultiver (preuve partielle ou absente)", resume: "Un jardin déclaré d'un côté, aucun recensement de l'autre. La comparaison s'arrête sur une question.", envies: [E_POTAGER], reponses: {}, vue: { ecran: "comparer" } },
  { id: "nager", titre: "Une habitude à garder : nager", resume: "La marche d'aujourd'hui est comparée aux trajets calculés en voiture. Les autres solutions restent inconnues.", envies: [E_NAGER], reponses: {}, vue: { ecran: "comparer" } },
  { id: "trois", titre: "Trois envies ensemble", resume: "Garder, développer, développer. Les lieux ne répondent pas aux mêmes.", envies: [E_NAGER, E_THEATRE, E_POTAGER], reponses: {}, vue: { ecran: "comparer" } },
  { id: "libre", titre: "Une envie que futur•e ne sait pas lire", resume: "L'envie est gardée, sans donnée inventée. Rien n'est conclu.", envies: [E_LIBRE], reponses: {}, vue: { ecran: "comparer" } },
  { id: "apres", titre: "Après deux vérifications", resume: "Deux réponses personnelles simulées et datées, sans source vérifiée. Les faits publics et les inconnues restent visibles.", envies: [E_NAGER, E_THEATRE, E_POTAGER], reponses: { "q-potager-parcelle": { valeur: "long", date: "2026-11-06" }, "q-theatre-retour": { valeur: "non", date: "2026-11-07" } }, vue: { ecran: "comparer" } },
];
