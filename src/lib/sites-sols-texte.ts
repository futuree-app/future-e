// LES PHRASES DES SOLS POLLUÉS AU TERRAIN (FUT-157). Pur et testé : le composant ne fait que les poser.
//
// L'ordre est celui de la doctrine : ce qu'il faut retenir (le fait, au grain où il est établi), ce que cela
// change (les obligations PROPRES à chaque inventaire, jamais celles d'un autre), la vérification qui engage,
// puis la source, les limites et la méthode dans le dépliable.
//
// LES OBLIGATIONS, VÉRIFIÉES LE 30/10/2026 (Code de l'environnement) :
//   - SIS : le vendeur ou le bailleur informe par écrit, et l'acte l'atteste (L. 125-7) ; un projet de
//     construction ou de lotissement soumis à permis de construire ou d'aménager joint l'attestation d'une étude
//     de sols par un bureau certifié (L. 556-2, avec deux exceptions : lotissement déjà attesté, opération sous
//     déclaration d'utilité publique). Rien n'est exigé ici d'un simple achat sans travaux.
//   - SUP : une servitude instituée sur un terrain pollué (L. 515-12) restreint des usages ; annexée au plan
//     d'urbanisme, elle s'impose aux autorisations. Son contenu est celui de l'arrêté : il n'est pas résumé.
//   - Instructions (ex-BASOL) : aucune obligation attachée à l'inscription elle-même. Si une installation classée
//     soumise à autorisation ou à enregistrement a été exploitée sur le terrain, le vendeur en informe l'acheteur par
//     écrit (L. 514-20) : dit au conditionnel, car l'inscription ne le prouve pas.
//   - SIS, recours (L. 125-7, al. 2) : sans l'information écrite, si une pollution rend le terrain impropre à l'usage
//     prévu, résolution, restitution d'une partie du prix ou réduction du loyer dans les deux ans de la découverte.
// Depuis 2023, l'information sur un SIS peut être remise dans un document distinct de l'état des risques :
// aucune phrase ne dit qu'elle « figure dans l'état des risques ».
//
// Interdits, testés : dire le logement « pollué » ou « sain », parler d'exposition ou de santé des occupants,
// une distance présentée comme un niveau de danger, une étude de sols « obligatoire » sans condition.

import {
  etatSitesSols, ficheDemontree, INVENTAIRES,
  type EtatSitesSols, type FicheTerrain, type InventaireTerrain, type LectureSitesSols, type UsageParcelle,
} from "./sites-sols-etat.ts";

export const URL_CARTE_GEORISQUES = "https://www.georisques.gouv.fr/cartes-interactives#/";

/** Le nom d'un inventaire, pour une phrase (« un secteur d'information sur les sols »). */
const UN: Record<InventaireTerrain, string> = {
  sis: "un secteur d'information sur les sols",
  sup: "une servitude liée à une pollution des sols",
  instructions: "un site suivi par l'administration pour une pollution des sols",
};
/** Le nom court d'un inventaire, pour une étiquette. */
export const LIBELLE_INVENTAIRE: Record<InventaireTerrain, string> = {
  sis: "Secteur d'information sur les sols",
  sup: "Servitude d'utilité publique",
  instructions: "Site suivi par l'administration",
};
const PLURIEL: Record<InventaireTerrain, string> = {
  sis: "secteurs d'information sur les sols",
  sup: "servitudes liées à une pollution des sols",
  instructions: "sites suivis par l'administration pour une pollution des sols",
};

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
/** `2020-09-30` (ou un horodatage ISO) -> `30 septembre 2020`. */
export function dateLongue(iso: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${Number(m[3])}${m[3] === "01" ? "er" : ""} ${MOIS[Number(m[2]) - 1]} ${m[1]}` : null;
}

/** `57463-000-BV-0070` -> `BV 70`. Un code d'une autre forme est rendu tel quel. */
export function parcelleCourte(code: string | null): string | null {
  const m = /^\d[\dAB]\d{3}-\d{3}-([0-9A-Z]{1,2})-0*(\d+)$/.exec(code ?? "");
  return m ? `${m[1]} ${m[2]}` : code;
}

/** Une petite aire, dite sans fausse précision : « moins d'un mètre carré », « 3 m² ». */
const surface = (m2: number | null) => (m2 == null || m2 < 1 ? "moins d'un mètre carré" : `${Math.round(m2)} m²`);
const pourcent = (part: number) => (part < 0.01 ? "moins de 1 %" : `${Math.round(part * 100)} %`);
const entiere = (f: FicheTerrain) => f.part != null && f.part >= 0.995;

/** Une liste lisible : « a, b et c ». */
function liste(xs: string[]): string {
  return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`;
}

