// FUT-41 V5.1 · RECETTE NAVIGATEUR (Chrome système, Playwright). Vérifications automatiques : elles ne
// remplacent JAMAIS un test avec des personnes. Toute requête hors localhost est bloquée.
// Usage : BASE=http://localhost:3041/dev/centre-decision-v51 node recette51.cjs <dossier-captures>
// LE DOSSIER DE CAPTURES DOIT ÊTRE HORS DU DÉPÔT : le serveur de dev surveille le dépôt, et chaque capture
// écrite dedans déclenche un rechargement en pleine page (scripts tronqués, « Invalid or unexpected token »).
// Recopier ensuite captures et recette-v51.json dans le dossier du compte rendu.
// Mêmes noms de vues que la recette V5 : les captures se comparent deux à deux (avant / après).
const path = require("path");
const fs = require("fs");
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");

const BASE = process.env.BASE ?? "http://localhost:3041/dev/centre-decision-v51";
const SORTIE = process.argv[2] ?? path.join(__dirname, "..", "captures-v51");
fs.mkdirSync(SORTIE, { recursive: true });
const res = { vues: [], taches: [], clavier: [], contraste: [], mouvement: null };
const echecs = [];
const ok = (tache, nom, cond, detail = "") => { res.taches.push({ tache, nom, ok: !!cond, detail }); if (!cond) echecs.push(`${tache} · ${nom} ${detail}`); };

const VUES = [
  ["01-accueil-reference", "?s=ref"],
  ["02-accueil-communes-seules", "?s=communes"],
  ["03-comparer-communes", "?s=communes#/comparer/communes/c:44109,c:35238"],
  ["04-comparer-logements-reference", "?s=ref#/comparer/logements/fosse,convention,thabor"],
  ["05-comparer-meme-commune", "?s=meme"],
  ["06-logement-non-analyse", "?s=non-analyse"],
  ["07-logement-ancien-projet", "?s=ancien"],
  ["08-logement-apres-visite", "?s=visite#/logement/fosse"],
  ["09-accueil-dix-logements", "?s=dix"],
  ["14-comparer-arbitrage", "?s=arbitrage"],
  ["10-accueil-vide", "?s=vide"],
  ["11-projet-et-si", "?s=dix#/projet"],
  ["12-releve", "?s=ref#/releve/fosse"],
];
const bloquer = (ctx) => ctx.route((u) => !/^https?:\/\/localhost(:\d+)?\//.test(u.href), (r) => r.abort());
const norm = (t) => t.replace(/[\u00a0\u202f]/g, " ");
// Ce que la V5.1 ne doit jamais écrire : un gagnant, un score, un classement, une recommandation.
const INTERDIT = /\b(meilleur(e|s)?|gagnant|recommand\w*|score|au total|le plus adapté|classé)\b/i;

/** Contraste WCAG du texte visible : couleur du texte contre le premier fond opaque rencontré. */
const MESURER_CONTRASTE = () => {
  const lum = (c) => { const [r, g, b] = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const fond = (e) => { for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] > 0.9)) return c.slice(0, 3); } return [255, 255, 255]; };
  const out = [];
  const marcheur = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
  for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
    const e = n.parentElement; if (!n.textContent.trim() || !e) continue;
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    if (cs.visibility === "hidden" || r.width === 0 || e.closest("[aria-hidden=true], .sr, [class*=sr_]") || e.closest("details:not([open]) > :not(summary)")) continue;
    if (e.closest("button:disabled")) continue; // un bouton inactif n'a pas d'exigence de contraste (WCAG 1.4.3)
    const c = rgb(cs.color); const a = c[3] ?? 1; const f = fond(e);
    const mix = c.slice(0, 3).map((x, i) => x * a + f[i] * (1 - a));
    const L1 = lum(mix), L2 = lum(f); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const grand = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && Number(cs.fontWeight) >= 700);
    out.push({ ratio: Math.round(ratio * 100) / 100, seuil: grand ? 3 : 4.5, taille: parseFloat(cs.fontSize), texte: n.textContent.trim().slice(0, 50) });
  }
  return out;
};

