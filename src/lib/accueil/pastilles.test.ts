// FUT-50 · VERSION C · CE QUE LES PASTILLES DISENT, ET OÙ MÈNENT LES LIENS.
//
// « La carte apparaît » et « la carte dit vrai » sont deux assertions distinctes (AGENTS.md) : on vérifie ici
// le texte rendu pour chaque issue, l'honnêteté des absences, et que chaque lien de l'accueil C pointe vers une
// route qui existe.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PASTILLES, pastillesDe, lireChaleur, lireTaille, lireHivers, lireRisques, lireAdresse, interpreterReponseGaspar, valeurAffichee, MOT_DU_SIGNAL, type Lieu, type EntreesChaleur } from "./pastilles.ts";
import { buildClimatFacts, classifyClimateComfort, reconstructReference, CLIMAT_METRICS } from "../decision/climat-facts.ts";
import { CAS_SETE } from "../../components/prototypes/fut50/cas-sete.ts";

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
  const hero = readFileSync("src/components/accueil/HeroLieu.tsx", "utf8");
  assert.match(hero, /useState<CleePastille\[\]>\(\[\]\)/, "aucune priorité présélectionnée");
  assert.doesNotMatch(hero, /\/qna|anthropic|generat/i, "aucune génération IA depuis le hero");
});

