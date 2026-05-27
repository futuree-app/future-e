import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { AccountNav } from "@/components/AccountNav";
import { CommuneSetupBanner } from "@/components/CommuneSetupBanner";
import {
  canAccessCompleteReport,
  canAccessDashboard,
  canAccessInteractiveDashboard,
  getPlanLabel,
} from "@/lib/access";
import { PRODUCT_MODULES } from "@/lib/product";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";

const MODULE_ICONS: Record<string, string> = {
  quartier: "🏘", logement: "🏠", metier: "💼",
  sante: "🫁", mobilite: "🚗", projets: "🗓",
};

const MODULE_BENEFIT: Record<string, string> = {
  logement: "Votre logement vaut-il encore ce que vous pensez en 2040 ? DPE, assurance, risques physiques par adresse.",
  metier: "Ce que le changement climatique fait à votre secteur. Certains métiers se fragilisent. D'autres gagnent en importance.",
  sante: "Cadmium, pollens, chaleur, qualité de l'air. Ce que votre environnement fait à votre corps, données à l'appui.",
  mobilite: "Votre dépendance à la voiture est-elle une fragilité ? Une lecture honnête du territoire.",
  projets: "Achat, déménagement, retraite. Est-ce que vos projets sont cohérents avec ce que ce lieu va devenir ?",
};

