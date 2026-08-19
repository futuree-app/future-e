export const dynamic = "force-dynamic";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PRODUCT_MODULES, MODULE_HREF } from "@/lib/product";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT, loadTerritoryClaims } from "@/lib/active-territory";
import { decideTerritoryAccess, codeDeLectureLocal } from "@/lib/territory-claims";
import { TrackedModuleLink, TrackedUpgradeLink } from "./RapportTrackedLinks";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";
import { RapportPremiereLecture } from "@/components/wizard/RapportPremiereLecture";
import { WizardAnswersSync } from "@/components/wizard/WizardAnswersSync";
import { OuVivreProjectSync } from "@/components/OuVivreProjectSync";
import { ProjectSummaryCard } from "@/components/report/ProjectSummaryCard";
import { EnTeteDossier } from "@/components/report/EnTeteDossier";
import { contenuDuHero, ANCRE_PROJET } from "@/lib/decision/premier-ecran";
import { normalizeUserProject } from "@/lib/user-project";
import { getReportContext, resolveRelation } from "@/lib/report-context";
import { listTerritoiresSansBien } from "@/lib/active-territory";
import { Suspense } from "react";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
import { DossierAvecLogement } from "@/components/report/DossierAvecLogement";
import { listDossiers } from "@/lib/address-dossier-store";
import { readLatestArtifact } from "@/lib/server/decision-artifact-store";
import {
  artifactScopeKey, dossierAServir, prochaineVersionAutomatique,
} from "@/lib/decision/decision-artifact";
import { generateDecisionArtifact } from "@/lib/server/generate-decision-artifact";
import { after } from "next/server";
import { communeParent } from "@/lib/plm";
import { choisirDossierActif } from "@/lib/dossier-actif";
import { projetAChangeMateriellement } from "@/lib/decision/projet-materiel";
import type { ResolvedAddress } from "@/lib/server/logement-decision-data";
import { hasWizardContent, type WizardAnswers } from "@/components/wizard/types";
import { Logo } from "@/components/Logo";

// L'IDENTITÉ D'UNE ÉCHELLE EST SON RANG, SON NOM ET SON GRAIN. Ni couleur, ni icône.
//
// `MODULE_COLORS` (bleu Territoire, vert Autour, orange Logement) a été retiré le 30/07/2026. Le
// produit portait DEUX systèmes chromatiques incompatibles qui se croisaient sur cette page même :
// les cinq registres du dossier de décision rendus plus bas (rouge incompatibilité, vert alignement,
// orange compromis, améthyste non su, bleu contrôle) et ces trois échelles. Le vert disait « ce lieu
// tient bien ce point » dans le dossier et « ceci appartient à Autour » dans la grille, à quelques
// centaines de pixels. Une teinte est une affirmation vérifiable (DESIGN.md § 5.3) : elle ne peut
// pas dire à la fois OÙ est la donnée et CE QU'ELLE SIGNIFIE pour la décision. Les registres gardent
// la couleur, les échelles la perdent.
//
// `MODULE_ICONS` (🏘 🚶 🏠) a été retiré au même moment, sans substitution : les emoji sont interdits
// (doctrine/editoriale.md) et un jeu d'icônes dessiné serait un vocabulaire de plus à faire
// comprendre, alors que « Territoire », « Autour de l'adresse » et « Logement » sont déjà plus
// précis que n'importe quelle maison ou silhouette.
const MODULE_GRAIN: Record<string, string> = {
  quartier: "La commune",
  autour: "Le secteur autour de l'adresse",
  logement: "Le bâtiment",
};

// LE VERDICT EST LE TITRE DE CET ÉCRAN (12/08/2026), aux TROIS points de montage : le repli
// communal du Suspense, le chemin adresse et le chemin commune seule. En oublier un ferait changer
// la taille du titre au moment où le streaming se résout.
//
// LA MESURE TRANCHE LA TAILLE, ET ELLE L'A TRANCHÉE DEUX FOIS.
// ══════════════════════════════════════════════════════════════════════════════════════════
// Le headline déterministe est borné à 130 caractères (`HEADLINE_MAX_CHARS`), ce qui est long pour
// un titre. À 360 px de viewport, la carte laisse 270 px : `--text-display` (30 px) y donnait SEPT
// à HUIT lignes, 23 px en donne CINQ.
//
// Sur desktop, `--text-display` monte à 46 px, une taille de couverture éditoriale : trois lignes de
// titre, et la réponse commençait à 629 px, sous le pli. La sémantique du <h1> n'impose aucune
// taille ; ce qu'elle impose est d'être le plus grand texte de l'écran, ce que 36 px tient largement
// (les titres de section plafonnent à 31 px). L'échelle propre au verdict est donc bornée ici :
// 23 px en mobile, 36 px au plus en desktop.
const TITRE_VERDICT = {
  niveau: "h1" as const,
  classe: "text-[length:clamp(23px,2.9vw,36px)] font-[var(--weight-display)] tracking-[-0.8px]",
};