test("hero : le champ ne cherche que des COMMUNES, l'adresse a sa propre porte vers /dossier", () => {
  const hero = readFileSync("src/components/accueil/HeroLieu.tsx", "utf8");
  assert.match(hero, /urlRechercheCommunes\(/);
  assert.doesNotMatch(hero, /urlRechercheBan\(/, "aucune recherche d'adresse dans le champ principal");
  assert.match(hero, /Vous avez déjà une adresse précise \? <Link href="\/dossier"/);
});

test("hero : aucun exemple d'une autre commune, aucun résultat avant le choix d'une priorité", () => {
  const hero = readFileSync("src/components/accueil/HeroLieu.tsx", "utf8");
  assert.doesNotMatch(hero, /CAS_SETE|Sète/, "aucun exemple Sète dans le hero");
  // La colonne de lecture ne rend rien hors de l'état « priorité ».
  assert.match(hero, /etat !== "priorite" \|\| !lieu \|\| !focale \? null/);
});

test("section Dossier Adresse : absente de l'accueil public tant que le film réel n'existe pas", () => {
  const src = readFileSync("src/components/accueil/SectionsAccueil.tsx", "utf8");
  assert.match(src, /export const FILM_DOSSIER: Film \| null = null;/);
  assert.match(src, /export const EXEMPLE_DOSSIER_URL: string \| null = null;/);
  assert.match(src, /if \(!FILM_DOSSIER && !maquette\) return null;/);
  // Dans le prototype, la maquette se déclare comme telle.
  const plans = readFileSync("src/components/accueil/PlansDossier.tsx", "utf8");
  assert.match(plans, /maquette · sans données/);
  assert.doesNotMatch(plans, /\d+ (jours|nuits|habitants|°C)/, "aucune valeur inventée dans les cadres");
});

test("le storyboard dure entre 18 et 22 secondes, plans continus", () => {
  // PlansDossier contient du JSX, que `node --test` ne lit pas : on relit les durées dans la source.
  const src = readFileSync("src/components/accueil/PlansDossier.tsx", "utf8");
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

// ── Les risques : réponses GASPAR réelles (codes et libellés tels que l'API v1 les renvoie, relevés le 15/10/2026) ──
const g = (lignes: string) => lignes.trim().split("\n").map((l) => { const [code, ...lib] = l.trim().split(" "); return { code: code!, libelle: lib.join(" ") }; });
const GASPAR_NANTES = g(`
  11 Inondation
  112 Par une crue à débordement lent de cours d'eau
  114 Par ruissellement et coulée de boue
  116 Par remontées de nappes naturelles
  12 Mouvement de terrain
  121 Affaissements et effondrements d'origine anthropique (anciennes carrières souterraines, hors mines)
  122 Affaissements et effondrements d'origine naturelle (cavités souterraines)
  123 Eboulement ou chutes de pierres et de blocs
  124 Glissement de terrain
  125 Avancée dunaire
  127 Tassements différentiels
  13 Séisme
  17 Phénomène lié à l'atmosphère
  172 Tempête et grains (vent)
  174 Foudre
  175 Grêle
  176 Neige et pluies verglaçantes
  18 Radon
  21 Risque industriel
  23 Rupture de barrage
  24 Transport de marchandises dangereuses
  25 Engins de guerre`);
const GASPAR_LA_ROCHELLE = g(`
  11 Inondation
  117 Par submersion marine
  12 Mouvement de terrain
  127 Tassements différentiels
  13 Séisme
  17 Phénomène lié à l'atmosphère
  172 Tempête et grains (vent)
  24 Transport de marchandises dangereuses`);
const GASPAR_MARSEILLE_MINIER = g(`
  16 Feu de forêt
  31 Affaissement minier
  311 Effondrements généralisés`);
const lignesDuDetail = (l: ReturnType<typeof lireRisques>) =>
  (l.fait?.detail?.groupes ?? []).flatMap((gr) => gr.familles.flatMap((f) => [f.nom, ...f.declinaisons]));

test("risques, Nantes : 23 lignes de la source → cinq familles naturelles nommées, rien de technologique dans le constat", () => {
  const l = lireRisques({ ...SETE, commune: "Nantes" }, GASPAR_NANTES);
  assert.equal(l.fait?.texte, "Plusieurs risques naturels sont recensés dans la commune : inondation, mouvements de terrain, séisme, phénomènes météorologiques et radon.");
  assert.doesNotMatch(l.fait!.texte, /industriel|barrage|marchandises|guerre|crue|ruissellement|grêle/);
  assert.equal(l.pourVous.signal, "information");
  assert.equal(MOT_DU_SIGNAL[l.pourVous.signal], "À savoir");
  assert.equal(l.pourVous.texte, "Un risque recensé dans la commune ne concerne pas forcément chaque adresse.");
  const [nat, tech] = l.fait!.detail!.groupes;
  assert.equal(nat!.titre, "Risques naturels");
  assert.deepEqual(nat!.familles.map((f) => [f.nom, f.declinaisons.length]), [["inondation", 3], ["mouvements de terrain", 6], ["séisme", 0], ["phénomènes météorologiques", 4], ["radon", 0]]);
  assert.equal(tech!.titre, "Risques technologiques");
  assert.deepEqual(tech!.familles.map((f) => f.nom), ["risque industriel", "rupture de barrage", "transport de marchandises dangereuses", "engins de guerre"]);
  assert.match(tech!.note!, /ne relèvent pas des risques naturels/);
});

test("risques : le détail ne perd aucune ligne de la source et n'en compte aucune deux fois", () => {
  for (const source of [GASPAR_NANTES, GASPAR_LA_ROCHELLE, GASPAR_MARSEILLE_MINIER]) {
    const lignes = lignesDuDetail(lireRisques(SETE, source));
    assert.equal(lignes.length, source.length);
    assert.equal(new Set(lignes).size, lignes.length);
  }
  // « Eboulement » de la source : l'accent rétabli en minuscule, le reste mot pour mot.
  assert.ok(lignesDuDetail(lireRisques(SETE, GASPAR_NANTES)).includes("éboulement ou chutes de pierres et de blocs"));
});

test("risques, La Rochelle : la submersion marine reste lisible dans le détail, sous l'inondation", () => {
  const l = lireRisques({ ...SETE, commune: "La Rochelle" }, GASPAR_LA_ROCHELLE);
  // Une seule déclinaison, et c'est une manière (« Par … ») : elle précise la famille dans le constat.
  assert.equal(l.fait?.texte, "Plusieurs risques naturels sont recensés dans la commune : inondation par submersion marine, mouvements de terrain, séisme et phénomènes météorologiques.");
  assert.deepEqual(l.fait!.detail!.groupes[0]!.familles[0], { code: "11", nom: "inondation", declinaisons: ["par submersion marine"], precision: "par submersion marine" });
  // « Mouvements de terrain » n'a qu'une déclinaison aussi (127), mais c'est un sous-type : pas de précision.
  assert.equal(l.fait!.detail!.groupes[0]!.familles[1]!.precision, undefined);
});

test("risques : naturel, technologique, minier et inconnu classés par le code, jamais par le libellé", () => {
  const l = lireRisques(SETE, [...GASPAR_MARSEILLE_MINIER, { code: "91", libelle: "Risque nouveau" }, { code: "21", libelle: "Inondation (libellé trompeur)" }]);
  assert.deepEqual(l.fait!.detail!.groupes.map((gr) => [gr.nature, gr.familles.map((f) => f.nom)]), [
    ["naturel", ["feux de forêt"]],
    ["technologique", ["inondation (libellé trompeur)"]],
    ["minier", ["affaissement minier"]],
    ["autre", ["risque nouveau"]],
  ]);
  assert.equal(l.fait?.texte, "Un risque naturel est recensé dans la commune : feux de forêt.");
  // Une déclinaison arrivée sans sa famille : son code nomme la famille, elle reste dessous.
  const orphelin = lireRisques(SETE, [{ code: "117", libelle: "Par submersion marine" }]);
  assert.deepEqual(orphelin.fait!.detail!.groupes[0]!.familles, [{ code: "11", nom: "inondation", declinaisons: ["par submersion marine"], precision: "par submersion marine" }]);
  assert.equal(orphelin.fait?.texte, "Un risque naturel est recensé dans la commune : inondation par submersion marine.");
  // Sans famille connue (technologique) : la déclinaison devient sa propre ligne.
  const orphelinTech = lireRisques(SETE, [{ code: "211", libelle: "Effet thermique" }]);
  assert.deepEqual(orphelinTech.fait!.detail!.groupes[0]!.familles, [{ code: "21", nom: "effet thermique", declinaisons: [] }]);
});

test("risques : technologiques seuls, base vide, source muette : trois cas distincts, jamais « aucun risque »", () => {
  const tech = lireRisques(SETE, [{ code: "21", libelle: "Risque industriel" }]);
  assert.equal(tech.fait?.texte, "Aucun risque naturel n'est recensé dans la commune ; d'autres risques le sont, détaillés ci-dessous.");
  assert.equal(tech.pourVous.texte, "Une absence de recensement ne garantit pas l'absence de danger.");
  const vide = lireRisques(SETE, []);
  assert.equal(vide.fait?.texte, "La base nationale des risques ne recense rien pour cette commune.");
  assert.equal(vide.fait?.detail, undefined, "pas de détail vide à ouvrir");
  assert.equal(vide.pourVous.signal, "information");
  const muet = lireRisques(SETE, null);
  assert.equal(muet.fait, null);
  assert.equal(muet.pourVous.signal, "indisponible");
  assert.match(muet.pourVous.texte, /n'a pas répondu : nous ne pouvons rien en dire, ni dans un sens ni dans l'autre/);
  for (const l of [tech, vide, muet]) assert.doesNotMatch(`${l.fait?.texte ?? ""} ${l.pourVous.texte}`, /aucun risque\.|sans risque|à l'abri/i);
  assert.equal(muet.aVerifier, "À une adresse précise, vérifiez si elle se trouve dans une zone réglementée, les règles qui s'y appliquent et la nature du sol.");
  // La limite « hors zone » quitte la lecture principale, mais reste dans le détail.
  assert.doesNotMatch(tech.aVerifier, /hors/);
  assert.ok(tech.fait!.detail!.notes!.includes("Être hors d'une zone réglementée ne met pas à l'abri de tout risque."));
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
  const fichiers = ["src/components/accueil/SectionsAccueil.tsx", "src/components/accueil/HeroLieu.tsx", "src/lib/accueil/pastilles.ts", "src/lib/accueil/outremer.ts", "src/app/dev/fut50/c/page.tsx", "src/app/(public)/page.tsx"];
  const hrefs = new Set<string>();
  for (const f of fichiers) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/href(?:=|: )["'{]+([^"'}]+)["'}]/g)) if (m[1]!.startsWith("/") || m[1]!.startsWith("#")) hrefs.add(m[1]!);
  }
  assert.ok(hrefs.size >= 15, `${hrefs.size} liens relevés`);
  for (const h of hrefs) assert.ok(routeExiste(h), `${h} : aucune route`);
});

test("chaque ancre interne vise un identifiant présent dans la page, et #savoir existe toujours", () => {
  const page = ["SectionsAccueil.tsx", "HeroLieu.tsx"].map((f) => readFileSync(`src/components/accueil/${f}`, "utf8")).join("\n");
  const ancres = [...page.matchAll(/href(?:=|: )"#([a-z-]+)"/g)].map((m) => m[1]!);
  assert.ok(ancres.length >= 2);
  for (const a of ancres) assert.match(page, new RegExp(`id="${a}"`), `#${a} : aucune cible`);
  assert.match(page, /id="savoir"/, "ancre des pieds de page de l'accueil et de /rapport");
});

test("aucune étude locale en préparation n'est affichée comme publiée", () => {
  const src = readFileSync("src/components/accueil/SectionsAccueil.tsx", "utf8");
  // La liste est vide ; les URL en préparation ne figurent que dans le commentaire qui l'explique.
  assert.match(src, /ETUDES_LOCALES_PUBLIEES: \{ commune: string; titre: string; href: string \}\[\] = \[\];/);
  const code = src.split("\n").filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//")).join("\n");
  assert.doesNotMatch(code, /la-rochelle|niort/i);
});

test("la voix : ni tiret cadratin, ni point d'exclamation dans les textes de la version C", () => {
  const dir = "src/components/accueil";
  for (const p of [...readdirSync(dir).map((n) => join(dir, n)), "src/lib/accueil/pastilles.ts", "src/lib/accueil/outremer.ts"]) {
    const n = p.split("/").pop()!;
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
  assert.equal(lireRisques(SETE, [{ code: "11", libelle: "Inondation" }]).fait?.mesure, undefined);
});

test("le hero adaptatif : un seul bloc de recherche, une grille qui s'ouvre à l'état 3, rien en mouvement réduit", () => {
  const css = readFileSync("src/components/accueil/accueil.module.css", "utf8");
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 0fr\);/, "états 1 et 2 : une seule colonne utile");
  assert.match(css, /\.hero\[data-etat="priorite"\] \{ grid-template-columns: minmax\(0, 1fr\) minmax\(0, 0\.85fr\);/, "état 3 : deux colonnes");
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.hero \{ transition: none; \}/);
  const hero = readFileSync("src/components/accueil/HeroLieu.tsx", "utf8");
  assert.equal((hero.match(/role="combobox"/g) ?? []).length, 1, "un seul champ, jamais recréé");
});

