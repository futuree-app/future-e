// RENDU COMMUN DES PRÉVISUALISATIONS D'ARTICLES D'ÉTUDE (/dev/article-larochelle, /dev/article-niort). DEV UNIQUEMENT.
//
// Dossier privé (`_`) : aucune route. Chaque page relit son article et ses légendes dans l'étude, puis confie ici le
// Markdown minimal (titres, gras, listes, tableau, filet) et la place des visuels (lignes `[CARTE : …]`, `[GRAPHIQUE : …]`).
// Thème : le fichier clair ou sombre suit `data-theme` (sombre par défaut sur le site) ; version mobile sous 640 px.
import type { ReactNode } from "react";
import { bindOrphans } from "@/lib/typography";

export const css = `
  .apv{background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);min-height:100vh;overflow-x:hidden;}
  .apv-bandeau{font-family:var(--font-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--fg-4);
    border-bottom:1px solid var(--border-1);padding:10px 24px;text-align:center;}
  .apv-page{max-width:968px;margin:0 auto;padding:56px 24px 96px;}
  .apv h1{font-family:var(--font-serif);font-weight:var(--weight-title);font-size:var(--text-display);line-height:1.1;
    letter-spacing:-.02em;margin:0 0 22px;}
  .apv .apv-chapeau{font-size:19px;line-height:1.6;color:var(--fg-2);margin:0 0 8px;}
  .apv h2{font-family:var(--font-serif);font-weight:var(--weight-title);font-size:var(--text-title);line-height:1.2;
    letter-spacing:-.01em;margin:56px 0 16px;}
  .apv h3{font-size:16px;font-weight:600;margin:0 0 10px;color:var(--fg-2);}
  .apv p,.apv li{font-size:17px;line-height:1.7;color:var(--fg-2);}
  .apv p{margin:0 0 16px;}
  .apv strong{color:var(--fg-1);font-weight:600;}
  .apv ul{margin:0 0 16px;padding-left:22px;list-style:disc;}
  .apv li{margin:0 0 8px;}
  .apv hr{border:0;border-top:1px solid var(--border-1);margin:56px 0 28px;}
  .apv-methode p,.apv-methode li{font-size:14px;line-height:1.65;color:var(--fg-3);}
  .apv-tableau{overflow-x:auto;margin:4px 0 24px;}
  .apv table{border-collapse:collapse;width:100%;font-size:15px;}
  .apv th,.apv td{padding:9px 12px;border-bottom:1px solid var(--border-1);text-align:left;vertical-align:bottom;}
  .apv thead th{font-weight:600;color:var(--fg-2);font-size:13px;line-height:1.35;}
  .apv td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}
  .apv figure{margin:28px 0 32px;}
  .apv figure.apv-etroite{max-width:640px;}
  .apv-surface{background:var(--apv-fig);border-radius:10px;overflow:hidden;}
  .apv-surface img{display:block;width:100%;height:auto;}
  .apv figcaption,.apv .apv-legende{font-size:13.5px;line-height:1.6;color:var(--fg-3);margin:10px 2px 0;}
  .apv-bloc{margin:28px 0 32px;}
  .apv-bloc-visuels{display:grid;grid-template-columns:600fr 300fr;gap:20px;align-items:start;}
  .apv-bloc-visuels figure{margin:0;}
  .apv-v-clair{display:none;}
  :root{--apv-fig:#0d1322;}
  :root[data-theme="light"]{--apv-fig:#ffffff;}
  :root[data-theme="light"] .apv-v-clair{display:block;}
  :root[data-theme="light"] .apv-v-sombre{display:none;}
  @media (max-width:760px){
    .apv-bloc-visuels{grid-template-columns:1fr;gap:16px;}
    .apv-bloc-visuels .apv-communes{max-width:360px;}
  }
  @media (max-width:640px){
    .apv-page{padding:36px 16px 72px;}
    .apv .apv-chapeau{font-size:17.5px;}
    .apv p,.apv li{font-size:16.5px;}
    .apv table{font-size:14px;}
    .apv th,.apv td{padding:8px 6px;}
    .apv-bloc-visuels .apv-communes{max-width:none;}
  }
`;

// ── Légendes et textes alternatifs : relus dans le legendes.html de l'étude (une seule source) ─────────
export function texteHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

export function lecteurLegendes(h: string) {
  return {
    alt(fichier: string) {
      const m = h.match(new RegExp(`src="${fichier}"[^>]*?alt="([^"]+)"`, "s"));
      if (!m) throw new Error(`legendes.html : texte alternatif absent pour ${fichier}`);
      return texteHtml(m[1]);
    },
    bloc(re: RegExp) {
      const m = h.match(re);
      if (!m) throw new Error(`legendes.html : légende absente (${re})`);
      return texteHtml(m[1]);
    },
  };
}