(async () => {
  const nav = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

  for (const theme of ["dark", "light"]) for (const largeur of [1440, 390, 360]) {
    const ctx = await nav.newContext({ viewport: { width: largeur, height: largeur > 900 ? 900 : 780 } });
    await bloquer(ctx);
    const p = await ctx.newPage();
    const err = [];
    if (process.env.TRACE) { const cdp = await ctx.newCDPSession(p); await cdp.send("Runtime.enable"); cdp.on("Runtime.exceptionThrown", (e) => { const d = e.exceptionDetails; console.log("CDP", d.url || "(inline)", d.lineNumber, d.columnNumber, d.scriptId, (d.exception?.description || d.text || "").slice(0, 120)); }); }
    p.on("pageerror", (e) => err.push(e.message + (process.env.TRACE ? " @ " + (e.stack || "").split("\n").slice(1, 3).join(" | ") : "")));
    p.on("console", (m) => { if (m.type() === "error" && !/net::|ERR_FAILED/.test(m.text())) err.push(m.text().slice(0, 200) + (process.env.TRACE ? " @ " + JSON.stringify(m.location()) : "")); });
    for (const [nom, q] of VUES) {
      await p.goto(BASE + q, { waitUntil: "networkidle" });
      await p.reload({ waitUntil: "networkidle" });
      await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await p.addStyleTag({ content: "nextjs-portal { display: none !important; }" }); // masquée, jamais supprimée : la retirer casse le client de dev
      const r = p.getByRole("button", { name: /^refuser$/i }); if (await r.count()) await r.first().click().catch(() => {});
      await p.waitForTimeout(250);
      const debord = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const f = `${nom}-${largeur}-${theme === "dark" ? "sombre" : "clair"}.png`;
      await p.screenshot({ path: path.join(SORTIE, f), fullPage: true });
      const hauteur = await p.evaluate(() => document.documentElement.scrollHeight);
      const texte = norm(await p.locator("main").innerText());
      res.vues.push({ f, debord, hauteur, erreurs: [...err] });
      if (debord > 0) echecs.push(`débordement ${debord}px ${f}`);
      if (err.length) echecs.push(`erreur ${f}: ${err[0]}`);
      if (INTERDIT.test(texte.replace(/Aucun classement|aucun score/gi, ""))) echecs.push(`mot interdit dans ${f} : « ${texte.replace(/Aucun classement|aucun score/gi, "").match(INTERDIT)[0]} »`);
      if (largeur !== 360) {
        const mesures = await p.evaluate(MESURER_CONTRASTE);
        const faibles = mesures.filter((m) => m.ratio < m.seuil);
        res.contraste.push({ f, textes: mesures.length, min: Math.min(...mesures.map((m) => m.ratio)), faibles: faibles.slice(0, 5) });
        if (faibles.length) echecs.push(`contraste < seuil dans ${f} : ${faibles.length} (ex. ${faibles[0].ratio} « ${faibles[0].texte} »)`);
      }
      err.length = 0;
    }
    await ctx.close();
  }

  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await bloquer(ctx);
  const p = await ctx.newPage();
  const ouvrir = async (q) => {
    await p.goto(BASE + q, { waitUntil: "networkidle" }); await p.reload({ waitUntil: "networkidle" });
    await p.waitForSelector("[data-titre-vue]");
    const r = p.getByRole("button", { name: /^refuser$/i }); if (await r.count()) await r.first().click().catch(() => {});
    await p.waitForTimeout(300);
  };
  const txt = async () => norm(await p.locator("main").innerText());
  const retenir = async () => norm(await p.locator("section[aria-labelledby] ul[class*=retenirListe]").first().innerText());
  const cap = (n) => p.screenshot({ path: path.join(SORTIE, `${n}-1440-sombre.png`), fullPage: true });
  let t;

  // 1 · Ma décision : où j'en suis, le geste utile, mes lieux et leurs deux dimensions
  await ouvrir("?s=ref");
  t = await txt();
  const hautLieux = await p.evaluate(() => document.getElementById("lieux")?.getBoundingClientRect().top ?? 9999);
  ok("Accueil", "vos lieux arrivent dans le premier écran (1440 × 900)", hautLieux < 900, `(${Math.round(hautLieux)} px)`);
  ok("Accueil", "chaque logement montre son suivi ET ce que futur•e en sait, chacun avec son mot", (await p.locator("#lieux [class*=suivi]").count()) === 3 && (await p.locator("#lieux [class*=savoir]").count()) === 3 && /Visite le 14 nov\./.test(t) && /Adresse analysée/.test(t) && /Adresse connue, pas encore analysée/.test(t) && /Adresse inconnue/.test(t));
  ok("Accueil", "« Repéré » remplace « À étudier »", /Repéré/.test(t) && !/À étudier/.test(t));
  ok("Accueil", "l'entrée principale est « Ajouter une annonce »", (await p.getByRole("button", { name: "+ Ajouter une annonce" }).count()) === 1);
  ok("Accueil", "un seul geste prioritaire", (await p.locator("[class*=premierGeste] button").count()) === 1);

  // 2 · Comparer : arbitrage établi
  await ouvrir("?s=arbitrage");
  t = await txt(); let r = await retenir();
  ok("Comparer", "À retenir : condition sans compromis, différences avec poids déclarés, ce qui peut changer", /T3 quai de la Fosse \(9 min\) et T4 rue de la Convention \(14 min\) la tiennent/.test(r) && /répond mieux pour le calme, qui compte pour vous/.test(r) && /qui comptent beaucoup pour vous/.test(r) && /avant de trancher/.test(r), JSON.stringify(r.slice(0, 260)) + " | " + p.url());
  ok("Comparer", "les écarts établis sont deux, avec leurs valeurs côte à côte", (await p.locator("#distingue section").count()) === 2 && /Quai très circulé : 65 à 70 dB le jour/.test(t) && /Rue résidentielle : sous 55 dB le jour/.test(t));
  ok("Comparer", "prix et surface déclarés en tête de colonne", /289 000 € · 68 m²/.test(t) && /315 000 € · 82 m²/.test(t));
  ok("Comparer", "le geste est posé au niveau de l'incertitude", (await p.getByRole("button", { name: "Voir les 2 questions à poser" }).count()) === 1);
  ok("Comparer", "un seul geste principal, avec un verbe", (await p.locator("[class*=_aRetenir__] [class*=boutonMarque]").count()) === 1 && /Voir les questions/.test(await p.locator("[class*=_aRetenir__] [class*=boutonMarque]").innerText()));
  ok("Comparer", "le vocabulaire du moteur n'est pas en première lecture", !/Pas assez étudié|Même donnée|méthode égale|Les distingue\b/.test(r));
  ok("Comparer", "le détail et les sources restent accessibles", (await p.locator("details", { hasText: "Tout le détail" }).count()) === 1);
  await p.getByText("Tout le détail, condition par condition, avec les sources").click(); await p.waitForTimeout(150);
  ok("Comparer", "le détail complet contient les cinq conditions et leurs sources", (await p.locator("[class*=toutDetail] section[aria-labelledby^=cf-]").count()) === 5 && (await p.locator("[class*=toutDetail] summary", { hasText: "Preuves et sources" }).count()) >= 3);

  // 3 · Comparer : un logement analysé, un non analysé, un sans adresse
  await ouvrir("?s=ref#/comparer/logements/fosse,convention,thabor");
  t = await txt(); r = await retenir();
  ok("Vérité", "aucune différence entre logements n'est inventée", /Entre leurs communes/.test(r) && !/Ce qui les distingue\n/.test(r) && (await p.locator("#distingue").count()) === 0);
  ok("Vérité", "ce qui manque est dit une fois par logement, avec sa raison", /T4 rue de la Convention : pas encore étudié pour .*\(adresse pas encore analysée\)/.test(t) && /T3 près du Thabor : pas encore étudié pour .*\(adresse exacte inconnue\)/.test(t));
  ok("Vérité", "l'inconnu n'est pas compté contre", /Rien de ce qui est inconnu n'est compté contre l'un ou l'autre/.test(t));
  ok("Comparer", "le geste prioritaire débloque la comparaison", /Renseigner l'adresse/.test(await p.locator("[class*=_aRetenir__] [class*=boutonMarque]").innerText()));

  // 4 · Comparer : communes
  await ouvrir("?s=communes#/comparer/communes/c:44109,c:35238");
  t = await txt(); r = await retenir();
  ok("Communes", "la gare n'est pas promise par une commune", /elle se mesure pour chaque logement, depuis son adresse/.test(r));
  ok("Communes", "l'analyse ancienne est datée et dite à revoir, à part", /Une analyse à revoir/.test(r) && /Rennes a été étudiée quand votre condition était « une gare à moins de 30 min »/.test(r));
  ok("Communes", "deux écarts établis, et une condition pas encore comparable avec sa raison", (await p.locator("#distingue section").count()) === 2 && /Une vie de quartier/.test(t) && /mêmes années de données/.test(t));

  // 5 · Fiche : logement pas encore analysé
  await ouvrir("?s=non-analyse");
  t = await txt();
  ok("Fiche", "deux dimensions nommées : votre suivi, ce que futur•e en sait", /Votre suivi/.test(t) && /Ce que futur•e en sait/.test(t) && /Adresse connue, pas encore analysée/.test(t));
  ok("Fiche", "« pas encore étudié à son adresse » est dit une seule fois", (t.match(/pas encore étudié à son adresse/g) || []).length === 1 && !/Dit pour la commune/.test(t));
  ok("Vérité", "chaque lecture communale garde son échelle (S7)", (t.match(/à l'échelle de Nantes, pas encore à l'adresse/g) || []).length === 4);
  await p.locator("[class*=_aRetenir__] [class*=boutonMarque]").click(); await p.waitForTimeout(250);
  const panneau = norm(await p.locator("[role=dialog]").innerText().catch(() => ""));
  ok("Fiche", "le geste payant ouvre le panneau, qui dit ce que l'analyse ne dira pas", /Ce que vous saurez/.test(panneau) && /Ce qu'elle ne dira pas/.test(panneau));
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  ok("Fiche", "Échap ferme le panneau", (await p.locator("[role=dialog]").count()) === 0);

  // 6 · Fiche : analyse sous un ancien Projet
  await ouvrir("?s=ancien");
  t = await txt();
  ok("Vérité", "la conclusion ancienne est conservée telle quelle et dite écrite sous le Projet d'alors", /Écrite sous votre Projet d'alors/.test(t) && /Elle ne vaut pas pour votre Projet actuel/.test(t) && /Analyse à actualiser/.test(t));

  // 7 · Fiche : après une visite, répondre à une question
  await ouvrir("?s=visite#/logement/fosse");
  await p.getByRole("button", { name: "Sur cour, d'après ma visite" }).click(); await p.waitForTimeout(150);
  t = await txt();
  ok("Visite", "une réponse dit ce qu'elle change et ce qui reste inconnu, sans devenir un fait public", /Ce que cela change pour vous/.test(t) && /Ce qui reste inconnu/.test(t) && /ne modifie aucune donnée publique/.test(t));
  await cap("22-visite-reponse");

  // 7 bis · Fiche → analyse complète → échelles → comparer → retour
  await ouvrir("?s=ref#/logement/fosse");
  const c1 = norm((await p.locator("[data-conclusion]").innerText()).trim());
  await p.getByRole("button", { name: "Voir l'analyse complète" }).first().click(); await p.waitForTimeout(250);
  t = await txt();
  ok("Analyse", "le mot « Relevé » ne désigne plus une page", !/Relevé/.test(t) && /Analyse complète/.test(t));
  ok("Analyse", "même conclusion, mot pour mot, que la fiche", c1 === norm((await p.locator("[data-conclusion]").innerText()).trim()));
  await p.getByRole("button", { name: "Autour de l'adresse", exact: true }).click(); await p.waitForTimeout(150);
  t = await txt();
  ok("Analyse", "l'onglet Autour ne montre que ce qui est étudié aux abords", /Quai très circulé|La gare est à 9 min/.test(t) && !/Parmi les 30 % de communes/.test(t));
  await p.getByRole("button", { name: "Comparer avec un autre logement" }).click(); await p.waitForTimeout(200);
  ok("Analyse", "de l'analyse, on arrive dans Comparer avec ce logement choisi", /#\/comparer\/logements\/fosse/.test(p.url()));
  await p.goBack(); await p.waitForTimeout(250);
  ok("Analyse", "le retour du navigateur rouvre l'analyse", /#\/releve\/fosse/.test(p.url()) && /Analyse complète/.test(await txt()));

  // 8 · Ajouter une annonce : les quatre situations
  await ouvrir("?s=vide");
  await p.getByRole("button", { name: /^Ajouter une annonce/ }).click(); await p.waitForTimeout(150);
  await p.getByRole("button", { name: "annonce lisible" }).click(); await p.waitForTimeout(150);
  t = await txt();
  ok("Annonce", "lien reconnu : valeurs proposées, à vérifier, restées déclarées", /Annonce reconnue sur annonces-exemple\.fr/.test(t) && /lu dans l'annonce/.test(t) && (await p.getByLabel(/Surface/).inputValue()) === "66");
  ok("Annonce", "miniature : seulement si le site l'autorise, aucune image récupérée", /aucune image n'est récupérée/.test(t) && (await p.locator("main img").count()) === 0);
  await cap("20-annonce-reconnue");
  await p.getByRole("button", { name: "sans miniature" }).click(); await p.waitForTimeout(150);
  ok("Annonce", "sans miniature : un repère neutre, jamais une image générique", /Pas de miniature pour cette annonce/.test(await txt()) && (await p.locator("main img").count()) === 0);
  await p.getByRole("button", { name: "lien illisible" }).click(); await p.waitForTimeout(150);
  t = await txt();
  ok("Annonce", "lien illisible : gardé, saisie ou texte collé, rien deviné", /Lien gardé/.test(t) && /rien n'est deviné/.test(t) && (await p.getByLabel("Ou collez le texte de l'annonce").count()) === 1);
  await p.getByLabel("Un nom pour le retrouver").fill("T2 près de la gare");
  await p.getByLabel("Commune", { exact: true }).selectOption("44109");
  await p.getByRole("button", { name: "Garder ce logement" }).click(); await p.waitForTimeout(250);
  t = await txt();
  ok("Annonce", "le logement gardé est Repéré, adresse inconnue, et rien n'est analysé", /T2 près de la gare/.test(t) && /Repéré/.test(t) && /Adresse inconnue/.test(t));

  // 9 · Continuité : essayer dans Comparer, adopter dans Mon Projet, revenir
  await ouvrir("?s=arbitrage");
  await p.getByText("Et si vos conditions changeaient ?").click();
  await p.locator("details[open] select").first().selectOption("quartier"); await p.waitForTimeout(150);
  await p.getByRole("button", { name: "Adopter ce changement dans Mon Projet" }).click(); await p.waitForTimeout(250);
  ok("Continuité", "Mon Projet reçoit le changement essayé", /Une vie de quartier devient une condition sans compromis\./.test(await txt()));
  await p.getByRole("button", { name: "Revenir à la comparaison" }).click(); await p.waitForTimeout(250);
  ok("Continuité", "retour : la même comparaison", /#\/comparer\/logements\/fosse,convention/.test(p.url()) && /T3 quai de la Fosse et T4 rue de la Convention/.test(await txt()));

  // 10 · Clavier : chaque arrêt a un contour visible
  for (const q of ["?s=arbitrage", "?s=non-analyse"]) {
    await ouvrir(q);
    await p.evaluate(() => document.querySelector("nextjs-portal")?.remove());
    for (let i = 0; i < 24; i++) {
      await p.keyboard.press("Tab");
      const f = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body || e.tagName === "NEXTJS-PORTAL") return null; const cs = getComputedStyle(e); const cible = e.closest("label") && e.tagName === "INPUT" ? e.closest("label") : e; const cc = getComputedStyle(cible); return { tag: e.tagName, texte: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 40), contour: (cs.outlineStyle !== "none" && cs.outlineWidth !== "0px") || (cc.outlineStyle !== "none" && cc.outlineWidth !== "0px") }; });
      res.clavier.push(f);
      if (f && !f.contour) echecs.push(`focus sans contour : ${f.tag} « ${f.texte} »`);
    }
  }
  await ctx.close();

  // 11 · Téléphone : savoir à tout moment ce que l'on compare
  for (const largeur of [390, 360]) {
    const ctxM = await nav.newContext({ viewport: { width: largeur, height: 780 } });
    await bloquer(ctxM);
    const pm = await ctxM.newPage();
    await pm.goto(BASE + "?s=meme", { waitUntil: "networkidle" }); await pm.reload({ waitUntil: "networkidle" });
    const rf = pm.getByRole("button", { name: /^refuser$/i }); if (await rf.count()) await rf.first().click().catch(() => {});
    const duel = pm.getByRole("group", { name: "Les deux que vous voyez côte à côte" });
    await duel.waitFor({ timeout: 8000 }).catch(() => {});
    ok(`Mobile ${largeur}`, "deux sélecteurs nommés « À gauche » et « À droite »", (await duel.locator("select").count()) === 2 && /À gauche/.test(await duel.innerText()) && /À droite/.test(await duel.innerText()));
    const entier = await duel.locator("select").evaluateAll((ss) => ss.every((s) => s.scrollWidth <= s.clientWidth + 1));
    ok(`Mobile ${largeur}`, "les noms tiennent entiers dans les sélecteurs", entier);
    await pm.evaluate(() => window.scrollTo(0, 1600)); await pm.waitForTimeout(150);
    const colle = await pm.evaluate(() => { const b = document.querySelector("[aria-label='Ce que vous comparez'][role=region]"); const r = b?.getBoundingClientRect(); return !!r && r.top >= 0 && r.top < 140 && r.bottom > 0; });
    ok(`Mobile ${largeur}`, "en descendant, ce que l'on compare reste visible", colle);
    const avant = norm(await pm.locator("[class*=_aRetenir__]").innerText());
    await duel.locator("select").nth(1).selectOption({ index: 2 }); await pm.waitForTimeout(150);
    ok(`Mobile ${largeur}`, "changer le logement de droite change la lecture", avant !== norm(await pm.locator("[class*=_aRetenir__]").innerText()));
    if (largeur === 390) await pm.screenshot({ path: path.join(SORTIE, "26-mobile-duel-390-clair.png"), fullPage: false });
    await ctxM.close();
  }

  // 12 · Mouvement réduit
  const ctxR = await nav.newContext({ viewport: { width: 390, height: 780 }, reducedMotion: "reduce" });
  await bloquer(ctxR);
  const pr = await ctxR.newPage();
  await pr.goto(BASE + "?s=ref", { waitUntil: "networkidle" });
  await pr.waitForSelector("[data-titre-vue]");
  res.mouvement = await pr.evaluate(() => { const v = document.querySelector("[data-titre-vue]")?.closest("main > div"); return { animation: v ? getComputedStyle(v).animationName : "?" }; });
  if (res.mouvement.animation !== "none") echecs.push(`mouvement réduit : ${res.mouvement.animation}`);
  await ctxR.close();
  await nav.close();

  res.echecs = echecs;
  fs.writeFileSync(path.join(SORTIE, "..", "recette-v51.json"), JSON.stringify(res, null, 2));
  const cmin = Math.min(...res.contraste.map((c) => c.min));
  console.log(`vues ${res.vues.length}, tâches ${res.taches.filter((x) => x.ok).length}/${res.taches.length}, clavier ${res.clavier.filter(Boolean).length}, contraste min ${cmin}, mouvement ${JSON.stringify(res.mouvement)}`);
  console.log(echecs.length ? `ÉCHECS (${echecs.length}) :\n- ${echecs.join("\n- ")}` : "AUCUN ÉCHEC");
})();
