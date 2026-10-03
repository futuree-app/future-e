# FUT-30 + FUT-14 : stratégie de l'avant-paiement

**Date** : 3 octobre 2026 · **Base** : `main` à `8fe430cb` · **Nature** : audit de cadrage, phase 0.
Aucun code produit, aucune donnée modifiée, aucun changement Linear.

**Méthode** : lecture du code des quatre avant-paiements et des trois modules livrés ; reconstitution
des décisions dans `/memory`, `docs/vault/`, `docs/audits/`, `docs/rapports-agents/`,
`docs/superpowers/`, `docs/handoff/` et l'historique Git ; parcours réel au navigateur sur un build
de production local de `8fe430cb` branché sur le vrai Supabase (visiteur anonyme pour tout
l'avant-paiement, compte de test pour relire un dossier livré, en lecture seule) ; mesures de
latence en local et sur `futur-e.fr`.

**Ce qui n'a pas été fait, volontairement** : `/checkout/dossier` et le paywall Territoire n'ont
pas été ouverts en étant connecté, parce que leur montage crée un PaymentIntent et une ligne
`dossier_intents` en base de production. Ces deux écrans sont décrits depuis le code, et vus en
anonyme quand ils le permettent.

---

## 1. Résumé exécutif

**Le problème de conversion est un problème de preuve.** Avant de payer 39 €, un visiteur lit
environ 180 mots : trois descriptions d'échelle, deux pastilles « disponible » et une phrase de
couverture. Il ne voit à aucun moment la forme d'un résultat, la façon dont futur•e relie un fait à
une conséquence et à une limite, ni la profondeur d'une échelle. La page d'accueil promet « Ce que
nous savons. Ce que cela change pour vous. Ce qu'il reste à vérifier. » ; aucun écran d'avant-paiement
ne le montre. La question « qu'est-ce que je vais réellement recevoir pour 39 € ? » n'a pas de
réponse avant la caisse.

**FUT-30 ne porte pas sur le Dossier Adresse.** `quartier-preview.ts` alimente uniquement le
paywall du Dossier de territoire à 14 €. Son défaut technique est réel (l'aperçu dépend du plus lent
de huit appels, sous un plafond global de 1,2 s, et disparaît en entier), mais il en cache un
second, plus grave : même quand il s'affiche, l'aperçu dit **la même chose sur toutes les
communes**. Mesuré sur 14 communes : trois cartes identiques, sans aucun chiffre propre au lieu.

**La doctrine actuelle de la qualification est juste dans son interdit, trop large dans son
application.** « La qualification annonce ce qui sera examiné, jamais ce que ça vaut » (29/07)
protège contre un vrai danger : donner gratuitement le résultat à l'adresse. Mais deux décisions
ultérieures l'ont déjà dépassée sans qu'aucun écran ne suive : le **triptyque du gratuit** adopté le
10/08 (« une correspondance, une contradiction, une inconnue, chacune réelle, datée et sourcée »),
jamais implémenté, et la priorité du 19/09 « rendre visible avant paiement la façon de raisonner ».

**Recommandation principale, en une phrase** : séparer ce que le visiteur doit **comprendre** (la
forme du produit, montrée par un vrai dossier exemple sur une autre adresse, figé et versionné) de
ce qu'il doit **croire** (que futur•e a quelque chose à dire sur son lieu, montré par un seul fait
communal sourcé, déjà public, suivi de la question que le dossier tranchera à son adresse), et ne
jamais faire dépendre ni l'un ni l'autre d'un appel externe en direct.

| # | Décision recommandée |
|---|---|
| 1 | Dossier exemple : **oui** |
| 2 | **Réel**, produit par le moteur normal, figé |
| 3 | **Une** adresse, avec deux états de sa section Logement (avec et sans diagnostic) |
| 4 | Commune affichée, **numéro et voie masqués**, plusieurs détails arrondis |
| 5 | Sur `/dossier`, **après** le résultat de qualification ; accessible aussi avant saisie par un lien, et en page permanente |
| 6 | Un seul signal propre à la saisie du visiteur, **à l'échelle de la commune** |
| 7 | Rien à l'échelle de l'adresse ou du secteur avant paiement, hors la couverture déjà montrée |
| 8 | FUT-30 reste séparé et Urgent, mais change de cible : un aperçu qui ne disparaît jamais **et** dit quelque chose de propre à la commune |
| 9 | FUT-14 se scinde : **14A** maintenant (exemple, signal, frontière), **14B** après FUT-9/FUT-10 (le triptyque relié au Projet) |
| 10 | Premier lot : FUT-30 (court, sans dépendance), puis la chaîne de production du dossier exemple |

---

## 2. Question produit

> À quoi doit ressembler l'expérience avant paiement pour que quelqu'un comprenne réellement ce
> qu'il achète, ait envie de l'acheter, et puisse juger de la qualité de futur•e, sans que futur•e
> donne gratuitement le dossier qu'il vend ?

Elle se décompose en trois questions de visiteur, qui n'appellent pas la même preuve :

| Question du visiteur | Preuve qui y répond | Source de la preuve |
|---|---|---|
| « Qu'est-ce que je vais recevoir ? » | La forme réelle d'un dossier | Un dossier, peu importe lequel |
| « futur•e a-t-il quelque chose à dire sur MON lieu ? » | Un fait réel, propre à sa saisie | Son lieu, au grain le moins coûteux à donner |
| « Jusqu'où va le dossier ? » | La structure, et ce qui reste fermé | Le catalogue des échelles et de leurs contrôles |

L'erreur jusqu'ici a été de demander à une seule surface de répondre aux trois. L'aperçu
Territoire essaie de répondre à la deuxième avec une matière de la première (des cartes génériques
présentées comme « déjà analysées sur {commune} ») ; la qualification répond à la troisième et
s'interdit les deux autres.

---

## 3. Découverte : FUT-30 corrige le Territoire, le besoin vit sur l'Adresse

| | Dossier de territoire 14 € | Dossier d'adresse 39 € |
|---|---|---|
| Surface d'avant-paiement | `/territoire/[insee]/debloquer` | `/dossier` → `/checkout/dossier` |
| Aperçu propre au lieu | `getQuartierPreview` (FUT-30) | **aucun** |
| Entrée habituelle | « Découvrir ce territoire » depuis `/ou-vivre` | Saisie d'adresse (pages commune, accueil, `/rapport`) |
| Spec | `2026-06-07-paywall-territoire` | `2026-07-30-qualification-checkout-dossier` |

`quartier-preview.ts` n'a qu'un appelant (`debloquer/page.tsx`). Le Dossier Adresse n'a pas
d'aperçu du tout : il n'y a rien à « faire disparaître ». Corriger FUT-30 ne changera donc rien à
la question « qu'est-ce que je reçois pour 39 € ? ». À l'inverse, la stratégie de démonstration
pensée pour l'Adresse (exemple figé, signal communal local) résout aussi FUT-30, si on la lui
applique.

---

## 4. Historique des décisions antérieures

Reconstitué dans l'ordre. Les statuts disent l'état **au 03/10/2026**, après confrontation au code.

