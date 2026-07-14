// LES CONTRÔLES DU GÉOCODAGE. PURS : aucun réseau, aucun index.
//
// Un géocodeur répond TOUJOURS quelque chose, et son score classe la ressemblance des MOTS, pas la
// justesse du LIEU. Deux faits, vérifiés contre les API le 2026-07-14, commandent tout ce fichier :
//
//   « gare Matabiau »     -> la BAN rend « Rue Matabiau » (type street, score 0,71). Plausible. Faux.
//   « hôpital de Purpan » -> le MIEUX CLASSÉ (0,65) est le « Centre de Formation Métiers de la Santé Chu
//                            Hôpital de Purpan ». Le vrai hôpital est à 0,42. Les deux portent les deux
//                            mots du lecteur : ni le score ni le libellé ne les séparent. SEULE LA
//                            CATÉGORIE le fait.
//
// D'où la doctrine : le type attendu se déduit du libellé du lecteur, la catégorie décide, et le score
// n'est qu'un plancher anti-bruit. Un résultat seulement PLAUSIBLE ne devient jamais `resolved` : sur une
// condition non négociable, futur•e ne doit pas évaluer une distance depuis une rue que le lecteur n'a
// jamais nommée.
import { haversineKm } from "./hard-constraints.ts";
import { normalizeName } from "./hard-constraints-resolve.ts";
import type { ResolutionMetadata, ResolvedPlaceReference } from "./hard-constraints-resolve.ts";

export type GeocodeCandidate = {
  label: string;
  kind: "commune" | "station" | "address" | "poi" | "street";
  lat: number;
  lon: number;
  citycode: string | null;
  dept: string | null;
  score: number;
  sourceId: string | null;
  source: "geoplateforme_poi" | "ban";
  categories: string[];
};

export type ExpectedPlaceKind = "equipment" | "address" | "unspecified";

// `degraded` = au moins un géocodeur n'a pas répondu. Sans ce drapeau, une panne réseau deviendrait « ce
// lieu n'existe pas », et le lot 2b la persisterait comme une impossibilité stable.
export type ScreeningContext = { departements: string[]; degraded: boolean };

// Le score classe la ressemblance des mots : il ne peut donc être qu'un plancher ANTI-BRUIT. À 0,6, il
// aurait éliminé l'hôpital de Purpan (0,42) au profit de l'école qui porte son nom (0,65).
const MIN_SCORE = 0.3;
// Deux candidats à moins de 300 m sont le même lieu vu par deux référentiels. Au-delà, ce sont deux lieux :
// les gares de Perrache et de la Guillotière sont à 2,5 km l'une de l'autre, et ce sont bien deux gares.
const SAME_PLACE_KM = 0.3;

// Les noms communs qui désignent un ÉQUIPEMENT, avec les catégories (BDTOPO) qui les confirment. C'est
// cette table, et elle seule, qui distingue l'hôpital de l'école qui porte son nom.
const EQUIPEMENTS: { mot: string; categories: string[] }[] = [
  { mot: "gare", categories: ["gare"] },
  { mot: "aeroport", categories: ["aérodrome", "aéroport", "transport"] },
  { mot: "hopital", categories: ["hôpital", "santé"] },
  { mot: "chu", categories: ["hôpital", "santé"] },
  { mot: "clinique", categories: ["clinique", "hôpital", "santé"] },
  { mot: "universite", categories: ["université", "enseignement supérieur"] },
  { mot: "campus", categories: ["université", "enseignement supérieur"] },
  { mot: "lycee", categories: ["lycée", "enseignement"] },
  { mot: "college", categories: ["collège", "enseignement"] },
  { mot: "ecole", categories: ["école", "enseignement"] },
  { mot: "port", categories: ["port"] },
  { mot: "plage", categories: ["plage", "littoral"] },
  { mot: "stade", categories: ["stade", "sport"] },
  { mot: "musee", categories: ["musée", "culture"] },
  { mot: "mairie", categories: ["mairie", "administratif"] },
  { mot: "prefecture", categories: ["préfecture", "administratif"] },
];

const MOTS_VIDES = new Set(["le", "la", "les", "l", "de", "du", "des", "d", "a", "au", "aux", "en", "et"]);

function mots(s: string): string[] {
  return normalizeName(s).split(" ").filter((w) => w.length > 0 && !MOTS_VIDES.has(w));
}

function equipementsVises(label: string): { mot: string; categories: string[] }[] {
  const m = new Set(mots(label));
  return EQUIPEMENTS.filter((e) => m.has(e.mot));
}

// Un numéro de voie en tête : le lecteur donne une ADRESSE, et un point d'intérêt voisin n'a pas à la
// remplacer. Le contrôle de type vaut donc dans les DEUX sens.
export function expectedKindOf(label: string): ExpectedPlaceKind {
  if (/^\s*\d+\s*(bis|ter|quater)?\s+\S/i.test(label)) return "address";
  return equipementsVises(label).length > 0 ? "equipment" : "unspecified";
}

const FAMILLE: Record<GeocodeCandidate["kind"], "equipment" | "address" | "commune"> = {
  station: "equipment", poi: "equipment", address: "address", street: "address", commune: "commune",
};

function categorieCompatible(c: GeocodeCandidate, attendus: { categories: string[] }[]): boolean {
  const cats = c.categories.map((x) => normalizeName(x));
  return attendus.some((e) =>
    e.categories.some((want) => cats.some((cat) => cat.includes(normalizeName(want)))),
  );
}

