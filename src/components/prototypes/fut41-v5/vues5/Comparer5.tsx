"use client";
// COMPARER, V5 · deux modes explicites (vos communes, vos logements), une seule structure :
//   1. En bref : ce qui bloque (dit une fois, Z12), la condition sans compromis, ce qui manque ;
//   2. Ce qui change votre choix : les écarts lus de la même façon, et ce qui reste à vérifier,
//      avec le geste au niveau de l'incertitude (troisième revue Work : une lecture principale) ;
//   3. Et si… ? juste après ; puis ce qui reste à vérifier et le prochain geste de chacun ;
//   4. Le détail, condition par condition, couche par couche, avec mesures et preuves.
// Quand il n'y a pas d'écart à montrer, le bilan complet (apporte, demande d'accepter) reprend sa place.
// Sur ordinateur : deux à quatre colonnes. Sur téléphone : deux, en face-à-face, et l'on change
// l'une ou l'autre. Aucun ordre de mérite : les colonnes suivent l'ordre de vos communes.
import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";
import { GlypheGrain, Plaque, releve as s } from "@/components/releve/primitives";
import { bilan, colonnesDe, confronter, dateCourte, enBref, etSi5, logementsDe, montantAnnonce, simuler, NOM_CRITERE, TITRE_SEAU5, type Bilan, type Colonne, type Logement, type Piste, type SeauEtSi } from "../modele5";
import { faireGeste, type Api5 } from "../CentreDecision5";
import { BoutonGeste, Declare, Section, Vignette, lier } from "../communs5";
import { Confrontation } from "../Confrontation";
import { Plan5 } from "../Plan5";
import v from "../v5.module.css";

const MAX = 4;
const requete = "(max-width: 759px)";
const abonner = (f: () => void) => { const m = window.matchMedia(requete); m.addEventListener("change", f); return () => m.removeEventListener("change", f); };
export const useEtroit = () => useSyncExternalStore(abonner, () => window.matchMedia(requete).matches, () => false);