| Date | Document / commit | Idée | Statut |
|---|---|---|---|
| 31/05 | `memory/parcours_doctrine`, `vault/arbitrages/wizard-non-universel.md` | Le questionnaire n'est pas universel ; il reste la rampe « commune connue » : commune → questionnaire → aperçu perso → dossier | Décidée ; toujours en place (accueil) |
| 07/06 | spec `2026-06-07-paywall-territoire-design.md`, `a7724c14` | Paywall de conviction ; **aperçu réel** du module Quartier, « pas de chiffre », « frontière intrigue / réponse », timeout 1 200 ms → bloc masqué | Décidée et livrée ; **dépassée** sur « pas de chiffre » par le 04/08 |
| 07/06 | même spec, hors périmètre | « Exemple d'une autre commune » et « aperçu Logement (adresse) » renvoyés à des specs séparées | Proposée, **jamais reprise** |
| 07/06 | `memory/project_comparateur_complet`, `truncateComparaison` | Pack : aperçu **réel tronqué par la structure** (résumé + 2 thèmes sur 7) | Décidée et livrée |
| 28/06 | `rapports-agents/product-strategist/2026-06-28-deux-rapports-et-wizard.md` | Le « Score X/100 » du teaser viole l'invariant n°2 ; voix anxiogène | Constat ; **non traité** (score toujours affiché) |
| 28/06 | `memory/project_tension_gratuit_payant` (Product + Business + Editorial) | Le gratuit ne cannibalise pas par excès d'information ; il « tensionne mal » : tension de richesse au lieu de tension **décisionnelle** (« ça se joue sur X, et vous ne l'avez pas vu ») ; ne pas toucher aux prix | Décidée ; copy livrée sur le comparateur, pas sur l'Adresse |
| 29/06 | `memory/project_frontiere_savoir_agir` | Matrice savoir/agir × thème/commune ; la diagonale commune × décision est payante ; la donnée commune est gratuite | Décidée |
| 11/07 | `vault/arbitrages/moat-assemblage-largeur-en-tunnel.md` | « Le payant ne vend jamais la donnée vue gratuitement : il vend son croisement avec le projet du lecteur » | Décidée ; **c'est la règle de frontière la plus solide du dépôt** |
| 29/07 | `rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md` | Qualification gratuite avec refus de vente ; elle montre **la matière, jamais la valeur**, « aucun état, aucun verdict » ; route publique légère, jamais le fan-out Géorisques | Décidée et livrée |
| 31/07 | `dossier-couverture-attendue.ts`, `4c0e298c` | Dire ce que le manque **change** au dossier, le manque avant ce qui reste ; « jamais ce que ça vaut » ; un profil plus riche vivrait « après l'authentification et avant le PaymentIntent » | Décidée et livrée ; l'ouverture « après l'auth » **jamais exploitée** |
| 04/08 | `memory/doctrine_rang_national_gratuit`, `rang-national.ts` | Le **rang parmi 35 006 communes, montré gratuitement**, est la démonstration du moat ; silence au milieu de la distribution | Décidée ; livrée sur `chaleur/` et `inondation/` **seulement** |
| 04/08 | `debloquer/page.tsx` (commentaire) | « Pourquoi payant » réécrit autour de la position relative parmi 34 000 communes | Livrée ; **contradictoire** : le paywall ne montre jamais cette position |
| 04/08 | `memory/project_nommage_offre` | Trois noms par grain ; escalier 14 → +25 visible sous le prix | Décidée et livrée |
| 10/08 | `vault/vision/objet-central-dossier-de-decision.md` | **Triptyque du gratuit** : une correspondance, une contradiction, une inconnue, réelles, datées, sourcées ; « démonstration de la nature du moteur, pas un aperçu tronqué du payant » | **Adoptée, jamais implémentée** (aucune occurrence dans `src/`) |
| 10/08 | même document | Kill list : pas de score unique ; « reste à trancher » le score /100 du teaser | Ouvert |
| 10/08 | `vault/paris.md` | Pari : la méthode se voit si une preuve déterministe est montrée avant paiement ; critère de mort défini | Non testé |
| 16/08 | `rapports-agents/_sources/2026-08-16-test-julien-lisa-cire-daunis.md` | Premier test réel : « tu le frustres et l'invite à payer… quitte à le teaser avec une ligne ou deux » ; paiement à 18 h 23, projet à 18 h 24 ; trois hypothèses à séparer : plus de projet avant, teaser plus probant, meilleure explication du livré | Signal ; aucune décision |
| 21/08 | `CeQueLeDossierExamine.tsx`, `dossier-echelles.ts` | Les trois échelles sur la page de paiement ; « chaque constat porte sa source et sa limite » | Livrée |
| 19/09 | `vault/recherches/2026-09-19-veille-strategique.md`, `memory/business_commoditisation_fiche_adresse` | Huit concurrents sur les mêmes données ; « la différence doit être visible avant paiement » ; retenu n°2 : montrer **la façon de raisonner, pas la liste des bases** | Décidée ; **non implémentée** |
| 19/09 | `vault/briefs/2026-09-19-priorites-execution.md` §4 | « Un fait, ce qu'il change pour ce projet, ce qu'il reste à vérifier » ; distinguer « diagnostic trouvé à l'adresse » de « diagnostic attribuable à ce logement », **que l'écran confond** | Décidée ; **non implémentée** (confusion reproduite au navigateur, §7) |
| 19/09 | `90991348` | Le teaser ne déduit plus de DPE de l'âge du logement | Livrée |

### Tensions et contradictions

1. **29/07 contre 10/08.** « Aucune valeur, aucun état » contre « une correspondance, une
   contradiction, une inconnue, réelles ». Le second ne remplace pas le premier : il le précise. Le
   29/07 interdit la valeur **à l'adresse** sur une route publique (raison technique : ne pas
   exposer le fan-out Géorisques, et raison commerciale : ne pas donner le dossier). Le 10/08 vise
   des faits **déjà publics**, au grain où futur•e les donne déjà ailleurs. Lecture conciliée :
   l'interdit tient pour le grain adresse et secteur ; il ne s'est jamais appliqué au grain commune,
   puisque les pages commune montrent déjà valeurs et rangs.
2. **« Pas de chiffre dans l'aperçu » (07/06) contre « rang national gratuit » (04/08).** Le second
   a été pris pour les pages commune et n'a jamais été reporté sur le paywall Territoire. Résultat :
   la page qui vend le 14 € est la seule surface commune qui ne montre aucune donnée propre au lieu.
3. **Le paywall Territoire justifie son prix par la position relative et ne la montre pas.** « Ce
   qui décide, c'est de savoir où elle se situe parmi les 34 000 communes » : la phrase pointe une
   preuve absente de l'écran.
