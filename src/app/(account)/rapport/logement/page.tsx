export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { canAccessCompleteReport } from "@/lib/access";
import LogementModule from "@/components/report/LogementModule";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT, canAnalyzeCommune } from "@/lib/active-territory";
import { getLogement, getLatestLogement, type LogementRow } from "@/lib/logement-store";
import { ModuleTracker } from "@/components/ModuleTracker";

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

  const rehydratable = Boolean(candidate?.snapshot && candidate?.city && candidate?.postcode);
  const initialRow =
    candidate && rehydratable && (await canAnalyzeCommune(supabase, user.id, candidate.insee))
      ? candidate
      : null;

  return (
    <>
      <ModuleTracker moduleId="logement" commune={territory.communeName} inseeCode={territory.inseeCode} source="page" />
      <LogementModule
        defaultCommune={territory.communeName}
        initialRow={initialRow}
        rehydrateSource={targetId ? "deeplink" : "auto"}
      />
    </>
  );
}
