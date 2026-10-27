// FUT-151 · Recette de la vraie page : ce que /ou-vivre et /comparateur AFFICHENT, bureau et mobile.
// Le parse et la synthèse sont simulés ; /api/comparateur-vie/match est la VRAIE route (vrai moteur, index
// réel, sans modèle) ; /ask est intercepté pour lire le corps envoyé, et reçoit une réponse simulée. Toute
// autre requête POST est bloquée : aucun modèle appelé, aucune écriture.
// Usage : CHROME=<chemin> node scripts/fut151/recette.mjs http://localhost:3151 <dossier-captures> [libellé]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const [base, dir, libelle = 'apres'] = process.argv.slice(2);
assert.match(base ?? '', /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
assert.ok(dir, 'dossier de captures');
mkdirSync(dir, { recursive: true });
const verifier = libelle === 'apres'; // sur la base, on capture le défaut sans l'affirmer

const SANS_FAVORABLE = "Aucun de ces territoires n'atteint un niveau favorable sur vos priorités : ce sont ceux qui s'en approchent le plus, avec leurs compromis.";
const CAS = [
  { id: 'feu-13', texte: 'Je veux être loin des feux de forêt, dans les Bouches-du-Rhône.', parsed: { reformulation: 'Vous cherchez une commune moins exposée à la météo des feux, dans les Bouches-du-Rhône.', hardConstraints: { departements: ['13'] }, preferences: [{ key: 'faible_risque_feu', weight: 3 }] }, synthese: 'repli' },
  { id: 'chaleur-84', texte: 'Des étés plus frais dans le Vaucluse.', parsed: { reformulation: 'Vous cherchez des étés plus frais dans le Vaucluse.', hardConstraints: { departements: ['84'] }, preferences: [{ key: 'faible_chaleur', weight: 3 }] }, synthese: 'simulee' },
  { id: 'feu-29-56', texte: 'Loin des feux, dans le Finistère ou le Morbihan.', parsed: { reformulation: 'Vous cherchez une commune moins exposée à la météo des feux, dans le Finistère ou le Morbihan.', hardConstraints: { departements: ['29', '56'] }, preferences: [{ key: 'faible_risque_feu', weight: 3 }] }, synthese: 'simulee' },
  { id: 'calme-culture-75', texte: 'Un cadre calme et de la culture, à Paris.', parsed: { reformulation: 'Vous cherchez un cadre calme et une offre culturelle, à Paris.', hardConstraints: { departements: ['75'] }, preferences: [{ key: 'cadre_calme', weight: 3 }, { key: 'acces_culture', weight: 2 }] }, synthese: 'simulee' },
];
const mesures = [];

async function navigateur(width) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 480, hasTouch: width < 480 });
  return { browser, page };
}

