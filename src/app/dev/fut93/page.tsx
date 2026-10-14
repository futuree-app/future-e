// FUT-93 · LE BANC DE « METTRE À JOUR L'ANALYSE », AVEC LA STRUCTURE DE `/rapport`. DEV UNIQUEMENT.
//
// Comme le rapport : un repli communal (portée `commune`) dans un `Suspense`, puis la section du bien,
// rendue par un composant serveur LENT (`lent` ms, 7 s par défaut, comme mesuré en production) qui lit
// la version servie. La route du banc (`api/actualiser`) écrit réellement la version suivante.
//   vue=classique|releve   lent=ms   persiste=1 (le bandeau reste après la mise à jour)
//   statut=pending   contenu=sonde   sansSuspense=1   (bissection du diagnostic, voir le compte rendu)
// Les vrais composants de production (`DossierDecisionSection`, `AnalyseAncienProjet`, `BoutonAction`).
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { dossierDeTest } from "../fut87/dossier-de-test";
import { versionServie } from "./etat";
import { Sonde } from "./Sonde";

export const dynamic = "force-dynamic";

type Params = { vue?: string; lent?: string; persiste?: string; sansSuspense?: string; contenu?: string; statut?: string; lieu?: string; insee?: string; prefs?: string };
const SCOPE = "logement:banc-fut93";
const dateDeVersion = (v: number) => new Date(Date.UTC(2026, 7, 11 + v, 10)).toISOString();

async function SectionDuBien({ sp, presentation }: { sp: Params; presentation: "classique" | "releve" }) {
  await new Promise((r) => setTimeout(r, Number(sp.lent ?? 7000)));
  const t = await dossierDeTest(sp);
  if (!t) return null;
  const v = versionServie();
  // Bissection du diagnostic : la sonde seule, puis la section sans la mise à jour.
  if (sp.contenu === "sonde") return <><Sonde version={v} /><p>Analyse générée le {dateDeVersion(v).slice(0, 10)}</p></>;
  return (
    <>
    <Sonde version={v} />
    <DossierDecisionSection
      presentation={presentation} dossier={t.dossier} logementStatus={sp.statut === "pending" ? "pending" : "done"} insee={t.insee} scopeKey={SCOPE}
      generatedAt={dateDeVersion(v)} provenance={SCOPE} versionServie={v}
      projetAChange={v === 1 || sp.persiste === "1"} espacement="mt-6"
    />
    </>
  );
}

export default async function BancFut93({ searchParams }: { searchParams: Promise<Params> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const t = await dossierDeTest(sp);
  if (!t) notFound();
  const vue = sp.vue === "classique" ? "classique" : "releve";
  return (
    <main className={vue === "releve" ? s.releve : undefined}>
      <Navbar />
      <BandeauPrototype>
        Banc FUT-93 · {vue === "releve" ? "Le relevé" : "présentation classique"} · section du bien servie en {Number(sp.lent ?? 7000) / 1000} s
      </BandeauPrototype>
      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24">
        {sp.sansSuspense === "1" ? <SectionDuBien sp={sp} presentation={vue} /> : <Suspense
          fallback={(
            <DossierDecisionSection
              presentation={vue} dossier={t.dossier} logementStatus="pending" insee={t.insee} scopeKey="commune"
              generatedAt="2026-08-11T10:00:00.000Z" versionServie={1} projetAChange espacement="mt-6"
            />
          )}
        >
          <SectionDuBien sp={sp} presentation={vue} />
        </Suspense>}
      </div>
    </main>
  );
}
