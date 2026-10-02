// FUT-8 : LES 21 CAS DE RÉFÉRENCE (spec §12), de bout en bout.
//
// Pour chaque texte : ce que le parseur garde (assaini), la suggestion, la précision proposée au moment de
// confirmer, la capacité (commune / adresse) avant et après la précision, et, quand la spec le fixe, le
// verdict du dossier sur la chaîne réelle (runRules + assembleDossier).
import test from "node:test";
import assert from "node:assert/strict";
import { assainirParsed } from "../parse-assainir.ts";
import { normalizeUserProject, type UserProject, type CriterionRef, type DefinitionBody } from "../user-project.ts";
import { appliquerGeste } from "./criterion-gestes.ts";
import { criterionFingerprint } from "./conditions.ts";
import { effectiveProject, parsedFingerprint } from "./effective-value.ts";
import { criterionCapability } from "./capability.ts";
import { vueCriteres } from "./projet-criteres-vue.ts";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { derivesDAncrePourRecherche } from "../ancre-recherche.ts";
import { gabaritTailleAncre } from "../ancre-gabarit.ts";
import type { ParsedProject, IndexCommune } from "../comparateur-vie.ts";
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";

const NOW = "2026-10-01T12:00:00.000Z";
const VILLES: Record<string, { insee: string; nom: string; lat: number; lon: number; uu: string; tailleVille: number }> = {
  nantes: { insee: "44109", nom: "Nantes", lat: 47.22, lon: -1.55, uu: "44701", tailleVille: 670_000 },
  lyon: { insee: "69123", nom: "Lyon", lat: 45.76, lon: 4.83, uu: "00760", tailleVille: 1_700_000 },
  bordeaux: { insee: "33063", nom: "Bordeaux", lat: 44.84, lon: -0.58, uu: "00752", tailleVille: 1_000_000 },
  brest: { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 202_000, population: 139_000 },
};
const DIR: PlaceDirectory = { byName: (k) => VILLES[k] ?? null, plmByName: () => null };

function commune(over: Partial<IndexCommune>): IndexCommune {
  return { insee: "00000", nom: "X", dept: "44", region: "PDL", lat: 47.2, lon: -1.5, population: 50_000, densite: 1000, mer_centre_km: 50, altitude: 30, clim: {}, pct: {}, ...(over as IndexCommune) };
}
const C = {
  nantes: commune({ insee: "44109", nom: "Nantes", dept: "44", uu: "44701", population: 320_000 } as Partial<IndexCommune>),
  rennes: commune({ insee: "35238", nom: "Rennes", dept: "35", region: "BRE", lat: 48.11, lon: -1.68, uu: "35701", population: 220_000 } as Partial<IndexCommune>),
  villeurbanne: commune({ insee: "69266", nom: "Villeurbanne", dept: "69", region: "ARA", lat: 45.77, lon: 4.88, uu: "00760", population: 150_000 } as Partial<IndexCommune>),
  lyon3: commune({ insee: "69383", nom: "Lyon 3e", dept: "69", region: "ARA", lat: 45.76, lon: 4.85, uu: "00760", population: 100_000 } as Partial<IndexCommune>),
  bordeaux: commune({ insee: "33063", nom: "Bordeaux", dept: "33", region: "NAQ", lat: 44.84, lon: -0.58, uu: "00752", population: 260_000, mer_centre_km: 50 } as Partial<IndexCommune>),
  toulouse: commune({ insee: "31555", nom: "Toulouse", dept: "31", region: "OCC", lat: 43.6, lon: 1.44, uu: "31701", population: 500_000 } as Partial<IndexCommune>),
  petite: commune({ insee: "44190", nom: "Savenay", dept: "44", uu: "44701", population: 8_000 } as Partial<IndexCommune>),
};

