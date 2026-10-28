// LE REGISTRE IREP DES ÉMISSIONS POLLUANTES, en index local (FUT-152, 28/10/2026). Lib PURE : construction de
// l'index depuis l'export annuel officiel, et recherche autour d'un point. Le script
// `scripts/fut152/construire-irep.mts` lit l'archive et écrit `data/irep-registre.json` ; le serveur le charge
// (`server/irep-registre.ts`). Aucune API IREP n'existe (spécification Géorisques v1/v2 relue le 28/10/2026) :
// l'export annuel est la seule source officielle vérifiable.
//
// CE QUE DIT LE REGISTRE, ET CE QU'IL NE DIT PAS.
//   - L'export d'une année liste les établissements qui ont déposé une déclaration (13 811 en 2025) : rejets
//     dans l'air, l'eau, le sol, mais aussi déchets produits ou traités, prélèvements d'eau.
//   - Un rejet n'est publié en quantité que s'il dépasse le seuil de déclaration du polluant ; en dessous, la
//     ligne porte « < seuil ». En 2025, 2 787 établissements ont au moins un rejet chiffré publié.
//   - Les autres ne sont PAS « sans rejet » ni « sans pollution » : ils n'ont aucun rejet chiffré publié
//     au-dessus des seuils. C'est la seule formulation admise (décision porteur, 28/10/2026).
//   - Une déclaration porte sur les quantités rejetées par le site. Elle ne mesure pas l'exposition d'un
//     logement voisin, et n'en dit aucun niveau de danger.
//
// LA POSITION DU SITE, PAS CELLE DU SIÈGE. Les coordonnées déclarées situent le site ; le code commune est
// souvent celui du siège (entrepôts déclarés « Paris 13e » et situés en Essonne, à 24 km). La recherche se fait
// donc sur les coordonnées. Seules sont écartées les positions IMPOSSIBLES : hors du territoire du département
// déclaré (un établissement de Cayenne placé dans le Pas-de-Calais, un du Doubs placé en Espagne). Elles sont
// listées avec leur motif dans `meta.exclus` (décision porteur, 28/10/2026).

export const IREP_CONVENTION = "fut152-irep-v1";

export const IREP_SOURCE = {
  producteur: "INERIS, ministère de la Transition écologique",
  jeu: "Registre des émissions polluantes (IREP)",
  page: "https://www.georisques.gouv.fr/donnees/bases-de-donnees/installations-industrielles-rejetant-des-polluants",
  consultation: "https://www.georisques.gouv.fr/risques/registre-des-emissions-polluantes/accueil",
  archive: (annee: number) => `https://files.georisques.fr/irep/${annee}.zip`,
} as const;

/** Le rayon de la page publique : celui de la recherche historique, inchangé. Un périmètre, pas un seuil sanitaire. */
export const IREP_RAYON_PAGE_M = 10_000;

// ── Lecture CSV (point-virgule, guillemets, retours à la ligne dans les champs) ─────────────────────────

