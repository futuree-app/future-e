// À exécuter seulement lors de la livraison autorisée : --fix-today, puis --check.
// Aucune variable d'environnement, aucun déploiement, aucune donnée client.
import { readFileSync, writeFileSync } from 'node:fs';
const fichier = 'src/lib/comparateur/inondation-historique.ts';
const source = readFileSync(fichier, 'utf8');
const parties = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
const valeur = type => parties.find(p => p.type === type).value;
const aujourdHui = `${valeur('year')}-${valeur('month')}-${valeur('day')}`;
const motif = /export const LECTURE_INONDATION_DEPUIS: string \| null = (null|"\d{4}-\d{2}-\d{2}");/;
if (!motif.test(source)) throw new Error('Déclaration de date non reconnue');
if (process.argv.includes('--fix-today')) {
  writeFileSync(fichier, source.replace(motif, `export const LECTURE_INONDATION_DEPUIS: string | null = "${aujourdHui}";`));
  console.log(`Bascule préparée pour la livraison du ${aujourdHui}. Revalider avant fusion.`);
} else if (process.argv.includes('--check') || (process.argv.includes('--check-production') && process.env.VERCEL_ENV === 'production')) {
  if (source.match(motif)[1] !== `"${aujourdHui}"`) throw new Error('Livraison bloquée : renseigner le jour effectif avec --fix-today, puis revalider.');
  console.log('Date de bascule vérifiée.');
} else {
  console.log('Préparation sans date hypothétique. À la livraison : node scripts/fut129/bascule.mjs --fix-today puis --check.');
}
