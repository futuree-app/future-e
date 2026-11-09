const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/fut94/node_modules/playwright-core");
const OUT = "/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/fut94/docs/audits/2026-11-09-fut94-retour-utilite";
const BASE = "http://localhost:3094/dev/fut94";
const journal = [];
async function preparer(ctx) {
  await ctx.addInitScript(() => {
    try { localStorage.setItem("futuree-consent", "refused"); } catch {}
    const st = document.createElement("style");
    st.textContent = "nextjs-portal{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(st));
  });
  return ctx;
}
const note = (m) => { journal.push(m); console.log(m); };

async function bloc(page) { return page.locator("[data-retour-utilite]"); }
async function capture(page, nom) {
  const b = await bloc(page);
  await b.scrollIntoViewIfNeeded();
  // Le bloc et ce qui l'entoure : le geste de clôture au-dessus, le pied en dessous.
  const box = await b.evaluate((el) => { const r = el.getBoundingClientRect(); return { y: r.top + window.scrollY, height: r.height }; });
  const vp = page.viewportSize();
  const y = Math.max(0, box.y - 220);
  await page.screenshot({ path: `${OUT}/${nom}.png`, clip: { x: 0, y, width: vp.width, height: box.height + 420 }, fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  for (const vue of ["releve", "classique"]) {
    for (const [nomVp, vp] of [["ordinateur", { width: 1440, height: 1000 }], ["mobile-390", { width: 390, height: 844 }], ["mobile-360", { width: 360, height: 780 }]]) {
      const ctx = await preparer(await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: nomVp !== "ordinateur" }));
      const page = await ctx.newPage();
      await page.goto(`${BASE}?vue=${vue}`, { waitUntil: "networkidle" });
      const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      note(`${vue} ${nomVp} : débordement horizontal ${scroll}px`);
      await capture(page, `${vue}-${nomVp}-1-question`);
      // Hauteurs de toucher
      const hauteurs = await page.locator("[data-retour-utilite] button").evaluateAll((bs) => bs.map((b) => Math.round(b.getBoundingClientRect().height)));
      note(`${vue} ${nomVp} : hauteurs des boutons ${hauteurs.join(", ")}`);
      await page.getByRole("button", { name: "Pas vraiment" }).click();
      await page.getByText("Merci, votre réponse est enregistrée.").waitFor();
      await capture(page, `${vue}-${nomVp}-2-reponse-et-commentaire`);
      await page.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).fill("Le bruit de la rocade la nuit, et les temps à vélo vers la gare.");
      await page.getByRole("button", { name: "Envoyer" }).click();
      await page.getByText("Merci, votre commentaire est enregistré.").waitFor();
      await capture(page, `${vue}-${nomVp}-3-envoye`);
      await ctx.close();
    }
    // Panne : le texte est conservé
    const ctx = await preparer(await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }));
    const page = await ctx.newPage();
    await page.goto(`${BASE}?vue=${vue}&panne=commentaire`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Oui", exact: true }).click();
    await page.getByText("Merci, votre réponse est enregistrée.").waitFor();
    const texte = "Les écoles du quartier, très utile.";
    await page.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).fill(texte);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.getByText(/Il est conservé dans le champ/).waitFor();
    const garde = await page.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).inputValue();
    note(`${vue} panne commentaire : texte conservé = ${garde === texte}`);
    await capture(page, `${vue}-mobile-390-4-panne-texte-conserve`);
    await ctx.close();
    // Déjà répondu
    const ctx2 = await preparer(await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }));
    const p2 = await ctx2.newPage();
    await p2.goto(`${BASE}?vue=${vue}&deja=oui&commentaire=1`, { waitUntil: "networkidle" });
    await capture(p2, `${vue}-mobile-390-5-deja-repondu`);
    await ctx2.close();
    // Clavier : Tab jusqu'aux options, Entrée, puis focus après envoi
    const ctx3 = await preparer(await browser.newContext({ viewport: { width: 1440, height: 1000 } }));
    const p3 = await ctx3.newPage();
    await p3.goto(`${BASE}?vue=${vue}`, { waitUntil: "networkidle" });
    await p3.locator("[data-retour-utilite]").scrollIntoViewIfNeeded();
    // On part de l'élément qui précède le bloc (le geste de clôture) pour un parcours réel au clavier.
    await p3.locator('a[href="/dossier"]').last().focus();
    const parcours = [];
    for (let i = 0; i < 4; i++) {
      await p3.keyboard.press("Tab");
      parcours.push(await p3.evaluate(() => (document.activeElement?.textContent ?? "").trim().slice(0, 30)));
    }
    note(`${vue} clavier, Tab depuis le geste de clôture : ${parcours.join(" → ")}`);
    // Retour sur « Pas vraiment » par Maj+Tab, puis Espace
    await p3.keyboard.press("Shift+Tab");
    await p3.keyboard.press("Shift+Tab");
    const sur = await p3.evaluate(() => document.activeElement?.textContent?.trim());
    await p3.keyboard.press("Space");
    await p3.getByText("Merci, votre réponse est enregistrée.").waitFor();
    const apres = await p3.evaluate(() => ({ t: document.activeElement?.textContent?.trim(), pressed: document.activeElement?.getAttribute("aria-pressed") }));
    note(`${vue} clavier : Espace sur « ${sur} » → focus toujours sur « ${apres.t} » (aria-pressed=${apres.pressed})`);
    await p3.keyboard.press("Tab"); await p3.keyboard.press("Tab");
    const champ = await p3.evaluate(() => document.activeElement?.tagName);
    await p3.keyboard.type("Un manque : les transports du soir.");
    await p3.keyboard.press("Tab");
    await p3.keyboard.press("Enter");
    await p3.getByText("Merci, votre commentaire est enregistré.").waitFor();
    const fin = await p3.evaluate(() => (document.activeElement?.textContent ?? "").trim().slice(0, 50));
    note(`${vue} clavier : champ atteint = ${champ}, après envoi le focus est sur « ${fin} »`);
    const focusVisible = await p3.evaluate(() => { const b = document.querySelector("[data-retour-utilite] button"); b.focus(); const cs = getComputedStyle(b); return `${cs.outlineStyle} ${cs.outlineWidth}`; });
    note(`${vue} clavier : contour de focus d'un bouton = ${focusVisible}`);
    await p3.screenshot({ path: `${OUT}/${vue}-ordinateur-6-focus-clavier.png`, clip: await p3.locator("[data-retour-utilite]").evaluate((el) => { const r = el.getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top + window.scrollY - 40), width: 1440, height: r.height + 80 }; }), fullPage: true });
    await ctx3.close();
  }
  await browser.close();
  require("fs").writeFileSync(`${OUT}/recette.txt`, journal.join("\n") + "\n");
})().catch((e) => { console.error(e); process.exit(1); });
