import Link from "next/link";

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
      className="sticky top-0 z-50 border-b border-white/[0.08]"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: "rgba(6,8,18,0.72)",
      }}
    >
      <div className="max-w-[1100px] mx-auto px-7 h-16 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="no-underline tracking-[-0.3px]"
          style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontStyle: "italic", color: "#e9ecf2" }}
        >
          futur<span className="text-accent not-italic">•</span>e
        </Link>

        <div className="flex items-center gap-8">
          {[
            { label: "Le produit", href: "/" },
            { label: "Pages Savoir", href: "/savoir" },
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
            className="px-3.5 py-2 rounded-full border border-white/[0.08] text-label no-underline font-mono text-[11px] tracking-[0.08em] uppercase bg-white/[0.02]"
          >
            {secondaryCta.label}
          </Link>
          <Link
            href={primaryCta.href}
            className="px-5 py-2 rounded-md bg-accent text-canvas font-semibold text-[13px] no-underline"
            style={{ fontFamily: "'Instrument Sans', sans-serif" }}
          >
            {primaryCta.label}
          </Link>
        </div>
      </div>
    </nav>
  );
}
