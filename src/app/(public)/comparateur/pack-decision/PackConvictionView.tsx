"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ComparaisonComplete, ParsedProject } from "@/lib/comparateur-vie";
import { PackPaymentPanel } from "./PackPaymentPanel";

type Props = {
  insees: string[];
  userEmail: string | null;
  returnUrl: string; // absolu : destiné à Stripe (return_url du PaymentIntent)
  returnPath: string; // relatif : destiné à l'auth (next=), qui refuse les URL absolues
};

type Apercu = { apercu: ComparaisonComplete; trio: { insee: string; nom: string }[] };

const BUNDLE = [
  { t: "La comparaison complète", d: "Les trois territoires, thème par thème, ce qui les départage vraiment." },
  { t: "Les trois rapports complets", d: "Un rapport par commune, à conserver, accessible depuis votre espace." },
  { t: "Trois nouvelles pistes", d: "Les communes suivantes sur le même projet, si aucune des trois ne tranche." },
  { t: "AskFuture : 9 questions incluses", d: "Pour creuser ce qui compte, sur chacun des territoires." },
];

export function PackConvictionView({ insees, userEmail, returnUrl, returnPath }: Props) {
  const [parsed, setParsed] = useState<ParsedProject | null>(null);
  const [projetLabel, setProjetLabel] = useState("");
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [slow, setSlow] = useState(false);

  // Le projet vit en localStorage (déposé par le comparateur au clic Pack Décision).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("futuree:projet:parsed");
      // Lecture localStorage post-montage (client-only) : pattern légitime, pas un cascading render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setParsed(JSON.parse(raw) as ParsedProject);
      const label = window.localStorage.getItem("futuree:projet:label");
      if (label) setProjetLabel(label);
    } catch {
      // pas de projet en mémoire : l'aperçu restera générique, l'achat indisponible.
    }
  }, []);

  // Aperçu tronqué (garde-fou de latence : on n'attend pas indéfiniment).
  useEffect(() => {
    if (!parsed) return;
    const slowTimer = setTimeout(() => setSlow(true), 1200);
    fetch("/api/comparateur-vie/apercu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parsed }),
    })
      .then((r) => r.json())
      .then((d: Apercu) => setApercu(d))
      .catch(() => {})
      .finally(() => { clearTimeout(slowTimer); setSlow(false); });
    return () => clearTimeout(slowTimer);
  }, [parsed]);

  const trioNoms = apercu?.trio.map((t) => t.nom) ?? [];
  // Garde-fou : on n'autorise l'achat que si le trio nommé est chargé. Sinon le
  // fallback (noms vides) produirait un pack/snapshot avec des communes sans nom.
  const apercuReady = apercu?.trio.length === 3;
  const trioForBuy = (apercu?.trio ?? insees.map((insee) => ({ insee, nom: "" }))).map((t) => ({
    insee: t.insee,
    commune: t.nom,
  }));

  return (
    <div className="pt-4">
      <Link
        href="/ou-vivre"
        className="font-mono text-[11px] tracking-[0.1em] text-muted hover:text-label mb-6 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Revenir au comparateur
      </Link>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">Pack Décision · 39 €</p>
      <h1
        className="font-normal text-[length:var(--text-display)] leading-[1.1] tracking-[-0.8px] text-label mb-5"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {trioNoms.length === 3
          ? `Vous hésitez entre ${trioNoms[0]}, ${trioNoms[1]} et ${trioNoms[2]} ?`
          : "Vous hésitez entre ces trois territoires ?"}
        <br />
        <span className="italic text-accent">Tranchez, sans deviner.</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 items-start mt-8">
        {/* Aperçu réel tronqué + valeur du bundle */}
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-3">Aperçu de la comparaison</p>
          {apercu ? (
            <div className="glass rounded-2xl p-6">
              {apercu.apercu.resume.map((line, i) => (
                <p key={i} className="text-[14px] leading-[1.6] text-label mb-3">{line}</p>
              ))}
              {apercu.apercu.themes.map((th) => (
                <div key={th.id} className="mt-4 pt-4 border-t border-[var(--border-1)]">
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1">{th.titre}</p>
                  <p className="text-[13px] leading-[1.55] text-muted">{th.synthese}</p>
                </div>
              ))}
              <p className="mt-5 text-[12px] text-muted italic">Et cinq autres thèmes, une fois le pack débloqué.</p>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-[13px] text-muted">
              {slow ? "Préparation de l'aperçu…" : "Chargement de l'aperçu…"}
            </div>
          )}

          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-8 mb-3">Ce que vous débloquez</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BUNDLE.map((b) => (
              <div key={b.t} className="glass rounded-xl p-4">
                <p className="text-[14px] text-label" style={{ fontFamily: "var(--font-serif)" }}>{b.t}</p>
                <p className="mt-1 text-[length:var(--text-caption)] leading-[1.5] text-muted">{b.d}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[13px] leading-[1.6] text-muted">
            Trois rapports valent 42 € à l&apos;unité. Le Pack Décision les réunit, avec la comparaison et les
            pistes, pour 39 €. Aucun engagement, paiement unique.
          </p>
        </div>

        {/* Achat */}
        <aside className="glass rounded-2xl p-6 md:sticky md:top-6">
          <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-[var(--border-1)]">
            <span className="text-[15px] text-label" style={{ fontFamily: "var(--font-serif)" }}>Pack Décision</span>
            <span className="text-[28px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
              39<span className="text-[15px] text-muted ml-1">€</span>
            </span>
          </div>
          {userEmail && parsed && apercuReady ? (
            <PackPaymentPanel
              trio={trioForBuy}
              projetLabel={projetLabel}
              parsedSnapshot={parsed}
              returnUrl={returnUrl}
              submitLabel="Débloquer le Pack Décision"
            />
          ) : !userEmail ? (
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
          ) : parsed ? (
            <p className="text-[13px] leading-[1.6] text-muted">
              Préparation du comparatif… le paiement s&apos;active dès que l&apos;aperçu est prêt.
            </p>
          ) : (
            <p className="text-[13px] leading-[1.6] text-muted">
              Reprenez votre comparaison pour débloquer le pack.{" "}
              <Link href="/ou-vivre" className="text-accent hover:underline">Revenir au comparateur</Link>.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
