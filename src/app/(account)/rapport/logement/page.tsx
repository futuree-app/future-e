export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import { requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT } from "@/lib/active-territory";
import { getDossier, getSoleDossier, listDossiers } from "@/lib/address-dossier-store";
import { choisirDossierActif } from "@/lib/dossier-actif";
import { MarquerBienActif } from "@/components/report/MarquerBienActif";
import { communeParent } from "@/lib/plm";
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

  // AUCUN DOSSIER VISÉ : ON REPREND CELUI QUE LE LECTEUR LISAIT (revue du 11/08/2026).
  //
  // Le repli ne connaissait que le cas du dossier UNIQUE, et renvoyait au sélecteur au-delà. Depuis
  // que le compte retient un bien actif, redemander « lequel ? » à quelqu'un qui vient d'en lire un
  // est une question dont on a la réponse. Le sélecteur reste la fin du chemin, pas son début.
  //
  // Le repli passe par `ouvrir` plutôt que par l'URL directe : c'est le seul chemin qui pose aussi
  // le territoire de lecture sur la commune du dossier. Sans ça, entrer par une URL nue ouvrait le
  // bien à Nantes en laissant la commune sur la résidence.
  if (!dossier) {
    // LE REPLI RESPECTE LA COMMUNE LUE (revue du 11/08/2026). Une première version reprenait le bien
    // actif sans la vérifier : après « Revenir à ma résidence » sur La Rochelle, le lien générique
    // rouvrait le dernier bien nantais, et l'écran retombait dans la contradiction qu'on venait de
    // fermer. `choisirDossierActif` fait déjà cet arbitrage, c'est celui du hub : on le réutilise
    // plutôt que d'en écrire un second, qui divergerait.
    const { data: profilActif } = await supabase
      .from("user_profiles")
      .select("active_dossier_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const actifId = (profilActif as { active_dossier_id?: string | null } | null)?.active_dossier_id ?? null;
    const choix = choisirDossierActif(
      await listDossiers(supabase, user.id), territory.inseeCode, actifId,
    );
    // Aucun bien dans la commune lue : le dossier UNIQUE du compte reste un repli légitime, parce
    // qu'il n'y a rien à deviner. Le passage par `ouvrir` bascule alors tout l'écran sur SA commune,
    // donc sans contradiction possible. Au-delà, on demande.
    const repli = choix.dossier ?? (await getSoleDossier(supabase, user.id));
    redirect(
      repli
        ? `/rapport/dossiers/ouvrir?id=${encodeURIComponent(repli.id)}&vers=logement`
        : "/rapport/dossiers",
    );
  }

  // Rehydratation : city + postcode sont exigés par `validateSelectedBanAddress` pour le re-fetch
  // Géorisques. Sans eux, le module n'a rien à charger. Le choix DPE, lui, peut rester `pending` :
  // un dossier fraîchement créé n'a pas encore de diagnostic attribué, et il doit pouvoir s'ouvrir.
  const loadable = Boolean(dossier.city && dossier.postcode);

  // LE CONTEXTE AFFICHÉ VIENT DU DOSSIER, PAS DU PROFIL (revue du 11/08/2026). Le profil porte le
  // dernier bien PERSISTÉ : sur une ouverture directe, les traceurs enregistraient l'ancienne
  // commune et l'écran annonçait un autre territoire que celui de la page. Le dossier est la source
  // de ce qu'on montre ; le profil ne sert qu'à retenir, pour les navigations futures.
  const contexte = {
    inseeCode: communeParent(dossier.insee),
    communeName: dossier.city ?? territory.communeName,
  };

  return (
    <>
      <ModuleTracker moduleId="logement" commune={contexte.communeName} inseeCode={contexte.inseeCode} source="page" />
      {/* LE CONTEXTE DE LECTURE SUIT CE QUI EST VRAIMENT OUVERT. Monté, ce composant prouve que la
          page est à l'écran : il pose alors le bien ET son territoire, d'un seul geste. L'écriture
          vivait dans `after()`, qui s'exécute aussi sur un préchargement ou une navigation
          abandonnée. */}
      <MarquerBienActif dossierId={dossier.id} />
      <LogementModule
        defaultCommune={contexte.communeName}
        dossier={loadable ? dossier : null}
        rehydrateSource={targetId ? "deeplink" : "auto"}
      />
    </>
  );
}
