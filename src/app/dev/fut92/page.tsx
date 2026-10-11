// FUT-92 · LE BANC DU DÉFILEMENT : le GABARIT de `/rapport` autour des composants de production.
// DEV UNIQUEMENT : 404 en production.
//
// `/rapport` exige une session et un dossier acheté. Ce banc reprend sa structure à l'identique, de la
// racine au pied de page, pour éprouver ce qui dépend du gabarit et non du dossier : la racine
// (`overflow-hidden` en classique, `overflow-clip` dès `lg` avec le relevé), la navigation principale collante,
// l'en-tête du dossier, le `Suspense` de l'analyse d'adresse, la carte projet et les pieds de page
// qui suivent. Le dossier est un vrai dossier du moteur (`dossierDeTest`), sans compte ni écriture.
//
//   vue=classique|releve     la présentation (défaut : releve)
//   etat=none|pending|done|unavailable   `logementStatus` rendu directement (sans streaming)
//   flux=<ms>                le chemin d'adresse de `/rapport` : repli `pending` sous `Suspense`, puis
//                            le dossier d'adresse après ce délai (lecture Adresse qui se résout)
//   artefact=1               date et provenance d'un artefact figé
// Plus `insee`, `prefs`, `confirmer`, `lieu` (adresse d'un bâtiment public) comme `/dev/fut91`.
//
// Aucun appel au modèle : lancer le serveur avec `DOSSIER_NARRATIVE=false`.
import Link from "next/link";
import { Suspense, type ComponentProps } from "react";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
import { EchelleNavigator } from "@/components/report/EchelleNavigator";
import { EnTeteDossier } from "@/components/report/EnTeteDossier";
import { ProjectSummaryCard } from "@/components/report/ProjectSummaryCard";
import { TrackedAddressCta } from "@/app/(account)/rapport/RapportTrackedLinks";
import { contenuDuHero } from "@/lib/decision/premier-ecran";
import { vueCriteres } from "@/lib/decision/projet-criteres-vue";
import { MODULE_HREF } from "@/lib/product";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { CAS_DECISION, DEFAUT } from "../fut87/projet-de-test";
import { dossierDeTest } from "../fut87/dossier-de-test";

export const dynamic = "force-dynamic";

const TITRE_VERDICT = {
  niveau: "h1" as const,
  classe: "text-[length:clamp(23px,2.9vw,36px)] font-[var(--weight-display)] tracking-[-0.8px]",
};

type Params = { insee?: string; prefs?: string; adresse?: string; confirmer?: string; lieu?: string; vue?: string; etat?: string; flux?: string; artefact?: string };

/** La lecture d'adresse qui se résout après un délai, comme `DossierAvecLogement` sous le `Suspense`. */
async function AdresseResolue({ delai, ...props }: ComponentProps<typeof DossierDecisionSection> & { delai: number }) {
  await new Promise((r) => setTimeout(r, delai));
  return <DossierDecisionSection {...props} />;
}