test("risques, précision du constat : une seule déclinaison ET une manière ; plusieurs déclinaisons : la famille seule", () => {
  const attigny = lireRisques(SETE, g(`
    11 Inondation
    112 Par une crue à débordement lent de cours d'eau
    114 Par ruissellement et coulée de boue`));
  assert.equal(attigny.fait?.texte, "Un risque naturel est recensé dans la commune : inondation.");
  assert.equal(attigny.fait!.detail!.groupes[0]!.familles[0]!.declinaisons.length, 2, "les deux restent dans le détail");
  const ageville = lireRisques(SETE, g(`
    11 Inondation
    112 Par une crue à débordement lent de cours d'eau
    17 Phénomène lié à l'atmosphère
    172 Tempête et grains (vent)`));
  assert.equal(ageville.fait?.texte, "Plusieurs risques naturels sont recensés dans la commune : inondation par crue lente et phénomènes météorologiques.");
  assert.match(lireRisques(SETE, GASPAR_NANTES).fait!.texte, /: inondation, mouvements de terrain/, "Nantes, trois déclinaisons : aucune précision");
});

test("risques, codes hors format : « AUT » de l'API, code vide, code d'un chiffre, libellé vide ; rien ne disparaît en silence", () => {
  // Abancourt (60001), réponse réelle de l'API : son seul risque est « AUT · Autre risque ».
  const abancourt = lireRisques(SETE, [{ code: "AUT", libelle: "Autre risque" }]);
  assert.equal(abancourt.fait?.texte, "La source recense pour la commune un risque sans en préciser la nature : il est détaillé ci-dessous.");
  assert.equal(abancourt.pourVous.texte, "Un risque recensé dans la commune ne concerne pas forcément chaque adresse.");
  assert.deepEqual(abancourt.fait!.detail!.groupes.map((gr) => [gr.nature, gr.familles.map((f) => f.nom)]), [["autre", ["autre risque"]]]);
  // Mêlé à des risques naturels : le constat les nomme, le non-classé reste dans le détail, jamais parmi les naturels.
  const mele = lireRisques(SETE, [{ code: "11", libelle: "Inondation" }, { code: "", libelle: "Risque sans code" }, { code: "1", libelle: "Code tronqué" }, { code: "1A", libelle: "Code altéré" }]);
  assert.equal(mele.fait?.texte, "Un risque naturel est recensé dans la commune : inondation.");
  assert.deepEqual(mele.fait!.detail!.groupes.find((gr) => gr.nature === "autre")!.familles.map((f) => [f.code, f.nom]), [["?", "risque sans code"], ["1", "code tronqué"], ["1A", "code altéré"]]);
  // Une ligne sans libellé ne s'affiche pas (rien de lisible), mais elle est comptée et dite.
  const illisible = lireRisques(SETE, [{ code: "11", libelle: "Inondation" }, { code: "12", libelle: "" }]);
  assert.match(illisible.fait!.detail!.notes![0]!, /^Une ligne de la source, sans libellé, n'a pas pu être lue\.$/);
  const seulIllisible = lireRisques(SETE, [{ code: "13", libelle: "" }]);
  assert.equal(seulIllisible.fait?.texte, "La source recense des risques pour la commune, mais sans libellé lisible : nous ne pouvons pas les nommer.");
  assert.doesNotMatch(seulIllisible.fait!.texte, /ne recense rien/);
});

test("réponse de l'API : valide et vide, incomplète, panne ; trois issues distinctes", () => {
  assert.deepEqual(interpreterReponseGaspar({ results: 0, data: [] }), [], "commune absente de la base : réponse valide sans recensement");
  assert.equal(interpreterReponseGaspar({ data: [{ code_insee: "44109" }] }), null, "risques_detail absent : incomplet, pas « rien »");
  assert.equal(interpreterReponseGaspar({ data: [{ risques_detail: null }] }), null);
  assert.equal(interpreterReponseGaspar({ data: [{ risques_detail: "?" }] }), null);
  assert.equal(interpreterReponseGaspar({}), null);
  assert.equal(interpreterReponseGaspar(null), null);
  assert.deepEqual(interpreterReponseGaspar({ data: [{ risques_detail: [] }] }), []);
  assert.deepEqual(interpreterReponseGaspar({ data: [{ risques_detail: [{ num_risque: "AUT", libelle_risque_long: "Autre risque" }, { libelle_risque_long: "Sans code" }, null] }] }),
    [{ code: "AUT", libelle: "Autre risque" }, { code: "", libelle: "Sans code" }, { code: "", libelle: "" }], "chaque ligne est transmise, même incomplète");
  assert.equal(lireRisques(SETE, interpreterReponseGaspar({ data: [{}] })).pourVous.signal, "indisponible");
});

// ── La chaleur : données réelles, frontières exactes, même lecture pour toutes les communes ──────────────

const COL = { NORTX35D_yr: "column08", ATX35D_yr: "column23", NORTX30D_yr: "column09", ATX30D_yr: "column24", NORTR_yr: "column10", ATR_yr: "column25" } as const;
const DRIAS = JSON.parse(readFileSync("data/data_climat.json", "utf8")) as Record<string, string | number>[];
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
    // Comme la route : la valeur gwl20 et la référence reconstruite par la fonction du moteur.
    jours30: { projete: sc.gwl20?.v.NORTX30D_yr ?? null, reference: reconstructReference(sc, "NORTX30D_yr", "ATX30D_yr") },
    referenceTexte: (v) => (v < 1 ? "moins d'une" : String(Math.round(v))),
    limite: "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.",
    gesteSansAdresse: GESTE,
  };
}

