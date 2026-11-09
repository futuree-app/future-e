"use client";
// COMPARER, V5.1 · une seule progression, du plus important au plus détaillé :
//   1. Vous comparez : les noms, toujours visibles (collés en haut), et « Changer » ;
//   2. À retenir : la condition sans compromis, ce qui les distingue, ce qui peut encore changer le
//      choix, et le geste le plus utile. Des phrases courtes, chacune avec son signe ;
//   3. Pourquoi : les écarts établis (valeurs côte à côte), ce qui reste à savoir, ce qui est pareil ;
//   4. Pour avancer : un geste par ligne ; « Et si… ? » ;
//   5. Tout le détail et les sources, replié.
// Le bilan « apporte / demande d'accepter » de la V5 disparaît : ses éléments sont rangés une fois, dans
// les écarts, les incertitudes ou les gestes. Aucune catégorie vide n'est montrée ; aucun gagnant.
import { useId, useState } from "react";
import { GlypheGrain, releve as s } from "@/components/releve/primitives";
import { confronter, logementsDe, type Colonne, type Piste } from "../../fut41-v5/modele5";
import { faireGeste, type Api5 } from "../../fut41-v5/CentreDecision5";
import { Section, lier } from "../../fut41-v5/communs5";
import { Confrontation } from "../../fut41-v5/Confrontation";
import { Plan5 } from "../../fut41-v5/Plan5";
import { EtSiIci, TeteLieu, useEtroit } from "../../fut41-v5/vues5/Comparer5";
import { lecture51, type Rang } from "../lecture51";
import { Agir, Retenir, Signe } from "../communs51";
import v from "../../fut41-v5/v5.module.css";
import w from "../v51.module.css";

const MAX = 4;

