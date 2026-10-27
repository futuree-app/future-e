// CE QUE L'ÉCRAN DIT DU BRUIT AÉRIEN (FUT-146). Lib PURE, sans géométrie : lisible côté client, testée sous
// `node --test`. Les composants ne décident rien : ils posent ces phrases.
//
// ── DEUX ÉCHELLES, DEUX UTILITÉS, UN MÊME FAIT ────────────────────────────────────────────────
//  - AUTOUR (le quartier) : le secteur est-il couvert par un plan, lequel, et la visite à faire. Le point
//    de l'adresse suffit, et la phrase parle du secteur.
//  - LOGEMENT (le bien) : la zone du bien, le document que le vendeur ou le bailleur doit remettre, l'aide
//    à l'insonorisation qui PEUT exister, ce qu'il faut demander avant un projet, et la sûreté du
//    rattachement. Il ne répète pas le geste de visite d'Autour.
//
// ── CE QU'AUCUNE PHRASE NE DIT ───────────────────────────────────────────────────────────────
//  Ni « bruyant », ni décibels, ni « exposé » : une zone dit ce que le plan prévoit. Ni « interdit de
//  construire », ni « constructible » : la règle dépend de la zone, du projet et du secteur. Ni « droit à
//  l'aide » : le PGS ouvre une possibilité. Ni « pas de bruit d'avion » hors zone.

import type { LecturePlan, LectureBruitAerien, ZoneLue } from "./bruit-aerien.ts";
import { LIMITE_PROCHE_M } from "./bruit-aerien-constantes.ts";
import { PART_MIN } from "./urbanisme-nomenclature.ts";
import { dateLongue } from "./data/gaspar-pprn-inondation.ts";
import { deCommune } from "./typography.ts";

/** Ce que le plan dit de chaque zone, dans ses propres termes (Code de l'urbanisme, notice DGAC). */
const SENS_PEB: Record<string, string> = {
  A: "la zone la plus exposée du plan",
  B: "une zone de bruit fort selon le plan",
  C: "une zone de bruit modéré selon le plan",
  D: "la zone la moins exposée du plan",
};

export const NOM_PEB = "plan d'exposition au bruit";
export const NOM_PGS = "plan de gêne sonore";

function distance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}
/** « l'aérodrome de Marseille-Provence », « l'aérodrome d'Albi ». */
const aerodrome = (z: ZoneLue) => `l'aérodrome ${deCommune(z.aerodrome.nom)}`;

/**
 * « la zone C » ; plusieurs zones distinctes : « les zones C et D » (revue du 27/10/2026 : « la zones »).
 * Le verbe s'accorde avec `pluriel`.
 */
function laZone(l: ZoneLue[]): { texte: string; pluriel: boolean } {
  const noms = [...new Set(l.map((z) => z.zone))];
  return noms.length <= 1
    ? { texte: `la zone ${noms[0] ?? ""}`.trim(), pluriel: false }
    : { texte: `les zones ${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`, pluriel: true };
}

/** « de la zone C », « des zones C et D ». */
const deZones = (l: ZoneLue[]) => { const z = laZone(l); return z.pluriel ? `des ${z.texte.slice(4)}` : `de ${z.texte}`; };

/** Les zones voisines d'une limite, sans la zone retenue elle-même. */
function voisines(p: LecturePlan): ZoneLue[] {
  return p.enLimite.filter((z) => !p.retenue || z.zone !== p.retenue.zone || z.aerodrome.oaci !== p.retenue.aerodrome.oaci);
}

/** Les autres aérodromes dont un plan couvre aussi le bien (champ absent des lectures antérieures). */
const autresAerodromes = (p: LecturePlan) => p.autresAerodromes ?? [];

/** « Le secteur est aussi en zone D du plan d'exposition au bruit de l'aérodrome de Paris-Le Bourget. » */
function phraseAutresAerodromes(sujet: string, nom: string, p: LecturePlan): string | null {
  const a = autresAerodromes(p);
  if (a.length === 0) return null;
  const liste = a.map((z) => `en zone ${z.zone} du ${nom} de ${aerodrome(z)}`).join(", et ");
  return `${sujet} est aussi ${liste} : les plans de chaque aérodrome s'appliquent.`;
}

/** La date d'un arrêté, dite seulement si elle est établie. */
export function phraseArrete(z: ZoneLue): string {
  const d = dateLongue(z.dateArrete);
  return d
    ? `Plan de ${aerodrome(z)} approuvé le ${d}.`
    : `La date d'approbation du plan de ${aerodrome(z)} n'est pas établie dans la donnée publiée : elle se lit sur l'arrêté.`;
}

