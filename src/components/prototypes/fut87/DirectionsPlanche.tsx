// FUT-87 · LA PLANCHE DES TROIS DIRECTIONS. DEV UNIQUEMENT.
//
// Le MÊME contenu, rendu trois fois : un verdict, un constat avec sa preuve, une valeur projetée.
// Les textes sont repris mot pour mot du dossier réel de Nîmes (moteur, mode déterministe, projet de
// test du prototype 2). Ce qui varie : la composition, la typographie, les surfaces, le traitement de
// la donnée et de la source. C'est la seule façon honnête de comparer des directions : à contenu égal.
import type { CSSProperties, ReactNode } from "react";
import { releve as s, GlypheGrain } from "@/components/releve/primitives";

const VERDICT = "Nîmes répond moins bien à une de vos priorités : des étés supportables.";
const DETAIL = "L'accès aux soins et la vie locale répondent en revanche à votre projet. La décision se joue entre ces correspondances et l'écart relevé.";
const CONSTAT = "Les jours au-dessus de 35 °C passeraient de 3 par an sur la période de référence 1976-2005 à 14 à l'horizon 2050.";
const PREUVE = "14 jours à l'horizon 2050";
const SOURCE = "DRIAS-TRACC, Météo-France · à l'échelle de la commune";

function Cadre({ titre, sousTitre, children, principes, risques, style, theme }: {
  titre: string; sousTitre: string; children: ReactNode; principes: string[]; risques: string[]; style?: CSSProperties; theme?: "light";
}) {
  return (
    <section className={s.mouvement} aria-label={titre}>
      <div className={s.enTeteMouvement}>
        <p className={s.surtitre}><span className={s.numero}>{sousTitre}</span><span>{titre}</span></p>
      </div>
      <div className={s.ligne} style={{ alignItems: "start" }}>
        <div data-theme={theme} style={{ borderRadius: 2, overflow: "hidden", border: "1px solid var(--r-filet-fort)", ...style }}>{children}</div>
        <div className={s.pile} style={{ gap: 14 }}>
          <div className={s.pileSerree}>
            <p className={s.etiquette}>Principes</p>
            {principes.map((p) => <p key={p} className={s.nuance}>{p}</p>)}
          </div>
          <div className={s.pileSerree}>
            <p className={s.etiquette}>Risques</p>
            {risques.map((p) => <p key={p} className={s.nuance}>{p}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A · ATLAS CONTEMPORAIN. La page est une feuille de carte : trame de coordonnées, lettrage condensé
 *  en capitales comme un toponyme, barre d'échelle, isolignes discrètes. */
function Atlas() {
  return (
    <div style={{
      position: "relative", padding: "36px 40px 40px", background: "var(--bg)",
      backgroundImage: "linear-gradient(var(--r-trame) 1px, transparent 1px), linear-gradient(90deg, var(--r-trame) 1px, transparent 1px)",
      backgroundSize: "48px 48px",
    }}>
      <svg viewBox="0 0 600 220" aria-hidden style={{ position: "absolute", right: -40, top: 10, width: 420, opacity: 0.5 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M ${20 + i * 14} ${200 - i * 10} C ${160 + i * 10} ${120 - i * 18}, ${300 - i * 6} ${220 - i * 26}, ${580 - i * 12} ${60 + i * 12}`} fill="none" stroke="var(--fg-3)" strokeWidth={0.7} />
        ))}
      </svg>
      <div style={{ position: "relative", display: "grid", gap: 14 }}>
        <p className={s.mono} style={{ fontSize: 10.5, color: "var(--r-meta)", letterSpacing: "0.08em" }}>43°50′ N · 4°21′ E · FEUILLE 30189</p>
        <p style={{ fontWeight: 600, fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--r-discret)" }}>Nîmes · Gard</p>
        <h3 style={{ fontWeight: 600, fontSize: 34, lineHeight: 1.05, textTransform: "uppercase", letterSpacing: "0.01em", color: "var(--r-encre)", margin: 0, maxWidth: 520 }}>{VERDICT}</h3>
        <p className={s.dense} style={{ maxWidth: 520 }}>{DETAIL}</p>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center", marginTop: 10, paddingTop: 14, borderTop: "1px solid var(--r-filet-fort)" }}>
          <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>{[6, 12, 18].map((r) => <circle key={r} cx="22" cy="22" r={r} fill="none" stroke="var(--fg-hi)" strokeWidth={r === 18 ? 1.4 : 0.7} />)}</svg>
          <div className={s.pileSerree}>
            <p className={s.dense}>{CONSTAT}</p>
            <p className={s.mono} style={{ fontSize: 11, color: "var(--r-meta)" }}>{PREUVE} · {SOURCE}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }} aria-hidden>
          <div style={{ display: "flex" }}>{[0, 1, 2, 3].map((i) => <span key={i} style={{ width: 28, height: 5, background: i % 2 ? "transparent" : "var(--fg-hi)", border: "1px solid var(--fg-hi)" }} />)}</div>
          <span className={s.mono} style={{ fontSize: 10, color: "var(--r-meta)" }}>0 · 5 · 10 km</span>
        </div>
      </div>
    </div>
  );
}

/** B · ÉDITION DOCUMENTAIRE. Le dossier comme une publication : papier clair (le thème clair existant),
 *  grand titrage, paragraphes numérotés, appels de note et notes en pied de planche. */
function Edition() {
  return (
    <div style={{ background: "var(--bg)", color: "var(--fg-2)", padding: "40px 44px 32px", display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid var(--fg-hi)", paddingBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.04em", color: "var(--fg-hi)" }}>Dossier · Nîmes</span>
        <span className={s.mono} style={{ fontSize: 11, color: "var(--fg-3)" }}>§ 1 · Conclusion</span>
      </div>
      <h3 style={{ fontWeight: 800, fontSize: 38, lineHeight: 1.02, letterSpacing: "-0.03em", color: "var(--fg-hi)", margin: 0 }}>{VERDICT}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "10px 12px", fontSize: 15.5, lineHeight: 1.62 }}>
        <span className={s.mono} style={{ fontSize: 12, color: "var(--fg-3)", paddingTop: 3 }}>1.1</span>
        <p style={{ margin: 0 }}>{DETAIL}</p>
        <span className={s.mono} style={{ fontSize: 12, color: "var(--fg-3)", paddingTop: 3 }}>1.2</span>
        <p style={{ margin: 0 }}>{CONSTAT}<sup style={{ fontSize: 10, color: "var(--orange-ink)", marginLeft: 2 }}>1</sup></p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "baseline", padding: "14px 0", borderTop: "1px solid var(--border-2)", borderBottom: "1px solid var(--border-2)" }}>
        <span style={{ fontWeight: 300, fontSize: 56, lineHeight: 1, letterSpacing: "-0.04em", color: "var(--fg-hi)", fontVariantNumeric: "tabular-nums" }}>14</span>
        <span style={{ fontSize: 14, color: "var(--fg-2)" }}>jours au-dessus de 35 °C par an à l&apos;horizon 2050, contre 3 sur 1976-2005.</span>
      </div>
      <p className={s.mono} style={{ fontSize: 11, color: "var(--fg-3)", margin: 0 }}><sup>1</sup> {PREUVE}. {SOURCE}.</p>
    </div>
  );
}

/** C · ARCHITECTURE DU TEMPS. Trois strates horizontales (commune, secteur, bâtiment) sous un axe
 *  du temps commun : chaque fait se place à son échelle ET à sa date. */
function Strates() {
  // Axe linéaire 1982 → 2100 : les libellés et les marques sont posés sur la MÊME échelle.
  const x = (a: number) => ((a - 1982) / (2100 - 1982)) * 100;
  const strates: { grain: "commune" | "secteur" | "batiment"; nom: string; fait?: { x: number; texte: string } }[] = [
    { grain: "commune", nom: "commune", fait: { x: x(2050), texte: PREUVE } },
    { grain: "secteur", nom: "secteur" },
    { grain: "batiment", nom: "bâtiment" },
  ];
  return (
    <div style={{ background: "var(--bg)", padding: "32px 36px 36px", display: "grid", gap: 16 }}>
      <h3 className={s.titre} style={{ fontSize: 26 }}>{VERDICT}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 0 }}>
        <span />
        <div className={s.mono} style={{ position: "relative", height: 20, fontSize: 10.5, color: "var(--r-meta)" }}>
          {([[1982, "1982"], [2026, "aujourd'hui"], [2050, "2050"], [2100, "2100"]] as const).map(([a, t]) => (
            <span key={a} style={{ position: "absolute", left: `${x(a)}%`, transform: a === 2100 ? "translateX(-100%)" : a === 1982 ? undefined : "translateX(-50%)", whiteSpace: "nowrap" }}>{t}</span>
          ))}
        </div>
        {strates.map((st, i) => (
          <div key={st.grain} style={{ display: "contents" }}>
            <span className={s.grain} style={{ alignSelf: "center" }}><GlypheGrain grain={st.grain} />{st.nom}</span>
            <div style={{ position: "relative", height: 54, borderTop: "1px solid var(--r-filet-fort)", borderBottom: i === 2 ? "1px solid var(--r-filet-fort)" : 0, background: i % 2 ? "var(--bg-elev)" : "transparent" }}>
              <div style={{ position: "absolute", left: `${x(2026)}%`, top: 0, bottom: 0, borderLeft: "1px dashed var(--r-discret)" }} />
              {st.fait ? (
                <div style={{ position: "absolute", left: `${st.fait.x}%`, top: 10, transform: "translateX(-50%)", display: "grid", justifyItems: "center", gap: 4 }}>
                  <span style={{ width: 9, height: 9, background: "var(--fg-hi)", transform: "rotate(45deg)" }} />
                  <span className={s.mono} style={{ fontSize: 10.5, color: "var(--r-encre)", whiteSpace: "nowrap" }}>{st.fait.texte}</span>
                </div>
              ) : (
                <span className={s.mono} style={{ position: "absolute", left: 12, top: 18, fontSize: 10.5, color: "var(--r-meta)" }}>lu avec une adresse</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className={s.dense}>{DETAIL}</p>
    </div>
  );
}

/** LA RECOMMANDÉE · LE RELEVÉ. B pour la charpente, C pour le temps et le grain, rien de A sauf la
 *  rigueur du trait. Fond sombre conservé. */
function Releve() {
  return (
    <div style={{ background: "var(--bg)", padding: "32px 36px 36px" }}>
      <div className={s.plaque} style={{ padding: "28px 28px" }}>
        <p className={s.etiquette} style={{ color: "var(--orange)", display: "flex", gap: 8, alignItems: "center" }}><span style={{ width: 8, height: 8, background: "var(--orange)" }} />Arbitrage</p>
        <h3 className={s.display} style={{ fontSize: 32, marginTop: 10 }}>{VERDICT}</h3>
        <p className={s.dense} style={{ marginTop: 12 }}>{DETAIL}</p>
      </div>
      <div className={s.ligne} style={{ marginTop: 22, gridTemplateColumns: "minmax(0,1fr) 190px", gap: 28 }}>
        <div className={s.pileSerree}>
          <p className={s.registre} style={{ "--r-teinte": "var(--reg-ecart)" } as CSSProperties}><span className={s.sousTitre} style={{ fontSize: 15 }}>Des étés plus difficiles à concilier avec votre projet</span></p>
          <p className={s.dense}>{CONSTAT}</p>
        </div>
        <aside className={s.marge} style={{ borderLeft: "1px solid var(--r-filet)", paddingLeft: 14 }}>
          <span className={s.grain}><GlypheGrain grain="commune" />commune</span>
          <span>Preuve · <span className={s.margeValeur}>{PREUVE}</span></span>
          <span>DRIAS-TRACC, Météo-France</span>
        </aside>
      </div>
    </div>
  );
}

export function DirectionsPlanche() {
  return (
    <div className={s.feuille}>
      <header style={{ padding: "40px 0 8px", display: "grid", gap: 12 }}>
        <p className={s.surtitre}><span className={s.numero}>FUT-87</span><span>Trois directions, un même contenu</span></p>
        <h1 className={s.titre} style={{ fontSize: 34 }}>Atlas, édition, strates : et la combinaison retenue</h1>
        <p className={s.corps} style={{ maxWidth: 640 }}>Chaque planche rend le même verdict, le même constat et la même preuve, repris du dossier réel de Nîmes. Seule la direction change.</p>
      </header>
      <Cadre titre="Atlas contemporain" sousTitre="A" principes={[
        "La page comme feuille de carte : trame de coordonnées, barre d'échelle, isolignes en filigrane.",
        "Lettrage condensé en capitales pour les lieux et les titres, à la manière d'un toponyme.",
        "La preuve s'adosse à un repère spatial (cercles concentriques de l'échelle).",
      ]} risques={[
        "Les coordonnées, isolignes et barre d'échelle ressemblent à des données et n'en sont pas : faux relevé.",
        "Les capitales condensées ralentissent la lecture d'une phrase longue, et le verdict en est une.",
        "Toute l'interface finit en carte, même là où rien n'est spatial.",
      ]}><Atlas /></Cadre>
      <Cadre theme="light" titre="Édition documentaire" sousTitre="B" principes={[
        "Le dossier comme publication : papier clair, grand titrage gras, paragraphes numérotés citables.",
        "Les chiffres en très grand corps léger, la phrase qui les explique juste à côté.",
        "Appels de note et notes en pied : la source se lit au même endroit que l'affirmation, sans la couper.",
      ]} risques={[
        "Un dossier long devient un document à faire défiler, moins un outil qu'on parcourt.",
        "Le papier clair rompt avec la DA sombre verrouillée (ADR-0005) : arbitrage du porteur nécessaire.",
        "Les notes en pied éloignent la preuve quand le texte s'allonge.",
      ]}><Edition /></Cadre>
      <Cadre titre="Architecture du temps" sousTitre="C" principes={[
        "Trois strates (commune, secteur, bâtiment) sous un même axe du temps.",
        "Chaque fait se place à son échelle ET à sa date : le lecteur voit ce qui est passé, présent, projeté.",
        "Les formes de l'emblème (cercle, carré, losange) deviennent des marques de grain.",
      ]} risques={[
        "Abstrait : une grille de strates demande un apprentissage avant d'être lue.",
        "Une strate vide (pas d'adresse) se lit comme un manque du produit.",
        "Pousse vers un tableau de bord temporel, le registre « science-fiction » que le ticket écarte.",
      ]}><Strates /></Cadre>
      <Cadre titre="Le relevé · recommandée" sousTitre="B + C" principes={[
        "La charpente de l'édition (titrage, paragraphes citables, preuve à côté de l'affirmation) sur le fond sombre conservé.",
        "Du temps de C, la règle du temps et les glyphes de grain ; rien de ses strates.",
        "D'A, seulement la rigueur du trait et un repère de planche par écran (les coins de la plaque).",
      ]} risques={[
        "La marge de preuve demande de la largeur : sous 900 px, elle passe sous le texte.",
        "Trois glyphes de grain à apprendre : une légende est nécessaire au début.",
      ]}><Releve /></Cadre>
    </div>
  );
}
