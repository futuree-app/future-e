// LES SITES SEVESO, EN INDEX LOCAL (FUT-167, 30/10/2026). Lib PURE : construction de l'index depuis l'extraction
// nationale des installations classées (Géorisques), et recherche autour d'un point. Le script
// `scripts/fut167/construire-seveso.mjs` écrit `data/installations-seveso.json` ; le serveur le charge
// (`server/installations-seveso.ts`). Deux lectures s'en servent :
//   - Territoire (D1) : le site Seveso le plus proche du point de référence de la commune, par seuil ;
//   - Logement (D2) : les sites Seveso autour des coordonnées de l'adresse.
//
// POURQUOI UN INDEX ET PAS L'API EN DIRECT. L'API `installations_classees` interroge bien un rayon, mais elle
// renvoie TOUTES les installations (505 dans 8 km autour de la raffinerie de Feyzin, avec leurs documents) et ne
// filtre pas sur le statut Seveso. Un dossier ferait des centaines de lignes de lecture pour en garder une poignée.
// Les sites Seveso sont environ 1 350 en France : l'index tient en quelques centaines de kilooctets, se lit une
// fois par processus, et porte la date de son extraction, qui est dite au lecteur.
//
// CE QUE L'INDEX DIT, ET CE QU'IL NE DIT PAS.
//   - Le statut Seveso est une CATÉGORIE LÉGALE (seuil haut, seuil bas), opposable et retrouvable sur Géorisques.
//   - La position est le POINT publié du site par l'inspection des installations classées, pas son contour : une
//     distance se mesure jusqu'à ce point, et un grand site s'étend sur des centaines de mètres autour.
//   - Une distance ne mesure aucune exposition. Ce qui s'applique réellement autour d'un site se lit dans le plan
//     de prévention des risques technologiques (PPRT), quand il existe, et à l'adresse.
//   - Les autres installations classées (directive IED, autorisation, enregistrement) ne sont PAS dans cet index.

export const SEVESO_SOURCE = {
  producteur: "Inspection des installations classées, via Géorisques",
  jeu: "Installations classées pour la protection de l'environnement (ICPE)",
  api: "https://www.georisques.gouv.fr/api/v1/installations_classees",
  fiche: (codeAIOT: string) => `https://www.georisques.gouv.fr/risques/installations/donnees/details/${codeAIOT}`,
} as const;

/**
 * LE RAYON, REPRIS DU CALCUL D'EXPOSITION INDUSTRIELLE (`scripts/populate-exposition-industrielle.py`, `R_EXPO`) :
 * un site y pèse jusqu'à 8 km. Ce n'est pas un seuil sanitaire, c'est le périmètre dans lequel futur•e regarde,
 * et il est dit au lecteur. Aucune nouvelle convention : la même distance que la règle « industrie » du dossier.
 */
export const SEVESO_RAYON_KM = 8;

export type SeuilSeveso = "seveso_haut" | "seveso_bas";

export type SiteSeveso = {
  code: string;
  nom: string;
  seuil: SeuilSeveso;
  lat: number;
  lon: number;
  insee: string | null;
  commune: string | null;
  /** L'état d'activité publié (« En exploitation avec titre », « En fin d'exploitation »…). */
  etat: string | null;
  /** Date de mise à jour de la fiche, `AAAA-MM-JJ`. */
  majLe: string | null;
  /** Décimales des coordonnées publiées : 3 décimales situent le point à une centaine de mètres près. */
  decimales: number;
  /**
   * La position publiée est absente ou impossible : le site est placé au CENTRE DE SA COMMUNE (nommée par la
   * fiche, rattachée sans ambiguïté). La distance est alors approchée, et la phrase le dit. Sans ce repli, le
   * site disparaîtrait, et l'absence de Seveso s'affirmerait à tort autour de lui.
   */
  approchee: boolean;
};

export type IndexSeveso = {
  extraitLe: string;
  source: string;
  sites: SiteSeveso[];
  /** Les fiches Seveso sans position exploitable, avec leur motif et leur sort (placées au centre de leur commune, ou écartées). */
  exclus: { code: string; nom: string; motif: string }[];
};

/** La forme compacte écrite sur disque : une ligne par site. */
export type IndexSevesoDisque = {
  extraitLe: string;
  source: string;
  colonnes: string[];
  sites: [string, string, "h" | "b", number, number, string | null, string | null, string | null, string | null, number, 0 | 1][];
  exclus: { code: string; nom: string; motif: string }[];
};

const SEUIL: Record<string, SeuilSeveso> = { "Seveso seuil haut": "seveso_haut", "Seveso seuil bas": "seveso_bas" };

type Boite = readonly [lonMin: number, latMin: number, lonMax: number, latMax: number];
const TERRITOIRES: readonly Boite[] = [
  [-5.3, 41.3, 9.7, 51.2], // Hexagone et Corse
  [-61.9, 15.8, -60.8, 16.6], [-61.3, 14.3, -60.8, 14.9], [-54.7, 2.1, -51.5, 5.9], [55.2, -21.4, 55.9, -20.8],
  [45.0, -13.1, 45.3, -12.6], [-56.5, 46.7, -56.0, 47.2], [-63.2, 17.8, -62.7, 18.2],
];
const enFrance = (lon: number, lat: number) => TERRITOIRES.some(([a, b, c, d]) => lon >= a && lon <= c && lat >= b && lat <= d);

