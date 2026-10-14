"use client";
// FUT-50 · VERSION C · LE HERO : UN LIEU, PUIS CE QUI COMPTE. DEV UNIQUEMENT.
//
// Le premier geste est de chercher un lieu (commune ou adresse) ; le Projet vient ensuite, sous la forme de
// quatre pastilles facultatives, sans compte et sans rien enregistrer. Chaque pastille affiche UNE lecture :
// ce que disent les données, ce que cela implique pour cette priorité, ce qu'il reste à vérifier, et la suite.
//
// Ce qui vient de l'accueil actuel (`FutureELanding.tsx`) : l'autocomplétion par le géocodeur officiel
// (même service, même délai de 250 ms, même annulation), l'aide Paris / Lyon / Marseille. Ce qui change :
// le champ accepte aussi une adresse, et l'interface dit honnêtement qu'une adresse n'est lue ici qu'à
// l'échelle de sa commune.
//
// Avant toute recherche, la colonne de droite montre un EXEMPLE RÉEL, marqué comme tel (Sète, lecture du
// moteur relevée et vérifiée, `cas-sete.ts`) : l'expérience est hybride et le dit.
import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { urlRechercheBan } from "@/lib/geocodeur-ban";
import { GlypheGrain, TEINTE_REGISTRE } from "@/components/releve/primitives";
import { CAS_SETE } from "../cas-sete";
import { fr } from "../commun";
import { PASTILLES, MOT_DU_SIGNAL, type CleePastille, type Lieu, type LecturePastille, type Signal } from "./pastilles";
import c from "./c.module.css";

// ── La recherche ──────────────────────────────────────────────────────────────────────────────

type Suggestion = Lieu & { id: string; contexte: string };

// Les trois communes « centrales » que les données ne connaissent que par arrondissement : même aide que
// l'accueil actuel.
const PLM: Record<string, { ville: string; exemple: string }> = {
  "75056": { ville: "Paris", exemple: "Paris 15e Arrondissement" },
  "69123": { ville: "Lyon", exemple: "Lyon 6e Arrondissement" },
  "13055": { ville: "Marseille", exemple: "Marseille 7e Arrondissement" },
};

type FeatureBan = { properties: Record<string, string | undefined> };

function versSuggestion(f: FeatureBan): Suggestion | null {
  const p = f.properties;
  if (!p.citycode || !p.city) return null;
  const commune = p.type === "municipality";
  if (!commune && p.type !== "housenumber" && p.type !== "street") return null;
  return {
    id: p.id ?? `${p.type}-${p.label}`,
    type: commune ? "commune" : "adresse",
    libelle: commune ? p.city : p.label ?? p.city,
    commune: p.city,
    insee: p.citycode,
    contexte: commune ? (p.context ?? "") : `${p.postcode ?? ""} ${p.city}`.trim(),
  };
}

// Les exemples proposés à côté du champ : des communes réelles, aux lectures contrastées.
const EXEMPLES: Lieu[] = [
  { type: "commune", libelle: "Sète", commune: "Sète", insee: "34301" },
  { type: "commune", libelle: "Lille", commune: "Lille", insee: "59350" },
  { type: "commune", libelle: "Guéret", commune: "Guéret", insee: "23096" },
];

// ── La lecture d'exemple (Sète, moteur réel, relevé daté) ─────────────────────────────────────

const EXEMPLE: LecturePastille = {
  cle: "chaleur",
  commune: CAS_SETE.commune,
  fait: { texte: CAS_SETE.faits.nuits.constat, source: "DRIAS · Météo-France, horizon 2050 (+2,7 °C en France)", grain: "commune" },
  pourVous: { signal: "defavorable", texte: CAS_SETE.faits.nuits.titreSiPriorite },
  aVerifier: `${CAS_SETE.faits.nuits.limite} ${CAS_SETE.faits.nuits.geste}.`,
  suite: { libelle: "Examiner une adresse à Sète", href: "/dossier" },
};

const TEINTE: Record<Signal, string> = {
  defavorable: TEINTE_REGISTRE.mismatches!,
  favorable: TEINTE_REGISTRE.alignments!,
  neutre: TEINTE_REGISTRE.unknowns!,
  information: TEINTE_REGISTRE.verifications!,
  adresse: TEINTE_REGISTRE.verifications!,
  indisponible: TEINTE_REGISTRE.unknowns!,
};

function libelleDe(cle: CleePastille) {
  return PASTILLES.find((p) => p.cle === cle)!.libelle;
}

// ── Le composant ──────────────────────────────────────────────────────────────────────────────

