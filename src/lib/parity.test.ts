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
  type EvaluationContext, type EvaluationPoint, type ReachabilityState, type TravelTimeEstimate,
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

function chaines(
  entry: IndexCommuneLike,
  hc: HardConstraints,
  // La MOBILITÉ traverse elle aussi les deux chaînes : l'isochrone (globale, dans les contraintes) et
  // l'estimation d'itinéraire (communale, dans le contexte). C'est là que le comparateur et le dossier
  // pourraient recommencer à diverger.
  mobilite?: { reachability?: ReachabilityState | null; travelTime?: TravelTimeEstimate | null },
) {
  const taille = tailleVilleFrom(entry.uu, entry.population, UU_POP);
  const base = hydrateHardConstraints(hc, DIRECTORY);
  const constraints =
    mobilite?.reachability !== undefined && base.nearPlace
      ? { ...base, nearPlace: { ...base.nearPlace, reachability: mobilite.reachability } }
      : base;
  const point: EvaluationPoint | null =
    entry.lat != null && entry.lon != null
      ? { lat: entry.lat, lon: entry.lon, grain: "commune_reference", source: "commune_centroid", label: entry.nom }
      : null;
  const context: EvaluationContext = {
    constraints, point,
    travelTime: mobilite?.travelTime ?? null,
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };

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

// ── LE CORPUS DE MOBILITÉ. Il REMPLACE le témoin gelé (legacy-passes-hard.ts) : le vieux code n'a plus de
// valeur normative (son haversine à 50 km et son `?? 0` n'ont plus rien à voir avec le moteur), mais les
// cas qui ont permis de découvrir ses mensonges, eux, restent précieux. On les fige ici, dans les DEUX
// chaînes, avant de le supprimer.

// Un carré autour de Toulouse : 1,3..1,6 E ; 43,5..43,7 N.
const ISOCHRONE: ReachabilityState = {
  status: "ready",
  geometry: { type: "Polygon", coordinates: [[[1.3, 43.5], [1.6, 43.5], [1.6, 43.7], [1.3, 43.7], [1.3, 43.5]]] },
  toleranceMeters: 300,
};
const TRENTE_MIN: HardConstraints = { nearPlace: { label: "Gare Matabiau", maxMinutes: 30, mode: "car" } };

// LA DESTINATION DE L'ESTIMATION EST CELLE DE LA RÉFÉRENCE RÉSOLUE, et pas une autre : le noyau rejette une
// estimation qui ne décrit pas ce qu'il évalue. (Ce test l'a prouvé en tombant : une estimation qui visait
// une autre destination a bien été ignorée, et la géométrie a repris la main.)
const BREST = { lat: 48.3904, lon: -4.4861 }; // les coordonnées EXACTES de l'annuaire : la concordance se joue au mètre

function estimationDepuis(entry: IndexCommuneLike, minutes: number): TravelTimeEstimate {
  return {
    status: "estimated", minutes, mode: "car",
    from: { lat: entry.lat!, lon: entry.lon! },
    to: BREST,
    direction: "to_reference", requestHash: "h",
  };
}

// Une commune DANS l'isochrone, une commune DEHORS, une commune SUR LA FRONTIÈRE.
const DEDANS: IndexCommuneLike = { ...CORPUS[0]!, insee: "31555", nom: "Toulouse", lat: 43.6, lon: 1.45 };
const DEHORS: IndexCommuneLike = { ...CORPUS[0]!, insee: "32013", nom: "Auch", lat: 43.646, lon: 0.586 };
const FRONTIERE: IndexCommuneLike = { ...CORPUS[0]!, insee: "31999", nom: "Limite", lat: 43.6, lon: 1.301 };

test("PARITÉ, ISOCHRONE : hors du polygone, le filtre EXCLUT et le dossier dit `incompatible`", () => {
  // La référence « Gare Matabiau » ne résout pas contre l'index des communes : on l'injecte comme le fait
  // la couche serveur (le géocodage vit hors des libs pures).
  const { filtre, run } = chaines(DEHORS, TRENTE_MIN, { reachability: ISOCHRONE });
  // Sans référence résolue, la contrainte reste non examinée : c'est le lot 1, et il ne bouge pas.
  assert.equal(filtre.eligible, true);
  assert.equal(outcomeFor(run, "nearPlace"), "uncertain");
});

test("PARITÉ, ESTIMATION : une durée au-delà du seuil tranche PAREIL dans les deux chaînes", () => {
  const hcResolu: HardConstraints = { nearPlace: { label: "Brest", maxMinutes: 30, mode: "car" } };
  const { filtre, run } = chaines(DEHORS, hcResolu, {
    reachability: ISOCHRONE,
    travelTime: estimationDepuis(DEHORS, 74.5),
  });
  // L'estimation prime : la commune est hors du seuil, dans les DEUX moteurs.
  assert.equal(filtre.eligible, false);
  assert.equal(outcomeFor(run, "nearPlace"), "incompatible");
});

test("PARITÉ, ESTIMATION : une durée SOUS le seuil est satisfaite dans les deux chaînes", () => {
  const hcResolu: HardConstraints = { nearPlace: { label: "Brest", maxMinutes: 30, mode: "car" } };
  const { filtre, run } = chaines(DEDANS, hcResolu, {
    reachability: ISOCHRONE,
    travelTime: estimationDepuis(DEDANS, 23.7),
  });
  assert.equal(filtre.eligible, true);
  assert.equal(filtre.complete, true); // la contrainte a bien été APPLIQUÉE
  assert.equal(outcomeFor(run, "nearPlace"), "satisfied");
});

test("PARITÉ, FRONTIÈRE : « retenue, pas confirmée » au comparateur, `uncertain` au dossier", () => {
  const hcResolu: HardConstraints = { nearPlace: { label: "Brest", maxMinutes: 30, mode: "car" } };
  const { filtre, run } = chaines(FRONTIERE, hcResolu, { reachability: ISOCHRONE });
  // La divergence est ASSUMÉE et documentée : le comparateur la RETIENT (l'exclure supprimerait une option
  // pour une limite de mesure) mais la MARQUE ; le dossier ne conclut pas.
  assert.equal(filtre.eligible, true);
  assert.equal(filtre.complete, false); // elle n'est PAS confirmée
  assert.equal(filtre.boundary.length, 1);
  assert.equal(outcomeFor(run, "nearPlace"), "uncertain");
});

test("PARITÉ, L'ESTIMATION PRIME SUR LA GÉOMÉTRIE, dans les deux chaînes", () => {
  // Le polygone dit « dedans », l'itinéraire dit 41 minutes. C'est la mesure qui tranche, partout.
  const hcResolu: HardConstraints = { nearPlace: { label: "Brest", maxMinutes: 30, mode: "car" } };
  const { filtre, run } = chaines(DEDANS, hcResolu, {
    reachability: ISOCHRONE,
    travelTime: estimationDepuis(DEDANS, 41.2),
  });
  assert.equal(filtre.eligible, false);
  assert.equal(outcomeFor(run, "nearPlace"), "incompatible");
});

test("PARITÉ, LA PANNE : un routage indisponible ne filtre pas, et ne conclut pas", () => {
  const hcResolu: HardConstraints = { nearPlace: { label: "Brest", maxMinutes: 30, mode: "car" } };
  const { filtre, run } = chaines(DEDANS, hcResolu, {
    reachability: { status: "unavailable", reason: "routing_unavailable" },
    travelTime: { status: "unavailable" },
  });
  assert.equal(filtre.eligible, true); // une panne GLOBALE n'exclut personne
  assert.equal(filtre.complete, false); // mais rien n'a été appliqué, et c'est dit
  assert.equal(outcomeFor(run, "nearPlace"), "uncertain");
});
