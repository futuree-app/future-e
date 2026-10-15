// FUT-104 · LE CLIMAT DES TERRITOIRES ULTRAMARINS : identité, couverture et indicateurs, par code du COG.
//
// La source est SocleOM-Climat-2025 (Météo-France, Licence Ouverte 2.0), extraite par
// `scripts/outremer/extraire_climat_outremer.py` dans `src/data/outremer/`. Rien ici ne vient de
// `data/data_climat.json` (DRIAS-TRACC, Hexagone et Corse), qui ne contient plus aucune ligne ultramarine.
//
// Module PUR : il reçoit les deux fichiers (`creerLecteurOutremer`). Le produit l'utilise par `./index.ts`, qui lie
// les données embarquées ; les tests lui passent les mêmes fichiers lus sur disque.
//
// CE MODULE DIT DES FAITS, IL NE TRANCHE RIEN. Les règles de décision du climat métropolitain (jours ≥ 35 °C,
// nuits > 20 °C, seuils de signalement, rang parmi les communes françaises, référence 1976-2005, « +2,7 °C en
// France ») ne s'appliquent à aucun territoire ultramarin : chaque lecture porte `capaciteDecision: "faits_seulement"`.
// Des règles propres à chaque territoire sont à valider avant d'exister (cf. le compte rendu FUT-104).
//
// TROIS CHOSES À NE JAMAIS FAIRE AVEC CES DONNÉES :
//   - recalculer un écart en soustrayant deux médianes : les écarts publiés sont des médianes d'écarts
//     (Saint-Denis, jours ≥ 31 °C en 2050 : 47,0 − 5,4 = 41,6, écart publié 41,1) ;
//   - comparer deux territoires sur un même horizon comme s'il s'agissait du même réchauffement : « 2050 » vaut
//     +1,9 °C aux Antilles, +2,3 °C en Guyane, +1,6 °C en Polynésie ;
//   - lire un `null` comme un zéro : null est une donnée non publiée, 0 est une mesure.
import { estCodeOutremer } from "./code-outremer.ts";

export { estCodeOutremer };

// ─── Types du contrat ─────────────────────────────────────────────────────────────────────────────────────────

export type TerritoireOutremerId =
  | "guadeloupe" | "martinique" | "guyane" | "reunion" | "mayotte" | "saint-pierre-et-miquelon"
  | "saint-barthelemy" | "saint-martin" | "taaf" | "wallis-et-futuna" | "polynesie-francaise"
  | "nouvelle-caledonie" | "clipperton";

export type HorizonOutremer = "2030" | "2050" | "2100";
export const HORIZONS_OUTREMER: readonly HorizonOutremer[] = ["2030", "2050", "2100"];

/**
 * - `integree` : indicateurs officiels extraits pour l'entité ;
 * - `hors_grille` : le territoire a des indicateurs, mais aucun pixel ne couvre cette entité (Marquises, Gambier,
 *   est des Tuamotu, Rapa) ;
 * - `point_de_reference_manquant` : la grille couvre l'entité, mais sans mairie connue et sur un relief trop
 *   contrasté pour qu'un centroïde la décrive (Taiarapu-Est et -Ouest) ;
 * - `source_non_integree` : Météo-France publie des données de base (séries quotidiennes), pas d'indicateurs
 *   (Wallis-et-Futuna) ;
 * - `source_indisponible` : aucune projection SocleOM publiée (Saint-Pierre-et-Miquelon, TAAF, Clipperton).
 */
export type StatutClimatOutremer =
  | "integree" | "hors_grille" | "point_de_reference_manquant" | "source_non_integree" | "source_indisponible";

/** Couverture d'un territoire entier, pour la matrice. */
export type CouvertureTerritoire = "complete" | "partielle" | "source_non_integree" | "source_indisponible";

/** Médiane de l'ensemble multi-modèle et fourchette probable (centiles 17 et 83). `null` = non publié. */
export type Fourchette = { q17: number | null; mediane: number | null; q83: number | null };