function laParcelle(u: UsageParcelle): string {
  const c = u.statut === "ecartee" ? null : parcelleCourte(u.code);
  return c ? `la parcelle ${c}` : "la parcelle";
}

/** OÙ EST LE PÉRIMÈTRE, en une phrase, au grain où c'est établi. */
export function phraseSituation(f: FicheTerrain, l: LectureSitesSols): string {
  const couvre = f.part == null ? "recoupée par ce périmètre" : entiere(f) ? "entièrement dans ce périmètre" : `couverte à ${pourcent(f.part)} par ce périmètre`;
  switch (f.situation) {
    case "point_dans":
      if (l.portee !== "adresse") return "L'adresse n'est connue qu'à la voie : le point de la voie est dans ce périmètre, pas forcément le logement.";
      if (l.parcelle.statut === "attribuee" && f.part != null) return entiere(f) ? `L'adresse et toute ${laParcelle(l.parcelle)} sont dans ce périmètre.` : `L'adresse est dans ce périmètre, qui couvre ${pourcent(f.part)} de ${laParcelle(l.parcelle)}.`;
      return "Le point de l'adresse est dans ce périmètre.";
    case "parcelle_recoupe":
      return entiere(f) ? `Toute ${laParcelle(l.parcelle)} de l'adresse est dans ce périmètre.` : `Ce périmètre couvre ${pourcent(f.part ?? 0)} de ${laParcelle(l.parcelle)} de l'adresse.`;
    case "parcelle_bordure":
      return `Ce périmètre ne touche ${laParcelle(l.parcelle)} que sur une bande étroite le long de sa limite (${surface(f.surfaceM2)}). Ce peut n'être qu'un écart entre deux cartes, qui ne se superposent pas au mètre près : la carte seule ne permet pas de trancher.`;
    case "point_en_limite":
      return "Le point de l'adresse est à moins de 2 m de la limite de ce périmètre : à cette distance, la précision des cartes ne permet pas de dire de quel côté il se trouve.";
    case "parcelle_incertaine": {
      const u = l.parcelle;
      if (u.statut === "incertaine" && u.raison === "limite") return `Sur le plan cadastral, l'adresse tombe sur la limite entre deux parcelles ; l'une d'elles est ${couvre}.`;
      const d = u.statut === "incertaine" && u.distanceM != null ? `, à ${Math.max(1, Math.round(u.distanceM))} m,` : "";
      return `Sur le plan cadastral, l'adresse ne tombe dans aucune parcelle. La plus proche${d} est ${couvre}, mais rien ne garantit que ce soit celle du logement.`;
    }
    case "localisation_ponctuelle":
      return `Ce site n'est repéré sur la carte que par un point, qui tombe dans ${laParcelle(l.parcelle)} ; ses limites réelles ne sont pas publiées.`;
    case "geometrie_illisible":
      return "Le périmètre publié n'a pas pu être lu : sa position par rapport au terrain ne se vérifie pas.";
    case "adresse_publiee": {
      const ou = f.adressePubliee?.localisation === "point" ? "n'est repéré sur la carte que par un point" : "n'est pas repéré sur la carte";
      return `Ce site est déclaré à l'adresse « ${f.adressePubliee?.texte ?? ""} », mais il ${ou} : on ne sait pas jusqu'où il s'étend.`;
    }
  }
}

/** UNE ENTRÉE DE LA LISTE : un même site (même nom, même situation) peut figurer dans plusieurs inventaires. */
export type SiteTexte = {
  cle: string;
  nom: string;
  situation: string;
  demontre: boolean;
  inscriptions: { inventaire: InventaireTerrain; libelle: string; statut: string | null; miseAJour: string | null; lien: string | null }[];
};

