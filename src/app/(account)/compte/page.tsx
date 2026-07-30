import Link from "next/link";
import { deCommune } from "@/lib/typography";
import { signOutAction } from "@/app/auth/actions";
import Navbar from "@/components/Navbar";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";
import {
  canAccessCompleteReport,
  getPlanLabel,
} from "@/lib/access";
import { PRODUCT_MODULES, MODULE_HREF } from "@/lib/product";
import { resolveActiveTerritory, TERRITORY_SELECT, canAccessTerritory } from "@/lib/active-territory";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { WizardAnswersSync } from "@/components/wizard/WizardAnswersSync";
import { hasWizardContent, type WizardAnswers } from "@/components/wizard/types";

// Les emoji d'icône ont été retirés le 30/07/2026, sans substitution : ils sont interdits
// (doctrine/editoriale.md) et l'identité d'une échelle est son rang, son nom et son grain
// (DESIGN.md § 7). Le rang, en mono tabulaire, prend leur place.

// Le bénéfice dit ce que le module TRANCHE, pas ce qu'il contient.
const MODULE_BENEFIT: Record<string, string> = {
  quartier: "Ce qui structure la vie dans cette commune et ce qui la transforme : services, population, espaces naturels, trajectoire du climat. La lecture d'ensemble avant tout le reste.",
  autour: "Ce qui se trouve à proximité et ce qui varie d'un secteur à l'autre : commerces, école, gare, espace vert, chaleur du quartier, place de la voiture.",
  logement: "Ce que son diagnostic établit, ce à quoi son adresse l'expose, et ce qu'il reste à demander avant de signer : la lecture se termine par ce qu'il faut vérifier.",
};

