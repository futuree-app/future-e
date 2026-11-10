// FUT-190 · PROTOTYPE « ENVIES » · MODÈLE PUR.
//
// L'idée éprouvée ici : une envie ne devient utile à une décision résidentielle que si elle est
// traduite en PORTÉE. « Aller au théâtre » ne compare rien ; « y aller chaque mois, donc à 40 minutes
// au plus » se compare entre deux lieux, et se compare à aujourd'hui.
//
//   envie + rythme  →  une limite de trajet déclarée  →  ce qui est recensé en deçà, lieu par lieu
//                   →  ce que le lieu demande, ce qu'on ignore  →  la question qui peut départager.
//
// Invariants (testés dans `modele.test.ts`) :
//   - aucun score, aucun total, aucun décompte d'envies « tenues » ; aucun lieu n'est dit meilleur ;
//   - ce que futur•e ne sait pas lire n'est jamais rangé comme un défaut du lieu, ni comme un atout ;
//   - une réponse de vérification ne modifie pas le fait public : elle s'ajoute, attribuée et datée ;
//   - la limite est celle de la personne : le rythme n'en propose qu'une valeur de départ.
import {
  CATALOGUE, LIEUX, type CatalogueEnvie, type CleEnvie, type IdLieu, type LectureLieu, type Question, type Repere, type Reponse,
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
  lecture: LectureLieu | null;
  /** Les vérifications déjà répondues pour ce lieu : elles s'ajoutent à la lecture, sans la remplacer. */
  verifiees: { question: Question; reponse: Reponse; date: string }[];
};

export function lireLieu(e: Envie, id: IdLieu, reponses: Reponses = {}): LecturePortee {
  const nom = LIEUX.find((l) => l.id === id)!.nom;
  const c = catalogue(e);
  if (!c) return { lieu: id, nom, etat: "non_su", plusProche: null, deJustesse: false, court: "futur•e ne sait pas le lire", lecture: null, verifiees: [] };
  const lecture = c.lieux[id];
  const verifiees = c.questions.filter((q) => q.lieu === id && reponses[q.id]).map((q) => ({ question: q, reponse: q.reponses.find((r) => r.valeur === reponses[q.id]!.valeur)!, date: reponses[q.id]!.date })).filter((v) => v.reponse);
  const plusProche = lecture.reperes.length ? [...lecture.reperes].sort((a, b) => a.minutes - b.minutes)[0]! : null;
  if (!plusProche) return { lieu: id, nom, etat: "non_su", plusProche: null, deJustesse: false, court: "aucun repère connu de futur•e", lecture, verifiees };
  if (!c.porteeUtile || plusProche.minutes === 0) return { lieu: id, nom, etat: "sur_place", plusProche, deJustesse: false, court: `sur place (${plusProche.illustratif ? "déclaré par l'annonce" : "recensé"})`, lecture, verifiees };
  const dedans = plusProche.minutes <= e.limite;
  const trajet = `${plusProche.minutes} min ${MODE[plusProche.mode]}`;
  return {
    lieu: id, nom, etat: dedans ? "a_portee" : "hors_portee", plusProche, deJustesse: dedans && e.limite - plusProche.minutes <= 5,
    court: dedans ? `à ${trajet}` : `à ${trajet}, au-delà de vos ${e.limite} min`, lecture, verifiees,
  };
}

// ── Ce que l'envie change entre les deux lieux ───────────────────────────────────────────────

export type Ecart = "distingue" | "nuance" | "pareil" | "a_verifier" | "non_lu";
export type Comparaison = { envie: Envie; lectures: [LecturePortee, LecturePortee]; ecart: Ecart; phrase: string };

export const TITRE_ECART: Record<Ecart, string> = {
  distingue: "Cette envie distingue les deux lieux",
  nuance: "Possible des deux côtés, pas de la même façon",
  pareil: "Cette envie ne distingue pas les deux lieux",
  a_verifier: "Cette envie pourrait les distinguer : il manque une réponse",
  non_lu: "futur•e ne sait pas comparer les deux lieux sur ce point",
};

const possible = (l: LecturePortee) => l.etat === "a_portee" || l.etat === "sur_place";

