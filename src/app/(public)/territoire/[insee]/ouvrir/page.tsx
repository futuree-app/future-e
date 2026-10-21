import { notFound, redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/user-account";
import { communeIdentifiee } from "@/lib/commerce/eligibilite-territoriale";
import { communeDuReferentiel, nomDuReferentiel } from "@/lib/commerce/referentiel-communes";
import { OuvertureTerritoire } from "./OuvertureTerritoire";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ouverture du rapport — futur•e", robots: { index: false, follow: false } };

export default async function OuvrirTerritoire({ params }: { params: Promise<{ insee: string }> }) {
  const territoire = communeIdentifiee((await params).insee, communeDuReferentiel, nomDuReferentiel);
  if (!territoire.ok) notFound();
  const { user } = await getCurrentSessionUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/territoire/${territoire.insee}/ouvrir`)}`);
  // Aucun paramètre de retour Stripe n'est lu ni considéré comme une preuve.
  return <OuvertureTerritoire insee={territoire.insee} commune={territoire.nom} />;
}
