// LES SOLS POLLUÉS AU TERRAIN D'UNE ADRESSE (FUT-157, 30/10/2026). Lib PURE, testée sous `node --test`.
//
// Elle situe le terrain d'une adresse face aux trois inventaires de l'État qui ont une PORTÉE sur un terrain :
// les secteurs d'information sur les sols (SIS), les servitudes d'utilité publique (SUP) et les instructions
// de l'administration (ex-BASOL). CASIAS (anciennes activités) n'est pas lu : une activité passée ne prouve
// aucune pollution. Les réponses viennent de `server/sites-sols.ts` (`getSitesSolsAutour`), la normalisation
// des fiches de `sites-sols.ts` (FUT-152), la géométrie exacte de `geometrie-parcelle.ts` (FUT-81).
//
// ── LA RÈGLE : UNE INTERSECTION, JAMAIS UNE DISTANCE ─────────────────────────────────────────────────
// L'API cherche « autour d'un point » (`latlon`, `rayon`) : c'est un PRÉFILTRE. Elle rend les fiches dont la
// géométrie passe à moins du rayon (mesuré le 30/10/2026 : un bord à 2 m sort à 3 m, pas à 1 m). Rien de ce
// qu'elle rend n'est retenu sur sa seule proximité : chaque périmètre est confronté au point et à la parcelle.
// Aucun seuil de distance n'est affiché ni ne décide de rien.
//
// ── LE CAS DE RÉFÉRENCE, MESURÉ ─────────────────────────────────────────────────────────────────
// Boulevard de la Solidarité à Metz, secteur Sotrameuse : AUCUN des 25 numéros BAN de la voie n'a son point
// dans le périmètre. Le 94 a, le 96 et le 96 b sont à 2 à 3 m de sa limite, posés sur la voie, hors de toute
// parcelle ; le cadastre les rattache par proximité (2,1 à 3,4 m) à des parcelles que le SIS couvre en partie.
// Une recherche par rayon disait « dans le SIS » ; le point seul dirait « rien ». La vérité est entre les deux :
// à vérifier, avec la raison. C'est ce que cette lib rend.
//
// ── LE GRAIN DE LA PREUVE (rattachement de FUT-81 et FUT-146, profondeur propre à FUT-157) ──────────────
// La parcelle n'est attribuée au logement que si l'adresse est géocodée au numéro, que son point tombe dans
// UNE parcelle, et que cette parcelle se mesure. Une parcelle trouvée par proximité, ou sur une limite entre
// deux parcelles, n'est pas écartée : elle fonde un « à vérifier », jamais un « concerné ». Le point et la
// parcelle n'ont pas la même portée : le point dit où est l'entrée, la parcelle dit le terrain. Le point dans un
// périmètre ne démontre donc le terrain que s'il tombe dans la parcelle attribuée (`ficheDemontree`).

import {
  aireAuDela, aireRegion, classer, distanceLignes, mesureIntersection, pointsDe, projectionAutour, regionDe, regionMesurable,
  reparer, type Geometrie, type Region,
} from "./geometrie-parcelle.ts";
import { SURFACE_CONTACT_M2 } from "./urbanisme-nomenclature.ts";
import type { CategorieGeoLue, FicheSspGeo } from "./sites-sols.ts";
import {
  INVENTAIRES, SITES_SOLS_TERRAIN_CONVENTION,
  type EtatInventaire, type FicheTerrain, type InventaireTerrain, type LectureSitesSols, type PorteeSitesSols, type UsageParcelle,
} from "./sites-sols-etat.ts";

export * from "./sites-sols-etat.ts";

/**
 * MARGE DE RECHERCHE, AJOUTÉE AU RAYON DU TERRAIN. Elle ne sert qu'à ne rien manquer quand l'API et notre
 * projection mesurent un même bord à quelques décimètres près ; elle ne décide de rien et n'est jamais dite.
 */
