"use client";
// UN LOGEMENT, V5 · dans l'ordre : ce qu'il est (déclaré), où il en est et le seul geste utile, ce que
// conclut son dossier (daté, avec la version du Projet), puis la même confrontation que Comparer, sur
// une colonne. Ensuite ce que la personne apporte : vérifications, notes avec leur origine, écart.
import { useId, useState } from "react";
import { Plaque, Selecteur, releve as s } from "@/components/releve/primitives";
import {
  alertes, analyseServie, communeDe, confronter, criteresDepasses, dateCourte, gestePrincipal, libelleCritere,
  montantAnnonce, LIBELLE_NATURE, LIBELLE_STATUT, NOM_CRITERE,
  type CleCritere, type Logement, type NatureObservation, type Verification,
} from "../modele5";
import { faireGeste, type Api5 } from "../CentreDecision5";
import { BoutonGeste, Declare, Fil, Section, Vignette, lier } from "../communs5";
import { Confrontation } from "../Confrontation";
import { savoirCourt } from "./Ensemble";
import v from "../v5.module.css";

export const ORIGINE: Record<NatureObservation, string> = { observation: "Vu par vous", declaration: "Dit par le vendeur ou l'agence", document: "Lu dans un document" };

export function FicheLogement5({ api }: { api: Api5 }) {
  const { etat, aller } = api;
  const l = etat.logements.find((x) => x.id === etat.vue.id);
  if (!l) return <h1 className={s.titre} tabIndex={-1} data-titre-vue>Ce logement n&apos;est pas dans cette situation</h1>;
  const c = communeDe(etat, l);
  const a = analyseServie(l);
  const piste = { type: "logement" as const, logement: l };
  const g = gestePrincipal(etat, piste, etat.droits);
  const dep = a ? criteresDepasses(a, etat.projet) : [];
  const al = alertes(etat, [piste]);
  const conf = confronter(etat, [piste]);

  return (
    <>
      <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "ensemble" }) }, ...(c ? [{ libelle: c.nom, aller: () => aller({ ecran: "commune", id: `c:${c.insee}` }) }] : []), { libelle: l.libelle }]} />
      <div className={v.ficheTete}>
        <Photo api={api} logement={l} />
        <div className={s.pileSerree}>
          <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{l.libelle}</h1>
          <p className={s.nuance}>{l.adresse ?? `${l.commune.nom} · adresse exacte inconnue`}</p>
          <p className={v.logementSous}>{[montantAnnonce(l.annonce), l.annonce?.surface ? `${l.annonce.surface} m²` : null, l.annonce?.pieces ? `${l.annonce.pieces} pièces` : null, l.annonce ? LIBELLE_NATURE[l.annonce.nature ?? "non_precise"] : null].filter(Boolean).join(" · ")} <Declare>déclaré par l&apos;annonce</Declare></p>
        </div>
      </div>
      <Statut api={api} logement={l} />

      <Section titre="Où il en est" id="savoir">
        <p className={s.corps}>{savoirCourt(api, l).replace(/\.?$/, ".")}</p>
        {al.map((x) => <p key={x.cle} className={v.alerte} data-genre={x.genre}>{lier(x.phrase)}</p>)}
        {g.cle === "adresse" ? <Adresse api={api} logement={l} /> : g.cle !== "ouvrir" ? (
          <div className={v.gesteBloc}>
            <BoutonGeste geste={g} faire={faireGeste(api, piste)} principal={g.commercial || g.cle === "mettre_a_jour"} apport={g.apport} />
          </div>
        ) : null}
      </Section>

      {a && a.perimetre === "commune+adresse" ? (
        <Plaque etiquette="Ce que conclut son dossier" className={v.conclusion}>
          <p className={s.etiquette}>Dossier d&apos;adresse du {dateCourte(a.generatedAt)}{a.version > 1 ? ` · version ${a.version}` : ""}{a.simulee ? " · simulé" : ""}{l.viaPass ? " · Pass" : ""}</p>
          <p className={v.conclusionTexte} data-conclusion>{lier(a.conclusion.phrase)}</p>
          <p className={dep.length ? v.change : s.nuance}>{dep.length ? `Conclusion conservée telle qu'elle a été écrite, sous votre Projet du ${dateCourte(a.projet.date)} : ${dep.map((d) => `${d.avant.toLowerCase()} (aujourd'hui : ${d.apres.toLowerCase()})`).join(", ")}. Elle n'est pas reconduite pour votre Projet actuel.` : "Écrite pour votre Projet actuel."}</p>
          <div className={v.ligneGestes}>
            <button type="button" className={s.bouton} onClick={() => aller({ ecran: "releve", id: l.id })}>Ouvrir le Relevé complet</button>
          </div>
        </Plaque>
      ) : null}

      <Section titre="Face à votre Projet" id="projet" sous="Condition par condition : d'abord ce qui est connu pour la commune (et vaut pour tous ses logements), puis ce qui s'étudie depuis l'adresse.">
        <Confrontation colonnes={conf.colonnes} lignes={conf.lignes} projet={etat.projet} seul />
      </Section>

      {l.verifications.length ? <Verifier api={api} logement={l} /> : null}
      <Notes api={api} logement={l} />

      <details className={`${s.details} ${v.replie}`}>
        <summary>L&apos;annonce et son lien</summary>
        <div className={v.replieCorps}>
          {l.annonce?.url ? <p className={s.dense}><a className={s.lien} href={l.annonce.url} target="_blank" rel="noopener noreferrer nofollow">Voir l&apos;annonce sur {l.annonce.site}</a> · lien gardé pour vous ; futur•e n&apos;en a rien lu.</p> : <p className={s.nuance}>Aucun lien.</p>}
          {l.annonce?.nature && l.annonce.nature !== (etat.projet.intention === "achat" ? "vente" : "location") ? <p className={v.change}>Votre Projet est {etat.projet.intention === "achat" ? "un achat" : "une location"} ; cette annonce est {LIBELLE_NATURE[l.annonce.nature]}. futur•e n&apos;en tire aucune conclusion.</p> : null}
        </div>
      </details>
      <details className={`${s.details} ${v.replie}`}>
        <summary>Historique et raisons de vos décisions</summary>
        <ol className={v.journal}>
          {[...l.journal].reverse().map((e, i) => {
            const k = e.contexte?.cle ? etat.projet.criteres.find((x) => x.cle === e.contexte!.cle) : undefined;
            return (
              <li key={i}><span className={v.journalDate}>{dateCourte(e.date)}</span><span className={s.dense}>
                {e.type === "ecarte" ? `Écarté : « ${e.raison} ».${e.contexte?.condition ? ` Votre condition d'alors : ${e.contexte.condition}.` : ""}` : e.texte}
                {e.type === "ecarte" && k && e.contexte?.valeur !== k.valeur ? <span className={v.change}> Elle est aujourd&apos;hui : {libelleCritere(k).toLowerCase()}.</span> : null}
              </span></li>
            );
          })}
        </ol>
      </details>
      {l.statut !== "ecarte" ? (
        <div className={v.piedFiche}>
          <button type="button" className={s.bouton} onClick={() => aller({ ecran: "comparer", mode: "logements", selection: [l.id] })}>Comparer avec un autre logement</button>
        </div>
      ) : null}
    </>
  );
}

function Photo({ api, logement }: { api: Api5; logement: Logement }) {
  const id = useId();
  return (
    <div className={v.photo}>
      <Vignette logement={logement} taille={112} />
      <label htmlFor={id} className={s.action}>{logement.photo ? "Changer la photo" : "Ajouter une photo"}</label>
      <input id={id} type="file" accept="image/png,image/jpeg,image/webp" className={v.sr}
        onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size <= 5e6) api.envoyer({ type: "photo", id: logement.id, url: URL.createObjectURL(f) }); }} />
      {logement.photo ? <button type="button" className={s.action} onClick={() => api.envoyer({ type: "photo", id: logement.id, url: null })}>Retirer</button> : <span className={v.photoNote}>Pour le reconnaître. Elle reste sur votre appareil et n&apos;entre dans aucune comparaison.</span>}
    </div>
  );
}

function Statut({ api, logement }: { api: Api5; logement: Logement }) {
  const id = useId();
  const [ecarter, setEcarter] = useState(false);
  const [raison, setRaison] = useState("");
  const [cle, setCle] = useState<CleCritere | "">("");
  if (logement.statut === "ecarte") {
    const e = [...logement.journal].reverse().find((x) => x.type === "ecarte");
    const k = e?.contexte?.cle ? api.etat.projet.criteres.find((x) => x.cle === e.contexte!.cle) : undefined;
    return (
      <div className={v.ecarteBandeau}>
        <div className={s.pileSerree}>
          <p className={s.dense}><strong className={s.encre}>Écarté le {e ? dateCourte(e.date) : "?"}</strong> : « {e?.raison} ».{e?.contexte?.condition ? ` Votre condition était ${e.contexte.condition}.` : ""}</p>
          {k && e?.contexte?.valeur !== k.valeur ? <p className={v.change}>Votre Projet a changé depuis : {libelleCritere(k).toLowerCase()}. Cette raison mérite peut-être d&apos;être revue ; rien n&apos;est réactivé sans vous.</p> : null}
        </div>
        <button type="button" className={s.bouton} onClick={() => api.envoyer({ type: "reactiver", id: logement.id })}>Remettre en course</button>
      </div>
    );
  }
  return (
    <div className={v.statutBloc}>
      <Selecteur id={`${id}-s`} question="Votre suivi" valeur={logement.statut as "a_etudier" | "a_visiter" | "visite"}
        options={(["a_etudier", "a_visiter", "visite"] as const).map((x) => ({ valeur: x, libelle: LIBELLE_STATUT[x] }))}
        onChoisir={(x) => api.envoyer({ type: "statut", id: logement.id, statut: x })} />
      {!ecarter ? <button type="button" className={s.action} onClick={() => setEcarter(true)}>Écarter</button> : (
        <form className={v.ecarterForm} onSubmit={(e) => { e.preventDefault(); if (raison.trim()) api.envoyer({ type: "ecarter", id: logement.id, raison: raison.trim(), cle: cle || null }); }}>
          <label className={v.champ}><span className={s.etiquette}>Pourquoi ?</span><input value={raison} onChange={(e) => setRaison(e.target.value)} maxLength={200} required autoFocus placeholder="Quelques mots suffisent" /></label>
          <label className={v.champ}><span className={s.etiquette}>À cause d&apos;une condition de votre Projet ? (facultatif)</span>
            <select value={cle} onChange={(e) => setCle(e.target.value as CleCritere | "")}><option value="">Non</option>{api.etat.projet.criteres.map((c) => <option key={c.cle} value={c.cle}>{libelleCritere(c)}</option>)}</select>
          </label>
          <p className={s.nuance}>Votre raison est gardée{cle ? ", avec la valeur de cette condition aujourd'hui : si votre Projet change, vous le verrez ici" : ""}. Vous pourrez le remettre en course.</p>
          <div className={v.ligneGestes}><button type="submit" className={s.bouton} disabled={!raison.trim()}>Écarter</button><button type="button" className={s.action} onClick={() => setEcarter(false)}>Annuler</button></div>
        </form>
      )}
    </div>
  );
}

function Adresse({ api, logement }: { api: Api5; logement: Logement }) {
  const [a, setA] = useState("");
  return (
    <form className={v.adresseForm} id="adresse" onSubmit={(e) => { e.preventDefault(); if (a.trim()) api.envoyer({ type: "adresse", id: logement.id, adresse: `${a.trim()}, ${logement.commune.nom}` }); }}>
      <label className={v.champ}><span className={s.etiquette}>L&apos;adresse exacte</span><input value={a} onChange={(e) => setA(e.target.value)} maxLength={160} placeholder="Numéro et rue (demandez-la à l'agence)" /></label>
      <button type="submit" className={`${s.bouton} ${s.boutonMarque}`} disabled={!a.trim()}>Enregistrer l&apos;adresse</button>
      <p className={s.nuance}>L&apos;enregistrer ne lance aucune analyse. Elle permettra ensuite de lire les abords et le logement.</p>
    </form>
  );
}

function Verifier({ api, logement }: { api: Api5; logement: Logement }) {
  const moments = [["avant_visite", "Avant la visite"], ["sur_place", "Sur place"], ["avant_engagement", "Avant de vous engager"]] as const;
  return (
    <Section titre="À vérifier avant de décider" id="verifier" sous="Chaque question vise une inconnue de votre Projet. Votre réponse est gardée avec sa date et son origine ; la donnée publique reste celle de sa source.">
      {moments.map(([m, t]) => {
        const vs = logement.verifications.filter((x) => x.moment === m);
        return vs.length ? <div key={m} className={v.moment}><p className={v.faceTitre}>{t}</p>{vs.map((x) => <UneQuestion key={x.id} api={api} logement={logement} q={x} />)}</div> : null;
      })}
    </Section>
  );
}

function UneQuestion({ api, logement, q }: { api: Api5; logement: Logement; q: Verification }) {
  const id = useId();
  const rep = q.reponse ? q.reponses.find((r) => r.valeur === q.reponse!.valeur) : undefined;
  return (
    <div className={v.question}>
      <p className={v.questionTexte}>{lier(q.question)}</p>
      <p className={s.nuance}>{NOM_CRITERE[q.cle]} · {lier(q.pourquoi)}</p>
      <Selecteur id={`${id}-r`} question="Votre réponse" valeur={q.reponse?.valeur} options={q.reponses.map((r) => ({ valeur: r.valeur, libelle: r.libelle }))}
        onChoisir={(x) => api.envoyer({ type: "repondre", id: logement.id, verification: q.id, valeur: x === q.reponse?.valeur ? null : x })} />
      {rep ? (
        <div className={v.reponse} aria-live="polite">
          <p><span className={v.reponseCle}>Ce que cela change pour vous</span>{lier(rep.effet)}</p>
          <p><span className={v.reponseCle}>Ce qui reste inconnu</span>{lier(rep.reste)}</p>
          <p className={v.preuve}>{q.reponse!.nature === "declaration" ? "Déclaration" : "Votre observation"} du {dateCourte(q.reponse!.date)} · elle ne modifie aucune donnée publique · recliquer la réponse la retire</p>
        </div>
      ) : null}
    </div>
  );
}

function Notes({ api, logement }: { api: Api5; logement: Logement }) {
  const id = useId();
  const [t, setT] = useState("");
  const [n, setN] = useState<NatureObservation>("observation");
  const [k, setK] = useState<CleCritere | "">("");
  return (
    <Section titre="Vos notes" id="notes">
      {logement.observations.length ? <ul className={v.listeSimple}>{logement.observations.map((o) => <li key={o.id} className={v.note}><span className={v.preuve}>{ORIGINE[o.nature]} · {dateCourte(o.date)}{o.cle ? ` · ${NOM_CRITERE[o.cle].toLowerCase()}` : ""}</span><span className={s.dense}>{o.texte}</span></li>)}</ul> : <p className={s.nuance}>Après une visite ou un appel, notez ce que vous avez appris. La note reste la vôtre : elle est rangée avec son origine et ne devient pas une mesure de futur•e.</p>}
      <form className={v.noteForm} onSubmit={(e) => { e.preventDefault(); if (t.trim()) { api.envoyer({ type: "observer", id: logement.id, texte: t.trim(), nature: n, cle: k || null }); setT(""); } }}>
        <label className={v.champ}><span className={s.etiquette}>Ajouter une note</span><textarea rows={2} value={t} onChange={(e) => setT(e.target.value)} maxLength={1000} placeholder="Ce que vous avez vu, entendu, ou ce qu'on vous a dit" /></label>
        <Selecteur id={`${id}-n`} question="D'où vient-elle ?" valeur={n} onChoisir={setN} options={[{ valeur: "observation", libelle: "vu par moi" }, { valeur: "declaration", libelle: "dit par le vendeur ou l'agence" }, { valeur: "document", libelle: "lu dans un document" }]} />
        <label className={v.champ}><span className={s.etiquette}>À propos de (facultatif)</span><select value={k} onChange={(e) => setK(e.target.value as CleCritere | "")}><option value="">Rien en particulier</option>{api.etat.projet.criteres.map((c) => <option key={c.cle} value={c.cle}>{NOM_CRITERE[c.cle]}</option>)}</select></label>
        <div><button type="submit" className={s.bouton} disabled={!t.trim()}>Enregistrer la note</button></div>
      </form>
    </Section>
  );
}
