export const dynamic = "force-dynamic";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { canAccessCompleteReport } from "@/lib/access";
import { PRODUCT_MODULES } from "@/lib/product";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT } from "@/lib/active-territory";
import { TrackedModuleLink, TrackedUpgradeLink } from "./RapportTrackedLinks";
import HorizonBar from "@/components/report/HorizonBar";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";
import { RapportPremiereLecture } from "@/components/wizard/RapportPremiereLecture";
import { WizardAnswersSync } from "@/components/wizard/WizardAnswersSync";
import { OuVivreProjectSync } from "@/components/OuVivreProjectSync";
import { ProjectSummaryCard } from "@/components/report/ProjectSummaryCard";
import { normalizeUserProject } from "@/lib/user-project";
import { hasWizardContent, type WizardAnswers } from "@/components/wizard/types";

const MODULE_COLORS: Record<string, string> = {
  quartier: "var(--blue)",
  logement: "var(--orange)",
  metier: "var(--violet)",
  sante: "var(--green)",
  mobilite: "var(--red)",
  projets: "var(--orange)",
};

const MODULE_ICONS: Record<string, string> = {
  quartier: "🏘",
  logement: "🏠",
  metier: "💼",
  sante: "🫁",
  mobilite: "🚗",
  projets: "🗓",
};

const MODULE_BENEFIT: Record<string, string> = {
  logement: "DPE, risques par adresse, coût d'assurance, valeur à 20 ans. Ce que votre logement vaut vraiment dans ce contexte.",
  metier: "Votre secteur face aux transformations qui viennent. Ce qui se renforce, ce qui se fragilise selon l'horizon.",
  sante: "Chaleur, pollens, air, sols. Ce que cet environnement fait à votre corps aujourd'hui et selon les décennies à venir.",
  mobilite: "Voiture, transports, trajets quotidiens. Ce que ça coûte réellement de vivre ici sans remettre en cause vos habitudes.",
  projets: "Achat, installation, retraite. Ce que ce territoire va devenir et ce que ça implique pour vos décisions.",
};