// Tous les mots significatifs du lecteur doivent se retrouver dans le libellé du candidat OU dans ses
// catégories : un POI nommé « Purpan » et catégorisé « hôpital » répond honnêtement à « l'hôpital de
// Purpan », même si son libellé ne porte pas le mot.
function libelleConcorde(label: string, c: GeocodeCandidate): boolean {
  const cible = new Set([...mots(c.label), ...c.categories.flatMap((cat) => mots(cat))]);
  return mots(label).every((w) => cible.has(w));
}

export function screenCandidates(
  label: string,
  candidates: GeocodeCandidate[],
  context: ScreeningContext,
  meta: ResolutionMetadata,
): ResolvedPlaceReference {
  // LA PANNE N'EST PAS UN CONSTAT. Si un géocodeur n'a pas répondu et qu'il ne reste rien, on ne sait pas
  // si le lieu existe : on le dit, et on retentera. Un service debout qui trouve la gare pendant que
  // l'autre tombe reste, lui, une résolution parfaitement valide : on ne jette pas ce qu'on a.
  const rien = (reason: "no_result" | "low_confidence" | "unsupported_type"): ResolvedPlaceReference =>
    context.degraded
      ? { status: "unresolved", originalLabel: label, reason: "geocoding_unavailable", meta }
      : { status: "unresolved", originalLabel: label, reason, meta };

  if (candidates.length === 0) return rien("no_result");

  const attendu = expectedKindOf(label);
  const equipements = equipementsVises(label);

  // CONTRÔLE 1, LE TYPE ATTENDU, dans les deux sens : « la gare » n'est pas une rue, et « 7 rue du Taur »
  // n'est pas un point d'intérêt du quartier.
  let recevables = candidates.filter((c) => {
    if (attendu === "equipment") return FAMILLE[c.kind] === "equipment";
    if (attendu === "address") return FAMILLE[c.kind] === "address" || FAMILLE[c.kind] === "commune";
    return true;
  });
  if (recevables.length === 0) return rien("unsupported_type");

  // CONTRÔLE 2, LA CATÉGORIE, ET C'EST ELLE QUI DÉCIDE. Dès qu'un candidat porte la catégorie du mot du
  // lecteur, ceux qui ne la portent pas sont écartés, si bien classés soient-ils : c'est ce qui empêche le
  // centre de formation de devenir l'hôpital.
  if (attendu === "equipment") {
    const bonneCategorie = recevables.filter((c) => categorieCompatible(c, equipements));
    if (bonneCategorie.length > 0) recevables = bonneCategorie;
  }

  // CONTRÔLE 3, la concordance du libellé.
  recevables = recevables.filter((c) => libelleConcorde(label, c));
  if (recevables.length === 0) return rien("no_result");

  // CONTRÔLE 4, le territoire déclaré. Il DÉSAMBIGUÏSE, il ne force jamais : un candidat hors du périmètre
  // est écarté, jamais « rapproché ».
  const depts = new Set(context.departements);
  if (depts.size > 0) {
    const dedans = recevables.filter((c) => c.dept != null && depts.has(c.dept));
    if (dedans.length === 0) return rien("no_result");
    recevables = dedans;
  }

  // CONTRÔLE 5, le plancher anti-bruit.
  recevables = recevables.filter((c) => c.score >= MIN_SCORE);
  if (recevables.length === 0) return rien("low_confidence");

  const tries = [...recevables].sort((a, b) => b.score - a.score);
  const meilleur = tries[0]!;

  // LA DÉDUPLICATION, PUIS L'AMBIGUÏTÉ. Même identifiant : le même objet, quelles que soient ses
  // coordonnées. Sinon, à moins de 300 m et dans la même famille : le même lieu vu par deux référentiels
  // (la Géoplateforme et la BAN décrivent une même adresse avec deux libellés ; exiger l'égalité des
  // libellés fabriquerait de faux « ambiguous »).
  const memeLieu = (a: GeocodeCandidate, b: GeocodeCandidate): boolean =>
    (a.sourceId != null && a.sourceId === b.sourceId) ||
    (FAMILLE[a.kind] === FAMILLE[b.kind] && haversineKm(a.lat, a.lon, b.lat, b.lon) <= SAME_PLACE_KM);

  const distincts = tries.filter((c) => !memeLieu(meilleur, c));
  if (distincts.length > 0) {
    // Deux lieux RÉELS portent le même nom (« la gare de Lyon » en rend cinq, toutes au même score) : on ne
    // choisit pas à la place du lecteur.
    return {
      status: "ambiguous",
      originalLabel: label,
      candidates: [meilleur, ...distincts].map((c) => ({
        canonicalLabel: c.label, lat: c.lat, lon: c.lon, kind: c.kind,
      })),
      meta,
    };
  }

  return {
    status: "resolved",
    originalLabel: label,
    canonicalLabel: meilleur.label,
    kind: meilleur.kind === "street" ? "address" : meilleur.kind,
    lat: meilleur.lat,
    lon: meilleur.lon,
    // LA PROVENANCE EST CELLE DU RÉFÉRENTIEL QUI A RÉPONDU, jamais maquillée : elle servira au read repair
    // (lot 2b), à l'audit, et à l'explication.
    source: meilleur.source,
    sourceId: meilleur.sourceId,
    confidence: meilleur.score >= 0.8 ? "exact" : "high",
    meta,
  };
}
