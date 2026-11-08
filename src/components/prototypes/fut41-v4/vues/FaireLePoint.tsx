"use client";
// FAIRE LE POINT · le relevé de la recherche, recalculé à chaque ouverture (X9) : aucune mise en
// cache, aucune IA. La composition est celle de la V3.3 (plaque, rangée des lieux dans l'ordre
// d'ajout, hésitations, pour avancer, ce que futur•e ne mesure pas, provenance au pied).
import { Plaque, releve as s } from "@/components/releve/primitives";
import { analyseServie, dateCourte, faireLePoint } from "../modele";
import { AUJOURDHUI } from "../scenarios";
import type { Api } from "../CentreDecision";
import { EmblemeLieu, Fil, lier } from "../communs";
import v from "../v4.module.css";

export function FaireLePoint({ api }: { api: Api }) {
  const { etat, aller } = api;
  const p = faireLePoint(etat.lieux, etat.projet, AUJOURDHUI);
  const rangee = [...p.rangee].sort((x, y) => x.lieu.ajouteLe.localeCompare(y.lieu.ajouteLe));
  return (
    <>
      <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "decision" }) }, { libelle: "Faire le point" }]} />
      <Plaque etiquette="Relevé de votre recherche" className={v.pointPlaque}>
        <div className={s.pile}>
          <p className={v.mono}>Relevé de votre recherche · {dateCourte(AUJOURDHUI)}</p>
          <h1 className={s.titre} tabIndex={-1} data-titre-vue>Où en est votre recherche</h1>
          <p className={s.chapo}>{lier(p.situation)}</p>
        </div>

        <ul className={v.rangee} aria-label="Vos logements, dans l'ordre où vous les avez ajoutés">
          {rangee.map(({ lieu, etat: e }) => (
            <li key={lieu.id} data-ecarte={lieu.statut === "ecarte" || undefined}>
              <button type="button" className={v.rangeeLieu} onClick={() => aller({ ecran: "fiche", lieu: lieu.id })}>
                <EmblemeLieu lieu={lieu} taille={44} />
                <span className={v.rangeeNom}>{lieu.libelle}</span>
                <span className={v.rangeeEtat}>{e}</span>
              </button>
            </li>
          ))}
        </ul>
        <details className={s.details}>
          <summary>Que disent ces formes ?</summary>
          <p className={s.nuance}>Le cercle est la commune, le carré les abords, le losange le logement. Un trait plein : des constats y ont été lus ; un trait fin : examiné sans constat ; un pointillé : pas encore lu. La rangée suit l&apos;ordre d&apos;ajout.</p>
        </details>

        <div className={v.pointBloc}>
          <p className={v.pointCle}>Ce qui peut vous faire hésiter</p>
          <div className={s.pile}>
            {p.hesitations.length ? p.hesitations.map((h, i) => <p key={i} className={s.corps}>{lier(h)}</p>) : <p className={s.corps}>Rien de particulier : vos logements en course tiennent vos conditions d&apos;après leurs analyses.</p>}
          </div>
        </div>

        <div className={v.pointBloc}>
          <p className={v.pointCle}>Pour avancer</p>
          <ol className={v.actions}>
            {p.actions.map((x, i) => (
              <li key={i}>
                <span className={v.actionNum}>{i + 1}</span>
                <span className={s.pileSerree}>
                  <span className={s.corps}>{lier(x.texte)}</span>
                  <span className={s.nuance}>{x.sous}</span>
                </span>
                <button type="button" className={s.action} onClick={() => aller({ ecran: "fiche", lieu: x.lieuId })}>Ouvrir</button>
              </li>
            ))}
          </ol>
        </div>

        <div className={v.pointBloc}>
          <p className={v.pointCle}>Ce que futur•e ne mesure pas</p>
          <div className={s.pile}>{p.nonMesure.map((x, i) => <p key={i} className={s.corps}>{lier(x)}</p>)}</div>
        </div>

        <p className={v.provenance}>{p.provenance}</p>
      </Plaque>

      <details className={`${s.details} ${v.repose}`}>
        <summary>Sur quoi repose ce point</summary>
        <ul className={v.listeSimple}>
          {etat.lieux.map((l) => {
            const a = analyseServie(l);
            return (
              <li key={l.id} className={s.nuance}>
                <strong className={s.encre}>{l.libelle}</strong> · {a ? `${a.perimetre === "commune" ? "rapport de territoire" : "dossier d'adresse"} du ${dateCourte(a.generatedAt)}, version ${a.version}, ${a.engineVersion}, votre Projet du ${dateCourte(a.projet.date)}${a.simulee ? ", simulé" : ""}` : "aucune analyse"} · {l.observations.length} note{l.observations.length > 1 ? "s" : ""} · {l.verifications.filter((x) => x.reponse).length} réponse{l.verifications.filter((x) => x.reponse).length > 1 ? "s" : ""} à des vérifications
              </li>
            );
          })}
        </ul>
      </details>
    </>
  );
}
