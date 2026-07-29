# Passation : refonte du langage visuel, séquencée par le porteur

**Horodatage** : 2026-07-29 · **Branche** : `main` · **Chantier parallèle** : ce fichier ne concerne
PAS les dossiers d'adresse (voir `docs/handoff/CURRENT.md`). Les deux avancent en parallèle, dans
deux terminaux distincts. Aucun fichier produit n'a été modifié par ce chantier à ce jour.

---

## Objectif en cours

Écrire un `DESIGN.md` **prescriptif** pour futur•e, qui ne canonise pas les choix accidentels de
l'interface actuelle. `/impeccable document` a été **écarté par le porteur** : documenter l'existant
comme autorité graverait les signatures d'interface générée par IA que le chantier vise à éliminer.
La séquence ci-dessous est un **arbitrage du porteur**, pas une proposition.

---

## Fait

1. **`PRODUCT.md` créé** à la racine (schéma `impeccable:product-schema 1`). Vérité produit
   uniquement, aucune décision visuelle. Trois réponses tranchées par le porteur y sont inscrites :
   - **Lecteur primaire** : la personne qui doit prendre une décision résidentielle concrète à
     partir de son projet de vie, du large au précis (plusieurs territoires → une commune → un bien).
     L'habitant curieux de son lieu actuel est secondaire. Le professionnel n'est **pas** le lecteur
     de référence du B2C.
   - **Accessibilité** : WCAG 2.2 AA comme **plancher de conception**, sans engagement public ni
     audit, donc **aucune déclaration de conformité à afficher**.
   - **Preuves mobilisables** : les **données publiques seules** et les caractéristiques réellement
     observables du produit. Aucun témoignage, aucun chiffre d'usage, aucune presse, même si le site
     est en ligne. Règle d'ouverture future inscrite : un chiffre d'usage ne se cite que s'il est
     daté, défini, vérifiable dans l'analytics et non trompeur.
2. **`.impeccable/live/config.json` créé** (Next.js App Router, `src/app/layout.tsx`, `cspChecked`,
   aucune CSP détectée dans le projet).
3. **Audit comparatif écrit** : `docs/audits/2026-07-29-accueil-rapport-territoire.md`. Lecture seule
   de la page d'accueil et du Rapport Territoire, avec pour chaque surface : le cohérent, les
   signatures d'IA, les problèmes de hiérarchie, les composants à conserver, ceux à ne jamais
   documenter. Puis comparaison et trois directions visuelles.

**Fichiers non commités à ce jour** : `PRODUCT.md`, `docs/audits/2026-07-29-accueil-rapport-territoire.md`,
`.impeccable/live/config.json`. Plus `Futur.e Design System.zip` (untracked, antérieur). Ce fichier,
lui, est passé en dépôt avec le lot de l'étape 2.

---

## Décisions du porteur

### 1. L'arbitrage visuel est retenu

**A comme charpente, B comme vocabulaire de la donnée, C comme registre éditorial.**

- **A, le dossier d'instruction** : le rapport d'expertise remis avant une signature. Filet et marge
  comme unités de séparation, une seule surface élevée par écran, colonne de lecture fixée et le
  reste de la page aligné sur elle, métadonnées en marge latérale, numérotation citable.
- **B, l'instrument de mesure** : grille visible, valeurs alignées au chiffre (mono tabulaire),
  signal porté par position et longueur plutôt que par fond de carte, échelle qui montre le normal,
  l'extrême **et l'inconnu**.
- **C, la lettre du territoire** : la prose mène, les faits arrivent dans le fil, les cartes
  deviennent des planches rares et larges.

Motif de la combinaison : A tranche la structure et la largeur de lecture, problème le plus urgent et
déjà documenté en commentaire dans `DossierDecisionSection` ; B fournit la manière de dessiner
trajectoire et incertitude, seule chose que futur•e vend vraiment ; C existe déjà dans la voix et
demande d'être protégée, pas conquise. **Choisir C seule serait le piège** : marque belle, dossier
illisible.

### 2. « Disponible » doit signifier achetable ET livré

Correction demandée dans `PRODUCT.md`, plus fine que ce qui y est écrit aujourd'hui. Le checkout
central (`src/lib/checkout-products.ts`) ne câble que le Rapport Territoire. Quatre états, pas trois :

| État | Offre | Prix |
| --- | --- | --- |
| **Achetable actuellement** | Rapport Territoire | 14 € |
| **Présenté dans l'interface, pas livré de bout en bout** | Pack Décision | 39 € |
| **Décidé, en construction** | Dossier Adresse | 39 € |
| **Écarté** | Le Fil payant, plan Foyer, abonnement mensuel | — |

