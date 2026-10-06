import "server-only";
export const dynamic = "force-dynamic";
// Le préchauffage de la lecture enrichie tourne dans `after()`, pour la durée de la route : une
// génération (deux au plus) prend 15 à 25 s chacune. Le rendu, lui, n'attend jamais.
export const maxDuration = 120;

import { redirect } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { requireCurrentUser } from "@/lib/user-account";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";
import { QuartierAside } from "@/components/report/QuartierClimatData";
import { EvidenceArrival } from "@/components/report/EvidenceArrival";
import QuartierSynthesis from "@/components/report/QuartierSynthesis";
import { ModuleTracker } from "@/components/ModuleTracker";
import { resolveReadableTerritory, TERRITORY_SELECT, canAccessTerritory } from "@/lib/active-territory";
import { AskFutureInlineMount } from "@/components/AskFutureInlineMount";
import { TerritoryYearsBand } from "@/components/report/TerritoryYearsBand";
import { codeGaspar, villeGaspar } from "@/lib/georisques-flags";
import { deriveTerritoryMood } from "@/lib/territory-mood";
import { readLatestDataSnapshot } from "@/lib/server/decision-artifact-store";
import { buildTerritoryIdentity, buildTerritoryCards } from "@/lib/territory-identity";
import { TerritoryIdentityCard } from "@/components/report/TerritoryIdentityCard";
import { valueOf } from "@/lib/facts/contract";
import { screenFromSnapshot, sourcesFromSnapshot } from "@/lib/territoire/screen";
import { HORIZONS, projectForSynthesis, type HorizonKey } from "@/lib/territoire/synthesis-contract";
import { deterministicSynthesis } from "@/lib/territoire/synthesis-deterministe";
import { synthesisCacheKey } from "@/lib/territoire/synthesis-cache";
import { loadTerritoireSnapshot, prechaufferSyntheseTerritoire, DEFAULT_HORIZON } from "@/lib/server/territoire-snapshot";
import { territoireStore } from "@/lib/server/territoire-facts-store";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { normalizeUserProject } from "@/lib/user-project";
import { listDossiers } from "@/lib/address-dossier-store";
import { communeParent } from "@/lib/plm";
import { registersByTarget } from "@/lib/decision/evidence-registers";
import { EchelleVisual } from "@/components/report/EchelleVisual";
import { bindOrphans } from "@/lib/typography";

