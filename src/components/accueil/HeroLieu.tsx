"use client";
// FUT-50 · VERSION C · LE HERO DE L'ACCUEIL, EN TROIS ÉTATS. Monté par `/` (lectures par `/api/accueil/*`) et par
// le prototype `/dev/fut50/c` (mêmes lectures, par les routes de développement, branchées sur le même service).
//
//   A · vierge     le titre, une promesse courte, un champ de COMMUNE, quelques communes à essayer, et une porte
//                  séparée pour une adresse précise. Aucun résultat, aucun exemple.
//   B · commune    la commune confirmée (une coche se trace), les priorités facultatives, une invitation.
//                  Toujours aucun résultat : rien d'une autre commune, aucun panneau vide.
//   C · priorité   UNE lecture de la commune choisie : le fait (source, horizon, grain), ce qu'il implique pour
//                  cette priorité, ce qu'il reste à vérifier, la suite.
//
// LE GESTE (revue du 15/10) : aux états A et B, le bloc de recherche est centré ; à l'état C, la grille du hero
// s'ouvre en deux colonnes (420 ms, CSS seul, voir `accueil.module.css`) : le MÊME bloc glisse vers la gauche, sans être
// recréé, et la lecture arrive dans la colonne qui s'ouvre. En mouvement réduit, le changement est immédiat.
//
// Décisions du 14/10/2026 (FUT-50) : le champ ne cherche que des COMMUNES, parce que l'aperçu gratuit ne lit
// que des données communales ; l'adresse a sa propre porte vers `/dossier`, où le périmètre et le prix de
// l'analyse d'adresse sont expliqués. L'autocomplétion reprend celle de l'accueil actuel (géocodeur officiel,
// `urlRechercheCommunes`, 250 ms, annulation, aide Paris / Lyon / Marseille). Aucune génération IA, aucun
// Projet enregistré.
import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { urlRechercheCommunes } from "@/lib/geocodeur-ban";
import { estCodeOutremer } from "@/lib/outremer/code-outremer";
import { GlypheGrain, TEINTE_REGISTRE } from "@/components/releve/primitives";
import { fr } from "@/lib/accueil/fr";
import { pastillesDe, libelleDe, MOT_DU_SIGNAL, type CleePastille, type Composition, type Lieu, type LecturePastille, type MesureChaleur, type Signal } from "@/lib/accueil/pastilles";
import c from "./accueil.module.css";

type Suggestion = Lieu & { id: string; contexte: string };
type FeatureBan = { properties: Record<string, string | undefined> };

const PLM: Record<string, { ville: string; exemple: string }> = {
  "75056": { ville: "Paris", exemple: "Paris 15e Arrondissement" },
  "69123": { ville: "Lyon", exemple: "Lyon 6e Arrondissement" },
  "13055": { ville: "Marseille", exemple: "Marseille 7e Arrondissement" },
};

function versSuggestion(f: FeatureBan): Suggestion | null {
  const p = f.properties;
  const nom = p.city ?? p.name;
  if (!p.citycode || !nom) return null;
  return { id: p.id ?? p.citycode, type: "commune", libelle: nom, commune: nom, insee: p.citycode, contexte: [p.postcode, p.context].filter(Boolean).join(" · ") };
}

// Des communes réelles, aux lectures contrastées, pour qui ne sait pas quoi chercher.
const EXEMPLES: Lieu[] = [
  { type: "commune", libelle: "Nantes", commune: "Nantes", insee: "44109" },
  { type: "commune", libelle: "Annecy", commune: "Annecy", insee: "74010" },
  { type: "commune", libelle: "Guéret", commune: "Guéret", insee: "23096" },
];

const TEINTE: Record<Signal, string> = {
  defavorable: TEINTE_REGISTRE.mismatches!,
  favorable: TEINTE_REGISTRE.alignments!,
  neutre: TEINTE_REGISTRE.unknowns!,
  sous_seuil: TEINTE_REGISTRE.verifications!,
  information: TEINTE_REGISTRE.verifications!,
  adresse: TEINTE_REGISTRE.verifications!,
  indisponible: TEINTE_REGISTRE.unknowns!,
};

type EtatLecture = LecturePastille | "chargement" | "erreur" | "inconnue";

