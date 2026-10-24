// Prépare deux cas avec la vraie route déterministe locale. Aucun appel au modèle.
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.argv[2] ?? 'http://localhost:3129';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base)) throw new Error('Serveur local requis');
const dossier = 'docs/audits/2026-10-23-revue-finale';
mkdirSync(dossier, { recursive: true });
for (const seul of [false, true]) {
  const nom = seul ? 'inondation-seule' : 'inondation-soins';
  const texte = seul ? "Un faible risque d'inondation, en Charente-Maritime" : "Un faible risque d'inondation et un bon accès aux soins, en Charente-Maritime";
  const parsed = { reformulation: texte, hardConstraints: { departements: ['17'] }, preferences: [{ key: 'faible_risque_inondation', weight: 3 }, ...(seul ? [] : [{ key: 'acces_soins', weight: 2 }])] };
  const res = await fetch(`${base}/api/comparateur-vie/match`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ parsed }) });
  if (!res.ok) throw new Error(`Match ${res.status}`);
  const outcome = await res.json();
  const payload = { project: texte, reformulation: texte, preferences: parsed.preferences, results: outcome.results.map(r => ({ ...r, pressionEco: r.pressionEco?.note ?? null })), outcome: { perfectMatch: outcome.perfectMatch, message: outcome.message, exploration: outcome.inondation?.exploration ?? false }, perimetre: ['Charente-Maritime'], orientation: [] };
  writeFileSync(`${dossier}/${nom}-payload.json`, JSON.stringify(payload, null, 2));
  writeFileSync(`${dossier}/${nom}-session.json`, JSON.stringify({ v: 5, savedAt: Date.now(), submittedText: texte, parsed, outcome, synthesis: '', askMessages: [], askRemaining: 2, askLimit: false }, null, 2));
  console.log(`${nom}: ${outcome.results.map(r => r.nom).join(', ')} ; exploration=${outcome.inondation?.exploration}`);
}
