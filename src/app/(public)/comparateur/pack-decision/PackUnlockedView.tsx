"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ComparaisonComplete, MatchResult } from "@/lib/comparateur-vie";
import { ComparaisonCompleteView } from "@/app/(public)/ou-vivre/ComparaisonCompleteView";

type Props = {
  data: ComparaisonComplete;
  trio: MatchResult[];
  pistes: MatchResult[];
  projetLabel: string | null;
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

export function PackUnlockedView({ data, trio, pistes, projetLabel }: Props) {
  const router = useRouter();
  const [opening, setOpening] = useState<string | null>(null);

  // Ouvrir le rapport d'une commune du trio = poser ce territoire en lecture
  // active (l'accès est garanti par le report_grant du pack) puis aller au
  // rapport. Même flux que le déblocage 14 € (TerritoryUnlockPanel).
  async function openReport(insee: string, commune: string) {
    setOpening(insee);
    try {
      await fetch("/api/territoire/activer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insee, commune }),
      });
    } catch {
      // Le rapport résout de toute façon le territoire actif côté serveur.
    }
    router.push("/rapport");
  }

  return (
    <div className="pt-4">
      {projetLabel && (
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
          Pack Décision · {projetLabel}
        </p>
      )}

      {/* Ouvrir les rapports complets (débloqués par les report_grants du pack) ;
          2 ou 3 selon le mode (choix peut n'en avoir que 2). */}
      <div className={`grid grid-cols-1 ${trio.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} gap-3 mb-10`}>
        {trio.map((r) => (
          <button
            key={r.insee}
            onClick={() => openReport(r.insee, r.nom)}
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
            className="font-normal text-[length:var(--text-section)] leading-[1.15] text-label mb-2"
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
                <ul className="mt-4 space-y-2">
                  {forces(r).map((f) => (
                    <li key={f} className="text-[length:var(--text-dense)] leading-[1.55] text-label flex gap-2">
                      <span className="text-emerald-400 shrink-0" aria-hidden>+</span>
                      <span>{cap(f)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 pt-3 border-t border-[var(--border-1)] text-[13px] leading-[1.55] text-muted">
                  {r.compromis}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
