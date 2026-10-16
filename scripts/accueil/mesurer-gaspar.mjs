// FUT-50 · GASPAR : latence réelle (pour justifier le délai de 3 s) et coût d'une panne (délai atteint).
// Exige une adresse IP française (Géorisques refuse les autres). Usage : node scripts/accueil/mesurer-gaspar.mjs
import { createServer } from "node:http";
import { risquesGaspar, DELAI_GASPAR_MS } from "../../src/lib/accueil/gaspar-accueil.ts";

const codes = ["30189", "17300", "44109", "74010", "23096", "2A004", "13055", "75056", "69123", "33063", "64445", "06088", "67482", "59350", "35238", "29019", "97411", "97209", "97302", "97611"];
const d = [];
let pannes = 0;
for (let tour = 0; tour < 2; tour++) for (const c of codes) {
  const r = await risquesGaspar(c, { delaiMs: 10000 }); // délai large : on mesure la latence vraie, sans couper
  if (r.panne) pannes++; else d.push(r.ms);
}
const q = (p) => { const s = [...d].sort((a, b) => a - b); return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]); };
console.log(`GASPAR réel : ${d.length} réponses, ${pannes} pannes ; p50 ${q(0.5)} ms, p90 ${q(0.9)} ms, p95 ${q(0.95)} ms, max ${Math.round(Math.max(...d))} ms`);

const s = createServer(() => { /* ne répond jamais */ });
await new Promise((r) => s.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${s.address().port}`;
const r = await risquesGaspar("30189", { base });
s.closeAllConnections(); s.close();
console.log(`Panne (serveur muet), délai ${DELAI_GASPAR_MS} ms : rendu en ${r.ms} ms, panne=${r.panne}, risques=${JSON.stringify(r.risques)}`);