export function lireCsvPointVirgule(texte: string): Record<string, string>[] {
  const lignes: string[][] = [];
  let ligne: string[] = [];
  let champ = "";
  let guillemets = false;
  const t = texte.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i]!;
    if (guillemets) {
      if (c === '"' && t[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ";") { ligne.push(champ); champ = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      ligne.push(champ); champ = "";
      if (ligne.length > 1 || ligne[0] !== "") lignes.push(ligne);
      ligne = [];
    } else champ += c;
  }
  if (champ !== "" || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  const [entete, ...corps] = lignes;
  if (!entete) return [];
  return corps.map((l, k) => {
    if (l.length !== entete.length) throw new Error(`ligne ${k + 2} : ${l.length} champs pour ${entete.length} attendus`);
    return Object.fromEntries(entete.map((h, j) => [h.trim(), l[j]!.trim()]));
  });
}

// ── Territoires ─────────────────────────────────────────────────────────────────────────────────────────

type Boite = readonly [lonMin: number, latMin: number, lonMax: number, latMax: number];
const METROPOLE: Boite = [-5.3, 41.3, 9.7, 51.2];
const ANTILLES_NORD: Boite = [-63.2, 17.8, -62.7, 18.2]; // Saint-Martin, Saint-Barthélemy
/** Les territoires admis pour un département déclaré. 971 couvre aussi Saint-Martin et Saint-Barthélemy,
 *  longtemps déclarés sous la Guadeloupe (EDF Saint-Barthélemy l'est encore en 2025). */
const TERRITOIRES: Record<string, readonly Boite[]> = {
  "971": [[-61.9, 15.8, -61.0, 16.6], ANTILLES_NORD],
  "972": [[-61.3, 14.3, -60.8, 14.9]],
  "973": [[-54.7, 2.1, -51.5, 5.9]],
  "974": [[55.2, -21.4, 55.9, -20.8]],
  "975": [[-56.5, 46.7, -56.0, 47.2]],
  "976": [[44.9, -13.1, 45.4, -12.6]],
  "977": [ANTILLES_NORD],
  "978": [ANTILLES_NORD],
};
export function territoiresDu(departement: string): readonly Boite[] | null {
  const d = departement.trim();
  if (TERRITOIRES[d]) return TERRITOIRES[d]!;
  return /^(0[1-9]|[1-8]\d|9[0-5]|2A|2B)$/.test(d) ? [METROPOLE] : null;
}
/** Le département déclaré ; à défaut (« NR » : EDF Saint-Pierre en 2025), celui que porte le code commune. */
export function departementDe(e: { code_departement?: string; code_insee?: string }): string {
  const d = (e.code_departement ?? "").trim();
  if (territoiresDu(d)) return d;
  const insee = (e.code_insee ?? "").trim();
  return insee.startsWith("97") ? insee.slice(0, 3) : insee.slice(0, 2);
}
const dans = (b: Boite, lon: number, lat: number) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3];

// ── L'index ─────────────────────────────────────────────────────────────────────────────────────────────

export type Milieu = "air" | "eau_directe" | "eau_indirecte" | "sol";
const MILIEUX: Record<string, Milieu> = { "Air": "air", "Eau (direct)": "eau_directe", "Eau (indirect)": "eau_indirecte", "Sol": "sol" };

/** Un établissement avec au moins un rejet chiffré publié. Jamais de quantité : ni niveau, ni classement. */
export type EtablissementAvecRejet = {
  id: string;
  nom: string;
  lat: number;
  lon: number;
  /** La commune DÉCLARÉE, qui peut être celle du siège. */
  commune: string;
  activite: string | null;
  milieux: Milieu[];
  polluants: string[];
};

export type Exclusion = { id: string; nom: string; departement: string; commune: string; lon: number; lat: number; motif: string };

export type IndexIrep = {
  meta: {
    convention: typeof IREP_CONVENTION;
    annee: number;
    source: { archive: string; sha256: string; recupereLe: string };
    comptes: { etablissements: number; avecRejet: number; sansRejetChiffre: number; exclus: number };
    exclus: Exclusion[];
  };
  avecRejet: EtablissementAvecRejet[];
  /** Les autres établissements du registre : [identifiant, lat, lon], seulement pour être comptés. */
  autres: [string, number, number][];
};

const arrondi = (x: number) => Math.round(x * 1e6) / 1e6;

/**
 * L'index d'une année, depuis les deux fichiers de l'archive. REFUSE (lève) plutôt que d'écrire un index
 * faux : identifiant en double, coordonnées illisibles ou hors EPSG:4326, émission d'une autre année ou d'un
 * établissement inconnu, département sans territoire connu.
 */
