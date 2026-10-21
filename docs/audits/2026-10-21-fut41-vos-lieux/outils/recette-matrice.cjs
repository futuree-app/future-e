// Fixtures du banc existant, aucun compte ni service externe. Exécuter depuis la racine du dépôt.
const { chromium, webkit } = require('playwright-core');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [base = 'http://127.0.0.1:3141', out = '/tmp/recette', stage = 'apres'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const results = [];
  for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
    const browser = await browserType.launch({ headless: true });
    try {
      for (const width of [1440, 390, 360]) for (const theme of ['dark', 'light']) {
        const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 1000 : 844 }, deviceScaleFactor: 2, colorScheme: theme });
        // Les appels tiers sont interdits, même analytiques. Le banc ne lit aucune donnée distante.
        await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
        await context.addInitScript(t => localStorage.setItem('futuree-theme', t), theme);
        const page = await context.newPage();
        const writes = [];
        page.on('request', r => { if (/\/rapport\/(dossiers\/ouvrir|territoire|residence)/.test(r.url())) writes.push(r.url()); });
        await page.goto(base + '/dev/vos-lieux', { waitUntil: 'networkidle' });
        await page.getByRole('heading', { name: 'Vos lieux', exact: true }).waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'débordement');
        const text = (await page.locator('main').innerText()).replace(/\u00a0/g, ' ');
        for (const s of ['une gare à moins de 20 min aux abords', 'Votre projet a changé depuis cette analyse', 'Rapport de territoire', 'Commune, abords et logement examinés', 'Échelles examinées non connues', '(non examinée)', 'Analyse réalisée le']) assert.ok(text.includes(s), s);
        assert.ok(!text.includes('30 min'), 'pas de recomposition selon le projet actuel');
        if (stage === 'apres') assert.ok(!text.includes('Analyse mise à jour le'), 'V2 ne prouve pas une actualisation');
        const rows = page.locator('main li').filter({ has: page.locator('h2') });
        assert.equal(await rows.count(), 9);
        const unknown = rows.filter({ has: page.getByRole('heading', { name: 'Vannes', exact: true }) });
        assert.equal(await unknown.locator('figure svg').count(), 0, 'inconnu ne simule aucun état');
        const measurements = await rows.evaluateAll(list => list.map(li => {
          const svg = li.querySelector('figure svg');
          return { title: li.querySelector('h2').textContent, svgWidth: svg?.getBoundingClientRect().width,
            traces: svg ? [...svg.querySelectorAll(':scope > circle, :scope > rect')].slice(0,3).map(el => {
              const css = getComputedStyle(el), scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
              return { stroke: css.stroke, width: css.strokeWidth, pixels: parseFloat(css.strokeWidth) * (css.vectorEffect === 'non-scaling-stroke' ? 1 : scale), dash: css.strokeDasharray, vectorEffect: css.vectorEffect };
            }) : [] };
        }));
        if (stage === 'apres') {
          for (const row of measurements) for (const tr of row.traces) assert.ok(tr.pixels >= 1, 'trait au moins 1 px écran');
          const withFinding = measurements.find(r => r.title.includes('Sternes'));
          assert.ok(withFinding.traces[0].pixels > withFinding.traces[1].pixels, 'constat distinct de sans constat');
          assert.equal(withFinding.traces[1].dash, 'none');
          assert.ok(measurements[0].traces[1].dash !== 'none', 'non examinée pointillée');
        }
        const links = await page.locator('main a').evaluateAll(as => as.map(a => a.getAttribute('href')));
        assert.ok(links.includes('/rapport/territoire?insee=30189'));
        assert.ok(links.includes('/rapport/dossiers/ouvrir?id=00000000-0000-4000-8000-000000000001&vers=dossier'));
        assert.equal(writes.length, 0, 'aucun préchargement de route qui écrit');
        await page.screenshot({ path: path.join(out, `${stage}-${engine}-${width}-${theme}.png`), fullPage: true });
        for (const [name, match] of [['trois', '12 rue des Sternes'], ['sans-constat', '5 allée des Goélands'], ['non-examinees', "8 rue d'Exemple"], ['inconnu', 'Vannes']]) {
          await rows.filter({ hasText: match }).screenshot({ path: path.join(out, `${stage}-${engine}-${width}-${theme}-${name}.png`) });
        }
        results.push({ engine, version: browser.version(), width, theme, rows: measurements, links: links.length, automaticOpenRequests: writes });
        await context.close();
      }
    } finally { await browser.close(); }
  }
  fs.writeFileSync(path.join(out, `${stage}-results.json`), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ stage, combinations: results.length, status: 'PASS' }));
})().catch(e => { console.error(e); process.exitCode = 1; });
