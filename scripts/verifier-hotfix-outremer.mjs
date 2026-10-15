// HOTFIX FUT-104 · BANC HTTP : aucune projection DRIAS métropolitaine ne sort pour un code ultramarin, et la
// métropole répond comme avant.
//
//   node scripts/verifier-hotfix-outremer.mjs http://localhost:3000            # build de production local
//   node scripts/verifier-hotfix-outremer.mjs https://futur-e.fr               # après déploiement
//   node scripts/verifier-hotfix-outremer.mjs http://localhost:3000 https://futur-e.fr
//        # avec une référence : compare aussi, octet pour octet, les réponses JSON métropolitaines
//
// Aucune requête payante (/qna, synthèses IA) n'est faite. Sortie : une ligne par vérification, code 1 si une échoue.

const [base, reference] = process.argv.slice(2);
if (!base) {
  console.error("usage : node scripts/verifier-hotfix-outremer.mjs <base> [référence]");
  process.exit(2);
}

// Codes du COG vérifiés le 16/10/2026 (geo.api.gouv.fr) : Papeete 98735, Nouméa 98818.
const OUTREMER = {
  "97209": "Fort-de-France", "97411": "Saint-Denis", "97611": "Mamoudzou", "98735": "Papeete",
  "98818": "Nouméa", "97302": "Cayenne", "97101": "Les Abymes", "97801": "Saint-Martin",
};
const METRO = {
  "17300": "La Rochelle", "44109": "Nantes", "30189": "Nîmes", "29040": "Le Conquet", "2A004": "Ajaccio",
  "75056": "Paris", "69123": "Lyon", "13055": "Marseille",
};

let echecs = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "✔" : "✖"} ${msg}`);
  if (!cond) echecs++;
};
async function get(url, init) {
  const r = await fetch(url, { redirect: "manual", ...init });
  return { status: r.status, type: r.headers.get("content-type") ?? "", texte: await r.text(), cache: r.headers.get("x-vercel-cache") };
}
const titre = (html) => html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
const meta = (html, prop) => html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`))?.[1] ?? null;

// ── Fichier statique et API ───────────────────────────────────────────────────────────────────────────────────
{
  const f = await get(`${base}/data_climat.json`, { method: "HEAD" });
  ok(f.status === 404, `/data_climat.json → ${f.status} (attendu 404)`);
}
for (const [code, nom] of Object.entries(OUTREMER)) {
  const a = await get(`${base}/api/climat/${code}`);
  ok(a.status === 404 && !/column0\d/.test(a.texte), `/api/climat/${code} (${nom}) → ${a.status}, sans ligne DRIAS`);
  const d = await get(`${base}/drias?insee=${code}&dataset=landing`);
  ok(d.status === 404 && !/NORT|gwl20/.test(d.texte), `/drias ${code} → ${d.status}, sans carte DRIAS`);
}
{
  const w = JSON.parse((await get(`${base}/api/wizard-preview?insee=97401`)).texte);
  ok(w.drias === null, `/api/wizard-preview 97401 (Les Avirons) : drias = ${JSON.stringify(w.drias)}`);
  ok(!w.tensions.some((t) => ["canicule", "submersion", "feux", "secheresse"].includes(t.slug)),
    `/api/wizard-preview 97401 : aucun score DRIAS (${w.tensions.map((t) => t.slug).join(", ") || "aucun"})`);
}
for (const code of ["29040", "17300", "2A004"]) {
  const a = await get(`${base}/api/climat/${code}`);
  ok(a.status === 200 && /"column04"/.test(a.texte), `/api/climat/${code} (${METRO[code]}) → ${a.status}, ligne servie`);
  const d = await get(`${base}/drias?insee=${code}&dataset=landing`);
  ok(d.status === 200 && /"gwl20"/.test(d.texte), `/drias ${code} → ${d.status}, carte servie`);
  const w = JSON.parse((await get(`${base}/api/wizard-preview?insee=${code}`)).texte);
  ok(w.drias && w.drias.canicule_gwl20 !== null, `/api/wizard-preview ${code} : drias présent`);
  if (reference) {
    for (const chemin of [`/api/climat/${code}`, `/drias?insee=${code}&dataset=landing`, `/drias?insee=${code}`]) {
      const [x, y] = [await get(`${base}${chemin}`), await get(`${reference}${chemin}`)];
      ok(x.texte === y.texte, `${chemin} identique à la référence (${x.texte.length} octets)`);
    }
  }
}

