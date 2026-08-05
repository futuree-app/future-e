import Link from "next/link";
import { Logo } from "@/components/Logo";

type Cta = { href: string; label: string };

export function AccountNav({
  secondaryCta,
  primaryCta,
}: {
  secondaryCta: Cta;
  primaryCta: Cta;
}) {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-[var(--border-1)]"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: "rgba(6,8,18,0.72)",
      }}
    >
      <div className="max-w-[1100px] mx-auto px-7 h-16 flex items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="futur•e, accueil"
          className="no-underline flex items-center"
          style={{ color: "var(--fg-1)" }}
        >
          <Logo height={26} title={null} />
        </Link>

        <div className="flex items-center gap-8">
          {[
            { label: "Le produit", href: "/" },
            { label: "Pages Savoir", href: "/savoir/cadmium" },
            { label: "Tarifs", href: "/#pricing" },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted no-underline"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={secondaryCta.href}
            className="px-3.5 py-2 rounded-full border border-[var(--border-1)] text-label no-underline font-mono text-[11px] tracking-[0.08em] uppercase bg-[var(--bg-elev)]"
          >
            {secondaryCta.label}
          </Link>
          <Link
            href={primaryCta.href}
            className="px-5 py-2 rounded-md bg-accent text-canvas font-semibold text-[13px] no-underline"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {primaryCta.label}
          </Link>
        </div>
      </div>
    </nav>
  );
}
