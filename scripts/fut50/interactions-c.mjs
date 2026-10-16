// FUT-50 · VERSION C AFFINÉE · le parcours réel sur le serveur local : les trois états du hero (vierge, commune,
// priorité), la composition de comparaison, la porte de l'adresse, le clavier, le mouvement réduit, les temps de
// réponse, les erreurs, le storyboard du dossier et une vidéo du hero. Aucune écriture.
// Usage : node scripts/fut50/interactions-c.mjs [http://localhost:3050]
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3050";
const URL_C = `${base}/dev/fut50/c`;
// Écrites HORS du dépôt pendant le parcours : le serveur de développement surveille les fichiers du projet, et une
// capture déposée dans docs/ peut recharger la page en pleine saisie. Recopiées à la fin.
const IMG = process.env.SORTIE_IMG ?? "docs/audits/fut50-accueil/images";
const VID = process.env.SORTIE_VID ?? "docs/audits/fut50-accueil/videos";
const exe = process.env.CHROME ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-x64/chrome-headless-shell`;
const nav = await chromium.launch({ executablePath: exe });
const constats = [];
const prep = (ctx) => ctx.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
const sansDev = (p) => p.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});

async function ouvrir(largeur, hauteur, dpr, opts = {}, url = URL_C) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: dpr, ...opts });
  await prep(ctx);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  // Le serveur de développement recharge parfois la page juste après son premier rendu : on le laisse faire.
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle");
  await sansDev(page);
  return { ctx, page };
}
const lecturePrete = (page) => page.waitForFunction(() => {
  const z = document.querySelector('[aria-live="polite"] article');
  return z && !document.querySelector('[aria-busy="true"]');
}, null, { timeout: 30000 });
async function optionsVisibles(page, texte) {
  for (let essai = 0; essai < 3; essai++) {
    if (await page.waitForSelector('[role="option"]', { timeout: 8000 }).then(() => true).catch(() => false)) return;
    await page.waitForLoadState("networkidle");
    const champ = page.getByRole("combobox");
    await champ.fill("");
    await champ.pressSequentially(texte, { delay: 60 });
  }
  throw new Error(`aucune suggestion pour « ${texte} »`);
}
async function choisirCommune(page, texte, nom) {
  const champ = page.getByRole("combobox");
  // Le serveur de développement peut recharger la page pendant la saisie : on recommence une fois.
  for (let essai = 0; essai < 3; essai++) {
    await champ.fill("");
    await champ.click();
    await champ.pressSequentially(texte, { delay: 60 });
    const ok = await page.waitForSelector('[role="option"]', { timeout: 8000 }).then(() => true).catch(() => false);
    if (ok) break;
    await page.waitForLoadState("networkidle");
  }
  await page.waitForTimeout(200);
  if (nom) {
    // Au clavier jusqu'à la commune voulue : la flèche descend dans la liste, Entrée choisit.
    const options = await page.getByRole("option").allInnerTexts();
    const i = options.findIndex((o) => o.split("\n")[0] === nom);
    for (let k = 0; k < Math.max(0, i); k++) await page.keyboard.press("ArrowDown");
  }
}

// ── Les trois états, trois largeurs ──────────────────────────────────────────────────────────
for (const [largeur, hauteur, dpr] of [[1440, 900, 1], [390, 844, 2], [360, 740, 2]]) {
  const { ctx, page } = await ouvrir(largeur, hauteur, dpr);
  await page.screenshot({ path: `${IMG}/c3-etat-a-vierge-${largeur}.jpg`, type: "jpeg", quality: 78 });
  const vierge = await page.locator('[aria-live="polite"]').innerText();
  constats.push(`${largeur} état A : colonne de lecture ${vierge.trim() === "" ? "vide" : "NON VIDE"}`);
  await choisirCommune(page, "Nant", "Nantes");
  await page.screenshot({ path: `${IMG}/c3-suggestions-${largeur}.jpg`, type: "jpeg", quality: 78 });
  const options = await page.getByRole("option").allInnerTexts();
  constats.push(`${largeur} suggestions : ${options.length} communes (${options.map((o) => o.split("\n")[0]).join(", ")})`);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${IMG}/c3-etat-b-commune-${largeur}.jpg`, type: "jpeg", quality: 78 });
  const b = await page.locator('[aria-live="polite"]').innerText();
  constats.push(`${largeur} état B : lecture ${b.trim() === "" ? "absente (attendu)" : "PRÉSENTE"}`);
  const t0 = Date.now();
  await page.getByRole("button", { name: "Avoir des hivers doux" }).click();
  await lecturePrete(page);
  constats.push(`${largeur} état C (hivers) en ${Date.now() - t0} ms`);
  await page.waitForTimeout(300);
  if (largeur < 1000) await page.locator('[aria-live="polite"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${IMG}/c3-etat-c-priorite-${largeur}.jpg`, type: "jpeg", quality: 78 });
  // Désélection : retour à l'état B, sans résultat.
  await page.getByRole("button", { name: "Avoir des hivers doux" }).click();
  await page.waitForTimeout(200);
  const apres = await page.locator('[aria-live="polite"]').innerText();
  constats.push(`${largeur} désélection : lecture ${apres.trim() === "" ? "retirée" : "ENCORE AFFICHÉE"}`);
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  constats.push(`${largeur} débordement horizontal : ${deborde} px`);
  await ctx.close();
}