const suivi = (statut: string) =>
  /cl[ôo]tur/i.test(statut) ? "suivi terminé" : /en cours/i.test(statut) ? "suivi en cours" : `instruction ${statut.toLocaleLowerCase("fr")}`;

function sites(l: LectureSitesSols): SiteTexte[] {
  const out: SiteTexte[] = [];
  for (const f of l.fiches) {
    const cle = `${f.nom.trim().toLocaleLowerCase("fr")}|${f.situation}|${f.part ?? ""}`;
    const inscription = {
      inventaire: f.inventaire,
      // « En cours », « Clôturée » : l'administration publie le statut de son SUIVI (l'instruction), dit en clair.
      libelle: f.inventaire === "instructions" && f.statut ? `${LIBELLE_INVENTAIRE.instructions} (${suivi(f.statut)})` : LIBELLE_INVENTAIRE[f.inventaire],
      statut: f.statut, miseAJour: dateLongue(f.miseAJour), lien: f.fiche,
    };
    const deja = out.find((s) => s.cle === cle);
    if (deja) { deja.inscriptions.push(inscription); deja.demontre ||= ficheDemontree(f, l); continue; }
    out.push({ cle, nom: f.nom, situation: phraseSituation(f, l), demontre: ficheDemontree(f, l), inscriptions: [inscription] });
  }
  return out.sort((a, b) => Number(b.demontre) - Number(a.demontre));
}

// ── Ce que chaque inventaire change, et la vérification qui va avec ───────────────────────────

/**
 * L. 556-2 : tout projet de construction ou de lotissement dans un SIS fait l'objet d'une étude des sols ; s'il
 * demande un permis, le dossier joint l'attestation d'un bureau d'études certifié, sauf deux exceptions (lotissement
 * déjà attesté, opération sous déclaration d'utilité publique), d'où « en principe ».
 */
const CONSTRUIRE_SIS = "Pour construire ou lotir ici, une étude des sols est exigée ; avec un permis, il faudra en principe joindre l'attestation d'un bureau d'études certifié : elle garantit que l'étude a été faite et que le projet en tient compte.";

const CHANGE: Record<InventaireTerrain, (fiches: FicheTerrain[]) => string[]> = {
  sis: () => [
    "En cas de vente ou de location, le vendeur ou le bailleur doit vous en informer par écrit, et l'acte doit le mentionner.",
    CONSTRUIRE_SIS,
  ],
  sup: () => [
    "Lesquels : c'est l'arrêté du préfet qui le dit, à lire depuis la fiche. Tout permis de construire ou de travaux doit le respecter.",
  ],
  instructions: (fiches) => [
    "Cette inscription, à elle seule, n'impose rien de particulier à la vente ou à la location.",
    // L. 514-20 : une obligation propre au terrain d'une installation classée, que la fiche permet souvent de savoir.
    // Elle ne découle pas de l'inscription : elle est dite au conditionnel, et pour la vente seulement.
    "Si une installation classée soumise à autorisation ou à enregistrement a été exploitée sur ce terrain, le vendeur doit toutefois vous en informer par écrit.",
    ...(fiches.some((f) => /cl[ôo]tur/i.test(f.statut ?? ""))
      ? ["Un suivi terminé veut dire que l'administration a clos son dossier, pas que le sol est sans pollution : la fiche dit ce qui a été fait."]
      : []),
  ],
};

/**
 * Ce qu'un inventaire changerait, quand aucune de ses fiches n'est démontrée : une seule phrase, au conditionnel.
 * Une instruction n'entraîne aucune obligation : elle n'a pas de version conditionnelle (ses phrases valent telles quelles).
 */
const CHANGE_SI: Partial<Record<InventaireTerrain, string>> = {
  sis: "Si le terrain est bien dans ce secteur, le vendeur ou le bailleur doit vous en informer par écrit, et un projet de construction ou de lotissement y exige une étude des sols.",
  sup: "Si le terrain est bien sous cette servitude, certains usages ou travaux y sont limités : l'arrêté du préfet dit lesquels, et tout permis doit le respecter.",
};

