import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// PAS D'IMPORT DU MODULE GARDÉ : il porte `server-only`, que node --test ne sait pas résoudre. Ce
// test lit de toute façon des sources, c'est sa nature.
const GARDE = "src/lib/server/garde-appels-modele.ts";
type TypeAppel = "parse" | "synthese" | "ask_comparateur" | "assistant";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE GARDE EST-IL POSÉ PARTOUT OÙ L'ARGENT SORT ? (21/09/2026)
//
// Le risque n'était pas théorique : quatre routes publiques appelaient un modèle payant sans
// authentification ni limite. Une boucle depuis une seule machine suffisait, et la découverte se
// faisait sur la facture.
//
// Ce test est STRUCTUREL, comme celui du géocodeur : il vérifie qu'aucune route n'appelle un
// modèle sans garde, et surtout qu'une route ajoutée demain ne puisse pas l'oublier en silence.
// L'oubli se paie ici, à l'écriture, et non le mois suivant.
// ════════════════════════════════════════════════════════════════════════════════════════════

const ROUTES_PAYANTES: { chemin: string; type: TypeAppel }[] = [
  { chemin: "src/app/api/comparateur-vie/parse/route.ts", type: "parse" },
  { chemin: "src/app/api/comparateur-vie/synthesize/route.ts", type: "synthese" },
  { chemin: "src/app/api/comparateur-vie/ask/route.ts", type: "ask_comparateur" },
  { chemin: "src/app/api/ask/route.ts", type: "assistant" },
];

test("chaque route payante porte les deux gardes, avec le bon type", () => {
  for (const { chemin, type } of ROUTES_PAYANTES) {
    const src = readFileSync(chemin, "utf8");
    assert.match(src, /limiteParAdresse\(/, `${chemin} : aucune limite par adresse`);
    assert.ok(src.includes(`reserverBudgetModele("${type}")`), `${chemin} : budget absent ou mauvais type`);
  }
});

test("la limite par adresse précède le budget, qui précède l'appel", () => {
  // DEUX EXIGENCES D'ORDRE, ET ELLES DISENT DEUX CHOSES DIFFÉRENTES (21/09/2026).
  //
  // La limite par adresse doit venir EN PREMIER : elle ne coûte rien, et refuser un débit anormal
  // avant tout travail est sa seule raison d'être.
  //
  // Le budget doit venir JUSTE AVANT l'appel payant, et surtout pas en tête. Réservé trop tôt, il
  // était consommé par des réponses de cache qui ne coûtent rien, et une rafale de requêtes
  // invalides — gratuites chez le fournisseur — suffisait à vider le quota du jour et à couper la
  // prose pour tout le monde. Le dispositif anti-facture devenait un moyen de nuire.
  for (const { chemin } of ROUTES_PAYANTES) {
    // IMPORTER `streamText` N'EST PAS L'APPELER, et l'import est en tête de fichier : comparer les
    // positions sans l'écarter ferait échouer toute route qui importe sa fonction de génération.
    const src = readFileSync(chemin, "utf8")
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("import "))
      .join("\n");
    const limite = src.indexOf("limiteParAdresse(");
    const budget = src.indexOf("reserverBudgetModele(");
    const appel = Math.min(
      ...[src.indexOf("messages.create"), src.indexOf("generateText"), src.indexOf("streamText")]
        .filter((i) => i >= 0),
    );
    assert.ok(limite >= 0 && budget >= 0, `${chemin} : un garde manque`);
    assert.ok(limite < budget, `${chemin} : la limite par adresse ne précède pas le budget`);
    assert.ok(budget < appel, `${chemin} : le budget est réservé APRÈS l'appel au modèle`);
  }
});

test("les deux refus sont renvoyés, ils ne sont pas seulement calculés", () => {
  // Une garde dont on ignore le résultat est une garde décorative.
  for (const { chemin } of ROUTES_PAYANTES) {
    const src = readFileSync(chemin, "utf8");
    assert.match(src, /if \(tropVite\) return tropVite;/, `${chemin} : la limite ne refuse rien`);
    assert.match(src, /if \(budget\) return budget;/, `${chemin} : le budget ne refuse rien`);
  }
});

test("AUCUNE autre route publique n'appelle un modèle sans garde", () => {
  // La vraie protection de demain : une cinquième route ajoutée sans y penser.
  const routes: string[] = [];
  const parcourir = (d: string): void => {
    for (const e of readdirSync(d)) {
      const p = path.join(d, e);
      if (statSync(p).isDirectory()) { parcourir(p); continue; }
      if (e === "route.ts") routes.push(p);
    }
  };
  parcourir("src/app/api");

  const fautives: string[] = [];
  for (const chemin of routes) {
    const src = readFileSync(chemin, "utf8");
    const appelle = /messages\.create|generateText|streamText/.test(src);
    if (!appelle) continue;
    // Une route AUTHENTIFIÉE est déjà bornée : il faut un compte, et le droit d'accès au dossier.
    const authentifiee = /requireCurrentUser|getCurrentSessionUser/.test(src);
    if (authentifiee || src.includes("reserverBudgetModele")) continue;
    fautives.push(chemin);
  }
  assert.deepEqual(fautives, [], `Routes publiques appelant un modèle sans garde :\n${fautives.join("\n")}`);
});

test("les poids distinguent les routes, faute de quoi le budget ne veut rien dire", () => {
  // Une extraction courte et un assistant qui traîne un historique ne coûtent pas la même chose :
  // compter des appels plutôt que des poids donnerait une fausse sensation de maîtrise.
  const src = readFileSync(GARDE, "utf8");
  const poids = Object.fromEntries(
    [...src.matchAll(/^\s{2}(parse|synthese|ask_comparateur|assistant): (\d+),/gm)]
      .map((m) => [m[1]!, Number(m[2])]),
  );
  assert.equal(Object.keys(poids).length, 4, "un type d'appel a perdu son poids");
  assert.ok(poids.parse! < poids.assistant!, "l'assistant doit peser plus que l'extraction");
  for (const p of Object.values(poids)) assert.ok(p >= 1, "un appel pèse au moins 1");
});

test("le garde reste côté serveur, et le budget reste réglable sans déploiement", () => {
  const src = readFileSync(GARDE, "utf8");
  // `server-only` empêche ce fichier, et la clé de service qu'il utilise, d'atterrir dans un
  // bundle navigateur.
  assert.match(src, /import "server-only";/);
  // Un plafond en dur obligerait à redéployer pour desserrer une limite pendant une démonstration,
  // ou pour la resserrer pendant une attaque.
  assert.match(src, /process\.env\.LLM_BUDGET_JOUR/);
});