// ── Le geste de l'état 3 : continuité, aucun saut, aucun décalage ─────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  await page.evaluate(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  });
  await choisirCommune(page, "Nant", "Nantes");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  const champ = await page.$('[role="combobox"]');
  const avant = await page.evaluate(() => {
    const t = document.querySelector("h1").getBoundingClientRect();
    const b = document.querySelector('[role="combobox"]').getBoundingClientRect();
    return { titreHaut: Math.round(t.top), champGauche: Math.round(b.left) };
  });
  // Données préchauffées : la bande d'images montre le geste, pas le chargement.
  await page.evaluate(() => fetch("/dev/fut50/api/lecture?insee=44109&cle=hivers&type=commune&commune=Nantes&libelle=Nantes"));
  await page.getByRole("button", { name: "Avoir des hivers doux" }).click();
  let ecoule = 0;
  for (const t of [120, 300, 480, 700]) {
    await page.waitForTimeout(t - ecoule);
    ecoule = t;
    await page.screenshot({ path: `${IMG}/c3-transition-${t}ms-1440.jpg`, type: "jpeg", quality: 70 });
  }
  await lecturePrete(page);
  await page.waitForTimeout(600);
  const apres = await page.evaluate(() => {
    const t = document.querySelector("h1").getBoundingClientRect();
    const b = document.querySelector('[role="combobox"]').getBoundingClientRect();
    return { titreHaut: Math.round(t.top), champGauche: Math.round(b.left), focus: document.activeElement?.textContent?.trim() };
  });
  const memeChamp = await champ.evaluate((el) => el.isConnected && el === document.querySelector('[role="combobox"]'));
  constats.push(`geste état 3 : titre ${avant.titreHaut} → ${apres.titreHaut} px (vertical), champ ${avant.champGauche} → ${apres.champGauche} px (horizontal), même champ : ${memeChamp}, focus sur « ${apres.focus} »`);
  // Changement de priorité, puis désélection, puis retour à l'état initial.
  await page.getByRole("button", { name: "Vivre dans une petite ville" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${IMG}/c3-changement-priorite-1440.jpg`, type: "jpeg", quality: 78 });
  for (const n of ["Vivre dans une petite ville", "Avoir des hivers doux"]) await page.getByRole("button", { name: n }).click();
  await page.waitForTimeout(600);
  const retourB = await page.evaluate(() => Math.round(document.querySelector('[role="combobox"]').getBoundingClientRect().left));
  await page.getByRole("button", { name: "Changer de commune" }).click();
  await page.waitForTimeout(600);
  const retourA = await page.evaluate(() => ({ champ: Math.round(document.querySelector('[role="combobox"]').getBoundingClientRect().left), focus: document.activeElement?.getAttribute("role"), priorites: document.querySelectorAll("button[aria-pressed]").length }));
  const cls = await page.evaluate(() => window.__cls);
  constats.push(`retours : désélection → champ à ${retourB} px (centré) ; « Changer de commune » → champ à ${retourA.champ} px, focus ${retourA.focus}, ${retourA.priorites} priorité affichée ; décalage cumulé (CLS) ${cls.toFixed(3)}`);
  await ctx.close();
}


// ── Chaleur : La Rochelle et Nîmes, même priorité, ordinateur et mobile ; en-tête fixe sur mobile ─────
for (const [largeur, hauteur, dpr] of [[1440, 900, 1], [390, 844, 2], [360, 780, 2]]) {
  for (const [saisie, nom, fichier] of [["La Rochelle", "La Rochelle", "la-rochelle"], ["Nantes", "Nantes", "nantes"], ["Bordeaux", "Bordeaux", "bordeaux"], ["Nîmes", "Nîmes", "nimes"]]) {
    const { ctx, page } = await ouvrir(largeur, hauteur, dpr);
    await choisirCommune(page, saisie, nom);
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Éviter les fortes chaleurs" }).click();
    await lecturePrete(page);
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${IMG}/c8-chaleur-${fichier}-${largeur}-35.jpg`, type: "jpeg", quality: 78 });
    constats.push(`${largeur} ${nom} pastille : ${await page.locator('[data-classement]').innerText()} (classement ${await page.locator('[data-classement]').getAttribute("data-classement")}) · couleur ${await page.locator('[data-classement]').evaluate((e) => getComputedStyle(e).color)} · « ${await page.locator('[data-classement] + p').innerText()} »`);
    const texte = (await page.locator('[aria-live="polite"] article').innerText()).replace(/\s+/g, " ");
    constats.push(`${largeur} ${nom} chaleur : ${texte.slice(0, 260)}`);
    if (largeur < 1000) {
      const pos = await page.evaluate(() => {
        const t = document.querySelector('[aria-live="polite"] article h2')?.getBoundingClientRect().top;
        const h = document.querySelector("nav")?.getBoundingClientRect().bottom;
        return { titre: Math.round(t ?? -1), entete: Math.round(h ?? -1) };
      });
      constats.push(`${largeur} ${nom} défilement : titre de la lecture à ${pos.titre} px, bas de l'en-tête à ${pos.entete} px → ${pos.titre >= pos.entete ? "visible" : "MASQUÉ"}`);
    }
    // ── Et au-dessus de 30 °C ? Le geste, ses effets, et ce qui ne doit pas bouger. ──
    const mesurer = () => page.evaluate(() => {
      const art = document.querySelector('[aria-live="polite"] article');
      const blocs = [...document.querySelectorAll('[aria-live="polite"] article [data-visible="true"]')];
      const nuit = blocs.at(-1)?.getBoundingClientRect();
      const vue = blocs[0];
      return {
        panneau: Math.round(art.getBoundingClientRect().height),
        nuits: nuit ? `${Math.round(nuit.left)},${Math.round(nuit.top)},${Math.round(nuit.height)}` : "?",
        nuitsTexte: blocs.at(-1)?.innerText.replace(/\s+/g, " "),
        valeur: vue?.innerText.replace(/\s+/g, " "),
        lu: vue?.parentElement?.parentElement?.querySelector(":scope > p[class*=lectureSeule]")?.textContent,
        debord: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    const bouton = page.getByRole("button", { name: "Et au-dessus de 30 °C ?" });
    await bouton.scrollIntoViewIfNeeded();
    const avant = await mesurer();
    let requetes = 0;
    const urls = [];
    const compter = (r) => { requetes++; urls.push(r.url().replace("http://localhost:3050", "")); };
    page.on("request", compter);
    await bouton.click();
    await page.waitForTimeout(400);
    const apres = await mesurer();
    const focus = await page.evaluate(() => document.activeElement?.textContent);
    page.off("request", compter);
    await page.screenshot({ path: `${IMG}/c8-chaleur-${fichier}-${largeur}-30.jpg`, type: "jpeg", quality: 78 });
    constats.push(`${largeur} ${nom} 30 °C : « ${avant.valeur} » → « ${apres.valeur} » ; lu : « ${apres.lu} » ; hauteur ${avant.panneau} → ${apres.panneau} px ; nuits ${avant.nuits} → ${apres.nuits} (${avant.nuitsTexte === apres.nuitsTexte ? "texte identique" : "TEXTE CHANGÉ"}) ; requêtes ${requetes}${urls.length ? ` (${urls.join(", ")})` : ""} ; focus « ${focus} » ; débordement ${apres.debord} px`);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    const retour = await mesurer();
    constats.push(`${largeur} ${nom} retour (Entrée) : « ${retour.valeur} » ; hauteur ${retour.panneau} px`);
    if (largeur === 1440) {
      // L'explication de méthode, ouverte, capturée en entier (le panneau de lecture seul).
      await page.getByText("Comment lire ce résultat ?").click();
      await page.waitForTimeout(300);
      await page.locator('[aria-live="polite"] article').screenshot({ path: `${IMG}/c8-chaleur-${fichier}-${largeur}-methode.jpg`, type: "jpeg", quality: 78 });
    }

    await ctx.close();
  }
}



// ── 30 °C : clavier, mouvement réduit, changement de commune et de priorité ─────────────────────
for (const reduit of [false, true]) {
  const { ctx, page } = await ouvrir(390, 844, 2);
  if (reduit) await page.emulateMedia({ reducedMotion: "reduce" });
  await choisirCommune(page, "La Rochelle", "La Rochelle");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Éviter les fortes chaleurs" }).click();
  await lecturePrete(page);
  await page.locator('button[aria-pressed="true"]').first().focus();
  let tabs = 0;
  for (; tabs < 12; tabs++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => document.activeElement?.textContent === "Et au-dessus de 30 °C ?")) break; }
  const contour = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  const duree = await page.evaluate(() => getComputedStyle(document.querySelector("[data-visible]")).transitionDuration);
  await page.keyboard.press("Enter");
  const a30 = await page.evaluate(() => document.activeElement?.textContent);
  await page.keyboard.press(" ");
  const a35 = await page.evaluate(() => document.activeElement?.textContent);
  constats.push(`30 °C au clavier${reduit ? " (mouvement réduit)" : ""} : atteint en ${tabs + 1} tabulation(s), contour ${contour}, transition ${duree} ; Entrée → « ${a30} », Espace → « ${a35} »`);
  if (!reduit) {
    // Basculé à 30 °C, puis une autre priorité, puis retour : la lecture revient à 35 °C.
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Avoir des hivers doux" }).click();
    await lecturePrete(page);
    await page.getByRole("tab", { name: "Éviter les fortes chaleurs" }).click();
    await lecturePrete(page);
    await page.waitForTimeout(500);
    if (!(await page.locator('[data-visible="true"]').count())) {
      await page.screenshot({ path: `${IMG}/_debug-priorite.jpg`, type: "jpeg", quality: 70 });
      constats.push(`DEBUG priorité : ${(await page.locator('[aria-live="polite"]').innerText()).replace(/\s+/g, " ").slice(0, 400)}`);
    }
    const apresPriorite = await page.locator('[data-visible="true"]').first().innerText({ timeout: 5000 }).catch(() => "ABSENT");
    // Basculé à 30 °C, puis une autre commune.
    await page.getByRole("button", { name: "Et au-dessus de 30 °C ?" }).click();
    await page.getByRole("button", { name: "Changer de commune" }).click();
    await choisirCommune(page, "Nîmes", "Nîmes");
    await page.keyboard.press("Enter");
    // Les priorités choisies survivent au changement de commune : on ne reclique que si elle n'est plus active.
    const chaleur = page.getByRole("button", { name: "Éviter les fortes chaleurs" });
    if ((await chaleur.getAttribute("aria-pressed")) !== "true") await chaleur.click();
    await lecturePrete(page);
    await page.waitForTimeout(800);
    constats.push(`30 °C, commune changée : lecture de « ${(await page.locator('[aria-live="polite"] article h2').innerText().catch(() => "?"))} »`);
    const apresCommune = await page.locator('[data-visible="true"]').first().innerText();
    constats.push(`30 °C, état : après changement de priorité « ${apresPriorite.replace(/\s+/g, " ").slice(0, 40)} » ; après changement de commune « ${apresCommune.replace(/\s+/g, " ").slice(0, 40)} »`);
  }
  await ctx.close();
}

