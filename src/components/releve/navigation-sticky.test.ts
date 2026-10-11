// FUT-92 · LE REPÈRE DES ÉCHELLES ACCOMPAGNE LA LECTURE, ET LE DÉCOMPTE SE FAIT COMPACT SUR MOBILE.
//
// Ce qui ne doit pas revenir en arrière :
//   N1. la liste complète des contrôles passe par la section (`controles`), aux trois points de montage
//       de `/rapport` : posée en frère, elle sortait de la grille et le repère s'arrêtait avant elle ;
//   N2. en présentation classique, la section rend exactement ce que l'appelant rendait (section, puis liste) ;
//   N3. dans le relevé, la liste entre dans la colonne principale, et la colonne d'appui couvre toute la grille ;
//   N4. le repère colle par CSS seul, à partir de `lg`, sous la navigation principale, sans aucun script ;
//   N5. la racine de `/rapport` ne change qu'avec le relevé, et seulement là où la colonne existe ;
//   N6. le décompte compact garde les trois états, et ses nombres sont ceux de l'emblème ;
//   N7. une seule illustration pour naviguer sous 1024 px.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { texteEtatEchelle } from "./lecture-dossier.ts";

const code = (p: string) => readFileSync(p, "utf8").split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n");
const css = readFileSync("src/components/releve/releve.module.css", "utf8");
/** Le corps d'une règle CSS dans un bloc `@media` donné (premier trouvé). */
function dansMedia(media: string, selecteur: string): string | null {
  let i = css.indexOf(media);
  while (i >= 0) {
    const debut = css.indexOf("{", i);
    let prof = 1, j = debut + 1;
    while (prof > 0 && j < css.length) { if (css[j] === "{") prof++; else if (css[j] === "}") prof--; j++; }
    const bloc = css.slice(debut + 1, j - 1);
    const k = bloc.indexOf(`${selecteur} {`);
    if (k >= 0) return bloc.slice(k, bloc.indexOf("}", k) + 1);
    i = css.indexOf(media, j);
  }
  return null;
}

test("N1. les trois points de montage de /rapport passent la liste complète par `controles`", () => {
  const page = code("src/app/(account)/rapport/page.tsx");
  const viaSlot = page.match(/controles=\{<ControlesDuDossier dossier=\{dossier\} provenance=\{provenanceCommune\} \/>\}/g) ?? [];
  assert.equal(viaSlot.length, 2, "repli du Suspense et dossier communal seul");
  assert.equal((page.match(/<ControlesDuDossier\b/g) ?? []).length, 2, "aucune liste posée en frère de la section");
  const adresse = code("src/components/report/DossierAvecLogement.tsx");
  const slot = adresse.slice(adresse.indexOf("controles={("), adresse.indexOf(")}", adresse.indexOf("controles={(")));
  assert.match(slot, /<ControlesDuDossier\s+dossier=\{vue\.dossier\}\s+provenance=\{servi\.source === "artefact" \? scopeKey : undefined\}/,
    "même dossier et même provenance que la minute");
  assert.equal((adresse.match(/<ControlesDuDossier\b/g) ?? []).length, 1);
  // Chaque montage qui porte la liste porte aussi la colonne d'appui : la grille couvre les deux.
  for (const m of page.match(/<DossierDecisionSection[\s\S]*?\/>\n/g) ?? []) assert.match(m, /supportingPane=\{renderEchelleNavigator\(\)\}/);
});

test("N2. présentation classique : la section, puis la liste, exactement comme avant", () => {
  const src = code("src/components/report/DossierDecisionSection.tsx");
  assert.match(src, /return <>\{section\}\{controles\}<\/>;\n\}/, "la liste suit la section, sans enveloppe");
  // La section classique ne reçoit pas la liste dans sa grille : elle n'est citée qu'à la toute fin.
  const classique = src.slice(src.indexOf("const section = ("), src.indexOf("return <>{section}"));
  assert.doesNotMatch(classique, /\{controles\}/);
  assert.doesNotMatch(classique, /sticky/);
});

test("N3. relevé : la liste est dans la colonne principale, la colonne d'appui couvre toute la grille", () => {
  const src = code("src/components/releve/DossierDecisionReleve.tsx");
  assert.match(src, /lg:grid lg:grid-cols-\[minmax\(0,1fr\)_280px\] lg:grid-rows-\[auto_1fr\] lg:gap-x-10 lg:items-start/,
    "`items-start` : la colonne d'appui garde sa hauteur propre, condition du collage");
  assert.match(src, /lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0 lg:mb-0 \$\{s\.repere\}/);
  const principale = src.slice(src.indexOf('"lg:col-start-1 lg:row-start-2"'));
  assert.ok(principale.indexOf("{controles}") > principale.indexOf("apresBalance.map"), "après la minute et la balance");
  assert.equal((src.match(/\{controles\}/g) ?? []).length, 1, "rendue une seule fois");
  // Le repère n'est rendu qu'une fois par section : le repli du Suspense et le dossier final ne
  // coexistent jamais, et aucun second navigateur n'est ajouté pour le mobile.
  assert.equal((src.match(/\{supportingPane\}/g) ?? []).length, 1);
});

