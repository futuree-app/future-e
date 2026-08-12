export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AutourModule from "@/components/report/AutourModule";
import { requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT } from "@/lib/active-territory";
import { getDossier, getSoleDossier } from "@/lib/address-dossier-store";
import { MarquerBienActif } from "@/components/report/MarquerBienActif";
import { ModuleTracker } from "@/components/ModuleTracker";
import { buildAutourResponse } from "@/lib/server/autour-response";

// Module 02 — Autour de l'adresse. Même gabarit de page que /rapport/logement, et pour cause :
// les deux modules lisent la MÊME ligne `logement` (clé user + identifiant BAN). Une adresse
// analysée ici se rouvre là-bas, et réciproquement. La différence tient à ce qu'on rehydrate :
// ici il suffit d'un SNAPSHOT (l'entourage du point) ; là-bas il faut en plus un choix DPE
// terminal, parce qu'un module Logement rouvert au milieu d'une sélection de diagnostic serait
// un écran cassé. Ce module n'a pas de DPE, donc pas cette contrainte.
export default async function RapportAutourPage({
  searchParams,
}: {
  searchParams: Promise<{ dossierId?: string }>;
}) {
  const { supabase, user } = await requireCurrentUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(TERRITORY_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  const territory = await resolveReadableTerritory(supabase, user.id, profile);

  // LE DROIT EST LA LIGNE, comme sur /rapport/logement : les deux modules lisent le MÊME dossier.
  // Une adresse ouverte ici se rouvre là-bas, et réciproquement.
  const { dossierId } = await searchParams;
  const targetId = typeof dossierId === "string" && dossierId ? dossierId : null;
  const dossier = targetId ? await getDossier(supabase, user.id, targetId) : null;

  if (targetId && !dossier) redirect("/rapport");

  // Repli par `ouvrir`, comme sur /rapport/logement : ce chemin pose aussi le territoire de lecture.
  if (!dossier) {
    const sole = await getSoleDossier(supabase, user.id);
    redirect(
      sole
        ? `/rapport/dossiers/ouvrir?id=${encodeURIComponent(sole.id)}&vers=autour`
        : "/rapport/dossiers",
    );
  }

  // L'ÉQUIPEMENT AUTOMOBILE N'EST PAS DANS LE SNAPSHOT, et c'est voulu : il vient d'un artefact
  // versionné (INSEE RP) régénéré à chaque millésime, que figer ferait cohabiter des dossiers
  // annonçant des millésimes différents sans le dire. La rehydratation doit donc le RELIRE, sinon
  // toute adresse déjà analysée rouvre sans lui.
  const initialCarOwnership =
    dossier.snapshot
      ? (
          await buildAutourResponse({
            snapshot: dossier.snapshot,
            lat: dossier.latitude,
            lon: dossier.longitude,
            insee: dossier.insee,
          })
        ).carOwnership
      : null;

  return (
    <>
      <ModuleTracker moduleId="autour" commune={territory.communeName} inseeCode={territory.inseeCode} source="page" />
      {/* LE CONTEXTE DE LECTURE SUIT CE QUI EST VRAIMENT OUVERT. Monté, ce composant prouve que la
          page est à l'écran : il pose alors le bien ET son territoire, d'un seul geste. L'écriture
          vivait dans `after()`, qui s'exécute aussi sur un préchargement ou une navigation
          abandonnée. */}
      <MarquerBienActif dossierId={dossier.id} />
      <AutourModule
        defaultCommune={territory.communeName}
        dossier={dossier}
        initialCarOwnership={initialCarOwnership}
      />
    </>
  );
}
