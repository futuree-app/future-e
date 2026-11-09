// FUT-41 V5.1 · LA PREMIÈRE LECTURE. Aucune règle nouvelle : tout vient de la confrontation V5
// (contrat FUT-22) et de ses phrases. Ce module ne fait que RANGER ce que la V5 sait déjà, pour que
// l'écran dise d'abord ce qu'il faut retenir, puis pourquoi, puis le détail :
//   · établi    : une condition étudiée de la même façon des deux côtés, et qui les distingue ;
//   · incertain : une condition qui pourrait encore les distinguer, ou qu'on ne peut pas encore comparer ;
//   · pareil    : une condition qui ne les distingue pas (dite une fois, en une ligne) ;
//   · non étudié: ce qui manque pour chaque possibilité, dit une fois par possibilité.
// Garde-fous : une catégorie vide disparaît ; rien d'inconnu n'est rangé en défaut ; une lecture de la
// commune n'est jamais présentée comme celle d'un logement ; la condition sans compromis a sa ligne propre.
import {
  alertes, analyseServie, confronter, libelleCritere, criteresDepasses, dateCourte, enBref, estEtabli, gestePrincipal, LIBELLE_ISSUE_SIMPLE,
  type CleCritere, type Commune, type CoucheLue, type Geste, type LigneConfrontation, type Logement, type Piste, type Recherche,
} from "../fut41-v5/modele5.ts";

export type Rang = { ligne: LigneConfrontation; couche: CoucheLue };
export type Pareil = { cle: CleCritere; libelle: string; texte: string };
export type NonEtudie = { pisteId: string; nom: string; conditions: string[]; raison: string };
export type Avancer = { pisteId: string; nom: string; texte: string; bouton: string; genre: "question" | "geste"; geste?: Geste["cle"]; nbQuestions?: number };

export type Lecture51 = {
  /** Les phrases de la V5, dans l'ordre où l'on retient : condition sans compromis, différences, ce qui peut encore changer, ce qui manque. */
  sansCompromis: string | null;
  /** Une analyse de commune écrite sous une autre limite : à revoir (fait daté, jamais un verdict actuel). */
  aRevoir: string[];
  distingue: string | null;
  /** Vrai quand la différence n'existe qu'entre les COMMUNES de logements comparés : un contexte, pas un écart entre logements. */
  distingueCommunesSeulement: boolean;
  peutChanger: string | null;
  manque: string | null;
  etablis: Rang[];
  incertains: Rang[];
  pareils: Pareil[];
  nonEtudies: NonEtudie[];
  avancer: Avancer[];
};

/** Les conditions dites dans une phrase (« pas encore étudié pour le calme et les nuits fraîches »). */
const POUR51: Record<CleCritere, string> = { mer: "la mer", gare: "la gare", nuits: "les nuits fraîches", calme: "le calme", medecin: "un médecin disponible", quartier: "la vie de quartier" };

const idDe = (p: Piste) => (p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id);
const nomDe = (p: Piste) => (p.type === "commune" ? p.commune.nom : p.logement.libelle);
const listeFr = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

/**
 * La couche qui décide, pour une condition : pour des logements, celle de l'adresse dès qu'elle a
 * été étudiée pour l'un d'eux (la commune n'y est qu'un contexte) ; la commune sinon. Un médecin
 * disponible ne se lit à aucune adresse : sa couche est toujours la commune.
 */
function coucheDecisive(li: LigneConfrontation, logements: boolean): { couche: CoucheLue | null; adresseNonEtudiee: CoucheLue | null } {
  const commune = li.couches.find((x) => x.couche === "commune") ?? null;
  if (!logements) return { couche: commune, adresseNonEtudiee: null };
  const adresse = li.couches.find((x) => x.couche !== "commune") ?? null;
  if (!adresse) return { couche: commune, adresseNonEtudiee: null };
  if (adresse.cellules.some((c) => c.ligne)) return { couche: adresse, adresseNonEtudiee: null };
  return { couche: null, adresseNonEtudiee: adresse };
}

