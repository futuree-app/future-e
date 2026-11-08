// FUT-41 / FUT-22 · PROTOTYPE V4.1 · MODÈLE PUR (données fictives).
//
// La V4.1 réutilise SANS LE MODIFIER le contrat de la V4 (`../fut41-v4/modele.ts` : comparaison
// critère par critère, lecture partagée, conditions sans compromis) et ajoute trois choses :
//   1. LA COMMUNE EST UNE PISTE à part entière (« Nantes ou Rennes ? »), avec ou sans logements ;
//      un logement se range sous sa commune, et la lecture de la commune n'est dite qu'une fois ;
//   2. LA COMPARAISON PAR ÉCHELLE : les communes se comparent sur le Territoire, les adresses sur
//      les abords et le logement. Une observation communale ne devient jamais un fait du logement ;
//   3. UNE LECTURE EN LANGAGE COURANT : ce qui bloque, ce qui fait la différence, ce que chaque
//      option demande d'accepter, ce qui reste à vérifier, ce qu'il faut faire ensuite.
// Rien de ceci n'existe dans le moteur de production : c'est une proposition de revue.
import {
  analyseServie, comparerCritere, conditionsNonTenues, critereAJour, criteresDepasses, dateCourte, estEtabli,
  libelleCritere, NOM_CRITERE, LIBELLE_ISSUE,
  type Analyse, type CleCritere, type ComparaisonCritere, type Issue, type Lieu, type LigneRegistre, type Motif, type Projet,
} from "../fut41-v4/modele.ts";

export * from "../fut41-v4/modele.ts";

// ── Les pistes ───────────────────────────────────────────────────────────────────────────────

export type LectureCommune = "aucune" | "gratuite" | "rapport";

/** Une commune envisagée : une piste de recherche, avec ou sans logement. */
export type Commune = {
  insee: string;
  nom: string;
  statut: "envisagee" | "ecartee";
  ajouteLe: string;
  lecture: LectureCommune;
  /** Le rapport de territoire servi (périmètre « commune »), s'il existe. */
  analyses: Analyse[];
  /** Lecture gratuite : quelques repères nationaux, qui ne concluent rien pour le Projet. */
  apercu: string[];
  /** Position sur le plan schématique (km, repère fictif) et gare principale. */
  position: { x: number; y: number };
  gare: { x: number; y: number } | null;
  raisonEcart?: string;
  viaPass?: boolean;
};

/** Un logement : un `Lieu` V4, plus sa place sur le plan, sa photo (ajoutée par la personne) et son droit. */
export type Logement = Lieu & {
  position: { x: number; y: number } | null;
  /** Une photo de l'annonce AJOUTÉE PAR LA PERSONNE (URL locale), jamais une illustration. */
  photo: string | null;
  viaPass?: boolean;
};

export type Recherche = { projet: Projet; communes: Commune[]; logements: Logement[] };

export type Piste = { type: "commune"; commune: Commune } | { type: "logement"; logement: Logement };
export const idPiste = (p: Piste) => (p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id);
export const nomPiste = (p: Piste) => (p.type === "commune" ? p.commune.nom : p.logement.libelle);

/** Une commune vue comme un `Lieu` V4, pour réutiliser la comparaison critère par critère. */
export function communeCommeLieu(c: Commune): Lieu {
  return {
    id: `c:${c.insee}`, libelle: c.nom, commune: { insee: c.insee, nom: c.nom }, adresse: null, annonce: null,
    statut: c.statut === "ecartee" ? "ecarte" : "a_etudier", ajouteLe: c.ajouteLe, visiteLe: null,
    analyses: c.lecture === "rapport" ? c.analyses : [], droit: c.lecture === "rapport" ? "territoire" : "aucun",
    journal: [], observations: [], verifications: [],
  };
}

export const communeDe = (r: Recherche, l: Logement) => r.communes.find((c) => c.insee === l.commune.insee) ?? null;
export const logementsDe = (r: Recherche, c: Commune) => r.logements.filter((l) => l.commune.insee === c.insee);

// ── Ce que futur•e sait, échelle par échelle, et le bon geste ────────────────────────────────

