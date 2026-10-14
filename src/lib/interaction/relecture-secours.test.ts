import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  choisirAncre, etapeRelecture, estRelectureDeLaPage, lireMemoireSecours, PLAFOND_RELECTURE_MS,
} from "./relecture-secours.ts";
import { DELAI_RELECTURE_MS } from "./etat-action.ts";

const lire = (p: string) => readFileSync(p, "utf8");

test("FUT-93 secours : un nouveau jeton à l'écran est le seul constat d'affichage, sans délai", () => {
  assert.equal(etapeRelecture({ jetonAvant: "a", jetonAffiche: "b", reponseRecue: false, ecouleMs: 10 }), "affichee");
  // La page a changé de forme (le témoin a disparu) : une relecture a bien été validée.
  assert.equal(etapeRelecture({ jetonAvant: "a", jetonAffiche: null, reponseRecue: true, ecouleMs: 10 }), "affichee");
  // Même très tard, un affichage constaté ne recharge jamais.
  assert.equal(etapeRelecture({ jetonAvant: "a", jetonAffiche: "b", reponseRecue: true, ecouleMs: 10 * PLAFOND_RELECTURE_MS }), "affichee");
});

test("FUT-93 secours : l'ancien jeton au-delà du délai de Q1, réponse reçue, recharge", () => {
  // Le cas de production du 14/10 : réponse entière en 7 s, jamais validée.
  const bloque = { jetonAvant: "a", jetonAffiche: "a", reponseRecue: true };
  assert.equal(etapeRelecture({ ...bloque, ecouleMs: 7_000 }), "attendre");
  assert.equal(etapeRelecture({ ...bloque, ecouleMs: DELAI_RELECTURE_MS - 1 }), "attendre");
  assert.equal(etapeRelecture({ ...bloque, ecouleMs: DELAI_RELECTURE_MS }), "recharger");
});

test("FUT-93 secours : un serveur LENT n'est pas un blocage, jusqu'au plafond", () => {
  const lent = { jetonAvant: "a", jetonAffiche: "a", reponseRecue: false };
  assert.equal(etapeRelecture({ ...lent, ecouleMs: DELAI_RELECTURE_MS + 5_000 }), "attendre");
  assert.equal(etapeRelecture({ ...lent, ecouleMs: PLAFOND_RELECTURE_MS }), "recharger");
  assert.ok(PLAFOND_RELECTURE_MS > DELAI_RELECTURE_MS);
});

test("FUT-93 secours : seule la relecture de CETTE page compte comme réponse", () => {
  const page = { origin: "https://futur-e.fr", pathname: "/rapport" };
  assert.equal(estRelectureDeLaPage("https://futur-e.fr/rapport?_rsc=162zw", "fetch", page), true);
  assert.equal(estRelectureDeLaPage("https://futur-e.fr/rapport?insee=44109&_rsc=x", "fetch", page), true);
  assert.equal(estRelectureDeLaPage("https://futur-e.fr/?_rsc=19e1d", "fetch", page), false);
  assert.equal(estRelectureDeLaPage("https://futur-e.fr/compte?_rsc=185zn", "fetch", page), false);
  assert.equal(estRelectureDeLaPage("https://futur-e.fr/rapport", "fetch", page), false, "un GET de page n'est pas une relecture");
  assert.equal(estRelectureDeLaPage("https://futur-e.fr/rapport?_rsc=1", "script", page), false);
  assert.equal(estRelectureDeLaPage("https://ailleurs.fr/rapport?_rsc=1", "fetch", page), false);
  assert.equal(estRelectureDeLaPage("pas une url", "fetch", page), false);
});

