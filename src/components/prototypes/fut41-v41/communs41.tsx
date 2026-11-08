"use client";
// FUT-41 V4.1 · formes partagées. Elles composent les primitives du Relevé ; aucune nouvelle primitive.
// Principe : chaque signe porte aussi un MOT. Le glyphe de l'échelle (cercle, carré, losange) aide à
// reconnaître ; il n'est jamais la seule façon de comprendre.
import type { CSSProperties, ReactNode } from "react";
import { GlypheGrain, releve as s } from "@/components/releve/primitives";
import { lier } from "../fut41-v4/communs";
import { TEINTE_ISSUE, LIBELLE_ISSUE_SIMPLE, NOM_ECHELLE, type Geste, type LigneRegistre, type SavoirEchelle, type Logement } from "./modele41";
import v from "./v41.module.css";

export { lier };

const GLYPHE = { territoire: "commune", abords: "secteur", logement: "batiment" } as const;
const GRAIN_GLYPHE = { commune: "commune", secteur: "secteur", batiment: "batiment" } as const;
const ACCORD = { territoire: "lue", abords: "lus", logement: "lu" } as const;
const OU = { commune: "à la commune", secteur: "aux abords", batiment: "dans le logement" } as const;

/** L'issue : le trait de son registre, un mot simple, et l'endroit où elle est lue (glyphe + mots). */
export function Marque({ ligne, sansLieu = false }: { ligne: LigneRegistre | null; sansLieu?: boolean }) {
  if (!ligne) return <span className={v.pasLu}>pas encore lu</span>;
  return (
    <span className={v.marque} style={{ "--r-teinte": TEINTE_ISSUE[ligne.issue] } as CSSProperties}>
      <span className={v.trait} aria-hidden />
      <span className={v.marqueMot}>{LIBELLE_ISSUE_SIMPLE[ligne.issue]}</span>
      {ligne.grain && !sansLieu ? (
        <span className={v.marqueOu}><GlypheGrain grain={GRAIN_GLYPHE[ligne.grain]} taille={10} /> {OU[ligne.grain]}</span>
      ) : null}
    </span>
  );
}

/** Ce que futur•e sait, échelle par échelle : un glyphe, un nom, un état en mots. */
export function Triade({ savoir, compacte = false }: { savoir: SavoirEchelle[]; compacte?: boolean }) {
  return (
    <ul className={compacte ? `${v.triade} ${v.triadeCompacte}` : v.triade} aria-label="Ce que futur•e sait de ce logement">
      {savoir.map((x) => (
        <li key={x.echelle} data-etat={x.etat}>
          <span className={v.triadeGlyphe}><GlypheGrain grain={GLYPHE[x.echelle]} taille={compacte ? 11 : 14} /></span>
          <span className={v.triadeNom}>{NOM_ECHELLE[x.echelle]}</span>
          <span className={v.triadeEtat}>{x.etat === "impossible" ? "adresse manquante" : `${x.etat === "lu" ? "" : "pas encore "}${ACCORD[x.echelle]}`}</span>
          {!compacte ? <span className={v.triadeDetail}>{x.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * LA VIGNETTE D'UN LOGEMENT. Une photo seulement si la personne l'a ajoutée (celle de son annonce) :
 * jamais d'image d'illustration présentée comme le logement. Sans photo, une plaque neutre avec ses
 * initiales et le nombre de pièces, pour retrouver le logement d'un coup d'œil sans inventer.
 */
export function Vignette({ logement, taille = 64 }: { logement: Logement; taille?: number }) {
  if (logement.photo) {
    return (
      <span className={v.vignette} style={{ width: taille, height: taille }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logement.photo} alt={`Photo de l'annonce, ajoutée par vous : ${logement.libelle}`} />
      </span>
    );
  }
  const initiales = logement.libelle.replace(/^(T\d|Maison|Studio)\s+/i, "").split(/\s+/).filter((m) => m.length > 2).slice(0, 2).map((m) => m[0]!.toUpperCase()).join("");
  return (
    <span className={`${v.vignette} ${v.vignetteVide}`} style={{ width: taille, height: taille }} aria-hidden>
      <span className={v.vignettePieces}>{logement.annonce?.pieces ? `${logement.annonce.pieces}p` : "?"}</span>
      <span className={v.vignetteInit}>{initiales}</span>
    </span>
  );
}

/** Le geste principal d'une piste : un bouton et, dessous, ce qu'il apporte. */
export function BoutonGeste({ geste, faire, principal = false, avecApport = true, court = false }: { geste: Geste; faire: () => void; principal?: boolean; avecApport?: boolean; court?: boolean }) {
  return (
    <div className={v.geste}>
      <button type="button" className={principal ? `${s.bouton} ${s.boutonMarque}` : s.bouton} onClick={faire}>{geste.libelle}</button>
      {avecApport ? <p className={v.gesteApport}>{lier(court && geste.court ? geste.court : geste.apport)}</p> : null}
    </div>
  );
}

export function Fil41({ segments }: { segments: { libelle: string; aller?: () => void }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className={v.fil}>
      {segments.map((seg, i) => (
        <span key={i} className={v.filSeg}>
          {i > 0 ? <span aria-hidden className={v.filSep}>/</span> : null}
          {seg.aller ? <button type="button" className={v.filLien} onClick={seg.aller}>{seg.libelle}</button> : <span aria-current="page">{seg.libelle}</span>}
        </span>
      ))}
    </nav>
  );
}

/** Une section de page : un titre en question ou en constat, sans numérotation technique. */
export function Section({ titre, children, id, action, sous }: { titre: string; children: ReactNode; id: string; action?: ReactNode; sous?: string }) {
  return (
    <section className={v.section} aria-labelledby={`${id}-t`} id={id}>
      <div className={v.sectionTete}>
        <div>
          <h2 className={v.sectionTitre} id={`${id}-t`}>{titre}</h2>
          {sous ? <p className={s.nuance}>{sous}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Declare({ children = "déclaré" }: { children?: ReactNode }) {
  return <span className={v.declare}>{children}</span>;
}
