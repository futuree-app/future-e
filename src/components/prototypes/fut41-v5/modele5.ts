// FUT-41 / FUT-22 · PROTOTYPE V5 · MODÈLE PUR (données fictives).
//
// La V5 réutilise SANS LES MODIFIER le contrat V4 (`comparerCritere` : comparaison critère par
// critère, lecture partagée, conditions sans compromis) et les gestes V4.1 (`gestePrincipal`,
// `etSi`). Elle ajoute une seule forme de lecture, la CONFRONTATION, partagée par la fiche et par
// la comparaison :
//
//   pour chaque condition du Projet, une ou deux COUCHES : ce qui est lu À LA COMMUNE, puis ce qui
//   se lit DEPUIS L'ADRESSE (aux abords ou dans le logement). Une lecture communale couvre, d'une
//   seule cellule, tous les logements qui la partagent ; elle ne devient jamais un fait du logement.
//
// Invariants testés (`modele5.test.ts`) :
//   - aucun score, aucun total, aucun gagnant ; aucune phrase ne dit « meilleur » ;
//   - une condition sans compromis non tenue est dite UNE fois (Z12) ; sa mesure reste dans le détail ;
//   - une conclusion faite sous un ancien Projet n'est ni reconduite ni invalidée : elle est « à revoir » ;
//   - un logement dont seule la commune est lue n'a rien aux abords ni dans le logement (S7) ;
//   - une mise à jour relit sous le Projet actuel, sans lire plus loin que l'analyse d'origine.
import {
  analyseServie, communeCommeLieu, communeDe, comparerCritere, conditionsNonTenues, critereAJour, dateCourte,
  estEtabli, gestePrincipal, libelleCritere, logementsDe, motifSimple, nomPiste, idPiste, valeurAnalyseAdresse, NOM_CRITERE, LIBELLE_ISSUE_SIMPLE,
  type Analyse, type CleCritere, type Commune, type ComparaisonCritere, type Geste, type Lieu, type LigneRegistre, type Logement, type Piste, type Recherche,
} from "../fut41-v41/modele41.ts";

export * from "../fut41-v41/modele41.ts";

// ── Où se lit chaque condition depuis une adresse ────────────────────────────────────────────

export type Couche = "commune" | "abords" | "logement";
export const NOM_COUCHE: Record<Couche, string> = { commune: "À la commune", abords: "Aux abords", logement: "Dans le logement" };
const GRAIN_COUCHE = { commune: "commune", abords: "secteur", logement: "batiment" } as const;

/**
 * La couche « adresse » de chaque condition : là où l'analyse d'une adresse la lit. `null` : aucune
 * analyse d'adresse ne la lit (un médecin qui accepte de nouveaux patients ne se mesure pas).
 * En production, cette table viendra du moteur (`criterionCapability`), jamais de l'interface.
 */
export const COUCHE_ADRESSE: Record<CleCritere, Exclude<Couche, "commune"> | null> = {
  mer: "abords", gare: "abords", calme: "abords", quartier: "abords", nuits: "logement", medecin: null,
};

/** Les noms courts, pour une liste (« la gare », « le calme »). */
export const NOM_COURT: Record<CleCritere, string> = {
  mer: "la mer", gare: "la gare", nuits: "des nuits fraîches", calme: "le calme", medecin: "un médecin", quartier: "le quartier",
};

// ── Les colonnes d'une confrontation ─────────────────────────────────────────────────────────

export type Colonne = { id: string; nom: string; sous: string; insee: string; type: "commune" | "logement" };

export function colonnesDe(r: Recherche, pistes: Piste[]): Colonne[] {
  // Les logements d'une même commune restent côte à côte : leur lecture communale s'écrit d'un bloc.
  const ordre = r.communes.map((c) => c.insee);
  const rang = (p: Piste) => ordre.indexOf(p.type === "commune" ? p.commune.insee : p.logement.commune.insee);
  return [...pistes].sort((a, b) => rang(a) - rang(b)).map((p) => (p.type === "commune"
    ? { id: idPiste(p), nom: p.commune.nom, sous: "la commune", insee: p.commune.insee, type: "commune" as const }
    : { id: p.logement.id, nom: p.logement.libelle, sous: p.logement.commune.nom, insee: p.logement.commune.insee, type: "logement" as const }));
}

// ── Une cellule : la ligne lue pour une colonne, à une couche, et d'où elle vient ────────────

