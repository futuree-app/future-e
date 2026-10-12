// FUT-75 · LE GESTE DU RELEVÉ : CE QUE LE MOUVEMENT N'A PAS LE DROIT DE FAIRE.
//
//   M1. les durées de `motion.ts` et les jetons `--m-*` de la feuille sont les mêmes ;
//   M2. les modes : réduit ne déplace rien, sans animation ne joue rien, le choix explicite gagne ;
//   M3. tracer, c'est avoir parcouru : une échelle non examinée se pose, ne se trace jamais ;
//   M4. l'ouverture tient sous le plafond, quel que soit le périmètre ;
//   M5. le réticule cadre la forme exacte, calculée depuis la géométrie de production ;
//   M6. le recul est un facteur de schéma borné, jamais une échelle de carte ;
//   M7. les horizons : aucune valeur fabriquée, intermédiaire ou déduite d'une voisine ;
//   M8. le clavier des horizons suit le motif radio (flèches qui bouclent, Début, Fin) ;
//   M9. le chemin du constat suit l'ordre du moteur, et ses bornes ;
//   M10. aucune donnée ne s'anime : seules des propriétés de repère sont animées ;
//   M11. aucune dépendance d'animation ajoutée, rien de production modifié par les prototypes.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  cadreDe, COURBES, DUREES, duree, ETAPES_CHEMIN, etapesEclairees, etapeVoisine, facteurDeRecul,
  horizonVoisin, jalonsHorizons, ordreDeTrace, resoudreMode, type EtatForme, type FormeEchelle,
} from "./motion.ts";
import { CERCLE_TERRITOIRE, CARRE_AUTOUR, ECHELLE_CENTRE, ECHELLE_VIEWBOX } from "../../report/echelle-geometry.ts";

const DOSSIER = "src/components/prototypes/fut75";
const css = readFileSync(`${DOSSIER}/motion.module.css`, "utf8");
const code = (f: string) => readFileSync(`${DOSSIER}/${f}`, "utf8").split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n");

test("M1. les durées et les courbes de la feuille sont celles de motion.ts", () => {
  for (const [cle, ms] of Object.entries(DUREES)) assert.match(css, new RegExp(`--m-${cle}: ${ms}ms;`), `--m-${cle}`);
  assert.match(css, new RegExp(`--m-releve: ${COURBES.releve.replace(/[().]/g, "\\$&")};`));
  assert.match(css, new RegExp(`--m-sortie: ${COURBES.sortie.replace(/[().]/g, "\\$&")};`));
  assert.ok(DUREES.plafond < 1000, "aucune séquence n'atteint une seconde");
});

