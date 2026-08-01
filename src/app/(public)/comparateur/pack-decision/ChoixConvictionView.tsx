"use client";

import Link from "next/link";
import type { ComparaisonComplete } from "@/lib/comparateur-vie";
import { PackPaymentPanel } from "./PackPaymentPanel";

// Conviction du Pack Décision en MODE CHOIX : 2-3 communes NOMMÉES, sans projet.
// Différence clé avec PackConvictionView (mode replay) : l'aperçu est calculé côté
// serveur (seedComparaison, pas l'API apercu/localStorage), il n'y a pas de « pistes »,
// et l'ancre est la VALEUR (pas la remise « 3 rapports = 42 € », qui s'inverse à 2).

type TrioItem = { insee: string; nom: string };

type Props = {
  trio: TrioItem[];
  apercu: ComparaisonComplete; // déjà tronqué (En résumé + 2 thèmes)
  userEmail: string | null;
  returnUrl: string; // absolu : return_url du PaymentIntent
  returnPath: string; // relatif : next= de l'auth
};

function heroNoms(noms: string[]): string {
  if (noms.length <= 1) return noms[0] ?? "ces territoires";
  return `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
}

export function ChoixConvictionView({ trio, apercu, userEmail, returnUrl, returnPath }: Props) {
  const noms = trio.map((t) => t.nom).filter(Boolean);
  const n = trio.length;
  const motN = n >= 3 ? "trois" : "deux";
  const themesRestants = Math.max(0, 7 - apercu.themes.length);
  const trioForBuy = trio.map((t) => ({ insee: t.insee, commune: t.nom }));

  const bundle = [
    { t: "La comparaison complète", d: `Vos ${motN} communes, thème par thème, ce qui les départage vraiment.` },
    { t: `Les ${motN} rapports complets`, d: "Un rapport par commune, à conserver, accessible depuis votre espace." },
    { t: "AskFuture : 9 questions incluses", d: "Pour creuser ce qui compte, sur chacun des territoires." },
  ];

  return (
    <div className="pt-4">
      <Link
        href={`/comparateur?communes=${trio.map((t) => t.insee).join(",")}`}
        className="font-mono text-[11px] tracking-[0.1em] text-muted hover:text-label mb-6 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Revenir au comparateur
      </Link>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">Pack Décision · 39 €</p>
      <h1
        className="font-normal text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.8px] text-label mb-5"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {noms.length >= 2 ? `Vous hésitez entre ${heroNoms(noms)} ?` : "Vous hésitez entre ces territoires ?"}
        <br />
        <span className="italic text-accent">Tranchez, sans deviner.</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 items-start mt-8">
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-3">Aperçu de la comparaison</p>
          <div className="glass rounded-2xl p-6">
            {apercu.resume.map((line, i) => (
              <p key={i} className="text-[14px] leading-[1.6] text-label mb-3">{line}</p>
            ))}
            {apercu.themes.map((th) => (
              <div key={th.id} className="mt-4 pt-4 border-t border-[var(--border-1)]">
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1">{th.titre}</p>
                <p className="text-[13px] leading-[1.55] text-muted">{th.synthese}</p>
              </div>
            ))}
            {themesRestants > 0 && (
              <p className="mt-5 text-[12px] text-muted italic">Et {themesRestants} autres thèmes, une fois le pack débloqué.</p>
            )}
          </div>

          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-8 mb-3">Ce que vous débloquez</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bundle.map((b) => (
              <div key={b.t} className="glass rounded-xl p-4">
                <p className="text-[14px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>{b.t}</p>
                <p className="mt-1 text-[12.5px] leading-[1.5] text-muted">{b.d}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[13px] leading-[1.6] text-muted">
            Une décision de lieu de vie pèse des années. 39 €, paiement unique, sans engagement :
            c&apos;est peu, contre une commune mal choisie.
          </p>
        </div>

        <aside className="glass rounded-2xl p-6 md:sticky md:top-6">
          <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-[var(--border-1)]">
            <span className="text-[15px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>Pack Décision</span>
            <span className="text-[28px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              39<span className="text-[15px] text-muted ml-1">€</span>
            </span>
          </div>
          {userEmail ? (
            <PackPaymentPanel
              trio={trioForBuy}
              projetLabel=""
              mode="choix"
              returnUrl={returnUrl}
              submitLabel="Débloquer le Pack Décision"
            />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] leading-[1.6] text-muted">Le paiement doit être rattaché à un compte.</p>
              <Link
                href={`/inscription?next=${encodeURIComponent(returnPath)}`}
                className="flex items-center justify-center px-5 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px]"
              >
                Créer mon compte puis payer
              </Link>
              <Link
                href={`/connexion?next=${encodeURIComponent(returnPath)}`}
                className="flex items-center justify-center px-5 py-2.5 rounded-lg border border-[var(--border-2)] text-[13px] text-label"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
