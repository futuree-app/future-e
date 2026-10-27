// FUT-154 · Recette des vraies pages : les compromis que /ou-vivre, /comparateur et le Pack AFFICHENT, bureau et mobile.
// /api/comparateur-vie/match et le rendu du comparateur sont les VRAIS (vrai moteur, index réel) ; le parse et la
// synthèse sont simulés ; /ask est intercepté pour lire le corps envoyé. Toute autre requête POST vers une route
// de modèle est bloquée : aucun appel Anthropic, aucune écriture.
// Usage : CHROME=<chemin> node scripts/fut154/recette.mjs <http://localhost:prod> <http://localhost:dev> <dossier> [libellé]
//   prod : `next start` (pages publiques) ; dev : `next dev` (banc /dev/fut154, 404 en production).
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const [base, dev, dir, libelle = 'apres'] = process.argv.slice(2);
for (const u of [base, dev]) assert.match(u ?? '', /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
assert.ok(dir, 'dossier de captures');
mkdirSync(dir, { recursive: true });
const verifier = libelle.startsWith('apres'); // sur la base, on capture le défaut sans l'affirmer
const lisible = (t) => t.replace(/ /g, ' ');
const mesures = [];

async function navigateur(width) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 480, hasTouch: width < 480 });
  await page.addInitScript(() => { localStorage.setItem('futuree-consent', 'denied'); });
  return { browser, page };
}

// ── /ou-vivre : la carte « Compromis : … » ───────────────────────────────────────────────────────────
const TRANSPORTS = [{ key: 'acces_transports', weight: 3 }, { key: 'faible_dependance_auto', weight: 2 }, { key: 'acces_services', weight: 2 }];
const RECHERCHES = [
  { id: 'aubagne-13', texte: 'Le train, moins de voiture et des services, dans les Bouches-du-Rhône.', parsed: { reformulation: 'Vous cherchez le train, moins de voiture et des services, dans les Bouches-du-Rhône.', hardConstraints: { departements: ['13'] }, preferences: TRANSPORTS } },
  { id: 'villes-fr', texte: 'Le train, moins de voiture et des services.', parsed: { reformulation: 'Vous cherchez le train, moins de voiture et des services.', hardConstraints: {}, preferences: TRANSPORTS } },
  { id: 'montrejeau-31', texte: 'Loin des feux, en Haute-Garonne.', parsed: { reformulation: 'Vous cherchez une commune moins exposée à la météo des feux, en Haute-Garonne.', hardConstraints: { departements: ['31'] }, preferences: [{ key: 'faible_risque_feu', weight: 3 }] } },
  // Les reproductions de FUT-151, rejouées.
  { id: 'feu-13', texte: 'Je veux être loin des feux de forêt, dans les Bouches-du-Rhône.', parsed: { reformulation: 'Vous cherchez une commune moins exposée à la météo des feux, dans les Bouches-du-Rhône.', hardConstraints: { departements: ['13'] }, preferences: [{ key: 'faible_risque_feu', weight: 3 }] } },
  { id: 'bagneres-fr', texte: 'Respirer un air pur.', parsed: { reformulation: 'Vous cherchez un air plus pur.', hardConstraints: {}, preferences: [{ key: 'air_sain', weight: 3 }] } },
  { id: 'aytre-17', texte: 'Le train, moins de voiture et des services, en Charente-Maritime.', parsed: { reformulation: 'Vous cherchez le train, moins de voiture et des services, en Charente-Maritime.', hardConstraints: { departements: ['17'] }, preferences: TRANSPORTS } },
  { id: 'breil-06', texte: 'Des étés frais et des médecins, dans les Alpes-Maritimes.', parsed: { reformulation: 'Vous cherchez des étés plus frais et un bon accès aux soins, dans les Alpes-Maritimes.', hardConstraints: { departements: ['06'] }, preferences: [{ key: 'faible_chaleur', weight: 3 }, { key: 'acces_soins', weight: 2 }] } },
];

