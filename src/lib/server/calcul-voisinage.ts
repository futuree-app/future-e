import "server-only";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { loadBpePointsAround, nearestByCategory } from "@/lib/logement-bpe";
import { getTileGeoms, computeOsmProximity, OSM_BBOX_RADIUS_M } from "@/lib/logement-osm";
import { assembleSnapshot, fusionnerRafraichissement } from "@/lib/logement-autour";
import { getIcuSignal } from "@/lib/icu";
import { fetchPermisAutour } from "@/lib/server/sitadel-permis";
import { needsRecompute, SOURCES_VERSION, type AddressDossierRow } from "@/lib/address-dossier-store";
import { updateOwnedAddressDossier } from "@/lib/server/address-dossier-write";
import type { Face3Snapshot } from "@/lib/logement-autour-types";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CALCUL DU VOISINAGE, HORS DE LA ROUTE (24/09/2026).
//
// Il vivait dans le corps de /api/logement-autour, que seule la page Autour appelait, et
// seulement quand le dossier n'avait PAS encore de voisinage. Un voisinage existant n'était donc
// jamais recalculé : aucun dossier ouvert avant une amélioration n'en bénéficiait. Extrait ici pour
// que la page du dossier de décision puisse aussi le rafraîchir, sans qu'un client ait à passer
// par la page Autour.
// ════════════════════════════════════════════════════════════════════════════════════════════

// Client service-role pour le cache de tuile partagé (bypasse la RLS, écrit une donnée mutualisée
// entre utilisateurs). Jamais exposé au client.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Calcule le voisinage d'un point, de zéro.
 *
 * `attenteOsmMs` : combien attendre la cartographie avant de rendre la main. Court quand un
 * lecteur attend la page (3,5 s, le remplissage continue en tâche de fond) ; long en arrière-plan,
 * où personne n'attend et où un voisinage complet vaut mieux qu'un voisinage rapide.
 */
export async function calculerVoisinage(
  center: { lat: number; lon: number },
  insee: string,
  attenteOsmMs = 3500,
): Promise<Face3Snapshot> {
  // ICU (îlot de chaleur du quartier) : appel WFS IGN, lancé en concurrence avec OSM (silencieux
  // si non couvert / panne -> pas de bloc). Awaité au moment d'assembler.
  const icuPromise = getIcuSignal(center.lat, center.lon);

  // Les permis : deux appels réseau (cadastre + registre), lancés ici pour qu'ils courent pendant
  // la BPE et la tuile OSM. Ne lèvent jamais ; `null` laisse le champ absent, donc pas de bloc.
  const permisPromise = fetchPermisAutour(center.lat, center.lon, insee);

  // BPE : local, immédiat. Le millésime voyage avec les points : il vient des shards, jamais d'une
  // constante du code (cf. `loadBpePointsAround`).
  const { points: bpePoints, millesime: bpeMillesime } = await loadBpePointsAround(center);
  const bpe = nearestByCategory(center, bpePoints);

  // OSM : cache de cellule (service-role) ; si froid, tentative inline sous timeout.
  let osm = null;
  let osmStatus: "complete" | "pending" | "failed" = "pending";
  try {
    const tile = await Promise.race([
      getTileGeoms(admin, center),
      new Promise<{ geoms: never[]; status: "pending" }>((res) =>
        setTimeout(() => res({ geoms: [], status: "pending" }), attenteOsmMs),
      ),
    ]);
    if (tile.status === "complete") {
      osm = computeOsmProximity(center, tile.geoms, OSM_BBOX_RADIUS_M);
      osmStatus = "complete";
    } else if (tile.status === "failed") {
      osmStatus = "failed";
    } else {
      // Timeout : poursuivre le remplissage du cache après réponse (tuile chaude au retry).
      after(async () => {
        await getTileGeoms(admin, center).catch(() => {});
      });
    }
  } catch {
    osmStatus = "failed";
  }

  return assembleSnapshot(center, bpe, osm, osmStatus, await icuPromise, await permisPromise, bpeMillesime);
}

/**
 * LE VOISINAGE EST-IL D'UNE VERSION ANTÉRIEURE ? Distinct de `needsRecompute`, qui répond aussi
 * « oui » pour une cartographie en attente ou un point déplacé. Ce cas-là seul se rafraîchit en
 * silence : les deux autres sont un voisinage INACHEVÉ, que la page Autour complète sous les yeux
 * du lecteur comme avant.
 */
export function voisinagePerime(snapshot: Face3Snapshot | null): boolean {
  return snapshot != null && snapshot.sourcesVersion !== SOURCES_VERSION;
}

/**
 * RAFRAÎCHIT EN ARRIÈRE-PLAN un voisinage d'une version antérieure. L'écran affiche l'ancien ; le
 * nouveau sert à la visite suivante. Ne lève jamais : un rafraîchissement raté laisse l'ancien
 * voisinage en place, ce qui est exactement l'état d'avant.
 *
 * À appeler dans `after()`. Le travail tient en quelques secondes (BPE locale, tuile OSM le plus
 * souvent en cache), et personne n'attend : la cartographie a droit à 20 s.
 */
export async function rafraichirVoisinageSiPerime(userId: string, dossier: AddressDossierRow): Promise<void> {
  const ancien = dossier.snapshot;
  if (!ancien || !voisinagePerime(ancien)) return;
  try {
    const center = { lat: dossier.latitude, lon: dossier.longitude };
    const nouveau = await calculerVoisinage(center, dossier.insee, 20_000);
    const retenu = fusionnerRafraichissement(ancien, nouveau);
    if (!retenu) return;
    // Le point n'a pas bougé : `needsRecompute` sur le résultat ne doit plus répondre « périmé »,
    // sinon chaque ouverture relancerait le même travail.
    if (needsRecompute({ snapshot: retenu }, center, SOURCES_VERSION) && retenu.sourceStatus.osmInfrastructure !== "pending") {
      console.error("[voisinage] rafraîchi mais toujours périmé", { dossierId: dossier.id });
    }
    await updateOwnedAddressDossier(userId, dossier.id, { snapshot: retenu });
  } catch (e) {
    console.error("[voisinage] rafraîchissement échoué", { dossierId: dossier.id, message: String(e).slice(0, 160) });
  }
}