export function lecture51(r: Recherche, pistes: Piste[], droits: "unite" | "pass" = "unite"): Lecture51 {
  const conf = confronter(r, pistes);
  const logements = conf.colonnes.some((c) => c.type === "logement");
  const nomCol = (id: string) => conf.colonnes.find((c) => c.id === id)?.nom ?? id;
  const bref = enBref(r, pistes);
  const titre = (t: string) => bref.find((x) => x.titre === t)?.texte ?? null;
  const dist = titre("Ce qui les distingue");

  const etablis: Rang[] = []; const incertains: Rang[] = []; const pareils: Pareil[] = [];
  const manquants = new Map<string, { conditions: string[]; etats: Set<string> }>();
  const noter = (id: string, cle: CleCritere, etat: string) => {
    const m = manquants.get(id) ?? { conditions: [], etats: new Set<string>() };
    if (!m.conditions.includes(POUR51[cle])) m.conditions.push(POUR51[cle]);
    m.etats.add(etat); manquants.set(id, m);
  };

  for (const li of conf.lignes) {
    if (li.sansCompromis) continue; // dite par sa propre ligne, une seule fois (Z12)
    const { couche, adresseNonEtudiee } = coucheDecisive(li, logements);
    if (adresseNonEtudiee) { for (const c of adresseNonEtudiee.cellules) for (const id of c.ids) noter(id, li.cle, c.etat); continue; }
    if (!couche) continue;
    const lues = couche.cellules.filter((c) => c.ligne);
    for (const c of couche.cellules) if (!c.ligne && !c.bloque) for (const id of c.ids) noter(id, li.cle, c.etat);
    switch (couche.verdict) {
      case "distingue": etablis.push({ ligne: li, couche }); break;
      case "pourrait": case "pas_comparable": case "inconnu": incertains.push({ ligne: li, couche }); break;
      case "pas_assez_lu": if (lues.length) incertains.push({ ligne: li, couche }); break;
      case "pareil": case "une_lecture": {
        // « Pareil » ne vaut que pour une issue établie : deux « à vérifier » ne sont pas une ressemblance.
        if (!lues.every((c) => estEtabli(c.ligne))) { incertains.push({ ligne: li, couche }); break; }
        const issue = LIBELLE_ISSUE_SIMPLE[lues[0]!.ligne!.issue].toLowerCase();
        const mesures = lues.flatMap((c) => (c.ligne!.mesure ? [`${c.ligne!.mesure.valeur} ${c.ligne!.mesure.unite}`] : []));
        const qui = couche.verdict === "une_lecture"
          ? `même donnée pour ${listeFr(lues.flatMap((c) => c.ids).map(nomCol))}${couche.couche === "commune" && logements ? ", à l'échelle de leur commune" : ""}`
          : `pour ${lues.length > 2 ? "tous" : "les deux"}${mesures.length ? ` (${listeFr(mesures)})` : ""}`;
        pareils.push({ cle: li.cle, libelle: li.libelle, texte: `${issue}, ${qui}` });
        break;
      }
    }
  }

  const raisonDe = (p: Piste, etats: Set<string>) => {
    if (p.type === "commune") return "commune pas encore étudiée pour votre Projet";
    if (etats.has("adresse_manquante")) return "adresse exacte inconnue";
    if (etats.has("a_lire")) return "adresse pas encore analysée";
    return "commune pas encore étudiée";
  };
  const nonEtudies: NonEtudie[] = pistes.flatMap((p) => {
    const m = manquants.get(idDe(p));
    return m ? [{ pisteId: idDe(p), nom: nomDe(p), conditions: m.conditions, raison: raisonDe(p, m.etats) }] : [];
  });

  // Entre des communes seules, la condition sans compromis se dit simplement : elle se mesure depuis une
  // adresse. L'analyse à revoir devient une incertitude datée, dite à part (et non dans la même phrase).
  const k = r.projet.criteres.find((x) => x.nature === "sans_compromis");
  const communesSeules = !logements;
  const aRevoir = communesSeules ? alertes(r, pistes).filter((x) => x.genre === "a_revoir").map((x) => x.phrase.replace(/a été lue quand/, "a été étudiée quand")) : [];
  return {
    sansCompromis: communesSeules && k ? `${libelleCritere(k)} : elle se mesure pour chaque logement, depuis son adresse ; une commune ne la dit pas.` : titre("Votre condition sans compromis"),
    aRevoir,
    distingue: dist && !/^Rien ne les distingue/.test(dist) ? dist : null,
    distingueCommunesSeulement: logements && !etablis.length && !!dist && /^À l'échelle des communes/.test(dist),
    peutChanger: titre("Ce qui pourrait changer votre choix"),
    manque: titre("Ce qui manque"),
    etablis, incertains, pareils, nonEtudies,
    avancer: avancer51(r, pistes, droits),
  };
}

/**
 * POUR AVANCER : les gestes utiles pour les possibilités comparées, une ligne chacun. D'abord ce qui
 * permet de comparer au même niveau (la mise à jour gratuite, l'adresse, l'analyse, le rapport de
 * commune), puis les questions déjà prêtes, à poser soi-même. Jamais un geste qui promettrait ce que l'analyse ne dira pas :
 * le libellé et l'apport viennent du geste V5 (« ne dira pas si un médecin accepte… » reste au panneau).
 */
