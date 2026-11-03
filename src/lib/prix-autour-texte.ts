// ════════════════════════════════════════════════════════════════════════════════════════════
// LES VENTES À PROXIMITÉ DE L'ADRESSE, DANS LE MODULE AUTOUR (FUT-138). PUR, SANS RÉSEAU.
//
// LES TROIS ÉCHELLES (porteur, 03/11/2026) :
//   - Territoire : le marché de la COMMUNE (« combien coûtent les logements dans cette ville ? ») ;
//   - Autour     : les ventes à PROXIMITÉ de l'adresse (« les logements se vendent-ils plus cher dans ce secteur que
//                  dans le reste de la ville ? ») : ce fichier ;
//   - Logement   : les caractéristiques du bien lui-même. Une vente à 300 m décrit le voisinage, pas ce logement :
//                  aucun prix de vente n'est affiché dans Logement.
//
// RÈGLES :
//   - 500 m est le périmètre principal, celui des autres lectures d'Autour ; 1 km puis 2 km seulement s'il manque
//     des ventes, et c'est dit : ces ventes décrivent un secteur plus large que le voisinage immédiat ;
//   - moins de 10 ventes à 2 km : pas de médiane locale, sans revenir au chiffre communal (il est dans Territoire) ;
//   - avertissement sous 20 ventes ; à partir de 20, l'écart OBSERVÉ avec la commune (€/m², %, échelle, effectif),
//     jamais qualifié de net ni de « plus cher » ; quartiles à partir de 30 ;
//   - le type de logement FILTRE les ventes quand le diagnostic confirmé le dit sans ambiguïté ; sinon les deux
//     marchés sont présentés séparément, sans rien deviner ;
//   - jamais d'estimation du bien : ni surface, ni montant, ni « votre logement ».
// Les conventions chiffrées sont dans `prix-autour.ts` ; les noms des échelles communales dans `prix-immobiliers.ts`.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { bindOrphans } from "./typography.ts";
import { grainDpe } from "./dpe-grain.ts";
import type { DpeRecord } from "./dpe-attribution.ts";
import { eurM2, lieuDuPrix, mailleLisible, periodeVentes, raisonSansPrix, SOURCE_ACHAT_COURTE, type LecturePrix, type PrixDuType } from "./prix-immobiliers.ts";
import {
  ARRONDI_EUR_M2, RAYONS_M, SEUIL_COMPARAISON, SEUIL_MEDIANE, SEUIL_QUARTILES,
  type ResultatAutour, type TypeVente, type VentesAutour,
} from "./prix-autour.ts";

export type TypeDuLogement =
  | { type: TypeVente }
  | { abstention: "sans_diagnostic" | "diagnostic_immeuble" | "type_ambigu" };

/** Les statuts d'un diagnostic CONFIRMÉ (address-dossier-store) : une proposition en attente ne compte pas. */
const CONFIRME = new Set(["auto_confirmed", "user_confirmed"]);

/**
 * LE TYPE DU LOGEMENT, OU L'ABSTENTION. Le diagnostic doit être confirmé, au grain du logement (`dpe-grain.ts`), et
 * `type_batiment` doit dire explicitement « appartement » ou « maison » : la méthode du diagnostic, qui supplée un
 * type absent pour d'autres usages, ne suffit pas à choisir les ventes affichées.
 */
export function typeDuLogement(
  statut: string | null | undefined,
  dpe: Pick<DpeRecord, "type_batiment" | "methode_dpe"> | null | undefined,
): TypeDuLogement {
  if (!dpe || !CONFIRME.has(statut ?? "")) return { abstention: "sans_diagnostic" };
  const grain = grainDpe(dpe);
  if (grain === "immeuble") return { abstention: "diagnostic_immeuble" };
  if (grain !== "logement") return { abstention: "type_ambigu" };
  const t = (dpe.type_batiment ?? "").normalize("NFC").trim().toLowerCase();
  if (t === "appartement") return { type: "appart" };
  if (t === "maison" || t === "maison individuelle") return { type: "maison" };
  return { abstention: "type_ambigu" };
}

export type BlocVentesType = {
  type: TypeVente;
  /** « Appartements », « Maisons ». */
  titre: string;
  phrases: string[];
  avertissement: string | null;
  /** Les chiffres, en lignes « libellé : valeur ». Vide sans médiane locale. */
  chiffres: { label: string; value: string }[];
};

export type TexteVentesAutour = {
  /** La phrase qui dit quelles ventes sont présentées (le type, ou pourquoi les deux). */
  lead: string;
  blocs: BlocVentesType[];
  /** Une seule phrase à la place des blocs : Alsace-Moselle, lecture en panne. */
  absence: string | null;
  limite: string;
  methode: string[];
  source: string;
};

