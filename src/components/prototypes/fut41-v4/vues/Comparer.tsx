"use client";
// COMPARER MES LOGEMENTS · le cœur du centre. Deux lectures d'un même contrat (critère par critère) :
// la vue d'ensemble, de 2 à N logements, et le face-à-face (V3.3, sans ligne entre les marques).
// L'écran montre d'abord ce qui contredit une condition sans compromis, puis ce qui départage, puis
// ce qui reste à vérifier ; et il dit toujours POURQUOI il rapproche ou refuse de rapprocher.
import { Fragment, useId, useState } from "react";
import { GlypheGrain, Selecteur, releve as s } from "@/components/releve/primitives";
import {
  analyseServie, ceQuiDepartage, comparerCritere, conditionsNonTenues, connaissance, dateCourte, estEtabli, libelleConnaissance,
  libelleCritere, perimetreComparable, trier, GRAIN_LIBELLE, LIBELLE_CLASSE, LIBELLE_DIMENSION, LIBELLE_ISSUE, NOM_CRITERE,
  type CleCritere, type ComparaisonCritere, type DimensionTri, type Lieu, type Projet,
} from "../modele";
import { AUJOURDHUI } from "../scenarios";
import type { Api } from "../CentreDecision";
import { EmblemeLieu, EtatComparaisonTag, Fil, MarqueIssue, Mouvement, lier } from "../communs";
import v from "../v4.module.css";

export function Comparer({ api }: { api: Api }) {
  const { etat, aller } = api;
  const actifs = etat.lieux.filter((l) => l.statut !== "ecarte");
  const sel = (etat.vue.selection ?? []).filter((id) => actifs.some((l) => l.id === id));
  const mode = etat.vue.mode ?? "ensemble";
  const critere = etat.vue.critere as CleCritere | undefined;
  const choisis = sel.map((id) => actifs.find((l) => l.id === id)!);
  const changer = (o: { selection?: string[]; mode?: "ensemble" | "face"; critere?: string | undefined }) =>
    aller({ ecran: "comparer", selection: o.selection ?? sel, mode: o.mode ?? mode, ...(("critere" in o ? o.critere : critere) ? { critere: ("critere" in o ? o.critere : critere) } : {}) });
  const id = useId();

  return (
    <>
      <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "decision" }) }, { libelle: "Comparer" }]} />
      <div className={v.entete}>
        <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>
          {mode === "face" && choisis.length === 2 ? lier(`${choisis[0]!.libelle} et ${choisis[1]!.libelle}, face à face`) : "Comparer vos logements"}
        </h1>
        <p className={s.nuance}>Face à votre Projet (révision {etat.projet.revision}, {dateCourte(etat.projet.date)}) : ce qui départage vos logements, ce qui pourrait les départager, et pourquoi le reste ne se compare pas encore.</p>
      </div>

      <div className={v.commandes}>
        <div className={v.champ} role="group" aria-labelledby={`${id}-sel`}>
          <p className={s.etiquette} id={`${id}-sel`}>Logements comparés</p>
          <div className={v.puces}>
            {actifs.map((l) => (
              <button key={l.id} type="button" className={v.puce} aria-pressed={sel.includes(l.id)}
                onClick={() => {
                  const n = sel.includes(l.id) ? sel.filter((x) => x !== l.id) : [...sel, l.id];
                  changer({ selection: n, mode: mode === "face" && n.length !== 2 ? "ensemble" : mode });
                }}>
                {l.libelle}
              </button>
            ))}
          </div>
        </div>
        <Selecteur id={`${id}-mode`} question="Lecture" valeur={mode}
          options={[{ valeur: "ensemble", libelle: "Vue d'ensemble" }, { valeur: "face", libelle: "Face-à-face (deux logements)" }]}
          onChoisir={(m) => changer({ mode: m, selection: m === "face" ? sel.slice(0, 2) : sel })} />
      </div>

      {choisis.length < 2 ? (
        <p className={s.corps}>Choisissez au moins deux logements.</p>
      ) : mode === "face" && choisis.length === 2 ? (
        <FaceAFace api={api} a={choisis[0]!} b={choisis[1]!} inverser={() => changer({ selection: [sel[1]!, sel[0]!] })} />
      ) : (
        <Ensemble api={api} lieux={choisis} critere={critere} choisirCritere={(c) => changer({ critere: c })} />
      )}
    </>
  );
}

// ── Vue d'ensemble ───────────────────────────────────────────────────────────────────────────

