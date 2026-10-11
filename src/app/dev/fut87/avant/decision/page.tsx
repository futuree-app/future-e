// FUT-87 · LE RENDU ACTUEL DE « MA DÉCISION », POUR LA COMPARAISON AVANT / APRÈS. DEV UNIQUEMENT.
//
// Les composants de production, tels quels, avec le même dossier que le prototype : la colonne de
// verdict de `/rapport` (`DossierDecisionSection`, titre en h1, repère des échelles en colonne d'appui)
// puis la liste complète des contrôles. Mode déterministe (« pending ») : aucun appel au modèle.
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
import { EchelleNavigator } from "@/components/report/EchelleNavigator";
import { DEFAUT, projetDeTest } from "../../projet-de-test";

export const dynamic = "force-dynamic";

const TITRE_VERDICT = {
  niveau: "h1" as const,
  classe: "text-[length:clamp(23px,2.9vw,36px)] font-[var(--weight-display)] tracking-[-0.8px]",
};

export default async function AvantDecision({ searchParams }: { searchParams: Promise<{ insee?: string; prefs?: string; adresse?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const insee = (sp.insee ?? DEFAUT.insee).trim();
  const { projet } = projetDeTest(sp.prefs ?? DEFAUT.prefs);
  const resultat = await buildCommuneDossier(insee, projet, { hasAddress: sp.adresse !== "0" });
  if (!resultat) notFound();
  return (
    <>
      <Navbar />
      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24 pt-10">
        <p className="mb-6 font-mono text-[11px] text-ghost">Rendu actuel (composants de production) · même dossier que le prototype FUT-87</p>
        <DossierDecisionSection
          dossier={resultat.dossier}
          logementStatus="pending"
          insee={insee}
          scopeKey="commune"
          espacement="mt-0"
          titre={TITRE_VERDICT}
          supportingPane={<EchelleNavigator territoireHref="#" autourHref="#" logementHref="#" addressAvailable commune={resultat.dossier.narrativePlan.communeNom} inseeCode={insee} />}
        />
        <ControlesDuDossier dossier={resultat.dossier} />
      </div>
    </>
  );
}
