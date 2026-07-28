export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { canAccessCompleteReport } from "@/lib/access";
import AutourModule from "@/components/report/AutourModule";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT, canAnalyzeCommune } from "@/lib/active-territory";
import { getLogement, getLatestLogement, type LogementRow } from "@/lib/logement-store";
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
  searchParams: Promise<{ logementId?: string }>;
}) {
  const account = await getCurrentUserAccount();

  if (!canAccessCompleteReport(account)) {
    redirect("/rapport");
  }

  const { supabase, user } = await requireCurrentUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(TERRITORY_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  const territory = await resolveReadableTerritory(supabase, user.id, profile);

  // Rehydratation : rouvrir une adresse déjà analysée sans la retaper. `?logementId=<banId>` vise
  // une adresse précise ; sinon la dernière touchée. On ne restaure que si la commune est ENCORE
  // lisible (même règle de droit que l'analyse elle-même, étape 4.5) : un accès retiré ne doit
  // pas continuer d'afficher les données via un artefact en cache.
  const { logementId } = await searchParams;
  const targetId = typeof logementId === "string" && logementId ? logementId : null;
  const candidate: LogementRow | null = targetId
    ? await getLogement(supabase, user.id, targetId)
    : await getLatestLogement(supabase, user.id);

  const initialRow =
    candidate?.snapshot && (await canAnalyzeCommune(supabase, user.id, candidate.insee))
      ? candidate
      : null;

  // L'ÉQUIPEMENT AUTOMOBILE N'EST PAS DANS LE SNAPSHOT, et c'est voulu : il vient d'un artefact
  // versionné (INSEE RP) régénéré à chaque millésime, que figer ferait cohabiter des dossiers
  // annonçant des millésimes différents sans le dire. La rehydratation doit donc le RELIRE, sinon
  // toute adresse déjà analysée rouvre sans lui.
  const initialCarOwnership =
    initialRow?.snapshot
      ? (
          await buildAutourResponse({
            snapshot: initialRow.snapshot,
            lat: initialRow.latitude,
            lon: initialRow.longitude,
            insee: initialRow.insee,
          })
        ).carOwnership
      : null;

  return (
    <>
      <ModuleTracker moduleId="autour" commune={territory.communeName} inseeCode={territory.inseeCode} source="page" />
      <AutourModule
        defaultCommune={territory.communeName}
        initialRow={initialRow}
        initialCarOwnership={initialCarOwnership}
      />
    </>
  );
}
