import test from "node:test";
import assert from "node:assert/strict";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { controlesParEchelle } from "./dossier-view.ts";
import type { IndexCommune } from "../comparateur-vie.ts";
import type { UserProject } from "../user-project.ts";
import type { PermisSnapshot } from "../logement-autour-types.ts";
import type { DossierCard, ModuleFacts } from "./decision-fact.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// BOUT EN BOUT : snapshot gelé -> ModuleFacts -> runRules -> dossier assemblé -> ce qui s'affiche.
//
// POURQUOI CE FICHIER EXISTE, ALORS QUE `permis-rules.test.ts` COUVRE DÉJÀ LA RÈGLE.
// Les vingt-trois tests de la règle appellent `evaluate` puis, pour un seul d'entre eux, `runRules`.
// Aucun ne dit ce que le LECTEUR voit. Or le plan du lot nomme trois vérifications à l'écran, et
// deux d'entre elles ne demandent ni session ni navigateur, seulement le dossier assemblé :
//
//   1. le fait est rangé sous « Autour de l'adresse », et pas dans le Logement ;
//   2. le compte annoncé par le verdict l'INCLUT.
//
// Le second est celui qui mordait. Le lot précédent a gravé une promesse : « le lecteur compte les
// cartes et retombe sur le chiffre ». Ce lot ajoute un contrôle à la liste ; s'il n'était pas
// compté, la promesse cassait en silence, et aucun test de règle ne l'aurait vu.
//
// Ce qui reste à l'écran, et qui n'est pas ici : le rendu réel des composants sur un dossier
// authentifié.
// ════════════════════════════════════════════════════════════════════════════════════════════

const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };

function entry(): IndexCommune {
  return {
    insee: "17300", nom: "La Rochelle", dept: "17", region: "Nouvelle-Aquitaine",
    lat: 46.16, lon: -1.15, population: 75000, densite: 2900, distance_cote_km: 1,
    altitude: 10, clim: {}, pct: {},
  } as IndexCommune;
}

function project(): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: [] } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

function context(f: { lat: number; lon: number; nom: string }): EvaluationContext {
  return {
    constraints: hydrateHardConstraints({}, DIR),
    point: { lat: f.lat, lon: f.lon, grain: "address", source: "address_geocoder", label: f.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}

const snapshot = (
  liste: { annee: number; etat: "acheve" | "chantier_ouvert" | "autorise_non_commence" }[],
): PermisSnapshot => ({
  permis: liste, rayonMeters: 50, ancienneteMaxAns: 3, anneeReference: 2026,
  consulteLe: "2026-08-01T00:00:00.000Z",
});

/** Le dossier tel qu'il serait assemblé pour une adresse, avec ou sans registre consulté. */
function dossierFor(permis?: PermisSnapshot) {
  const e = entry();
  const base = mapCommuneToModuleFacts(e, {}, {
    hasAddress: true, tailleVille: e.population ?? null, tailleVilleSource: "commune",
  });
  const mf: ModuleFacts = { ...base, hasAddress: true, ...(permis ? { permis } : {}) };
  return assembleDossier(runRules(mf, project(), context(mf)), project(), "commune", e.nom);
}

const cartesDe = (cards: DossierCard[] | undefined) =>
  (cards ?? []).flatMap((c) => (c.kind === "fact" ? [c.fact] : []));

const permisDuDossier = (d: ReturnType<typeof dossierFor>) =>
  d.sections.flatMap((s) => cartesDe(s.cards)).find((f) => f.ruleId === "autour.permis");

test("E2E : un chantier ouvert traverse la chaîne et devient une carte du dossier", () => {
  const d = dossierFor(snapshot([{ annee: 2025, etat: "chantier_ouvert" }]));
  const f = permisDuDossier(d);
  assert.ok(f, "aucune carte permis dans le dossier assemblé");
  assert.equal(f!.role, "verification");
  assert.equal(f!.materialityTier, "secondary");
  assert.match(f!.statement, /à moins de 50 m/);
});

test("E2E : le fait est rangé sous « AUTOUR DE L'ADRESSE », pas dans le logement", () => {
  // C'est le grain de la preuve qui le classe (adresse + proximité => quartier). Rangé ailleurs, il
  // décrirait le bien plutôt que ce que le lecteur vivra autour.
  const d = dossierFor(snapshot([{ annee: 2025, etat: "chantier_ouvert" }]));
  const groupes = controlesParEchelle(d);
  const groupe = groupes.find((g) =>
    g.cards.some((c) => c.kind === "fact" && c.fact.ruleId === "autour.permis"));
  assert.ok(groupe, "le permis n'apparaît dans aucun groupe de contrôles");
  assert.match(groupe!.titre ?? "", /autour/i, `rangé sous « ${groupe!.titre} »`);
});

test("LE COMPTE DU VERDICT INCLUT LE NOUVEAU CONTRÔLE", () => {
  // La promesse gravée le 01/08 : « le lecteur compte les cartes et retombe sur le chiffre ». Ce lot
  // ajoute un contrôle ; s'il n'entrait pas dans le total, la promesse casserait sans bruit.
  const sans = dossierFor(undefined);
  const avec = dossierFor(snapshot([{ annee: 2025, etat: "chantier_ouvert" }]));

  const total = (d: ReturnType<typeof dossierFor>) => {
    const c = d.narrativePlan?.controles;
    return c ? c.visibles + c.enPlus : null;
  };
  const tSans = total(sans);
  const tAvec = total(avec);
  assert.ok(tSans !== null && tAvec !== null, "le plan narratif ne porte pas de périmètre de contrôles");
  assert.equal(
    tAvec, tSans! + 1,
    `le total est passé de ${tSans} à ${tAvec} : le permis n'est pas compté`,
  );
});

test("REGISTRE NON CONSULTÉ : aucune carte, et le dossier reste identique", () => {
  // Le pendant du test précédent. Un dossier antérieur au 01/08/2026 ne doit rien gagner ni rien
  // perdre : la règle se tait, elle n'invente pas une absence d'autorisation.
  const d = dossierFor(undefined);
  assert.equal(permisDuDossier(d), undefined);
});

test("TOUTES ACHEVÉES : aucune carte non plus, et pour une raison différente", () => {
  const d = dossierFor(snapshot([{ annee: 2024, etat: "acheve" }]));
  assert.equal(permisDuDossier(d), undefined);
});
