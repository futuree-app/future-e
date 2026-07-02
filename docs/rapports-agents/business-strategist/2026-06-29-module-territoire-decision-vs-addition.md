# Module Territoire (rapport 14€) : LE moat ou du revenu exposé ?

> Rapport stratégique Business — 2026-06-29. Lentille : renforce-t-il le moteur+le moat ?
> Read-only. Je ne décide rien. En tension assumée avec le Product Strategist.

## Le goulot aujourd'hui

Le goulot de futur•e n'est pas la copiabilité du rapport. C'est **la disposition à payer B2C, non mesurée** (le pari central du modèle, hiérarchie de preuve, `modele-economique.md`). Deux faits du code le confirment et rendent la question posée *prématurée mais pas inutile* :

1. Le site est en `noindex`/`Disallow: /` (verrou dominant Disco, fiche `project_frontiere_savoir_agir`). Les pages gratuites `savoir/[thème]/[commune]` ne sont **pas exposées au public**.
2. La page gratuite `savoir/[slug]/[insee_code]` **gate déjà DRIAS derrière le login** (`hasFullAccess = user != null`, lignes 260-264). Aujourd'hui, le gratuit ne donne PAS les faits bruts climat.

Conséquence : la cannibalisation gratuit→payant **ne peut pas exister en production aujourd'hui**. On ne peut pas être cannibalisé d'un revenu qu'on n'a pas prouvé. Toute la suite se lit à travers ce goulot.

## Décision évaluée

