// CE QUE L'ÉCRAN DIT DU DÉBROUSSAILLEMENT OBLIGATOIRE (FUT-149). Lib PURE, sans géométrie : lisible côté client,
// testée sous `node --test`. Les composants ne décident rien : ils posent ces phrases.
//
// ── DEUX ÉCHELLES, UNE MÊME DONNÉE ───────────────────────────────────────────────────────────
//  - AUTOUR (le quartier) : le secteur est-il dans le zonage publié ? Le point de l'adresse suffit, et la phrase
//    parle du secteur. Aucune parcelle, aucun document de transaction.
//  - LOGEMENT (le bien) : la parcelle, quand elle est sûre ; sinon le point, en le disant. Puis la vérification
//    concrète : le zonage officiel, l'arrêté du préfet, l'état des risques que le vendeur ou le bailleur remet.
//
// ── CE QU'AUCUNE PHRASE NE DIT ───────────────────────────────────────────────────────────────
//  Ni « danger », ni « exposé », ni « boisé » : le zonage est un périmètre d'obligation, pas une mesure du feu
//  ni de la forêt. Ni un nombre de mètres à débroussailler pour CE propriétaire : l'arrêté et le maire le fixent
//  selon la construction et le secteur (la règle générale est dans « En savoir plus »). Ni un responsable désigné
//  d'office : L134-8 le distingue selon les situations. Ni une obligation réduite aux seules constructions : en
//  zone urbaine, elle peut porter sur le terrain (L134-6, 3°). Ni « pas d'obligation »
//  hors zonage ou hors des départements publiés : le zonage est informatif.

import type { LectureDebroussaillement, ProfilZonage } from "./debroussaillement.ts";
import { CARTE_OFFICIELLE_URL, LIMITE_PROCHE_M, MILLESIME_ANCIEN_ANS } from "./debroussaillement-constantes.ts";
import { SURFACE_MIN_M2 } from "./urbanisme-nomenclature.ts";
import { dateLongue } from "./data/gaspar-pprn-inondation.ts";
import { departmentName } from "./regions-fr.ts";

export type TexteDebroussaillement = {
  /** Le constat, en une phrase. */
  retenir: string;
  /** Ce que le constat ne permet pas de conclure, et comment le bien a été situé. */
  limite: string | null;
  /** Une action concrète. */
  verifier: string | null;
  complement: string | null;
  /** Le dépliable : la règle, le zonage du département, la méthode, la source. */
  savoirPlus: string[];
  /** La page de la préfecture, ou à défaut la page officielle de Géorisques. */
  document: { libelle: string; url: string } | null;
};

const lignes = (...l: (string | null | undefined)[]) => l.filter(Boolean).join(" ") || null;

const ZONE = "une zone où le débroussaillement est obligatoire";
const SELON = "selon le zonage publié par l'État";

// Code forestier, L134-6 et L134-8 (revue du 28/10/2026) : autour des constructions, 50 m que le MAIRE peut porter
// à 100 m (1°) ; en zone urbaine, le terrain lui-même, bâti ou non (3°) ; la personne tenue dépend de la situation.
const REGLE = "Le débroussaillement est obligatoire dans les bois, forêts, landes, maquis et garrigues classés à risque d'incendie par arrêté, et sur 200 m autour. Il porte notamment sur les abords des constructions, en général sur 50 m, que le maire peut porter à 100 m ; dans une zone urbaine, il peut porter sur tout le terrain, bâti ou non. La personne tenue de le faire dépend de la situation : le plus souvent le propriétaire de la construction, parfois celui du terrain, et le travail peut s'étendre chez un voisin. Les règles précises varient d'un département à l'autre.";
const INFORMATION = "Depuis le 1er janvier 2025, le vendeur ou le bailleur d'un bien situé dans une zone soumise doit en informer l'acquéreur ou le locataire ; l'état des risques comporte alors une fiche sur cette obligation (décret n° 2024-405 du 29 avril 2024, code de l'environnement, article R125-23).";
const INDICATIF = "Ce zonage est indicatif : seuls l'arrêté du préfet et le code forestier font foi. Il ne mesure pas le danger d'incendie.";
const PETITS_BOIS = "Ce zonage est indicatif : de petits bois peuvent y manquer, et seule la mairie peut confirmer qu'aucune obligation ne s'applique.";
const NON_COUVERT_LIMITE = "Cela ne prouve pas qu'aucune obligation ne s'applique : la mairie peut le confirmer.";
const RIEN_CONCLU = "Rien n'en est conclu, ni dans un sens ni dans l'autre.";
const CONSULTER = "Le zonage officiel se consulte sur Géorisques ; la mairie le confirme.";

