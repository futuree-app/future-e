#!/usr/bin/env node
/**
 * populate-uu-pop.mjs — population de l'unité urbaine (« taille vécue »).
 *
 * POURQUOI. L'index porte la population de la COMMUNE et le code `uu` (unité
 * urbaine INSEE 2020), mais pas le nombre d'habitants de l'agglo. Or « est-ce une
 * grande ville ? » se joue sur la taille vécue, pas sur la commune : Brest pèse
 * 139 619 hab en commune mais ~210 000 sur son unité urbaine ; Bordeaux 262 k en
 * commune, bien plus en agglo. Sans ce champ, le récit confond commune et agglo
 * (constat répété au dogfood Brest/Lorient, 2026-06-27).
 *
 * QUOI. Pour chaque commune appartenant à une unité urbaine (`uu` non nul), on
 * somme la population des communes partageant le même code `uu`. Aucune source
 * externe : tout est dérivé de l'index lui-même. Les communes hors UU (`uu` nul,
 * ~78 % des communes, rural INSEE) sont leur propre « agglo » : uu_pop = population
 * communale, uu_count = 1, hors_uu = true.
 *
 * HONNÊTETÉ (à divulguer au récit). C'est l'UNITÉ URBAINE (continuité du bâti),
 * PAS l'aire d'attraction des villes (AAV, bassin de vie élargi). On a l'UU, pas
 * l'AAV : ne JAMAIS étiqueter ce nombre « aire urbaine » ni « aire d'attraction ».
 * Dire « unité urbaine » / « agglomération ». uu_pop peut être partielle si des
 * communes du groupe ont une population nulle (rare en métropole).
 *
 * Idempotent : relit l'index, (re)calcule, réécrit { meta, communes }.
 *   node scripts/populate-uu-pop.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const root = process.cwd();
  const file = path.join(root, "data", "comparateur-index.json");
  const { meta, communes } = JSON.parse(await fs.readFile(file, "utf8"));

  // 1) Somme de population + compte par code uu (communes en UU seulement).
  const sum = new Map(); // uu -> population cumulée
  const count = new Map(); // uu -> nombre de communes
  for (const c of communes) {
    if (c.uu == null) continue;
    const k = String(c.uu);
    count.set(k, (count.get(k) ?? 0) + 1);
    if (c.population != null) sum.set(k, (sum.get(k) ?? 0) + c.population);
  }

  // 2) Affecter uu_pop / uu_count à chaque commune.
  let inUu = 0;
  let horsUu = 0;
  for (const c of communes) {
    if (c.uu == null) {
      c.uu_pop = c.population ?? null; // hors UU : la commune est sa propre agglo
      c.uu_count = c.population == null ? null : 1;
      c.hors_uu = true;
      horsUu++;
    } else {
      const k = String(c.uu);
      c.uu_pop = sum.has(k) ? sum.get(k) : null;
      c.uu_count = count.get(k) ?? null;
      c.hors_uu = false;
      inUu++;
    }
  }

  meta.uuPop = {
    methode:
      "somme de la population communale par code uu (unité urbaine INSEE 2020), dérivée de l'index",
    champ: "uu_pop (habitants de l'UU), uu_count (nb communes), hors_uu (bool)",
    usage:
      "récit « taille vécue / est-ce une grande ville ? » à l'échelle de l'agglomération, pas de la commune",
    limite:
      "UNITÉ URBAINE (continuité du bâti), PAS aire d'attraction des villes (AAV) — ne pas dire « aire urbaine » ; uu_pop partielle si des communes du groupe ont une population nulle",
  };
  meta.approximations = meta.approximations ?? [];
  if (!meta.approximations.some((a) => a.startsWith("uu_pop"))) {
    meta.approximations.push(
      "uu_pop : population de l'unité urbaine (continuité du bâti), distincte de l'aire d'attraction des villes",
    );
  }

  await fs.writeFile(file, JSON.stringify({ meta, communes }), "utf8");

  // Contrôle visuel sur quelques cibles.
  const probe = ["29019", "56121", "22278", "17300", "33063"];
  for (const ic of probe) {
    const c = communes.find((x) => x.insee === ic);
    if (c)
      console.log(
        `${c.nom.padEnd(14)} commune ${String(c.population).padStart(7)} | UU ${String(
          c.uu_pop,
        ).padStart(8)} (${c.uu_count} communes)`,
      );
  }
  console.log(
    `✓ uu_pop écrit : ${inUu} communes en UU, ${horsUu} hors UU (singleton).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