export type EtatCellule = "lu" | "a_lire" | "adresse_manquante" | "pas_lue";

export type Cellule = {
  ids: string[];
  ligne: LigneRegistre | null;
  etat: EtatCellule;
  /** « rapport de Nantes du 2 oct. », « dossier du 15 oct. » */
  origine: string | null;
  /** La limite du Projet sous laquelle la mesure a été lue, quand elle n'est plus l'actuelle. */
  limiteAlors: number | null;
  /** La colonne ne tient pas cette condition sans compromis (sous le Projet actuel) : dit une fois, en tête. */
  bloque: boolean;
  /** Le lieu réduit à cette seule ligne, pour le contrat de comparaison V4. */
  lieu: Lieu;
};

function reduit(base: Lieu, a: Analyse | null, ligne: LigneRegistre | null): Lieu {
  return { ...base, analyses: a && ligne ? [{ ...a, registre: [ligne] }] : [] };
}

/** La lecture d'une commune : son rapport, ou à défaut la lecture communale d'un dossier d'adresse. */
function lectureCommune(r: Recherche, c: Commune, cle: CleCritere): { a: Analyse; ligne: LigneRegistre; origine: string } | null {
  if (c.lecture === "rapport") {
    const a = analyseServie(communeCommeLieu(c));
    const ligne = a?.registre.find((x) => x.cle === cle);
    if (a && ligne && ligne.issue !== "non_examine") return { a, ligne, origine: `rapport de ${c.nom} du ${dateCourte(a.generatedAt)}` };
  }
  for (const l of logementsDe(r, c)) {
    const a = analyseServie(l);
    const ligne = a?.registre.find((x) => x.cle === cle && x.grain === "commune");
    if (a && ligne) return { a, ligne, origine: `dossier de ${l.libelle} du ${dateCourte(a.generatedAt)}` };
  }
  return null;
}

function cellule(r: Recherche, col: Colonne, cle: CleCritere, couche: Couche): Cellule {
  const projet = r.projet;
  const c = r.communes.find((x) => x.insee === col.insee);
  if (col.type === "commune") {
    const base = communeCommeLieu(c!);
    const lu = lectureCommune(r, c!, cle);
    return { ids: [col.id], ligne: lu?.ligne ?? null, etat: lu ? "lu" : "pas_lue", origine: lu?.origine ?? null, limiteAlors: limiteAlors(lu?.a ?? null, cle, r), bloque: false, lieu: reduit(base, lu?.a ?? null, lu?.ligne ?? null) };
  }
  const l = r.logements.find((x) => x.id === col.id)!;
  const a = analyseServie(l);
  const adresseLue = a?.perimetre === "commune+adresse";
  if (couche === "commune") {
    // Le dossier du logement d'abord (ce qu'IL a conclu à la commune), sinon le rapport de la commune.
    const propre = adresseLue ? a!.registre.find((x) => x.cle === cle && x.grain === "commune") : undefined;
    if (propre) return { ids: [col.id], ligne: propre, etat: "lu", origine: `dossier du ${dateCourte(a!.generatedAt)}`, limiteAlors: limiteAlors(a!, cle, r), bloque: false, lieu: reduit(l, a!, propre) };
    const lu = c ? lectureCommune(r, c, cle) : null;
    return { ids: [col.id], ligne: lu?.ligne ?? null, etat: lu ? "lu" : "pas_lue", origine: lu?.origine ?? null, limiteAlors: limiteAlors(lu?.a ?? null, cle, r), bloque: false, lieu: reduit(l, lu?.a ?? null, lu?.ligne ?? null) };
  }
  const ligne = adresseLue ? a!.registre.find((x) => x.cle === cle && x.grain === GRAIN_COUCHE[couche]) ?? null : null;
  const etat: EtatCellule = ligne ? "lu" : !l.adresse ? "adresse_manquante" : "a_lire";
  const bloque = !!ligne && conditionsNonTenues(l, projet).some((x) => x.cle === cle && x.aJour);
  return { ids: [col.id], ligne, etat, origine: ligne ? `dossier du ${dateCourte(a!.generatedAt)}` : null, limiteAlors: ligne ? limiteAlors(a!, cle, r) : null, bloque, lieu: reduit(l, ligne ? a! : null, ligne) };
}

