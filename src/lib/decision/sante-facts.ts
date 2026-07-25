// LA DOCTRINE DE SANTÉ ENVIRONNEMENTALE DU DOSSIER. Lib PURE : aucune I/O, aucun réseau.
//
// Elle n'est PAS un module (cf. ADR-0010) : la santé environnementale est une LECTURE, pas un gisement de
// données. Ces faits sont ceux qui sont vrais au grain COMMUNE. Le radon, les argiles et le bruit de façade
// sont vrais au grain ADRESSE, et vivent dans Logement. La même promesse, deux mailles.
//
// LA DOCTRINE DU SEUIL, héritée du climat : la GRANDEUR est officielle, la FRÉQUENCE (ou le déclencheur)
// peut être une convention, mais alors elle est NOMMÉE, VERSIONNÉE, et DITE dans le texte.
//
// CE QUI N'EST PAS ICI, ET POURQUOI. `faible_pression_agricole` n'a AUCUN seuil défendable au grain
// commune : l'IFT est un indicateur officiel mais sans palier « notable » (et « IFT 5,65 » ne dit rien à
// un lecteur), et la part de surface agricole de l'index monte jusqu'à 152 % (artefact d'attribution des
// exploitations). Surtout, le risque réel est la DÉRIVE de pulvérisation, qui dépend de la distance aux
// PARCELLES traitées (il existe même un seuil légal : les zones de non-traitement, 5 à 20 m des
// habitations). C'est vrai au grain PARCELLE, pas commune. Le forcer ici reproduirait la faute qu'on a
// refusée sur la sécheresse.

// PAS DE VERSION DE CONVENTION ICI, et c'est volontaire. Il en existait une (`sante-conv-1`) que rien
// ne posait jamais : les faits de santé sont des VERIFICATIONS, qui ne portent pas de `basis`, donc pas
// de `conventionId`. Une version que rien n'estampille ne verrouille rien — elle donne seulement
// l'illusion qu'un cache saurait s'invalider. Le jour où un fait de santé portera une base versionnée,
// la version naîtra avec elle.

// ── L'AIR ────────────────────────────────────────────────────────────────────
//
// LES SEUILS SONT OFFICIELS, ABSOLUS, ET OPPOSABLES. Aucun percentile.
//   NO2  >= 10 µg/m³ : la RECOMMANDATION SANITAIRE de l'OMS (2021), en moyenne annuelle. 6 % des communes.
//   PM2.5 >= 10 µg/m³ : la VALEUR LIMITE EUROPÉENNE applicable en 2030 (directive 2024), qui correspond
//                       au palier intermédiaire de l'OMS. 0,2 % des communes.
//
// LE FAIT QUI DÉRANGE, ET QU'IL FAUT DIRE : **AUCUNE commune française** ne descend sous la recommandation
// OMS pour les particules fines (5 µg/m³). Le minimum national est de 5,6 µg/m³. Un `satisfied` ne veut
// donc PAS dire « l'air est pur ici » : il veut dire « l'air ne déclenche pas de signalement ». La nuance
// est réelle, et elle appelle le cinquième rôle de fait (`mismatch`) : entre « conforme aux seuils » et
// « aussi pur que l'OMS le recommande », il y a un espace que notre grammaire ne sait pas encore dire.
export const AIR_NO2_OMS = 10; // µg/m³, moyenne annuelle (OMS 2021)
export const AIR_PM25_UE_2030 = 10; // µg/m³, moyenne annuelle (valeur limite UE applicable en 2030)
// (La recommandation OMS pour les particules fines — 5 µg/m³ — n'est PAS une constante du code : aucune
// règle ne s'y compare, puisque aucune commune française ne l'atteint. Elle est dite dans le commentaire
// ci-dessus, où elle explique pourquoi un `satisfied` sur l'air ne veut pas dire « l'air est pur ici ».
// Le seuil réellement opposé aux PM2,5 est la valeur limite européenne 2030, ci-dessus.)

// ── LE BRUIT ─────────────────────────────────────────────────────────────────
//
// LE SCORE `calmeSonore` EST UNE MESURE MAISON (exposition cumulée), et la doctrine du projet interdit
// déjà d'en afficher le chiffre. Il ne peut donc pas être un seuil OPPOSABLE.
//
// Ce qui est absolu et vérifiable, c'est le FAIT : une autoroute à 800 mètres, une voie ferrée à 400,
// un aéroport à 4 km. Le déclencheur est donc une DISTANCE, et c'est une convention de produit : nommée,
// versionnée, dite dans le texte. Elle s'ancre sur la réalité de la propagation (la zone de gêne d'une
// autoroute porte plus loin que celle d'une voie ferrée, et un aéroport gêne à plusieurs kilomètres).
// Cumul : 12 % des communes.
//
// C'est une VÉRIFICATION au sens plein : le fait est établi (l'infrastructure est là, à cette distance),
// mais ce que le lecteur ENTENDRA dépend de sa façade, de son étage et de son isolation. Et la donnée qui
// le dirait vraiment (la carte de bruit stratégique, en décibels) existe : elle est publique, et nous ne
// pouvons pas la lire à sa place.
export const BRUIT_MAX_KM: Record<"auto" | "rail" | "aero", number> = {
  auto: 1, // 6,4 % des communes
  rail: 0.5, // 5,0 %
  aero: 5, // 0,6 %
};

