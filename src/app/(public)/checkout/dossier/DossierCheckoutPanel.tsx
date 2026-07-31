"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentWrapper } from "@/components/PaymentWrapper";

type Address = {
  banId: string;
  label: string;
  postcode: string;
  city: string;
  citycode: string;
  latitude: number;
  longitude: number;
  type: string | null;
};

export function DossierCheckoutPanel({
  address,
  quote,
  promoCode,
  promoRejected,
  promoExpired,
  userEmail,
  checkoutAttemptId,
}: {
  address: Address;
  quote: {
    basePriceCents: number; territoryDeductionCents: number; amountDueCents: number;
    promoLabel: string | null;
  };
  /** Le code VALIDÉ par le serveur, jamais ce que le lecteur a tapé. */
  promoCode: string | null;
  promoRejected: boolean;
  promoExpired: boolean;
  userEmail: string | null | undefined;
  checkoutAttemptId: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [saisie, setSaisie] = useState("");
  const eur = (cents: number) => `${Math.round(cents / 100)} €`;

  // Le code passe par l'URL : la page est un composant serveur, c'est elle qui le résout, et un
  // rechargement conserve donc le tarif. Un état local ferait diverger l'affichage du montant
  // réellement facturé, qui est recalculé serveur.
  function appliquer(valeur: string) {
    const next = new URLSearchParams(params.toString());
    const v = valeur.trim();
    if (v) next.set("code", v);
    else next.delete("code");
    router.replace(`?${next.toString()}`);
  }

  return (
    <div className="glass rounded-xl p-6">
      <p className="text-[19px] text-label mb-1">
        {eur(quote.amountDueCents)}
        {quote.promoLabel && (
          <span className="ml-2.5 text-[14px] text-ghost line-through">
            {eur(quote.basePriceCents)}
          </span>
        )}
      </p>

      {quote.promoLabel && (
        <p className="font-mono text-[12px] text-ghost mb-5">
          {quote.promoLabel} · code {promoCode}
        </p>
      )}

      {!quote.promoLabel && quote.territoryDeductionCents > 0 && (
        <p className="font-mono text-[12px] text-ghost mb-5">
          Vous avez déjà la lecture de {address.city} : {eur(quote.territoryDeductionCents)} déduits
          des {eur(quote.basePriceCents)}.
        </p>
      )}

      <p className="text-[14px] text-muted leading-relaxed mb-6">
        Paiement rattaché à <span className="text-label">{userEmail}</span>. TVA non applicable,
        art. 293 B du CGI.
      </p>

      {/* LA SAISIE DU CODE. Repliée tant qu'aucun code n'est appliqué : la très grande majorité des
          acheteurs n'en a pas, et un champ ouvert leur ferait croire qu'ils ratent quelque chose
          juste avant de payer. */}
      {!quote.promoLabel && (
        <details className="mb-6">
          <summary className="cursor-pointer list-none font-mono text-[11px] tracking-[0.08em] uppercase text-ghost">
            J&apos;ai un code
          </summary>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") appliquer(saisie); }}
              placeholder="Votre code"
              aria-label="Code de lancement"
              className="flex-1 min-w-[160px] rounded-lg border border-white/[0.12] bg-[var(--bg-deep,#0f1424)] px-3.5 py-2.5 text-[14px] text-label outline-none focus:border-accent/60"
            />
            <button
              type="button"
              onClick={() => appliquer(saisie)}
              className="rounded-lg border border-white/[0.12] bg-white/[0.05] px-4 py-2.5 text-[13.5px] text-muted"
            >
              Appliquer
            </button>
          </div>
          {promoRejected && (
            <p className="mt-2.5 text-[13px] text-red-300">
              {promoExpired
                ? "Ce code n'est plus valable."
                : "Ce code ne correspond à rien. Vérifiez la saisie."}
            </p>
          )}
        </details>
      )}

      <PaymentWrapper
        // `amount` n'est qu'un AFFICHAGE : le montant facturé est recalculé côté serveur par
        // `quoteForDossier`, donc un client qui modifierait cette valeur ne changerait rien.
        amount={quote.amountDueCents / 100}
        productType="address-dossier"
        address={address}
        // Généré à chaque rendu de la page serveur : un double clic réutilise la même valeur,
        // puisqu'elle vit dans les props, tandis qu'un retour explicite sur cette page ouvre une
        // tentative neuve. C'est la frontière voulue entre doublon technique et second achat
        // légitime, le produit autorisant plusieurs dossiers à la même adresse.
        checkoutAttemptId={checkoutAttemptId}
        // Le serveur le RÉSOUT à nouveau : ce qui voyage ici n'est qu'une intention.
        promoCode={promoCode}
        returnUrl="/dossier/merci"
        onSuccess={() => router.push("/dossier/merci")}
      />
    </div>
  );
}