export type TexteBruit = {
  /** Le constat, en une phrase. */
  retenir: string;
  /** Ce que le constat ne permet pas de conclure. */
  limite: string | null;
  /** Une action concrète. */
  verifier: string | null;
  /** Lignes d'appoint (autre aérodrome, plan de gêne sonore), quand elles apprennent quelque chose. */
  complement: string | null;
  /** Le dépliable : document, zone, dates, source, méthode. */
  savoirPlus: string[];
  /** Le document officiel à ouvrir, s'il est publié. */
  document: { libelle: string; url: string } | null;
};

const LIMITE_PEB = "Ce plan encadre la construction autour de l'aérodrome à partir du trafic prévu : il ne mesure pas le bruit que l'on entend dans un logement.";
const LIMITE_PGS = "Ce plan délimite les zones où une aide à l'insonorisation peut être accordée : il ne mesure pas le bruit que l'on entend dans un logement.";
const LIMITE_HORS = "Être hors de ces zones ne veut pas dire ne pas entendre d'avions : un survol reste possible.";
const SENS_PGS_TEXTE = "Le plan de gêne sonore délimite les zones où les riverains peuvent bénéficier d'une aide à l'insonorisation de leur logement, à des conditions propres (date du logement, aide déjà reçue). L'exploitant de l'aéroport instruit les demandes.";

function source(l: LectureBruitAerien): string {
  const s = l.source;
  return s
    ? `Source : ${s.producteur}, plans diffusés par la ${s.diffuseur}, copie extraite le ${dateLongue(s.extraitLe) ?? s.extraitLe}. ${s.licence} (aucune licence propre déclarée par la DGAC).`
    : "Source : DGAC, plans diffusés par la Géoplateforme IGN.";
}

function documentDe(z: ZoneLue | null, nom: string): TexteBruit["document"] {
  return z?.document ? { libelle: `Consulter l'arrêté du ${nom}`, url: z.document } : null;
}

const pgsEnZone = (p: LecturePlan) => (p.etat === "en_zone" || p.etat === "en_limite") && !!p.retenue;
const lignes = (...l: (string | null)[]) => l.filter(Boolean).join(" ") || null;

/**
 * AUTOUR : le secteur. `null` quand il n'y a rien à dire (aucun plan dans un rayon de 5 km) : le silence
 * vaut mieux qu'un « aucun plan » qui ressemblerait à une promesse de calme.
 */