export default async function ComptePage() {
  const account = await getCurrentUserAccount();
  const fullAccess = canAccessCompleteReport(account);
  // Doctrine 2026-06-11 : le gratuit n'ouvre plus aucun module (Territoire compris).
  // Les trois modules sont premium ; le gratuit garde la mini-analyse post-wizard.
  const LOCKED_MODULES = PRODUCT_MODULES;

  const { supabase, user } = await requireCurrentUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select(`${TERRITORY_SELECT}, wizard_answers`)
    .eq("user_id", user.id)
    .maybeSingle();

  // DEUX QUESTIONS, ET LES CONFONDRE FAISAIT MENTIR CET ÉCRAN. `fullAccess` dit l'état du PLAN :
  // ce compte a-t-il payé quelque chose. `scalesOpen` dit si les trois échelles sont réellement
  // ouvertes ICI, sur le territoire que le rapport va lire. Depuis que le droit est communal, un
  // compte payant peut n'avoir aucune commune ouverte : /compte annonçait « Trois échelles, toutes
  // ouvertes » pendant que /rapport servait le partiel. Les deux écrans posent désormais la même
  // question au même endroit.
  const territory = resolveActiveTerritory(profile);
  const scalesOpen = fullAccess && (await canAccessTerritory(supabase, user.id, territory.inseeCode));

  // La commune NOMMÉE ici est celle que le rapport va lire, pas la résidence : les deux écrans
  // doivent parler du même lieu. Sans territoire actif, les deux coïncident.
  const commune = territory.communeName ?? null;
  const serverWizardAnswers = (profile?.wizard_answers ?? null) as WizardAnswers | null;

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      {/* Orbs */}
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-accent/[0.12] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-amethyst/[0.10] blur-[88px] opacity-30 pointer-events-none z-0" />

      <Navbar ctas={{ secondary: { href: "/rapport/dossiers", label: "Mes biens" }, primary: fullAccess ? { href: "/rapport", label: "Mon rapport" } : { href: "/#pricing", label: "Passer au complet" } }} />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24">

        {/* Persiste les réponses du wizard (sessionStorage → profil) si elles
            ne sont pas déjà en base : rend la première lecture retrouvable. */}
        <WizardAnswersSync hasServerAnswers={hasWizardContent(serverWizardAnswers)} />

        {!commune && <div className="pt-10"><CommuneSetupBanner /></div>}

        {/* ── Hero ── */}
        <section className="grid grid-cols-[1fr_380px] gap-14 items-start py-20">
          <div>
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)] shrink-0" />
              {fullAccess ? getPlanLabel(account.plan) : "Compte gratuit"}
            </div>
            <h1
              className="font-normal text-[clamp(34px,3.8vw,52px)] leading-[1.1] tracking-[-1.2px] mb-5 text-label"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {commune ? `Votre lecture ${deCommune(commune)}` : "Votre espace personnel"}<br />
              <span className="italic text-accent">{fullAccess ? "de la commune aux murs." : "ne disparaît plus."}</span>
            </h1>
            <p className="text-[17px] leading-[1.72] text-muted mb-8 max-w-[480px]">
              {scalesOpen
                ? "Le rapport interactif est ici. Trois échelles, toutes ouvertes : la commune, le secteur, le logement."
                : fullAccess
                  ? "Votre accès est actif. Ouvrez le bien ou la commune que vous voulez lire : les trois échelles suivent le lieu que vous désignez."
                  : "Votre première lecture personnalisée est sauvegardée ici, sans limite de temps. Le rapport interactif, lui, ouvre les trois échelles."}
            </p>
            <div className="flex gap-2 flex-wrap mb-7">
              <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-[11px] text-ghost">
                {getPlanLabel(account.plan)}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-[11px] text-ghost">
                {account.email}
              </span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/rapport" prefetch={false} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                {fullAccess ? "Voir mes modules" : "Reprendre ma première lecture"}
              </Link>
              {!fullAccess && (
                <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                  Passer au complet
                </Link>
              )}
            </div>
          </div>

          <aside className="glass rounded-2xl p-7 relative overflow-hidden">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-1">
              {fullAccess ? "Votre accès" : "Ce que le compte gratuit garde"}
            </p>
            <h2 className="font-normal text-[20px] leading-[1.2] text-label mb-5 tracking-[-0.2px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {scalesOpen
                ? "Trois échelles, toutes ouvertes."
                : fullAccess
                  ? "Trois échelles, sur le lieu que vous ouvrez."
                  : "Votre première lecture, retrouvable."}
            </h2>
            <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-white/[0.08] mb-5">
              {(scalesOpen
                ? [{ val: "3", label: "modules ouverts" }, { val: "∞", label: "questions Futur•e" }, { val: "∞", label: "mises à jour" }]
                : fullAccess
                  ? [{ val: "3", label: "échelles par lieu" }, { val: "∞", label: "questions Futur•e" }, { val: "∞", label: "mises à jour" }]
                  : [{ val: "1", label: "ville de référence" }, { val: "1", label: "lecture personnalisée" }, { val: "∞", label: "retrouvable" }]
              ).map((m, i) => (
                <div key={m.label} className={`px-3 py-3.5 text-center ${i < 2 ? "border-r border-white/[0.08]" : ""}`}>
                  <span className="block text-[26px] text-accent leading-none mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>{m.val}</span>
                  <span className="block font-mono text-[9px] tracking-[0.08em] text-ghost uppercase leading-[1.4]">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[14px] leading-[1.7] text-muted">
              {scalesOpen
                ? "Tous les modules sont accessibles depuis le hub rapport interactif. Futur•e répond à vos questions en tenant compte de votre commune et de votre profil."
                : fullAccess
                  ? "Les modules s'ouvrent sur le lieu que vous désignez : un bien que vous avez analysé, ou une commune que vous avez débloquée. Vos dossiers restent dans votre compte."
                  : "Le compte garde votre première lecture et votre commune de référence, pour y revenir sans repasser par le questionnaire."}
            </p>
          </aside>
        </section>

        <div className="border-t border-white/[0.08]" />

        {/* ── Ce que le compte garde (free) / Modules ouverts (paid) ── */}
        <section className="pt-14">
          {fullAccess ? (
            <>
              <div className="grid grid-cols-[1fr_300px] gap-10 items-end mb-8">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Vos trois modules</p>
                  <h2 className="font-normal text-[clamp(22px,2.6vw,32px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    De la commune jusqu&apos;à vos murs.
                  </h2>
                </div>
                <p className="text-[15px] text-muted leading-[1.65]">
                  {commune ? `Données disponibles pour ${commune}.` : "Renseignez votre commune pour activer les données locales."}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* Les trois s'ouvrent. Plus aucune carte ne s'annonce pour finir sur un tiret :
                    une grille où deux cartes sur six menaient quelque part était une promesse
                    d'inventaire, pas un sommaire. */}
                {PRODUCT_MODULES.map((module, i) => (
                  <Link
                    key={module.id}
                    href={MODULE_HREF[module.id]}
                    className="glass rounded-xl p-5 no-underline block"
                  >
                    <p className="font-mono text-[13px] text-ghost tabular-nums mb-2">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="font-normal text-[18px] text-label mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>{module.name}</h3>
                    <p className="text-[12px] text-muted leading-[1.6] mb-3">{MODULE_BENEFIT[module.id] ?? module.summary}</p>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-accent bg-accent/[0.06] border border-accent/[0.2] rounded-full px-2 py-1">
                      Ouvrir
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_300px] gap-10 items-end mb-8">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Dans votre accès gratuit</p>
                  <h2 className="font-normal text-[clamp(22px,2.6vw,32px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    Ce que ce compte garde pour vous.
                  </h2>
                </div>
                <p className="text-[15px] text-muted leading-[1.65]">
                  Pas un espace vide en attente de paiement. Un point de départ qui reste utile.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { accent: "border-t-accent", title: "Votre première lecture sauvegardée", copy: `Vous retrouvez votre lecture personnalisée${commune ? ` sur ${commune}` : ""} sans repasser par le questionnaire.` },
                  { accent: "border-t-info", title: "Votre questionnaire conservé", copy: "Vos réponses restent prêtes à nourrir le rapport interactif quand vous déciderez d'aller plus loin." },
                ].map((k) => (
                  <article key={k.title} className={`glass rounded-xl p-5 border-t-2 ${k.accent}`}>
                    <h3 className="font-normal text-[17px] text-label mb-2.5 leading-[1.3]" style={{ fontFamily: "'Instrument Serif', serif" }}>{k.title}</h3>
                    <p className="text-[14px] text-muted leading-[1.65]">{k.copy}</p>
                  </article>
                ))}
              </div>

              {/* ── Modules fermés ── */}
              <div className="pt-14">
                <div className="grid grid-cols-[1fr_300px] gap-10 items-end mb-8">
                  <div>
                    <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Trois échelles fermées</p>
                    <h2 className="font-normal text-[clamp(22px,2.6vw,32px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      Ce que le rapport interactif lit pour vous.
                    </h2>
                  </div>
                  <p className="text-[15px] text-muted leading-[1.65]">
                    {commune ? `Chaque module croise votre profil avec les données disponibles pour ${commune}.` : "Chaque module croise votre profil avec les données disponibles pour votre commune."}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {LOCKED_MODULES.map((module, i) => (
                    <article key={module.id} className="glass rounded-xl p-5 opacity-50">
                      <p className="font-mono text-[13px] text-ghost tabular-nums mb-2">{String(i + 1).padStart(2, "0")}</p>
                      <h3 className="font-normal text-[18px] text-muted mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>{module.name}</h3>
                      <p className="text-[12px] text-ghost leading-[1.6] mb-3">{MODULE_BENEFIT[module.id] ?? module.summary}</p>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-ghost bg-white/[0.03] border border-white/[0.08] rounded-full px-2 py-1">
                        Fermé
                      </span>
                    </article>
                  ))}
                </div>

                {/* Upgrade band */}
                <div className="glass rounded-2xl p-10 border-accent/[0.12] grid grid-cols-[1fr_180px] gap-12 items-center mt-10 relative overflow-hidden">
                  <div className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] rounded-full bg-accent/[0.08] pointer-events-none" />
                  <div>
                    <h2 className="font-normal text-[clamp(20px,2.2vw,26px)] leading-[1.2] tracking-[-0.4px] text-label mb-2.5" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      {commune ? `Trois échelles de lecture à ${commune}. Sourcées. Personnalisées.` : "Trois échelles de lecture. Sourcées. Personnalisées."}
                    </h2>
                    <p className="text-[15px] text-muted leading-[1.7]">
                      Le rapport interactif ne produit pas un score. Il garde les échelles distinctes, parce qu&apos;une bonne commune ne fait pas un bon quartier, ni un bon quartier un bon logement.
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="block text-[44px] text-label leading-none tracking-[-1.5px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      14<span className="text-[20px] text-ghost ml-0.5">€</span>
                    </span>
                    <span className="block font-mono text-[10px] text-ghost tracking-[0.04em] mt-1 mb-4">une fois</span>
                    <Link href="/#pricing" className="flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[13px] no-underline w-full" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                      Voir les formules
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Footer nav */}
        <div className="flex items-center gap-3 flex-wrap mt-12 pt-7 border-t border-white/[0.08]">
          <Link href="/rapport" prefetch={false} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
            Lire mon rapport interactif
          </Link>
          {fullAccess && (
            <Link href="/rapport/dossiers" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
              Mes biens analysés
            </Link>
          )}
          <Link href="/compte/memoire" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2">
            Ma mémoire futur•e
          </Link>
          <Link href="/" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2">
            Retour au site
          </Link>
          <form action={signOutAction} className="ml-auto">
            <button type="submit" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost bg-transparent border-none cursor-pointer py-2">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-[2] border-t border-white/[0.08]">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-8 flex items-center justify-between gap-6 flex-wrap">
          <div className="text-[20px] italic text-label tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
            futur<span className="text-accent not-italic">•</span>e
          </div>
          <div className="flex gap-5 flex-wrap">
            {[
              { label: "Pourquoi futur•e", href: "/pourquoi" },
              { label: "Pages Savoir", href: "/savoir/cadmium" },
              { label: "Tarifs", href: "/#pricing" },
              { label: "Contact", href: "mailto:hello@futur-e.fr" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="font-mono text-[11px] text-ghost no-underline tracking-[0.06em] uppercase">
                {l.label}
              </Link>
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
