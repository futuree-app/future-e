import type { TextePrix } from "@/lib/prix-immobiliers";
import { bindOrphans } from "@/lib/typography";
import { releve as s, Ligne, Marge, Surtitre, type ElementDeMarge } from "@/components/releve/primitives";

// LE MARCHÉ IMMOBILIER DE LA COMMUNE (FUT-138), dans le dossier d'adresse. Un contexte, PAS la valeur du bien :
// le grain affiché est la commune (ou l'intercommunalité, ou la ville entière pour un arrondissement), jamais
// l'adresse. Les phrases viennent de `prix-immobiliers.ts` (pur, testé), les mêmes que la carte Territoire.

export function MarcheLocalSection({ texte }: { texte: TextePrix | null | undefined }) {
  if (!texte) return null;
  const marge: ElementDeMarge[] = [
    { type: "grain", grain: "commune" },
    ...texte.faits.map((f) => ({ type: "valeur" as const, libelle: f.label, valeur: f.value })),
    { type: "source", texte: texte.source },
  ];
  return (
    <section aria-labelledby="marche-local" style={{ display: "grid", gap: 18, paddingTop: 22, borderTop: "1px solid var(--r-filet)" }}>
      <Surtitre id="marche-local">Le marché immobilier de la commune</Surtitre>
      <Ligne marge={<Marge elements={marge} />}>
        <p className={`${s.corps} ${s.encre}`}>{bindOrphans(texte.manquant || !texte.phrase ? texte.titreVolet : texte.phrase)}</p>
        <p className={s.nuance}>
          {bindOrphans("Ces chiffres décrivent les ventes et les loyers de la commune. Ils ne disent pas ce que vaut ce logement : seule une estimation sur place, qui tient compte de son état, de sa surface et de son emplacement, peut le dire.")}
        </p>
        {texte.limites.length > 0 && (
          <details className={`${s.details} ${s.detailsFluide}`}>
            <summary>Ce que ces prix ne disent pas</summary>
            <div className={s.pileSerree} style={{ marginTop: 10 }}>
              {texte.limites.map((l) => <p key={l} className={s.nuance}>{l}</p>)}
              <p className={s.nuance}>{texte.methode}</p>
            </div>
          </details>
        )}
      </Ligne>
    </section>
  );
}