export default async function RapportPage() {
  const account = await getCurrentUserAccount();
  const fullReport = canAccessCompleteReport(account);

  const { supabase, user } = await requireCurrentUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(`${TERRITORY_SELECT}, wizard_answers, user_project`)
    .eq("user_id", user.id)
    .maybeSingle();

  const territory = await resolveReadableTerritory(supabase, user.id, profile);
  const communeName = territory.communeName;
  const inseeCode = territory.inseeCode;
  const displayName = communeName ?? "votre commune";

  const allModules = PRODUCT_MODULES;
  // Première lecture du compte gratuit : réponses du wizard persistées (point 2).
  const serverWizardAnswers = (profile?.wizard_answers ?? null) as WizardAnswers | null;
  const userProject = normalizeUserProject((profile as { user_project?: unknown } | null)?.user_project ?? null);

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      {/* Orbs */}
      <div className="fixed top-[-160px] left-[-130px] w-[540px] h-[540px] rounded-full bg-accent/[0.14] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[420px] h-[420px] rounded-full bg-amethyst/[0.12] blur-[90px] opacity-28 pointer-events-none z-0" />
      <div className="fixed top-[42%] left-[58%] w-[280px] h-[280px] rounded-full bg-info/[0.08] blur-[70px] opacity-16 pointer-events-none z-0" />

      <Navbar ctas={{ secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/dashboard", label: "Dashboard" } }} />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">

        {/* Persiste les réponses du wizard (sessionStorage → profil) à la 1re
            page authentifiée, si elles ne sont pas déjà en base. */}
        <WizardAnswersSync hasServerAnswers={hasWizardContent(serverWizardAnswers)} />
        <OuVivreProjectSync hasServerProject={Boolean((profile as { user_project?: unknown } | null)?.user_project)} />

        {/* ── Votre projet : Section 1 « ce que nous avons compris », éditable ── */}
        <div className="mt-6">
          <ProjectSummaryCard initial={userProject} />
        </div>

        {/* ── Bandeau territoire refusé (activé sans rapport débloqué) ── */}
        {territory.deniedInsee && (
          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-3.5"
            style={{ borderColor: "var(--orange-tint)", background: "var(--orange-tint)" }}
          >
            <p className="text-[14px] text-label leading-snug">
              Le rapport de{" "}
              <span className="font-semibold">{territory.deniedCommune ?? "ce territoire"}</span>{" "}
              n&apos;est pas débloqué sur votre compte.
              {territory.residenceCommune ? (
                <span className="text-muted">
                  {" "}Vous consultez votre résidence {territory.residenceCommune}.
                </span>
              ) : null}
            </p>
            <Link
              href={`/territoire/${territory.deniedInsee}/debloquer${
                territory.deniedCommune
                  ? `?nom=${encodeURIComponent(territory.deniedCommune)}`
                  : ""
              }`}
              className="shrink-0 font-mono text-[11px] tracking-[0.08em] uppercase text-accent hover:text-label no-underline border border-accent/[0.3] rounded-lg px-3.5 py-2"
            >
              Débloquer ce territoire
            </Link>
          </div>
        )}

        {/* ── Bandeau territoire actif (≠ résidence) ── */}
        {!territory.isResidence && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/[0.18] bg-accent/[0.05] px-5 py-3.5">
            <p className="text-[14px] text-label leading-snug">
              Vous consultez{" "}
              <span className="font-semibold text-accent">{displayName}</span>
              {territory.residenceCommune ? (
                <span className="text-muted">
                  {" "}· votre résidence reste {territory.residenceCommune}
                </span>
              ) : null}
            </p>
            <Link
              href="/rapport/residence"
              className="shrink-0 font-mono text-[11px] tracking-[0.08em] uppercase text-muted hover:text-label no-underline border border-white/[0.12] rounded-lg px-3.5 py-2"
            >
              {territory.residenceCommune
                ? `Revenir à ${territory.residenceCommune}`
                : "Revenir à ma résidence"}
            </Link>
          </div>
        )}

        {/* ── Hero ── */}
        <section className={fullReport ? "grid grid-cols-[1fr_400px] gap-16 items-start py-20" : "py-20"}>
          <div>
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              {fullReport ? "Rapport interactif" : "Rapport interactif partiel"}
            </div>

            <>
              <h1 className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-6 text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {displayName} en 2030, 2050, 2100.<br />
                <span className="italic text-accent">Ce que ça change pour vous.</span>
              </h1>
              <p className="text-[17px] leading-[1.72] text-muted mb-9 max-w-[500px]">
                Six angles sur ce que le changement climatique fait concrètement à votre quotidien ici. Choisissez un horizon. Les données s&apos;adaptent quand c&apos;est possible.
              </p>
              <div className="flex gap-3 flex-wrap">
                {fullReport ? (
                  <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                    Voir le dashboard
                  </Link>
                ) : (
                  <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                    Ouvrir le rapport interactif
                  </Link>
                )}
                <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                  Mon compte
                </Link>
              </div>
            </>
          </div>

          {/* Panel hub des modules — payant uniquement. En gratuit, les signaux
              réels sont portés par la première lecture plus bas (pas de doublon). */}
          {fullReport && (
            <aside className="glass rounded-2xl p-7 relative overflow-hidden">
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">
                Hub des modules
              </p>
              <h2 className="font-normal text-[22px] leading-[1.2] text-label mb-5 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Rapport interactif · {displayName}
              </h2>
              <div className="flex flex-col gap-2.5">
                {allModules.map((m) => {
                  const col = MODULE_COLORS[m.id] ?? "var(--violet)";
                  const status =
                    m.id === "quartier" || m.id === "logement" ? "Accessible" : "—";
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: `${col}0a`, border: `1px solid ${col}1a` }}>
                      <span className="text-[16px]">{MODULE_ICONS[m.id]}</span>
                      <span className="text-[14px] text-label font-medium">{m.name}</span>
                      <span className="ml-auto font-mono text-[10px] tracking-[0.06em] uppercase" style={{ color: col }}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}
        </section>

        <div className="border-t border-white/[0.08]" />

        {!communeName && (
          <div className="pt-10">
            <CommuneSetupBanner />
          </div>
        )}

        <div id="horizon">
          <HorizonBar
            communeName={displayName}
            locked={!fullReport}
            inseeCode={inseeCode}
          />
        </div>

        <div className="border-t border-white/[0.08] mt-14" />

        {/* ── Vue gratuite : la première lecture post-wizard ── */}
        {!fullReport && (
          <section className="pt-14" id="quartier">
            <div className="mb-8 max-w-[640px]">
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Votre première lecture</p>
              <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Ce que vos réponses font déjà ressortir à {displayName}.
              </h2>
            </div>
            <RapportPremiereLecture serverAnswers={serverWizardAnswers} inseeCode={inseeCode} />
          </section>
        )}

        {/* ── Vue payant ── */}
        {fullReport && (
          <section className="pt-14">
            <div className="mb-8">
              <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Vos six dimensions, pour vous.
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3.5">
              {allModules.map((module, i) => {
                const col = MODULE_COLORS[module.id] ?? "var(--violet)";
                const benefit = module.id === "quartier"
                  ? `Chaleur, inondations, érosion côtière. Ce que ${displayName} devient selon l'horizon choisi, données climatiques publiques à l'appui.`
                  : MODULE_BENEFIT[module.id] ?? module.summary;
                const href =
                  module.id === "quartier"
                    ? "/rapport/quartier"
                    : module.id === "logement"
                      ? "/rapport/logement"
                      : null;
                return (
                  <article
                    key={module.id}
                    className="glass rounded-xl p-6 relative"
                    style={{ borderTop: `2px solid ${col}` }}
                  >
                    <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[17px] mb-3.5 border"
                      style={{ background: `${col}16`, borderColor: `${col}22` }}>
                      {MODULE_ICONS[module.id]}
                    </div>
                    <p className="font-mono text-[10px] tracking-[0.1em] text-ghost mb-1 uppercase">Module 0{i + 1}</p>
                    <h3 className="font-normal text-[20px] text-label mb-2.5" style={{ fontFamily: "'Instrument Serif', serif" }}>{module.name}</h3>
                    <p className="text-[13px] text-muted leading-[1.65] mb-3.5">{benefit}</p>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase" style={{ color: col }}>
                      <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                      {href ? "Accessible" : "—"}
                    </span>
                    {href ? (
                      <div className="mt-4">
                        <TrackedModuleLink href={href} moduleId={module.id} commune={displayName} inseeCode={inseeCode} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg no-underline font-mono text-[11px] tracking-[0.08em] uppercase" style={{ color: col, border: `1px solid ${col}33`, background: `${col}0d` }}>
                          Ouvrir le module
                        </TrackedModuleLink>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer nav */}
        <div className="flex items-center gap-3 flex-wrap mt-12 pt-7 border-t border-white/[0.08]">
          <TrackedUpgradeLink href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
            Ouvrir le rapport interactif
          </TrackedUpgradeLink>
          <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
            Mon compte
          </Link>
          <Link href="/" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2 ml-auto">
            Retour au site
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-[2] border-t border-white/[0.08]">
        <div className="max-w-[1100px] mx-auto px-7 py-9 flex items-center justify-between gap-6 flex-wrap">
          <div className="text-[20px] italic text-label tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
            futur<span className="text-accent not-italic">•</span>e
          </div>
          <div className="flex gap-6 flex-wrap">
            {["Manifeste", "Méthodologie", "Pages Savoir", "Contact", "Mentions légales"].map((l) => (
              <a key={l} href="#" className="font-mono text-[11px] text-ghost no-underline tracking-[0.06em] uppercase">
                {l}
              </a>
            ))}
          </div>
          <div className="font-mono text-[11px] text-ghost tracking-[0.04em]">
            Données publiques françaises · Aucune publicité
          </div>
        </div>
      </footer>
    </div>
  );
}