export type Echelle = "territoire" | "abords" | "logement";
export const NOM_ECHELLE: Record<Echelle, string> = { territoire: "La commune", abords: "Les abords", logement: "Le logement" };
const GRAIN_ECHELLE = { territoire: "commune", abords: "secteur", logement: "batiment" } as const;

export type SavoirEchelle = { echelle: Echelle; etat: "lu" | "non_lu" | "impossible"; detail: string };

/** Pour un logement : la commune peut être lue par le rapport de la commune OU par le dossier d'adresse. */
export function savoirLogement(r: Recherche, l: Logement): SavoirEchelle[] {
  const a = analyseServie(l);
  const c = communeDe(r, l);
  const rapport = c?.lecture === "rapport" ? analyseServie(communeCommeLieu(c)) : null;
  const territoire: SavoirEchelle = a
    ? { echelle: "territoire", etat: "lu", detail: `Lue par le dossier du ${dateCourte(a.generatedAt)}` }
    : rapport ? { echelle: "territoire", etat: "lu", detail: `Lue par le rapport de ${c!.nom} (${dateCourte(rapport.generatedAt)})` }
      : c?.lecture === "gratuite" ? { echelle: "territoire", etat: "non_lu", detail: "Lecture gratuite seulement : aucune conclusion pour votre Projet" }
        : { echelle: "territoire", etat: "non_lu", detail: "Pas encore lue" };
  const adresseLue = a?.perimetre === "commune+adresse";
  const abords: SavoirEchelle = adresseLue ? { echelle: "abords", etat: "lu", detail: `Lus le ${dateCourte(a!.generatedAt)}` }
    : !l.adresse ? { echelle: "abords", etat: "impossible", detail: "Il faut l'adresse exacte" }
      : { echelle: "abords", etat: "non_lu", detail: "Adresse connue, pas encore analysée" };
  const logement: SavoirEchelle = adresseLue ? { echelle: "logement", etat: "lu", detail: `Lu le ${dateCourte(a!.generatedAt)}` }
    : !l.adresse ? { echelle: "logement", etat: "impossible", detail: "Il faut l'adresse exacte" }
      : { echelle: "logement", etat: "non_lu", detail: "Adresse connue, pas encore analysée" };
  return [territoire, abords, logement];
}

/**
 * CE QUE L'ANALYSE D'UNE ADRESSE APPRENDRAIT, POUR CE PROJET. Une table de capacité (fictive, à
 * produire par le moteur en production : `criterionCapability`) dit, critère par critère, ce que
 * le dossier d'adresse lit, ce qu'il lit en partie, et ce qu'il ne pourra jamais dire. L'appel
 * commercial cite ces trois listes : il montre la valeur sans promettre de tout résoudre.
 */
export const CAPACITE_ADRESSE: Record<CleCritere, "lit" | "en_partie" | "jamais"> = {
  mer: "lit", gare: "lit", calme: "lit", quartier: "lit", nuits: "en_partie", medecin: "jamais",
};
const QUOI: Record<CleCritere, string> = {
  mer: "la distance à la mer", gare: "le trajet jusqu'à la gare depuis l'adresse", calme: "le bruit aux abords",
  quartier: "les commerces et services à pied", nuits: "ce que le diagnostic dit du confort d'été",
  medecin: "si un médecin accepte de nouveaux patients",
};

export function valeurAnalyseAdresse(projet: Projet): { lit: string[]; enPartie: string[]; jamais: string[] } {
  const cles = projet.criteres.map((c) => c.cle);
  return {
    lit: cles.filter((k) => CAPACITE_ADRESSE[k] === "lit").map((k) => QUOI[k]),
    enPartie: cles.filter((k) => CAPACITE_ADRESSE[k] === "en_partie").map((k) => QUOI[k]),
    jamais: cles.filter((k) => CAPACITE_ADRESSE[k] === "jamais").map((k) => QUOI[k]),
  };
}

export type Geste = {
  cle: "adresse" | "lire_commune" | "examiner_commune" | "analyser" | "ouvrir" | "mettre_a_jour" | "ouvrir_rapport";
  libelle: string;
  /** Ce que le geste apporte, en une phrase, du point de vue de la personne. */
  apport: string;
  /** La même valeur en une ligne, pour une liste. */
  court?: string;
  commercial: boolean;
};

