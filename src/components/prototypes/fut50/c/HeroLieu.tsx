"use client";
// FUT-50 · VERSION C AFFINÉE · LE HERO EN TROIS ÉTATS. DEV UNIQUEMENT.
//
//   A · vierge     le titre, une promesse courte, un champ de COMMUNE, quelques communes à essayer, et une porte
//                  séparée pour une adresse précise. Aucun résultat, aucun exemple.
//   B · commune    la commune confirmée (une coche se trace), les priorités facultatives, une invitation.
//                  Toujours aucun résultat : rien d'une autre commune, aucun panneau vide.
//   C · priorité   UNE lecture de la commune choisie : le fait (source, horizon, grain), ce qu'il implique pour
//                  cette priorité, ce qu'il reste à vérifier, la suite.
//
// Décisions du 14/10/2026 (FUT-50) : le champ ne cherche que des COMMUNES, parce que l'aperçu gratuit ne lit
// que des données communales ; l'adresse a sa propre porte vers `/dossier`, où le périmètre et le prix de
// l'analyse d'adresse sont expliqués. L'autocomplétion reprend celle de l'accueil actuel (géocodeur officiel,
// `urlRechercheCommunes`, 250 ms, annulation, aide Paris / Lyon / Marseille). Aucune génération IA, aucun
// Projet enregistré.
import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { urlRechercheCommunes } from "@/lib/geocodeur-ban";
import { GlypheGrain, TEINTE_REGISTRE } from "@/components/releve/primitives";
import { fr } from "../commun";
import { pastillesDe, libelleDe, MOT_DU_SIGNAL, type CleePastille, type Composition, type Lieu, type LecturePastille, type Signal } from "./pastilles";
import c from "./c.module.css";

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
  information: TEINTE_REGISTRE.verifications!,
  adresse: TEINTE_REGISTRE.verifications!,
  indisponible: TEINTE_REGISTRE.unknowns!,
};

type EtatLecture = LecturePastille | "chargement" | "erreur";

