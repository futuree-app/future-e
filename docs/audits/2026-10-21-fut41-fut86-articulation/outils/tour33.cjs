const { chromium } = require('/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core');
const html = 'file:///Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/fut41-cadrage/docs/audits/2026-10-20-fut41-centre-de-decision/prototype-v3-3.html';
const SITS = ['rapport-commune','rapport-adresse','residence','vide','premier','deuxieme','enrichie','deux','horscadre','meme','libre','bloquant','dix','mois'];
const TECH = /révision|moteur|engine|hors cadre|cadre\b/i;
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const errs = [], mesures = [];
  const ouvrir = async (w, h, sit, opts = {}) => {
    const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: 'dark', reducedMotion: opts.rm ? 'reduce' : 'no-preference' });
    p.on('pageerror', e => errs.push(`${w} ${sit} pageerror ${e.message}`)); p.on('console', m => { if (m.type() === 'error') errs.push(`${w} ${sit} ${m.text()}`); });
    await p.goto(html + '?situation=' + sit); await p.waitForTimeout(120); return p;
  };
  const hs = async (p, n) => { const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (o > 0) errs.push(`${n}: défilement horizontal de ${o}px`); };
  const tech = async (p, n) => { const t = await p.evaluate(() => document.querySelector('#vue').innerText); const m = t.match(/.{0,40}(révision|moteur|engine|hors cadre).{0,30}/i); if (m) errs.push(`${n}: vocabulaire technique au premier niveau : « ${m[0].replace(/\n/g, ' ')} »`); };
  const H = { 1440: 900, 1024: 768, 820: 1180, 390: 844, 360: 780 };
  for (const w of [1440, 1024, 820, 390, 360]) for (const sit of SITS) {
    const p = await ouvrir(w, H[w], sit);
    if (sit.startsWith('rapport')) { await hs(p, `${w} ${sit} rapport`); await p.click('[data-fk="pont"]'); }
    if (sit === 'residence') { await p.close(); continue; }
    await hs(p, `${w} ${sit} accueil`); await tech(p, `${w} ${sit} accueil`);
    const y = await p.evaluate(() => { const t = document.querySelector('.tuile:not(.tuile-ajout) .t-nom'); return t ? Math.round(t.getBoundingClientRect().bottom) : null; });
    if (w <= 390 || w === 1440) mesures.push(`${w}×${H[w]} ${sit} : nom du premier lieu à ${y ?? '—'} px${y && y > H[w] ? ' (SOUS LE PLI)' : ''}`);
    const ids = await p.evaluate(() => actives().map(x => x.id));
    // Chaque lieu : la fiche, un fait, sa documentation, le retour.
    for (const id of ids.slice(0, 4)) {
      await p.click(`[data-fk="tuile-${id}"]`); await hs(p, `${w} ${sit} fiche ${id}`); await tech(p, `${w} ${sit} fiche ${id}`);
      const mf = await p.evaluate((id) => { const q = P(id); return [...document.querySelectorAll('.fait')].filter(el => { const crit = el.id.replace('fait-', ''); const r = lirePlusFin(q, crit); const t = el.querySelector('.marge-p')?.innerText ?? ''; if (r.source && !t.includes(sourceCourte(r.source))) return true; if ((ETAB.has(r.issue) || r.issue === 'to_confirm') && !t.includes(OU_COURT[r.ech])) return true; return false; }).map(e => e.id); }, id);
      if (mf.length) errs.push(`${w} ${sit} fiche ${id} : marge fausse ${mf}`);
      const ec = await p.evaluate((id) => { const q = P(id); return document.querySelector('.tete-lieu .t-prof').innerText === MOTS_CONNU(q)[etatConnu(q)]; }, id);
      if (!ec) errs.push(`${w} ${sit} fiche ${id} : état de connaissance mal dit`);
      const cdf = await p.evaluate(() => document.querySelector('.conclusion-d .cd-texte')?.innerText ?? null);
      if (cdf && await p.locator('[data-fk="releve"]').count()) {
        await p.click('[data-fk="releve"]');
        const rv = await p.evaluate(() => [document.querySelector('.rv-verdict')?.innerText, S.rapport]);
        if (rv[0] !== cdf || rv[1] !== id) errs.push(`${w} ${sit} ${id} : conclusion de la fiche ≠ Relevé (« ${cdf} » / « ${rv[0]} »)`);
        await p.click('[data-fk="fil-lieu"]');
        if ((await p.evaluate(() => [S.vue, S.lieu].join()) ) !== `lieu,${id}`) errs.push(`${w} ${sit} ${id} : le retour du Relevé ne ramène pas au même lieu`);
      }
      const f = p.locator('.fait .f-ligne > button').first();
      if (await f.count()) { await f.click(); await hs(p, `${w} ${sit} fait ${id}`); const d = p.locator('[data-act="doc"]').first(); if (await d.count()) { await d.click(); await hs(p, `${w} ${sit} doc ${id}`); } }
      await p.click('[data-fk="fil-accueil"]');
    }
    if (sit.startsWith('rapport')) { await p.close(); continue; }
    // Comparer : par le geste principal à deux lieux, par le choix au-delà.
    if (ids.length === 2) await p.click('[data-fk="geste"]');
    else if (ids.length > 2) { await p.click('[data-fk="choix"]'); await p.click(`[data-fk="tuile-${ids[0]}"]`); await p.click(`[data-fk="tuile-${ids[1]}"]`); await p.click('[data-fk="comparer-choix"]'); }
    if (ids.length >= 2) {
      await hs(p, `${w} ${sit} comparer`); await tech(p, `${w} ${sit} comparer`);
      // La phrase reprend l'issue réelle des conditions sans compromis.
      const faux = await p.evaluate(() => { const [a, b] = S.paire.map(P); return [...document.querySelectorAll('.sans-l li')].map((li, i) => { const c = CRITERES.filter(x => x.sans)[i]; const r = rangsPaire(a, b).find(x => x.c.cle === c.cle); const t = li.innerText; if (/Tenue pour les deux/.test(t) && !(r.a.issue === 'favorable' && r.b.issue === 'favorable')) return c.cle; if (/À vérifier pour les deux/.test(t) && !(r.a.issue === 'to_confirm' && r.b.issue === 'to_confirm')) return c.cle; return null; }).filter(Boolean); });
      if (faux.length) errs.push(`${w} ${sit} sans compromis faux : ${faux}`);
      // La phrase d'entrée nomme exactement les conditions qui séparent.
      const ent = await p.evaluate(() => { const [a, b] = S.paire.map(P); const rs = rangsPaire(a, b); if (rs.some(r => r.cl === 'hors_cadre' || r.cl === 'bloquant' || r.cl === 'partiel')) return null; const sep = [...new Set(rs.filter(r => r.cl === 'separe').map(r => r.c.lab()))]; const t = document.querySelector('.tete-vue').innerText; return sep.filter(l => !t.includes(l)); });
      if (ent && ent.length) errs.push(`${w} ${sit} phrase d'entrée sans : ${ent}`);
      const teintes = await p.evaluate(() => { const [a, b] = S.paire.map(P); return rangsPaire(a, b).some(r => r.cl === 'hors_cadre') ? document.querySelectorAll('.piste').length : 0; });
      if (teintes) errs.push(`${w} ${sit} ${teintes} pistes affichées malgré une comparaison non fiable`);
      const horsPerim = await p.evaluate(() => { const [a, b] = S.paire.map(P); const pc = perimetreComparable(a, b); return [...document.querySelectorAll('.rang')].map(el => el.id.split('-')[1]).filter(e => !pc.echs.includes(e)); });
      if (horsPerim.length) errs.push(`${w} ${sit} pistes hors du périmètre comparable : ${horsPerim}`);
      if (await p.locator('.piste .pl').count()) errs.push(`${w} ${sit} face-à-face : une ligne est dessinée`);
      const teinteB = await p.evaluate(() => [...document.querySelectorAll('.piste .mk svg')].filter(s => /reg-/.test(s.innerHTML)).length);
      if (teinteB) errs.push(`${w} ${sit} variante B : ${teinteB} formes teintées`);
      // La marge de la comparaison cite la source réelle de chaque côté.
      const srcFaux = await p.evaluate(() => { const [a, b] = S.paire.map(P); return [...document.querySelectorAll('.rang')].filter(el => { const [, ech, crit] = el.id.match(/^rang-(\w+)-(\w+)$/) || []; if (!crit) return false; const ss = [lire(a, crit, ech).source, lire(b, crit, ech).source].filter(Boolean).map(sourceCourte); const t = el.querySelector('.rang-src')?.innerText ?? ''; return !ss.every(x => t.includes(x)); }).map(e => e.id); });
      if (srcFaux.length) errs.push(`${w} ${sit} sources de comparaison fausses : ${srcFaux}`);
      await p.click('[data-fk="marques-A"]').catch(() => {}); await p.evaluate(() => { S.marques = 'A'; rendre(); });
      await hs(p, `${w} ${sit} comparer A`);
      await p.evaluate(() => { S.marques = 'B'; rendre(); });
      const n = await p.locator('.piste').count();
      for (let i = 0; i < Math.min(n, 3); i++) { await p.locator('.piste').nth(i).click(); }
      await hs(p, `${w} ${sit} preuves`);
      const pq = p.locator('[data-fk="pourquoi"]'); if (await pq.count()) await pq.click();
      await p.click('[data-fk="fil-accueil"]');
    }
    // Faire le point : chaque phrase et chaque action ouvrent quelque chose.
    if (ids.length) {
      await p.goto(html + '?situation=' + sit); await p.waitForTimeout(80);
      const go = p.locator('[data-act="go"][data-arg="point"]'); if (await go.count()) await go.first().click(); else await p.evaluate(() => suivre('point'));
      await hs(p, `${w} ${sit} point`); await tech(p, `${w} ${sit} point`);
      const nl = await p.locator('#vue [data-act="go"]').count();
      for (let i = 0; i < nl; i++) {
        await p.goto(html + '?situation=' + sit); await p.waitForTimeout(60); await p.evaluate(() => suivre('point'));
        const l = p.locator('#vue [data-act="go"]').nth(i); if (!(await l.count())) continue;
        await l.click(); await p.waitForTimeout(40); await hs(p, `${w} ${sit} point lien ${i}`);
      }
    }
    await p.close();
  }
  // Le parcours progressif : ajouter ENREGISTRE ; l'analyse n'arrive que par la démonstration explicite.
  let p = await ouvrir(1440, 900, 'premier');
  await p.click('[data-fk="ajout"]'); await p.click('#ajout [data-act="go"]');
  let s2 = await p.evaluate(() => [S.connu.goelands, etatConnu(P('goelands')), lire(P('goelands'), 'calme', 'autour').issue, document.querySelector('[data-fk="geste"]').innerText]);
  if (s2.join('|') !== 'commune|adresse_enregistree|adresse_non_examinee|Voir ce qui peut être lu de 5 allée des Goélands') errs.push('parcours : ajout inattendu ' + s2);
  if (await p.locator('.tuile [data-fk="tuile-goelands"]').evaluate(e => /abords et logement analysés/.test(e.innerText))) errs.push('parcours : un lieu enregistré se dit analysé');
  await p.click('[data-fk="geste"]');
  if (await p.locator('[data-fk="comparer-avec"]').count()) errs.push('A : « Comparer » proposé pour une adresse enregistrée de la même commune');
  const titreSec = await p.evaluate(() => document.querySelector('#titre-retenir')?.innerText ?? '');
  if (!/Ce que dit la commune/.test(titreSec)) errs.push('A : la fiche d\'une adresse enregistrée présente les résultats comme les siens : ' + titreSec);
  await p.click('[data-fk="ec-autour"]'); await p.click('[data-fk="analyser"]');
  s2 = await p.evaluate(() => [S.connu.goelands ?? 'aucun', S.situation, etatConnu(P('goelands'))]);
  if (s2.join('|') !== 'aucun|deuxieme|analyse') errs.push('parcours : analyse simulée inattendue ' + s2);
  await p.click('[data-fk="fil-accueil"]');
  await p.click('[data-fk="geste"]'); const v = await p.evaluate(() => S.vue); if (v !== 'comparer') errs.push('parcours : le geste principal ne compare pas');
  await p.keyboard.press('Escape'); if ((await p.evaluate(() => S.vue)) !== 'recherche') errs.push('Échap ne revient pas à la recherche');
  await p.close();
  // La continuité : rapport → recherche → ajout d'une commune enregistrée → aperçu → analyse → comparer → preuve → point.
  p = await ouvrir(1440, 900, 'rapport-commune');
  const vr = await p.evaluate(() => [S.vue, document.querySelector('.barre nav [aria-current]')?.dataset.nav]);
  if (vr.join('|') !== 'rapport|decision') errs.push('continuité : départ ' + vr);
  await p.click('[data-fk="pont"]'); await p.click('[data-fk="ajout"]'); await p.click('#ajout [data-act="go"]');
  if ((await p.evaluate(() => [etatConnu(P('ploubrec')), rangsPaire(P('portanvel'), P('ploubrec')).filter(r => r.cl === 'separe').length].join('|'))) !== 'enregistre|0') errs.push('continuité : une commune enregistrée se compare');
  await p.click('[data-fk="geste"]'); await p.click('[data-fk="ec-territoire"]');
  if ((await p.evaluate(() => etatConnu(P('ploubrec')))) !== 'apercu') errs.push('continuité : aperçu non obtenu');
  if (await p.locator('[data-fk="comparer-avec"]').count()) errs.push('continuité : comparaison proposée sur un aperçu');
  await p.click('[data-fk="ec-territoire"]'); await p.click('[data-fk="analyser"]'); await p.click('[data-fk="fil-accueil"]');
  if ((await p.locator('[data-fk="geste"]').innerText()) !== 'Comparer ces deux lieux') errs.push('continuité : le geste ne compare pas après analyse');
  const perimTxt = await p.evaluate(() => { suivre('paire:portanvel,ploubrec'); return document.querySelector('.perimetre')?.innerText; }); await p.click('[data-fk="fil-accueil"]');
  if (!/Se compare\s+la commune/.test(perimTxt || '')) errs.push('continuité : périmètre mal dit ' + perimTxt);
  await p.click('[data-fk="geste"]'); await p.locator('.piste').first().click(); await p.click('[data-act="doc"]');
  if (!(await p.locator('.preuves .doc').count())) errs.push('continuité : preuve sans données et limites');
  await p.click('[data-fk="fil-accueil"]'); await p.click('[data-fk="point"]');
  if (await p.evaluate(() => document.querySelector('.legende-d')?.open)) errs.push('point : la légende des formes est ouverte par défaut');
  const atl = await p.evaluate(() => [...document.querySelectorAll('.atlas-b .a-nom')].map(e => e.innerText).join('|'));
  if (atl !== 'Port-Anvel|Ploubrec') errs.push('continuité : rangée du point ' + atl);
  await p.close();
  p = await ouvrir(1440, 900, 'residence');
  const rs = await p.evaluate(() => [document.querySelector('[data-fk="geste"]').innerText, !!document.querySelector('[data-fk="point"]'), !!document.querySelector('[data-fk="choix"]')]);
  if (!/^Lire le Relevé/.test(rs[0]) || rs[1] || rs[2]) errs.push('résidence : ' + rs);
  await p.click('[data-fk="geste"]'); if ((await p.evaluate(() => S.vue)) !== 'rapport') errs.push('résidence : le geste n\'ouvre pas le Relevé');
  await p.close();
  // E : un dossier ancien cite les valeurs de son Projet, jamais celles d'aujourd'hui
  p = await ouvrir(1440, 900, 'enrichie'); await p.click('[data-fk="tuile-kervily"]');
  const anc = await p.evaluate(() => document.querySelector('.conclusion-d')?.innerText ?? '');
  if (!/répond à votre Projet du 8 sept/.test(anc) || /30 min/.test(anc)) errs.push('E : conclusion ancienne mal datée ou réécrite : ' + anc.replace(/\n/g, ' '));
  await p.close();
  // Aucun achat n'est déclenché : aucun bouton de marque ne parle d'acheter, d'analyser ou de payer.
  for (const sit of SITS) { p = await ouvrir(1440, 900, sit); const m = await p.evaluate(() => [...document.querySelectorAll('.boutonMarque')].map(b => b.innerText).filter(t => /achet|pay|analys|€/i.test(t))); if (m.length) errs.push(`${sit} : bouton de marque d'achat ${m}`); await p.close(); }
  // Une analyse mise à jour rend la comparaison possible.
  p = await ouvrir(1440, 900, 'horscadre'); await p.click('[data-fk="geste"]'); await p.click('[data-fk="maj-comp"]');
  if (!(await p.locator('.piste').count())) errs.push('horscadre : aucune piste après la mise à jour simulée');
  await p.close();
  // Clavier.
  p = await ouvrir(1440, 900, 'enrichie'); const vus = new Set();
  for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); vus.add(await p.evaluate(() => document.activeElement?.dataset?.fk || document.activeElement?.id || document.activeElement?.tagName)); }
  for (const k of ['geste', 'projet', 'choix', 'tuile-kervily', 'lentille-sel']) if (![...vus].includes(k)) errs.push('clavier : ' + k + ' non atteint');
  if ((await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)) === 'none') errs.push('clavier : focus sans contour');
  await p.close();
  p = await ouvrir(1440, 900, 'premier', { rm: true });
  const d = await p.evaluate(() => [getComputedStyle(document.documentElement).getPropertyValue('--m-etat').trim(), getComputedStyle(document.querySelector('.arrive') || document.body).animationName]);
  if (d[0] !== '0ms' || d[1] !== 'none') errs.push('mouvement réduit : ' + d);
  // Aucune largeur artificielle.
  const fv = await p.evaluate(() => [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).fontVariationSettings !== 'normal').length);
  if (fv) errs.push(fv + ' éléments avec font-variation-settings');
  await p.close();
  console.log(mesures.join('\n')); console.log(errs.length ? errs.join('\n') : 'aucune erreur');
  await b.close();
})();