// ── « Comment lire ce résultat ? » au clavier, et sous mouvement réduit ────────────────────────────
for (const reduit of [false, true]) {
  const { ctx, page } = await ouvrir(390, 844, 2);
  if (reduit) await page.emulateMedia({ reducedMotion: "reduce" });
  await choisirCommune(page, "La Rochelle", "La Rochelle");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Éviter les fortes chaleurs" }).click();
  await lecturePrete(page);
  // Atteint par Tab, comme au clavier : depuis la priorité choisie, jusqu'au résumé.
  await page.locator('[role="tab"][aria-selected="true"], button[aria-pressed="true"]').first().focus();
  for (let t = 0; t < 12; t++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => document.activeElement?.tagName === "SUMMARY")) break; }
  const etat = async () => page.evaluate(() => ({ ouvert: document.querySelector("details")?.open, focus: document.activeElement?.tagName, contour: getComputedStyle(document.activeElement).outlineStyle }));
  const avant = await etat();
  await page.keyboard.press("Enter");
  const ouvert = await etat();
  await page.keyboard.press(" ");
  const ferme = await etat();
  const anim = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  constats.push(`méthode au clavier${reduit ? " (mouvement réduit)" : ""} : fermé=${!avant.ouvert} → Entrée ouvert=${ouvert.ouvert} → Espace fermé=${!ferme.ouvert} ; focus ${ouvert.focus}, contour ${avant.contour} ; animations en cours ${anim}`);
  await ctx.close();
}

