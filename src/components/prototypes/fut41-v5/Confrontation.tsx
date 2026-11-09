"use client";
// LA CONFRONTATION, partagée par la fiche (une colonne) et par Comparer (deux à quatre colonnes).
// Une condition par bloc ; dans chaque bloc, une ligne par couche : « À la commune », puis la couche
// où l'adresse la lit. Une lecture communale partagée occupe UNE cellule qui couvre les logements
// concernés : on voit qu'elle ne les distingue pas, sans avoir à le lire. Les preuves sont repliées
// sous la condition. Aucune structure de tableau : chaque cellule dit elle-même à qui elle s'applique.
import type { CSSProperties, ReactNode } from "react";
import { releve as s } from "@/components/releve/primitives";
import { NOM_COUCHE, LIBELLE_VERDICT, type Cellule, type Colonne, type LigneConfrontation, type Projet } from "./modele5";
import { Glyphe, Marque, Mesure, lier } from "./communs5";
import v from "./v5.module.css";

const ETAT_VIDE = { a_lire: "à étudier depuis l'adresse", adresse_manquante: "adresse inconnue", pas_lue: "pas encore étudiée", lu: "" } as const;

export function Confrontation({ colonnes, lignes, projet, seul = false, enTete = true, compact = false, action, tete }: {
  colonnes: Colonne[]; lignes: LigneConfrontation[]; projet: Projet; seul?: boolean; enTete?: boolean;
  /** Lecture rapide : les marques et les mesures seulement, le verdict en un mot, sans preuves ni origine. */
  compact?: boolean;
  /** Un geste posé dans la cellule même, là où l'incertitude apparaît (ex. les questions de visite). */
  action?: (cle: LigneConfrontation["cle"], ids: string[]) => ReactNode;
  /** L'en-tête d'une colonne, quand l'écran veut y montrer plus que le nom (prix, surface, vignette). */
  tete?: (c: Colonne) => ReactNode;
}) {
  const nomDe = (ids: string[]) => ids.map((id) => colonnes.find((c) => c.id === id)?.nom ?? id).join(" et ");
  return (
    <div className={v.conf} style={{ "--cols": colonnes.length } as CSSProperties} data-seul={seul || undefined} data-compact={compact || undefined}>
      {enTete && !seul ? (
        <div className={v.confTete} aria-hidden={tete ? undefined : true}>
          <span className={v.confCoin} />
          {colonnes.map((c) => <span key={c.id} className={v.confCol}>{tete ? tete(c) : <><strong>{c.nom}</strong><span>{c.sous}</span></>}</span>)}
        </div>
      ) : null}
      {lignes.map((li) => {
        const limite = projet.criteres.find((k) => k.cle === li.cle)?.valeur ?? null;
        const preuves = li.couches.flatMap((x) => x.cellules.filter((c) => c.ligne?.constat).map((c) => ({ couche: x.couche, c })));
        return (
          <section key={li.cle} className={v.confBloc} aria-labelledby={`cf-${li.cle}`}>
            <h3 className={v.confCrit} id={`cf-${li.cle}`}>
              {li.libelle}
              {/* Le poids que la personne a déclaré : il dit ce qui compte pour elle, jamais un total. */}
              {li.sansCompromis ? <span className={v.dur}> · sans compromis</span> : <span className={v.dur}> · {li.poids === 3 ? "compte beaucoup pour vous" : li.poids === 2 ? "compte pour vous" : "compte un peu pour vous"}</span>}
            </h3>
            {li.couches.map((x) => (
              <div key={x.couche} className={v.confCouche} role="group" aria-label={NOM_COUCHE[x.couche]} data-verdict={x.verdict}>
                <span className={v.confOu}><Glyphe couche={x.couche} /> {NOM_COUCHE[x.couche]}</span>
                {x.cellules.map((c) => (
                  <div key={c.ids.join()} className={v.confCell} style={{ gridColumn: `span ${c.ids.length}` }} data-partage={c.ids.length > 1 || undefined}>
                    {!seul ? <span className={v.sr}>{nomDe(c.ids)} : </span> : null}
                    <ContenuCellule c={c} limite={x.couche === "commune" ? null : limite} seul={seul} compact={compact} />
                    {action && x.verdict === "pourrait" ? action(li.cle, c.ids) : null}
                    {c.ids.length > 1 ? <span className={v.partage}>même donnée pour {nomDe(c.ids)}</span> : null}
                    {seul && x.couche === "commune" && c.ligne && li.couches.some((y) => y.couche !== "commune" && y.cellules.every((k) => !k.ligne)) ? <span className={v.partage}>Dit pour la commune ; ce logement reste à lire depuis son adresse.</span> : null}
                  </div>
                ))}
                {!seul ? (
                  <p className={v.confVerdict}>
                    <span className={v.confVerdictMot}>{LIBELLE_VERDICT[x.verdict]}</span>
                    {compact ? null : <>{lier(x.phrase)}{x.remede ? <span className={v.remede}> {lier(x.remede)}</span> : null}</>}
                  </p>
                ) : null}
              </div>
            ))}
            {preuves.length && !seul && !compact ? (
              <details className={`${s.details} ${v.preuves}`}>
                <summary>Preuves et sources</summary>
                <ul className={v.listeSimple}>
                  {preuves.map(({ couche, c }) => (
                    <li key={couche + c.ids.join()} className={s.dense}>
                      <strong className={s.encre}>{nomDe(c.ids)}</strong>, {NOM_COUCHE[couche].toLowerCase()} : {lier(c.ligne!.constat!)}
                      <span className={v.preuve}> {c.ligne!.preuve ? `${c.ligne!.preuve.source}, ${c.ligne!.preuve.date}` : ""}{c.origine ? ` · ${c.origine}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function ContenuCellule({ c, limite, seul, compact = false }: { c: Cellule; limite: number | null; seul: boolean; compact?: boolean }) {
  if (!c.ligne) return <span className={v.vide} data-etat={c.etat}>{ETAT_VIDE[c.etat]}</span>;
  return (
    <>
      <Marque ligne={c.ligne} perime={c.perime} />
      {c.ligne.mesure ? <Mesure valeur={c.ligne.mesure.valeur} unite={c.ligne.mesure.unite} limite={limite} limiteAlors={c.limiteAlors} date={c.origine?.match(/du (\d+ [^ ]+)$/)?.[1] ?? null} /> : null}
      {seul && c.ligne.constat ? <span className={v.faceConstat}>{lier(c.ligne.constat)}</span> : null}
      {compact && c.ligne.constat ? <span className={v.faceConstat}>{lier(c.ligne.constat)}</span> : null}
      {compact ? null : seul && c.ligne.preuve ? <span className={v.preuve}>{c.ligne.preuve.source}, {c.ligne.preuve.date}{c.origine ? ` · ${c.origine}` : ""}</span> : !seul && c.origine ? <span className={v.preuve}>{c.origine}</span> : null}
    </>
  );
}