function limiteAlors(a: Analyse | null, cle: CleCritere, r: Recherche): number | null {
  if (!a || critereAJour(a, cle, r.projet)) return null;
  return a.projet.criteres.find((x) => x.cle === cle)?.valeur ?? null;
}

// ── Le verdict d'une couche ──────────────────────────────────────────────────────────────────

export type Verdict = "distingue" | "pourrait" | "pareil" | "une_lecture" | "pas_comparable" | "inconnu" | "pas_assez_lu";

export const LIBELLE_VERDICT: Record<Verdict, string> = {
  distingue: "Les distingue",
  pourrait: "Pourrait les distinguer",
  pareil: "Pareil",
  une_lecture: "Une seule lecture",
  pas_comparable: "Pas encore comparable",
  inconnu: "Inconnu partout",
  pas_assez_lu: "Pas assez lu",
};

export type CoucheLue = { couche: Couche; cellules: Cellule[]; verdict: Verdict; phrase: string; remede: string | null };

export type LigneConfrontation = { cle: CleCritere; libelle: string; sansCompromis: boolean; poids: number; couches: CoucheLue[] };

const listeFr = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);

/** Deux cellules voisines d'une même commune qui portent la même lecture n'en font qu'une. */
function fusionner(cellules: Cellule[], cols: Colonne[], cle: CleCritere): Cellule[] {
  const out: Cellule[] = [];
  cellules.forEach((c, i) => {
    const prec = out[out.length - 1];
    const colPrec = prec ? cols.find((k) => k.id === prec.ids[prec.ids.length - 1]) : undefined;
    const meme = prec && colPrec && colPrec.insee === cols[i]!.insee && (
      (!prec.ligne && !c.ligne)
      || (prec.ligne && c.ligne && (prec.ligne === c.ligne || comparerCritere(cle, prec.lieu, c.lieu).motifs.some((m) => m.type === "lecture_partagee")))
    );
    if (meme) prec.ids.push(...c.ids);
    else out.push({ ...c, ids: [...c.ids] });
  });
  return out;
}

function lireCouche(couche: Couche, cellules: Cellule[], cle: CleCritere, noms: (ids: string[]) => string): CoucheLue {
  const enJeu = cellules.filter((c) => !c.bloque);
  const lues = enJeu.filter((c) => c.ligne);
  const base = { couche, cellules };
  if (cellules.length === 1 && cellules[0]!.ids.length > 1) {
    const c = cellules[0]!;
    return { ...base, verdict: c.ligne ? "une_lecture" : "pas_assez_lu", phrase: c.ligne ? `Une seule lecture de ${noms(c.ids)}, la même pour ces logements : elle ne les distingue pas.` : "Pas encore lue à la commune.", remede: null };
  }
  if (!lues.length) {
    const sansAdresse = enJeu.every((c) => c.etat === "adresse_manquante");
    return { ...base, verdict: "pas_assez_lu", phrase: couche === "commune" ? "Pas encore lue à la commune." : sansAdresse ? "Il faut l'adresse exacte pour le lire." : "Pas encore lu : il faut analyser l'adresse.", remede: null };
  }
  const paires: ComparaisonCritere[] = [];
  for (let i = 0; i < lues.length; i++) for (let j = i + 1; j < lues.length; j++) paires.push(comparerCritere(cle, lues[i]!.lieu, lues[j]!.lieu));
  const manquent = enJeu.length - lues.length;
  const suite = manquent ? ` Pas encore lu pour ${manquent === 1 ? noms(enJeu.filter((c) => !c.ligne)[0]!.ids) : `${manquent} d'entre eux`}.` : "";
  const demontree = paires.find((p) => p.etat === "difference_demontree");
  if (demontree) {
    const parIssue = [...new Set(lues.filter((c) => estEtabli(c.ligne)).map((c) => c.ligne!.issue))].map((iss) => `${noms(lues.filter((c) => c.ligne!.issue === iss).flatMap((c) => c.ids))} : ${LIBELLE_ISSUE_SIMPLE[iss].toLowerCase()}`);
    return { ...base, verdict: "distingue", phrase: `Lu de la même façon des deux côtés : l'écart vient du lieu (${parIssue.join(" ; ")}).${suite}`, remede: null };
  }
  const hors = paires.find((p) => p.etat === "non_comparable" && p.motifs.some((m) => m.type !== "lecture_partagee"));
  if (hors) {
    const m = hors.motifs.find((x) => x.type !== "lecture_partagee")!;
    const remede = m.type === "grain"
      ? "Une mise à jour ne suffirait pas : seule l'analyse de l'adresse le lirait au même endroit."
      : "Mettre à jour l'analyse la plus ancienne (gratuit pour un dossier acquis) lèverait cet écart.";
    return { ...base, verdict: "pas_comparable", phrase: motifSimple(m) + suite, remede };
  }
  if (paires.some((p) => p.etat === "difference_possible")) {
    const ouverts = lues.filter((c) => !estEtabli(c.ligne)).flatMap((c) => c.ids);
    return { ...base, verdict: "pourrait", phrase: `Connu d'un côté seulement : à vérifier pour ${noms(ouverts)}.${suite}`, remede: null };
  }
  if (paires.length && paires.every((p) => p.etat === "a_verifier")) {
    return { ...base, verdict: "inconnu", phrase: `Personne ne le sait encore : à vérifier par vous.${suite}`, remede: null };
  }
  if (manquent) return { ...base, verdict: "pas_assez_lu", phrase: `Lu pour ${lues.length} sur ${enJeu.length} : ${noms(enJeu.filter((c) => c.ligne).flatMap((c) => c.ids))}.`, remede: couche === "commune" ? null : "Analyser l'adresse le lirait." };
  return { ...base, verdict: "pareil", phrase: lues.length > 1 ? "Même conclusion des deux côtés." : "Lu pour celui-ci seulement.", remede: null };
}

