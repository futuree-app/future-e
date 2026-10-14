// FUT-93 · LE BANC DE « METTRE À JOUR L'ANALYSE », AVEC LA STRUCTURE DE `/rapport`. DEV UNIQUEMENT.
//
// Comme le rapport : un repli communal (portée `commune`) dans un `Suspense`, puis la section du bien,
// rendue par un composant serveur LENT (`lent` ms, 7 s par défaut, comme mesuré en production) qui lit
// la version servie. La route du banc (`api/actualiser`) écrit réellement la version suivante.
//   vue=classique|releve   lent=ms   persiste=1 (le bandeau reste après la mise à jour)
//   statut=pending   contenu=sonde   sansSuspense=1   (bissection du diagnostic, voir le compte rendu)
//   actions=1   sous le dossier, les vrais `CriteresDuProjet` et `LienAvecCeBien` (requêtes redirigées vers
//               `api/geste` par le script de test) : le bandeau du dossier dit ce que le geste a changé
//   narration=ms   au-dessus du dossier, une conclusion « rédigée » simulée, différente de son repli et
//                  servie `ms` après lui, sous la même clé par rendu que la vraie : mesure du clignotement
// Les vrais composants de production (`DossierDecisionSection`, `AnalyseAncienProjet`, `BoutonAction`).
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";
import { ConclusionRedigee } from "@/components/report/ConclusionRedigee";
import { AnalyseAncienProjet } from "@/components/report/AnalyseAncienProjet";
import Link from "next/link";
import type { Dossier } from "@/lib/decision/decision-fact";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { dossierDeTest } from "../fut87/dossier-de-test";
import { etatBanc, versionServie } from "./etat";
import { Sonde, SondeInterne } from "./Sonde";
import { CriteresDuProjet } from "@/components/report/CriteresDuProjet";
import { LienAvecCeBien } from "@/components/report/LienAvecCeBien";
import { vueCriteres, type CritereVue } from "@/lib/decision/projet-criteres-vue";
import { jetonDeRendu } from "@/lib/rendu/jeton-de-rendu";

export const dynamic = "force-dynamic";

type Params = { actions?: string; narration?: string; vue?: string; lent?: string; persiste?: string; sansSuspense?: string; contenu?: string; statut?: string; interne?: string; repli?: string; apres?: string; sansBandeau?: string; cle?: string; apresPage?: string; lieu?: string; insee?: string; prefs?: string };
const SCOPE = "logement:banc-fut93";
const dateDeVersion = (v: number) => new Date(Date.UTC(2026, 7, 11 + v, 10)).toISOString();

// Le contenu de la frontière interne de la page minimale (bissection) : un composant asynchrone
// (`headers`, `tick`), synchrone (`sync`), `ConclusionBlock` rendu après `await headers()` (`bloc`), ou la
// vraie `ConclusionRedigee` (`redigee`).
async function ContenuAsynchrone({ mode, dossier }: { mode: string; dossier: Dossier }) {
  if (mode === "tick") await Promise.resolve();
  else await headers();
  if (mode === "bloc") return <ConclusionBlock plan={dossier.narrativePlan} blocks={planToBlocks(dossier.narrativePlan)} />;
  return <><SondeInterne jeton={etatBanc().lectures} /><p>conclusion ({mode})</p></>;
}
function ContenuInterne({ mode, dossier, insee }: { mode: string; dossier: Dossier; insee: string }) {
  if (mode === "sync") return <p>conclusion (sync)</p>;
  if (mode === "redigee") return <ConclusionRedigee plan={dossier.narrativePlan} insee={insee} scopeKey={SCOPE} />;
  return <ContenuAsynchrone mode={mode} dossier={dossier} />;
}

// La conclusion rédigée relue depuis le cache, simulée : même plan, textes plus longs, servie après le repli.
async function NarrationSimulee({ ms, dossier }: { ms: number; dossier: Dossier }) {
  await new Promise((r) => setTimeout(r, ms));
  const blocks = planToBlocks(dossier.narrativePlan).map((b) => ({ ...b, text: `${b.text} ${b.text}`, generated: true }));
  return <div data-banc="redigee"><ConclusionBlock plan={dossier.narrativePlan} blocks={blocks} /></div>;
}

// Le critère du banc : une préférence du projet de test, « inspirée de Brest » tant qu'elle n'est pas gardée.
function critereDuBanc(criteres: CritereVue[], adopte: boolean): CritereVue[] {
  const base = criteres[0];
  if (!base) return [];
  return [{ ...base, etat: adopte ? "compris" : "inspire", ancre: "Brest", adopte, motFort: null }];
}

