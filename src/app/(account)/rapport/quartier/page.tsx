import "server-only";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
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
import { resolveReadableTerritory, TERRITORY_SELECT, canAccessTerritory } from "@/lib/active-territory";
import { AskFutureInlineMount } from "@/components/AskFutureInlineMount";
import { TerritoryYearsBand } from "@/components/report/TerritoryYearsBand";
import { deriveTerritoryMood } from "@/lib/territory-mood";
import { catnatInondationDepuisIndex } from "@/lib/decision/catnat-evidence";
import { readLatestDataSnapshot } from "@/lib/server/decision-artifact-store";
import { getTerritoryContext } from "@/lib/comparateur-vie";
import { buildTerritoryIdentity, buildTerritoryCards } from "@/lib/territory-identity";
import { TerritoryIdentityCard } from "@/components/report/TerritoryIdentityCard";
import { getResidencesSecondairesPct } from "@/lib/saisonnalite";
import { getEra5Trend } from "@/lib/era5-trend";
import { getReportContext, resolveRelation, synthesisRelation, parseDiscoveryWorkbook } from "@/lib/report-context";
import { ReportRelationBanner } from "@/components/report/ReportRelationBanner";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { normalizeUserProject } from "@/lib/user-project";
import { listDossiers } from "@/lib/address-dossier-store";
import { communeParent } from "@/lib/plm";
import { registersByTarget } from "@/lib/decision/evidence-registers";