export default async function BancFut92({ searchParams }: { searchParams: Promise<Params> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const t = await dossierDeTest(sp);
  if (!t) notFound();
  const vue = sp.vue === "classique" ? "classique" : "releve";
  const avecAdresse = Boolean(t.adresse);
  const etatDefaut = avecAdresse ? (t.statutAdresse === "unavailable" ? "unavailable" : "done") : "none";
  const etat = (["none", "pending", "done", "unavailable"] as const).find((x) => x === sp.etat) ?? etatDefaut;
  const flux = avecAdresse && sp.flux ? Math.min(Number(sp.flux) || 0, 20000) : 0;
  const artefact = sp.artefact === "1";
  const provenance = artefact ? "artefact-de-test" : undefined;
  const commune = t.dossier.narrativePlan.communeNom;
  const lien = (maj: Partial<Params>) => `/dev/fut92?${new URLSearchParams(Object.entries({ ...sp, prefs: sp.prefs ?? DEFAUT.prefs, ...maj }).filter((x): x is [string, string] => Boolean(x[1]))).toString()}`;

  // Les mêmes destinations que `/rapport` (`hrefModule`), avec un identifiant de dossier fictif.
  const href = (id: keyof typeof MODULE_HREF) => (avecAdresse && id !== "quartier" ? `${MODULE_HREF[id]}?dossierId=dossier-de-test` : MODULE_HREF[id]);
  const repere = () => (
    <EchelleNavigator
      territoireHref={href("quartier")} autourHref={href("autour")} logementHref={href("logement")}
      addressAvailable={avecAdresse} commune={commune} inseeCode={t.insee} className="lg:w-[280px]"
    />
  );
  const commun = {
    presentation: vue, dossier: t.dossier, insee: t.insee, generatedAt: artefact ? "2026-09-21T10:00:00.000Z" : null,
    provenance, espacement: "mt-6", titre: TITRE_VERDICT,
  } as const;
  const controles = <ControlesDuDossier presentation={vue} dossier={t.dossier} provenance={provenance} />;

  return (
    <div className={`min-h-screen bg-canvas text-label relative ${vue === "releve" ? "overflow-hidden lg:overflow-clip" : "overflow-hidden"}`} style={{ fontFamily: "var(--font-sans)" }}>
      <div className="fixed top-[-160px] left-[-130px] w-[540px] h-[540px] rounded-full bg-accent/[0.14] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[420px] h-[420px] rounded-full bg-amethyst/[0.12] blur-[90px] opacity-28 pointer-events-none z-0" />
      <Navbar ctas={{ secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/dossier", label: "Analyser une adresse" } }} />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24">
        <BandeauPrototype>
          Banc FUT-92 · gabarit de /rapport · {vue === "releve" ? "Le relevé" : "présentation classique"} ·{" "}
          {avecAdresse ? `dossier d'adresse${t.statutAdresse === "unavailable" ? " (repli communal)" : ""}` : `dossier communal ${t.insee}`}
          {flux ? ` · lecture d'adresse résolue après ${flux} ms` : ` · état ${etat}`}
          <nav aria-label="Réglages" className={s.cas}>
            <Link href={lien({ vue: vue === "releve" ? "classique" : "releve" })}>voir en {vue === "releve" ? "classique" : "relevé"}</Link>
            {(["none", "pending", "done", "unavailable"] as const).map((e) => <Link key={e} href={lien({ etat: e, flux: "" })} aria-current={!flux && e === etat ? "page" : undefined}>{e}</Link>)}
            {avecAdresse ? <Link href={lien({ flux: flux ? "" : "4000", etat: "" })}>{flux ? "sans streaming" : "streaming 4 s"}</Link> : null}
            <Link href={lien({ artefact: artefact ? "" : "1" })}>{artefact ? "sans artefact" : "artefact"}</Link>
          </nav>
          <nav aria-label="Cas de test" className={s.cas}>
            {CAS_DECISION.map((c) => <Link key={c.nom} href={`/dev/fut92?${c.requete}&vue=${vue}`}>{c.nom}</Link>)}
          </nav>
        </BandeauPrototype>

        <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
          <span>Vous consultez <span className="text-label font-medium">{commune}</span></span>
        </p>
        <EnTeteDossier
          lieu={commune} bienLabel={t.adresse ? "Adresse de test (bâtiment public)" : null} bienAlternatif={false} choixParDefaut={false}
          intent={t.projet.intent ?? null} nbPriorites={t.projet.parsed?.preferences?.length ?? null} projetRenseigne
          contenu={contenuDuHero({ fullReport: true, project: t.projet, commune })}
        />

        {flux ? (
          <Suspense fallback={<DossierDecisionSection {...commun} logementStatus="pending" scopeKey="commune" supportingPane={repere()} controles={controles} />}>
            <AdresseResolue delai={flux} {...commun} logementStatus={etatDefaut} scopeKey="logement:dossier-de-test" supportingPane={repere()} controles={controles} />
          </Suspense>
        ) : (
          <>
            <DossierDecisionSection {...commun} logementStatus={etat} scopeKey={avecAdresse ? "logement:dossier-de-test" : "commune"} supportingPane={repere()} controles={controles} />
            {avecAdresse ? null : <TrackedAddressCta commune={commune} inseeCode={t.insee} />}
          </>
        )}

        <div className="border-t border-[var(--border-1)]" />
        <div id="projet" className="scroll-mt-24 mt-12">
          <ProjectSummaryCard initial={t.projet} criteres={vueCriteres(t.projet)} ouvertDemblee={false} relation={null} />
        </div>

        <div className="flex items-center gap-3 flex-wrap mt-12 pt-7 border-t border-[var(--border-1)]">
          <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]">Mon compte</Link>
          <Link href="/" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2 ml-auto">Retour au site</Link>
        </div>
      </div>

      <footer className="relative z-[2] border-t border-[var(--border-1)]">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-9 flex items-center justify-between gap-6 flex-wrap">
          <div className="text-label"><Logo height={24} /></div>
          <div className="font-mono text-[11px] text-ghost tracking-[0.04em]">Données publiques françaises · Aucune publicité</div>
        </div>
      </footer>
    </div>
  );
}