async function SectionDuBien({ sp, presentation }: { sp: Params; presentation: "classique" | "releve" }) {
  await new Promise((r) => setTimeout(r, Number(sp.lent ?? 7000)));
  const t = await dossierDeTest(sp);
  if (!t) return null;
  const v = versionServie();
  // Bissection du diagnostic : la sonde seule, puis la section sans la mise à jour.
  const jeton = etatBanc().lectures;
  if (sp.contenu === "sonde") return <><Sonde version={v} jeton={jeton} /><p>Analyse générée le {dateDeVersion(v).slice(0, 10)}</p></>;
  // Combinaison : la section sans sa frontière (`pending`), puis une frontière minimale, avant ou après.
  if (sp.contenu === "combo" || sp.contenu === "combo-avant") {
    const frontiere = <Suspense key={sp.cle === "rendu" ? `rendu-${jeton}` : "fixe"} fallback={<p>repli</p>}><ContenuInterne mode={sp.interne ?? "headers"} dossier={t.dossier} insee={t.insee} /></Suspense>;
    return (
      <>
        <Sonde version={v} jeton={jeton} />
        {sp.contenu === "combo-avant" ? frontiere : null}
        {sp.apres === "analyse" ? <AnalyseAncienProjet insee={t.insee} scopeKey={SCOPE} versionServie={v} />
          : sp.apres === "bloc" ? <ConclusionBlock plan={t.dossier.narrativePlan} blocks={planToBlocks(t.dossier.narrativePlan)} renderedIds={[]} />
          : sp.apres === "lien" ? <Link href="/dev/fut93">lien</Link>
          : sp.apres?.startsWith("gros") ? <div>{Array.from({ length: Number(sp.apres.slice(4)) || 2000 }, (_, i) => <p key={i}>ligne {i} <span>du banc</span></p>)}</div>
          : (
            <DossierDecisionSection presentation={presentation} dossier={t.dossier} logementStatus="pending" insee={t.insee} scopeKey={SCOPE}
              generatedAt={dateDeVersion(v)} provenance={SCOPE} versionServie={v} projetAChange={sp.sansBandeau !== "1" && (v === 1 || sp.persiste === "1")} espacement="mt-6" />
          )}
        {sp.contenu === "combo" ? frontiere : null}
      </>
    );
  }
  // Page minimale : une frontière `Suspense` interne, déjà révélée, autour d'un contenu choisi.
  if (sp.contenu === "mini") return (
    <>
      <Sonde version={v} jeton={jeton} />
      <p>Analyse générée le {dateDeVersion(v).slice(0, 10)}</p>
      <Suspense fallback={sp.repli === "bloc" ? <ConclusionBlock plan={t.dossier.narrativePlan} blocks={planToBlocks(t.dossier.narrativePlan)} /> : <p>repli</p>}>
        <ContenuInterne mode={sp.interne ?? "headers"} dossier={t.dossier} insee={t.insee} />
      </Suspense>
    </>
  );
  const e = etatBanc();
  const actions = sp.actions === "1";
  return (
    <>
    <Sonde version={v} jeton={jeton} />
    {sp.narration ? (
      <Suspense key={`narration:${jetonDeRendu()}`} fallback={<div data-banc="repli"><ConclusionBlock plan={t.dossier.narrativePlan} blocks={planToBlocks(t.dossier.narrativePlan)} /></div>}>
        <NarrationSimulee ms={Number(sp.narration)} dossier={t.dossier} />
      </Suspense>
    ) : null}
    <DossierDecisionSection
      presentation={presentation} dossier={t.dossier} logementStatus={sp.statut === "pending" ? "pending" : "done"} insee={t.insee} scopeKey={SCOPE}
      generatedAt={dateDeVersion(v)} provenance={SCOPE} versionServie={v}
      projetAChange={actions ? e.critere === "adopte" : v === 1 || sp.persiste === "1"} contexteAChange={actions ? e.lien : false} espacement="mt-6"
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
        {/* La frontière EXTÉRIEURE suivie de contenu, comme sur `/rapport` (modules, liens) : `apresPage=grosN`. */}
        {sp.actions === "1" ? (
          <div id="banc-actions" className="mt-12 space-y-6">
            <div className="glass rounded-2xl p-6 md:p-7">
              <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">Votre projet</p>
              <CriteresDuProjet criteres={critereDuBanc(vueCriteres(t.projet), etatBanc().critere === "adopte")} />
            </div>
            <LienAvecCeBien dossierId="banc-fut93" adresse="Le bien du banc" relationInitiale={null} objectifInitial={null} />
          </div>
        ) : null}
        {sp.apresPage?.startsWith("gros") ? <div>{Array.from({ length: Number(sp.apresPage.slice(4)) || 500 }, (_, i) => <p key={i}>suite {i} <span>de la page</span></p>)}</div> : null}
      </div>
    </main>
  );
}
