// FUT-50 · VERSION C · CE QUE LES PASTILLES DISENT, ET OÙ MÈNENT LES LIENS.
//
// « La carte apparaît » et « la carte dit vrai » sont deux assertions distinctes (AGENTS.md) : on vérifie ici
// le texte rendu pour chaque issue, l'honnêteté des absences, et que chaque lien de l'accueil C pointe vers une
// route qui existe.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PASTILLES, pastillesDe, lireChaleur, lireTaille, lireHivers, lireRisques, lireAdresse, valeurAffichee, MOT_DU_SIGNAL, type Lieu, type EntreesChaleur } from "./pastilles.ts";
import { buildClimatFacts, classifyClimateComfort, CLIMAT_METRICS } from "../../../../lib/decision/climat-facts.ts";
import { CAS_SETE } from "../cas-sete.ts";

const SETE: Lieu = { type: "commune", libelle: "Sète", commune: "Sète", insee: "34301" };
const ADRESSE_NIMES: Lieu = { type: "adresse", libelle: "1 Place de l'Hôtel de Ville 30000 Nîmes", commune: "Nîmes", insee: "30189" };
const GESTE = "Renseignez votre adresse pour descendre au niveau du logement";
const aCommune = (n: string) => `à ${n}`;

test("quatre pastilles au plus, aucune présélectionnée, libellés compréhensibles", () => {
  assert.ok(PASTILLES.length <= 4);
  assert.deepEqual(PASTILLES.map((p) => p.libelle), [
    "Éviter les fortes chaleurs", "Avoir des hivers doux", "Vivre dans une petite ville", "Connaître les risques naturels",
  ]);
  assert.deepEqual(pastillesDe("mobilite").map((p) => p.cle), ["chaleur", "taille", "voiture", "risques"]);
  const hero = readFileSync("src/components/prototypes/fut50/c/HeroLieu.tsx", "utf8");
  assert.match(hero, /useState<CleePastille\[\]>\(\[\]\)/, "aucune priorité présélectionnée");
  assert.doesNotMatch(hero, /\/qna|anthropic|generat/i, "aucune génération IA depuis le hero");
});

