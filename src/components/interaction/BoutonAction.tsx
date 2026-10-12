"use client";

// FUT-75 · LE BOUTON D'ACTION ENGAGÉE (Q1, validé en revue). Composant d'AFFICHAGE : aucun appel réseau.
//
// Un seul élément se transforme : au repos, il s'enfonce à la pression (geste) ; en attente, il se rétracte
// en pilule où l'emblème des trois échelles se trace en boucle (un travail en cours, sans prétendre à un
// avancement), mais seulement après 300 ms (une réponse rapide ne fait rien clignoter) ; puis il devient la
// confirmation, ou l'échec avec la possibilité de réessayer. L'état vient de l'appelant, qui le fait
// avancer par des issues RÉELLES (`suivantAction`, `issueDepuisReponse`) : le composant ne peut pas
// afficher un succès que le serveur n'a pas rendu.
//
// Raccordé à `AnalyseAncienProjet` (FUT-93), qui lance la demande et fait avancer l'état.
import { useEffect, useState, type ReactNode } from "react";
import { DELAI_INDICATEUR } from "@/lib/motion";
import type { EtatAction } from "@/lib/interaction/etat-action";
import m from "./bouton-action.module.css";

function EmblemeAttente() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className={m.embleme}>
      <circle cx="12" cy="12" r="10.5" pathLength={1} />
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.6" pathLength={1} />
      <rect x="9.3" y="9.3" width="5.4" height="5.4" rx="0.8" transform="rotate(45 12 12)" pathLength={1} />
    </svg>
  );
}

export type LibellesAction = { repos: string; attente: string; succes: string; echec: string; ailleurs: string };

export function BoutonAction({ etat, onAppui, libelles, compteRendu }: {
  etat: EtatAction;
  /** Appelé au premier appui accepté ; l'appelant lance l'opération et fait avancer l'état. */
  onAppui: () => void;
  libelles: LibellesAction;
  /** La phrase sous le bouton (annoncée aux lecteurs d'écran) : date de version, motif d'échec… */
  compteRendu?: ReactNode;
}) {
  // L'indicateur n'apparaît qu'après 300 ms d'attente. Remis à zéro au rendu suivant toute sortie d'attente.
  const [indicateur, setIndicateur] = useState(false);
  useEffect(() => {
    if (etat !== "attente") return;
    const t = window.setTimeout(() => setIndicateur(true), DELAI_INDICATEUR);
    return () => { window.clearTimeout(t); setIndicateur(false); };
  }, [etat]);
  const enAttente = etat === "attente";
  const visible = enAttente && indicateur;
  return (
    <div className={m.bloc}>
      <button type="button" className={m.bouton} data-etat={etat} aria-busy={enAttente} aria-disabled={enAttente || undefined}
        onClick={() => { if (!enAttente) onAppui(); }}>
        <span className={m.fond} aria-hidden />
        <span key={`${etat}-${visible}`} className={m.contenu}>
          {visible ? <EmblemeAttente /> : null}
          {etat === "succes" ? <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden className={m.coche}><path d="M3 8.5 6.5 12 13 4.5" pathLength={1} /></svg> : null}
          {enAttente ? (visible ? libelles.attente : libelles.repos) : libelles[etat]}
        </span>
      </button>
      {compteRendu ? <p className={m.compteRendu} data-etat={etat} aria-live="polite">{compteRendu}</p> : null}
    </div>
  );
}