export const MARGE_RECHERCHE_M = 5;
/** Le rayon maximal accepté par l'API (spécification v1). Un terrain plus étendu ne se lit pas en un appel. */
export const RAYON_MAX_M = 10_000;

/**
 * L'IMPRÉCISION DES TRACÉS, EN MÈTRES (arbitrage du 30/10/2026, après la revue des seuils de FUT-146). Un
 * périmètre ne « concerne » le terrain que s'il y entre de plus de 2 m : le point de l'adresse à plus de 2 m de
 * sa limite, ou une partie de la parcelle attribuée à plus de 2 m de sa limite. En deçà, c'est « à vérifier ».
 *
 * POURQUOI UNE PROFONDEUR, ET POURQUOI 2 m. Mesuré sur les 327 périmètres publiés à Paris, Lyon, Marseille et
 * Metz (325 recoupent au moins une parcelle), confrontés aux 2 559 numéros de parcelles que leurs fiches
 * officielles déclarent « concernées » et au cadastre actuel (scripts/fut157/parcelles-officielles.mjs,
 * profondeur.mjs) :
 *   - Les seuils du bruit aérien (2 % de la parcelle, 25 m²) se trompaient dans les deux sens. Ils écartaient
 *     8 parcelles déclarées concernées, touchées sur 0,3 à 17,7 m² (CRE Lyon, La Charbonnière, Sylviana, Rebellet,
 *     Danzel), et disaient « concernés » 81 recoupements (38 de SIS) où le périmètre n'entre pas de 2 m : des
 *     parcelles de 1 à 266 m² longeant une limite, que l'écart de tracé suffit à couvrir.
 *   - Les recoupements des parcelles non déclarées forment deux populations. Pour les SIS : 657 liserés de moins
 *     de 2 m de profondeur (578 de moins de 10 cm), puis un vide entre 2 et 3 m, puis 213 emprises de 3 m et plus,
 *     des parcelles renumérotées depuis la fiche (358 des 2 559 numéros déclarés n'existent plus au cadastre).
 *   - Une aire ou une part ne sépare pas ces populations : un liseré de 0,3 m² peut être déclaré, une parcelle de
 *     2 m² couverte à 100 % le long d'une limite ne l'est pas. Une profondeur, si.
 * 29 parcelles déclarées d'un SIS sont recoupées sur moins de 2 m : elles sont « à vérifier », jamais écartées.
 * Les trois inventaires suivent la même règle : les instructions reprennent souvent le périmètre du SIS et ont
 * la même distribution ; les 14 servitudes mesurées n'en montrent pas d'autre (une seule entre 2 et 3 m, une
 * parcelle de 21 m² couverte en entier).
 */
export const TOLERANCE_TRACE_M = 2;

/**
 * LA RÉPARATION ADMISE D'UN TRACÉ, EN m². Un périmètre qui n'est pas un polygone valide n'est remplacé par la
 * surface qu'il recouvre que si celle-ci ne s'écarte de l'aire de ses anneaux que de 0,1 m² au plus : moins que les
 * plus petits recoupements déclarés concernés (0,26 à 0,36 m² : CRE Lyon, Rebellet, La Charbonnière). Mesuré le 30/10/2026 : les deux périmètres de Lyon
 * qui en relèvent (RHODIACETA, BUIRE) s'écartent de 0,008 et 0,001 m², des replis de quelques centimètres nés de
 * l'arrondi des coordonnées publiées (six décimales, une dizaine de centimètres).
 */
export const TOLERANCE_REPARATION_M2 = 0.1;

const porteeDe = (geocodage: string | null): PorteeSitesSols =>
  geocodage == null ? "non_precisee" : geocodage === "housenumber" ? "adresse" : "secteur";

/** La parcelle telle que la collecte l'a rattachée (`findCadastreParcelWithGeometry`). */
export type ParcelleEntree = {
  geometry: Geometrie;
  code: string | null;
  rattachement: "point" | "repli";
  candidatsAuPoint?: number;
  distanceRepliM?: number;
};