/**
 * LA CONFRONTATION : chaque condition du Projet, couche par couche, pour les colonnes données.
 * Communes : la seule couche « commune ». Logements : la couche commune (une cellule par lecture
 * partagée), puis la couche de l'adresse où la condition se lit. Une couche « commune » sans aucune
 * lecture n'est pas affichée pour des logements ; une couche « adresse » l'est toujours, pour dire
 * ce qui manque.
 */
export function confronter(r: Recherche, pistes: Piste[]): { colonnes: Colonne[]; lignes: LigneConfrontation[] } {
  const cols = colonnesDe(r, pistes);
  const noms = (ids: string[]) => listeFr(ids.map((id) => cols.find((c) => c.id === id)?.nom ?? id));
  // À la commune, une lecture se nomme par sa commune (« Nantes »), pas par les logements qu'elle couvre.
  const nomsCommune = (ids: string[]) => listeFr([...new Set(ids.map((id) => { const c = cols.find((k) => k.id === id); return r.communes.find((x) => x.insee === c?.insee)?.nom ?? c?.nom ?? id; }))]);
  const logements = cols.some((c) => c.type === "logement");
  const lignes = r.projet.criteres.map((k): LigneConfrontation => {
    const couches: CoucheLue[] = [];
    const brutes = cols.map((c) => cellule(r, c, k.cle, "commune"));
    const communales = logements ? fusionner(brutes, cols, k.cle) : brutes;
    if (!logements || communales.some((c) => c.ligne)) couches.push(lireCouche("commune", communales, k.cle, logements ? nomsCommune : noms));
    const ca = COUCHE_ADRESSE[k.cle];
    if (logements && ca) couches.push(lireCouche(ca, cols.map((c) => cellule(r, c, k.cle, ca)), k.cle, noms));
    return { cle: k.cle, libelle: libelleCritere(k), sansCompromis: k.nature === "sans_compromis", poids: k.poids ?? 0, couches };
  });
  return { colonnes: cols, lignes };
}

// ── Le bilan d'une colonne : ce qu'elle apporte, ce qu'elle demande d'accepter, ce qui reste ouvert ──

export type Bilan = {
  id: string; nom: string;
  apporte: string[]; accepte: string[]; ouvert: string[]; pasLu: string[];
  /** Une condition sans compromis non tenue (dite en tête, pas ici) et une conclusion ancienne. */
  bloque: boolean; aRevoir: boolean;
  geste: Geste;
};

const OU = { commune: "à la commune", secteur: "aux abords", batiment: "dans le logement" } as const;

