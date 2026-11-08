import type { VentesAutour } from "@/lib/prix-autour";
import { fraicheurEnClair } from "@/lib/facts/provenance";
import { texteVentesAutour, type TypeDuLogement } from "@/lib/prix-autour-texte";
import { releve as s, Ligne, Marge, Registre, Surtitre, type ElementDeMarge } from "@/components/releve/primitives";

// LES VENTES À PROXIMITÉ DE L'ADRESSE (FUT-138), dans le module Autour du dossier d'adresse payant. Territoire dit le
// marché de la commune ; ce bloc dit les ventes du secteur et leur écart avec la commune. Logement n'affiche aucun
// prix : une vente à 300 m décrit le voisinage, pas le bien. Les phrases viennent de `prix-autour-texte.ts` (pur,
// testé). Lecture non activée : le bloc ne s'affiche pas. Écrit dans le Relevé (DESIGN.md v3.0), grain « secteur ».

export function VentesAutourBloc({ autour, type }: { autour: VentesAutour | null | undefined; type: TypeDuLogement }) {
  const t = texteVentesAutour(autour, type);
  if (!t) return null;
  const marge: ElementDeMarge[] = [
    { type: "grain", grain: "secteur", libelle: "autour de l'adresse" },
    ...t.blocs.flatMap((b) => b.chiffres.map((c) => ({
      type: "valeur" as const,
      libelle: t.blocs.length > 1 ? `${b.titre} · ${c.label}` : c.label,
      valeur: c.value,
      ...(/^Médiane (de|d'|du)/.test(c.label) ? { grain: "commune" as const } : {}),
    }))),
    // FUT-12 : la source dit aussi la période des ventes et la livraison du fichier, chacune à sa place.
    { type: "source", texte: t.source, ...(fraicheurEnClair(t.provenance ?? {}) ? { date: fraicheurEnClair(t.provenance!)! } : {}) },
  ];
  return (
    <section aria-labelledby="ventes-autour" style={{ display: "grid", gap: 18, paddingTop: 22, borderTop: "1px solid var(--r-filet)" }}>
      <Surtitre id="ventes-autour">Les ventes à proximité</Surtitre>
      <Ligne marge={<Marge elements={marge} />}>
        {t.absence ? <p className={`${s.corps} ${s.encre}`}>{t.absence}</p> : <p className={s.nuance}>{t.lead}</p>}
        {t.blocs.map((b) => (
          <div key={b.type} className={s.pileSerree}>
            {t.blocs.length > 1 && <Registre as="h3">{b.titre}</Registre>}
            {b.phrases.map((p) => <p key={p} className={`${s.corps} ${s.encre}`}>{p}</p>)}
            {b.avertissement && <p className={s.nuance}>{b.avertissement}</p>}
          </div>
        ))}
        {t.limite && <p className={s.nuance}>{t.limite}</p>}
        <details className={`${s.details} ${s.detailsFluide}`}>
          <summary>Comment ces ventes sont lues</summary>
          <div className={s.pileSerree} style={{ marginTop: 10 }}>
            {t.methode.map((m) => <p key={m} className={s.nuance}>{m}</p>)}
          </div>
        </details>
      </Ligne>
    </section>
  );
}