// Ce que le parseur a le droit de garder, depuis ce qu'un modèle de langue aurait pu proposer.
function lu(texte: string, propose: Partial<ParsedProject>): UserProject {
  const parsed = assainirParsed({ reformulation: texte, hardConstraints: {}, preferences: [], ...propose } as ParsedProject, texte);
  return normalizeUserProject({ posture: "recherche", rawText: texte, updatedAt: NOW, parsed })!;
}
function confirmer(p: UserProject, ref: CriterionRef, definition?: DefinitionBody): UserProject {
  const r = appliquerGeste(p, { action: "confirmer", criterion: ref, seen: criterionFingerprint(p, ref)!, ...(definition ? { definition } : {}) }, NOW);
  assert.equal(r.ok, true, r.ok ? "" : r.error);
  return (r as { project: UserProject }).project;
}
function capacite(p: UserProject, ref: CriterionRef): string {
  const eff = effectiveProject(p);
  if (ref.kind === "preference") return criterionCapability(ref, "commune").capability === "trancher" ? "T" : "Ap";
  const hc = eff.parsed?.hardConstraints ?? {};
  const c = (g: "commune" | "adresse") => ({ trancher: "T", apprecier: "Ap", ne_pas_mesurer: "N" })[criterionCapability({ kind: "hard", key: ref.key, hc }, g).capability];
  return `${c("commune")}/${c("adresse")}`;
}
function verdict(e: IndexCommune, brut: UserProject) {
  const p = effectiveProject(brut);
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: (e as { tailleVille?: number }).tailleVille ?? e.population ?? null, tailleVilleSource: "commune" });
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints(p.parsed!.hardConstraints, DIR),
    point: { lat: e.lat!, lon: e.lon!, grain: "commune_reference", source: "commune_centroid", label: e.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(mf, p, ctx);
  const d = assembleDossier(run, p, "commune", e.nom);
  const roles = new Set(run.facts.map((f) => f.role));
  return {
    label: d.narrativePlan.verdictLabel,
    nonRespectee: roles.has("incompatibility"),
    respectee: roles.has("condition_met"),
    ouverte: roles.has("condition_check"),
    run,
  };
}
const H = (key: CriterionRef["key"], instance: string | null = null) => ({ kind: "hard", key, instance }) as CriterionRef;
const P = (key: string) => ({ kind: "preference", key, instance: null }) as CriterionRef;
const vue = (p: UserProject, ref: CriterionRef) => vueCriteres(p).find((v) => v.ref.key === ref.key && (v.ref.instance ?? null) === (ref.instance ?? null))!;

test("1. « Je veux absolument vivre en Bretagne » : suggestion, interprétation au moment de confirmer, Nantes non respectée, Rennes respectée", () => {
  const p = lu("Je veux absolument vivre en Bretagne", {
    hardConstraints: { zones: [{ zone: "bretagne", strength: "hard" }] },
    forceMarkers: [{ criterion: { kind: "hard", key: "zones", instance: null }, quote: "absolument" }],
  });
  const v = vue(p, H("zones"));
  assert.equal(v.motFort, "absolument");
  assert.equal(v.confirmation.options.length, 0);
  assert.match(v.confirmation.phrase!, /limites régionales actuelles/);
  assert.equal(capacite(p, H("zones")), "T/T");
  const c = confirmer(p, H("zones"));
  assert.equal(verdict(C.nantes, c).nonRespectee, true);
  assert.equal(verdict(C.nantes, c).label, "Condition non respectée");
  assert.equal(verdict(C.rennes, c).respectee, true);
});

test("2. « En Bretagne » : aucune suggestion, la condition reste possible par un geste", () => {
  const p = lu("En Bretagne", { hardConstraints: { zones: [{ zone: "bretagne", strength: "hard" }] } });
  assert.equal(vue(p, H("zones")).motFort, null);
  assert.equal(verdict(C.nantes, p).nonRespectee, false, "sans confirmation, jamais « non respectée »");
  assert.equal(verdict(C.nantes, confirmer(p, H("zones"))).nonRespectee, true);
});

test("3 et 4. Canicules : appréciées ; confirmées, la condition reste ouverte (jamais respectée ni non respectée)", () => {
  const p3 = lu("Je veux éviter les canicules", { preferences: [{ key: "faible_chaleur", weight: 2 }] });
  assert.equal(capacite(p3, P("faible_chaleur")), "Ap");
  const p4 = lu("Les canicules sont rédhibitoires pour moi", {
    preferences: [{ key: "faible_chaleur", weight: 3 }],
    forceMarkers: [{ criterion: { kind: "preference", key: "faible_chaleur", instance: null }, quote: "rédhibitoires" }],
  });
  assert.equal(vue(p4, P("faible_chaleur")).motFort, "rédhibitoires");
  const v = verdict(C.toulouse, confirmer(p4, P("faible_chaleur")));
  assert.equal(v.nonRespectee || v.respectee, false);
});

test("5. « Une petite ville » : aucune borne, le mot, une préférence appréciée", () => {
  const p = lu("Une petite ville", {
    hardConstraints: { communeSize: { min: 5000, max: 25000 } }, sizeWord: "petite",
    preferences: [{ key: "eviter_grandes_villes", weight: 2 }],
  });
  assert.equal(p.parsed?.hardConstraints?.communeSize, null);
  assert.equal(vue(p, P("eviter_grandes_villes")).titre, "Une petite ville");
  assert.equal(capacite(p, P("eviter_grandes_villes")), "Ap");
});