/** Le geste principal d'une piste : UN seul, choisi par l'état de ce que futur•e sait. */
export function gestePrincipal(r: Recherche, p: Piste, droits: "unite" | "pass"): Geste {
  if (p.type === "commune") {
    const c = p.commune;
    if (c.lecture === "aucune") return { cle: "lire_commune", libelle: "Lire la commune", apport: "Une première lecture gratuite, sans conclusion pour votre Projet.", commercial: false };
    if (c.lecture === "gratuite") return { cle: "examiner_commune", libelle: droits === "pass" ? "Examiner la commune (inclus)" : "Examiner la commune · 14 €", apport: `Saurez-vous si ${c.nom} tient vos conditions ? Le rapport lit vos ${r.projet.criteres.length} conditions à l'échelle de la commune.`, commercial: true };
    const a = analyseServie(communeCommeLieu(c))!;
    if (criteresDepasses(a, r.projet).length) return { cle: "mettre_a_jour", libelle: "Mettre à jour avec votre Projet", apport: "Gratuit : le rapport a été fait sous une ancienne version de votre Projet.", commercial: false };
    return { cle: "ouvrir_rapport", libelle: "Ouvrir le rapport", apport: "La commune lue pour votre Projet.", commercial: false };
  }
  const l = p.logement;
  const a = analyseServie(l);
  if (!l.adresse) return { cle: "adresse", libelle: "Renseigner l'adresse", apport: "Sans adresse, futur•e ne peut lire ni les abords ni le logement.", commercial: false };
  if (!a || a.perimetre === "commune") {
    const v = valeurAnalyseAdresse(r.projet);
    return {
      cle: "analyser", libelle: droits === "pass" ? "Analyser l'adresse (inclus)" : "Analyser l'adresse · 39 €",
      court: `Lirait les abords et le logement${v.jamais.length ? ` ; pas ${v.jamais.join(", ")}` : ""}.`,
      apport: `Lirait ${v.lit.join(", ")}${v.enPartie.length ? ` ; en partie, ${v.enPartie.join(", ")}` : ""}.${v.jamais.length ? ` Ne dira pas ${v.jamais.join(", ")} : à vérifier par vous.` : ""}`,
      commercial: true,
    };
  }
  if (criteresDepasses(a, r.projet).length) return { cle: "mettre_a_jour", libelle: "Mettre à jour avec votre Projet", apport: "Gratuit : ce dossier répond à une ancienne version de votre Projet.", commercial: false };
  return { cle: "ouvrir", libelle: "Ouvrir le dossier", apport: "Toutes les conclusions et leurs preuves.", commercial: false };
}

// ── Langage courant ──────────────────────────────────────────────────────────────────────────

/** Les motifs du contrat V4, redits pour une personne : la vérité, sans le vocabulaire du moteur. */
export function motifSimple(m: Motif): string {
  switch (m.type) {
    case "lecture_partagee": return m.texte.replace(/^Une seule lecture de (.+), la même pour les deux : elle ne les départage pas\.$/, "Même commune : $1 est lue une seule fois, pour les deux.");
    case "millesime": return m.texte.replace(/^Les données lues ne sont pas du même millésime : /, "Ces deux analyses ne reposent pas sur les mêmes années de données : ");
    case "moteur": return "Les règles de lecture de futur•e ont changé entre ces deux analyses : leurs conclusions ne se comparent pas encore.";
    case "grain": return m.texte.replace(/^Pas établi à la même échelle : /, "Pas lu au même endroit : ").replace(/^Un seul est examiné ici : /, "Lu pour un seul des deux : ");
    case "projet": return m.texte.replace(/^Votre condition a changé entre les deux analyses : /, "Votre condition n'était pas la même lors des deux analyses : ");
    default: return m.texte;
  }
}

export const LIBELLE_ISSUE_SIMPLE: Record<Issue, string> = {
  ...LIBELLE_ISSUE,
  mismatch: "Moins bien",
  incompatible: "Ne tient pas",
  indeterminate: "Inconnu",
};