export type FamilleIndicateur = "temperature" | "chaleur_jour" | "chaleur_nuit" | "refroidissement" | "pluie" | "secheresse";

export type IndicateurOutremer = {
  code: string;
  libelle: string;
  unite: string;
  famille: FamilleIndicateur;
  /** Moyenne 1991-2020. */
  reference: Fourchette;
  /** Plus petite et plus grande médiane 1991-2020 parmi les pixels situés dans l'entité (jamais une moyenne). */
  etendueCommunaleReference: [number, number] | null;
  horizons: Record<HorizonOutremer, {
    valeur: Fourchette | null;
    /** Écart à 1991-2020, tel que publié. */
    ecart: Fourchette | null;
    /** Écart relatif (%), publié pour quelques indicateurs de pluie. */
    ecartRelatifPct?: Fourchette | null;
  }>;
};

export type EntiteOutremer = {
  /** Code du COG (5 caractères). C'est l'identifiant, jamais le nom. */
  code: string;
  /** Nom officiel du COG. */
  nom: string;
  /** Nom désambiguïsé, pour l'affichage : « Saint-Denis (La Réunion) ». */
  nomComplet: string;
  territoire: TerritoireOutremerId;
  population: number | null;
  /** Point de référence climatique : mairie (COG), mairie (Annuaire de l'administration) ou centroïde. */
  point: { lon: number; lat: number; type: "mairie" | "mairie_annuaire" | "centroide" } | null;
};

export type ProvenanceZone = {
  zone: string;
  producteur: "Météo-France";
  jeu: string;
  versions: string[];
  scenarios: string[];
  licence: string;
  fiche: string;
  documentation: string;
  correctionsDeBiais: Record<string, string[]>;
  archives: { cle: string; sha256: string; mis_en_ligne: string }[];
  extraitLe: string;
};

export type LectureClimatOutremer =
  | {
      statut: "integree";
      entite: EntiteOutremer;
      territoire: TerritoireOutremer;
      provenance: ProvenanceZone;
      referencePeriode: "1991-2020";
      /** Le niveau de réchauffement RÉGIONAL de chaque horizon, propre au territoire (vs 1850-1900). */
      niveaux: Record<HorizonOutremer, number>;
      fenetreHorizonAns: 20;
      pixel: { lat: number; lon: number; methode: string; distanceKm: number; pasDeg: number };
      indicateurs: IndicateurOutremer[];
      capaciteDecision: "faits_seulement";
      limites: string[];
    }
  | {
      statut: Exclude<StatutClimatOutremer, "integree">;
      entite: EntiteOutremer;
      territoire: TerritoireOutremer;
      raison: string;
      capaciteDecision: "aucune";
    };

// ─── Doctrine par territoire ──────────────────────────────────────────────────────────────────────────────────

export type TerritoireOutremer = {
  id: TerritoireOutremerId;
  nom: string;
  /** Préfixe des codes du COG. */
  prefixe: string;
  statut: "DROM" | "COM" | "collectivité sui generis" | "TAOM" | "domaine public de l'État";
  /** Ce que désigne un code du COG dans ce territoire. */
  uniteGeographique: "commune" | "collectivité unique" | "circonscription territoriale" | "district" | "île";
  couverture: CouvertureTerritoire;
  /** Zones SocleOM qui couvrent le territoire (la Polynésie en a trois, disjointes). */
  zones: string[];
  /** Indicateurs que Météo-France met en avant pour ce territoire dans sa communication publique. Un repère de
   *  lecture, PAS un seuil de décision : futur•e n'en tire aucun verdict. */
  reperes?: { chaleurJour: string; chaleurNuit: string; source: string };
};

const MF_OUTREMER = "https://meteofrance.com/changement-climatique/quel-climat-futur-pour-les-outre-mer";

