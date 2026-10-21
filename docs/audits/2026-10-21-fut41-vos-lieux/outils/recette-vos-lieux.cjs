// Recette visuelle de « Vos lieux » sur le banc /dev/vos-lieux : ordinateur et mobile, sombre et clair,
// débordement horizontal, clavier, texte réellement rendu.
const { chromium } = require('/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core');
const base = process.argv[2] || 'http://localhost:3141';
const out = process.argv[3];
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const errs = [];
  for (const [w, h] of [[1440, 900], [390, 844], [360, 780]]) for (const theme of ['dark', 'light']) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: theme });
    p.on('pageerror', e => errs.push(`${w} ${theme} pageerror ${e.message}`));
    await p.goto(base + '/dev/vos-lieux', { waitUntil: 'networkidle' });
    await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await p.waitForTimeout(300);
    const deb = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (deb > 0) errs.push(`${w} ${theme} : débordement horizontal de ${deb}px`);
    if (out) await p.screenshot({ path: `${out}/vos-lieux-${w}-${theme === 'dark' ? 'sombre' : 'clair'}.png`, fullPage: true });
    if (w === 1440 && theme === 'dark') {
      // Le texte rendu : chaque conclusion figée est affichée mot pour mot ; l'ancienne garde « 20 min ».
      const t = await p.evaluate(() => document.querySelector('main').innerText.replace(/\u00a0/g, ' '));
      for (const attendu of ['une gare à moins de 20 min aux abords', 'Votre projet a changé depuis cette analyse', 'lecture gratuite', "Aucune analyse n'est enregistrée", "Une nouvelle version de l'analyse est en préparation", 'ouvert par futur•e', 'Ajaccio', 'Analyse réalisée le', 'Ouvrir le dossier pour le mettre à jour', '(non examinée)', 'Rapport de territoire', 'reflète d\'anciens critères']) if (!t.includes(attendu)) errs.push(`texte absent : ${attendu}`);
      for (const banni of [/Analyse mise à jour le/, /version \d/, /Acheté le/, /Votre Projet/, /\bConclusion ·/]) if (banni.test(t)) errs.push(`texte à retirer encore présent : ${banni}`);
      if (/30 min/.test(t)) errs.push('une conclusion ancienne cite la valeur actuelle');
      // Liens : des <a> natifs vers les routes d'ouverture, aucun <Link> préchargé.
      const liens = await p.evaluate(() => [...document.querySelectorAll('main a')].map(a => a.getAttribute('href')));
      if (!liens.some(h => h.startsWith('/rapport/dossiers/ouvrir?id='))) errs.push('aucun lien d\'ouverture de dossier');
      const prefetch = await p.evaluate(() => performance.getEntriesByType('resource').filter(r => /rapport\/(dossiers\/ouvrir|territoire|residence)/.test(r.name)).map(r => r.name));
      if (prefetch.length) errs.push('une route qui écrit a été chargée sans clic : ' + prefetch);
      // Clavier : chaque lien d'ouverture est atteignable, avec un contour visible.
      const vus = new Set(); let contour = true;
      for (let i = 0; i < 80; i++) { await p.keyboard.press('Tab'); const r = await p.evaluate(() => { const a = document.activeElement; return [a?.getAttribute('href') ?? '', getComputedStyle(a).outlineStyle]; }); if (r[0]) vus.add(r[0]); if (r[0].startsWith('/rapport') && r[1] === 'none') contour = false; }
      const ouvertures = liens.filter(h => h.startsWith('/rapport/'));
      const manques = ouvertures.filter(h => !vus.has(h));
      if (manques.length) errs.push('liens non atteints au clavier : ' + manques.length);
      if (!contour) errs.push('focus sans contour sur un lien');
    }
    await p.close();
  }
  console.log(errs.length ? errs.join('\n') : 'aucune erreur'); await b.close();
})();