// ── Comparer par échelle ─────────────────────────────────────────────────────────────────────

/** Garde, dans une copie du lieu, les seules lignes établies à cette échelle. */
function aLEchelle(l: Lieu, e: Echelle): Lieu {
  const g = GRAIN_ECHELLE[e];
  return { ...l, analyses: l.analyses.map((a) => ({ ...a, registre: a.registre.map((x) => (x.grain === g ? x : { ...x, issue: "non_examine" as const, grain: null })) })) };
}

export type CelluleVoie = { id: string; nom: string; ligne: LigneRegistre | null; lu: boolean; partageAvec?: string[] };
export type LigneVoie = { cle: CleCritere; libelle: string; sansCompromis: boolean; cellules: CelluleVoie[]; difference: "fait_la_difference" | "pourrait" | "pareil" | "pas_comparable" | "pas_lu"; pourquoi: string };
export type Voie = { echelle: Echelle; colonnes: { id: string; nom: string; sous: string }[]; lignes: LigneVoie[]; note: string };

/**
 * LES VOIES DE LA COMPARAISON. La voie « commune » compare les COMMUNES des pistes choisies (une
 * colonne par commune, quel que soit le nombre de logements qui s'y trouvent) ; les voies « abords »
 * et « logement » comparent les LOGEMENTS. Une commune n'apparaît donc jamais deux fois, et un
 * logement non analysé figure dans sa voie avec « pas encore lu », jamais comme favorable.
 */
export function voies(r: Recherche, pistes: Piste[]): Voie[] {
  const projet = r.projet;
  const communes = [...new Map(pistes.map((p) => {
    const c = p.type === "commune" ? p.commune : communeDe(r, p.logement);
    return [c?.insee ?? "", c] as const;
  }).filter(([, c]) => c)).values()] as Commune[];
  const logements = pistes.filter((p): p is { type: "logement"; logement: Logement } => p.type === "logement").map((p) => p.logement);

  // Pour la voie commune : le rapport de la commune, ou à défaut la lecture communale d'un dossier d'adresse.
  const lieuCommune = (c: Commune): Lieu => {
    const base = communeCommeLieu(c);
    if (base.analyses.length) return base;
    const viaDossier = logementsDe(r, c).find((l) => analyseServie(l));
    return viaDossier ? { ...base, analyses: viaDossier.analyses } : base;
  };

  const construire = (e: Echelle, lieux: Lieu[], colonnes: Voie["colonnes"], partage?: (cle: CleCritere, id: string) => string[] | undefined): Voie => {
    const filtres = lieux.map((l) => aLEchelle(l, e));
    const lignes: LigneVoie[] = projet.criteres.map((c) => {
      const cellules: CelluleVoie[] = filtres.map((l) => {
        const ligne = analyseServie(l)?.registre.find((x) => x.cle === c.cle) ?? null;
        const lu = !!ligne && ligne.issue !== "non_examine";
        return { id: l.id, nom: l.libelle, ligne: lu ? ligne : null, lu, partageAvec: partage?.(c.cle, l.id) };
      });
      const paires: ComparaisonCritere[] = [];
      for (let i = 0; i < filtres.length; i++) for (let j = i + 1; j < filtres.length; j++) paires.push(comparerCritere(c.cle, filtres[i]!, filtres[j]!));
      const lus = cellules.filter((x) => x.lu).length;
      let difference: LigneVoie["difference"] = "pas_lu";
      let pourquoi = "Pas lu à cette échelle pour vos pistes.";
      if (lus === 0) { difference = "pas_lu"; }
      else if (paires.some((p) => p.etat === "difference_demontree")) { difference = "fait_la_difference"; pourquoi = "Lu de la même façon des deux côtés : la différence vient du lieu."; }
      else if (paires.some((p) => p.etat === "non_comparable" && p.motifs.some((m) => m.type !== "lecture_partagee"))) {
        difference = "pas_comparable"; pourquoi = motifSimple(paires.find((p) => p.etat === "non_comparable" && p.motifs.some((m) => m.type !== "lecture_partagee"))!.motifs.find((m) => m.type !== "lecture_partagee")!);
      } else if (paires.some((p) => p.etat === "difference_possible")) { difference = "pourrait"; pourquoi = "Établi d'un côté seulement : une vérification pourrait faire la différence."; }
      else if (paires.some((p) => p.etat === "indisponible") && lus < cellules.length) { difference = "pas_lu"; pourquoi = `Lu pour ${lus} sur ${cellules.length} : le reste n'est pas encore lu à cette échelle.`; }
      else { difference = "pareil"; pourquoi = "Même conclusion là où c'est lu."; }
      return { cle: c.cle, libelle: libelleCritere(c), sansCompromis: c.nature === "sans_compromis", cellules, difference, pourquoi };
    }).filter((x) => x.cellules.some((y) => y.lu) || e !== "territoire");
    const lignesUtiles = lignes.filter((x) => x.cellules.some((y) => y.lu) || x.difference !== "pas_lu" || e === "territoire");
    return {
      echelle: e, colonnes, lignes: lignesUtiles.filter((x) => x.cellules.some((y) => y.lu)),
      note: e === "territoire"
        ? (communes.length === 1 ? `Une seule commune : ${communes[0]!.nom} est lue une fois, pour tous ses logements.` : "Une colonne par commune : ce qui est lu à la commune vaut pour tous ses logements, et n'est compté qu'une fois.")
        : "Une colonne par logement. Un logement sans analyse d'adresse n'a rien à cette échelle.",
    };
  };

  const out: Voie[] = [];
  if (communes.length) {
    out.push(construire("territoire", communes.map(lieuCommune), communes.map((c) => ({
      id: `c:${c.insee}`, nom: c.nom,
      sous: c.lecture === "rapport" ? `rapport du ${dateCourte(analyseServie(communeCommeLieu(c))!.generatedAt)}` : lieuCommune(c).analyses.length ? "lue par un dossier d'adresse" : c.lecture === "gratuite" ? "lecture gratuite" : "pas encore lue",
    })), (cle, id) => {
      const c = communes.find((x) => `c:${x.insee}` === id);
      const ls = c ? logements.filter((l) => l.commune.insee === c.insee) : [];
      return ls.length ? ls.map((l) => l.libelle) : undefined;
    }));
  }
  if (logements.length) {
    const cols = logements.map((l) => ({ id: l.id, nom: l.libelle, sous: l.commune.nom }));
    out.push(construire("abords", logements, cols));
    out.push(construire("logement", logements, cols));
  }
  return out;
}