export const TERRITOIRES_OUTREMER: Record<TerritoireOutremerId, TerritoireOutremer> = {
  guadeloupe: { id: "guadeloupe", nom: "Guadeloupe", prefixe: "971", statut: "DROM", uniteGeographique: "commune", couverture: "complete", zones: ["Guadeloupe"], reperes: { chaleurJour: "TX33D", chaleurNuit: "TN25D", source: "nomenclature Découverte SocleOM (Antilles)" } },
  martinique: { id: "martinique", nom: "Martinique", prefixe: "972", statut: "DROM", uniteGeographique: "commune", couverture: "complete", zones: ["Martinique"], reperes: { chaleurJour: "TX33D", chaleurNuit: "TN25D", source: "nomenclature Découverte SocleOM (Antilles)" } },
  guyane: { id: "guyane", nom: "Guyane", prefixe: "973", statut: "DROM", uniteGeographique: "commune", couverture: "complete", zones: ["Guyane"], reperes: { chaleurJour: "TX35D", chaleurNuit: "TN24D", source: MF_OUTREMER } },
  reunion: { id: "reunion", nom: "La Réunion", prefixe: "974", statut: "DROM", uniteGeographique: "commune", couverture: "complete", zones: ["Reunion"], reperes: { chaleurJour: "TX31D", chaleurNuit: "TN25D", source: MF_OUTREMER } },
  "saint-pierre-et-miquelon": { id: "saint-pierre-et-miquelon", nom: "Saint-Pierre-et-Miquelon", prefixe: "975", statut: "COM", uniteGeographique: "commune", couverture: "source_indisponible", zones: [] },
  mayotte: { id: "mayotte", nom: "Mayotte", prefixe: "976", statut: "DROM", uniteGeographique: "commune", couverture: "complete", zones: ["Mayotte"], reperes: { chaleurJour: "TX32D", chaleurNuit: "TN25D", source: MF_OUTREMER } },
  "saint-barthelemy": { id: "saint-barthelemy", nom: "Saint-Barthélemy", prefixe: "977", statut: "COM", uniteGeographique: "collectivité unique", couverture: "complete", zones: ["SaintMartinBarthelemy"], reperes: { chaleurJour: "TX33D", chaleurNuit: "TN25D", source: "nomenclature Découverte SocleOM (Antilles)" } },
  "saint-martin": { id: "saint-martin", nom: "Saint-Martin", prefixe: "978", statut: "COM", uniteGeographique: "collectivité unique", couverture: "complete", zones: ["SaintMartinBarthelemy"], reperes: { chaleurJour: "TX33D", chaleurNuit: "TN25D", source: "nomenclature Découverte SocleOM (Antilles)" } },
  taaf: { id: "taaf", nom: "Terres australes et antarctiques françaises", prefixe: "984", statut: "TAOM", uniteGeographique: "district", couverture: "source_indisponible", zones: [] },
  "wallis-et-futuna": { id: "wallis-et-futuna", nom: "Wallis-et-Futuna", prefixe: "986", statut: "COM", uniteGeographique: "circonscription territoriale", couverture: "source_non_integree", zones: [] },
  "polynesie-francaise": { id: "polynesie-francaise", nom: "Polynésie française", prefixe: "987", statut: "COM", uniteGeographique: "commune", couverture: "partielle", zones: ["PF-Societe", "PF-Tuamotu", "PF-Australe"], reperes: { chaleurJour: "TX32D", chaleurNuit: "TN26D", source: "nomenclature Découverte SocleOM (Polynésie)" } },
  "nouvelle-caledonie": { id: "nouvelle-caledonie", nom: "Nouvelle-Calédonie", prefixe: "988", statut: "collectivité sui generis", uniteGeographique: "commune", couverture: "complete", zones: ["NouvelleCaledonie"], reperes: { chaleurJour: "TX32D", chaleurNuit: "TN24D", source: MF_OUTREMER } },
  clipperton: { id: "clipperton", nom: "Clipperton", prefixe: "989", statut: "domaine public de l'État", uniteGeographique: "île", couverture: "source_indisponible", zones: [] },
};

const PAR_PREFIXE = new Map(Object.values(TERRITOIRES_OUTREMER).map((t) => [t.prefixe, t]));

