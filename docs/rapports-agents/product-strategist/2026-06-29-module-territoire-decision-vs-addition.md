# Module Territoire : le 14 € est-il LA DÉCISION ou L'ADDITION ?

**Agent : Product Strategist (lentille = valeur réelle pour le lecteur + simplicité, en tension assumée avec le Business Strategist).**
**Date : 2026-06-29. Read-only. Je ne décide rien, je rends un rapport.**

Fichiers lus : `src/app/(account)/rapport/quartier/page.tsx`, `QuartierSynthesis.tsx`, `src/app/api/synthesize-quartier/route.ts` (le prompt système — le vrai cœur), `QuartierClimatData.tsx`, `TerritoryIdentityCard.tsx`, `territory-identity.ts`, `quartier-signals.ts`. Doctrine : `vision/archetype-lecteur.md`, fiche `project_frontiere_savoir_agir`.

---

## La question, reformulée pour qu'elle morde

La mission demande : empilement de faits (cannibalisable par le gratuit) ou croisement (non-reproductible) ?

Mais la vraie question produit est plus haute. L'archétype la donne mot pour mot :
> « qu'on **relie** plusieurs sujets plutôt que d'**additionner** des données » ; le lecteur paie « la tranquillité de décider sans l'impression d'avoir oublié quelque chose d'important ».

Donc « addition vs décision » n'est pas une nuance de richesse, c'est **la ligne de faille de la marque**. Et il faut un cran de plus : croiser des thèmes climat entre eux (chaleur × eau × feu) reste de la **compréhension du territoire**. La **décision**, pour cet archétype, c'est croiser le territoire avec **son pari de vie** (« est-ce que vivre ici reste un bon pari ? », « qu'est-ce que j'y risque ? »). Je tiens les deux barres en évaluant chaque brique.

---

## 1. Décomposition brique par brique

### TerritoryCover — atmosphère
Identité visuelle dérivée du département (mood). Ni addition ni décision : du **décor**. Coût faible, pose le ton. Non cannibalisable (personne ne va « reconstruire » une ambiance), mais ne défend pas un prix. À garder comme respiration, pas comme valeur.

### TerritoryIdentityCard — « Passeport territorial » → **ADDITION pure**
Champs : typologie, rôle dans l'agglo, population, densité, position géo, sol dominant, phrase de synthèse. **100 % déterministe** depuis l'index (`buildTerritoryIdentity`). La phrase « Ville dense de la façade atlantique, La Rochelle concentre les fonctions urbaines de son bassin de vie » est **descriptive, jamais décisionnelle**. C'est de l'INSEE/OSO mis en forme : exactement ce qu'un concurrent crédible (un SIG, un portail, ChatGPT branché sur la donnée publique) produit en une requête. C'est beau, c'est rassurant, mais **ça ne contient aucun arbitrage**. La forme « pièce d'identité / sceau de cire » est un excellent travail de Design Critic — mais elle habille de la donnée publique. Sur le plan produit : addition assumée.

### QuartierSynthesis — la prose IA → **la brique décisive, mais bridée sur de la COMPRÉHENSION**
C'est ici que tout se joue. Le prompt (`SYNTHESIS_PROMPT`) structure 3 blocs :
- `## Ce qui change`
- `## Les transformations à surveiller` (« au plus 3-4 sujets parmi chaleur, eau, submersion, feux… »)
- `## Ce que cela raconte du territoire`

Verdict en deux temps :
- **Le bon** : la synthèse croise réellement plusieurs phénomènes climat en une **trajectoire** (pas une photo). Ça, un lecteur ne le reconstitue pas en empilant 6 pages `savoir/[thème]`. Le 3ᵉ bloc (« ce que cela raconte ») est le seul qui tente une lecture d'ensemble. La voix (anti-jargon, anti-alarmiste, « journaliste qui raconte ») est forte et distinctive.
- **Le problème de fond** : la question que la synthèse se pose est, écrite noir sur blanc dans le prompt, **« Que devient ce territoire ? »**. C'est de la **compréhension**, pas de la décision. Et le périmètre **exclut explicitement** ce qui relie le territoire au lecteur : « Vous ne concluez JAMAIS sur le logement, la santé, la mobilité, le métier ni les projets personnels (achat, enfants, retraite, départ). » Résultat : la synthèse fait l'arbitrage **horizontal entre thèmes climat**, mais jamais l'arbitrage qui intéresse le lecteur — **« compte tenu de votre pari de vie, voici ce qui pèse et ce qui est secondaire »**. Elle s'arrête au bord exact de la décision.
- Le bloc 2 (« transformations à surveiller ») est, par construction, **une version prose des cartes** d'en dessous : un tour de 3-4 thèmes. C'est là que la glose guette (cf. §3).