// ── La lecture : ce qui bloque, ce qui fait la différence, les compromis, ce qui manque ──────

export type Lecture = {
  bloque: { pisteId: string; phrase: string }[];
  difference: { echelle: Echelle; cle: CleCritere; phrase: string }[];
  pourrait: { echelle: Echelle; cle: CleCritere; phrase: string }[];
  pasComparable: { echelle: Echelle; cle: CleCritere; phrase: string }[];
  compromis: { pisteId: string; nom: string; apporte: string[]; accepte: string[]; inconnu: string[]; nonLu: string[]; limite: string | null }[];
  manque: { pisteId: string; phrase: string }[];
};

const echelleDe = (g: LigneRegistre["grain"]): string => (g === "commune" ? "à la commune" : g === "secteur" ? "aux abords" : g === "batiment" ? "dans le logement" : "");

/**
 * LA LECTURE D'UNE COMPARAISON, sans répétition (arbitrage Z12) : une condition sans compromis non
 * tenue est dite UNE fois, dans « ce qui bloque » ; « ce qui fait la différence » se calcule ensuite
 * sur les seules pistes qui tiennent cette condition, pour ne pas masquer un écart entre elles.
 */
export function lire(r: Recherche, pistes: Piste[]): Lecture {
  const projet = r.projet;
  const logements = pistes.filter((p): p is { type: "logement"; logement: Logement } => p.type === "logement").map((p) => p.logement);
  const bloque = logements.flatMap((l) => conditionsNonTenues(l, projet).map((x) => ({ pisteId: l.id, phrase: x.phrase, cle: x.cle, aJour: x.aJour })));
  const bloquesPar = (cle: CleCritere) => new Set(bloque.filter((b) => b.cle === cle && b.aJour).map((b) => b.pisteId));

  const lesVoies = voies(r, pistes);
  const difference: Lecture["difference"] = [];
  const pourrait: Lecture["pourrait"] = [];
  const pasComparable: Lecture["pasComparable"] = [];
  for (const v of lesVoies) {
    for (const li of v.lignes) {
      const exclus = bloquesPar(li.cle);
      const cellules = li.cellules.filter((c) => !exclus.has(c.id));
      const lues = cellules.filter((c) => c.lu && estEtabli(c.ligne));
      const issues = new Set(lues.map((c) => c.ligne!.issue));
      const nomV = NOM_ECHELLE[v.echelle].toLowerCase();
      if (li.difference === "fait_la_difference" && issues.size > 1) {
        const parIssue = [...issues].map((i) => `${lues.filter((c) => c.ligne!.issue === i).map((c) => c.nom).join(" et ")} (${LIBELLE_ISSUE_SIMPLE[i].toLowerCase()})`);
        difference.push({ echelle: v.echelle, cle: li.cle, phrase: `${NOM_CRITERE[li.cle]}, ${v.echelle === "territoire" ? "à l'échelle de la commune" : v.echelle === "abords" ? "aux abords" : "dans le logement"} : ${parIssue.join(" ; ")}.` });
      } else if (li.difference === "pourrait") {
        const ouverts = cellules.filter((c) => c.lu && !estEtabli(c.ligne)).map((c) => c.nom);
        if (ouverts.length) pourrait.push({ echelle: v.echelle, cle: li.cle, phrase: `${NOM_CRITERE[li.cle]} (${nomV}) pourrait faire la différence : à vérifier pour ${ouverts.join(" et ")}.` });
      } else if (li.difference === "pas_comparable") {
        pasComparable.push({ echelle: v.echelle, cle: li.cle, phrase: `${NOM_CRITERE[li.cle]} (${nomV}) : ${li.pourquoi.charAt(0).toLowerCase()}${li.pourquoi.slice(1)}` });
      }
    }
  }

  // Les compromis par option : la ligne la plus fine connue pour chaque condition.
  const compromis: Lecture["compromis"] = pistes.map((p) => {
    const lieu = p.type === "commune" ? communeCommeLieu(p.commune) : p.logement;
    const c = p.type === "logement" ? communeDe(r, p.logement) : null;
    const rapport = c && c.lecture === "rapport" ? analyseServie(communeCommeLieu(c)) : null;
    const a = analyseServie(lieu) ?? rapport;
    const apporte: string[] = []; const accepte: string[] = []; const inconnu: string[] = []; const nonLu: string[] = [];
    for (const cr of projet.criteres) {
      const ligne = a?.registre.find((x) => x.cle === cr.cle);
      const nom = NOM_CRITERE[cr.cle];
      if (!ligne || ligne.issue === "non_examine") { nonLu.push(nom); continue; }
      const ou = echelleDe(ligne.grain);
      if (ligne.issue === "favorable") apporte.push(`${nom} ${ou}`);
      else if (ligne.issue === "reserve" || ligne.issue === "mismatch" || ligne.issue === "incompatible") accepte.push(`${nom} ${ou}${ligne.issue === "incompatible" ? " (ne tient pas)" : ""}`);
      else {
        // Inconnu au logement, mais lu à la commune : on le dit, sans en faire un fait du logement.
        const com = ligne.grain !== "commune" ? (a?.registre.find((x) => x.cle === cr.cle && x.grain === "commune") ?? rapport?.registre.find((x) => x.cle === cr.cle)) : undefined;
        inconnu.push(`${nom} ${ou}${com && estEtabli(com) ? ` (la commune : ${LIBELLE_ISSUE_SIMPLE[com.issue].toLowerCase()})` : ""}`);
      }
    }
    const adresseLue = a?.perimetre === "commune+adresse";
    const limite = p.type === "commune" ? (a ? "Lu à l'échelle de la commune : vaut pour tous ses logements, sans rien dire d'un logement en particulier." : "Lecture gratuite seulement : rien de conclu pour votre Projet.")
      : adresseLue ? null : p.logement.adresse ? "Lu à la commune seulement : les abords et le logement attendent l'analyse de l'adresse." : "Lu à la commune seulement : sans adresse, ni les abords ni le logement ne peuvent être lus.";
    return { pisteId: idPiste(p), nom: nomPiste(p), apporte, accepte, inconnu, nonLu, limite };
  });

  const manque = pistes.flatMap((p) => {
    const g = gestePrincipal(r, p, "unite");
    if (g.cle === "adresse") return [{ pisteId: idPiste(p), phrase: `${nomPiste(p)} attend son adresse exacte.` }];
    if (g.cle === "analyser") return [{ pisteId: idPiste(p), phrase: `${nomPiste(p)} attend l'analyse de son adresse.` }];
    if (g.cle === "examiner_commune" || g.cle === "lire_commune") return [{ pisteId: idPiste(p), phrase: `${nomPiste(p)} n'est lue qu'en lecture gratuite : rien n'est conclu pour votre Projet.` }];
    if (g.cle === "mettre_a_jour") return [{ pisteId: idPiste(p), phrase: `${nomPiste(p)} répond à une ancienne version de votre Projet.` }];
    return [];
  });

  return { bloque: bloque.map(({ pisteId, phrase }) => ({ pisteId, phrase })), difference, pourrait, pasComparable, compromis, manque };
}

