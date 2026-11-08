"use client";
// ET SI… ? (V4.1) · une question, une réponse rangée en seaux. « Et si j'acceptais 30 minutes au lieu
// de 20 ? » : quelles pistes pourraient changer, lesquelles restent valables, lesquelles demanderaient
// une nouvelle analyse, ce qui ne peut pas être déduit. Rien n'est modifié sans confirmation.
import { useEffect, useId, useRef, useState } from "react";
import { Selecteur, releve as s } from "@/components/releve/primitives";
import { dateCourte, etSi, libelleCritere, TITRE_SEAU, type CleCritere, type SeauEtSi } from "./modele41";
import type { Api41 } from "./CentreDecision41";
import { lier } from "./communs41";
import v from "./v41.module.css";

const ORDRE: SeauEtSi[] = ["pourrait_changer", "ecarte_a_revoir", "nouvelle_analyse", "inchange", "pas_lu"];

export function EtSi41({ api, fermer }: { api: Api41; fermer: () => void }) {
  const id = useId();
  const { etat, envoyer } = api;
  const seuils = etat.projet.criteres.filter((c) => c.valeur != null);
  const [cle, setCle] = useState<CleCritere>(seuils[0]?.cle ?? "gare");
  const actuel = etat.projet.criteres.find((c) => c.cle === cle)!;
  const choix = cle === "gare" ? [15, 20, 30, 40] : [10, 15, 25];
  const [val, setVal] = useState<number>(choix.find((x) => x !== actuel.valeur) ?? choix[0]!);
  const [confirmer, setConfirmer] = useState(false);
  const panneau = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panneau.current?.querySelector<HTMLElement>("h2")?.focus();
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") fermer(); };
    document.addEventListener("keydown", echap);
    return () => document.removeEventListener("keydown", echap);
  }, [fermer]);
  const res = val === actuel.valeur ? [] : etSi(etat, cle, val);
  const unite = cle === "mer" ? "km" : "min";

  return (
    <div className={v.voile} onClick={(e) => { if (e.target === e.currentTarget) fermer(); }}>
      <div ref={panneau} className={v.panneau} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
        <div className={v.panneauTete}><p className={v.simulation}>Simulation · votre Projet n&apos;est pas modifié</p><button type="button" className={s.action} onClick={fermer}>Fermer</button></div>
        <h2 className={s.titre} id={`${id}-t`} tabIndex={-1}>Et si… ?</h2>
        {seuils.length > 1 ? <Selecteur id={`${id}-c`} question="La condition" valeur={cle} onChoisir={(k) => { setCle(k); setConfirmer(false); }} options={seuils.map((c) => ({ valeur: c.cle, libelle: libelleCritere(c) }))} /> : null}
        <p className={v.question41}>Et si j&apos;acceptais <strong>{val} {unite}</strong> au lieu de {actuel.valeur} {unite} pour « {libelleCritere(actuel).toLowerCase().replace(/ à moins de .*$/, "")} » ?</p>
        <Selecteur id={`${id}-v`} question="Nouvelle limite" valeur={String(val)} onChoisir={(x) => { setVal(Number(x)); setConfirmer(false); }} options={choix.map((x) => ({ valeur: String(x), libelle: `${x} ${unite}${x === actuel.valeur ? " (actuel)" : ""}` }))} />

        {val === actuel.valeur ? <p className={s.nuance}>C&apos;est votre limite actuelle.</p> : (
          <div className={s.pile} aria-live="polite">
            {ORDRE.map((sx) => {
              const xs = res.filter((r) => r.seau === sx);
              return xs.length ? (
                <div key={sx} className={v.seau} data-seau={sx}>
                  <p className={v.seauTitre}>{TITRE_SEAU[sx]} <span className={v.seauNb}>{xs.length}</span></p>
                  <ul>{xs.map((r) => <li key={r.pisteId}><strong className={s.encre}>{r.nom}</strong> · {lier(r.raison)}</li>)}</ul>
                </div>
              ) : null;
            })}
            <div className={v.seau} data-seau="note">
              <p className={v.seauTitre}>Ce qui ne peut pas être déduit</p>
              <p className={s.dense}>Une analyse ne se recalcule pas toute seule : seule sa mise à jour l&apos;établirait. Vos autres conditions ne changent pas ; leurs conclusions restent valables.</p>
            </div>
            {!confirmer ? (
              <div className={v.ligneGestes}>
                <button type="button" className={s.bouton} onClick={() => setConfirmer(true)}>Adopter {val} {unite} dans mon Projet</button>
                <button type="button" className={s.action} onClick={fermer}>Garder {actuel.valeur} {unite}</button>
              </div>
            ) : (
              <div className={v.confirmer}>
                <p className={s.dense}>Votre Projet passera à la révision {etat.projet.revision + 1}. Les analyses déjà faites restent lisibles telles quelles et seront dites « faites sous votre Projet du {dateCourte(etat.projet.date)} » pour cette condition, jusqu&apos;à leur mise à jour (gratuite pour un dossier acquis). Rien n&apos;est relancé automatiquement.</p>
                <div className={v.ligneGestes}>
                  <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={() => { envoyer({ type: "adopter", modification: { type: "valeur", cle, valeur: val } }); fermer(); }}>Confirmer</button>
                  <button type="button" className={s.action} onClick={() => setConfirmer(false)}>Revenir</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
