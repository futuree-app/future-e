"use client";

// FUT-75 (2e itération) · Q5 · L'ARRIVÉE DE LA LECTURE ENRICHIE. DEV UNIQUEMENT.
//
// En production (`QuartierSynthesis`) : un point qui pulse, « Une lecture enrichie se prépare… », puis
// un bouton, puis le texte remplacé d'un coup. Ici, mêmes états, dits honnêtement :
//   - la lecture de référence est là dès le départ, complète, et le reste quoi qu'il arrive ;
//   - pendant la préparation, une LIGNE D'ÉTAT dit ce qui se passe et depuis combien de temps (un temps
//     réellement écoulé, jamais un pourcentage, jamais une animation qui « réfléchit ») ;
//   - quand le serveur répond, cette même ligne DEVIENT la proposition (« prête, l'afficher ») : un seul
//     élément change de fonction ;
//   - l'affichage échange les deux textes dans un même cadre, qui épouse sa nouvelle hauteur (View
//     Transitions) : on ne perd pas sa place ;
//   - un échec le dit, et rappelle que la lecture affichée est complète.
// Le texte « enrichi » de cette démonstration est un TEXTE D'EXEMPLE, non généré, signalé comme tel.
import { useEffect, useRef, useState } from "react";
import type { ModeMouvement } from "../motion";
import { avecContinuite } from "../vues";
import { libelleAttente, suivantLecture, type EtatLecture, type EvenementLecture } from "./etats";
import type { ReglageServeur } from "./BoutonAction";
import m from "../motion.module.css";

const EXEMPLE = "Texte d'exemple, non généré : une lecture enrichie relierait ici, en une phrase suivie, la trajectoire des étés de la commune à ce que votre projet attend, puis renverrait au geste à mener au logement. Les chiffres et la conclusion resteraient ceux du dossier.";

/** Le banc remonte le composant (clé) pour rejouer la séquence : aucun état n'est réinitialisé dans un effet. */
export function LectureEnrichieNouveau({ reference, serveur, mode }: { reference: string; serveur: ReglageServeur; mode: ModeMouvement }) {
  const [etat, setEtat] = useState<EtatLecture>("deterministe");
  const [ecoule, setEcoule] = useState(0);
  const debut = useRef(0);
  const appliquer = (ev: EvenementLecture) => setEtat((e) => suivantLecture(e, ev));

  // La demande part d'elle-même, comme en production : le lecteur n'attend rien, il lit.
  useEffect(() => {
    let vivant = true;
    const t0 = window.setTimeout(() => {
      if (!vivant) return;
      appliquer({ type: "demande" }); debut.current = performance.now();
      fetch(`/dev/fut75/api/lecture?issue=${serveur.issue === "en_cours" ? "succes" : serveur.issue}&delai=${serveur.delai}`, { method: "POST" })
        .then((r) => { if (vivant) appliquer({ type: "reponse", ok: r.ok }); })
        .catch(() => { if (vivant) appliquer({ type: "reponse", ok: false }); });
    }, 400);
    return () => { vivant = false; window.clearTimeout(t0); };
  }, [serveur.issue, serveur.delai]);

  // Le temps écoulé, relu chaque seconde : c'est la seule « progression » honnête dont on dispose.
  useEffect(() => {
    if (etat !== "preparation") return;
    const t = window.setInterval(() => setEcoule(performance.now() - debut.current), 1000);
    return () => window.clearInterval(t);
  }, [etat]);

  const afficher = (ev: EvenementLecture) => avecContinuite(mode, () => appliquer(ev), "q5");
  const enrichie = etat === "affichee";

  return (
    <div className={m.lectureBloc}>
      <div className={m.lectureCadre} data-vt-nom="fut75-lecture">
        <p className={m.coucheNom}>{enrichie ? "Lecture enrichie · exemple de démonstration" : "Lecture de référence, établie par le dossier"}</p>
        <p className={m.lectureTexte}>{enrichie ? EXEMPLE : reference}</p>
      </div>
      <div className={m.ligneEtat} data-etat={etat} aria-live="polite" data-vt-nom="fut75-ligne-etat">
        {etat === "deterministe" ? <span className={m.ligneEtatTexte}>Lecture complète affichée.</span> : null}
        {etat === "preparation" ? <><span aria-hidden className={m.repereEtat} /><span className={m.ligneEtatTexte}>{libelleAttente(ecoule)}. La lecture ci-dessus est complète.</span></> : null}
        {etat === "prete" ? (
          <button type="button" className={m.propositionLecture} onClick={() => afficher({ type: "afficher" })}>
            <span aria-hidden className={m.repereEtat} data-pret /> Lecture enrichie prête · l&apos;afficher
          </button>
        ) : null}
        {etat === "affichee" ? <button type="button" className={m.propositionLecture} onClick={() => afficher({ type: "revenir" })}>Revenir à la lecture de référence</button> : null}
        {etat === "echec" ? <span className={m.ligneEtatTexte}>La lecture enrichie n&apos;a pas pu être préparée. La lecture affichée est complète, rien ne manque à la décision.</span> : null}
      </div>
    </div>
  );
}

/** Réplique du comportement de production (`QuartierSynthesis`). */
export function LectureEnrichieAncien({ reference, serveur }: { reference: string; serveur: ReglageServeur }) {
  const [etat, setEtat] = useState<"prepa" | "dispo" | "montre" | "echec">("prepa");
  useEffect(() => {
    let vivant = true;
    fetch(`/dev/fut75/api/lecture?issue=${serveur.issue === "en_cours" ? "succes" : serveur.issue}&delai=${serveur.delai}`, { method: "POST" })
      .then((r) => { if (vivant) setEtat(r.ok ? "dispo" : "echec"); }).catch(() => { if (vivant) setEtat("echec"); });
    return () => { vivant = false; };
  }, [serveur.issue, serveur.delai]);
  return (
    <div className="grid gap-4">
      <p className="text-[16px] leading-[1.75] text-muted">{etat === "montre" ? EXEMPLE : reference}</p>
      {etat === "prepa" ? <p className="text-[12px] text-ghost inline-flex items-center gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-info/70 animate-pulse" />Une lecture enrichie se prépare…</p> : null}
      {etat === "dispo" ? <button type="button" className="quartier-regen-btn justify-self-start text-[13px] text-label underline" onClick={() => setEtat("montre")}>Lecture enrichie disponible · l&apos;afficher</button> : null}
    </div>
  );
}
