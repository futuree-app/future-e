// FUT-166 · GARDE-FOU : une preuve du dossier qui renvoie vers Territoire doit dire QUELLE carte la démontre.
//
// Une preuve sans clé de phénomène (`targetKey`, cf. `decision/evidence-targets.ts`) mène en haut du module
// Territoire : le repli est assumé par `evidenceHref`, mais le lecteur n'y retrouve pas toujours ce qu'il vient
// de lire. L'audit FUT-163 (30/10/2026) a trouvé quatre constats de santé dans ce cas (air, bruit, industrie,
// radon) : aucune carte du module n'en parlait.
//
// Ce test lit les règles du dossier et liste chaque preuve « territoire » sans clé. Celles qui existent sont
// inventoriées ci-dessous, avec leur raison ; une NOUVELLE preuve sans clé le fait échouer. Une entrée qui
// disparaît du code doit disparaître de la liste (le test le vérifie aussi) : la liste ne peut que se vider.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const DOSSIER = "src/lib/decision/";

/** Chaque objet de preuve qui porte `href: territoireHref`, avec l'expression de son `factId`. */
function preuvesTerritoire(): { fichier: string; factId: string; aUneCle: boolean }[] {
  const out: { fichier: string; factId: string; aUneCle: boolean }[] = [];
  for (const fichier of readdirSync(DOSSIER).filter((f) => f.endsWith(".ts") && !f.includes(".test."))) {
    const s = readFileSync(DOSSIER + fichier, "utf8");
    for (let i = s.indexOf("href: territoireHref"); i !== -1; i = s.indexOf("href: territoireHref", i + 1)) {
      let a = i, e = i, p = 0;
      for (; a >= 0; a--) { if (s[a] === "}") p++; else if (s[a] === "{") { if (p === 0) break; p--; } }
      for (p = 0; e < s.length; e++) { if (s[e] === "{") p++; else if (s[e] === "}") { if (p === 0) break; p--; } }
      const objet = s.slice(a, e + 1);
      const factId = /factId:\s*([^,\n]+)/.exec(objet)?.[1]?.trim() ?? "?";
      out.push({ fichier, factId, aUneCle: objet.includes("targetKey") });
    }
  }
  return out;
}

const SANTE = "constat de santé environnementale sans carte : la carte « Santé environnementale » (FUT-167, D1) le démontrera";
const IDENTITE = "fait d'identité ou de position de la commune (taille, rivage, position, rang, attestation) : aucune carte ne le porte, repli assumé sur le module ; hors FUT-163";
const A_INSTRUIRE = "une carte voisine existe (inondation, feu) mais ne montre pas ce fait précis : à instruire hors FUT-163";

/** L'inventaire du 30/10/2026, clé `fichier factId`. */
const CONNUES: Record<string, string> = {
  "materiality-rules.ts \"viv.no2\"": SANTE,
  "materiality-rules.ts \"viv.pm25\"": SANTE,
  "materiality-rules.ts \"calmeSonore\"": SANTE,
  "materiality-rules.ts \"expoIndustrielle\"": SANTE,
  "radon-rules.ts \"radon.classePotentiel\"": SANTE,
  "materiality-rules.ts \"inondation.ppr-commune\"": A_INSTRUIRE,
  "materiality-rules.ts \"georisques.feu\"": A_INSTRUIRE,
  "absence-rules.ts `absenceAttestation.${spec.key}`": IDENTITE,
  "agglomeration-rules.ts TERRITORY_SIZE_FACT_ID": IDENTITE,
  "alignment-rules.ts `relativePosition.${key}`": IDENTITE,
  "condition-rules.ts `scores.${key}`": IDENTITE,
  "condition-rules.ts \"commune.merCentreKm\"": IDENTITE,
  "hard-constraint-rules.ts k": IDENTITE,
  "hard-constraint-rules.ts \"commune\"": IDENTITE,
  "hard-constraint-rules.ts mer.evidenceKey": IDENTITE,
  "hard-constraint-rules.ts \"commune.lat\"": IDENTITE,
};

test("aucune nouvelle preuve vers Territoire sans clé de phénomène", () => {
  const orphelines = preuvesTerritoire().filter((p) => !p.aUneCle).map((p) => `${p.fichier} ${p.factId}`);
  for (const o of orphelines) assert.ok(o in CONNUES, `preuve sans carte cible : ${o} (poser un targetKey, ou justifier l'exception ici)`);
});

test("l'inventaire ne garde que des preuves qui existent encore sans clé", () => {
  const orphelines = new Set(preuvesTerritoire().filter((p) => !p.aUneCle).map((p) => `${p.fichier} ${p.factId}`));
  for (const k of Object.keys(CONNUES)) assert.ok(orphelines.has(k), `« ${k} » a reçu sa clé ou a disparu : retirez-la de l'inventaire`);
});

test("le scan voit bien les preuves qui ont une clé (contrôle du garde-fou lui-même)", () => {
  const avec = preuvesTerritoire().filter((p) => p.aUneCle).map((p) => p.factId);
  assert.ok(avec.includes("\"inondation.catnat\""));
  assert.ok(avec.includes("\"nature.foret\""));
});

// ── La promesse de la page gratuite (FUT-166) ───────────────────────────────────────────────────
test("la page /agir/pollutions-invisibles n'annonce dans Où vivre que ce qui y compte", () => {
  const page = readFileSync("src/app/(public)/agir/pollutions-invisibles/page.tsx", "utf8").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  const bloc = page.slice(page.indexOf("Trouvez des communes"), page.indexOf('href="/ou-vivre"'));
  assert.match(bloc, /Où vivre compare l&apos;air de fond/);
  assert.match(bloc, /éloignement des sites industriels classés/);
  // IREP et l'eau potable n'entrent pas dans Où vivre : ils ne sont cités que comme lectures de cette page.
  assert.doesNotMatch(bloc, /IREP, sites pollués|entrent dans le choix|moins exposées[\s\S]*aux pollutions/);
  assert.match(bloc, /L&apos;eau potable et les rejets industriels déclarés se consultent ici/);
  // Et les deux critères nommés existent bien dans le comparateur.
  const comparateur = readFileSync("src/lib/comparateur-vie.ts", "utf8");
  assert.match(comparateur, /"air_sain"/);
  assert.match(comparateur, /"faible_exposition_industrielle"/);
});