test("hero : le champ ne cherche que des COMMUNES, l'adresse a sa propre porte vers /dossier", () => {
  const hero = readFileSync("src/components/prototypes/fut50/c/HeroLieu.tsx", "utf8");
  assert.match(hero, /urlRechercheCommunes\(/);
  assert.doesNotMatch(hero, /urlRechercheBan\(/, "aucune recherche d'adresse dans le champ principal");
  assert.match(hero, /Vous avez déjà une adresse précise \? <Link href="\/dossier"/);
});

test("hero : aucun exemple d'une autre commune, aucun résultat avant le choix d'une priorité", () => {
  const hero = readFileSync("src/components/prototypes/fut50/c/HeroLieu.tsx", "utf8");
  assert.doesNotMatch(hero, /CAS_SETE|Sète/, "aucun exemple Sète dans le hero");
  // La colonne de lecture ne rend rien hors de l'état « priorité ».
  assert.match(hero, /etat !== "priorite" \|\| !lieu \|\| !focale \? null/);
});

test("section Dossier Adresse : absente de l'accueil public tant que le film réel n'existe pas", () => {
  const src = readFileSync("src/components/prototypes/fut50/c/SectionsC.tsx", "utf8");
  assert.match(src, /export const FILM_DOSSIER: Film \| null = null;/);
  assert.match(src, /export const EXEMPLE_DOSSIER_URL: string \| null = null;/);
  assert.match(src, /if \(!FILM_DOSSIER && !maquette\) return null;/);
  // Dans le prototype, la maquette se déclare comme telle.
  const plans = readFileSync("src/components/prototypes/fut50/c/PlansDossier.tsx", "utf8");
  assert.match(plans, /maquette · sans données/);
  assert.doesNotMatch(plans, /\d+ (jours|nuits|habitants|°C)/, "aucune valeur inventée dans les cadres");
});

test("le storyboard dure entre 18 et 22 secondes, plans continus", () => {
  // PlansDossier contient du JSX, que `node --test` ne lit pas : on relit les durées dans la source.
  const src = readFileSync("src/components/prototypes/fut50/c/PlansDossier.tsx", "utf8");
  const bornes = [...src.matchAll(/debut: (\d+), fin: (\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.equal(bornes.length, 5);
  for (let i = 1; i < bornes.length; i++) assert.equal(bornes[i]![0], bornes[i - 1]![1], "plans continus");
  const duree = bornes[bornes.length - 1]![1];
  assert.ok(duree >= 18 && duree <= 22, `${duree} s`);
});

test("petite ville : la population dite simplement, la convention du moteur en clair, le bon grain", () => {
  const base = { phraseTaille: null, population: 1058439, source: "urban_unit" as const };
  const lille = lireTaille({ ...SETE, commune: "Lille", insee: "59350", libelle: "Lille" }, { issue: "mismatch", ...base });
  assert.equal(lille.pourVous.signal, "defavorable");
  assert.equal(lille.fait!.texte, `Environ ${(1058439).toLocaleString("fr-FR")} habitants dans l'agglomération de Lille.`);
  assert.equal(lille.fait!.grain, "unite_urbaine", "la taille d'une agglomération n'est pas présentée comme communale");
  assert.match(lille.pourVous.texte, /^Plus de 100.000 habitants : ce n'est pas une petite ville\.$/);
  assert.match(lireTaille(SETE, { issue: "indeterminate", ...base, population: 94088 }).pourVous.texte, /^Entre 25.000 et 100.000 habitants/);
  const village = lireTaille(SETE, { issue: "favorable", phraseTaille: null, population: 151, source: "commune" });
  assert.equal(village.fait!.grain, "commune");
  assert.match(village.pourVous.texte, /^Moins de 25.000 habitants/);
  assert.equal(lireTaille(SETE, { issue: "absent", phraseTaille: null, population: null, source: null }).pourVous.signal, "indisponible");
});

test("hivers doux : la position du moteur, la température de référence, la limite ; neutre sans carte", () => {
  const nice = lireHivers(SETE, {
    issue: "favorable",
    position: "Pour la douceur des hivers, Sète se situe parmi les 5 % de communes aux hivers les plus doux de France.",
    limite: "Cette position décrit la douceur hivernale (température moyenne de décembre à février) sur la période de référence 1976-2005. Les fortes chaleurs estivales, notamment futures, sont traitées à part.",
    temperatureReference: "Température moyenne de l'hiver : 8,4 °C sur la période de référence 1976-2005.",
  });
  assert.equal(nice.pourVous.signal, "favorable");
  assert.match(nice.aVerifier, /1976-2005/);
  const neutre = lireHivers(SETE, { issue: "indeterminate", position: null, limite: null, temperatureReference: null });
  assert.equal(neutre.pourVous.signal, "neutre");
  assert.match(neutre.pourVous.texte, /ne se distingue ni parmi les communes les plus favorables, ni parmi les moins favorables/);
  assert.equal(lireHivers(SETE, { issue: "absent", position: null, limite: null, temperatureReference: null }).pourVous.signal, "indisponible");
});

test("risques : une INFORMATION de la commune entière, et Géorisques muet n'est pas « aucun risque »", () => {
  const l = lireRisques(SETE, ["Inondation", "Feu de forêt"]);
  assert.equal(l.pourVous.signal, "information");
  assert.equal(l.fait?.texte, "L'État recense pour la commune : inondation et feu de forêt.");
  const muet = lireRisques(SETE, null);
  assert.equal(muet.pourVous.signal, "indisponible");
  assert.match(muet.pourVous.texte, /ne dit pas qu'il n'y a pas de risque/);
});

test("sans voiture : se lit à l'adresse ; une ADRESSE choisie n'est lue qu'à l'échelle de sa commune", () => {
  const l = lireAdresse("voiture", ADRESSE_NIMES, aCommune);
  assert.equal(l.pourVous.signal, "adresse");
  assert.equal(l.fait, null, "aucune donnée communale présentée comme propre à l'adresse");
  assert.equal(l.suite.libelle, "Faire examiner cette adresse");
  assert.equal(lireAdresse("voiture", SETE, aCommune).suite.libelle, "Examiner une adresse à Sète");
});

// ── Les liens ────────────────────────────────────────────────────────────────────────────────

function routeExiste(href: string): boolean {
  if (href.startsWith("#") || href.startsWith("mailto:")) return true;
  const chemin = href.split("#")[0]!.split("?")[0]!;
  const segments = chemin.split("/").filter(Boolean);
  const racines = ["src/app/(public)", "src/app/(account)", "src/app/(auth)", "src/app"];
  if (racines.some((r) => existsSync(join(r, ...segments, "page.tsx")))) return true;
  // Le seul lien dynamique de l'accueil : /checkout/[product], dont le slug est vérifié dans le code produit.
  if (segments[0] === "checkout" && segments.length === 2) {
    return existsSync("src/app/(public)/checkout/[product]/page.tsx")
      && readFileSync("src/lib/checkout-products.ts", "utf8").includes(`"${segments[1]}"`);
  }
  return false;
}

test("chaque lien de l'accueil C mène à une route qui existe", () => {
  const fichiers = ["src/components/prototypes/fut50/c/SectionsC.tsx", "src/components/prototypes/fut50/c/HeroLieu.tsx", "src/components/prototypes/fut50/c/pastilles.ts", "src/app/dev/fut50/c/page.tsx"];
  const hrefs = new Set<string>();
  for (const f of fichiers) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/href(?:=|: )["'{]+([^"'}]+)["'}]/g)) if (m[1]!.startsWith("/") || m[1]!.startsWith("#")) hrefs.add(m[1]!);
  }
  assert.ok(hrefs.size >= 15, `${hrefs.size} liens relevés`);
  for (const h of hrefs) assert.ok(routeExiste(h), `${h} : aucune route`);
});

test("chaque ancre interne vise un identifiant présent dans la page, et #savoir existe toujours", () => {
  const page = ["SectionsC.tsx", "HeroLieu.tsx"].map((f) => readFileSync(`src/components/prototypes/fut50/c/${f}`, "utf8")).join("\n");
  const ancres = [...page.matchAll(/href(?:=|: )"#([a-z-]+)"/g)].map((m) => m[1]!);
  assert.ok(ancres.length >= 2);
  for (const a of ancres) assert.match(page, new RegExp(`id="${a}"`), `#${a} : aucune cible`);
  assert.match(page, /id="savoir"/, "ancre des pieds de page de l'accueil et de /rapport");
});

test("aucune étude locale en préparation n'est affichée comme publiée", () => {
  const src = readFileSync("src/components/prototypes/fut50/c/SectionsC.tsx", "utf8");
  // La liste est vide ; les URL en préparation ne figurent que dans le commentaire qui l'explique.
  assert.match(src, /ETUDES_LOCALES_PUBLIEES: \{ commune: string; titre: string; href: string \}\[\] = \[\];/);
  const code = src.split("\n").filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//")).join("\n");
  assert.doesNotMatch(code, /la-rochelle|niort/i);
});

test("la voix : ni tiret cadratin, ni point d'exclamation dans les textes de la version C", () => {
  const dir = "src/components/prototypes/fut50/c";
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (!statSync(p).isFile() || n.endsWith(".test.ts") || n.endsWith(".css")) continue;
    const src = readFileSync(p, "utf8");
    assert.doesNotMatch(src, /—/, `${n} : tiret cadratin`);
    // Les « ! » du code (`!==`, `!lieu`) ne sont pas du texte : on ne cherche que dans les chaînes françaises.
    for (const m of src.matchAll(/"([^"]*[a-zéèàù][^"]*)"/g)) assert.doesNotMatch(m[1]!, /[a-zé] ?!$/, `${n} : point d'exclamation`);
  }
});

test("la mesure en grand : présente quand une valeur pertinente existe, jamais seule, jamais forcée", () => {
  // Hivers : la température de référence, avec son unité et sa période.
  const hiver = lireHivers(SETE, {
    issue: "favorable", position: "Pour la douceur des hivers, Sète se situe parmi les 5 % de communes aux hivers les plus doux de France.",
    limite: null, temperatureReference: "Température moyenne de l'hiver : 8,4 °C sur la période de référence 1976-2005.", temperatureValeur: "8,4 °C",
  });
  assert.deepEqual([hiver.fait?.mesure?.valeur, hiver.fait?.mesure?.unite], ["8,4", "°C"]);
  assert.match(hiver.fait!.mesure!.legende, /hiver.*1976-2005/);
  // Petite ville : la population, avec son périmètre.
  const guéret = lireTaille({ ...SETE, commune: "Guéret" }, { issue: "favorable", phraseTaille: null, population: 13901, source: "urban_unit" });
  assert.equal(guéret.fait?.mesure?.unite, "habitants");
  assert.equal(guéret.fait?.mesure?.legende, "dans l'agglomération de Guéret");
  assert.equal(lireRisques(SETE, ["Inondation"]).fait?.mesure, undefined);
});

test("le hero adaptatif : un seul bloc de recherche, une grille qui s'ouvre à l'état 3, rien en mouvement réduit", () => {
  const css = readFileSync("src/components/prototypes/fut50/c/c.module.css", "utf8");
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 0fr\);/, "états 1 et 2 : une seule colonne utile");
  assert.match(css, /\.hero\[data-etat="priorite"\] \{ grid-template-columns: minmax\(0, 1fr\) minmax\(0, 0\.85fr\);/, "état 3 : deux colonnes");
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.hero \{ transition: none; \}/);
  const hero = readFileSync("src/components/prototypes/fut50/c/HeroLieu.tsx", "utf8");
  assert.equal((hero.match(/role="combobox"/g) ?? []).length, 1, "un seul champ, jamais recréé");
});

