"use client";

// FUT-75 (2e itération) · LES INTERACTIONS DU QUOTIDIEN, AU BANC. DEV UNIQUEMENT.
//
// Six propositions, chacune face au comportement actuel : à gauche l'ancien (composant de production
// quand il peut tourner seul, sinon une réplique fidèle), à droite le nouveau. Un mode de mouvement
// par proposition ; pour les deux qui attendent un serveur, l'issue et le délai de la vraie réponse.
import { memo, useState, type ReactNode } from "react";
import type { ModeMouvement } from "../motion";
import type { DonneesChemin } from "../CheminDeLaDecision";
import { BoutonActionAncien, BoutonActionNouveau, type ReglageServeur } from "./BoutonAction";
import { SelectionsAncien, SelectionsNouveau } from "./Selections";
import { SelectionCommuneAncien, SelectionCommuneNouveau } from "./SelectionCommune";
import { CartePreuvesAncien, CartePreuvesNouveau } from "./CartePreuves";
import { LectureEnrichieAncien, LectureEnrichieNouveau } from "./LectureEnrichie";
import { TransitionVuesAncien, TransitionVuesNouveau, type Apercu } from "./TransitionVues";
import m from "../motion.module.css";

type ChoixMode = "systeme" | ModeMouvement;
const MODES: { cle: ChoixMode; nom: string }[] = [{ cle: "systeme", nom: "selon le système" }, { cle: "anime", nom: "animé" }, { cle: "reduit", nom: "réduit" }, { cle: "aucun", nom: "sans animation" }];

function Choix<T extends string>({ legende, valeurs, courant, choisir }: { legende: string; valeurs: { cle: T; nom: string }[]; courant: T; choisir: (v: T) => void }) {
  return (
    <fieldset>
      <legend>{legende}</legend>
      {valeurs.map((v) => <button key={v.cle} type="button" className={m.choix} aria-pressed={v.cle === courant} onClick={() => choisir(v.cle)}>{v.nom}</button>)}
    </fieldset>
  );
}

function Bloc({ id, numero, titre, avant, apres, effectif, serveur, children }: {
  id: string; numero: string; titre: string; avant: ReactNode; apres: ReactNode; effectif: (c: ChoixMode) => ModeMouvement;
  serveur?: boolean; children: (mode: ModeMouvement, s: ReglageServeur, rejeu: number) => { ancien: ReactNode; nouveau: ReactNode };
}) {
  const [choix, setChoix] = useState<ChoixMode>("systeme");
  const [issue, setIssue] = useState<ReglageServeur["issue"]>("succes");
  const [delai, setDelai] = useState(1600);
  const [rejeu, setRejeu] = useState(0);
  const mode = effectif(choix);
  const contenu = children(mode, { issue, delai }, rejeu);
  return (
    <section id={id} className={`${m.prototype} ${m.atelier}`} data-mouvement={mode} aria-labelledby={`${id}-t`}>
      <div className="grid gap-2">
        <p className="font-mono text-[11.5px] text-ghost">{numero}</p>
        <h3 id={`${id}-t`} className="text-[22px] leading-[1.2] text-label" style={{ fontVariationSettings: '"wdth" 108', fontWeight: 600 }}>{titre}</h3>
        <div className={m.notes}><p><strong>Aujourd&apos;hui.</strong> {avant}</p><p><strong>Proposé.</strong> {apres}</p></div>
      </div>
      <div className={m.reglages}>
        <Choix legende="Mouvement" courant={choix} choisir={setChoix} valeurs={MODES} />
        {serveur ? <>
          <Choix legende="Réponse du serveur" courant={issue} choisir={setIssue} valeurs={[{ cle: "succes", nom: "succès" }, { cle: "echec", nom: "échec" }, { cle: "en_cours", nom: "déjà en cours" }]} />
          <Choix legende="Délai" courant={String(delai)} choisir={(v) => setDelai(Number(v))} valeurs={[{ cle: "150", nom: "0,15 s" }, { cle: "1600", nom: "1,6 s" }, { cle: "5000", nom: "5 s" }]} />
          <button type="button" className={m.choix} onClick={() => setRejeu((n) => n + 1)}>Rejouer</button>
        </> : null}
      </div>
      <div className={m.comparaison}>
        <div className={m.colonneAncien}><p className={m.etiquetteColonne}>Avant · comportement actuel</p>{contenu.ancien}</div>
        <div className={m.colonneNouveau}><p className={m.etiquetteColonne}>Après · proposition</p>{contenu.nouveau}</div>
      </div>
    </section>
  );
}

