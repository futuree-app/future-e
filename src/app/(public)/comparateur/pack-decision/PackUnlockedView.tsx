"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ComparaisonComplete, MatchResult } from "@/lib/comparateur-vie";
import { ComparaisonCompleteView } from "@/app/(public)/ou-vivre/ComparaisonCompleteView";
import { phraseSansFavorable, porteeSansFavorable } from "@/lib/comparateur/portee-favorable";

type Props = {
  data: ComparaisonComplete;
  trio: MatchResult[];
  pistes: MatchResult[];
  projetLabel: string | null;
  /** FUT-129 : contexte d'un comparatif acheté avant un changement de lecture, ou dont le trio a dû être recomposé. */
  avertissements?: string[];
};

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function forces(r: MatchResult): string[] {
  const confirmation = r.reasons?.[0] ?? null;
  const decouverte = r.decouverte ?? r.reasons?.[1] ?? null;
  const out: string[] = [];
  if (confirmation) out.push(confirmation);
  if (decouverte && decouverte !== confirmation) out.push(decouverte);
  return out.slice(0, 2);
}

function portee(r: MatchResult) {
  return porteeSansFavorable({ marque: r.sansPrioriteFavorable, etat: r.couverture?.etat ?? null, nonMesurees: r.couverture?.nonMesurees });
}

export function PackUnlockedView({ data, trio, pistes, projetLabel, avertissements = [] }: Props) {
  const router = useRouter();
  const [opening, setOpening] = useState<string | null>(null);

  // Le comparatif peut s'ouvrir avant l'écriture des grants par le webhook.
  // Attendre l'activation autorisée, comme pour l'achat d'un territoire seul.
  function openReport(insee: string) {
    setOpening(insee);
    router.push(`/territoire/${insee}/ouvrir`);
  }

  return (
    <div className="pt-4">
      {projetLabel && (
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
          Pack Décision · {projetLabel}
        </p>
      )}

      {/* FUT-129 : dire ce qui a changé depuis l'achat, sans rien réécrire. */}
      {avertissements.map((a) => (
        <p key={a} data-fut129="avertissement-pack" className="mb-4 rounded-xl px-4 py-3 text-[13px] leading-[1.55] text-muted" style={{ borderLeft: "2px solid var(--info)", background: "var(--bg-elev-2)" }}>
          {a}
        </p>
      ))}

      {/* Ouvrir les rapports complets (débloqués par les report_grants du pack) ;
          2 ou 3 selon le mode (choix peut n'en avoir que 2). */}
      <div className={`grid grid-cols-1 ${trio.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} gap-3 mb-10`}>
        {trio.map((r) => (
          <button
            key={r.insee}
            onClick={() => openReport(r.insee)}
            disabled={opening !== null}
            className="glass rounded-xl p-4 flex items-center justify-between hover:border-[var(--border-hi)] border border-[var(--border-2)] transition-colors text-left disabled:opacity-60"
          >
            <span className="text-[14px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
              {opening === r.insee ? "Ouverture…" : `Rapport · ${r.nom}`}
            </span>
            <span aria-hidden className="text-accent">→</span>
          </button>
        ))}
      </div>

      {/* La comparaison complète */}
      <ComparaisonCompleteView data={data} trio={trio} onBack={() => history.back()} />

      {/* Les 3 nouvelles pistes (rangs 4-6) */}
      {pistes.length > 0 && (
        <section className="mt-12">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
            Trois nouvelles pistes
          </p>
          <h3
            className="font-[var(--weight-section)] text-[length:var(--text-section)] leading-[1.15] text-label mb-2"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Si aucune des trois ne vous convainc totalement.
          </h3>
          <p className="text-[13px] leading-[1.6] text-muted mb-6">
            Les communes suivantes pour le même projet, à explorer.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pistes.map((r) => (
              <div key={r.insee} className="glass rounded-2xl p-6 flex flex-col">
                <h4 className="font-normal text-[20px] leading-[1.2] text-label" style={{ fontFamily: "var(--font-serif)" }}>
                  {r.nom}
                </h4>
                <p className="mt-2 text-[14px] leading-[1.6] text-accent italic">{r.identite}</p>
                {/* FUT-151 : aucune priorité favorable, dite avec sa portée (une priorité non mesurée n'est pas un défaut). */}
                {portee(r) && (
                  <p className="mt-3 text-[12px] leading-[1.5] text-muted">{phraseSansFavorable(portee(r)!)}</p>
                )}
                <ul className="mt-4 space-y-2">
                  {forces(r).map((f) => (
                    <li key={f} className="text-[length:var(--text-dense)] leading-[1.55] text-label flex gap-2">
                      <span className="text-emerald-400 shrink-0" aria-hidden>+</span>
                      <span>{cap(f)}</span>
                    </li>
                  ))}
                </ul>
                {/* FUT-154 : sans compromis établi, aucun filet vide sous la carte. */}
                {r.compromis && (
                  <p className="mt-4 pt-3 border-t border-[var(--border-1)] text-[13px] leading-[1.55] text-muted">
                    {r.compromis}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