// ── Un visuel : clair ou sombre selon le thème, version mobile sous 640 px ────────────────────────────
export function Visuel({ route, base, alt, largeur }: { route: string; base: string; alt: string; largeur: number }) {
  const src = (theme: string, mobile: boolean) => `${route}/${base}${mobile ? "_mobile" : ""}_${theme}.png`;
  return (
    <>
      {(["sombre", "clair"] as const).map((theme) => (
        <div key={theme} className={`apv-surface apv-v-${theme}`}>
          <picture>
            <source media="(max-width: 640px)" srcSet={src(theme, true)} />
            <img src={src(theme, false)} alt={alt} width={largeur} />
          </picture>
        </div>
      ))}
    </>
  );
}

// ── Markdown minimal : le sous-ensemble qu'emploient les articles (titres, gras, listes, tableau, filet) ──
// Un nombre ne se sépare pas de son unité (« 72 % », « 2,29 € », « 50 600 » restent sur une ligne).
const insecables = (s: string) =>
  s.replace(/(\d) (\d{3})/g, "$1 $2").replace(/(\d) (%|€|km|mètres|kilomètres|litres)/g, "$1 $2").replace(/(\d) m(?=[\s.,;:)]|$)/g, "$1 m");

function enLigne(s: string): ReactNode[] {
  return insecables(s).split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") ? <strong key={i}>{bindOrphans(part.slice(2, -2))}</strong> : bindOrphans(part),
  );
}

function Tableau({ lignes }: { lignes: string[] }) {
  const cellules = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const [tete, alignements, ...corps] = lignes;
  const aDroite = cellules(alignements).map((a) => a.endsWith(":"));
  return (
    <div className="apv-tableau">
      <table>
        <thead>
          <tr>{cellules(tete).map((c, i) => <th key={i} scope="col" className={aDroite[i] ? "num" : undefined}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {corps.map((l, r) => (
            <tr key={r}>
              {cellules(l).map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i} className={aDroite[i] ? "num" : undefined}>{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// `visuel(ligne, suivante, cle)` rend un emplacement `[…]` ; `absorbe` saute la ligne suivante (bloc de deux visuels).
export type RenduVisuel = (ligne: string, suivante: string | undefined, cle: string) => { noeud: ReactNode; absorbe?: boolean } | null;

export function ArticleEtude({ md, bandeau, visuel }: { md: string; bandeau: string; visuel: RenduVisuel }) {
  const blocs: ReactNode[] = [];
  const lignes = md.split("\n");
  let methode = false;
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    const k = `b${i}`;
    if (!l.trim()) continue;
    if (l.startsWith("# ")) blocs.push(<h1 key={k}>{bindOrphans(l.slice(2))}</h1>);
    else if (l.startsWith("## ")) blocs.push(<h2 key={k}>{bindOrphans(insecables(l.slice(3)))}</h2>);
    else if (l.startsWith("### ")) { methode = true; blocs.push(<h3 key={k}>{l.slice(4)}</h3>); }
    else if (l.trim() === "---") blocs.push(<hr key={k} />);
    else if (l.startsWith("[")) {
      const v = visuel(l, lignes[i + 1], k);
      if (!v) throw new Error(`Emplacement de visuel inconnu dans l'article : ${l}`);
      if (v.absorbe) i++;
      blocs.push(v.noeud);
    } else if (l.startsWith("|")) {
      const t: string[] = [];
      while (lignes[i]?.startsWith("|")) t.push(lignes[i++]);
      i--;
      blocs.push(<Tableau key={k} lignes={t} />);
    } else if (l.startsWith("- ")) {
      const items: string[] = [];
      while (lignes[i]?.startsWith("- ")) items.push(lignes[i++].slice(2));
      i--;
      blocs.push(<ul key={k}>{items.map((it, j) => <li key={j}>{enLigne(it)}</li>)}</ul>);
    } else if (l.startsWith("**") && l.trimEnd().endsWith("**") && !methode) {
      blocs.push(<p key={k} className="apv-chapeau"><strong>{bindOrphans(insecables(l.trim().slice(2, -2)))}</strong></p>);
    } else {
      blocs.push(<p key={k}>{enLigne(l)}</p>);
    }
  }

  // La méthode (après le filet) prend un corps plus petit.
  const filet = blocs.findIndex((b) => (b as { type?: unknown })?.type === "hr");
  return (
    <div className="apv">
      <style>{css}</style>
      <div className="apv-bandeau">{bandeau}</div>
      <article className="apv-page">
        {filet < 0 ? blocs : <>{blocs.slice(0, filet + 1)}<div className="apv-methode">{blocs.slice(filet + 1)}</div></>}
      </article>
    </div>
  );
}
