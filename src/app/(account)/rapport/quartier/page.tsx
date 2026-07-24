import "server-only";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { canAccessCompleteReport } from "@/lib/access";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";
import { QuartierAside } from "@/components/report/QuartierClimatData";
import { EvidenceArrival } from "@/components/report/EvidenceArrival";
import QuartierSynthesis, {
  type WorkbookQuartier,
} from "@/components/report/QuartierSynthesis";
import { ModuleTracker } from "@/components/ModuleTracker";
import { deriveQuartierSources, buildFallbackSummary } from "@/lib/quartier-signals";
import { resolveReadableTerritory, TERRITORY_SELECT } from "@/lib/active-territory";
import { AskFutureInlineMount } from "@/components/AskFutureInlineMount";
import { TerritoryYearsBand } from "@/components/report/TerritoryYearsBand";
import { deriveTerritoryMood } from "@/lib/territory-mood";
import { getTerritoryContext } from "@/lib/comparateur-vie";
import { buildTerritoryIdentity, buildTerritoryCards } from "@/lib/territory-identity";
import { TerritoryIdentityCard } from "@/components/report/TerritoryIdentityCard";
import { getResidencesSecondairesPct } from "@/lib/saisonnalite";
import { getEra5Trend } from "@/lib/era5-trend";
import { getReportContext, resolveRelation, synthesisRelation, parseDiscoveryWorkbook } from "@/lib/report-context";
import { ReportRelationBanner } from "@/components/report/ReportRelationBanner";