const NBSP = "\u00a0";
const MOTS: Record<TypeVente, { titre: string; pluriel: string; vendus: string; de: string }> = {
  appart: { titre: "Appartements", pluriel: "appartements", vendus: "vendus", de: "d'appartements" },
  maison: { titre: "Maisons", pluriel: "maisons", vendus: "vendues", de: "de maisons" },
};
const distance = (m: number) => (m >= 1000 ? `${m / 1000}${NBSP}km` : `${m}${NBSP}m`);
const entier = (n: number) => n.toLocaleString("fr-FR").replace(/[\u00a0\u202f ]/g, NBSP);
const PERIMETRE = RAYONS_M[0];

function referenceDuType(l: LecturePrix, type: TypeVente): { de: string; prix: PrixDuType } | null {
  const a = l.logement?.achat;
  const p = a?.dispo ? a[type] : null;
  return p ? { de: lieuDuPrix(p, l).de, prix: p } : null;
}

/**
 * L'ÉCART OBSERVÉ avec la commune, à partir de 20 ventes : en €/m² et en pourcentage, avec l'échelle et l'effectif de
 * la référence. Un constat entre deux médianes, jamais qualifié (« plus cher », « net ») : il ne prétend pas qu'une
 * différence entre les deux marchés est établie (décision du porteur, 03/11/2026).
 */
function ecartObserve(r: Extract<ResultatAutour, { statut: "ventes" }>, ref: { de: string; prix: PrixDuType }, commune: LecturePrix): string {
  const c = ref.prix.eur_m2;
  const d = r.mediane - c;
  const pct = Math.round((d / c) * 100);
  const signe = (x: number) => (x > 0 ? "+" : x < 0 ? "−" : "");
  const echelle = `${mailleLisible(ref.prix, commune)}${ref.prix.ventes ? `, ${entier(ref.prix.ventes)}${NBSP}ventes` : ""}`;
  const ecart = Math.round(d) === 0
    ? "aucun écart entre les deux médianes"
    : `${signe(d)}${eurM2(Math.abs(d))}, soit ${signe(pct)}${Math.abs(pct)}${NBSP}%`;
  return `Écart observé avec la médiane ${ref.de} (${eurM2(c)}, échelle : ${echelle}) : ${ecart}.`;
}

function bloc(commune: LecturePrix, r: ResultatAutour, periode: string | null): BlocVentesType {
  const mots = MOTS[r.type];
  if (r.statut === "trop_peu") {
    return {
      type: r.type, titre: mots.titre, avertissement: null, chiffres: [],
      phrases: [bindOrphans(`Moins de ${SEUIL_MEDIANE} ventes ${mots.de}${periode ? ` de ${periode}` : ""} à moins de ${distance(r.rayonM)} : pas de médiane locale.`)],
    };
  }
  const phrases: string[] = [];
  if (r.rayonM > PERIMETRE) {
    const avant = distance(r.rayonM === 1000 ? 500 : 1000);
    phrases.push(`Moins de ${SEUIL_MEDIANE} ventes ${mots.de} à ${avant} : le périmètre est élargi à ${distance(r.rayonM)}. Ces ventes décrivent un secteur plus large que le voisinage immédiat.`);
  }
  phrases.push(`${periode ? `De ${periode}, ` : ""}${entier(r.ventes)} ${mots.pluriel} se sont ${mots.vendus} à moins de ${distance(r.rayonM)} environ de l'adresse. La moitié l'ont été à plus de ${eurM2(r.mediane)}.`);
  const ref = referenceDuType(commune, r.type);
  let avertissement: string | null = null;
  if (r.ventes < SEUIL_COMPARAISON) {
    avertissement = `Avec moins de ${SEUIL_COMPARAISON} ventes, une ou deux ventes de plus ou de moins peuvent déplacer ce chiffre : il n'est pas comparé à la commune.`;
  } else if (ref) {
    phrases.push(ecartObserve(r, ref, commune));
  } else if (!ref) {
    phrases.push(`Aucune médiane des ${mots.pluriel} n'est publiée pour ${commune.nom} ni pour son intercommunalité : ces ventes ne sont comparées à rien.`);
  }
  if (r.quartiles) {
    phrases.push(`Un quart de ces ventes s'est fait à moins de ${eurM2(r.quartiles[0])}, un quart à plus de ${eurM2(r.quartiles[1])}.`);
  }
  const chiffres = [
    { label: `Médiane à ${distance(r.rayonM)}`, value: `${eurM2(r.mediane)} · ${entier(r.ventes)}${NBSP}ventes` },
    ...(r.quartiles ? [{ label: "Un quart sous, un quart au-dessus de", value: `${eurM2(r.quartiles[0])} et ${eurM2(r.quartiles[1])}` }] : []),
    ...(ref && r.ventes >= SEUIL_COMPARAISON ? [{ label: `Médiane ${ref.de}`, value: eurM2(ref.prix.eur_m2) }] : []),
  ];
  return {
    type: r.type, titre: mots.titre, chiffres,
    phrases: phrases.map(bindOrphans),
    avertissement: avertissement ? bindOrphans(avertissement) : null,
  };
}