export function bilan(r: Recherche, p: Piste, droits: "unite" | "pass"): Bilan {
  const col = colonnesDe(r, [p])[0]!;
  const apporte: string[] = []; const accepte: string[] = []; const ouvert: string[] = []; const pasLu: string[] = [];
  let bloque = false; let aRevoir = false;
  for (const k of r.projet.criteres) {
    const ca = COUCHE_ADRESSE[k.cle];
    const fine = p.type === "logement" && ca ? cellule(r, col, k.cle, ca) : null;
    const com = cellule(r, col, k.cle, "commune");
    const nom = NOM_COURT[k.cle];
    if (fine?.bloque) { bloque = true; continue; }
    const ligne = fine?.ligne ?? (p.type === "commune" || !ca ? com.ligne : null);
    const lim = !ligne ? null : fine?.ligne ? fine.limiteAlors : com.limiteAlors;
    if (lim != null && k.nature === "sans_compromis") aRevoir = true;
    if (!ligne) {
      // Un logement dont l'adresse n'est pas lue : la commune donne un contexte, jamais un fait du logement.
      // Seule une RÉSERVE de la commune est rappelée (un point à vérifier) ; une lecture communale
      // favorable ne dit rien du logement et n'est pas reprise ici (S7).
      if (p.type === "logement" && ca && com.ligne && (com.ligne.issue === "reserve" || com.ligne.issue === "mismatch")) ouvert.push(`${nom} : pas encore lu ${NOM_COUCHE[ca].toLowerCase()} (à la commune : ${LIBELLE_ISSUE_SIMPLE[com.ligne.issue].toLowerCase()})`);
      else pasLu.push(nom);
      continue;
    }
    const ou = p.type === "commune" ? "" : ligne.grain ? `, ${OU[ligne.grain]}` : "";
    const mesure = ligne.mesure ? `, ${ligne.mesure.valeur} ${ligne.mesure.unite}` : "";
    const ancien = lim != null ? ` (lu sous votre ancienne limite de ${lim} ${ligne.mesure?.unite ?? "min"})` : "";
    if (ligne.issue === "favorable") (lim != null && k.nature === "sans_compromis" ? ouvert : apporte).push(`${nom}${mesure}${ou}${ancien}`);
    else if (ligne.issue === "reserve" || ligne.issue === "mismatch") accepte.push(`${nom}${ou}${ligne.issue === "mismatch" ? " (moins bien)" : ""}`);
    else if (ligne.issue === "incompatible") (lim != null ? ouvert : accepte).push(`${nom}${mesure}${ou}${ancien}`);
    else {
      const q = p.type === "logement" ? p.logement.verifications.find((v) => v.cle === k.cle && !v.reponse) : undefined;
      ouvert.push(`${nom}${ou} : ${q ? "une question à poser" : "à vérifier"}`);
    }
  }
  return { id: col.id, nom: col.nom, apporte, accepte, ouvert, pasLu, bloque, aRevoir, geste: gestePrincipal(r, p, droits) };
}

// ── Ce qui bloque, ce qui est à revoir : dit une fois ────────────────────────────────────────

export type Alerte = { pisteId: string; cle: CleCritere; phrase: string; genre: "bloque" | "a_revoir" };

export function alertes(r: Recherche, pistes: Piste[]): Alerte[] {
  return pistes.flatMap((p) => {
    if (p.type !== "logement") {
      const a = p.commune.lecture === "rapport" ? analyseServie(communeCommeLieu(p.commune)) : null;
      const dur = r.projet.criteres.filter((k) => k.nature === "sans_compromis" && a && !critereAJour(a, k.cle, r.projet));
      return dur.map((k) => ({ pisteId: idPiste(p), cle: k.cle, genre: "a_revoir" as const, phrase: `${p.commune.nom} a été lue quand votre condition était « ${libelleCritere(a!.projet.criteres.find((x) => x.cle === k.cle) ?? k).toLowerCase()} » : sa conclusion est à revoir pour « ${libelleCritere(k).toLowerCase()} ».` }));
    }
    return conditionsNonTenues(p.logement, r.projet).map((c) => ({ pisteId: p.logement.id, cle: c.cle, genre: c.aJour ? "bloque" as const : "a_revoir" as const, phrase: c.aJour ? c.phrase : phraseARevoir(r, p.logement, c.cle) }));
  });
}