export type EntreeSitesSols = {
  /** [lon, lat] du point de l'adresse. */
  point: [number, number];
  /** Type de la feature BAN (`housenumber`, `street`…) ; `null` si inconnu. */
  geocodage: string | null;
  parcelle: ParcelleEntree | null;
  /** Le numéro et la voie de l'adresse (`adresseDuLibelle`), pour les fiches sans emprise. `null` sans numéro. */
  adresse?: AdresseVoie | null;
};

// ── Les fiches sans emprise, rapprochées par leur ADRESSE PUBLIÉE ───────────────────────────────
//
// Une fiche localisée par un simple point, ou pas du tout, ne se situe pas. Mesuré le 30/10/2026 sur les 61
// instructions ponctuelles de Paris, Lyon, Marseille et Metz : 14 seulement sont à moins de 20 m du géocodage de
// leur propre adresse, d'autres à plus d'un kilomètre. Une distance n'y prouve rien. Mais l'adresse publiée sur la
// fiche est un fait : « 62 RUE PAUL CAZENEUVE » (GIVAUDAN, Lyon) est l'adresse même d'un logement voisin du point.
// Le rapprochement est volontairement étroit : même numéro, même voie après normalisation, sinon rien. Il ne
// fonde qu'un « à vérifier ».

export type AdresseVoie = { numero: string; voie: string };

const TYPES_VOIE: Record<string, string> = {
  R: "RUE", BD: "BOULEVARD", BLD: "BOULEVARD", BOUL: "BOULEVARD", AV: "AVENUE", AVE: "AVENUE", PL: "PLACE", CHE: "CHEMIN",
  CH: "CHEMIN", RTE: "ROUTE", IMP: "IMPASSE", ALL: "ALLEE", QU: "QUAI", ST: "SAINT", STE: "SAINTE", FG: "FAUBOURG",
  SQ: "SQUARE", CRS: "COURS", PASS: "PASSAGE", RES: "RESIDENCE", LOT: "LOTISSEMENT", ZA: "ZONE", ZI: "ZONE",
};

/** Une voie comparable : capitales sans accents, ponctuation en espaces, abréviations développées. */
export function normaliserVoie(v: string): string {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ").trim().split(" ").map((t) => TYPES_VOIE[t] ?? t).join(" ");
}

/** Le numéro et la voie d'un libellé BAN (« 96b Boulevard Solidarité 57070 Metz »). `null` sans numéro. */
export function adresseDuLibelle(label: string, codePostal: string | null, commune: string | null): AdresseVoie | null {
  let reste = label.trim();
  const fin = [codePostal, commune].filter(Boolean).join(" ");
  if (fin && reste.toLowerCase().endsWith(fin.toLowerCase())) reste = reste.slice(0, -fin.length).trim();
  // L'indice (« 96b », « 92 bis », « 94 a ») n'est pas comparé : seuls le numéro et la voie le sont.
  const m = /^(\d+)(?:\s*(?:bis|ter|quater|quinquies)\b|[a-z]\b|\s[a-z](?=\s))?\s+(.+)$/i.exec(reste);
  return m ? { numero: m[1], voie: normaliserVoie(m[2]) } : null;
}

/**
 * Les numéros et la voie d'une adresse publiée sur une fiche : « 62 RUE X », « 14-20 RUE X » ou « 16 À 24 RUE X »
 * (une plage, du même côté de la voie), « 9 ET 11 RUE X » ou « 156/160 ROUTE X » (une liste). Une adresse qui ne commence pas par un numéro
 * (« FACE AU 114 », un lieu-dit) ne se rapproche de rien. Plusieurs adresses séparées par « - » sont lues une à une.
 */
