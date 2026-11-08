"use client";
// COMPRENDRE UN LOGEMENT · sa fiche de décision. Quatre provenances, jamais mêlées : la conclusion du
// dossier (citée mot pour mot, datée), le fait public (avec sa preuve), la déclaration (annonce,
// vendeur, agence) et l'observation personnelle. Une réponse à une vérification réévalue la LECTURE,
// jamais le fait source (FUT-21).
import { useId, useState } from "react";
import { Ligne, Marge, Plaque, Registre, Selecteur, releve as s, type ElementDeMarge } from "@/components/releve/primitives";
import {
  analyseServie, conditionsNonTenues, connaissance, critereAJour, criteresDepasses, dateCourte, libelleConnaissance,
  libelleCritere, GRAIN_LIBELLE, LIBELLE_ISSUE, LIBELLE_NATURE, LIBELLE_STATUT, NOM_CRITERE, TEINTE_ISSUE, montantAnnonce,
  perimetreComparable,
  type CleCritere, type Lieu, type LigneRegistre, type MomentVerification, type NatureObservation, type Projet, type Verification,
} from "../modele";
import { PASS_INCLUSES } from "../etat";
import type { Api } from "../CentreDecision";
import { Declare, EmblemeLieu, Fil, Mouvement, lier } from "../communs";
import v from "../v4.module.css";

const MOMENTS: { cle: MomentVerification; titre: string }[] = [
  { cle: "avant_visite", titre: "Avant la visite" },
  { cle: "sur_place", titre: "Sur place" },
  { cle: "avant_engagement", titre: "Avant de vous engager" },
];

const LIBELLE_OBS: Record<NatureObservation, string> = { observation: "Votre observation", declaration: "Déclaration du propriétaire ou de l'agence", document: "Document" };