const RAISONS: Record<Exclude<StatutClimatOutremer, "integree">, (t: TerritoireOutremer) => string> = {
  hors_grille: (t) => `Météo-France publie des indicateurs pour une partie de ${t.nom} seulement ; cette commune est hors des zones couvertes.`,
  point_de_reference_manquant: () => "La grille couvre la commune, mais sa mairie n'est pas localisée et son relief est trop contrasté pour qu'un point au centre la décrive.",
  source_non_integree: (t) => `Météo-France publie pour ${t.nom} des séries quotidiennes, pas d'indicateurs : rien n'est encore calculé ni intégré.`,
  source_indisponible: (t) => `Aucune projection climatique SocleOM n'est publiée pour ${t.nom}.`,
};

// ─── Données ──────────────────────────────────────────────────────────────────────────────────────────────────

type CentilesBruts = [number | null, number | null, number | null] | null;
type IndicateurBrut = {
  reference: CentilesBruts;
  etendue_reference?: [number, number];
  horizons: Record<string, { valeur: CentilesBruts; ecart: CentilesBruts; ecart_relatif?: CentilesBruts }>;
};
type CommuneClimatBrute =
  | { statut: "integree"; zone: string; pixel: { lat: number; lon: number; methode: string; distance_km: number }; indicateurs: Record<string, IndicateurBrut> }
  | { statut: Exclude<StatutClimatOutremer, "integree"> };
type ZoneBrute = {
  versions: string[]; scenarios: string[]; pas_grille_deg: number; fenetre_horizon_ans: number;
  reference: { periode: string };
  niveaux: { rechauffement_regional_C: number; horizon_tracc: string }[];
  corrections_de_biais: Record<string, string[]>;
  archives: { cle: string; sha256: string; mis_en_ligne: string }[];
};
export type ClimatBrut = {
  source: { jeu: string; licence: string; fiche: string; documentation: string };
  extrait_le: string;
  zones: Record<string, ZoneBrute>;
  indicateurs: Record<string, { libelle: string; unite: string }>;
  communes: Record<string, CommuneClimatBrute>;
};
type TypePoint = NonNullable<EntiteOutremer["point"]>["type"];
export type EntiteBrute = { code: string; nom: string; territoire: TerritoireOutremerId; population: number | null; point: [number, number] | null; point_type: TypePoint };

export type CommunesBrut = { entites: EntiteBrute[] };

const FAMILLES: Record<string, FamilleIndicateur> = {
  TMm: "temperature", TNn: "temperature", TNx: "temperature", TXn: "temperature", TXx: "temperature", ETR: "temperature", DTRm: "temperature",
  SU: "chaleur_jour", TX31D: "chaleur_jour", TX32D: "chaleur_jour", TX33D: "chaleur_jour", TX35D: "chaleur_jour", TX40D: "chaleur_jour",
  TR: "chaleur_nuit", TR25D: "chaleur_nuit", TN24D: "chaleur_nuit", TN25D: "chaleur_nuit", TN26D: "chaleur_nuit",
  CDDcold25: "refroidissement", CDDcold26: "refroidissement",
  PRCPTOT: "pluie", RR10D: "pluie", RR20D: "pluie", RR50D: "pluie", RR100D: "pluie", RRq99refTOT: "pluie", Rx1D: "pluie", Rx5D: "pluie", SDII: "pluie", PXCWD: "pluie",
  PXCDD: "secheresse",
};

const fourchette = (c: CentilesBruts): Fourchette | null =>
  c ? { q17: c[0], mediane: c[1], q83: c[2] } : null;

// ─── Fonctions du contrat ─────────────────────────────────────────────────────────────────────────────────────

/** Le territoire d'un code du COG, ou `null` pour un code qui n'est pas ultramarin. */
export function territoireDuCode(code: string): TerritoireOutremer | null {
  if (!estCodeOutremer(code)) return null;
  return PAR_PREFIXE.get(code.slice(0, 3)) ?? null;
}

/** Un indicateur d'une lecture intégrée, ou `null` s'il n'est pas retenu pour ce territoire. */
export function indicateurOutremer(lecture: LectureClimatOutremer | null, code: string): IndicateurOutremer | null {
  if (!lecture || lecture.statut !== "integree") return null;
  return lecture.indicateurs.find((i) => i.code === code) ?? null;
}

