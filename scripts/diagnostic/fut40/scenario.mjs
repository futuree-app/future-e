// Scénario FUT-40 : requêtes document (comme un <a> ou un rechargement) et requêtes RSC (comme <Link>),
// avec une boîte à cookies minimale. Les valeurs de cookies ne sont jamais affichées.
import fs from "node:fs";
const BASE = "http://localhost:3140", MOCK = "http://127.0.0.1:54399", S = process.argv[2];
const NOM = "sb-127-auth-token";
const jar = new Map();
const masque = (v) => (v ? `${v.length} car., empreinte ${Buffer.from(v).toString("base64").slice(-6)}` : "absent");
function cookieHeader() { return [...jar].map(([k, v]) => `${k}=${v}`).join("; "); }
function absorber(res) {
  const posés = [];
  for (const sc of res.headers.getSetCookie()) {
    const [nv, ...attrs] = sc.split(";"); const i = nv.indexOf("="); const k = nv.slice(0, i), v = nv.slice(i + 1);
    const maxAge = attrs.find((a) => /max-age/i.test(a));
    if (v === "" || /max-age=0/i.test(sc)) { jar.delete(k); posés.push(`${k} SUPPRIMÉ`); }
    else { jar.set(k, v); posés.push(`${k} [${attrs.map((a) => a.trim().split("=")[0]).join(",")}${maxAge ? " " + maxAge.trim() : ""}]`); }
  }
  return posés;
}
let mockVu = 0;
function mockDepuis() { const l = fs.readFileSync(`${S}/${process.env.MOCK_LOG || "mock.log"}`, "utf8").split("\n").filter(Boolean); const nouv = l.slice(mockVu); mockVu = l.length; return nouv.map((x) => x.replace(/^\S+ /, "")); }
async function seed(exp) {
  const s = await (await fetch(`${MOCK}/__seed?exp=${exp}`)).json();
  jar.clear(); jar.set(NOM, "base64-" + Buffer.from(JSON.stringify(s)).toString("base64url"));
  mockDepuis(); return s;
}
async function aller(chemin, mode) {
  const headers = { cookie: cookieHeader() };
  if (mode === "rsc") Object.assign(headers, { RSC: "1", "Next-Router-State-Tree": encodeURIComponent(JSON.stringify(["", { children: ["__PAGE__", {}] }, null, null, true])) });
  const avant = masque(jar.get(NOM));
  const t0 = Date.now();
  const res = await fetch(BASE + chemin, { headers, redirect: "manual" });
  const posés = absorber(res);
  await res.arrayBuffer();
  await new Promise((r) => setTimeout(r, 150));
  console.log(`\n→ ${mode.toUpperCase()} ${chemin}  [${res.status}${res.headers.get("location") ? " → " + res.headers.get("location") : ""}] ${Date.now() - t0} ms`);
  console.log(`  cookie auth avant : ${avant}`);
  console.log(`  Set-Cookie reçus : ${posés.length ? posés.join(" ; ") : "aucun"}`);
  console.log(`  cookie auth après : ${masque(jar.get(NOM))}`);
  for (const l of mockDepuis()) console.log(`  [auth] ${l}`);
  return res;
}
const cas = process.argv[3];
if (cas === "doc-expire") { await seed(-60); await aller("/rapport", "doc"); }
if (cas === "doc-valide") { await seed(3600); await aller("/rapport", "doc"); }
if (cas === "parcours-doc") { await seed(-60); await aller("/rapport/quartier", "doc"); await aller("/pourquoi", "doc"); await aller("/rapport", "doc"); }
if (cas === "parcours-expire-sur-public") { await seed(3600); await aller("/rapport/quartier", "doc"); const s = await seed(-60); await aller("/pourquoi", "doc"); await aller("/rapport", "doc"); }
if (cas === "parcours-rsc") { await seed(-60); await aller("/rapport/quartier", "rsc"); await aller("/pourquoi", "rsc"); await aller("/rapport", "rsc"); }
if (cas === "rsc-expire") { await seed(-60); await aller("/rapport", "rsc"); }
if (cas === "course") {
  // Un autre client (le navigateur) fait le refresh du même jeton juste avant la requête document.
  const s = await seed(-60);
  await fetch(`${MOCK}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3140" }, body: JSON.stringify({ refresh_token: s.refresh_token }) });
  await aller("/rapport", "doc");
  await aller("/rapport", "doc");
}