// ── Onglets de priorités multiples au clavier ───────────────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  await choisirCommune(page, "Nant", "Nantes");
  await page.keyboard.press("Enter");
  for (const n of ["Éviter les fortes chaleurs", "Avoir des hivers doux"]) { await page.getByRole("button", { name: n }).click(); await lecturePrete(page); }
  await page.waitForTimeout(800);
  await page.locator('[role="tab"][aria-selected="true"]').focus();
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({ focus: document.activeElement?.textContent, choisi: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent, panneau: document.querySelector('[role="tabpanel"]')?.getAttribute("aria-labelledby"), tabindex: [...document.querySelectorAll('[role="tab"]')].map((t) => t.getAttribute("tabindex")).join(",") }));
  constats.push(`onglets clavier : flèche gauche → focus « ${r.focus} », sélection « ${r.choisi} », panneau lié à ${r.panneau}, tabindex ${r.tabindex}`);
  await ctx.close();
}

// ── Commune sans données climatiques (La Réunion, hors DRIAS métropole) ─────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  // Code inconnu des référentiels : la route refuse d'inventer une identité (404), plus de lecture devinée.
  const r = await page.evaluate(async () => { const x = await fetch("/dev/fut50/api/lecture?insee=99999&cle=chaleur&commune=Inconnue"); return { statut: x.status, corps: await x.json() }; });
  constats.push(`code inconnu (99999) : ${r.statut} ${r.corps.error ?? ""}`);
  await ctx.close();
}