for (const f of CAS) {
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
      if (url.pathname === '/api/comparateur-vie/synthesize') {
        corps.synthese = req.postDataJSON();
        // Le premier cas fait tomber la synthèse : la page affiche son repli déterministe.
        if (f.synthese === 'repli') return route.fulfill({ status: 502, body: 'AI provider unavailable.' });
        return route.fulfill({ contentType: 'text/plain; charset=utf-8', body: 'Synthèse simulée pour la recette FUT-151.' });
      }
      if (url.pathname === '/api/comparateur-vie/ask') {
        corps.ask = req.postDataJSON();
        return route.fulfill({ json: { answer: 'Réponse simulée pour la recette FUT-151.', remaining: 1, routesToReport: false } });
      }
      bloques.push(url.pathname);
      return route.abort();
    });
    await page.addInitScript(() => { localStorage.setItem('futuree-consent', 'denied'); });
    await page.goto(`${base}/ou-vivre`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.waitForFunction(() => document.querySelector('textarea')?.placeholder.length > 3, null, { timeout: 30000 });
    await page.locator('textarea').first().fill(f.texte);
    await page.getByRole('button', { name: 'Explorer mes possibilités' }).click();
    const demander = page.getByRole('button', { name: 'Demander' });
    await demander.waitFor({ timeout: 60000 });
    await page.waitForFunction(() => !document.body.innerText.includes('Nous pesons'), null, { timeout: 30000 }).catch(() => {});

    const cartes = page.locator('article.card-answer');
    const n = await cartes.count();
    const textes = await cartes.allInnerTexts();
    const entete = (await page.locator('h2', { hasText: 'Les territoires à regarder.' }).locator('xpath=following-sibling::p[1]').innerText()).trim();
    const corpsPage = await page.locator('body').innerText();
    // AskFuture : la première question suggérée, pour lire le contexte réellement envoyé.
    const section = page.locator('section').filter({ has: demander });
    const chips = (await section.locator('button').allInnerTexts()).map((t) => t.trim()).filter((t) => t !== 'Demander');
    await section.locator('button', { hasText: chips[0] }).first().click();
    await page.getByText('Réponse simulée pour la recette FUT-151.').waitFor({ timeout: 15000 });

    const grille = page.locator('article.card-answer').first().locator('xpath=..');
    await grille.scrollIntoViewIfNeeded();
    await grille.screenshot({ path: `${dir}/${libelle}-${f.id}-${width}.png` });

    const lu = textes.map((t) => {
      const lignes = t.split('\n').map((x) => x.trim()).filter(Boolean);
      return {
        nom: lignes[1] ?? lignes[0],
        palier: lignes.find((x) => /CORRESPONDANCE|FAVORABLE|MESURÉES|À EXPLORER/.test(x)) ?? null,
        forces: lignes.filter((x, i) => lignes[i - 1] === '+').concat(lignes.filter((x) => x.startsWith('+ ')).map((x) => x.slice(2))),
        compromis: lignes.find((x) => x.startsWith('Compromis :')) ?? null,
        texte: lignes.join(' · '),
      };
    });
    const m = { id: f.id, width, n, entete, cartes: lu, chips, synthese: corps.synthese?.results?.map((r) => ({ nom: r.nom, reasons: r.reasons, sansPrioriteFavorable: r.sansPrioriteFavorable })), ask: corps.ask?.context?.territoires?.map((t) => ({ nom: t.nom, raisons: t.raisons, aucune_priorite_favorable: t.aucune_priorite_favorable })), repli: f.synthese === 'repli' ? corpsPage.includes(SANS_FAVORABLE) && corpsPage.includes(f.parsed.reformulation) : null, bloques, erreurs };
    mesures.push(m);

    if (verifier) {
      assert.deepEqual(erreurs, [], `${f.id} ${width} : erreurs de page`);
      assert.deepEqual(bloques, [], `${f.id} ${width} : requêtes bloquées`);
      assert.ok(corps.match, 'la vraie route match a servi');
      for (const c of lu) {
        // Le même critère n'est jamais à la fois un « + » et le compromis de la carte.
        for (const fo of c.forces) assert.ok(!c.compromis?.toLowerCase().includes(fo.toLowerCase()), `${f.id} ${c.nom} : ${fo}`);
      }
      if (f.id === 'feu-13') {
        assert.equal(entete, SANS_FAVORABLE);
        assert.equal(m.repli, true, 'le repli dit le message du moteur');
        for (const c of lu) {
          assert.equal(c.palier, 'AUCUNE PRIORITÉ FAVORABLE ICI', c.nom);
          assert.ok(!/moins propice aux feux/i.test(c.texte), `${c.nom} : point fort fabriqué`);
          assert.match(c.compromis ?? '', /propice aux feux|En échange/, c.nom);
        }
        for (const t of m.synthese) { assert.deepEqual(t.reasons, []); assert.equal(t.sansPrioriteFavorable, true); }
        for (const t of m.ask) { assert.deepEqual(t.raisons, []); assert.equal(t.aucune_priorite_favorable, true); }
      }
      if (f.id === 'chaleur-84') {
        assert.doesNotMatch(entete, /pourraient convenir/);
        const [a, ...autres] = lu;
        assert.match(a.palier, /CORRESPONDANCE/, a.nom);
        assert.ok(a.forces.some((x) => /étés plus frais/i.test(x)), a.nom);
        for (const c of autres) {
          assert.equal(c.palier, 'AUCUNE PRIORITÉ FAVORABLE ICI', c.nom);
          assert.ok(!c.forces.some((x) => /étés plus frais/i.test(x)), c.nom);
        }
      }
      if (f.id === 'feu-29-56') {
        assert.match(entete, /pourraient convenir/);
        for (const c of lu) {
          assert.match(c.palier, /CORRESPONDANCE/, c.nom);
          assert.ok(c.forces.some((x) => /moins propice aux feux/i.test(x)), c.nom);
        }
        for (const t of m.ask) assert.equal(t.aucune_priorite_favorable, false);
      }
      if (f.id === 'calme-culture-75') {
        assert.equal(lu[0].palier, 'PRIORITÉS EN PARTIE MESURÉES');
        assert.ok(!lu[0].forces.some((x) => /calme/i.test(x)), 'le calme non mesuré n’est pas une force');
      }
    }
    await browser.close();
  }
}