/** La synthèse courte, en deux à quatre phrases, qui précède le détail. */
export function synthese(r: Recherche, pistes: Piste[]): string[] {
  const l = lire(r, pistes);
  const out: string[] = [];
  out.push(l.bloque.length ? `${l.bloque.length === 1 ? "Une option bloque" : `${l.bloque.length} options bloquent`} sur une condition sans compromis.` : "Aucune option ne bloque sur vos conditions sans compromis, d'après ce qui est lu.");
  const d = l.difference.slice(0, 2).map((x) => NOM_CRITERE[x.cle].toLowerCase());
  if (d.length) out.push(`Ce qui fait la différence : ${[...new Set(d)].join(" et ")}.`);
  else out.push("Rien ne fait encore la différence de façon établie.");
  if (l.pourrait.length) out.push(`À vérifier, et qui pourrait tout changer : ${[...new Set(l.pourrait.map((x) => NOM_CRITERE[x.cle].toLowerCase()))].join(", ")}.`);
  if (l.manque.length) out.push(l.manque.map((x) => x.phrase).join(" "));
  return out;
}

// ── À faire maintenant ───────────────────────────────────────────────────────────────────────

export type Action = { pisteId: string; texte: string; pourquoi: string; geste: Geste | null; vers: "fiche" | "comparer" };

