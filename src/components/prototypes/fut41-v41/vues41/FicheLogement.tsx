"use client";
// UN LOGEMENT, V4.1 · ce que futur•e en sait (échelle par échelle, en mots), le seul geste utile, sa
// conclusion si elle existe, puis le Projet face au logement, rangé par échelle : ce qui vient de la
// commune est dit comme tel, jamais comme un fait du logement.
import { useId, useState } from "react";
import { Plaque, Selecteur, releve as s } from "@/components/releve/primitives";
import {
  analyseServie, communeCommeLieu, communeDe, criteresDepasses, dateCourte, gestePrincipal, libelleCritere, logementsDe,
  montantAnnonce, savoirLogement, LIBELLE_NATURE, LIBELLE_STATUT, NOM_CRITERE,
  type CleCritere, type Logement, type LigneRegistre, type NatureObservation, type Verification,
} from "../modele41";
import type { Api41 } from "../CentreDecision41";
import { BoutonGeste, Declare, Fil41, Marque, Section, Triade, Vignette, lier } from "../communs41";
import { faireGeste } from "./Accueil";
import v from "../v41.module.css";

const OBS: Record<NatureObservation, string> = { observation: "Vu par vous", declaration: "Dit par le vendeur ou l'agence", document: "Document" };

export function FicheLogement({ api }: { api: Api41 }) {
  const { etat, aller, envoyer } = api;
  const l = etat.logements.find((x) => x.id === etat.vue.id);
  if (!l) return <h1 className={s.titre} tabIndex={-1} data-titre-vue>Ce logement n&apos;est pas dans cette situation</h1>;
  const c = communeDe(etat, l);
  const a = analyseServie(l);
  const g = gestePrincipal(etat, { type: "logement", logement: l }, etat.droits);
  const dep = a ? criteresDepasses(a, etat.projet) : [];

  return (
    <>
      <Fil41 segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "accueil" }) }, ...(c ? [{ libelle: c.nom, aller: () => aller({ ecran: "commune", id: `c:${c.insee}` }) }] : []), { libelle: l.libelle }]} />
      <div className={v.ficheTete}>
        <Photo api={api} logement={l} />
        <div className={s.pileSerree}>
          <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{l.libelle}</h1>
          <p className={s.nuance}>{l.adresse ?? `${l.commune.nom} · adresse exacte inconnue`}</p>
          <p className={v.logementSous}>{[montantAnnonce(l.annonce), l.annonce?.surface ? `${l.annonce.surface} m²` : null, l.annonce?.pieces ? `${l.annonce.pieces} pièces` : null, l.annonce ? LIBELLE_NATURE[l.annonce.nature ?? "non_precise"] : null].filter(Boolean).join(" · ")} <Declare>déclaré par l&apos;annonce</Declare></p>
        </div>
      </div>
      <Statut api={api} logement={l} />

      <Section titre="Ce que futur•e sait" id="savoir">
        <Triade savoir={savoirLogement(etat, l)} />
        {g.cle === "adresse" ? <Adresse api={api} logement={l} /> : g.cle !== "ouvrir" ? (
          <div className={v.gesteBloc}>
            <BoutonGeste geste={g} faire={faireGeste(api, { type: "logement", logement: l })} principal={g.commercial} />
            {g.cle === "analyser" && l.id !== "convention" ? <p className={s.nuance}>Dans ce prototype, l&apos;analyse n&apos;est simulée que pour le T4 rue de la Convention.</p> : null}
          </div>
        ) : null}
      </Section>

      {a && a.perimetre === "commune+adresse" ? (
        <Plaque etiquette="Ce que conclut son dossier" className={v.conclusion}>
          <p className={s.etiquette}>Dossier d&apos;adresse du {dateCourte(a.generatedAt)}{a.version > 1 ? ` · version ${a.version}` : ""}{a.simulee ? " · simulé" : ""}{l.viaPass ? " · Pass" : ""}</p>
          <p className={v.conclusionTexte} data-conclusion>{lier(a.conclusion.phrase)}</p>
          <p className={s.nuance}>{dep.length ? `Fait sous votre Projet du ${dateCourte(a.projet.date)} : ${dep.map((d) => `${d.avant.toLowerCase()} (aujourd'hui : ${d.apres.toLowerCase()})`).join(", ")}.` : "Répond à votre Projet actuel."}</p>
          <div className={v.ligneGestes}>
            <button type="button" className={s.bouton} onClick={() => aller({ ecran: "releve", id: l.id })}>Ouvrir le Relevé complet</button>
            {dep.length ? <button type="button" className={s.bouton} onClick={() => envoyer({ type: "mettre_a_jour", id: l.id })}>Mettre à jour (gratuit)</button> : null}
          </div>
        </Plaque>
      ) : null}

      <FaceAuProjet api={api} logement={l} />
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
        <summary>Historique de ce logement</summary>
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
    </>
  );
}

