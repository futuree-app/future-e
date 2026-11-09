// Rapport d'impact de la refonte douceur_climat (lot 4b). Self-contained : reimplémente les DEUX formules
// depuis les champs de l'index (indépendant de l'état du code). Sert la gate du seuil identitaire.
import fs from "node:fs/promises";
import zlib from "node:zlib";

// L'index est une donnée produite ailleurs : on le lit comme `unknown` et on valide chaque champ
// utilisé, au lieu de le supposer conforme. Une commune mal formée arrête le rapport avec son
// numéro, plutôt que de fausser silencieusement une corrélation ou un seuil.
type Mesure = number | null | undefined;
type Commune = {
  insee: string;
  nom: string;
  region: string;
  clim?: { NORTMm_seas_DJF?: Mesure };
  pct?: { NORTMm_seas_DJF?: Mesure; NORTX35D_yr?: Mesure };
};
type Ligne = { insee: string; nom: string; region: string; djf: Mesure; old: number; neo: number; chaleur: Mesure };

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const mesure = (bloc: Record<string, unknown>, cle: string, ou: string): Mesure => {
  const v = bloc[cle];
  if (v === undefined || v === null || typeof v === "number") return v;
  throw new Error(`${ou}.${cle} : nombre attendu, reçu ${typeof v}`);
};
const blocMesures = (v: unknown, ou: string): Record<string, unknown> | undefined => {
  if (v === undefined || v === null) return undefined;
  if (!estObjet(v)) throw new Error(`${ou} : objet attendu`);
  return v;
};
const texte = (c: Record<string, unknown>, cle: string, ou: string): string => {
  const v = c[cle];
  if (typeof v !== "string") throw new Error(`${ou}.${cle} : chaîne attendue, reçu ${typeof v}`);
  return v;
};
const lireCommunes = (brut: unknown): Commune[] => {
  if (!estObjet(brut) || !Array.isArray(brut.communes)) throw new Error("index : tableau `communes` attendu");
  return brut.communes.map((c: unknown, i: number): Commune => {
    const ou = `communes[${i}]`;
    if (!estObjet(c)) throw new Error(`${ou} : objet attendu`);
    const clim = blocMesures(c.clim, `${ou}.clim`);
    const pct = blocMesures(c.pct, `${ou}.pct`);
    return {
      insee: texte(c, "insee", ou),
      nom: texte(c, "nom", ou),
      region: texte(c, "region", ou),
      clim: clim && { NORTMm_seas_DJF: mesure(clim, "NORTMm_seas_DJF", `${ou}.clim`) },
      pct: pct && {
        NORTMm_seas_DJF: mesure(pct, "NORTMm_seas_DJF", `${ou}.pct`),
        NORTX35D_yr: mesure(pct, "NORTX35D_yr", `${ou}.pct`),
      },
    };
  });
};

const idx: unknown = JSON.parse(zlib.gunzipSync(await fs.readFile("data/comparateur-index.json.gz")).toString());
const communes = lireCommunes(idx);
const WINTER_MILD: [number, number][] = [[-3, 5], [1, 30], [4, 60], [7, 88], [9, 100], [12, 95], [16, 80]];
const lerp = (a: [number, number][], x: number | null | undefined): number | null => {
  if (x == null) return null;
  if (x <= a[0][0]) return a[0][1];
  for (let i = 1; i < a.length; i++) if (x <= a[i][0]) { const [x0, y0] = a[i - 1], [x1, y1] = a[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return a[a.length - 1][1];
};
const oldScore = (c: Commune): number | null => {
  const w = lerp(WINTER_MILD, c.clim?.NORTMm_seas_DJF); if (w == null) return null;
  const s = c.pct?.NORTX35D_yr == null ? 50 : 100 - c.pct.NORTX35D_yr;
  return Math.round(0.6 * w + 0.4 * s);
};
const newScore = (c: Commune): number | null => c.pct?.NORTMm_seas_DJF ?? null;
const rows: Ligne[] = communes
  .map((c) => ({ insee: c.insee, nom: c.nom, region: c.region, djf: c.clim?.NORTMm_seas_DJF, old: oldScore(c), neo: newScore(c), chaleur: c.pct?.NORTX35D_yr }))
  .filter((r): r is Ligne => r.old != null && r.neo != null);
console.log(`communes analysées : ${rows.length}`);

// A. corrélation + plus gros mouvements
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const mo = mean(rows.map((r) => r.old)), mn = mean(rows.map((r) => r.neo));
const cov = mean(rows.map((r) => (r.old - mo) * (r.neo - mn))), so = Math.sqrt(mean(rows.map((r) => (r.old - mo) ** 2))), sn = Math.sqrt(mean(rows.map((r) => (r.neo - mn) ** 2)));
console.log("\ncorrélation old<->new :", (cov / (so * sn)).toFixed(3));
const movers = [...rows].sort((a, b) => Math.abs(b.neo - b.old) - Math.abs(a.neo - a.old)).slice(0, 10);
console.log("\n10 plus gros mouvements :"); for (const r of movers) console.log(`  ${r.nom} (${r.region}) DJF ${r.djf}°C : ${r.old} -> ${r.neo} (${r.neo - r.old > 0 ? "+" : ""}${r.neo - r.old})`);

// Défensif : valeurs region réelles
console.log("\nvaleurs region présentes :", [...new Set(rows.map((r) => r.region))].sort());

// A. label « doux » par seuil (gate §6.1)
console.log("\nlabel « doux » par seuil (part des communes) :");
for (const t of [65, 70, 75, 80, 85]) console.log(`  seuil ${t} : ${(100 * rows.filter((r) => r.neo >= t).length / rows.length).toFixed(1)} % (${rows.filter((r) => r.neo >= t).length} communes)`);

// A. communes emblématiques par INSEE (stable)
const EMBL: Record<string, string> = { Nice: "06088", Ajaccio: "2A004", Bastia: "2B033", Brest: "29019", Chamonix: "74056", Strasbourg: "67482", "La Rochelle": "17300" };
console.log("\ncommunes emblématiques (old -> new douceur, chaleur pct) :");
for (const [label, insee] of Object.entries(EMBL)) { const r = rows.find((x) => x.insee === insee); if (r) console.log(`  ${label} DJF ${r.djf}°C : douceur ${r.old} -> ${r.neo} · chaleur(NORTX35D pct) ${r.chaleur}`); else console.log(`  ${label} (${insee}) ABSENT`); }

// B. lisibilité de l'arbitrage (Méditerranée : douceur HAUTE + chaleur HAUTE, deux signaux séparés)
console.log("\narbitrage désormais lisible (Méditerranée : hivers doux ET étés exposés) :");
const med = rows.filter((r) => ["Provence-Alpes-Côte d'Azur", "Corse", "Occitanie"].includes(r.region) && r.neo >= 80 && r.chaleur != null && r.chaleur >= 80).slice(0, 5);
for (const r of med) console.log(`  ${r.nom} : douceur ${r.neo} (haute) · chaleur ${r.chaleur} (haute) -> arbitrage visible`);

// C. taille
console.log("\nindex gzip actuel :", ((await fs.stat("data/comparateur-index.json.gz")).size / 1048576).toFixed(2), "Mo");