test("6 et 7. Une taille chiffrée avec son unité se tranche, sur la commune ou sur l'agglomération", () => {
  const p6 = lu("Une commune de moins de 20 000 habitants", { hardConstraints: { communeSize: { max: 20000, unit: "commune" } } });
  assert.equal(capacite(p6, H("communeSize")), "T/T");
  const c6 = confirmer(p6, H("communeSize"));
  assert.equal(verdict(C.petite, c6).respectee, true, "8 000 habitants dans la commune, même dans l'agglomération nantaise");
  const p7 = lu("Une agglomération de moins de 100 000 habitants", { hardConstraints: { communeSize: { max: 100000, unit: "unite_urbaine" } } });
  const v7 = verdict({ ...C.petite, tailleVille: 670_000 } as IndexCommune, confirmer(p7, H("communeSize")));
  assert.equal(v7.nonRespectee, true, "l'agglomération nantaise dépasse 100 000 habitants");
});

test("8 et 9. « À moins de 20 km de Nantes » : précision vol d'oiseau / route au moment de confirmer ; tranchée à l'adresse seulement", () => {
  const p8 = lu("À moins de 20 km de Nantes", { hardConstraints: { nearPlace: { label: "Nantes", maxKm: 20 } } });
  const v = vue(p8, H("nearPlace"));
  assert.deepEqual(v.confirmation.options.map((o) => o.label), ["À vol d'oiseau", "Par la route"]);
  assert.deepEqual(v.confirmation.options.map((o) => o.portee), ["adresse_seulement", "apprecier"]);
  assert.equal(capacite(p8, H("nearPlace")), "Ap/Ap");
  const c8 = confirmer(p8, H("nearPlace"), { kind: "distance_lieu", metric: "vol_oiseau", maxKm: 20 });
  assert.equal(capacite(c8, H("nearPlace")), "Ap/T");
  const p9 = lu("À moins de 20 km à vol d'oiseau de Nantes", { hardConstraints: { nearPlace: { label: "Nantes", maxKm: 20, metric: "vol_oiseau" } } });
  assert.equal(capacite(p9, H("nearPlace")), "Ap/T");
  assert.equal(vue(p9, H("nearPlace")).confirmation.options.length, 0);
});

