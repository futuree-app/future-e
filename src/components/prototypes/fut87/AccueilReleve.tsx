// FUT-87 · PROTOTYPE 1 · L'ACCUEIL DANS LA DIRECTION « LE RELEVÉ ». DEV UNIQUEMENT.
//
// Ce prototype ne réécrit pas la proposition de valeur (FUT-50) : titres, sous-titres et textes sont
// ceux de l'accueil actuel (`FutureELanding.tsx`), recopiés mot pour mot. Ce qui change :
//
//   1. L'emblème des trois échelles, aujourd'hui réduit à un repère de 224 px dans le rapport, devient
//      la figure de l'accueil, légendé comme une planche : il explique la structure du produit avant
//      tout paragraphe.
//   2. Les deux usages (chercher où vivre, analyser une adresse) sont deux portes de même rang.
//   3. Une trajectoire réelle (DRIAS, calculée par le code de l'accueil déjà testé) remplace les deux
//      cartes flottantes : le temps se montre comme une règle, avec la référence et trois horizons.
//   4. Les trois échelles se lisent en coupe, sans emoji ni couleur d'échelle (DESIGN.md § 7).
import Link from "next/link";
import { carteCompte, NUITS, MACHINE_A_SOUS_DRIAS, type Indicators } from "@/lib/accueil/recits";
import { HORIZONS } from "@/lib/horizons";
import {
  CERCLE_TERRITOIRE, CARRE_AUTOUR, LOSANGE_LOGEMENT, ECHELLE_VIEWBOX, ECHELLE_CENTRE,
} from "@/components/report/echelle-geometry";
import { releve as s, Surtitre, Plaque, RegleDuTemps, Marge, GlypheGrain, type GrainCle } from "./primitives";

// La trajectoire de Marseille (maille du 1er arrondissement), valeurs figées et vérifiées contre
// `public/data_climat.json` par `recits.test.ts`. Le texte de chaque palier vient de `carteCompte`.
function trajectoireMarseille() {
  const brut = MACHINE_A_SOUS_DRIAS["13201"];
  const ind = Object.fromEntries(Object.entries(brut).map(([g, v]) => [g, Object.fromEntries(Object.entries(v).map(([k, n]) => [k, { value_numeric: n }]))])) as Indicators;
  const ref = carteCompte(NUITS, ind, "reference");
  const paliers = HORIZONS.map((h) => ({ h, carte: carteCompte(NUITS, ind, h.annee), valeur: brut[h.key].NORTR_yr }));
  const valeurRef = ref?.valeur ? Number.parseInt(ref.valeur, 10) : null;
  return { ref, valeurRef, paliers, source: ref?.source ?? "DRIAS · Météo-France" };
}

function Emblème() {
  // Les formes exactes du repère du hub (`echelle-geometry.ts`), agrandies, en trait seul. Les
  // légendes sont des renvois de planche : un trait, un nom, un grain.
  const V = ECHELLE_VIEWBOX;
  const c = ECHELLE_CENTRE;
  const marge = 70;
  return (
    <figure style={{ margin: 0 }} aria-label="Les trois échelles du dossier : la commune contient le secteur, qui contient le bâtiment">
      <svg viewBox={`${-marge} ${-16} ${V + marge * 2} ${V + 32}`} style={{ width: "100%", height: "auto", display: "block", color: "var(--r-encre)" }} aria-hidden focusable="false">
        {/* Graduations de la commune : douze repères, comme une rose de relevé. */}
        {Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const r1 = CERCLE_TERRITOIRE.r + 4;
          const r2 = CERCLE_TERRITOIRE.r + (i % 4 === 0 ? 11 : 7);
          return <line key={i} x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1} x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2} stroke="var(--r-discret)" strokeWidth={0.6} />;
        })}
        <circle {...CERCLE_TERRITOIRE} fill="none" stroke="currentColor" strokeWidth={1.1} />
        <rect {...CARRE_AUTOUR} fill="none" stroke="currentColor" strokeWidth={1.1} />
        <rect {...LOSANGE_LOGEMENT} fill="none" stroke="currentColor" strokeWidth={1.3} />
        <circle cx={c} cy={c} r={2.2} fill="currentColor" />
        {/* Renvois de planche */}
        <g stroke="var(--r-discret)" strokeWidth={0.6} fill="none">
          <polyline points={`${c + 68},${c - 68} ${c + 96},${c - 98} ${V + marge - 6},${c - 98}`} />
          <polyline points={`${c + 54},${c + 30} ${V + 14},${c + 30} ${V + marge - 6},${c + 30}`} />
          <polyline points={`${c - 22},${c + 22} ${c - 64},${c + 118} ${-marge + 6},${c + 118}`} />
        </g>
        <g fontFamily="var(--font-mono)" fontSize={8.5} fill="var(--r-meta)">
          <text x={V + marge - 6} y={c - 103} textAnchor="end">1 · la commune</text>
          <text x={V + marge - 6} y={c + 25} textAnchor="end">2 · le secteur</text>
          <text x={-marge + 6} y={c + 113}>3 · le bâtiment</text>
        </g>
      </svg>
    </figure>
  );
}