test("FUT-93 secours : la position ne se rend que sur la même adresse, et pas indéfiniment", () => {
  const maintenant = 1_000_000;
  const m = JSON.stringify({ chemin: "/rapport", y: 2261, le: maintenant - 5_000 });
  assert.deepEqual(lireMemoireSecours(m, "/rapport", maintenant), { chemin: "/rapport", y: 2261, le: maintenant - 5_000 });
  assert.equal(lireMemoireSecours(m, "/rapport?insee=44109", maintenant), null, "une autre adresse ne reprend pas la position");
  assert.equal(lireMemoireSecours(m, "/rapport", maintenant + 120_000), null, "périmée");
  // L'ancre de lecture passe avec la position ; incomplète, elle est ignorée (repli sur la position).
  const ancree = JSON.stringify({ chemin: "/rapport", y: 2261, le: maintenant, ancre: "projet", decalage: -40 });
  assert.deepEqual(lireMemoireSecours(ancree, "/rapport", maintenant), { chemin: "/rapport", y: 2261, le: maintenant, ancre: "projet", decalage: -40 });
  const sansDecalage = JSON.stringify({ chemin: "/rapport", y: 2261, le: maintenant, ancre: "projet" });
  assert.deepEqual(lireMemoireSecours(sansDecalage, "/rapport", maintenant), { chemin: "/rapport", y: 2261, le: maintenant });
  for (const brut of [null, "", "{", "null", JSON.stringify({ chemin: "/rapport", y: -1, le: maintenant }), JSON.stringify({ chemin: "/rapport", y: "2", le: maintenant })]) {
    assert.equal(lireMemoireSecours(brut, "/rapport", maintenant), null, String(brut));
  }
});

test("FUT-93 secours : l'ancre est l'élément qui commence dans l'écran, jamais l'ancêtre qui l'englobe de loin", () => {
  // Le cas mesuré sur le banc : la section du dossier commence 1 115 px au-dessus, le bloc des gestes
  // dans l'écran. Un bandeau inséré dans la section décalait le lecteur de 102 à 173 px.
  const candidats = [
    { id: "dossier-decision", haut: -1115 },
    { id: "banc-actions", haut: 120 },
    { id: "lien-bien-titre", haut: 480 },
    { id: "pied", haut: 2400 },
  ];
  assert.deepEqual(choisirAncre(candidats, 900), { ancre: "banc-actions", decalage: 120 });
  // Rien ne commence dans l'écran : celui qui commence juste au-dessus.
  assert.deepEqual(choisirAncre([{ id: "loin", haut: -3000 }, { id: "proche", haut: -40 }, { id: "bas", haut: 1200 }], 900), { ancre: "proche", decalage: -40 });
  assert.equal(choisirAncre([], 900), null);
  assert.equal(choisirAncre([{ id: "", haut: 10 }, { id: "x", haut: Number.NaN }], 900), null);
});

test("câblage FUT-93 secours : les six gestes relisent par `relireLaPage`, le témoin vit dans la section du bien", () => {
  const sites: [string, number][] = [
    ["src/components/report/CriteresDuProjet.tsx", 1],
    ["src/components/report/LienAvecCeBien.tsx", 1],
    ["src/components/report/ProjectSummaryCard.tsx", 2],
    ["src/components/report/RepriseRecherche.tsx", 1],
    ["src/components/CommuneSetupBanner.tsx", 1],
    ["src/components/report/LectureFactuelleDuBien.tsx", 1],
  ];
  for (const [f, n] of sites) {
    const s = lire(f);
    assert.equal(s.match(/relireLaPage\(router\)/g)?.length ?? 0, n, f);
    assert.doesNotMatch(s, /router\.refresh\(\)/, `${f} relit encore sans secours`);
  }
  const section = lire("src/components/report/DossierAvecLogement.tsx");
  // En TÊTE de la section du bien : à la fin, même rendu comme simple élément, il bloquait la relecture.
  assert.match(section, /return \(\s*<>\s*\{\/\*[\s\S]*?\*\/\}\s*<TemoinDeRendu jeton=\{jetonDeRendu\(\)\} \/>/, "le témoin ouvre la section du bien");
  // Q1 garde sa propre récupération, qui suit la version : elle n'est pas doublée.
  assert.doesNotMatch(lire("src/components/report/AnalyseAncienProjet.tsx"), /relireLaPage/);
  // Le secours ne parle jamais à la route de génération.
  const client = lire("src/components/interaction/relire-la-page.ts");
  assert.doesNotMatch(client, /actualiser|fetch\(/);
  assert.equal(client.match(/location\.reload\(\)/g)?.length, 1);
  // Il ne rend RIEN : un élément de page portant le jeton suffisait à bloquer la relecture (banc, 14/10).
  const temoin = lire("src/components/interaction/TemoinDeRendu.tsx");
  assert.match(temoin, /useEffect\(\(\) => \{\s*jetonValide = jeton;\s*\}, \[jeton\]\);/);
  assert.match(temoin, /\n  return null;\n\}/);
});