test("seuils de la règle du moteur : 8 jours au-dessus de 35 °C, 25 nuits tropicales (horizon 2050)", () => {
  assert.equal(CLIMAT_METRICS.joursTresChauds.threshold, 8);
  assert.equal(CLIMAT_METRICS.nuitsTropicales.threshold, 25);
});

// La phrase sous la pastille interprète ; elle ne reformule jamais les nombres affichés au-dessus. Les années
// (2050, 1976-2005) situent la lecture et les températures (35 °C) nomment la mesure : ce ne sont pas des quantités.
const quantiteReformulee = (t: string) => /\d/.test(t.replace(/\b(?:19|20)\d{2}\b/g, "").replace(/\d+\s?°C/g, ""));
const chaleurDe = (insee: string, commune = insee) => lireChaleur({ ...SETE, commune, insee }, entreesReelles(insee));

const AVANT_LA_ROCHELLE = "Les journées au-dessus de 35 °C resteraient peu nombreuses, mais les nuits tropicales deviendraient beaucoup plus fréquentes.";

test("La Rochelle (sous les seuils, 23,4 nuits pour 25) : « À surveiller », jamais « favorable », une phrase de lecteur", () => {
  const e = entreesReelles("17300");
  assert.equal(e.verdict, "under_threshold");
  const l = chaleurDe("17300", "La Rochelle");
  assert.equal(MOT_DU_SIGNAL[l.pourVous.signal], "À surveiller");
  assert.notEqual(l.pourVous.signal, "favorable");
  // « peu nombreuses » : 2,8 < 8 ; « beaucoup plus fréquentes » : 23,4 ≥ 2 × 5,1.
  assert.equal(l.pourVous.texte, AVANT_LA_ROCHELLE);
  assert.ok(!quantiteReformulee(l.pourVous.texte));
  assert.match(l.methode!.join(" "), /nuits tropicales \(23,4 pour un repère de 25\)/);
  assert.deepEqual(l.fait!.mesures!.map((m) => m.valeur), ["3", "23"]);
});

