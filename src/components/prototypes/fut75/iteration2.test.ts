// FUT-75 · DEUXIÈME ITÉRATION : CE QUE LES NOUVEAUX GESTES N'ONT PAS LE DROIT DE FAIRE.
//
//   V1. le micro-ressort : calculé, borné (≤ 2,5 %), identique dans la feuille et dans motion.ts ;
//   V2. il n'anime que des commandes, jamais une donnée ;
//   V3. la grille d'unités de B1 : autant de carrés que la valeur arrondie, aucun carré partiel ;
//   V4. B1 et B2 : aucun nombre animé, une valeur qui change est remontée d'un bloc ;
//   V5. le bouton d'action : un succès seulement sur une réponse réelle ;
//   V6. la lecture enrichie : proposée seulement après la réponse, jamais imposée, jamais en pourcentage ;
//   V7. la continuité (View Transitions) s'efface en mouvement réduit et sans animation ;
//   V8. la route d'attente de développement est fermée en production ;
//   V9. C1 et C2 : la conclusion est lisible avant tout geste, aucun rail vertical ;
//   V10. les clés d'animation (`@keyframes`) ne touchent qu'à des propriétés de repère.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { casesGrille, depassement, DUREES_V2, NIVEAUX, ressortLineaire } from "./motion.ts";
import { DELAI_INDICATEUR, libelleAttente, suivantAction, suivantLecture, type EtatAction, type EtatLecture } from "./quotidien/etats.ts";
import { avecContinuite } from "./vues.ts";

const D = "src/components/prototypes/fut75";
const css = readFileSync(`${D}/motion.module.css`, "utf8");
const code = (f: string) => readFileSync(`${D}/${f}`, "utf8").split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n");

test("V1. le micro-ressort est calculé, borné, et la feuille porte exactement le même", () => {
  const r = ressortLineaire();
  assert.match(r, /^linear\(0, /);
  assert.match(r, /, 1\)$/);
  assert.ok(depassement(r) > 0 && depassement(r) <= 0.025, `dépassement ${depassement(r)}`);
  assert.ok(css.includes(`--m-ressort: ${r};`), "la feuille et motion.ts disent le même ressort");
  assert.ok(depassement(ressortLineaire(0.95)) < depassement(r), "plus amorti, moins de dépassement");
  // Les niveaux ne se recouvrent pas, et seul le geste admet le ressort.
  assert.ok(NIVEAUX.geste.max < NIVEAUX.etat.max && NIVEAUX.etat.max < NIVEAUX.structure.min);
  assert.deepEqual(Object.entries(NIVEAUX).filter(([, n]) => n.ressort).map(([k]) => k), ["geste"]);
  assert.ok(DUREES_V2.ressort <= 320 && DUREES_V2.pression <= NIVEAUX.geste.max);
});

test("V2. le ressort n'anime que des commandes, jamais une donnée", () => {
  const regles = [...css.matchAll(/([^{}]+)\{[^}]*var\(--m-ressort\)[^}]*\}/g)].map((m) => m[1]!.trim());
  assert.ok(regles.length >= 4);
  for (const sel of regles) {
    assert.doesNotMatch(sel, /\.(case|barre|valeur|chiffre|tige|grille|seuil|cote|regle|jalon)/i, `ressort sur une donnée : ${sel}`);
  }
  // Le sélecteur élastique l'emploie sur son indicateur (une commande), et nulle part ailleurs dans B.
  for (const f of ["HorizonsEditorial.tsx", "HorizonsInstrument.tsx"]) assert.doesNotMatch(code(f), /ressortLineaire|--m-ressort/, f);
});