function methode(livraison: string | null, periode: string | null): string[] {
  return [
    `Les ventes comptées sont celles d'un seul logement${periode ? `, de ${periode}` : ""}, dépendances comprises, avec les mêmes règles que la médiane de la commune dans Territoire.`,
    `Le périmètre est de 500${NBSP}m, comme les autres lectures de ce module. Il passe à 1${NBSP}km puis 2${NBSP}km seulement s'il réunit moins de ${SEUIL_MEDIANE} ventes, et c'est alors indiqué. Une vente située au-delà des limites de la commune compte si elle est dans le périmètre.`,
    "La position d'une vente est celle de sa parcelle cadastrale, ramenée à un carré d'environ 100 m : une distance est juste à une centaine de mètres près, davantage pour une grande parcelle.",
    `L'écart avec la commune n'est donné qu'à partir de ${SEUIL_COMPARAISON} ventes. C'est un écart observé entre deux médianes, pas la preuve que les deux marchés diffèrent. La fourchette n'est donnée qu'à partir de ${SEUIL_QUARTILES} ventes.`,
    `Pour protéger les personnes qui ont vendu ou acheté, aucune vente n'est montrée seule, les prix sont arrondis à ${ARRONDI_EUR_M2}${NBSP}€/m², et deux adresses situées dans le même carré d'environ 100${NBSP}m lisent exactement les mêmes ventes.`,
    `Source : DVF (DGFiP), version géolocalisée Etalab${livraison ? `, livraison du ${livraison.split("-").reverse().join("/")}` : ""}.`,
  ].map(bindOrphans);
}

const SOURCE = `${SOURCE_ACHAT_COURTE}, géolocalisation Etalab`;
const LIMITE = bindOrphans(
  "Ce sont des prix de ventes passées, tous états et toutes surfaces confondus : ils décrivent le marché du secteur, ils ne donnent pas la valeur d'un logement précis.",
);

const LEAD_ABSTENTION: Record<Extract<TypeDuLogement, { abstention: string }>["abstention"], string> = {
  sans_diagnostic: "Aucun diagnostic énergétique confirmé ne dit s'il s'agit d'une maison ou d'un appartement : les deux marchés sont présentés séparément.",
  diagnostic_immeuble: "Le diagnostic retenu porte sur l'immeuble entier : il ne dit pas le type de ce logement, et les deux marchés sont présentés séparément.",
  type_ambigu: "Le diagnostic retenu ne dit pas clairement s'il s'agit d'une maison ou d'un appartement : les deux marchés sont présentés séparément.",
};

/**
 * LE BLOC « VENTES À PROXIMITÉ » D'AUTOUR. `autour` : `undefined` si la lecture n'est pas activée (le bloc ne
 * s'affiche pas : `null` en retour), `null` si elle a échoué (le bloc le dit).
 */
export function texteVentesAutour(
  autour: VentesAutour | null | undefined,
  type: TypeDuLogement,
): TexteVentesAutour | null {
  if (autour === undefined) return null;
  if (autour === null) {
    return { lead: "", blocs: [], limite: "", methode: methode(null, null), source: SOURCE, absence: bindOrphans("Les ventes à proximité de l'adresse n'ont pas pu être lues pour le moment.") };
  }
  // La commune de l'adresse, référence de l'écart ; inconnue de l'index : aucune comparaison, les ventes restent.
  const commune: LecturePrix = autour.commune ?? { code: "", nom: "la commune", logement: null, meta: { achat: { periode: autour.periode } } };
  const periode = periodeVentes(commune.meta);
  const base = { methode: methode(autour.livraison, periode), source: SOURCE };

  // Alsace-Moselle : la base ne couvre pas la commune ; des ventes voisines hors de la zone ne la décriraient pas.
  if (commune.logement?.achat?.dispo === false && commune.logement.achat.motif === "hors_dvf") {
    return { ...base, lead: "", blocs: [], limite: "", absence: bindOrphans(raisonSansPrix(commune)!.replace("pour cette commune", "dans ce secteur")) };
  }
  const lead = "abstention" in type
    ? LEAD_ABSTENTION[type.abstention]
    : `Ventes ${MOTS[type.type].de}, le type de ce logement d'après son diagnostic énergétique.`;
  const types: TypeVente[] = "abstention" in type ? ["appart", "maison"] : [type.type];
  return { ...base, lead: bindOrphans(lead), blocs: types.map((t) => bloc(commune, autour[t], periode)), absence: null, limite: LIMITE };
}