test("8 bis. Une précision sans condition change la lecture : l'écart parle de vol d'oiseau, aucune condition n'est créée", () => {
  const p = lu("À moins de 20 km de Nantes", { hardConstraints: { nearPlace: { label: "Nantes", maxKm: 20 } } });
  const ref = H("nearPlace");
  const r = appliquerGeste(p, { action: "definir", criterion: ref, seen: parsedFingerprint(p, ref)!, definition: { kind: "distance_lieu", metric: "vol_oiseau", maxKm: 20 } }, NOW);
  assert.ok(r.ok);
  const v = verdict(C.rennes, (r as { project: UserProject }).project);
  const ecart = v.run.facts.find((f) => f.role === "mismatch" && f.projectKey === "nearPlace");
  assert.ok(ecart, "l'écart existe");
  assert.match(ecart!.statement, /à vol d'oiseau/);
  assert.equal(v.run.facts.some((f) => f.role === "condition_check" || f.role === "condition_met" || f.role === "incompatibility"), false);
});

test("10 et 11. « 30 minutes de Nantes » : en voiture ou à pied au moment de confirmer ; tranchée à l'adresse", () => {
  const p10 = lu("À moins de 30 minutes de Nantes", { hardConstraints: { nearPlace: { label: "Nantes", maxMinutes: 30 } } });
  assert.deepEqual(vue(p10, H("nearPlace")).confirmation.options.map((o) => o.label), ["En voiture", "À pied"]);
  const c10 = confirmer(p10, H("nearPlace"), { kind: "temps_lieu", mode: "car", maxMinutes: 30 });
  assert.equal(capacite(c10, H("nearPlace")), "Ap/T");
  const p11 = lu("À moins de 30 minutes de Nantes en voiture", { hardConstraints: { nearPlace: { label: "Nantes", maxMinutes: 30, mode: "car" } } });
  assert.equal(capacite(p11, H("nearPlace")), "Ap/T");
});

test("12. « Près de Nantes » : le lecteur saisit son seuil ; tranchée à l'adresse après précision", () => {
  const p = lu("Près de Nantes", { hardConstraints: { nearPlace: { label: "Nantes" } } });
  const v = vue(p, H("nearPlace"));
  assert.ok(v.confirmation.saisieSeuil);
  assert.equal(v.confirmation.question, "À combien de Nantes, au plus ?");
  const c = confirmer(p, H("nearPlace"), { kind: "distance_lieu", metric: "vol_oiseau", maxKm: 15 });
  assert.equal(capacite(c, H("nearPlace")), "Ap/T");
});

test("13, 14, 15. Quitter Lyon : le périmètre décide ; Villeurbanne et Lyon 3e", () => {
  const p13 = lu("Quitter Lyon", { hardConstraints: { excludePlace: [{ label: "Lyon" }] } });
  const lyon = H("excludePlace", "lyon");
  assert.deepEqual(vue(p13, lyon).confirmation.options.map((o) => o.label), ["La commune seulement", "Toute l'agglomération"]);
  assert.equal(capacite(p13, lyon), "Ap/Ap");
  const p14 = lu("Quitter la commune de Lyon", { hardConstraints: { excludePlace: [{ label: "Lyon", scope: "commune" }] } });
  const c14 = confirmer(p14, lyon);
  assert.equal(verdict(C.villeurbanne, c14).respectee, true);
  assert.equal(verdict(C.lyon3, c14).nonRespectee, true);
  const p15 = lu("Quitter l'agglomération lyonnaise", { hardConstraints: { excludePlace: [{ label: "Lyon", scope: "unite_urbaine" }] } });
  assert.equal(verdict(C.villeurbanne, confirmer(p15, lyon)).nonRespectee, true);
});

test("16. « Dans le Sud-Ouest » : le périmètre se montre et s'accepte ; puis il tranche", () => {
  const p = lu("Dans le Sud-Ouest", { hardConstraints: { zones: [{ zone: "sud_ouest", strength: "hard" }] } });
  const v = vue(p, H("zones"));
  assert.equal(v.confirmation.options.length, 1);
  assert.equal(v.confirmation.options[0]!.label, "Ça me convient");
  assert.equal(capacite(p, H("zones")), "Ap/Ap");
  const c = confirmer(p, H("zones"), v.confirmation.options[0]!.definition);
  assert.equal(capacite(c, H("zones")), "T/T");
  assert.equal(verdict(C.toulouse, c).respectee, true);
  assert.equal(verdict(C.nantes, c).nonRespectee, true);
});

test("17, 18, 19. Façade, massif, montagne : rien ne les rend tranchables ; la condition reste ouverte", () => {
  for (const [texte, hc, ville] of [
    ["Sur la côte atlantique", { zones: [{ zone: "atlantique", strength: "hard" }] }, C.bordeaux],
    ["Dans les Pyrénées", { zones: [{ zone: "pyrenees", strength: "hard" }] }, C.toulouse],
  ] as [string, HardConstraints, IndexCommune][]) {
    const p = lu(texte, { hardConstraints: hc });
    assert.equal(vue(p, H("zones")).confirmation.options.length, 0, texte);
    assert.equal(capacite(p, H("zones")), "Ap/Ap", texte);
    const v = verdict(ville, confirmer(p, H("zones")));
    assert.equal(v.respectee || v.nonRespectee, false, texte);
  }
  const m = lu("Vivre à la montagne", { hardConstraints: { montagne: { strength: "hard" } } });
  assert.equal(capacite(m, H("montagne")), "Ap/Ap");
  assert.match(vue(m, H("montagne")).interpretation!, /centre de la commune/);
});

test("20. « Une ville comme Brest » : ni exclusion ni fourchette dans le projet ; la Recherche les recalcule ; l'adoption survit à Lorient", () => {
  const p = normalizeUserProject({
    posture: "recherche", rawText: "Une ville comme Brest", updatedAt: NOW,
    parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "vie_locale", weight: 2, source: "ancre" }], communeAncre: [{ label: "Brest", insee: "29019" }] },
  })!;
  assert.equal(p.parsed?.hardConstraints?.excludePlace, undefined);
  assert.equal(vue(p, P("vie_locale")).etat, "inspire");
  const recherche = derivesDAncrePourRecherche(p.parsed!, [{ nom: "Brest" }], gabaritTailleAncre(202_000));
  assert.deepEqual(recherche.hardConstraints.excludePlace, [{ label: "Brest" }]);
  const garde = appliquerGeste(p, { action: "adopter", criterion: { kind: "preference", key: "vie_locale" }, seen: criterionFingerprint(p, P("vie_locale"))! }, NOW);
  assert.ok(garde.ok);
  const lorient = normalizeUserProject({ ...(garde as { project: UserProject }).project, parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "cadre_calme", weight: 2, source: "ancre" }], communeAncre: [{ label: "Lorient" }] } })!;
  assert.ok(vueCriteres(lorient).some((v) => v.ref.key === "vie_locale"), "le critère gardé reste");
  // Le dossier sur Brest ne parle jamais de quitter Brest.
  const brest = commune({ insee: "29019", nom: "Brest", dept: "29", region: "BRE", lat: 48.39, lon: -4.48, uu: "29701", population: 139_000 } as Partial<IndexCommune>);
  assert.equal(verdict(brest, p).run.facts.some((f) => f.role === "mismatch" && f.projectKey === "excludePlace"), false);
});

