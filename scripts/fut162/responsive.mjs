// FUT-162 : recette géométrique du VRAI LogementModule dans le banc DEV existant.
// Aucune source appelée : les lectures viennent des fixtures FUT-156.
// CHROME=/chemin/vers/chrome node scripts/fut162/responsive.mjs http://localhost:3000 [avant|apres]
// « avant » constate le défaut sans le déclarer corrigé ; « apres » échoue si un texte reste coupé.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const [baseBrute = "http://localhost:3000", phase = "apres"] = process.argv.slice(2);
const base = new URL(baseBrute);
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Serveur local seulement");
assert.ok(["avant", "apres"].includes(phase));
assert.ok(process.env.CHROME, "Fournir CHROME, chemin du navigateur local installé");
const sortie = "docs/audits/2026-10-29-fut162-mobile";
await mkdir(`${sortie}/captures`, { recursive: true });
const cas = [
  ["deploye", "17415_0510_00011", /5 opérateurs déclarent/],
  ["ambigu", "17385_9eyuk6_00003", /Raccordement à vérifier/],
  ["plage", "17017_0121_00003", /4 à 5 opérateurs déclarent/],
  ["non-rattache", "17299_0810_00049_bis", /Aucun bâtiment des fichiers/],
  ["indisponible", "panne", /Fibre non vérifiée/],
];
const navigateur = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const mesures = [];
try {
  for (const largeur of [320, 360, 390, 1440]) {
    const page = await navigateur.newPage({
      viewport: { width: largeur, height: 900 }, deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    // Réserve la recette aux seuls fichiers locaux et aux polices qu'ils servent.
    await page.route("**/*", (route) => {
      const u = new URL(route.request().url());
      return u.origin === base.origin || ["data:", "blob:"].includes(u.protocol)
        ? route.continue() : route.abort();
    });
    for (const [nom, id, attendu] of cas) {
      const url = new URL("/dev/fut156", base);
      url.search = new URLSearchParams({ vue: "logement", cas: id }).toString();
      await page.goto(url.href);
      const fibre = page.getByRole("region", { name: "Fibre à cette adresse", exact: true });
      await fibre.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const texte = (await fibre.innerText()).replaceAll("\u00a0", " ");
      assert.match(texte, attendu, `${largeur}/${nom}`);
      if (["ambigu", "non-rattache", "indisponible"].includes(nom)) {
        assert.doesNotMatch(texte, /\d+ opérateurs? déclarent?|indiquée comme déployée/);
      }
      const lien = fibre.getByRole("link", { name: "Vérifier l'adresse sur Ma connexion internet" });
      assert.equal(await lien.getAttribute("href"), "https://maconnexioninternet.arcep.fr/");
      await lien.focus(); // doit rester atteignable au clavier, sans ouvrir le site externe
      const details = fibre.locator("details");
      if (await details.count()) await details.locator("summary").click();
      const geometrie = await fibre.evaluate((section) => {
        const w = innerWidth, r = section.getBoundingClientRect();
        // scrollWidth seul ne suffit pas : overflow-hidden masquait le défaut initial.
        const coupes = [];
        const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.width && rect.height && (rect.left < -0.5 || rect.right > w + 0.5))
              coupes.push(node.textContent.trim().slice(0, 120));
          }
        }
        return {
          viewport: w, dpr: devicePixelRatio, section: { x: r.x, largeur: r.width, droite: r.right },
          coupes: [...new Set(coupes)],
        };
      });
      assert.equal(geometrie.viewport, largeur);
      assert.equal(geometrie.dpr, 1, "recette à 100 %, sans confusion zoom/largeur");
      mesures.push({ phase, largeur, cas: nom, ...geometrie });
      await fibre.scrollIntoViewIfNeeded();
      if (nom === "deploye") await page.screenshot({
        path: `${sortie}/captures/${phase}-logement-${largeur}.jpg`, type: "jpeg", quality: 85,
      });
      if (phase === "apres") {
        assert.equal(geometrie.coupes.length, 0, `${largeur}/${nom} : texte coupé`);
        assert.ok(geometrie.section.x >= -0.5 && geometrie.section.droite <= largeur + 0.5,
          `${largeur}/${nom} : section hors viewport`);
      }
    }
    await page.close();
  }
  if (phase === "avant") assert.ok(mesures.some((m) => m.largeur === 360 && m.coupes.length),
    "Le témoin doit reproduire la coupure à 360 px");
} finally {
  await navigateur.close();
  await writeFile(`${sortie}/mesures-${phase}.json`, JSON.stringify(mesures, null, 2) + "\n");
}
console.log(`${mesures.length} scénarios vérifiés (${phase}).`);