export function adressesPubliees(adresse: string | null): { numeros: Set<number>; voie: string }[] {
  if (!adresse) return [];
  const out: { numeros: Set<number>; voie: string }[] = [];
  for (const morceau of adresse.replace(/\([^)]*\)/g, " ").split(/\s+-\s+/)) {
    const m = /^\s*(\d+)((?:\s*(?:-|À|A|AU|ET|\/|,)\s*\d+)*)\s+([^\d].*)$/i.exec(morceau);
    if (!m) continue;
    const numeros = new Set<number>([Number(m[1])]);
    let precedent = Number(m[1]);
    for (const [, sep, n] of m[2].matchAll(/\s*(-|À|A|AU|ET|\/|,)\s*(\d+)/gi)) {
      const k = Number(n);
      // Une plage française suit un côté de la voie : « 14-20 » est 14, 16, 18, 20, pas le 17 d'en face.
      const pas = (k - precedent) % 2 === 0 ? 2 : 1;
      if (/^(-|À|A|AU)$/i.test(sep) && k > precedent && k - precedent <= 200) for (let i = precedent; i <= k; i += pas) numeros.add(i);
      else numeros.add(k);
      precedent = k;
    }
    out.push({ numeros, voie: normaliserVoie(m[3]) });
  }
  return out;
}

/** La fiche est-elle publiée à cette adresse ? Même numéro (sans l'indice bis, ter) et même voie normalisée. */
export function publieeALAdresse(adresseFiche: string | null, a: AdresseVoie | null | undefined): boolean {
  if (!a) return false;
  return adressesPubliees(adresseFiche).some((p) => p.voie === a.voie && p.numeros.has(Number(a.numero)));
}

type Plan = { portee: PorteeSitesSols; usage: UsageParcelle; region: Region | null; rayonM: number; proj: ReturnType<typeof projectionAutour> };

/**
 * LE PLAN DE RECHERCHE : quelle parcelle sert, et quel rayon demander à l'API pour voir tout périmètre qui
 * pourrait la toucher. Le rayon couvre le sommet de la parcelle le plus éloigné du point, plus la marge ;
 * sans parcelle, la marge seule (le point lui-même).
 */
export function planDeRecherche(e: EntreeSitesSols): Plan {
  const portee = porteeDe(e.geocodage);
  const proj = projectionAutour(e.point[0], e.point[1]);
  const p = e.parcelle;
  const region = p ? regionDe(p.geometry, proj) : null;
  const mesurable = !!region && aireRegion(region) > 0 && regionMesurable(region);
  const etendue = mesurable ? Math.max(...region!.flatMap((a) => a.map(([x, y]) => Math.hypot(x, y)))) : 0;
  const rayonParcelle = Math.ceil(etendue + MARGE_RECHERCHE_M);

  let usage: UsageParcelle;
  if (portee !== "adresse") usage = { statut: "ecartee", raison: "adresse_sans_numero" };
  else if (!p) usage = { statut: "ecartee", raison: "absente" };
  else if (!mesurable) usage = { statut: "ecartee", raison: "non_mesurable" };
  else if (rayonParcelle > RAYON_MAX_M) usage = { statut: "ecartee", raison: "trop_etendue" };
  else if (p.rattachement === "repli") usage = { statut: "incertaine", code: p.code, raison: "repli", distanceM: p.distanceRepliM ?? null };
  else if ((p.candidatsAuPoint ?? 1) > 1) usage = { statut: "incertaine", code: p.code, raison: "limite", distanceM: null };
  else usage = { statut: "attribuee", code: p.code };

  const servie = usage.statut !== "ecartee";
  return { portee, usage, region: servie ? region : null, rayonM: servie ? rayonParcelle : MARGE_RECHERCHE_M, proj };
}

// ── La situation d'une fiche ─────────────────────────────────────────────────────────────────

const arrondi = (v: number, pas: number) => { const k = Math.round(1 / pas); return Math.round(v * k) / k; };

/**
 * L'emprise (projetée) de TOUS les sommets d'une géométrie ; `null` s'il n'y en a aucun, ou si un seul est
 * illisible : l'emprise des autres ne borne alors plus le tracé (revue du 30/10/2026, un sommet illisible était
 * ignoré et l'emprise pouvait se croire loin du terrain).
 */