export function avancer51(r: Recherche, pistes: Piste[], droits: "unite" | "pass"): Avancer[] {
  const out: Avancer[] = [];
  const questions: Avancer[] = [];
  for (const p of pistes) if (p.type === "logement") {
    const n = p.logement.verifications.filter((q) => !q.reponse).length;
    if (n) questions.push({ pisteId: p.logement.id, nom: p.logement.libelle, texte: `${n === 1 ? "Une question prête" : `${n} questions prêtes`} pour la visite ou un appel`, bouton: n === 1 ? "Voir la question" : "Voir les questions", genre: "question", nbQuestions: n });
  }
  const ordre: Geste["cle"][] = ["mettre_a_jour", "adresse", "analyser", "examiner_commune"];
  for (const cle of ordre) for (const p of pistes) {
    const g = gestePrincipal(r, p, droits);
    if (g.cle !== cle) continue;
    const texte = cle === "mettre_a_jour" ? "Relire son analyse avec votre Projet actuel (gratuit)"
      : cle === "adresse" ? "Sans l'adresse exacte, seule la commune peut être étudiée"
        : cle === "analyser" ? "Étudier ses abords et le logement lui-même"
          : "Étudier cette commune pour votre Projet";
    out.push({ pisteId: idDe(p), nom: nomDe(p), texte, bouton: g.libelle, genre: "geste", geste: cle });
  }
  // Ce qui débloque la comparaison passe d'abord ; quand rien ne manque, les questions sont le geste utile.
  return [...out, ...questions];
}

// ── Les deux dimensions d'un logement : votre suivi, et ce que futur•e en sait ─────────────────

/** Votre suivi : le mot de la personne. « Repéré » remplace « À étudier » (hypothèse à tester). */
export function suivi51(l: Logement): { cle: "repere" | "visite_prevue" | "visite_envisagee" | "visite" | "ecarte"; libelle: string } {
  if (l.statut === "ecarte") return { cle: "ecarte", libelle: "Écarté" };
  if (l.statut === "visite") return { cle: "visite", libelle: "Visité" };
  if (l.statut === "a_visiter") return l.visiteLe ? { cle: "visite_prevue", libelle: `Visite le ${dateCourte(l.visiteLe)}` } : { cle: "visite_envisagee", libelle: "Visite envisagée" };
  return { cle: "repere", libelle: "Repéré" };
}

export const LIBELLE_SUIVI51 = { a_etudier: "Repéré", a_visiter: "Visite envisagée ou prévue", visite: "Visité" } as const;

/**
 * Ce que futur•e en sait : trois paliers qui se voient (commune, adresse, analyse) et un mot. Une analyse
 * écrite sous un ancien Projet reste une analyse : elle est « à actualiser », jamais effacée.
 */
export type Connaissance = { paliers: [boolean, boolean, boolean]; actualiser: boolean; libelle: string; detail: string | null };

export function connaissance51(r: Recherche, l: Logement): Connaissance {
  const c: Commune | undefined = r.communes.find((x) => x.insee === l.commune.insee);
  const communeEtudiee = c?.lecture === "rapport";
  const a = analyseServie(l);
  if (a?.perimetre === "commune+adresse") {
    const dep = criteresDepasses(a, r.projet).length > 0;
    return { paliers: [true, true, true], actualiser: dep, libelle: dep ? "Analyse à actualiser" : "Adresse analysée", detail: dep ? `dossier du ${dateCourte(a.generatedAt)}, écrit sous votre Projet d'alors` : `dossier du ${dateCourte(a.generatedAt)}` };
  }
  const commune = communeEtudiee ? `${l.commune.nom} étudiée` : `${l.commune.nom} pas encore étudiée`;
  if (l.adresse) return { paliers: [communeEtudiee, true, false], actualiser: false, libelle: "Adresse connue, pas encore analysée", detail: commune };
  return { paliers: [communeEtudiee, false, false], actualiser: false, libelle: "Adresse inconnue", detail: commune };
}

// ── Ajouter une annonce : les états du parcours (données fictives, aucune page n'est ouverte) ──

export type LectureAnnonce =
  | { etat: "invalide" }
  | { etat: "illisible"; site: string }
  | { etat: "reconnue"; site: string; miniature: boolean; valeurs: { titre: string; montant: number; surface: number; pieces: number; nature: "vente" | "location"; commune: string } };

/**
 * PROTOTYPE SEULEMENT. Aucun lien n'est ouvert : l'état dépend du texte du lien, pour montrer les trois
 * situations du parcours. En production, des valeurs ne viendraient que d'une voie autorisée (accord ou
 * flux d'un site d'annonces) ; sinon la personne les saisit ou colle le texte de l'annonce.
 */
export function lireAnnonce51(url: string): LectureAnnonce {
  let u: URL;
  try { u = new URL(url.trim()); } catch { return { etat: "invalide" }; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { etat: "invalide" };
  const site = u.hostname.replace(/^www\./, "");
  if (!/exemple/.test(url)) return { etat: "illisible", site };
  const sansPhoto = /sans-photo/.test(url);
  return { etat: "reconnue", site, miniature: !sansPhoto, valeurs: sansPhoto
    ? { titre: "Maison 4 pièces avec jardin", montant: 342000, surface: 96, pieces: 4, nature: "vente", commune: "35238" }
    : { titre: "T3 lumineux avec balcon", montant: 305000, surface: 66, pieces: 3, nature: "vente", commune: "44109" } };
}
