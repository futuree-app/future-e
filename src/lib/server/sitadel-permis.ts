import "server-only";
import {
  RAYON_PERMIS_M, ANCIENNETE_MAX_ANS, cleParcelle, permisAMontrer,
} from "@/lib/sitadel-selection";
import { parseSitadelCsv, COLONNES_SITADEL } from "@/lib/sitadel-csv";
import { communeParent } from "@/lib/plm";
import type { PermisSnapshot } from "@/lib/logement-autour-types";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LES DEUX APPELS QUI REMPLISSENT LE BLOC DES PERMIS.
//
// Toute la doctrine vit dans les libs pures (`sitadel-etat`, `sitadel-selection`, `sitadel-csv`) ;
// ce module ne fait que du réseau, et il ne décide de rien.
//
//   1. le cadastre (API Carto IGN) rend les parcelles autour du point ;
//   2. le registre SDES (API DiDo) rend les autorisations de la commune ;
//   3. la jointure se fait sur (section, numéro), normalisés des deux côtés.
//
// ── TROIS RÉGLAGES MESURÉS LE 01/08/2026, ET CE QU'ILS ÉVITENT ────────────────────────────────
//
// • `columns=` : le jeu porte 94 colonnes, on en demande DIX. La Rochelle passe de 538 Ko à
//   31 Ko, Paris entier de plusieurs mégaoctets à 147 Ko. Sans cette réduction, l'appel ne tient
//   pas dans le budget d'une requête d'analyse. Aucune des dix n'est du texte libre, ce qui rend
//   le découpage du CSV sûr (cf. `sitadel-csv.ts`).
//
// • `AN_DEPOT=gte:` : le filtre d'ancienneté est appliqué PAR LA SOURCE, ce qui divise encore le
//   volume par trois ou quatre. Il reprend exactement la règle de `permisAMontrer`, qui le
//   ré-applique ensuite : la sélection reste vraie même si le filtre distant change de sens.
//
// • Le code commune : Sitadel ne connaît QUE les communes-mères. `COMM=eq:75101` répond 400, il
//   faut `75056`. Une adresse parisienne est géocodée sur son arrondissement, donc sans
//   `communeParent` le bloc serait vide pour tout Paris, Lyon et Marseille — et vide se lirait
//   « rien ne se construit », dans les trois villes où c'est le plus faux.
//
// ── UN 400 « LE FICHIER EST VIDE » N'EST PAS UNE PANNE ────────────────────────────────────────
// L'API répond 400 avec ce message quand le filtre ne ramène aucune ligne, y compris sur une
// commune parfaitement valide. Vérifié le 01/08/2026 sur `17300` avec `AN_DEPOT=gte:2050`. Le
// traiter comme un échec ferait disparaître le bloc de toutes les communes sans dossier récent,
// c'est-à-dire précisément là où l'absence est l'information.
// ════════════════════════════════════════════════════════════════════════════════════════════

const CADASTRE_URL = "https://apicarto.ign.fr/api/cadastre/parcelle";
const DIDO_DATAFILE = "8b35affb-55fc-4c1f-915b-7750f974446a";
const DIDO_URL = `https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/${DIDO_DATAFILE}/csv`;

const TIMEOUT_MS = 8000;

/**
 * PLAFOND DE PARCELLES, ET IL EST SIGNALÉ.
 *
 * `_limit=200` était atteint PILE à 200 m en ville pendant la mesure : des parcelles
 * disparaissaient en silence, et le comptage sous-estimait précisément les secteurs denses, ceux
 * où il y a des permis. À 50 m, le plafond n'est jamais approché ; s'il l'était, la liste serait
 * incomplète sans qu'on puisse le savoir, donc on refuse de conclure.
 */
const LIMITE_PARCELLES = 1000;

/**
 * Les parcelles cadastrales dans un CARRÉ de `rayon` mètres autour du point.
 *
 * Un carré, pas un disque : c'est la géométrie exacte de la mesure du 01/08/2026 qui a fixé le
 * rayon à 50 m. Prendre un disque ici rendrait la fréquence observée (une adresse sur quatre)
 * légèrement fausse, pour un gain nul.
 */