export function HeroLieu() {
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
  const [lectures, setLectures] = useState<Record<string, LecturePastille | "chargement" | "erreur">>({});
  const champRef = useRef<HTMLInputElement>(null);
  const lectureRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const idListe = useId();

  // L'autocomplétion : le géocodeur officiel, 250 ms après la frappe, la requête précédente annulée.
  useEffect(() => {
    const q = saisie.trim();
    if (lieu || q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setCherche(true);
      setErreurRecherche("");
      try {
        const res = await fetch(urlRechercheBan({ q, limit: 7, autocomplete: 1 }), { signal: ctrl.signal });
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

  // Un clic hors du champ referme la liste.
  useEffect(() => {
    const ferme = (e: MouseEvent) => { if (!zoneRef.current?.contains(e.target as Node)) setOuvert(false); };
    window.addEventListener("click", ferme);
    return () => window.removeEventListener("click", ferme);
  }, []);

  function choisir(s: Lieu) {
    const plm = PLM[s.insee];
    if (s.type === "commune" && plm) {
      setSaisie(`${plm.ville} `);
      setAidePlm(`${plm.ville} se lit par arrondissement. Précisez-le, par exemple « ${plm.exemple} », ou saisissez une adresse.`);
      setOuvert(false);
      champRef.current?.focus();
      return;
    }
    setAidePlm("");
    setLieu(s);
    setSaisie(s.libelle);
    setOuvert(false);
    setSuggestions([]);
    // Les priorités choisies restent : elles portent sur ce qui compte, pas sur le lieu. Leur lecture se refait.
    setLectures({});
    for (const cle of choisies) charger(s, cle);
  }

  function changerDeLieu() {
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
    // Sur un écran étroit, la lecture s'affiche SOUS les pastilles : on l'amène doucement dans le champ de
    // vision, seulement si elle n'y est pas déjà, et jamais en mouvement réduit.
    requestAnimationFrame(() => {
      const el = lectureRef.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight - 120) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function clavier(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!ouvert || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActif((i) => (i + 1) % suggestions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActif((i) => (i - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === "Enter" && actif >= 0) { e.preventDefault(); choisir(suggestions[actif]!); }
    else if (e.key === "Escape") { setOuvert(false); }
  }

  const lectureFocale = lieu && focale ? lectures[`${lieu.insee}|${focale}`] : undefined;

  return (
    <section className={c.hero} aria-labelledby="hero-c">
      <div className={c.heroGauche}>
        <h1 id="hero-c" className={c.titre}>Regardez un lieu avec ce qui compte pour vous.</h1>
        <p className={c.sous}>
          {fr("Cherchez une commune ou une adresse, puis choisissez ce qui vous importe. futur•e vous montre ce que disent les données publiques, et ce qu'il reste à vérifier.")}
        </p>

        <div className={c.recherche} ref={zoneRef} id="lieu">
          <label htmlFor="champ-lieu" className={c.rechercheLabel}>Quel lieu vous intéresse ?</label>
          <div className={c.champ}>
            <svg className={c.champIcone} width="18" height="18" viewBox="0 0 18 18" aria-hidden><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12.5 12.5 L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <input
              id="champ-lieu"
              ref={champRef}
              role="combobox"
              aria-expanded={ouvert}
              aria-controls={idListe}
              aria-autocomplete="list"
              aria-activedescendant={ouvert && actif >= 0 ? `${idListe}-${actif}` : undefined}
              autoComplete="off"
              placeholder="Ex. Sète, ou une adresse"
              value={saisie}
              onChange={(e) => { setSaisie(e.target.value); if (lieu) { setLieu(null); setLectures({}); } if (e.target.value.trim().length < 2) { setSuggestions([]); setOuvert(false); } }}
              onKeyDown={clavier}
              onFocus={() => { if (suggestions.length > 0 && !lieu) setOuvert(true); }}
            />
            {cherche ? <span className={c.chargement} aria-label="Recherche en cours" role="status" /> : null}
          </div>
          {ouvert && suggestions.length > 0 ? (
            <ul id={idListe} role="listbox" className={c.suggestions} aria-label="Lieux trouvés">
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
                  <span aria-hidden style={{ color: "var(--r-discret)" }}><GlypheGrain grain={s.type === "commune" ? "commune" : "adresse"} taille={13} /></span>
                  <span>{s.libelle}<span className={c.suggestionContexte}>{s.contexte}</span></span>
                  <span className={c.suggestionType}>{s.type === "commune" ? "commune" : "adresse"}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {ouvert && !cherche && suggestions.length === 0 && saisie.trim().length >= 2 ? (
            <p className={c.aide} role="status">Aucun lieu trouvé. Vérifiez l&apos;orthographe ou essayez le nom de la commune.</p>
          ) : null}
          {erreurRecherche ? <p className={c.aide} role="alert">{erreurRecherche}</p> : null}
          {aidePlm ? <p className={c.aide} role="status">{aidePlm}</p> : null}
          {!lieu ? (
            <p className={c.exemples}>
              Ou essayez avec{" "}
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
          <div className={c.lieu} key={lieu.insee + lieu.libelle}>
            <svg className={c.coche} width="20" height="20" viewBox="0 0 20 20" aria-hidden><path d="M4 10.5 L8.2 14.5 L16 6" fill="none" stroke="var(--reg-alignement)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className={c.lieuNom}>{lieu.libelle}</span>
            <span className={c.lieuType}>{lieu.type === "commune" ? "commune" : `adresse · lue ici à l'échelle de ${lieu.commune}`}</span>
            <button type="button" className={c.lienTexte} onClick={changerDeLieu} style={{ fontSize: 15 }}>Changer de lieu</button>
          </div>
        ) : null}

        {lieu ? (
        <div style={{ display: "grid", gap: 12 }} key={`priorites-${lieu.insee}`}>
          <p className={c.question} id="question-priorites">Qu&apos;est-ce qui compte pour vous ?</p>
          <ul className={c.pastilles} aria-labelledby="question-priorites">
            {PASTILLES.map((p, i) => (
              <li key={p.cle} className={c.pastilleEntree} style={{ animationDelay: `${i * 40}ms` } as CSSProperties}>
                <button type="button" className={c.pastille} aria-pressed={choisies.includes(p.cle)} onClick={() => basculer(p.cle)}>
                  <span className={c.pastilleMarque} aria-hidden />
                  {p.libelle}
                </button>
              </li>
            ))}
          </ul>
          <p className={c.aide}>Une ou plusieurs, facultatives. Rien n&apos;est enregistré.</p>
        </div>
        ) : null}
      </div>

      <div aria-live="polite" ref={lectureRef} style={{ scrollMarginTop: 88 }}>
        {!lieu || !focale ? (
          <Lecture lecture={EXEMPLE} lieuLibelle={CAS_SETE.commune} exemple={!lieu} invitation={lieu ? `Choisissez une priorité pour voir ce que les données disent de ${lieu.commune}.` : null} />
        ) : lectureFocale === "chargement" || lectureFocale === undefined ? (
          <Squelette titre={`${libelleDe(focale)} · ${lieu.commune}`} />
        ) : lectureFocale === "erreur" ? (
          <div className={c.lecture}><p className={c.tempsTexte}>La lecture n&apos;a pas pu être chargée. Réessayez dans un instant.</p></div>
        ) : (
          <Lecture
            lecture={lectureFocale}
            lieuLibelle={lieu.type === "adresse" ? lieu.commune : lieu.libelle}
            adresse={lieu.type === "adresse"}
            onglets={choisies.length > 1 ? { choisies, focale, choisir: setFocale } : undefined}
          />
        )}
      </div>
    </section>
  );
}

function Squelette({ titre }: { titre: string }) {
  return (
    <div className={c.lecture} aria-busy="true">
      <p className={c.lectureTitre}>{titre}</p>
      <p className={c.etatLecture} role="status">Lecture des données publiques de la commune.</p>
      <div className={c.squelette} aria-hidden>
        {["92%", "78%", "60%", "84%", "48%"].map((w, i) => <div key={i} className={c.squeletteLigne} style={{ width: w }} />)}
      </div>
    </div>
  );
}

function Lecture({ lecture, lieuLibelle, exemple = false, adresse = false, invitation = null, onglets }: {
  lecture: LecturePastille; lieuLibelle: string; exemple?: boolean; adresse?: boolean; invitation?: string | null;
  onglets?: { choisies: CleePastille[]; focale: CleePastille; choisir: (c: CleePastille) => void };
}) {
  return (
    <article className={c.lecture} aria-label={exemple ? "Exemple réel de lecture" : "Lecture du lieu choisi"}>
      {invitation ? <p className={c.tempsTexteDoux}>{invitation} En attendant, voici l&apos;exemple de Sète.</p> : null}
      <div className={c.lectureEntete}>
        <h2 className={c.lectureTitre}>{libelleDe(lecture.cle)} · {lieuLibelle}</h2>
        {exemple || invitation ? <span className={c.mention}>exemple réel</span> : null}
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
              {lecture.fait.grain === "unite_urbaine" ? `agglomération de ${lecture.commune}` : adresse ? `commune de ${lecture.commune}` : "à l'échelle de la commune"} · {lecture.fait.source}
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
