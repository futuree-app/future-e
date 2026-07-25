import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// LES SEUILS ET CONVENTIONS QUE PLUS RIEN NE LIT.
//
// Ce test existe parce que la même faute est revenue deux fois dans la même journée. D'abord un
// `ambientThreshold: 78` sur la pluie, calibré par symétrie avec les trois autres axes et qu'aucune règle
// ne consommait. Puis, en cherchant s'il y en avait d'autres : quatre constantes exportées, jamais lues —
// dont deux versions de conventions (`sante-conv-1`, `mismatch-conv-1`) qui laissaient croire que les
// faits correspondants étaient estampillés, alors que rien ne les posait sur un `basis`.
//
// POURQUOI C'EST GRAVE. Un seuil mort ne casse rien le jour où on l'écrit. Il ment le jour où quelqu'un
// le lit — pour raisonner sur la calibration, pour invalider un cache, pour décider qu'un comportement
// existe. Il a exactement l'apparence d'une règle du produit, et zéro effet.
//
// CE QUE LE TEST NE PEUT PAS FAIRE : prouver qu'une constante lue est correctement lue. Il ferme la
// question « est-ce branché ? », jamais « est-ce juste ? ». Les invariants de seuils ambiants, eux
// (materiality-rules.test.ts), éprouvent l'effet réel sur un dossier.

const DIR = "src/lib/decision";

// Les constantes dont l'absence d'usage interne est NORMALE : elles sont l'interface publique du module,
// consommées par les pages ou par d'autres bibliothèques. Toute entrée ajoutée ici doit dire pourquoi.
const EXEMPTIONS = new Set<string>([]);

function fichiers(): { nom: string; src: string }[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => ({ nom: f, src: readFileSync(path.join(DIR, f), "utf8") }));
}

test("AUCUNE constante exportée du moteur de décision n'est morte", () => {
  const tous = fichiers();
  // Le corpus de recherche est le PRODUIT ENTIER, pas seulement `decision/` : une constante peut être
  // légitimement consommée par une page, un composant ou un script.
  const ailleurs = (() => {
    const out: string[] = [];
    const parcourir = (d: string): void => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) parcourir(p);
        else if (/\.(ts|tsx)$/.test(e.name)) out.push(readFileSync(p, "utf8"));
      }
    };
    parcourir("src");
    return out;
  })();

  const morts: string[] = [];
  for (const { nom, src } of tous) {
    for (const m of src.matchAll(/^export const ([A-Z][A-Z0-9_]{3,})\s*[:=]/gm)) {
      const cle = m[1];
      if (EXEMPTIONS.has(cle)) continue;
      const re = new RegExp(`\\b${cle}\\b`, "g");
      // Une seule occurrence dans tout le produit = sa propre déclaration, et rien d'autre.
      const total = ailleurs.reduce((n, f) => n + (f.match(re)?.length ?? 0), 0);
      if (total <= 1) morts.push(`${cle} (${nom})`);
    }
  }

  assert.deepEqual(morts, [],
    `Constantes exportées que rien ne lit :\n  ${morts.join("\n  ")}\n`
    + "Soit les brancher, soit les retirer. Une valeur qui a l'apparence d'une règle du produit sans "
    + "aucun effet est une règle qui ment. Si l'usage est réellement externe, l'inscrire dans EXEMPTIONS "
    + "avec sa raison.");
});
