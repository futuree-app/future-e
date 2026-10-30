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
//   - Instructions (ex-BASOL) : aucune obligation attachée à l'inscription elle-même.
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
  instructions: "un site pollué suivi par l'administration",
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
  instructions: "sites pollués suivis par l'administration",
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

const pourcent = (part: number) => `${Math.max(1, Math.round(part * 100))} %`;
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
      return `Ce périmètre ne touche ${laParcelle(l.parcelle)} que sur une bande de ${Math.round(f.surfaceM2 ?? 0)} m², ce qui peut n'être qu'un écart de tracé.`;
    case "point_en_limite":
      return "Le point de l'adresse est exactement sur la limite de ce périmètre.";
    case "parcelle_incertaine": {
      const u = l.parcelle;
      if (u.statut === "incertaine" && u.raison === "limite") return `Le point de l'adresse est sur la limite entre deux parcelles ; l'une d'elles est ${couvre}.`;
      const d = u.statut === "incertaine" && u.distanceM != null ? `, à ${Math.max(1, Math.round(u.distanceM))} m,` : "";
      return `Le point de l'adresse ne tombe dans aucune parcelle. La plus proche${d} est ${couvre}, mais rien ne garantit que ce soit celle du logement.`;
    }
    case "localisation_ponctuelle":
      return `Cette fiche n'est située que par un point, qui tombe dans ${laParcelle(l.parcelle)} ; son emprise réelle n'est pas publiée.`;
    case "geometrie_illisible":
      return "Le périmètre publié n'a pas pu être lu : sa position par rapport au terrain ne se vérifie pas.";
    case "adresse_publiee": {
      const ou = f.adressePubliee?.localisation === "point" ? "n'est située que par un point" : "n'a aucune localisation publiée";
      return `Cette fiche est publiée à l'adresse « ${f.adressePubliee?.texte ?? ""} », mais elle ${ou} : son emprise réelle n'est pas connue.`;
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

function sites(l: LectureSitesSols): SiteTexte[] {
  const out: SiteTexte[] = [];
  for (const f of l.fiches) {
    const cle = `${f.nom.trim().toLocaleLowerCase("fr")}|${f.situation}|${f.part ?? ""}`;
    const inscription = {
      inventaire: f.inventaire,
      // « En cours », « Clôturée » : l'administration publie le statut de l'INSTRUCTION, au féminin.
      libelle: f.inventaire === "instructions" && f.statut ? `${LIBELLE_INVENTAIRE.instructions} (instruction ${f.statut.toLocaleLowerCase("fr")})` : LIBELLE_INVENTAIRE[f.inventaire],
      statut: f.statut, miseAJour: dateLongue(f.miseAJour), lien: f.fiche,
    };
    const deja = out.find((s) => s.cle === cle);
    if (deja) { deja.inscriptions.push(inscription); deja.demontre ||= ficheDemontree(f, l); continue; }
    out.push({ cle, nom: f.nom, situation: phraseSituation(f, l), demontre: ficheDemontree(f, l), inscriptions: [inscription] });
  }
  return out.sort((a, b) => Number(b.demontre) - Number(a.demontre));
}

// ── Ce que chaque inventaire change, et la vérification qui va avec ───────────────────────────

const CHANGE: Record<InventaireTerrain, (fiches: FicheTerrain[]) => string[]> = {
  sis: () => [
    "En cas de vente ou de location, le vendeur ou le bailleur doit vous en informer par écrit, et l'acte doit le mentionner.",
    "Un projet de construction ou de lotissement soumis à permis devra comporter l'attestation d'une étude de sols par un bureau d'études certifié.",
  ],
  sup: () => [
    "Une servitude d'utilité publique limite certains usages du terrain ou certains travaux ; elle s'impose aux autorisations d'urbanisme. Son contenu est fixé par un arrêté du préfet.",
  ],
  instructions: (fiches) => [
    "Cette inscription n'entraîne pas, à elle seule, d'obligation pour l'acheteur.",
    ...(fiches.some((f) => /cl[ôo]tur/i.test(f.statut ?? ""))
      ? ["Une instruction clôturée veut dire que l'administration a terminé son suivi, pas que le sol est sans pollution : la fiche dit ce qui a été fait."]
      : []),
  ],
};

/**
 * Ce qu'un inventaire changerait, quand aucune de ses fiches n'est démontrée : une seule phrase, au conditionnel.
 * Une instruction n'entraîne aucune obligation : elle n'a pas de version conditionnelle (ses phrases valent telles quelles).
 */
const CHANGE_SI: Partial<Record<InventaireTerrain, string>> = {
  sis: "Si c'est le cas, le vendeur ou le bailleur doit vous en informer par écrit, et un projet de construction ou de lotissement soumis à permis devra comporter l'attestation d'une étude de sols par un bureau d'études certifié.",
  sup: "Si c'est le cas, la servitude limite certains usages du terrain ou certains travaux, selon l'arrêté du préfet, et s'impose aux autorisations d'urbanisme.",
};

const VERIFIER: Record<InventaireTerrain, string> = {
  sis: "Demandez au vendeur l'information écrite sur ce secteur et l'historique du terrain : études de sols, travaux de dépollution.",
  sup: "Lisez l'arrêté de servitude depuis la fiche, et demandez à la mairie un certificat d'urbanisme : il liste les servitudes qui s'appliquent au terrain.",
  instructions: "Lisez la fiche du site, et demandez au vendeur les études de sols réalisées et les éventuelles restrictions d'usage.",
};

const VERIFIER_LIMITE = "Comparez sur la carte de Géorisques la limite du périmètre et celle du terrain, et demandez au vendeur ou au notaire si le terrain est concerné.";
/** Une fiche sans emprise n'a pas de limite à comparer : c'est la fiche elle-même qui dit le terrain en cause. */
const VERIFIER_EMPRISE = "Lisez la fiche pour savoir quel terrain elle vise, et demandez au vendeur ou au notaire si celui-ci en fait partie.";
const sansEmpriseSituee = (f: FicheTerrain) => f.situation === "adresse_publiee" || f.situation === "localisation_ponctuelle";

const RAISON_NON_SITUE: Record<Extract<UsageParcelle, { statut: "ecartee" }>["raison"], string> = {
  adresse_sans_numero: "l'adresse n'est connue qu'à la voie",
  absente: "aucune parcelle cadastrale n'a été trouvée à ce point",
  non_mesurable: "le tracé de la parcelle n'a pas pu être lu",
  trop_etendue: "la parcelle est trop étendue pour être lue en une recherche",
};

/** Les inventaires qui n'ont pas été lus en entier, en clair. */
function nonLus(l: LectureSitesSols): string[] {
  const out = INVENTAIRES.filter((i) => l.inventaires[i] !== "complet").map((i) => PLURIEL[i]);
  if (l.sansEmprise?.etat !== "complet") out.push("la liste des fiches de la commune sans emprise publiée");
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
  const suite = l.fiches.length === 0 ? " Aucune n'est publiée à cette adresse." : "";
  return n === 1
    ? `Une fiche de la commune n'a pas d'emprise publiée : elle ne peut pas être située par rapport au terrain.${suite}`
    : `${n} fiches de la commune n'ont pas d'emprise publiée : elles ne peuvent pas être situées par rapport au terrain.${suite}`;
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
  marge: { grain: string; valeur: string; source: string; date: string | null };
  savoirPlus: string[];
};

const SOURCE = "Géorisques (BRGM, ministère de la Transition écologique)";

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
    case "a_verifier":
      return `${UN[fort(l.fiches)].replace(/^./, (c) => c.toUpperCase())} touche peut-être ce terrain : c'est à vérifier.`;
    case "aucun":
      return "Aucun secteur d'information sur les sols, aucune servitude liée à une pollution et aucun site pollué suivi par l'administration ne concerne la parcelle de cette adresse.";
    case "terrain_non_situe":
      return "Aucun de ces périmètres ne contient le point de l'adresse, mais le terrain lui-même n'a pas pu être situé.";
    case "incomplet":
      return "Une partie des inventaires de sols pollués n'a pas pu être lue : rien ne peut être conclu sur ce terrain.";
    case "indisponible":
      return "Les inventaires de sols pollués n'ont pas répondu lors de la collecte : rien ne peut être conclu sur ce terrain.";
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
  if (aVerifier.some((f) => !sansEmpriseSituee(f))) verifier.push(VERIFIER_LIMITE);
  if (aVerifier.some(sansEmpriseSituee)) verifier.push(VERIFIER_EMPRISE);
  verifier.push(...dits.map((i) => VERIFIER[i]));

  const limites: string[] = [];
  const manquent = nonLus(l);
  if (etat === "concerne" || etat === "a_verifier") {
    if (manquent.length > 0 && l.statut === "lu") limites.push(`Non lus en entier : ${liste(manquent)}. D'autres périmètres peuvent exister.`);
  } else if (etat === "incomplet") {
    limites.push(`Non lus en entier : ${liste(manquent)}.`);
    verifier.push("Actualisez les données plus tard, ou consultez la carte de Géorisques.");
  } else if (etat === "indisponible") {
    verifier.push("Actualisez les données plus tard, ou consultez la carte de Géorisques.");
  } else if (etat === "terrain_non_situe") {
    const raison = l.parcelle.statut === "ecartee" ? RAISON_NON_SITUE[l.parcelle.raison] : null;
    limites.push(`${raison ? `${raison.replace(/^./, (c) => c.toUpperCase())} : ce` : "Ce"} n'est donc pas une absence vérifiée pour le terrain.`);
    verifier.push("Demandez au notaire si le terrain est situé dans un secteur d'information sur les sols, ou vérifiez-le sur la carte de Géorisques.");
  } else if (etat === "aucun") {
    limites.push("Ces inventaires ne recensent que les pollutions connues de l'État : ce n'est pas la preuve d'un sol sans pollution.");
    verifier.push("Le certificat d'urbanisme délivré par la mairie indique aussi si le terrain figure sur la carte des anciens sites industriels.");
  }
  // Les fiches sans emprise bornent une ABSENCE : elles sont dites au premier niveau quand rien n'est listé, et
  // dans le dépliable sinon.
  const sansEmprise = phraseSansEmprise(l);
  if (sansEmprise && (etat === "aucun" || etat === "terrain_non_situe")) limites.push(sansEmprise);

  const grain = l.parcelle.statut === "attribuee" ? "parcelle" : l.parcelle.statut === "incertaine" ? "parcelle à confirmer" : "point de l'adresse";
  const date = dateLongue(l.consulteLe);
  return {
    etat, titre: titreDe(etat, l), sites: sites(l), change, limites, verifier,
    marge: { grain, valeur: valeurMarge(etat, l), source: SOURCE, date },
    savoirPlus: [
      "Un secteur d'information sur les sols est arrêté par le préfet sur des terrains où l'État connaît une pollution des sols. Une servitude d'utilité publique y restreint des usages par arrêté. Un site suivi par l'administration (ancienne base BASOL) est un terrain où elle est intervenue pour une pollution suspectée ou avérée.",
      "Chaque périmètre publié est confronté au point de l'adresse et à sa parcelle cadastrale : une simple proximité ne compte jamais. La parcelle n'est retenue comme celle du logement que si le point de l'adresse y tombe, et elle seule.",
      "La part indiquée est celle de la parcelle, qui peut être bien plus grande que le logement.",
      "Ces inventaires disent ce que l'administration sait d'un sol ; ils ne mesurent pas ce à quoi les occupants sont exposés.",
      "Ne sont pas lus ici : les anciennes activités industrielles et de services (CASIAS), qui disent qu'une activité a existé, pas qu'une pollution a été constatée ; les friches ; le registre des émissions industrielles.",
      ...(sansEmprise && (etat === "concerne" || etat === "a_verifier") ? [sansEmprise] : []),
      "Une fiche sans emprise publiée (localisée par un simple point, ou pas du tout) ne se situe pas : seule son adresse publiée est comparée à celle du logement, numéro et voie. Ces fiches sont lues dans la commune de l'adresse (avec ses arrondissements et ses anciens codes), pas dans les communes voisines.",
      `Inventaires consultés${date ? ` le ${date}` : ""} sur ${SOURCE}. Références : Code de l'environnement, articles L. 125-6 et L. 125-7 (information), L. 556-2 (étude de sols), L. 515-12 (servitudes).`,
    ],
  };
}
