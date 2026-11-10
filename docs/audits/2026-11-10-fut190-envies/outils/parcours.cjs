// Contrôles ciblés du rendu et des réponses, sans requête vers les services externes.
// Depuis la racine : BASE=http://127.0.0.1:3191/dev/envies CHROMIUM_PATH=/usr/bin/chromium node docs/audits/2026-11-10-fut190-envies/outils/parcours.cjs
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const BASE = process.env.BASE ?? "http://localhost:3190/dev/envies";
(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
    : { channel: "chrome" });
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      await context.route((url) => url.origin !== new URL(BASE).origin, route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const texte = async locator => (await locator.innerText()).replace(/[  ]/g, " ");
      const main = page.locator("main");
      const ouvrir = async situation => {
        await page.goto(`${BASE}?s=${situation}`);
        await page.locator("[data-titre-vue]").waitFor();
        const refus = page.getByRole("button", { name: /refuser/i });
        if (await refus.count()) await refus.first().click();
      };
      const sansDebordement = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await ouvrir("theatre");
      assert.match(await texte(main), /35 min en voiture, dans votre limite de 40 min/);
      assert.match(await texte(main), /en tension avec votre priorité « moins dépendre de la voiture »/);
      assert.match(await texte(main), /inconnue, pas impossible/);
      assert.match(await texte(main), /Ces temps ne sont pas ceux des logements fictifs/);
      await page.getByRole("button", { name: "60 min", exact: true }).click();
      await page.getByRole("button", { name: "chaque semaine", exact: true }).click();
      assert.equal(await page.getByRole("button", { name: "60 min", exact: true }).getAttribute("aria-pressed"), "true");
      await page.getByRole("button", { name: "20 min", exact: true }).click();
      assert.match(await texte(main), /35 min en voiture, au-delà de vos 20 min/);
      await sansDebordement();
      await ouvrir("nager");
      assert.match(await texte(main), /contre la marche aujourd'hui/);
      await page.getByRole("button", { name: "Non, horaires réduits" }).click();
      assert.match(await texte(page.locator('[aria-labelledby="retenir-t"]')), /ne permettrait pas de préserver votre habitude à ces heures-là/);
      assert.doesNotMatch(await texte(main), /habitude tient|D'après le centre|ne distingue pas les deux lieux/);
      await page.getByRole("button", { name: "Oui, matin et soir" }).click();
      assert.match(await texte(main), /S'ils sont confirmés aux jours souhaités/);
      assert.match(await texte(main), /source non renseignée/);
      await sansDebordement();
      await ouvrir("potager");
      await page.getByRole("button", { name: "Oui, mais plusieurs années d'attente" }).click();
      await page.getByText("Une autre vérification utile", { exact: true }).click();
      await page.getByRole("button", { name: "Déjà inondé", exact: true }).click();
      assert.match(await texte(page.locator('[aria-labelledby="retenir-t"]')), /rien n'établit ici que la maison a été touchée/);
      assert.match(await texte(main), /annonce fictive.*si sa disponibilité et sa cultivabilité sont confirmées/s);
      assert.doesNotMatch(await texte(main), /seul Chalonnes|D'après la mairie|D'après le vendeur|auprès de :/);
      assert.match(await texte(main), /Sol, eau, exposition et droit d'usage restent à vérifier/);
      await sansDebordement();
      await ouvrir("apres");
      assert.match(await texte(main), /Votre réponse du 6 nov\. \(source non renseignée\)/);
      assert.match(await texte(main), /Votre réponse du 7 nov\. \(source non renseignée\)/);
      assert.doesNotMatch(await texte(main), /seul Chalonnes|Chaque sortie demande|Vérifié le/);
      await sansDebordement();
      await ouvrir("libre");
      assert.match(await texte(main), /sans conclusion de futur•e/i);
      await sansDebordement();
      await ouvrir("depart#/projet");
      await page.locator("input[placeholder]").fill("observer les oiseaux");
      assert.match(await texte(main), /n'a pas de donnée pour lire cette envie/);
      assert.deepEqual(errors, []);
      console.log(`OK ${width}px : théâtre mensuel/hebdomadaire, limite conservée, natation oui/non, potager avec réponses croisées, après réponses, envie non mesurable ; aucun débordement ni erreur JS.`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