export type LigneCouverture = {
  territoire: TerritoireOutremerId;
  nom: string;
  couverture: CouvertureTerritoire;
  uniteGeographique: TerritoireOutremer["uniteGeographique"];
  entitesAttendues: number;
  parStatut: Partial<Record<StatutClimatOutremer, number>>;
  population: number;
  populationCouverte: number;
  niveaux: Record<HorizonOutremer, number> | null;
  indicateurs: string[];
};

/**
 * Les fonctions du contrat, liées à un jeu de données. Le produit importe `./index.ts` ; les tests appellent ceci
 * avec les fichiers lus sur disque.
 */
export function creerLecteurOutremer(climatBrut: unknown, communesBrut: unknown) {
  const CLIMAT = climatBrut as ClimatBrut;
  const ENTITES = new Map((communesBrut as CommunesBrut).entites.map((e) => [e.code, e]));

  /**
   * L'identité officielle d'une entité ultramarine du COG, ou `null` si le code n'y figure pas. Sans réseau : le
   * référentiel (223 entités) est embarqué. Le nom vient du COG, jamais de l'appelant.
   */
  function getEntiteOutremer(code: string): EntiteOutremer | null {
    const e = ENTITES.get(String(code).trim());
    if (!e) return null;
    const t = TERRITOIRES_OUTREMER[e.territoire];
    // Une collectivité à entité unique (Saint-Martin, Saint-Barthélemy) porte déjà le nom de son territoire.
    const nomComplet = e.nom === t.nom ? e.nom : `${e.nom} (${t.nom})`;
    return {
      code: e.code, nom: e.nom, nomComplet, territoire: e.territoire, population: e.population,
      point: e.point ? { lon: e.point[0], lat: e.point[1], type: e.point_type } : null,
    };
  }

  /** Toutes les entités ultramarines du COG, dans l'ordre des codes. */
  function listerEntitesOutremer(): EntiteOutremer[] {
    return [...ENTITES.keys()].map((c) => getEntiteOutremer(c)!);
  }

  /**
   * Le climat d'une entité ultramarine, ou `null` si le code n'est pas une entité ultramarine du COG.
   * Un statut autre que `integree` se dit avec sa raison ; il ne se remplace jamais par une valeur voisine.
   */
  function lireClimatOutremer(code: string): LectureClimatOutremer | null {
    const entite = getEntiteOutremer(code);
    if (!entite) return null;
    const territoire = TERRITOIRES_OUTREMER[entite.territoire];
    const brut = CLIMAT.communes[entite.code];
    if (!brut) throw new Error(`climat-outremer.json ne connaît pas ${entite.code}, présent dans communes-outremer.json`);

    if (brut.statut !== "integree") {
      return { statut: brut.statut, entite, territoire, raison: RAISONS[brut.statut](territoire), capaciteDecision: "aucune" };
    }

    const zone = CLIMAT.zones[brut.zone];
    const niveaux = Object.fromEntries(zone.niveaux.map((n) => [n.horizon_tracc, n.rechauffement_regional_C])) as Record<HorizonOutremer, number>;
    const indicateurs: IndicateurOutremer[] = Object.entries(brut.indicateurs).map(([cle, v]) => {
      const def = CLIMAT.indicateurs[cle];
      return {
        code: cle,
        libelle: def.libelle,
        unite: def.unite,
        famille: FAMILLES[cle],
        reference: fourchette(v.reference) ?? { q17: null, mediane: null, q83: null },
        etendueCommunaleReference: v.etendue_reference ?? null,
        horizons: Object.fromEntries(HORIZONS_OUTREMER.map((h) => {
          const x = v.horizons[h];
          const sortie: IndicateurOutremer["horizons"][HorizonOutremer] = { valeur: fourchette(x?.valeur ?? null), ecart: fourchette(x?.ecart ?? null) };
          if (x && "ecart_relatif" in x) sortie.ecartRelatifPct = fourchette(x.ecart_relatif ?? null);
          return [h, sortie];
        })) as IndicateurOutremer["horizons"],
      };
    });

    const limites = [
      `Valeur au point de grille (environ ${zone.pas_grille_deg >= 0.03 ? "3" : "2,5"} km) ${entite.point?.type === "centroide" ? "du centre de la commune" : "de la mairie"} : elle ne décrit ni toute la commune ni un logement.`,
      `Horizons définis par niveau de réchauffement régional propre à ${territoire.nom} (2050 = +${String(niveaux["2050"]).replace(".", ",")} °C par rapport à 1850-1900), moyennés sur 20 ans ; la référence est 1991-2020.`,
      "Projections d'un ensemble de modèles à fortes émissions, corrigées sur des observations locales : une tendance probable, pas une prévision.",
    ];
    if (entite.point?.type === "centroide") {
      limites.push("La mairie n'est pas localisée : le point retenu est le centre géographique de la commune, dont le climat est homogène (écart inférieur à 1 °C).");
    }
    // Avertissement des pages DRIAS des Antilles et de la Polynésie (sections 490 et 491) ; il n'est pas formulé
    // pour les autres territoires, on ne l'étend pas.
    if (["Guadeloupe", "Martinique", "SaintMartinBarthelemy"].includes(brut.zone) || brut.zone.startsWith("PF-")) {
      limites.push("La plupart des modèles globaux ne représentent pas ces îles : le signal vient de l'échelle des modèles, affiné ensuite à 2,5 km.");
    }

    return {
      statut: "integree",
      entite,
      territoire,
      provenance: {
        zone: brut.zone, producteur: "Météo-France", jeu: CLIMAT.source.jeu, versions: zone.versions, scenarios: zone.scenarios,
        licence: CLIMAT.source.licence, fiche: CLIMAT.source.fiche, documentation: CLIMAT.source.documentation,
        correctionsDeBiais: zone.corrections_de_biais,
        archives: zone.archives.map((a) => ({ cle: a.cle, sha256: a.sha256, mis_en_ligne: a.mis_en_ligne })),
        extraitLe: CLIMAT.extrait_le,
      },
      referencePeriode: "1991-2020",
      niveaux,
      fenetreHorizonAns: 20,
      pixel: { lat: brut.pixel.lat, lon: brut.pixel.lon, methode: brut.pixel.methode, distanceKm: brut.pixel.distance_km, pasDeg: zone.pas_grille_deg },
      indicateurs,
      capaciteDecision: "faits_seulement",
      limites,
    };
  }

  /** La matrice de couverture, territoire par territoire, calculée sur les données embarquées. */
  function couvertureOutremer(): LigneCouverture[] {
    return Object.values(TERRITOIRES_OUTREMER).map((t) => {
      const entites = listerEntitesOutremer().filter((e) => e.territoire === t.id);
      const parStatut: LigneCouverture["parStatut"] = {};
      let populationCouverte = 0;
      const indicateurs = new Set<string>();
      let niveaux: LigneCouverture["niveaux"] = null;
      for (const e of entites) {
        const l = lireClimatOutremer(e.code)!;
        parStatut[l.statut] = (parStatut[l.statut] ?? 0) + 1;
        if (l.statut === "integree") {
          populationCouverte += e.population ?? 0;
          l.indicateurs.forEach((i) => indicateurs.add(i.code));
          niveaux ??= l.niveaux;
        }
      }
      return {
        territoire: t.id, nom: t.nom, couverture: t.couverture, uniteGeographique: t.uniteGeographique,
        entitesAttendues: entites.length, parStatut,
        population: entites.reduce((s, e) => s + (e.population ?? 0), 0), populationCouverte,
        niveaux, indicateurs: [...indicateurs].sort(),
      };
    });
  }

  return { getEntiteOutremer, listerEntitesOutremer, lireClimatOutremer, couvertureOutremer };
}

export type LecteurOutremer = ReturnType<typeof creerLecteurOutremer>;