export function Fiche({ api }: { api: Api }) {
  const { etat, aller, envoyer } = api;
  const lieu = etat.lieux.find((l) => l.id === etat.vue.lieu);
  if (!lieu) {
    return (
      <>
        <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "decision" }) }, { libelle: "Logement introuvable" }]} />
        <h1 className={s.titre} tabIndex={-1} data-titre-vue>Ce logement n&apos;est pas dans ce scénario</h1>
      </>
    );
  }
  const a = analyseServie(lieu);
  const depasses = a ? criteresDepasses(a, etat.projet) : [];
  const nt = conditionsNonTenues(lieu, etat.projet);
  const autres = etat.lieux.filter((l) => l.id !== lieu.id && l.statut !== "ecarte");

  return (
    <>
      <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "decision" }) }, { libelle: lieu.libelle }]} />
      <div className={v.ficheTete}>
        <div className={s.pileSerree}>
          <p className={s.surtitre}><span>{lieu.commune.nom}{lieu.adresse ? ` · ${lieu.adresse.split(",")[0]}` : " · adresse inconnue"}</span></p>
          <h1 className={`${s.titre} ${s.titreAdresse}`} tabIndex={-1} data-titre-vue>{lieu.libelle}</h1>
          <p className={s.nuance}>{libelleConnaissance(lieu)}</p>
        </div>
        <EmblemeLieu lieu={lieu} taille={88} />
      </div>

      <StatutEtEcart api={api} lieu={lieu} />

      {nt.length ? (
        <div className={v.bandeauAlerte} role="note">
          {nt.map((x) => <p key={x.cle}>{lier(x.phrase)}</p>)}
          <p className={s.nuance}>Une condition sans compromis n&apos;est compensée par aucun point favorable.</p>
        </div>
      ) : null}

      <Mouvement numero="01" titre="Ce que conclut son dossier" id="conclusion">
        {a ? (
          <Plaque etiquette="Conclusion du dossier">
            <div className={s.pile}>
              <p className={s.etiquette}>{a.perimetre === "commune" ? "Rapport de territoire" : "Dossier d'adresse"} · analyse réalisée le {dateCourte(a.generatedAt)}{a.version > 1 ? ` · version ${a.version}` : ""}{a.simulee ? " · simulée dans le prototype" : ""}</p>
              <p className={`${s.titre} ${v.conclusionPlaque}`} data-conclusion>{lier(a.conclusion.phrase)}</p>
              <p className={s.nuance}>
                {depasses.length
                  ? <>Répond à votre Projet du {dateCourte(a.projet.date)} : {depasses.map((d) => `${d.avant.toLowerCase()} (aujourd'hui : ${d.apres.toLowerCase()})`).join(", ")}. Les autres conditions n&apos;ont pas changé.</>
                  : <>Répond à votre Projet actuel (révision {etat.projet.revision}).</>}
              </p>
              <div className={v.gestes}>
                <button type="button" className={s.bouton} onClick={() => aller({ ecran: "releve", lieu: lieu.id })}>Ouvrir le Relevé complet</button>
                {depasses.length ? <button type="button" className={s.bouton} onClick={() => envoyer({ type: "mettre_a_jour", lieu: lieu.id })}>Mettre à jour avec votre Projet actuel</button> : null}
              </div>
              {depasses.length ? <p className={s.nuance}>Gratuit pour un dossier déjà acquis. L&apos;analyse actuelle reste lisible telle qu&apos;elle a été faite.</p> : null}
            </div>
          </Plaque>
        ) : null}
        {a && connaissance(lieu) === "commune_analysee" ? (
          <div className={v.suiteCommune}>
            <p className={s.dense}>Cette conclusion porte sur la commune de {lieu.commune.nom} ; les abords et le logement de l&apos;adresse ne sont pas encore lus.</p>
            <AnalyserAdresse api={api} lieu={lieu} />
          </div>
        ) : null}
        {a ? null : (
          <SansDossier api={api} lieu={lieu} />
        )}
      </Mouvement>

      <FaceAuProjet lieu={lieu} projet={etat.projet} />

      {lieu.verifications.length ? <Verifications api={api} lieu={lieu} /> : null}

      <Mouvement numero="04" titre="L'annonce, telle qu'elle est déclarée" id="annonce">
        <AnnonceDeclaree lieu={lieu} projet={etat.projet} />
      </Mouvement>

      <Observations api={api} lieu={lieu} />

      <Mouvement numero="06" titre="Historique de cette décision" id="historique">
        <Historique lieu={lieu} projet={etat.projet} />
      </Mouvement>

      {autres.length ? (
        <Mouvement numero="07" titre="Comparer avec un autre logement" id="comparer-avec">
          <ul className={v.listeSimple}>
            {autres.map((o) => {
              const p = perimetreComparable(lieu, o, etat.projet);
              const ok = p.seCompare.length > 0 && connaissance(lieu) !== "enregistre" && connaissance(o) !== "enregistre";
              return (
                <li key={o.id} className={v.comparerAvec}>
                  <span className={s.dense}><strong className={s.encre}>{o.libelle}</strong> · {ok ? `se compare : ${p.seCompare.join(", ")}` : connaissance(o) === "enregistre" || connaissance(lieu) === "enregistre" ? "rien à comparer : l'un des deux n'est pas analysé" : "rien ne se compare encore"}</span>
                  {ok ? <button type="button" className={s.action} onClick={() => aller({ ecran: "comparer", mode: "face", selection: [lieu.id, o.id] })}>Face-à-face</button> : null}
                </li>
              );
            })}
          </ul>
        </Mouvement>
      ) : null}
    </>
  );
}