test("V3. la grille d'unités : autant de carrés que la valeur arrondie, ni plus ni moins", () => {
  for (const [v, ref, p] of [[14.2, 3.4, 9.1], [31, 3, 14], [2.4, 0.4, null], [57.6, 33.2, 69.1]] as const) {
    const c = casesGrille(v, ref, p, 100);
    assert.equal(c.length, 100);
    assert.equal(c.filter((x) => x.etat === "reference" || x.etat === "horizon").length, Math.round(v), `valeur ${v}`);
    assert.equal(c.filter((x) => x.etat === "reference").length, Math.min(Math.round(v), Math.round(ref)));
    if (p != null) assert.equal(c.filter((x) => x.change).length, Math.abs(Math.round(v) - Math.round(p)), "seuls les carrés qui changent s'éclairent");
  }
  // Une valeur sous la référence : les jours perdus restent dessinés en creux, rien n'est caché.
  const b = casesGrille(2, 5, null, 10);
  assert.equal(b.filter((x) => x.etat === "baisse").length, 3);
  // La capacité est arrondie à la ligne complète, et ne dépend pas de l'horizon choisi.
  assert.match(code("HorizonsEditorial.tsx"), /capacite: Math\.ceil\(plus \/ parLigne\) \* parLigne/);
});

test("V4. B1 et B2 : aucun nombre animé ; une valeur qui change est remontée d'un bloc", () => {
  for (const f of ["HorizonsEditorial.tsx", "HorizonsInstrument.tsx"]) {
    const src = code(f);
    assert.doesNotMatch(src, /requestAnimationFrame|setInterval|\.animate\(|useSpring|tween/i, `${f} : aucune valeur animée en script`);
    assert.match(src, /key=\{`[a-z]+-\$\{h\}/, `${f} : la valeur affichée est remontée à chaque horizon`);
  }
  // La bascule ne déplace pas verticalement (pas de compteur qui roule) : flou, fondu, léger recadrage.
  const bascule = css.match(/@keyframes bascule \{[^}]*\}[^}]*\}/)?.[0] ?? "";
  assert.doesNotMatch(bascule, /translateY/);
  // Rien ne relie deux barres dans B2 : aucune polyligne, aucun chemin entre années.
  assert.doesNotMatch(code("HorizonsInstrument.tsx"), /<polyline|L\$\{x\(ANNEE\[/);
});

test("V5. le bouton d'action : un succès seulement sur une réponse réelle", () => {
  const tous: EtatAction[] = ["repos", "attente", "succes", "echec", "ailleurs"];
  // Le seul chemin vers « succes » : attente + réponse ok au statut « ok ».
  for (const e of tous) {
    for (const ev of [{ type: "appui" }, { type: "erreur_reseau" }, { type: "fin_confirmation" }, { type: "reponse", ok: false }, { type: "reponse", ok: true, statut: "en_cours" }] as const) {
      if (suivantAction(e, ev) === "succes") assert.equal(e, "succes", `${e} + ${ev.type} ne crée pas un succès`);
    }
  }
  assert.equal(suivantAction("attente", { type: "reponse", ok: true, statut: "ok" }), "succes");
  assert.equal(suivantAction("repos", { type: "reponse", ok: true, statut: "ok" }), "repos", "une réponse orpheline ne confirme rien");
  assert.equal(suivantAction("attente", { type: "reponse", ok: true, statut: "en_cours" }), "ailleurs");
  assert.equal(suivantAction("attente", { type: "reponse", ok: true }), "echec", "un statut inconnu n'est pas un succès");
  assert.equal(suivantAction("attente", { type: "erreur_reseau" }), "echec");
  assert.ok(DELAI_INDICATEUR >= 200 && DELAI_INDICATEUR <= 400, "pas d'indicateur qui clignote sur une réponse rapide");
  const src = code("quotidien/BoutonAction.tsx");
  assert.doesNotMatch(src, /setEtat\("succes"\)/, "le composant ne fabrique pas le succès");
  assert.match(src, /await fetch\(/);
  assert.match(src, /aria-busy=\{etat === "attente"\}/);
});

test("V6. la lecture enrichie : proposée après la réponse, jamais imposée, jamais en pourcentage", () => {
  const tous: EtatLecture[] = ["deterministe", "preparation", "prete", "affichee", "echec"];
  for (const e of tous) {
    if (e !== "preparation" && e !== "prete") assert.notEqual(suivantLecture(e, { type: "reponse", ok: true }), "prete", `${e} : pas de « prête » sans préparation`);
    if (e !== "prete" && e !== "affichee") assert.notEqual(suivantLecture(e, { type: "afficher" }), "affichee", `${e} : pas d'affichage sans proposition`);
  }
  assert.equal(suivantLecture("preparation", { type: "reponse", ok: true }), "prete", "prête n'est pas affichée : c'est le lecteur qui choisit");
  assert.equal(suivantLecture("preparation", { type: "reponse", ok: false }), "echec");
  for (const ms of [0, 1500, 4200, 61000]) assert.doesNotMatch(libelleAttente(ms), /%|\d+\s*sur\s*\d+/, "aucune progression inventée");
  assert.match(libelleAttente(4200), /depuis 4 s/);
  const src = code("quotidien/LectureEnrichie.tsx");
  assert.match(src, /texte d'exemple, non généré|Texte d'exemple, non généré/i, "le texte de démonstration se dit comme tel");
  assert.doesNotMatch(css, /\.repereEtat[^{]*\{[^}]*animation/, "le repère d'attente ne pulse pas");
});

test("V7. la continuité s'efface en mouvement réduit et sans animation", () => {
  for (const mode of ["reduit", "aucun"] as const) {
    let appele = false;
    avecContinuite(mode, () => { appele = true; });
    assert.ok(appele, `${mode} : la mise à jour est appliquée directement`);
  }
  // Hors navigateur (pas de `document`), même en mode animé : appliquée directement, rien ne casse.
  let ok = false; avecContinuite("anime", () => { ok = true; }); assert.ok(ok);
});

test("V8. la route d'attente de développement est fermée en production", () => {
  const route = readFileSync("src/app/dev/fut75/api/[action]/route.ts", "utf8");
  assert.match(route, /if \(process\.env\.NODE_ENV === "production"\) return new NextResponse\(null, \{ status: 404 \}\);/);
  assert.doesNotMatch(route, /anthropic|generateText|streamText|supabase|insert\(|update\(/i, "elle n'écrit rien et n'appelle aucun modèle");
});

test("V9. C1 et C2 : la conclusion est lisible avant tout geste, et aucun rail vertical", () => {
  const c1 = code("ConstatDevoile.tsx"); const c2 = code("ConstatCouches.tsx");
  assert.ok(c1.indexOf("{d.verdict.titre}") < c1.indexOf("className={m.scene75}"), "C1 : verdict au-dessus de la scène");
  assert.ok(c2.indexOf("{d.verdict.titre}") < c2.indexOf("className={m.couches}"), "C2 : verdict avant les couches");
  for (const src of [c1, c2]) assert.doesNotMatch(src, /m\.rail|m\.voie|m\.etapes\b/, "aucun organigramme vertical");
  // C2 : les couches sont limitées au plafond structurel.
  assert.match(c2, /240 \+ \(k - 1\) \* ECART_COUCHES/);
  assert.ok(240 + 3 * 140 + 240 <= 900);
});

test("V10. les @keyframes ne touchent qu'à des propriétés de repère ; aucun sélecteur global dans le module", () => {
  // Webpack refuse les sélecteurs non « purs » d'un module CSS (build cassé) : les passages View
  // Transitions vivent dans une feuille globale de l'atelier.
  assert.doesNotMatch(css, /:global\(/);
  assert.match(readFileSync("src/app/dev/fut75/layout.tsx", "utf8"), /import "\.\/transitions\.css";/);
  const toutes = css + readFileSync("src/app/dev/fut75/transitions.css", "utf8");
  const blocs = [...toutes.matchAll(/@keyframes\s+(\w+)\s*\{((?:[^{}]*\{[^}]*\})*)[^}]*\}/g)];
  assert.ok(blocs.length >= 8);
  const permises = new Set(["opacity", "transform", "filter", "box-shadow", "background", "stroke-dashoffset"]);
  for (const [, nom, corps] of blocs) {
    for (const p of [...corps!.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]!)) assert.ok(permises.has(p), `@keyframes ${nom} : ${p}`);
  }
});
