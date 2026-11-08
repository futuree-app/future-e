"use client";
// MA DÉCISION · l'espace de la recherche. Utile dès un logement (sa conclusion, sa prochaine
// vérification), comparative dès deux. Aucune seconde navigation : la recherche est un état de cet
// espace, pas une page concurrente (décision Y2).
import { useState } from "react";
import { releve as s, Selecteur } from "@/components/releve/primitives";
import {
  analyseServie, conditionsNonTenues, connaissance, criteresDepasses, dateCourte, examinerMaintenant, faireLePoint,
  libelleConnaissance, libelleCritere, LIBELLE_DIMENSION, LIBELLE_NATURE, LIBELLE_STATUT, montantAnnonce, montantFr, trier,
  type DimensionTri, type Lieu,
} from "../modele";
import { AUJOURDHUI } from "../scenarios";
import { PASS_INCLUSES } from "../etat";
import type { Api } from "../CentreDecision";
import { Declare, EmblemeLieu, Mouvement, lier } from "../communs";
import { AjoutLogement } from "../AjoutLogement";
import v from "../v4.module.css";

const DIMENSIONS: DimensionTri[] = ["maintenant", "ajout", "montant", "surface", "trajet"];

export function MaDecision({ api }: { api: Api }) {
  const { etat, aller } = api;
  const { lieux, projet } = etat;
  const actifs = lieux.filter((l) => l.statut !== "ecarte");
  const ecartes = lieux.filter((l) => l.statut === "ecarte");
  const [dim, setDim] = useState<DimensionTri>(actifs.length > 1 ? "maintenant" : "ajout");
  const [selection, setSelection] = useState<string[]>([]);
  const [ajout, setAjout] = useState(lieux.length === 0);
  const point = faireLePoint(lieux, projet, AUJOURDHUI);
  const groupes = dim === "maintenant" ? examinerMaintenant(lieux, projet, AUJOURDHUI) : trier(lieux, dim, projet, AUJOURDHUI);
  const raisonDe = new Map(examinerMaintenant(lieux, projet, AUJOURDHUI).flatMap((g) => g.lieux.map((x) => [x.lieu.id, { titre: g.titre, raison: x.raison }] as const)));

  const titre = actifs.length === 0
    ? "Votre recherche commence par un logement"
    : actifs.length === 1
      ? `${actifs[0]!.libelle}, le logement que vous étudiez`
      : "Votre recherche";

  const basculer = (id: string) => setSelection((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  return (
    <>
      <div className={v.entete}>
        <p className={s.surtitre}><span>Ma décision</span></p>
        <h1 className={`${s.display} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{lier(titre)}</h1>
        {actifs.length > 1 ? <p className={s.chapo}>{lier(point.situation)}</p> : null}
      </div>

      <BandeProjet api={api} />

      {actifs.length > 1 ? (
        <Mouvement numero="01" titre="Où en est votre recherche" id="ou">
          <div className={v.pointCourt}>
            <ul className={v.listeSimple}>
              {point.hesitations.slice(0, 3).map((h, i) => <li key={i} className={s.corps}>{lier(h)}</li>)}
            </ul>
            <div className={v.gestes}>
              <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={() => aller({ ecran: "point" })}>Faire le point</button>
              <button type="button" className={s.bouton} onClick={() => aller({ ecran: "comparer", mode: "ensemble", selection: actifs.map((l) => l.id) })}>Comparer mes logements</button>
            </div>
          </div>
        </Mouvement>
      ) : null}

      <Mouvement
        numero={actifs.length > 1 ? "02" : "01"}
        titre="Vos logements"
        id="logements"
        action={<button type="button" className={s.action} onClick={() => setAjout((x) => !x)} aria-expanded={ajout}>{ajout ? "Fermer l'ajout" : "Ajouter un logement"}</button>}
      >
        {ajout ? <AjoutLogement api={api} fermer={() => setAjout(false)} /> : null}

        {actifs.length > 1 ? (
          <div className={v.tri}>
            <Selecteur id="tri-logements" question="Ranger selon" options={DIMENSIONS.map((d) => ({ valeur: d, libelle: LIBELLE_DIMENSION[d] }))} valeur={dim} onChoisir={(d) => setDim(d)} />
            <p className={s.nuance}>
              {dim === "maintenant"
                ? "Des règles appliquées dans un ordre fixe : chaque logement porte la règle qui le place. Un logement qui ne tient pas une condition sans compromis reste en dernier."
                : dim === "trajet" ? "Mesuré par chaque analyse depuis l'adresse. Ce qui n'est pas mesuré à l'adresse reste à part."
                  : dim === "ajout" ? "L'ordre dans lequel vous les avez gardés." : "Valeurs déclarées par les annonces, non vérifiées par futur•e."}
            </p>
          </div>
        ) : null}

        {actifs.length === 0 && !ajout ? (
          <p className={s.corps}>Gardez ici les logements que vous envisagez, même sans adresse exacte. Une annonce, un lien ou quelques mots suffisent ; futur•e ne lit rien sans votre geste.</p>
        ) : null}

        {groupes.map((g) => (
          <div key={g.titre} className={v.groupe}>
            {actifs.length > 1 ? <p className={v.groupeTitre}>{g.titre}</p> : null}
            {g.note ? <p className={s.nuance}>{g.note}</p> : null}
            <ul className={v.lieux}>
              {g.lieux.map(({ lieu, valeur, raison }) => (
                <LigneLieu key={lieu.id} api={api} lieu={lieu} valeur={dim !== "maintenant" && dim !== "ajout" ? valeur : null}
                  raison={dim === "maintenant" ? raison ?? null : raisonDe.get(lieu.id)?.raison ?? null}
                  coche={selection.includes(lieu.id)} basculer={actifs.length > 1 ? () => basculer(lieu.id) : undefined} />
              ))}
            </ul>
          </div>
        ))}

        {selection.length > 0 ? (
          <div className={v.barreSelection} role="region" aria-label="Comparer la sélection">
            <span>{selection.length} logement{selection.length > 1 ? "s" : ""} choisi{selection.length > 1 ? "s" : ""}</span>
            <button type="button" className={`${s.bouton} ${s.boutonMarque}`} disabled={selection.length < 2}
              onClick={() => aller({ ecran: "comparer", mode: selection.length === 2 ? "face" : "ensemble", selection })}>
              {selection.length < 2 ? "Choisissez-en un deuxième" : selection.length === 2 ? "Face-à-face" : "Comparer"}
            </button>
            <button type="button" className={s.action} onClick={() => setSelection([])}>Annuler</button>
          </div>
        ) : null}

        {ecartes.length ? (
          <details className={`${s.details} ${v.ecartes}`}>
            <summary>{ecartes.length} logement{ecartes.length > 1 ? "s" : ""} écarté{ecartes.length > 1 ? "s" : ""}, et pourquoi</summary>
            <ul className={v.lieux}>
              {ecartes.map((l) => <LigneEcarte key={l.id} api={api} lieu={l} />)}
            </ul>
          </details>
        ) : null}
      </Mouvement>

      <Acces api={api} numero={actifs.length > 1 ? "03" : "02"} />
    </>
  );
}

function BandeProjet({ api }: { api: Api }) {
  const { projet } = api.etat;
  const durs = projet.criteres.filter((c) => c.nature === "sans_compromis");
  const prefs = projet.criteres.filter((c) => c.nature === "priorite").sort((a, b) => (b.poids ?? 0) - (a.poids ?? 0));
  return (
    <section className={v.projet} aria-labelledby="projet-titre">
      <div className={v.projetTete}>
        <p className={s.etiquette} id="projet-titre">Votre Projet · {projet.intention === "location" ? "une location" : "un achat"} · révision {projet.revision} du {dateCourte(projet.date)}</p>
        <button type="button" className={s.action} onClick={(e) => api.ouvrirEtSi(e.currentTarget)}>Et si mon Projet changeait ?</button>
      </div>
      <div className={v.projetCorps}>
        <p className={v.projetLigne}>
          <span className={v.projetCle}>Sans compromis</span>
          {durs.map((c, i) => <span key={c.cle} className={v.projetValeur}>{i > 0 ? " · " : ""}{libelleCritere(c)}</span>)}
        </p>
        <p className={v.projetLigne}>
          <span className={v.projetCle}>Ce qui compte</span>
          {prefs.map((c, i) => <span key={c.cle} className={v.projetValeur}>{i > 0 ? " · " : ""}{libelleCritere(c)}{c.poids === 3 ? " (beaucoup)" : ""}</span>)}
        </p>
        {projet.budget ? (
          <p className={v.projetLigne}>
            <span className={v.projetCle}>Budget</span>
            <span className={v.projetValeur}>{montantFr(projet.budget.montant)}{projet.budget.periodicite === "mois" ? " par mois" : ""} <Declare>non mesuré par futur•e</Declare></span>
          </p>
        ) : null}
      </div>
    </section>
  );
}

function LigneLieu({ api, lieu, valeur, raison, coche, basculer }: { api: Api; lieu: Lieu; valeur: string | null; raison: string | null; coche: boolean; basculer?: () => void }) {
  const { aller, etat } = api;
  const a = analyseServie(lieu);
  const nt = conditionsNonTenues(lieu, etat.projet);
  const depasses = a ? criteresDepasses(a, etat.projet) : [];
  const k = connaissance(lieu);
  return (
    <li className={v.lieu} data-connaissance={k}>
      {basculer ? (
        <label className={v.coche}>
          <input type="checkbox" checked={coche} onChange={basculer} />
          <span className={v.sr}>Choisir {lieu.libelle} pour comparer</span>
        </label>
      ) : <span />}
      <EmblemeLieu lieu={lieu} />
      <div className={v.lieuCorps}>
        <div className={v.lieuTete}>
          <h3 className={v.lieuNom}>
            <button type="button" className={v.lieuLien} onClick={() => aller({ ecran: "fiche", lieu: lieu.id })}>{lieu.libelle}</button>
          </h3>
          <span className={v.statut} data-statut={lieu.statut}>{LIBELLE_STATUT[lieu.statut]}{lieu.statut === "a_visiter" && lieu.visiteLe ? ` · ${dateCourte(lieu.visiteLe)}` : ""}</span>
        </div>
        <p className={v.lieuSous}>{lieu.commune.nom}{lieu.adresse ? "" : " · adresse inconnue"} · {libelleConnaissance(lieu)}</p>
        {a ? (
          <p className={v.conclusion}>
            <span className={v.conclusionMarque} style={{ "--r-teinte": a.conclusion.ton === "positif" ? "var(--reg-alignement)" : a.conclusion.ton === "critique" ? "var(--reg-incompatibilite)" : "var(--reg-compromis)" } as React.CSSProperties} aria-hidden />
            <span>« {lier(a.conclusion.phrase)} »</span>
          </p>
        ) : lieu.annonce ? (
          <p className={v.annonceCourte}>
            <Declare>l&apos;annonce déclare</Declare> {[montantAnnonce(lieu.annonce), lieu.annonce.surface ? `${lieu.annonce.surface} m²` : null, lieu.annonce.pieces ? `${lieu.annonce.pieces} pièce${lieu.annonce.pieces > 1 ? "s" : ""}` : null, LIBELLE_NATURE[lieu.annonce.nature ?? "non_precise"]].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {nt.filter((x) => x.aJour).map((x) => <p key={x.cle} className={v.alerte}>{lier(x.phrase)}</p>)}
        {raison ? <p className={v.prochain}><span className={v.prochainCle}>Prochain pas</span> {lier(raison)}</p> : null}
      </div>
      <div className={v.lieuMarge}>
        {valeur ? <span className={v.valeurTri}>{valeur}</span> : null}
        {a ? <span>Dossier du {dateCourte(a.generatedAt)}{a.version > 1 ? ` · v${a.version}` : ""}{a.simulee ? " · simulé" : ""}</span> : <span>Ajouté le {dateCourte(lieu.ajouteLe)}</span>}
        {a ? <span>{depasses.length ? `Projet du ${dateCourte(a.projet.date)} pour ${depasses.map((d) => d.avant.toLowerCase()).join(", ")}` : "Répond à votre Projet actuel"}</span> : null}
        {lieu.annonce?.nature && lieu.annonce.nature !== (etat.projet.intention === "location" ? "location" : "vente") ? <span className={v.nature}>Annonce {LIBELLE_NATURE[lieu.annonce.nature]}</span> : null}
      </div>
    </li>
  );
}

function LigneEcarte({ api, lieu }: { api: Api; lieu: Lieu }) {
  const e = [...lieu.journal].reverse().find((x) => x.type === "ecarte");
  const c = e?.contexte?.cle ? api.etat.projet.criteres.find((x) => x.cle === e.contexte!.cle) : undefined;
  const change = c && e?.contexte?.valeur != null && c.valeur !== e.contexte.valeur;
  return (
    <li className={v.lieu} data-ecarte>
      <span />
      <EmblemeLieu lieu={lieu} taille={36} />
      <div className={v.lieuCorps}>
        <h3 className={v.lieuNom}><button type="button" className={v.lieuLien} onClick={() => api.aller({ ecran: "fiche", lieu: lieu.id })}>{lieu.libelle}</button></h3>
        <p className={s.dense}>Écarté le {e ? dateCourte(e.date) : "?"} : « {e?.raison} »{e?.contexte?.condition ? `, quand votre condition était ${e.contexte.condition}` : ""}.</p>
        {change ? <p className={v.prochain}><span className={v.prochainCle}>Votre Projet a changé</span> aujourd&apos;hui : {libelleCritere(c!).toLowerCase()}. Cette raison mérite peut-être d&apos;être revue.</p> : null}
      </div>
      <div className={v.lieuMarge}>
        <button type="button" className={s.action} onClick={() => api.envoyer({ type: "reactiver", lieu: lieu.id })}>Remettre en course</button>
      </div>
    </li>
  );
}

function Acces({ api, numero }: { api: Api; numero: string }) {
  const { etat } = api;
  const adresses = etat.lieux.filter((l) => l.droit === "adresse").length;
  const territoires = etat.lieux.filter((l) => l.droit === "territoire").length;
  return (
    <Mouvement numero={numero} titre="Ce que vous pouvez faire ici" id="acces">
      <div className={v.acces}>
        <div className={s.pile}>
          <p className={s.corps}>Garder des logements, noter une visite, répondre à une vérification, comparer ce qui se compare et faire le point : sans paiement, et sans limite de temps.</p>
          <p className={s.corps}>Vos {adresses} dossier{adresses > 1 ? "s" : ""} d&apos;adresse{territoires ? ` et votre rapport de territoire` : ""} se relisent quand vous voulez ; leur mise à jour avec votre Projet actuel est gratuite.</p>
        </div>
        {etat.droits === "pass" ? (
          <div className={v.pass}>
            <p className={s.etiquette}>Pass Recherche · hypothèse de revue, ni prix ni quotas décidés (FUT-49)</p>
            <p className={s.sousTitre}>Vous pouvez encore analyser {PASS_INCLUSES - etat.passUtilisees} adresses jusqu&apos;au 18 janv.</p>
            <div className={v.jauge} aria-hidden>
              {Array.from({ length: PASS_INCLUSES }, (_, i) => <span key={i} data-plein={i < etat.passUtilisees || undefined} />)}
            </div>
            <p className={s.nuance}>{etat.passUtilisees} analyses d&apos;adresse sur {PASS_INCLUSES} utilisées depuis le 20 oct. (90 jours). Aucune n&apos;est comptée sur une erreur ou une adresse introuvable. À la fin, vos dossiers restent lisibles.</p>
          </div>
        ) : (
          <div className={v.pass}>
            <p className={s.etiquette}>À l&apos;unité (tarifs en vigueur)</p>
            <p className={s.dense}>Analyser une nouvelle adresse : un dossier d&apos;adresse à 39 €. Lire une nouvelle commune : un rapport de territoire à 14 €.</p>
            <p className={s.nuance}>Aucun paiement n&apos;est simulé dans ce prototype.</p>
          </div>
        )}
      </div>
    </Mouvement>
  );
}
