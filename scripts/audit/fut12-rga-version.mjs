// FUT-12 · CONTRE-ÉPREUVE : quelle carte argiles l'API Géorisques sert-elle ?
//
// L'API `/api/v2/rga` ne renvoie aucune version. Ce script réinterroge, en lecture seule, les points
// où les cartes 2019 et 2026 divergent (`fut12-rga-points.json`) et compte à laquelle des deux
// l'API répond. Le 04/11/2026 : 28 sur 28 conformes à la carte 2026, 0 à celle de 2019.
//
// Usage (IP française, cf. piège Géorisques) :
//   GEORISQUES_API_TOKEN=… node scripts/audit/fut12-rga-version.mjs
import { readFileSync } from "node:fs";

const token = process.env.GEORISQUES_API_TOKEN;
if (!token) { console.error("GEORISQUES_API_TOKEN manquant"); process.exit(2); }
const { points } = JSON.parse(readFileSync(new URL("./fut12-rga-points.json", import.meta.url), "utf8"));

let n2026 = 0, n2019 = 0, autres = 0;
for (const p of points) {
  const url = `https://www.georisques.gouv.fr/api/v2/rga?latitude=${p.lat}&longitude=${p.lon}&pageSize=10&pageNumber=0`;
  const r = await fetch(url, { headers: { accept: "application/json", "accept-encoding": "identity", authorization: `Bearer ${token}` } });
  const j = await r.json();
  const code = j.content?.[0]?.codeExposition ? Number(j.content[0].codeExposition) : 0;
  const verdict = code === p.carte2026 ? "2026" : code === p.carte2019 ? "2019" : "autre";
  if (verdict === "2026") n2026++; else if (verdict === "2019") n2019++; else autres++;
  console.log(`${p.dep} ${p.lat},${p.lon}  2019=${p.carte2019} 2026=${p.carte2026} api=${code}  -> ${verdict}`);
}
console.log(`\nConformes à 2026 : ${n2026} · à 2019 : ${n2019} · autres : ${autres} (sur ${points.length})`);
process.exit(n2019 === 0 && autres === 0 ? 0 : 1);
