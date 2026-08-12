"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « CETTE ANALYSE RÉPOND AU PROJET QUE VOUS AVIEZ. »
//
// ── POURQUOI LE DIRE, ET NE PAS RECALCULER SEUL ──────────────────────────────────────────────
// Le dossier est figé au jour de l'achat, projet compris. Quand le lecteur modifie ses priorités,
// deux réponses sont fausses : réécrire son analyse sans le dire, ce qui effacerait une décision
// sur laquelle il a peut-être déjà agi, et se taire, ce qui lui laisse croire que ce qu'il lit
// répond à ce qu'il demande aujourd'hui.
//
// La doctrine du vault tranche : une pièce qu'il DÉPOSE (un diagnostic) recalcule seule, parce
// qu'il attend qu'elle compte ; un projet qu'il change se demande, parce que l'analyse achetée
// répondait à une autre question. C'est donc un bouton, jamais un effet de bord.
//
// ── CE QUE LA MISE À JOUR PRODUIT ────────────────────────────────────────────────────────────
// Une version n+1. La précédente reste en base et lisible : c'est ce sur quoi il a décidé.
// ════════════════════════════════════════════════════════════════════════════════════════════

export function AnalyseAncienProjet({ insee, scopeKey }: { insee: string; scopeKey: string }) {
  const [etat, setEtat] = useState<"repos" | "encours" | "ailleurs" | "echec">("repos");
  const router = useRouter();

  const mettreAJour = async () => {
    setEtat("encours");
    try {
      const res = await fetch("/api/dossier/actualiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insee, scopeKey }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // UNE GÉNÉRATION DÉJÀ EN COURS N'EST PAS UNE GÉNÉRATION ABOUTIE (revue du 12/08/2026). La
      // route répondait `ok` dans les deux cas, et le rechargement réaffichait le même bandeau sans
      // rien expliquer : le lecteur cliquait, la page revenait identique.
      const corps = (await res.json().catch(() => null)) as { statut?: string } | null;
      if (corps?.statut === "en_cours") {
        setEtat("ailleurs");
        return;
      }
      // La génération a abouti : on relit la page, qui servira la version nouvelle.
      router.refresh();
      setEtat("repos");
    } catch {
      // ON NE PROMET PAS QUE ÇA MARCHERA LA PROCHAINE FOIS. L'ancienne version reste affichée, et
      // c'est le comportement juste : elle est la décision vendue, pas un pis-aller.
      setEtat("echec");
    }
  };

  return (
    <div
      className="glass rounded-xl p-4 mb-3.5 flex flex-wrap items-center gap-x-4 gap-y-2"
      style={{ borderLeft: "2px solid var(--reg-non-su)" }}
    >
      <p className="text-[13px] text-muted flex-1 min-w-[260px]">
        Votre projet a changé depuis cette analyse. Ce que vous lisez répond au projet que vous aviez
        au moment de l&apos;achat.
      </p>
      <button
        onClick={mettreAJour}
        disabled={etat === "encours"}
        className="text-[13px] px-3.5 py-2 rounded-lg border border-[var(--border-1)] bg-transparent text-label hover:border-[var(--border-2)] transition-colors disabled:opacity-60"
      >
        {etat === "encours" ? "Mise à jour…" : "Mettre à jour l'analyse"}
      </button>
      {etat === "ailleurs" && (
        <p className="text-[12.5px] text-muted w-full">
          Une mise à jour est déjà en cours. Rechargez la page dans un instant.
        </p>
      )}
      {etat === "echec" && (
        <p className="text-[12.5px] text-muted w-full">
          La mise à jour n&apos;a pas abouti. L&apos;analyse ci-dessous reste celle de votre achat.
        </p>
      )}
    </div>
  );
}
