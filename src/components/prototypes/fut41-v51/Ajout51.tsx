"use client";
// AJOUTER UNE ANNONCE, V5.1 · l'entrée principale est le lien. Quatre situations, toutes prototypées avec
// des données fictives (aucune page n'est ouverte, aucune image n'est récupérée) :
//   1. lien reconnu, informations et miniature disponibles ;
//   2. lien reconnu, informations disponibles, pas de miniature ;
//   3. lien gardé mais illisible : la personne indique ce qu'elle sait, ou colle le texte ;
//   4. pas de lien : saisie directe.
// Toute valeur venue d'une annonce reste « déclarée » et se confirme ; la miniature n'est montrée que si le
// site l'autorise, et jamais remplacée par une image générique. Une commune s'ajoute comme en V5.
import { useId, useState } from "react";
import { releve as s } from "@/components/releve/primitives";
import { extraireAnnonce, siteDe, type Logement, type NatureAnnonce } from "../fut41-v5/modele5";
import { AUJOURDHUI, COMMUNES } from "../fut41-v5/scenarios5";
import type { Api5 } from "../fut41-v5/CentreDecision5";
import { lireAnnonce51, type LectureAnnonce } from "./lecture51";
import v from "../fut41-v5/v5.module.css";
import w from "./v51.module.css";

const communeDansAdresse = (a: string) => COMMUNES.find((c) => new RegExp(`\\b${c.nom}\\b`, "i").test(a));
const EXEMPLES = [
  { libelle: "annonce lisible", url: "https://annonces-exemple.fr/t3-balcon-nantes" },
  { libelle: "sans miniature", url: "https://annonces-exemple.fr/maison-sans-photo-rennes" },
  { libelle: "lien illisible", url: "https://www.un-site-d-annonces.fr/annonce/48213" },
];