test("Nantes : la même phrase que La Rochelle, la différence se lit dans les chiffres", () => {
  const l = chaleurDe("44109", "Nantes");
  assert.equal(MOT_DU_SIGNAL[l.pourVous.signal], "À surveiller");
  assert.equal(l.pourVous.texte, AVANT_LA_ROCHELLE);
});

test("Nîmes et Bordeaux : « Plutôt défavorable », la phrase nomme ce qui atteint le seuil, et la commune", () => {
  const nimes = chaleurDe("30189", "Nîmes"), bordeaux = chaleurDe("33063", "Bordeaux");
  assert.equal(MOT_DU_SIGNAL[nimes.pourVous.signal], "Plutôt défavorable");
  assert.equal(nimes.pourVous.texte, "Les fortes chaleurs augmenteraient de jour comme de nuit. Sur ces deux aspects, Nîmes correspond mal à votre priorité.");
  assert.equal(MOT_DU_SIGNAL[bordeaux.pourVous.signal], "Plutôt défavorable");
  assert.equal(bordeaux.pourVous.texte, "Les nuits tropicales deviendraient particulièrement fréquentes, ce qui correspond mal à votre souhait d'éviter les fortes chaleurs.");
  for (const l of [nimes, bordeaux]) assert.ok(!quantiteReformulee(l.pourVous.texte));
});