const VERIFIER: Record<InventaireTerrain, string> = {
  sis: "Demandez au vendeur ou au bailleur l'information écrite sur ce secteur, et ce qu'il sait du terrain : études de sols déjà faites, travaux de dépollution.",
  sup: "Lisez l'arrêté de servitude depuis la fiche, et demandez à la mairie un certificat d'urbanisme : il liste les servitudes qui s'appliquent au terrain.",
  instructions: "Demandez au vendeur ou au bailleur les études de sols déjà réalisées et les éventuelles restrictions d'usage.",
};

/**
 * UNE LIMITE QUI NE TRANCHE PAS SE VÉRIFIE PAR LA LISTE DES PARCELLES. Chaque fiche officielle (SIS, servitude,
 * instruction) publie les parcelles cadastrales qu'elle déclare concernées : c'est la vérification la plus directe
 * à la portée du lecteur. La liste date de la fiche : mesuré le 30/10/2026, 358 des 2 559 numéros déclarés à Paris,
 * Lyon, Marseille et Metz n'existent plus au cadastre (parcelles redécoupées). Son silence ne prouve donc rien.
 */
function verifierLimite(l: LectureSitesSols, fiches: FicheTerrain[]): string {
  const c = l.parcelle.statut === "attribuee" ? parcelleCourte(l.parcelle.code) : null;
  const laquelle = c ? `la parcelle ${c}` : "la parcelle du logement (son numéro figure sur la promesse de vente, ou sur l'avis de taxe foncière du propriétaire)";
  // Plusieurs sites à vérifier : la fiche de chacun est nommée, pour que le lecteur sache laquelle ouvrir.
  const noms = [...new Set(fiches.map((f) => f.nom))];
  const quelle = l.fiches.length > 1 ? `${liste(noms.map((n) => `« ${n} »`))} ` : "";
  const fiche = noms.length > 1 ? `Les fiches officielles ${quelle}listent les parcelles concernées` : `La fiche officielle ${quelle}liste les parcelles concernées`;
  return `${fiche} : regardez si ${laquelle} en fait partie. Si elle n'y est pas, la liste peut être antérieure à un redécoupage du cadastre : demandez au vendeur, au bailleur ou au notaire.`;
}
/** Un périmètre qui ne se lit pas ne se compare pas : seule la fiche, ou le notaire, dit le terrain en cause. */
const VERIFIER_ILLISIBLE = "Le tracé publié de ce périmètre n'a pas pu être lu : la liste des parcelles concernées, sur la fiche officielle, ou le notaire diront si le terrain en fait partie.";
/** L'adresse connue à la rue seulement : le geste le plus utile se fait dans futur•e. */
const REFAIRE_AVEC_NUMERO = "Si vous connaissez le numéro, refaites la recherche avec l'adresse complète : le terrain pourra être situé.";
/** Une fiche sans emprise n'a pas de limite à comparer : c'est la fiche elle-même qui dit le terrain en cause. */
const VERIFIER_EMPRISE = "Lisez la fiche : elle décrit le terrain visé. Demandez au vendeur, au bailleur ou au notaire si le logement en fait partie.";
const sansEmpriseSituee = (f: FicheTerrain) => f.situation === "adresse_publiee" || f.situation === "localisation_ponctuelle";

const RAISON_NON_SITUE: Record<Extract<UsageParcelle, { statut: "ecartee" }>["raison"], string> = {
  adresse_sans_numero: "L'adresse n'est connue qu'à la rue, pas au numéro.",
  absente: "Aucune parcelle cadastrale n'a été trouvée à cette adresse.",
  non_mesurable: "Le tracé de la parcelle n'a pas pu être lu.",
  trop_etendue: "La parcelle est trop étendue pour être lue en une recherche.",
};

/** Les inventaires qui n'ont pas été lus en entier, en clair. */
function nonLus(l: LectureSitesSols): string[] {
  const out = INVENTAIRES.filter((i) => l.inventaires[i] !== "complet").map((i) => PLURIEL[i]);
  if (l.sansEmprise?.etat !== "complet") out.push("la liste des sites de la commune repérés par un simple point, ou pas du tout");
  return out;
}

/**
 * LES FICHES DE LA COMMUNE QUI NE SE SITUENT PAS (un point, ou rien) : la lecture ne vaut pas pour elles, sauf
 * leur adresse publiée, qui a été comparée à celle du logement.
 */