function emprise(coordinates: unknown, proj: Plan["proj"]): [number, number, number, number] | null {
  const pts: [number, number][] = [];
  let illisible = false;
  const visiter = (v: unknown): void => {
    if (!Array.isArray(v)) { illisible = true; return; }
    if (v.length > 0 && !Array.isArray(v[0])) {
      const q = pointsDe({ type: "Point", coordinates: v }, proj);
      if (q) pts.push(q[0]); else illisible = true;
      return;
    }
    v.forEach(visiter);
  };
  visiter(coordinates);
  if (illisible || pts.length === 0) return null;
  return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
}

/**
 * Un périmètre qu'on ne sait pas mesurer ne compte que si son emprise touche celle du terrain (la parcelle
 * servie, ou le point) : sans quoi un tracé illisible à l'autre bout du rayon de recherche ferait « à vérifier ».
 * Sans aucun sommet lisible, on ne sait même pas où il est : il compte.
 */
function illisibleQuiTouche(g: FicheSspGeo["geometrie"], plan: Plan, ici: [number, number]): boolean {
  const b = g ? emprise(g.coordinates, plan.proj) : null;
  if (!b) return true;
  const pts = plan.region ? plan.region.flat() : [ici];
  const [x0, y0, x1, y1] = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const m = MARGE_RECHERCHE_M;
  return !(b[0] > x1 + m || b[2] < x0 - m || b[1] > y1 + m || b[3] < y0 - m);
}

const ILLISIBLE = { situation: "geometrie_illisible" as const, part: null, surfaceM2: null };

/** L'aire (m²) d'un anneau GeoJSON projeté ; `null` si un sommet est illisible. */
function aireAnneau(anneau: unknown, proj: Plan["proj"]): number | null {
  if (!Array.isArray(anneau)) return null;
  const pts = pointsDe({ type: "MultiPoint", coordinates: anneau }, proj);
  if (!pts) return null;
  let s = 0;
  for (let i = 0; i + 1 < pts.length; i++) s += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  return Math.abs(s / 2);
}

/**
 * LES ANNEAUX D'AIRE NULLE, ÉCARTÉS AVANT LA MESURE. Mesuré le 30/10/2026 : 35 périmètres publiés sur 327
 * (Paris, Lyon, Marseille, Metz) portent des « trous » qui ne sont que des allers-retours sur un segment
 * (`[a, a, b, a]`), d'aire exactement nulle. Ils n'enferment aucune surface : les écarter ne change rien au
 * périmètre, alors que les garder rendait toute la géométrie illisible (`regionDe` refuse un anneau dégénéré),
 * donc « à vérifier » pour un terrain situé 40 m à l'intérieur (Marseille, TLM). Le seuil est celui de
 * `regionDe` : un anneau dont un sommet est illisible n'est pas écarté, il laisse la géométrie illisible.
 */
export function sansAnneauxNuls(g: { type: string; coordinates: unknown }, proj: Plan["proj"]): Geometrie {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : null;
  if (!Array.isArray(polys)) return g;
  const nul = (a: unknown) => { const x = aireAnneau(a, proj); return x != null && x < 1e-6; };
  const nettoyes = polys
    .filter((p) => !(Array.isArray(p) && p.length > 0 && nul(p[0])))
    .map((p) => (Array.isArray(p) ? [p[0], ...p.slice(1).filter((a) => !nul(a))] : p));
  return { type: "MultiPolygon", coordinates: nettoyes };
}

/**
 * LE PÉRIMÈTRE TEL QU'ON PEUT LE MESURER, ou `null` s'il ne se mesure pas : ses anneaux d'aire nulle écartés
 * (`sansAnneauxNuls`), puis, s'il n'est toujours pas un polygone valide, réparé à la précision de ses coordonnées
 * (`TOLERANCE_REPARATION_M2`). `reparationM2` dit de combien la réparation a déplacé de surface (0 sans réparation).
 */
