// Captures du prototype FUT-190 (hors du dépôt : le serveur de dev surveille le dépôt).
// Usage : node shots.cjs <dossier> [filtre]
const path = require("path");
const fs = require("fs");
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/fut190-envies/node_modules/playwright-core");
const BASE = process.env.BASE ?? "http://localhost:3190/dev/envies";
const SORTIE = process.argv[2];
const FILTRE = process.argv[3] ?? "";
fs.mkdirSync(SORTIE, { recursive: true });

const VUES = [
  ["01-ensemble-depart", "?s=depart", null],
  ["02-projet-saisie", "?s=depart#/projet", async (p) => { await p.fill("input[placeholder]", "aller plus souvent au théâtre"); await p.getByRole("button", { name: "Un peu, j'en voudrais plus" }).click(); await p.getByRole("button", { name: "chaque mois" }).click(); }],
  ["03-comparer-theatre-mois", "?s=theatre", null],
  ["04-comparer-theatre-semaine", "?s=theatre", async (p) => { await p.getByRole("button", { name: "chaque semaine" }).click(); }],
  ["05-comparer-potager", "?s=potager", null],
  ["06-comparer-nager", "?s=nager", null],
  ["07-comparer-trois", "?s=trois", null],
  ["08-comparer-libre", "?s=libre", null],
  ["09-comparer-apres-verifications", "?s=apres", null],
  ["10-fiche-chalonnes", "?s=trois#/lieu/chalonnes", null],
  ["11-ensemble-trois", "?s=trois#/", null],
  ["12-minimale-trois", "?s=trois", async (p) => { await p.getByRole("button", { name: "minimale (moteur actuel)" }).click(); }],
  ["13-projet-trois", "?s=trois#/projet", null],
];

(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const bilan = [];
  for (const [largeur, hauteur] of [[1440, 900], [390, 844]]) {
    for (const theme of ["light", "dark"]) {
      if (theme === "dark" && !process.env.SOMBRE) continue;
      const ctx = await b.newContext({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: 1, reducedMotion: "reduce" });
      await ctx.route((u) => !/^https?:\/\/localhost(:\d+)?\//.test(u.href), (r) => r.abort());
      const p = await ctx.newPage();
      const erreurs = [];
      p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) erreurs.push(m.text().slice(0, 200)); });
      p.on("pageerror", (e) => erreurs.push(String(e).slice(0, 200)));
      for (const [nom, url, geste] of VUES) {
        if (FILTRE && !nom.includes(FILTRE)) continue;
        await p.goto(BASE + url, { waitUntil: "domcontentloaded" });
        await p.waitForSelector("[data-titre-vue]", { timeout: 60000 });
        await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
        const refus = p.getByRole("button", { name: /refuser/i }); if (await refus.count()) await refus.first().click().catch(() => {});
        await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
        if (geste) await geste(p);
        await p.waitForTimeout(250);
        const large = await p.evaluate(() => [...document.querySelectorAll("main *")].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 4).map((e) => e.className + " " + Math.round(e.getBoundingClientRect().right))); if (large.length) console.log(nom, largeur, large);
        const m = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, deborde: document.documentElement.scrollWidth > window.innerWidth + 1, texte: document.querySelector("main").innerText }));
        const interdit = /\b(meilleure?s?|gagnant|recommand\w*|score|au total|classé)\b/i.exec(m.texte.replace(/aucun score/gi, ""));
        bilan.push({ nom, largeur, theme, hauteur: m.h, deborde: m.deborde, interdit: interdit?.[0] ?? null, cadratin: /—/.test(m.texte), exclamation: /!/.test(m.texte) });
        await p.screenshot({ path: path.join(SORTIE, `${nom}-${largeur}-${theme === "light" ? "clair" : "sombre"}.png`), fullPage: true });
      }
      if (erreurs.length) bilan.push({ erreurs: [...new Set(erreurs)] });
      await ctx.close();
    }
  }
  await b.close();
  fs.writeFileSync(path.join(SORTIE, "bilan.json"), JSON.stringify(bilan, null, 1));
  const pb = bilan.filter((x) => x.deborde || x.interdit || x.cadratin || x.exclamation || x.erreurs);
  console.log(`${bilan.length} vues ; problèmes : ${JSON.stringify(pb)}`);
})();