function phraseSansEmprise(l: LectureSitesSols): string | null {
  const n = l.sansEmprise?.etat === "complet" ? l.sansEmprise.ponctuelles + l.sansEmprise.sansGeometrie : 0;
  if (n === 0) return null;
  // Une fiche sans emprise publiée à cette adresse serait listée : sans aucune fiche listée, la comparaison des
  // adresses n'a rien trouvé, et c'est dit.
  const suite = l.fiches.length === 0 ? (n === 1 ? " Il n'est pas déclaré à cette adresse." : " Aucun n'est déclaré à cette adresse.") : "";
  return n === 1
    ? `Un site de la commune n'est repéré que par un point, ou pas du tout : on ne sait pas jusqu'où il s'étend.${suite}`
    : `${n} sites de la commune ne sont repérés que par un point, ou pas du tout : on ne sait pas jusqu'où ils s'étendent.${suite}`;
}

export type TexteSitesSols = {
  etat: EtatSitesSols;
  /** Ce qu'il faut retenir, en une phrase. */
  titre: string;
  /** Les sites qui concernent le terrain ou appellent une vérification (vide pour une absence ou une panne). */
  sites: SiteTexte[];
  /** Ce que cela change : les obligations propres aux inventaires en cause. */
  change: string[];
  /** Les réserves qui conditionnent la lecture, visibles et courtes. */
  limites: string[];
  /** Les gestes qui engagent. */
  verifier: string[];
  marge: { grain: string; valeur: string; source: string };
  savoirPlus: string[];
};

const SOURCE = "Géorisques (BRGM, ministère de la Transition écologique)";
/** Ce que ces inventaires ne mesurent pas : visible quand un site est signalé, replié sinon. */
const EXPOSITION = "Ces inventaires disent ce que l'administration sait du sol, pas ce à quoi les occupants sont exposés.";
/** Le geste après une panne : le bouton du dossier (le lien vers Géorisques est posé juste en dessous). */
const REESSAYER = "Réessayez plus tard avec « Actualiser les données », en haut du dossier.";

function titreDe(etat: EtatSitesSols, l: LectureSitesSols): string {
  const demontrees = l.fiches.filter((f) => ficheDemontree(f, l));
  const fort = (fs: FicheTerrain[]) => INVENTAIRES.find((i) => fs.some((f) => f.inventaire === i))!;
  switch (etat) {
    case "concerne": {
      const i = fort(demontrees);
      const ou = demontrees.some((f) => f.inventaire === i && f.situation === "point_dans") ? "Cette adresse" : "La parcelle de cette adresse";
      const partiel = ou !== "Cette adresse" && demontrees.every((f) => f.inventaire !== i || !entiere(f));
      const verbe = partiel ? "est en partie dans" : "est dans";
      if (i === "sis") return `${ou} ${verbe} ${UN.sis} : l'État y connaît une pollution des sols.`;
      if (i === "sup") return `${ou} ${verbe} le périmètre d'${UN.sup} : certains usages du terrain y sont limités.`;
      return `${ou} ${verbe} le périmètre d'${UN.instructions}.`;
    }
    case "a_verifier": {
      const i = fort(l.fiches);
      const Un = UN[i].replace(/^./, (c) => c.toUpperCase());
      // UN SITE DÉCLARÉ À L'ADRESSE, OU REPÉRÉ DANS LA PARCELLE, n'est pas un vague « peut-être » : le fait est établi,
      // seule son étendue est inconnue (relecture éditoriale du 30/10/2026). Le titre le dit.
      const fs = l.fiches.filter((f) => f.inventaire === i);
      if (fs.every(sansEmpriseSituee)) {
        return fs.some((f) => f.situation === "adresse_publiee")
          ? `${Un} est déclaré à cette adresse. On ne sait pas jusqu'où il s'étend : c'est à vérifier.`
          : `Le repère d'${UN[i]} tombe dans la parcelle de cette adresse. On ne sait pas jusqu'où il s'étend : c'est à vérifier.`;
      }
      return `${Un} touche peut-être ce terrain : c'est à vérifier.`;
    }
    case "aucun":
      return "Aucun des trois inventaires de sols pollués consultés ne concerne la parcelle de cette adresse.";
    case "terrain_non_situe":
      // Le premier mot porte l'état : ce n'est pas une absence, il ne commence donc pas par « Aucun ».
      return "Le terrain n'a pas pu être situé : rien ne peut être conclu pour lui. Seul le point de l'adresse a été comparé aux inventaires de sols pollués, et aucun ne le contient.";
    case "incomplet":
      return "Une partie des inventaires de sols pollués n'a pas pu être lue : ce terrain n'a pas pu être vérifié en entier.";
    case "indisponible":
      return "Les inventaires de sols pollués n'ont pas répondu quand ce dossier a été préparé : ce terrain n'a pas pu être vérifié.";
  }
}