test("21. « Je dois absolument quitter Lyon, et j'aimerais éviter Bordeaux » : suggestion et condition pour Lyon seulement", () => {
  const p = lu("Je dois absolument quitter Lyon, et j'aimerais éviter Bordeaux", {
    hardConstraints: { excludePlace: [{ label: "Lyon" }, { label: "Bordeaux" }] },
    forceMarkers: [{ criterion: { kind: "hard", key: "excludePlace", instance: "Lyon" }, quote: "absolument" }],
  });
  assert.equal(vue(p, H("excludePlace", "lyon")).motFort, "absolument");
  assert.equal(vue(p, H("excludePlace", "bordeaux")).motFort, null);
  const c = confirmer(p, H("excludePlace", "lyon"), { kind: "quitter_ville", scope: "unite_urbaine" });
  assert.equal(verdict(C.villeurbanne, c).nonRespectee, true);
  const merignac = commune({ insee: "33281", nom: "Mérignac", dept: "33", region: "NAQ", lat: 44.84, lon: -0.65, uu: "00752" } as Partial<IndexCommune>);
  const vm = verdict(merignac, c);
  assert.equal(vm.nonRespectee, false);
  assert.ok(vm.run.facts.some((f) => f.role === "mismatch" && f.projectKey === "excludePlace"), "Bordeaux reste un écart");
});

// ── LE TEXTE RENDU DIT CE QUE LE DOSSIER A RETENU (corollaire d'AGENTS.md : apparaître ≠ dire vrai) ──

const texteDe = (v: ReturnType<typeof verdict>, role: string) =>
  v.run.facts.filter((f) => f.role === role).map((f) => f.statement).join(" ");

test("texte : « quitter la commune de Lyon » se dit avec la commune, à Villeurbanne comme à Lyon 3e", () => {
  const p = confirmer(lu("Quitter la commune de Lyon", { hardConstraints: { excludePlace: [{ label: "Lyon", scope: "commune" }] } }), H("excludePlace", "lyon"));
  const villeurbanne = texteDe(verdict(C.villeurbanne, p), "condition_met");
  assert.match(villeurbanne, /hors de la commune de Lyon/);
  assert.doesNotMatch(villeurbanne, /agglomération/);
  assert.match(texteDe(verdict(C.lyon3, p), "incompatibility"), /fait partie de la commune de Lyon/);
});

test("texte : « plus petite que la commune de Brest » parle de la commune, jamais d'une agglomération qui n'existe pas", () => {
  const brest = H("sizeRelativeTo");
  const p = confirmer(lu("Une commune plus petite que Brest", { hardConstraints: { sizeRelativeTo: { label: "Brest", direction: "smaller", unit: "commune" } } }), brest);
  const villeurbanne = texteDe(verdict(C.villeurbanne, p), "incompatibility");
  assert.match(villeurbanne, /150\D000 habitants, plus que la commune de Brest/);
  const petite = texteDe(verdict({ ...C.petite, insee: "29232", nom: "Quimper", uu: "29701" } as IndexCommune, p), "condition_met");
  assert.match(petite, /^Quimper compte/);
  assert.doesNotMatch(petite, /agglomération/);
});

test("texte : une commune de l'agglomération de référence ne se dit jamais « plus grande » qu'elle-même", () => {
  const lyon = { label: "Lyon", direction: "smaller" as const, unit: "unite_urbaine" as const };
  const p = confirmer(lu("Une agglomération plus petite que Lyon", { hardConstraints: { sizeRelativeTo: lyon } }), H("sizeRelativeTo"));
  const t = texteDe(verdict({ ...C.villeurbanne, tailleVille: 1_700_000 } as IndexCommune, p), "incompatibility");
  assert.match(t, /fait partie de l'agglomération de Lyon elle-même/);
});