// ── La chaleur : données réelles, frontières exactes, même lecture pour toutes les communes ──────────────

const COL = { NORTX35D_yr: "column08", ATX35D_yr: "column23", NORTR_yr: "column10", ATR_yr: "column25" } as const;
const DRIAS = JSON.parse(readFileSync("public/data_climat.json", "utf8")) as Record<string, string | number>[];
function entreesReelles(insee: string): EntreesChaleur {
  const sc: Record<string, { h: string; v: Record<string, number> }> = {};
  for (const r of DRIAS.filter((r) => String(r.insee_code).padStart(5, "0") === insee)) {
    sc[String(r.scenario)] = { h: String(r.scenario), v: Object.fromEntries(Object.entries(COL).map(([k, c]) => [k, Number(r[c])])) };
  }
  const f = buildClimatFacts(sc)!;
  return {
    verdict: classifyClimateComfort(f).verdict,
    jours: { projete: f.joursTresChauds.projete, reference: f.joursTresChauds.reference, seuil: f.joursTresChauds.threshold },
    nuits: { projete: f.nuitsTropicales.projete, reference: f.nuitsTropicales.reference, seuil: f.nuitsTropicales.threshold },
    referenceTexte: (v) => (v < 1 ? "moins d'une" : String(Math.round(v))),
    limite: "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.",
    gesteSansAdresse: GESTE,
  };
}