// ── Changer de commune : aucune lecture de l'ancienne ne reste ───────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  await choisirCommune(page, "Annec", "Annecy");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Vivre dans une petite ville" }).click();
  await lecturePrete(page);
  await page.getByRole("button", { name: "Changer de commune" }).click();
  await choisirCommune(page, "Guér", "Guéret");
  await page.keyboard.press("Enter");
  await lecturePrete(page);
  const t = (await page.locator('[aria-live="polite"]').innerText()).replace(/\s+/g, " ");
  constats.push(`changement de commune : ${/Annecy/.test(t) ? "LECTURE D'ANNECY ENCORE VISIBLE" : "seule la nouvelle commune est lue"} (${t.slice(0, 90)})`);
  await page.screenshot({ path: `${IMG}/c3-changement-commune-1440.jpg`, type: "jpeg", quality: 78 });
  await ctx.close();
}

// ── Composition de comparaison (mobilité) ────────────────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1, {}, `${URL_C}?pastilles=mobilite`);
  await choisirCommune(page, "Nant", "Nantes");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Pouvoir vivre sans voiture" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${IMG}/c3-composition-mobilite-1440.jpg`, type: "jpeg", quality: 78 });
  await ctx.close();
}

// ── La porte de l'adresse ────────────────────────────────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  await page.getByRole("link", { name: "Examiner cette adresse" }).click();
  await page.waitForURL("**/dossier", { timeout: 20000 });
  constats.push(`porte de l'adresse : ${new URL(page.url()).pathname}`);
  await ctx.close();
}

