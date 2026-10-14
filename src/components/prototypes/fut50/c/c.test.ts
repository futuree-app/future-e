// FUT-50 · VERSION C · CE QUE LES PASTILLES DISENT, ET OÙ MÈNENT LES LIENS.
//
// « La carte apparaît » et « la carte dit vrai » sont deux assertions distinctes (AGENTS.md) : on vérifie ici
// le texte rendu pour chaque issue, l'honnêteté des absences, et que chaque lien de l'accueil C pointe vers une
// route qui existe.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PASTILLES, lireChaleur, lireTaille, lireRisques, lireAdresse, MOT_DU_SIGNAL, type Lieu, type EntreesChaleur } from "./pastilles.ts";
import { CAS_SETE } from "../cas-sete.ts";

const SETE: Lieu = { type: "commune", libelle: "Sète", commune: "Sète", insee: "34301" };
const ADRESSE_NIMES: Lieu = { type: "adresse", libelle: "1 Place de l'Hôtel de Ville 30000 Nîmes", commune: "Nîmes", insee: "30189" };
const GESTE = "Renseignez votre adresse pour descendre au niveau du logement";
const aCommune = (n: string) => `à ${n}`;

test("quatre pastilles au plus, aucune présélectionnée, libellés compréhensibles", () => {
  assert.ok(PASTILLES.length <= 4);
  assert.deepEqual(PASTILLES.map((p) => p.libelle), [
    "Éviter les fortes chaleurs", "Vivre dans une ville à taille humaine", "Pouvoir vivre sans voiture", "Connaître les risques naturels",
  ]);
  const hero = readFileSync("src/components/prototypes/fut50/c/HeroLieu.tsx", "utf8");
  assert.match(hero, /useState<CleePastille\[\]>\(\[\]\)/, "aucune priorité présélectionnée");
  assert.doesNotMatch(hero, /\/qna|anthropic|generat/i, "aucune génération IA depuis le hero");
});

test("chaleur DÉFAVORABLE : le constat du moteur, sa limite et son geste, mot pour mot", () => {
  const e: EntreesChaleur = {
    issue: "mismatch",
    ecart: { constat: CAS_SETE.faits.nuits.constat, titre: CAS_SETE.faits.nuits.titreSiPriorite, limite: CAS_SETE.faits.nuits.limite, geste: CAS_SETE.faits.nuits.geste },
    phraseCondition: null, faitDrias: null, gesteSansAdresse: GESTE,
  };
  const l = lireChaleur(SETE, e);
  assert.equal(l.pourVous.signal, "defavorable");
  assert.equal(l.fait?.texte, CAS_SETE.faits.nuits.constat);
  assert.equal(l.pourVous.texte, "Des étés plus difficiles à concilier avec votre projet");
  assert.equal(l.aVerifier, `${CAS_SETE.faits.nuits.limite} ${CAS_SETE.faits.nuits.geste}.`);
  assert.equal(l.suite.href, "/dossier");
});

test("chaleur FAVORABLE : le fait DRIAS et la phrase du moteur, jamais une conclusion inventée", () => {
  const l = lireChaleur(SETE, {
    issue: "favorable", ecart: null,
    phraseCondition: "À l'échelle de la commune, rien de défavorable n'apparaît pour des étés plus frais.",
    faitDrias: "Moins d'une journée par an à l'horizon 2050, comme sur 1976-2005.", gesteSansAdresse: GESTE,
  });
  assert.equal(l.pourVous.signal, "favorable");
  assert.equal(l.fait?.texte, "Jours au-dessus de 35 °C : moins d'une journée par an à l'horizon 2050, comme sur 1976-2005.");
  assert.match(l.aVerifier, /commune entière/);
});

test("chaleur ABSENTE : une absence n'est jamais une bonne nouvelle", () => {
  const l = lireChaleur(SETE, { issue: "absent", ecart: null, phraseCondition: null, faitDrias: null, gesteSansAdresse: GESTE });
  assert.equal(l.pourVous.signal, "indisponible");
  assert.equal(l.fait, null);
  assert.match(l.pourVous.texte, /jamais une bonne nouvelle/);
  assert.notEqual(MOT_DU_SIGNAL[l.pourVous.signal], MOT_DU_SIGNAL.favorable);
});

test("taille : la phrase du moteur, la population, et une lecture par issue", () => {
  const base = { phraseTaille: "Lille appartient à une métropole selon la population de son agglomération et la convention de taille utilisée par futur•e", population: 1058439, source: "urban_unit" as const };
  const l = lireTaille({ ...SETE, commune: "Lille", insee: "59350", libelle: "Lille" }, { issue: "mismatch", ...base });
  assert.equal(l.pourVous.signal, "defavorable");
  assert.match(l.fait!.texte, /^Lille appartient à une métropole .* \(environ 1\s058\s439 habitants dans l'agglomération\)\.$/u);
  assert.equal(l.fait!.grain, "unite_urbaine", "la taille d'une agglomération n'est pas présentée comme communale");
  assert.equal(lireTaille(SETE, { issue: "favorable", ...base, source: "commune" }).fait!.grain, "commune");
  assert.equal(lireTaille(SETE, { issue: "indeterminate", ...base }).pourVous.signal, "neutre");
  assert.equal(lireTaille(SETE, { issue: "absent", phraseTaille: null, population: null, source: null }).pourVous.signal, "indisponible");
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
  const fichiers = ["src/components/prototypes/fut50/c/SectionsC.tsx", "src/components/prototypes/fut50/c/HeroLieu.tsx", "src/components/prototypes/fut50/c/pastilles.ts"];
  const hrefs = new Set<string>();
  for (const f of fichiers) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/href(?:=|: )["'{]+([^"'}]+)["'}]/g)) if (m[1]!.startsWith("/") || m[1]!.startsWith("#")) hrefs.add(m[1]!);
  }
  assert.ok(hrefs.size >= 15, `${hrefs.size} liens relevés`);
  for (const h of hrefs) assert.ok(routeExiste(h), `${h} : aucune route`);
});

test("l'ancre #savoir existe toujours (pieds de page de l'accueil et de /rapport)", () => {
  assert.match(readFileSync("src/components/prototypes/fut50/c/SectionsC.tsx", "utf8"), /id="savoir"/);
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