**La coexistence de deux offres à 39 € n'est pas un problème à résoudre par le prix.** Le Pack
**élargit** la recherche entre plusieurs territoires ; le Dossier Adresse **approfondit** un lieu
précis. À écrire ainsi dans `PRODUCT.md`, en remplacement de la note « point à trancher » qui y
figure actuellement.

### 3. `DESIGN.md` ne s'écrit pas sur deux tiers du produit

La famille éditoriale (Explorer, Savoir, Agir) est **une partie centrale de futur•e, pas du contenu
secondaire**. Elle doit entrer dans l'audit avant que `DESIGN.md` soit rédigé.

---

## Séquence de travail, dans cet ordre

### Étape 1 · Corriger la vérité produit dans `PRODUCT.md`

Appliquer la table à quatre états ci-dessus, et la formulation Pack (élargir) / Dossier Adresse
(approfondir).

### Étape 2 · Les corrections indépendantes de toute direction visuelle · **FAITE, deux restes**

Elles ne dépendent d'aucun arbitrage esthétique et peuvent partir immédiatement.

**État au 29/07, après exécution.** Six fichiers touchés, `tsc --noEmit` propre. Deux points se sont
révélés plus larges que ce qui est écrit ci-dessous, et le second reste ouvert.

- La sur-promesse Autour + Logement ne tenait pas en un CTA : elle vivait sur **cinq** points de
  citation, dont quatre que `da6f079` n'avait pas atteints. `FutureELanding.tsx:3099` (CTA wizard),
  `chaleur/page.tsx:209`, `inondation/page.tsx:208`,
  `chaleur/villes-les-plus-exposees/page.tsx:266`, `j-utilise-beaucoup-ma-voiture/page.tsx:109`.
  Tous réécrits sur la formule déjà validée dans `da6f079` : « La commune en entier : climat,
  risques, cadre de vie, ce qui la transforme. » Motif : le wizard gratuit ne lit que la commune
  (`api/wizard-preview/route.ts` ne renvoie que DRIAS, tensions, ATMO, ERA5), et le grant 14 €
  n'ouvre ni Autour ni Logement.
- Les cinq `href="#"` existaient **en double**, à l'identique dans le pied de page de la landing
  (`FutureELanding.tsx`) et dans celui de `/rapport`. Les deux listes sont désormais résolues et
  doivent rester alignées : Manifeste → `/pourquoi` (renommé « Pourquoi futur•e », comme la nav) ·
  Pages Savoir → `/#savoir`, ancre ajoutée sur la section hub de la landing, faute de route d'index
  `/savoir` · Contact → `mailto:hello@futur-e.fr`, attesté ailleurs dans le code · Méthodologie
  **retiré**, il doublonnait `/pourquoi` qui porte déjà « 05 · La méthode ».
- Le CTA de pied de page du rapport est passé sous `!fullReport`, comme celui du hero l'était déjà.
- **Les mentions légales existent** : `/mentions-legales`, écrite sur les données du RNE fournies par
  le porteur (immatriculation du 18/05/2026), au gabarit de `/politique-confidentialite`. Le lien est
  rétabli dans les deux pieds de page. La date de naissance figure au RNE mais n'est pas exigée par
  la LCEN : elle n'est pas publiée. `politique-confidentialite` est alignée au passage (le
  responsable du traitement y était déjà nommé, il disait « micro-entreprise » au lieu
  d'« entrepreneur individuel » et omettait le SIRET) et renvoie désormais vers la nouvelle page.
  **Trois points laissés au porteur**, hors périmètre d'une page de mentions :
  - **L'hébergeur est double, et c'est exact** (confirmé par le porteur le 30/07) : Vercel héberge
    l'application, OVH porte le domaine et la messagerie. La page nomme les deux avec leur périmètre.
  - **Les deux domaines sont détenus** (confirmé par le porteur) : `futuree.fr` au RNE, `futur-e.fr`
    servi par le code (`sitemap.ts`) et portant `hello@futur-e.fr`. Rien à corriger.
  - **Il n'existe aucune CGV** (`grep` sur « conditions générales », « CGV », « rétractation » :
    zéro). Pour une vente de service numérique à des consommateurs, il manque au minimum le droit de
    rétractation de 14 jours et son renoncement en cas d'exécution immédiate, et la **mention d'un
    médiateur de la consommation** (art. L616-1 du code de la consommation), qui suppose d'adhérer à
    un médiateur. Rien n'a été inventé sur ces deux points. **Arbitrage du porteur : les CGV se font
    à la fin de la séquence**, pas ici.