function Photo({ api, logement }: { api: Api41; logement: Logement }) {
  const id = useId();
  return (
    <div className={v.photo}>
      <Vignette logement={logement} taille={112} />
      <label htmlFor={id} className={s.action}>{logement.photo ? "Changer la photo" : "Ajouter la photo de l'annonce"}</label>
      <input id={id} type="file" accept="image/*" className={v.sr}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) api.envoyer({ type: "photo", id: logement.id, url: URL.createObjectURL(f) }); }} />
      {logement.photo ? <button type="button" className={s.action} onClick={() => api.envoyer({ type: "photo", id: logement.id, url: null })}>Retirer</button> : <span className={v.photoNote}>Pour le retrouver d&apos;un coup d&apos;œil. Elle reste sur votre appareil.</span>}
    </div>
  );
}

function Statut({ api, logement }: { api: Api41; logement: Logement }) {
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
          {k && e?.contexte?.valeur !== k.valeur ? <p className={v.change}>Votre Projet a changé depuis : {libelleCritere(k).toLowerCase()}. Cette raison mérite peut-être d&apos;être revue.</p> : null}
        </div>
        <button type="button" className={s.bouton} onClick={() => api.envoyer({ type: "reactiver", id: logement.id })}>Remettre en course</button>
      </div>
    );
  }
  return (
    <div className={v.statutBloc}>
      <Selecteur id={`${id}-s`} question="Où vous en êtes" valeur={logement.statut as "a_etudier" | "a_visiter" | "visite"}
        options={(["a_etudier", "a_visiter", "visite"] as const).map((x) => ({ valeur: x, libelle: LIBELLE_STATUT[x] }))}
        onChoisir={(x) => api.envoyer({ type: "statut", id: logement.id, statut: x })} />
      {!ecarter ? <button type="button" className={s.action} onClick={() => setEcarter(true)}>Écarter</button> : (
        <form className={v.ecarterForm} onSubmit={(e) => { e.preventDefault(); if (raison.trim()) api.envoyer({ type: "ecarter", id: logement.id, raison: raison.trim(), cle: cle || null }); }}>
          <label className={v.champ}><span className={s.etiquette}>Pourquoi ?</span><input value={raison} onChange={(e) => setRaison(e.target.value)} maxLength={200} required autoFocus placeholder="Quelques mots suffisent" /></label>
          <label className={v.champ}><span className={s.etiquette}>À cause d&apos;une condition de votre Projet ? (facultatif)</span>
            <select value={cle} onChange={(e) => setCle(e.target.value as CleCritere | "")}><option value="">Non</option>{api.etat.projet.criteres.map((c) => <option key={c.cle} value={c.cle}>{libelleCritere(c)}</option>)}</select>
          </label>
          <p className={s.nuance}>futur•e garde votre raison{cle ? ` et la valeur de cette condition aujourd'hui` : ""}. Si votre Projet change, vous le verrez ici.</p>
          <div className={v.ligneGestes}><button type="submit" className={s.bouton} disabled={!raison.trim()}>Écarter</button><button type="button" className={s.action} onClick={() => setEcarter(false)}>Annuler</button></div>
        </form>
      )}
    </div>
  );
}