test("seuils de la règle du moteur : 8 jours au-dessus de 35 °C, 25 nuits tropicales (horizon 2050)", () => {
  assert.equal(CLIMAT_METRICS.joursTresChauds.threshold, 8);
  assert.equal(CLIMAT_METRICS.nuitsTropicales.threshold, 25);
});

test("La Rochelle (valeurs réelles 2,8 j et 23,4 nuits) : sous les seuils, jamais « favorable », les nuits nommées comme proches", () => {
  const e = entreesReelles("17300");
  assert.equal(e.verdict, "under_threshold");
  assert.equal(e.nuits.projete, 23.4);
  const l = lireChaleur({ ...SETE, commune: "La Rochelle", insee: "17300" }, e);
  assert.equal(l.pourVous.signal, "sous_seuil");
  assert.notEqual(MOT_DU_SIGNAL.sous_seuil, MOT_DU_SIGNAL.favorable);
  assert.doesNotMatch(l.pourVous.texte, /rien de défavorable|favorable/);
  assert.match(l.pourVous.texte, /nuits tropicales en sont proches \(23 pour un seuil de 25\)/);
  assert.match(l.pourVous.texte, /pas des seuils sanitaires : cela ne veut pas dire que les étés resteront frais/);
  // Les DEUX trajectoires, avec leur référence : la même information que pour une commune défavorable.
  assert.deepEqual(l.fait!.mesures!.map((m) => m.valeur), ["3", "23"]);
  assert.match(l.fait!.mesures![1]!.legende, /contre 5 sur 1976-2005/);
});