const PORTES: { grain: GrainCle; usage: string; action: string; href: string }[] = [
  { grain: "commune", usage: "Je cherche où vivre", action: "Trouver où vivre", href: "/ou-vivre" },
  { grain: "batiment", usage: "J'ai déjà une adresse à analyser", action: "Analyser une adresse", href: "/dossier" },
];

// Les trois échelles, avec les textes de l'accueil actuel (constante `MODULES`), sans les emoji.
const ECHELLES: { grain: GrainCle; nom: string; echelle: string; desc: string; items: string[] }[] = [
  { grain: "commune", nom: "Territoire", echelle: "La commune", desc: "Ce qui structure la vie ici et ce qui la transforme : les services, la population, la nature, et la trajectoire du climat.", items: ["Accès aux services essentiels", "Population, vacance, résidences secondaires", "Espaces naturels et boisement", "Chaleur, eau, feux, littoral"] },
  { grain: "secteur", nom: "Autour de l'adresse", echelle: "Le voisinage", desc: "Ce qui se trouve à proximité, ce qui manque, et ce qui distingue ce secteur du reste de la commune.", items: ["Commerces, école, santé, gare", "Espace vert le plus proche", "Îlot de chaleur du quartier", "Ce que la voiture pèse ici"] },
  { grain: "batiment", nom: "Logement", echelle: "Le bâtiment", desc: "Ce que son diagnostic établit, ce à quoi son adresse l'expose, et ce qu'il reste à demander avant de signer.", items: ["Diagnostic et confort d’été", "Sol de la parcelle, sismicité, cavités", "Zone réglementée, sinistres indemnisés", "À vérifier avant de décider"] },
];