function Ensemble({ api, lieux, critere, choisirCritere }: { api: Api; lieux: Lieu[]; critere?: CleCritere; choisirCritere: (c: string | undefined) => void }) {
  const { etat, aller } = api;
  const projet = etat.projet;
  const id = useId();
  const [ordre, setOrdre] = useState<DimensionTri>("ajout");
  const groupes = trier(lieux, ordre, projet, AUJOURDHUI);
  const colonnes = groupes.flatMap((g) => g.lieux.map((x) => ({ lieu: x.lieu, valeur: x.valeur })));
  const lecture = ceQuiDepartage(lieux, projet);
  const bloquants = lieux.flatMap((l) => conditionsNonTenues(l, projet));
  const departage = lecture.filter((x) => x.classe === "departage");
  const possible = lecture.filter((x) => x.classe === "departage_possible");
  const hors = lecture.filter((x) => x.classe === "hors_cadre");
  const verifs = possible.flatMap((x) => lieux.flatMap((l) => l.verifications.filter((vv) => vv.cle === x.cle && !vv.reponse).map((vv) => ({ l, vv }))));

  return (
    <>
      <div className={v.ordre}>
        <Selecteur id={`${id}-ordre`} question="Ordre des colonnes" valeur={ordre} onChoisir={setOrdre}
          options={(["ajout", "montant", "surface", "trajet"] as const).map((d) => ({ valeur: d, libelle: LIBELLE_DIMENSION[d] }))} />
        {groupes.map((g) => g.note ? <p key={g.titre} className={s.nuance}>{g.note}</p> : null)}
      </div>

      <Mouvement numero="01" titre="Ce qui contredit vos conditions sans compromis" id="contredit">
        {bloquants.length ? (
          <ul className={v.listeSimple}>{bloquants.map((b) => <li key={b.lieuId + b.cle} className={v.alerte}>{lier(b.phrase)}</li>)}</ul>
        ) : <p className={s.corps}>Aucun des logements comparés ne contredit une condition sans compromis, d&apos;après leurs analyses.</p>}
        {bloquants.length ? <p className={s.nuance}>Rien ne compense une condition sans compromis : ces logements restent dans la comparaison et gardent ce signalement, quels que soient leurs points favorables.</p> : null}
      </Mouvement>

      <Mouvement numero="02" titre="Ce qui les départage" id="departage">
        {departage.length || possible.length ? (
          <div className={s.pile}>
            {departage.map((x) => <p key={x.cle} className={v.phraseForte}><span className={v.classe} data-classe={x.classe}>{LIBELLE_CLASSE[x.classe]}</span> {lier(x.phrase)}</p>)}
            {possible.map((x) => <p key={x.cle} className={v.phrase}><span className={v.classe} data-classe={x.classe}>{LIBELLE_CLASSE[x.classe]}</span> {lier(x.phrase)}</p>)}
          </div>
        ) : <p className={s.corps}>Aucune condition ne départage ces logements dans un même cadre.</p>}
        {hors.length ? (
          <div className={v.horsBloc}>
            <p className={v.groupeTitre}>Ne se compare pas encore</p>
            {hors.map((x) => <p key={x.cle} className={s.dense}>{lier(x.phrase)}</p>)}
          </div>
        ) : null}
      </Mouvement>

      <Mouvement numero="03" titre="Condition par condition" id="matrice"
        action={critere ? <button type="button" className={s.action} onClick={() => choisirCritere(undefined)}>Toutes les conditions</button> : null}>
        <p className={s.nuance}>Choisissez une condition pour lire ce qui rapproche ou sépare chaque paire, et pourquoi.</p>
        <div className={v.matrice} style={{ "--colonnes": colonnes.length } as React.CSSProperties} role="table" aria-label="Chaque condition de votre Projet, pour chaque logement">
          <div className={v.matriceTete} role="row">
            <span role="columnheader" className={v.matriceCoin}>Votre Projet</span>
            {colonnes.map(({ lieu, valeur }) => (
              <span key={lieu.id} role="columnheader" className={v.matriceLieu}>
                <EmblemeLieu lieu={lieu} taille={30} />
                <button type="button" className={v.lieuLien} onClick={() => aller({ ecran: "fiche", lieu: lieu.id })}>{lieu.libelle}</button>
                <span className={v.matriceSous}>{lieu.commune.nom}{valeur ? ` · ${valeur}` : ""}</span>
              </span>
            ))}
          </div>
          {projet.criteres.map((c) => {
            const lc = lecture.find((x) => x.cle === c.cle)!;
            const ouvert = critere === c.cle;
            return (
              <Fragment key={c.cle}>
                <div role="row" className={v.matriceLigne} data-ouvert={ouvert || undefined} data-estompe={critere && !ouvert ? true : undefined}>
                  <span role="rowheader" className={v.matriceCritere}>
                    <button type="button" className={v.critereBouton} aria-expanded={ouvert} onClick={() => choisirCritere(ouvert ? undefined : c.cle)}>
                      {libelleCritere(c)}
                    </button>
                    <span className={v.classe} data-classe={lc.classe}>{LIBELLE_CLASSE[lc.classe]}</span>
                  </span>
                  {colonnes.map(({ lieu }) => <Cellule key={lieu.id} lieu={lieu} cle={c.cle} lieux={colonnes.map((x) => x.lieu)} projet={projet} />)}
                </div>
                {ouvert ? (
                  <div role="row" className={v.matriceDetail}>
                    <div role="cell" className={v.detailCorps}>
                      <p className={s.dense}>{lier(lc.phrase)}</p>
                      <ul className={v.paires}>
                        {lc.paires.map((p, i) => <Paire key={i} p={p} lieux={colonnes.map((x) => x.lieu)} />)}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </Fragment>
            );
          })}
        </div>
        <p className={v.legende}>
          <span><GlypheGrain grain="commune" taille={10} /> commune</span>
          <span><GlypheGrain grain="secteur" taille={10} /> abords</span>
          <span><GlypheGrain grain="batiment" taille={10} /> logement</span>
          <span>« = » une seule lecture de la commune, partagée</span>
          <span>« ancien » établi sous une autre version de cette condition</span>
        </p>
      </Mouvement>

      <Mouvement numero="04" titre="Pour les départager" id="pour-departager">
        {verifs.length ? (
          <ul className={v.listeSimple}>
            {verifs.map(({ l, vv }) => (
              <li key={vv.id} className={v.comparerAvec}>
                <span className={s.dense}><strong className={s.encre}>{l.libelle}</strong> · {lier(vv.question)}</span>
                <button type="button" className={s.action} onClick={() => aller({ ecran: "fiche", lieu: l.id })}>Ouvrir la fiche</button>
              </li>
            ))}
          </ul>
        ) : <p className={s.corps}>Aucune vérification ouverte ne porte sur une condition qui pourrait les départager.</p>}
        {lieux.some((l) => connaissance(l) === "enregistre") ? <p className={s.nuance}>{lieux.filter((l) => connaissance(l) === "enregistre").map((l) => l.libelle).join(", ")} : pas encore analysé{lieux.filter((l) => connaissance(l) === "enregistre").length > 1 ? "s" : ""}. Ce que dit une annonce n&apos;entre dans aucune ligne.</p> : null}
      </Mouvement>
    </>
  );
}

function Cellule({ lieu, cle, lieux, projet }: { lieu: Lieu; cle: CleCritere; lieux: Lieu[]; projet: Projet }) {
  const a = analyseServie(lieu);
  const r = a?.registre.find((x) => x.cle === cle) ?? null;
  const ancien = a && r && a.projet.criteres.find((x) => x.cle === cle)?.valeur !== projet.criteres.find((x) => x.cle === cle)?.valeur;
  const partage = r?.grain === "commune" && lieux.some((o) => o.id !== lieu.id && o.commune.insee === lieu.commune.insee && comparerCritere(cle, lieu, o).motifs.some((m) => m.type === "lecture_partagee"));
  return (
    <span role="cell" className={v.cellule} data-vide={!a || undefined}>
      <span className={v.celluleNom}>{lieu.libelle}</span>
      {a ? <MarqueIssue ligne={r} /> : <span className={v.pasLu}>pas analysé</span>}
      {partage ? <span className={v.mention} title={`Une seule lecture de ${lieu.commune.nom}`}>=</span> : null}
      {ancien ? <span className={v.mention}>ancien</span> : null}
    </span>
  );
}

function Paire({ p, lieux }: { p: ComparaisonCritere; lieux: Lieu[] }) {
  const la = lieux.find((x) => x.id === p.ida);
  const lb = lieux.find((x) => x.id === p.idb);
  const titre = `${la?.libelle ?? "?"} · ${lb?.libelle ?? "?"}`;
  return (
    <li className={v.paire}>
      <span className={v.paireTete}><EtatComparaisonTag etat={p.etat} /> <span className={s.dense}>{titre}</span></span>
      {p.motifs.length ? p.motifs.map((m, i) => <span key={i} className={s.nuance}>{lier(m.texte)}</span>)
        : <span className={s.nuance}>{explication(p)}</span>}
    </li>
  );
}

/** Pourquoi deux lignes se comparent : le cadre vérifié, dit en clair. */
function explication(p: ComparaisonCritere): string {
  const g = p.a?.grain ? GRAIN_LIBELLE[p.a.grain] : "";
  const sources = (p.a?.sources ?? []).map((x) => `${x.nom} ${x.millesime}`).join(", ");
  return `Se compare : même valeur de cette condition dans les deux analyses, mêmes règles, mêmes données (${sources || "sans source datée"}), établi ${g} des deux côtés.`;
}

// ── Face-à-face ──────────────────────────────────────────────────────────────────────────────

function FaceAFace({ api, a, b, inverser }: { api: Api; a: Lieu; b: Lieu; inverser: () => void }) {
  const { etat, aller } = api;
  const projet = etat.projet;
  const lignes = projet.criteres.map((c) => ({ c, r: comparerCritere(c.cle, a, b) }));
  const perim = perimetreComparable(a, b, projet);
  const distingue = lignes.filter((x) => x.r.etat === "difference_demontree");
  const pasEtabli = lignes.filter((x) => x.r.etat === "difference_possible" || x.r.etat === "a_verifier");
  const horsCadre = lignes.filter((x) => (x.r.etat === "non_comparable" && x.r.motifs.some((m) => m.type !== "lecture_partagee")) || x.r.etat === "indisponible");
  const commun = lignes.filter((x) => x.r.etat === "meme_lecture" || (x.r.etat === "non_comparable" && x.r.motifs.every((m) => m.type === "lecture_partagee")));
  const durs = projet.criteres.filter((c) => c.nature === "sans_compromis");
  const nt = [...conditionsNonTenues(a, projet), ...conditionsNonTenues(b, projet)];

  return (
    <>
      <div className={v.faceTetes}>
        {[a, b].map((l, i) => (
          <div key={l.id} className={v.faceTete} data-cote={i === 0 ? "a" : "b"}>
            <EmblemeLieu lieu={l} taille={56} />
            <p className={s.etiquette}>{l.commune.nom}</p>
            <p className={`${s.titre} ${v.faceNom}`}><button type="button" className={v.lieuLien} onClick={() => aller({ ecran: "fiche", lieu: l.id })}>{l.libelle}</button></p>
            <p className={s.nuance}>{libelleConnaissance(l)}</p>
          </div>
        ))}
      </div>
      <p className={v.faceInverser}><button type="button" className={s.action} onClick={inverser}>Inverser les côtés</button> <span className={s.nuance}>L&apos;ordre suit votre choix.</span></p>

      <dl className={v.perimetre}>
        <div><dt>Se compare</dt><dd>{perim.seCompare.length ? perim.seCompare.join(", ") : "rien pour l'instant"}</dd></div>
        {perim.neSeComparePas.length ? <div><dt>Ne se compare pas</dt><dd>{perim.neSeComparePas.map((x, i) => <span key={i} className={v.perimItem}>{lier(x)}</span>)}</dd></div> : null}
      </dl>

      <p className={v.phraseEntree}>
        {distingue.length
          ? lier(`${distingue.length === 1 ? "Une condition distingue" : `${distingue.length} conditions distinguent`} ces logements : ${distingue.map((x) => `${NOM_CRITERE[x.c.cle].toLowerCase()}, ${GRAIN_LIBELLE[x.r.a!.grain!]}`).join(" ; ")}.`)
          : "Aucune condition ne les distingue dans un même cadre."}
      </p>

      <Mouvement numero="01" titre="Ce qui les distingue" id="distingue">
        {distingue.length ? distingue.map(({ c, r }) => <PisteFace key={c.cle} titre={libelleCritere(c)} r={r} a={a} b={b} />)
          : <p className={s.corps}>Rien de démontré dans le même cadre.</p>}
      </Mouvement>

      <Mouvement numero="02" titre="Vos conditions sans compromis" id="durs">
        <ul className={v.durs}>
          {durs.map((c) => {
            const r = lignes.find((x) => x.c.cle === c.cle)!.r;
            const ntc = nt.filter((x) => x.cle === c.cle);
            const tenue = estEtabli(r.a) && estEtabli(r.b) && r.a!.issue !== "incompatible" && r.b!.issue !== "incompatible";
            return (
              <li key={c.cle} className={v.dur}>
                <span className={v.durNom}>{libelleCritere(c)}</span>
                <span className={s.dense}>
                  {ntc.length ? ntc.map((x) => <span key={x.lieuId} className={v.alerteTexte}>{lier(x.phrase)} </span>)
                    : r.etat === "non_comparable" && r.motifs.every((m) => m.type === "lecture_partagee") ? `Tenue pour les deux : une seule lecture de ${a.commune.nom}.`
                      : r.etat === "non_comparable" ? `Tenue d'après chaque analyse, mais pas dans le même cadre. ${r.motifs[0]!.texte}`
                        : tenue ? "Tenue pour les deux." : `À vérifier : ${r.motifs[0]?.texte ?? ""}`}
                </span>
              </li>
            );
          })}
        </ul>
      </Mouvement>

      <Mouvement numero="03" titre="Pas encore établi" id="pas-etabli">
        {pasEtabli.length ? pasEtabli.map(({ c, r }) => (
          <PisteFace key={c.cle} titre={libelleCritere(c)} r={r} a={a} b={b}
            action={[a, b].some((l) => l.verifications.some((vv) => vv.cle === c.cle && !vv.reponse))
              ? <button type="button" className={s.action} onClick={() => aller({ ecran: "fiche", lieu: [a, b].find((l) => l.verifications.some((vv) => vv.cle === c.cle && !vv.reponse))!.id })}>Quoi vérifier</button> : undefined} />
        )) : <p className={s.corps}>Tout ce qui se compare est établi des deux côtés.</p>}
      </Mouvement>

      <Mouvement numero="04" titre="Ne se compare pas" id="hors-cadre">
        {horsCadre.length ? (
          <ul className={v.listeSimple}>
            {horsCadre.map(({ c, r }) => (
              <li key={c.cle} className={v.horsLigne}>
                <span className={v.durNom}>{libelleCritere(c)}</span>
                <span className={s.pileSerree}>
                  <EtatComparaisonTag etat={r.etat} />
                  {r.motifs.map((m, i) => <span key={i} className={s.dense}>{lier(m.texte)}</span>)}
                  {r.motifs.some((m) => m.type === "projet") ? <span className={s.nuance}>Mettre à jour l&apos;analyse la plus ancienne ramènerait cette condition dans le même cadre.</span> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className={s.corps}>Tout se compare dans le même cadre.</p>}
      </Mouvement>

      <Mouvement numero="05" titre="En commun" id="commun">
        <details className={s.details}>
          <summary>{commun.length} condition{commun.length > 1 ? "s" : ""} en commun</summary>
          <ul className={v.listeSimple}>
            {commun.map(({ c, r }) => (
              <li key={c.cle} className={s.dense}>
                {libelleCritere(c)} : {r.motifs.some((m) => m.type === "lecture_partagee") ? `une seule lecture de ${a.commune.nom}, ${LIBELLE_ISSUE[r.a!.issue].toLowerCase()}.` : `${LIBELLE_ISSUE[r.a!.issue].toLowerCase()} des deux côtés, ${GRAIN_LIBELLE[r.a!.grain!]}.`}
              </li>
            ))}
          </ul>
        </details>
      </Mouvement>
    </>
  );
}

function PisteFace({ titre, r, a, b, action }: { titre: string; r: ComparaisonCritere; a: Lieu; b: Lieu; action?: React.ReactNode }) {
  const g = (r.a ?? r.b)?.grain;
  return (
    <div className={v.piste}>
      <div className={v.pisteTitre}>
        <p className={s.sousTitre}>{titre}</p>
        <p className={s.nuance}>{g ? GRAIN_LIBELLE[g] : ""}{(r.a ?? r.b)?.preuve ? ` · ${(r.a ?? r.b)!.preuve!.source}` : ""}</p>
        <details className={`${s.details} ${v.pourquoi}`}>
          <summary>Pourquoi ?</summary>
          <p className={s.nuance}>{r.motifs.length ? r.motifs.map((m) => m.texte).join(" ") : explication(r)}</p>
        </details>
        {action}
      </div>
      <div className={v.pisteCote} data-cote="a">
        <MarqueIssue ligne={r.a} />
        {r.a?.constat ? <span className={v.pisteConstat}>{lier(r.a.constat)}</span> : null}
        <span className={v.sr}>{a.libelle}</span>
      </div>
      <span className={v.pisteFilet} aria-hidden />
      <div className={v.pisteCote} data-cote="b">
        <MarqueIssue ligne={r.b} />
        {r.b?.constat ? <span className={v.pisteConstat}>{lier(r.b.constat)}</span> : null}
        <span className={v.sr}>{b.libelle}</span>
      </div>
    </div>
  );
}