// ── Le comparateur (mode choix) : la synthèse des thèmes sur des trios réels ─────────────────────────
for (const [id, communes] of [['comparateur-chateauneuf', '13025,13040,13046'], ['comparateur-plouay', '29011,56166,29019']]) {
  for (const width of [1440, 390]) {
    const { browser, page } = await navigateur(width);
    const erreurs = [];
    const posts = [];
    page.on('pageerror', (e) => erreurs.push(e.message));
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== base || /ingest|posthog|_vercel/.test(url.pathname)) return route.abort();
      if (route.request().method() !== 'POST') return route.continue();
      posts.push(url.pathname);
      // Les routes qui appellent un modèle restent fermées ; le rendu de la page (actions serveur) passe.
      return /ask|synthes/.test(url.pathname) ? route.abort() : route.continue();
    });
    await page.addInitScript(() => { localStorage.setItem('futuree-consent', 'denied'); });
    await page.goto(`${base}/comparateur?communes=${communes}`, { waitUntil: 'networkidle', timeout: 180000 });
    // bindOrphans lie les petits mots par une espace insécable : on lit le texte comme un lecteur.
    const texte = (await page.locator('body').innerText()).replace(/\u00a0/g, ' ');
    await page.screenshot({ path: `${dir}/${libelle}-${id}-${width}.png`, fullPage: true });
    const syntheses = texte.split('\n').map((x) => x.trim()).filter((x) => / se distingue par | fait mieux que | se ressemblent/.test(x));
    mesures.push({ id, width, syntheses, posts, erreurs });
    if (verifier) {
      assert.deepEqual(erreurs, [], `${id} ${width}`);
      assert.ok(!posts.some((x) => /ask|synthes/.test(x)), `${id} ${width} : aucun appel modèle`);
      assert.ok(syntheses.length > 0, `${id} ${width} : synthèse de thème lue`);
      if (id === 'comparateur-plouay') {
        assert.ok(!syntheses.some((s) => /Plouay se distingue par son air pur/.test(s)), 'avance relative dite comme un point fort');
        assert.ok(syntheses.includes("Sur l'air, Plouay fait mieux que les deux autres, à un niveau intermédiaire."));
      }
      for (const s of syntheses.filter((x) => /fait mieux que/.test(x))) assert.match(s, /à un niveau intermédiaire\.$/);
    }
    await browser.close();
  }
}

writeFileSync(`${dir}/${libelle}-mesures.json`, JSON.stringify(mesures, null, 1) + '\n');
console.log(`${mesures.length} lectures, captures dans ${dir}`);
