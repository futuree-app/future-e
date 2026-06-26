# Rapport de découvrabilité — Discoverability Strategist (futur•e)
## Page thématique `/inondation` (hub) et gabarit `/inondation/[insee_code]`

> Produit par l'agent **Discoverability Strategist** le 2026-06-26, en **test à froid de
> validation** de son mandat (premier run depuis sa création). Cible choisie pour exercer sa
> signature : une page de risque qui cible une intention de recherche claire (« risque inondation
> [commune] »), donc qui teste à la fois SEO, GEO, le levier programmatique 35k communes, et la
> subordination à la voix (sujet « risque » où futur•e parle décision, pas peur). Read-only :
> l'agent propose, le porteur tranche, Claude principal applique.
>
> **Trouvailles vérifiées contre le code réel** : `public/robots.txt` = `Disallow: /` (confirmé) ;
> `src/app/layout.tsx` `robots.index=false` hérité (confirmé) ; `sitemap.ts` ne liste que
> `/chaleur/{code}` en programmatique, aucune URL `/inondation` hub/commune (confirmé, l'unique
> « inondation » du sitemap est `/agir/inondation`, une autre page) ; gabarit
> `/inondation/[insee_code]/page.tsx` existant (confirmé) ; CTA « Commencer — 14 jours gratuits »
> ligne 456 (confirmé verbatim). Exactes, non hallucinées. Verdict de validation du mandat :
> **concluant**.

---

## Surface

Deux surfaces couplées, un même gisement d'intention :
- **Hub** : `src/app/(public)/inondation/page.tsx` → route `/inondation`. Intention visée : « risque inondation », « inondation submersion France », requête générique de tête.
- **Gabarit programmatique** : `src/app/(public)/inondation/[insee_code]/page.tsx` → `/inondation/{code INSEE}`. Intention visée, la plus précieuse : **« risque inondation [commune] »**, « inondation [commune] 2050 », « [commune] zone inondable ». C'est l'intention de longue traîne, à forte valeur décisionnelle (achat, mutation), exactement le cœur du `modele-economique.md`.
- Deux pages éditoriales liées (`villes-les-plus-exposees`, `villes-les-plus-exposees-submersion`) que je ne juge pas en détail ici mais qui partagent le même sort technique.

**Constat d'ouverture** : le contenu est de très bonne qualité de découvrabilité par principe (sourcé, daté, format réponse-directe). Mais il est aujourd'hui **techniquement invisible**, et cette invisibilité est double-verrouillée. C'est l'angle mort qui domine tout le reste.

---

## Découvrabilité (être trouvé)

**Verrou n°1 — site entièrement interdit aux robots.** `public/robots.txt` contient :
```
User-agent: *
Disallow: /
```
Tout le site est bloqué au crawl. Aucune page inondation n'est explorable par un moteur aujourd'hui.