Auditer le module Territoire du rapport 14€ (jugé abouti par le porteur) pour trancher : **le 14€ est-il LE MOAT (l'inassemblable) ou du revenu EXPOSÉ ?** — dans la perspective d'ouvrir gratuitement la couche de données par thème/commune (acquisition SEO/GEO).

Ce que le module livre réellement (vérifié dans le code, `rapport/quartier/page.tsx` + composants) :
- **TerritoryCover** : identité visuelle déterministe (dérivée du département). Présentation.
- **Passeport territorial** (`TerritoryIdentityCard`) : typologie, rôle, population, densité, position, occupation des sols. **Faits INSEE/OSO assemblés.**
- **Synthèse IA** (`QuartierSynthesis` + `/api/synthesize-quartier`, Sonnet 4.6) : 3 blocs (« Ce qui change / Les transformations à surveiller / Ce que cela raconte du territoire »), commutable par horizon (2030/2050/2100), **personnalisable par les repères de terrain** de l'utilisateur (workbook).
- **Les grands signaux** (`QuartierClimatData`) : ~17 cartes sur 3 thèmes (territoire/climat/risque), chacune face + drawer (trajectoire reconstruite, récit ancré, sources). DRIAS, Géorisques, GASPAR, VigiEau, Hub'Eau, ADEME, INSEE, OSO, Cerema.
- **AskFuture inline** : approfondissement conversationnel.
- **QuartierWorkbook** : l'utilisateur saisit ses observations terrain.

## La vraie question

La question « le rapport est-il copiable ? » est **bien posée pour UNE décision à venir** (lever le noindex + dégater DRIAS sur les pages gratuites), mais **mal priorisée** au regard du goulot. La variable dominante n'est pas la copiabilité — c'est **est-ce que quiconque paie 14€**. Tant que ce n'est pas mesuré, blinder le rapport contre une cannibalisation théorique, c'est **optimiser une variable hors goulot**.

Reformulation que je peux justifier : la vraie question n'est pas « le module est-il LE moat ? » — il ne l'est pas, et n'a pas à l'être. **Le rapport n'est pas le moat : il est une *restitution* du moat.** Le moat, par la doctrine elle-même (`modele-economique.md`), est l'accumulation `sources → croisements → interprétation → UX → marque → confiance → temps`, et la *décision* (l'arbitrage horizontal) est portée par le **Pack 39€** (ADR-0007), pas par le rapport mono-commune. Le rapport 14€ « pose le décor » et **refuse explicitement de conclure** (le prompt interdit de trancher logement/santé/projet/achat, lignes 82-84). C'est un produit d'entrée, pas le produit-moat.

Donc : poser « est-ce LE moat ? » sur le 14€, c'est chercher le moat au mauvais étage.

## Marché et coût

**Qui paie et pourquoi sortirait-il sa carte ?** Le ménage en décision active. Il paie pour **ne pas se tromper d'endroit** — c'est-à-dire pour **une décision**, pas pour des faits. Or le rapport mono-commune, par construction, ne décide pas : il décrit une commune. L'ancre 14€ vs 600-800€ de diagnostics tient seulement si l'acheteur perçoit le rapport comme un *acte de décision*, pas comme une fiche enrichie.

**Qu'achète-t-il vraiment (hypothèse à tester, non assénée)** : probablement une **tranquillité d'esprit** (« quelqu'un a regardé pour moi, sérieusement, et me dit ce que ça veut dire ») plus qu'une donnée. Si c'est vrai, le défendable n'est pas la donnée mais **la curation + l'interprétation crédible + le fait que ce soit personnalisé à sa situation**.

**Le coût n'est pas le levier ici** : marge ~91 %, coût API ~0,015€/appel ×3. Polir ou non le rapport ne déplace pas la marge. Bruit, je passe.

## Effet sur le moteur

Le module améliore le « pourquoi il paie » (comprendre une commune) mais **n'améliore ni le « pourquoi il revient » ni le « quand »** : c'est un one-shot mono-commune. Le seul élément qui déplace le « quand » vers la durée (Le Fil) est ici un bloc liste d'attente, pas un produit. Le rapport ajoute du revenu d'entrée ; il ne compose pas seul.

## Effet sur le moat et les actifs

Séparation concrète **répliquable/exposé vs défendable** :

**EXPOSÉ (copiable, et que la doctrine veut justement libérer) :**
- Les chiffres DRIAS bruts par commune (jours >30°C, nuits tropicales…). Publics.
- Les flags Géorisques (flood, submersion), les comptes GASPAR. Publics.
- Les faits du passeport (population, densité, typologie). INSEE public.
- ATMO, Hub'Eau. Publics.
- → Un utilisateur déterminé + ChatGPT reconstitue **~70 % des blocs « Ce qui change / à surveiller / ce que ça raconte »** à partir des faits libres. La synthèse IA est bonne, mais c'est de l'**interprétation générique de faits publics** : exactement ce qu'un LLM fait bien.

**DÉFENDABLE (l'inassemblable) :**
- **La personnalisation par le workbook** : les repères terrain de l'utilisateur croisés à la projection. *Personne d'autre ne détient cette donnée.* C'est l'élément le plus inassemblable du module — et il est **optionnel et placé tard** (après la synthèse).
- **Le croisement HORIZONTAL** (la commune dans son contexte, puis face à d'autres = le Pack). C'est l'axe orthogonal à la page verticale gratuite (garde-fou de la fiche). Mais le rapport mono-commune ne fait pas encore cet arbitrage : il le **pointe**.
- **La transformation d'un nombre statique en mouvement** (`reconstructReference`, `trajectoryBreakdown`, `buildClimatWhy` ancré sur l'archétype climatique) : plus dur à copier, mais reste de la mise en forme d'une donnée publique.
- **La curation / marque / confiance** : refus de score, sources nommées, voix. C'est le vrai actif (accumulation), mais il vit dans le *système*, pas dans ce module isolé.

Verdict de séparation : **le module est les DEUX**. Sa partie « faits + interprétation générique » est exposée (et la doctrine la libère volontairement). Sa partie inassemblable (workbook + croisement vers la décision) est **présente mais sous-pondérée**.

## Effet sur les boucles

- **Boucle d'apprentissage** : le workbook EST l'embryon de la boucle (capture des repères réels). Mais rien dans le code ne montre que cette donnée **remonte vers la doctrine/le scoring** : elle est stockée et réinjectée dans la synthèse, pas instrumentée comme apprentissage produit. Boucle ouverte.
- **Boucle de prescription** : **absente du module** — aucun dispositif de partage repéré. Or le partage (conjoint, notaire, famille) est un pilier déclaré du « pourquoi il revient ». Manque structurant si le rapport veut nourrir le moat.

## Niveau de preuve

- **Pari déguisé en acquis à signaler** : juger le module « abouti » suppose implicitement que *le 14€ convertit* et que *l'acheteur valorise l'interprétation plus que les faits*. Les deux sont des hypothèses non démontrées (consentement à payer B2C = le pari central).
- La cannibalisation gratuit→payant est traitée par certains comme un risque actif ; c'est **théorique à n=0** (noindex + DRIAS gaté). On parie sur un risque avant d'avoir le trafic qui le révélerait.

## Invariants et principes

- **ADR-0001 (pas de score) — VIOLÉ aujourd'hui sur le gratuit** : la page `savoir/[slug]/[insee_code]` affiche un **score/100** issu de `communes_tension` (lignes 534-540, `score-number`). Anti-marque, anti-GEO. C'est une **dette qui abîme l'actif d'acquisition** : un score arbitraire est précisément ce qu'un LLM ne citera pas et ce qui fait lire futur•e comme « un comparateur de plus » (risque structurant n°1). Priorité business supérieure au durcissement du rapport.
- **Doctrine « données gratuites » — non tenue aujourd'hui** : DRIAS gaté derrière login sur la page censée être l'acquisition. Incohérent avec la matrice 2×2.
- **Invariant n°8 (preuves > intérêts)** : respecté si on n'élève pas la cannibalisation théorique au rang de fait.
- **Principe B2C-d'abord (ADR-0008)** : non menacé par ce module.

## Risques structurants

- **Aggravé** : risque n°1 (catégorie mal comprise) par le score/100 du gratuit, qui crie « comparateur de villes ».
- **Atténué** : risque n°3 (concurrence gratuite SEO) *si et seulement si* la discipline verticale/horizontale tient — la page gratuite dit tout sur SON risque mais ne fait jamais l'arbitrage, et le rapport devient le seul lieu du croisement.
- **Latent** : le vrai vecteur de cannibalisation n'est pas « donner les faits » mais (a) une page gratuite qui ferait accidentellement l'arbitrage horizontal, ou (b) un LLM qui fait l'arbitrage à partir des faits libres. La défense est de rendre le croisement+personnalisation indiscutablement supérieurs, pas de retenir les faits.

## Coût d'opportunité et pourquoi maintenant

Pendant qu'on blinde un rapport déjà jugé abouti contre une cannibalisation qui ne peut pas se produire (noindex), **on ne mesure pas la conversion du paywall** — la seule chose qui lève le goulot. Le coût d'opportunité de polir le rapport est élevé *en attention*, faible *en revenu* : le rapport ne déplacera pas le CA tant qu'on ignore s'il convertit.

Pourquoi maintenant : la seule urgence réelle est la **pile d'action avant ouverture du crawl** (retirer le score + dégater → dédoublonner → sitemap), déjà cadrée par Data/Disco. Le durcissement « moat » du rapport, lui, peut attendre la mesure.

## Le vrai pari

Le pari n'est pas « le rapport est copiable ». Le pari est : **« un ménage en décision paiera 14€ pour une lecture synthétisée de SA commune plutôt que d'assembler les faits gratuits lui-même ou de demander à ChatGPT. »** La défendabilité du module est entièrement *en aval* de ce pari. Nommer ce pari change la lecture : on ne protège pas le rapport, on teste s'il existe un acheteur.

## Vue extérieure

- **Si j'étais l'utilisateur déterminé** : je prends les chiffres DRIAS gratuits, je les colle dans ChatGPT (« qu'est-ce que ça veut dire pour vivre à Bordeaux ? »), j'obtiens une lecture correcte, gratuite. Ce que je NE peux PAS obtenir : mes propres observations terrain croisées, la comparaison de mes 3 communes shortlistées, et la confiance d'une source curatée. Le rapport doit s'appuyer LOURDEMENT là-dessus, pas sur « voici les faits de votre commune + un beau paragraphe ».
- **Si j'étais l'investisseur** : pourquoi polir un 14€ mono-commune quand le **Pack 39€** (le vrai produit de décision, le vrai croisement horizontal, le meilleur ARPU) porte le moat ? Le 14€ est le produit d'appel ; ne le sur-blindez pas.

## Verdict : AJUSTER (et DIFFÉRER le durcissement « moat »)

Le module n'est pas du revenu vanité, mais il n'est pas non plus le moat — c'est une **restitution d'entrée correcte**, exposée sur sa moitié « faits + interprétation générique », défendable sur sa moitié « personnalisation + croisement » qui est sous-pondérée.

- **NE PAS** affaiblir les pages gratuites pour protéger le 14€. Libérer les faits est juste (acquisition/GEO) ; le moat n'est pas dans la rétention de la donnée.
- **AJUSTER, à bas coût et seulement si on a le temps libre du goulot** : remonter le workbook AVANT/PENDANT la synthèse (c'est l'inassemblable), et faire que la synthèse **débouche sur la décision** (pont explicite vers le Pack horizontal) au lieu de seulement « poser le décor ».
- **DIFFÉRER** tout chantier lourd de durcissement du rapport **jusqu'à mesure de la conversion paywall** (condition de preuve : la première cohorte instrumentée, clic CTA payant + paywall→paiement).
- **PRIORISER À LA PLACE** la pile Data/Disco : retirer le score/100 du gratuit (dette anti-marque active) et dégater DRIAS. Ça touche l'actif d'acquisition, donc plus proche du goulot que le rapport.

## Si refus/report : la victoire stratégique

En différant le durcissement « anti-cannibalisation » du rapport, on évite **trois pièges** : (1) optimiser une variable hors goulot (la copiabilité) avant d'avoir mesuré la variable dominante (le consentement à payer) ; (2) traiter un risque théorique (n=0 sous noindex) comme un fait, contre l'invariant n°8 ; (3) sur-investir l'attention rare du porteur sur le produit d'appel (14€) au lieu du produit-moat (Pack 39€) et de l'actif d'acquisition (pages gratuites dégradées par un score interdit).

## Cohérence (tensions non tranchées, posées à l'humain)

1. La synthèse **refuse de conclure** (prompt, périmètre module) — cohérent avec l'invariant n°1 (on éclaire, on ne vend pas la décision) et avec la séparation par modules. MAIS le marché paie pour une décision. Tension réelle entre « ne pas trancher la vie du lecteur » et « justifier 14€ par un acte de décision ». À arbitrer avec Product et Editorial : jusqu'où le rapport peut-il *mener* à la décision sans la *prendre* ?
2. Le workbook nourrit la boucle d'apprentissage **en théorie** ; rien ne montre qu'il remonte vers la doctrine. À trancher : est-ce un actif de connaissance réel, ou un ornement de personnalisation ?

## Mise à jour de doctrine (prête à écrire, si décisions prises)

Dans `modele-economique.md`, section moat/risques : ajouter que **le rapport mono-commune 14€ est une restitution du moat, pas le moat ; sa défendabilité repose sur la personnalisation (repères terrain) et le pont vers l'arbitrage horizontal (Pack), pas sur la rétention des faits publics**. Et dans la hiérarchie de preuve : noter que **la cannibalisation gratuit→payant est un risque non observable tant que le site est en noindex et DRIAS gaté ; à ne pas traiter comme un fait**.

## Réflexes de clôture

**Version minimale (le test le moins coûteux qui lève le doute dominant)** : ne rien reconstruire. Lever le noindex sur **une poignée de pages `savoir/[thème]/[commune]` à fort signal** (après retrait du score + dégate DRIAS), instrumenter le parcours page gratuite → clic CTA débloquer → paiement, et observer ~quelques centaines de sessions. Cela répond d'un coup à (a) est-ce que ça convertit (le goulot) et (b) est-ce que la page gratuite cannibalise ou entonne (la question posée). C'est ~10× moins cher que de durcir le rapport à l'aveugle.

**Quand rouvrir ce sujet (signaux concrets)** :
- **Rouvrir « renforcer le rapport »** si : conversion paywall mesurée > seuil de viabilité ET taux de rebond élevé sur pages gratuites après consultation (les gens repartent rassasiés = cannibalisation réelle).
- **Rouvrir « cannibalisation »** dès que le noindex est levé ET DRIAS dégaté : à n>0, mesurer free→paid. Si conversion s'effondre quand la donnée est libre → la valeur perçue ÉTAIT la donnée (mauvais signal pour le moat). Si elle tient → l'acheteur paie l'interprétation/personnalisation (bon signal).
- **Rouvrir l'arbitrage 14€ vs Pack** si l'ARPU réel montre que les acheteurs prennent surtout le 14€ et jamais le Pack (le produit-moat ne se vend pas).

---

| | |
|---|---|
| **Goulot actuel** | La disposition à payer B2C, non mesurée (site en noindex, DRIAS gaté : aucune conversion observée) |
| **Variable dominante** | Est-ce que quiconque paie 14€ — PAS la copiabilité du rapport |
| **Temps à investir** | ~0 sur le durcissement « moat » du rapport maintenant ; un sprint sur la pile Data/Disco (retirer score + dégater DRIAS) |
| **Impact attendu** | Durcir le rapport : quasi nul sur le CA tant que la conversion est inconnue. Retirer le score + instrumenter : fort (touche acquisition + goulot) |
| **Temps à NE PAS investir** | Débattre « le 14€ est-il copiable » avant d'avoir un seul euro de conversion mesuré sous noindex |
| **Priorité suivante** | Pile avant crawl : retirer le score/100 (ADR-0001), dégater DRIAS, dédoublonner, puis instrumenter free→paid sur une cohorte test |
| **Sujet à rouvrir** | Dès noindex levé + DRIAS dégaté : mesurer free→paid. Renforcer le rapport seulement si la conversion est prouvée viable |

**Si j'étais CEO** : je ne toucherais pas au rapport aujourd'hui, je retirerais le score/100 du gratuit et je dégaterais DRIAS, puis j'ouvrirais une poignée de pages à fort signal pour mesurer si quiconque convertit — parce qu'on ne protège pas le moat d'un revenu qu'on n'a pas encore prouvé exister.