export function texteAutour(l: LectureBruitAerien | null | undefined): TexteBruit | null {
  if (!l) return null;
  if (l.statut === "indisponible") {
    return {
      retenir: "Les plans de bruit des aérodromes n'ont pas pu être lus pour ce secteur.",
      limite: "Rien ne peut en être conclu, ni dans un sens ni dans l'autre.",
      verifier: "Le plan d'exposition au bruit se consulte en mairie et sur le Géoportail.",
      complement: null, savoirPlus: [], document: null,
    };
  }
  const p = l.peb;
  const g = l.pgs;
  const secteur = l.portee === "secteur" ? "Le secteur de cette adresse (géocodée sans numéro)" : "Ce secteur";
  const savoirPlus = [
    "Le plan d'exposition au bruit est un document d'urbanisme approuvé par arrêté. Il découpe les abords d'un aérodrome en zones A à D à partir des prévisions de trafic, de la plus exposée à la moins exposée.",
    `Lecture au point de l'adresse. Une limite de zone à moins de ${LIMITE_PROCHE_M} m est signalée : le tracé du plan et la position de l'adresse ne sont pas précis au mètre.`,
    source(l),
  ];
  // Le PGS : une ligne d'appoint, sauf quand il est seul à parler (revue du 27/10/2026 : à Orly et à
  // Toulouse, il déborde du PEB ; on lisait « hors des zones du PEB » suivi de « aussi en zone III »).
  const pgsLigne = pgsEnZone(g)
    ? `Le secteur est ${p.retenue ? "aussi" : "en revanche"} en zone ${g.retenue!.zone} du ${NOM_PGS} de ${aerodrome(g.retenue!)}${p.etat === "en_zone" || p.etat === "en_limite" ? "" : " : ce plan délimite les zones où une aide à l'insonorisation peut être accordée"}.`
    : null;
  if (p.etat === "incertain") {
    return {
      retenir: `La zone du ${NOM_PEB} n'a pas pu être établie pour ce secteur : un tracé publié à moins de ${LIMITE_PROCHE_M} m de l'adresse n'est pas mesurable.`,
      limite: "Rien n'en est conclu, ni dans un sens ni dans l'autre.",
      verifier: "Le plan se consulte en mairie et sur le Géoportail.",
      complement: pgsLigne, savoirPlus, document: null,
    };
  }
  if (p.etat === "absent") {
    if (!pgsEnZone(g)) return null;
    const z = g.retenue!;
    return {
      retenir: `${secteur} est en zone ${z.zone} du ${NOM_PGS} de ${aerodrome(z)}.`,
      limite: LIMITE_PGS,
      verifier: "Passez sur place aux heures de décollage et d'atterrissage.",
      complement: null,
      savoirPlus: [SENS_PGS_TEXTE, ...savoirPlus.slice(1), phraseArrete(z)],
      document: documentDe(z, NOM_PGS),
    };
  }
  if (p.etat === "hors_zone" && p.plusProche) {
    const z = p.plusProche;
    return {
      retenir: `${secteur} est hors des zones du ${NOM_PEB} de ${aerodrome(z)} : la plus proche, la zone ${z.zone}, est à ${distance(z.distanceM)}.`,
      limite: LIMITE_HORS,
      verifier: "Passez sur place à plusieurs heures de la journée, en semaine, pour entendre le trafic aérien.",
      complement: pgsLigne,
      savoirPlus: [...savoirPlus, phraseArrete(z)],
      document: documentDe(z, NOM_PEB),
    };
  }
  const r = p.retenue;
  const v = voisines(p);
  let retenir: string;
  if (r) {
    const base = `${secteur} est en zone ${r.zone} du ${NOM_PEB} de ${aerodrome(r)}, ${SENS_PEB[r.zone] ?? "selon le plan"}`;
    retenir = p.etat === "en_limite"
      ? `${base}, à moins de ${LIMITE_PROCHE_M} m ${v.length ? deZones(v) : "de la limite de cette zone"}.`
      : `${base}.`;
  } else {
    retenir = `${secteur} est à moins de ${LIMITE_PROCHE_M} m ${deZones(p.enLimite)} du ${NOM_PEB} de ${aerodrome(p.enLimite[0])}.`;
  }
  const ref = r ?? p.enLimite[0];
  return {
    retenir,
    limite: LIMITE_PEB,
    verifier: p.etat === "en_limite"
      ? "La zone exacte d'un logement se lit sur le plan, qui se consulte en mairie et sur le Géoportail."
      : "Passez sur place aux heures de décollage et d'atterrissage, et demandez en mairie si le plan est en cours de révision.",
    complement: lignes(phraseAutresAerodromes("Le secteur", NOM_PEB, p), pgsLigne),
    savoirPlus: [
      ...savoirPlus,
      ...[ref, ...autresAerodromes(p)].map(phraseArrete),
      ...[ref, ...autresAerodromes(p)].map((z) => `Aérodrome : ${z.aerodrome.nom} (code ${z.aerodrome.oaci}).`),
    ],
    document: documentDe(ref, NOM_PEB),
  };
}

// ── LOGEMENT : le bien ───────────────────────────────────────────────────────────────────────

/** Comment le bien a été situé, dit quand ce n'est pas la parcelle. */
function rattachement(l: LectureBruitAerien): string | null {
  if (l.portee === "secteur") return "L'adresse est géocodée sans numéro : la lecture porte sur un point de la rue, pas sur ce logement.";
  if (l.portee === "non_precisee") return "La précision de la localisation n'est pas connue : la lecture porte sur le point de l'adresse.";
  switch (l.parcelleEcartee) {
    case "repli": return "La parcelle rattachée à l'adresse l'a été par proximité et pourrait être celle d'un voisin : la lecture porte sur le point de l'adresse.";
    case "limite": return "Le point de l'adresse tombe sur la limite de deux parcelles : la lecture porte sur ce point.";
    case "non_mesurable": return "Le tracé de la parcelle n'a pas pu être mesuré : la lecture porte sur le point de l'adresse.";
    case "absente": return "Aucune parcelle n'a été rattachée à l'adresse : la lecture porte sur son point.";
    default: return null;
  }
}

/**
 * La part de la parcelle dans la zone, dite seulement quand le reste compte : un reste de moins de 2 % est
 * l'écart de tracé de la convention FUT-81 (`PART_MIN`), « pour 99 % » laisserait croire à autre chose.
 */