test("chaque qualificatif suit sa règle : doublé, simplement plus fréquent, sans hausse, jours seuls au-dessus du seuil", () => {
  const base = entreesReelles("17300");
  const avec = (jours: [number, number], nuits: [number, number], verdict: EntreesChaleur["verdict"] = "under_threshold") =>
    lireChaleur(SETE, { ...base, verdict, jours: { projete: jours[0], reference: jours[1], seuil: 8 }, nuits: { projete: nuits[0], reference: nuits[1], seuil: 25 } }).pourVous.texte;
  assert.match(avec([3, 1], [12, 7]), /les nuits tropicales seraient plus fréquentes\.$/, "12 < 2 × 7 : pas « beaucoup »");
  assert.match(avec([3, 1], [14, 7]), /beaucoup plus fréquentes/, "14 = 2 × 7 : doublé");
  assert.equal(avec([3, 2.5], [6, 5.5]), "Les journées au-dessus de 35 °C comme les nuits tropicales resteraient peu nombreuses.");
  assert.equal(avec([9, 2], [10, 4], "unfavorable"), "Les journées au-dessus de 35 °C deviendraient particulièrement fréquentes, ce qui correspond mal à votre souhait d'éviter les fortes chaleurs.");
  assert.match(avec([12, 11.5], [40, 39.6], "unfavorable"), /^Les fortes chaleurs seraient fréquentes de jour comme de nuit\./, "sans hausse, pas « augmenteraient »");
});

test("valeurs très faibles (La Condamine-Châtelard, les deux mesures sous une par an en 2050) : seul cas « Plutôt favorable »", () => {
  const l = chaleurDe("04062");
  assert.equal(l.pourVous.signal, "favorable");
  assert.equal(l.pourVous.texte, "Les fortes chaleurs resteraient exceptionnelles ici, même en 2050.");
  for (const insee of ["17300", "44109", "64445"]) assert.notEqual(chaleurDe(insee).pourVous.signal, "favorable", insee);
});