export function Comparer5({ api }: { api: Api5 }) {
  const { etat, aller } = api;
  const id = useId();
  const etroit = useEtroit();
  const mode = etat.vue.mode ?? "logements";
  const communes = etat.communes.filter((c) => c.statut !== "ecartee");
  const candidats: Piste[] = mode === "communes"
    ? communes.map((commune) => ({ type: "commune", commune }))
    : communes.flatMap((c) => logementsDe(etat, c).filter((l) => l.statut !== "ecarte").map((logement) => ({ type: "logement" as const, logement })));
  const idDe = (p: Piste) => (p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id);
  const sel = (etat.vue.selection ?? []).filter((x) => candidats.some((p) => idDe(p) === x)).slice(0, MAX);
  const choisis = candidats.filter((p) => sel.includes(idDe(p)));
  const duel = etat.comparaison?.duel ?? [0, 1];
  const setDuel = (d: [number, number]) => api.envoyer({ type: "duel", duel: d });
  const d0 = Math.min(duel[0], choisis.length - 1); const d1 = Math.min(duel[1], choisis.length - 1);
  const montres = etroit && choisis.length > 2 ? [choisis[d0]!, choisis[d1 === d0 ? (d0 + 1) % choisis.length : d1]!] : choisis;
  const choisir = (selection: string[], m = mode) => aller({ ecran: "comparer", mode: m, selection });
  const basculer = (x: string) => choisir(sel.includes(x) ? sel.filter((y) => y !== x) : sel.length >= MAX ? sel : [...sel, x]);

  const conf = montres.length >= 2 ? confronter(etat, montres) : null;
  const cols = montres.length >= 2 ? colonnesDe(etat, montres) : [];
  const bilans = cols.map((c) => bilan(etat, montres.find((p) => idDe(p) === c.id)!, etat.droits));
  // Deuxième revue Work : une première lecture plus visuelle, réduite aux écarts établis et aux écarts possibles.
  const change = conf ? conf.lignes.map((li) => ({ ...li, couches: li.couches.filter((x) => x.verdict === "distingue" || (x.verdict === "pourrait" && x.couche !== "commune")) })).filter((li) => li.couches.length) : [];
  const bref = conf ? enBref(etat, montres) : [];
  const distingue = bref.find((x) => x.titre === "Ce qui les distingue");
  const resteAVerifier = change.some((li) => li.couches.some((x) => x.verdict === "pourrait"));
  // Le bilan ne se réduit que si tout est examiné partout : sinon ce qu'un seul lieu demande d'accepter
  // (un compromis lu pour lui seul) disparaîtrait de la lecture principale.
  const reduit = change.length > 0 && bilans.every((b) => b.lus === b.total);
  // Le geste au niveau de l'incertitude : les questions déjà prêtes pour ce logement et cette condition.
  const questions = (cle: string, ids: string[]) => {
    if (ids.length !== 1) return null;
    const l = etat.logements.find((x) => x.id === ids[0]);
    const n = l ? l.verifications.filter((q) => q.cle === cle && !q.reponse).length : 0;
    return l && n ? <button type="button" className={`${s.action} ${v.cible}`} onClick={() => aller({ ecran: "logement", id: l.id, ancre: "verifier" })}>{n === 1 ? "Voir la question à poser" : `Voir les ${n} questions à poser`}</button> : null;
  };
  // Revue « utilisateur » de Work : on compare des logements concrets ; prix, surface et vignette restent
  // en tête de chaque colonne, déclarés, sans couleur ni ordre.
  const teteCol = (c: Colonne) => {
    const l = c.type === "logement" ? etat.logements.find((x) => x.id === c.id) : undefined;
    return <TeteLieu nom={c.nom} sous={c.sous} logement={l} />;
  };
  const communesVues = [...new Set(montres.map((p) => (p.type === "commune" ? p.commune.insee : p.logement.commune.insee)))].map((i) => etat.communes.find((c) => c.insee === i)!).filter(Boolean);

  return (
    <>
      <div className={v.tete}>
        <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{mode === "communes" ? "Comparer vos communes" : "Comparer vos logements"}</h1>
        <p className={s.nuance}>Aucun classement. Face à votre Projet, révision {etat.projet.revision} du {dateCourte(etat.projet.date)}.</p>
      </div>

      <div className={v.modes} role="group" aria-label="Ce que vous comparez">
        {(["communes", "logements"] as const).map((m) => (
          <button key={m} type="button" className={v.mode} aria-pressed={mode === m}
            onClick={() => choisir(m === "communes" ? communes.map((c) => `c:${c.insee}`).slice(0, MAX) : (() => { const ls = communes.flatMap((c) => logementsDe(etat, c).filter((l) => l.statut !== "ecarte")); return ls.length <= MAX ? ls.map((l) => l.id) : []; })(), m)}>
            {m === "communes" ? "Vos communes" : "Vos logements"}
          </button>
        ))}
      </div>

      <div className={v.choix} role="group" aria-labelledby={`${id}-c`}>
        <p className={s.etiquette} id={`${id}-c`}>{sel.length ? `${sel.length} ${mode === "communes" ? "commune" : "logement"}${sel.length > 1 ? "s" : ""} sélectionné${mode === "communes" ? "e" : ""}${sel.length > 1 ? "s" : ""} · ${MAX} au plus` : `Choisissez deux à ${MAX} ${mode === "communes" ? "communes" : "logements"}`}</p>
        <div className={v.choixGroupes}>
          {mode === "communes" ? (
            <div className={v.choixGroupe}>{candidats.map((p) => <Puce key={idDe(p)} p={p} actif={sel.includes(idDe(p))} plein={sel.length >= MAX} basculer={basculer} />)}</div>
          ) : communes.map((c) => {
            const ps = candidats.filter((p) => p.type === "logement" && p.logement.commune.insee === c.insee);
            return ps.length ? (
              <div key={c.insee} className={v.choixGroupe}>
                <span className={v.choixCommune}><GlypheGrain grain="commune" taille={10} /> {c.nom}</span>
                {ps.map((p) => <Puce key={idDe(p)} p={p} actif={sel.includes(idDe(p))} plein={sel.length >= MAX} basculer={basculer} />)}
              </div>
            ) : null;
          })}
        </div>
        {sel.length >= MAX ? <p className={s.nuance}>Quatre au plus côte à côte : au-delà, les colonnes deviennent illisibles. Retirez-en un pour en ajouter un autre.</p> : null}
        {mode === "logements" && !candidats.length ? <p className={s.nuance}>Aucun logement gardé pour l&apos;instant. Vous pouvez déjà comparer vos communes.</p> : null}
      </div>

      {!conf ? (
        <p className={s.corps}>{mode === "communes" ? "Choisissez au moins deux communes." : "Choisissez au moins deux logements, dans une même commune ou dans plusieurs."}</p>
      ) : (
        <>
          {etroit && choisis.length > 2 ? (
            <div className={v.duel} role="group" aria-label="Les deux que vous voyez côte à côte">
              {[0, 1].map((i) => (
                <label key={i} className={v.duelChamp}>
                  <span className={v.sr}>{i === 0 ? "À gauche" : "À droite"}</span>
                  <select value={i === 0 ? d0 : d1} onChange={(e) => { const n = Number(e.target.value); setDuel(i === 0 ? [n, n === d1 ? d0 : d1] : [n === d0 ? d1 : d0, n]); }}>
                    {choisis.map((p, k) => <option key={idDe(p)} value={k}>{p.type === "commune" ? p.commune.nom : p.logement.libelle}</option>)}
                  </select>
                </label>
              ))}
            </div>
          ) : null}

          <Plaque etiquette="En bref" className={v.bref}>
            <p className={s.etiquette}>En bref</p>
            <dl className={v.lignesTitrees}>{bref.filter((x) => !change.length || (x.titre !== "Ce qui les distingue" && (x.titre !== "Ce qui pourrait changer votre choix" || !resteAVerifier))).map((x) => <div key={x.titre}><dt>{x.titre}</dt><dd>{lier(x.texte)}</dd></div>)}</dl>
          </Plaque>

          {change.length ? (
            <Section titre="Ce qui change votre choix" id="change"
              sous={`${distingue && !/^Rien ne les distingue/.test(distingue.texte) ? `${distingue.texte} ` : ""}${resteAVerifier ? bref.find((x) => x.titre === "Ce qui pourrait changer votre choix")?.texte ?? "Les cases à vérifier pourraient encore changer votre choix." : ""}`.trim() || undefined}>
              <Confrontation colonnes={conf.colonnes} lignes={change} projet={etat.projet} compact action={questions} tete={teteCol} />
            </Section>
          ) : null}

          <EtSiIci api={api} montres={montres} />

          <Section titre={reduit ? "Ce qui reste à vérifier, et le prochain geste" : mode === "communes" ? "Ce que chacune apporte, et ce qu'elle demande" : "Ce que chacun apporte, et ce qu'il demande"} id="bilan">
            <Bilans bilans={bilans} api={api} montres={montres} reduit={reduit} />
          </Section>

          {mode === "communes" || communesVues.length > 1 ? (
            <Section titre="Où elles sont" id="carte" sous="Un repère pour situer les communes l'une par rapport à l'autre. Le trajet réel se mesure depuis une adresse.">
              <Plan5 api={api} communes={communesVues} />
            </Section>
          ) : null}

          <Section titre="Le détail, condition par condition" id="detail"
            sous={mode === "communes" ? "Étudié à l'échelle de la commune. La gare, le calme et le quartier se lisent aussi aux abords d'une adresse : pour un logement, la commune n'en donne qu'un repère." : "D'abord ce qui est connu pour la commune (une seule case quand deux logements la partagent), puis ce qui s'étudie depuis l'adresse."}>
            <Confrontation colonnes={conf.colonnes} lignes={conf.lignes} projet={etat.projet} tete={teteCol} />
          </Section>

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

/** Un lieu en tête de colonne : vignette (photo seulement si vous l'avez ajoutée), nom, commune, prix et surface déclarés. */
export function TeteLieu({ nom, sous, logement }: { nom: string; sous: string; logement?: Logement }) {
  const annonce = logement ? [montantAnnonce(logement.annonce), logement.annonce?.surface ? `${logement.annonce.surface} m²` : null].filter(Boolean).join(" · ") : "";
  return (
    <span className={v.teteLieu}>
      {logement ? <Vignette logement={logement} taille={40} /> : null}
      <span className={v.teteLieuTexte}>
        <strong>{nom}</strong>
        <span className={v.teteLieuSous}>{sous}</span>
        {annonce ? <span className={v.teteLieuAnnonce}>{annonce} <Declare /></span> : null}
      </span>
    </span>
  );
}

function Puce({ p, actif, plein, basculer }: { p: Piste; actif: boolean; plein: boolean; basculer: (id: string) => void }) {
  const id = p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id;
  return (
    <button type="button" className={v.puce} aria-pressed={actif} disabled={!actif && plein} onClick={() => basculer(id)} data-commune={p.type === "commune" || undefined}>
      <span className={v.coche} aria-hidden>{actif ? "✓" : ""}</span>
      {p.type === "commune" ? <><GlypheGrain grain="commune" taille={10} /> {p.commune.nom}</> : p.logement.libelle}
    </button>
  );
}

const RANGS: { cle: keyof Pick<Bilan, "apporte" | "accepte" | "ouvert" | "pasLu">; titre: string; genre: string }[] = [
  { cle: "apporte", titre: "Apporte", genre: "apporte" },
  { cle: "accepte", titre: "Demande d'accepter", genre: "accepte" },
  { cle: "ouvert", titre: "Pourrait changer l'arbitrage", genre: "inconnu" },
  { cle: "pasLu", titre: "Pas encore étudié", genre: "manque" },
];

function Bilans({ bilans, api, montres, reduit = false }: { bilans: Bilan[]; api: Api5; montres: Piste[]; reduit?: boolean }) {
  const piste = (id: string) => montres.find((p) => (p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id) === id)!;
  return (
    <div className={v.bilans} style={{ "--cols": bilans.length } as CSSProperties}>
      <div className={v.bilanRang} data-tete>
        <span className={v.bilanCle} aria-hidden />
        {bilans.map((b) => {
          const p = piste(b.id);
          return (
            <div key={b.id} className={v.bilanNom}>
              {p.type === "logement" ? <Vignette logement={p.logement} taille={32} /> : null}
              <span className={s.pileSerree}>
                <button type="button" className={v.lien} onClick={() => api.aller(p.type === "commune" ? { ecran: "commune", id: b.id } : { ecran: "logement", id: b.id })}>{b.nom}</button>
                <span className={v.bilanSous}>{p.type === "commune" ? "la commune" : [p.logement.commune.nom, montantAnnonce(p.logement.annonce), p.logement.annonce?.surface ? `${p.logement.annonce.surface} m²` : null].filter(Boolean).join(" · ")}</span>
                <span className={v.bilanSous}>{b.lus === b.total ? "Tout est étudié" : `${b.lus} condition${b.lus > 1 ? "s" : ""} sur ${b.total} étudiée${b.lus > 1 ? "s" : ""}`}{b.aVerifier ? ` · ${b.aVerifier} à vérifier` : ""}</span>
                {b.bloque ? <span className={v.etiquetteBloque}>bloque, voir En bref</span> : b.aRevoir ? <span className={v.etiquetteRevoir}>étudié avec votre ancien Projet</span> : null}
              </span>
            </div>
          );
        })}
      </div>
      {RANGS.filter((r) => !reduit || r.cle === "ouvert" || r.cle === "pasLu").map((r) => bilans.some((b) => b[r.cle].length) ? (
        <div key={r.cle} className={v.bilanRang} data-genre={r.genre}>
          <span className={v.bilanCle}>{r.titre}</span>
          {bilans.map((b) => (
            <div key={b.id} className={v.bilanCell}>
              <span className={v.sr}>{b.nom}, {r.titre.toLowerCase()} : </span>
              {b[r.cle].length ? (r.cle === "pasLu" ? <span className={v.nonLu}>{b[r.cle].join(", ")}</span> : <ul>{b[r.cle].map((x) => <li key={x}>{lier(x)}</li>)}</ul>) : <span className={v.nonLu}>{r.cle === "pasLu" ? "tout est étudié" : r.cle === "ouvert" ? "aucune question ouverte" : `${r.cle === "apporte" ? "aucun avantage" : "aucun compromis"} identifié${b.lus < b.total ? ` pour l'instant ; ${b.total - b.lus} point${b.total - b.lus > 1 ? "s" : ""} pas encore étudié${b.total - b.lus > 1 ? "s" : ""}` : ""}`}</span>}
            </div>
          ))}
        </div>
      ) : null)}
      <div className={v.bilanRang} data-genre="geste">
        <span className={v.bilanCle}>Prochain geste</span>
        {bilans.map((b) => (
          <div key={b.id} className={v.bilanCell}>
            <BoutonGeste geste={b.geste} faire={faireGeste(api, piste(b.id))} apport={b.geste.commercial ? b.geste.court ?? null : null} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ET SI, PRÈS DE LA COMPARAISON (essai limité, pistes de la revue Work) : une autre limite pour la
 * condition sans compromis, ou une priorité qui deviendrait sans compromis, et ce que cela changerait
 * pour les seules possibilités affichées. Replié par défaut ; rien n'est modifié ici. Adopter se fait
 * dans Mon Projet.
 */
export function EtSiIci({ api, montres }: { api: Api5; montres: Piste[] }) {
  const { etat, aller } = api;
  const k = etat.projet.criteres.find((c) => c.nature === "sans_compromis" && c.valeur != null);
  const prios = etat.projet.criteres.filter((c) => c.nature === "priorite");
  const choix = [15, 20, 30, 40].filter((x) => x !== k?.valeur);
  const [essai, setEssai] = useState<string>(k ? "limite" : prios[0]?.cle ?? "");
  const [val, setVal] = useState<number>(choix.find((x) => x > (k?.valeur ?? 0)) ?? choix[0]!);
  const ids = new Set(montres.map((p) => (p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id)));
  const logements = montres.filter((p): p is { type: "logement"; logement: Logement } => p.type === "logement").map((p) => p.logement);
  const ordre: SeauEtSi[] = ["pourrait_changer", "nouvelle_analyse", "inchange", "pas_lu"];
  const prio = prios.find((c) => c.cle === essai);
  const res = essai === "limite" && k ? etSi5(etat, k.cle, val).filter((x) => ids.has(x.pisteId)) : [];
  const effets = prio ? simuler(logements, etat.projet, { type: "nature", cle: prio.cle, nature: "sans_compromis" }).effets : [];
  if (!k && !prios.length) return null;
  return (
    <details className={`${s.details} ${v.etSiIci}`}>
      <summary>Et si vos conditions changeaient ?</summary>
      <div className={v.etSiCorps}>
        <p className={v.simulation}>Essai · votre Projet n&apos;est pas modifié</p>
        <label className={v.champ}><span className={s.etiquette}>Essayer</span>
          <select value={essai} onChange={(e) => setEssai(e.target.value)}>
            {k ? <option value="limite">une autre limite pour {NOM_CRITERE[k.cle].toLowerCase()}</option> : null}
            {prios.map((c) => <option key={c.cle} value={c.cle}>{NOM_CRITERE[c.cle].toLowerCase()} sans compromis</option>)}
          </select>
        </label>
        {essai === "limite" && k ? (
          <>
            <label className={v.champ}><span className={s.etiquette}>Au lieu de {k.valeur} min</span>
              <select value={val} onChange={(e) => setVal(Number(e.target.value))}>{choix.map((x) => <option key={x} value={x}>{x} min</option>)}</select>
            </label>
            {ordre.map((sx) => {
              const xs = res.filter((x) => x.seau === sx);
              return xs.length ? <div key={sx} className={v.seau} data-seau={sx}><p className={v.seauTitre}>{TITRE_SEAU5[sx]}</p><ul>{xs.map((x) => <li key={x.pisteId}><strong className={s.encre}>{x.nom}</strong> · {lier(x.raison)}</li>)}</ul></div> : null;
            })}
          </>
        ) : prio ? (
          <div className={v.seau} data-seau="pourrait_changer">
            <p className={v.seauTitre}>Si {NOM_CRITERE[prio.cle].toLowerCase()} devenait une condition sans compromis</p>
            {effets.length ? <ul>{effets.map((x, i) => <li key={i}>{lier(x.phrase)}</li>)}</ul> : <p className={s.dense}>Parmi ce qui est étudié, aucune de ces possibilités n&apos;y fait un compromis : l&apos;effet estimé serait nul.</p>}
          </div>
        ) : null}
        <p className={s.nuance}>Effet estimé d&apos;après les mesures déjà faites ; seule une analyse mise à jour le confirmerait.</p>
        <p><button type="button" className={`${s.bouton} ${v.cible}`} onClick={() => aller({ ecran: "projet", ancre: "et-si", essai: essai === "limite" && k ? `valeur.${k.cle}.${val}` : prio ? `nature.${prio.cle}` : undefined })}>Adopter ce changement dans Mon Projet</button></p>
      </div>
    </details>
  );
}