function pourcent(part: number | null): string | null {
  if (part == null || part >= 1 - PART_MIN) return null;
  return `${Math.max(1, Math.round(part * 100))} %`;
}

/** Le sujet d'une phrase du Logement : le logement seulement quand sa parcelle a été lue. */
const sujetLogement = (l: LectureBruitAerien) => (l.grain === "parcelle" ? "Le logement" : "Le point de l'adresse");

/**
 * LOGEMENT : le bien. `null` quand rien n'est à dire (aucun plan dans le voisinage). Le titre est le fait
 * (« Zone C du plan d'exposition au bruit… »), la phrase dit ce que cela change pour la décision.
 */
export function texteLogement(l: LectureBruitAerien | null | undefined): (TexteBruit & { titre: string }) | null {
  if (!l) return null;
  if (l.statut === "indisponible") {
    return {
      titre: "Bruit aérien : plans non lus",
      retenir: "Les plans de bruit des aérodromes n'ont pas pu être lus pour ce logement.",
      limite: "Rien ne peut en être conclu, ni dans un sens ni dans l'autre.",
      verifier: "Le plan d'exposition au bruit se consulte en mairie et sur le Géoportail.",
      complement: null, savoirPlus: [], document: null,
    };
  }
  const p = l.peb;
  const lu = rattachement(l);
  const sujet = sujetLogement(l);
  const methode = l.grain === "parcelle"
    ? "Lecture à la parcelle : la part de la parcelle dans chaque zone est calculée sur le tracé publié. Une zone qui ne couvre que moins de 2 % de la parcelle est dite comme une bordure à vérifier ; un liseré de moins de 25 m² est l'écart de tracé entre le plan et le cadastre."
    : `Lecture au point de l'adresse. Une limite de zone à moins de ${LIMITE_PROCHE_M} m est signalée.`;
  const commun = [
    "Le plan d'exposition au bruit (PEB) est un document d'urbanisme approuvé par arrêté. Il découpe les abords d'un aérodrome en zones A à D à partir des prévisions de trafic. Il ne mesure pas le bruit entendu dans un logement.",
    "Quand un bien touche deux zones d'un même plan, la notice de la DGAC demande de retenir la plus exposée.",
    methode,
    source(l),
  ];
  const pgsEtAide = textePgsLogement(l, p.etat === "en_zone" || p.etat === "en_limite" ? !!p.retenue : false);

  if (p.etat === "incertain") {
    return {
      titre: "Bruit aérien : zone non établie",
      retenir: `La zone du ${NOM_PEB} n'a pas pu être établie pour ce logement : un tracé publié tout près de l'adresse n'est pas mesurable.`,
      limite: lu,
      verifier: "Demandez au vendeur ou au bailleur l'état des nuisances sonores aériennes, ou consultez le plan en mairie.",
      complement: pgsEtAide, savoirPlus: commun, document: null,
    };
  }
  if (p.etat === "absent") {
    if (!pgsEnZone(l.pgs)) return null;
    const z = l.pgs.retenue!;
    return {
      titre: `Zone ${z.zone} du ${NOM_PGS} de ${aerodrome(z)}`,
      retenir: pgsEtAide!,
      limite: lignes(LIMITE_PGS, lu),
      verifier: "Renseignez-vous auprès de l'exploitant de l'aéroport sur les conditions de l'aide, avec la date de construction du logement.",
      complement: null,
      savoirPlus: [SENS_PGS_TEXTE, methode, source(l), phraseArrete(z)],
      document: documentDe(z, NOM_PGS),
    };
  }
  if (p.etat === "hors_zone" && p.plusProche) {
    const z = p.plusProche;
    const ou = z.contigue ? "touche la limite de la parcelle" : `est à ${distance(z.distanceM)}`;
    return {
      titre: `Hors des zones du ${NOM_PEB}`,
      retenir: `${l.grain === "parcelle" ? "La parcelle n'est" : "Le point de l'adresse n'est"} dans aucune zone du plan de ${aerodrome(z)} ; la plus proche, la zone ${z.zone}, ${ou}.`,
      limite: lignes(LIMITE_HORS, lu),
      verifier: null,
      complement: pgsEtAide,
      savoirPlus: [...commun, phraseArrete(z)],
      document: documentDe(z, NOM_PEB),
    };
  }

  const r = p.retenue;
  const ref = r ?? p.enLimite[0];
  const v = voisines(p);
  const autresA = autresAerodromes(p);
  let titre: string;
  let retenir: string;
  if (r) {
    titre = `Zone ${r.zone} du ${NOM_PEB} de ${aerodrome(r)}`;
    const part = pourcent(r.part);
    // Au grain parcelle seulement : au point, une autre zone du même plan n'est qu'une limite (`enLimite`).
    const autres = l.grain === "parcelle" && p.autres.length
      ? ` La parcelle touche aussi ${laZone(p.autres).texte} de ce plan ; la zone ${r.zone}, plus exposée, est retenue.`
      : "";
    const fait = part
      ? `La parcelle est pour ${part} en zone ${r.zone}, ${SENS_PEB[r.zone]}.`
      : `${sujet} est en zone ${r.zone}, ${SENS_PEB[r.zone]}.`;
    const ensa = autresA.length
      ? "En vente comme en location, un état des nuisances sonores aériennes indiquant ces zones doit être remis à l'acquéreur ou au locataire."
      : "En vente comme en location, un état des nuisances sonores aériennes indiquant cette zone doit être remis à l'acquéreur ou au locataire.";
    retenir = `${fait}${autres} ${ensa}`;
  } else {
    titre = `En limite du ${NOM_PEB} de ${aerodrome(ref)}`;
    const z = laZone(p.enLimite);
    retenir = l.grain === "parcelle"
      ? `La parcelle ne touche ${z.texte} qu'en bordure (${Math.round(p.enLimite[0].surfaceM2 ?? 0)} m²) : la zone qui s'applique se vérifie sur le plan.`
      : `Le point de l'adresse est à moins de ${LIMITE_PROCHE_M} m ${deZones(p.enLimite)} : la zone du logement se vérifie sur le plan.`;
  }
  let bordure: string | null = null;
  if (r && v.length) {
    const z = laZone(v);
    bordure = l.grain === "parcelle"
      ? `La parcelle touche aussi ${z.texte} en bordure (${Math.round(v[0].surfaceM2 ?? 0)} m²) : à vérifier sur le plan.`
      : `${z.texte.charAt(0).toUpperCase()}${z.texte.slice(1)} ${z.pluriel ? "passent" : "passe"} à moins de ${LIMITE_PROCHE_M} m du point de l'adresse : la zone du logement se vérifie sur le plan.`;
  } else if (r && p.etat === "en_limite" && l.grain === "point") {
    bordure = `La limite de cette zone passe à moins de ${LIMITE_PROCHE_M} m du point de l'adresse : la zone du logement se vérifie sur le plan.`;
  }
  return {
    titre,
    retenir,
    limite: lignes(bordure, lu),
    verifier: "Avant de vous engager, demandez l'état des nuisances sonores aériennes et l'isolation des fenêtres. Pour agrandir ou créer un logement, demandez un certificat d'urbanisme : il signale la zone de bruit.",
    complement: lignes(phraseAutresAerodromes(sujet, NOM_PEB, p), pgsEtAide),
    savoirPlus: [
      ...commun,
      ...[ref, ...autresA].map(phraseArrete),
      "Un plan en cours de révision peut s'appliquer par anticipation : la mairie le sait.",
      ...[ref, ...autresA].map((z) => `Aérodrome : ${z.aerodrome.nom} (code ${z.aerodrome.oaci}).`),
      "L'état des nuisances sonores aériennes est prévu par l'article L112-11 du Code de l'urbanisme ; il n'a qu'une valeur indicative.",
    ],
    document: documentDe(ref, NOM_PEB),
  };
}

/**
 * Le plan de gêne sonore au Logement : une possibilité d'aide, jamais un droit. `aussi` : le bien est déjà
 * dit dans une zone du PEB ; sinon le PGS déborde du PEB (Orly, Toulouse) et la phrase le dit seule.
 */
function textePgsLogement(l: LectureBruitAerien, aussi: boolean): string | null {
  const p = l.pgs;
  if (!(p.etat === "en_zone" || p.etat === "en_limite")) return null;
  const z = p.retenue ?? p.enLimite[0];
  if (!z) return null;
  const sujet = sujetLogement(l);
  const ou = p.retenue
    ? `${sujet} est ${aussi ? "aussi " : ""}en zone ${z.zone} du ${NOM_PGS} de ${aerodrome(z)}`
    : `${sujet} est en limite de la zone ${z.zone} du ${NOM_PGS} de ${aerodrome(z)}`;
  return `${ou} : une aide à l'insonorisation peut exister. Elle dépend de la date du logement et des aides déjà reçues ; l'exploitant de l'aéroport instruit les demandes.`;
}
