#!/usr/bin/env node
/**
 * scripts/agents/discoverability/audit.mjs
 *
 * Premier outil métier de l'agent Discoverability Strategist (SEO + GEO).
 * Inventaire DÉTERMINISTE de la découvrabilité du site, pour que l'agent ne
 * brûle pas son intelligence à grep/compter, mais raisonne sur des résultats.
 * Principe (ADR-0006) : le déterministe va au script ; l'agent juge la sortie.
 *
 * Ce qu'il fait (lecture seule, aucune dépendance externe) :
 *  - verrous globaux : public/robots.txt (Disallow), robots par défaut du layout racine ;
 *  - toutes les routes `page.tsx` sous src/app, classées publique / privée (route group) ;
 *  - par route : metadata exportée ? canonical ? robots surchargé ? titre/description ?
 *    données structurées JSON-LD ? (présence, par regex, pas d'AST) ;
 *  - couverture sitemap : quelles routes statiques sont dans sitemap.ts, et quels
 *    gabarits programmatiques (`/x/${...}`) y sont générés ;
 *  - synthèse : routes publiques indexables mais absentes du sitemap, sans canonical,
 *    sans JSON-LD (les angles morts que l'agent doit prioriser).
 *
 * Usage :
 *   node scripts/agents/discoverability/audit.mjs            # résumé lisible
 *   node scripts/agents/discoverability/audit.mjs --json     # sortie JSON brute
 *
 * NB : c'est un inventaire STATIQUE de la vérité du code, pas une mesure du SERP
 * ni de l'indexation réelle (cf. « Limites de mon regard » du mandat).
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');
const JSON_OUT = process.argv.includes('--json');

/** Marche récursive : renvoie tous les fichiers sous `dir`. */
async function walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

/** src/app/(public)/inondation/[insee_code]/page.tsx -> { route, group, dynamic } */
function toRoute(file) {
  const rel = path.relative(APP_DIR, file).replace(/\\/g, '/');
  const segments = rel.replace(/\/page\.tsx$/, '').split('/').filter(Boolean);
  const groups = segments.filter((s) => s.startsWith('(') && s.endsWith(')'));
  const kept = segments.filter((s) => !(s.startsWith('(') && s.endsWith(')')));
  const route = '/' + kept.join('/');
  return {
    route: route === '/' ? '/' : route,
    group: groups.map((g) => g.slice(1, -1)).join('|') || null,
    dynamic: kept.some((s) => s.includes('[')),
  };
}

const PUBLIC_GROUPS = new Set(['public', 'marketing', null]);
function isPublic(group) {
  if (group == null) return true; // pages à la racine de app (ex. /, /merci)
  return group.split('|').some((g) => PUBLIC_GROUPS.has(g));
}

