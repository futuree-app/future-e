export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { canAccessCompleteReport } from "@/lib/access";
import LogementModule from "@/components/report/LogementModule";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT, canAnalyzeCommune } from "@/lib/active-territory";
import { getLogement, getLatestLogement, type LogementRow } from "@/lib/logement-store";
import { ModuleTracker } from "@/components/ModuleTracker";
import { buildAutourResponse } from "@/lib/server/autour-response";

export default async function RapportLogementPage({
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

  // Rehydratation (spec 2026-07-07) : rouvrir un logement sauvegardé sans re-saisir l'adresse.
  // `?logementId=<banId>` = bien précis ; sinon le dernier analysé. On ne rehydrate QUE si la
  // ligne est rehydratable (snapshot + city/postcode pour le re-fetch Géorisques) ET si la
  // commune est encore lisible (même règle de droit que 4.5). Sinon : état de saisie normal.
  const { logementId } = await searchParams;
  const targetId = typeof logementId === "string" && logementId ? logementId : null;
  const candidate: LogementRow | null = targetId
    ? await getLogement(supabase, user.id, targetId)
    : await getLatestLogement(supabase, user.id);

  // On ne restaure qu'un artefact COMPLET : snapshot autour + city/postcode (pour le re-fetch) ET
  // un choix DPE TERMINAL. Une analyse abandonnée en cours de sélection DPE (`pending`) n'est pas
  // un artefact : la restaurer remettrait l'utilisateur dans un écran de sélection cassé. Elle
  // retombe donc sur la saisie normale.
  const rehydratable = Boolean(
    candidate?.snapshot &&
      candidate?.city &&
      candidate?.postcode &&
      candidate?.dpe_selection_status &&
      candidate.dpe_selection_status !== "pending",
  );
  const initialRow =
    candidate && rehydratable && (await canAnalyzeCommune(supabase, user.id, candidate.insee))
      ? candidate
      : null;

  // L'ÉQUIPEMENT AUTOMOBILE N'EST PAS DANS LE SNAPSHOT, et c'est voulu : il vient d'un artefact
  // versionné (INSEE RP) régénéré à chaque millésime, que figer ferait cohabiter des dossiers
  // annonçant des millésimes différents sans le dire. Conséquence : la REHYDRATATION doit le
  // recalculer, sinon toute adresse déjà analysée rouvre sans lui — le défaut constaté le 28/07 sur
  // « 1 rue Saint-Dominique, La Rochelle ». Ici plutôt que côté client : la page est déjà un Server
  // Component, la lecture est locale, et ça évite une route et un aller-retour de plus.
  const initialCarOwnership =
    initialRow && initialRow.snapshot
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
      <ModuleTracker moduleId="logement" commune={territory.communeName} inseeCode={territory.inseeCode} source="page" />
      <LogementModule
        defaultCommune={territory.communeName}
        initialRow={initialRow}
        initialCarOwnership={initialCarOwnership}
        rehydrateSource={targetId ? "deeplink" : "auto"}
      />
    </>
  );
}
