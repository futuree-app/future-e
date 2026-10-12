"use client";

// FUT-75 (2e itération) · Q1 · LE BOUTON D'ACTION. DEV UNIQUEMENT.
//
// « Mettre à jour l'analyse » (`AnalyseAncienProjet`) : en production, le libellé devient « Mise à
// jour… », le bouton pâlit, puis la page se recharge d'un coup. Rien ne confirme, rien ne distingue
// « déjà en cours » d'un échec réseau.
//
// ICI, UN SEUL ÉLÉMENT SE TRANSFORME : le bouton se rétracte en pilule d'attente où l'emblème des trois
// échelles se trace en boucle (le travail est en cours, sans prétendre à un avancement), puis devient la
// confirmation, avec la date de la version renvoyée par le serveur, ou l'échec, avec ce qui reste vrai.
// Le succès n'existe qu'à la réception de la réponse (`suivantAction`). La pression répond tout de
// suite (geste, micro-ressort) ; l'indicateur n'apparaît qu'après 300 ms, une réponse rapide ne fait
// rien clignoter.
import { useEffect, useRef, useState } from "react";
import type { ModeMouvement } from "../motion";
import { DELAI_INDICATEUR, DUREE_CONFIRMATION, suivantAction, type EtatAction, type EvenementAction } from "./etats";
import m from "../motion.module.css";

export type ReglageServeur = { issue: "succes" | "echec" | "en_cours"; delai: number };

function EmblemeAttente() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className={m.emblemeAttente}>
      <circle cx="12" cy="12" r="10.5" pathLength={1} />
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.6" pathLength={1} />
      <rect x="9.3" y="9.3" width="5.4" height="5.4" rx="0.8" transform="rotate(45 12 12)" pathLength={1} />
    </svg>
  );
}

const dateCourte = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(" ", " à ");

export function BoutonActionNouveau({ serveur, mode }: { serveur: ReglageServeur; mode: ModeMouvement }) {
  const [etat, setEtat] = useState<EtatAction>("repos");
  const [indicateur, setIndicateur] = useState(false);
  const [version, setVersion] = useState<{ version: number; genereLe: string } | null>(null);
  const minuteries = useRef<number[]>([]);
  const vider = () => { minuteries.current.forEach((t) => window.clearTimeout(t)); minuteries.current = []; };
  useEffect(() => vider, []);
  const appliquer = (ev: EvenementAction) => setEtat((e) => suivantAction(e, ev));

  const agir = async () => {
    if (etat === "attente") return;
    vider();
    appliquer({ type: "appui" });
    setIndicateur(false);
    minuteries.current.push(window.setTimeout(() => setIndicateur(true), DELAI_INDICATEUR));
    try {
      const res = await fetch(`/dev/fut75/api/actualiser?issue=${serveur.issue}&delai=${serveur.delai}`, { method: "POST" });
      const corps = (await res.json().catch(() => null)) as { statut?: string; version?: number; genereLe?: string } | null;
      vider(); setIndicateur(false);
      appliquer({ type: "reponse", ok: res.ok, statut: corps?.statut });
      if (res.ok && corps?.statut === "ok" && corps.genereLe) {
        setVersion({ version: corps.version ?? 0, genereLe: corps.genereLe });
        minuteries.current.push(window.setTimeout(() => appliquer({ type: "fin_confirmation" }), DUREE_CONFIRMATION));
      }
    } catch {
      vider(); setIndicateur(false);
      appliquer({ type: "erreur_reseau" });
    }
  };

  const libelle = etat === "attente" ? (indicateur ? "Mise à jour en cours" : "Mettre à jour l'analyse")
    : etat === "succes" ? "Analyse mise à jour"
      : etat === "echec" ? "Réessayer la mise à jour"
        : etat === "ailleurs" ? "Mise à jour déjà en cours"
          : "Mettre à jour l'analyse";

  return (
    <div className={m.actionBloc} data-mode={mode}>
      <button type="button" className={m.boutonAction} data-etat={etat} data-indicateur={indicateur || undefined}
        aria-busy={etat === "attente"} aria-disabled={etat === "attente" || undefined} onClick={agir}>
        <span className={m.boutonActionFond} aria-hidden />
        <span key={`${etat}-${indicateur}`} className={`${m.boutonActionContenu} ${m.bascule}`}>
          {etat === "attente" && indicateur ? <EmblemeAttente /> : null}
          {etat === "succes" ? <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden className={m.coche}><path d="M3 8.5 6.5 12 13 4.5" pathLength={1} /></svg> : null}
          {libelle}
        </span>
      </button>
      <p className={m.actionCompteRendu} aria-live="polite" data-etat={etat}>
        {etat === "succes" && version ? `Version ${version.version} établie le ${dateCourte(version.genereLe)}. La précédente reste consultable.`
          : etat === "echec" ? "La mise à jour n'a pas abouti. L'analyse affichée reste valable : c'est celle sur laquelle vous avez décidé."
            : etat === "ailleurs" ? "Une mise à jour de ce dossier est déjà en cours. Elle apparaîtra ici dès qu'elle sera prête."
              : etat === "attente" ? "Mise à jour demandée, en attente de la réponse du serveur. L'analyse affichée reste consultable."
              : version ? `Dernière mise à jour : version ${version.version}, ${dateCourte(version.genereLe)}.` : "Votre projet a changé depuis cette analyse."}
      </p>
    </div>
  );
}

/** Réplique du comportement de production (`AnalyseAncienProjet`), pour comparer. */
export function BoutonActionAncien({ serveur }: { serveur: ReglageServeur }) {
  const [etat, setEtat] = useState<"repos" | "encours" | "ailleurs" | "echec">("repos");
  const agir = async () => {
    setEtat("encours");
    try {
      const res = await fetch(`/dev/fut75/api/actualiser?issue=${serveur.issue}&delai=${serveur.delai}`, { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      const corps = (await res.json().catch(() => null)) as { statut?: string } | null;
      setEtat(corps?.statut === "en_cours" ? "ailleurs" : "repos"); // en production : router.refresh(), la page change d'un coup
    } catch { setEtat("echec"); }
  };
  return (
    <div className="grid gap-2">
      <button onClick={agir} disabled={etat === "encours"} className="text-[13px] px-3.5 py-2 rounded-lg border border-[var(--border-1)] bg-transparent text-label hover:border-[var(--border-2)] transition-colors disabled:opacity-60 justify-self-start">
        {etat === "encours" ? "Mise à jour…" : "Mettre à jour l'analyse"}
      </button>
      {etat === "ailleurs" ? <p className="text-[12.5px] text-muted">Une mise à jour est déjà en cours. Rechargez la page dans un instant.</p> : null}
      {etat === "echec" ? <p className="text-[12.5px] text-muted">La mise à jour n&apos;a pas abouti. L&apos;analyse ci-dessous reste celle de votre achat.</p> : null}
    </div>
  );
}