/** « zonage établi par la préfecture » : la nature de la donnée, en clair. */
function nature(source: string): string {
  const s = source.toLowerCase().replace(/\s+/g, "");
  if (s === "zonagelocal") return "zonage établi par la préfecture";
  if (s === "zonageign") return "zonage établi par l'IGN";
  if (s.startsWith("zonageign+")) return "zonage de l'IGN corrigé par la préfecture";
  if (s.startsWith("zonagelocal+")) return "zonage de la préfecture complété par l'IGN";
  return `zonage « ${source} »`;
}

/** « Gironde : zonage de l'IGN corrigé par la préfecture, à partir d'une carte des bois de 2021 ; arrêté préfectoral du 17 octobre 2025. » */
export function phraseZonage(p: ProfilZonage): string {
  const nom = departmentName(p.departement) ?? `Département ${p.departement}`;
  const carte = p.millesime ? `, à partir d'une carte des bois de ${p.millesime}` : "";
  const arrete = dateLongue(p.arrete);
  const date = arrete
    ? `arrêté préfectoral du ${arrete} (date indiquée par la base ; un arrêté plus récent a pu le remplacer)`
    : p.arreteBrut ? `arrêté préfectoral indiqué « ${p.arreteBrut} » dans la base` : "date de l'arrêté préfectoral non renseignée dans la base";
  return `${nom} : ${nature(p.source)}${carte} ; ${date}.`;
}

/** Une carte des bois de plus de dix ans conditionne la lecture : elle est dite à l'écran, brièvement. */
function ancien(l: LectureDebroussaillement): string | null {
  const p = l.zone ?? l.profilDepartement;
  const edition = Number(l.source?.edition.slice(0, 4));
  const annee = Number(p?.millesime);
  if (!p || !Number.isFinite(annee) || !Number.isFinite(edition) || edition - annee < MILLESIME_ANCIEN_ANS) return null;
  return `Dans ce département, le zonage s'appuie sur une carte des bois de ${annee} : un bois a pu apparaître ou disparaître depuis.`;
}

function source(l: LectureDebroussaillement): string {
  const s = l.source;
  return s
    ? `Source : base DÉBROUSSAILLEMENT, ${s.producteur}, édition du ${dateLongue(s.edition) ?? s.edition}. ${s.licence}. Zonage informatif : seuls l'arrêté du préfet et le code forestier font foi.`
    : "Source : base DÉBROUSSAILLEMENT, IGN pour le ministère chargé des forêts.";
}

function documentDe(l: LectureDebroussaillement): TexteDebroussaillement["document"] {
  const url = (l.zone ?? l.profilDepartement)?.url;
  return url && /^https:\/\/[^/]+\.gouv\.fr\//.test(url)
    ? { libelle: "Page de la préfecture sur le débroussaillement", url }
    : { libelle: "Le débroussaillement obligatoire sur Géorisques", url: CARTE_OFFICIELLE_URL };
}

const zonageLigne = (l: LectureDebroussaillement) => {
  const p = l.zone ?? l.profilDepartement;
  return p ? phraseZonage(p) : null;
};