const MODULE_BENEFIT: Record<string, string> = {
  autour: "Commerces, école, gare, espace vert, chaleur du quartier, place de la voiture. Ce qui se mesure autour du point, et pas à l'échelle de la commune.",
  logement: "Diagnostic, confort d'été, sol de la parcelle, sinistres indemnisés. Et, pour finir, ce qu'il reste à demander avant de décider.",
};

export default async function RapportPage() {
  const account = await getCurrentUserAccount();

  const { supabase, user } = await requireCurrentUser();
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select(`${TERRITORY_SELECT}, wizard_answers, user_project, active_dossier_id`)
    .eq("user_id", user.id)
    .maybeSingle();

  // UNE ERREUR DE LECTURE N'EST PAS UN PROFIL ABSENT, ET ELLE ARRÊTE L'ÉCRAN.
  //
  // Elle était d'abord ignorée, puis seulement journalisée : dans les deux cas le rendu continuait
  // avec `profile === null`, et l'écran servait un compte sans territoire, sans projet et sans bien,
  // comme s'il venait d'être créé. Un lecteur qui a payé y voit la disparition de ce qu'il possède,
  // et les journaux n'aident que nous.
  //
  // On ne tolère PAS l'ancienne forme du schéma en repli : la colonne est un contrat, la migration
  // est additive, et une lecture indulgente masquerait l'oubli tout en laissant la route d'écriture
  // incompatible. On s'arrête donc, en disant ce qui se passe et ce que ça ne veut PAS dire.
  if (profileError) {
    console.error("[rapport] lecture du profil échouée", { userId: user.id, error: profileError });
    return (
      <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: "var(--font-sans)" }}>
        <Navbar />
        <main className="max-w-[720px] mx-auto px-7 py-24">
          <h1
            className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.15] text-label mb-5"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Votre espace n&apos;a pas pu être chargé.
          </h1>
          <p className="text-[16px] leading-[1.7] text-muted">
            L&apos;incident est de notre côté et il est enregistré. Rien n&apos;est perdu : vos
            dossiers, vos analyses et vos droits d&apos;accès sont intacts. Réessayez dans quelques
            minutes.
          </p>
        </main>
      </div>
    );
  }

  const territory = await resolveReadableTerritory(supabase, user.id, profile);
  const communeName = territory.communeName;
  const inseeCode = territory.inseeCode;
  const displayName = communeName ?? "votre commune";

  // La complétude se demande À LA COMMUNE, plus à un flag de plan.
  //
  // `canAccessCompleteReport(account)` était global : il ne disait pas QUELLE commune était payée.
  // Combiné à `resolveReadableTerritory`, qui ne contrôlait rien sur la résidence, un achat
  // quelconque ouvrait le Territoire complet de la commune de résidence, jamais achetée.
  //
  // Faux ne ferme rien : le rapport PARTIEL reste rendu, exactement comme aujourd'hui pour un
  // compte gratuit. C'est la dizaine de branches ci-dessous qui s'en chargent.
  // LES DROITS SONT CHARGÉS UNE FOIS, et servent deux fois : décider l'accès, et retrouver le code
  // LOCAL auquel la commune se lit quand elle a des arrondissements (Paris, Lyon, Marseille).
  // `canAccessTerritory` refaisait sa propre requête pour la seule première question.
  const claims = inseeCode ? await loadTerritoryClaims(supabase, user.id) : [];
  const fullReport = Boolean(inseeCode) && decideTerritoryAccess(claims, inseeCode!);

  const allModules = PRODUCT_MODULES;
  // Première lecture du compte gratuit : réponses du wizard persistées (point 2).
  const serverWizardAnswers = (profile?.wizard_answers ?? null) as WizardAnswers | null;
  const userProject = normalizeUserProject((profile as { user_project?: unknown } | null)?.user_project ?? null);

  // Dossier de décision (« En une minute ») : payant, commune connue, projet présent. Ouvert à tous
  // les payants (pas de flag) ; le cas creux reste digne (conclusion honnête + contraintes non couvertes).
  // Un dossier de CETTE commune vaut « adresse renseignée » : on coupe la règle « confort sans
  // adresse » et le CTA renvoie vers l'analyse, plutôt que d'inviter à saisir une adresse. On compare au grain commune
  // (communeParent) : un dossier sur le 3e arrondissement de Lyon concerne bien Lyon.
  //
  // La liste est chargée SANS condition, alors qu'elle ne l'était que pour un rapport complet.
  // C'est ce qui rendait les dossiers introuvables : un compte qui possède deux biens à Nantes et
  // réside à La Rochelle lisait le partiel de La Rochelle, et rien à l'écran ne disait que Nantes
  // était ouvert. Le hub doit nommer ce que le compte possède, même quand le territoire lu, lui,
  // n'est pas ouvert.
  const dossiers = await listDossiers(supabase, user.id);
  // LE BIEN LU EST CELUI QUE LE LECTEUR A OUVERT EN DERNIER (11/08/2026). Il était choisi par
  // `dossiers.find(...)`, c'est-à-dire le plus récemment CRÉÉ de la commune : ouvrir un bien puis
  // revenir ici en réaffichait un autre, sans un mot. La règle et ses cas limites vivent dans
  // `lib/dossier-actif.ts`, testés ; l'écran, lui, doit NOMMER le bien retenu (plus bas).
  const choixDossier = fullReport
    ? choisirDossierActif(dossiers, inseeCode, (profile as { active_dossier_id?: string | null } | null)?.active_dossier_id ?? null)
    : { dossier: null, raison: "aucun" as const, autres: [] };
  const logementForCommune = choixDossier.dossier;
  // Les biens qui ouvrent une AUTRE commune que celle lue : c'est exactement ce que le lecteur
  // cherche quand l'écran lui sert un rapport partiel. Une entrée par commune, pas par bien : deux
  // appartements du même immeuble mènent au même territoire.
  const dossiersAilleurs = inseeCode
    ? dossiers.filter((d) => communeParent(d.insee) !== communeParent(inseeCode))
    : dossiers;
  // LE COMPTE NE PORTAIT QUE LES BIENS (corrigé le 13/08/2026) : un territoire acheté seul (14 €)
  // n'a pas de dossier, il n'était donc compté nulle part et son acheteur n'avait plus d'écran qui
  // le nomme. Une commune, une entrée, quelle que soit la porte qui l'a ouverte.
  const territoiresSansBien = await listTerritoiresSansBien(supabase, user.id);
  const communesOuvertes = new Set([
    ...dossiersAilleurs.map((d) => communeParent(d.insee)),
    ...territoiresSansBien
      .map((t) => communeParent(t.insee))
      .filter((c) => !inseeCode || c !== communeParent(inseeCode)),
  ]);
  const communesAilleurs = [...communesOuvertes];
  // LE CODE DE LECTURE, quand la commune se lit par arrondissement. `null` partout ailleurs, donc
  // aucun changement sur une commune ordinaire. Voir `codeDeLectureLocal`.
  const codeLecture = inseeCode
    ? codeDeLectureLocal(claims, inseeCode, logementForCommune?.insee ?? null)
    : null;
  const communeResult =
    fullReport && inseeCode && userProject
      ? await buildCommuneDossier(inseeCode, userProject, {
          hasAddress: Boolean(logementForCommune),
          citycode: codeLecture,
        })
      : null;
  // L'ARTEFACT PASSE AVANT L'ASSEMBLAGE (05/08/2026).
  // ══════════════════════════════════════════════════════════════════════════════════════════
  // Ce qui a été vendu est la lecture du jour de l'achat. `buildCommuneDossier` reste appelé plus
  // haut parce que ses `moduleFacts` et son contexte de contraintes servent l'augmentation Adresse,
  // mais le DOSSIER affiché vient de l'artefact dès qu'il existe.
  //
  // Un artefact absent n'est pas une panne : les dossiers achetés avant ce lot n'en ont pas, et un
  // dossier ouvert sans projet renseigné non plus. On retombe alors sur l'assemblage vivant,
  // exactement comme avant. Un artefact illisible fait de même, le parseur ayant refusé plutôt que
  // de réparer.
  const artefactCommune =
    fullReport && inseeCode
      ? await readLatestArtifact(supabase, user.id, inseeCode, artifactScopeKey(null)).catch(() => null)
      : null;
  // LE RATTRAPAGE DES DOSSIERS DÉJÀ ACHETÉS. Sans lui, un territoire payé avant ce lot n'aurait
  // jamais d'artefact et continuerait de se réécrire à chaque ouverture : le lot aurait été complet
  // pour les ventes futures et sans effet sur les ventes faites. La génération part dans `after()`,
  // donc après la réponse : cette page ne l'attend pas, et affiche l'assemblage du jour comme avant.
  // Au rechargement suivant, la version figée prend le relais.
  //
  // UNE TENTATIVE RATÉE NE CONDAMNAIT PAS LE DOSSIER À N'ÊTRE JAMAIS FIGÉ (revue du 12/08/2026) :
  // la condition était « aucune ligne », donc une v1 en échec fermait le rattrapage pour toujours et
  // ce territoire payé se serait réassemblé à chaque ouverture, sans date, sans que rien ne le dise.
  // On repart du numéro qui suit la dernière TENTATIVE, et `prochaineVersionAutomatique` borne la
  // reprise : jamais pendant une génération en cours, jamais au-delà de quelques échecs.
  //
  // Le rattrapage ne concerne QUE l'absence de version servie : quand une version est servie, la
  // suivante se DEMANDE (bouton), elle ne se déclenche pas au rendu. C'est la doctrine du vault.
  const versionCommune = prochaineVersionAutomatique(artefactCommune, new Date());
  if (fullReport && inseeCode && userProject && versionCommune !== null
      && !artefactCommune?.artifact) {
    after(async () => {
      const r = await generateDecisionArtifact(supabase, user.id, userProject, {
        kind: "commune", insee: inseeCode,
      }, versionCommune);
      if (r.status === "failed") console.error("[artefact] rattrapage échoué", { inseeCode, versionCommune, r });
    });
  }

  // UN DOSSIER PAYÉ SANS FAITS NE RESTE PAS SILENCIEUX, NI POUR LE LECTEUR NI POUR NOUS. L'écran le
  // dit (bloc plus bas), et le journal porte de quoi le reconnaître : c'est ainsi que le trou de
  // Paris, Lyon et Marseille a pu vivre sans être vu.
  if (fullReport && userProject && !communeResult) {
    console.error("[rapport] aucun fait de territoire pour une commune ouverte", {
      userId: user.id, inseeCode, codeLecture, bien: logementForCommune?.insee ?? null,
    });
  }

  const servi = dossierAServir(artefactCommune, communeResult?.dossier ?? null);
  const dossier = servi.dossier;
  const dossierGenereLe = servi.generatedAt;
  // L'identité de l'artefact servi, portée par les liens « Preuve » du dossier communal. Absente
  // quand le dossier est assemblé à l'instant : il n'y a alors aucune version figée à désigner.
  const provenanceCommune = servi.source === "artefact" ? "commune" : undefined;
  // L'ANALYSE RÉPOND-ELLE ENCORE AU PROJET DU LECTEUR ? Comparaison SÉMANTIQUE avec le projet figé
  // dans l'artefact : les dates ne disent rien ici, `updatedAt` bougeant sur une faute de frappe.
  const projetCommuneAChange = projetAChangeMateriellement(
    artefactCommune?.artifact?.projectSnapshot ?? null, userProject,
  );
  // LES LIENS DES MODULES D'ADRESSE PORTENT LE BIEN LU (11/08/2026).
  //
  // Ils étaient génériques (`/rapport/autour`, `/rapport/logement`). Tant qu'un compte n'avait qu'un
  // bien par commune, ces pages le retrouvaient seules ; à partir de deux, elles renvoyaient vers le
  // sélecteur. Le hub nommait donc un bien que ses propres boutons n'ouvraient pas, ce qui est pire
  // qu'un hub muet : il annonce une identité qu'il ne transporte pas.
  //
  // Le Territoire reste au grain COMMUNE : lui passer un dossier n'aurait aucun sens.
  const hrefModule = (id: string): string => {
    const base = MODULE_HREF[id as keyof typeof MODULE_HREF];
    if (!logementForCommune || id === "quartier") return base;
    return `${base}?dossierId=${encodeURIComponent(logementForCommune.id)}`;
  };

  const dossierLogementLink = logementForCommune
    ? { href: `/rapport/logement?dossierId=${encodeURIComponent(logementForCommune.id)}`, label: logementForCommune.address_label }
    : null;
  const dossierAddress: ResolvedAddress | null = logementForCommune
    ? { id: logementForCommune.ban_id, label: logementForCommune.address_label, city: logementForCommune.city, citycode: logementForCommune.insee, postcode: logementForCommune.postcode, latitude: logementForCommune.latitude, longitude: logementForCommune.longitude }
    : null;

  // COMBIEN D'ÉCHELLES SONT RÉELLEMENT OUVERTES, SUR LA COMMUNE LUE.
  //
  // Le hub annonçait « trois échelles » à tout compte payant, avec trois cartes marquées
  // « Accessible ». C'était faux : `/rapport/autour` et `/rapport/logement` exigent un dossier
  // d'adresse et redirigent vers `/rapport/dossiers` sans lui. Un lecteur qui a payé 14 € voyait
  // donc son produit décrit comme deux tiers manquant.
  //
  // Le calcul se fait sur `logementForCommune`, donc sur LA COMMUNE LUE, jamais sur le compte :
  // posséder un bien à Nantes n'ouvre pas Autour et Logement à La Rochelle. C'est la même règle que
  // le bandeau `communesAilleurs` plus bas.
  const openModules = fullReport
    ? allModules.filter((m) => m.id === "quartier" || Boolean(logementForCommune))
    : [];

  // LA RELATION AU LIEU SE LIT ICI DEPUIS LE 12/08/2026, parce que c'est ici qu'on la modifie
  // désormais. Elle reste attachée à la COMMUNE (table `report_context`), et non au projet :
  // quelqu'un peut habiter Lorient et envisager La Rochelle. On affiche la valeur EFFECTIVE
  // (`resolveRelation`), celle que la synthèse utilisera, plutôt qu'une valeur déclarée qui n'existe
  // peut-être pas encore.
  const contexteLecture = fullReport && inseeCode
    ? resolveRelation(territory.isResidence, await getReportContext(supabase, user.id, inseeCode))
    : null;

  // LE CONTENU DU HAUT DE PAGE, décidé par une fonction pure et testée (quatre états). La page ne
  // rejoue pas la règle : elle la consomme.
  const heroContenu = contenuDuHero({
    fullReport, project: userProject, commune: communeName,
  });

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Orbs */}
      <div className="fixed top-[-160px] left-[-130px] w-[540px] h-[540px] rounded-full bg-accent/[0.14] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[420px] h-[420px] rounded-full bg-amethyst/[0.12] blur-[90px] opacity-28 pointer-events-none z-0" />
      <div className="fixed top-[42%] left-[58%] w-[280px] h-[280px] rounded-full bg-info/[0.08] blur-[70px] opacity-16 pointer-events-none z-0" />

      {/* « MES BIENS » NE S'AFFICHE PLUS DEUX FOIS (13/08/2026) : il est entré dans la navigation
          globale, et il restait le bouton d'action de cet écran, à quelques centimètres. Le CTA
          rend la place à la seule action que cette page n'offre pas ailleurs, ouvrir un nouveau
          dossier ; la liste des biens garde son lien, dans la barre. */}
      <Navbar ctas={{ secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/dossier", label: "Analyser une adresse" } }} />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24">

        {/* Persiste les réponses du wizard (sessionStorage → profil) à la 1re
            page authentifiée, si elles ne sont pas déjà en base. */}
        <WizardAnswersSync hasServerAnswers={hasWizardContent(serverWizardAnswers)} />
        <OuVivreProjectSync hasServerProject={Boolean((profile as { user_project?: unknown } | null)?.user_project)} />

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

        {/* ── OÙ JE SUIS, ET COMMENT J'EN CHANGE : UNE LIGNE, PLUS DEUX CARTES ──────────────
            Deux bandeaux se succédaient ici : le territoire consulté, puis la liste des communes
            ouvertes par un bien. Ensemble ils occupaient 320 px, si bien que la réponse achetée
            commençait à 629 px sur desktop et sous le premier écran sur mobile : le chantier
            remontait le verdict, la navigation le repoussait aussitôt.

            Ce qu'ils disaient survit, à sa vraie échelle : une ligne. Les autres communes ne sont
            plus listées ici, elles sont derrière le lien qui les compte, et cette page-là (« Mes
            biens ») les ouvre déjà toutes, chacune vers ses trois échelles.

            <a> et non <Link> pour `/rapport/residence` : la cible est une Route Handler, et un
            <Link> vers une Route Handler ne navigue pas (le router attend du RSC, reçoit une
            redirection vers du HTML, et abandonne). */}
        {!territory.isResidence || communesAilleurs.length > 0 ? (
          <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
            <span>
              Vous consultez <span className="text-label font-medium">{displayName}</span>
            </span>
            {!territory.isResidence && territory.residenceCommune ? (
              <>
                <span aria-hidden className="text-ghost">·</span>
                <span>votre résidence est {territory.residenceCommune}</span>
                <a
                  href="/rapport/residence"
                  className="underline underline-offset-2 decoration-[var(--border-2)] text-accent hover:decoration-current"
                >
                  Y revenir
                </a>
              </>
            ) : null}
            {communesAilleurs.length > 0 ? (
              <>
                <span aria-hidden className="text-ghost">·</span>
                <Link
                  href="/rapport/dossiers"
                  className="underline underline-offset-2 decoration-[var(--border-2)] text-accent hover:decoration-current"
                >
                  {communesAilleurs.length === 1
                    ? "1 autre commune vous est ouverte"
                    : `${communesAilleurs.length} autres communes vous sont ouvertes`}
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        {/* ── EN TÊTE : L'IDENTITÉ DE CE QUI EST LU, PUIS LA RÉPONSE ACHETÉE ─────────────
            Le lecteur qui venait de payer voyait, dans cet ordre : une promesse commerciale en très
            grand, un sommaire, un réglage sans effet, une carte projet, et SEULEMENT ENSUITE la
            conclusion qu'il avait achetée. L'en-tête porte ce qui ne dépend d'aucun artefact (lieu,
            bien, projet du jour), le bloc du dossier porte la réponse et les métadonnées de la
            version qu'il sert. */}
        {fullReport ? (
          <EnTeteDossier
            lieu={displayName}
            bienLabel={logementForCommune?.address_label ?? null}
            bienAlternatif={choixDossier.autres.length > 0}
            choixParDefaut={choixDossier.raison === "repli_plus_recent"}
            intent={userProject?.intent ?? null}
            nbPriorites={userProject?.parsed?.preferences?.length ?? null}
            projetRenseigne={Boolean(userProject?.parsed?.reformulation ?? userProject?.rawText)}
            contenu={heroContenu}
          />
        ) : null}

        {/* ── Le dossier de décision (payant, grain commune) ── */}
        {dossier && communeResult && inseeCode ? (
          dossierAddress && logementForCommune ? (
            <Suspense
              fallback={
                // Le repli porte la liste lui aussi : son verdict annonce déjà des constats
                // « plus bas », et une promesse tenue seulement après l'augmentation serait fausse
                // pendant tout le temps d'attente.
                <>
                  <DossierDecisionSection
                    dossier={dossier}
                    logement={dossierLogementLink}
                    logementStatus="pending"
                    insee={inseeCode}
                    scopeKey="commune"
                    generatedAt={dossierGenereLe}
                    provenance={provenanceCommune}
                    projetAChange={projetCommuneAChange}
                    espacement="mt-6"
                    titre={TITRE_VERDICT}
                  />
                  <ControlesDuDossier dossier={dossier} provenance={provenanceCommune} />
                </>
              }
            >
              <DossierAvecLogement
                project={userProject!}
                address={dossierAddress}
                savedDpe={logementForCommune.selected_dpe_snapshot}
                selectionDpeChangeeLe={logementForCommune.dpe_selection_at}
                permis={logementForCommune.snapshot?.permis ?? null}
                communeFacts={communeResult.moduleFacts}
                communeDossier={dossier}
                logementLink={dossierLogementLink}
                insee={inseeCode}
                scopeKey={`logement:${logementForCommune.id}`}
                // Les contraintes dures, hydratées UNE fois : la section n'en change que le point
                // d'évaluation (l'adresse), elle ne re-résout aucune référence.
                hard={communeResult.hard}
                userId={user.id}
                espacement="mt-6"
                titre={TITRE_VERDICT}
              />
            </Suspense>
          ) : (
            // Dossier de commune seule : la liste complète des contrôles se rend ici aussi, avec
            // son seul groupe « Territoire ». Le verdict y annonce déjà des constats « plus bas »,
            // et cette promesse ne dépend pas de la présence d'une adresse.
            <>
              <DossierDecisionSection
                dossier={dossier}
                logement={dossierLogementLink}
                logementStatus="none"
                insee={inseeCode}
                scopeKey="commune"
                generatedAt={dossierGenereLe}
                provenance={provenanceCommune}
                projetAChange={projetCommuneAChange}
                espacement="mt-6"
                titre={TITRE_VERDICT}
              />
              <ControlesDuDossier dossier={dossier} provenance={provenanceCommune} />
            </>
          )
        ) : null}

        {/* LA LECTURE MANQUE, ET L'ÉCRAN LE DIT (13/08/2026).
            Sur Paris, Lyon et Marseille, l'index n'a pas de ligne pour le code agrégé : le dossier
            valait `null`, et l'écran d'un produit PAYÉ passait de l'adresse au cadrage climat, sans
            verdict, sans titre, sans un mot. `codeDeLectureLocal` ferme le cas ordinaire ; ce bloc
            ferme ce qui reste (aucun droit portant un arrondissement, panne de chargement), en
            disant ce qui manque et ce qui l'ouvre. Il porte le <h1> : la page n'en a jamais zéro. */}
        {fullReport && userProject && !dossier ? (
          <section className="mt-6">
            <h1
              className="font-[var(--weight-display)] text-[length:clamp(23px,2.9vw,36px)] leading-[1.12] tracking-[-0.8px] text-label max-w-[540px]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              La lecture de {displayName} n&apos;a pas pu être établie.
            </h1>
            <p className="text-[16px] leading-[1.7] text-muted mt-4 mb-6">
              Nos données de territoire manquent pour cette commune, ou n&apos;ont pas pu être lues à
              l&apos;instant. Votre accès reste ouvert, et l&apos;incident est enregistré de notre
              côté. Sur Paris, Lyon et Marseille, la lecture se fait au grain de
              l&apos;arrondissement : analyser une adresse précise l&apos;ouvre immédiatement.
            </p>
            <Link
              href="/dossier"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline"
            >
              Analyser une adresse
            </Link>
          </section>
        ) : null}

        {/* LE GESTE DE L'ÉTAT « PROJET NON STRUCTURÉ » SUIT LE TITRE QU'IL ACCOMPAGNE : ce titre est
            porté par le bloc verdict, rendu par le composant streamé juste au-dessus. Le placer dans
            l'en-tête l'aurait fait précéder la phrase à laquelle il répond. */}
        {heroContenu.kind === "verdict" && heroContenu.geste ? (
          <Link
            href={heroContenu.geste.href}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline"
          >
            {heroContenu.geste.label}
          </Link>
        ) : null}

        {/* ── CADRAGE CLIMAT, EN TÊTE UNIQUEMENT QUAND RIEN NE LE PRÉCÈDE ─────────────────
            En NON payant, cette promesse EST le haut de page : elle garde son <h1> et son CTA
            d'achat, et rien ne la double, puisqu'il n'y a ni en-tête de dossier ni section de
            modules ouverte. En payant, elle descend au niveau des modules dont elle est le sujet
            (plus bas), sous la réponse achetée.

            LA BARRE D'HORIZON A QUITTÉ LE HUB (12/08/2026). `useHorizon` n'est consommé que par
            `QuartierSynthesis` et `QuartierClimatData`, donc par le module Territoire. Le clic
            n'était pas sans effet (il persiste la préférence, que Territoire relit), mais RIEN ne
            bougeait sous les yeux du lecteur, et le réglage occupait la place de ce qu'il avait
            acheté. Territoire porte son propre sélecteur inline : le choix n'est pas perdu. Le
            paragraphe ci-dessous ne dit donc plus « Choisissez un horizon », consigne devenue
            impossible à suivre sur cette page. */}
        {heroContenu.kind === "commercial" ? (
          <section className="py-14 lg:py-20">
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Dossier partiel
            </div>
            <h1 className="font-[var(--weight-display)] text-[length:var(--text-display)] leading-[1.08] tracking-[-1.2px] mb-6 text-label" style={{ fontFamily: "var(--font-serif)" }}>
              {displayName} en 2030, 2050, 2100.<br />
              <span className="italic text-accent">Ce que ça change pour vous.</span>
            </h1>
            <p className="text-[17px] leading-[1.72] text-muted mb-9">
              Ce que le changement climatique fait concrètement à votre quotidien ici, à trois
              horizons. Les données s&apos;adaptent quand c&apos;est possible.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "var(--font-sans)" }}>
                Ouvrir le dossier
              </Link>
              <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]">
                Mon compte
              </Link>
            </div>
          </section>
        ) : null}

        <div className="border-t border-[var(--border-1)]" />

        {!communeName && (
          <div className="pt-10">
            <CommuneSetupBanner />
          </div>
        )}

        {/* ── Votre projet : la SEULE surface d'édition du cadrage ──────────────────────────
            L'ÉDITEUR EST UNE DESTINATION. Tout geste qui renvoie au cadrage pointe vers
            `/rapport#projet` : le « modifier » de l'en-tête, le bouton des états sans verdict, et le
            lien du module Territoire. `scroll-mt-24` évite que l'ancre passe sous la navbar, comme
            pour les ancres de cartes du dossier. */}
        <div id={ANCRE_PROJET} className="scroll-mt-24 mt-12">
          <ProjectSummaryCard
            initial={userProject}
            // Le hero porte déjà « Décrire mon projet » dans cet état : la carte n'a pas à répéter
            // le même appel, elle reçoit le geste avec son formulaire ouvert.
            ouvertDemblee={heroContenu.kind === "invite"}
            relation={contexteLecture && inseeCode
              ? {
                  insee: inseeCode, commune: displayName,
                  valeur: contexteLecture.relation,
                  // L'ORIGINE VOYAGE AVEC LA VALEUR. Sans elle, l'écran ne peut pas distinguer une
                  // réponse DÉCLARÉE d'une relation DÉDUITE du domicile, et afficherait une
                  // déduction comme un choix du lecteur.
                  source: contexteLecture.source,
                  residence: territory.residenceCommune ?? null,
                }
              : null}
          />
        </div>

        {/* ── CADRAGE CLIMAT, DESCENDU AU NIVEAU DES MODULES DONT IL EST LE SUJET ────────────
            Il était le plus grand texte de l'écran, au-dessus de la réponse achetée : un cadrage
            sans réponse en tête d'un dossier payé. En <h2>, il ouvre la section des échelles, qu'il
            introduit réellement.

            LE PANNEAU COMPACT DES ÉCHELLES A DISPARU : il répétait le mot « Dossier » que l'en-tête
            porte désormais, et listait les modules quelques centimètres au-dessus de la section
            `#modules`, qui les liste avec plus de contexte. */}
        {heroContenu.kind !== "commercial" ? (
          <section className="mt-14 pt-14 border-t border-[var(--border-1)]">
            <h2 className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.18] tracking-[-0.5px] mb-6 text-label" style={{ fontFamily: "var(--font-serif)" }}>
              {displayName} en 2030, 2050, 2100.<br />
              <span className="italic text-accent">Ce que ça change pour vous.</span>
            </h2>
            {/* Le CTA « Voir mes trois échelles » est tombé avec le déplacement : il pointait vers
                `#modules`, qui commence maintenant quelques lignes plus bas. Un bouton d'ancre vers
                le bloc immédiatement suivant ne fait rien avancer. */}
            <p className="text-[17px] leading-[1.72] text-muted">
              Ce que le changement climatique fait concrètement à votre quotidien ici, à trois
              horizons. Les données s&apos;adaptent quand c&apos;est possible.
            </p>
          </section>
        ) : (
          <div className="border-t border-[var(--border-1)] mt-14" />
        )}

        {/* ── Vue gratuite : la première lecture post-wizard ── */}
        {!fullReport && (
          <section className="pt-14" id="quartier">
            <div className="mb-8 max-w-[640px]">
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Votre première lecture</p>
              <h2 className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
                Ce que vos réponses font déjà ressortir à {displayName}.
              </h2>
            </div>
            <RapportPremiereLecture serverAnswers={serverWizardAnswers} inseeCode={inseeCode} />
          </section>
        )}

        {/* ── Vue payant ── */}
        {fullReport && (
          <section className="pt-14" id="modules">
            <div className="mb-8">
              <h2 className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
                {openModules.length === 1
                  ? `Ce que ${displayName} devient.`
                  : "Trois échelles, de la commune à vos murs."}
              </h2>
              <p className="text-[15px] text-muted leading-[1.7] mt-3">
                {openModules.length === 1
                  ? "La commune en entier : son climat, ses risques, son cadre de vie et ce qui la transforme."
                  : "Elles se lisent dans cet ordre, et chacune peut contredire la précédente : une commune qui tient bien peut abriter un secteur mal desservi, et un secteur agréable un logement qui souffrira de l'été."}
              </p>
            </div>

            {/* LIGNES, PAS CARTES. Trois cartes de verre colorées pour trois liens donnaient au
                sommaire plus de poids visuel qu'au verdict. Le rang porte l'identité, un filet
                sépare, et le badge « Accessible » a disparu : il était identique sur les trois, donc
                il ne distinguait rien (DESIGN.md § 6.3). Ce qui varie réellement, c'est le NOMBRE de
                lignes, et il suit maintenant les droits sur la commune lue. */}
            <div className="flex flex-col">
              {openModules.map((module, i) => {
                const benefit = module.id === "quartier"
                  ? `Chaleur, inondations, érosion côtière. Ce que ${displayName} devient selon l'horizon choisi, données climatiques publiques à l'appui.`
                  : MODULE_BENEFIT[module.id] ?? module.summary;
                const href = hrefModule(module.id);
                return (
                  <article
                    key={module.id}
                    className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-x-5 gap-y-2 items-baseline py-6 border-t border-[var(--border-1)] first:border-t-0"
                  >
                    <span className="font-mono text-[13px] text-ghost tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {/* UN SEUL EMPLOI DU MONO PAR LIGNE, le rang. Le grain était en mono capitales
                        espacées et le bouton aussi : trois voix machine par ligne pour un sommaire de
                        trois liens, ce qui donnait un écran plus froid que dense. Le mono dit une
                        valeur ou un repère de comptage, jamais une phrase. */}
                    <div>
                      <h3 className="font-normal text-[20px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
                        {module.name}
                        <span className="text-muted text-[15px]"> · {MODULE_GRAIN[module.id] ?? module.summary}</span>
                      </h3>
                      <p className="text-[13px] text-muted leading-[1.65] mt-2.5">{benefit}</p>
                    </div>
                    <div className="col-start-2 sm:col-start-3 sm:row-start-1">
                      <TrackedModuleLink
                        href={href}
                        moduleId={module.id}
                        commune={displayName}
                        inseeCode={inseeCode}
                        className="inline-flex items-center gap-2 text-[14px] text-muted hover:text-label no-underline whitespace-nowrap transition-colors"
                      >
                        Ouvrir <span aria-hidden>→</span>
                      </TrackedModuleLink>
                    </div>
                  </article>
                );
              })}
            </div>

            {openModules.length === 1 && (
              <p className="text-[14px] leading-[1.7] text-muted mt-8 pt-6 border-t border-[var(--border-1)]">
                Le secteur autour d&apos;une adresse et le logement lui-même se lisent au grain de
                l&apos;adresse. Ils demandent l&apos;analyse d&apos;un bien précis.
              </p>
            )}
          </section>
        )}

        {/* Footer nav */}
        {/* Le CTA d'achat est gardé par `!fullReport`, comme celui du hero (l. 236-244) qui l'est
            depuis toujours. Ici il ne l'était pas : un lecteur ayant payé ce territoire lisait son
            rapport complet, puis se voyait proposer en pied de page de l'acheter. */}
        <div className="flex items-center gap-3 flex-wrap mt-12 pt-7 border-t border-[var(--border-1)]">
          {!fullReport && (
            <TrackedUpgradeLink href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "var(--font-sans)" }}>
              Ouvrir le dossier
            </TrackedUpgradeLink>
          )}
          <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]">
            Mon compte
          </Link>
          <Link href="/" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2 ml-auto">
            Retour au site
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-[2] border-t border-[var(--border-1)]">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-9 flex items-center justify-between gap-6 flex-wrap">
          <div className="text-label">
            <Logo height={24} />
          </div>
          {/* Même pied de page que la landing, mêmes destinations : voir le commentaire dans
              FutureELanding.tsx. Les deux listes doivent rester alignées. */}
          <div className="flex gap-6 flex-wrap">
            {[
              { label: "Pourquoi futur•e", href: "/pourquoi" },
              { label: "Pages Savoir", href: "/#savoir" },
              { label: "Contact", href: "mailto:hello@futur-e.fr" },
              { label: "Confidentialité", href: "/politique-confidentialite" },
              { label: "Mentions légales", href: "/mentions-legales" },
              { label: "CGV", href: "/conditions-generales-de-vente" },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="font-mono text-[11px] text-ghost no-underline tracking-[0.06em] uppercase">
                {label}
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