async function parcellesAutour(lat: number, lon: number, rayon: number): Promise<Set<string> | null> {
  const dLat = rayon / 111_320;
  const dLon = rayon / (111_320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  const geom = {
    type: "Polygon",
    coordinates: [[
      [lon - dLon, lat - dLat], [lon + dLon, lat - dLat],
      [lon + dLon, lat + dLat], [lon - dLon, lat + dLat], [lon - dLon, lat - dLat],
    ]],
  };
  const url = `${CADASTRE_URL}?geom=${encodeURIComponent(JSON.stringify(geom))}&_limit=${LIMITE_PARCELLES}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    features?: { properties?: { section?: string; numero?: string } }[];
  };
  const features = json.features ?? [];
  if (features.length >= LIMITE_PARCELLES) return null; // liste tronquée : on ne conclut pas
  // AUCUNE PARCELLE N'EST UNE ABSENCE DE RÉPONSE, pas une absence de bâti : une adresse est
  // toujours entourée de parcelles là où le cadastre est vectorisé. Un ensemble vide signifie donc
  // que la jointure ne peut avoir lieu, et le bloc doit disparaître plutôt qu'annoncer zéro permis.
  if (features.length === 0) return null;
  return new Set(features.map((f) => cleParcelle(f.properties?.section, f.properties?.numero)));
}

/** Le CSV du registre pour une commune, réduit aux dix colonnes utiles et à la fenêtre utile. */
async function csvCommune(insee: string, depuis: number): Promise<string | null> {
  const url =
    `${DIDO_URL}?COMM=eq:${encodeURIComponent(insee)}` +
    `&AN_DEPOT=gte:${depuis}` +
    `&columns=${COLONNES_SITADEL.join(",")}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 400) {
    // « Le fichier est vide » : zéro ligne pour ce filtre. C'est une réponse, pas une panne.
    const corps = await res.text().catch(() => "");
    return corps.includes("Le fichier est vide") ? "" : null;
  }
  if (!res.ok) return null;
  return await res.text();
}

/**
 * Les autorisations d'urbanisme retenues autour d'un point, prêtes à être GELÉES dans le snapshot.
 *
 * Rend `null` dès qu'une des deux sources n'a pas répondu, ou que le CSV est illisible. L'appelant
 * laisse alors le champ absent, et le bloc disparaît : une liste vide affirmerait qu'il n'y a
 * aucun permis autour, ce qui n'aurait pas été établi.
 *
 * Ne lève jamais.
 */
export async function fetchPermisAutour(
  lat: number,
  lon: number,
  insee: string | null,
  maintenant: Date = new Date(),
): Promise<PermisSnapshot | null> {
  const commune = communeParent(insee);
  if (!commune) return null;

  const anneeReference = maintenant.getUTCFullYear();
  const depuis = anneeReference - ANCIENNETE_MAX_ANS;

  try {
    // En parallèle : deux hôtes différents, aucune dépendance entre les deux appels.
    const [parcelles, csv] = await Promise.all([
      parcellesAutour(lat, lon, RAYON_PERMIS_M),
      csvCommune(commune, depuis),
    ]);
    if (!parcelles || csv === null) return null;

    // Un CSV vide (400 « fichier vide ») est une commune sans dossier récent : zéro permis, ce qui
    // est une réponse. Un CSV illisible, lui, a déjà été écarté par `parseSitadelCsv` -> null.
    const autorisations = csv === "" ? [] : parseSitadelCsv(csv);
    if (autorisations === null) return null;

    return {
      permis: permisAMontrer(autorisations, parcelles, anneeReference),
      rayonMeters: RAYON_PERMIS_M,
      ancienneteMaxAns: ANCIENNETE_MAX_ANS,
      anneeReference,
      consulteLe: maintenant.toISOString(),
    };
  } catch {
    return null;
  }
}