export function AccueilReleve() {
  const t = trajectoireMarseille();
  const jalons = [
    ...(t.valeurRef != null ? [{ annee: 1976, jusqua: 2005, libelle: "référence", valeur: t.ref?.valeur?.replace(" nuits/an", "") }] : []),
    ...t.paliers.map((p) => ({ annee: Number(p.h.annee), libelle: p.h.france, valeur: p.carte?.valeur?.replace(" nuits/an", "") })),
  ];
  const valeurs: Record<number, number> = Object.fromEntries([
    ...(t.valeurRef != null ? [[1976, t.valeurRef] as const] : []),
    ...t.paliers.map((p) => [Number(p.h.annee), p.valeur] as const),
  ]);
  return (
    <div className={s.feuille}>
      {/* ── 1. La première impression ─────────────────────────────────────────────────── */}
      <section style={{ display: "grid", gap: 40, padding: "56px 0 48px" }} className={s.heroAccueil}>
        <div className={s.pile} style={{ gap: 22, alignContent: "center" }}>
          <Surtitre>Données publiques · Lecture locale · Projection personnalisée</Surtitre>
          <h1 className={s.display} style={{ fontSize: "clamp(44px, 6.4vw, 84px)", letterSpacing: "-0.03em" }}>Où vivre demain ?</h1>
          <p className={s.chapo} style={{ maxWidth: 520 }}>
            Comparez les territoires français selon votre projet de vie, des services du quotidien jusqu&apos;au climat de demain.
          </p>
          <nav aria-label="Deux manières de commencer" style={{ display: "grid", marginTop: 8, borderTop: "1px solid var(--r-filet-fort)" }}>
            {PORTES.map((p) => (
              <Link key={p.href} href={p.href} className={s.porte}>
                <span style={{ color: "var(--r-encre)", paddingTop: 4 }}><GlypheGrain grain={p.grain} taille={16} /></span>
                <span className={s.pileSerree}>
                  <span className={s.sousTitre} style={{ fontSize: 19 }}>{p.usage}</span>
                  <span className={s.etiquette}>{p.action}</span>
                </span>
                <span aria-hidden className={s.mono} style={{ fontSize: 18, color: "var(--r-encre)" }}>→</span>
              </Link>
            ))}
          </nav>
        </div>
        <div style={{ alignSelf: "center", maxWidth: 520, width: "100%", justifySelf: "center" }}>
          <Emblème />
        </div>
      </section>

      {/* ── 2. Le temps, montré comme une règle ───────────────────────────────────────── */}
      <Plaque etiquette="Exemple de lecture : nuits tropicales à Marseille">
        <div className={s.ligne}>
          <div className={s.pile} style={{ gap: 14 }}>
            <p className={s.etiquette}>Exemple de lecture · Marseille, maille du 1er arrondissement</p>
            <h2 className={s.titre}>{t.paliers.find((p) => p.h.annee === "2050")?.carte?.fait}</h2>
            <p className={s.nuance}>{t.ref?.lecture}</p>
            <div style={{ marginTop: 18 }}>
              <RegleDuTemps
                etiquette="Nuits tropicales par an à Marseille : référence 1976-2005, puis horizons 2030, 2050 et 2100"
                jalons={jalons}
                hauteurValeurs={{ min: 0, max: Math.max(...Object.values(valeurs)), valeurs }}
              />
            </div>
          </div>
          <Marge elements={[
            { type: "grain", grain: "commune", libelle: "maille du 1er arrondissement" },
            { type: "valeur", libelle: "Unité", valeur: "nuits par an à 20 °C ou plus" },
            { type: "source", texte: "Sous chaque horizon : le réchauffement correspondant en France (TRACC)" },
            ...t.paliers.map((p) => ({ type: "valeur" as const, libelle: p.h.annee, valeur: `${p.carte?.comparaison ?? ""}` })),
            { type: "source", texte: `${t.source}, projections DRIAS-TRACC` },
          ]} />
        </div>
      </Plaque>

      {/* ── 3. Les trois échelles, en coupe ───────────────────────────────────────────── */}
      <section className={s.mouvement} aria-labelledby="a-echelles" style={{ marginTop: 56 }}>
        <div className={s.enTeteMouvement}>
          <Surtitre numero="3 échelles" id="a-echelles">Trois échelles, de la commune à vos murs</Surtitre>
          <p className={s.chapo} style={{ maxWidth: 640 }}>
            Une bonne commune ne fait pas un bon quartier, et un bon quartier ne fait pas un bon logement. Les trois se lisent séparément, sur les données publiques, et chacune peut contredire la précédente.
          </p>
        </div>
        <div className={s.trois}>
          {ECHELLES.map((e, i) => (
            <div key={e.nom} className={s.pile} style={{ gap: 12, alignContent: "start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "var(--r-encre)" }}><GlypheGrain grain={e.grain} taille={22} /></span>
                <span className={s.numero}>{String(i + 1).padStart(2, "0")} · {e.echelle.toLowerCase()}</span>
              </div>
              <h3 className={s.titre} style={{ fontSize: 24 }}>{e.nom}</h3>
              <p className={s.dense}>{e.desc}</p>
              <ul className={s.liste} style={{ marginTop: 4 }}>
                {e.items.map((it) => (
                  <li key={it} className={s.dense} style={{ padding: "7px 0", color: "var(--r-discret)" }}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. La méthode, en trois temps ──────────────────────────────────────────────── */}
      <section className={s.mouvement} aria-labelledby="a-methode">
        <div className={s.ligne}>
          <div className={s.pile} style={{ gap: 16 }}>
            <Surtitre numero="Pourquoi futur•e" id="a-methode">Votre futur lieu de vie ne tient pas dans une annonce.</Surtitre>
            <p className={s.titre} style={{ fontWeight: 500 }}>
              <span className={s.encre}>Ce que nous savons.</span>{" "}
              <span style={{ color: "var(--r-discret)" }}>Ce que cela change pour vous.</span>{" "}
              <span style={{ color: "var(--r-meta)" }}>Ce qu&apos;il reste à vérifier.</span>
            </p>
            <p className={s.corps} style={{ maxWidth: 640 }}>
              futur•e rassemble ce qui est connu, rend visibles les angles morts et vous aide à savoir ce qu&apos;il reste à vérifier avant de vous engager. Les faits sont les mêmes pour tout le monde : ce qui change avec votre projet, c&apos;est le poids de chaque fait pour votre décision.
            </p>
            <div className={s.rangee} style={{ marginTop: 8 }}>
              <Link href="/ou-vivre" className={`${s.bouton} ${s.boutonMarque}`}>Décrire mon projet →</Link>
              <Link href="/pourquoi" className={s.bouton}>Découvrir notre méthode</Link>
            </div>
          </div>
          <div aria-hidden />
        </div>
      </section>
      <div style={{ height: 48 }} />
    </div>
  );
}