test("grammaire : jamais le mécanisme de futur•e dans la phrase, ni chiffre, ni durée continue ou effet sanitaire", () => {
  const NOMS: Record<string, string> = { "17300": "La Rochelle", "30189": "Nîmes", "33063": "Bordeaux", "44109": "Nantes", "64445": "Pau", "04062": "La Condamine-Châtelard" };
  for (const insee of Object.keys(NOMS)) {
    const t = chaleurDe(insee, NOMS[insee]).pourVous.texte;
    assert.ok(!quantiteReformulee(t), insee);
    assert.doesNotMatch(t, /futur•e|seuil|signal|repère|d'abord/, insee);
    assert.doesNotMatch(t, /fois plus|de plus par an|difficile/, insee);
    assert.doesNotMatch(t, /d'affilée|consécuti|semaines|mois|santé|sanitaire/, insee);
  }
});

test("une référence non reconstructible : aucune comparaison inventée, ni « stable » ni gain", () => {
  const e = { ...entreesReelles("17300"), jours: { projete: 2.8, reference: null, seuil: 8 }, nuits: { projete: 23.4, reference: null, seuil: 25 } };
  const l = lireChaleur(SETE, e);
  assert.equal(l.pourVous.signal, "sous_seuil", "jamais favorable sans comparaison");
  assert.equal(l.pourVous.texte, "Les journées au-dessus de 35 °C comme les nuits tropicales resteraient peu nombreuses.", "aucune évolution dite sans référence");
  assert.match(l.fait!.mesures![0]!.legende, /référence 1976-2005 non lisible/);
});

// ── Et au-dessus de 30 °C ? ────────────────────────────────────────────────────────────────────

test("30 °C, La Rochelle et Nîmes : valeurs gwl20 réelles, référence du moteur, inclusion des 35 °C dite", () => {
  const r = chaleurDe("17300").fait!.mesures![0]!.bascule!;
  // NORTX30D_yr gwl20 = 18 ; référence = médiane(13,6−7,3 ; 18−11,3 ; 29,9−23,9) = 6,3.
  assert.equal(r.valeur, "18");
  assert.equal(r.legende, "au-dessus de 30 °C à l'horizon 2050, dont 3 au-dessus de 35 °C ; contre 6 sur 1976-2005");
  const n = chaleurDe("30189").fait!.mesures![0]!.bascule!;
  assert.equal(n.valeur, "68");
  assert.match(n.legende, /dont 14 au-dessus de 35 °C ; contre 36 sur 1976-2005/);
  assert.equal(r.ouvrir, "Et au-dessus de 30 °C ?");
  assert.equal(r.revenir, "Revenir à 35 °C");
});

test("30 °C : n'entre ni dans le classement, ni dans le titre, ni dans le texte, ni dans les nuits", () => {
  for (const insee of ["17300", "30189", "33063", "44109", "64445"]) {
    const e = entreesReelles(insee);
    const avec = lireChaleur(SETE, e), sans = lireChaleur(SETE, { ...e, jours30: undefined });
    assert.equal(avec.pourVous.signal, sans.pourVous.signal, insee);
    assert.equal(avec.pourVous.texte, sans.pourVous.texte, insee);
    assert.deepEqual(avec.fait!.mesures![1], sans.fait!.mesures![1], insee);
    assert.match(avec.methode!.join(" "), /comprennent celles au-dessus de 35 °C, et n'entrent pas dans ce résultat/);
    assert.doesNotMatch(sans.methode!.join(" "), /30 °C/);
  }
});

test("30 °C indisponible : pas de contrôle, la lecture à 35 °C intacte ; référence absente : aucune comparaison fabriquée", () => {
  const base = entreesReelles("17300");
  const sansValeur = lireChaleur(SETE, { ...base, jours30: { projete: null, reference: 6.3 } });
  assert.equal(sansValeur.fait!.mesures![0]!.bascule, undefined);
  assert.equal(sansValeur.fait!.mesures![0]!.valeur, "3");
  const sansRef = lireChaleur(SETE, { ...base, jours30: { projete: 18, reference: null } }).fait!.mesures![0]!.bascule!;
  assert.match(sansRef.legende, /sans comparaison possible avec 1976-2005$/);
  assert.doesNotMatch(sansRef.legende, /contre/);
});

test("frontières exactes : la classification se fait sur la valeur non arrondie", () => {
  const axe = (j: number, n: number) => ({ gwl20: { h: "gwl20", v: { NORTX35D_yr: j, ATX35D_yr: 1, NORTR_yr: n, ATR_yr: 1 } } });
  assert.equal(classifyClimateComfort(buildClimatFacts(axe(7.99, 24.99))!).verdict, "under_threshold");
  assert.equal(classifyClimateComfort(buildClimatFacts(axe(8, 10))!).verdict, "unfavorable");
  assert.equal(classifyClimateComfort(buildClimatFacts(axe(2, 25))!).verdict, "unfavorable");
});

test("arrondi : la valeur affichée ne franchit jamais le seuil, cas limites nommés", () => {
  const cas: [number, number, string][] = [
    // Journées au-dessus de 35 °C, seuil 8.
    [7.6, 8, "7,6"], [7.99, 8, "moins de 8"], [7.999, 8, "moins de 8"], [8, 8, "8"], [8.01, 8, "8"],
    // Nuits tropicales, seuil 25.
    [24.4, 25, "24"], [24.6, 25, "24,6"], [24.94, 25, "24,9"], [24.96, 25, "moins de 25"], [24.99, 25, "moins de 25"],
    [24.999, 25, "moins de 25"], [25, 25, "25"], [25.01, 25, "25"],
    // Moins d'une occurrence par an, entiers, décimales habituelles, pas de seuil (30 °C).
    [0, 25, "moins de 1"], [0.4, 8, "moins de 1"], [0.99, 8, "moins de 1"], [1, 8, "1"], [12, 25, "12"], [69.1, 25, "69"],
    [23.4, 25, "23"], [2.8, 8, "3"], [67.9, Infinity, "68"],
    // Un seuil non entier (aucun aujourd'hui) : la règle tient dans les deux sens.
    [8.46, 8.45, "8,5"], [8.44, 8.43, "au moins 8,43"],
  ];
  // La méthode, au dixième, sous la même garantie.
  for (const [v, seuil, attendu] of [[23.4, 25, "23,4"], [7.1, 8, "7,1"], [24.94, 25, "24,9"], [24.96, 25, "moins de 25"], [7.99, 8, "moins de 8"], [24, 25, "24"]] as const)
    assert.equal(valeurAffichee(v, seuil, "decimale"), attendu, `méthode : ${v}`);
  for (const [v, seuil, attendu] of cas) assert.equal(valeurAffichee(v, seuil), attendu, `${v} pour un seuil de ${seuil}`);
  assert.throws(() => valeurAffichee(Number.NaN, 25), RangeError);
  assert.throws(() => valeurAffichee(Infinity, 25), RangeError);
});

/** Le côté du seuil que DIT le texte affiché. */
function coteAffiche(texte: string, seuil: number): boolean {
  if (texte.startsWith("moins de ")) return false;
  if (texte.startsWith("au moins ")) return true;
  return Number(texte.replace(",", ".")) >= seuil;
}

test("arrondi, propriété : sur un balayage fin autour de 8 et de 25, l'affichage et la classification concordent toujours", () => {
  for (const seuil of [8, 25, 8.45]) {
    let n = 0;
    for (let k = -30000; k <= 30000; k++) {
      const v = Math.round((seuil + k / 10000) * 1e6) / 1e6; // pas de 0,0001 sur ±3, sans dérive de flottant
      if (v < 0) continue;
      for (const precision of ["entier", "decimale"] as const) {
        const t = valeurAffichee(v, seuil, precision);
        assert.equal(coteAffiche(t, seuil), v >= seuil, `${v} → « ${t} » (seuil ${seuil}, ${precision})`);
      }
      n++;
    }
    assert.ok(n > 50000);
  }
  // Et aux bords extrêmes du flottant juste sous le seuil.
  for (const seuil of [8, 25]) assert.equal(valeurAffichee(seuil - Number.EPSILON * seuil, seuil), `moins de ${seuil}`);
});

test("arrondi, dans la lecture : 24,96 nuits s'affichent « moins de 25 », dans la mesure ET dans la méthode", () => {
  const base = entreesReelles("17300");
  const l = lireChaleur(SETE, { ...base, nuits: { projete: 24.96, reference: 5.1, seuil: 25 } });
  assert.equal(l.fait!.mesures![1]!.valeur, "moins de 25");
  assert.match(l.methode!.join(" "), /aucun des deux repères n'est atteint ; la mesure qui s'en approche le plus est celle des nuits tropicales \(moins de 25 pour un repère de 25\)/);
  assert.doesNotMatch(JSON.stringify(l), /25,0/);
  // Une valeur non finie est une donnée absente, jamais « NaN ».
  const nan = lireChaleur(SETE, { ...base, verdict: "under_threshold", nuits: { projete: Number.NaN, reference: 5.1, seuil: 25 } });
  assert.equal(nan.pourVous.signal, "indisponible");
  assert.doesNotMatch(JSON.stringify(nan), /NaN/);
  const inf = lireChaleur(SETE, { ...base, jours30: { projete: Number.POSITIVE_INFINITY, reference: 6 } });
  assert.equal(inf.fait!.mesures![0]!.bascule, undefined, "30 °C non fini : pas de bascule");
});

test("non-régression : La Rochelle, Nantes, Bordeaux, Nîmes gardent valeurs, classement et lecture", () => {
  const attendu: Record<string, [string, string, string]> = {
    "17300": ["3", "23", "sous_seuil"], "44109": ["4", "11", "sous_seuil"],
    "33063": ["6", "28", "defavorable"], "30189": ["14", "69", "defavorable"],
  };
  for (const [insee, [j, n, signal]] of Object.entries(attendu)) {
    const l = lireChaleur({ ...SETE, insee }, entreesReelles(insee));
    assert.deepEqual([l.fait!.mesures![0]!.valeur, l.fait!.mesures![1]!.valeur, l.pourVous.signal], [j, n, signal], insee);
  }
});

test("chaleur : donnée absente ou mesure manquante, aucune conclusion, et les deux cas se distinguent", () => {
  const base = entreesReelles("17300");
  const absente = lireChaleur(SETE, { ...base, verdict: "absent" });
  const partielle = lireChaleur(SETE, { ...base, verdict: "uncertain", nuits: { ...base.nuits, projete: null } });
  for (const l of [absente, partielle]) {
    assert.equal(l.pourVous.signal, "indisponible");
    assert.equal(l.fait, null);
    assert.equal(l.methode, undefined);
  }
  assert.match(absente.pourVous.texte, /une absence de donnée n'est pas une bonne nouvelle/);
  assert.match(partielle.pourVous.texte, /nous ne tirons aucune conclusion de celle qui reste/);
});