export const Quotidien = memo(function Quotidien({ chemin, apercu, effectif }: {
  chemin: DonneesChemin | null; apercu: Apercu | null; effectif: (c: ChoixMode) => ModeMouvement;
}) {
  return (
    <div id="quotidien" className="grid">
      <header className="grid gap-3 pt-16 pb-2" style={{ borderTop: "1px solid var(--r-filet)" }}>
        <h2 className="text-[30px] leading-[1.1] text-label" style={{ fontVariationSettings: '"wdth" 118', fontWeight: 500 }}>Interactions du quotidien</h2>
        <p className="text-[15.5px] leading-[1.6] text-muted">Les grands mouvements donnent sa signature au dossier ; ceux-ci donnent sa qualité à chaque geste. Six interactions choisies parmi les parcours réels, chacune face à son comportement actuel.</p>
      </header>

      <Bloc id="q1" numero="Q1 · bouton d'action" titre="Mettre à jour une analyse" serveur effectif={effectif}
        avant="le libellé devient « Mise à jour… », le bouton pâlit, puis la page se recharge d'un coup ; rien ne confirme."
        apres="le bouton lui-même se transforme : attente (l'emblème se trace en boucle), puis confirmation avec la date de la nouvelle version, ou échec avec ce qui reste vrai. Aucun succès avant la réponse du serveur.">
        {(mode, s, rejeu) => ({ ancien: <BoutonActionAncien key={rejeu} serveur={s} />, nouveau: <BoutonActionNouveau key={rejeu} serveur={s} mode={mode} /> })}
      </Bloc>

      <Bloc id="q2" numero="Q2 · sélections et onglets" titre="Choisir un horizon, une échelle, une mesure" effectif={effectif}
        avant="l'option choisie change de fond d'un coup (ci-contre, le composant HorizonSwitch de production)."
        apres="un indicateur élastique : le bord de tête s'étire vers la cible, l'autre suit, l'ensemble se pose sur un micro-ressort ; il penche vers l'option survolée.">
        {(mode) => ({ ancien: <SelectionsAncien />, nouveau: <SelectionsNouveau mode={mode} /> })}
      </Bloc>

      <Bloc id="q3" numero="Q3 · sélection de communes" titre="Ajouter une commune à la comparaison" effectif={effectif}
        avant="une case se coche, un compteur change ; la commune ne va nulle part."
        apres="la commune rejoint le plateau de comparaison : son étiquette devient un jeton, le compteur se pose, la limite de trois est dite sans secousse.">
        {(mode) => ({ ancien: <SelectionCommuneAncien />, nouveau: <SelectionCommuneNouveau mode={mode} /> })}
      </Bloc>

      {chemin ? (
        <Bloc id="q4" numero="Q4 · cartes, sources, accordéons" titre="Ouvrir les preuves d'un constat" effectif={effectif}
          avant="« Données et limites » s'ouvre d'un coup ; ce qui suit saute de toute la hauteur révélée."
          apres="la carte s'agrandit à la hauteur de son contenu, le contenu monte de 6 px en apparaissant, le titre ne bouge pas ; le bouton dit ce qu'il ouvre.">
          {() => ({ ancien: <CartePreuvesAncien donnees={chemin} />, nouveau: <CartePreuvesNouveau donnees={chemin} /> })}
        </Bloc>
      ) : null}

      {chemin ? (
        <Bloc id="q5" numero="Q5 · chargement" titre="L'arrivée de la lecture enrichie" serveur effectif={effectif}
          avant="un point qui pulse, « se prépare… », puis un bouton, puis le texte remplacé d'un coup."
          apres="la lecture de référence est complète dès le départ ; une ligne d'état dit ce qui se passe et depuis combien de secondes, puis devient la proposition ; l'échange se fait dans un même cadre qui épouse sa hauteur.">
          {(mode, s, rejeu) => ({
            ancien: <LectureEnrichieAncien key={`a-${rejeu}-${s.issue}-${s.delai}`} reference={`${chemin.fait.enonce} ${chemin.limite}`} serveur={s} />,
            nouveau: <LectureEnrichieNouveau key={`n-${rejeu}-${s.issue}-${s.delai}`} reference={`${chemin.fait.enonce} ${chemin.limite}`} serveur={s} mode={mode} />,
          })}
        </Bloc>
      ) : null}

      {apercu ? (
        <Bloc id="q6" numero="Q6 · navigation et transitions" titre="Passer d'une échelle à l'autre, revenir à une preuve" effectif={effectif}
          avant="la vue est remplacée sans transition ; une preuve d'arrivée est désignée par un bref contour."
          apres="la vue arrive du côté où l'on va (vers le précis à droite, vers le large à gauche), le glyphe de l'échelle se transforme ; « voir la preuve » pose le lecteur sur la carte visée, qui s'éclaire puis s'efface.">
          {(mode) => ({ ancien: <TransitionVuesAncien apercu={apercu} />, nouveau: <TransitionVuesNouveau apercu={apercu} mode={mode} /> })}
        </Bloc>
      ) : null}
    </div>
  );
});
