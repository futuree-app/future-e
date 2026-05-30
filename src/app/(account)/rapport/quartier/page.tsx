import "server-only";
export const dynamic = "force-dynamic";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { QuartierWorkbook } from "@/app/(account)/compte/QuartierWorkbook";
import { canAccessCompleteReport } from "@/lib/access";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";
import { QuartierAside } from "@/components/report/QuartierClimatData";
import QuartierSynthesis, {
  type WorkbookQuartier,
} from "@/components/report/QuartierSynthesis";
import { getGeorisquesSummary } from "@/lib/georisques";
import { ModuleTracker } from "@/components/ModuleTracker";
import { deriveQuartierSources, buildFallbackSummary } from "@/lib/quartier-signals";
import { AskFutureInlineMount } from "@/components/AskFutureInlineMount";
import { SuiviWaitlistBlock } from "@/components/report/SuiviWaitlistBlock";
import { TerritoryCover } from "@/components/report/TerritoryCover";
import { deriveTerritoryMood } from "@/lib/territory-mood";

export default async function RapportQuartierPage() {
  const account = await getCurrentUserAccount();
  const { supabase, user } = await requireCurrentUser();
  const fullReport = canAccessCompleteReport(account);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("home_commune, home_insee_code, workbook_quartier")
    .eq("user_id", user.id)
    .maybeSingle();

  const communeName = profile?.home_commune ?? null;
  const inseeCode = profile?.home_insee_code ?? null;
  const initialWorkbook = normalizeWorkbook(profile?.workbook_quartier);

  const [enrichment, georisques] = await Promise.all([
    inseeCode ? gatherCommuneEnrichment(inseeCode) : null,
    inseeCode ? getGeorisquesSummary(inseeCode).catch(() => null) : null,
  ]);

  const scenarios = enrichment?.drias?.commune.s ?? null;
  const territoire = enrichment?.ademe?.commune.territoire ?? null;
  const displayName = communeName ?? "votre commune";

  // Identité visuelle du territoire (déterministe, sans appel réseau).
  const territoryMood = deriveTerritoryMood({ communeName, inseeCode, territoire });

  // Sources mobilisées par horizon : pré-calculées côté serveur, le composant
  // client choisit via useHorizon. Évite de transférer tout enrichment.
  const sourcesByHorizon = {
    gwl15: deriveQuartierSources(enrichment, georisques, "gwl15"),
    gwl20: deriveQuartierSources(enrichment, georisques, "gwl20"),
    gwl30: deriveQuartierSources(enrichment, georisques, "gwl30"),
  };

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-info/[0.10] blur-[100px] opacity-32 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-accent/[0.08] blur-[88px] opacity-24 pointer-events-none z-0" />

      <Navbar ctas={{ secondary: { href: "/rapport", label: "Mon rapport" }, primary: { href: "/dashboard", label: "Dashboard" } }} />

      <ModuleTracker moduleId="quartier" commune={communeName} inseeCode={inseeCode} source="page" />
      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">
        {!communeName && (
          <div className="pt-10">
            <CommuneSetupBanner />
          </div>
        )}

        {/* Hero */}
        <section className="pt-20 pb-6 max-w-[680px]">
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
          <p className={`text-[17px] leading-[1.72] text-muted ${fullReport ? "mb-0" : "mb-9"}`}>
            Comment le changement climatique va transformer votre commune.
          </p>
          {!fullReport && (
            <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline">
              Ouvrir le rapport interactif
            </Link>
          )}
        </section>

        {/* Couverture éditoriale — donne une identité visuelle au territoire
            avant la lecture, sans concurrencer le texte */}
        {communeName && (
          <div className="pt-1">
            <TerritoryCover mood={territoryMood} />
          </div>
        )}

        {/* Synthèse pleine largeur */}
        <section className="pt-8">
          <QuartierSynthesis
            communeName={communeName}
            inseeCode={inseeCode}
            userKey={account.userId}
            sourcesByHorizon={sourcesByHorizon}
            initialWorkbook={initialWorkbook}
            fallbackSummary={buildFallbackSummary(communeName, "votre horizon")}
          />
        </section>

        <div className="border-t border-white/[0.08] mt-10" />

        {/* Ce que montrent les données (cartes) */}
        <section className="pt-14">
          <h2
            className="font-normal italic text-[clamp(22px,2vw,28px)] leading-[1.25] tracking-[-0.3px] text-label mb-6"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Ce que montrent les données
          </h2>
          <QuartierAside communeName={displayName} scenarios={scenarios} georisques={georisques} territoire={territoire} />
        </section>

        {/* Repères de terrain */}
        <section className="pt-14">
          <QuartierWorkbook
            userKey={account.userId}
            commune={communeName}
            inseeCode={inseeCode}
            reportId={inseeCode}
          />
        </section>

        {/* Une question ? — AskFuture inline (uniquement pour comptes payants) */}
        <section className="pt-14">
          <AskFutureInlineMount
            placeholder={`Votre question sur ${displayName}…`}
            suggestions={[
              `Que signifie +4°C pour ${displayName} ?`,
              "Mon logement est-il concerné ?",
              "Quel avenir pour mes enfants ici ?",
            ]}
          />
        </section>

        {/* Porte suivante : continuité naturelle du rapport, juste après la lecture */}
        <div className="mt-14 flex justify-end">
          <Link
            href="/rapport/logement"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg no-underline font-semibold text-[14px]"
            style={{ background: "var(--orange)", color: "var(--canvas)", fontFamily: "'Instrument Sans', sans-serif" }}
          >
            Module Logement
            <span className="text-[16px] leading-none">→</span>
          </Link>
        </div>

        {/* Vision long terme : une fois la lecture terminée, rester informé */}
        <SuiviWaitlistBlock commune={communeName} inseeCode={inseeCode} moduleId="quartier" />

        {/* Sortie propre */}
        <div className="mt-14">
          <a href="/rapport" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] text-muted text-[13px] no-underline border border-white/[0.08]">
            ← Retour au rapport interactif
          </a>
        </div>
      </div>
    </div>
  );
}

function normalizeWorkbook(raw: unknown): WorkbookQuartier | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const wb: WorkbookQuartier = {
    heat: typeof r.heat === "string" ? r.heat : "",
    water: typeof r.water === "string" ? r.water : "",
    shelter: typeof r.shelter === "string" ? r.shelter : "",
    change: typeof r.change === "string" ? r.change : "",
    note: typeof r.note === "string" ? r.note : "",
  };
  const filled = [wb.heat, wb.water, wb.shelter, wb.change, wb.note.trim()].filter(Boolean).length;
  return filled > 0 ? wb : null;
}