test("Nîmes (14,4 j et 69,1 nuits) : défavorable, les deux axes nommés, les deux trajectoires visibles", () => {
  const l = lireChaleur({ ...SETE, commune: "Nîmes", insee: "30189" }, entreesReelles("30189"));
  assert.equal(l.pourVous.signal, "defavorable");
  assert.match(l.pourVous.texte, /les jours au-dessus de 35 °C et les nuits tropicales atteignent le seuil/);
  assert.deepEqual(l.fait!.mesures!.map((m) => m.valeur), ["14", "69"]);
});

test("Bordeaux (6,3 j et 28,1 nuits) : défavorable par les nuits seules, les jours restent montrés", () => {
  const l = lireChaleur({ ...SETE, commune: "Bordeaux", insee: "33063" }, entreesReelles("33063"));
  assert.match(l.pourVous.texte, /: les nuits tropicales atteignent le seuil/);
  assert.equal(l.fait!.mesures!.length, 2);
});

test("Nantes (4,1 j et 11,1 nuits) : sous les seuils, aucun axe proche, même gabarit d'information", () => {
  const l = lireChaleur({ ...SETE, commune: "Nantes", insee: "44109" }, entreesReelles("44109"));
  assert.equal(l.pourVous.signal, "sous_seuil");
  assert.doesNotMatch(l.pourVous.texte, /proches/);
  assert.deepEqual(l.fait!.mesures!.map((m) => m.valeur), ["4", "11"]);
});

test("frontières exactes : la classification se fait sur la valeur non arrondie, l'affichage ne franchit jamais un seuil non franchi", () => {
  const axe = (j: number, n: number) => ({ gwl20: { h: "gwl20", v: { NORTX35D_yr: j, ATX35D_yr: 1, NORTR_yr: n, ATR_yr: 1 } } });
  assert.equal(classifyClimateComfort(buildClimatFacts(axe(7.99, 24.99))!).verdict, "under_threshold");
  assert.equal(classifyClimateComfort(buildClimatFacts(axe(8, 10))!).verdict, "unfavorable");
  assert.equal(classifyClimateComfort(buildClimatFacts(axe(2, 25))!).verdict, "unfavorable");
  assert.equal(valeurAffichee(24.6, 25), "24,6", "24,6 sous un seuil de 25 ne s'affiche pas « 25 »");
  assert.equal(valeurAffichee(24.4, 25), "24");
  assert.equal(valeurAffichee(7.6, 8), "7,6");
  assert.equal(valeurAffichee(8, 8), "8");
  assert.equal(valeurAffichee(0.4, 8), "moins de 1");
});

test("chaleur : donnée absente ou incomplète, jamais une conclusion favorable", () => {
  const base = entreesReelles("17300");
  for (const e of [
    { ...base, verdict: "absent" as const },
    { ...base, verdict: "uncertain" as const, nuits: { ...base.nuits, projete: null } },
  ]) {
    const l = lireChaleur(SETE, e);
    assert.equal(l.pourVous.signal, "indisponible");
    assert.equal(l.fait, null);
    assert.match(l.pourVous.texte, /jamais une bonne nouvelle/);
  }
});