export function Ajout51({ api, depart, fermer }: { api: Api5; depart: "commune" | "logement"; fermer: () => void }) {
  const id = useId();
  const absentes = COMMUNES.filter((c) => !api.etat.communes.some((x) => x.insee === c.insee && x.statut !== "ecartee"));
  const [commune, setCommune] = useState(absentes[0]?.insee ?? COMMUNES[0]!.insee);
  const [url, setUrl] = useState("");
  const [lu, setLu] = useState<LectureAnnonce | null>(null);
  const [sansLien, setSansLien] = useState(false);
  const [f, setF] = useState({ titre: "", prix: "", surface: "", pieces: "", commune: "", adresse: "", nature: "" as "" | "vente" | "location" });
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const maj = (k: keyof typeof f, x: string) => setF((o) => ({ ...o, [k]: x }));
  const reconnue = f.adresse ? communeDansAdresse(f.adresse) : undefined;

  if (depart === "commune") {
    return (
      <form className={w.ajout} onSubmit={(e) => { e.preventDefault(); api.envoyer({ type: "ajouter_commune", insee: commune }); fermer(); }} aria-labelledby={`${id}-t`}>
        <p className={w.ajoutTitre} id={`${id}-t`}>Ajouter une commune</p>
        {absentes.length ? (
          <label className={v.champ}><span className={s.etiquette} id={`${id}-cc`}>Commune (trois dans le prototype)</span>
            <select aria-labelledby={`${id}-cc`} value={absentes.some((c) => c.insee === commune) ? commune : absentes[0]!.insee} onChange={(e) => setCommune(e.target.value)}>{absentes.map((c) => <option key={c.insee} value={c.insee}>{c.nom}</option>)}</select>
            <span className={s.nuance}>Elle arrive avec ses repères gratuits. Rien n&apos;est conclu pour votre Projet tant qu&apos;elle n&apos;est pas étudiée.</span>
          </label>
        ) : <p className={s.nuance}>Les trois communes du prototype sont déjà gardées.</p>}
        <div className={v.ligneGestes}>
          <button type="submit" className={`${s.bouton} ${s.boutonMarque}`} disabled={!absentes.length}>Garder cette commune</button>
          <button type="button" className={`${s.action} ${v.cible}`} onClick={fermer}>Annuler</button>
        </div>
      </form>
    );
  }

  const lire = (u = url) => {
    setErreur(null);
    const r = lireAnnonce51(u);
    setLu(r);
    if (r.etat === "invalide") { setErreur("Ce lien ne ressemble pas à une adresse web : il doit commencer par https://"); return; }
    if (r.etat === "reconnue") setF({ titre: r.valeurs.titre, prix: String(r.valeurs.montant), surface: String(r.valeurs.surface), pieces: String(r.valeurs.pieces), commune: r.valeurs.commune, adresse: "", nature: r.valeurs.nature });
  };
  const formulaire = sansLien || lu?.etat === "reconnue" || lu?.etat === "illisible";

  const garder = () => {
    const insee = reconnue?.insee ?? f.commune;
    if (!insee) { setErreur("Dans quelle commune se trouve ce logement ? (Nantes, Rennes ou Angers dans le prototype)"); return; }
    const c = COMMUNES.find((x) => x.insee === insee)!;
    const n = (x: string) => (x.trim() && Number.isFinite(Number(x)) && Number(x) > 0 ? Number(x) : null);
    const lien = lu && lu.etat !== "invalide" ? url.trim() : null;
    const l: Logement = {
      id: `ajout-${api.etat.logements.length + 1}`,
      libelle: f.titre.trim() || (f.adresse.trim() ? f.adresse.trim().replace(/,.*$/, "") : `Logement à ${c.nom}`),
      commune: { insee: c.insee, nom: c.nom },
      adresse: f.adresse.trim() ? (reconnue ? f.adresse.trim() : `${f.adresse.trim()}, ${c.nom}`) : null,
      annonce: { url: lien, site: lien ? siteDe(lien) : null, nature: (f.nature || null) as NatureAnnonce, montant: n(f.prix), surface: n(f.surface), pieces: n(f.pieces) },
      statut: "a_etudier", ajouteLe: AUJOURDHUI, visiteLe: null, droit: "aucun", position: null, photo: null, analyses: [],
      journal: [{ date: AUJOURDHUI, type: "ajoute", texte: `Ajouté${lu?.etat === "reconnue" ? ", depuis une annonce (valeurs confirmées par vous)" : ""}${f.adresse ? "" : ", sans adresse exacte"}.` }], observations: [], verifications: [],
    };
    api.envoyer({ type: "ajouter_logement", logement: l });
  };

  return (
    <form className={w.ajout} onSubmit={(e) => { e.preventDefault(); if (formulaire) garder(); else lire(); }} aria-labelledby={`${id}-t`}>
      <p className={w.ajoutTitre} id={`${id}-t`}>Ajouter une annonce</p>

      {!sansLien ? (
        <div className={w.etape}>
          <label className={v.champ}><span className={s.etiquette}>Le lien de l&apos;annonce</span>
            <span className={w.lienLigne}>
              <input type="url" inputMode="url" value={url} onChange={(e) => { setUrl(e.target.value); setLu(null); }} maxLength={500} placeholder="https://…" aria-describedby={`${id}-n`} />
              <button type="button" className={s.bouton} disabled={!url.trim()} onClick={() => lire()}>Lire le lien</button>
            </span>
            <span className={s.nuance} id={`${id}-n`}>Collez-le depuis votre navigateur. Le lien est gardé pour vous.</span>
          </label>
          <p className={w.exemples}><span className={s.nuance}>Pour essayer :</span> {EXEMPLES.map((x) => <button key={x.url} type="button" className={`${s.action} ${v.cible}`} onClick={() => { setUrl(x.url); lire(x.url); }}>{x.libelle}</button>)}</p>
          {!lu ? <button type="button" className={`${s.action} ${v.cible}`} onClick={() => setSansLien(true)}>Pas de lien ? Décrire le logement</button> : null}
        </div>
      ) : null}

      {lu?.etat === "reconnue" ? (
        <div className={w.reconnue} aria-live="polite">
          {lu.miniature ? (
            <figure className={w.miniature}>
              <span className={w.miniatureCadre} aria-hidden><span>Miniature de l&apos;annonce</span></span>
              <figcaption className={s.nuance}>Montrée seulement si le site d&apos;annonces l&apos;autorise. Dans ce prototype, aucune image n&apos;est récupérée.</figcaption>
            </figure>
          ) : (
            <p className={w.sansMiniature}><span className={w.miniaturePetite} aria-hidden>{(f.pieces || "?") + "p"}</span><span className={s.nuance}>Pas de miniature pour cette annonce. Le logement sera repéré par son nom ; vous pourrez ajouter votre propre photo.</span></p>
          )}
          <p className={s.dense}><strong className={s.encre}>Annonce reconnue sur {lu.site}</strong> (simulé). Vérifiez ces informations : elles restent celles de l&apos;annonce, futur•e ne les vérifie pas.</p>
        </div>
      ) : null}
      {lu?.etat === "illisible" ? (
        <p className={w.illisible} aria-live="polite"><strong className={s.encre}>Lien gardé.</strong> Ce site ne permet pas à futur•e d&apos;en lire les informations. Indiquez ce que vous savez, ou collez le texte de l&apos;annonce : rien n&apos;est deviné.</p>
      ) : null}

      {formulaire ? (
        <div className={w.champs}>
          <label className={`${v.champ} ${w.large}`}><span className={s.etiquette}>Un nom pour le retrouver</span><input value={f.titre} onChange={(e) => maj("titre", e.target.value)} maxLength={80} placeholder="T3 avec balcon" /></label>
          <label className={v.champ}><span className={s.etiquette}>Prix ou loyer (€){lu?.etat === "reconnue" ? <span className={w.aConfirmer}> · lu dans l&apos;annonce</span> : null}</span><input inputMode="numeric" value={f.prix} onChange={(e) => maj("prix", e.target.value)} maxLength={9} /></label>
          <label className={v.champ}><span className={s.etiquette}>Surface (m²){lu?.etat === "reconnue" ? <span className={w.aConfirmer}> · lu dans l&apos;annonce</span> : null}</span><input inputMode="numeric" value={f.surface} onChange={(e) => maj("surface", e.target.value)} maxLength={5} /></label>
          <label className={v.champ}><span className={s.etiquette}>Pièces{lu?.etat === "reconnue" ? <span className={w.aConfirmer}> · lu dans l&apos;annonce</span> : null}</span><input inputMode="numeric" value={f.pieces} onChange={(e) => maj("pieces", e.target.value)} maxLength={2} /></label>
          <label className={v.champ}><span className={s.etiquette} id={`${id}-cl`}>Commune</span>
            <select aria-labelledby={`${id}-cl`} value={reconnue?.insee ?? f.commune} onChange={(e) => maj("commune", e.target.value)} disabled={!!reconnue}><option value="">Choisir</option>{COMMUNES.map((c) => <option key={c.insee} value={c.insee}>{c.nom}</option>)}</select>
          </label>
          <label className={`${v.champ} ${w.large}`}><span className={s.etiquette}>Adresse exacte, si vous la connaissez</span><input value={f.adresse} onChange={(e) => maj("adresse", e.target.value)} maxLength={160} placeholder="Souvent absente de l'annonce : demandez-la à l'agence" />
            {reconnue ? <span className={s.nuance}>Commune reconnue : {reconnue.nom}.</span> : <span className={s.nuance}>Sans elle, futur•e ne peut étudier que la commune.</span>}
          </label>
          {lu?.etat === "illisible" ? (
            <div className={`${v.champ} ${w.large}`}>
              <label className={s.etiquette} htmlFor={`${id}-txt`}>Ou collez le texte de l&apos;annonce</label>
              <textarea id={`${id}-txt`} rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={4000} placeholder="La description : futur•e propose des valeurs, vous les confirmez." />
              <div className={v.ligneGestes}>
                <button type="button" className={`${s.action} ${v.cible}`} disabled={!texte.trim()} onClick={() => { const x = extraireAnnonce(texte); setF((o) => ({ ...o, prix: x.montant ? String(x.montant.valeur) : o.prix, surface: x.surface ? String(x.surface.valeur) : o.surface, pieces: x.pieces ? String(x.pieces.valeur) : o.pieces, nature: x.nature?.valeur ?? o.nature })); }}>Remplir depuis ce texte</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {erreur ? <p className={v.erreur} role="alert">{erreur}</p> : null}
      <div className={v.ligneGestes}>
        {formulaire ? <button type="submit" className={`${s.bouton} ${s.boutonMarque}`}>Garder ce logement</button> : <button type="submit" className={`${s.bouton} ${s.boutonMarque}`} disabled={!url.trim()}>Lire le lien</button>}
        <button type="button" className={`${s.action} ${v.cible}`} onClick={fermer}>Annuler</button>
      </div>
      <p className={s.nuance}>Garder un logement ne coûte rien et ne lance aucune analyse. Les informations de l&apos;annonce restent « déclarées ».</p>
    </form>
  );
}
