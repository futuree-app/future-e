// FUT-118 · EMPREINTE VISUELLE : prouver qu'un lot ne change rien à l'écran.
//
// Pour chaque page × largeur × thème : une capture pleine page (PNG) et le style CALCULÉ de chaque
// élément visible (couleurs, police, axe de largeur, tailles, interlignes, espacements, bordures,
// boîte). Deux passes (avant, après) se comparent avec `comparer-empreintes.mjs` : pixel par pixel et
// propriété par propriété.
//
// Serveur local uniquement, aucun clic, aucune saisie. Mouvement réduit pour figer les transitions.
// Usage : node scripts/fut118/empreinte-visuelle.mjs <dossier-de-sortie> [base=http://localhost:3118]
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const [sortie, base = "http://localhost:3118"] = process.argv.slice(2);
if (!sortie) throw new Error("Dossier de sortie requis.");
if (!base.startsWith("http://localhost")) throw new Error("Serveur local seulement.");
mkdirSync(sortie, { recursive: true });

export const PAGES = [
  ["accueil", "/"],
  ["decision-classique", "/dev/fut91?vue=classique&pane=1&artefact=1"],
  ["decision-releve", "/dev/fut91?vue=releve&pane=1&artefact=1"],
  ["decision-releve-etats", "/dev/fut91?vue=releve&pane=1&artefact=1&projet=1&etat=unavailable"],
  ["decision-classique-etats", "/dev/fut91?vue=classique&pane=1&artefact=1&projet=1&etat=unavailable"],
  ["rapport-gabarit-releve", "/dev/fut92"],
  ["logement-production", "/dev/fut87/avant/logement"],
  ["logement-prototype-releve", "/dev/fut87/logement"],
  ["page-commune-chaleur", "/chaleur/30189"],
  ["qualification", "/dossier"],
  ["connexion", "/connexion"],
  ["temoin-territoire", "/dev/fut118/territoire"],
  ["temoin-paiement", "/dev/fut118/paiement?etape=paiement"],
];
// FUT-125 · UN LOT PEUT NE RELEVER QUE SES PAGES : `EMPREINTE_PAGES` (JSON, `[[nom, chemin], …]`) remplace la
// liste ci-dessus, pour prouver qu'une présentation donnée (le classique) ne bouge pas sur les cas du lot.
const PAGES_RELEVEES = process.env.EMPREINTE_PAGES ? JSON.parse(process.env.EMPREINTE_PAGES) : PAGES;
const LARGEURS = [1440, 390];
const THEMES = ["dark", "light"];

const PROPRIETES = [
  "color", "background-color", "font-family", "font-size", "font-weight", "font-variation-settings",
  "font-style", "line-height", "letter-spacing", "text-transform", "padding", "margin", "border-top",
  "border-right", "border-bottom", "border-left", "border-radius", "box-shadow", "opacity", "display",
  "grid-template-columns", "gap", "outline",
];

const navigateur = await chromium.launch({
  executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
for (const [nom, chemin] of PAGES_RELEVEES) {
  for (const largeur of LARGEURS) {
    for (const theme of THEMES) {
      const page = await navigateur.newPage({ viewport: { width: largeur, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
      await page.addInitScript((t) => {
        try { localStorage.setItem("futuree-consent", "denied"); localStorage.setItem("futuree-theme", t); } catch {}
      }, theme);
      await page.goto(base + chemin, { waitUntil: "networkidle", timeout: 180000 }).catch(() => {});
      await page.waitForTimeout(1200);
      // Les animations sont FIGÉES dans les deux passes : plusieurs fonds (orbes de la connexion, des
      // pages commune, du gabarit /rapport) bougent même en mouvement réduit, et rendraient deux
      // passes identiques différentes. Les comparaisons se font dans les mêmes conditions.
      // Le bandeau des bancs de développement (`BandeauPrototype`) est masqué dans les deux passes : il
      // n'existe pas en production, et il est posé hors de toute racine `.releve` sur certains bancs.
      await page.addStyleTag({ content: "nextjs-portal, [class*='bandeauProto'] { display: none !important; } *, *::before, *::after { caret-color: transparent !important; animation: none !important; transition: none !important; }" }).catch(() => {});
      await page.waitForTimeout(300);
      const styles = await page.evaluate((props) => {
        const out = [];
        const chemin = (el) => {
          const p = [];
          for (let e = el; e && e !== document.body; e = e.parentElement) {
            const i = e.parentElement ? Array.prototype.indexOf.call(e.parentElement.children, e) : 0;
            p.unshift(`${e.tagName.toLowerCase()}:${i}`);
          }
          return p.join(">");
        };
        for (const el of document.body.querySelectorAll("*")) {
          if (el.closest("nextjs-portal, script, style, noscript")) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          const cs = getComputedStyle(el);
          const e = { k: chemin(el), b: [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)] };
          for (const p of props) e[p] = cs.getPropertyValue(p);
          for (const pseudo of ["::before", "::after"]) {
            const ps = getComputedStyle(el, pseudo);
            if (ps.content && ps.content !== "none") e[pseudo] = [ps.content, ps.color, ps.backgroundColor, ps.width, ps.height, ps.borderTop].join("|");
          }
          out.push(e);
        }
        return out;
      }, PROPRIETES);
      const id = `${nom}-${largeur}-${theme}`;
      await page.screenshot({ path: `${sortie}/${id}.png`, fullPage: true });
      writeFileSync(`${sortie}/${id}.json`, JSON.stringify(styles));
      console.log(`${id}\t${styles.length} éléments`);
      await page.close();
    }
  }
}
await navigateur.close();
