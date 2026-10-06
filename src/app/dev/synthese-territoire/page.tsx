// LA BOUCLE DE VÉRIFICATION de la synthèse Territoire (FUT-76).
//
// Pourquoi elle existe : le défaut de FUT-76 (un repli déterministe présenté comme « Lecture enrichie »)
// ne se voit que sur la vraie page, derrière une session, et seulement quand le modèle échoue. Ici, le
// VRAI composant, sur un VRAI snapshot, sans session : les réponses de l'API se simulent dans le
// navigateur (un outil de test intercepte /api/synthesize-quartier), donc aucun appel au modèle.
//
// `?snapshot=<empreinte>` : le snapshot persisté à relire (lecture seule, service role). Obligatoire.
// `?enrichi=deterministe` : simule un ANCIEN cache qui servait le repli comme lecture enrichie (2030).
//
// DEV UNIQUEMENT : 404 en production.
import { notFound } from "next/navigation";
import QuartierSynthesis from "@/components/report/QuartierSynthesis";
import { HORIZONS, projectForSynthesis, type HorizonKey } from "@/lib/territoire/synthesis-contract";
import { deterministicSynthesis } from "@/lib/territoire/synthesis-deterministe";
import { territoireStore } from "@/lib/server/territoire-facts-store";
import type { HashedSnapshot } from "@/lib/facts/contract";

export default async function Page({ searchParams }: { searchParams: Promise<{ snapshot?: string; enrichi?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { snapshot: hash, enrichi } = await searchParams;
  const snapshot: HashedSnapshot | null = hash && /^[0-9a-f]{64}$/.test(hash)
    ? (await territoireStore()?.readSnapshot(hash)) ?? null
    : null;
  if (!snapshot) return <main style={{ padding: 32 }}>Passez ?snapshot=&lt;empreinte d&apos;un snapshot persisté&gt;.</main>;
  const deterministic = Object.fromEntries(
    HORIZONS.map((h) => [h, deterministicSynthesis(projectForSynthesis(snapshot, h), h)]),
  ) as Record<HorizonKey, string>;
  const initialEnriched: Partial<Record<HorizonKey, string>> = enrichi === "deterministe" ? { gwl15: deterministic.gwl15 } : {};
  const nom = String((projectForSynthesis(snapshot, "gwl20").commune as { nom?: string } | undefined)?.nom ?? snapshot.scope.id);
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 16px 80px" }}>
      <QuartierSynthesis
        communeName={nom}
        inseeCode={snapshot.scope.id}
        snapshotHash={snapshot.hash}
        deterministic={deterministic}
        initialEnriched={initialEnriched}
        sourcesByHorizon={{ gwl15: [], gwl20: [], gwl30: [] }}
      />
    </main>
  );
}