function incertain(l: LectureDebroussaillement): string {
  if (l.motifIncertain === "contredit_arrete") return "le zonage publié y place une zone alors que l'arrêté de classement exclut les bois de cette commune";
  return l.motifIncertain === "diffusion_ambigue"
    ? "la donnée publiée y est ambiguë (une zone de la base n'apparaît pas sur la carte officielle)"
    : "le tracé publié ne peut pas y être lu de façon fiable";
}

/** AUTOUR : le secteur. `null` : rien n'a été lu (lecture non activée). */
export function texteAutour(l: LectureDebroussaillement | null | undefined): TexteDebroussaillement | null {
  if (!l) return null;
  const savoirPlus = [
    REGLE,
    `Lecture au point de l'adresse. Une limite de zone à moins de ${LIMITE_PROCHE_M} m est signalée : ni le zonage ni la position de l'adresse ne sont précis au mètre.`,
    source(l),
  ];
  if (l.statut === "indisponible") {
    return {
      retenir: "Le zonage de débroussaillement n'a pas pu être lu pour ce secteur.",
      limite: RIEN_CONCLU, verifier: "Le zonage officiel se consulte sur Géorisques.", complement: null,
      savoirPlus: [REGLE], document: { libelle: "Le débroussaillement obligatoire sur Géorisques", url: CARTE_OFFICIELLE_URL },
    };
  }
  const zl = zonageLigne(l);
  const detail = [savoirPlus[0], ...(zl ? [zl] : []), ...savoirPlus.slice(1)];
  switch (l.etat) {
    case "en_zone":
      return {
        retenir: `Ce secteur est dans ${ZONE}, ${SELON}.`,
        limite: lignes("C'est une obligation d'entretien près des bois et des landes, pas une mesure du danger d'incendie.", ancien(l)),
        verifier: "Les règles précises (distance, travaux) sont fixées par l'arrêté du préfet et, pour la distance, par le maire : la mairie les donne.",
        complement: null, savoirPlus: detail, document: documentDe(l),
      };
    case "en_limite": {
      const d = l.limite?.distanceM;
      return {
        retenir: d != null
          ? `Ce secteur est juste à côté d'${ZONE} (à environ ${d} m) : selon l'endroit exact, un logement peut y être ou non.`
          : `Ce secteur est en bordure d'${ZONE} : la limite passe à moins de ${LIMITE_PROCHE_M} m, et selon l'endroit exact, un logement peut y être ou non.`,
        limite: ancien(l), verifier: CONSULTER, complement: null, savoirPlus: detail, document: documentDe(l),
      };
    }
    case "hors_zone":
      return {
        retenir: "Ce secteur n'est pas dans le zonage de débroussaillement obligatoire publié pour ce département.",
        limite: lignes(PETITS_BOIS, ancien(l)), verifier: null, complement: null, savoirPlus: detail, document: documentDe(l),
      };
    case "non_couvert":
      return {
        retenir: l.departement
          ? "Aucun zonage de débroussaillement n'est publié pour ce département."
          : "La couverture du zonage de débroussaillement n'a pas pu être établie pour ce secteur.",
        limite: NON_COUVERT_LIMITE, verifier: null, complement: null,
        savoirPlus: [REGLE, "La base de l'IGN couvre les 52 départements dont des bois sont classés à risque d'incendie par arrêté.", source(l)],
        document: null,
      };
    case "incertain":
      return {
        retenir: `Le zonage de débroussaillement ne permet pas de conclure pour ce secteur : ${incertain(l)}.`,
        limite: RIEN_CONCLU, verifier: CONSULTER, complement: null, savoirPlus: detail, document: documentDe(l),
      };
  }
}

// ── LOGEMENT : le bien ───────────────────────────────────────────────────────────────────────