export function HeroLieu({ composition = "recommandee" }: { composition?: Composition }) {
  const pastilles = pastillesDe(composition);
  const [saisie, setSaisie] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [cherche, setCherche] = useState(false);
  const [erreurRecherche, setErreurRecherche] = useState("");
  const [aidePlm, setAidePlm] = useState("");
  const [lieu, setLieu] = useState<Lieu | null>(null);
  const [choisies, setChoisies] = useState<CleePastille[]>([]);
  const [focale, setFocale] = useState<CleePastille | null>(null);
  const [lectures, setLectures] = useState<Record<string, EtatLecture>>({});
  const champRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const lectureRef = useRef<HTMLDivElement>(null);
  const idListe = useId();

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
    setLieu(s);
    setSaisie(s.libelle);
    setOuvert(false);
    setSuggestions([]);
    // Les priorités cochées portent sur ce qui compte, pas sur le lieu : elles restent, et leur lecture se refait
    // pour la nouvelle commune. Aucune lecture de l'ancienne commune ne reste à l'écran.
    setLectures({});
    for (const cle of choisies) charger(s, cle);
  }

  function changerDeCommune() {
    setLieu(null);
    setSaisie("");
    setLectures({});
    setTimeout(() => champRef.current?.focus(), 0);
  }

  async function charger(l: Lieu, cle: CleePastille) {
    const k = `${l.insee}|${cle}`;
    setLectures((m) => ({ ...m, [k]: "chargement" }));
    try {
      const q = new URLSearchParams({ insee: l.insee, cle, type: l.type, commune: l.commune, libelle: l.libelle });
      const res = await fetch(`/dev/fut50/api/lecture?${q}`);
      if (!res.ok) throw new Error(String(res.status));
      const { lecture } = (await res.json()) as { lecture: LecturePastille };
      setLectures((m) => ({ ...m, [k]: lecture }));
    } catch {
      setLectures((m) => ({ ...m, [k]: "erreur" }));
    }
  }

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
    // Écran étroit : la lecture s'affiche sous les priorités ; on l'amène doucement en vue si besoin, jamais en
    // mouvement réduit.
    requestAnimationFrame(() => {
      const el = lectureRef.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (el.getBoundingClientRect().top > window.innerHeight - 120) el.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const lectureFocale = lieu && focale ? lectures[`${lieu.insee}|${focale}`] : undefined;

  return (
    <section className={c.hero} data-etat={etat} aria-labelledby="hero-c">
      <div className={c.heroTete}>
        <h1 id="hero-c" className={c.titre}>Regardez une commune avec ce qui compte pour vous.</h1>
        <p className={c.sous}>{fr("Choisissez une commune, puis ce qui vous importe : futur•e vous montre ce que disent les données publiques, et ce qu'il reste à vérifier.")}</p>
      </div>

      <div className={c.heroGauche}>
        <div className={c.recherche} ref={zoneRef} id="lieu">
          <label htmlFor="champ-commune" className={c.rechercheLabel}>Quelle commune vous intéresse ?</label>
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
              onChange={(e) => { setSaisie(e.target.value); if (lieu) { setLieu(null); setLectures({}); } if (e.target.value.trim().length < 2) { setSuggestions([]); setOuvert(false); } }}
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
            <span className={c.lieuNom}>{lieu.libelle}</span>
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
            <p className={c.aide}>{etat === "commune" ? "Choisissez-en une pour voir ce que disent les données. Rien n'est enregistré." : "Une ou plusieurs, facultatives. Rien n'est enregistré."}</p>
          </div>
        ) : null}

        {/* LA PORTE DE L'ADRESSE : séparée, discrète, toujours là. Une adresse précise relève du dossier payant ;
            son parcours explique le périmètre et le prix. */}
        <p className={c.porteAdresse}>
          Vous avez déjà une adresse précise ? <Link href="/dossier" className={c.lienFleche}>Examiner cette adresse</Link>
        </p>
      </div>

      <div className={c.heroDroite} aria-live="polite" ref={lectureRef}>
        {etat !== "priorite" || !lieu || !focale ? null
          : lectureFocale === "chargement" || lectureFocale === undefined ? <Attente titre={`${libelleDe(focale)} · ${lieu.commune}`} />
            : lectureFocale === "erreur" ? (
              <div className={c.lecture} role="alert">
                <p className={c.tempsTexte}>La lecture n&apos;a pas pu être chargée.</p>
                <button type="button" className={c.bouton} onClick={() => charger(lieu, focale)}>Réessayer</button>
              </div>
            )
              : <Lecture lecture={lectureFocale} onglets={choisies.length > 1 ? { choisies, focale, choisir: setFocale } : undefined} />}
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
        <div className={c.onglets} role="tablist" aria-label="Vos priorités choisies">
          {onglets.choisies.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={k === onglets.focale} className={c.onglet} onClick={() => onglets.choisir(k)}>{libelleDe(k)}</button>
          ))}
        </div>
      ) : null}
      <div className={c.lectureContenu} key={`${lecture.commune}-${lecture.cle}`}>
        {lecture.fait ? (
          <div className={c.temps}>
            <h3 className={c.tempsTitre}>Ce que disent les données</h3>
            <p className={c.tempsTexte}>{fr(lecture.fait.texte)}</p>
            <span className={c.source}>
              <GlypheGrain grain={lecture.fait.grain} taille={11} />{" "}
              {lecture.fait.grain === "unite_urbaine" ? `agglomération de ${lecture.commune}` : `commune de ${lecture.commune}`} · {lecture.fait.source}
            </span>
          </div>
        ) : null}
        <div className={c.temps}>
          <h3 className={c.tempsTitre}>Pour cette priorité</h3>
          <span className={c.signal} style={{ "--r-teinte": TEINTE[lecture.pourVous.signal] } as CSSProperties}>{MOT_DU_SIGNAL[lecture.pourVous.signal]}</span>
          <p className={c.tempsTexte}>{fr(lecture.pourVous.texte)}</p>
        </div>
        <div className={c.temps}>
          <h3 className={c.tempsTitre}>Ce qu&apos;il reste à vérifier</h3>
          <p className={c.tempsTexteDoux}>{fr(lecture.aVerifier)}</p>
        </div>
        <div className={c.suites}>
          <Link href={lecture.suite.href} className={c.boutonMarque}>{lecture.suite.libelle} <span aria-hidden>→</span></Link>
          <Link href="/ou-vivre" className={c.lienFleche}>Décrire tout mon projet</Link>
        </div>
      </div>
    </article>
  );
}