function flags(src) {
  const has = (re) => re.test(src);
  return {
    metadata: has(/export\s+(const|async\s+function)\s+(metadata|generateMetadata)\b/),
    canonical: has(/alternates\s*:\s*{[^}]*canonical/s) || has(/canonical\s*:/),
    robotsOverride: has(/\brobots\s*:/),
    title: has(/\btitle\s*:/),
    description: has(/\bdescription\s*:/),
    jsonLd: has(/application\/ld\+json/) || has(/['"]@context['"]/),
  };
}

async function read(file) {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return '';
  }
}

async function main() {
  // --- verrous globaux ---
  const robotsTxt = await read(path.join(ROOT, 'public', 'robots.txt'));
  const siteBlocked = /^\s*Disallow:\s*\/\s*$/m.test(robotsTxt);
  const layoutSrc = await read(path.join(APP_DIR, 'layout.tsx'));
  const layoutNoindex = /robots\s*:\s*{[^}]*index\s*:\s*false/s.test(layoutSrc);

  // --- sitemap ---
  const sitemapSrc = await read(path.join(APP_DIR, 'sitemap.ts'));
  const sitemapStatic = [...sitemapSrc.matchAll(/\$\{BASE_URL\}(\/[^\s`'"]*)?/g)]
    .map((m) => m[1] || '/')
    .filter((v, i, a) => a.indexOf(v) === i);
  const sitemapProgrammatic = [...sitemapSrc.matchAll(/\$\{BASE_URL\}(\/[a-z0-9-]+)\/\$\{/gi)]
    .map((m) => m[1])
    .filter((v, i, a) => a.indexOf(v) === i);

  // --- routes ---
  const files = (await walk(APP_DIR)).filter((f) => /\/page\.tsx$/.test(f));
  const routes = [];
  for (const file of files) {
    const meta = toRoute(file);
    const src = await read(file);
    const f = flags(src);
    const pub = isPublic(meta.group);
    const inSitemap = meta.dynamic
      ? sitemapProgrammatic.some((p) => meta.route.startsWith(p))
      : sitemapStatic.includes(meta.route);
    routes.push({ ...meta, public: pub, ...f, inSitemap, file: path.relative(ROOT, file) });
  }
  routes.sort((a, b) => a.route.localeCompare(b.route));

  const publicRoutes = routes.filter((r) => r.public);
  const blindspots = {
    absentSitemap: publicRoutes.filter((r) => !r.inSitemap).map((r) => r.route),
    noCanonical: publicRoutes.filter((r) => !r.canonical).map((r) => r.route),
    noJsonLd: publicRoutes.filter((r) => !r.jsonLd).map((r) => r.route),
    noMetadata: publicRoutes.filter((r) => !r.metadata).map((r) => r.route),
  };

  const report = {
    blocages_globaux: {
      site_bloque_robots_txt: siteBlocked,
      layout_racine_noindex_par_defaut: layoutNoindex,
      note: siteBlocked || layoutNoindex
        ? 'Verrou(s) actif(s) : tant qu’ils tiennent, tout le reste est invisible (probable état pré-lancement).'
        : 'Aucun verrou global d’indexation.',
    },
    sitemap: { statiques: sitemapStatic, gabarits_programmatiques: sitemapProgrammatic },
    totaux: {
      routes: routes.length,
      publiques: publicRoutes.length,
      programmatiques_publiques: publicRoutes.filter((r) => r.dynamic).length,
    },
    angles_morts: blindspots,
    routes_publiques: publicRoutes,
  };

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return;
  }

  const ok = (b) => (b ? '✓' : '·');
  console.log('\n=== Audit de découvrabilité (statique) ===\n');
  console.log('Verrous globaux :');
  console.log(`  robots.txt Disallow: /        ${siteBlocked ? 'OUI (site fermé au crawl)' : 'non'}`);
  console.log(`  layout racine noindex défaut  ${layoutNoindex ? 'OUI (hérité par les pages sans override)' : 'non'}`);
  console.log(`\nSitemap : ${sitemapStatic.length} routes statiques, gabarits programmatiques : ${sitemapProgrammatic.join(', ') || 'aucun'}`);
  console.log(`\nRoutes publiques (${publicRoutes.length}) :  meta | canon | robots | jsonLd | sitemap`);
  for (const r of publicRoutes) {
    const tag = r.dynamic ? ' (programmatique)' : '';
    console.log(
      `  ${r.route.padEnd(34)} ${ok(r.metadata)}     ${ok(r.canonical)}      ${ok(r.robotsOverride)}       ${ok(r.jsonLd)}      ${ok(r.inSitemap)}${tag}`,
    );
  }
  console.log('\nAngles morts (routes publiques) :');
  console.log(`  absentes du sitemap : ${blindspots.absentSitemap.length} → ${blindspots.absentSitemap.join(', ') || '—'}`);
  console.log(`  sans canonical      : ${blindspots.noCanonical.length}`);
  console.log(`  sans JSON-LD        : ${blindspots.noJsonLd.length}`);
  console.log(`  sans metadata       : ${blindspots.noMetadata.length} → ${blindspots.noMetadata.join(', ') || '—'}`);
  console.log('\n(Inventaire statique du code, pas une mesure du SERP ni de l’indexation réelle.)\n');
}

main().catch((e) => {
  console.error('audit.mjs a échoué :', e);
  process.exit(1);
});