/** Comment le bien a été situé, dit quand ce n'est pas la parcelle. */
function rattachement(l: LectureDebroussaillement): string | null {
  if (l.portee === "secteur") return "L'adresse est géocodée sans numéro : la lecture porte sur un point de la rue, pas sur ce logement.";
  if (l.portee === "non_precisee") return "La précision de la localisation n'est pas connue : la lecture porte sur le point de l'adresse.";
  switch (l.parcelleEcartee) {
    case "repli": return "La parcelle rattachée à l'adresse l'a été par proximité et pourrait être celle d'un voisin : la lecture porte sur le point de l'adresse.";
    case "limite": return "Le point de l'adresse tombe sur la limite de deux parcelles : la lecture porte sur ce point.";
    case "non_mesurable": return "Le tracé de la parcelle n'a pas pu être mesuré : la lecture porte sur le point de l'adresse.";
    case "absente": return "Aucune parcelle n'a été rattachée à l'adresse : la lecture porte sur son point.";
    case "etendue": return "La parcelle est trop étendue pour être lue en entier : la lecture porte sur le point de l'adresse.";
    default: return null;
  }
}

const VERIFIER_ZONE = "Avant de vous engager, consultez le zonage officiel sur Géorisques et les règles qui s'appliquent (arrêté du préfet, décisions du maire sur la distance). Demandez au vendeur ou au bailleur l'état des risques, qui doit mentionner cette obligation, et si l'entretien a été fait.";
const VERIFIER_LIMITE = "Vérifiez sur le zonage officiel (Géorisques) ou auprès de la mairie si le terrain est concerné. L'état des risques remis par le vendeur ou le bailleur doit le mentionner s'il l'est.";
/** Une parcelle à cheval : l'obligation peut viser les abords des constructions ou, en zone urbaine, le terrain (L134-6). */
const VERIFIER_A_CHEVAL = "Demandez à la mairie quelles règles s'appliquent à ce terrain : l'obligation peut viser les abords des constructions ou, en zone urbaine, le terrain lui-même. L'état des risques remis par le vendeur ou le bailleur doit la mentionner si le bien est concerné.";
/** Qui doit débroussailler : L134-8 distingue selon les situations ; aucune phrase ne l'attribue d'office. */
const RESPONSABLE = "Qui doit l'entretenir dépend de la situation (le plus souvent le propriétaire de la construction) : l'arrêté du préfet et la mairie le précisent.";

/**
 * LOGEMENT : le bien. `null` : rapport écrit avant FUT-149, ou lecture non activée. Le titre est le fait, la phrase
 * dit ce que cela change pour la décision.
 */
