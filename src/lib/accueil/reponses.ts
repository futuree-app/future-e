// LES RÉPONSES DE REPLI DE L'ACCUEIL (FUT-37). Module PUR, client et serveur.
//
// Une question posée sur l'accueil reçoit la réponse du modèle SI elle passe le contrôle déterministe
// (src/lib/accueil/qna.ts), et sinon celle-ci. Avant FUT-37, le repli était `tension_answers` (Supabase)
// puis un STATIC_ANSWERS local : des textes écrits pour UNE commune et servis à toutes (« La Rochelle
// présente un risque de submersion en hausse de +31 % », « Les sols charentais… », « Bressuire est un
// territoire… »), plus des prédictions immobilières (« quasi invendables »). La table reste en base
// (aucune écriture Supabase dans FUT-37), mais plus rien ne la lit.
//
// Ces réponses ne disent que les faits de la commune DEMANDÉE (`FaitsCommune`), ou ce que futur•e ne
// mesure pas. Elles sont volontairement plus sobres que le modèle : c'est le prix de ne jamais mentir.
import { aCommune } from "../typography.ts";
import { formatCompte, formatTemperature } from "./recits.ts";
import type { FaitsCommune, Mesure } from "./faits.ts";

export type ReponseQna = { verdict: string; detail: string; cta: string };

const CTA_TERRITOIRE = "Voir l'échelle Territoire de votre dossier";
const CTA_LOGEMENT = "Voir l'échelle Logement de votre dossier";
const CTA_AUTOUR = "Voir l'échelle Autour de l'adresse de votre dossier";

const NUIT = { singulier: "nuit", pluriel: "nuits", feminin: true };

type Famille = "chaleur" | "littoral" | "feux" | "hivers" | "eau" | "immobilier" | "mobilite" | "general";

const FAMILLE_PAR_QUESTION: Record<string, Famille> = {
  acheter_canicule: "chaleur",
  acheter_urbain: "chaleur",
  canicule_vivable: "chaleur",
  enfants_chaleur: "chaleur",
  enfants_sante: "chaleur",
  demenager_vers: "chaleur",
  retraite_ici: "chaleur",
  metier_exterieur: "chaleur",
  acheter_littoral: "littoral",
  enfants_littoral: "littoral",
  feux: "feux",
  randonner_ici: "feux",
  acheter_montagne: "hivers",
  ski_ici: "hivers",
  eau_potable: "eau",
  valeur_immo: "immobilier",
  mobilite_fragile: "mobilite",
  tc_sansvoiture: "mobilite",
  voiture_electrique: "mobilite",
};

const comparaison = (m: Mesure, nuits = false) => {
  if (m.reference == null) return "";
  const r = formatCompte(m.reference, nuits ? NUIT : undefined);
  return `, contre ${r} sur la période de référence 1976-2005`;
};

function horizon(f: FaitsCommune) {
  return `À l'horizon ${f.horizon.annee} (${f.horizon.rechauffement_france} en France)`;
}

const AUCUN_CLIMAT = (lieu: string) =>
  `futur•e n'a pas pu lire les projections climatiques ${lieu} pour cette réponse. Le dossier les présente avec leur période de référence.`;

function reponseChaleur(f: FaitsCommune): ReponseQna {
  const lieu = aCommune(f.commune);
  const c = f.climat;
  if (!c || c.jours_au_dessus_de_35C.projete == null) {
    return { verdict: `Les projections de chaleur ${lieu} ne sont pas lisibles ici.`, detail: AUCUN_CLIMAT(lieu), cta: CTA_TERRITOIRE };
  }
  const j = c.jours_au_dessus_de_35C;
  const n = c.nuits_tropicales_20C;
  const nuits = n.projete == null
    ? ""
    : ` On compterait aussi ${formatCompte(n.projete, NUIT)} par an où la température ne descend pas sous 20 °C${comparaison(n, true)}.`;
  return {
    verdict: `Voici ce que les projections disent de la chaleur ${lieu}.`,
    detail:
      `${horizon(f)}, les projections comptent ${lieu} ${formatCompte(j.projete!)} par an au-dessus de 35 °C${comparaison(j)}.${nuits}` +
      " Ce sont des nombres de jours dans l'année : ils ne disent pas combien de temps dure chaque épisode.",
    cta: CTA_TERRITOIRE,
  };
}

function reponseLittoral(f: FaitsCommune): ReponseQna {
  const lieu = aCommune(f.commune);
  const r = f.risques_recenses_sur_la_commune;
  const adresse = "L'exposition d'une adresse précise se vérifie dans le dossier Logement.";
  if (!r) {
    return { verdict: `Les risques recensés ${lieu} n'ont pas pu être lus ici.`, detail: `futur•e n'a pas pu interroger Géorisques pour cette réponse. ${adresse}`, cta: CTA_LOGEMENT };
  }
  if (r.submersion_marine) {
    return {
      verdict: `L'État recense un risque de submersion marine ${lieu}.`,
      detail:
        "Ce recensement Géorisques est actuel et porte sur la commune entière : il ne dit pas quelle partie est concernée, ni comment le risque évoluera. " +
        "futur•e ne dispose pas de carte de son étendue future. " + adresse,
      cta: CTA_LOGEMENT,
    };
  }
  return {
    verdict: `Aucun risque de submersion marine n'est recensé ${lieu}.`,
    detail: `Géorisques ne recense pas de risque de submersion marine sur la commune. ${adresse}`,
    cta: CTA_LOGEMENT,
  };
}