for (const f of RECHERCHES) {
  for (const width of [1440, 390]) {
    const { browser, page } = await navigateur(width);
    const corps = {};
    const bloques = [];
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push(e.message));
    await page.route('**/*', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.origin !== base || /ingest|posthog|_vercel/.test(url.pathname)) return route.abort();
      if (req.method() !== 'POST') return route.continue();
      if (url.pathname === '/api/comparateur-vie/parse') return route.fulfill({ json: { parsed: f.parsed } });
      if (url.pathname === '/api/comparateur-vie/match') { corps.match = true; return route.continue(); }
      if (url.pathname === '/api/comparateur-vie/synthesize') return route.fulfill({ contentType: 'text/plain; charset=utf-8', body: 'Synthèse simulée pour la recette FUT-154.' });
      if (url.pathname === '/api/comparateur-vie/ask') {
        corps.ask = req.postDataJSON();
        return route.fulfill({ json: { answer: 'Réponse simulée pour la recette FUT-154.', remaining: 1, routesToReport: false } });
      }
      bloques.push(url.pathname);
      return route.abort();
    });
    await page.goto(`${base}/ou-vivre`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.waitForFunction(() => document.querySelector('textarea')?.placeholder.length > 3, null, { timeout: 30000 });
    await page.locator('textarea').first().fill(f.texte);
    await page.getByRole('button', { name: 'Explorer mes possibilités' }).click();
    const demander = page.getByRole('button', { name: 'Demander' });
    await demander.waitFor({ timeout: 60000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Nous pesons'), null, { timeout: 30000 }).catch(() => {});
    const cartes = (await page.locator('article.card-answer').allInnerTexts()).map(lisible).map((t) => {
      const lignes = t.split('\n').map((x) => x.trim()).filter(Boolean);
      return { nom: lignes[1] ?? lignes[0], compromis: lignes.find((x) => x.startsWith('Compromis :')) ?? null };
    });
    const section = page.locator('section').filter({ has: demander });
    const chips = (await section.locator('button').allInnerTexts()).map((t) => t.trim()).filter((t) => t !== 'Demander');
    await section.locator('button', { hasText: chips[0] }).first().click();
    await page.getByText('Réponse simulée pour la recette FUT-154.').waitFor({ timeout: 15000 });
    const grille = page.locator('article.card-answer').first().locator('xpath=..');
    await grille.scrollIntoViewIfNeeded();
    await grille.screenshot({ path: `${dir}/${libelle}-${f.id}-${width}.png` });
    const m = { id: f.id, width, cartes, ask: corps.ask?.context?.territoires?.map((t) => ({ nom: t.nom, compromis: t.compromis })), bloques, erreurs };
    mesures.push(m);
    if (verifier) {
      assert.deepEqual(erreurs, [], `${f.id} ${width} : erreurs de page`);
      assert.deepEqual(bloques, [], `${f.id} ${width} : requêtes bloquées`);
      assert.ok(corps.match, 'la vraie route match a servi');
      const c = (nom) => { const x = cartes.find((y) => y.nom === nom); assert.ok(x, `${f.id} : ${nom} affichée`); return x.compromis; };
      if (f.id === 'aubagne-13') assert.equal(c('Aubagne'), 'Compromis : En échange, chaleur en hausse.');
      if (f.id === 'villes-fr') {
        assert.equal(c('Villeurbanne'), 'Compromis : En échange, chaleur en hausse.');
        for (const x of cartes) assert.doesNotMatch(x.compromis ?? '', /qu'à Strasbourg|qu'à Villeurbanne/, x.nom);
      }
      if (f.id === 'montrejeau-31') assert.equal(c('Montréjeau'), "Compromis : En échange, l'offre de soins est plus limitée qu'à Bagnères-de-Luchon.");
      if (f.id === 'feu-13') assert.equal(c('Châteauneuf-le-Rouge'), 'Compromis : En échange, météo plus souvent propice aux feux.');
      if (f.id === 'bagneres-fr') assert.doesNotMatch(c('Bagnères-de-Bigorre') ?? '', /sécheresse/);
      if (f.id === 'aytre-17') assert.doesNotMatch(c('Aytré') ?? '', /lieux de vie|vie locale/);
      if (f.id === 'breil-06') { const b = cartes.find((y) => y.nom === 'Breil-sur-Roya'); if (b) assert.doesNotMatch(b.compromis ?? '', /bruyant/); }
      // AskFuture (Où vivre) ne reçoit que la faiblesse absolue d'une priorité déclarée, jamais un comparatif.
      for (const t of m.ask ?? []) assert.doesNotMatch(t.compromis ?? '', / qu'à /, `${f.id} /ask ${t.nom}`);
    }
    await browser.close();
  }
}

// ── /comparateur (communes nommées) : les cartes « Côte à côte » et le corps d'AskFuture ────────────
const TRIOS = [
  ['anglet', '64445,64102,64024'], ['villes', '69266,67482,75101'], ['calme-95', '01165,01005,01199'],
  ['poligny', '39434,39300,39013'], ['plouay', '29011,56166,29019'], ['chateauneuf', '13025,13040,13046'],
];
for (const [id, communes] of TRIOS) {
  for (const width of [1440, 390]) {
    const { browser, page } = await navigateur(width);
    const erreurs = [];
    const posts = [];
    let ask = null;
    page.on('pageerror', (e) => erreurs.push(e.message));
    await page.route('**/*', (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.origin !== base || /ingest|posthog|_vercel/.test(url.pathname)) return route.abort();
      if (req.method() !== 'POST') return route.continue();
      posts.push(url.pathname);
      if (url.pathname === '/api/comparateur-vie/ask') {
        ask = req.postDataJSON();
        return route.fulfill({ json: { answer: 'Réponse simulée pour la recette FUT-154.', remaining: 1 } });
      }
      // Les routes qui appellent un modèle restent fermées ; le rendu de la page (actions serveur) passe.
      return /synthes/.test(url.pathname) ? route.abort() : route.continue();
    });
    await page.goto(`${base}/comparateur?communes=${communes}`, { waitUntil: 'networkidle', timeout: 180000 });
    const cote = page.locator('section', { hasText: 'Côte à côte' }).first();
    const cartes = (await cote.locator('.card-answer').allInnerTexts()).map(lisible).map((t) => {
      const lignes = t.split('\n').map((x) => x.trim()).filter(Boolean);
      return { nom: lignes[1], compromis: lignes.find((x) => x.startsWith('En échange,')) ?? null };
    });
    await cote.scrollIntoViewIfNeeded();
    await cote.screenshot({ path: `${dir}/${libelle}-comparateur-${id}-${width}.png` });
    // AskFuture du comparateur : la première question suggérée, pour lire les compromis réellement envoyés.
    const askSection = page.locator('section').filter({ has: page.getByPlaceholder('Posez votre question sur ces communes…') }).last();
    const suggestion = askSection.locator('button.rounded-full').first();
    if (await suggestion.count()) {
      await suggestion.click();
      await page.getByText('Réponse simulée pour la recette FUT-154.').waitFor({ timeout: 15000 }).catch(() => {});
    }
    const m = { id: `comparateur-${id}`, width, cartes, ask: ask?.context?.territoires?.map((t) => ({ nom: t.nom, compromis: t.compromis })) ?? null, posts, erreurs };
    mesures.push(m);
    if (verifier) {
      assert.deepEqual(erreurs, [], `${id} ${width}`);
      assert.ok(!posts.some((x) => /synthes/.test(x)), `${id} ${width} : aucune synthèse appelée`);
      assert.ok(cartes.length >= 2, `${id} : cartes lues`);
      assert.ok(m.ask, `${id} ${width} : AskFuture interrogé`);
      // Le modèle reçoit exactement le compromis que la carte affiche (vide compris).
      for (const t of m.ask) assert.equal(t.compromis || null, cartes.find((c) => c.nom === t.nom)?.compromis ?? null, `${id} ${t.nom}`);
      const c = (nom) => cartes.find((x) => x.nom === nom)?.compromis ?? null;
      if (id === 'anglet') assert.equal(c('Anglet'), null);
      if (id === 'villes') { assert.equal(c('Villeurbanne'), 'En échange, chaleur en hausse.'); assert.doesNotMatch(c('Paris') ?? '', /qu'à Villeurbanne/); }
      if (id === 'calme-95') for (const x of cartes) assert.doesNotMatch(x.compromis ?? '', /bruyant/, x.nom);
      if (id === 'poligny') for (const x of cartes) assert.doesNotMatch(x.compromis ?? '', /(air|soins).* qu'à Poligny/, x.nom);
    }
    await browser.close();
  }
}

// ── Le Pack Décision (banc /dev/fut154, serveur de développement) ────────────────────────────────────
for (const cas of ['pays-basque', 'fraicheur']) {
  for (const width of [1440, 390]) {
    const { browser, page } = await navigateur(width);
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push(e.message));
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== dev || /ingest|posthog|_vercel/.test(url.pathname)) return route.abort();
      return route.request().method() === 'POST' ? route.abort() : route.continue();
    });
    await page.goto(`${dev}/dev/fut154?cas=${cas}`, { waitUntil: 'networkidle', timeout: 300000 });
    const pistes = page.locator('section', { hasText: 'Trois nouvelles pistes' }).first();
    await pistes.waitFor({ timeout: 120000 });
    const lu = await pistes.locator('.glass').evaluateAll((els) => els.map((el) => {
      const filets = [...el.querySelectorAll('p')].filter((p) => p.className.includes('border-t'));
      return { nom: el.querySelector('h4')?.textContent?.trim(), filets: filets.map((p) => p.textContent.trim()), hauteurFilets: filets.map((p) => p.getBoundingClientRect().height) };
    }));
    await pistes.scrollIntoViewIfNeeded();
    await pistes.screenshot({ path: `${dir}/${libelle}-pack-${cas}-${width}.png` });
    mesures.push({ id: `pack-${cas}`, width, pistes: lu, erreurs });
    if (verifier) {
      assert.deepEqual(erreurs, [], `pack ${cas} ${width}`);
      for (const p of lu) for (const t of p.filets) assert.ok(t.length > 0, `pack ${cas} ${p.nom} : filet vide`);
      const sans = cas === 'pays-basque' ? 'Hendaye' : 'Bagnères-de-Bigorre';
      const x = lu.find((p) => p.nom === sans);
      assert.ok(x, `${sans} en piste`);
      assert.deepEqual(x.filets, [], `${sans} : aucun compromis, aucun filet`);
    }
    await browser.close();
  }
}

writeFileSync(`${dir}/${libelle}-mesures.json`, JSON.stringify(mesures, null, 1) + '\n');
console.log(`${mesures.length} lectures, captures dans ${dir}`);
