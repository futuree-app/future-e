// FUT-41 V5 · RECETTE NAVIGATEUR (Chrome système, Playwright). Vérifications automatiques : elles ne
// remplacent pas un test d'utilisabilité avec des personnes. Toute requête hors localhost est bloquée.
// Usage : BASE=http://localhost:3041/dev/centre-decision-v5 node recette5.cjs <dossier-captures>
const path = require("path");
const fs = require("fs");
const { chromium } = require("/Users/quentinbrache/Desktop/Futur·e/node_modules/playwright-core");

const BASE = process.env.BASE ?? "http://localhost:3041/dev/centre-decision-v5";
const SORTIE = process.argv[2] ?? path.join(__dirname, "..", "captures-v5");
fs.mkdirSync(SORTIE, { recursive: true });
const res = { vues: [], taches: [], clavier: [], mouvement: null };
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
  ["10-accueil-vide", "?s=vide"],
  ["11-projet-et-si", "?s=dix#/projet"],
  ["12-releve", "?s=ref#/releve/fosse"],
  ["13-commune-projet-ancien", "?s=ancien#/commune/c:35238"],
];
const bloquer = (ctx) => ctx.route((u) => !/^https?:\/\/localhost(:\d+)?\//.test(u.href), (r) => r.abort());
const norm = (t) => t.replace(/[  ]/g, " ");

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
      const r = p.getByRole("button", { name: /^refuser$/i }); if (await r.count()) await r.first().click().catch(() => {});
      await p.waitForTimeout(250);
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
    await p.waitForTimeout(150);
  };
  const txt = async () => norm(await p.locator("main").innerText());
  const cap = (n) => p.screenshot({ path: path.join(SORTIE, `${n}-1440-sombre.png`), fullPage: true });
  let t;

  // Premier écran : où en suis-je, que faire, mes possibilités
  await ouvrir("?s=ref");
  const ou = await p.locator("[aria-label='Où vous en êtes'], .x").count();
  t = await txt();
  const phrases = await p.locator("[class*=ouPlaque] dl > div").count();
  ok("Accueil", "trois lignes titrées au plus pour dire où en est la recherche", phrases >= 2 && phrases <= 3, `(${phrases})`);
  ok("Accueil", "la synthèse dit qui se distingue, à quelle échelle, et ce qui reste à savoir", /À la commune : des nuits fraîches l'été \(Nantes moins bien, Rennes correspond\)/.test(t) && /T3 quai de la Fosse \(9 min\) la tient ; pour T4 rue de la Convention et T3 près du Thabor, elle reste à mesurer/.test(t));
  ok("Accueil", "la conclusion ancienne de Rennes est datée, pas présentée comme actuelle", /Conclusion du 18 sept\., écrite sous votre Projet d'alors/.test(t) && /Elle est à revoir pour une gare à moins de 20 min/.test(t));
  ok("Accueil", "trois gestes au plus, chacun avec son bouton", (await p.locator("#faire-t + p, ol li").count()) <= 4 && (await p.locator("ol li button").count()) <= 3);
  ok("Accueil", "communes et logements nommés sur l'accueil", /Nantes/.test(t) && /T3 quai de la Fosse/.test(t) && /T3 près du Thabor/.test(t));
  const hautLieux = await p.evaluate(() => document.getElementById("lieux")?.getBoundingClientRect().top ?? 9999);
  ok("Accueil", "la section des lieux commence dans les 1 100 premiers pixels (1440 px)", hautLieux < 1100, `(${Math.round(hautLieux)} px)`);
  ok("Accueil", "aucun vocabulaire du moteur à la première lecture", !/départage|millésime|grain|établi|cadre de comparaison|engine/i.test(t));
  void ou;

  // A · Recherche vide : deux entrées de même poids ; une adresse emmène sa commune
  await ouvrir("?s=vide");
  t = await txt();
  ok("A", "deux entrées : une commune, ou une adresse ou une annonce", /Je pense à une commune/.test(t) && /J'ai une adresse ou une annonce/.test(t));
  await p.getByRole("button", { name: /J'ai une adresse ou une annonce/ }).click();
  await p.getByLabel("Adresse exacte, si vous la connaissez").fill("12 rue des Lilas, Rennes");
  ok("A", "la commune est reconnue dans l'adresse", /Commune reconnue : Rennes/.test(await txt()));
  await p.getByRole("button", { name: "Garder ce logement" }).click();
  await p.waitForTimeout(250);
  t = await txt();
  ok("A", "la fiche s'ouvre, sa commune est gardée, l'analyse est proposée sans être lancée", /#\/logement\/ajout-/.test(p.url()) && /Rennes/.test(t) && /Analyser l'adresse/.test(t) && /adresse pas encore analysée/.test(t));
  await cap("20-tache-A-adresse");

  // B · Nantes contre Rennes, sans adresse
  await ouvrir("?s=communes#/comparer/communes/c:44109,c:35238");
  t = await txt();
  ok("B", "En bref : ce qui distingue les communes, avec qui et quelle issue", /À la commune : des nuits fraîches l'été \(Nantes moins bien, Rennes correspond\)/.test(t));
  ok("B", "En bref : la gare se mesure depuis une adresse ; Rennes est à revoir", /se mesure depuis une adresse/.test(t) && /sa conclusion est à revoir/.test(t));
  ok("B", "la gare ne se compare pas encore, et le remède est dit", /Votre condition n'était pas la même lors des deux analyses/.test(t) && /Mettre à jour l'analyse la plus ancienne/.test(t));
  ok("B", "la carte situe les communes sans rien départager", /100 km/.test(t) && /Le trajet réel se mesure depuis une adresse/.test(t));
  ok("B", "la commune ne promet rien pour un logement", /pour un logement, la commune n'en donne qu'un repère/.test(t));

  // C · Deux appartements à Nantes, un à Rennes
  await ouvrir("?s=ref#/comparer/logements/fosse,convention,thabor");
  t = await txt();
  const partage = await p.locator("[data-partage]").count();
  ok("C", "une seule case communale pour les deux logements de Nantes", partage >= 3 && /une seule lecture pour T3 quai de la Fosse et T4 rue de la Convention/.test(t));
  ok("C", "S7 : rien aux abords sans analyse d'adresse", /à lire depuis l'adresse/.test(t) && /adresse inconnue/.test(t));
  ok("C", "à la commune, le verdict nomme les communes", /Nantes : moins bien ; Rennes : correspond/.test(t));
  ok("C", "les valeurs sont côte à côte dans « ce que chacun apporte »", (await p.locator("[class*=bilanRang]").count()) >= 4);
  ok("C", "aucun classement", !/meilleur|gagnant|recommand/i.test(t));
  ok("C", "jamais « aucun ne bloque » quand la gare n'est mesurée que pour un logement", !/Aucun ne bloque/.test(t));
  ok("C", "une rubrique vide dit « aucun, parmi ce qui est lu » et combien de conditions sont lues", /aucun, parmi ce qui est lu/.test(t) && /lu : 1 condition sur 5/.test(t) && !/\brien\b(?! de)/.test((await p.locator("[class*=bilans]").innerText())));
  ok("C", "aucun médecin « disponible » sur la seule présence", !/un médecin, à la commune\s*$/m.test(t));

  // D · Un logement pas encore analysé : le panneau explique avant de lancer
  await ouvrir("?s=non-analyse");
  const bouton = p.getByRole("button", { name: "Analyser l'adresse · 39 €" }).first();
  await bouton.click();
  await p.waitForTimeout(200);
  let d = norm(await p.getByRole("dialog").innerText());
  ok("D", "le panneau dit ce que l'analyse apprendra et ce qu'elle ne dira pas", /Ce que vous saurez/.test(d) && /le trajet jusqu'à la gare depuis l'adresse/.test(d) && /Ce qu'elle ne dira pas/.test(d) && /si un médecin accepte de nouveaux patients/.test(d));
  ok("D", "le prix est dit, rien n'est lancé sans geste", /39 € à l'unité/.test(d) && /Lancer l'analyse \(simulée\)/.test(d));
  await p.screenshot({ path: path.join(SORTIE, "21-tache-D-panneau-1440-sombre.png") });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(150);
  ok("D", "Échap ferme et rend le focus au bouton", (await p.getByRole("dialog").count()) === 0 && /Analyser l'adresse/.test(await p.evaluate(() => document.activeElement?.textContent ?? "")));
  await bouton.click();
  await p.getByRole("button", { name: "Lancer l'analyse (simulée)" }).click();
  await p.waitForTimeout(250);
  ok("D", "après l'analyse simulée, le dossier daté apparaît", /Dossier d'adresse du 8 nov\./.test(await txt()));

  // E · Un dossier fait sous l'ancien Projet
  await ouvrir("?s=ancien");
  t = await txt();
  ok("E", "la conclusion est conservée sans être reconduite", /Conclusion conservée telle qu'elle a été écrite/.test(t) && /n'est pas reconduite pour votre Projet actuel/.test(t));
  ok("E", "« pourrait ne plus tenir », jamais « ne tient pas »", /il pourrait ne plus tenir votre limite de 20 min/.test(t) && !/T3 Saint-Félix ne tient pas/.test(t));
  ok("E", "la mesure garde la limite d'alors, datée", /mesuré le 2 sept\. quand elle était de 30 min/.test(t));
  ok("E", "l'issue ancienne est « à revoir », jamais « correspond » actuel", /À revoir/.test(t) && /concluait « correspond » sous votre Projet d'alors/.test(t));
  await ouvrir("?s=ancien#/commune/c:35238");
  await p.getByRole("button", { name: /Mettre à jour/ }).first().click();
  await p.waitForTimeout(200);
  d = norm(await p.getByRole("dialog").innerText());
  ok("E", "une mise à jour ne lit pas plus loin que l'analyse d'origine", /ne lit pas plus loin que l'analyse d'origine/.test(d) && /Gratuit/.test(d));
  await p.keyboard.press("Escape");

  // G · Après une visite : S8
  await ouvrir("?s=visite#/logement/fosse/verifier");
  await p.getByRole("button", { name: "Sur cour, d'après ma visite" }).click();
  await p.waitForTimeout(200);
  t = await txt();
  ok("G", "S8 : « sur cour » rend l'aération envisageable, sans conclure au calme de nuit", /aérer la nuit devient envisageable/.test(t) && /Le bruit de la cour la nuit et la chaleur de la chambre en été restent à vérifier/.test(t) && !/ne touche pas la chambre/.test(t));
  ok("G", "la réponse garde sa date et ne change pas la donnée publique", /Votre observation du 8 nov\. · elle ne modifie aucune donnée publique/.test(t));
  await p.getByLabel("Ajouter une note").fill("L'agence dit que la cour est fermée la nuit.");
  await p.getByRole("button", { name: "dit par le vendeur ou l'agence" }).click();
  await p.getByRole("button", { name: "Enregistrer la note" }).click();
  await p.waitForTimeout(200);
  ok("G", "la note est rangée avec son origine", /Dit par le vendeur ou l'agence · 8 nov\./.test(await txt()));
  await cap("22-tache-G-visite");

  // H · Dix logements dont trois écartés
  await ouvrir("?s=dix");
  t = await txt();
  ok("H", "les écartés restent consultables avec leur raison", /3 écartés, et pourquoi/.test(t));
  await p.getByRole("button", { name: "Loyer ou prix déclaré" }).click();
  await p.waitForTimeout(150);
  ok("H", "ranger sur une dimension nommée dit d'où vient la valeur", /À vendre/.test(await txt()) && /n'entre dans aucune conclusion/.test(await txt()));
  await p.getByRole("button", { name: "Comparer les logements" }).click();
  await p.waitForTimeout(200);
  ok("H", "au-delà de quatre, on choisit avant de comparer", /Choisissez au moins deux logements/.test(await txt()));
  for (const n of ["T3 Saint-Félix", "T3 quai de la Fosse", "T4 rue de la Convention", "Maison à Doulon"]) await p.getByRole("button", { name: n, exact: true }).click();
  ok("H", "quatre au plus côte à côte", await p.getByRole("button", { name: "T3 près du Thabor", exact: true }).isDisabled());
  await cap("23-tache-H-quatre");

  // Et si… ? puis adopter
  await ouvrir("?s=dix#/projet/et-si");
  await p.getByRole("button", { name: "30 min", exact: true }).click();
  await p.waitForTimeout(150);
  t = await txt();
  ok("Et si", "les seaux : écarté à revoir, pourrait changer, nouvelle analyse, pas lus", /Écartés à revoir/.test(t) && /T2 place Viarme/.test(t) && /Pourraient changer/.test(t) && /T3 Saint-Félix/.test(t) && /Rien à recalculer/.test(t));
  ok("Et si", "ce qui ne peut pas être déduit est dit", /Une analyse ne se recalcule pas toute seule/.test(t));
  ok("Et si", "plus de « restent valables »", !/Restent valables/.test(t));
  await p.getByRole("button", { name: "Adopter ce changement" }).click();
  await p.getByRole("button", { name: "Confirmer" }).click();
  await p.waitForTimeout(200);
  ok("Et si", "adopté : révision 4, inscrite dans « Ce qui a changé »", /Révision 4 · La gare : 20 → 30 min\./.test(await txt()));
  await cap("24-et-si-adopte");

  // Z12 · une condition sans compromis non tenue n'est dite qu'une fois ; sa mesure reste
  await ouvrir("?s=meme#/logement/viarme");
  await p.getByRole("button", { name: "Remettre en course" }).click();
  await p.waitForTimeout(150);
  await p.evaluate(() => { location.hash = "#/comparer/logements/fosse,viarme"; });
  await p.waitForTimeout(300);
  t = await txt();
  const nz = (t.match(/ne la tient pas|ne tient pas votre condition sans compromis/g) ?? []).length;
  ok("Z12", "dite une fois sur l'écran de comparaison", nz === 1 && /T2 place Viarme \(24 min\) ne la tient pas/.test(t), `(${nz})`);
  ok("Z12", "la mesure de 24 min reste dans le détail", /24 min/.test(t));
  await cap("25-z12-une-seule-fois");

  // Et si près de la comparaison (essai limité)
  await ouvrir("?s=meme");
  await p.getByText("Et si votre limite pour la gare changeait ?").click();
  await p.waitForTimeout(150);
  t = await txt();
  ok("Et si", "près de la comparaison : les seules possibilités affichées, sans rien modifier", /Essai · votre Projet n'est pas modifié/.test(t) && /T3 Saint-Félix · Mesuré à 23 min : tiendrait à 30 min/.test(t) && /révision 3/.test(t));

  // Retour : fiche → Relevé → bouton retour
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
  for (let i = 0; i < 28; i++) {
    await p.keyboard.press("Tab");
    const f = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body || e.tagName === "NEXTJS-PORTAL") return null; const cs = getComputedStyle(e); return { tag: e.tagName, texte: (e.textContent || "").trim().slice(0, 40), contour: cs.outlineStyle !== "none" && cs.outlineWidth !== "0px" }; });
    res.clavier.push(f);
    if (f && !f.contour) echecs.push(`focus sans contour : ${f.tag} « ${f.texte} »`);
  }
  await ctx.close();

  // Mobile : le face-à-face de deux parmi trois
  const ctxM = await nav.newContext({ viewport: { width: 390, height: 780 } });
  await bloquer(ctxM);
  const pm = await ctxM.newPage();
  await pm.goto(BASE + "?s=meme", { waitUntil: "networkidle" }); await pm.reload({ waitUntil: "networkidle" });
  const duel = pm.getByRole("group", { name: "Les deux que vous voyez côte à côte" });
  await duel.waitFor({ timeout: 8000 }).catch(() => {});
  ok("Mobile", "deux colonnes à la fois, et l'on change l'une ou l'autre", (await duel.count()) === 1 && (await duel.locator("select").count()) === 2);
  const avant = norm(await pm.locator("[class*=bilanRang][data-tete]").innerText());
  await duel.locator("select").nth(1).selectOption({ index: 2 });
  await pm.waitForTimeout(150);
  const apres = norm(await pm.locator("[class*=bilanRang][data-tete]").innerText());
  ok("Mobile", "changer la colonne de droite change la confrontation", avant !== apres && /T4 rue de la Convention/.test(apres));
  await pm.screenshot({ path: path.join(SORTIE, "26-mobile-duel-390-clair.png"), fullPage: false });
  await ctxM.close();

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
  fs.writeFileSync(path.join(SORTIE, "..", "recette-v5.json"), JSON.stringify(res, null, 2));
  console.log(`vues ${res.vues.length}, tâches ${res.taches.filter((x) => x.ok).length}/${res.taches.length}, clavier ${res.clavier.filter(Boolean).length}, mouvement ${JSON.stringify(res.mouvement)}`);
  console.log(echecs.length ? `ÉCHECS (${echecs.length}) :\n- ${echecs.join("\n- ")}` : "AUCUN ÉCHEC");
})().catch((e) => { console.error(e); process.exit(1); });