function phraseARevoir(r: Recherche, l: Logement, cle: CleCritere): string {
  const a = analyseServie(l)!;
  const ligne = a.registre.find((x) => x.cle === cle)!;
  const alors = a.projet.criteres.find((x) => x.cle === cle);
  const k = r.projet.criteres.find((x) => x.cle === cle)!;
  return `${l.libelle} a été analysé quand votre limite était de ${alors?.valeur ?? "?"} ${ligne.mesure?.unite ?? "min"} ; mesuré à ${ligne.mesure?.valeur} ${ligne.mesure?.unite}, il pourrait ne plus tenir votre limite de ${k.valeur} ${ligne.mesure?.unite}. Une mise à jour le dirait.`;
}

// ── En bref (comparaison) et Où vous en êtes (accueil) : trois phrases au plus ─────────────

const minus = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** « du T4 rue de la Convention », « de la maison à Doulon », « d'Angers ». */
export function deNom(p: Piste): string {
  const n = nomPiste(p);
  if (p.type === "commune") return /^[aeiouyéèêh]/i.test(n) ? `d'${n}` : `de ${n}`;
  return /^maison/i.test(n) ? `de la ${minus(n)}` : `du ${n}`;
}

function phraseDistingue(r: Recherche, pistes: Piste[]): string | null {
  const c = confronter(r, pistes);
  const parCouche = new Map<Couche, CleCritere[]>();
  for (const li of c.lignes) for (const x of li.couches) if (x.verdict === "distingue") parCouche.set(x.couche, [...(parCouche.get(x.couche) ?? []), li.cle]);
  if (!parCouche.size) return null;
  const parts = [...parCouche.entries()].map(([k, cles]) => `${listeFr(cles.map((x) => minus(NOM_CRITERE[x])))} ${NOM_COUCHE[k].toLowerCase()}`);
  return `Ce qui les distingue vraiment : ${listeFr(parts)}.`;
}

function phraseManque(r: Recherche, pistes: Piste[]): string | null {
  const m = pistes.map((p) => ({ p, g: gestePrincipal(r, p, "unite") })).filter((x) => ["adresse", "analyser", "examiner_commune", "lire_commune"].includes(x.g.cle));
  if (!m.length) return null;
  if (m.length > 2) {
    const nl = m.filter((x) => x.p.type === "logement").length;
    const qui = nl === m.length ? "logements" : nl === 0 ? "communes" : "de vos communes et logements";
    return `${cap(nombre(m.length))} ${qui} attendent encore une adresse ou une analyse avant de se comparer au même niveau.`;
  }
  const bout = (x: (typeof m)[number]) => (x.g.cle === "adresse" ? `l'adresse ${deNom(x.p)}` : x.g.cle === "analyser" ? `l'analyse ${deNom(x.p)}` : `la lecture ${deNom(x.p)} pour votre Projet`);
  return `Il manque ${listeFr(m.map(bout))}.`;
}

/** « En bref » d'une comparaison : ce qui bloque (une fois), ce qui distingue, ce qui manque. */
export function enBref(r: Recherche, pistes: Piste[]): string[] {
  const out: string[] = [];
  const al = alertes(r, pistes);
  const b = al.filter((x) => x.genre === "bloque");
  const rev = al.filter((x) => x.genre === "a_revoir");
  if (b.length) out.push(b.length === 1 ? b[0]!.phrase : `${b.length} ne tiennent pas une condition sans compromis : ${listeFr(b.map((x) => nomDe(r, x.pisteId)))}.`);
  else if (rev.length) out.push(rev.length === 1 ? rev[0]!.phrase : `${listeFr(rev.map((x) => nomDe(r, x.pisteId)))} ont été lus sous une ancienne version de votre Projet : leur conclusion sur la gare est à revoir.`);
  else out.push("Aucun ne bloque sur votre condition sans compromis, d'après ce qui est lu.");
  out.push(phraseDistingue(r, pistes) ?? "Rien ne les distingue encore de façon sûre.");
  const m = phraseManque(r, pistes);
  if (m) out.push(m);
  return out.slice(0, 3);
}

const nomDe = (r: Recherche, id: string) => r.logements.find((l) => l.id === id)?.libelle ?? r.communes.find((c) => `c:${c.insee}` === id)?.nom ?? id;

export function pistesActives(r: Recherche): Piste[] {
  return [
    ...r.communes.filter((c) => c.statut !== "ecartee").map((commune) => ({ type: "commune" as const, commune })),
    ...r.logements.filter((l) => l.statut !== "ecarte").map((logement) => ({ type: "logement" as const, logement })),
  ];
}