export default async function RapportQuartierPage(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> },
) {
  // L'ARTEFACT D'OÙ VIENT LE LIEN. Posé par `evidenceHref` sur les liens « Preuve » d'un dossier
  // FIGÉ, et absent partout ailleurs : la commune seule n'est pas une identité de preuve.
  const preuveDe = (await searchParams).preuve;
  const scopeDemande = typeof preuveDe === "string" ? preuveDe : null;
  const account = await getCurrentUserAccount();

  const { supabase, user } = await requireCurrentUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(`${TERRITORY_SELECT}, workbook_quartier, user_project`)
    .eq("user_id", user.id)
    .maybeSingle();

  const territory = await resolveReadableTerritory(supabase, user.id, profile);
  const communeName = territory.communeName;
  const inseeCode = territory.inseeCode;

  // LA GARDE SE POSE À LA COMMUNE, plus au plan (migration 25, alignement 30/07).
  //
  // `canAccessCompleteReport(account)` était global : il ouvrait Territoire sur N'IMPORTE quelle
  // commune lue dès que le compte avait payé quelque part. `resolveReadableTerritory` ne contrôle
  // rien sur la résidence, délibérément, le contrôle vivant sur les pages : quelqu'un qui achetait
  // le territoire de Nantes obtenait donc le Territoire COMPLET de sa résidence, jamais payée.
  // C'est le trou que /rapport a fermé le 29/07 et que cette page gardait ouvert.
  //
  // Le gratuit tombe toujours ici, sans claim d'aucune sorte, et retrouve le hub comme avant.
  const fullReport = await canAccessTerritory(supabase, user.id, inseeCode);
  if (!fullReport) {
    redirect("/rapport");
  }
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

  // LE COMPTE QUE LA PREUVE DU DOSSIER ANNONCE, et il vient de l'ARTEFACT quand il existe.
  //
  // ── POURQUOI PAS L'INDEX COURANT ─────────────────────────────────────────────────────────────
  // Le dossier est figé le jour de l'achat ; cette page, elle, est recalculée à chaque ouverture.
  // Lire l'index d'aujourd'hui faisait diverger les deux dès la première régénération : la pastille
  // vendue annonçait 6, la carte affichait 7, chacune fidèle à sa source et personne pour le dire.
  // Le snapshot de données de l'artefact porte l'objet TEL QU'IL A ÉTÉ VENDU.
  //
  // L'index reste le repli, pour les dossiers d'avant ce lot et pour un lecteur qui n'a pas encore
  // d'artefact sur cette commune. Il sert aussi à détecter une MISE À JOUR : quand les deux
  // existent et diffèrent, la carte le dit plutôt que de choisir en silence.
  const snapshotFige = inseeCode
    ? await readLatestDataSnapshot(supabase, user.id, inseeCode, scopeDemande).catch(() => null)
    : null;
  const catnatIndexCourant = catnatInondationDepuisIndex(territoryContext?.entry);
  const catnatInondation = snapshotFige?.catnatInondation ?? catnatIndexCourant;
  // L'écart ne s'affiche que s'il CHANGE le compte : un index régénéré à l'identique n'a rien à
  // raconter au lecteur. On ne prétend pas dire QUAND il a changé : l'index ne porte aucune date de
  // génération, et l'affirmer serait inventer une chronologie.
  const catnatMisAJour =
    snapshotFige?.catnatInondation && catnatIndexCourant
      && catnatIndexCourant.count !== snapshotFige.catnatInondation.count
      ? catnatIndexCourant
      : null;
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

  // LA RELATION DE CHAQUE CARTE AU PROJET DU LECTEUR, pour le filet coloré de la grille.
  //
  // Le dossier de décision est assemblé sur /rapport, pas ici : cette page ne le connaissait pas. Le
  // reconstruire est un coût assumé (buildCommuneDossier lit climat, risques, radon et contraintes
  // dures), et c'est le seul moyen de savoir quelles cartes participent réellement à la décision.
  // Les sources ont leur propre cache, donc la seconde lecture est moins chère que la première.
  //
  // Sans projet, `dossier` reste nul et la table est vide : aucune carte n'a de filet, ce qui est le
  // comportement voulu (la couleur exprime une relation au projet).
  const userProject = normalizeUserProject(
    (profile as { user_project?: unknown } | null)?.user_project ?? null,
  );
  const dossiersDuCompte = inseeCode ? await listDossiers(supabase, user.id) : [];
  const aUneAdresseIci = inseeCode
    ? dossiersDuCompte.some((d) => communeParent(d.insee) === communeParent(inseeCode))
    : false;
  const communeDossier = inseeCode && userProject
    ? await buildCommuneDossier(inseeCode, userProject, { hasAddress: aUneAdresseIci }).catch(() => null)
    : null;
  const registres = registersByTarget(communeDossier?.dossier ?? null);

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
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-info/[0.10] blur-[100px] opacity-32 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-accent/[0.08] blur-[88px] opacity-24 pointer-events-none z-0" />

      {/* « Mes biens » vit dans la navigation globale depuis le 13/08/2026 : le répéter en bouton
          d'action, à quelques centimètres, était un doublon visible. Le CTA porte l'action que cet
          écran n'offre pas ailleurs. */}
      <Navbar ctas={{ secondary: { href: "/rapport", label: "Mon rapport" }, primary: { href: "/dossier", label: "Analyser une adresse" } }} />

      <ModuleTracker moduleId="quartier" commune={communeName} inseeCode={inseeCode} source="page" />
      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24">
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
            className="font-[var(--weight-display)] text-[length:var(--text-display)] leading-[1.08] tracking-[-1.2px] mb-4 text-label"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Ce que {displayName} devient.<br />
            <span className="italic text-info">Territoire, climat, risques.</span>
          </h1>
          {/* La branche « pas d'accès » qui vivait ici était morte : la garde du haut redirige
              avant d'atteindre le rendu. Un compte sans droit sur cette commune ne voit pas cette
              page du tout, il voit le hub, qui porte l'offre. */}
          <p className="text-[17px] leading-[1.72] text-muted mb-0">
            Une lecture d&apos;ensemble de la commune : ce qu&apos;elle est, ce qui la transforme et les grands phénomènes auxquels elle est exposée.
          </p>
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

        <div className="border-t border-[var(--border-1)] mt-10" />

        {/* Ce que montrent les données (cartes) */}
        <section className="pt-14">
          {/* Une preuve du dossier « En une minute » peut viser une carte précise de cette section :
              le saut est natif (fragment), ce composant n'ajoute que le repère et le focus. */}
          <EvidenceArrival />
          <h2
            className="font-normal italic text-[length:var(--text-section)] leading-[1.25] tracking-[-0.3px] text-label mb-6"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Les grands signaux du territoire
          </h2>
          <QuartierAside registres={registres} communeName={displayName} scenarios={scenarios} georisques={georisques} territoire={territoire} vigieau={vigieau} drought={drought} catnat={catnat} catnatInondation={catnatInondation} catnatMisAJour={catnatMisAJour} littoral={littoral} demographie={territoryCards?.demographie ?? null} couvertNaturel={territoryCards?.couvertNaturel ?? null} saisonnalitePct={saisonnalitePct} logementVacancePct={logementVacancePct} eloignementServicesPct={eloignementServicesPct} era5={era5} climatType={territoryMood.type} />
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
            style={{ background: "var(--orange)", color: "var(--canvas)", fontFamily: "var(--font-sans)" }}
          >
            Module Logement
            <span className="text-[16px] leading-none">→</span>
          </Link>
        </div>

        {/* Sortie propre */}
        <div className="mt-14">
          <a href="/rapport" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[13px] no-underline border border-[var(--border-1)]">
            ← Retour au dossier
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
