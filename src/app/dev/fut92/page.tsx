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
// FUT-125 · l'en-tête et le bas de page, dans les cas de la recette :
//   projet=recette|etats|sans    la carte « Votre projet » (voir `projet-recette.ts`)
//   residence=<commune>          la commune de résidence diffère du territoire lu
//   ailleurs=<n>                 nombre d'autres communes ouvertes au compte
//   biens=2                      un autre bien existe dans cette commune ; `defaut=1` : bien deviné
//   objectif=buy|rent|understand|other, lien=lives_here|studying   « Ce bien », valeurs initiales
// Les gestes de ces blocs appellent les vraies routes, qui refusent sans session : rien ne s'écrit.
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
import { projetRecette } from "./projet-recette";
import { EnTeteDossierReleve } from "@/components/report/EnTeteDossierReleve";
import autour from "@/components/report/autour-du-releve.module.css";
import { LienAvecCeBien } from "@/components/report/LienAvecCeBien";
import type { AddressObjective, AddressRelation } from "@/lib/relation-au-lieu";

export const dynamic = "force-dynamic";

const TITRE_VERDICT = {
  niveau: "h1" as const,
  classe: "text-[length:clamp(23px,2.9vw,36px)] font-[var(--weight-display)] tracking-[-0.8px]",
};

type Params = {
  insee?: string; prefs?: string; adresse?: string; confirmer?: string; lieu?: string; vue?: string; etat?: string; flux?: string; artefact?: string;
  projet?: string; residence?: string; ailleurs?: string; biens?: string; defaut?: string; objectif?: string; lien?: string;
};

const OBJECTIFS: AddressObjective[] = ["buy", "rent", "understand", "other"];
const LIENS: AddressRelation[] = ["lives_here", "studying"];

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
  // La carte projet et l'en-tête lisent le projet de la recette quand il est demandé ; le dossier reste
  // assemblé avec le projet de test (`prefs`), comme avant.
  const projet = sp.projet ? projetRecette(sp.projet) : t.projet;
  const ailleurs = Math.max(0, Math.min(Number(sp.ailleurs) || 0, 40));
  const residence = sp.residence?.trim() || null;
  const adresseBien = t.adresse?.label ?? null;
  const objectif = OBJECTIFS.find((o) => o === sp.objectif) ?? null;
  const lienBien = LIENS.find((l) => l === sp.lien) ?? null;
  const lien = (maj: Partial<Params>) => `/dev/fut92?${new URLSearchParams(Object.entries({ ...sp, prefs: sp.prefs ?? DEFAUT.prefs, ...maj }).filter((x): x is [string, string] => Boolean(x[1]))).toString()}`;

  // Les mêmes destinations que `/rapport` (`hrefModule`), avec un identifiant de dossier fictif.
  const href = (id: keyof typeof MODULE_HREF) => (avecAdresse && id !== "quartier" ? `${MODULE_HREF[id]}?dossierId=dossier-de-test` : MODULE_HREF[id]);
  const repere = () => (
    <EchelleNavigator
      territoireHref={href("quartier")} autourHref={href("autour")} logementHref={href("logement")}
      addressAvailable={avecAdresse} commune={commune} inseeCode={t.insee} className="lg:w-[280px]" presentation={vue}
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

      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24" data-theme={vue === "releve" ? "dark" : undefined}>
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

        {vue === "releve" ? (
          <EnTeteDossierReleve
            lieu={commune} bienLabel={adresseBien} choixParDefaut={sp.defaut === "1" && sp.biens === "2"} residence={residence}
            intent={projet?.intent ?? null} nbPriorites={projet?.parsed?.preferences?.length ?? null}
            projetRenseigne={Boolean(projet?.parsed?.reformulation ?? projet?.rawText)}
            contenu={contenuDuHero({ fullReport: true, project: projet, commune })}
          />
        ) : null}
        {vue !== "releve" && (residence || ailleurs > 0) ? (
          <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
            <span>Vous consultez <span className="text-label font-medium">{commune}</span></span>
            {residence ? (
              <>
                <span aria-hidden className="text-ghost">·</span>
                <span>votre résidence est {residence}</span>
                <a href="#residence" className="underline underline-offset-2 decoration-[var(--border-2)] text-accent hover:decoration-current">Y revenir</a>
              </>
            ) : null}
            {ailleurs > 0 ? (
              <>
                <span aria-hidden className="text-ghost">·</span>
                <Link href="/rapport/dossiers" className="underline underline-offset-2 decoration-[var(--border-2)] text-accent hover:decoration-current">
                  {ailleurs === 1 ? "1 autre commune vous est ouverte" : `${ailleurs} autres communes vous sont ouvertes`}
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
        {vue !== "releve" ? (
          <EnTeteDossier
            lieu={commune} bienLabel={adresseBien} bienAlternatif={sp.biens === "2"} choixParDefaut={sp.defaut === "1"}
            intent={projet?.intent ?? null} nbPriorites={projet?.parsed?.preferences?.length ?? null}
            projetRenseigne={Boolean(projet?.parsed?.reformulation ?? projet?.rawText)}
            contenu={contenuDuHero({ fullReport: true, project: projet, commune })}
          />
        ) : null}

        {flux ? (
          <Suspense fallback={<DossierDecisionSection {...commun} logementStatus="pending" scopeKey="commune" supportingPane={repere()} controles={controles} />}>
            <AdresseResolue delai={flux} {...commun} logementStatus={etatDefaut} scopeKey="logement:dossier-de-test" supportingPane={repere()} controles={controles} />
          </Suspense>
        ) : (
          <>
            <DossierDecisionSection {...commun} logementStatus={etat} scopeKey={avecAdresse ? "logement:dossier-de-test" : "commune"} supportingPane={repere()} controles={controles} />
            {avecAdresse ? null : <TrackedAddressCta commune={commune} inseeCode={t.insee} presentation={vue} />}
          </>
        )}

        <div className="border-t border-[var(--border-1)]" />
        <div id="projet" className="scroll-mt-24 mt-12">
          <ProjectSummaryCard
            presentation={vue}
            initial={projet} criteres={vueCriteres(projet)} ouvertDemblee={false}
            relation={{ insee: t.insee, commune, valeur: residence ? "considering_living" : "current_residence", source: residence ? "inferred" : "confirmed_by_user", residence }}
          />
        </div>
        {adresseBien ? (
          <div className="mt-6">
            <LienAvecCeBien key={`${objectif}-${lienBien}`} dossierId="dossier-de-test" adresse={adresseBien} relationInitiale={lienBien} objectifInitial={objectif} presentation={vue} commune={commune} />
          </div>
        ) : null}

        {vue === "releve" ? (
          <div className={`${s.releveSection} ${autour.pied} mt-12 pt-7 border-t border-[var(--border-1)]`}>
            <Link href="/compte" className={s.bouton}>Mon compte</Link>
            <Link href="/" className={s.lien}>Retour au site</Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap mt-12 pt-7 border-t border-[var(--border-1)]">
            <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]">Mon compte</Link>
            <Link href="/" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2 ml-auto">Retour au site</Link>
          </div>
        )}
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