### QuartierAside — « Les grands signaux du territoire » → **ADDITION, c'est le ventre mou cannibalisable**
Cartes groupées par thème (Territoire / Climat / Risque), **une carte = un signal d'un thème**, drawer = référence → trajectoire → récit ancré. Le drawer ajoute de l'interprétation, mais **mono-thème**. Or la fiche `project_frontiere_savoir_agir` est explicite : la **donnée par thème par commune est GRATUITE** (surface SEO 34k). Donc en substance, **ces cartes sont exactement ce qu'un lecteur déterminé peut assembler page par page**. La valeur ajoutée ici est la **curation et la mise en forme**, pas l'exclusivité. C'est la plus grosse surface du module et la plus reproductible.

### Workbook (repères de terrain) — **la graine de décision non-cannibalisable**
L'utilisateur saisit son ressenti (chaleur, eau, confort quartier, changements observés), et la synthèse se régénère en **croisant son observation avec la projection** (« Vous l'observez déjà… » / « le quartier paraît tenir, mais la trajectoire change ce confort »). **Personne ne peut reconstituer ça gratuitement** : c'est sa donnée à lui × la donnée publique. Petit en surface, énorme en principe. C'est sous-exploité.

### AskFuture inline — croisement à la demande
Interactif, personnalisé, non cannibalisable. Décision-compatible. Bien placé (après la lecture, à chaud).

---

## 2. Verdict tranché : où passe la ligne

**En l'état, le module Territoire est majoritairement ADDITION en surface, avec un noyau de décision réel mais bridé et sous-dimensionné.**

