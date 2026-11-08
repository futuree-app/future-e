// FUT-41 V4.1 · RECETTE NAVIGATEUR (Chrome système, Playwright). Vérifications automatiques : elles ne
// remplacent pas un test d'utilisabilité avec des personnes.
// Usage : BASE=http://localhost:3041/dev/centre-decision-v41 node recette41.cjs <dossier-captures>
const path = require("path");
const fs = require("fs");
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");

const BASE = process.env.BASE ?? "http://localhost:3041/dev/centre-decision-v41";
const SORTIE = process.argv[2] ?? path.join(__dirname, "..", "captures-v41");
fs.mkdirSync(SORTIE, { recursive: true });
const res = { vues: [], taches: [], clavier: [], mouvement: null };
const echecs = [];
const ok = (tache, nom, cond, detail = "") => { res.taches.push({ tache, nom, ok: !!cond, detail }); if (!cond) echecs.push(`${tache} · ${nom} ${detail}`); };

const VUES = [
  ["01-accueil-reference", "?s=ref"],
  ["02-accueil-complet", "?s=complet"],
  ["03-accueil-vide", "?s=vide"],
  ["04-comparer-communes", "?s=b"],
  ["05-comparer-trois-annonces", "?s=c"],
  ["06-logement-non-analyse", "?s=d"],
  ["07-comparer-dates-differentes", "?s=e"],
  ["08-commune-projet-change", "?s=f"],
  ["09-logement-apres-visite", "?s=g"],
  ["10-logement-ecarte", "?s=h"],
  ["11-comparer-detail-abords", "?s=c#/comparer/fosse,convention,thabor/abords"],
  ["12-releve", "?s=ref#/releve/fosse"],
];
const bloquer = (ctx) => ctx.route((u) => !/^https?:\/\/localhost(:\d+)?\//.test(u.href), (r) => r.abort());

(async () => {
  const nav = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

  for (const theme of ["dark", "light"]) for (const largeur of [1440, 390, 360]) {
    const ctx = await nav.newContext({ viewport: { width: largeur, height: largeur > 900 ? 900 : 780 } });
    await bloquer(ctx);
    const p = await ctx.newPage();
    const err = [];
    p.on("pageerror", (e) => err.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/net::|ERR_FAILED/.test(m.text())) err.push(m.text().slice(0, 200)); });
    for (const [nom, q] of VUES) {
      await p.goto(BASE + q, { waitUntil: "networkidle" });
      await p.reload({ waitUntil: "networkidle" });
      await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await p.waitForTimeout(250);
      const r = p.getByRole("button", { name: /^refuser$/i }); if (await r.count()) await r.first().click().catch(() => {});
      await p.waitForTimeout(150);
      const debord = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const f = `${nom}-${largeur}-${theme === "dark" ? "sombre" : "clair"}.png`;
      await p.screenshot({ path: path.join(SORTIE, f), fullPage: true });
      res.vues.push({ f, debord, erreurs: [...err] });
      if (debord > 0) echecs.push(`débordement ${debord}px ${f}`);
      if (err.length) echecs.push(`erreur ${f}: ${err[0]}`);
      err.length = 0;
    }
    await ctx.close();
  }

  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await bloquer(ctx);
  const p = await ctx.newPage();
  const ouvrir = async (q) => {
    await p.goto(BASE + q, { waitUntil: "networkidle" }); await p.reload({ waitUntil: "networkidle" });
    const r = p.getByRole("button", { name: /^refuser$/i }); if (await r.count()) await r.first().click().catch(() => {});
  };
  const txt = async () => (await p.locator("main").innerText()).replace(/ /g, " ");
  const cap = (n) => p.screenshot({ path: path.join(SORTIE, `${n}-1440-sombre.png`), fullPage: true });

  // A · Je découvre Ma décision
  await ouvrir("?s=vide");
  ok("A", "l'espace dit à quoi il sert", /Gardez ici les communes et les logements que vous envisagez/.test(await txt()));
  await p.getByRole("button", { name: "une commune" }).click();
  await p.getByRole("button", { name: "Ajouter cette commune" }).click();
  await p.waitForTimeout(200);
  ok("A", "une commune ajoutée arrive en lecture gratuite", /Vivre à Nantes/.test(await txt()) && /Lecture gratuite/.test(await txt()));
  await p.getByRole("button", { name: "Ajouter une commune ou un logement" }).click();
  await p.getByRole("button", { name: "Essayer avec un exemple" }).click();
  await p.getByRole("button", { name: "Lire ce texte" }).click();
  ok("A", "l'extrait qui fonde chaque valeur est cité", /lu dans « 305 000 € »/.test(await txt()));
  await p.getByLabel("Nom pour vous en souvenir").fill("T3 avec balcon");
  await p.getByRole("button", { name: "Garder ce logement" }).click();
  await p.waitForTimeout(250);
  ok("A", "la fiche du logement s'ouvre, et dit ce qui manque", /#\/logement\/ajout-/.test(p.url()) && /Renseigner l'adresse/.test(await txt()));
  await cap("20-tache-A-ajout");

  // B · Nantes ou Rennes, sans logement
  await ouvrir("?s=b");
  let t = await txt();
  ok("B", "la comparaison de communes se lit sur la commune", /Des nuits fraîches l'été, à l'échelle de la commune : Nantes \(moins bien\) ; Rennes \(correspond\)/.test(t));
  ok("B", "ce qui ne se compare pas encore est dit en clair", /ne reposent pas sur les mêmes années de données/.test(t));

  // C · Trois annonces : laquelle visiter ?
  await ouvrir("?s=c");
  t = await txt();
  ok("C", "la synthèse dit ce qui manque pour chaque annonce", /T4 rue de la Convention attend l'analyse de son adresse\. T3 près du Thabor attend son adresse exacte\./.test(t));
  ok("C", "une colonne par commune dans le détail", (await p.locator("[role=columnheader]").allInnerTexts()).filter((x) => /Nantes|Rennes/.test(x)).length === 2);
  ok("C", "la lecture communale est dite valable pour les logements qui la partagent", /vaut pour T3 quai de la Fosse, T4 rue de la Convention/.test(t));
  await p.getByRole("button", { name: "Analyser l'adresse · 39 €" }).first().click();
  await p.waitForTimeout(250);
  ok("C", "après l'analyse simulée, le logement ouvre son dossier", (await p.getByRole("button", { name: "Ouvrir le dossier" }).count()) >= 2);
  await cap("21-tache-C-apres-analyse");

  // D · Un logement pas encore analysé
  await ouvrir("?s=d");
  t = await txt();
  ok("D", "ce que futur•e sait déjà : la commune par son rapport", /Lue par le rapport de Nantes/.test(t));
  ok("D", "l'appel dit ce qu'il apprendra et ce qu'il ne dira pas", /Lirait le trajet jusqu'à la gare depuis l'adresse/.test(t) && /Ne dira pas si un médecin accepte de nouveaux patients/.test(t));
  ok("D", "ce qui vient de la commune est dit comme tel", /Vaut pour vos 2 logements de Nantes, pas pour ce logement en particulier/.test(t));

  // E · Deux analyses de dates différentes
  await ouvrir("?s=e");
  t = await txt();
  ok("E", "le refus de comparer est expliqué sans jargon", /Les règles de lecture de futur•e ont changé entre ces deux analyses|ne reposent pas sur les mêmes années de données/.test(t));
  ok("E", "le geste qui rend comparable est proposé", /Mettre à jour avec votre Projet/.test(t));

  // F · Mon Projet a changé depuis
  await ouvrir("?s=f");
  ok("F", "le rapport dit sous quel Projet il a été fait", /Fait sous votre Projet du 12 sept\. : une gare à moins de 30 min \(aujourd'hui : une gare à moins de 20 min\)/.test(await txt()));
  await p.getByRole("button", { name: "Mettre à jour (gratuit)" }).click();
  await p.waitForTimeout(200);
  ok("F", "après mise à jour, il répond au Projet actuel", /Répond à votre Projet actuel/.test(await txt()));

  // G · Après une visite
  await ouvrir("?s=g");
  await p.getByRole("button", { name: "Oui, la chambre donne sur cour" }).click();
  await p.waitForTimeout(200);
  t = await txt();
  ok("G", "la réponse dit ce qu'elle change et ce qui reste inconnu", /Ce que cela change/.test(t) && /Ce qui reste inconnu/.test(t));
  await p.getByLabel("Ajouter une note").fill("Double vitrage côté quai, chambre très calme à 19 h.");
  await p.getByLabel("À propos de (facultatif)").selectOption("calme");
  await p.getByRole("button", { name: "Enregistrer la note" }).click();
  await p.waitForTimeout(200);
  ok("G", "la note se range à côté de la condition, avec sa provenance", /Vu par vous, 8 nov\. : Double vitrage côté quai/.test(await txt()));
  await cap("22-tache-G-visite");

  // H · Écarter puis retrouver pourquoi ; et si j'acceptais 30 min ?
  await ouvrir("?s=h");
  ok("H", "la raison et la condition d'alors sont visibles", /Écarté le 13 oct\./.test(await txt()) && /Votre condition était une gare à moins de 20 min/.test(await txt()));
  await p.getByLabel("Navigation principale").getByRole("button", { name: "Ma décision" }).click();
  const etSi = p.getByRole("button", { name: "Et si… ?" });
  await etSi.click();
  await p.getByRole("button", { name: "30 min", exact: true }).click();
  await p.waitForTimeout(200);
  const d = (await p.getByRole("dialog").innerText()).replace(/ /g, " ");
  ok("H", "les seaux : écarté à revoir, valables, nouvelle analyse, pas lus", /Écartés à revoir/.test(d) && /T2 place Viarme/.test(d) && /Restent valables/.test(d) && /Demanderaient une nouvelle analyse/.test(d) && /Rien à recalculer/.test(d));
  ok("H", "ce qui ne peut pas être déduit est dit", /Une analyse ne se recalcule pas toute seule/.test(d));
  await p.screenshot({ path: path.join(SORTIE, "23-tache-H-et-si-1440-sombre.png") });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(150);
  ok("H", "Échap ferme et rend le focus", (await p.getByRole("dialog").count()) === 0 && /Et si/.test(await p.evaluate(() => document.activeElement?.textContent ?? "")));
  await etSi.click();
  await p.getByRole("button", { name: "30 min", exact: true }).click();
  await p.getByRole("button", { name: "Adopter 30 min dans mon Projet" }).click();
  await p.getByRole("button", { name: "Confirmer" }).click();
  await p.waitForTimeout(200);
  ok("H", "adopté : révision 4", /révision 4/.test(await p.locator("aside").innerText()));
  await p.goto(BASE + "?s=h#/logement/viarme"); await p.waitForTimeout(300);

  // Z12 · une condition sans compromis non tenue n'est dite qu'une fois
  await ouvrir("?s=h#/logement/viarme");
  await p.getByRole("button", { name: "Remettre en course" }).click();
  await p.getByLabel("Navigation principale").getByRole("button", { name: "Ma décision" }).click();
  await p.getByRole("button", { name: "Comparer mes pistes" }).click();
  await p.waitForTimeout(250);
  t = await txt();
  ok("Z12", "dite une fois sur l'écran de comparaison", (t.match(/T2 place Viarme ne tient pas votre condition sans compromis/g) ?? []).length === 1);
  ok("Z12", "et l'écart entre les autres options reste visible", /Ce qui fait la différence/.test(t));
  await cap("24-z12-une-seule-fois");

  // Retour : fiche → Relevé → bouton retour du navigateur
  await ouvrir("?s=ref#/logement/fosse");
  const c1 = (await p.locator("[data-conclusion]").innerText()).trim();
  await p.getByRole("button", { name: "Ouvrir le Relevé complet" }).click();
  await p.waitForTimeout(200);
  ok("Retour", "même conclusion dans le Relevé", c1 === (await p.locator("[data-conclusion]").innerText()).trim());
  await p.goBack(); await p.waitForTimeout(250);
  ok("Retour", "le bouton retour rouvre la fiche", /#\/logement\/fosse/.test(p.url()));

  // Clavier
  await ouvrir("?s=ref");
  await p.evaluate(() => document.querySelector("nextjs-portal")?.remove());
  for (let i = 0; i < 24; i++) {
    await p.keyboard.press("Tab");
    const f = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body || e.tagName === "NEXTJS-PORTAL") return null; const cs = getComputedStyle(e); return { tag: e.tagName, texte: (e.textContent || "").trim().slice(0, 40), contour: cs.outlineStyle !== "none" && cs.outlineWidth !== "0px" }; });
    res.clavier.push(f);
    if (f && !f.contour) echecs.push(`focus sans contour : ${f.tag} « ${f.texte} »`);
  }
  await ctx.close();

  const ctxR = await nav.newContext({ viewport: { width: 390, height: 780 }, reducedMotion: "reduce" });
  await bloquer(ctxR);
  const pr = await ctxR.newPage();
  await pr.goto(BASE + "?s=ref", { waitUntil: "networkidle" });
  await pr.waitForSelector("[data-titre-vue]");
  res.mouvement = await pr.evaluate(() => { const v = document.querySelector("[data-titre-vue]")?.closest("main > div"); return { animation: v ? getComputedStyle(v).animationName : "?", duree: getComputedStyle(document.documentElement).getPropertyValue("--m-etat").trim() }; });
  if (res.mouvement.animation !== "none") echecs.push(`mouvement réduit : ${res.mouvement.animation}`);
  await ctxR.close();
  await nav.close();

  res.echecs = echecs;
  fs.writeFileSync(path.join(SORTIE, "..", "recette-v41.json"), JSON.stringify(res, null, 2));
  console.log(`vues ${res.vues.length}, tâches ${res.taches.filter((x) => x.ok).length}/${res.taches.length}, clavier ${res.clavier.filter(Boolean).length}, mouvement ${JSON.stringify(res.mouvement)}`);
  console.log(echecs.length ? `ÉCHECS (${echecs.length}) :\n- ${echecs.join("\n- ")}` : "AUCUN ÉCHEC");
})().catch((e) => { console.error(e); process.exit(1); });
