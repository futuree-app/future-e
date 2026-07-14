// LA PARITÉ. Le comparateur et le dossier peuvent avoir des politiques différentes face à une donnée
// manquante. Ils n'ont pas le droit d'être en désaccord sur un CONSTAT.
//
// Le test part d'une ENTRÉE D'INDEX et de CONTRAINTES BRUTES, et suit les DEUX CHAÎNES ENTIÈRES :
//
//   IndexCommune ──► communeAttributesFrom ──► assess ──► hardFilter          (comparateur)
//        │
//        └────────► mapCommuneToModuleFacts ──► runRules ──► règle dossier    (dossier)
//
//   HardConstraints brutes ──► hydrateHardConstraints ──► les DEUX
//
// C'est LÀ que les deux moteurs divergeaient : dans les mappings, dans tailleVille, dans l'hydratation,
// dans la normalisation des zones, dans le point d'évaluation. Un test qui partirait d'attributs déjà
// construits et les donnerait aux deux adaptateurs ne prouverait qu'une chose : deux adaptateurs
// au-dessus du MÊME objet ne se contredisent pas. C'est vrai par construction, et sans valeur.
import test from "node:test";
import assert from "node:assert/strict";
import {
  assessHardConstraints, HARD_CONSTRAINT_KEYS, PRODUCT_CONVENTIONS_VERSION,
  type EvaluationContext, type EvaluationPoint,
} from "./hard-constraints.ts";
import { communeAttributesFrom, tailleVilleFrom, type IndexCommuneLike } from "./commune-attributes.ts";
import { hardFilter } from "./hard-constraints-filter.ts";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import { mapCommuneToModuleFacts } from "./decision/module-facts-map.ts";
import { runRules } from "./decision/materiality-rules.ts";
import type { IndexCommune } from "./comparateur-vie.ts";
import type { UserProject } from "./user-project.ts";
import type { HardConstraints } from "./hard-constraint-schema.ts";
import { CORPUS, PROJETS, DIRECTORY, UU_POP } from "./__fixtures__/hard-corpus.ts";

function projectOf(hc: HardConstraints): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: hc, preferences: [] } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

function chaines(entry: IndexCommuneLike, hc: HardConstraints) {
  const taille = tailleVilleFrom(entry.uu, entry.population, UU_POP);
  const constraints = hydrateHardConstraints(hc, DIRECTORY);
  const point: EvaluationPoint | null =
    entry.lat != null && entry.lon != null
      ? { lat: entry.lat, lon: entry.lon, grain: "commune_reference", source: "commune_centroid", label: entry.nom }
      : null;
  const context: EvaluationContext = { constraints, point, conventionsVersion: PRODUCT_CONVENTIONS_VERSION };

  // Chaîne COMPARATEUR : index -> attributs -> évaluation -> filtre.
  const attrs = communeAttributesFrom(entry, taille);
  const assessments = assessHardConstraints(context, attrs);
  const filtre = hardFilter(assessments);

  // Chaîne DOSSIER : index -> ModuleFacts -> runRules -> évaluations de règles.
  const facts = mapCommuneToModuleFacts(entry as IndexCommune, {}, { hasAddress: false, tailleVille: taille });
  const run = runRules(facts, projectOf(hc), context);

  return { assessments, filtre, run };
}

const outcomeFor = (run: ReturnType<typeof chaines>["run"], key: string) =>
  run.evaluations.find((e) => e.ruleId === `territoire.hard.${key}`)!.outcome;

test("PARITÉ : une contrainte incompatible au filtre est `incompatible` au dossier", () => {
  for (const c of CORPUS) {
    for (const p of PROJETS) {
      const { filtre, run } = chaines(c, p.hc);
      for (const a of filtre.incompatible) {
        assert.equal(outcomeFor(run, a.key), "incompatible", `${c.nom} / ${p.nom} / ${a.key}`);
      }
    }
  }
});

test("PARITÉ : une commune RETENUE par le filtre n'est JAMAIS `incompatible` au dossier", () => {
  for (const c of CORPUS) {
    for (const p of PROJETS) {
      const { filtre, run } = chaines(c, p.hc);
      if (!filtre.eligible) continue;
      for (const key of HARD_CONSTRAINT_KEYS) {
        assert.notEqual(outcomeFor(run, key), "incompatible", `${c.nom} / ${p.nom} / ${key}`);
      }
    }
  }
});

test("PARITÉ : la table de correspondance tient sur les 11 clés, dans les deux sens", () => {
  for (const c of CORPUS) {
    for (const p of PROJETS) {
      const { assessments, run } = chaines(c, p.hc);
      for (const a of assessments) {
        const attendu =
          a.status === "satisfied" ? "satisfied"
          : a.status === "incompatible" ? "incompatible"
          : a.status === "not_declared" ? "not_applicable"
          : "uncertain"; // unexamined : divergence de CONDUITE assumée, jamais de constat
        assert.equal(outcomeFor(run, a.key), attendu, `${c.nom} / ${p.nom} / ${a.key}`);
      }
    }
  }
});

test("PARITÉ : une donnée manquante EXCLUT au comparateur et reste `uncertain` au dossier", () => {
  const sansDonnee = CORPUS.find((c) => c.nom === "Sans-Donnée")!;
  const { filtre, run } = chaines(sansDonnee, { reliefProche: { strength: "hard" } });
  assert.equal(filtre.eligible, false); // le filtre exclut : dans le doute, ne pas proposer
  assert.equal(outcomeFor(run, "reliefProche"), "uncertain"); // JAMAIS incompatible : divergence ASSUMÉE
});

test("PARITÉ : la taille se lit sur l'AGGLOMÉRATION dans les deux chaînes (le désaccord d'origine)", () => {
  // Villeurbanne : 8 000 habitants communaux, 1,6 M dans l'agglomération de Lyon. Le comparateur
  // l'excluait, le dossier la déclarait conforme. Les deux chaînes doivent maintenant l'exclure.
  const villeurbanne = CORPUS.find((c) => c.nom === "Villeurbanne")!;
  const { filtre, run } = chaines(villeurbanne, { communeSize: { max: 25_000 } });
  assert.equal(filtre.eligible, false);
  assert.equal(outcomeFor(run, "communeSize"), "incompatible");
});

test("PARITÉ : « quitter Lyon ET un inconnu » n'est satisfied NULLE PART", () => {
  const toulouse = CORPUS.find((c) => c.nom === "Toulouse")!;
  const projet = PROJETS.find((p) => p.nom === "quitter Lyon et un inconnu")!;
  const { assessments, run, filtre } = chaines(toulouse, projet.hc);
  const a = assessments.find((x) => x.key === "excludePlace")!;
  assert.equal(a.status, "unexamined");
  assert.equal(outcomeFor(run, "excludePlace"), "uncertain");
  assert.equal(filtre.complete, false); // le comparateur le DIT
  assert.equal(filtre.eligible, true); // sans pour autant vider la liste des résultats
});

test("PARITÉ : « la gare Matabiau » n'est plus sautée en silence, dans aucun des deux moteurs", () => {
  const toulouse = CORPUS.find((c) => c.nom === "Toulouse")!;
  const projet = PROJETS.find((p) => p.nom === "près d'un lieu non résolu")!;
  const { assessments, run, filtre } = chaines(toulouse, projet.hc);
  const a = assessments.find((x) => x.key === "nearPlace")!;
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unresolved_reference");
  assert.equal(outcomeFor(run, "nearPlace"), "uncertain"); // le critère reste NON EXAMINÉ (couperet)
  assert.equal(filtre.complete, false); // et le comparateur ne peut plus dire « tout est respecté »
});