- **Reste 2, le sable `#c8b89a` : parqué en étape 5, décision du porteur.** Le périmètre réel n'est
  pas celui décrit plus bas : **61 occurrences sur 11 fichiers**, dont `ask-future.css` (32, c'est
  l'identité chromatique entière d'AskFuture) et `professionnels/page.tsx` + `ProForm.tsx` (accent
  de la page B2B, déclaré `const ACCENT`). Ce n'est pas un résidu de hero, c'est un second registre
  de fait. La question à trancher dans `DESIGN.md` : le sable devient-il le token du registre qui
  n'est pas le produit de décision, ou disparaît-il au profit de l'orange ?
- **Noté, non tranché** : le double chemin de paywall. Le CTA gratuit de `/rapport` pointe toujours
  vers `/#pricing` (colonne tarifaire) et non vers `/territoire/[insee]/debloquer` (page de
  conviction argumentée), alors que l'INSEE lu est connu à cet endroit.
- **Noté, hors périmètre** : `rapport/page.tsx:369` annonce « Trois échelles, de la commune à vos
  murs » **après** achat, avec trois cartes marquées « Accessible », alors qu'Autour et Logement
  demandent un dossier d'adresse. C'est la contradiction de décompte déjà listée plus bas (« six
  angles » / « trois échelles » / « Module 01 »), et elle se tranche avec elle.

- **« plus de 50 indicateurs »** → « près de 30 critères », la formulation prouvée, tant qu'un
  inventaire explicite ne justifie pas le premier chiffre. Occurrence :
  `src/components/FutureELanding.tsx:2688`. La bonne formule existe déjà ligne 2803 sur la même page.
- **Les cinq liens `href="#"`** du pied de page du rapport
  (`src/app/(account)/rapport/page.tsx:435-439`) : remplacer ou retirer, **en priorité les mentions
  légales**.
- **Le CTA d'achat ne doit plus s'afficher à qui possède déjà le rapport** :
  `TrackedUpgradeLink` vers `/#pricing` (`rapport/page.tsx:415-418`) n'est gardé par aucun
  `!fullReport`. Noter au passage le double chemin de paywall : `/#pricing` contre
  `/territoire/[insee]/debloquer`, qui est la page de conviction argumentée.
- **`#c8b89a`** (sable, `rgba(200,184,154,…)` dans `HorizonSwitch` et sur un bouton du hero) :
  décider s'il devient un **token nommé avec un rôle précis**, ou s'il disparaît. Il n'existe pas
  dans `design-tokens.css` aujourd'hui.
- **Vérifier que les CTA de l'accueil ne promettent plus Autour et Logement comme inclus dans le
  Rapport Territoire à 14 €.** Point sensible : le CTA wizard (`FutureELanding.tsx:3099`) promet
  encore « ce qui entoure votre adresse et ce qui pèse sur votre logement ». Recouvre le chantier
  déjà traité en partie le 29/07 (cf. `CURRENT.md`, lot `da6f079`).

### Étape 3 · Le responsive du Rapport Territoire, avant toute refonte · **FAITE**

**État au 30/07, après exécution.** Neuf fichiers touchés, `tsc --noEmit` propre, rendus vérifiés en
local sur `/`, `/dev/dossier` et `/dev/conclusion`. Rien de la grammaire visuelle n'a bougé : mêmes
composants, mêmes teintes, mêmes gabarits de carte. Seuls les seuils changent.

**Le constat de départ était trop noir**, et c'est utile pour la suite : le responsive n'est pas
absent, il est *incomplet*. Quatre composants avaient déjà des variantes (`FactCompositionCard`
`md:grid-cols-2`, `TerritoryIdentityCard` et `PropertyPassport` `sm:grid-cols-2`,
`QuartierSynthesis`), `MetricDrawer` est **entièrement** responsive (`clamp(320px, 92vw, 440px)` plus
une media query 640 px qui le bascule en feuille basse), la `Navbar` a son menu mobile, et les
grilles des modules Autour et Logement sont déjà fluides (`repeat(auto-fill, minmax(…))`). Le
périmètre réel se réduisait à **trois grilles figées**, aux paddings et au hero.

Ce qui a été fait :

- **Les trois grilles figées.** Hero de `/rapport` : `grid-cols-[1fr_400px]` → empilé sous `lg`
  (la colonne de 400 px écrasait la lecture à ~200 px). Cartes de modules : `grid-cols-3` →
  `1 / sm:2 / lg:3`. Cartes climat (`QuartierClimatData`) : `grid-cols-4` →
  `2 / md:3 / lg:4`, le point le plus dur, ~72 px par carte sur téléphone avant correction.
