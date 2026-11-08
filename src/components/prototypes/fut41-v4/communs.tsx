"use client";
// FUT-41 V4 · formes partagées par les vues du prototype. Elles COMPOSENT les primitives du Relevé
// (`src/components/releve/primitives.tsx`) sans en créer de nouvelles : un emblème réduit, la marque
// d'une issue (trait de registre + glyphe du grain), l'étiquette d'un état de comparaison.
import type { ReactNode } from "react";
import { EmblemeEchelles, GlypheGrain, releve as s } from "@/components/releve/primitives";
import {
  etatsEmbleme, LIBELLE_ISSUE, TEINTE_ISSUE, LIBELLE_ETAT, GRAIN_LIBELLE,
  type Lieu, type LigneRegistre, type EtatComparaison, type Grain,
} from "./modele";
import v from "./v4.module.css";

const GRAIN_PRIMITIVE: Record<Grain, "commune" | "secteur" | "batiment"> = { commune: "commune", secteur: "secteur", batiment: "batiment" };

/** L'emblème des trois échelles, à la taille d'une liste (FUT-118 § 6.3 : 32 à 64 px). */
export function EmblemeLieu({ lieu, taille = 44 }: { lieu: Lieu; taille?: number }) {
  return (
    <span className={v.embleme} style={{ width: taille }}>
      <EmblemeEchelles etiquette={`Échelles lues pour ${lieu.libelle}`} etats={etatsEmbleme(lieu)} />
    </span>
  );
}

/** La marque d'une issue : le trait de son registre, le mot, et le glyphe du grain où elle est établie. */
export function MarqueIssue({ ligne, compacte = false }: { ligne: LigneRegistre | null; compacte?: boolean }) {
  if (!ligne) return <span className={v.pasLu}>pas lu</span>;
  return (
    <span className={v.marque} style={{ "--r-teinte": TEINTE_ISSUE[ligne.issue] } as React.CSSProperties}>
      <span className={v.marqueTrait} aria-hidden />
      <span>{LIBELLE_ISSUE[ligne.issue]}</span>
      {ligne.grain && !compacte ? (
        <span className={v.marqueGrain} title={GRAIN_LIBELLE[ligne.grain]}>
          <GlypheGrain grain={GRAIN_PRIMITIVE[ligne.grain]} taille={10} />
          <span className={v.sr}>{GRAIN_LIBELLE[ligne.grain]}</span>
        </span>
      ) : null}
    </span>
  );
}

const TEINTE_ETAT: Record<EtatComparaison, string> = {
  meme_lecture: "var(--reg-non-su)",
  difference_demontree: "var(--r-encre)",
  difference_possible: "var(--reg-controle)",
  a_verifier: "var(--reg-controle)",
  non_comparable: "var(--r-meta)",
  indisponible: "var(--r-meta)",
};

/** L'état d'une comparaison, en mono : la forme dit si l'écart est établi, jamais qui gagne. */
export function EtatComparaisonTag({ etat }: { etat: EtatComparaison }) {
  return (
    <span className={v.etatTag} data-etat={etat} style={{ "--r-teinte": TEINTE_ETAT[etat] } as React.CSSProperties}>
      {LIBELLE_ETAT[etat]}
    </span>
  );
}

/** Un fil d'Ariane : chaque segment ramène où il dit. */
export function Fil({ segments }: { segments: { libelle: string; aller?: () => void }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className={v.fil}>
      {segments.map((seg, i) => (
        <span key={i} className={v.filSegment}>
          {i > 0 ? <span aria-hidden className={v.filSep}>/</span> : null}
          {seg.aller ? <button type="button" className={v.filLien} onClick={seg.aller}>{seg.libelle}</button> : <span aria-current="page">{seg.libelle}</span>}
        </span>
      ))}
    </nav>
  );
}

/** Un mouvement de page, numéroté comme dans le Relevé. */
export function Mouvement({ numero, titre, children, id, action }: { numero: string; titre: string; children: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <section className={`${s.mouvementSerre} ${v.mouvement}`} aria-labelledby={id ? `${id}-titre` : undefined} id={id}>
      <div className={v.enTete}>
        <p className={s.surtitre} id={id ? `${id}-titre` : undefined}>
          <span className={s.numero}>{numero}</span>
          <span>{titre}</span>
        </p>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Une mention « déclaré » : ce qui vient d'une annonce ou de la personne, jamais de futur•e. */
export function Declare({ children = "déclaré" }: { children?: ReactNode }) {
  return <span className={v.declare}>{children}</span>;
}

/** Les petits mots liés au mot suivant (AGENTS.md, robustesse typographique). */
export function lier(t: string): string {
  // Deux passes : « de la mer » a deux petits mots consécutifs, que la première passe ne voit pas tous.
  let r = t;
  for (let i = 0; i < 2; i++) r = r.replace(/(^|[\s ])(le|la|les|leur|et|à|de|du|des|un|une|en|au|aux|sa|son|ses|ce|ne|y) /gi, (_m, p: string, w: string) => `${p}${w} `);
  return r;
}
