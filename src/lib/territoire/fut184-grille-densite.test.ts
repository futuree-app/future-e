// FUT-184 : la grille communale de densité Insee 2025 (DENS7) dans l'identité et la synthèse Territoire.
// Sur le VRAI index et la table générée. Ce qui est vérifié est ce qui est AFFICHÉ (champs du passeport, résumé,
// ligne « Rôle », phrase déterministe), pas seulement la présence d'un fait.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { GRILLE_DENSITE_CODES, GRILLE_DENSITE_SOURCE } from "./grille-densite.generated.ts";
import {
  CLASSES_GRILLE, classeGrilleOfficielle, estGrilleDensite, grilleDensiteDe, grilleUrbaine, LIBELLE_GRILLE, LIBELLE_INSEE_GRILLE,
  type ClasseGrille,
} from "./grille-densite.ts";
import { buildTerritoireSnapshot, TERRITOIRE_REGISTRY_VERSION, type TerritoireInputs } from "./facts.ts";
import { GRILLE_MEANING, projectForSynthesis, SYNTHESIS_CONTRACT_VERSION, SYNTHESIS_SYSTEM } from "./synthesis-contract.ts";
import { checkSynthesis } from "./synthesis-checks.ts";
import { deterministicSynthesis } from "./synthesis-deterministe.ts";
import { densiteInseePLM } from "./plm-densite.ts";
import { lectureCommunalePLM, libellesAgglomeration, villeDeArrondissement, type ArrondissementIndex } from "./plm-communal.ts";
import { normaliserRoleUrbain, peutDireVille, roleUrbain } from "./statut-urbain.ts";
import { chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";
import { withHash } from "../facts/hash.ts";
import { buildTerritoryIdentity, champsIdentite, peutDireVilleTerritoire } from "../territory-identity.ts";

type Entree = ArrondissementIndex & { nom: string; densite?: number | null; nature?: { brut_pct: number | null; radius_pct: number | null; composition: Record<string, number> | null } | null };
const COMMUNES = (JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes) as Entree[];
const PAR = new Map(COMMUNES.map((c) => [c.insee, c]));
const LABELS = libellesAgglomeration(COMMUNES);
const T0 = "2026-11-10T00:00:00.000Z";
const RURALE = (c: ClasseGrille) => !grilleUrbaine(c);

/** Les entrées du snapshot d'une commune réelle, comme `loadTerritoireSnapshot` (index, statut, grille ; le reste, Châtelaillon). */
function entrees(insee: string): TerritoireInputs {
  const c = PAR.get(insee)!;
  assert.ok(c, insee);
  const arr = villeDeArrondissement(insee);
  const i = chatelaillonInputs();
  return {
    ...i, insee, communeName: c.nom, ademe: null, distinctiveTrait: null,
    typology: { type: "interieur", label: "Intérieur" },
    entry: {
      ...i.entry!, population: c.population ?? null, densite: c.densite ?? null,
      nature: c.nature ? { brut_pct: c.nature.brut_pct, radius_pct: c.nature.radius_pct, composition: c.nature.composition } : null,
    },
    urbanRole: { role: roleUrbain(c.uu ?? null, c.uu_statut ?? null), uuLabel: c.uu ? LABELS.get(c.uu) ?? null : null, uuPop: c.uu_pop ?? null, ...(arr ? { arrondissementDe: arr.nom } : {}) },
    densiteInsee: densiteInseePLM(insee),
    grilleDensite: grilleDensiteDe(insee),
  };
}
function rendu(i: TerritoireInputs) {
  const s = withHash(buildTerritoireSnapshot(i, T0));
  const id = buildTerritoryIdentity(s);
  const p = projectForSynthesis(s, "gwl20");
  const texte = deterministicSynthesis(p, "gwl20");
  return {
    s, id, p, texte,
    champs: Object.fromEntries(champsIdentite(id).map((f) => [f.label, f.value])),
    phrase: texte.split("\n").find((l) => /habitants/.test(l) && !l.startsWith("#")) ?? "",
    refus: checkSynthesis(texte, p).map((v) => v.rule).filter((r) => !r.startsWith("format:")),
  };
}
const fait = (s: { facts: { key: string }[] }, key: string) => s.facts.find((f) => f.key === key) as Record<string, any>;

// ── 1. La source : le code officiel, tel quel ────────────────────────────────────────────────

test("table : 34 875 codes uniques, comptes par classe identiques au fichier Insee, éditions 2025 et 2026 concordantes", () => {
  const tous = CLASSES_GRILLE.flatMap((c) => GRILLE_DENSITE_CODES[c].split(" "));
  assert.equal(tous.length, 34875);
  assert.equal(new Set(tous).size, 34875, "aucun code dans deux classes");
  for (const c of CLASSES_GRILLE) assert.equal(GRILLE_DENSITE_CODES[c].split(" ").length, GRILLE_DENSITE_SOURCE.comptes_par_classe[String(c) as "1"], String(c));
  assert.deepEqual(GRILLE_DENSITE_SOURCE.comptes_par_classe, { 1: 699, 2: 637, 3: 947, 4: 1996, 5: 5072, 6: 18288, 7: 7236 });
  assert.equal(GRILLE_DENSITE_SOURCE.sha256, "951ae15ad9055235f3ec1d8bd7c9a2281d35f98a98e01bc2bc513f70eb1b3452");
  assert.equal(GRILLE_DENSITE_SOURCE.geographie, "2025-01-01");
  assert.equal(GRILLE_DENSITE_SOURCE.contre_epreuve.classes_differentes, 0);
  assert.equal(LIBELLE_INSEE_GRILLE[6], "Rural à habitat dispersé");
});

test("aucune classe déduite : ni parts P1/P2/P3, ni densité moyenne, dans la table comme dans la lecture", () => {
  const gen = readFileSync("src/lib/territoire/grille-densite.generated.ts", "utf8");
  const lib = readFileSync("src/lib/territoire/grille-densite.ts", "utf8");
  assert.doesNotMatch(gen, /\bP[123]\b|PMUN|densit[ée] moyenne/);
  assert.doesNotMatch(lib.replace(/^\s*(\/\/|import ).*$/gm, ""), /\bP[123]\b|habitants?ParKm2|\bdensite\b/);
  // Les 80 communes dont la classe ne se retrouve pas par les parts gardent la classe PUBLIÉE (FUT-180 §3.2).
  assert.equal(classeGrilleOfficielle("29232"), 1, "Quimper : grand centre urbain, P1 = 0 dans le fichier");
  assert.equal(classeGrilleOfficielle("13005"), 1, "Aubagne");
  assert.equal(classeGrilleOfficielle("22278"), 1, "Saint-Brieuc");
  assert.equal(classeGrilleOfficielle("2A247"), 3, "Porto-Vecchio : petite ville, P3 = 100 % dans le fichier");
  assert.equal(classeGrilleOfficielle("42127"), 2, "Mably");
});

// ── 2. Couverture nationale et grain ─────────────────────────────────────────────────────────

test("couverture : chaque commune de l'index a sa classe ; les 45 arrondissements lisent celle de leur ville, marquée comme telle", () => {
  const arrondissements = COMMUNES.filter((c) => villeDeArrondissement(c.insee));
  const communes = COMMUNES.filter((c) => !villeDeArrondissement(c.insee));
  assert.equal(communes.length, 34743);
  assert.equal(arrondissements.length, 45);
  assert.deepEqual(communes.filter((c) => !classeGrilleOfficielle(c.insee)).map((c) => c.insee), []);
  // Distribution de l'index (FUT-180 §2, reproduite).
  const dist: Record<number, number> = {};
  for (const c of communes) dist[classeGrilleOfficielle(c.insee)!] = (dist[classeGrilleOfficielle(c.insee)!] ?? 0) + 1;
  assert.deepEqual(dist, { 1: 689, 2: 617, 3: 932, 4: 1965, 5: 5038, 6: 18267, 7: 7235 });
  for (const a of arrondissements) {
    assert.equal(classeGrilleOfficielle(a.insee), null, `${a.insee} : aucune classe propre dans la grille`);
    assert.deepEqual(grilleDensiteDe(a.insee), { classe: 1, perimetre: "commune_parente", ville: villeDeArrondissement(a.insee)!.nom });
  }
  for (const v of ["75056", "69123", "13055"]) assert.deepEqual(grilleDensiteDe(v), { classe: 1, perimetre: "commune" });
  for (const absent of ["99999", "", "75000", null, undefined]) assert.equal(grilleDensiteDe(absent), null, String(absent));
  assert.equal(estGrilleDensite({ classe: 8, perimetre: "commune" }), false);
});

// ── 3. Le registre : un fait à part, une catégorie dérivée de lui seul ─────────────────────────

test("registre : `place.density_grid` à la commune, la catégorie en dérive, le chiffre en hab/km² ne bouge pas", () => {
  assert.equal(TERRITOIRE_REGISTRY_VERSION, "territoire-facts@3");
  const { s } = rendu(entrees("2B096"));
  const g = fait(s, "place.density_grid");
  assert.deepEqual([g.value, g.scale, g.vintage, g.status], [{ classe: 3, perimetre: "commune" }, "commune", "2025", "ok"]);
  assert.deepEqual(g.source, { producer: "INSEE", dataset: "Grille communale de densité 2025 (recensement 2021), géographie au 2025-01-01", field: "DENS7" });
  assert.match(g.limits, /commune entière.*ni un quartier, ni une adresse, ni la forme du bâti/);
  assert.equal(g.provenance.version, "Grille 2025");
  assert.equal(g.provenance.period, "2021");
  const cat = s.derived.find((d) => d.key === "density.category")!;
  assert.deepEqual([cat.value, cat.label, cat.rule, cat.from], ["dens7_3", "Petite ville — classification Insee", "density-grid-insee-2025@1", ["place.density_grid"]]);
  assert.equal(fait(s, "place.density").value, PAR.get("2B096")!.densite, "la densité moyenne reste celle de l'index");
});

test("absence : sans classe connue, ni catégorie, ni ligne, ni phrase ; jamais un palier de densité à la place", () => {
  const i = { ...entrees("2B096"), grilleDensite: null };
  const r = rendu(i);
  assert.equal(fait(r.s, "place.density_grid").status, "missing");
  assert.equal(r.s.derived.find((d) => d.key === "density.category"), undefined);
  assert.equal(r.champs["Grille de densité Insee"], undefined);
  assert.equal(r.champs["Densité moyenne"], "52 hab/km²");
  assert.equal(r.p.commune.grille_densite_insee, null);
  assert.match(r.phrase, /^Corte, 7 654 habitants, seule commune de son agglomération, compte 52 habitants au km² en moyenne\./);
  assert.doesNotMatch(r.texte, /grille|peu dense|densité intermédiaire/);
});

test("compatibilité : un snapshot d'avant FUT-184 (catégorie « Commune peu dense ») n'affiche aucun ancien palier", () => {
  const s = withHash(buildTerritoireSnapshot({ ...entrees("2B096"), grilleDensite: null }, T0));
  s.derived.push({ key: "density.category", value: "low", label: "Commune peu dense", from: ["place.density"], rule: "density-category@1", card: { card: "identity" }, synthesis: { include: true } } as never);
  const id = buildTerritoryIdentity(s);
  assert.equal(id.grille, null);
  assert.doesNotMatch(JSON.stringify(champsIdentite(id)), /peu dense/);
});

// ── 4. Ce qui est affiché, commune par commune (panel du ticket) ───────────────────────────────

type Attendu = { grille: string | null; densite: string | null; resume: string; role: string | null; phrase: RegExp };
const PANEL: Record<string, Attendu> = {
  // Corte : « Commune peu dense » (52 hab/km²) avant ; ville universitaire, petite ville pour l'Insee.
  "2B096": { grille: "Petite ville — classification Insee", densite: "52 hab/km²", resume: "Ville de l'intérieur, Corte forme à elle seule une agglomération.", role: "Forme à elle seule une agglomération",
    phrase: /^Corte, 7 654 habitants, seule commune de son agglomération, relève de la catégorie « Petite ville » de la grille communale de densité de l'Insee \(52 habitants au km² en moyenne\)\./ },
  // Arles : 67 hab/km² (Camargue comprise), centre urbain intermédiaire.
  "13004": { grille: "Centre urbain intermédiaire", densite: "67 hab/km²", resume: "Ville de l'intérieur, Arles est au centre de son agglomération.", role: "Ville-centre de l'agglomération d'Arles (53 134 habitants)",
    phrase: /relève de la catégorie « Centre urbain intermédiaire » de la grille communale de densité de l'Insee \(67 habitants au km² en moyenne\)/ },
  // Avignon, Nîmes : « Densité intermédiaire » avant ; grands centres urbains.
  "84007": { grille: "Grand centre urbain", densite: "1 414 hab/km²", resume: "Ville de l'intérieur, Avignon est au centre de son agglomération.", role: "Ville-centre de l'agglomération d'Avignon (462 747 habitants)",
    phrase: /« Grand centre urbain » de la grille communale de densité de l'Insee \(1 414 habitants au km² en moyenne\)/ },
  "30189": { grille: "Grand centre urbain", densite: "930 hab/km²", resume: "Ville de l'intérieur, Nîmes est au centre de son agglomération.", role: "Ville-centre de l'agglomération de Nîmes (183 327 habitants)",
    phrase: /« Grand centre urbain »/ },
  // Eguisheim : ceinture urbaine (carreaux périurbains de Colmar) ET hors unité urbaine : deux faits, aucun ne corrige l'autre.
  "68078": { grille: "Ceinture urbaine", densite: "123 hab/km²", resume: "Commune de l'intérieur, Eguisheim se situe hors de toute agglomération.", role: "Hors agglomération : aucun ensemble bâti continu de 2 000 habitants",
    phrase: /^Eguisheim, 1 732 habitants, hors de toute agglomération, relève de la catégorie « Ceinture urbaine »/ },
  "28199": { grille: "Bourg rural", densite: "59 hab/km²", resume: "Commune de l'intérieur, Janville-en-Beauce se situe hors de toute agglomération.", role: "Hors agglomération : aucun ensemble bâti continu de 2 000 habitants",
    phrase: /« Bourg rural »/ },
  // Mont-Dauphin : 171 habitants, 282 hab/km² en moyenne sur une petite commune, « faible densité » pour la grille.
  "05082": { grille: "Commune rurale de faible densité", densite: "282 hab/km²", resume: "Commune de l'intérieur, Mont-Dauphin s'inscrit dans l'agglomération de Guillestre.", role: "Commune de banlieue de l'agglomération de Guillestre (3 258 habitants)",
    phrase: /« Commune rurale de faible densité » de la grille communale de densité de l'Insee \(282 habitants au km² en moyenne\)/ },
  // Vallet : ville isolée Insee de 9 468 habitants, rurale pour la grille : plus « Ville » au-dessus de la classe.
  "44212": { grille: "Commune rurale de faible densité", densite: "161 hab/km²", resume: "Commune de l'intérieur, Vallet forme à elle seule une agglomération.", role: "Forme à elle seule une agglomération",
    phrase: /^Vallet, 9 468 habitants, seule commune de son agglomération, relève de la catégorie « Commune rurale de faible densité »/ },
  "02100": { grille: "Commune rurale de faible densité", densite: "17 hab/km²", resume: "Commune de l'intérieur, Bony se situe hors de toute agglomération.", role: "Hors agglomération : aucun ensemble bâti continu de 2 000 habitants",
    phrase: /« Commune rurale de faible densité »/ },
  // Sète : « Commune dense » (1 863) avant, et « Ville dense » ; centre urbain intermédiaire, plus de « dense ».
  "34301": { grille: "Centre urbain intermédiaire", densite: "1 863 hab/km²", resume: "Ville de l'intérieur, Sète est au centre de son agglomération.", role: "Ville-centre de l'agglomération de Sète (94 088 habitants)",
    phrase: /« Centre urbain intermédiaire »/ },
  "29232": { grille: "Grand centre urbain", densite: "765 hab/km²", resume: "Ville de l'intérieur, Quimper est au centre de son agglomération.", role: "Ville-centre de l'agglomération de Quimper (76 408 habitants)",
    phrase: /« Grand centre urbain »/ },
  "13005": { grille: "Grand centre urbain", densite: "869 hab/km²", resume: "Commune de l'intérieur, Aubagne s'inscrit dans l'agglomération de Marseille.", role: "Commune de banlieue de l'agglomération de Marseille (1 625 845 habitants)",
    phrase: /^Aubagne, 47 342 habitants dans l'agglomération de Marseille, relève de la catégorie « Grand centre urbain »/ },
  // Les cohabitations : bourgs ruraux qui forment ou centrent une agglomération (statut dit, « Ville » non).
  "49301": { grille: "Bourg rural", densite: "121 hab/km²", resume: "Commune de l'intérieur, Sèvremoine forme à elle seule une agglomération.", role: "Forme à elle seule une agglomération",
    phrase: /^Sèvremoine, 25 806 habitants, seule commune de son agglomération, relève de la catégorie « Bourg rural »/ },
  "79049": { grille: "Bourg rural", densite: "110 hab/km²", resume: "Commune de l'intérieur, Bressuire forme à elle seule une agglomération.", role: "Forme à elle seule une agglomération",
    phrase: /« Bourg rural »/ },
  "22093": { grille: "Bourg rural", densite: "129 hab/km²", resume: "Commune de l'intérieur, Lamballe-Armor est au centre de son agglomération.", role: "Commune-centre de l'agglomération de Lamballe-Armor (17 807 habitants)",
    phrase: /^Lamballe-Armor, 16 845 habitants, au centre de son agglomération, relève de la catégorie « Bourg rural »/ },
  // Porte des Pierres Dorées : sans densité dans l'index (ADEME la porte en production), la grille la classe quand même.
  "69114": { grille: "Ceinture urbaine", densite: null, resume: "Commune de l'intérieur, Porte des Pierres Dorées s'inscrit dans l'agglomération de Lyon.", role: "Commune de banlieue de l'agglomération de Lyon (1 703 131 habitants)",
    phrase: /relève de la catégorie « Ceinture urbaine » de la grille communale de densité de l'Insee\. / },
};

for (const [insee, a] of Object.entries(PANEL)) {
  test(`affiché · ${PAR.get(insee)?.nom} (${insee}) : grille, densité moyenne, résumé, rôle et phrase disent la même chose`, () => {
    const r = rendu(entrees(insee));
    assert.equal(r.champs["Grille de densité Insee"] ?? null, a.grille);
    assert.equal(r.champs["Densité moyenne"] ?? null, a.densite);
    assert.equal(r.id.summary, a.resume);
    assert.equal(r.champs["Rôle"] ?? null, a.role);
    assert.match(r.phrase, a.phrase);
    // L'ordre affiché : la grille d'abord, le statut d'agglomération ensuite, à part.
    const ordre = champsIdentite(r.id).map((f) => f.label);
    assert.ok(ordre.indexOf("Grille de densité Insee") < ordre.indexOf("Rôle"), ordre.join(" / "));
    // Aucun ancien palier, aucun « habitat dispersé », et la synthèse déterministe passe tous ses contrôles.
    assert.doesNotMatch(`${r.id.summary} ${r.phrase} ${JSON.stringify(r.champs)}`, /commune (peu )?dense|densité intermédiaire|dispers/i);
    assert.deepEqual(r.refus, []);
    const classe = (r.p.commune as Record<string, any>).grille_densite_insee;
    if (a.grille && RURALE(CLASSES_GRILLE.find((c) => LIBELLE_GRILLE[c] === a.grille)!)) {
      assert.doesNotMatch(`${r.id.summary} ${r.champs["Rôle"] ?? ""}`, /\bVille\b/, "classée rurale : jamais « Ville »");
    }
    assert.equal(classe?.ce_que_dit_la_categorie, a.grille ? GRILLE_MEANING[CLASSES_GRILLE.find((c) => LIBELLE_GRILLE[c] === a.grille)!] : undefined);
  });
}

test("affiché · Paris, Lyon, Marseille : la classe de la commune à son échelle ; un arrondissement la lit « à l'échelle de » sa ville", () => {
  for (const [insee, nom] of [["75056", "Paris"], ["69123", "Lyon"], ["13055", "Marseille"]] as const) {
    const l = lectureCommunalePLM(insee, COMMUNES)!;
    const r = rendu({
      ...chatelaillonInputs(), insee, communeName: nom, ademe: null, distinctiveTrait: null, catnat: null, littoral: null,
      entry: { population: l.population, densite: null, mer_centre_km: null, relief_proximite: null, altitude: null, nature: null, demographie: l.demographie },
      urbanRole: { role: roleUrbain(l.uu, l.uuStatut), uuLabel: l.uu ? LABELS.get(l.uu) ?? null : null, uuPop: l.uuPop },
      densiteInsee: densiteInseePLM(insee), grilleDensite: grilleDensiteDe(insee),
    });
    assert.equal(r.champs["Grille de densité Insee"], "Grand centre urbain", nom);
    assert.doesNotMatch(r.champs["Densité moyenne"]!, /arrondissement/, nom);
    assert.deepEqual(r.refus, [], nom);
  }
  for (const [insee, ville] of [["75111", "Paris"], ["69389", "Lyon"], ["13209", "Marseille"], ["13216", "Marseille"]] as const) {
    const r = rendu(entrees(insee));
    assert.equal(r.champs["Grille de densité Insee"], `Grand centre urbain, à l'échelle de ${ville}`, insee);
    assert.match(r.champs["Densité moyenne"]!, /hab\/km² \(arrondissement\)$/, insee);
    assert.match(r.texte, new RegExp(`La grille communale de densité de l'Insee range ${ville} entière dans la catégorie « Grand centre urbain » ; elle ne classe pas les arrondissements\\.`), insee);
    assert.equal((r.p.commune as Record<string, any>).grille_densite_insee.echelle, `commune entière de ${ville} : la grille ne classe pas les arrondissements`);
    assert.deepEqual(r.refus, [], insee);
  }
});

// ── 5. Les 1 374 cohabitations, à l'échelle nationale ──────────────────────────────────────────

test("national : « Ville » (FUT-176) sur 2 377 communes, dont 1 374 classées rurales ; aucune n'est plus appelée ville, toutes gardent leur statut", () => {
  let villeFut176 = 0;
  let cohabitations = 0;
  const parClasse: Record<number, number> = {};
  for (const c of COMMUNES) {
    if (villeDeArrondissement(c.insee)) continue;
    const role = normaliserRoleUrbain(roleUrbain(c.uu ?? null, c.uu_statut ?? null));
    const g = grilleDensiteDe(c.insee);
    if (!peutDireVille(role, c.population)) {
      assert.equal(peutDireVilleTerritoire(role, c.population, g), false, c.insee);
      continue;
    }
    villeFut176 += 1;
    if (g && RURALE(g.classe)) {
      cohabitations += 1;
      parClasse[g.classe] = (parClasse[g.classe] ?? 0) + 1;
      assert.equal(peutDireVilleTerritoire(role, c.population, g), false, c.insee);
      assert.ok(role === "ville_centre" || role === "ville_isolee", c.insee);
    } else assert.equal(peutDireVilleTerritoire(role, c.population, g), true, c.insee);
  }
  assert.equal(villeFut176, 2377);
  assert.equal(cohabitations, 1374);
  assert.deepEqual(parClasse, { 5: 1252, 6: 121, 7: 1 });
});

// ── 6. Ce que reçoit le modèle, et la consigne ───────────────────────────────────────────────

test("modèle : la grille arrive à part, avec sa portée et son sens, sans aucun seuil chiffré ; la densité ne porte plus de catégorie", () => {
  assert.match(SYNTHESIS_CONTRACT_VERSION, /^territoire-synthese@8:/);
  for (const c of CLASSES_GRILLE) assert.doesNotMatch(GRILLE_MEANING[c], /\d/, `classe ${c} : aucun seuil ne devient un nombre admis`);
  for (const c of CLASSES_GRILLE) assert.doesNotMatch(GRILLE_MEANING[c], /dispers/, `classe ${c}`);
  const p = rendu(entrees("49301")).p as Record<string, any>;
  assert.deepEqual(p.commune.densite, { habitants_par_km2: 120.9 });
  assert.deepEqual(Object.keys(p.commune.grille_densite_insee), ["categorie", "echelle", "ce_que_dit_la_categorie", "limite"]);
  assert.equal(p.commune.grille_densite_insee.categorie, "Bourg rural");
  assert.match(SYNTHESIS_SYSTEM, /Grille de densité \("grille_densite_insee"\)/);
  assert.match(SYNTHESIS_SYSTEM, /N'appelez pas "ville" une commune que la grille classe rurale/);
  assert.doesNotMatch(SYNTHESIS_SYSTEM, /si la densité est "Densité intermédiaire"/);
});

test("modèle : les contrôles refusent ce que la grille contredit, et laissent passer ce qu'elle établit (Sèvremoine, Vallet, Paris 11e)", () => {
  const refus = (insee: string, t: string) => checkSynthesis(t, rendu(entrees(insee)).p).map((v) => v.rule).filter((r) => !r.startsWith("format:") && !r.startsWith("nombre:"));
  assert.deepEqual(refus("49301", "Sèvremoine relève de la catégorie « Bourg rural » de la grille de densité, et forme à elle seule une agglomération."), []);
  assert.ok(refus("49301", "Cette ville de l'intérieur forme à elle seule une agglomération.").includes("densite:ville-pour-commune-rurale"));
  assert.ok(refus("44212", "L'habitat y est dispersé.").includes("densite:habitat-disperse"));
  assert.ok(refus("2B096", "Une commune peu dense.").includes("densite:requalifiee-peu-dense"));
  assert.ok(refus("2B096", "Une commune au caractère rural.").includes("interdit:rural"));
  assert.deepEqual(refus("28199", "Un bourg rural au milieu des cultures."), []);
  assert.ok(refus("75111", "Le 11e est un grand centre urbain.").includes("densite:arrondissement-qualifie"));
});