test("N4. le repère colle par CSS seul, sous la navigation principale, et seulement sur grand écran", () => {
  const regle = dansMedia("@media (min-width: 1024px)", ".repere");
  assert.ok(regle, "règle .repere dans le bloc lg");
  assert.match(regle!, /position: sticky/);
  const haut = Number(regle!.match(/top: (\d+)px/)?.[1]);
  assert.ok(haut >= 64 + 16, `sous la navigation principale de 64 px (top=${haut})`);
  // Aucune règle .repere hors d'un bloc lg : rien de collant ni de flottant sur mobile.
  const horsMedia = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
  assert.doesNotMatch(horsMedia, /\.repere\b/);
  assert.doesNotMatch(css, /position:\s*fixed/, "aucun élément fixé");
  // Fenêtre basse : le repère cesse de coller plutôt que de couper son propre bas.
  assert.match(dansMedia("@media (min-width: 1024px) and (max-height:", ".repere") ?? "", /position: static/);
  // Le dessin se réduit avec la hauteur ; la liste des liens, elle, reste entière.
  assert.match(dansMedia("@media (min-width: 1024px)", ".repere svg") ?? "", /width: clamp\(\d+px, calc\(100vh - \d+px\), 224px\)/);
  for (const f of ["src/components/releve/DossierDecisionReleve.tsx", "src/components/report/EchelleNavigator.tsx"]) {
    assert.doesNotMatch(code(f), /addEventListener\(["']scroll|IntersectionObserver|getBoundingClientRect|position:\s*["']fixed/, `${f} : aucun suivi du défilement en script`);
  }
});

test("N5. la racine de /rapport ne change qu'avec le relevé, et seulement là où la colonne existe", () => {
  const page = code("src/app/(account)/rapport/page.tsx");
  assert.match(page, /const debordement = presentationDuDossier\(undefined\) === "releve" \? "overflow-hidden lg:overflow-clip" : "overflow-hidden";/);
  assert.match(page, /className=\{`min-h-screen bg-canvas text-label relative \$\{debordement\}`\}/);
  assert.equal((page.match(/overflow-clip/g) ?? []).length, 1);
});

test("N6. le décompte compact garde les trois états, et zéro n'est jamais une absence de risque", () => {
  const non = texteEtatEchelle({ echelle: "logement", etat: "non_examinee" });
  const zero = texteEtatEchelle({ echelle: "quartier", etat: "examinee", constats: 0 });
  const un = texteEtatEchelle({ echelle: "territoire", etat: "examinee", constats: 1 });
  const cinq = texteEtatEchelle({ echelle: "territoire", etat: "examinee", constats: 5 });
  assert.equal(non.etatCourt, "non examiné dans cette lecture");
  assert.doesNotMatch(non.etatCourt, /\d|aucun constat/, "aucun nombre pour une échelle non examinée");
  assert.equal(zero.etatCourt, "examiné, aucun constat affiché");
  assert.equal(un.etatCourt, "1 constat");
  assert.equal(cinq.etatCourt, "5 constats");
  const formes = new Set([non.etatCourt, zero.etatCourt, un.etatCourt]);
  assert.equal(formes.size, 3, "trois formulations distinctes");
  for (const t of [non, zero, un, cinq]) assert.doesNotMatch(`${t.etatCourt} ${t.phrase}`, /risque|sûr|sans danger|rassur/i);
  // L'étiquette de l'emblème, le décompte large et le compact lisent le même tableau `echelles` :
  // mêmes nombres, mêmes états, aux trois endroits.
  const src = code("src/components/releve/DossierDecisionReleve.tsx");
  assert.equal((src.match(/echelles\.map\(\(e(, i)?\) => \{\s*const t = texteEtatEchelle\(e\);/g) ?? []).length, 3);
  assert.equal((src.match(/lectureDesEchelles\(/g) ?? []).length, 1, "un seul calcul du décompte");
  assert.match(src, /data-etat=\{etat\}/);
  assert.match(src, /<ReperEchelle forme=\{e\.echelle\} etat=\{etat\} \/>/);
});

test("N7. une seule illustration pour naviguer sous 1024 px", () => {
  const src = code("src/components/releve/DossierDecisionReleve.tsx");
  const decompte = src.slice(src.indexOf('id="mouvement-echelles"'), src.indexOf("</section>", src.indexOf('id="mouvement-echelles"')));
  assert.match(decompte, /<div className=\{s\.decompteLarge\}[^>]*>\s*<EmblemeEchelles/, "l'emblème compté est réservé au grand écran");
  assert.equal((decompte.match(/<EmblemeEchelles/g) ?? []).length, 1);
  assert.match(css, /\.decompteLarge \{ display: none !important; \}/);
  assert.match(dansMedia("@media (min-width: 1024px)", ".decompteLarge") ?? "", /display: grid !important/);
  assert.match(dansMedia("@media (min-width: 1024px)", ".decompteCompact") ?? "", /display: none/);
  // La règle de base doit PRÉCÉDER le bloc lg : à spécificité égale, la dernière gagne, et le décompte
  // compact s'affichait sous le grand sur ordinateur (trouvé par l'arbre d'accessibilité).
  const base = css.indexOf(".decompteCompact { display: grid");
  const lg = css.indexOf(".decompteCompact { display: none; }");
  assert.ok(base >= 0 && base < lg, "règle de base avant la règle grand écran");
  // Le seuil est celui de la colonne d'appui (`lg` = 1024 px) : l'emblème compté ne réapparaît jamais
  // empilé sous le repère.
  assert.doesNotMatch(css, /@media \(min-width: 760px\) \{ \.echellesDuDossier/);
});