test("M2. les modes : réduit ne déplace rien, sans animation ne joue rien, l'explicite gagne", () => {
  assert.equal(resoudreMode(null, true), "reduit");
  assert.equal(resoudreMode(null, false), "anime");
  assert.equal(resoudreMode("anime", true), "anime", "le banc peut forcer le langage complet");
  assert.equal(resoudreMode("aucun", false), "aucun");
  for (const cle of Object.keys(DUREES) as (keyof typeof DUREES)[]) {
    assert.equal(duree(cle, "aucun"), 0);
    assert.equal(duree(cle, "reduit", true), 0, `${cle} : aucun déplacement en mouvement réduit`);
    assert.ok(duree(cle, "reduit", false) <= DUREES.micro, `${cle} : au plus un fondu court`);
    assert.equal(duree(cle, "anime"), DUREES[cle]);
  }
  // La feuille applique la même règle : en réduit, les durées de déplacement tombent à zéro.
  assert.match(css, /\.atelier\[data-mouvement="reduit"\] \{ --m-etat: 0ms; --m-trace: 0ms; --m-plafond: 0ms; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.atelier\[data-mouvement="aucun"\] \*[^{]*\{\s*transition: none !important;\s*animation: none !important;/);
});

const ETATS: Record<string, Record<FormeEchelle, EtatForme>> = {
  adresse: { logement: "constats", autour: "examinee", territoire: "constats" },
  commune: { logement: "non_examinee", autour: "non_examinee", territoire: "constats" },
  vide: { logement: "examinee", autour: "examinee", territoire: "examinee" },
};

test("M3. tracer, c'est avoir parcouru : une échelle non examinée se pose en pointillé", () => {
  for (const [nom, etats] of Object.entries(ETATS)) {
    for (const pas of ordreDeTrace(etats)) {
      assert.equal(pas.geste, etats[pas.forme] === "non_examinee" ? "poser" : "tracer", `${nom} · ${pas.forme}`);
    }
  }
  // L'ordre : du précis au large, comme le lecteur qui part de son adresse.
  const a = ordreDeTrace(ETATS.adresse!);
  assert.deepEqual(a.map((p) => p.forme), ["logement", "autour", "territoire"]);
  assert.ok(a[0]!.delai < a[1]!.delai && a[1]!.delai < a[2]!.delai, "chaque tracé démarre après le précédent");
  // Une échelle posée n'arrive jamais avant la fin du dernier tracé moins un état : elle ne précède rien.
  const c = ordreDeTrace(ETATS.commune!);
  const tracee = c.find((p) => p.geste === "tracer")!;
  for (const p of c.filter((x) => x.geste === "poser")) assert.ok(p.delai >= tracee.delai, "la pose suit le tracé");
  // La feuille dessine le pointillé d'une échelle non examinée.
  assert.match(css, /\.forme\[data-etat="non_examinee"\] \{ stroke-dasharray: 3 4; \}/);
});

test("M4. l'ouverture tient sous le plafond, et rien ne la joue hors du mode animé", () => {
  for (const [nom, etats] of Object.entries(ETATS)) {
    const fin = Math.max(...ordreDeTrace(etats).map((p) => p.delai + p.duree));
    assert.ok(fin <= DUREES.plafond, `${nom} : ${fin} ms`);
    for (const mode of ["reduit", "aucun"] as const) {
      assert.ok(ordreDeTrace(etats, mode).every((p) => p.delai === 0 && p.duree === 0), `${nom} · ${mode}`);
    }
  }
});

test("M5. le réticule cadre exactement la forme, depuis la géométrie de production", () => {
  const t = cadreDe("territoire", 0);
  assert.deepEqual(t, { x: ECHELLE_CENTRE - CERCLE_TERRITOIRE.r, y: ECHELLE_CENTRE - CERCLE_TERRITOIRE.r, w: 2 * CERCLE_TERRITOIRE.r, h: 2 * CERCLE_TERRITOIRE.r });
  assert.deepEqual(cadreDe("autour", 0), { x: CARRE_AUTOUR.x, y: CARRE_AUTOUR.y, w: CARRE_AUTOUR.width, h: CARRE_AUTOUR.height });
  const l = cadreDe("logement", 0);
  assert.ok(Math.abs(l.w - 50 * Math.SQRT2) < 1e-9, "la diagonale du losange");
  // Emboîtement : chaque cadre contient le suivant, et le cadre de repos contient tout.
  const dedans = (a: { x: number; y: number; w: number; h: number }, b: typeof a) => a.x <= b.x && a.y <= b.y && a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h;
  assert.ok(dedans(cadreDe("territoire"), cadreDe("autour")) && dedans(cadreDe("autour"), cadreDe("logement")));
  assert.ok(dedans({ x: 0, y: 0, w: ECHELLE_VIEWBOX, h: ECHELLE_VIEWBOX }, cadreDe(null)));
  // Le réticule ne bouge que par `transform` : il reste interruptible et composé.
  assert.match(code("RepereAnime.tsx"), /style=\{\{ transform: `translate\(\$\{c\.x\}px, \$\{c\.y\}px\)`/);
});

test("M6. le recul est un facteur de schéma, borné, neutre au territoire", () => {
  assert.equal(facteurDeRecul(null), 1);
  assert.equal(facteurDeRecul("territoire"), 1);
  assert.ok(facteurDeRecul("autour") > 1 && facteurDeRecul("logement") >= facteurDeRecul("autour"));
  assert.ok(facteurDeRecul("logement") <= 1.9, "plafonné : le losange ne devient pas un plein écran");
  // Il est dit comme un schéma à côté du dessin, à chaque fois qu'il est proposé.
  assert.match(code("RepereAnime.tsx"), /variante === "recul" \? <p className=\{m\.legendeSchema\}>Schéma sans échelle/);
});

test("M7. les horizons : aucune valeur fabriquée, intermédiaire ou déduite", () => {
  const j = jalonsHorizons({ gwl15: 9.4, gwl20: 14.2, gwl30: 31 }, 8);
  assert.deepEqual(j.map((x) => x.cle), ["gwl15", "gwl20", "gwl30"], "trois jalons, pas un de plus");
  assert.deepEqual(j.map((x) => x.valeur), [9.4, 14.2, 31], "les valeurs de la source, telles quelles");
  assert.deepEqual(j.map((x) => x.auDessus), [true, true, true]);
  // Une valeur manquante reste manquante : ni interpolée entre ses voisines, ni « sous le seuil ».
  const trou = jalonsHorizons({ gwl15: 9, gwl30: 31 }, 8);
  assert.equal(trou[1]!.valeur, null);
  assert.equal(trou[1]!.auDessus, null);
  assert.equal(jalonsHorizons({ gwl20: Number.NaN }, 8)[1]!.valeur, null);
  // Rien ne relie deux jalons, rien ne défile : ni courbe, ni compteur, ni barre qui s'étire.
  const b = code("RegleDesHorizons.tsx");
  assert.doesNotMatch(b, /<polyline|<path d=\{`M\$\{x\(ANNEE/, "aucun trait entre jalons");
  assert.doesNotMatch(b, /requestAnimationFrame|setInterval|\.animate\(/, "aucune valeur animée en script");
  assert.doesNotMatch(css, /\.(tige|valeurSvg)[^{]*\{[^}]*transition:[^}]*(transform|height|y\b|width)/, "un jalon ne se déplace ni ne grandit");
});

test("M8. le clavier des horizons suit le motif radio", () => {
  assert.equal(horizonVoisin("gwl20", "ArrowRight"), "gwl30");
  assert.equal(horizonVoisin("gwl30", "ArrowRight"), "gwl15", "les flèches bouclent");
  assert.equal(horizonVoisin("gwl15", "ArrowLeft"), "gwl30");
  assert.equal(horizonVoisin("gwl20", "Home"), "gwl15");
  assert.equal(horizonVoisin("gwl15", "End"), "gwl30");
  assert.equal(horizonVoisin("gwl20", "Tab"), null, "Tab sort du groupe");
  const b = code("RegleDesHorizons.tsx");
  assert.match(b, /role="radiogroup"/);
  assert.match(b, /tabIndex=\{k === choisi \? 0 : -1\}/, "un seul arrêt de tabulation dans le groupe");
});

test("M9. le chemin suit l'ordre du moteur, et le verdict reste en tête", () => {
  assert.deepEqual([...ETAPES_CHEMIN], ["projet", "fait", "convention", "interpretation", "limite", "geste"]);
  assert.equal(etapeVoisine(-1, -1), -1);
  assert.equal(etapeVoisine(5, 1), 5, "un parcours, pas une boucle");
  assert.deepEqual([...etapesEclairees(2)], ["projet", "fait", "convention"]);
  assert.equal(etapesEclairees(-1).size, ETAPES_CHEMIN.length, "au repos, tout est au même niveau");
  const c = code("CheminDeLaDecision.tsx");
  // La conclusion est rendue AVANT le chemin, sans condition de mouvement.
  assert.ok(c.indexOf("{d.verdict.titre}") < c.indexOf("className={m.etapes}"));
  // Une étape non atteinte baisse de contraste, elle ne disparaît jamais.
  assert.match(css, /\.etape\[data-eclairee="false"\] \{ opacity: 0\.62; \}/);
  assert.doesNotMatch(css, /\.etape[^{]*\{[^}]*(display: none|visibility: hidden|opacity: 0;)/);
  // Le bâtiment n'est jamais présenté comme une donnée qui aurait pesé : il n'apparaît qu'au geste.
  assert.doesNotMatch(c, /DPE|dpe|annéeConstruction|anneeConstruction/);
});

test("M10. aucune donnée ne s'anime : seules des propriétés de repère sont animées", () => {
  const animees = [...css.matchAll(/transition:\s*([^;]+);/g)].flatMap((m) => m[1]!.split(",").map((x) => x.trim().split(/\s+/)[0]!));
  const permises = new Set(["transform", "opacity", "stroke", "stroke-width", "fill", "color", "background-color", "box-shadow", "none"]);
  for (const p of animees) assert.ok(permises.has(p), `propriété animée : ${p}`);
  // Les animations en script ne touchent qu'au tracé (dashoffset) et à l'opacité.
  for (const f of ["RepereAnime.tsx", "CheminDeLaDecision.tsx"]) {
    const appels = [...code(f).matchAll(/\.animate\(\s*\[([^\]]+)\]/g)].map((m) => m[1]!);
    assert.ok(appels.length > 0, f);
    for (const k of appels) assert.match(k, /^\s*\{ (strokeDasharray: "1 1", strokeDashoffset: [01]|opacity: [01]) \}/, `${f} : ${k}`);
  }
});

test("M11. aucune dépendance d'animation, aucun fichier de production modifié par les prototypes", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  for (const lib of ["framer-motion", "motion", "gsap", "animejs", "lottie-web", "@react-spring/web", "popmotion"]) assert.ok(!deps.includes(lib), lib);
  // Les prototypes importent la production, la production n'importe jamais les prototypes.
  for (const f of ["src/components/report/EchelleNavigator.tsx", "src/components/releve/DossierDecisionReleve.tsx", "src/components/releve/primitives.tsx"]) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /prototypes\/fut75/, f);
  }
});
