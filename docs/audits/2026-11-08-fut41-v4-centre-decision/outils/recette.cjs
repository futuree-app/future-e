// FUT-41 V4 · RECETTE NAVIGATEUR DU PROTOTYPE (Chrome système, Playwright).
// Prérequis : `npx next dev --webpack -p 3041` dans la branche, avec une base Supabase factice injoignable.
// Usage : node recette.cjs [dossier-captures]
// Sortie : captures PNG + recette.json (contrôles, débordements, erreurs console).
const path = require("path");
const fs = require("fs");
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");

// BASE peut viser la version statique : BASE=http://localhost:3042/index.html node recette.cjs
const BASE = process.env.BASE ?? "http://localhost:3041/dev/centre-decision";
const SORTIE = process.argv[2] ?? path.join(__dirname, "..", "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const resultats = { vues: [], gestes: [], clavier: [], mouvement: null, erreurs: [] };
const echecs = [];
const verifier = (nom, ok, detail = "") => { resultats.gestes.push({ nom, ok, detail }); if (!ok) echecs.push(`${nom} ${detail}`); };

const VUES = [
  ["01-decision-complet", "?s=complet"],
  ["02-decision-vide", "?s=vide"],
  ["03-decision-un-logement", "?s=un"],
  ["04-s1-location-dont-vente", "?s=s1"],
  ["05-s2-meme-commune-face", "?s=s2"],
  ["06-s3-trois-communes-ensemble", "?s=s3"],
  ["07-s4-analyse-et-annonces", "?s=s4"],
  ["08-s5-condition-non-tenue", "?s=s5"],
  ["09-s6-projet-modifie-face", "?s=s6"],
  ["10-s7-donnees-non-comparables", "?s=s7"],
  ["11-s8-fiche-inconnues", "?s=s8"],
  ["12-faire-le-point", "?s=complet#/point"],
  ["13-releve-sternes", "?s=complet#/releve/sternes"],
  ["14-ensemble-lentille-calme", "?s=s3#/comparer/ensemble/sternes,kervily,lavoir/calme"],
];

async function preparer(p, theme) {
  await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  // Le bandeau de mesure d'audience de production recouvre la page : on le refuse (aucune mesure en local).
  const refuser = p.getByRole("button", { name: /^refuser$/i });
  if (await refuser.count()) await refuser.first().click().catch(() => {});
  await p.waitForTimeout(250);
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  // AUCUNE REQUÊTE HORS DE LOCALHOST : le layout racine charge la mesure d'audience de production
  // (Google Analytics, Clarity). Une recette locale ne doit rien envoyer à ces comptes.
  const bloquer = async (ctx) => ctx.route((url) => !/^https?:\/\/localhost(:\d+)?\//.test(url.href), (r) => r.abort());

  // ── 1. Matrice de captures : 14 vues × 3 largeurs × 2 thèmes ──
  for (const theme of ["dark", "light"]) {
    for (const largeur of [1440, 390, 360]) {
      const ctx = await navigateur.newContext({ viewport: { width: largeur, height: largeur > 900 ? 900 : 780 }, deviceScaleFactor: 1 });
      await bloquer(ctx);
      const p = await ctx.newPage();
      const erreurs = [];
      p.on("pageerror", (e) => erreurs.push(e.message));
      p.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|net::/.test(m.text())) erreurs.push(`${m.text().slice(0, 200)} @ ${m.location().url}`); });
      for (const [nom, q] of VUES) {
        await p.goto(BASE + q, { waitUntil: "networkidle" });
        await preparer(p, theme);
        const debord = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        const fichier = `${nom}-${largeur}-${theme === "dark" ? "sombre" : "clair"}.png`;
        await p.screenshot({ path: path.join(SORTIE, fichier), fullPage: true });
        resultats.vues.push({ fichier, debord, erreurs: [...erreurs] });
        if (debord > 0) echecs.push(`débordement ${debord}px ${fichier}`);
        if (erreurs.length) echecs.push(`erreurs console ${fichier}: ${erreurs[0]}`);
        erreurs.length = 0;
      }
      await ctx.close();
    }
  }

  // ── 2. Parcours de gestes (1440, sombre) ──
  const ctx = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
  await bloquer(ctx);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => resultats.erreurs.push(e.message));
  // Les petits mots sont liés au suivant par une espace insécable (AGENTS.md) : on lit le texte normalisé.
  // Chaque étape repart d'un état neuf : une ancre seule ne recharge pas la page (l'état resterait en mémoire).
  const ouvrir = async (q) => { await p.goto(BASE + q, { waitUntil: "networkidle" }); await p.reload({ waitUntil: "networkidle" }); await preparer(p, "dark"); };
  const texte = async () => (await p.locator("main").innerText()).replace(/\u00a0/g, " ");

  // 2.1 Ajouter un logement fictif depuis un texte collé, puis passer d'un à deux.
  await ouvrir("?s=un");
  verifier("un logement : titre au singulier", /le logement que vous étudiez/.test(await texte()));
  await p.getByRole("button", { name: "Ajouter un logement" }).click();
  await p.getByRole("button", { name: "Essayer avec un exemple" }).click();
  await p.getByRole("button", { name: "Lire ce texte" }).click();
  verifier("ajout assisté : extrait cité", /lu dans « 1 040 € charges comprises »/.test(await texte()));
  await p.screenshot({ path: path.join(SORTIE, "20-ajout-assiste-1440-sombre.png"), fullPage: true });
  await p.getByLabel("Nom pour vous en souvenir").fill("T3 près de la gare");
  await p.getByRole("button", { name: "Garder ce logement" }).click();
  await p.waitForTimeout(300);
  verifier("ajout : la fiche du nouveau logement s'ouvre", /#\/lieu\/ajout-/.test(p.url()) && /T3 près de la gare/.test(await texte()));
  verifier("ajout : rien n'est conclu", /Aucun dossier ne conclut encore sur ce logement/.test(await texte()));
  await p.getByRole("button", { name: "Ma décision" }).first().click();
  verifier("deux logements : la recherche apparaît", /Votre recherche/.test(await texte()) && /Faire le point/.test(await texte()));

  // 2.2 Comparer deux puis trois logements, choisir une condition.
  await ouvrir("?s=complet");
  await p.getByLabel("Choisir 12 rue des Sternes pour comparer").check();
  await p.getByLabel("Choisir 5 allée des Goélands pour comparer").check();
  await p.getByRole("button", { name: "Face-à-face" }).click();
  await p.waitForTimeout(300);
  verifier("face-à-face : URL et titre", /comparer\/face\/sternes,goelands/.test(p.url()) && /face à face/.test(await texte()));
  verifier("face-à-face : la commune ne se compare pas", /Ne se compare pas/.test(await texte()) && /une seule lecture, la même pour les deux/.test(await texte()));
  await p.screenshot({ path: path.join(SORTIE, "21-face-a-face-deux-1440-sombre.png"), fullPage: true });
  await p.getByRole("button", { name: "31 route de Kervily", exact: true }).click();
  await p.waitForTimeout(300);
  verifier("trois logements : bascule en vue d'ensemble", /comparer\/ensemble\/sternes,goelands,kervily/.test(p.url()));
  await p.getByRole("button", { name: "Le calme", exact: true }).click();
  await p.waitForTimeout(300);
  const t22 = await texte();
  verifier("condition choisie : les paires et leurs raisons", /Différence démontrée/.test(t22) && /Se compare : même valeur de cette condition/.test(t22));
  await p.screenshot({ path: path.join(SORTIE, "22-ensemble-trois-condition-1440-sombre.png"), fullPage: true });
  await p.getByRole("button", { name: "Une gare à moins de 20 min" }).click();
  await p.waitForTimeout(200);
  verifier("la gare : refus expliqué par le Projet", /Votre condition a changé entre les deux analyses/.test(await texte()));

  // 2.3 Fiche : répondre à une vérification, noter, écarter puis réactiver.
  await ouvrir("?s=s8");
  await p.getByRole("button", { name: "Oui, la chambre donne sur cour" }).click();
  await p.waitForTimeout(300);
  const t23 = await texte();
  verifier("vérification : avant / change / reste", /Avant votre réponse/.test(t23) && /Ce que votre réponse change/.test(t23) && /Ce qui reste inconnu/.test(t23) && /la preuve publique \(ADEME DPE, DRIAS\) ne change pas/.test(t23));
  await p.getByLabel("Ajouter une note").fill("Fenêtre de la chambre sur cour, aucun bruit de la route à 19 h.");
  await p.getByRole("button", { name: "Enregistrer la note" }).click();
  verifier("note enregistrée avec sa nature", /Votre observation · 8 nov\./.test(await texte()));
  await p.screenshot({ path: path.join(SORTIE, "23-fiche-reponse-et-note-1440-sombre.png"), fullPage: true });
  await p.getByRole("button", { name: "Écarter ce logement" }).click();
  await p.getByLabel("Pourquoi l'écartez-vous ?").fill("Trop bruyant côté séjour");
  await p.getByLabel(/Une condition de votre Projet/).selectOption("calme");
  await p.getByRole("button", { name: "Écarter", exact: true }).click();
  await p.waitForTimeout(200);
  verifier("écarté : raison et contexte gardés", /Écarté le 8 nov\./.test(await texte()) && /Trop bruyant côté séjour/.test(await texte()));
  await p.screenshot({ path: path.join(SORTIE, "24-fiche-ecartee-1440-sombre.png"), fullPage: true });
  await p.getByRole("button", { name: "Remettre en course" }).click();
  verifier("réactivé : historique conservé", /Remis en course/.test(await texte()) && /Écarté : « Trop bruyant côté séjour »/.test(await texte()));

  // 2.4 Et si… ? puis adopter, confirmé.
  await ouvrir("?s=complet");
  const declencheur = p.getByRole("button", { name: "Et si mon Projet changeait ?" });
  await declencheur.click();
  await p.getByRole("button", { name: "40 min" }).click();
  await p.waitForTimeout(250);
  const dlg = p.getByRole("dialog");
  const tdlg = (await dlg.innerText()).replace(/\u00a0/g, " ");
  verifier("et si : simulation dite, Projet intact", /Simulation · votre Projet n'est pas modifié/.test(tdlg) && /vous pourriez le réactiver/.test(tdlg));
  await p.screenshot({ path: path.join(SORTIE, "25-et-si-gare-40-1440-sombre.png"), fullPage: false });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(150);
  const focusRetour = await p.evaluate(() => document.activeElement?.textContent ?? "");
  verifier("et si : Échap ferme et rend le focus au déclencheur", (await dlg.count()) === 0 && /Et si mon Projet changeait/.test(focusRetour));
  verifier("et si : le Projet n'a pas changé", /Une gare à moins de 20 min/.test(await texte()) && /révision 3/.test(await texte()));
  await declencheur.click();
  await p.getByRole("button", { name: "40 min" }).click();
  await p.getByRole("button", { name: "Adopter ce changement" }).click();
  await p.getByRole("button", { name: "Confirmer" }).click();
  await p.waitForTimeout(250);
  verifier("adopté : révision 4, gare à 40 min", /révision 4/.test(await texte()) && /Une gare à moins de 40 min/.test(await texte()));

  // 2.5 Faire le point.
  await p.getByRole("button", { name: "Faire le point" }).click();
  await p.waitForTimeout(250);
  verifier("faire le point : provenance au pied", /aucun texte rédigé par une IA/.test(await texte()));

  // 2.6 Relevé et retour : même conclusion, même lieu ; le bouton retour du navigateur.
  await ouvrir("?s=complet#/lieu/sternes");
  const conclusionFiche = (await p.locator("[data-conclusion]").innerText()).replace(/\u00a0/g, " ").trim();
  await p.getByRole("button", { name: "Ouvrir le Relevé complet" }).click();
  await p.waitForTimeout(250);
  const conclusionReleve = (await p.locator("[data-conclusion]").innerText()).replace(/\u00a0/g, " ").trim();
  verifier("relevé : même conclusion, mot pour mot", conclusionFiche === conclusionReleve, `${conclusionFiche} / ${conclusionReleve}`);
  await p.getByRole("button", { name: "Retrouver ce logement dans Ma décision" }).click();
  await p.waitForTimeout(250);
  verifier("relevé : retour à la même fiche", /#\/lieu\/sternes/.test(p.url()));
  await p.goBack(); await p.waitForTimeout(300);
  verifier("bouton retour du navigateur : rouvre le Relevé", /#\/releve\/sternes/.test(p.url()) && /Relevé simplifié/.test(await texte()));

  // 2.7 Analyser une adresse (Pass) et mettre à jour une analyse ancienne.
  await ouvrir("?s=complet#/lieu/lavoir");
  await p.locator("text=Pass Recherche (hypothèse)").click();
  await p.getByRole("button", { name: /Analyser l'adresse/ }).click();
  await p.waitForTimeout(250);
  verifier("analyse simulée : trois échelles", /Commune, abords et logement analysés/.test(await texte()) && /simulée dans le prototype/.test(await texte()));
  await ouvrir("?s=complet#/lieu/kervily");
  await p.getByRole("button", { name: "Mettre à jour avec votre Projet actuel" }).click();
  await p.waitForTimeout(250);
  verifier("mise à jour simulée : la condition tombe, la version 1 reste", /ne tient pas votre condition sans compromis : une gare à moins de 20 min/.test(await texte()) && /version 2/.test(await texte()));
  await p.screenshot({ path: path.join(SORTIE, "26-mise-a-jour-kervily-1440-sombre.png"), fullPage: true });

  // ── 3. Clavier : chaque arrêt de tabulation a un contour visible ──
  await ouvrir("?s=complet");
  for (let i = 0; i < 24; i++) {
    await p.keyboard.press("Tab");
    const f = await p.evaluate(() => {
      const e = document.activeElement;
      // L'indicateur de développement de Next (NEXTJS-PORTAL) n'existe pas en production : ignoré.
      if (!e || e === document.body || e.tagName === "NEXTJS-PORTAL") return null;
      const cs = getComputedStyle(e);
      return { tag: e.tagName, texte: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 40), contour: cs.outlineStyle !== "none" && cs.outlineWidth !== "0px" };
    });
    resultats.clavier.push(f);
    if (f && !f.contour) echecs.push(`focus sans contour : ${f.tag} « ${f.texte} »`);
  }
  await ctx.close();

  // ── 4. Mouvement réduit : aucune animation d'entrée ──
  const ctxR = await navigateur.newContext({ viewport: { width: 390, height: 780 }, reducedMotion: "reduce" });
  await bloquer(ctxR);
  const pr = await ctxR.newPage();
  await pr.goto(BASE + "?s=complet", { waitUntil: "networkidle" });
  await pr.waitForSelector("[data-titre-vue]");
  resultats.mouvement = await pr.evaluate(() => {
    const vue = document.querySelector("[class*='v4_vue']");
    return { animation: vue ? getComputedStyle(vue).animationName : "?", duree: getComputedStyle(document.documentElement).getPropertyValue("--m-etat").trim() };
  });
  if (resultats.mouvement.animation !== "none") echecs.push(`mouvement réduit : animation ${resultats.mouvement.animation}`);
  await ctxR.close();

  await navigateur.close();
  resultats.echecs = echecs;
  fs.writeFileSync(path.join(SORTIE, "..", "recette.json"), JSON.stringify(resultats, null, 2));
  console.log(`vues ${resultats.vues.length}, gestes ${resultats.gestes.filter((g) => g.ok).length}/${resultats.gestes.length}, clavier ${resultats.clavier.filter(Boolean).length} arrêts, mouvement ${JSON.stringify(resultats.mouvement)}`);
  console.log(echecs.length ? `ÉCHECS (${echecs.length}) :\n- ${echecs.join("\n- ")}` : "AUCUN ÉCHEC");
})().catch((e) => { console.error(e); process.exit(1); });
