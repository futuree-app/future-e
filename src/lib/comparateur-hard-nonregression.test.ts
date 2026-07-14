// NON-RÉGRESSION : l'ANCIEN moteur (témoin gelé) contre le NOUVEAU, sur tout le corpus croisé.
//
// Un test qui se contenterait d'affirmer quelques résultats du NOUVEAU moteur ne prouverait aucune
// non-régression : il ne comparerait rien. Ici, chaque écart entre l'ancien et le nouveau doit être
// ÉNUMÉRÉ ci-dessous. Un écart non listé fait tomber le test.
import test from "node:test";
import assert from "node:assert/strict";
import {
  assessHardConstraints, PRODUCT_CONVENTIONS_VERSION, type EvaluationContext,
} from "./hard-constraints.ts";
import { communeAttributesFrom, tailleVilleFrom } from "./commune-attributes.ts";
import { hardFilter } from "./hard-constraints-filter.ts";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import { legacyPassesHard } from "./legacy-passes-hard.ts";
import { CORPUS, PROJETS, DIRECTORY, UU_POP, POP_FLOOR } from "./__fixtures__/hard-corpus.ts";

// Les écarts ASSUMÉS, un par un, avec leur raison. Clé : `${commune}/${projet}`.
const ECARTS_ASSUMES: Record<string, string> = {
  // Les 30 km inventés : l'ancien EXCLUAIT les communes au-delà d'un seuil que le lecteur n'avait jamais
  // posé. Le nouveau ne filtre plus, et le DIT (complete: false).
  "Toulouse/mer sans distance": "l'ancien filtrait à 30 km inventés",
  "Briançon/mer sans distance": "l'ancien filtrait à 30 km inventés",
  "Villeurbanne/mer sans distance": "l'ancien filtrait à 30 km inventés",
  "Sans-Donnée/mer sans distance": "l'ancien filtrait à 30 km inventés",
  // Les 50 km inventés autour d'un lieu nommé, même cause.
  "Toulouse/près d'un lieu sans distance": "l'ancien filtrait à 50 km inventés autour de Brest",
  "Briançon/près d'un lieu sans distance": "l'ancien filtrait à 50 km inventés autour de Brest",
  "Villeurbanne/près d'un lieu sans distance": "l'ancien filtrait à 50 km inventés autour de Brest",
  "Sans-Donnée/près d'un lieu sans distance": "l'ancien filtrait à 50 km inventés autour de Brest",
  // Une ville à quitter que l'annuaire ne connaît pas : l'ancien l'IGNORAIT en silence et laissait
  // passer la commune. Le nouveau ne filtre pas non plus (la référence est globale), mais il refuse de
  // dire que la condition est respectée, et il l'ANNONCE.
  //   -> aucun écart d'ÉLIGIBILITÉ ici : rien à énumérer.
};

test("NON-RÉGRESSION : l'ancien filtre et le nouveau rendent le même verdict, sauf écarts énumérés", () => {
  const inattendus: string[] = [];
  const ecartsVus = new Set<string>();

  for (const entry of CORPUS) {
    for (const p of PROJETS) {
      const taille = tailleVilleFrom(entry.uu, entry.population, UU_POP);
      const attrs = communeAttributesFrom(entry, taille);
      const constraints = hydrateHardConstraints(p.hc, DIRECTORY);
      const context: EvaluationContext = {
        constraints,
        point: { lat: entry.lat, lon: entry.lon, grain: "commune_reference", source: "commune_centroid", label: entry.nom },
        conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
      };
      // Le plancher anti-hameaux vit dans le comparateur, pas dans le contrat : on le rejoue ici comme
      // matchProjects le fera.
      const nouveau =
        entry.population != null && entry.population >= POP_FLOOR &&
        hardFilter(assessHardConstraints(context, attrs)).eligible;
      const ancien = legacyPassesHard(attrs, p.hc, DIRECTORY);

      const cle = `${entry.nom}/${p.nom}`;
      if (ancien !== nouveau) {
        if (cle in ECARTS_ASSUMES) ecartsVus.add(cle);
        else inattendus.push(`${cle} : ancien=${ancien}, nouveau=${nouveau}`);
      }
    }
  }

  assert.deepEqual(inattendus, [], `écarts NON assumés :\n${inattendus.join("\n")}`);

  // Un écart qu'on a déclaré et qui ne se produit PAS est aussi une information : le témoin ne dit plus
  // ce qu'on croit. On le signale.
  const jamaisVus = Object.keys(ECARTS_ASSUMES).filter((k) => !ecartsVus.has(k));
  assert.deepEqual(jamaisVus, [], `écarts déclarés mais jamais observés : ${jamaisVus.join(", ")}`);
});