La ligne passe **à l'intérieur de la synthèse**, pas entre les briques :
- Tout ce qui est **factuel agrégé** (Passeport + Aside) = addition, reconstructible depuis le gratuit. C'est ~70 % de la surface visible.
- Le **noyau décision** = synthèse (sa trajectoire) + workbook + AskFuture. Réel, mais :
  1. la synthèse répond à « que devient le territoire » (compréhension) et non à « est-ce un bon pari pour moi » (décision) ;
  2. elle ne **hiérarchise pas** : toutes les cartes/tous les thèmes sont à plat, aucun ne dit « ici, le vrai sujet décisif c'est X, le reste est du bruit » ;
  3. elle ne **nomme pas le compromis** (l'archétype valorise « les compromis plutôt que des certitudes ») de façon obligatoire ;
  4. le workbook, seul vrai actif non-copiable, est traité comme un bonus, pas comme le cœur.

**Donc : le 14 € est aujourd'hui défendu par la richesse (addition) plus que par l'arbitrage (décision).** C'est précisément la position que le gratuit `savoir/[thème]/[commune]` va fragiliser. Le moat n'est pas encore là où la marque le promet.

---

## 3. La synthèse fait-elle l'arbitrage, ou est-ce une glose ?

**Mi-arbitrage, mi-glose.**
- Bloc « Ce qui change » et bloc « Transformations à surveiller » : **glose** — ils re-narrent en prose les signaux affichés en cartes juste en dessous. Le lecteur lit deux fois la même chose, une fois en phrases, une fois en cartes.
- Bloc « Ce que cela raconte du territoire » : **vrai travail** — il nomme une trajectoire, ce qu'aucune carte ne fait. Mais il s'arrête à la trajectoire du **territoire**, pas au **pari du lecteur**.

Autrement dit : la synthèse croise les thèmes (bien), mais ne **hiérarchise pas** ce qui est décisif et ne **conclut pas sur l'enjeu du lecteur**. Un arbitrage dit « voici ce qui compte le plus / voici le compromis / voici ce que vous risquez d'oublier ». La synthèse actuelle dit « voici ce qui change, et globalement ça raconte X ». C'est une **excellente fiche de lecture**, pas encore une **aide à la décision**.

---

## 4. Ce qui rendrait le module INDISCUTABLEMENT « la décision » (sans complexité creuse)

Aucune de ces pistes n'ajoute un module ou une surface. Elles **réorientent l'existant** — donc elles passent mon propre filtre anti-complexité.

1. **Reformuler la question-mère de la synthèse.** Remplacer « Que devient ce territoire ? » par la question de l'archétype : **« Est-ce que vivre ici reste un bon pari, et qu'est-ce qu'on risque d'oublier ? »** Zéro ligne de code en plus, un changement de prompt. C'est le levier #1 et il est gratuit.

2. **Imposer une hiérarchisation dans le prompt.** Exiger que la synthèse **nomme LE sujet décisif** de cette commune (« ici, le vrai sujet n'est pas la chaleur, c'est l'eau ») et déclasse le reste. La décision, c'est trier le décisif du secondaire — ce qu'aucune page `savoir/[thème]` à plat ne peut faire, par construction. **Non-cannibalisable par nature.**

3. **Rendre le compromis obligatoire, pas optionnel.** Le prompt a déjà l'exemple « le bord de mer reste un atout, mais demande plus d'anticipation » — mais ne l'EXIGE pas. En faire une **contrainte de sortie** (« nommez au moins un compromis : ce que ce lieu garde comme atout ET ce qu'il demande désormais »). C'est la signature « on montre les compromis » de l'archétype.

4. **Faire du workbook le pivot, pas le bonus.** Le seul actif non-copiable. Surfacer plus tôt l'invitation à renseigner ses repères, et rendre la différence **visible** quand c'est rempli (un marqueur « lecture ancrée dans vos observations »). C'est ce qui transforme « rapport sur une commune » en « rapport sur VOTRE situation dans cette commune ».

5. **Désempiler : moins de glose, plus de tranchant.** Si la synthèse devient un vrai arbitrage hiérarchisé, le bloc « transformations à surveiller » (qui double les cartes) peut maigrir ou fusionner. Les cartes restent comme **preuve consultable** ; la prose ne les répète plus, elle les **arbitre**. Le module devient plus simple ET plus décisif.

6. **(Délicat, à instruire) Effleurer le pari du lecteur sans empiéter sur les modules.** Le périmètre interdit de conclure sur logement/santé/projets — sain. Mais entre « ne jamais en parler » et « les traiter », il y a une 3ᵉ voie : **la synthèse peut nommer l'enjeu sans le traiter** (« si votre horizon ici, c'est y faire grandir des enfants, ce qui pèse le plus c'est… »). C'est l'arbitrage qui relie territoire et vie. À cadrer finement avec l'Editorial et l'architecture des modules — d'où DIFFÉRER sur ce point précis, pas REFUSER.

**Le fil rouge** : aucune de ces pistes n'ajoute de la donnée. Le réflexe naturel (Business inclus) serait « plus de signaux = plus de valeur = défend mieux le prix ». Faux. **Plus de signaux à plat = plus d'addition = plus cannibalisable.** La valeur se crée en **triant et en concluant**, pas en accumulant.

---

## 5. Ce qui est déjà juste, à préserver (le porteur le trouve abouti — mon accord, nuancé)

Je suis d'accord que le module est **abouti dans sa forme et sa discipline**, en désaccord sur le fait qu'il défende déjà le prix par la décision. À préserver absolument :

- **La voix éditoriale** (`VOICE_RULES`) : anti-jargon, anti-alarmiste, test « personne de 60 ans », chiffres = preuves pas moteur. C'est rare, c'est la marque, c'est **difficile à copier**. Un concurrent technique ne l'a pas.
- **Le cadre trajectoire** (face = mouvement, drawer = référence → trajectoire → récit). C'est littéralement la transformation visée par l'archétype (« lire un territoire comme une trajectoire, pas une photo »). Garde-le.
- **Séparation des sources** (chips en footer, jamais dans la prose). Moat de crédibilité + GEO. Discipliné.
- **Génération conditionnée par la donnée** (chips selon ce qui existe). Anti-thin-content. Aligné avec le Data Curator.
- **ERA5 en preuve au drawer, pas en face avant.** Discipline rare : le passé valide le futur sans saboter le moat projection.
- **Le workbook.** L'actif le plus précieux, à promouvoir.
- **AskFuture à chaud après la lecture.** Bon placement, vraie personnalisation.

---

## L'hypothèse porteuse de mon verdict (à contester en priorité)

Mon « majoritairement addition » repose sur **deux croyances non dites** :
1. Le vrai besoin du lecteur est **l'arbitrage pour son pari de vie**, pas la compréhension de son territoire. (Étayé par l'archétype, mais c'est une hypothèse sur le lecteur réel.)
2. Un lecteur déterminé **peut et veut** assembler les faits par thème gratuitement — donc l'accumulation ne peut pas défendre le prix.

Si ces deux croyances sont fausses — si en réalité les lecteurs **valorisent la commodité de l'agrégation** (tout au même endroit, beau, sourcé) plus que l'arbitrage, et n'ont ni l'envie ni l'énergie d'assembler 6 pages — alors le Passeport et les cartes **défendent bel et bien le prix**, et ma lentille sur-pondère la décision. **C'est testable** (cf. ci-dessous), et je le signale honnêtement.

---

## Tension avec le Business Strategist (à ne pas trancher ici)

- **Lui** défendra probablement la richesse (Passeport + 16 cartes) comme **preuve de valeur qui justifie 14 €**, et voudra peut-être **plus de signaux** pour creuser l'écart avec le gratuit.
- **Moi** : la richesse à plat **est** la surface cannibalisable ; ajouter des signaux aggrave le problème. Le prix doit être défendu par **l'arbitrage** (synthèse hiérarchisée + workbook), pas par l'accumulation. Je veux **moins de glose, plus de tranchant**.
- **Le point de friction concret** : faut-il, à budget égal, investir dans **plus de cartes/données** (thèse richesse) ou dans **une synthèse qui arbitre + un workbook central** (thèse décision) ? C'est un arbitrage d'allocation — matière à `/board`, pas pour moi seul.

---

## Mes quatre questions de clôture

1. **Si on reconstruisait futur•e à zéro aujourd'hui, referait-on ça ?** La synthèse, le workbook, le cadre trajectoire, la voix : oui, sans hésiter. Le Passeport et les 16 cartes à plat : on les referait **plus maigres et subordonnés à l'arbitrage**, pas comme la pièce maîtresse.
2. **Qu'est-ce qu'on perd si on supprime [les cartes Aside] ?** On perd la **preuve consultable** (le lecteur rationnel veut vérifier la donnée derrière la prose) et un confort de réassurance. Donc on ne les supprime pas — on les **rétrograde en preuve**, on arrête de les doubler en prose. Supprimer le Passeport : on perd une amorce identitaire rassurante, mais aucun arbitrage.
3. **Version 10× plus simple du même besoin ?** Oui : **une synthèse qui (a) nomme le sujet décisif, (b) nomme le compromis, (c) s'ancre dans les repères du lecteur** — et des cartes en preuve repliée dessous. Plus simple ET plus décisif que l'empilement actuel.
4. **Rend-elle futur•e plus difficile à copier, ou seulement plus riche ?** En l'état : surtout **plus riche** (donc copiable par un bon prompt sur donnée publique). Les pistes du §4 la rendraient **plus difficile à copier** (hiérarchisation + croisement avec le pari du lecteur + workbook = jugement, pas data).

---

## Si j'étais le gardien du produit

**Je ne toucherais pas une carte de plus. Je réécrirais la question-mère du prompt de synthèse** — de « que devient ce territoire » à « est-ce un bon pari, et qu'est-ce qu'on risque d'oublier » — **j'imposerais hiérarchisation + compromis, et je mettrais le workbook au centre.** Le 14 € se gagne par l'arbitrage, jamais par l'accumulation. Tout le reste est déjà bon ; c'est le **cerveau** du module qu'il faut faire passer de la compréhension à la décision.

---

## Quand rouvrir ce sujet (condition de réouverture)

Cet avis est **daté** et conditionnel à mon hypothèse porteuse. Le rouvrir si :
- **PostHog** montre que les payants **scrollent les cartes mais déclenchent peu la synthèse / ne régénèrent jamais avec le workbook** → alors ma thèse « décision » est fausse, l'addition fait le travail, et l'effort doit aller à la richesse (le Business a raison).
- **À l'inverse**, fort taux de régénération workbook + usage AskFuture → confirme que le moat est la personnalisation, prioriser les pistes §4.
- **Le gratuit `savoir/[thème]/[commune]` est ouvert au crawl** (aujourd'hui `noindex`) ET on observe une chute de conversion 14 € → la cannibalisation se matérialise, urgence sur le §4.
- **Sonde / entretiens** sur 5-10 acheteurs : « qu'auriez-vous pu reconstituer seul ? » Si la réponse est « presque tout sauf la synthèse », mon verdict est confirmé.
- **Pivot B2B** (CGP/assureurs) : leur besoin penche vers la donnée structurée agrégée — l'équilibre addition/décision se rejoue, à réévaluer.