function Adresse({ api, logement }: { api: Api41; logement: Logement }) {
  const [a, setA] = useState("");
  return (
    <form className={v.adresseForm} onSubmit={(e) => { e.preventDefault(); if (a.trim()) api.envoyer({ type: "adresse", id: logement.id, adresse: `${a.trim()}, ${logement.commune.nom}` }); }}>
      <label className={v.champ}><span className={s.etiquette}>L&apos;adresse exacte, quand vous la connaissez</span><input value={a} onChange={(e) => setA(e.target.value)} maxLength={160} placeholder="Numéro et rue (demandez-la à l'agence)" /></label>
      <button type="submit" className={`${s.bouton} ${s.boutonMarque}`} disabled={!a.trim()}>Renseigner l&apos;adresse</button>
      <p className={s.nuance}>Avec elle, futur•e peut lire les abords et le logement. Sans elle, seule la commune est lue.</p>
    </form>
  );
}

function FaceAuProjet({ api, logement }: { api: Api41; logement: Logement }) {
  const { etat } = api;
  const a = analyseServie(logement);
  const c = communeDe(etat, logement);
  const rapport = c?.lecture === "rapport" ? analyseServie(communeCommeLieu(c)) : null;
  const adresseLue = a?.perimetre === "commune+adresse";
  const ligne = (cle: CleCritere, grain: LigneRegistre["grain"]) => (adresseLue ? a!.registre.find((x) => x.cle === cle && x.grain === grain) : grain === "commune" ? (a ?? rapport)?.registre.find((x) => x.cle === cle && x.grain === "commune") : undefined) ?? null;
  const nbLog = c ? logementsDe(etat, c).filter((l) => l.statut !== "ecarte").length : 0;
  const blocs: { titre: string; sous: string; grain: LigneRegistre["grain"] }[] = [
    { titre: "Dans le logement", sous: adresseLue ? "Lu par le dossier d'adresse." : "Pas encore lu : il faut analyser l'adresse.", grain: "batiment" },
    { titre: "Aux abords", sous: adresseLue ? "Lu par le dossier d'adresse." : "Pas encore lus.", grain: "secteur" },
    { titre: `À la commune de ${logement.commune.nom}`, sous: `Vaut pour vos ${nbLog} logement${nbLog > 1 ? "s" : ""} de ${logement.commune.nom}, pas pour ce logement en particulier.`, grain: "commune" },
  ];
  return (
    <Section titre="Face à votre Projet" id="projet" sous="Du plus précis au plus large : ce qui vient de la commune n'est jamais dit comme un fait du logement.">
      {blocs.map((b) => {
        const lignes = etat.projet.criteres.map((k) => ({ k, l: ligne(k.cle, b.grain) })).filter((x) => x.l);
        return (
          <div key={b.titre} className={v.faceBloc}>
            <p className={v.faceTitre}>{b.titre}</p>
            <p className={s.nuance}>{b.sous}</p>
            {lignes.length ? (
              <ul className={v.faceListe}>
                {lignes.map(({ k, l }) => (
                  <li key={k.cle}>
                    <span className={v.faceCrit}>{libelleCritere(k)}{k.nature === "sans_compromis" ? <span className={v.dur}> · sans compromis</span> : null}</span>
                    <Marque ligne={l} sansLieu />
                    {l!.constat ? <span className={v.faceConstat}>{lier(l!.constat)}</span> : null}
                    {l!.preuve ? <span className={v.preuve}>{l!.preuve.source}, {l!.preuve.date}{l!.mesure ? ` · mesure : ${l!.mesure.valeur} ${l!.mesure.unite}` : ""}</span> : null}
                    {logement.observations.filter((o) => o.cle === k.cle).map((o) => <span key={o.id} className={v.obs}>{OBS[o.nature]}, {dateCourte(o.date)} : {o.texte}</span>)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </Section>
  );
}

function Verifier({ api, logement }: { api: Api41; logement: Logement }) {
  const moments = [["avant_visite", "Avant la visite"], ["sur_place", "Sur place"], ["avant_engagement", "Avant de vous engager"]] as const;
  return (
    <Section titre="À vérifier avant de décider" id="verifier" sous="Chaque question vise une inconnue de votre Projet. Votre réponse change la lecture du logement ; la donnée publique reste celle de sa source.">
      {moments.map(([m, t]) => {
        const vs = logement.verifications.filter((x) => x.moment === m);
        return vs.length ? <div key={m} className={v.moment}><p className={v.faceTitre}>{t}</p>{vs.map((x) => <UneQuestion key={x.id} api={api} logement={logement} q={x} />)}</div> : null;
      })}
    </Section>
  );
}

function UneQuestion({ api, logement, q }: { api: Api41; logement: Logement; q: Verification }) {
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
          <p><span className={v.reponseCle}>Ce que cela change</span>{lier(rep.effet)}</p>
          <p><span className={v.reponseCle}>Ce qui reste inconnu</span>{lier(rep.reste)}</p>
          <p className={v.preuve}>{q.reponse!.nature === "declaration" ? "Déclaration" : "Votre observation"} du {dateCourte(q.reponse!.date)} · recliquer la réponse la retire</p>
        </div>
      ) : null}
    </div>
  );
}

function Notes({ api, logement }: { api: Api41; logement: Logement }) {
  const id = useId();
  const [t, setT] = useState("");
  const [n, setN] = useState<NatureObservation>("observation");
  const [k, setK] = useState<CleCritere | "">("");
  return (
    <Section titre="Vos notes" id="notes">
      {logement.observations.length ? <ul className={v.listeSimple}>{logement.observations.map((o) => <li key={o.id} className={v.note}><span className={v.preuve}>{OBS[o.nature]} · {dateCourte(o.date)}{o.cle ? ` · ${NOM_CRITERE[o.cle].toLowerCase()}` : ""}</span><span className={s.dense}>{o.texte}</span></li>)}</ul> : <p className={s.nuance}>Après une visite ou un appel, notez ce que vous avez appris : futur•e le range à côté de la condition concernée, sans changer la donnée publique.</p>}
      <form className={v.noteForm} onSubmit={(e) => { e.preventDefault(); if (t.trim()) { api.envoyer({ type: "observer", id: logement.id, texte: t.trim(), nature: n, cle: k || null }); setT(""); } }}>
        <label className={v.champ}><span className={s.etiquette}>Ajouter une note</span><textarea rows={2} value={t} onChange={(e) => setT(e.target.value)} maxLength={1000} placeholder="Ce que vous avez vu, entendu, ou ce qu'on vous a dit" /></label>
        <Selecteur id={`${id}-n`} question="C'est" valeur={n} onChoisir={setN} options={[{ valeur: "observation", libelle: "vu par moi" }, { valeur: "declaration", libelle: "dit par le vendeur ou l'agence" }, { valeur: "document", libelle: "un document" }]} />
        <label className={v.champ}><span className={s.etiquette}>À propos de (facultatif)</span><select value={k} onChange={(e) => setK(e.target.value as CleCritere | "")}><option value="">Rien en particulier</option>{api.etat.projet.criteres.map((c) => <option key={c.cle} value={c.cle}>{NOM_CRITERE[c.cle]}</option>)}</select></label>
        <div><button type="submit" className={s.bouton} disabled={!t.trim()}>Enregistrer la note</button></div>
      </form>
    </Section>
  );
}