export function perimetreLisible(g: { type: string; coordinates: unknown }, proj: Plan["proj"]): { region: Region; reparationM2: number } | null {
  const r = regionDe(sansAnneauxNuls(g, proj), proj);
  if (!r || !(aireRegion(r) > 0)) return null;
  const rep = reparer(r, TOLERANCE_REPARATION_M2);
  return rep && aireRegion(rep.region) > 0 ? { region: rep.region, reparationM2: rep.ecartM2 } : null;
}

function situer(f: FicheSspGeo, plan: Plan, point: [number, number]): Pick<FicheTerrain, "situation" | "part" | "surfaceM2"> | null {
  const g = f.geometrie;
  const ici = pointsDe({ type: "Point", coordinates: point }, plan.proj)![0];
  if (g && (g.type === "Point" || g.type === "MultiPoint")) {
    // Un point ne dit rien d'une emprise : il ne compte que s'il tombe dans la parcelle servie. Illisible, il ne
    // se situe pas (il reste compté parmi les fiches sans emprise de la commune).
    if (!plan.region) return null;
    const pts = pointsDe(g, plan.proj);
    if (!pts) return null;
    return pts.some((q) => classer(q, plan.region!).lieu !== "dehors") ? { situation: "localisation_ponctuelle", part: null, surfaceM2: null } : null;
  }
  const lu = g && (g.type === "Polygon" || g.type === "MultiPolygon") ? perimetreLisible(g, plan.proj) : null;
  // Rendue par la recherche géographique, mais illisible : si elle touche le terrain, on ne sait pas où elle passe.
  if (!lu) return illisibleQuiTouche(g, plan, ici) ? ILLISIBLE : null;
  const r = lu.region;

  // LA PREUVE EST UNE PROFONDEUR, PAS UNE PART (arbitrage du 30/10/2026, cf. `TOLERANCE_TRACE_M`). Un périmètre
  // « concerne » le terrain s'il y entre au-delà de l'imprécision des tracés : une partie de la parcelle attribuée à
  // plus de `TOLERANCE_TRACE_M` de sa limite, ou le point de l'adresse à plus de `TOLERANCE_TRACE_M` à l'intérieur
  // quand ce point est dans la parcelle attribuée (`ficheDemontree`, `sites-sols-etat.ts`). En deçà, le recoupement
  // est un liseré qui peut n'être qu'un écart de tracé, mais il n'est JAMAIS écarté : il appelle une vérification.
  //
  // UN CONTACT N'EST PAS UNE PETITE INTERSECTION (contre-revue du 31/10/2026). Jusqu'au SHA 971e423a, toute aire de
  // moins de 0,05 m² était supprimée sans rien dire : une parcelle touchée sur 0,02 m² lisait « aucun ». Seul un
  // contact est désormais ignoré : une aire qui ne dépasse pas l'incertitude du calcul lui-même (`mesureIntersection`,
  // l'arrondi au micromètre, de l'ordre de 10⁻⁴ m²), indiscernable de deux limites confondues. Toute intersection
  // positive au-delà, si petite soit-elle, est mesurée et dite « à vérifier ». Une seule des 2 559 parcelles que les
  // fiches officielles déclarent concernées est touchée sur moins de 0,05 m² : BC 208 à Lyon Confluence (0,007 m²),
  // désormais signalée.
  const lieu = classer(ici, r).lieu;
  const pointProfond = lieu === "dedans" && distanceLignes(ici, r) >= TOLERANCE_TRACE_M;
  let mesure: { part: number; surfaceM2: number; profond: boolean } | null = null;
  if (plan.region) {
    const m = mesureIntersection(plan.region, r);
    if (m == null) return ILLISIBLE;
    if (m.aire > m.incertitude) {
      const auDela = aireAuDela(plan.region, r, TOLERANCE_TRACE_M);
      if (auDela == null) return ILLISIBLE;
      mesure = {
        part: Math.min(1, arrondi(m.aire / aireRegion(plan.region), 0.001)),
        // Au dixième de m² ; en deçà, deux chiffres significatifs : une aire infime n'est jamais arrondie à zéro.
        surfaceM2: m.aire >= 0.1 ? arrondi(m.aire, 0.1) : Number(m.aire.toPrecision(2)),
        // Ce qui reste de l'intersection au-delà de 2 m de profondeur doit lui-même dépasser un contact (0,05 m²,
        // FUT-81) : un reste plus petit ne fait pas « concerné », il laisse le recoupement « à vérifier ».
        profond: auDela >= SURFACE_CONTACT_M2,
      };
    }
  }
  const avecMesure = { part: mesure?.part ?? null, surfaceM2: mesure?.surfaceM2 ?? null };
  // Le point au-delà de la tolérance : le fait géographique est gardé. Il ne démontre le terrain que si la parcelle est
  // attribuée (`ficheDemontree`) ; sinon (proximité, limite de deux parcelles, cadastre muet), il est « à vérifier ».
  if (pointProfond) return { situation: "point_dans", ...avecMesure };
  if (mesure?.profond && plan.usage.statut === "attribuee") return { situation: "parcelle_recoupe", ...avecMesure };
  if (lieu === "bord") return { situation: "point_en_limite", ...avecMesure };
  if (mesure && plan.usage.statut === "incertaine") return { situation: "parcelle_incertaine", ...avecMesure };
  if (mesure) return { situation: "parcelle_bordure", ...avecMesure };
  // Le point est dedans, mais à moins de la tolérance de la limite, et aucune parcelle ne tranche.
  if (lieu === "dedans") return { situation: "point_en_limite", ...avecMesure };
  return null;
}