/**
 * `api` : la base des deux lectures (`/commune`, `/lecture`). L'accueil public lit `/api/accueil` ; le prototype, ses
 * routes de développement. Les deux appellent le même service (`@/lib/accueil/lecture-accueil`).
 */
export function HeroLieu({ composition = "recommandee", api = "/api/accueil" }: { composition?: Composition; api?: string }) {
  const pastilles = pastillesDe(composition);
  const [saisie, setSaisie] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [cherche, setCherche] = useState(false);
  const [erreurRecherche, setErreurRecherche] = useState("");
  const [aidePlm, setAidePlm] = useState("");
  const [lieu, setLieu] = useState<Lieu | null>(null);
  // L'IDENTITÉ CONFIRMÉE PAR LE SERVEUR : le nom de la recherche n'est qu'une étiquette de saisie. Dès la sélection,
  // le nom canonique (COG, index des communes) le remplace. Le jeton écarte toute réponse arrivée après qu'une autre
  // commune a été choisie, ou que la saisie a repris.
  const jetonIdentite = useRef(0);
  // L'ANNULATION : une requête devenue inutile est interrompue, pas seulement ignorée. Les lectures de la commune
  // affichée continuent (elles restent utiles d'une priorité à l'autre) ; celles d'une commune quittée s'arrêtent.
  const lecturesEnVol = useRef(new Map<string, AbortController>());
  const identiteEnVol = useRef<AbortController | null>(null);
  const abandonner = (garder: string | null) => {
    for (const [k, c] of lecturesEnVol.current) if (!garder || !k.startsWith(`${garder}|`)) { c.abort(); lecturesEnVol.current.delete(k); }
  };
  const [identite, setIdentite] = useState<"provisoire" | "canonique" | "inconnue">("provisoire");
  const [choisies, setChoisies] = useState<CleePastille[]>([]);
  const [focale, setFocale] = useState<CleePastille | null>(null);
  const [lectures, setLectures] = useState<Record<string, EtatLecture>>({});
  const champRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const lectureRef = useRef<HTMLDivElement>(null);
  const idListe = useId();
  // L'ouverture se joue une seule fois, à l'entrée dans l'état « priorité ». Pendant ce court moment, le conteneur
  // porte la classe qui orchestre le déploiement ; changer ensuite de priorité ne la rejoue pas.
  const [ouvertureFraiche, setOuvertureFraiche] = useState(false);
  const etatPrecedent = useRef<"vierge" | "commune" | "priorite">("vierge");

  useEffect(() => {
    const q = saisie.trim();
    if (lieu || q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setCherche(true);
      setErreurRecherche("");
      try {
        const res = await fetch(urlRechercheCommunes(q, 6), { signal: ctrl.signal });
        if (!res.ok) throw new Error("géocodeur");
        const json = (await res.json()) as { features?: FeatureBan[] };
        const liste = (json.features ?? []).map(versSuggestion).filter((s): s is Suggestion => s != null);
        setSuggestions(liste);
        setOuvert(true);
        setActif(liste.length > 0 ? 0 : -1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") { setErreurRecherche("La recherche ne répond pas pour le moment. Réessayez dans un instant."); setOuvert(false); }
      } finally {
        setCherche(false);
      }
    }, 250);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [saisie, lieu]);

  useEffect(() => {
    const ferme = (e: MouseEvent) => { if (!zoneRef.current?.contains(e.target as Node)) setOuvert(false); };
    window.addEventListener("click", ferme);
    return () => window.removeEventListener("click", ferme);
  }, []);

  function choisir(s: Lieu) {
    const plm = PLM[s.insee];
    if (plm) {
      setSaisie(`${plm.ville} `);
      setAidePlm(`${plm.ville} se lit par arrondissement. Précisez-le, par exemple « ${plm.exemple} ».`);
      setOuvert(false);
      champRef.current?.focus();
      return;
    }
    setAidePlm("");
    abandonner(s.insee);
    setLieu(s);
    setSaisie(s.libelle);
    confirmerIdentite(s.insee);
    setOuvert(false);
    setSuggestions([]);
    // Les priorités cochées portent sur ce qui compte, pas sur le lieu : elles restent, et leur lecture se refait
    // pour la nouvelle commune. Aucune lecture de l'ancienne commune ne reste à l'écran.
    setLectures({});
    for (const cle of choisies) charger(s, cle);
  }

  async function confirmerIdentite(insee: string) {
    const jeton = ++jetonIdentite.current;
    identiteEnVol.current?.abort();
    const controle = (identiteEnVol.current = new AbortController());
    setIdentite("provisoire");
    try {
      const res = await fetch(`${api}/commune?insee=${encodeURIComponent(insee)}`, { signal: controle.signal });
      if (jeton !== jetonIdentite.current) return;
      if (res.status === 404) { setIdentite("inconnue"); return; }
      if (!res.ok) return; // le nom de la recherche reste affiché, marqué provisoire ; les lectures portent le leur
      const canon = (await res.json()) as { insee: string; nom: string };
      if (jeton !== jetonIdentite.current) return;
      setIdentite("canonique");
      setSaisie(canon.nom);
      setLieu((l) => (l && l.insee === insee ? { ...l, libelle: canon.nom, commune: canon.nom } : l));
    } catch {
      /* réseau : idem, rien n'est inventé */
    }
  }

  function oublierIdentite() {
    jetonIdentite.current++;
    identiteEnVol.current?.abort();
    identiteEnVol.current = null;
    abandonner(null);
    setIdentite("provisoire");
  }

  function changerDeCommune() {
    oublierIdentite();
    setLieu(null);
    setSaisie("");
    setLectures({});
    setTimeout(() => champRef.current?.focus(), 0);
  }

  async function charger(l: Lieu, cle: CleePastille) {
    const k = `${l.insee}|${cle}`;
    if (lecturesEnVol.current.has(k)) return; // déjà demandée : la réponse en cours servira
    const controle = new AbortController();
    lecturesEnVol.current.set(k, controle);
    setLectures((m) => ({ ...m, [k]: "chargement" }));
    try {
      // Le code et la priorité, rien d'autre : l'identité vient du serveur, et une URL minimale est une seule entrée
      // de cache CDN par commune et par priorité.
      const q = new URLSearchParams({ insee: l.insee, cle });
      const res = await fetch(`${api}/lecture?${q}`, { signal: controle.signal });
      // Commune absente des référentiels du produit : un état à part, sans « Réessayer » qui ne changerait rien.
      if (res.status === 404) { setLectures((m) => ({ ...m, [k]: "inconnue" })); return; }
      if (!res.ok) throw new Error(String(res.status));
      const { lecture } = (await res.json()) as { lecture: LecturePastille };
      setLectures((m) => ({ ...m, [k]: lecture }));
    } catch {
      // Une requête ANNULÉE n'est pas une erreur : la commune a changé, rien ne s'affiche pour elle.
      if (!controle.signal.aborted) setLectures((m) => ({ ...m, [k]: "erreur" }));
    } finally {
      if (lecturesEnVol.current.get(k) === controle) lecturesEnVol.current.delete(k);
    }
  }

  // Au démontage, plus rien ne doit tourner pour un composant disparu.
  useEffect(() => () => { abandonner(null); identiteEnVol.current?.abort(); }, []);

  function basculer(cle: CleePastille) {
    if (choisies.includes(cle)) {
      const reste = choisies.filter((x) => x !== cle);
      setChoisies(reste);
      if (focale === cle) setFocale(reste[reste.length - 1] ?? null);
      return;
    }
    setChoisies([...choisies, cle]);
    setFocale(cle);
    if (lieu && !lectures[`${lieu.insee}|${cle}`]) charger(lieu, cle);
    // Écran étroit : la lecture s'affiche sous les priorités ; on l'amène en vue si besoin. En mouvement réduit, le
    // déplacement est INSTANTANÉ, pas supprimé : sans lui, à 390 px, la lecture naissait hors de l'écran (mesuré le
    // 16/10 : titre à 1 076 px dans une fenêtre de 844 px) et rien n'indiquait qu'elle était apparue.
    requestAnimationFrame(() => {
      const el = lectureRef.current;
      if (!el) return;
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // L'en-tête du site est fixe : on vise le haut de la lecture SOUS lui, jamais derrière.
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight - 120 || r.top < 0) {
        const entete = document.querySelector("nav")?.closest("header, nav")?.getBoundingClientRect().bottom ?? 64;
        window.scrollTo({ top: window.scrollY + r.top - entete - 16, behavior: reduit ? "auto" : "smooth" });
      }
    });
  }

  function clavier(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!ouvert || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActif((i) => (i + 1) % suggestions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActif((i) => (i - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === "Enter" && actif >= 0) { e.preventDefault(); choisir(suggestions[actif]!); }
    else if (e.key === "Escape") { setOuvert(false); }
  }

  const etat: "vierge" | "commune" | "priorite" = !lieu ? "vierge" : focale ? "priorite" : "commune";
  useEffect(() => {
    const avant = etatPrecedent.current;
    etatPrecedent.current = etat;
    if (etat !== "priorite" || avant === "priorite") return;
    setOuvertureFraiche(true);
    const t = setTimeout(() => setOuvertureFraiche(false), 1000);
    return () => clearTimeout(t);
  }, [etat]);
  const lectureFocale = lieu && focale ? lectures[`${lieu.insee}|${focale}`] : undefined;

  return (
    <section className={c.hero} data-etat={etat} aria-labelledby="hero-c">
      <div className={c.heroGauche}>
        <div className={c.heroTete}>
          <h1 id="hero-c" className={c.titre}>Choisir où vivre mérite plus qu&apos;une intuition.</h1>
          <p className={c.sous}>{fr("Climat futur, risques, services, mobilité, logement : futur•e rassemble les données publiques pour comprendre un lieu, le confronter à votre projet et savoir quoi vérifier avant de décider.")}</p>
        </div>

        <div className={c.recherche} ref={zoneRef} id="lieu">
          <label htmlFor="champ-commune" className={c.rechercheLabel}>Commencez par une commune <span className={c.rechercheGratuit}>· premier aperçu gratuit</span></label>
          <div className={c.champ}>
            <svg className={c.champIcone} width="18" height="18" viewBox="0 0 18 18" aria-hidden><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12.5 12.5 L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <input
              id="champ-commune"
              ref={champRef}
              role="combobox"
              aria-expanded={ouvert}
              aria-controls={idListe}
              aria-autocomplete="list"
              aria-activedescendant={ouvert && actif >= 0 ? `${idListe}-${actif}` : undefined}
              autoComplete="off"
              placeholder="Nom de la commune"
              value={saisie}
              onChange={(e) => { setSaisie(e.target.value); if (lieu) { oublierIdentite(); setLieu(null); setLectures({}); } if (e.target.value.trim().length < 2) { setSuggestions([]); setOuvert(false); } }}
              onKeyDown={clavier}
              onFocus={() => { if (suggestions.length > 0 && !lieu) setOuvert(true); }}
            />
            {cherche ? <span className={c.chargement} aria-label="Recherche en cours" role="status" /> : null}
          </div>
          {ouvert && suggestions.length > 0 ? (
            <ul id={idListe} role="listbox" className={c.suggestions} aria-label="Communes trouvées">
              {suggestions.map((s, i) => (
                <li
                  key={s.id}
                  id={`${idListe}-${i}`}
                  role="option"
                  aria-selected={i === actif}
                  className={c.suggestion}
                  onMouseEnter={() => setActif(i)}
                  onMouseDown={(e) => { e.preventDefault(); choisir(s); }}
                >
                  <span aria-hidden style={{ color: "var(--r-discret)" }}><GlypheGrain grain="commune" taille={13} /></span>
                  <span>{s.libelle}<span className={c.suggestionContexte}>{s.contexte}</span></span>
                </li>
              ))}
            </ul>
          ) : null}
          {ouvert && !cherche && suggestions.length === 0 && saisie.trim().length >= 2 ? (
            <p className={c.aide} role="status">Aucune commune trouvée. Vérifiez l&apos;orthographe.</p>
          ) : null}
          {erreurRecherche ? <p className={c.aide} role="alert">{erreurRecherche}</p> : null}
          {aidePlm ? <p className={c.aide} role="status">{aidePlm}</p> : null}
          {etat === "vierge" ? (
            <p className={c.exemples}>
              Par exemple{" "}
              {EXEMPLES.map((e, i) => (
                <span key={e.insee}>
                  <button type="button" className={c.lienTexte} onClick={() => choisir(e)}>{e.commune}</button>
                  {i < EXEMPLES.length - 1 ? <span aria-hidden> · </span> : null}
                </span>
              ))}
            </p>
          ) : null}
        </div>

        {lieu ? (
          <div className={c.lieu} key={lieu.insee}>
            <svg className={c.coche} width="20" height="20" viewBox="0 0 20 20" aria-hidden><path d="M4 10.5 L8.2 14.5 L16 6" fill="none" stroke="var(--reg-alignement)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className={c.lieuNom} data-identite={identite}>{lieu.libelle}</span>
            <button type="button" className={c.lienTexte} onClick={changerDeCommune} style={{ fontSize: 15 }}>Changer de commune</button>
          </div>
        ) : null}

        {lieu ? (
          <div className={c.priorites} key={`priorites-${lieu.insee}`}>
            <p className={c.question} id="question-priorites">Qu&apos;est-ce qui compte pour vous ?</p>
            <ul className={c.pastilles} aria-labelledby="question-priorites">
              {pastilles.map((p, i) => (
                <li key={p.cle} className={c.pastilleEntree} style={{ animationDelay: `${i * 40}ms` } as CSSProperties}>
                  <button type="button" className={c.pastille} aria-pressed={choisies.includes(p.cle)} onClick={() => basculer(p.cle)}>
                    <span className={c.pastilleMarque} aria-hidden />
                    {p.libelle}
                  </button>
                </li>
              ))}
            </ul>
            {/* L'invitation ne sert qu'avant le premier choix ; ensuite, la lecture parle d'elle-même. */}
            {etat === "commune" ? <p className={c.aide}>Choisissez-en une : la lecture s&apos;affiche aussitôt. Rien n&apos;est enregistré.</p> : null}
          </div>
        ) : null}

        {/* LA PORTE DE L'ADRESSE : séparée, discrète, là tant qu'elle mène quelque part. Une adresse précise relève du
            dossier payant ; son parcours explique le périmètre et le prix. Pour une commune d'outre-mer, aucun dossier
            n'est encore proposé (V1 : Hexagone et Corse) : la porte se retire plutôt que d'y inviter. */}
        {lieu && estCodeOutremer(lieu.insee) ? null : (
          <p className={c.porteAdresse}>
            Vous avez déjà une adresse précise ? <Link href="/dossier" className={c.lienFleche}>Examiner cette adresse</Link>
          </p>
        )}
      </div>

      <div className={c.heroDroite} aria-live="polite" ref={lectureRef}>
        {etat !== "priorite" || !lieu || !focale ? null : (
          // L'OUVERTURE : ce conteneur naît à l'entrée dans l'état 3 et y reste ; il porte l'arrivée de la colonne.
          // Changer de priorité ne remplace que son contenu.
          <div className={`${c.ouverture} ${ouvertureFraiche ? c.ouvertureFraiche : ""}`}>
            {lectureFocale === "chargement" || lectureFocale === undefined ? <Attente titre={`${libelleDe(focale)} · ${lieu.commune}`} />
              : lectureFocale === "inconnue" ? (
                <div className={c.lecture} role="alert">
                  <p className={c.tempsTexte}>Cette commune n&apos;est pas encore couverte par l&apos;aperçu.</p>
                </div>
              )
              : lectureFocale === "erreur" ? (
                <div className={c.lecture} role="alert">
                  <p className={c.tempsTexte}>La lecture n&apos;a pas pu être chargée.</p>
                  <button type="button" className={c.bouton} onClick={() => charger(lieu, focale)}>Réessayer</button>
                </div>
              )
                : <Lecture lecture={lectureFocale} onglets={choisies.length > 1 ? { choisies, focale, choisir: setFocale } : undefined} />}
          </div>
        )}
      </div>
    </section>
  );
}

function Attente({ titre }: { titre: string }) {
  return (
    <div className={c.lecture} aria-busy="true">
      <p className={c.lectureTitre}>{titre}</p>
      <p className={c.etatLecture} role="status">Lecture des données publiques de la commune.</p>
      <div className={c.squelette} aria-hidden>
        {["92%", "78%", "60%"].map((w, i) => <div key={i} className={c.squeletteLigne} style={{ width: w }} />)}
      </div>
    </div>
  );
}

function Lecture({ lecture, onglets }: {
  lecture: LecturePastille;
  onglets?: { choisies: CleePastille[]; focale: CleePastille; choisir: (c: CleePastille) => void };
}) {
  return (
    <article className={c.lecture} aria-label={`Lecture de ${lecture.commune}`}>
      <div className={c.lectureEntete}>
        <h2 className={c.lectureTitre}>{libelleDe(lecture.cle)} · {lecture.commune}</h2>
      </div>
      {onglets ? (
        <div className={c.onglets} role="tablist" aria-label="Vos priorités choisies"
          onKeyDown={(e) => {
            // Le motif des onglets : flèches gauche/droite, Début, Fin ; le focus suit l'onglet choisi.
            const i = onglets.choisies.indexOf(onglets.focale);
            const n = onglets.choisies.length;
            const cible = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
            if (cible < 0) return;
            e.preventDefault();
            // L'élément est capturé MAINTENANT : après l'événement, `currentTarget` ne vaut plus rien.
            const liste = e.currentTarget;
            onglets.choisir(onglets.choisies[cible]!);
            requestAnimationFrame(() => liste.querySelectorAll<HTMLButtonElement>('[role="tab"]')[cible]?.focus());
          }}>
          {onglets.choisies.map((k) => (
            <button key={k} id={`onglet-${k}`} type="button" role="tab" aria-selected={k === onglets.focale} aria-controls="lecture-panneau"
              tabIndex={k === onglets.focale ? 0 : -1} className={c.onglet} onClick={() => onglets.choisir(k)}>{libelleDe(k)}</button>
          ))}
        </div>
      ) : null}
      <div className={c.lectureContenu} key={`${lecture.commune}-${lecture.cle}`} id="lecture-panneau"
        {...(onglets ? { role: "tabpanel", "aria-labelledby": `onglet-${onglets.focale}` } : {})}>
        {lecture.fait ? (
          <div className={c.temps}>
            {/* Pas d'intertitre « À {commune} » : il doublait le titre de la lecture. L'échelle (commune ou
                agglomération) reste dite par la ligne de source, sous les chiffres. */}
            {lecture.fait.mesures ? (
              <div className={c.mesures}>
                {lecture.fait.mesures.map((m) => <Mesure key={m.unite} m={m} />)}
              </div>
            ) : lecture.fait.mesure ? (
              // La valeur en grand, jamais seule : son unité et sa légende la suivent ; le fait complet reste lu
              // par les lecteurs d'écran.
              <div className={c.mesure}>
                <p className={c.mesureValeur} aria-hidden>{lecture.fait.mesure.valeur}<span className={c.mesureUnite}>{lecture.fait.mesure.unite}</span></p>
                <p className={c.mesureLegende} aria-hidden>{fr(lecture.fait.mesure.legende)}</p>
                <p className={c.lectureSeule}>{lecture.fait.texte}</p>
              </div>
            ) : (
              <p className={c.tempsTexte}>{fr(lecture.fait.texte)}</p>
            )}
            {lecture.fait.detail ? (
              // Le détail, replié : visible au besoin, jamais imposé. Natif, donc clavier et lecteurs d'écran.
              <details className={c.methode}>
                <summary>{lecture.fait.detail.resume}</summary>
                {lecture.fait.detail.groupes.map((g) => (
                  <div key={g.nature} className={c.detailGroupe}>
                    <h4 className={c.detailTitre}>{g.titre}</h4>
                    {g.note ? <p>{fr(g.note)}</p> : null}
                    <ul className={c.detailListe}>
                      {g.familles.map((f) => (
                        <li key={f.code}>
                          <span className={c.detailFamille}>{f.nom.charAt(0).toUpperCase() + f.nom.slice(1)}</span>
                          {f.declinaisons.length ? fr(` : ${f.declinaisons.join(" ; ")}`) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {lecture.fait.detail.notes?.map((n) => <p key={n} className={c.detailNote}>{fr(n)}</p>)}
              </details>
            ) : null}
            <span className={c.source}>
              <GlypheGrain grain={lecture.fait.grain} taille={11} />{" "}
              {lecture.fait.grain === "unite_urbaine" ? "à l'échelle de l'agglomération" : lecture.fait.grain === "secteur" ? "au point de grille le plus proche de la mairie" : "à l'échelle de la commune"} · {fr(lecture.fait.source)}
            </span>
          </div>
        ) : null}
        <div className={c.temps}>
          <h3 className={c.tempsTitre}>Pour votre priorité</h3>
          {/* La pastille répond à la priorité ; la couleur accompagne toujours un libellé, jamais seule. */}
          <span className={c.signal} data-classement={lecture.pourVous.signal} style={{ "--r-teinte": TEINTE[lecture.pourVous.signal] } as CSSProperties}>{MOT_DU_SIGNAL[lecture.pourVous.signal]}</span>
          <p className={c.tempsTexte}>{fr(lecture.pourVous.texte)}</p>
          {lecture.methode?.length ? (
            // Natif : ouvert et fermé au clavier (Entrée, Espace), annoncé « réduit / développé » par les lecteurs d'écran.
            <details className={c.methode}>
              <summary>Comment lire ce résultat ?</summary>
              {lecture.methode.map((m) => <p key={m}>{fr(m)}</p>)}
            </details>
          ) : null}
        </div>
        <div className={c.temps}>
          <h3 className={c.tempsTitre}>À vérifier</h3>
          <p className={c.tempsTexteDoux}>{fr(lecture.aVerifier)}</p>
        </div>
        <div className={c.suites}>
          {"horsOffre" in lecture.suite
            // Aucun parcours payant pour ce lieu : le constat, sans bouton (V1, outre-mer).
            ? <p className={c.tempsTexteDoux}>{fr(lecture.suite.horsOffre)}</p>
            : <Link href={lecture.suite.href} className={c.boutonMarque}>{lecture.suite.libelle} <span aria-hidden>→</span></Link>}
          {/* La destination fait ce que le libellé annonce : `/ou-vivre` cherche des COMMUNES à partir d'un projet
              écrit ; il ne poursuit pas la lecture de celle-ci (revue du 15/10). */}
          <Link href="/ou-vivre" className={c.lienFleche}>Chercher des communes selon mon projet</Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Un grand chiffre, et sa lecture alternative quand elle existe (les journées au-dessus de 30 °C).
 *
 * Les deux vues occupent la MÊME cellule de grille : le bloc prend la hauteur de la plus grande, rien ne bouge
 * autour au basculement. Fondu seul (`--m-bascule`, 180 ms, nul en mouvement réduit) : le repère change, la
 * donnée ne défile pas. L'état est local : le contenu de la lecture est remonté à chaque changement de commune
 * ou de priorité (prop `key`), la vue revient donc toujours à 35 °C. Aucune requête : la valeur à 30 °C est
 * arrivée avec la lecture.
 */
function Mesure({ m }: { m: MesureChaleur }) {
  const [alt, setAlt] = useState(false);
  const b = m.bascule;
  const vues = b ? [{ id: "principale", v: m }, { id: "alternative", v: b }] : [{ id: "principale", v: m }];
  return (
    <div className={c.mesure}>
      <div className={c.mesureVues}>
        {vues.map(({ id, v }) => (
          <div key={id} className={c.mesureVue} data-visible={(id === "alternative") === alt} aria-hidden>
            <p className={c.mesureValeur}>{v.valeur}<span className={c.mesureUnite}>{v.unite}</span></p>
            <p className={c.mesureLegende}>{fr(v.legende)}</p>
          </div>
        ))}
      </div>
      {/* Ce qui est lu : la vue affichée, et elle seule. Annoncé au basculement par la zone vivante du panneau. */}
      {m.texte ? <p className={c.lectureSeule}>{alt && b ? b.texte : m.texte}</p> : null}
      {b ? (
        <button type="button" className={c.mesureBascule} onClick={() => setAlt((x) => !x)}>
          {alt ? b.revenir : b.ouvrir}
        </button>
      ) : null}
    </div>
  );
}