4. **Le questionnaire de l'accueil fait l'inverse de toute la doctrine** : score /100 (invariant
   n°2), titre « nettement exposée » (invariant n°6), tension de quantité (« 4 points d'attention »),
   et deux « points d'attention verrouillés » qui ne sont que des annonces génériques floutées.
   Signalé le 28/06, laissé « à trancher » le 10/08, toujours en production.
5. **La grille tarifaire de l'accueil promet « le logement : confort d'été »** pour le 39 €. La
   mesure du 31/07 établit que 75 à 86 % des adresses n'ont aucun diagnostic, donc aucun confort
   d'été lisible. La qualification le dit honnêtement ; l'accueil, en amont, non.

---

## 5. Cartographie des avant-paiements existants

| Surface | Produit | Données propres au lieu | Dépendance réseau au rendu | État de doctrine | Verdict |
|---|---|---|---|---|---|
| `/territoire/[insee]/debloquer` | 14 € | Aucune dans les faits (cartes identiques partout) | 8 sources dont 5 réseau, plafond global 1,2 s | « Aperçu réel » annoncé, contenu générique | 🔄 À reconstruire |
| `/dossier` (qualification) | 39 € | Présence d'un DPE et d'une parcelle | 2 sondes (ADEME, cadastre) | Juste dans son interdit | 🔧 À corriger et compléter |
| `/checkout/dossier` | 39 € | Aucune | BAN | Juste | ✅ À conserver, enrichir d'un lien |
| Questionnaire de l'accueil (`WizardTeaser`) | 14 € | DRIAS commune, ERA5, score legacy | API `wizard-preview` | Viole les invariants n°2 et n°6 | 🗑️ Score et faux verrous à supprimer ; ⏸️ refonte à attendre |
| `/comparateur/pack-decision` | 39 € | Matrice réelle tronquée (1 ligne de résumé, 2 thèmes sur 7) | Aucune (index local) | Conforme | ✅ À conserver ; modèle à réutiliser |
| Pages commune `chaleur/`, `inondation/` | gratuit | Valeurs DRIAS + rang national | Local | Conforme | ✅ Base du signal communal |
| Accueil, héros | gratuit | Exemple fixe sur La Rochelle (submersion, 3 j > 35 °C en 2050) | Local | Conforme | ✅ Précédent d'exemple sur une autre commune |

---

## 6. Parcours Dossier de territoire 14 €

### Ce que montre la page, dans l'ordre

1. Hero « Avant de choisir {commune}, regardez ce que les données racontent vraiment. »
2. Trois cartes de promesse : Comprendre / Identifier les points de vigilance / Poser vos questions.
3. **Aperçu réel** (s'il arrive à temps) : « Ce que futur•e a déjà analysé sur {commune} », trois
   cartes verrouillées, ligne de sources.
4. Ligne `PersonalTouch` si le navigateur porte des priorités `/ou-vivre` en `localStorage`.
5. « Vous pourrez demander » : cinq questions AskFuture.
6. « Pourquoi ce dossier est payant ? » (la position parmi 34 000 communes).
7. Escalier 14 → 39 €, « Aucun engagement », CTA.

### Ce que l'aperçu dévoile réellement

`getQuartierPreview` ne produit que trois textes fixes, gatés sur la présence d'une donnée :

| Carte | Condition | Texte, identique pour toutes les communes |
|---|---|---|
| Le climat à venir | `drias.commune.s` existe (toutes les communes DRIAS) | « La trajectoire climatique de cette commune est projetée à plusieurs horizons… » |
| Inondation et catastrophes naturelles | drapeau inondation **ou** submersion **ou** CatNat > 0 | « Le territoire porte un historique de catastrophes naturelles reconnues… » |
| Les risques du secteur | Géorisques a répondu | « Les risques naturels, technologiques et environnementaux… sont passés en revue » |

Mesuré au navigateur et par requête : **14 communes sur 14 reçoivent les trois mêmes cartes**
(Romagnat, Grenoble, La Rochelle, Ciré-d'Aunis, Landerneau, Briançon, Limoges, Bordeaux,
Marseille, Lille, Périgueux, Bourg-en-Bresse en local ; Cahors et Rodez en production, avec six des
précédentes). Aucun chiffre, aucune position, aucun fait
distinctif. Le titre « Ce que futur•e a déjà analysé sur {commune} » et le surtitre « Aperçu réel du
dossier » promettent une spécificité que le contenu n'a pas. C'est un défaut d'honnêteté du signal
plus grave que la latence.

Défaut logique secondaire : la carte inondation affirme un « historique de catastrophes naturelles
reconnues » dès que le **drapeau** inondation est levé, y compris avec `catnat.total === 0`. Le
cas n'a pas été observé, mais le code le permet.

### Comportement en timeout, mesuré

- `gatherCommuneEnrichment` attend **les huit** sources (`Promise.allSettled`) : ADEME (3 appels),
  Hub'Eau, VigiEau, Géorisques, GASPAR (réseau, chacun plafonné à 8 s) ; DRIAS, littoral, baignade
  (fichiers locaux).
- Le plafond est **global** (1 200 ms) : une seule source lente masque tout, y compris la carte
  climat dont la donnée est locale.
- DRIAS lit `public/data_climat.json` (63 Mo) : **730 à 905 ms** de lecture et d'indexation à froid
  sur un poste récent, avant tout appel réseau. Sur une fonction neuve, le premier visiteur est
  presque assuré de perdre l'aperçu.
- Au navigateur, après redémarrage du serveur : **bloc absent** sur La Rochelle au premier rendu,
  présent aux six rendus suivants (35 à 38 ms). En production le 03/10, 8 communes sur 8 l'ont
  affiché (246 à 3 441 ms de rendu complet) : le passage des fonctions en `cdg1` le 01/10 a
  probablement fait disparaître la cause dominante (Géorisques ne répondant qu'aux IP françaises),
  pas la cause structurelle.

### Sources mobilisées et écart avec le produit acheté

Le dossier de territoire livré montre, au même endroit : valeurs DRIAS par horizon (« 23 jours
au-dessus de 30 °C… 124 jours de sols secs »), frise CatNat « La mémoire du lieu », grands signaux,
synthèse. L'aperçu n'en reprend ni une valeur, ni la frise, ni la structure. L'écart entre ce qui
est montré et ce qui est vendu est total.

### Défauts de texte relevés au passage

- « Dire que La Rochelle**sera** exposée » : espace manquant (JSX, `{displayName}sera`).
- « 34 / 000 » coupé en fin de ligne : espace ordinaire au lieu d'une insécable.

---

## 7. Parcours Dossier d'adresse 39 €

### Ce que voit un visiteur anonyme, mesuré au navigateur

**Écran 1, `/dossier` avant saisie** : un surtitre, un titre (« Quel bien voulez-vous faire
examiner ? »), deux phrases, un champ. Rien d'autre. Ni exemple, ni preuve, ni indication de ce
qu'on obtient.

**Écran 2, après qualification** (adresse de démonstration publique du dépôt, « 5 Rue du Palais,
La Rochelle ») :

- « Ce que nous examinerons ici » : les trois échelles (texte fixe de `dossier-echelles.ts`).
- Sous Logement : « Diagnostic énergétique · DISPONIBLE », « Parcelle cadastrale · DISPONIBLE ».
- « Ce que cette adresse permettra de lire » : « Restent lus : la trajectoire climatique de la
  commune, ce à quoi cette adresse est exposée (zonages, sols, sinistres indemnisés), et ce que le
  secteur met à portée de pas. S'y ajoute la lecture du diagnostic énergétique rattaché à cette
  adresse. »
- 39 €, « 14 € de moins si vous avez déjà la lecture de cette commune », bouton « Créer mon dossier ».

Total : environ 180 mots. Aucun fait. Aucune forme de résultat.

**Écran 3, « Créer mon dossier » sans compte** : `/connexion` affiche « BON RETOUR · Votre
dossier vous attend. Vos projections, vos réponses et votre commune sont exactement là où vous les
avez laissés. » Un visiteur qui n'a jamais eu de compte lit qu'il revient, et doit trouver « Créer
un compte » en bas du formulaire. L'adresse qu'il vient de qualifier n'est pas rappelée.

**Écran 4, `/checkout/dossier`** (code, non ouvert connecté) : l'adresse en titre,
`CeQueLeDossierExamine` (les trois échelles + « Chaque constat porte sa source et sa limite… »),
le panneau de paiement. Aucun rappel de la couverture mesurée.

### Défauts propres à la qualification

1. **« Diagnostic énergétique · disponible » confond « trouvé à l'adresse » et « attribuable à ce
   logement »** (brief du 19/09, §4). Sur l'adresse testée, la base en portait six au 20/09 (`scripts/admin/README.md`, mémoire
   `reference_scripts_admin`) et aucun ne
   s'attribue automatiquement : « disponible » promet une lecture du DPE que le dossier ne fera
   qu'après un choix du lecteur. « S'y ajoute la lecture du diagnostic énergétique rattaché à
   cette adresse » aggrave la confusion.
2. **« Restent lus » quand rien ne manque.** `RESTE_TOUJOURS` commence par « Restent », écrit pour
   suivre un manque ; dans le profil `complete`, rien n'a été retiré et la phrase sonne comme une
   perte.
3. **Le prix arrive sans la moindre preuve de forme.** C'est le cœur de la question du porteur.

### Ce que le dossier final contient réellement

Voir §10. Retenir ici l'ordre de grandeur : le hub « En une minute », trois modules, plusieurs
dizaines de constats sourcés avec limites et contrôles. Entre ces deux réalités, l'avant-paiement
ne laisse passer que les trois noms d'échelle.

---

## 8. Questionnaire de l'accueil (`WizardTeaser`)

**État** : actif. Accessible depuis l'accueil (« Obtenir mon dossier personnalisé », « Votre
dossier en 2 minutes »). Six questions : commune, logement (type, âge), métier, santé, mobilité,
projet.

**Ce qu'il cherchait à accomplir** (doctrine du 31/05) : la rampe « engagement → aperçu perso →
paiement » pour une commune connue. L'intuition est bonne, et le test du 16/08 la confirme
(« d'abord le client répond aux questions, ensuite… »). L'exécution la dessert.

**Ce qu'il affiche, observé au navigateur sur La Rochelle** :

- « Votre situation fait déjà ressortir **4 points d'attention** à La Rochelle. »
- Carte ERA5 « +1,6 °C depuis la fin du XXᵉ siècle » (réelle, sourcée, utile).
- « Les étés deviendraient nettement plus difficiles… 18 jours très chauds par an et environ
  23 nuits tropicales » (DRIAS, réel).
- « Votre commune est nettement exposée à la submersion marine. **Score 80/100 · exposition
  élevée** » (table legacy `communes_tension`).
- « **2 points d'attention verrouillés** » floutés : ce sont deux annonces génériques (« La
  performance de ce logement se lit sur son diagnostic » ; « Avant de signer, plusieurs points se
  vérifient »). Rien n'est caché ; seule la rareté est simulée.
- CTA « Débloquer mon dossier · 14 € » vers `/checkout/rapport-complet`, sans la commune.

**Dette** : invariant n°2 (score), invariant n°6 (« nettement exposée »), tension de quantité au
lieu de tension décisionnelle, faux verrous, question du logement posée pour un produit (14 €) qui
ne lit pas le logement, CTA qui perd l'INSEE.

**Verdict** : 🗑️ supprimer le score et les verrous de façade (geste court, hors périmètre de ce
chantier mais à ticketer) ; ⏸️ ne pas refaire le questionnaire maintenant. Sa refonte relève du
Projet (FUT-9/FUT-10) et réutilisera le signal communal défini ici.

---

## 9. Dossier comparatif (ex-Pack Décision)

**Mécanisme** : `seedComparaison` sur le vrai trio, puis `truncateComparaison` : la première ligne
du résumé, l'arbitrage, la divergence et **deux thèmes sur sept**, rendus avec les composants du
produit payé. Le reste (cinq thèmes, 27 dimensions, pistes, AskFuture) est fermé.

**Ce qui est réutilisable** :

- **Tronquer par la structure, jamais par le flou.** Le visiteur lit de vraies lignes, dans le vrai
  rendu, et voit combien il en reste.
- **Données locales uniquement** : l'aperçu ne dépend d'aucun appel externe.
- **La tension est décisionnelle** : la divergence nommée dit où les communes s'écartent.

Le Pack résout sur le comparatif exactement ce que l'Adresse ne résout pas. Sa limite pour notre
cas : il tronque **le dossier du visiteur**, ce que l'Adresse ne peut pas faire sans donner le
résultat à l'adresse. D'où l'exemple sur une autre adresse.

---

## 10. Produit réellement livré après paiement

Relu au navigateur sur un dossier réel du compte de test (adresse parisienne, contenu non reproduit
ici au-delà de sa structure), en lecture seule.

### Hub « En une minute » (`/rapport`)

- Verdict déterministe en tête : « {commune} répond à l'une de vos priorités : l'accès aux soins. »
- « À contrôler en priorité » : deux gestes concrets.
- Ce qui n'est pas couvert, nommé (« Vos priorités concernant… ne sont pas encore couvertes »).
- Cartes de faits : **constat → preuve (valeur) → contrôle à mener → « Données et limites »**.
  Exemple de structure : « À cette adresse, le diagnostic choisi classe ce logement F » · preuve
  « DPE F » · « Faites chiffrer les travaux d'amélioration » · limites dépliables.
- Contrôles non réalisés, nommés (« Géorisques ne répondait pas au moment de l'analyse »).
- Date de génération ; version figée (`decision_artifact`, `ENGINE_VERSION = engine-4`).

C'est la forme exacte du triptyque « ce que nous savons / ce que cela change / ce qu'il reste à
vérifier ». **Elle existe, elle est déterministe, et personne ne la voit avant de payer.**

### Territoire (`/rapport/quartier`)

Valeurs DRIAS par horizon avec référence 1976-2005, scénario explicite (« France +2,7 °C »),
frise CatNat depuis 1982 avec repère national (« une commune française sur dix dépasse dix
années »), grands signaux sourcés, sélecteur 2030 / 2050 / 2100. Défauts vus : « Le territoire
aujourd'hui : les données disponibles ne permettent pas de décrire ce point » ; contradiction
« reconnue 20 fois… surtout au titre de : inondations » puis « dont 0 arrêté inondation depuis
1982 » ; plus de 60 s au premier chargement sur le Preview.

### Autour (`/rapport/autour`)

La matière la plus concrète du produit : équipements les plus proches avec distance et décompte
à 500 m, îlot de chaleur du secteur (« jusqu'à +7,2 °C »), premier espace végétalisé et ses
limites, voie ferrée à 350 m avec une limite exemplaire (« elles n'établissent pas le niveau
sonore de ce logement… seule une visite à plusieurs heures de la journée le dit »), **autorisation
d'urbanisme créant des logements à moins de 50 m**, avec ses réserves. Défauts vus : une agence
immobilière classée « banque » (BPE) ; le taux de motorisation **de la commune** présenté comme
celui « de ce secteur » (faute d'échelle, contraire à la doctrine) ; premier rendu lent.

### Logement (`/rapport/logement`)

Passeport (parcelle, surface, type), étiquette et GES, confort d'été expliqué par les
caractéristiques du DPE avec réserve de date, **périmètre patrimonial (ABF)** et sa conséquence sur
les travaux, liste « À vérifier avant de décider ». Défauts vus : valeurs de l'audit énergétique
absurdes (« 218538.427059351 kWh/m²/an », non formatées, probablement une consommation totale sous
une unité au m²) ; environ 40 s au premier chargement.

### Ce que cela implique pour l'avant-paiement

1. **Le produit a de quoi convaincre.** Les meilleures pièces sont : le fait d'Autour avec sa
   limite, le périmètre patrimonial, le permis à moins de 50 m, la frise CatNat, le verdict
   « En une minute » avec ses contrôles.
2. **Le produit vivant est lent et inégal** : 40 à 60 s au premier chargement, défauts d'affichage,
   une contradiction. Une démonstration commerciale construite sur ce chemin en direct hériterait
   de tout cela. La démonstration doit être un **instantané relu**.

---

## 11. Écart entre promesse et produit

| Échelle | Ce que l'avant-paiement promet | Ce que le dossier montre | Ce qui convainc visuellement | Spécifique au lieu | Ce qui distingue futur•e de Géorisques | Implication décisionnelle | Limite intéressante à montrer | Impossible à montrer sans trop donner |
|---|---|---|---|---|---|---|---|---|
| Territoire | « Ce qui structure la vie… ce à quoi elle est exposée et ce qui la transforme » | Trajectoire DRIAS chiffrée, frise CatNat, grands signaux, synthèse | La frise « mémoire du lieu », le sélecteur d'horizon | Valeurs et rangs de la commune | La position relative (35 006 communes, même méthode) ; la trajectoire | Faible seule ; forte croisée au projet | « Ces indicateurs comptent des jours sur l'année, sans dire s'ils forment une période continue » | Peu : la donnée commune est déjà gratuite ailleurs ; seule la **hiérarchie** reste payante |
| Autour | « Ce qui se trouve et se mesure à proximité » | Distances, décomptes, îlot de chaleur, nuisances, permis | La liste des repères avec distances ; la carte chaleur | Totalement (grain adresse) | La relation géographique correcte (proximité ≠ exposition), la convention stable, les limites | Forte (soins, école, gare, chantier à venir) | Le bruit qu'aucune distance n'établit ; « à vol d'oiseau » | **Tout** : c'est le cœur payé, et le plus facile à copier une fois vu |
| Logement | « Ce que le bâtiment et sa parcelle établissent… ce qu'il reste à demander » | Passeport, DPE, confort d'été, argiles, cavités, zonage, ABF, gestes | L'étiquette, la liste « à vérifier » | Totalement | L'attribution honnête du DPE, le refus de déduire, le périmètre ABF | Très forte (travaux, prix, négociation) | « Aucun diagnostic n'est rattaché… » ; DPE d'immeuble ≠ logement | **Tout** : la classe, l'attribution, le zonage au point |
| Hub | Rien n'en est dit avant paiement | Verdict, contrôles prioritaires, ce qui n'est pas couvert | La carte constat → preuve → contrôle → limites | Oui | La forme même du raisonnement | C'est la décision | « Une vérification n'a pas pu être réalisée » | Le verdict propre au visiteur |

**L'extrait qui ferait comprendre immédiatement que le dossier n'est pas une liste de bases** : une
carte du hub, dans sa forme complète, sur une autre adresse. Un constat (« un médecin
généraliste à environ 40 m »), la limite qui l'accompagne (« cette présence ne dit ni la
disponibilité du praticien… ni s'il accepte de nouveaux patients »), et le geste qui en découle
(« vérifiez qu'un médecin prend de nouveaux patients avant l'achat »). Aucun site de données ne
produit la deuxième et la troisième ligne. C'est la preuve de méthode.

---

## 12. Ce qu'un visiteur ignore aujourd'hui avant paiement

1. Que le dossier rend un **verdict hiérarchisé** en tête, et pas une pile de cartes.
2. Que chaque constat porte **sa limite** et, s'il en appelle un, **un contrôle à mener**.
3. Que futur•e **nomme ce qu'il ne sait pas** (« une vérification n'a pas pu être réalisée »).
4. Ce qu'« Autour » veut dire concrètement : des distances réelles, un îlot de chaleur, un chantier
   autorisé à côté.
5. Ce que devient la section Logement **sans diagnostic** (le cas de 75 à 86 % des adresses) : il
   le lit en une phrase, sans voir à quoi ressemble ce qui reste.
6. Que le dossier est **daté, versionné**, et se rouvre.
7. Pour le Territoire : la position de la commune parmi 35 006, alors que c'est l'argument du prix.

Là où il doit aujourd'hui « faire confiance » sans preuve : entre le prix et la page de connexion,
c'est-à-dire au moment précis où il engage 39 €.

---

## 13. Ce qui doit rester payant

Règle générale, issue du 11/07 : **le payant vend le croisement, le grain fin et la hiérarchie,
jamais une donnée que futur•e donne déjà gratuitement ailleurs.**

Strictement payant, et qui n'atteint jamais le navigateur avant acquisition :

- **Tout résultat au grain adresse ou secteur** : zonage réglementaire au point, argiles à la
  parcelle, cavités et mouvements de terrain à 500 m, périmètre patrimonial, sismicité au point,
  distances et décomptes d'Autour, îlot de chaleur du secteur, nuisances, permis d'urbanisme,
  motorisation du secteur.
- **Tout ce qui touche au logement** : classe DPE, attribution, confort d'été, audit, surface,
  parcelle (numéro et contenance).
- **La hiérarchie et le verdict** : « En une minute », matérialité, contrôles prioritaires,
  compositions de faits liés.
- **Le croisement au projet** : correspondances, écarts, conditions, gestes par posture.
- **AskFuture**, les synthèses, l'export, les versions.

Ce qui reste gratuit parce qu'il l'est déjà ailleurs : les valeurs DRIAS d'une commune, son rang
national (hors milieu de distribution), son historique CatNat, la couverture de l'adresse.

---

## 14. Analyse du dossier exemple réel et anonymisé

### Est-ce plus convaincant que l'aperçu live actuel ?

Oui, et sur les trois questions du §2 à la fois pour la première. L'aperçu live actuel ne prouve
ni la forme (trois cartes génériques), ni la spécificité (identiques partout), ni la profondeur.
Un extrait réel montre les trois, dans le vrai rendu. Le prix devient jugeable.

### Réel ou fictif ?

**Réel.** Un exemple fictif présenté comme représentatif est un « résultat fictif présenté comme
réel » dès qu'il entre dans une décision d'achat (doctrine, §11 de la demande). Il ne pourrait pas
non plus montrer une limite authentique ni un « non déterminable » honnête : on écrirait les
défauts qu'on veut bien avoir. Le réel, lui, apporte ses défauts, ce qui oblige à le **relire** :
c'est une contrainte de production (§16), pas un argument contre.

### Peut-il devenir périmé, et comment rester fidèle au moteur ?

Le dépôt a déjà la réponse structurelle : `decision_artifact` fige ce qui a été vendu, avec
`engineVersion`, `generatedAt` et les dates de consultation des sources. Le dossier exemple doit
être **cet artefact**, exporté et nettoyé, pas une copie d'écran ni un texte réécrit.

| Mécanisme | Rôle |
|---|---|
| Snapshot versionné dans le dépôt (JSON) | L'exemple vit sans base, sans réseau, sans compte |
| `engineVersion` porté par le snapshot | Dit avec quelles règles il a été produit |
| Test de dérive : `snapshot.engineVersion === ENGINE_VERSION` | Quand une règle change ce que le moteur conclut, la CI rouge oblige à régénérer ou à assumer l'écart |
| Date de génération affichée sur l'exemple | « Dossier généré le … » : l'exemple ne prétend pas être d'aujourd'hui |
| Régénération par la même commande | Le script admin existant (`creer-dossier-demonstration.mjs`) produit le dossier ; un export nettoie |
| Rendu par les **composants du produit** | Fidélité visuelle garantie : l'exemple ne peut pas être plus beau que le produit |

Régénération automatique à chaque changement du moteur : **non**. L'exemple doit être relu par un
humain avant publication (défauts du §10, données personnelles du §15). La CI signale, l'humain
régénère.

---

## 15. Critères de choix de l'adresse exemple

L'adresse doit représenter **la proposition de valeur**, pas maximiser l'inquiétude.

| Critère | Pourquoi | Comment le vérifier |
|---|---|---|
| Les trois échelles parlent | Montrer la profondeur réaliste | Hub avec au moins un verdict, Autour avec ≥ 4 repères, Logement avec au moins un fait du bâti |
| Au moins un fait **prospectif** utile | La trajectoire est ce qu'aucun dossier notarial ne contient | Un indicateur DRIAS hors du milieu de distribution |
| Au moins un fait Autour **très concret** | La preuve que l'adresse est vraiment lue | Une distance, un îlot de chaleur, une nuisance ou un permis |
| Logement exploitable, **sans passoire spectaculaire** | Un compromis, pas une catastrophe | DPE C, D ou E attribuable ; ou périmètre patrimonial, argiles moyennes |
| Au moins une **limite ou un non-déterminable** | Démontrer l'honnêteté | Un « ne permet pas d'établir » réel dans le snapshot |
| **Aucun** défaut d'affichage connu | Un exemple défectueux discrédite tout | Relecture des défauts du §10 sur ce dossier précis |
| Aucune donnée personnelle | Voir §17 | Relecture dédiée |
| Commune de plus de 20 000 habitants | Rendre la ré-identification de l'adresse masquée improbable | INSEE |
| Sources stables | L'exemple ne doit pas se périmer en un mois | Préférer zonages, DRIAS, BPE ; éviter un permis en cours d'instruction |
| Hors littoral exposé, hors zone emblématique de catastrophe | Ne pas ouvrir sur un danger (invariant n°6, positionnement « choix de vie ») | Pas de Xynthia, pas de commune « vitrine du risque » |

Écartées pour cette raison : Châtelaillon (submersion, fixtures existantes mais récit d'alerte) et
Lège-Cap-Ferret (feu). La Rochelle (« 5 Rue du Palais ») convient au porteur pour se montrer le
produit, mais l'attribution du DPE y demande un choix parmi six diagnostics : utile pour éprouver
le produit, fragile comme exemple stable.

Le choix final revient au porteur, sur une courte liste produite par la procédure du §16.

---

## 16. Un exemple ou deux

**Tranché : une seule adresse, avec deux états de sa section Logement.**

- Deux dossiers complets doublent le coût de lecture, la maintenance et le risque de confusion,
  pour un gain que le visiteur ne demande pas.
- En revanche, montrer **seulement** un Logement riche serait une survente : quatre acheteurs sur
  cinq n'auront aucun diagnostic. La qualification sait déjà dans quel cas se trouve le visiteur
  (`profile: complete | sans_diagnostic | a_reverifier`).
- Donc : le snapshot exemple porte la section Logement **avec** le diagnostic attribué, et la même
  section produite par le même moteur **sans** diagnostic attribué (état réel du moteur, celui
  qu'un lecteur obtient en refusant les diagnostics proposés). L'écran montre celle qui correspond à
  la couverture **du visiteur**, et nomme l'autre en une ligne.

C'est utile commercialement : « voici à quoi ressemblera cette partie pour votre adresse » répond à
la déception avant qu'elle n'arrive, sans fabriquer de contenu.

---

## 17. Architecture : couches 1, 2 et 3

| Couche | Question du visiteur | Matière | Grain | Dépendance réseau | Verdict |
|---|---|---|---|---|---|
| **1. Dossier exemple permanent** | « Qu'est-ce que j'achète ? » | Extraits réels d'un dossier figé, autre adresse | Adresse exemple | Aucune | ✅ Retenue |
| **2. Signal sur la saisie du visiteur** | « futur•e a-t-il quelque chose à dire sur mon lieu ? » | Couverture + **un** fait communal + la question qu'il ouvre à l'adresse | Commune (le fait), adresse (la question) | Données locales ; sondes de couverture existantes | ✅ Retenue, bornée |
| **3. Structure complète** | « Jusqu'où va le dossier ? » | Échelles, sortes de constats, ce qui reste fermé | Aucun | Aucune | ✅ Retenue, réécrite |

Ordre recommandé sur l'écran : **2 puis 1 puis 3** (§25). La couche 2 répond à la question que le
visiteur vient de poser en saisissant son adresse ; la couche 1 lui montre ensuite à quoi
ressemble la réponse complète ; la couche 3 lui dit ce que son prix ouvre.

### Anonymisation de l'exemple

| Élément | Règle |
|---|---|
| Commune | **Affichée** (la trajectoire communale est publique, et l'exemple doit rester crédible) |
| Numéro et voie | **Masqués** : « une adresse de {commune}, secteur {nom de quartier ou d'IRIS} » |
| Coordonnées, parcelle | Jamais publiées |
| DPE | Classe affichée ; surface arrondie ou retirée ; date réduite à l'année ; identifiant jamais |
| Permis d'urbanisme | Nature et distance (« à moins de 50 m ») ; jamais la date de dépôt exacte ni la parcelle |
| Équipements nommés | Catégorie et distance ; **le nom d'un praticien ou d'un commerce est retiré** |
| Projet de l'exemple | Projet type, écrit pour l'exemple et présenté comme tel (« projet d'exemple : achat, priorités… ») |
| Compte | Compte de démonstration dédié, jamais un compte réel |
| Bien | Adresse choisie avec l'accord de son occupant, ou bien sans occupant identifiable ; décision du porteur (§31) |

Le danger réel n'est pas la commune, c'est la **combinaison** (classe DPE + surface + date + permis
voisin) qui ré-identifie un logement et peut peser sur sa valeur. D'où la commune de plus de
20 000 habitants et les arrondis.

---

## 18. Modèles de signal personnalisé A, B et C

| | Modèle A, couverture seule | Modèle B, une micro-preuve | Modèle C, un signal + couverture |
|---|---|---|---|
| Contenu | Ce qui sera examiné et ce qui manque | Un fait réel (« X jours de sols secs vers 2050 ») | Couverture + un fait communal + la question à l'adresse |
| Compréhension | Faible | Moyenne | Forte |
| Confiance | Moyenne (honnête, mais déclaratif) | Forte | Forte |
| Envie d'aller plus loin | Faible | Forte si le fait est distinctif | Forte, et **décisionnelle** (« ça se joue sur X à votre adresse ») |
| Risque de donner trop | Nul | Faible au grain commune ; **élevé** au grain adresse | Faible si le fait reste communal |
| Risque de paraître creux | Élevé (c'est l'état actuel) | Faible | Faible |
| Risque anxiogène | Nul | Réel si le fait est choisi pour alarmer | Maîtrisé par la règle de choix (position, pas danger) |
| Coût cognitif | Bas | Bas | Moyen |
| Robustesse technique | Forte | Forte si local | Forte si local |

**Recommandation : modèle C**, avec ces bornes :

- **Un seul signal.** Pas deux, pas trois : au-delà, le visiteur lit un aperçu de dossier et la
  tension retombe (« merci, j'ai compris »).
- **Grain commune uniquement**, issu des données locales (DRIAS + rang national), déjà gratuites
  sur les pages commune.
- **Choisi par la position, jamais par le danger** : l'indicateur où la commune est la plus
  distinctive au national (percentile ≤ 25 ou ≥ 75, règle du rang national). Au milieu de la
  distribution sur tout, **pas de signal** : la couverture seule (modèle A). Le silence est
  l'information honnête.
- **Interprétation autorisée : aucune au-delà de la position.** Le signal dit une valeur, un
  horizon, un scénario, une source et un rang. Il ne dit jamais ce que cela fait au bien.
- **La phrase suivante est une question, jamais une implication** : « Ce que ce signal ne dit pas,
  c'est s'il concerne ce bien. Le dossier lit, au point de l'adresse, … » (table ci-dessous).
- **Autour** : aucun résultat avant paiement. Ni distance, ni décompte, ni îlot de chaleur.
- **Logement** : la **disponibilité** seulement, avec une formulation corrigée (« trouvé à
  l'adresse » ≠ « attribuable au logement »). Jamais la classe.

| Indicateur communal distinctif | Question que le dossier tranchera à l'adresse |
|---|---|
| Sols secs (SWI) | L'exposition de la parcelle au retrait-gonflement des argiles |
| Jours chauds, nuits chaudes | La chaleur du secteur (îlot de chaleur) et, si un diagnostic est rattaché, le confort d'été du logement |
| Pluies intenses, CatNat inondation | Le zonage réglementaire au point de l'adresse et les sinistres indemnisés autour |
| Conditions favorables au feu | La position de l'adresse par rapport aux zones boisées et aux obligations de débroussaillement, quand la donnée existe |

La table ne relie un signal communal qu'à une **lecture que le dossier fait réellement**. Elle
n'affirme aucune causalité ; elle nomme l'inconnue.

---

## 19. Frontière gratuit, démonstration, personnalisé, payant

### Gratuit (toute surface publique)

Les valeurs DRIAS d'une commune, avec horizon et scénario ; son rang national hors du milieu ;
son historique CatNat ; la structure du dossier ; la couverture d'une adresse (présence d'un
diagnostic, d'une parcelle) ; le refus de vente quand le bien n'est pas identifiable.

### Démonstration (dossier exemple, autre adresse)

Des extraits **complets dans leur forme** : un verdict « En une minute » avec ses contrôles
prioritaires ; une carte par échelle (constat, preuve, limite, contrôle) ; un « non déterminable »
réel ; la section Logement dans l'état qui correspond à la couverture du visiteur ; la date de
génération et la version. Tronqués par la structure (trois ou quatre cartes, pas le dossier
entier), jamais par le flou.

### Personnalisé mais limité (adresse saisie)

L'identification du bien ; la couverture, corrigée ; **un** fait communal distinctif, sourcé, daté,
positionné ; la question que le dossier tranchera à cette adresse ; le prix exact (déduction
comprise).

### Payant (n'atteint jamais le navigateur avant acquisition)

Tout ce que liste le §13. Garantie technique, déjà en place et à maintenir : la route publique de
qualification ne lance **aucun** fan-out de risques et ne renvoie que des états de matière. Le
signal communal se calcule sur les données locales, jamais sur Géorisques au point.

### Les deux extrêmes évités

- **Trop fermé** (« faites-nous confiance ») : l'exemple et le signal y mettent fin.
- **Trop ouvert** (« le diagnostic est donné, payez 39 € ») : rien au grain adresse ou secteur, un
  seul fait communal, aucune hiérarchie, aucun croisement au projet.

---

## 20. Architecture technique possible de l'aperçu

| Option | Pour | Contre | Verdict |
|---|---|---|---|
| Relever le timeout (1,2 → 3 s) | Une ligne | Allonge le rendu de toute la page ; ne règle ni le contenu générique ni le cas DRIAS à froid | 🗑️ Rejetée |
| Timeout par source | Une source lente n'emporte plus les autres | Le contenu reste générique ; garde le fan-out | 🔧 Utile en second plan seulement |
| **Streaming (`<Suspense>` + squelette)** | La page s'affiche tout de suite ; le bloc arrive quand il est prêt, ne disparaît plus | Un squelette visible quelques centaines de ms | ✅ Retenue (documenté dans la doc Next 16 du dépôt, `01-getting-started/06-fetching-data.md`) |
| **Données locales seulement** (DRIAS + rang) | Aucune dépendance réseau ; spécifique au lieu | Lecture à froid du fichier DRIAS (0,7 à 0,9 s) | ✅ Retenue |
| Index allégé précalculé (quelques indicateurs × 35 006 communes, découpé par département) | Supprime la lecture des 63 Mo | Une étape de build et un artefact de plus | 🔧 Seconde étape, si la mesure le justifie |
| `use cache` / `cacheLife` | Natif | Demande d'activer Cache Components, changement global non trivial | ⏸️ Hors périmètre |
| Snapshot statique permanent | Robustesse totale | Ne parle pas de la commune du visiteur | ✅ Pour le dossier exemple, pas pour le signal |
| Stale-while-revalidate sur l'enrichissement réseau | Lissage | Ajoute un cache pour une donnée dont l'aperçu n'a plus besoin | ⏸️ Inutile si l'aperçu devient local |

**La démonstration commerciale doit-elle dépendre d'un fan-out d'API externes ? Non.** Le code le
confirme de trois façons : la carte climat, dont la donnée est locale, disparaît à cause des
autres ; le contenu affiché n'utilise aucune valeur des sources réseau (il ne teste que leur
présence) ; et le produit payé lui-même met 40 à 60 s à son premier chargement. Rien de ce qui doit
convaincre ne doit attendre un service tiers.

---

## 21. FUT-30 : correction cible recommandée

**Cible** : sur `/territoire/[insee]/debloquer`, l'aperçu ne disparaît jamais, et il dit quelque
chose de propre à la commune.

1. **Contenu** (🔄 à reconstruire) : remplacer les trois textes génériques par des faits réels
   communaux tirés des données locales, au format des pages commune : une ou deux positions
   nationales distinctives (`getRangNational`, silence au milieu), avec valeur, horizon, scénario et
   source ; la frise CatNat en version réduite si elle est disponible localement. C'est la preuve
   que le « Pourquoi ce dossier est payant ? » de la même page invoque.
2. **Rendu** (🔧) : le bloc passe dans une frontière `<Suspense>` avec un squelette ; la page ne
   l'attend plus ; le `null` de timeout disparaît. Si, après DRIAS, aucune position n'est
   distinctive, le bloc dit la trajectoire de la commune sans rang, il ne se masque pas.
3. **Réseau** (🗑️) : l'aperçu n'appelle plus `gatherCommuneEnrichment`. La ligne « Sources
   mobilisées » liste ce qui a réellement servi.
4. **Texte** (🔧) : « La Rochellesera », « 34 000 » insécable ; garder le titre « Ce que futur•e a
   déjà analysé sur {commune} » seulement si le contenu est désormais propre à la commune.
5. **Tests** : l'aperçu de deux communes distinctes diffère ; une commune au milieu de toutes les
   distributions ne reçoit aucune phrase de position ; le bloc est présent quand une source réseau
   est en panne ; aucune phrase n'affirme un historique CatNat quand `total === 0`.

FUT-30 **reste un ticket séparé** : Urgent, court, sans dépendance, et premier bénéficiaire de la
règle « rien ne dépend du réseau ». La règle du signal communal qu'il implémente sera réutilisée
par FUT-14A.

---

## 22. FUT-14 : cible recommandée

**Cible** : sur le parcours du Dossier d'adresse, un visiteur comprend ce qu'il achète, voit que
futur•e a quelque chose à dire sur son lieu, et sait ce que 39 € ouvre, avant de créer un compte.

| Partie | Contenu | Dépend du Projet ? |
|---|---|---|
| **14A-1** Dossier exemple | Sélection, génération, nettoyage, snapshot, test de dérive | Non |
| **14A-2** Écran `/dossier` | Signal communal + exemple + structure ; couverture corrigée | Non |
| **14A-3** Continuité | Connexion contextuelle (fin du « Bon retour » pour un nouveau visiteur), rappel sur `/checkout/dossier` | Non |
| **14B** Triptyque relié au Projet | Correspondance / contradiction / inconnue au regard des priorités déclarées, avant paiement | **Oui** (FUT-9 / FUT-10) |

---

## 23. Dépendances FUT-9 / FUT-10 réellement nécessaires

Le blocage actuel tient au mot « relier la preuve au Projet ». Ce qui en dépend vraiment :

- **Correspondance et contradiction** (deux tiers du triptyque du 10/08) : elles n'existent que par
  rapport à une priorité déclarée. Sans Projet, il n'y a ni « répond à », ni « s'écarte de ».
- **Les gestes par posture** (achat, location, habitant) : la posture appartient au candidat, et
  le parcours ne l'écrit pas encore (constat du 16/09).
- **La hiérarchie personnalisée** des signaux.

Ce qui n'en dépend pas : l'exemple (son projet est un projet type, présenté comme tel), le signal
communal (choisi par la position nationale, valable pour tout lecteur), la structure, la frontière,
la robustesse de l'aperçu, la continuité de connexion.

**Les blockers FUT-9 / FUT-10 peuvent être levés pour FUT-14A ; ils restent pour FUT-14B.**

---

## 24. Proposition de découpage Linear (sans modifier Linear)

| Ticket | Proposition | Priorité suggérée | Blockers |
|---|---|---|---|
| **FUT-30** | Reformulé : « L'aperçu du dossier de territoire ne disparaît plus et montre la position réelle de la commune » | Urgent (inchangé) | Aucun |
| **FUT-14** | Scindé : garder FUT-14 comme parent, ou le renommer en 14A | High | Voir les lignes suivantes |
| **FUT-14A** | « Avant de payer le dossier d'adresse : un exemple réel, un signal sur la commune, ce que 39 € ouvre » | High | **Retirer** FUT-9 / FUT-10 ; dépend du ticket exemple |
| **Nouveau : dossier exemple** | « Produire, anonymiser et versionner un dossier exemple réel, avec garde de dérive » | High, prérequis de 14A | Décisions du porteur (§31) |
| **FUT-14B** | « Avant paiement, relier la preuve aux priorités déclarées (triptyque du 10/08) » | Medium | FUT-9 / FUT-10 |

Tickets annexes découverts, hors de ce chantier, à créer séparément si le porteur le souhaite :

1. Connexion depuis le checkout : « Bon retour, votre dossier vous attend » servi à un visiteur
   sans compte.
2. Questionnaire de l'accueil : retirer le score /100 et les deux faux « points d'attention
   verrouillés » ; CTA sans INSEE.
3. Qualification : « disponible » confond diagnostic trouvé et attribuable ; « Restent lus » sans
   manque.
4. Autour : motorisation communale présentée comme celle du secteur ; agence classée « banque ».
5. Logement : valeurs de l'audit énergétique non formatées et d'unité suspecte.
6. Territoire : « 20 fois… surtout inondations » contre « 0 arrêté inondation ».
7. Premier chargement des modules de 40 à 60 s (et région des fonctions Preview à vérifier).
8. Grille tarifaire de l'accueil : « confort d'été » promis sans la condition du diagnostic.

---

## 25. Parcours cible avant paiement (Dossier d'adresse)

L'hypothèse de départ plaçait l'exemple avant le signal. L'audit conduit à l'inverser, et à ne pas
tout mettre au même niveau.

```text
1. Je saisis mon adresse                                   /dossier
   (un lien discret sous le champ : « Voir un extrait réel de dossier » → /dossier/exemple)

2. futur•e identifie le bien et dit ce qu'il pourra lire    /dossier, bloc « Votre adresse »
   · couverture corrigée
   · UN fait communal distinctif, sourcé, positionné (ou rien, au milieu)
   · la question que le dossier tranchera à cette adresse

3. Je vois à quoi ressemble la réponse complète             /dossier, bloc « Exemple »
   · changement de contexte explicite : une autre adresse
   · verdict « En une minute » + une carte par échelle
   · la section Logement dans l'état de MA couverture

4. Je vois ce que 39 € ouvre pour mon adresse              /dossier, bloc « Ce que vous ouvrez »
   · les lectures à l'adresse, nommées ; rien de leur résultat
   · prix, déduction, une phrase sur la version datée

5. Je crée mon compte, sans quitter mon adresse des yeux    /inscription contextuelle
6. Je paie, avec le rappel de la couverture                 /checkout/dossier
```

**Pourquoi le signal avant l'exemple** : le visiteur vient de poser une question sur **son** lieu.
Lui répondre d'abord sur un autre lieu ressemblerait à un détour commercial. Une fois sa question
honorée (même partiellement), l'exemple répond à la suivante : « et le dossier complet, il
ressemble à quoi ? ».

**Pourquoi un lien vers l'exemple avant la saisie** : une partie des visiteurs veut juger avant de
donner une adresse. Le lien leur suffit ; un exemple complet au-dessus du champ ferait passer la
saisie, qui est l'action principale, au second plan.

**Pourquoi le même écran** : chaque écran supplémentaire avant la caisse coûte des visiteurs, et le
retour d'expérience du 16/08 montre un parcours déjà vécu comme trop court en preuve, pas trop long.
Le bloc exemple reste replié au-delà de ses trois cartes.

---

## 26. Maquette textuelle détaillée

Écran `/dossier`, état après qualification réussie. Les textes entre accolades sont des variables.
Tous les textes sont proposés, pas validés : ils passent par l'Editorial avant implémentation.

```text
────────────────────────────────────────────────────────────────────────────
UNE ADRESSE PRÉCISE
Quel bien voulez-vous faire examiner ?
[ {adresse saisie} ]  · adresse identifiée · modifier
────────────────────────────────────────────────────────────────────────────

BLOC A · surface habituelle des cartes réponse
──────────────────────────────────────────────
VOTRE ADRESSE · {adresse saisie}

Nous savons de quel bien il s'agit.

  DÉJÀ VISIBLE, À L'ÉCHELLE DE {COMMUNE}                 ← surtitre
  {Commune} compte parmi les {N} % de communes françaises
  où {indicateur} est le plus {élevé|faible} vers 2050 :
  {valeur} {unité} par an, contre {valeur de référence} sur 1976-2005.
  DRIAS · Météo-France · scénario France +2,7 °C · position parmi 35 006 communes

  Ce que ce signal ne dit pas, c'est s'il concerne ce bien.
  Le dossier lit, au point de l'adresse, {question de la table §18}.

  [variante au milieu de toutes les distributions : ce sous-bloc est absent]

  CE QUE NOUS POURRONS LIRE À CETTE ADRESSE
  · Territoire · {commune}           la trajectoire climatique et ce que la commune a déjà connu
  · Autour · le voisinage            ce qui est à portée de pas, la chaleur du secteur,
                                     ce qui est autorisé à construire autour
  · Logement · le bâtiment           {état de couverture corrigé, voir ci-dessous}

  Logement, trois formulations selon la couverture :
  · diagnostic attribuable  → « Un diagnostic énergétique décrit ce logement. »
  · diagnostics à départager → « {n} diagnostics existent à cette adresse ; vous choisirez celui
                                 qui décrit ce logement, le dossier n'en déduit aucun. »
  · aucun diagnostic        → « Aucun diagnostic n'est rattaché à cette adresse. Ce dossier ne
                                 qualifiera donc ni la performance énergétique ni le confort d'été
                                 de ce logement. C'est le cas de la plupart des adresses. »

BLOC B · surface distincte (fond plus clair, filet latéral, étiquette répétée)
──────────────────────────────────────────────
┃ EXEMPLE · UNE AUTRE ADRESSE QUE LA VÔTRE
┃ Un dossier réel, ouvert sur une adresse de {commune exemple}.
┃ Rien de ce bloc ne concerne {adresse saisie}.
┃
┃ Pour juger sur pièce : voici trois extraits, tels qu'un acheteur les lit.
┃ Dossier généré le {date} · projet d'exemple : {projet type, une phrase}
┃
┃  ┌ EXEMPLE · EN UNE MINUTE ──────────────────────────────────────────┐
┃  │ {verdict réel de l'exemple}                                         │
┃  │ À contrôler en priorité : {geste 1} · {geste 2}                     │
┃  │ Non couvert : {ce que le dossier exemple n'a pas pu établir}        │
┃  └─────────────────────────────────────────────────────────────────────┘
┃  ┌ EXEMPLE · AUTOUR ─────────────────────────────────────────────────┐
┃  │ CONSTAT    {fait réel, sans nom propre}                              │
┃  │ CE QUE ÇA CHANGE  {phrase réelle du dossier}                         │
┃  │ LIMITE     {limite réelle du dossier}                                 │
┃  │ À VÉRIFIER {geste réel}                                               │
┃  │ Source · date                                                         │
┃  └─────────────────────────────────────────────────────────────────────┘
┃  ┌ EXEMPLE · LOGEMENT · {état qui correspond à VOTRE couverture} ────┐
┃  │ (avec diagnostic) classe, ce qu'elle implique, ce qui reste à voir  │
┃  │ (sans diagnostic) ce que la section dit, et ce qu'elle lit quand même│
┃  │ « Pour une adresse {avec|sans} diagnostic, cette section ressemble à │
┃  │   ceci. Votre adresse est dans ce cas. »                             │
┃  └─────────────────────────────────────────────────────────────────────┘
┃
┃  [ Lire l'extrait complet de l'exemple → /dossier/exemple ]
┃
┃ FIN DE L'EXEMPLE
──────────────────────────────────────────────

BLOC C · retour à la surface « Votre adresse »
──────────────────────────────────────────────
POUR {ADRESSE SAISIE}

Le dossier établira, à cette adresse, ce que l'exemple ci-dessus établit à la sienne :
ce qui pèse sur le bien, ce qui l'entoure, ce que la commune devient, avec pour chaque
constat sa source, sa limite et le contrôle à mener avant de vous engager.

  🔒 Le verdict en tête, et les contrôles prioritaires        (fermé)
  🔒 {n lectures} au point de l'adresse et autour              (fermé, nommées sans résultat)
  🔒 Le diagnostic et ce qu'il permet de conclure              (selon couverture)

Une version datée, à rouvrir et compléter au fil de votre recherche.

{39 €}  {ou 25 €, 14 € déjà déduits}  · une fois, pour ce bien
[ Ouvrir le dossier de ce bien ]
TVA non applicable, art. 293 B du CGI
────────────────────────────────────────────────────────────────────────────
```

### Microcopy qui empêche toute confusion

- L'étiquette « EXEMPLE · UNE AUTRE ADRESSE QUE LA VÔTRE » ouvre le bloc et chaque carte porte
  « EXEMPLE » en surtitre : une carte isolée par capture d'écran reste identifiable.
- L'adresse du visiteur **n'apparaît jamais** à l'intérieur du bloc B ; la commune exemple
  n'apparaît jamais dans les blocs A et C.
- Le bloc B a une surface visuelle propre (fond, filet), et se ferme par « FIN DE L'EXEMPLE ».
- Les verbes du bloc B sont au passé ou au présent de l'exemple (« ce dossier a établi ») ; ceux
  du bloc C au futur du visiteur (« le dossier établira »).
- Si la commune saisie est la commune exemple : le bloc B le dit (« l'exemple est pris dans la
  même commune que vous, sur une autre adresse »), et le signal du bloc A ne reprend pas un chiffre
  déjà montré dans l'exemple.

### Écran de connexion depuis le parcours (14A-3)

```text
POUR OUVRIR LE DOSSIER DE {ADRESSE SAISIE}
Créez votre espace, il conservera ce dossier et ses versions.
[ Continuer avec Google ]      [ Créer un compte ]
Vous avez déjà un compte ? Se connecter
```

### Page `/dossier/exemple`

Le même dossier exemple, plus long (cinq à huit cartes, la frise CatNat, la liste « à vérifier »),
toujours sous l'étiquette d'exemple, avec en tête la date, la version du moteur, la règle
d'anonymisation en une phrase, et un champ « Examiner votre adresse » en bas.

---

## 27. Risques UX, commerciaux et doctrinaux

| Risque | Gravité | Parade |
|---|---|---|
| Le visiteur croit que l'exemple parle de son adresse | Critique | Microcopy du §26, surface distincte, test qui vérifie l'absence de l'adresse saisie dans le bloc |
| L'exemple survend (Logement riche, alors que l'adresse n'a pas de DPE) | Élevée | Logement dans l'état de la couverture du visiteur (§16) |
| Le signal communal est lu comme un verdict sur le bien | Élevée | Grain annoncé en surtitre ; phrase suivante = question, jamais implication |
| Le signal choisi alarme | Moyenne | Choix par la position, pas par le danger ; jamais de « nettement exposée » ; Editorial |
| L'exemple paraît « trop beau », donc publicitaire | Moyenne | Il porte un « non déterminable » réel et sa date |
| L'exemple ré-identifie un logement | Élevée | Anonymisation du §17, commune > 20 000 habitants, accord du porteur |
| Trop d'information avant le prix, la tension retombe | Moyenne | Un seul signal ; exemple limité à trois cartes, le reste replié |
| Le signal devient une surface SEO doorway | Faible tant que `Disallow: /` | `/dossier` reste une page de parcours, sans génération par adresse |
| Le visiteur ne lit pas l'exemple | Moyenne | Mesure (§29) ; s'il n'est pas lu, il ne coûte rien |

Doctrine vérifiée point par point : pas de score composite ; source, période et échelle visibles ;
fait ≠ position ≠ interprétation (le signal s'arrête à la position) ; absence ≠ zéro (silence au
milieu) ; donnée indisponible ≠ absence du phénomène (couverture « non vérifiable à l'instant ») ;
aucune causalité inventée (la table du §18 nomme une lecture, pas un effet) ; aucun résultat fictif
(exemple réel, projet type déclaré) ; rien du commune attribué au logement.

---

## 28. Risques techniques

| Risque | Parade |
|---|---|
| Lecture à froid de DRIAS (0,7 à 0,9 s, davantage sur une fonction) | Streaming ; index allégé en seconde étape |
| Dérive entre l'exemple et le moteur | Test `engineVersion` ; régénération par commande ; relecture |
| L'exemple embarque un défaut d'affichage du produit | Relecture dédiée ; corriger les défauts du §10 avant de figer |
| Rendu de l'exemple par des composants qui attendent un compte ou un `dossierId` | Composants de présentation alimentés par le snapshot, comme `/dev/dossier` le fait déjà |
| Le signal communal fuit une valeur payante | Il n'utilise que DRIAS et le rang national, déjà publics sur les pages commune |
| La route de qualification grossit vers un fan-out | Règle écrite : aucune source de risque au point dans une route publique |
| Le bloc exemple alourdit `/dossier`, page prérendue | Snapshot importé statiquement ; aucune requête au rendu |

---

## 29. Tests futurs nécessaires

**Tests de vérité** (la règle du dépôt : « la carte apparaît » et « la carte dit vrai » sont deux
assertions distinctes) :

1. Deux communes distinctes produisent deux aperçus Territoire différents.
2. Une commune au milieu de toutes les distributions ne reçoit aucune phrase de position, et le bloc
   reste présent.
3. Le bloc Territoire est présent quand toutes les sources réseau sont en panne.
4. Aucune phrase d'aperçu n'affirme un historique CatNat quand `total === 0`.
5. Le bloc exemple ne contient jamais l'adresse saisie ; les blocs A et C ne contiennent jamais la
   commune exemple (sauf commune identique, cas annoncé).
6. Le snapshot exemple porte `engineVersion === ENGINE_VERSION`.
7. Le snapshot ne contient ni numéro de voie, ni coordonnées, ni parcelle, ni identifiant DPE, ni
   nom de praticien ou de commerce (liste de champs interdits vérifiée par test).
8. La section Logement de l'exemple affichée correspond au profil de couverture du visiteur.
9. Le signal communal cite source, scénario, horizon et rang ; la phrase suivante ne contient aucun
   verbe d'effet sur le bien (liste de formulations interdites, patron `FORMULATIONS_INTERDITES`).
10. La route de qualification ne renvoie toujours que des états de matière.

**Mesure produit** (PostHog, événements à ajouter) : `dossier_example_viewed`,
`dossier_example_expanded`, `dossier_signal_shown` (avec la raison d'absence),
`dossier_example_page_viewed`, à relier à `address_checkout_viewed` et au paiement.

**Test humain**, le seul qui tranche : dix à vingt inconnus, une question avant paiement
(« qu'allez-vous recevoir pour 39 € ? ») et le critère de mort du pari du 10/08 (`vault/paris.md`) :
si les lecteurs décrivent encore « une IA qui rédige » devant l'exemple, la différenciation se
cherche ailleurs.

---

## 30. Plan d'implémentation en phases

| Phase | Contenu | Ticket | Prérequis |
|---|---|---|---|
| **1** | Aperçu Territoire local et streamé, faits réels de position, deux corrections de texte, tests de vérité 1 à 4 | FUT-30 | Aucun |
| **2** | Choix de l'adresse exemple (courte liste, décision du porteur), compte de démonstration, génération par le script admin, export nettoyé, relecture, snapshot versionné, tests 6 et 7 | Nouveau ticket « dossier exemple » | Décisions §31 |
| **3** | Écran `/dossier` : bloc A (couverture corrigée + signal), bloc B (exemple), bloc C ; page `/dossier/exemple` ; tests 5, 8, 9 ; événements PostHog | FUT-14A | Phases 1 et 2 |
| **4** | Connexion contextuelle depuis le parcours ; rappel de couverture et lien vers l'exemple sur `/checkout/dossier` | FUT-14A | Phase 3 |
| **5** | Test humain (dix à vingt inconnus), lecture des événements | Aucun ticket de code | Phase 4 en production |
| **6** | Triptyque relié aux priorités déclarées, avant paiement | FUT-14B | FUT-9 / FUT-10 |

Chaque phase est livrable seule. La phase 1 améliore le 14 € même si le reste n'est jamais fait.

---

## 31. Recommandation finale

| # | Question | Réponse |
|---|---|---|
| 1 | Faut-il un dossier exemple ? | **Oui.** Rien d'autre ne montre la forme du produit sans le donner. |
| 2 | Réel ou fictif ? | **Réel**, produit par le moteur normal, figé en `decision_artifact`, nettoyé, relu. Projet type déclaré comme tel. |
| 3 | Une ou deux adresses ? | **Une**, avec deux états de la section Logement (avec et sans diagnostic). |
| 4 | Adresse complète ou anonymisée ? | **Anonymisée** : commune visible, numéro et voie masqués, secteur nommé, détails arrondis (§17). |
| 5 | Sur quel écran ? | `/dossier`, après la qualification ; lien avant saisie ; page `/dossier/exemple` ; lien depuis le checkout. |
| 6 | Avant ou après la qualification ? | **Après** pour la version intégrée ; accessible avant par un lien. |
| 7 | Combien de résultats propres à l'adresse du visiteur ? | **Un** fait, au grain commune. **Zéro** au grain adresse ou secteur, hors la couverture. |
| 8 | Lesquels ? | L'indicateur DRIAS où la commune est la plus distinctive au national (hors 25-75 %), avec valeur, horizon, scénario, source, rang ; rien au milieu. |
| 9 | Que doit montrer Territoire ? | Avant paiement : ce fait communal ; dans l'exemple : la trajectoire et la frise CatNat. |
| 10 | Que doit montrer Autour ? | Avant paiement : rien de l'adresse du visiteur ; dans l'exemple : une carte complète (constat, conséquence, limite, geste). |
| 11 | Que doit montrer Logement ? | Avant paiement : la disponibilité, formulée sans confusion ; dans l'exemple : la section dans l'état de la couverture du visiteur. |
| 12 | Que reste-t-il strictement payant ? | Tout le grain adresse et secteur, tout le logement, le verdict et la hiérarchie, le croisement au projet, AskFuture, les versions (§13). |
| 13 | Que devient le preview live de FUT-30 ? | Il devient local et streamé, et montre des faits de position réels ; il ne dépend plus du fan-out. |
| 14 | FUT-30 reste-t-il séparé ? | **Oui**, Urgent, premier lot. |
| 15 | Que devient FUT-14 ? | Scindé en **14A** (maintenant) et **14B** (après le Projet). |
| 16 | Faut-il un nouveau ticket pour l'exemple ? | **Oui**, prérequis de 14A : il porte des décisions de données et de consentement qui ne sont pas de l'écran. |
| 17 | Qu'est-ce qui se construit malgré FUT-9 / FUT-10 ? | FUT-30, l'exemple, le signal communal, l'écran `/dossier`, la continuité de connexion. |
| 18 | Premier lot d'implémentation ? | **FUT-30** (phase 1). En parallèle, la décision du porteur sur l'adresse exemple pour lancer la phase 2. |

### Typologie des conclusions

| Élément | Verdict |
|---|---|
| Qualification avec refus de vente, couverture « le manque avant ce qui reste » | ✅ À conserver |
| Interdit « aucune valeur à l'adresse avant paiement » | ✅ À conserver, **borné au grain adresse et secteur** |
| Aperçu réel tronqué par la structure du Dossier comparatif | ✅ À conserver, modèle à réutiliser |
| Rang national gratuit, silence au milieu | ✅ À conserver, à porter sur les paywalls |
| `CeQueLeDossierExamine` sur le checkout | ✅ À conserver |
| Formulation « Diagnostic énergétique · disponible », « Restent lus » | 🔧 À corriger |
| Connexion « Bon retour » servie à un nouveau visiteur | 🔧 À corriger |
| `quartier-preview.ts` (contenu générique, fan-out, timeout global) | 🔄 À reconstruire |
| Avant-paiement du Dossier d'adresse (aucune preuve de forme) | 🔄 À reconstruire (exemple + signal) |
| Score /100 et faux verrous du questionnaire | 🗑️ À supprimer |
| Relever le timeout à 3 s | 🗑️ Rejeté |
| Triptyque relié au Projet | ⏸️ À attendre (FUT-9 / FUT-10) |
| Refonte du questionnaire de l'accueil | ⏸️ À attendre (Projet) |
| `use cache`, index DRIAS allégé | ⏸️ Seconde étape, sur mesure |

### Décisions qui demandent la validation du porteur

1. **L'adresse exemple** et son **modèle de consentement** : adresse d'un occupant qui accepte,
   bien sans occupant identifiable, ou autre. Aucune adresse n'est retenue dans cet audit.
2. **Afficher la commune de l'exemple** (recommandé) ou la masquer aussi.
3. **La règle du signal communal** : un seul indicateur, choisi par la position nationale, silence
   au milieu ; et le fait de montrer **une valeur et un rang** sur `/dossier` (cohérent avec les
   pages commune, mais nouveau sur le parcours d'achat).
4. **Les deux états du Logement** dans l'exemple (avec et sans diagnostic).
5. **L'ordre** signal → exemple → ce que 39 € ouvre, sur le même écran.
6. **Le découpage Linear** proposé au §24, dont le retrait des blockers FUT-9 / FUT-10 pour 14A.
7. **FUT-30 montre des chiffres** (positions réelles), ce qui revient sur le « pas de chiffre dans
   l'aperçu » du 07/06.
8. **Le sort du score /100** du questionnaire (recommandé : suppression, ticket séparé).
9. **Les textes** de la maquette, à faire relire par l'Editorial avant implémentation.
