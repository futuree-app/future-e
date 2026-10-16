// FUT-50 · BANC DES ROUTES PUBLIQUES SUR UN BUILD DE PRODUCTION LOCAL (`next start`).
//
// Prérequis : `npm run build -- --webpack` déjà fait. Le banc démarre lui-même le serveur, autant de fois que
// nécessaire (un serveur NEUF par mesure à froid), puis l'arrête. Aucune donnée écrite, aucun réseau hors GASPAR.
// Usage : node scripts/accueil/banc-production.mjs
import { spawn, execSync } from "node:child_process";

const PORT = 3171;
const BASE = `http://localhost:${PORT}`;
let echecs = 0;
const verifier = (ok, m) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${m}`); if (!ok) echecs++; };

async function demarrer() {
  const p = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore", detached: true });
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`${BASE}/robots.txt`); if (r.status) break; } catch { /* pas encore */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return p;
}
// La sonde de démarrage lit /robots.txt : elle ne charge ni route d'accueil ni donnée de lecture.
function arreter(p) { try { process.kill(-p.pid, "SIGTERM"); } catch { /* déjà arrêté */ } }
const rssMo = () => {
  try {
    const pid = execSync(`lsof -ti tcp:${PORT} -sTCP:LISTEN`).toString().trim().split("\n")[0];
    return Math.round(Number(execSync(`ps -o rss= -p ${pid}`).toString().trim()) / 1024);
  } catch { return null; }
};
async function appel(chemin) {
  const t = performance.now();
  const r = await fetch(`${BASE}${chemin}`);
  const corps = await r.json().catch(() => null);
  return { ms: performance.now() - t, statut: r.status, cache: r.headers.get("cache-control"), raison: r.headers.get("x-accueil-cache"), motif: r.headers.get("x-accueil-motif"), corps };
}
const pct = (l, q) => { const s = [...l].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

// ── 1. À froid : un serveur neuf par parcours ─────────────────────────────────────────────────────────
console.log("\n## À froid (serveur neuf, premier appel)\n");
console.log("| Parcours | Durée | Statut | Mémoire du serveur après |");
console.log("|---|---|---|---|");
const FROID = [
  ["Identité métropolitaine", "/api/accueil/commune?insee=30189"],
  ["Identité ultramarine", "/api/accueil/commune?insee=97411"],
  ["Chaleur métropolitaine", "/api/accueil/lecture?insee=30189&cle=chaleur"],
  ["Hivers doux", "/api/accueil/lecture?insee=30189&cle=hivers"],
  ["Petite ville", "/api/accueil/lecture?insee=30189&cle=taille"],
  ["Risques (GASPAR)", "/api/accueil/lecture?insee=30189&cle=risques"],
  ["Chaleur ultramarine couverte", "/api/accueil/lecture?insee=97411&cle=chaleur"],
  ["Chaleur ultramarine non couverte", "/api/accueil/lecture?insee=98736&cle=chaleur"],
];
const repos = [];
for (const [nom, chemin] of FROID) {
  const p = await demarrer();
  const base = rssMo();
  const r = await appel(chemin);
  console.log(`| ${nom} | ${Math.round(r.ms)} ms | ${r.statut} | ${rssMo()} Mo (au repos : ${base} Mo) |`);
  repos.push(base);
  arreter(p);
  await new Promise((r) => setTimeout(r, 600));
}

// ── 2. À chaud, concurrence, en-têtes, exposition : un seul serveur ───────────────────────────────────
const p = await demarrer();
const COMMUNES = ["30189", "17300", "44109", "74010", "23096", "2A004", "75111", "69381", "13201", "33063", "64445", "06088", "67482", "59350", "35238"];
const OM = ["97411", "97209", "97611", "97302", "98818", "98735", "97801", "97701", "98736", "98713", "98613", "97502"];
console.log("\n## À chaud (même serveur, communes différentes, aucun cache côté serveur)\n");
console.log("| Priorité | n | p50 | p95 | max |");
console.log("|---|---|---|---|---|");
for (const cle of ["chaleur", "hivers", "taille", "voiture", "risques"]) {
  await appel(`/api/accueil/lecture?insee=30189&cle=${cle}`);
  const d = [];
  for (const c of [...COMMUNES, ...OM]) { const r = await appel(`/api/accueil/lecture?insee=${c}&cle=${cle}`); if (r.statut === 200) d.push(r.ms); else verifier(false, `${c} ${cle} : ${r.statut}`); }
  console.log(`| ${cle} | ${d.length} | ${Math.round(pct(d, 0.5))} ms | ${Math.round(pct(d, 0.95))} ms | ${Math.round(Math.max(...d))} ms |`);
}
const ident = [];
for (const c of [...COMMUNES, ...OM]) ident.push((await appel(`/api/accueil/commune?insee=${c}`)).ms);
console.log(`| identité | ${ident.length} | ${Math.round(pct(ident, 0.5))} ms | ${Math.round(pct(ident, 0.95))} ms | ${Math.round(Math.max(...ident))} ms |`);
console.log(`\nMémoire du serveur après toutes les lectures : ${rssMo()} Mo (au repos, serveur neuf : ${Math.min(...repos)} Mo)`);

console.log("\n## En-têtes de cache et contrats\n");
const H = [
  ["lecture durable (chaleur)", "/api/accueil/lecture?insee=17300&cle=chaleur", 200, "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400"],
  ["risques, GASPAR répond", "/api/accueil/lecture?insee=17300&cle=risques", 200, "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400"],
  ["risques hors couverture GASPAR (98735)", "/api/accueil/lecture?insee=98735&cle=risques", 200, "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400"],
  ["commune inconnue", "/api/accueil/lecture?insee=99999&cle=chaleur", 404, "public, max-age=0, s-maxage=3600"],
  ["code malformé", "/api/accueil/lecture?insee=1A234&cle=chaleur", 400, "no-store"],
  ["priorité inconnue", "/api/accueil/lecture?insee=30189&cle=piscine", 400, "no-store"],
  ["paramètre superflu (nom envoyé)", "/api/accueil/lecture?insee=30189&cle=chaleur&commune=La%20Rochelle", 200, "no-store"],
  ["identité", "/api/accueil/commune?insee=97411", 200, "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400"],
  ["identité inconnue", "/api/accueil/commune?insee=97999", 404, "public, max-age=0, s-maxage=3600"],
];
for (const [nom, chemin, statut, cc] of H) {
  const r = await appel(chemin);
  verifier(r.statut === statut && r.cache === cc, `${nom} : ${r.statut}, « ${r.cache} » (${r.raison}${r.motif ? `, ${r.motif}` : ""})`);
}
const faux = await appel("/api/accueil/lecture?insee=30189&cle=chaleur&commune=La%20Rochelle&libelle=La%20Rochelle");
verifier(faux.corps?.lecture?.commune === "Nîmes" && !JSON.stringify(faux.corps).includes("Rochelle"), `nom falsifié ignoré : « ${faux.corps?.lecture?.commune} »`);
const ident97 = await appel("/api/accueil/commune?insee=97411");
verifier(ident97.corps?.nom === "Saint-Denis (La Réunion)", `identité 97411 : « ${ident97.corps?.nom} »`);
const pii = JSON.stringify((await appel("/api/accueil/lecture?insee=17300&cle=chaleur")).corps);
verifier(!/@|user|email|session|token|ip/i.test(pii.replace(/typique|multiple|tropic|pi[eè]|epi|ripi/gi, "")), "aucune donnée personnelle dans la réponse");

console.log("\n## Concurrence (30 requêtes simultanées sur un serveur NEUF)\n");
arreter(p);
await new Promise((r) => setTimeout(r, 600));
const p2 = await demarrer();
const lot = [];
for (let i = 0; i < 30; i++) lot.push([COMMUNES[i % COMMUNES.length], ["chaleur", "hivers", "taille"][i % 3]]);
const t = performance.now();
const reps = await Promise.all(lot.map(([c, k]) => appel(`/api/accueil/lecture?insee=${c}&cle=${k}`)));
const total = performance.now() - t;
const justes = reps.filter((r, i) => r.statut === 200 && r.corps?.lecture?.cle === lot[i][1]).length;
verifier(justes === 30, `30 lectures simultanées à froid : ${justes}/30 justes, ${Math.round(total)} ms au total, la plus lente ${Math.round(Math.max(...reps.map((r) => r.ms)))} ms ; mémoire ${rssMo()} Mo`);

console.log("\n## Exposition des fichiers internes\n");
for (const f of ["/data_climat.json", "/accueil-communes.json", "/apercu-climat-communes.json", "/data/accueil-communes.json", "/src/data/accueil-communes.json", "/comparateur-index.json.gz"]) {
  const r = await fetch(`${BASE}${f}`);
  verifier(r.status === 404, `${f} → ${r.status}`);
}
for (const f of ["/dev/fut50/api/lecture?insee=30189&cle=chaleur", "/dev/fut50/api/commune?insee=30189", "/dev/fut50/c"]) {
  const r = await fetch(`${BASE}${f}`);
  verifier(r.status === 404, `prototype ${f} → ${r.status} en production`);
}
arreter(p2);
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est conforme.");
process.exit(echecs ? 1 : 0);