export default async function RapportQuartierPage() {
  const account = await getCurrentUserAccount();

  // Doctrine 2026-06-11 : Quartier est premium. Le gratuit n'ouvre aucun module
  // et est renvoyé vers le hub /rapport (qui lui montre la première lecture).
  if (!canAccessCompleteReport(account)) {
    redirect("/rapport");
  }

  const { supabase, user } = await requireCurrentUser();
  const fullReport = canAccessCompleteReport(account);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(`${TERRITORY_SELECT}, workbook_quartier`)
    .eq("user_id", user.id)
    .maybeSingle();

  const territory = await resolveReadableTerritory(supabase, user.id, profile);
  const communeName = territory.communeName;
  const inseeCode = territory.inseeCode;
  const initialWorkbook = normalizeWorkbook(profile?.workbook_quartier);

  // Contexte de lecture : relation effective (corrigée par l'utilisateur si posée,
  // sinon inférée résidence/découverte). Pilote la posture de la synthèse, le
  // garde-fou workbook, et le bandeau corrigeable.
  const reportCtx = inseeCode ? await getReportContext(supabase, user.id, inseeCode) : null;
  const { relation: effectiveRelation } = resolveRelation(territory.isResidence, reportCtx);
  const initialDiscovery = parseDiscoveryWorkbook(reportCtx?.discovery_workbook ?? null);

  // Socle commun : Géorisques + GASPAR inclus dans l'enrichissement.
  const enrichment = inseeCode ? await gatherCommuneEnrichment(inseeCode) : null;
  const georisques = enrichment?.georisques ?? null;
  const catnat = enrichment?.catnat ?? null;
  const littoral = enrichment?.littoral ?? null;

  const scenarios = enrichment?.drias?.commune.s ?? null;
  const territoire = enrichment?.ademe?.commune.territoire ?? null;
  const logementVacancePct = enrichment?.ademe?.commune.logements.vacants_pct ?? null;
  const eloignementServicesPct = enrichment?.ademe?.commune.sante.eloignement_services_pct ?? null;
  const vigieau = enrichment?.vigieau ?? null;
  const drought = enrichment?.eau?.drought ?? null;
  const displayName = communeName ?? "votre commune";

  // Identité visuelle du territoire (déterministe, sans appel réseau).
  const territoryMood = deriveTerritoryMood({ communeName, inseeCode, territoire });

  // Contexte territorial (index comparateur, lecture seule) : carte d'identité +
  // trait distinctif. Absent (commune hors index, PLM) => on n'affiche pas la carte.
  const territoryContext = inseeCode ? await getTerritoryContext(inseeCode) : null;
  const saisonnalitePct = inseeCode ? await getResidencesSecondairesPct(inseeCode) : null;
  // Tendance observée ERA5-Land (Copernicus) : preuve « le passé valide la
  // projection » dans le drawer Températures. La face avant reste sur le futur DRIAS.
  const era5 = inseeCode ? await getEra5Trend(inseeCode).catch(() => null) : null;
  const territoryIdentity = territoryContext
    ? buildTerritoryIdentity({
        communeName: displayName,
        typeLabel: territoryMood.typeLabel,
        context: territoryContext,
      })
    : null;
  const territoryCards = territoryContext ? buildTerritoryCards(territoryContext.entry) : null;

  // Sources mobilisées par horizon : pré-calculées côté serveur, le composant
  // client choisit via useHorizon. Ligne discrète sous la synthèse (pas de bloc
  // à chips) : la synthèse porte des affirmations chiffrées, elle doit garder
  // un renvoi de provenance sur son propre écran. hasTerritoryContext : le
  // prompt de synthèse mobilise aussi le contexte territoire (rôle/agglomération,
  // démographie, saisonnalité), qui vient de l'index comparateur + la base
  // logement INSEE, pas des 6 sources détectées par défaut.
  const hasTerritoryContext = territoryContext != null || saisonnalitePct != null;
  const sourcesByHorizon = {
    gwl15: deriveQuartierSources(enrichment, georisques, catnat, "gwl15", hasTerritoryContext),
    gwl20: deriveQuartierSources(enrichment, georisques, catnat, "gwl20", hasTerritoryContext),
    gwl30: deriveQuartierSources(enrichment, georisques, catnat, "gwl30", hasTerritoryContext),
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
        <section className="pt-20 pb-6">
          <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-info mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
            Module 01 · Territoire
          </div>
          <h1
            className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-4 text-label"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Ce que {displayName} devient.<br />
            <span className="italic text-info">Territoire, climat, risques.</span>
          </h1>
          <p className={`text-[17px] leading-[1.72] text-muted ${fullReport ? "mb-0" : "mb-9"}`}>
            Une lecture d&apos;ensemble de la commune : ce qu&apos;elle est, ce qui la transforme et les grands phénomènes auxquels elle est exposée.
          </p>
          {!fullReport && (
            <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline">
              Ouvrir le rapport interactif
            </Link>
          )}
        </section>

        {/* Passeport territorial : la carte d'identité ouvre le rapport. */}
        {communeName && territoryIdentity && (
          <div className="pt-1">
            <TerritoryIdentityCard
              communeName={displayName}
              inseeCode={inseeCode}
              identity={territoryIdentity}
              territoryType={territoryMood.type}
              tint={territoryMood.colors.skyHorizon}
              accent={territoryMood.colors.accent}
            />
          </div>
        )}

        {/* Synthèse pleine largeur, précédée de son réglage : la relation à la
            commune (inférée, corrigeable) règle la posture du texte, elle vit
            donc collée à la synthèse. Jamais un gate. */}
        <section className="pt-10">
          {inseeCode && (
            <div className="mb-4">
              <ReportRelationBanner
                insee={inseeCode}
                relation={effectiveRelation}
                communeName={displayName}
              />
            </div>
          )}
          <QuartierSynthesis
            communeName={communeName}
            inseeCode={inseeCode}
            userKey={account.userId}
            sourcesByHorizon={sourcesByHorizon}
            initialWorkbook={initialWorkbook}
            relation={synthesisRelation(effectiveRelation)}
            initialDiscovery={initialDiscovery}
            fallbackSummary={buildFallbackSummary(communeName, "votre horizon")}
          />
        </section>

        {/* La ligne des années — mémoire du lieu (arrêtés CatNat), APRÈS la synthèse.
            Animation déclenchée au scroll (cf. TerritoryYearsBand). Rendue seulement si
            GASPAR a répondu : une bande vide = « commune épargnée », jamais « panne ». */}
        {communeName && catnat && (
          <div className="mt-12">
            <TerritoryYearsBand communeName={displayName} years={catnat.years} />
          </div>
        )}

        <div className="border-t border-white/[0.08] mt-10" />

        {/* Ce que montrent les données (cartes) */}
        <section className="pt-14">
          {/* Une preuve du dossier « En une minute » peut viser une carte précise de cette section :
              le saut est natif (fragment), ce composant n'ajoute que le repère et le focus. */}
          <EvidenceArrival />
          <h2
            className="font-normal italic text-[clamp(22px,2vw,28px)] leading-[1.25] tracking-[-0.3px] text-label mb-6"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Les grands signaux du territoire
          </h2>
          <QuartierAside communeName={displayName} scenarios={scenarios} georisques={georisques} territoire={territoire} vigieau={vigieau} drought={drought} catnat={catnat} littoral={littoral} demographie={territoryCards?.demographie ?? null} couvertNaturel={territoryCards?.couvertNaturel ?? null} saisonnalitePct={saisonnalitePct} logementVacancePct={logementVacancePct} eloignementServicesPct={eloignementServicesPct} era5={era5} climatType={territoryMood.type} />
        </section>

        {/* Une question ? — AskFuture inline (uniquement pour comptes payants) :
            capte la curiosité à chaud, juste après la lecture */}
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