export function Comparer51({ api }: { api: Api5 }) {
  const { etat, aller } = api;
  const id = useId();
  const etroit = useEtroit();
  const mode = etat.vue.mode ?? "logements";
  const communes = etat.communes.filter((c) => c.statut !== "ecartee");
  const candidats: Piste[] = mode === "communes"
    ? communes.map((commune) => ({ type: "commune", commune }))
    : communes.flatMap((c) => logementsDe(etat, c).filter((l) => l.statut !== "ecarte").map((logement) => ({ type: "logement" as const, logement })));
  const idDe = (p: Piste) => (p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id);
  const nomDe = (p: Piste) => (p.type === "commune" ? p.commune.nom : p.logement.libelle);
  const sel = (etat.vue.selection ?? []).filter((x) => candidats.some((p) => idDe(p) === x)).slice(0, MAX);
  const choisis = candidats.filter((p) => sel.includes(idDe(p)));
  const duel = etat.comparaison?.duel ?? [0, 1];
  const d0 = Math.min(duel[0], choisis.length - 1); const d1raw = Math.min(duel[1], choisis.length - 1);
  const d1 = d1raw === d0 ? (d0 + 1) % Math.max(choisis.length, 1) : d1raw;
  const montres = etroit && choisis.length > 2 ? [choisis[d0]!, choisis[d1]!] : choisis;
  const choisir = (selection: string[], m = mode) => aller({ ecran: "comparer", mode: m, selection });
  const basculer = (x: string) => choisir(sel.includes(x) ? sel.filter((y) => y !== x) : sel.length >= MAX ? sel : [...sel, x]);
  const [changer, setChanger] = useState(false);
  const ouvert = changer || choisis.length < 2;

  const conf = montres.length >= 2 ? confronter(etat, montres) : null;
  const lec = montres.length >= 2 ? lecture51(etat, montres, etat.droits) : null;
  const pisteDe = (pid: string) => montres.find((p) => idDe(p) === pid)!;
  const teteCol = (c: Colonne) => <TeteLieu nom={c.nom} sous={c.sous} logement={c.type === "logement" ? etat.logements.find((x) => x.id === c.id) : undefined} />;
  const lignes = (rs: Rang[]) => rs.map((x) => ({ ...x.ligne, couches: [x.couche] }));
  // Le geste au niveau de l'incertitude : les questions déjà prêtes pour ce logement et cette condition.
  const questions = (cle: string, ids: string[]) => {
    if (ids.length !== 1) return null;
    const l = etat.logements.find((x) => x.id === ids[0]);
    const n = l ? l.verifications.filter((q) => q.cle === cle && !q.reponse).length : 0;
    return l && n ? <button type="button" className={`${s.action} ${v.cible}`} onClick={() => aller({ ecran: "logement", id: l.id, ancre: "verifier" })}>{n === 1 ? "Voir la question à poser" : `Voir les ${n} questions à poser`}</button> : null;
  };
  const communesVues = [...new Set(montres.map((p) => (p.type === "commune" ? p.commune.insee : p.logement.commune.insee)))].map((i) => etat.communes.find((c) => c.insee === i)!).filter(Boolean);
  const premier = lec?.avancer[0];
  const faire = (a: NonNullable<typeof premier>) => (el: HTMLElement) => (a.genre === "question" ? aller({ ecran: "logement", id: a.pisteId, ancre: "verifier" }) : faireGeste(api, pisteDe(a.pisteId))(el));
  const pourquoi = lec ? lec.incertains.filter((x) => x.couche.verdict === "pas_comparable") : [];

  return (
    <>
      <div className={w.tete}>
        <h1 className={`${s.titre} ${w.titre}`} tabIndex={-1} data-titre-vue>{mode === "communes" ? "Comparer vos communes" : "Comparer vos logements"}</h1>
      </div>

      {/* Ce que l'on compare reste visible en haut de l'écran, sur ordinateur comme sur téléphone. */}
      <div className={w.compares} role="region" aria-label="Ce que vous comparez">
        <div className={w.comparesLigne}>
          {montres.length >= 2 && !(etroit && choisis.length > 2) ? (
            <p className={w.comparesNoms}><span className={w.comparesCle}>Vous comparez</span> {montres.map((p, i) => <span key={idDe(p)}>{i > 0 ? <span className={w.et}> et </span> : null}<strong>{nomDe(p)}</strong></span>)}</p>
          ) : null}
          {etroit && choisis.length > 2 ? (
            <div className={w.duel} role="group" aria-label="Les deux que vous voyez côte à côte">
              {[0, 1].map((i) => (
                <label key={i} className={w.duelChamp}>
                  <span className={w.duelCle}>{i === 0 ? "À gauche" : "À droite"}</span>
                  <select value={i === 0 ? d0 : d1} onChange={(e) => { const n = Number(e.target.value); api.envoyer({ type: "duel", duel: i === 0 ? [n, n === d1 ? d0 : d1] : [n === d0 ? d1 : d0, n] }); }}>
                    {choisis.map((p, k) => <option key={idDe(p)} value={k}>{nomDe(p)}</option>)}
                  </select>
                </label>
              ))}
            </div>
          ) : null}
          {choisis.length >= 2 ? <button type="button" className={`${s.action} ${v.cible}`} aria-expanded={ouvert} aria-controls={`${id}-choix`} onClick={() => setChanger((x) => !x)}>{changer ? "Fermer" : "Changer"}</button> : null}
        </div>
        {etroit && choisis.length > 2 ? <p className={w.comparesNote}>{choisis.length} sélectionnés · deux affichés côte à côte</p> : null}
      </div>

      {ouvert ? (
        <div className={w.choix} id={`${id}-choix`}>
          <div className={v.modes} role="group" aria-label="Ce que vous comparez">
            {(["communes", "logements"] as const).map((m) => (
              <button key={m} type="button" className={v.mode} aria-pressed={mode === m}
                onClick={() => choisir(m === "communes" ? communes.map((c) => `c:${c.insee}`).slice(0, MAX) : (() => { const ls = communes.flatMap((c) => logementsDe(etat, c).filter((l) => l.statut !== "ecarte")); return ls.length <= MAX ? ls.map((l) => l.id) : []; })(), m)}>
                {m === "communes" ? "Vos communes" : "Vos logements"}
              </button>
            ))}
          </div>
          <p className={s.etiquette} id={`${id}-c`}>{sel.length ? `${sel.length} sur ${MAX} au plus` : `Choisissez deux à ${MAX} ${mode === "communes" ? "communes" : "logements"}`}</p>
          <div className={w.puces} role="group" aria-labelledby={`${id}-c`}>
            {candidats.map((p) => {
              const actif = sel.includes(idDe(p));
              return (
                <label key={idDe(p)} className={w.puce} data-actif={actif || undefined}>
                  <input type="checkbox" checked={actif} disabled={!actif && sel.length >= MAX} onChange={() => basculer(idDe(p))} />
                  <span>{p.type === "commune" ? <><GlypheGrain grain="commune" taille={10} /> {p.commune.nom}</> : <>{p.logement.libelle}<span className={w.puceSous}> · {p.logement.commune.nom}</span></>}</span>
                </label>
              );
            })}
          </div>
          {sel.length >= MAX ? <p className={s.nuance}>Quatre au plus côte à côte. Retirez-en un pour en ajouter un autre.</p> : null}
          {mode === "logements" && !candidats.length ? <p className={s.nuance}>Aucun logement gardé pour l&apos;instant. Vous pouvez déjà comparer vos communes.</p> : null}
        </div>
      ) : null}

      {!conf || !lec ? (
        <p className={s.corps}>{mode === "communes" ? "Choisissez au moins deux communes." : "Choisissez au moins deux logements, dans une même commune ou dans plusieurs."}</p>
      ) : (
        <>
          <section className={w.aRetenir} aria-labelledby={`${id}-r`}>
            <h2 className={w.aRetenirTitre} id={`${id}-r`}>À retenir</h2>
            <ul className={w.retenirListe}>
              {lec.sansCompromis ? <Retenir genre="fait" titre="Votre condition sans compromis">{lier(lec.sansCompromis)}</Retenir> : null}
              {lec.aRevoir.map((x) => <Retenir key={x} genre="incertain" titre="Une analyse à revoir">{lier(x)}</Retenir>)}
              {lec.distingue
                ? <Retenir genre="fait" titre={lec.distingueCommunesSeulement ? "Entre leurs communes" : "Ce qui les distingue"}>{lier(lec.distingue)}</Retenir>
                : <Retenir genre="incertain" titre="Ce qui les distingue">Avec ce qui est étudié aujourd&apos;hui, rien ne les distingue encore.</Retenir>}
              {lec.peutChanger ? <Retenir genre="incertain" titre="Ce qui peut encore changer votre choix">{lier(lec.peutChanger)}</Retenir> : null}
              {lec.manque ? <Retenir genre="incertain" titre="Ce qui manque pour comparer">{lier(lec.manque)}</Retenir> : null}
            </ul>
            {premier ? (
              <div className={w.prochain}>
                <p className={w.prochainTexte}><Signe genre="action" /> <span><span className={w.prochainCle}>Le plus utile maintenant</span> {premier.nom} : {premier.texte.charAt(0).toLowerCase()}{premier.texte.slice(1)}.</span></p>
                <Agir principal onClick={faire(premier)}>{premier.bouton}</Agir>
              </div>
            ) : null}
          </section>

          {lec.etablis.length ? (
            <Section titre="Ce qui les distingue" id="distingue" sous="Étudié de la même façon des deux côtés : l'écart vient du lieu.">
              <Confrontation colonnes={conf.colonnes} lignes={lignes(lec.etablis)} projet={etat.projet} compact sansVerdict tete={teteCol} />
            </Section>
          ) : null}

          {lec.incertains.length || lec.nonEtudies.length ? (
            <Section titre="Ce qui reste à savoir" id="reste" sous="Rien de ce qui est inconnu n'est compté contre l'un ou l'autre.">
              {lec.nonEtudies.length ? (
                <ul className={w.manques}>
                  {lec.nonEtudies.map((x) => (
                    <li key={x.pisteId}><Signe genre="incertain" /><span><strong className={s.encre}>{x.nom}</strong> : pas encore étudié pour {listeFr(x.conditions)} <span className={w.raison}>({x.raison})</span>.</span></li>
                  ))}
                </ul>
              ) : null}
              {lec.incertains.length ? <Confrontation colonnes={conf.colonnes} lignes={lignes(lec.incertains)} projet={etat.projet} compact sansVerdict action={questions} tete={teteCol} enTete={!lec.etablis.length} /> : null}
              {pourquoi.length ? (
                <ul className={w.manques}>
                  {pourquoi.map((x) => <li key={x.ligne.cle}><Signe genre="incertain" /><span><strong className={s.encre}>{x.ligne.libelle}</strong> : {lier(x.couche.phrase)}{x.couche.remede ? ` ${x.couche.remede}` : ""}</span></li>)}
                </ul>
              ) : null}
            </Section>
          ) : null}

          {lec.pareils.length ? (
            <Section titre="Ce qui ne les distingue pas" id="pareil">
              <ul className={w.pareils}>{lec.pareils.map((x) => <li key={x.cle}><strong className={s.encre}>{x.libelle}</strong> : {x.texte}.</li>)}</ul>
            </Section>
          ) : null}

          {lec.avancer.length > 1 ? (
            <Section titre="Pour avancer" id="avancer">
              <ul className={w.avancer}>
                {lec.avancer.slice(1).map((a) => (
                  <li key={`${a.pisteId}-${a.bouton}`}>
                    <span className={s.pileSerree}><strong className={s.encre}>{a.nom}</strong><span className={w.avancerTexte}>{a.texte}</span></span>
                    <Agir onClick={faire(a)}>{a.bouton}</Agir>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <EtSiIci api={api} montres={montres} />

          <details className={`${s.details} ${w.toutDetail}`}>
            <summary>Tout le détail, condition par condition, avec les sources</summary>
            <div className={w.toutDetailCorps}>
              {mode === "communes" || communesVues.length > 1 ? (
                <div className={w.plan}>
                  <p className={w.sousTitre}>Où elles sont</p>
                  <Plan5 api={api} communes={communesVues} />
                </div>
              ) : null}
              <p className={s.nuance}>{mode === "communes" ? "Étudié à l'échelle de la commune. La gare, le calme et le quartier s'étudient aussi aux abords d'une adresse : pour un logement, la commune n'en donne qu'un repère." : "D'abord ce qui est connu pour la commune (une seule case quand deux logements la partagent), puis ce qui s'étudie depuis l'adresse."}</p>
              <Confrontation colonnes={conf.colonnes} lignes={conf.lignes} projet={etat.projet} tete={teteCol} />
            </div>
          </details>

          <div className={v.ligneGestes}>
            {mode === "logements" && communesVues.length > 1 ? <button type="button" className={s.bouton} onClick={() => choisir(communesVues.map((c) => `c:${c.insee}`), "communes")}>Comparer leurs communes</button> : null}
            {mode === "communes" && montres.some((p) => p.type === "commune" && logementsDe(etat, p.commune).some((l) => l.statut !== "ecarte")) ? (
              <button type="button" className={s.bouton} onClick={() => { const ls = montres.flatMap((p) => (p.type === "commune" ? logementsDe(etat, p.commune).filter((l) => l.statut !== "ecarte").map((l) => l.id) : [])); choisir(ls.slice(0, MAX), "logements"); }}>Comparer leurs logements</button>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}

const listeFr = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`);