/** Trois actions au plus, dans un ordre de règles dit à l'écran (aucun score). */
export function aFaire(r: Recherche, aujourdhui: string, droits: "unite" | "pass"): Action[] {
  const out: Action[] = [];
  const actifs = r.logements.filter((l) => l.statut !== "ecarte");
  for (const l of actifs) if (l.visiteLe && l.visiteLe >= aujourdhui) {
    const n = l.verifications.filter((v) => v.moment === "sur_place" && !v.reponse).length;
    out.push({ pisteId: l.id, texte: `Préparer la visite du ${dateCourte(l.visiteLe)} : ${l.libelle}`, pourquoi: n ? `${n} question${n > 1 ? "s" : ""} à poser sur place` : "La visite approche", geste: null, vers: "fiche" });
  }
  for (const l of actifs) {
    const v = l.verifications.find((x) => !x.reponse && x.moment === "avant_visite");
    if (v) out.push({ pisteId: l.id, texte: v.question, pourquoi: `${NOM_CRITERE[v.cle]} reste inconnu pour ${l.libelle}`, geste: null, vers: "fiche" });
  }
  const pistes: Piste[] = [
    ...r.communes.filter((c) => c.statut !== "ecartee").map((commune) => ({ type: "commune" as const, commune })),
    ...actifs.map((logement) => ({ type: "logement" as const, logement })),
  ];
  for (const p of pistes) {
    const g = gestePrincipal(r, p, droits);
    if (g.cle === "analyser" || g.cle === "adresse" || g.cle === "examiner_commune" || g.cle === "mettre_a_jour") {
      out.push({ pisteId: idPiste(p), texte: `${g.libelle.replace(/ ·.*$| \(inclus\)$/, "")} : ${nomPiste(p)}`, pourquoi: g.apport, geste: g, vers: "fiche" });
    }
  }
  return out.slice(0, 3);
}