export default async function RapportQuartierPage(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> },
) {
  // L'ARTEFACT D'OÙ VIENT LE LIEN. Posé par `evidenceHref` sur les liens « Preuve » d'un dossier
  // FIGÉ, et absent partout ailleurs : la commune seule n'est pas une identité de preuve.
  const preuveDe = (await searchParams).preuve;
  const scopeDemande = typeof preuveDe === "string" ? preuveDe : null;

  const { supabase, user } = await requireCurrentUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(`${TERRITORY_SELECT}, user_project`)
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
  // ── LA PHOTO DES DONNÉES DE L'ÉCRAN, PRISE UNE FOIS (FUT-6, D10) ─────────────────────────────
  // Les cartes, la carte d'identité, la synthèse déterministe et la lecture enrichie partent de ce
  // seul snapshot. La route de synthèse le relit par son empreinte : elle ne recontacte aucune source.
  //
  // CE QUI N'EN FAIT PAS PARTIE, VOLONTAIREMENT : le compte d'arrêtés figé dans le dossier ACHETÉ
  // du lecteur (`snapshotFige`, plus bas). C'est une preuve du dossier de décision, propre à un
  // compte ; le snapshot Territoire, lui, est le même pour tous les lecteurs de la commune.
  const displayName = communeName ?? "votre commune";
  const snapshot = inseeCode ? await loadTerritoireSnapshot(inseeCode, displayName) : null;
  const store = territoireStore();
  // PANNE DE PERSISTANCE = PAS DE LECTURE ENRICHIE, JAMAIS UN ÉCRAN CASSÉ : la synthèse
  // déterministe, calculée ici depuis le même snapshot, reste affichée.
  const persisted = snapshot && store ? await store.persistSnapshot(snapshot).catch(() => false) : false;
  const screen = snapshot ? screenFromSnapshot(snapshot) : null;

  const georisques = screen?.georisques ?? null;
  const catnat = screen?.catnat ?? null;
  // FUT-69 : GASPAR ne publie Paris, Lyon et Marseille qu'à la ville. Sur la page d'un arrondissement,
  // la carte et la ligne des années portent le compte de toute la ville, et le disent.
  const catnatVille = inseeCode && inseeCode !== codeGaspar(inseeCode) ? villeGaspar(inseeCode) : null;
  const littoral = screen?.littoral ?? null;
  const scenarios = screen?.scenarios ?? null;
  const territoire = screen?.territoire ?? null;
  const logementVacancePct = screen?.logementVacancePct ?? null;
  const vigieau = screen?.vigieau ?? null;
  const drought = screen?.drought ?? null;

  // Identité visuelle du territoire (déterministe, sans appel réseau).
  // FUT-33 : la typologie figée dans le snapshot (commune, loi Littoral) fait foi ; le repli ne sait plus rien
  // du littoral.
  const territoryMood = deriveTerritoryMood({
    communeName, inseeCode, territoire: null,
    typeLabel: snapshot ? valueOf<string>(snapshot, "place.typology") : null,
  });

  // LE COMPTE QUE LA PREUVE DU DOSSIER ANNONCE, et il vient de l'ARTEFACT quand il existe.
  //
  // ── POURQUOI PAS L'INDEX COURANT ─────────────────────────────────────────────────────────────
  // Le dossier est figé le jour de l'achat ; cette page, elle, est recalculée à chaque ouverture.
  // Lire l'index d'aujourd'hui faisait diverger les deux dès la première régénération : la pastille
  // vendue annonçait 6, la carte affichait 7, chacune fidèle à sa source et personne pour le dire.
  // Le snapshot de données de l'artefact porte l'objet TEL QU'IL A ÉTÉ VENDU.
  //
  // L'index (lu dans le snapshot Territoire) reste le repli, pour les dossiers d'avant ce lot et pour
  // un lecteur qui n'a pas encore d'artefact sur cette commune. Il sert aussi à détecter une MISE À
  // JOUR : quand les deux existent et diffèrent, la carte le dit plutôt que de choisir en silence.
  const snapshotFige = inseeCode
    ? await readLatestDataSnapshot(supabase, user.id, inseeCode, scopeDemande).catch(() => null)
    : null;
  const catnatIndexCourant = screen?.catnatInondationIndex ?? null;
  const catnatInondation = snapshotFige?.catnatInondation ?? catnatIndexCourant;
  // L'écart ne s'affiche que s'il CHANGE le compte : un index régénéré à l'identique n'a rien à
  // raconter au lecteur. On ne prétend pas dire QUAND il a changé : l'index ne porte aucune date de
  // génération, et l'affirmer serait inventer une chronologie.
  const catnatMisAJour =
    snapshotFige?.catnatInondation && catnatIndexCourant
      && catnatIndexCourant.count !== snapshotFige.catnatInondation.count
      ? catnatIndexCourant
      : null;
  const saisonnalitePct = screen?.saisonnalitePct ?? null;
  // Tendance observée ERA5-Land (Copernicus) : preuve « le passé valide la
  // projection » dans le drawer Températures. La face avant reste sur le futur DRIAS.
  const era5 = screen?.era5 ?? null;
  // La carte d'identité n'apparaît que si la commune est dans l'index (rôle connu), comme avant.
  const territoryIdentity = snapshot && valueOf(snapshot, "place.urban_role") ? buildTerritoryIdentity(snapshot) : null;
  const territoryCards = snapshot ? buildTerritoryCards(snapshot) : null;

  // ── LA SYNTHÈSE, EN DEUX NIVEAUX (FUT-6, D9) ─────────────────────────────────────────────────
  // La déterministe, par horizon, tout de suite ; la lecture enrichie déjà en cache, s'il y en a.
  const deterministic = Object.fromEntries(
    HORIZONS.map((h) => [h, snapshot ? deterministicSynthesis(projectForSynthesis(snapshot, h), h) : ""]),
  ) as Record<HorizonKey, string>;
  const cachedByKey = persisted && snapshot && store
    ? await store.readSyntheses(HORIZONS.map((h) => synthesisCacheKey(snapshot.hash, h))).catch(() => new Map<string, { text: string }>())
    : new Map<string, { text: string }>();
  const initialEnriched: Partial<Record<HorizonKey, string>> = {};
  if (snapshot) {
    for (const h of HORIZONS) {
      const hit = cachedByKey.get(synthesisCacheKey(snapshot.hash, h));
      if (hit) initialEnriched[h] = hit.text;
    }
  }
  // PRÉCHAUFFAGE : si l'horizon par défaut n'est pas prêt, on le prépare APRÈS la réponse. Le hub
  // l'a souvent déjà fait (même commune, même snapshot) ; sinon c'est ici, au plus tôt.
  if (persisted && snapshot && inseeCode && !initialEnriched[DEFAULT_HORIZON]) {
    const s = snapshot;
    after(async () => { await prechaufferSyntheseTerritoire(inseeCode, displayName, s); });
  }

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
  const dossierIci = inseeCode
    ? dossiersDuCompte.find((d) => communeParent(d.insee) === communeParent(inseeCode)) ?? null
    : null;
  const aUneAdresseIci = dossierIci != null;
  const communeDossier = inseeCode && userProject
    ? await buildCommuneDossier(inseeCode, userProject, { hasAddress: aUneAdresseIci }).catch(() => null)
    : null;
  const registres = registersByTarget(communeDossier?.dossier ?? null);

  // Sources mobilisées par horizon, lues dans le MÊME snapshot que le texte. Ligne discrète sous la
  // synthèse : elle porte des affirmations chiffrées, elle garde un renvoi de provenance.
  const sourcesByHorizon = Object.fromEntries(
    HORIZONS.map((h) => [h, snapshot ? sourcesFromSnapshot(snapshot, h) : []]),
  ) as Record<HorizonKey, ReturnType<typeof sourcesFromSnapshot>>;

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
        <section className="pt-20 pb-6 grid lg:grid-cols-[minmax(0,1fr)_280px] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:items-start">
          <div className="lg:col-start-1 lg:row-start-1">
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
              {bindOrphans("Une lecture d'ensemble de la commune : ce qu'elle est, ce qui la transforme et les grands phénomènes auxquels elle est exposée.")}
            </p>
          </div>
          <EchelleVisual
            active="territoire"
            className="hidden lg:block lg:w-full lg:mt-7 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:justify-self-end"
          />
          <div className="mt-8 lg:col-start-1 lg:row-start-2">
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/rapport"
                prefetch={false}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]"
              >
                Retour au hub
              </Link>
              <Link
                href={dossierIci ? `/rapport/autour?dossierId=${encodeURIComponent(dossierIci.id)}` : "/dossier"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]"
              >
                {dossierIci ? "Voir Autour de l'adresse" : "Analyser une adresse"}
              </Link>
            </div>
          </div>
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

        {/* Synthèse pleine largeur. GÉNÉRIQUE depuis FUT-6 : elle ne dépend plus de la relation du
            lecteur à la commune, donc le bandeau « Cette lecture s'adresse à quelqu'un qui… » (qui
            réglait sa posture) n'a plus rien de vrai à dire ici. Le composant ReportRelationBanner
            et la relation stockée (report_context) sont conservés pour la future « Lecture pour
            votre projet ». */}
        <section className="pt-10">
          <QuartierSynthesis
            communeName={communeName}
            inseeCode={inseeCode}
            snapshotHash={persisted && snapshot ? snapshot.hash : null}
            deterministic={deterministic}
            initialEnriched={initialEnriched}
            sourcesByHorizon={sourcesByHorizon}
          />
        </section>

        {/* La ligne des années — mémoire du lieu (arrêtés CatNat), APRÈS la synthèse.
            Animation déclenchée au scroll (cf. TerritoryYearsBand). Rendue seulement si
            GASPAR a répondu : une bande vide = « commune épargnée », jamais « panne ». */}
        {communeName && catnat && (
          <div className="mt-12">
            <TerritoryYearsBand communeName={displayName} years={catnat.years} ville={catnatVille} />
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
          <QuartierAside registres={registres} communeName={displayName} scenarios={scenarios} georisques={georisques} territoire={territoire} vigieau={vigieau} drought={drought} catnat={catnat} catnatInondation={catnatInondation} catnatMisAJour={catnatMisAJour} catnatVille={catnatVille} littoral={littoral} demographie={territoryCards?.demographie ?? null} couvertNaturel={territoryCards?.couvertNaturel ?? null} saisonnalitePct={saisonnalitePct} logementVacancePct={logementVacancePct} eloignementServicesPct={null} era5={era5} climatType={territoryMood.type} />
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
