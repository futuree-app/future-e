import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireCurrentUser } from "@/lib/user-account";
import { loadBpePointsAround, nearestByCategory } from "@/lib/logement-bpe";
import { getTileGeoms, computeOsmProximity, OSM_BBOX_RADIUS_M } from "@/lib/logement-osm";
import { assembleSnapshot } from "@/lib/logement-autour";
import { getIcuSignal } from "@/lib/icu";
import { fetchPermisAutour } from "@/lib/server/sitadel-permis";
import { buildAutourResponse } from "@/lib/server/autour-response";
import { getDossier, needsRecompute, SOURCES_VERSION } from "@/lib/address-dossier-store";
import { updateOwnedAddressDossier } from "@/lib/server/address-dossier-write";
import type { Posture } from "@/lib/logement-autour-types";

export const dynamic = "force-dynamic";

// Client service-role pour le cache de tuile partagé (bypasse la RLS, écrit une donnée
// mutualisée entre utilisateurs). Jamais exposé au client.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// L'identité de l'adresse ne vient PLUS du corps de requête : elle vit dans le dossier, écrite
// par le seul webhook (ou l'outil d'administration). Le client dit quel dossier il regarde, le
// serveur lit où il se trouve. Un client qui pouvait envoyer `insee` et `latitude` pouvait
// déplacer un dossier payé sur une autre adresse.
type Body = {
  dossierId: string;
  posture?: Posture;
};

export async function POST(req: Request) {
  const { supabase, user } = await requireCurrentUser();

  const body = (await req.json()) as Body;
  if (!body?.dossierId) {
    return Response.json({ error: "dossierId requis" }, { status: 400 });
  }

  // Le droit EST le dossier. Plus de frontière communale : un dossier accessible suffit, et rien
  // d'autre n'ouvre l'entourage d'une adresse.
  const existing = await getDossier(supabase, user.id, body.dossierId);
  if (!existing) {
    return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }

  const center = { lat: existing.latitude, lon: existing.longitude };
  const posture: Posture = body.posture === "prospection" ? "prospection" : "residence";
  // `existing.snapshot` est nullable en base (ligne écrite avant le calcul) : on l'exige
  // explicitement plutôt que de le forcer — sans lui, il n'y a rien à renvoyer, donc on recalcule.
  if (existing?.snapshot && !needsRecompute(existing, center, SOURCES_VERSION)) {
    // La posture peut avoir changé (sonde ProjectProbe) sans invalider le calcul.
    if (existing.posture !== posture) {
      await updateOwnedAddressDossier(user.id, existing.id, { posture });
    }

    // LE RATTRAPAGE DES PERMIS, UNE SEULE FOIS PAR DOSSIER.
    //
    // Le registre des autorisations est arrivé le 01/08/2026 : tous les snapshots antérieurs
    // n'ont pas le champ, et une panne de l'API pendant l'analyse le laisse absent aussi. Sans ce
    // rattrapage, ces dossiers n'auraient JAMAIS le bloc, puisque rien ne les recalcule tant que
    // `SOURCES_VERSION` ne bouge pas — et la bumper invaliderait tous les snapshots pour un
    // champ optionnel, ce qui coûterait un recalcul complet à chaque dossier existant.
    //
    // Une fois rempli, il est GELÉ comme les autres faits : la date de consultation est écrite
    // avec, et affichée. Le rattrapage ne rafraîchit donc jamais un champ déjà là.
    const snapshotFige = existing.snapshot;
    if (snapshotFige.permis === undefined) {
      const enCours = fetchPermisAutour(center.lat, center.lon, existing.insee);
      const persiste = async (permis: Awaited<typeof enCours>) => {
        if (!permis) return;
        await updateOwnedAddressDossier(user.id, existing.id, {
          snapshot: { ...snapshotFige, permis },
        }).catch(() => {});
      };
      // Le même budget que la tuile OSM : au-delà, on rend la page sans attendre, et le
      // remplissage se termine en tâche de fond pour la prochaine ouverture.
      const permis = await Promise.race([
        enCours,
        new Promise<null>((res) => setTimeout(() => res(null), 3500)),
      ]);
      if (permis) {
        await persiste(permis);
        return Response.json(
          await buildAutourResponse({
            snapshot: { ...snapshotFige, permis },
            lat: center.lat, lon: center.lon, insee: existing.insee,
          }),
        );
      }
      after(async () => { await persiste(await enCours.catch(() => null)); });
    }

    // AUCUN chemin ne renvoie le snapshot directement : tous passent par l'assembleur (cf.
    // `autour-response.ts`). C'est ce qui empêche un enrichissement de dépendre de la branche.
    return Response.json(
      await buildAutourResponse({ snapshot: existing.snapshot, lat: center.lat, lon: center.lon, insee: existing.insee }),
    );
  }

  // ICU (îlot de chaleur du quartier) : appel WFS IGN, lancé en concurrence avec OSM (silencieux
  // si non couvert / panne -> pas de bloc). Awaité au moment d'assembler.
  const icuPromise = getIcuSignal(center.lat, center.lon);

  // Les permis : deux appels réseau (cadastre + registre), lancés ici pour qu'ils courent pendant
  // la BPE et la tuile OSM. Ne lèvent jamais ; `null` laisse le champ absent, donc pas de bloc.
  const permisPromise = fetchPermisAutour(center.lat, center.lon, existing.insee);

  // BPE : local, immédiat.
  const bpe = nearestByCategory(center, await loadBpePointsAround(center));

  // OSM : cache de cellule (service-role) ; si froid, tentative inline sous timeout court.
  let osm = null;
  let osmStatus: "complete" | "pending" | "failed" = "pending";
  try {
    const tile = await Promise.race([
      getTileGeoms(admin, center),
      new Promise<{ geoms: never[]; status: "pending" }>((res) =>
        setTimeout(() => res({ geoms: [], status: "pending" }), 3500),
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

  const snapshot = assembleSnapshot(center, bpe, osm, osmStatus, await icuPromise, await permisPromise);

  // Le patch ne porte QUE ce que ce module produit. L'identité de l'adresse et la parcelle ne
  // sont plus dans la portée d'écriture : la question « ne jamais dégrader la parcelle », qui
  // occupait ce site, ne se pose plus, puisque ce module ne peut plus y toucher.
  await updateOwnedAddressDossier(user.id, existing.id, { posture, snapshot });

  return Response.json(
    await buildAutourResponse({ snapshot, lat: center.lat, lon: center.lon, insee: existing.insee }),
  );
}