export function construireIndexIrep(o: {
  annee: number;
  etablissementsCsv: string;
  emissionsCsv: string;
  source: IndexIrep["meta"]["source"];
}): IndexIrep {
  const etabs = lireCsvPointVirgule(o.etablissementsCsv);
  const parId = new Map<string, Record<string, string>>();
  for (const e of etabs) {
    if (parId.has(e.identifiant!)) throw new Error(`identifiant ${e.identifiant} en double`);
    parId.set(e.identifiant!, e);
  }

  const rejets = new Map<string, { milieux: Set<Milieu>; polluants: Set<string> }>();
  for (const r of lireCsvPointVirgule(o.emissionsCsv)) {
    if (Number(r.annee_emission) !== o.annee) throw new Error(`émission de ${r.annee_emission} dans l'export ${o.annee}`);
    if (!parId.has(r.identifiant!)) throw new Error(`émission d'un établissement inconnu : ${r.identifiant}`);
    const q = r.quantite!;
    if (q === "" || q.startsWith("<")) continue; // déclaré sous le seuil : aucun rejet chiffré publié
    if (!Number.isFinite(Number(q.replace(",", ".")))) throw new Error(`quantité illisible « ${q} » (${r.identifiant})`);
    const milieu = MILIEUX[r.milieu!];
    if (!milieu) throw new Error(`milieu inconnu « ${r.milieu} »`);
    const x = rejets.get(r.identifiant!) ?? { milieux: new Set(), polluants: new Set() };
    x.milieux.add(milieu);
    x.polluants.add(r.polluant!);
    rejets.set(r.identifiant!, x);
  }

  const avecRejet: EtablissementAvecRejet[] = [];
  const autres: IndexIrep["autres"] = [];
  const exclus: Exclusion[] = [];
  for (const e of etabs) {
    const lon = Number(e.coordonnees_x), lat = Number(e.coordonnees_y);
    if (e.code_epsg !== "4326" || !Number.isFinite(lon) || !Number.isFinite(lat) || e.coordonnees_x === "" || e.coordonnees_y === "") {
      throw new Error(`${e.identifiant} : coordonnées illisibles (${e.coordonnees_x}, ${e.coordonnees_y}, EPSG ${e.code_epsg})`);
    }
    const departement = departementDe(e);
    const territoires = territoiresDu(departement);
    if (!territoires) throw new Error(`${e.identifiant} : département « ${e.code_departement} » (commune ${e.code_insee}) sans territoire connu`);
    if (!territoires.some((b) => dans(b, lon, lat))) {
      exclus.push({
        id: e.identifiant!, nom: e.nom_etablissement!, departement, commune: e.commune!, lon, lat,
        motif: `position hors du territoire du département déclaré (${departement})`,
      });
      continue;
    }
    const r = rejets.get(e.identifiant!);
    if (!r) { autres.push([e.identifiant!, arrondi(lat), arrondi(lon)]); continue; }
    avecRejet.push({
      id: e.identifiant!,
      nom: e.nom_etablissement!,
      lat: arrondi(lat),
      lon: arrondi(lon),
      commune: e.commune!,
      activite: e.libelle_eprtr || e.libelle_ape || null,
      milieux: [...r.milieux].sort(),
      polluants: [...r.polluants].sort((a, b) => a.localeCompare(b, "fr")),
    });
  }

  return {
    meta: {
      convention: IREP_CONVENTION,
      annee: o.annee,
      source: o.source,
      comptes: { etablissements: etabs.length, avecRejet: avecRejet.length, sansRejetChiffre: autres.length, exclus: exclus.length },
      exclus,
    },
    avecRejet,
    autres,
  };
}

export const indexValide = (x: unknown): x is IndexIrep => {
  const t = x as Partial<IndexIrep> | null;
  return t?.meta?.convention === IREP_CONVENTION && Array.isArray(t.avecRejet) && Array.isArray(t.autres);
};

// ── La recherche ────────────────────────────────────────────────────────────────────────────────────────

export function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
  const dφ = φ2 - φ1, dλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type IrepAutour =
  | { etat: "indisponible" }
  | {
      etat: "disponible" | "absent_dans_source";
      annee: number;
      point: { lat: number; lon: number };
      rayonM: number;
      /** Du plus proche au plus loin. Liste complète : aucune troncature. */
      avecRejet: (EtablissementAvecRejet & { distanceM: number })[];
      /** Autres établissements du registre dans le rayon : aucun rejet chiffré publié au-dessus des seuils. */
      sansRejetChiffre: number;
      /** Positions impossibles écartées de l'index national (pas seulement de ce rayon). */
      exclusNational: number;
    };

export function irepAutour(index: IndexIrep | null, lat: number, lon: number, rayonM: number): IrepAutour {
  if (!index) return { etat: "indisponible" };
  const avecRejet = index.avecRejet
    .map((e) => ({ ...e, distanceM: Math.round(distanceM(lat, lon, e.lat, e.lon)) }))
    .filter((e) => e.distanceM <= rayonM)
    .sort((a, b) => a.distanceM - b.distanceM || a.id.localeCompare(b.id));
  const sansRejetChiffre = index.autres.filter(([, la, lo]) => distanceM(lat, lon, la, lo) <= rayonM).length;
  return {
    etat: avecRejet.length + sansRejetChiffre === 0 ? "absent_dans_source" : "disponible",
    annee: index.meta.annee,
    point: { lat, lon },
    rayonM,
    avecRejet,
    sansRejetChiffre,
    exclusNational: index.meta.comptes.exclus,
  };
}
