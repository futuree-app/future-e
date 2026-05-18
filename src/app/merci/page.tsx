import Link from "next/link";

export default function MerciPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="mb-4 font-serif text-4xl text-[var(--fg-1)]">
          Merci pour votre confiance.
        </h1>
        <p className="mb-8 text-[var(--fg-3)]">
          Vous recevrez votre rapport par email dans les prochaines minutes.
        </p>
        <Link
          href="/dashboard"
          className="font-mono text-sm tracking-wider text-[var(--accent)] uppercase"
        >
          Accéder à mon espace →
        </Link>
      </div>
    </div>
  );
}