const etatDe = (c: CategorieGeoLue): EtatInventaire =>
  c.etat === "indisponible" ? "indisponible" : c.etat === "partiel" ? "partiel" : "complet";

/**
 * Les réponses de la collecte : une catégorie lue par inventaire autour du point, et les fiches de la commune
 * SANS EMPRISE (un point ou aucune géométrie), lues à la commune. `null` : la lecture communale n'a pas été faite.
 */
export type ReponsesSitesSols = {
  categories: Record<InventaireTerrain, CategorieGeoLue>;
  sansEmprise: { etat: EtatInventaire; fiches: (FicheSspGeo & { inventaire: InventaireTerrain })[] } | null;
};

const ponctuelle = (f: FicheSspGeo) => f.geometrie != null && (f.geometrie.type === "Point" || f.geometrie.type === "MultiPoint");

/**
 * LA LISTE COMMUNALE DES FICHES SANS EMPRISE, À PARTIR DES TROIS INVENTAIRES LUS À LA COMMUNE (contre-revue du
 * 31/10/2026). Jusqu'au SHA 971e423a, un seul inventaire en panne vidait toute la liste : une instruction publiée à
 * l'adresse même du logement disparaissait parce que les SIS n'avaient pas répondu. Désormais :
 *   - les fiches de chaque inventaire lu (en entier ou en partie) sont gardées ;
 *   - `partiel` dès qu'un inventaire est en panne ou n'a pas été lu en entier : la liste n'est pas établie, et
 *     aucune absence ne peut en être conclue (`etatSitesSols` rend `incomplet` sans fiche) ;
 *   - `indisponible` seulement quand aucun des trois n'a répondu.
 */
export function assemblerSansEmprise(lus: Record<InventaireTerrain, CategorieGeoLue>): NonNullable<ReponsesSitesSols["sansEmprise"]> {
  if (INVENTAIRES.every((i) => lus[i].etat === "indisponible")) return { etat: "indisponible", fiches: [] };
  const fiches = INVENTAIRES.flatMap((inventaire) => {
    const c = lus[inventaire];
    return c.etat === "indisponible" ? [] : c.fiches
      .filter((f) => f.geometrie == null || ponctuelle(f))
      .map((f) => ({ ...f, inventaire }));
  });
  const complet = INVENTAIRES.every((i) => lus[i].etat === "disponible" || lus[i].etat === "absent_dans_source");
  return { etat: complet ? "complet" : "partiel", fiches };
}