export function comparer(e: Envie, reponses: Reponses = {}): Comparaison {
  const [a, b] = LIEUX.map((l) => lireLieu(e, l.id, reponses)) as [LecturePortee, LecturePortee];
  const base = { envie: e, lectures: [a, b] as [LecturePortee, LecturePortee] };
  const c = catalogue(e);
  if (!c) return { ...base, ecart: "non_lu", phrase: "futur•e n'a aucune donnée pour lire cette envie. Elle reste dans votre Projet, avec vos propres vérifications." };
  const v = c.verbe;
  const inconnus = [a, b].filter((l) => l.etat === "non_su");
  if (inconnus.length) {
    const connu = [a, b].find((l) => l.etat !== "non_su");
    const x = inconnus[0]!;
    const tranchee = x.verifiees.find((r) => r.question.departage);
    if (tranchee) {
      return tranchee.reponse.bascule === "ouvre"
        ? { ...base, ecart: "nuance", phrase: `D'après votre vérification du ${dateFr(tranchee.date)}, ${v} devient possible à ${x.nom} aussi. ${connu && possible(connu) ? `À ${connu.nom}, c'est ${connu.court}.` : ""}`.trim() }
        : { ...base, ecart: "distingue", phrase: `D'après votre vérification du ${dateFr(tranchee.date)}, ${connu && possible(connu) ? `seul ${connu.nom} vous permet de ${v} dès l'emménagement.` : `${v} reste hors de portée à ${x.nom}.`}` };
    }
    return { ...base, ecart: "a_verifier", phrase: connu && possible(connu) ? `À ${connu.nom}, ${v} est possible ${connu.court}. À ${x.nom}, futur•e ne le sait pas : une vérification peut le dire.` : `futur•e ne sait pas si ${v} est possible à ${inconnus.map((l) => l.nom).join(" ni à ")}.` };
  }
  if (possible(a) !== possible(b)) {
    const oui = possible(a) ? a : b, non = possible(a) ? b : a;
    return { ...base, ecart: "distingue", phrase: `Au rythme que vous indiquez (${LIBELLE_RYTHME[e.rythme]}, ${e.limite} min au plus), ${v} est à votre portée à ${oui.nom} (${oui.court.replace(/^à /, "")}), et ne l'est pas à ${non.nom} (${non.plusProche!.minutes} min ${MODE[non.plusProche!.mode]}).` };
  }
  if (!possible(a)) return { ...base, ecart: "pareil", phrase: `À ce rythme (${e.limite} min au plus), aucun des deux lieux ne met ${v} à votre portée : ${a.nom} est ${a.court.split(",")[0]}, ${b.nom} ${b.court.split(",")[0]}.` };
  const modes = a.plusProche!.mode !== b.plusProche!.mode;
  const ecartMin = Math.abs(a.plusProche!.minutes - b.plusProche!.minutes);
  if (modes || ecartMin >= 15) {
    return { ...base, ecart: "nuance", phrase: `${majuscule(v)} est à votre portée des deux côtés : ${a.court} depuis ${a.nom}, ${b.court} depuis ${b.nom}${b.deJustesse || a.deJustesse ? `, tout près de votre limite de ${e.limite} min` : ""}.` };
  }
  return { ...base, ecart: "pareil", phrase: `${majuscule(v)} est à votre portée des deux côtés, à des temps proches (${a.court.replace(/^à /, "")} et ${b.court.replace(/^à /, "")}).` };
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
      ? { changement: "nouveau", phrase: `À ${l.nom}, vous auriez ce que vous n'avez pas aujourd'hui, si l'annonce dit vrai.` }
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
      if (c.lectures.every((l, i) => f[i]!.changement === "plus_loin" || f[i]!.changement === "perdu" || (f[i]!.changement === "autrement" && l.plusProche?.mode === "en_voiture"))) pertes.push(`${titreEnvie(e)} : dans les deux cas, ce sera moins simple qu'aujourd'hui (${c.lectures.map((l) => `${l.nom}, ${l.court.replace(/^à /, "")}`).join(" ; ")}).`);
    }
  }
  r.perte = pertes[0] ?? null;
  return r;
}

export function ouVousEnEtes(envies: Envie[], reponses: Reponses): string {
  if (!envies.length) return "Deux communes, une annonce dans chacune. Votre Projet les distingue déjà sur la voiture, le prix et la verdure.";
  const n = envies.flatMap(questionsDe).filter((q) => reponses[q.id]).length;
  const k = envies.length === 1 ? `l'envie que vous avez ajoutée` : `vos ${["", "", "deux", "trois", "quatre", "cinq"][envies.length] ?? envies.length} envies`;
  return `Deux communes, une annonce dans chacune, et ${k}. ${n ? `${n === 1 ? "Une vérification est faite" : `${n} vérifications sont faites`}.` : "Aucune vérification n'est encore faite."}`;
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
  { id: "theatre", titre: "Une envie culturelle : le théâtre (preuve disponible)", resume: "Les lieux de spectacle sont recensés et les trajets estimés. Changez le rythme : la même donnée ne dit plus la même chose.", envies: [E_THEATRE], reponses: {}, vue: { ecran: "comparer" } },
  { id: "potager", titre: "Une envie d'autonomie : cultiver (preuve partielle ou absente)", resume: "Un jardin déclaré d'un côté, aucun recensement de l'autre. La comparaison s'arrête sur une question.", envies: [E_POTAGER], reponses: {}, vue: { ecran: "comparer" } },
  { id: "nager", titre: "Une habitude à garder : nager", resume: "Ce que la personne vit déjà sert de référence. Les deux lieux la lui rendent moins simple.", envies: [E_NAGER], reponses: {}, vue: { ecran: "comparer" } },
  { id: "trois", titre: "Trois envies ensemble", resume: "Garder, développer, développer. Les lieux ne répondent pas aux mêmes.", envies: [E_NAGER, E_THEATRE, E_POTAGER], reponses: {}, vue: { ecran: "comparer" } },
  { id: "libre", titre: "Une envie que futur•e ne sait pas lire", resume: "L'envie est gardée, sans donnée inventée. Rien n'est conclu.", envies: [E_LIBRE], reponses: {}, vue: { ecran: "comparer" } },
  { id: "apres", titre: "Après deux vérifications", resume: "Les réponses s'ajoutent, attribuées et datées. Les faits publics ne changent pas.", envies: [E_NAGER, E_THEATRE, E_POTAGER], reponses: { "q-potager-parcelle": { valeur: "long", date: "2026-11-06" }, "q-theatre-retour": { valeur: "non", date: "2026-11-07" } }, vue: { ecran: "comparer" } },
];
