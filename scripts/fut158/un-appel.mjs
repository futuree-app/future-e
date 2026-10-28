// Un appel, un processus : node un-appel.mjs <url> <variante>. Imprime « statut ms » ou « ERR code ms ».
const [url, variante] = process.argv.slice(2);
const T = process.env.GEORISQUES_API_TOKEN;
const UA = "futur-e/diagnostic-fut158";
const v2 = url.includes("/api/v2/");
const auth = v2 ? { authorization: `Bearer ${T}` } : {};
const H = {
  actuel: { accept: "application/json", ...auth },
  sansAccept: { ...auth },
  sansAcceptUA: { ...auth, "user-agent": UA },
  acceptUA: { accept: "application/json", ...auth, "user-agent": UA },
  actuelIdentity: { accept: "application/json", ...auth, "accept-encoding": "identity" },
  acceptEtoile: { accept: "*/*", ...auth, "user-agent": UA },
}[variante];
const t = Date.now();
try {
  const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(15000) });
  const corps = await r.text();
  console.log(`${r.status} ${Date.now() - t}ms ${corps.length}o`);
} catch (e) { console.log(`ERR ${e.cause?.code ?? e.name} ${Date.now() - t}ms`); }