export default async function ComptePage() {
  const account = await getCurrentUserAccount();
  const hasDashboard = canAccessDashboard(account);
  const isInteractive = canAccessInteractiveDashboard(account);
  const fullAccess = canAccessCompleteReport(account);
  const LOCKED_MODULES = PRODUCT_MODULES.filter((m) => m.id !== "quartier");

  const { supabase, user } = await requireCurrentUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("home_commune, home_insee_code")
    .eq("user_id", user.id)
    .maybeSingle();

  const commune = profile?.home_commune ?? null;

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      {/* Orbs */}
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-accent/[0.12] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-amethyst/[0.10] blur-[88px] opacity-30 pointer-events-none z-0" />

      <AccountNav
        secondaryCta={{ href: "/rapport", label: "Mon rapport" }}
        primaryCta={fullAccess ? { href: "/dashboard", label: "Dashboard" } : { href: "/#pricing", label: "Passer au complet" }}
      />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">

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
              {commune ? `Votre lecture de ${commune}` : "Votre espace personnel"}<br />
              <span className="italic text-accent">{fullAccess ? "module par module." : "ne disparaît plus."}</span>
            </h1>
            <p className="text-[17px] leading-[1.72] text-muted mb-8 max-w-[480px]">
              {fullAccess
                ? "Le rapport complet est ici. Six dimensions, toutes ouvertes. Commencez par le module de votre choix."
                : "Le rapport partiel est sauvegardé ici, sans limite de temps. Vous pouvez y revenir, le compléter, le partager."}
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
              <Link href="/rapport" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                {fullAccess ? "Voir mes modules" : "Lire mon rapport"}
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
              {fullAccess ? "Votre abonnement" : "Ce que le compte gratuit garde"}
            </p>
            <h2 className="font-normal text-[20px] leading-[1.2] text-label mb-5 tracking-[-0.2px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {fullAccess ? "Six dimensions, toutes ouvertes." : "Un fil continu, pas un faux dashboard."}
            </h2>
            <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-white/[0.08] mb-5">
              {(fullAccess
                ? [{ val: "6", label: "modules ouverts" }, { val: "∞", label: "questions Futur·e" }, { val: "∞", label: "mises à jour" }]
                : [{ val: "1", label: "ville de référence" }, { val: "2", label: "dimensions ouvertes" }, { val: "∞", label: "lecture retrouvable" }]
              ).map((m, i) => (
                <div key={m.label} className={`px-3 py-3.5 text-center ${i < 2 ? "border-r border-white/[0.08]" : ""}`}>
                  <span className="block text-[26px] text-accent leading-none mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>{m.val}</span>
                  <span className="block font-mono text-[9px] tracking-[0.08em] text-ghost uppercase leading-[1.4]">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[14px] leading-[1.7] text-muted">
              {fullAccess
                ? "Tous les modules sont accessibles depuis le hub rapport. Futur·e répond à vos questions en tenant compte de votre commune et de votre profil."
                : "Le compte sauvegarde votre rapport, fournit un lien de partage permanent et peut signaler une mise à jour si les données changent pour votre commune."}
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
                  <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Vos six modules</p>
                  <h2 className="font-normal text-[clamp(22px,2.6vw,32px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    Chaque dimension de votre vie ici.
                  </h2>
                </div>
                <p className="text-[15px] text-muted leading-[1.65]">
                  {commune ? `Données disponibles pour ${commune}.` : "Renseignez votre commune pour activer les données locales."}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {PRODUCT_MODULES.map((module, i) => (
                  <Link
                    key={module.id}
                    href={module.id === "quartier" || module.id === "logement" ? `/rapport/${module.id}` : "/rapport"}
                    className="glass rounded-xl p-5 no-underline block"
                  >
                    <div className="w-[30px] h-[30px] rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[15px] mb-3">
                      {MODULE_ICONS[module.id]}
                    </div>
                    <p className="font-mono text-[10px] tracking-[0.1em] text-ghost mb-0.5 uppercase">Module 0{i + 1}</p>
                    <h3 className="font-normal text-[18px] text-label mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>{module.name}</h3>
                    <p className="text-[12px] text-muted leading-[1.6] mb-3">{MODULE_BENEFIT[module.id] ?? module.summary}</p>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase text-accent bg-accent/[0.06] border border-accent/[0.2] rounded-full px-2 py-1">
                      {module.id === "quartier" || module.id === "logement" ? "Ouvrir" : "Bientôt"}
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
                    Trois choses concrètes que ce compte vous donne.
                  </h2>
                </div>
                <p className="text-[15px] text-muted leading-[1.65]">
                  Pas un espace vide en attente de paiement. Un point de départ qui reste utile.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3.5">
                {[
                  { accent: "border-t-accent", title: "Rapport sauvegardé sans limite", copy: "Vous retrouvez la synthèse globale et le module Quartier sans repasser par la landing." },
                  { accent: "border-t-info", title: "Lien de partage permanent", copy: `Partagez une lecture datée et sourcée${commune ? ` sur ${commune}` : ""}, sans lien qui expire.` },
                  { accent: "border-t-amethyst", title: "Une alerte si les données changent", copy: "Si une donnée significative évolue pour votre commune, le compte gratuit peut en donner le signal." },
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
                    <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Cinq dimensions fermées</p>
                    <h2 className="font-normal text-[clamp(22px,2.6vw,32px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      Ce que le rapport complet lit pour vous.
                    </h2>
                  </div>
                  <p className="text-[15px] text-muted leading-[1.65]">
                    {commune ? `Chaque module croise votre profil avec les données disponibles pour ${commune}.` : "Chaque module croise votre profil avec les données disponibles pour votre commune."}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {LOCKED_MODULES.map((module, i) => (
                    <article key={module.id} className="glass rounded-xl p-5 opacity-50">
                      <div className="w-[30px] h-[30px] rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[15px] mb-3 grayscale">
                        {MODULE_ICONS[module.id]}
                      </div>
                      <p className="font-mono text-[10px] tracking-[0.1em] text-ghost mb-0.5 uppercase">Module 0{i + 2}</p>
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
                      {commune ? `Six lectures de votre vie à ${commune}. Sourcées. Personnalisées.` : "Six lectures de votre vie. Sourcées. Personnalisées."}
                    </h2>
                    <p className="text-[15px] text-muted leading-[1.7]">
                      Le rapport complet ne produit pas un score. Il garde les dimensions distinctes pour que vos arbitrages restent les vôtres.
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="block text-[44px] text-label leading-none tracking-[-1.5px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      14<span className="text-[20px] text-ghost ml-0.5">€</span>
                    </span>
                    <span className="block font-mono text-[10px] text-ghost tracking-[0.04em] mt-1 mb-4">une fois · Suivi 9 €/mois prochainement</span>
                    <Link href="/#pricing" className="flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[13px] no-underline w-full" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                      Voir les formules
                    </Link>
                    <p className="mt-2.5 font-mono text-[10px] text-ghost tracking-[0.04em] text-center leading-[1.6]">
                      Les 14 € seront déductibles à l&apos;ouverture du Suivi.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Footer nav */}
        <div className="flex items-center gap-3 flex-wrap mt-12 pt-7 border-t border-white/[0.08]">
          <Link href="/rapport" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
            Lire mon rapport
          </Link>
          {hasDashboard && (
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
              {isInteractive ? "Dashboard interactif" : "Dashboard"}
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
        <div className="max-w-[1100px] mx-auto px-7 py-8 flex items-center justify-between gap-6 flex-wrap">
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