const NOMBRE = ["aucun", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
const nombre = (n: number, f = false) => (n === 1 && f ? "une" : NOMBRE[n] ?? String(n));

/** « Où vous en êtes », en trois phrases au plus : la recherche, ce qui compte, ce qui manque. */
export function ouVousEnEtes(r: Recherche): string[] {
  const communes = r.communes.filter((c) => c.statut !== "ecartee");
  const logements = r.logements.filter((l) => l.statut !== "ecarte");
  if (!communes.length && !logements.length) return [];
  const analyses = logements.filter((l) => analyseServie(l)?.perimetre === "commune+adresse").length;
  const s1 = logements.length
    ? `${cap(nombre(communes.length, true))} commune${communes.length > 1 ? "s" : ""} et ${nombre(logements.length)} logement${logements.length > 1 ? "s" : ""} en vue ; ${analyses === 0 ? "aucun n'est encore analysé à son adresse" : analyses === 1 ? "un seul est analysé à son adresse" : `${nombre(analyses)} sont analysés à leur adresse`}.`
    : `${cap(nombre(communes.length, true))} commune${communes.length > 1 ? "s" : ""} en vue, aucun logement pour l'instant.`;
  const out = [s1];
  const al = alertes(r, logements.map((logement) => ({ type: "logement" as const, logement })));
  const b = al.find((x) => x.genre === "bloque");
  const rev = al.find((x) => x.genre === "a_revoir");
  const communesP = communes.map((commune) => ({ type: "commune" as const, commune }));
  // Seules les communes lues pour le Projet peuvent « faire la différence » : une lecture gratuite ne compte pas.
  const lues = communes.filter((c) => c.lecture === "rapport");
  const d = lues.length > 1 ? phraseDistingue(r, lues.map((commune) => ({ type: "commune" as const, commune }))) : logements.length > 1 ? phraseDistingue(r, logements.map((logement) => ({ type: "logement" as const, logement }))) : null;
  if (b) out.push(b.phrase);
  else if (d) out.push(d.replace("Ce qui les distingue vraiment", lues.length > 1 ? `Entre ${listeFr(lues.map((c) => c.nom))}, ce qui fait la différence` : "Entre vos logements, ce qui fait la différence"));
  else if (rev) out.push(rev.phrase);
  const m = phraseManque(r, [...communesP, ...logements.map((logement) => ({ type: "logement" as const, logement }))]);
  if (m) out.push(m);
  return out.slice(0, 3);
}

// ── À faire maintenant : trois gestes au plus, dans un ordre de règles dit à l'écran ────────

export type Faire = {
  pisteId: string;
  texte: string;
  pourquoi: string;
  bouton: string;
  /** Ce que fait le bouton : ouvrir une fiche (à une ancre), ou ouvrir le panneau d'un geste d'analyse. */
  action: { type: "fiche"; ancre?: string } | { type: "panneau"; geste: Geste["cle"] };
};

export function aFaire5(r: Recherche, aujourdhui: string, droits: "unite" | "pass"): Faire[] {
  const out: Faire[] = [];
  const actifs = r.logements.filter((l) => l.statut !== "ecarte");
  for (const l of actifs) if (l.visiteLe && l.visiteLe >= aujourdhui) {
    const n = l.verifications.filter((v) => v.moment === "sur_place" && !v.reponse).length;
    out.push({ pisteId: l.id, texte: `Préparer la visite du ${dateCourte(l.visiteLe)} : ${l.libelle}`, pourquoi: n ? `${n === 1 ? "Une question" : `${n} questions`} à poser sur place, qui ${n === 1 ? "peut" : "peuvent"} changer votre lecture.` : "La visite approche.", bouton: "Préparer", action: { type: "fiche", ancre: "verifier" } });
  }
  for (const l of actifs) {
    const v = l.verifications.find((x) => !x.reponse && x.moment !== "avant_engagement" && !(l.visiteLe && l.visiteLe >= aujourdhui && x.moment === "sur_place"));
    if (v) out.push({ pisteId: l.id, texte: `${l.libelle} : ${v.question.charAt(0).toLowerCase()}${v.question.slice(1)}`, pourquoi: v.pourquoi, bouton: "Répondre", action: { type: "fiche", ancre: "verifier" } });
  }
  const pistes = pistesActives(r);
  const ordre: Geste["cle"][] = ["mettre_a_jour", "adresse", "analyser", "examiner_commune"];
  for (const cle of ordre) for (const p of pistes) {
    const g = gestePrincipal(r, p, droits);
    if (g.cle !== cle) continue;
    const n = nomPiste(p);
    if (cle === "mettre_a_jour") out.push({ pisteId: idPiste(p), texte: `Mettre à jour ${p.type === "logement" ? `le dossier ${deNom(p)}` : `le rapport ${deNom(p)}`} avec votre Projet actuel`, pourquoi: "Lu sous une ancienne version de votre Projet : tant qu'il ne l'est pas, sa gare ne se compare pas. Gratuit.", bouton: "Mettre à jour", action: { type: "panneau", geste: cle } });
    if (cle === "adresse") out.push({ pisteId: idPiste(p), texte: `Demander l'adresse exacte ${deNom(p)}`, pourquoi: "Sans elle, seule la commune est lue.", bouton: "Renseigner", action: { type: "fiche", ancre: "adresse" } });
    if (cle === "analyser") out.push({ pisteId: idPiste(p), texte: `Analyser l'adresse ${deNom(p)}`, pourquoi: g.court ?? g.apport, bouton: "Voir ce qu'elle apprendrait", action: { type: "panneau", geste: cle } });
    if (cle === "examiner_commune") out.push({ pisteId: idPiste(p), texte: `Lire ${n} pour votre Projet`, pourquoi: "La lecture gratuite situe la commune ; elle ne dit pas si elle tient vos conditions.", bouton: "Voir ce qu'elle apprendrait", action: { type: "panneau", geste: cle } });
  }
  return out.slice(0, 3);
}

/** Combien de pistes attendent une analyse payante (pour présenter le Pass au bon moment, sans plus). */
export function analysesEnAttente(r: Recherche): number {
  return pistesActives(r).filter((p) => { const g = gestePrincipal(r, p, "unite"); return g.cle === "analyser" || g.cle === "examiner_commune"; }).length;
}

// ── Ce qu'un geste d'analyse apporte, et ce qu'il ne fera pas ──────────────────────────────

export type Portee = { titre: string; lit: string[]; nePasDire: string[]; note: string };

/**
 * LA PORTÉE D'UN GESTE, avant de le faire. Distingue la mise à jour (relire sous le Projet actuel
 * et les données du jour, sans lire plus loin) de l'analyse d'une adresse (lire les abords et le
 * logement). Une mise à jour d'un rapport de commune ne mesure jamais les abords d'un logement.
 */
export function portee(r: Recherche, p: Piste, cle: Geste["cle"]): Portee {
  if (cle === "analyser") {
    const v = valeurAnalyseAdresse(r.projet);
    return {
      titre: `Analyser l'adresse ${deNom(p)}`,
      lit: [...v.lit, ...v.enPartie.map((x) => `en partie, ${x}`)],
      nePasDire: [...v.jamais, "le bruit réel la nuit et la chaleur d'une pièce en été : une visite, ou un occupant, en dira plus"],
      note: "La commune reste lue par son rapport ; l'analyse ajoute les abords et le logement, à la date du jour.",
    };
  }
  if (cle === "examiner_commune") {
    return {
      titre: `Lire ${nomPiste(p)} pour votre Projet`,
      lit: r.projet.criteres.map((k) => NOM_COURT[k.cle]).map((x) => `${x}, à l'échelle de la commune`),
      nePasDire: ["ce qu'il en est d'un logement en particulier : ses abords et le logement demandent son adresse"],
      note: "Les repères gratuits situent la commune parmi les autres ; le rapport dit si elle tient vos conditions.",
    };
  }
  // Mise à jour.
  const lieu = p.type === "commune" ? communeCommeLieu(p.commune) : p.logement;
  const a = analyseServie(lieu);
  const commune = a?.perimetre === "commune";
  return {
    titre: `Mettre à jour ${nomPiste(p)}`,
    lit: ["vos conditions telles qu'elles sont aujourd'hui", "les données publiques du jour"],
    nePasDire: [commune || p.type === "commune" ? "les abords ni un logement : une mise à jour ne lit pas plus loin que l'analyse d'origine, qui ne portait que sur la commune" : "rien de plus que l'analyse d'origine : mêmes échelles, relues aujourd'hui"],
    note: a ? `La version du ${dateCourte(a.generatedAt)} reste lisible telle quelle.` : "",
  };
}

export { communeDe };
