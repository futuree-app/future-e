export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import { requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT } from "@/lib/active-territory";
import { getDossier, getSoleDossier } from "@/lib/address-dossier-store";
import { ModuleTracker } from "@/components/ModuleTracker";

export default async function RapportLogementPage({
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

  // LE DROIT EST LA LIGNE. Le verrou n'est plus un flag de plan global doublé d'une commune : il
  // n'y a pas de module sans dossier accessible, et c'est tout.
  const { dossierId } = await searchParams;
  const targetId = typeof dossierId === "string" && dossierId ? dossierId : null;
  const dossier = targetId ? await getDossier(supabase, user.id, targetId) : null;

  if (targetId && !dossier) redirect("/rapport");

  // Aucun dossier visé : le repli ne s'applique QU'À un dossier unique. Au-delà, on ne devine pas
  // lequel (deux appartements d'un même immeuble sont deux dossiers légitimes), on demande.
  // Le repli passe par `ouvrir` plutôt que par l'URL directe : c'est le seul chemin qui pose aussi
  // le territoire de lecture sur la commune du dossier. Sans ça, entrer par `/rapport/logement` nu
  // ouvrait le bien à Nantes en laissant la commune sur la résidence.
  if (!dossier) {
    const sole = await getSoleDossier(supabase, user.id);
    redirect(
      sole
        ? `/rapport/dossiers/ouvrir?id=${encodeURIComponent(sole.id)}&vers=logement`
        : "/rapport/dossiers",
    );
  }

  // Rehydratation : city + postcode sont exigés par `validateSelectedBanAddress` pour le re-fetch
  // Géorisques. Sans eux, le module n'a rien à charger. Le choix DPE, lui, peut rester `pending` :
  // un dossier fraîchement créé n'a pas encore de diagnostic attribué, et il doit pouvoir s'ouvrir.
  const loadable = Boolean(dossier.city && dossier.postcode);

  return (
    <>
      <ModuleTracker moduleId="logement" commune={territory.communeName} inseeCode={territory.inseeCode} source="page" />
      <LogementModule
        defaultCommune={territory.communeName}
        dossier={loadable ? dossier : null}
        rehydrateSource={targetId ? "deeplink" : "auto"}
      />
    </>
  );
}
