"use client";
// MON PROJET, V5 · consulter ses conditions, essayer un changement sans rien modifier (« Et si… ? »),
// puis l'adopter explicitement. Essayer et adopter sont deux gestes distincts : l'essai ne touche à
// rien ; l'adoption crée une nouvelle révision, et les analyses déjà faites restent lisibles telles
// qu'elles ont été écrites, sous le Projet d'alors. Rien n'est relancé ni réactivé automatiquement.
import { useId, useState } from "react";
import { Selecteur, releve as s } from "@/components/releve/primitives";
import { dateCourte, etSi5, libelleCritere, montantFr, simuler, NOM_CRITERE, TITRE_SEAU5, type CleCritere, type ModificationProjet, type SeauEtSi } from "../modele5";
import type { Api5 } from "../CentreDecision5";
import { Declare, Section, lier } from "../communs5";
import v from "../v5.module.css";

const ORDRE: SeauEtSi[] = ["pourrait_changer", "ecarte_a_revoir", "nouvelle_analyse", "inchange", "pas_lu"];
const POIDS = { 3: "compte beaucoup", 2: "compte", 1: "compte un peu" } as const;
type Essai = "valeur" | "nature" | "budget";

export function Projet5({ api }: { api: Api5 }) {
  const { etat, aller, envoyer } = api;
  const { projet } = etat;
  const id = useId();
  const durs = projet.criteres.filter((c) => c.nature === "sans_compromis");
  const prefs = projet.criteres.filter((c) => c.nature === "priorite").sort((a, b) => (b.poids ?? 0) - (a.poids ?? 0));
  const seuils = projet.criteres.filter((c) => c.valeur != null);
  // Un essai venu de Comparer arrive tel quel : la personne retrouve le changement qu'elle vient d'examiner.
  const venu = lireEssai(etat.vue.essai, projet.criteres.map((c) => c.cle));

  const [essai, setEssai] = useState<Essai>(venu?.type ?? "valeur");
  const [cle, setCle] = useState<CleCritere>(venu?.type === "valeur" ? venu.cle : seuils[0]?.cle ?? "gare");
  const actuel = projet.criteres.find((c) => c.cle === cle)!;
  const choix = cle === "mer" ? [10, 15, 25] : [15, 20, 30, 40];
  const [val, setVal] = useState<number>(venu?.type === "valeur" && venu.valeur ? venu.valeur : choix.find((x) => x !== actuel.valeur) ?? choix[0]!);
  const [cleNature, setCleNature] = useState<CleCritere>(venu?.type === "nature" ? venu.cle : prefs[0]?.cle ?? projet.criteres[0]!.cle);
  const [repris, setRepris] = useState(venu != null);
  const [budget, setBudget] = useState<number>(projet.budget?.montant ?? 300000);
  const [confirmer, setConfirmer] = useState(false);
  const unite = cle === "mer" ? "km" : "min";
  const kn = projet.criteres.find((c) => c.cle === cleNature)!;

  const modification: ModificationProjet | null = essai === "valeur" ? (val !== actuel.valeur ? { type: "valeur", cle, valeur: val } : null)
    : essai === "nature" ? { type: "nature", cle: cleNature, nature: kn.nature === "sans_compromis" ? "priorite" : "sans_compromis" }
      : budget !== projet.budget?.montant && budget > 0 ? { type: "budget", montant: budget } : null;
  const texte = !modification ? "" : modification.type === "valeur" ? `${NOM_CRITERE[cle]} : ${actuel.valeur} → ${val} ${unite}.`
    : modification.type === "nature" ? `${NOM_CRITERE[cleNature]} devient ${modification.nature === "sans_compromis" ? "une condition sans compromis" : "une priorité"}.`
      : `Budget déclaré : ${montantFr(budget)}.`;
  const seaux = modification?.type === "valeur" ? etSi5(etat, cle, val) : [];
  const effets = modification && modification.type !== "valeur" ? simuler(etat.logements, projet, modification).effets : [];

  return (
    <>
      <div className={v.tete}>
        <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>Mon Projet</h1>
        <p className={s.nuance}>Vos conditions orientent chaque lecture ; aucun score ne les remplace. Révision {projet.revision}, du {dateCourte(projet.date)}</p>
      </div>

      <Section titre="Ce que vous cherchez" id="cherchez">
        <p className={s.corps}>{projet.intention === "achat" ? "Acheter" : "Louer"} un logement{projet.budget ? <>, pour {montantFr(projet.budget.montant)}{projet.budget.periodicite === "mois" ? " par mois" : ""} au plus <Declare>déclaré par vous, non mesuré par futur•e</Declare></> : null}.</p>
        <div className={v.projetColonnes}>
          <div>
            <p className={v.projetCle}>Sans compromis</p>
            <ul className={v.projetListe}>{durs.map((c) => <li key={c.cle} data-dur>{libelleCritere(c)}</li>)}</ul>
            <p className={s.nuance}>Rien ne la compense : un lieu qui ne la tient pas est signalé en tête, quels que soient ses autres points.</p>
          </div>
          <div>
            <p className={v.projetCle}>Ce qui compte</p>
            <ul className={v.projetListe}>{prefs.map((c) => <li key={c.cle}>{libelleCritere(c)}<span className={v.beaucoup}> · {POIDS[(c.poids ?? 1) as 1 | 2 | 3]}</span></li>)}</ul>
          </div>
        </div>
      </Section>

      <Section titre="Et si… ?" id="et-si" sous="Essayez un changement : rien n'est modifié tant que vous ne l'adoptez pas.">
        {repris && modification ? (
          <div className={v.repris} role="note">
            <p className={s.dense}><strong className={s.encre}>Le changement essayé dans Comparer</strong> · {texte} Le voici pour toutes vos possibilités ; rien n&apos;est adopté tant que vous ne le confirmez pas.</p>
            <button type="button" className={`${s.action} ${v.cible}`} onClick={() => aller({ ecran: "comparer" })}>Revenir à la comparaison</button>
          </div>
        ) : null}
        <Selecteur id={`${id}-e`} question="Essayer" valeur={essai} onChoisir={(x) => { setEssai(x); setConfirmer(false); setRepris(false); }}
          options={[{ valeur: "valeur", libelle: "une autre limite" }, { valeur: "nature", libelle: "une autre exigence" }, { valeur: "budget", libelle: "un autre budget" }]} />
        {essai === "valeur" ? (
          <div className={v.essai}>
            {seuils.length > 1 ? <Selecteur id={`${id}-c`} question="La condition" valeur={cle} onChoisir={(k) => { setCle(k); setConfirmer(false); setRepris(false); }} options={seuils.map((c) => ({ valeur: c.cle, libelle: libelleCritere(c) }))} /> : null}
            <p className={v.question41}>Et si j&apos;acceptais <strong>{val} {unite}</strong> au lieu de {actuel.valeur} {unite} pour {NOM_CRITERE[cle].toLowerCase()} ?</p>
            <Selecteur id={`${id}-v`} question="Nouvelle limite" valeur={String(val)} onChoisir={(x) => { setVal(Number(x)); setConfirmer(false); setRepris(false); }} options={choix.map((x) => ({ valeur: String(x), libelle: `${x} ${unite}${x === actuel.valeur ? " (actuelle)" : ""}` }))} />
          </div>
        ) : essai === "nature" ? (
          <div className={v.essai}>
            <Selecteur id={`${id}-n`} question="La condition" valeur={cleNature} onChoisir={(k) => { setCleNature(k); setConfirmer(false); setRepris(false); }} options={projet.criteres.map((c) => ({ valeur: c.cle, libelle: NOM_CRITERE[c.cle] }))} />
            <p className={v.question41}>Et si {NOM_CRITERE[cleNature].toLowerCase()} devenait {kn.nature === "sans_compromis" ? "une simple priorité" : "une condition sans compromis"} ?</p>
          </div>
        ) : (
          <label className={`${v.champ} ${v.essai}`}><span className={s.etiquette}>Budget déclaré (€)</span><input type="number" min={1} max={5000000} step={5000} value={budget} onChange={(e) => { setBudget(Number(e.target.value)); setConfirmer(false); }} /></label>
        )}

        {!modification ? <p className={s.nuance}>C&apos;est votre Projet actuel.</p> : (
          <div className={s.pile} aria-live="polite">
            {modification.type === "valeur" ? ORDRE.map((sx) => {
              const xs = seaux.filter((r) => r.seau === sx);
              return xs.length ? (
                <div key={sx} className={v.seau} data-seau={sx}>
                  <p className={v.seauTitre}>{TITRE_SEAU5[sx]} <span className={v.seauNb}>{xs.length}</span></p>
                  <ul>{xs.map((r) => <li key={r.pisteId}><strong className={s.encre}>{r.nom}</strong> · {lier(r.raison)}</li>)}</ul>
                </div>
              ) : null;
            }) : (
              <div className={v.seau} data-seau="pourrait_changer">
                <p className={v.seauTitre}>Ce qui pourrait changer <span className={v.seauNb}>{effets.length}</span></p>
                {effets.length ? <ul>{effets.map((x, i) => <li key={i}>{lier(x.phrase)}</li>)}</ul> : <p className={s.dense}>Aucune de vos possibilités étudiées n&apos;est concernée d&apos;après ce qui est connu.</p>}
              </div>
            )}
            <div className={v.seau} data-seau="note">
              <p className={v.seauTitre}>Ce qui ne peut pas être déduit</p>
              <p className={s.dense}>Ces effets sont estimés d&apos;après les mesures déjà faites. Seule la mise à jour d&apos;une analyse dirait l&apos;effet réel. Un logement écarté n&apos;est pas remis en course sans vous.</p>
            </div>
            {!confirmer ? (
              <div className={v.ligneGestes}>
                <button type="button" className={s.bouton} onClick={() => setConfirmer(true)}>Adopter ce changement</button>
                <span className={s.nuance}>Ou ne faites rien : votre Projet reste tel qu&apos;il est.</span>
              </div>
            ) : (
              <div className={v.confirmer}>
                <p className={s.dense}>{texte} Votre Projet passera à la révision {projet.revision + 1}. Les analyses déjà faites restent lisibles telles qu&apos;elles ont été écrites, et seront dites « écrites sous votre Projet du {dateCourte(projet.date)} » jusqu&apos;à leur mise à jour (gratuite pour un dossier acquis).</p>
                <div className={v.ligneGestes}>
                  <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={() => { envoyer({ type: "adopter", modification, texte }); setConfirmer(false); }}>Confirmer</button>
                  <button type="button" className={s.action} onClick={() => setConfirmer(false)}>Revenir</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section titre="Ce qui a changé" id="historique">
        <ol className={v.journal}>
          {[...etat.historique].reverse().map((h) => (
            <li key={h.revision}><span className={v.journalDate}>{dateCourte(h.date)}</span><span className={s.dense}><strong className={s.encre}>Révision {h.revision}</strong> · {h.changement}</span></li>
          ))}
        </ol>
      </Section>
    </>
  );
}

/** « valeur.gare.20 » ou « nature.quartier », écrits par l'essai de Comparer ; tout autre texte est ignoré. */
function lireEssai(x: string | undefined, cles: CleCritere[]): { type: "valeur"; cle: CleCritere; valeur: number | null } | { type: "nature"; cle: CleCritere } | null {
  const [t, c, n] = (x ?? "").split(".");
  const cle = cles.find((k) => k === c);
  if (!cle) return null;
  if (t === "nature") return { type: "nature", cle };
  if (t === "valeur" && n && Number.isFinite(Number(n))) return { type: "valeur", cle, valeur: Number(n) };
  return null;
}