- **Le padding de page**, sur les sept conteneurs `max-w-[1100px]` du rapport, des modules et de
  `/compte` : `px-7` → `px-5 sm:px-7`. Seize pixels rendus à la colonne de lecture sur téléphone.
- **Les blocs de décision** : `card-verdict` passe `p-8` → `p-6 sm:p-8`, les cartes de section
  `p-6` → `p-5 sm:p-6`, et les deux liens de bas de section gagnent `flex-wrap`.
- **Le bandeau « horizons verrouillés »** de `HorizonBar` gagne `flex-wrap` : texte et CTA se
  chevauchaient sous 500 px.
- **La preuve produit du hero d'accueil ne disparaît plus.** `.hero-right { display: none }` est
  remplacé par une version compacte : le bloc passe sous le titre et se réduit à ses deux premières
  cartes (l'accroche climat, puis la carte de profondeur), via la classe `hero-preview-extra` posée
  sur les cartes d'index 2 et 3. `HorizonSwitch` reste affiché, il tient en 236 px.

**Ouvert par le porteur pendant l'exécution, à instruire en étape 5** : le **filet coloré en haut de
carte** (`border-t-2` sur `rounded-xl`, et son équivalent inline `borderTop: 2px solid ${col}` sur les
cartes climat). Il est aujourd'hui dans la pile « conserver » de l'audit, comme vocabulaire
chromatique du thème. Le porteur le soupçonne d'être **un signe reconnaissable d'interface générée
par IA**, ce qui le ferait basculer dans la pile inverse. Non tranché, rien n'a été modifié. Le hook
`impeccable` le signale de son côté (`border-accent-on-rounded`), aucune exception n'a été posée en
attendant l'arbitrage.

**Non traité, et volontairement** : la largeur de lecture. Le handoff la renvoie lui-même à l'étape
A / `DESIGN.md` (« se règle à l'échelle de la PAGE »). Rien n'a été décidé ici pour ne pas graver un
choix qui appartient à la direction visuelle.

---

Constat d'origine, conservé pour mémoire :

**Traiter comme un défaut de livraison, sans toucher à la grammaire visuelle.** Constat mesuré :
`grep` sur `sm:` `md:` `lg:` `@media` dans les 22 composants de `src/components/report/` et dans
`rapport/page.tsx` retourne **zéro**. Grilles figées : `grid-cols-[1fr_400px]` (hero, l. 220),
`grid-cols-3` (modules, l. 378), **`grid-cols-4`** (cartes climat,
`QuartierClimatData.tsx:1109`, soit ~80 px par carte sur téléphone pour un libellé, une valeur, un
sous-titre et une source).

Périmètre, dans cet ordre : hero · cartes de modules · grilles climat · verdict et sections de
décision · preuves, sources et drawers · largeur de lecture · navigation entre les échelles.

**Et sur l'accueil** : la preuve produit du hero ne doit pas simplement disparaître sur mobile
(`hero-right { display: none }`, `FutureELanding.tsx:2528`). Proposer une **version compacte**.

### Étape 4 · Mini-audit de la famille éditoriale, en lecture seule

Trois surfaces, sans refaire un audit complet :

- **`/chaleur`** comme hub thématique (`src/app/(public)/chaleur/page.tsx` et `[insee_code]/`) ;
- **`/savoir/pollutions-invisibles`** comme contenu long ;
- **`/agir/canicule`** comme guide pratique.

Question à instruire : **ce que `DESIGN.md` doit prévoir pour Explorer, Savoir et Agir.** Lecture
longue, traitement des sources, fraîcheur de la donnée, gestes actionnables, articulation avec la
commune et avec le rapport. À rendre au porteur **avant** de rédiger `DESIGN.md`.

### Étape 5 · Rédiger `DESIGN.md`, prescriptif

Doit graver :

- **A comme structure commune** : largeur de lecture, alignements, marges, filets, rareté des
  surfaces élevées ;
- **B pour toute donnée** : trajectoire, comparaison, incertitude, donnée absente, échelles, unités ;
- **C pour les verdicts, gloses, pages Savoir et guides Agir** ;
- **l'orange comme accent de marque**, et **toutes les autres teintes comme vocabulaire strictement
  sémantique** ;
- les **conditions précises d'usage** d'une carte, d'un badge, d'une pastille, d'un graphique ;
- la **relation visuelle entre Territoire, Autour et Logement** ;
- les composants **validés, dépréciés, interdits** ;
- une **séparation claire entre règles visuelles et conventions d'implémentation frontend**.

**À ne documenter sous aucune forme comme héritage à préserver** : les orbes flous, les emoji
d'icône, la barre de sources animée, les pastilles répétitives, les animations de donnée, le pricing
SaaS coché.

---

## Ce que l'audit a établi, et qui ne doit pas être re-dérivé

**L'autorité visuelle actuelle est le rapport, pas l'accueil.** Deux langages, pas deux dialectes :
l'accueil est stylé par un objet `styles` JS de ~1700 lignes avec `fontFamily` en dur, le rapport
consomme les tokens ; l'accueil a 4 media queries, le rapport aucune.

**La rupture centrale est le statut de la couleur.** Dans le rapport, une teinte est une affirmation
vérifiable : `.card-verdict` s'auréole du **ton du verdict** et jamais de l'accent de marque (un
dossier bloqué ne doit pas être vert), et les cinq registres du dossier ont chacun leur teinte
(améthyste = non su, bleu = contrôles à mener, rouge = incompatibilité, vert = alignement). Dans
l'accueil, une teinte est un ornement de colonne tarifaire. **Les deux régimes ne peuvent pas
coexister chez un lecteur qui traverse les deux en une session ; l'arbitrage se rend en faveur du
rapport.**

**Pile « conserver »** : `ConclusionBlock` + `.card-verdict` · le vocabulaire chromatique des cinq
registres · les règles d'anti-redondance de `DossierDecisionSection` (grain affiché une seule fois et
seulement si la section en mélange, section effacée quand le verdict la porte déjà, décompte de
réserves supprimé parce que les cartes le donnaient) · `FactBody` / `EvidenceRow` / `MethodDetails` /
`Chip` · `[data-visee]` · le rendu de la donnée absente (`opacity: 0.45`, filet gris, mention
explicite) · `HorizonBar` et `HorizonSwitch` · le tiret `—` comme marqueur « pas de donnée » · le
trio typographique et ses trois rôles.

**Pile « jamais dans `DESIGN.md` »** : les trois orbes flous (dupliqués à l'identique dans le
rapport payant, en `position: fixed`) · le surtitre pastille-mono utilisé **sept fois** sur
l'accueil · la barre de sources défilante · le pricing coché à couleur par plan · l'animation
slot-machine sur une donnée climatique · les emoji d'icône · la pastille « Accessible » répétée trois
fois à valeur constante, qui réemploie le signe sémantique des sections · l'objet `styles` JS · le
`fontFamily` inline (il perd les piles de repli de `--font-serif` / `--font-sans`).

**Contradictions de décompte à trancher** dans le rapport : le hero annonce « six angles », la
section suivante « trois échelles », les cartes « Module 01 ».

**Question ouverte, documentée dans le code** : la largeur de lecture. Une colonne de 860 px a été
essayée puis retirée dans `DossierDecisionSection` faute d'alignement avec le reste de la page. Se
règle à l'échelle de la PAGE, ce qui est exactement le travail de l'étape A.

---

## Pièges et fils ouverts

- **`BUSINESS_MODEL_B2C.md` ne fait pas autorité** : il présente « Le Fil » comme le produit central
  de la phase 2, décrit le plan Foyer et un abonnement mensuel à 9 €. Tout cela est écarté.
  `PRODUCT.md` le signale déjà.
- **Ne pas relancer `/impeccable document`** : arbitrage explicite du porteur.
- **Ne pas relancer `node .claude/skills/impeccable/scripts/context.mjs`** dans une session qui a déjà
  `PRODUCT.md` en contexte ; il ne rendra rien de neuf.
- **Un terminal parallèle travaille sur les dossiers d'adresse.** Ne pas réécrire
  `docs/handoff/CURRENT.md` : ce chantier vit dans le présent fichier, référencé depuis CURRENT.md
  par un pointeur.
- La contrainte AGENTS.md tient : cette version de Next comporte des ruptures d'API, lire
  `node_modules/next/dist/docs/` avant d'écrire du code.

---

## À lire d'abord à la reprise

1. `PRODUCT.md` (racine) — la vérité produit, y compris les trois réponses du porteur.
2. `docs/audits/2026-07-29-accueil-rapport-territoire.md` — l'audit complet, avec les numéros de
   ligne des défauts.
3. `docs/vault/doctrine/interface.md` et `docs/vault/doctrine/editoriale.md`, puis
   `docs/vault/adr/ADR-0005-direction-artistique.md`.
4. `MEMORY.md`, fiches `feedback_text_maxwidth`, `feedback_selecteur_fond_opaque`,
   `climat_card_gabarit`, `project_territoire_redesign`.
5. `docs/handoff/CURRENT.md` — le chantier parallèle, pour ne pas marcher dessus.
