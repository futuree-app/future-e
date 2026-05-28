import "server-only";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { AccountNav } from "@/components/AccountNav";
import { QuartierWorkbook } from "@/app/(account)/compte/QuartierWorkbook";
import { canAccessCompleteReport } from "@/lib/access";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";
import { QuartierAside, QuartierDataBody, QuartierSectionTitle } from "@/components/report/QuartierClimatData";
import { getGeorisquesSummary, type GeorisquesSummary } from "@/lib/georisques";
import { ModuleTracker } from "@/components/ModuleTracker";

export default async function RapportQuartierPage() {
  const account = await getCurrentUserAccount();
  const { supabase, user } = await requireCurrentUser();
  const fullReport = canAccessCompleteReport(account);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("home_commune, home_insee_code")
    .eq("user_id", user.id)
    .maybeSingle();

  const communeName = profile?.home_commune ?? null;
  const inseeCode = profile?.home_insee_code ?? null;

  const [enrichment, georisques] = await Promise.all([
    inseeCode ? gatherCommuneEnrichment(inseeCode) : null,
    inseeCode ? getGeorisquesSummary(inseeCode).catch(() => null) : null,
  ]);

  const scenarios = enrichment?.drias?.commune.s ?? null;
  const pm25 = enrichment?.ademe?.commune.qualite_air.pm25 ?? null;
  const displayName = communeName ?? "votre commune";

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-info/[0.10] blur-[100px] opacity-32 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-accent/[0.08] blur-[88px] opacity-24 pointer-events-none z-0" />

      <AccountNav
        secondaryCta={{ href: "/rapport", label: "Mon rapport" }}
        primaryCta={{ href: "/dashboard", label: "Dashboard" }}
      />

      <ModuleTracker moduleId="quartier" commune={communeName} inseeCode={inseeCode} source="page" />
      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">
        {!communeName && (
          <div className="pt-10">
            <CommuneSetupBanner />
          </div>
        )}

        <section className="py-20 max-w-[680px]">
          <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-info mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
            Module 01 · Quartier
          </div>
          <h1
            className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-4 text-label"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Ce que {displayName} devient.<br />
            <span className="italic text-info">Canicule, inondation, feux.</span>
          </h1>
          <p className="text-[17px] leading-[1.72] text-muted mb-9">
            Comment le changement climatique va transformer votre commune.
          </p>
          {!fullReport && (
            <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline">
              Ouvrir le rapport complet
            </Link>
          )}
        </section>

        <QuartierAside communeName={displayName} scenarios={scenarios} pm25={pm25} georisques={georisques} />

        <div className="flex gap-3 flex-wrap mt-6">
          <a href="/rapport" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] text-muted text-[13px] no-underline border border-white/[0.08]">
            ← Retour au rapport
          </a>
          <a href="/rapport#horizon" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] text-muted text-[13px] no-underline border border-white/[0.08]">
            Changer l&apos;horizon temporel
          </a>
        </div>

        <div className="border-t border-white/[0.08] mt-14" />

        <section className="pt-14">
          <div className="mb-8">
            <QuartierSectionTitle communeName={displayName} scenarios={scenarios} georisques={georisques} />
          </div>

          <div className="grid grid-cols-[1fr_320px] gap-6 mb-8">
            <QuartierDataBody communeName={displayName} scenarios={scenarios} pm25={pm25} georisques={georisques} />

            <div className="flex flex-col gap-3.5">
              {!fullReport && (
                <div className="glass rounded-xl p-5" style={{ borderLeft: "2px solid var(--orange)" }}>
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Ce que le rapport complet ajoute</p>
                  <p className="text-[14px] leading-[1.65] text-muted mb-4">
                    Le module Quartier donne la lecture du lieu. Le rapport complet la croise ensuite avec votre logement, votre profil et vos autres dimensions de vie.
                  </p>
                  <Link href="/#pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[13px] no-underline">
                    Voir les formules
                  </Link>
                </div>
              )}

              <div className="glass rounded-xl p-5" style={{ borderLeft: "2px solid var(--blue)" }}>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Pages Savoir associées</p>
                <div className="flex flex-col gap-2">
                  <Link href="/savoir/submersion-cotiere" className="flex items-center gap-1.5 text-[13px] text-info no-underline">
                    <span className="opacity-60">→</span>
                    La submersion côtière
                  </Link>
                  <span className="flex items-center gap-1.5 text-[13px] text-ghost opacity-40 cursor-default">
                    <span className="opacity-60">→</span>
                    Les vagues de chaleur urbaines <span className="font-mono text-[10px] ml-1">(à venir)</span>
                  </span>
                </div>
              </div>

              <Link
                href="/rapport/logement"
                className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-xl no-underline font-semibold text-[14px]"
                style={{ background: "var(--orange)", color: "var(--canvas)", fontFamily: "'Instrument Sans', sans-serif" }}
              >
                Module Logement
                <span className="text-[16px] leading-none">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="pt-4">
          <QuartierWorkbook userKey={account.userId} />
        </section>
      </div>
    </div>
  );
}
