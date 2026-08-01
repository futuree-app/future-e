import Link from "next/link";
import Navbar from "@/components/Navbar";
import { MemoireForm } from "@/components/MemoireForm";
import { requireCurrentUser } from "@/lib/user-account";

export const dynamic = "force-dynamic";

export default async function MemoirePage() {
  const { supabase, user } = await requireCurrentUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(
      [
        "home_insee_code",
        "home_commune",
        "age_band",
        "housing_status",
        "housing_type",
        "job_category",
        "mobility_profile",
        "logement_chauffage",
        "logement_isolation",
        "presence_enfants",
        "age_enfants",
        "travail_exterieur",
        "vehicule_type",
        "health_flags",
        "life_projects",
      ].join(", "),
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const safeProfile = (profile ?? {}) as Record<string, unknown>;

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-accent/[0.10] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-amethyst/[0.08] blur-[88px] opacity-30 pointer-events-none z-0" />

      <Navbar ctas={{ secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/rapport", label: "Mon rapport" } }} />

      <div className="relative z-[2] max-w-[860px] mx-auto px-7 pb-24">
        <section className="py-16">
          <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)] shrink-0" />
            Mémoire
          </div>
          <h1
            className="font-normal text-[length:var(--text-display)] leading-[1.1] tracking-[-1px] mb-5 text-label"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Ce que futur<span className="text-accent not-italic">•</span>e sait de vous.
          </h1>
          <p className="text-[16px] leading-[1.72] text-muted">
            Ces informations servent uniquement à personnaliser les réponses de
            futur<span className="text-accent not-italic">•</span>e. Vous pouvez les modifier ou les
            supprimer à tout moment. Elles ne sont jamais partagées avec des tiers.
          </p>
        </section>

        {/* CHANGER SA COMMUNE N'EST PLUS RÉSERVÉ. Ce geste était gardé par les plans `suivi` et
            `foyer`, retirés le 30/07/2026, et cette garde ne protégeait rien : /api/profile écrit
            `field=commune` sans regarder le plan, donc un appel direct passait déjà. Elle n'a plus
            d'objet non plus : depuis que le droit est territorial, la résidence n'ouvre aucun
            rapport par elle-même, changer de commune ne déplace donc aucun accès. */}
        <MemoireForm profile={safeProfile} />

        <div className="mt-10 pt-7 border-t border-[var(--border-1)] flex items-center gap-4 flex-wrap">
          <Link
            href="/compte"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[13px] no-underline border border-[var(--border-1)]"
          >
            Retour au compte
          </Link>
          <Link
            href="/rapport"
            className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2"
          >
            Lire mon rapport interactif
          </Link>
        </div>
      </div>
    </div>
  );
}
