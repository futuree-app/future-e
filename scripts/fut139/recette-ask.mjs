// FUT-139 · Recette de la vraie page : les chips et placeholders d'AskFuture rendus pour quatre résultats du
// vrai moteur (fixtures.json, cf. generer-fixtures.mts). Parse, match et synthèse sont simulés ; toute autre
// requête POST (dont /ask) est bloquée : aucun modèle appelé, aucune écriture.
// Usage : CHROME=<chemin> node scripts/fut139/recette-ask.mjs http://localhost:3139
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { modeQuestions, questionsSuggerees, placeholdersAsk, enteteAsk } from '../../src/lib/comparateur/questions-ask.ts';

const base = process.argv[2];
assert.match(base ?? '', /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const dir = 'docs/audits/2026-10-26-fut139-questions-ask';
const fixtures = JSON.parse(readFileSync(`${dir}/fixtures.json`, 'utf8'));
const VICTOIRE = /arbitrage|plutôt que|devant|en premier|ressort|la plus|le plus|meilleur|correspond|adaptée|gagner|vraiment pesé|écarte|laquelle|quelle commune|les séparent/i;
const mesures = [];

for (const [id, f] of Object.entries(fixtures)) {
  for (const width of [1440, 390]) {
    const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 480, hasTouch: width < 480 });
    const appels = [];
    const bloques = [];
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push(e.message));
    await page.route('**/*', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.origin !== base || /ingest|posthog|_vercel/.test(url.pathname)) return route.abort();
      if (req.method() !== 'POST') return route.continue();
      appels.push(url.pathname);
      if (url.pathname === '/api/comparateur-vie/parse') return route.fulfill({ json: { parsed: f.parsed } });
      if (url.pathname === '/api/comparateur-vie/match') return route.fulfill({ json: f.outcome });
      if (url.pathname === '/api/comparateur-vie/synthesize') return route.fulfill({ contentType: 'text/plain; charset=utf-8', body: 'Synthèse simulée pour la recette FUT-139.' });
      bloques.push(url.pathname);
      return route.abort();
    });
    await page.addInitScript(() => { localStorage.setItem('futuree-consent', 'denied'); });
    try {
      await page.goto(`${base}/ou-vivre`, { waitUntil: 'networkidle', timeout: 180000 });
      await page.waitForFunction(() => document.querySelector('textarea')?.placeholder.length > 3, null, { timeout: 30000 });
      await page.locator('textarea').first().fill(f.texte);
      await page.getByRole('button', { name: 'Explorer mes possibilités' }).click();
      const demander = page.getByRole('button', { name: 'Demander' });
      await demander.waitFor({ timeout: 30000 });
      const section = page.locator('section').filter({ has: demander });

      const top = f.outcome.results.slice(0, 3);
      const mode = modeQuestions(f.outcome, top);
      const attendues = questionsSuggerees(top, mode, null);
      const pool = placeholdersAsk(top, mode, f.parsed.preferences.map((p) => p.key));
      const chips = (await section.locator('button').allInnerTexts()).map((t) => t.trim()).filter((t) => t !== 'Demander');
      assert.deepEqual(chips, attendues, `${id} : chips rendues`);

      // La machine à écrire : chaque état observé est un début d'une entrée du pool calculé.
      const vus = new Set();
      const champ = section.locator('textarea');
      for (let i = 0; i < 60; i++) {
        const ph = ((await champ.getAttribute('placeholder')) ?? '').replace(/▌$/, '');
        if (ph) { assert.ok(pool.some((q) => q.startsWith(ph)), `${id} : placeholder hors pool « ${ph} »`); vus.add(ph); }
        await page.waitForTimeout(150);
      }
      const complets = pool.filter((q) => vus.has(q));
      if (mode !== 'classe') for (const q of [...chips, ...pool]) assert.doesNotMatch(q, VICTOIRE, `${id} : ${q}`);
      const entete = enteteAsk(mode, top.length);
      const rendu = { surtitre: (await section.locator('p').first().innerText()).trim(), titre: (await section.locator('h2').innerText()).trim(), invite: (await section.locator('p').nth(1).innerText()).replace(/\u00a0/g, ' ').trim() };
      assert.deepEqual({ ...rendu, surtitre: rendu.surtitre.toLowerCase() }, { ...entete, surtitre: entete.surtitre.toLowerCase() }, `${id} : en-tête rendu`);
      if (mode !== 'classe') for (const q of Object.values(entete)) assert.doesNotMatch(q, VICTOIRE, `${id} : ${q}`);

      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'débordement horizontal');
      await page.addStyleTag({ content: 'nextjs-portal {display:none!important}' });
      await section.screenshot({ path: `${dir}/${id}-${width}.jpg`, type: 'jpeg', quality: 80 });
      assert.deepEqual(bloques, []);
      assert.deepEqual(erreurs, []);
      mesures.push({ id, width, mode, communes: top.map((r) => r.nom), entete: rendu, chips, placeholdersComplets: complets, pool, appels });
      console.log(`${id}-${width} OK (${mode}) : ${rendu.titre} | ${chips.join(' · ')}`);
    } finally {
      await browser.close();
    }
  }
}
writeFileSync(`${dir}/mesures.json`, JSON.stringify({ base, recette: 'fixtures du vrai moteur, API simulées, aucun modèle appelé', mesures }, null, 2) + '\n');
