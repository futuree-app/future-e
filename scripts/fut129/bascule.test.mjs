import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = readFileSync(new URL('./bascule.mjs', import.meta.url), 'utf8');
const fichier = 'src/lib/comparateur/inondation-historique.ts';

// Vrai CLI, horloge figée dans le seul processus enfant, fichiers temporaires uniquement.
function lancer(date, args = ['--check-production'], environnement = 'production', instant = '2026-10-25T12:00:00Z') {
  const dir = mkdtempSync(join(tmpdir(), 'fut129-bascule-test-'));
  try {
    mkdirSync(join(dir, 'src/lib/comparateur'), { recursive: true });
    const source = `export const LECTURE_INONDATION_DEPUIS: string | null = ${JSON.stringify(date)};\n`;
    writeFileSync(join(dir, fichier), source);
    writeFileSync(join(dir, 'bascule.mjs'), script);
    writeFileSync(join(dir, 'horloge.mjs'), `
      const DateReelle = globalThis.Date;
      globalThis.Date = class extends DateReelle {
        constructor(...args) { super(...(args.length ? args : [${JSON.stringify(instant)}])); }
        static now() { return new DateReelle(${JSON.stringify(instant)}).getTime(); }
      };
    `);
    const r = spawnSync(process.execPath, ['--import', './horloge.mjs', './bascule.mjs', ...args], {
      cwd: dir, env: { ...process.env, VERCEL_ENV: environnement, TZ: 'UTC' }, encoding: 'utf8', timeout: 5000,
    });
    assert.ifError(r.error);
    const apres = readFileSync(join(dir, fichier), 'utf8');
    if (!args.includes('--fix-today')) assert.equal(apres, source, 'un contrôle ne réécrit pas la date');
    return { ...r, apres };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const [nom, date, instant] of [
  ['le jour de la bascule', '2026-10-24', '2026-10-24T12:00:00Z'],
  ['le lendemain', '2026-10-24', '2026-10-25T12:00:00Z'],
  ['les jours suivants, après le changement d’heure', '2026-10-24', '2026-10-26T12:00:00Z'],
  ['une année suivante', '2026-10-24', '2027-01-01T12:00:00Z'],
  ['un vrai 29 février', '2024-02-29', '2026-10-25T12:00:00Z'],
]) {
  test(`prébuild production : date historique conservée et acceptée ${nom}`, () => {
    const r = lancer(date, ['--check-production'], 'production', instant);
    assert.equal(r.status, 0, r.stderr);
  });
}

for (const [nom, date] of [
  ['absente', null], ['future', '2026-10-26'], ['mal formée', '2026-10-024'],
  ['jour inexistant', '2026-02-30'], ['mois inexistant', '2026-13-01'], ['faux 29 février', '2025-02-29'],
]) {
  test(`prébuild production : refuse une date ${nom}`, () => {
    const r = lancer(date);
    assert.equal(r.status, 1, r.stdout);
  });
}

test('préparation --check : exige toujours le jour effectif, pas une date passée ou future', () => {
  for (const [date, statut] of [['2026-10-24', 1], ['2026-10-25', 0], ['2026-10-26', 1], [null, 1]]) {
    const r = lancer(date, ['--check']);
    assert.equal(r.status, statut, r.stderr);
  }
});

test('jour effectif : utilise Europe/Paris, même si le processus est en UTC', () => {
  // En France il est déjà le 25, avant le passage à l’heure d’hiver.
  assert.equal(lancer('2026-10-25', ['--check'], 'production', '2026-10-24T22:30:00Z').status, 0);
  // Après ce passage, il est déjà le 26 à 23 h 30 UTC.
  assert.equal(lancer('2026-10-26', ['--check'], 'production', '2026-10-25T23:30:00Z').status, 0);
});

test('preview : une date non encore préparée ne bloque pas le prébuild', () => {
  assert.equal(lancer(null, ['--check-production'], 'preview').status, 0);
});

test('préparation --fix-today : renseigne toujours le jour de Paris dans une copie temporaire', () => {
  const r = lancer(null, ['--fix-today'], 'preview', '2026-10-24T22:30:00Z');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.apres, /= "2026-10-25";/);
});

test('date effectivement livrée : le fichier applicatif conserve le 24 octobre 2026', () => {
  assert.match(readFileSync(new URL('../../src/lib/comparateur/inondation-historique.ts', new URL('./', import.meta.url)), 'utf8'),
    /LECTURE_INONDATION_DEPUIS: string \| null = "2026-10-24";/);
});