/** LA LECTURE D'UNE ADRESSE. Ne lève jamais ; une panne reste une panne. */
export function lireSitesSolsTerrain(e: EntreeSitesSols, rep: ReponsesSitesSols): LectureSitesSols {
  const plan = planDeRecherche(e);
  const fiches: FicheTerrain[] = [];
  for (const inv of INVENTAIRES) {
    const c = rep.categories[inv];
    if (c.etat === "indisponible") continue;
    for (const f of c.fiches) {
      const s = situer(f, plan, e.point);
      if (s) fiches.push({ inventaire: inv, id: f.id, nom: f.nom, statut: f.statut, fiche: f.fiche, miseAJour: f.miseAJour, ...s });
    }
  }
  // LES FICHES SANS EMPRISE, LUES À LA COMMUNE. La recherche autour d'un point ne rend JAMAIS une fiche localisée
  // par un point (mesuré le 30/10/2026 : GIVAUDAN, Lyon, absente d'une recherche à 10 m de son propre point), ni
  // une fiche sans géométrie. Leur point est confronté à la parcelle servie ; à défaut, leur adresse publiée à
  // celle du logement.
  for (const f of rep.sansEmprise?.fiches ?? []) {
    if (fiches.some((x) => x.id === f.id && x.inventaire === f.inventaire)) continue;
    const s = ponctuelle(f) ? situer(f, plan, e.point) : null;
    const base = { inventaire: f.inventaire, id: f.id, nom: f.nom, statut: f.statut, fiche: f.fiche, miseAJour: f.miseAJour };
    if (s) fiches.push({ ...base, ...s });
    else if (plan.portee === "adresse" && publieeALAdresse(f.adresse, e.adresse)) {
      fiches.push({ ...base, situation: "adresse_publiee", part: null, surfaceM2: null, adressePubliee: { texte: f.adresse!, localisation: ponctuelle(f) ? "point" : "aucune" } });
    }
  }
  const inventaires = Object.fromEntries(INVENTAIRES.map((i) => [i, etatDe(rep.categories[i])])) as Record<InventaireTerrain, EtatInventaire>;
  const toutEnPanne = INVENTAIRES.every((i) => inventaires[i] === "indisponible");
  return {
    convention: SITES_SOLS_TERRAIN_CONVENTION,
    statut: toutEnPanne ? "indisponible" : "lu",
    portee: plan.portee, parcelle: plan.usage, rayonM: plan.rayonM, inventaires,
    fiches: fiches.sort((a, b) => INVENTAIRES.indexOf(a.inventaire) - INVENTAIRES.indexOf(b.inventaire) || a.nom.localeCompare(b.nom, "fr")),
    sansEmprise: rep.sansEmprise
      ? {
          etat: rep.sansEmprise.etat,
          ponctuelles: rep.sansEmprise.fiches.filter(ponctuelle).length,
          sansGeometrie: rep.sansEmprise.fiches.filter((f) => f.geometrie == null).length,
        }
      : null,
  };
}

/** Une lecture qui n'a pas pu se faire (collecte qui lève, délai dépassé). Jamais une absence. */
export function sitesSolsIndisponible(e: EntreeSitesSols): LectureSitesSols {
  const plan = planDeRecherche(e);
  return {
    convention: SITES_SOLS_TERRAIN_CONVENTION, statut: "indisponible", portee: plan.portee, parcelle: plan.usage, rayonM: plan.rayonM,
    inventaires: { sis: "indisponible", sup: "indisponible", instructions: "indisponible" },
    fiches: [], sansEmprise: null,
  };
}
