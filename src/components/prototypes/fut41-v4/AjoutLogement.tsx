"use client";
// AJOUTER UN LOGEMENT · trois façons, une seule fiche : un lien (gardé comme repère, jamais ouvert par
// futur•e), un texte collé (chaque valeur proposée montre l'extrait qui la fonde, et ne s'enregistre
// que confirmée), ou quelques mots. L'adresse est facultative. Rien n'est récupéré automatiquement :
// les conditions d'utilisation des sites d'annonces ne sont pas présumées permettre la collecte.
import { useId, useState } from "react";
import { releve as s, Selecteur } from "@/components/releve/primitives";
import { extraireAnnonce, siteDe, urlAnnonceValide, LIBELLE_NATURE, type ExtraitAnnonce, type Lieu, type NatureAnnonce } from "./modele";
import { AUJOURDHUI, COMMUNES_FICTIVES } from "./scenarios";
import type { Api } from "./CentreDecision";
import v from "./v4.module.css";

type Champ = "montant" | "nature" | "surface" | "pieces";

export function AjoutLogement({ api, fermer }: { api: Api; fermer: () => void }) {
  const id = useId();
  const [url, setUrl] = useState("");
  const [texte, setTexte] = useState("");
  const [extrait, setExtrait] = useState<ExtraitAnnonce | null>(null);
  const [retenus, setRetenus] = useState<Record<Champ, boolean>>({ montant: true, nature: true, surface: true, pieces: true });
  const [libelle, setLibelle] = useState("");
  const [commune, setCommune] = useState(COMMUNES_FICTIVES[0]!.insee);
  const [adresse, setAdresse] = useState("");
  const [nature, setNature] = useState<NatureAnnonce | "non_precise">("non_precise");
  const [montant, setMontant] = useState("");
  const [surface, setSurface] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const lire = () => {
    const x = extraireAnnonce(texte);
    setExtrait(x);
    if (x.nature) setNature(x.nature.valeur);
    if (x.montant) setMontant(String(x.montant.valeur));
    if (x.surface) setSurface(String(x.surface.valeur));
  };

  const enregistrer = () => {
    if (!libelle.trim()) { setErreur("Donnez un nom à ce logement, par exemple « T3 près du port »."); return; }
    if (url && !urlAnnonceValide(url)) { setErreur("Ce lien ne commence pas par http:// ou https://."); return; }
    const c = COMMUNES_FICTIVES.find((x) => x.insee === commune)!;
    const n = nature === "non_precise" ? null : nature;
    const garde = (ch: Champ) => !extrait?.[ch] || retenus[ch];
    const lieu: Lieu = {
      id: `ajout-${api.etat.lieux.length + 1}`,
      libelle: libelle.trim(),
      commune: c,
      adresse: adresse.trim() ? `${adresse.trim()}, ${c.nom}` : null,
      annonce: {
        url: url || null, site: url ? siteDe(url) : null,
        nature: garde("nature") ? n : null,
        montant: montant && garde("montant") ? Number(montant) : null,
        surface: surface && garde("surface") ? Number(surface) : null,
        pieces: extrait?.pieces && retenus.pieces ? extrait.pieces.valeur : null,
      },
      statut: "a_etudier", ajouteLe: AUJOURDHUI, visiteLe: null, droit: "aucun", analyses: [],
      journal: [{ date: AUJOURDHUI, type: "ajoute", texte: `Ajouté${url ? " depuis un lien" : texte ? " depuis un texte collé" : ""}${adresse ? "" : ", sans adresse"}.` }],
      observations: [], verifications: [],
    };
    api.envoyer({ type: "ajouter", lieu });
    fermer();
  };

  const champs: [Champ, string, (x: NonNullable<ExtraitAnnonce[Champ]>) => string][] = [
    ["montant", "Montant", (x) => `${x.valeur} €`],
    ["nature", "Nature", (x) => LIBELLE_NATURE[x.valeur as "location" | "vente"]],
    ["surface", "Surface", (x) => `${x.valeur} m²`],
    ["pieces", "Pièces", (x) => String(x.valeur)],
  ];

  return (
    <form className={v.ajout} onSubmit={(e) => { e.preventDefault(); enregistrer(); }} aria-labelledby={`${id}-t`}>
      <p className={s.sousTitre} id={`${id}-t`}>Ajouter un logement</p>
      <p className={s.nuance}>Un lien, le texte de l&apos;annonce ou quelques mots suffisent. L&apos;adresse peut venir plus tard.</p>

      <div className={v.ajoutGrille}>
        <label className={v.champ}>
          <span className={s.etiquette}>Lien de l&apos;annonce (facultatif)</span>
          <input type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" maxLength={500} />
          <span className={s.nuance}>Gardé comme repère pour vous. futur•e n&apos;ouvre pas la page et n&apos;en lit rien.</span>
        </label>

        <div className={v.champ}>
          <label className={s.etiquette} htmlFor={`${id}-texte`}>Texte de l&apos;annonce (facultatif)</label>
          <textarea id={`${id}-texte`} rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Collez ici la description : futur•e propose des valeurs, vous les confirmez." maxLength={4000} />
          <div>
            <button type="button" className={s.action} onClick={lire} disabled={!texte.trim()}>Lire ce texte</button>
            <button type="button" className={s.action} style={{ marginLeft: 18 }} onClick={() => setTexte("Bel appartement T3 lumineux de 64 m², à louer 1 040 € charges comprises, à 10 min de la gare. Libre en décembre.")}>Essayer avec un exemple</button>
          </div>
        </div>
      </div>

      {extrait ? (
        <div className={v.extrait} role="group" aria-label="Valeurs proposées à confirmer">
          {Object.keys(extrait).length === 0 ? (
            <p className={s.dense}>Ce texte ne dit ni montant, ni surface, ni nature que futur•e sache reconnaître. Rien n&apos;est deviné.</p>
          ) : (
            <>
              <p className={s.etiquette}>Proposé à partir de votre texte · à confirmer</p>
              <ul className={v.listeSimple}>
                {champs.filter(([ch]) => extrait[ch]).map(([ch, nom, fmt]) => (
                  <li key={ch} className={v.extraitLigne}>
                    <label>
                      <input type="checkbox" checked={retenus[ch]} onChange={(e) => setRetenus((r) => ({ ...r, [ch]: e.target.checked }))} />
                      <span>{nom} : <strong className={s.encre}>{fmt(extrait[ch]! as never)}</strong></span>
                    </label>
                    <span className={v.extraitSource}>lu dans « {extrait[ch]!.extrait} »</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}

      <div className={v.ajoutGrille}>
        <label className={v.champ}>
          <span className={s.etiquette}>Nom pour vous en souvenir</span>
          <input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="T3 près du port" maxLength={80} required aria-invalid={!!erreur && !libelle.trim()} />
        </label>
        <label className={v.champ}>
          <span className={s.etiquette}>Commune (fictive dans le prototype)</span>
          <select value={commune} onChange={(e) => setCommune(e.target.value)}>
            {COMMUNES_FICTIVES.map((c) => <option key={c.insee} value={c.insee}>{c.nom}</option>)}
          </select>
        </label>
        <label className={v.champ}>
          <span className={s.etiquette}>Adresse exacte (facultatif)</span>
          <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Si l'annonce la donne" maxLength={160} />
        </label>
        <label className={v.champ}>
          <span className={s.etiquette}>Loyer mensuel ou prix déclaré (€)</span>
          <input inputMode="numeric" value={montant} onChange={(e) => setMontant(e.target.value.replace(/[^\d]/g, ""))} maxLength={9} />
        </label>
        <label className={v.champ}>
          <span className={s.etiquette}>Surface déclarée (m²)</span>
          <input inputMode="decimal" value={surface} onChange={(e) => setSurface(e.target.value.replace(/[^\d.,]/g, ""))} maxLength={6} />
        </label>
      </div>

      <Selecteur id={`${id}-nature`} question="L'annonce est" options={[{ valeur: "location", libelle: "à louer" }, { valeur: "vente", libelle: "à vendre" }, { valeur: "non_precise", libelle: "non précisé" }]}
        valeur={nature ?? "non_precise"} onChoisir={(x) => setNature(x as NatureAnnonce | "non_precise")} />
      <p className={s.nuance}>Indépendant de votre Projet ({api.etat.projet.intention === "location" ? "une location" : "un achat"}) : futur•e ne déduit jamais l&apos;un de l&apos;autre.</p>

      {erreur ? <p className={v.erreur} role="alert">{erreur}</p> : null}
      <div className={v.gestes}>
        <button type="submit" className={`${s.bouton} ${s.boutonMarque}`}>Garder ce logement</button>
        <button type="button" className={s.action} onClick={fermer}>Annuler</button>
      </div>
    </form>
  );
}