// ── Et si… ? ─────────────────────────────────────────────────────────────────────────────────

export type SeauEtSi = "inchange" | "pourrait_changer" | "nouvelle_analyse" | "pas_lu" | "ecarte_a_revoir";

export const TITRE_SEAU: Record<SeauEtSi, string> = {
  pourrait_changer: "Pourraient changer",
  ecarte_a_revoir: "Écartés à revoir",
  nouvelle_analyse: "Demanderaient une nouvelle analyse",
  inchange: "Restent valables",
  pas_lu: "Rien à recalculer : pas encore lus",
};

/**
 * ET SI, PAR SEAUX. Pour une condition à seuil et une nouvelle valeur, chaque piste tombe dans UN
 * seau, avec sa raison. Seule une mesure figée permet « pourrait changer » ou « reste valable » ;
 * sans mesure, seule une nouvelle analyse le dirait. Le Projet n'est jamais modifié ici.
 */
export function etSi(r: Recherche, cle: CleCritere, valeur: number): { seau: SeauEtSi; pisteId: string; nom: string; raison: string }[] {
  const actuel = r.projet.criteres.find((c) => c.cle === cle);
  if (!actuel || actuel.valeur == null) return [];
  const out: { seau: SeauEtSi; pisteId: string; nom: string; raison: string }[] = [];
  const unite = cle === "mer" ? "km" : "min";
  const traiter = (id: string, nom: string, lieu: Lieu, ecarte: boolean, raisonEcart?: { valeur?: number; raison?: string }) => {
    const a = analyseServie(lieu);
    const ligne = a?.registre.find((x) => x.cle === cle);
    if (!a || !ligne || ligne.issue === "non_examine") { if (!ecarte) out.push({ seau: "pas_lu", pisteId: id, nom, raison: "Pas encore lu : rien à recalculer." }); return; }
    if (!ligne.mesure) { if (!ecarte) out.push({ seau: "nouvelle_analyse", pisteId: id, nom, raison: `Lu ${echelleDe(ligne.grain)}, sans ${cle === "gare" ? "trajet" : "distance"} mesuré depuis une adresse : seule une nouvelle analyse dirait l'effet.` }); return; }
    const m = ligne.mesure.valeur;
    const tenait = critereAJour(a, cle, r.projet) || actuel.valeur == null ? ligne.issue !== "incompatible" && ligne.issue !== "mismatch" : m <= actuel.valeur!;
    const tiendrait = m <= valeur;
    if (ecarte) {
      if (raisonEcart?.valeur != null && tiendrait && !tenait) out.push({ seau: "ecarte_a_revoir", pisteId: id, nom, raison: `Écarté pour « ${raisonEcart.raison} » quand votre limite était ${raisonEcart.valeur} ${unite} ; mesuré à ${m} ${unite}, il tiendrait.` });
      return;
    }
    if (tenait === tiendrait) out.push({ seau: "inchange", pisteId: id, nom, raison: `Mesuré à ${m} ${unite} : ${tiendrait ? "tient" : "ne tient pas"} à ${actuel.valeur} comme à ${valeur} ${unite}.` });
    else out.push({ seau: "pourrait_changer", pisteId: id, nom, raison: `Mesuré à ${m} ${unite} : ${tiendrait ? "tiendrait" : "ne tiendrait plus"} à ${valeur} ${unite}. La mise à jour de son analyse le confirmerait.` });
  };
  for (const c of r.communes) if (c.statut !== "ecartee") traiter(`c:${c.insee}`, c.nom, communeCommeLieu(c), false);
  for (const l of r.logements) {
    const e = [...l.journal].reverse().find((x) => x.type === "ecarte");
    traiter(l.id, l.libelle, l, l.statut === "ecarte", e?.contexte?.cle === cle ? { valeur: e.contexte.valeur, raison: e.raison } : undefined);
  }
  return out;
}
