import Link from "next/link";

export default function MerciPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="mb-4 font-serif text-4xl text-[var(--fg-1)]">
          Merci pour votre confiance.
        </h1>
        {/* LA PROMESSE ÉTAIT FAUSSE, corrigée le 04/08/2026. Cette page annonçait un envoi par
            email « dans les prochaines minutes » : rien n'est envoyé. Le webhook Stripe pose les
            droits en base dès le paiement confirmé et le dossier se lit en ligne. Le même mensonge
            avait déjà été retiré du webhook en juillet (cf. son commentaire) et de la page de
            checkout le 29/07 ; cet écran-ci avait été oublié, alors qu'il est le PREMIER que voit
            un acheteur. Il faisait attendre un email qui ne vient jamais. */}
        <p className="mb-8 text-[var(--fg-3)]">
          Votre dossier est déjà ouvert. Rien à attendre, rien à recevoir par email.
        </p>
        <Link
          href="/rapport"
          className="font-mono text-sm tracking-wider text-[var(--accent)] uppercase"
        >
          Ouvrir mon dossier →
        </Link>
      </div>
    </div>
  );
}