const decimalesDe = (v: number): number => {
  const s = String(v);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
};

/** Une commune du référentiel (`data/communes-france-coords.csv`), pour placer un site sans position exploitable. */
export type CommuneRef = { insee: string; nom: string; lat: number; lon: number };

const cle = (nom: string) => nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Construit l'index depuis les lignes brutes de l'API. Pur : la même entrée rend toujours le même index. */
export function construireIndexSeveso(o: { extraitLe: string; source: string; lignes: Record<string, unknown>[]; communes?: CommuneRef[] }): IndexSevesoDisque {
  const parNom = new Map<string, CommuneRef[]>();
  for (const c of o.communes ?? []) parNom.set(cle(c.nom), [...(parNom.get(cle(c.nom)) ?? []), c]);
  const vus = new Set<string>();
  const sites: IndexSevesoDisque["sites"] = [];
  const exclus: IndexSevesoDisque["exclus"] = [];
  for (const l of o.lignes) {
    const seuil = SEUIL[String(l.statutSeveso ?? "")];
    if (!seuil) continue;
    const code = String(l.codeAIOT ?? "");
    if (!code || vus.has(code)) continue;
    vus.add(code);
    const nom = String(l.raisonSociale ?? "").trim() || code;
    const lat = typeof l.latitude === "number" ? l.latitude : NaN;
    const lon = typeof l.longitude === "number" ? l.longitude : NaN;
    const texte = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const maj = texte(l.date_maj);
    const valide = Number.isFinite(lat) && Number.isFinite(lon) && enFrance(lon, lat);
    if (!valide) {
      const motif = !Number.isFinite(lat) || !Number.isFinite(lon) ? "position non publiée" : `position hors du territoire (${lat}, ${lon})`;
      // Repli : le centre de la commune nommée par la fiche, si UNE seule commune porte ce nom.
      const candidates = parNom.get(cle(texte(l.commune) ?? "")) ?? [];
      if (candidates.length !== 1) { exclus.push({ code, nom, motif: `${motif}, commune non rattachable` }); continue; }
      const c = candidates[0]!;
      sites.push([code, nom, seuil === "seveso_haut" ? "h" : "b", c.lat, c.lon, texte(l.codeInsee) ?? c.insee, texte(l.commune), texte(l.etatActivite), maj ? maj.slice(0, 10) : null, 0, 1]);
      exclus.push({ code, nom, motif: `${motif} : placé au centre de ${c.nom} (${c.insee})` });
      continue;
    }
    sites.push([
      code, nom, seuil === "seveso_haut" ? "h" : "b", lat, lon,
      texte(l.codeInsee), texte(l.commune), texte(l.etatActivite), maj ? maj.slice(0, 10) : null,
      Math.min(decimalesDe(lat), decimalesDe(lon)), 0,
    ]);
  }
  sites.sort((a, b) => a[0].localeCompare(b[0]));
  exclus.sort((a, b) => a.code.localeCompare(b.code));
  return {
    extraitLe: o.extraitLe, source: o.source,
    colonnes: ["code", "nom", "seuil", "lat", "lon", "insee", "commune", "etat", "majLe", "decimales", "approchee"],
    sites, exclus,
  };
}

export function lireIndexSeveso(d: IndexSevesoDisque): IndexSeveso {
  return {
    extraitLe: d.extraitLe,
    source: d.source,
    exclus: d.exclus,
    sites: d.sites.map(([code, nom, s, lat, lon, insee, commune, etat, majLe, decimales, approchee]) => ({
      code, nom, seuil: s === "h" ? "seveso_haut" : "seveso_bas", lat, lon, insee, commune, etat, majLe, decimales, approchee: approchee === 1,
    })),
  };
}

const R_TERRE_KM = 6371.0088;

/** Distance à vol d'oiseau (haversine), en kilomètres. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2
    + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * R_TERRE_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type SiteProche = SiteSeveso & { distanceKm: number };

/** Les sites Seveso à moins de `rayonKm` du point, du plus proche au plus lointain. */
export function sevesoAutour(index: IndexSeveso, lat: number, lon: number, rayonKm = SEVESO_RAYON_KM): SiteProche[] {
  // Pré-filtre en degrés (1° de latitude ≈ 111 km) : quelques comparaisons au lieu d'un calcul trigonométrique par site.
  const dLat = rayonKm / 110;
  const dLon = rayonKm / (110 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const out: SiteProche[] = [];
  for (const s of index.sites) {
    if (Math.abs(s.lat - lat) > dLat || Math.abs(s.lon - lon) > dLon) continue;
    const d = distanceKm(lat, lon, s.lat, s.lon);
    if (d <= rayonKm) out.push({ ...s, distanceKm: d });
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm || a.code.localeCompare(b.code));
}

/** Le plus proche de chaque seuil, dans le rayon. `null` : aucun site de ce seuil dans le rayon. */
export function plusProcheParSeuil(sites: SiteProche[]): Record<SeuilSeveso, SiteProche | null> {
  return {
    seveso_haut: sites.find((s) => s.seuil === "seveso_haut") ?? null,
    seveso_bas: sites.find((s) => s.seuil === "seveso_bas") ?? null,
  };
}