**Verrou n°2 — noindex hérité.** Le layout racine `src/app/layout.tsx` déclare :
```js
robots: { index: false, follow: false, googleBot: { index: false, follow: false } }
```
J'ai vérifié la règle d'héritage contre la doc Next installée (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`, §Merging / Inheriting fields) : les clés de métadonnées non redéfinies par une page sont **héritées** du segment parent. Or ni `/inondation/page.tsx` ni `[insee_code]/page.tsx` ne redéfinissent `robots`. Conséquence confirmée : **les deux pages émettent `<meta name="robots" content="noindex,nofollow">`**. Même si robots.txt était ouvert, elles resteraient désindexées.

Ce double verrou est probablement un état **pré-lancement volontaire** (le site n'est pas encore ouvert). Je ne le traite donc pas comme un bug, mais comme **le point de contrôle n°1 du jour de lancement** : il ne suffira pas de toucher robots.txt. Il faudra, page publique par page publique, surcharger `robots: { index: true, follow: true }` (ou inverser la valeur par défaut du layout racine et garder le `noindex` explicite seulement sur les pages qui le veulent déjà : `/le-fil`, `/professionnels`, `/comparateur/pack-decision`, `/territoire/[insee]/debloquer`). À ne pas oublier, sinon le contenu reste excellent et invisible, la peur que j'incarne, réalisée.

**Sitemap — angle mort majeur, indépendant du lancement.** `src/app/sitemap.ts` ne contient **aucune** URL `/inondation`. Le seul gabarit programmatique listé est `/chaleur/{code}`. Sont absents : le hub `/inondation`, les deux pages classement, et surtout les ~35 000 `/inondation/{insee}`. Même robots ouvert, les communes ne seraient découvertes que par maillage interne, jamais soumises. À corriger : ajouter les routes inondation statiques + générer les entrées communes (la même source `geo.api.gouv.fr` est déjà appelée). Décision à poser : émettre les 35k, ou seulement les communes à donnée réelle (voir thin content plus bas).

**Canonical / metadataBase absents.** Aucune des deux pages ne déclare `alternates.canonical` (seul `/ou-vivre` le fait dans tout le repo), et aucun `metadataBase` n'est défini nulle part. Deux conséquences : (1) les URLs OpenGraph restent relatives et Next journalisera des avertissements ; (2) **risque de cannibalisation** réel : une même commune est traitée par `/inondation/{insee}`, `/chaleur/{insee}`, `/territoire/{insee}` et `/georisques-logement`. Sans canonical explicite par page, les moteurs choisiront eux-mêmes laquelle fait foi sur « inondation [commune] », et peuvent diluer le signal. À arbitrer avec l'Architecte.

**Structure Hn — saine.** Un seul `h1` par page, `h2` de section cohérents, fil d'Ariane présent sur la page commune (`/inondation` → commune). Le `h1` du gabarit, « À {commune}, quel est le risque d'inondation réel ? », est un excellent format interrogatif (voir Citabilité).

**Maillage interne — bon entrant, faible sortant latéral.** Le hub pointe vers les classements, guides, comparateur, rapport : bon. La `CommuneSearch` (`basePath="/inondation"`) alimente bien les pages communes. **Mais** la page commune ne lie vers **aucune autre commune** : ni voisines, ni même département, ni comparables littorales. Le graphe de liens internes du gabarit programmatique est donc plat, c'est le levier d'indexation le plus sous-exploité à l'échelle 35k (détaillé plus bas).

**Vitesse — signalé, non mesuré.** Pages en grande partie statiques (`revalidate=86400`, `generateStaticParams` sur top1000), CSS inline critique : a priori favorable. Réserve : sur le gabarit commune, le rendu dépend de trois appels (`fetchScore` Supabase, DRIAS, Géorisques) au build/ISR ; pour les communes hors top1000 servies à la demande, le premier rendu peut être lent. Je signale, je ne mesure pas.

---

## Citabilité GEO (être cité par un LLM)

C'est, paradoxalement, le point le plus **fort** du contenu, et la raison pour laquelle lever les verrous en vaut la peine.

- **Réponse directe, haut de page** : le `h1` pose la question (« quel est le risque d'inondation réel ? ») et le paragraphe immédiat y répond avec les sources nommées. C'est exactement le format qu'un moteur génératif reprend.
- **Source explicite et datée** : chaque carte « signal » porte sa source (Géorisques/MTES, Copernicus, CCR) et une date (« Mai 2026 »), le bloc DRIAS précise scénario (+4 °C), producteur (Météo-France/CNRS) et nature (« valeur médiane sur l'ensemble des modèles »). C'est de la matière citable propre, conforme à la doctrine data.
- **Donnée réellement située** : score DRIAS calculé par commune, libellés de risques officiels GASPAR par commune, bloc submersion pour les littorales. Un LLM peut citer une valeur attribuable à un lieu, pas du verbiage.

**La seule lacune GEO sérieuse : aucune donnée structurée.** Zéro `application/ld+json` dans tout l'arbre inondation. Pour un contenu aussi sourçable, c'est l'optimisation à plus fort levier **sans toucher un mot de la prose** (donc sans risque pour la voix) :
- `Place` / `AdministrativeArea` (la commune) ;
- `Dataset` (les projections DRIAS, avec `creator`, `temporalCoverage`, `isBasedOn`) ;
- `FAQPage` ou `QAPage` sur le couple « quel est le risque d'inondation à {commune} ? » → réponse ;
- `BreadcrumbList` (le fil d'Ariane existe déjà visuellement).

C'est l'archétype de mon mandat : découvrabilité et honnêteté alliées. On rend lisible par la machine une honnêteté déjà écrite pour l'humain. Implémentation = ressort de l'Architecte ; la *décision* d'y aller est ma recommandation prioritaire n°2 (après les verrous).

---

## Respect de la voix (subordination à l'Editorial)

Globalement la page **respecte** la voix : sourcée, datée, vouvoiement, orientée décision (« ces données ont une valeur concrète pour vos décisions »), pas de tiret cadratin dans la prose visible, pas de bourrage de mots-clés. Je n'introduis aucune réécriture. Je signale trois points de vigilance, **que je ne tranche pas** (la voix gagne, l'Editorial arbitre) :

1. **Registre « peur » vs « intelligence » (invariant n°6).** Le hub ouvre sur « 17 millions de Français vivent en zone inondable » et un signal « 66 % ignorent être exposés ». C'est sourcé et factuel, donc défendable, mais l'accumulation de gros chiffres anxiogènes en tête flirte avec le registre que la doctrine refuse (« lucidité, pas panique »). À relire par l'Editorial : la donnée reste, le *cadrage* (décision, pas alarme) doit dominer. Je n'y touche pas, je le pose.

2. **Sur-promesse possible dans un CTA (invariant n°5).** La page commune affiche « Commencer — 14 jours gratuits » (`/inscription`). Or `modele-economique.md` décrit une offre one-shot 14 €/39 €, sans essai gratuit ni abonnement livré (« Le Fil » non achetable). Un CTA qui promet « 14 jours gratuits » risque d'**affirmer au-delà de la preuve** et de désaligner le discours du produit réel. **À vérifier d'urgence par Product/Business** : si l'essai n'existe pas, c'est une promesse fausse en page indexable, le pire pour la confiance (un actif explicite du modèle). Ce n'est pas du SEO, mais ma lentille « citable comme source fiable » l'attrape.

3. **Une formule produit-centrée résiduelle.** Sur le hub, le bloc rapport dit « Pas un article générique : un diagnostic construit à partir de… » : légère description du format (ce que la doctrine éditoriale demande d'éviter, « la page parle au lecteur, pas d'elle-même »). Mineur, renvoi Editorial.

Aucune de mes recommandations techniques (robots, sitemap, canonical, JSON-LD, maillage) ne touche un mot de prose. Ma part est entièrement structurelle.

---

## Programmatique / passage à l'échelle (gabarit N communes)

C'est le gisement central de `modele-economique.md` (« SEO = priorité d'acquisition absolue, moteur = maillage des pages communes »), et l'enjeu défensif (« concurrence gratuite »). État du gabarit :

- **Unicité par commune — réelle là où la donnée existe.** Score DRIAS calculé, valeurs de précipitations par commune, libellés GASPAR filtrés, bloc submersion conditionnel au littoral. Ce n'est **pas** du thin content dupliqué tant que ces données sont présentes. Bon point, c'est la différence avec une ferme de contenu.
- **Risque thin/duplicate sur la frange.** Quand DRIAS est indisponible (`DRIAS_ITEMS` vides), qu'il n'y a pas de score (`displayScore` null) et aucun risque GASPAR inondation, la page se réduit à : intro template + cartes signaux *nationales* (identiques partout) + blocs « comprendre/agir » (identiques partout). Sur potentiellement plusieurs milliers de petites communes, cela produit des pages quasi-identiques = **signal thin/duplicate** à l'échelle, exactement ce qui se fait pénaliser. Décision à poser (Product + Architecte) : soit **enrichir** (donnée minimale garantie par commune), soit **noindex conditionnel** quand aucune donnée propre n'existe, soit ne sitemap-er que les communes à donnée réelle. Le `generateStaticParams` limité au top1000 atténue le coût de build mais pas le risque d'indexation des ~34k restantes servies à la demande.
- **Graphe de liens internes — quasi absent, c'est le gros levier manquant.** Aucune page commune ne lie vers d'autres communes. Or à 35k pages, le maillage latéral (voisines géographiques, même bassin de risque, mêmes littorales, lien croisé vers la `/chaleur/{insee}` sœur) est **le** mécanisme qui rend un gabarit programmatique crawlable et fait remonter la longue traîne. Ajouter un bloc « communes voisines / comparables » par page déplacerait l'aiguille bien plus que tout ajustement cosmétique. Conception = ma reco ; coût technique = Architecte.
- **Architecture d'URL — propre.** `/inondation/{insee}` est lisible, stable, alignée sur l'intention. Cohérente avec `/chaleur/{insee}`. Bonne base.

---

## Risque concurrentiel

Sur « risque inondation [commune] », l'occupant naturel est **Géorisques** (gouvernemental). Vérifié en direct : sa page d'entrée inondation est une **passerelle de navigation**, elle ne répond pas directement par commune, elle renvoie à une carte interactive. C'est une **brèche réelle** : une page futur•e qui répond à la question dès le `h1`, datée et sourcée, est *structurellement plus citable* qu'une carte qu'un LLM ne sait pas lire. Les autres concurrents nommés dans `modele-economique.md` (City Score, Bien dans ma ville, ville-ideale, MeilleurVille) traitent surtout l'attractivité, peu le risque inondation par commune. **La requête « inondation [commune] » est donc largement disputable, et futur•e a le meilleur format de réponse.** Mais tant que les deux verrous tiennent et que le sitemap ignore ces pages, on **laisse 100 % de ce terrain** à Géorisques et au premier portail immobilier qui ajoutera un score (le risque n°4 du modèle, « le plus dangereux »). Le contenu est prêt ; la distribution ne l'est pas.

Je n'ai pas pu confirmer la SERP Google en direct (mur de consentement, non forcé) : le classement réel et les volumes restent une hypothèse, pas une mesure (voir Limites).

---

## Verdict

**ANGLE MORT (invisible) aujourd'hui — fort potentiel DÉCOUVRABLE+CITABLE au lancement.**

Hiérarchie de ce qui déplace l'aiguille (du plus structurant au cosmétique) :
1. **Lever le double verrou robots au lancement, page publique par page publique** (robots.txt + `robots:index` hérité du layout racine). Sans cela, rien d'autre ne compte. Probablement volontaire pré-lancement : à inscrire comme gate de lancement, pas à « corriger » à l'aveugle.
2. **Inclure les routes `/inondation` dans `sitemap.ts`** (hub + classements + communes), avec la décision thin content associée.
3. **Ajouter les données structurées schema.org** (Place/Dataset/QAPage/Breadcrumb) — plus fort levier GEO, zéro risque voix.
4. **Maillage interne latéral entre communes** sur le gabarit — le levier d'échelle du programmatique.
5. **Déclarer `metadataBase` + `canonical`** par page pour neutraliser la cannibalisation inondation/chaleur/territoire.
6. Vérifier/corriger le CTA « 14 jours gratuits » (relève surtout de la véracité, mais empoisonne la citabilité).

---

## Frontières / renvois

- **Editorial Writer** : cadrage « peur vs intelligence » du hub (les chiffres restent, le ton décide) ; formule produit-centrée résiduelle du bloc rapport. Toute réécriture de prose lui revient ; je ne touche aucun mot.
- **Software Architect** : implémentation du JSON-LD, des entrées sitemap communes (réutiliser l'appel `geo.api.gouv.fr` existant), de `metadataBase`/`canonical`, du bloc « communes voisines » ; coût de build/ISR des 35k pages et stratégie statique vs à la demande ; inversion propre du `robots` par défaut du layout racine sans casser les `noindex` voulus.
- **Product** : faut-il indexer *toutes* les communes ou seulement celles à donnée réelle (thin content) ? Le CTA « 14 jours gratuits » correspond-il à une offre qui existe ?
- **Business** : arbitrage cannibalisation `/inondation` vs `/chaleur` vs `/territoire` (une intention, plusieurs pages, un seul canal d'acquisition) ; priorité du verrouillage SEO dans la séquence de lancement.

## Cohérence

Tension posée, non tranchée : le hub mène son acquisition par des chiffres-chocs sourcés (registre efficace en SEO/partage) là où la doctrine privilégie « lucidité, pas panique ». Par défaut **la voix gagne** : la donnée reste, le cadrage doit rester décisionnel. À l'humain de confirmer le curseur avec l'Editorial.

## Limites de mon regard

Limites réelles de **ce run**, pas de formule :
- **Je n'ai pas vu la vraie SERP.** Google m'a renvoyé un mur de consentement que je n'ai pas forcé. Le classement réel sur « risque inondation [commune] », la présence effective de Géorisques en position 1, et surtout les **volumes de recherche** sont des hypothèses raisonnées, pas des mesures. Le potentiel décrit suppose une demande que je n'ai pas chiffrée.
- **Je n'ai pas confirmé l'intention pré-lancement.** Le double verrou robots est *probablement* volontaire (site non ouvert), mais je le déduis du contexte (`/le-fil`, `/professionnels` en noindex explicite), je ne l'ai pas lu dans une décision écrite. Si le site est déjà censé être ouvert, c'est une urgence ; sinon, c'est une checklist.
- **Je n'ai mesuré aucune performance** (vitesse, Core Web Vitals, temps de rendu ISR des communes hors top1000) : je raisonne par principes, sans outil.
- **Je ne sais pas ce que les moteurs génératifs citent réellement aujourd'hui** sur ces requêtes. Le JSON-LD améliore la citabilité par principe ; je ne peux pas garantir qu'un LLM donné reprendra ces pages. Aucune de ces recommandations n'est un ranking promis : ce sont des conditions de découvrabilité, pas une certitude de résultat.
