import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const [W, ED, ORA] = process.argv.slice(2);
const { lireDebroussaillement, tuilesALire } = await import(`${W}/src/lib/debroussaillement.ts`);
const man = JSON.parse(readFileSync(`${ED}/manifest.json`, "utf8"));
const oracle = JSON.parse(readFileSync(ORA, "utf8"));
const D = `${W}/src/lib/__fixtures__/fut149/adresses`;
const charge = (e: any) => new Map(tuilesALire(man, e).map((k: string) => [k, JSON.parse(gunzipSync(readFileSync(`${ED}/t/${k}.json.gz`)).toString())]));
const attenduPoint = (o: any, dep: boolean) => !dep ? "non_couvert" : o.dist != null && o.dist <= 50 ? "en_limite" : o.dedans ? "en_zone" : "hors_zone";
for (const f of readdirSync(D).sort()) {
  const c = f.replace(/\.json$/, ""); const a = JSON.parse(readFileSync(`${D}/${f}`, "utf8")); const o = oracle[c];
  const base = { point: [a.ban.lon, a.ban.lat], geocodage: a.ban.type, insee: a.ban.citycode };
  const eP = { ...base, parcelle: null }, eL = { ...base, parcelle: a.parcelle ? { geometry: a.parcelle.geometry, rattachement: a.parcelle.rattachement, candidatsAuPoint: a.parcelle.candidatsAuPoint } : null };
  const lp = lireDebroussaillement(man, charge(eP), eP), ll = lireDebroussaillement(man, charge(eL), eL);
  const dep = man.couverture.includes(lp.departement);
  const ap = attenduPoint(o, dep);
  let al = ap;
  if (ll.grain === "parcelle") al = o.part >= 0.98 ? "en_zone" : o.part >= 0.02 ? "en_limite" : o.part > 0 ? "en_limite" : o.distBordParcelleZone <= 50 ? "en_limite" : "hors_zone";
  const marge = o.dist != null && Math.abs(o.dist - 50) < 3 ? " (≈50 m, tolérance)" : "";
  const parcelleOk = ll.grain !== "parcelle" || o.pointDansParcelle;
  console.log(`${lp.etat === ap ? "OK" : "ÉCART" + marge} point ${c} : lib ${lp.etat}${lp.limite?.distanceM != null ? " " + lp.limite.distanceM + "m" : ""} | oracle dedans=${o.dedans} dist=${o.dist}`);
  console.log(`   ${ll.etat === al && parcelleOk ? "OK" : "ÉCART"} logement : lib ${ll.etat} grain=${ll.grain} écartée=${ll.parcelleEcartee} part=${ll.part} | oracle part=${o.part} pointDansParcelle=${o.pointDansParcelle} bord=${o.pointBordParcelleM} m valide=${o.parcelleValide}`);
}