// ── Pages publiques ───────────────────────────────────────────────────────────────────────────────────────────
for (const seg of ["chaleur", "inondation"]) {
  for (const [code, nom] of Object.entries(OUTREMER)) {
    const p = await get(`${base}/${seg}/${code}`);
    const html = p.texte;
    ok(p.status === 404, `/${seg}/${code} (${nom}) → ${p.status}`);
    // Le texte est dans la réponse (charge utile React) ; Next le rend après hydratation, le corps HTML initial
    // reste vide (cf. compte rendu). Ce qui compte ici : il est présent, et aucune donnée ne l'accompagne.
    ok(/Pas encore de projection fiable pour ce territoire/.test(html), `/${seg}/${code} : page d'explication dans la réponse`);
    ok(!/projections 2050|risques et données officielles/i.test(titre(html) + (meta(html, "og:title") ?? "") + (meta(html, "description") ?? "")),
      `/${seg}/${code} : ni titre ni description de projection (« ${titre(html)} »)`);
    ok(!/communes comparées|DRIAS-TRACC, Météo-France \/ CNRS|Ouvrir le dossier|\+2,7 °C en France/.test(html),
      `/${seg}/${code} : aucune tuile, aucun rang, aucun appel au dossier`);
  }
  for (const [code, nom] of Object.entries(METRO)) {
    const p = await get(`${base}/${seg}/${code}`);
    ok(p.status === 200 && titre(p.texte).includes(seg === "chaleur" ? "projections 2050" : "risques et données officielles"),
      `/${seg}/${code} (${nom}) → ${p.status}, « ${titre(p.texte)} »`);
  }
}
{
  const html = (await get(`${base}/chaleur/17300`)).texte;
  ok(/communes comparées/.test(html) && /DRIAS-TRACC/.test(html), "/chaleur/17300 : tuiles et rangs DRIAS présents");
}

// ── Aperçu du dossier ─────────────────────────────────────────────────────────────────────────────────────────
{
  const om = (await get(`${base}/territoire/97209/debloquer?nom=Fort-de-France`)).texte;
  ok(/ne s(&#x27;|')appliquent pas à/.test(om) && !/lit ensemble la trajectoire climatique/.test(om),
    "/territoire/97209/debloquer : l'absence de trajectoire climatique est dite");
  ok(!/Ce que les projections disent déjà/.test(om), "/territoire/97209/debloquer : aucun fait climatique");
  const metro = (await get(`${base}/territoire/17300/debloquer?nom=La%20Rochelle`)).texte;
  ok(/Ce que les projections disent déjà de La Rochelle/.test(metro), "/territoire/17300/debloquer : faits climatiques présents");
}

// ── Sitemap ───────────────────────────────────────────────────────────────────────────────────────────────────
{
  const s = (await get(`${base}/sitemap.xml`)).texte;
  const om = (s.match(/\/chaleur\/9[78]\d{3}</g) ?? []).length;
  const metro = (s.match(/\/chaleur\/(?!9[78])[0-9AB]{5}</g) ?? []).length;
  ok(om === 0, `sitemap : ${om} page climatique ultramarine`);
  ok(metro > 34000, `sitemap : ${metro} pages climatiques métropolitaines`);
}

console.log(echecs ? `\n${echecs} vérification(s) en échec` : "\nToutes les vérifications passent.");
process.exit(echecs ? 1 : 0);