function reponseFeux(f: FaitsCommune): ReponseQna {
  const lieu = aCommune(f.commune);
  const m = f.climat?.jours_meteo_propice_aux_feux_IFM40;
  const gaspar = f.risques_recenses_sur_la_commune?.feu_de_foret
    ? " Par ailleurs, l'État recense un risque de feu de forêt sur la commune (Géorisques)."
    : "";
  if (!m || m.projete == null) {
    return { verdict: `La météo propice aux feux ${lieu} n'est pas lisible ici.`, detail: AUCUN_CLIMAT(lieu) + gaspar, cta: CTA_TERRITOIRE };
  }
  return {
    verdict: `Voici ce que les projections disent de la météo propice aux feux ${lieu}.`,
    detail:
      `${horizon(f)}, les projections comptent ${formatCompte(m.projete)} par an de danger météorologique élevé pour les feux (indice forêt-météo ≥ 40)${comparaison(m)}.` +
      " Cet indice décrit la météo ; il ne mesure ni la végétation ni la probabilité qu'un incendie se déclare." + gaspar,
    cta: CTA_TERRITOIRE,
  };
}

function reponseHivers(f: FaitsCommune): ReponseQna {
  const lieu = aCommune(f.commune);
  const m = f.climat?.temperature_moyenne_hiver_C;
  if (!m || m.projete == null) {
    return { verdict: `Les projections d'hiver ${lieu} ne sont pas lisibles ici.`, detail: AUCUN_CLIMAT(lieu), cta: CTA_TERRITOIRE };
  }
  const ref = m.reference == null ? "" : `, contre ${formatTemperature(m.reference)} sur la période de référence 1976-2005`;
  return {
    verdict: `Voici ce que les projections disent des hivers ${lieu}.`,
    detail:
      `${horizon(f)}, la température moyenne de l'hiver serait de ${formatTemperature(m.projete)}${ref}.` +
      " futur•e ne mesure pas l'enneigement : il dépend aussi de l'altitude des pentes et des précipitations.",
    cta: CTA_TERRITOIRE,
  };
}

function reponseEau(f: FaitsCommune): ReponseQna {
  return {
    verdict: "futur•e ne mesure pas la qualité de l'eau du robinet ici.",
    detail:
      `La qualité de l'eau distribuée ${aCommune(f.commune)} relève du contrôle sanitaire de son unité de distribution, que l'accueil ne lit pas. ` +
      "Les jours de sol sec que futur•e affiche décrivent l'humidité du sol pour la végétation, pas l'eau du robinet.",
    cta: CTA_TERRITOIRE,
  };
}

function reponseImmobilier(): ReponseQna {
  return {
    verdict: "futur•e ne prédit pas les prix futurs.",
    detail:
      "futur•e peut vérifier des éléments qui comptent dans une décision d'achat : la performance énergétique du logement, " +
      "les risques recensés à l'adresse et certains faits documentés sur le territoire.",
    cta: CTA_LOGEMENT,
  };
}

function reponseMobilite(f: FaitsCommune): ReponseQna {
  return {
    verdict: "Cette question se lit à l'échelle de l'adresse, pas de la commune.",
    detail:
      `Les trajets, les transports à pied et les services proches dépendent de l'endroit précis où l'on vit ${aCommune(f.commune)}. ` +
      "Le dossier les mesure autour de l'adresse.",
    cta: CTA_AUTOUR,
  };
}

function reponseGenerale(f: FaitsCommune): ReponseQna {
  return {
    verdict: "Cette question demande votre dossier plutôt qu'une réponse rapide.",
    detail:
      `La première lecture de l'accueil ne couvre pas cette question avec des données propres ${aCommune(f.commune)}. ` +
      "Le dossier croise les données publiques de la commune et de l'adresse avec votre projet.",
    cta: CTA_TERRITOIRE,
  };
}

/** La réponse déterministe à une question, pour la commune des faits fournis. */
export function reponseDeRepli(tensionId: string, faits: FaitsCommune): ReponseQna {
  switch (FAMILLE_PAR_QUESTION[tensionId] ?? "general") {
    case "chaleur": return reponseChaleur(faits);
    case "littoral": return reponseLittoral(faits);
    case "feux": return reponseFeux(faits);
    case "hivers": return reponseHivers(faits);
    case "eau": return reponseEau(faits);
    case "immobilier": return reponseImmobilier();
    case "mobilite": return reponseMobilite(faits);
    default: return reponseGenerale(faits);
  }
}

export const QUESTIONS_COUVERTES = Object.keys(FAMILLE_PAR_QUESTION);
