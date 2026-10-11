// FUT-91 · LE BANC « MA DÉCISION » : le même dossier, les deux présentations, tous les états.
// DEV UNIQUEMENT : 404 en production.
//
// Rend les composants de PRODUCTION (`DossierDecisionSection`, `ControlesDuDossier`) avec les props que
// `/rapport` et `DossierAvecLogement` leur passent, sur un dossier réel du moteur :
//   vue=classique|releve      la présentation (défaut : releve)
//   etat=none|pending|done|unavailable   `logementStatus`
//   artefact=1                date de génération et provenance d'un artefact figé
//   projet=1 / voisinage=1    analyse répondant à un projet ou un voisinage qui a changé
//   pane=1                    la colonne d'appui (navigateur des échelles), comme sur /rapport
//   enrichi=long              une plaque supplémentaire avec un détail enrichi plus long que le repli
// Plus `insee`, `prefs`, `confirmer`, `lieu` (adresse publique) comme `/dev/dossier`.
//
// Aucun appel au modèle : lancer le serveur avec `DOSSIER_NARRATIVE=false` (la variable d'environnement
// du processus prime sur `.env.local`), ce qui rend la conclusion déterministe, comme un prefetch.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
import { EchelleNavigator } from "@/components/report/EchelleNavigator";
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";
import { releve as s, BandeauPrototype, Plaque } from "@/components/releve/primitives";
import { CAS_DECISION, DEFAUT } from "../fut87/projet-de-test";
import { dossierDeTest } from "../fut87/dossier-de-test";

export const dynamic = "force-dynamic";

const TITRE_VERDICT = {
  niveau: "h1" as const,
  classe: "text-[length:clamp(23px,2.9vw,36px)] font-[var(--weight-display)] tracking-[-0.8px]",
};

type Params = { insee?: string; prefs?: string; adresse?: string; confirmer?: string; lieu?: string; vue?: string; etat?: string; artefact?: string; projet?: string; voisinage?: string; pane?: string; enrichi?: string };

export default async function BancFut91({ searchParams }: { searchParams: Promise<Params> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const t = await dossierDeTest(sp);
  if (!t) notFound();
  const vue = sp.vue === "classique" ? "classique" : "releve";
  const etatDefaut = t.adresse ? (t.statutAdresse === "unavailable" ? "unavailable" : "done") : "none";
  const etat = (["none", "pending", "done", "unavailable"] as const).find((x) => x === sp.etat) ?? etatDefaut;
  const artefact = sp.artefact === "1";
  const lien = (maj: Partial<Params>) => `/dev/fut91?${new URLSearchParams(Object.entries({ ...sp, prefs: sp.prefs ?? DEFAUT.prefs, ...maj }).filter((x): x is [string, string] => Boolean(x[1]))).toString()}`;
  const pane = sp.pane === "1"
    ? <EchelleNavigator territoireHref="#" autourHref="#" logementHref="#" addressAvailable={Boolean(t.adresse)} commune={t.dossier.narrativePlan.communeNom} inseeCode={t.insee} />
    : undefined;
  const plan = t.dossier.narrativePlan;
  return (
    <main className={vue === "releve" ? s.releve : undefined}>
      <Navbar />
      <BandeauPrototype>
        Banc FUT-91 · {vue === "releve" ? "Le relevé" : "présentation classique"} · {t.adresse ? `dossier d'adresse (${t.adresse.label})${t.statutAdresse === "unavailable" ? ", repli communal" : ""}` : `dossier communal ${t.insee}`} · état {etat}
        {artefact ? " · artefact daté" : ""}{sp.projet === "1" ? " · projet changé" : ""}{sp.voisinage === "1" ? " · voisinage changé" : ""}
        <nav aria-label="Réglages" className={s.cas}>
          <Link href={lien({ vue: vue === "releve" ? "classique" : "releve" })}>voir en {vue === "releve" ? "classique" : "relevé"}</Link>
          {(["none", "pending", "done", "unavailable"] as const).map((e) => <Link key={e} href={lien({ etat: e })} aria-current={e === etat ? "page" : undefined}>{e}</Link>)}
          <Link href={lien({ artefact: artefact ? "" : "1" })}>{artefact ? "sans artefact" : "artefact"}</Link>
          <Link href={lien({ projet: sp.projet === "1" ? "" : "1" })}>projet changé</Link>
          <Link href={lien({ voisinage: sp.voisinage === "1" ? "" : "1" })}>voisinage changé</Link>
          <Link href={lien({ pane: sp.pane === "1" ? "" : "1" })}>colonne d&apos;appui</Link>
          <Link href={lien({ enrichi: sp.enrichi ? "" : "long" })}>texte enrichi long</Link>
        </nav>
        <nav aria-label="Cas de test" className={s.cas}>
          {CAS_DECISION.map((c) => <Link key={c.nom} href={`/dev/fut91?${c.requete}&vue=${vue}`}>{c.nom}</Link>)}
        </nav>
      </BandeauPrototype>
      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24">
        <DossierDecisionSection
          presentation={vue}
          dossier={t.dossier}
          logementStatus={etat}
          insee={t.insee}
          scopeKey={t.adresse ? "logement:dev-test" : "commune"}
          generatedAt={artefact ? "2026-09-21T10:00:00.000Z" : null}
          provenance={artefact ? "artefact-de-test" : undefined}
          projetAChange={sp.projet === "1"}
          voisinageAChange={sp.voisinage === "1"}
          espacement="mt-8"
          titre={TITRE_VERDICT}
          supportingPane={pane}
        />
        <ControlesDuDossier presentation={vue} dossier={t.dossier} provenance={artefact ? "artefact-de-test" : undefined} />
        {sp.enrichi === "long" ? (
          // UN DÉTAIL ENRICHI PLUS LONG QUE LE REPLI, sans appel au modèle : le texte du repli répété
          // trois fois, marqué comme généré. Il éprouve la plaque, il ne prétend pas être une lecture.
          <section className={vue === "releve" ? `mt-16 ${s.releveSection}` : "mt-16"} aria-label="Épreuve : détail enrichi long">
            <p className="mb-4 font-mono text-[11px] text-ghost">Épreuve de mise en page : détail enrichi trois fois plus long que le repli (texte du repli répété, aucun appel au modèle).</p>
            {(() => {
              const blocs = planToBlocks(plan).map((b) => (b.key === "verdict" ? { ...b, text: [b.text, b.text, b.text].join(" "), generated: true } : b));
              const bloc = <ConclusionBlock plan={plan} blocks={blocs} titre={TITRE_VERDICT} variante={vue} />;
              return vue === "releve" ? <Plaque etiquette="Épreuve">{bloc}</Plaque> : bloc;
            })()}
          </section>
        ) : null}
      </div>
    </main>
  );
}
