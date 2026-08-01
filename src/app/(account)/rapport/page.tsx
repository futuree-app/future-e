export const dynamic = "force-dynamic";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PRODUCT_MODULES, MODULE_HREF } from "@/lib/product";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { resolveReadableTerritory, TERRITORY_SELECT, canAccessTerritory } from "@/lib/active-territory";
import { TrackedModuleLink, TrackedUpgradeLink } from "./RapportTrackedLinks";
import HorizonBar from "@/components/report/HorizonBar";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";
import { RapportPremiereLecture } from "@/components/wizard/RapportPremiereLecture";
import { WizardAnswersSync } from "@/components/wizard/WizardAnswersSync";
import { OuVivreProjectSync } from "@/components/OuVivreProjectSync";
import { ProjectSummaryCard } from "@/components/report/ProjectSummaryCard";
import { normalizeUserProject } from "@/lib/user-project";
import { Suspense } from "react";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { ControlesDuDossier } from "@/components/report/ControlesDuDossier";
import { DossierAvecLogement } from "@/components/report/DossierAvecLogement";
import { listDossiers } from "@/lib/address-dossier-store";
import { communeParent } from "@/lib/plm";
import type { ResolvedAddress } from "@/lib/server/logement-decision-data";
import { hasWizardContent, type WizardAnswers } from "@/components/wizard/types";

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

const MODULE_BENEFIT: Record<string, string> = {
  autour: "Commerces, école, gare, espace vert, chaleur du quartier, place de la voiture. Ce qui se mesure autour du point, et pas à l'échelle de la commune.",
  logement: "Diagnostic, confort d'été, sol de la parcelle, sinistres indemnisés. Et, pour finir, ce qu'il reste à demander avant de décider.",
};