// ── L'INDUSTRIE ──────────────────────────────────────────────────────────────
//
// La source dominante est une CATÉGORIE LÉGALE (Seveso seuil haut, Seveso seuil bas, IED) : c'est un fait
// absolu, opposable, et que le lecteur peut retrouver sur Géorisques. Le score, lui, est une exposition
// hybride maison (gravité × proximité, rayon de 8 km) : il sert de DÉCLENCHEUR, jamais de constat, et il
// n'est jamais affiché. Seuil : 50, soit 5,6 % des communes, dont 92 % ont un Seveso seuil haut dominant.
export const INDUSTRIE_SCORE_MAX = 50;

export type BruitSource = "auto" | "rail" | "aero";
export type IndustrieClasse = "seveso_haut" | "seveso_bas" | "ied" | "industrie";

export type SanteFacts = {
  air: {
    pm25: number | null; // µg/m³, moyenne annuelle
    no2: number | null;
    notable: boolean; // au moins un seuil sanitaire officiel dépassé
    complet: boolean; // les DEUX polluants ont été lus (sinon on ne peut pas conclure « rien à signaler »)
  };
  bruit: {
    source: BruitSource | null;
    distanceKm: number | null;
    notable: boolean;
    // `lu` = le calcul a bien tourné sur cette commune. Une commune SANS source dominante n'est pas une
    // commune non lue : c'est une commune loin de toute infrastructure bruyante, et c'est une bonne
    // nouvelle qu'on a le droit de dire.
    lu: boolean;
  };
  industrie: {
    classe: IndustrieClasse | null;
    notable: boolean;
    lu: boolean;
  };
};

// Les champs bruts, tels que l'index les porte (cf. IndexCommune). On les reçoit, on ne les recalcule pas.
export type SanteRaw = {
  viv?: Record<string, number | null> | null;
  calmeSonore?: { score: number; sourceDominante: BruitSource | null; distanceKm: number | null } | null;
  expoIndustrielle?: { score: number; sourceDominante: IndustrieClasse | null } | null;
};

function fini(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function buildSanteFacts(raw: SanteRaw): SanteFacts {
  const pm25raw = raw.viv?.pm25;
  const no2raw = raw.viv?.no2;
  const pm25 = fini(pm25raw) ? pm25raw : null;
  const no2 = fini(no2raw) ? no2raw : null;

  const cs = raw.calmeSonore ?? null;
  const source = cs?.sourceDominante ?? null;
  const distanceKm = fini(cs?.distanceKm) ? cs!.distanceKm! : null;

  const ei = raw.expoIndustrielle ?? null;
  const classe = ei?.sourceDominante ?? null;

  return {
    air: {
      pm25,
      no2,
      // UNE DONNÉE ABSENTE N'EST PAS UN AIR SAIN : `notable` reste faux, mais `complet` dira à la règle
      // qu'elle n'a pas tout lu, et elle rendra `uncertain` plutôt que `satisfied`.
      notable: (no2 != null && no2 >= AIR_NO2_OMS) || (pm25 != null && pm25 >= AIR_PM25_UE_2030),
      complet: pm25 != null && no2 != null,
    },
    bruit: {
      source,
      distanceKm,
      notable: source != null && distanceKm != null && distanceKm <= BRUIT_MAX_KM[source],
      lu: cs != null && fini(cs.score),
    },
    industrie: {
      classe,
      notable: ei != null && fini(ei.score) && ei.score <= INDUSTRIE_SCORE_MAX && classe != null,
      lu: ei != null && fini(ei.score),
    },
  };
}

// ── Le texte ─────────────────────────────────────────────────────────────────

const BRUIT_LABEL: Record<BruitSource, string> = {
  auto: "une autoroute ou une voie rapide",
  rail: "une voie ferrée",
  aero: "un aéroport",
};

// « à 800 mètres » plutôt que « à 0,8 km » : sous le kilomètre, le mètre est l'unité que le lecteur habite.
export function distanceEnPhrase(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} mètres` : `${km.toFixed(1).replace(".", ",").replace(",0", "")} km`;
}

export function bruitEnPhrase(source: BruitSource, km: number): string {
  return `${BRUIT_LABEL[source]} passe à ${distanceEnPhrase(km)} du point de référence de la commune`;
}

// LA CATÉGORIE LÉGALE, EN FRANÇAIS. On ne dit pas « seveso_haut » au lecteur, et on ne dit pas non plus
// « site dangereux » : on dit ce que la loi dit, et il peut le retrouver sur Géorisques.
const INDUSTRIE_LABEL: Record<IndustrieClasse, string> = {
  seveso_haut: "un site classé Seveso seuil haut",
  seveso_bas: "un site classé Seveso seuil bas",
  ied: "un site industriel soumis à la directive européenne sur les émissions industrielles",
  industrie: "un site industriel soumis à autorisation",
};

// La glose vient dans une SECONDE phrase. En apposition, elle cassait la première (« Un site classé
// Seveso seuil haut, le niveau le plus élevé…, est recensé »).
const INDUSTRIE_GLOSE: Partial<Record<IndustrieClasse, string>> = {
  seveso_haut: "C'est le niveau le plus élevé de la réglementation des risques industriels.",
  seveso_bas: "Ce classement impose au site des obligations de prévention des accidents majeurs.",
};

export function industrieEnPhrase(classe: IndustrieClasse): string {
  return INDUSTRIE_LABEL[classe];
}

export function industrieGlose(classe: IndustrieClasse): string {
  return INDUSTRIE_GLOSE[classe] ?? "";
}