function valeurMarge(etat: EtatSitesSols, l: LectureSitesSols): string {
  if (etat === "concerne" || etat === "a_verifier") {
    const n = new Set(l.fiches.map((f) => f.inventaire)).size;
    return `${etat === "concerne" ? "concerné" : "à vérifier"} · ${n} inventaire${n > 1 ? "s" : ""}`;
  }
  return etat === "aucun" ? "aucun périmètre" : etat === "terrain_non_situe" ? "terrain non situé" : "non vérifié";
}

/** LE TEXTE D'UNE LECTURE. `null` : rapport écrit avant FUT-157 ; rien ne s'affiche. */
export function texteSitesSols(l: LectureSitesSols | null | undefined): TexteSitesSols | null {
  if (!l) return null;
  const etat = etatSitesSols(l);
  const enCause = INVENTAIRES.filter((i) => l.fiches.some((f) => f.inventaire === i));
  // UN SITE INSTRUIT QUI EST AUSSI UN SIS OU UNE SERVITUDE (Sotrameuse, AVIA-RASPAIL) : l'instruction n'ajoute
  // ni obligation ni vérification à celles du secteur ou de la servitude. Ses phrases ne sont dites que seule.
  const dits = enCause.includes("instructions") && enCause.length > 1 ? enCause.filter((i) => i !== "instructions") : enCause;
  // Ce qu'un inventaire change ne vaut que s'il concerne le terrain : sans fiche démontrée, c'est dit au conditionnel.
  const change = dits.flatMap((i) => {
    const fs = l.fiches.filter((f) => f.inventaire === i);
    const lignes = CHANGE[i](fs);
    return fs.some((f) => ficheDemontree(f, l)) || !CHANGE_SI[i] ? lignes : [CHANGE_SI[i]!];
  });
  const verifier: string[] = [];
  const aVerifier = l.fiches.filter((f) => !ficheDemontree(f, l));
  const limitesAVerifier = aVerifier.filter((f) => !sansEmpriseSituee(f) && f.situation !== "geometrie_illisible");
  if (limitesAVerifier.length > 0) verifier.push(verifierLimite(l, limitesAVerifier));
  // Un SIS ou une servitude qui ne couvre qu'une PARTIE de la parcelle : la liste de la fiche dit si l'arrêté vise
  // cette parcelle (R. 125-24 : la liste des SIS précise les parcelles concernées). Question de la relecture.
  const enPartie = l.fiches.filter((f) => ficheDemontree(f, l) && f.inventaire !== "instructions" && f.part != null && !entiere(f));
  if (limitesAVerifier.length === 0 && enPartie.length > 0) verifier.push(verifierLimite(l, enPartie));
  if (aVerifier.some((f) => f.situation === "geometrie_illisible")) verifier.push(VERIFIER_ILLISIBLE);
  if (aVerifier.some(sansEmpriseSituee)) verifier.push(VERIFIER_EMPRISE);
  verifier.push(...dits.map((i) => VERIFIER[i]));

  const limites: string[] = [];
  const manquent = nonLus(l);
  const signale = etat === "concerne" || etat === "a_verifier";
  if (signale) {
    if (manquent.length > 0 && l.statut === "lu") limites.push(`Non lus en entier : ${liste(manquent)}. D'autres périmètres peuvent exister.`);
    // La première question d'un acheteur, dite où il la pose : ce que ces inventaires ne mesurent pas.
    limites.push(EXPOSITION);
  } else if (etat === "incomplet") {
    limites.push(`Non lus en entier : ${liste(manquent)}.`);
    verifier.push(REESSAYER);
  } else if (etat === "indisponible") {
    verifier.push(REESSAYER);
  } else if (etat === "terrain_non_situe") {
    const raison = l.parcelle.statut === "ecartee" ? l.parcelle.raison : null;
    if (raison) limites.push(RAISON_NON_SITUE[raison]);
    if (raison === "adresse_sans_numero") verifier.push(REFAIRE_AVEC_NUMERO);
    verifier.push("Demandez au notaire, au vendeur ou au bailleur si le terrain est dans un secteur d'information sur les sols ou sous une servitude liée à une pollution.");
  } else if (etat === "aucun") {
    limites.push("Ces inventaires ne recensent que les pollutions connues de l'État : ce n'est pas la preuve d'un sol sans pollution.");
    verifier.push("Le certificat d'urbanisme, à demander à la mairie, indique en plus si le terrain figure sur la carte des anciennes activités industrielles et de services.");
  }
  // Les fiches sans emprise bornent une ABSENCE : elles sont dites au premier niveau quand rien n'est listé, et
  // dans le dépliable sinon.
  const sansEmprise = phraseSansEmprise(l);
  if (sansEmprise && (etat === "aucun" || etat === "terrain_non_situe")) limites.push(sansEmprise);

  const grain = l.parcelle.statut === "attribuee" ? "parcelle" : l.parcelle.statut === "incertaine" ? "parcelle à confirmer" : "point de l'adresse";
  return {
    etat, titre: titreDe(etat, l), sites: sites(l), change, limites, verifier,
    marge: { grain, valeur: valeurMarge(etat, l), source: SOURCE },
    savoirPlus: [
      "Un secteur d'information sur les sols est arrêté par le préfet sur des terrains où l'État connaît une pollution des sols. Une servitude liée à une pollution est une autre mesure, prise elle aussi par arrêté du préfet : elle limite certains usages d'un terrain pollué. Un site suivi par l'administration (ancienne base BASOL) est un terrain où l'administration est intervenue pour une pollution suspectée ou avérée.",
      // L. 125-7, alinéa 2, relu le 30/10/2026 : le recours n'existe que pour un SIS. Dit seulement quand un SIS est en cause.
      ...(enCause.includes("sis")
        ? ["Si l'information écrite sur un secteur d'information sur les sols n'a pas été donnée et qu'une pollution rend ensuite le terrain impropre à l'usage prévu au contrat, l'acheteur ou le locataire peut, dans les deux ans suivant sa découverte, demander l'annulation du contrat, une partie du prix ou une baisse du loyer."]
        : []),
      "Chaque périmètre publié est confronté au point de l'adresse et à sa parcelle cadastrale : une simple proximité ne compte jamais. La parcelle n'est retenue comme celle du logement que si le point de l'adresse y tombe, et elle seule. Ce point situe l'adresse, pas un bâtiment ni un logement précis.",
      "Les cartes de l'inventaire et du cadastre ne se superposent pas au mètre près. Un périmètre ne concerne le terrain que s'il y entre de plus de 2 m ; en deçà, même une bande de moins d'un mètre carré est signalée, à vérifier, et jamais écartée.",
      "La part indiquée est celle de la parcelle, qui peut être bien plus grande que le logement.",
      ...(signale ? [] : [EXPOSITION]),
      "Ne sont pas lus ici : les anciennes activités industrielles et de services (CASIAS), qui disent qu'une activité a existé, pas qu'une pollution a été constatée ; les friches ; le registre des émissions industrielles.",
      ...(sansEmprise && signale ? [sansEmprise] : []),
      "Un site qui n'est repéré que par un point, ou pas du tout, ne peut pas être délimité. On regarde seulement si son point tombe dans la parcelle du logement, et si l'adresse qu'il déclare est la même (numéro et rue). Ces sites sont cherchés dans la commune de l'adresse, y compris ses arrondissements et ses anciennes communes, pas dans les communes voisines.",
      `Inventaires consultés quand ce dossier a été préparé, sur ${SOURCE}. Références : Code de l'environnement, articles L. 125-6 et L. 125-7 (information), L. 556-2 (étude de sols), L. 515-12 (servitudes), L. 514-20 (vente du terrain d'une installation classée).`,
    ],
  };
}