export default async function RapportPage() {
  const account = await getCurrentUserAccount();

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

  // La complétude se demande À LA COMMUNE, plus à un flag de plan.
  //
  // `canAccessCompleteReport(account)` était global : il ne disait pas QUELLE commune était payée.
  // Combiné à `resolveReadableTerritory`, qui ne contrôlait rien sur la résidence, un achat
  // quelconque ouvrait le Territoire complet de la commune de résidence, jamais achetée.
  //
  // Faux ne ferme rien : le rapport PARTIEL reste rendu, exactement comme aujourd'hui pour un
  // compte gratuit. C'est la dizaine de branches ci-dessous qui s'en chargent.
  const fullReport = await canAccessTerritory(supabase, user.id, inseeCode);

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
  const logementForCommune =
    fullReport && inseeCode
      ? (dossiers.find((d) => communeParent(d.insee) === communeParent(inseeCode)) ?? null)
      : null;
  // Les biens qui ouvrent une AUTRE commune que celle lue : c'est exactement ce que le lecteur
  // cherche quand l'écran lui sert un rapport partiel. Une entrée par commune, pas par bien : deux
  // appartements du même immeuble mènent au même territoire.
  const dossiersAilleurs = inseeCode
    ? dossiers.filter((d) => communeParent(d.insee) !== communeParent(inseeCode))
    : dossiers;
  const communesAilleurs = [...new Map(dossiersAilleurs.map((d) => [communeParent(d.insee), d])).values()];
  const communeResult =
    fullReport && inseeCode && userProject
      ? await buildCommuneDossier(inseeCode, userProject, { hasAddress: Boolean(logementForCommune) })
      : null;
  const dossier = communeResult?.dossier ?? null;
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

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Orbs */}
      <div className="fixed top-[-160px] left-[-130px] w-[540px] h-[540px] rounded-full bg-accent/[0.14] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[420px] h-[420px] rounded-full bg-amethyst/[0.12] blur-[90px] opacity-28 pointer-events-none z-0" />
      <div className="fixed top-[42%] left-[58%] w-[280px] h-[280px] rounded-full bg-info/[0.08] blur-[70px] opacity-16 pointer-events-none z-0" />

      <Navbar ctas={{ secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/rapport/dossiers", label: "Mes biens" } }} />

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
            {/* <a> : /rapport/residence est une Route Handler, et un <Link> vers une Route Handler
                ne navigue pas (le router attend du RSC, reçoit une redirection vers du HTML, et
                abandonne). Ce bouton était donc inerte AVANT cette session, le même défaut que
                « Ouvrir {commune} » plus bas a rendu visible le 30/07/2026. */}
            <a
              href="/rapport/residence"
              className="shrink-0 font-mono text-[11px] tracking-[0.08em] uppercase text-muted hover:text-label no-underline border border-[var(--border-2)] rounded-lg px-3.5 py-2"
            >
              {territory.residenceCommune
                ? `Revenir à ${territory.residenceCommune}`
                : "Revenir à ma résidence"}
            </a>
          </div>
        )}

        {/* ── Bandeau : des biens analysés ouvrent une autre commune ──
            La porte qui manquait. Posséder un dossier ouvre les trois échelles de SA commune, mais
            rien ne le disait ni ne permettait d'y aller : le territoire lu restait la résidence,
            l'écran servait le partiel, et le lecteur n'avait aucun moyen de savoir que Nantes lui
            était ouverte.

            <a> et pas <Link> : la cible est une Route Handler, et un <Link> vers une Route Handler
            ne navigue pas. Voir le commentaire du bandeau au-dessus. */}
        {communesAilleurs.length > 0 && (
          <div className="mt-6 rounded-xl border border-[var(--border-2)] bg-[var(--bg-elev)] px-5 py-4">
            <p className="text-[14px] text-label leading-snug mb-3">
              {communesAilleurs.length === 1
                ? "Vous avez analysé un bien dans une autre commune, et elle vous est ouverte en entier."
                : "Vous avez analysé des biens dans d'autres communes, et elles vous sont ouvertes en entier."}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {communesAilleurs.map((d) => (
                <a
                  key={d.id}
                  href={`/rapport/dossiers/ouvrir?id=${encodeURIComponent(d.id)}&vers=territoire`}
                  className="font-mono text-[11px] tracking-[0.08em] uppercase text-accent hover:text-label no-underline border border-accent/[0.3] rounded-lg px-3.5 py-2"
                >
                  Ouvrir {d.city ?? d.address_label}
                </a>
              ))}
              <Link
                href="/rapport/dossiers"
                className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted hover:text-label no-underline border border-[var(--border-2)] rounded-lg px-3.5 py-2"
              >
                Tous mes biens
              </Link>
            </div>
          </div>
        )}

        {/* ── Hero ── */}
        {/* La colonne de 400 px n'existe qu'à partir de `lg`. En dessous, le hub des modules passe
            sous le titre au lieu d'écraser la colonne de lecture à ~200 px. */}
        <section className={fullReport ? "grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-start py-14 lg:py-20" : "py-14 lg:py-20"}>
          <div>
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              {fullReport ? "Rapport interactif" : "Rapport interactif partiel"}
            </div>

            <>
              <h1 className="font-normal text-[length:var(--text-display)] leading-[1.08] tracking-[-1.2px] mb-6 text-label" style={{ fontFamily: "var(--font-serif)" }}>
                {displayName} en 2030, 2050, 2100.<br />
                <span className="italic text-accent">Ce que ça change pour vous.</span>
              </h1>
              {/* « Six angles » a été retiré le 30/07/2026. Le hero annonçait six angles, la section
                  suivante trois échelles, et les cartes « Module 01 » : trois décomptes pour un
                  seul produit. Le rang porte désormais l'identité des échelles, donc il doit être
                  juste. La phrase parle du lieu et de l'horizon, sans compter quoi que ce soit. */}
              <p className="text-[17px] leading-[1.72] text-muted mb-9 max-w-[500px]">
                Ce que le changement climatique fait concrètement à votre quotidien ici. Choisissez un horizon. Les données s&apos;adaptent quand c&apos;est possible.
              </p>
              <div className="flex gap-3 flex-wrap">
                {fullReport ? (
                  /* CTA neutre, et c'est une règle : dans le rapport, l'orange est le registre
                     « compromis » du dossier de décision. Un bouton de navigation qui le porte ferait
                     dire deux choses à la même teinte sur le même écran (DESIGN.md § 5.4). */
                  <Link href="#modules" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-3)] text-label font-semibold text-[14px] no-underline border border-[var(--border-2)] hover:bg-[var(--bg-elev-3)] transition-colors" style={{ fontFamily: "var(--font-sans)" }}>
                    {openModules.length === 1 ? "Lire le territoire" : "Voir mes trois échelles"}
                  </Link>
                ) : (
                  <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "var(--font-sans)" }}>
                    Ouvrir le rapport interactif
                  </Link>
                )}
                <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]">
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
                {openModules.length === 1 ? "1 échelle ouverte" : `${openModules.length} échelles ouvertes`}
              </p>
              <h2 className="font-normal text-[22px] leading-[1.2] text-label mb-5 tracking-[-0.3px]" style={{ fontFamily: "var(--font-serif)" }}>
                Rapport interactif · {displayName}
              </h2>
              {/* SOMMAIRE NUMÉROTÉ, NEUTRE. Chaque ligne mène quelque part, et le rang porte
                  l'identité de l'échelle à la place de la couleur et de l'emoji retirés. */}
              <div className="flex flex-col">
                {openModules.map((m, i) => (
                  <TrackedModuleLink
                    key={m.id}
                    href={MODULE_HREF[m.id]}
                    moduleId={m.id}
                    commune={displayName}
                    inseeCode={inseeCode}
                    className="flex items-baseline gap-3.5 py-3 no-underline border-t border-[var(--border-1)] first:border-t-0 group"
                  >
                    <span className="font-mono text-[11px] text-ghost tabular-nums shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] text-label font-medium">{m.name}</span>
                    <span className="ml-auto text-[13px] text-ghost group-hover:text-label transition-colors shrink-0">
                      Ouvrir <span aria-hidden>→</span>
                    </span>
                  </TrackedModuleLink>
                ))}
              </div>
              {/* Une seule phrase quand les deux échelles fines ne sont pas ouvertes, à la place de
                  deux fausses lignes verrouillées qui feraient passer un produit payé pour un
                  produit incomplet. */}
              {openModules.length === 1 && (
                <p className="text-[13px] leading-[1.6] text-muted mt-4 pt-4 border-t border-[var(--border-1)]">
                  Le secteur autour d&apos;une adresse et le logement lui-même demandent l&apos;analyse
                  d&apos;une adresse précise.
                </p>
              )}
            </aside>
          )}
        </section>

        <div className="border-t border-[var(--border-1)]" />

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

        {/* ── Votre projet : Section 1 « ce que nous avons compris », éditable ── */}
        <div className="mt-12">
          <ProjectSummaryCard initial={userProject} />
        </div>

        {/* ── En une minute : le dossier de décision (payant, grain commune) ── */}
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
                  />
                  <ControlesDuDossier dossier={dossier} />
                </>
              }
            >
              <DossierAvecLogement
                project={userProject!}
                address={dossierAddress}
                savedDpe={logementForCommune.selected_dpe_snapshot}
                communeFacts={communeResult.moduleFacts}
                communeDossier={dossier}
                logementLink={dossierLogementLink}
                insee={inseeCode}
                scopeKey={`logement:${logementForCommune.id}`}
                // Les contraintes dures, hydratées UNE fois : la section n'en change que le point
                // d'évaluation (l'adresse), elle ne re-résout aucune référence.
                hard={communeResult.hard}
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
              />
              <ControlesDuDossier dossier={dossier} />
            </>
          )
        ) : null}

        <div className="border-t border-[var(--border-1)] mt-14" />

        {/* ── Vue gratuite : la première lecture post-wizard ── */}
        {!fullReport && (
          <section className="pt-14" id="quartier">
            <div className="mb-8 max-w-[640px]">
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Votre première lecture</p>
              <h2 className="font-normal text-[length:var(--text-title)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
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
              <h2 className="font-normal text-[length:var(--text-title)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
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
                const href = MODULE_HREF[module.id];
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
              Ouvrir le rapport interactif
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
          <div className="text-[20px] italic text-label tracking-[-0.3px]" style={{ fontFamily: "var(--font-serif)" }}>
            futur<span className="text-accent not-italic">•</span>e
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