// ── Erreur de lecture : le message et « Réessayer » ──────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  await page.route("**/dev/fut50/api/lecture**", (r) => r.fulfill({ status: 500, body: "" }));
  await choisirCommune(page, "Nant", "Nantes");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Éviter les fortes chaleurs" }).click();
  await page.waitForSelector('[aria-live="polite"] [role="alert"]', { timeout: 10000 });
  await page.screenshot({ path: `${IMG}/c3-erreur-lecture-1440.jpg`, type: "jpeg", quality: 78 });
  constats.push(`erreur de lecture : ${(await page.locator('[aria-live="polite"] [role="alert"]').innerText()).replace(/\s+/g, " ")}`);
  await ctx.close();
}

// ── Clavier seul, mouvement réduit ───────────────────────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  let tabs = 0;
  for (; tabs < 40; tabs++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => document.activeElement?.getAttribute("role") === "combobox")) break; }
  if (tabs >= 40) constats.push("clavier : CHAMP NON ATTEINT en 40 tabulations");
  await page.keyboard.type("Lille", { delay: 60 });
  await optionsVisibles(page, "Lille");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  let n = 0;
  for (; n < 10; n++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => document.activeElement?.getAttribute("aria-pressed") != null)) break; }
  await page.keyboard.press("Space");
  await lecturePrete(page);
  const focus = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== "none");
  constats.push(`clavier : champ en ${tabs + 1} tabulations, première priorité ${n + 1} tabulations après la commune, focus visible : ${focus}`);
  await ctx.close();
}
{
  const { ctx, page } = await ouvrir(1440, 900, 1, { reducedMotion: "reduce" });
  await choisirCommune(page, "Nant", "Nantes");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Avoir des hivers doux" }).click();
  await lecturePrete(page);
  const anims = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  constats.push(`mouvement réduit : ${anims} animation(s) en cours après interaction`);
  await ctx.close();
}

// ── Storyboard et section Dossier Adresse ────────────────────────────────────────────────────
for (const [largeur, hauteur, dpr] of [[1440, 900, 1], [390, 844, 2]]) {
  const { ctx, page } = await ouvrir(largeur, hauteur, dpr, {}, `${base}/dev/fut50/storyboard`);
  await page.screenshot({ path: `${IMG}/c3-storyboard-${largeur}-page.jpg`, type: "jpeg", quality: 78, fullPage: true });
  await page.goto(`${URL_C}#dossier-adresse`, { waitUntil: "networkidle" });
  await sansDev(page);
  await page.locator("#dossier-adresse").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -20));
  await page.screenshot({ path: `${IMG}/c3-section-dossier-${largeur}.jpg`, type: "jpeg", quality: 78 });
  await ctx.close();
}

// ── Vidéo du hero ─────────────────────────────────────────────────────────────────────────────
mkdirSync(VID, { recursive: true });
const tmp = `${VID}/.tmp`;
// Le serveur de développement recharge parfois la page juste après le premier rendu : jusqu'à trois prises.
for (let prise = 1; prise <= 3; prise++) {
  rmSync(tmp, { recursive: true, force: true });
  try {
    {
      const ctx = await nav.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: tmp, size: { width: 1280, height: 800 } } });
      await prep(ctx);
      const page = await ctx.newPage();
      await page.goto(URL_C, { waitUntil: "networkidle" });
      await sansDev(page);
      await page.waitForTimeout(1500);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(800);
      // Le geste d'un visiteur qui ne sait pas quoi chercher : l'exemple proposé sous le champ.
      await page.getByRole("button", { name: "Annecy" }).click();
      await page.waitForTimeout(1600);
      for (const nom of ["Avoir des hivers doux", "Éviter les fortes chaleurs", "Vivre dans une petite ville"]) {
        await page.getByRole("button", { name: nom }).click();
        await lecturePrete(page);
        await page.waitForTimeout(2600);
      }
      await page.getByRole("button", { name: "Vivre dans une petite ville" }).click();
      await page.waitForTimeout(1600);
      await ctx.close();
      const webm = readdirSync(tmp).find((f) => f.endsWith(".webm"));
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${tmp}/${webm}`, "-vf", "scale=1280:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28", "-movflags", "+faststart", `${VID}/c3-hero-adaptatif.mp4`]);
      rmSync(tmp, { recursive: true, force: true });
      constats.push(`vidéo ${VID}/c3-hero-adaptatif.mp4`);
    }
    break;
  } catch (e) {
    constats.push(`vidéo, prise ${prise} : ${e.message.split("\n")[0]}`);
    rmSync(tmp, { recursive: true, force: true });
  }
}

await nav.close();
console.log(constats.join("\n"));