export function texteLogement(l: LectureDebroussaillement | null | undefined): (TexteDebroussaillement & { titre: string }) | null {
  if (!l) return null;
  if (l.statut === "indisponible") {
    return {
      titre: "Zonage non lu",
      retenir: "Le zonage de débroussaillement n'a pas pu être lu pour ce logement.",
      limite: RIEN_CONCLU, verifier: "Le zonage officiel se consulte sur Géorisques.", complement: null,
      savoirPlus: [REGLE, INFORMATION], document: { libelle: "Le débroussaillement obligatoire sur Géorisques", url: CARTE_OFFICIELLE_URL },
    };
  }
  const lu = rattachement(l);
  const parcelle = l.grain === "parcelle";
  const methode = parcelle
    ? `Lecture à la parcelle : la part de la parcelle dans le zonage est calculée sur le tracé publié. Au-delà de 98 %, la parcelle est dite dans le zonage ; entre 2 et 98 %, à cheval sur sa limite ; en deçà, ou à moins de ${LIMITE_PROCHE_M} m sans y entrer, en limite. Le zonage et le cadastre ne sont pas tracés au mètre.`
    : `Lecture au point de l'adresse. Une limite de zone à moins de ${LIMITE_PROCHE_M} m est signalée.`;
  const zl = zonageLigne(l);
  const savoirPlus = [REGLE, INFORMATION, ...(zl ? [zl] : []), methode, source(l)];

  switch (l.etat) {
    case "en_zone":
      return {
        titre: parcelle ? "Terrain dans le zonage publié" : "Adresse dans le zonage publié",
        retenir: `${SELON.charAt(0).toUpperCase()}${SELON.slice(1)}, ${parcelle ? "la parcelle" : "le point de l'adresse"} est dans ${ZONE}. ${RESPONSABLE}`,
        limite: lignes(INDICATIF, ancien(l), lu),
        verifier: VERIFIER_ZONE, complement: null, savoirPlus, document: documentDe(l),
      };
    case "en_limite": {
      const c = l.limite?.cause;
      let retenir: string;
      let titre = "Terrain en limite du zonage";
      if (c === "a_cheval") {
        titre = "Terrain à cheval sur la limite du zonage";
        retenir = `${SELON.charAt(0).toUpperCase()}${SELON.slice(1)}, environ ${Math.max(2, Math.min(98, Math.round((l.part ?? 0) * 100)))} % de la parcelle est dans ${ZONE} : selon les règles qui s'appliquent à ce terrain, tout ou partie du bien peut être concerné.`;
      } else if (c === "bordure") {
        const s = l.surfaceM2 ?? 0;
        retenir = s >= SURFACE_MIN_M2
          ? `La parcelle ne touche qu'en bordure ${ZONE} (environ ${Math.round(s)} m²) : selon le tracé exact, le terrain peut être concerné ou non.`
          : `La parcelle touche la limite d'${ZONE} : selon le tracé exact, le terrain peut être concerné ou non.`;
      } else if (c === "parcelle_proche") {
        retenir = `La parcelle est à environ ${l.limite?.distanceM} m d'${ZONE} : le zonage n'est pas tracé au mètre, le terrain peut être concerné.`;
      } else if (l.limite?.distanceM != null) {
        titre = "Adresse en limite du zonage";
        retenir = `Le point de l'adresse est juste à côté d'${ZONE} (à environ ${l.limite.distanceM} m) : selon l'endroit exact, le logement peut y être ou non.`;
      } else {
        titre = "Adresse en limite du zonage";
        retenir = `Le point de l'adresse est dans ${ZONE}, à moins de ${LIMITE_PROCHE_M} m de sa limite : selon l'endroit exact, le logement peut y être ou non.`;
      }
      return {
        titre, retenir, limite: lignes(c === "a_cheval" ? INDICATIF : null, ancien(l), lu), verifier: c === "a_cheval" ? VERIFIER_A_CHEVAL : VERIFIER_LIMITE, complement: null, savoirPlus, document: documentDe(l),
      };
    }
    case "hors_zone":
      return {
        titre: "Hors du zonage publié",
        retenir: parcelle
          ? "La parcelle n'est pas dans le zonage de débroussaillement obligatoire publié pour ce département."
          : `Le point de l'adresse n'est pas dans le zonage de débroussaillement obligatoire publié pour ce département (aucune zone à moins de ${LIMITE_PROCHE_M} m).`,
        limite: lignes(PETITS_BOIS, ancien(l), lu), verifier: null, complement: null, savoirPlus, document: documentDe(l),
      };
    case "non_couvert":
      return {
        titre: "Aucun zonage publié pour ce département",
        retenir: l.departement
          ? "La base nationale du débroussaillement ne contient aucune zone pour ce département : rien n'en est conclu pour ce logement."
          : "La couverture du zonage de débroussaillement n'a pas pu être établie pour ce logement.",
        limite: NON_COUVERT_LIMITE, verifier: null, complement: null,
        savoirPlus: [REGLE, INFORMATION, "La base de l'IGN couvre les 52 départements dont des bois sont classés à risque d'incendie par arrêté.", source(l)],
        document: null,
      };
    case "incertain":
      return {
        titre: "Zonage non établi",
        retenir: `Le zonage de débroussaillement ne permet pas de conclure pour ce logement : ${incertain(l)}.`,
        limite: lignes(RIEN_CONCLU, lu), verifier: "Consultez le zonage officiel sur Géorisques, ou demandez à la mairie.", complement: null,
        savoirPlus, document: documentDe(l),
      };
  }
}
