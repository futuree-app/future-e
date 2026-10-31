// FUT-149, 31/10/2026 · § 5 : la taille des fonctions après un build de production, lue dans les traces de Next
// (`.next/server/**/*.nft.json`) : nombre de fichiers tracés et octets, plus le fichier de la route lui-même.
//   node taille_fonctions.cjs <checkout construit> [route…]
const fs = require("node:fs");
const path = require("node:path");
const [dir, ...routes] = process.argv.slice(2);
const cibles = routes.length ? routes : ["app/api/georisques-logement/route", "app/api/logement-autour/route", "app/(account)/rapport/autour/page"];
const out = {};
for (const r of cibles) {
  const nft = path.join(dir, ".next/server", `${r}.js.nft.json`);
  if (!fs.existsSync(nft)) { out[r] = "absente"; continue; }
  const fichiers = [path.join(dir, ".next/server", `${r}.js`), ...JSON.parse(fs.readFileSync(nft, "utf8")).files.map((f) => path.resolve(path.dirname(nft), f))];
  let octets = 0, data = 0, deb = 0;
  for (const f of fichiers) {
    try { const s = fs.statSync(f); if (s.isFile()) octets += s.size; } catch {}
    if (f.includes(`${path.sep}data${path.sep}`)) data++;
    if (/debroussaillement/i.test(f)) deb++;
  }
  out[r] = { fichiers: fichiers.length, Mo: +(octets / 1e6).toFixed(3), fichiersData: data, fichiersNommesDebroussaillement: deb };
}
console.log(JSON.stringify(out, null, 1));
