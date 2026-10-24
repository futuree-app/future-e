import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = process.argv[2];
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const dossier = 'docs/audits/2026-10-23-revue-finale';

const mesures = [];
for (const nom of ['inondation-soins', 'inondation-seule']) {
 const session = JSON.parse(readFileSync(`${dossier}/${nom}-session.json`, 'utf8'));
 session.synthesis = readFileSync(`${dossier}/${nom}-synthese.txt`, 'utf8');
 session.savedAt = Date.now();
 for (const width of [1440, 390, 360]) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 480, isMobile: width < 480, deviceScaleFactor: 1 });
  await page.route('**/*', async r => {
   if (r.request().method() !== 'GET' || new URL(r.request().url()).origin !== base || /ingest|posthog/.test(r.request().url())) return r.abort();
   try {
    const response = await fetch(r.request().url());
    const headers = Object.fromEntries(response.headers); delete headers['content-encoding']; delete headers['content-length'];
    await r.fulfill({ status: response.status, headers, body: Buffer.from(await response.arrayBuffer()) });
   } catch { await r.abort(); }
  });
  await page.addInitScript(s => { localStorage.setItem('futuree-consent', 'denied'); localStorage.setItem('futuree:ouvivre:session', JSON.stringify(s)); }, session);
  await page.goto(`${base}/ou-vivre`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.addStyleTag({ content: 'nextjs-portal {display:none!important}' });
  const cards = page.locator('article.card-answer');
  await cards.first().waitFor();
  assert.equal(await cards.count(), 3);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  if (nom === 'inondation-seule') {
   assert.equal(await cards.getByText(/autres caractéristiques de la commune/i).count(), 3);
   assert.equal(await cards.getByText(/Forte correspondance/).count(), 0);
   await cards.first().locator('summary').click();
   assert.equal(await cards.first().locator('details').getAttribute('open'), '');
  } else {
   assert.equal(await cards.getByText(/sur vos autres critères/i).count(), 3);
  }
  const text = await page.locator('body').innerText();
  assert.ok(text.includes(session.synthesis));
  await page.screenshot({ path: `${dossier}/${nom}-${width}.png`, fullPage: true });
  mesures.push({ nom, width, debordement: 0, syntheseReelle: true, cartes: 3 });
  await browser.close();
 }
}
writeFileSync(`${dossier}/mesures-visuelles.json`, JSON.stringify(mesures,null,2));
console.log(JSON.stringify(mesures));