function StatutEtEcart({ api, lieu }: { api: Api; lieu: Lieu }) {
  const id = useId();
  const [ecarter, setEcarter] = useState(false);
  const [raison, setRaison] = useState("");
  const [cle, setCle] = useState<CleCritere | "aucune">("aucune");
  const { etat, envoyer } = api;
  if (lieu.statut === "ecarte") {
    const e = [...lieu.journal].reverse().find((x) => x.type === "ecarte");
    return (
      <div className={v.ecarteBandeau}>
        <p className={s.dense}><strong className={s.encre}>Écarté le {e ? dateCourte(e.date) : "?"}</strong> : « {e?.raison} »{e?.contexte?.condition ? `, quand votre condition était ${e.contexte.condition}` : ""}.</p>
        <button type="button" className={s.bouton} onClick={() => envoyer({ type: "reactiver", lieu: lieu.id })}>Remettre en course</button>
      </div>
    );
  }
  return (
    <div className={v.statutBloc}>
      <Selecteur id={`${id}-statut`} question="Où vous en êtes avec ce logement" valeur={lieu.statut as "a_etudier" | "a_visiter" | "visite"}
        options={(["a_etudier", "a_visiter", "visite"] as const).map((x) => ({ valeur: x, libelle: LIBELLE_STATUT[x] }))}
        onChoisir={(x) => envoyer({ type: "statut", lieu: lieu.id, statut: x })} />
      {!ecarter ? (
        <button type="button" className={s.action} onClick={() => setEcarter(true)}>Écarter ce logement</button>
      ) : (
        <form className={v.ecarterForm} onSubmit={(ev) => { ev.preventDefault(); if (raison.trim()) envoyer({ type: "ecarter", lieu: lieu.id, raison: raison.trim(), cle: cle === "aucune" ? null : cle }); }}>
          <label className={v.champ}>
            <span className={s.etiquette}>Pourquoi l&apos;écartez-vous ?</span>
            <input value={raison} onChange={(e) => setRaison(e.target.value)} maxLength={200} required placeholder="Quelques mots suffisent" autoFocus />
          </label>
          <label className={v.champ}>
            <span className={s.etiquette}>Une condition de votre Projet en est la cause ? (facultatif)</span>
            <select value={cle} onChange={(e) => setCle(e.target.value as CleCritere | "aucune")}>
              <option value="aucune">Aucune en particulier</option>
              {etat.projet.criteres.map((c) => <option key={c.cle} value={c.cle}>{libelleCritere(c)}</option>)}
            </select>
          </label>
          <p className={s.nuance}>Sera gardé : votre raison, la date, et {cle === "aucune" ? "la révision de votre Projet" : `la valeur de cette condition aujourd'hui (${libelleCritere(etat.projet.criteres.find((c) => c.cle === cle)!).toLowerCase()})`}. Si votre Projet change, futur•e vous le dira.</p>
          <div className={v.gestes}>
            <button type="submit" className={s.bouton} disabled={!raison.trim()}>Écarter</button>
            <button type="button" className={s.action} onClick={() => setEcarter(false)}>Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}

function SansDossier({ api, lieu }: { api: Api; lieu: Lieu }) {
  const { envoyer } = api;
  const [adresse, setAdresse] = useState("");
  const k = connaissance(lieu);
  return (
    <div className={s.pile}>
      <p className={s.corps}>{k === "commune_analysee" ? "Seule la commune est analysée : aucun dossier ne conclut encore sur cette adresse." : "Aucun dossier ne conclut encore sur ce logement. Ce que dit l'annonce reste une déclaration."}</p>
      {!lieu.adresse ? (
        <form className={v.ligneForm} onSubmit={(e) => { e.preventDefault(); if (adresse.trim()) envoyer({ type: "adresse", lieu: lieu.id, adresse: `${adresse.trim()}, ${lieu.commune.nom}` }); }}>
          <label className={v.champ}>
            <span className={s.etiquette}>L&apos;adresse exacte, quand vous la connaissez</span>
            <input value={adresse} onChange={(e) => setAdresse(e.target.value)} maxLength={160} placeholder="Numéro et rue" />
          </label>
          <button type="submit" className={s.bouton} disabled={!adresse.trim()}>Ajouter l&apos;adresse</button>
        </form>
      ) : <AnalyserAdresse api={api} lieu={lieu} />}
    </div>
  );
}

function AnalyserAdresse({ api, lieu }: { api: Api; lieu: Lieu }) {
  const { etat, envoyer } = api;
  if (lieu.id !== "lavoir") return <p className={s.nuance}>Dans ce prototype, l&apos;analyse d&apos;adresse n&apos;est simulée que pour 4 impasse du Lavoir (scénarios ★ et S1).</p>;
  return (
    <div className={s.pileSerree}>
      <div className={v.gestes}>
        <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={() => envoyer({ type: "analyser", lieu: lieu.id })}>
          {etat.droits === "pass" ? `Analyser l'adresse (${PASS_INCLUSES - etat.passUtilisees} restantes sur votre Pass)` : "Analyser l'adresse · dossier d'adresse"}
        </button>
      </div>
      <p className={s.nuance}>{etat.droits === "pass" ? "Hypothèse de revue : une analyse sur le Pass." : "39 €, aucun paiement dans le prototype."} L&apos;analyse est simulée à partir d&apos;une fixture.</p>
    </div>
  );
}

function margeDe(r: LigneRegistre, l: Lieu): ElementDeMarge[] {
  const a = analyseServie(l)!;
  return [
    ...(r.grain ? [{ type: "grain" as const, grain: r.grain === "batiment" ? "batiment" as const : r.grain, libelle: GRAIN_LIBELLE[r.grain] }] : []),
    ...(r.mesure ? [{ type: "valeur" as const, libelle: "Mesure", valeur: `${String(r.mesure.valeur).replace(".", ",")} ${r.mesure.unite}` }] : []),
    ...(r.preuve ? [{ type: "source" as const, texte: `Source : ${r.preuve.source}`, date: r.preuve.date }] : []),
    { type: "date" as const, texte: `Analyse du ${dateCourte(a.generatedAt)}` },
  ];
}

function FaceAuProjet({ lieu, projet }: { lieu: Lieu; projet: Projet }) {
  const a = analyseServie(lieu);
  const lignes = projet.criteres.map((c) => ({ c, r: a?.registre.find((x) => x.cle === c.cle) ?? null }));
  const groupes: { titre: string; test: (r: LigneRegistre | null, dur: boolean) => boolean }[] = [
    { titre: "Contredit une condition sans compromis", test: (r, dur) => dur && r?.issue === "incompatible" },
    { titre: "Correspond à votre Projet", test: (r) => r?.issue === "favorable" },
    { titre: "Les compromis", test: (r) => r?.issue === "reserve" || r?.issue === "mismatch" || r?.issue === "incompatible" },
    { titre: "Ce qui reste à établir", test: (r) => !r || r.issue === "to_confirm" || r.issue === "indeterminate" || r.issue === "non_examine" },
  ];
  const vus = new Set<CleCritere>();
  return (
    <Mouvement numero="02" titre="Face à votre Projet" id="projet-face">
      {!a ? <p className={s.corps}>Rien n&apos;est encore lu pour ce logement : vos {projet.criteres.length} conditions attendent une analyse.</p> : null}
      {a ? groupes.map((g) => {
        const ls = lignes.filter(({ c, r }) => !vus.has(c.cle) && g.test(r, c.nature === "sans_compromis"));
        ls.forEach(({ c }) => vus.add(c.cle));
        if (!ls.length) return null;
        return (
          <div key={g.titre} className={v.faceGroupe}>
            <p className={v.groupeTitre}>{g.titre}</p>
            {ls.map(({ c, r }) => (
              <Ligne key={c.cle} marge={r ? <Marge elements={margeDe(r, lieu)} /> : undefined}>
                <Registre teinte={r ? TEINTE_ISSUE[r.issue] : "var(--reg-non-su)"} as="h3">
                  {libelleCritere(c)}{c.nature === "sans_compromis" ? <span className={v.sansCompromis}> · sans compromis</span> : null}
                </Registre>
                <p className={s.dense}>
                  <strong className={s.encre}>{r ? LIBELLE_ISSUE[r.issue] : "Pas lu"}</strong>
                  {r?.grain ? ` ${GRAIN_LIBELLE[r.grain]}` : ""}{r?.constat ? ` : ${r.constat}` : r && r.issue !== "non_examine" ? " : établi sans constat détaillé." : a.perimetre === "commune" ? " : lu à la commune seulement." : "."}
                </p>
                {!critereAJour(a, c.cle, projet) ? <p className={v.horsCadre}>Établi sous « {libelleCritere(a.projet.criteres.find((x) => x.cle === c.cle) ?? c).toLowerCase()} » : votre Projet a changé depuis pour cette condition.</p> : null}
                {lieu.observations.filter((o) => o.cle === c.cle).map((o) => (
                  <p key={o.id} className={v.observationLiee}><span className={v.obsNature}>{LIBELLE_OBS[o.nature]} · {dateCourte(o.date)}</span> {o.texte}</p>
                ))}
              </Ligne>
            ))}
          </div>
        );
      }) : null}
    </Mouvement>
  );
}

function Verifications({ api, lieu }: { api: Api; lieu: Lieu }) {
  const ouvertes = lieu.verifications.filter((x) => !x.reponse).length;
  return (
    <Mouvement numero="03" titre="À vérifier avant de décider" id="verifier">
      <p className={s.nuance}>{ouvertes ? `${ouvertes} question${ouvertes > 1 ? "s" : ""} ouverte${ouvertes > 1 ? "s" : ""}. Chacune vise une inconnue de votre Projet ; votre réponse change la lecture du logement ; la donnée publique reste celle de sa source.` : "Toutes les questions ont une réponse."}</p>
      {MOMENTS.map((m) => {
        const vs = lieu.verifications.filter((x) => x.moment === m.cle);
        if (!vs.length) return null;
        return (
          <div key={m.cle} className={v.moment}>
            <p className={v.groupeTitre}>{m.titre}</p>
            <ol className={v.verifs}>
              {vs.map((x) => <UneVerification key={x.id} api={api} lieu={lieu} verif={x} />)}
            </ol>
          </div>
        );
      })}
    </Mouvement>
  );
}

function UneVerification({ api, lieu, verif }: { api: Api; lieu: Lieu; verif: Verification }) {
  const id = useId();
  const rep = verif.reponse ? verif.reponses.find((r) => r.valeur === verif.reponse!.valeur) : undefined;
  const r = analyseServie(lieu)?.registre.find((x) => x.cle === verif.cle);
  return (
    <li className={v.verif} data-repondue={!!rep || undefined}>
      <Registre teinte="var(--reg-controle)" as="h4">{lier(verif.question)}</Registre>
      <p className={s.nuance}>{NOM_CRITERE[verif.cle]} · {lier(verif.pourquoi)}</p>
      <Selecteur id={`${id}-r`} question="Votre réponse" valeur={verif.reponse?.valeur}
        options={verif.reponses.map((x) => ({ valeur: x.valeur, libelle: x.libelle }))}
        onChoisir={(val) => api.envoyer({ type: "repondre", lieu: lieu.id, verification: verif.id, valeur: val === verif.reponse?.valeur ? null : val })} />
      {rep ? (
        <div className={v.reevaluation} aria-live="polite">
          <div className={v.reevalColonnes}>
            <div>
              <p className={v.reevalCle}>Avant votre réponse</p>
              <p className={s.dense}>{r ? `${LIBELLE_ISSUE[r.issue]}${r.grain ? ` ${GRAIN_LIBELLE[r.grain]}` : ""}${r.constat ? ` : ${r.constat}` : ""}` : "Non lu."}</p>
            </div>
            <div>
              <p className={v.reevalCle}>Ce que votre réponse change</p>
              <p className={s.dense}>{lier(rep.effet)}</p>
            </div>
            <div>
              <p className={v.reevalCle}>Ce qui reste inconnu</p>
              <p className={s.dense}>{lier(rep.reste)}</p>
            </div>
          </div>
          <p className={v.reevalPied}>{verif.reponse!.nature === "declaration" ? "Déclaration" : "Votre observation"} du {dateCourte(verif.reponse!.date)} · la preuve publique ({r?.preuve?.source ?? "aucune"}) ne change pas · recliquer la réponse la retire</p>
        </div>
      ) : null}
    </li>
  );
}

function AnnonceDeclaree({ lieu, projet }: { lieu: Lieu; projet: Projet }) {
  const an = lieu.annonce;
  if (!an) return <p className={s.corps}>Aucune annonce n&apos;est liée à ce logement.</p>;
  const contraire = an.nature && an.nature !== (projet.intention === "location" ? "location" : "vente");
  const rangs: [string, string | null][] = [
    ["Nature", LIBELLE_NATURE[an.nature ?? "non_precise"]],
    [an.nature === "vente" ? "Prix" : "Loyer", montantAnnonce(an)],
    ["Surface", an.surface != null ? `${an.surface} m²` : null],
    ["Pièces", an.pieces != null ? String(an.pieces) : null],
  ];
  return (
    <div className={s.pile}>
      <p className={s.nuance}><Declare>déclaré par l&apos;annonce, non vérifié par futur•e</Declare></p>
      <dl className={v.dl}>
        {rangs.map(([k, val]) => (
          <div key={k}><dt>{k}</dt><dd>{val ?? <span className={v.pasLu}>non précisé</span>}</dd></div>
        ))}
      </dl>
      {contraire ? <p className={v.horsCadre}>Votre Projet est {projet.intention === "location" ? "une location" : "un achat"} ; cette annonce est {LIBELLE_NATURE[an.nature!]}. futur•e n&apos;en tire aucune conclusion : à vous de dire si elle reste en course.</p> : null}
      {an.url ? (
        <p className={s.dense}>
          <a className={s.lien} href={an.url} target="_blank" rel="noopener noreferrer nofollow">Voir l&apos;annonce sur {an.site ?? "le site d'origine"}</a>
          <span className={s.nuance}> · lien gardé pour vous ; futur•e n&apos;en a rien lu, et l&apos;annonce peut disparaître.</span>
        </p>
      ) : null}
    </div>
  );
}

function Observations({ api, lieu }: { api: Api; lieu: Lieu }) {
  const id = useId();
  const [texte, setTexte] = useState("");
  const [nature, setNature] = useState<NatureObservation>("observation");
  const [cle, setCle] = useState<CleCritere | "aucune">("aucune");
  return (
    <Mouvement numero="05" titre="Vos notes et observations" id="notes">
      {lieu.observations.length ? (
        <ul className={v.listeSimple}>
          {lieu.observations.map((o) => (
            <li key={o.id} className={v.obs}>
              <span className={v.obsNature}>{LIBELLE_OBS[o.nature]} · {dateCourte(o.date)}{o.cle ? ` · ${NOM_CRITERE[o.cle].toLowerCase()}` : ""}</span>
              <span className={s.dense}>{o.texte}</span>
            </li>
          ))}
        </ul>
      ) : <p className={s.nuance}>Aucune note pour l&apos;instant.</p>}
      <form className={v.obsForm} onSubmit={(e) => { e.preventDefault(); if (texte.trim()) { api.envoyer({ type: "observer", lieu: lieu.id, texte: texte.trim(), nature, cle: cle === "aucune" ? null : cle }); setTexte(""); } }}>
        <label className={v.champ}>
          <span className={s.etiquette}>Ajouter une note</span>
          <textarea rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={1000} placeholder="Ce que vous avez vu, entendu, ou ce qu'on vous a dit" />
        </label>
        <Selecteur id={`${id}-n`} question="C'est" valeur={nature} onChoisir={setNature}
          options={[{ valeur: "observation", libelle: "ce que j'ai observé" }, { valeur: "declaration", libelle: "ce qu'on m'a dit" }, { valeur: "document", libelle: "un document" }]} />
        <label className={v.champ}>
          <span className={s.etiquette}>À propos de (facultatif)</span>
          <select value={cle} onChange={(e) => setCle(e.target.value as CleCritere | "aucune")}>
            <option value="aucune">Rien en particulier</option>
            {api.etat.projet.criteres.map((c) => <option key={c.cle} value={c.cle}>{NOM_CRITERE[c.cle]}</option>)}
          </select>
        </label>
        <div className={v.gestes}><button type="submit" className={s.bouton} disabled={!texte.trim()}>Enregistrer la note</button></div>
      </form>
    </Mouvement>
  );
}

function Historique({ lieu, projet }: { lieu: Lieu; projet: Projet }) {
  return (
    <ol className={v.journal}>
      {[...lieu.journal].reverse().map((e, i) => {
        const c = e.contexte?.cle ? projet.criteres.find((x) => x.cle === e.contexte!.cle) : undefined;
        const change = e.type === "ecarte" && c && e.contexte?.valeur != null && c.valeur !== e.contexte.valeur;
        return (
          <li key={i} className={v.journalLigne}>
            <span className={v.journalDate}>{dateCourte(e.date)}</span>
            <span className={s.dense}>
              {e.type === "ecarte" ? <>Écarté : « {e.raison} ».{e.contexte ? ` Votre Projet d'alors (révision ${e.contexte.revision})${e.contexte.condition ? ` : ${e.contexte.condition}` : ""}.` : ""}</> : e.type === "reactive" ? "Remis en course." : e.texte}
              {change ? <span className={v.horsCadre}> Votre Projet a changé depuis : {libelleCritere(c!).toLowerCase()}.</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
