// FUT-153 : les aides de la matrice du comparateur se lisent au toucher, à la souris et au clavier.
//
// Le composant client ne s'importe pas en test (pas de DOM ici) : l'automate est testé en pur sur les
// séquences d'événements que le navigateur émet réellement, et le composant est verrouillé sur sa source
// (seuls `pointer*` et `click` le pilotent). La recette en vrai navigateur (toucher à 360 et 390 px,
// souris à 1440 px, clavier seul) est `scripts/fut153/recette.mjs`.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AIDE_FERMEE, aideSuivante, decalageHorizontal, type EtatAide, type EvenementAide } from "./aide-bascule.ts";

const rejouer = (evs: EvenementAide[], depart: EtatAide = AIDE_FERMEE) => evs.reduce(aideSuivante, depart);
// Ce que l'automate voit d'un appui tactile : le pointerenter tactile, le click, puis le pointerleave
// qui suit le relâchement. Les mouseenter / focus de compatibilité ne lui parviennent plus.
const APPUI: EvenementAide[] = [{ type: "entree", pointeur: "touch" }, { type: "activation" }, { type: "sortie", pointeur: "touch" }];
const ACTIVATION: EvenementAide = { type: "activation" };
const FERMETURE: EvenementAide = { type: "fermeture" };

test("A1. un seul appui tactile ouvre l'aide", () => {
  assert.equal(rejouer(APPUI.slice(0, 2)).ouvert, true);
});

test("A2. l'aide reste ouverte après l'appui (relâchement, pointerleave tactile)", () => {
  assert.deepEqual(rejouer(APPUI), { ouvert: true, epingle: true });
});

test("A3. un deuxième appui sur le contrôle la ferme", () => {
  assert.deepEqual(rejouer([...APPUI, ...APPUI]), AIDE_FERMEE);
});

test("A4. un appui ou un clic à l'extérieur la ferme", () => {
  assert.deepEqual(rejouer([...APPUI, FERMETURE]), AIDE_FERMEE);
  assert.deepEqual(rejouer([{ type: "entree", pointeur: "mouse" }, FERMETURE]), AIDE_FERMEE);
});

test("A5. clavier : Entrée ouvre, Espace ferme, Échap ferme une aide ouverte", () => {
  // Entrée et Espace sur un <button> natif émettent le click : une seule activation chacun.
  const ouverte = rejouer([ACTIVATION]);
  assert.equal(ouverte.ouvert, true);
  assert.deepEqual(aideSuivante(ouverte, ACTIVATION), AIDE_FERMEE);
  assert.deepEqual(aideSuivante(ouverte, FERMETURE), AIDE_FERMEE);
});

test("A6. souris : le survol ouvre, la sortie referme ; survoler puis cliquer ne referme plus", () => {
  const survol = rejouer([{ type: "entree", pointeur: "mouse" }]);
  assert.deepEqual(survol, { ouvert: true, epingle: false });
  assert.deepEqual(aideSuivante(survol, { type: "sortie", pointeur: "mouse" }), AIDE_FERMEE);
  // Le défaut d'origine côté bureau : mouseenter ouvrait, le click inversait et refermait.
  const clic = aideSuivante(survol, ACTIVATION);
  assert.deepEqual(clic, { ouvert: true, epingle: true });
  assert.deepEqual(aideSuivante(clic, { type: "sortie", pointeur: "mouse" }), clic, "épinglée, elle survit à la sortie du pointeur");
  assert.deepEqual(aideSuivante(clic, ACTIVATION), AIDE_FERMEE, "un second clic la ferme");
});

test("A6 bis. le toucher et le stylet n'ouvrent ni ne ferment au survol", () => {
  for (const pointeur of ["touch", "pen"]) {
    assert.deepEqual(rejouer([{ type: "entree", pointeur }]), AIDE_FERMEE);
    assert.deepEqual(rejouer([ACTIVATION, { type: "sortie", pointeur }]), { ouvert: true, epingle: true });
  }
});

test("A7. passer d'une aide à une autre : la première se ferme, la seconde s'ouvre", () => {
  const premiere = rejouer(APPUI);
  // Toucher la seconde : pointerdown hors de la première (ou l'ouverture de la seconde) la ferme.
  assert.deepEqual(aideSuivante(premiere, FERMETURE), AIDE_FERMEE);
  assert.equal(rejouer(APPUI).ouvert, true);
});

test("A8. la bulle qui déborde à droite est ramenée dans l'écran, jamais poussée hors du bord gauche", () => {
  assert.equal(decalageHorizontal(24, 264, 360), 0, "à 360 px, une bulle de 240 px posée à 24 px tient");
  assert.equal(decalageHorizontal(200, 440, 390), -62, "ramenée à 12 px du bord droit");
  assert.equal(decalageHorizontal(20, 420, 390), -8, "plafonnée : le bord gauche reste à 12 px");
  assert.equal(decalageHorizontal(12, 400, 390), 0);
});

const MATRICE = readFileSync("src/app/(public)/comparateur/ThemeMatrix.tsx", "utf8");
const AIDE = MATRICE.slice(MATRICE.indexOf("function LabelTip"), MATRICE.indexOf("function paletteTone"));

test("S1. l'aide n'écoute plus les événements souris ni le focus pour s'ouvrir", () => {
  assert.ok(AIDE.length > 0);
  for (const concurrent of ["onMouseEnter", "onMouseLeave", "onFocus", "onBlur", "onTouchStart", "onKeyDown", "setOpen("]) {
    assert.ok(!AIDE.includes(concurrent), `${concurrent} absent de LabelTip`);
  }
  assert.match(AIDE, /onPointerEnter=\{\(e\) => envoyer\(\{ type: "entree", pointeur: e\.pointerType \}\)\}/);
  assert.match(AIDE, /onPointerLeave=\{\(e\) => envoyer\(\{ type: "sortie", pointeur: e\.pointerType \}\)\}/);
  assert.match(AIDE, /envoyer\(\{ type: "activation" \}\)/);
});

test("S2. le contrôle est un bouton relié à son explication, présente même fermée", () => {
  assert.match(AIDE, /<button\s+type="button"\s+aria-expanded=\{open\}\s+aria-controls=\{id\}\s+aria-describedby=\{id\}/);
  assert.match(AIDE, /role="tooltip"\s+id=\{id\}\s+hidden=\{!open\}/);
  assert.ok(!/\{open && \(/.test(AIDE), "la bulle n'est plus montée seulement à l'ouverture");
});

test("S3. fermetures : appui ou focus ailleurs, Échap ; une seule aide ouverte à la fois", () => {
  assert.match(AIDE, /document\.addEventListener\("pointerdown", dehors\)/);
  assert.match(AIDE, /document\.addEventListener\("focusin", dehors\)/);
  assert.match(AIDE, /e\.key === "Escape"/);
  assert.match(AIDE, /if \(fermerAideOuverte && fermerAideOuverte !== fermer\) fermerAideOuverte\(\);/);
});
