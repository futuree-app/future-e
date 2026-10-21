// Robustesse du premier écran mobile : noms longs, texte plus long, plusieurs hauteurs ; avec et sans la bande de démonstration.
const { chromium } = require('/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core');
const html = 'file:///Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/fut41-cadrage/docs/audits/2026-10-20-fut41-centre-de-decision/' + (process.argv[2] || 'prototype-v3-3.html');
const LONG = `POSS.kervily.court = "12 bis avenue du Général-de-Gaulle-et-de-la-Libération"; COMMUNES["saint-aurec"].nom = "Saint-Rémy-de-Provence-sur-Mer"; POSS.sternes.court = "Résidence Les Hauts-de-Kerlouan, bâtiment C"; rendre();`;
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const lignes = [];
  for (const sit of ['premier', 'deuxieme', 'enrichie', 'bloquant']) for (const longs of [false, true]) for (const demo of [true, false]) {
    const r = [];
    for (const [w, h] of [[320, 568], [360, 640], [360, 780], [375, 667], [390, 844], [414, 896]]) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto(html + '?situation=' + sit); await p.waitForTimeout(80);
      if (longs) await p.evaluate(LONG);
      if (!demo) await p.evaluate(() => { document.querySelector('#demo').style.display = 'none'; });
      const y = await p.evaluate(() => { const t = document.querySelector('.tuile:not(.tuile-ajout) .t-nom'); return t ? Math.round(t.getBoundingClientRect().bottom) : null; });
      const g = await p.evaluate(() => { const t = document.querySelector('[data-fk="geste"]'); return t ? Math.round(t.getBoundingClientRect().bottom) : null; });
      r.push(`${w}×${h}: lieu ${y}${y > h ? '✗' : ` (marge ${h - y})`} · geste ${g}${g > h ? '✗' : ''}`);
      await p.close();
    }
    lignes.push(`${sit}${longs ? ' · noms longs' : ''}${demo ? ' · avec bande démo' : ' · sans bande (produit)'}\n  ` + r.join('\n  '));
  }
  console.log(lignes.join('\n')); await b.close();
})();
