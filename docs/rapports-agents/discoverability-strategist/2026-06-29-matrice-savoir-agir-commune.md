# Rapport de découvrabilité — La matrice Savoir/Agir × thème/commune

Discoverability Strategist · 2026-06-29
Mandat : instruire la matrice 2×2 d'accès tranchée par le porteur (`project_frontiere_savoir_agir`), quadrant par quadrant, sous l'angle SEO + GEO + chemin vers l'acquisition, sans trahir la voix.

> Je ne protège pas des pages. Je protège des intentions de découverte.

---

## 0. Le verrou dominant (à lire avant tout le reste)

**Le site est aujourd'hui fermé au crawl.** L'audit statique le confirme sans ambiguïté :
- `robots.txt Disallow: /` → OUI (site fermé au crawl)
- `layout racine noindex` par défaut → OUI (hérité par toutes les pages sans override)

Tant que ce double verrou tient, **aucun quadrant de la matrice n'existe dans le monde**. Toute la discussion qui suit décrit des *conditions de découvrabilité pour le jour de l'ouverture*, pas un état actuel. C'est cohérent et sain pour une pré-prod (on n'indexe pas un produit qui bouge). Mais cela veut dire une chose dure : **la matrice d'accès gratuit/payant n'a aucun effet SEO aujourd'hui.** Le débat « faut-il ouvrir Agir » est, du point de vue découvrabilité, un débat sur du contenu qui n'est vu par personne.

Conséquence pour le porteur : ne pas confondre « j'ai ouvert l'accès (paywall)» et « j'ai ouvert la découvrabilité (index) ». Ce sont deux gestes distincts. Le travail de fond ci-dessous (anti-duplication, canonical, JSON-LD, génération conditionnée) doit être réglé **avant** de lever le `noindex`, car ouvrir au crawl un domaine qui contient déjà des milliers de quasi-doublons (voir §2) est le scénario qui plombe durablement un domaine neuf.

---

## 1. Intention de recherche par quadrant

Je pars de l'humain à la barre de recherche, pas de la page.

### Quadrant A — Savoir × thème : « c'est quoi X » (GRATUIT)
- **Qui** : quelqu'un qui vient de lire un mot dans un article, un diagnostic, une conversation. « c'est quoi le cadmium dans les sols », « submersion marine définition », « retrait-gonflement argile c'est quoi ».
- **Peur / décision** : pas encore une décision de vie. Curiosité inquiète, besoin de cadrer un terme. Intention **informationnelle pure**.
- **Page qui répond** : `savoir/[slug]` (le hub thématique). C'est le bon mapping.
- **Verdict découvrabilité** : c'est le quadrant le plus citable par un LLM (définition sourcée, structurée), mais le **moins défendable** : Wikipédia, l'ADEME, Géorisques répondent déjà très bien à « c'est quoi X ». futur•e n'a presque aucun avantage ici. Valeur réelle = **capter l'intention amont** pour la faire descendre, pas ranker en soi. À traiter comme un actif de maillage, pas comme une cible de trafic.

### Quadrant B — Savoir × commune : données du thème pour CETTE commune (données GRATUITES, synthèse PAYANTE)
- **Qui** : quelqu'un avec une commune en tête (la sienne, ou une cible d'achat/mutation). « risque inondation [commune] », « canicule [commune] 2050 », « cadmium sols [commune] ».
- **Peur / décision** : c'est le moment déclencheur de l'archétype vu depuis Google. Décision latente (acheter ? partir ? rester ?). Intention **locale à forte valeur décisionnelle** — le cœur du moat.
- **Page qui répond** : `savoir/[slug]/[insee_code]`.
- **Verdict** : c'est **LE** quadrant qui justifie futur•e. Personne ne croise DRIAS + Géorisques + ATMO + Hub'Eau par commune et par thème avec une mise en récit. C'est là que la défendabilité existe. **À condition de ne pas l'auto-saboter** (voir §2 et §6).

### Quadrant C — Agir × thème : comment agir en général (GRATUIT, ouvert — livré)
- **Qui** : quelqu'un qui sait déjà qu'il est concerné et cherche le geste. « comment se protéger de la canicule », « protéger sa maison des inondations », « batardeau clapet anti-retour ».
- **Peur / décision** : intention **actionnable, transactionnelle douce**. Il veut une checklist fiable, pas une définition.
- **Page qui répond** : `agir/[thème]` (ex. `agir/inondation`, `agir/canicule`).
- **Verdict** : excellent contenu (la page inondation et la page canicule sont denses, sourcées, datées, structurées en leviers/étapes/profils/« ce que vous n'avez pas à faire » — exactement le format que les moteurs génératifs adorent citer). **C'est le quadrant le plus citable GEO de tout le site.** Concurrence réelle (Géorisques, ANSES, gouvernement) mais la qualité éditoriale et l'angle « ce qui protège *vraiment* / ce que vous n'avez pas à faire » est un angle différenciant rare.

### Quadrant D — Agir × commune : quoi faire vu CETTE commune (PAYANT, PARQUÉ)
- **Qui** : quelqu'un qui veut le plan d'action concret pour sa situation (« PPRNi de ma commune, mon clapet, mon registre CCAS, mes aides Fonds Barnier locales »).
- **Peur / décision** : intention **actionnable + locale** — la plus chaude commercialement, la plus rare sur le web.
- **Page qui répond** : `agir/[thème]/[commune]` — **n'existe pas encore** (cible parquée).
- **Verdict** : voir §3 et §7. C'est une intention réelle et **largement non servie**, mais c'est aussi le quadrant le plus dangereux en thin content et le plus discutable en surface (page vs fonctionnalité).

### Intentions que PERSONNE ne sert aujourd'hui (les espaces vides)
C'est ma moitié obsessionnelle. Autour de cette matrice, les vides à forte valeur décisionnelle :
1. **« faut-il acheter à [commune] malgré le risque inondation ? »** — intention transactionnelle, décisionnelle, anxieuse. Géorisques donne la donnée brute, jamais l'arbitrage. Aucune bonne réponse sur le web. futur•e est presque seul à pouvoir y répondre honnêtement (croisement risque × cadre de vie × trajectoire). C'est le pont naturel quadrant B → rapport 14€.
2. **« où vivre quand on fuit la chaleur / les inondations ? »** — intention de **comparaison géographique inversée** (pas « ma commune » mais « quelle commune »). C'est exactement `/ou-vivre`. Le web ne sert quasi pas cette intention (les comparateurs notent des villes, ils ne répondent pas à un projet).
3. **« [commune] va-t-elle devenir invivable en 2050 ? »** — intention prospective, que ni Géorisques (présent) ni Wikipédia (statique) ne servent. DRIAS croisé est l'avantage propre.
4. **Le couple risque + assurance/valeur** : « acheter en zone inondable revente », « surprime catnat [commune] ». La page Agir inondation effleure ça (revente, Fonds Barnier) — c'est un cluster sous-exploité, et il colle au moment d'achat (intention la plus solvable).

Ces vides valent plus que dix optimisations de hub. Ils convergent tous vers `/ou-vivre` ou le rapport 14€.

---

## 2. Cannibalisation SEO interne — LE problème le plus grave du site aujourd'hui

La question du porteur était : « savoir/[thème]/[commune] et agir/[thème]/[commune] se concurrencent-ils ? ». **La vraie cannibalisation est ailleurs, et elle est déjà en place dans le code, indépendamment d'Agir.**

### 2a. Trois familles de gabarits commune-niveau coexistent pour la MÊME requête
L'inventaire des routes révèle **trois** familles parallèles de pages « risque × commune », pas deux :
- `savoir/[slug]/[insee_code]` (variante `report`, données partiellement gatées)
- `territoires/[slug]/[insee_code]` (ISR, 100% public)
- les verticales legacy mono-risque : `/chaleur/[insee_code]`, `/inondation/[insee_code]` (+ leurs pages `villes-les-plus-exposees`)

`savoir/[slug]/[insee_code]` et `territoires/[slug]/[insee_code]` sont des **quasi-jumeaux** :
- même source (`communes_tension`), mêmes 4 indicateurs, mêmes données DRIAS/Géorisques/ATMO/Hub'Eau ;
- **H1 identique** : « Risque {thématique} à {commune} (Dept. {dept}) : Analyse et Prévention » ;
- metadata quasi identique (le `title` ne diffère que par « (code postal) » vs « (Dept. dept) »).

Pour Google, ce sont deux URLs qui se battent pour exactement la même requête « risque {thème} {commune} ». C'est de la **cannibalisation interne pure** + du **duplicate content**. Le jour de l'ouverture au crawl, soit Google en ignore une, soit il dilue l'autorité entre les deux, soit il pénalise les deux comme contenu dupliqué de template. **C'est le verrou n°1 sous le verrou noindex.**

> Recommandation : **une seule famille de gabarit commune-niveau doit survivre.** La matrice tranchée par le porteur dit « Savoir × commune ». Donc `savoir/[slug]/[insee_code]` est l'élu canonique. `territoires/[slug]/[insee_code]` et les verticales legacy `/chaleur/[insee]`, `/inondation/[insee]` doivent soit être supprimées, soit redirigées (301) vers le gabarit Savoir, soit déclarées `canonical` vers lui. **Je ne tranche pas l'implémentation** (renvoi Software Architect) mais la condition de découvrabilité est non négociable : *une intention = une URL canonique*. Tant que trois URLs répondent à « risque inondation Nîmes », aucune ne gagnera.

Note de cohérence : `communes_tension` est marqué « legacy scoré à jeter » dans `project_comparateur_consolidation`. Refondre la famille commune-niveau est donc aussi l'occasion de sortir de cette dette. À coordonner avec le Data Curator.

### 2b. La cannibalisation Savoir×commune vs Agir×commune (la question posée)
Une fois la famille unique établie, le risque Savoir×commune vs Agir×commune (futur quadrant D) est **gérable, à condition de séparer les intentions dès le H1** :
- Savoir×commune répond à « **quel est** le risque {thème} à {commune} » (état, donnée, exposition). Verbe : *comprendre*.
- Agir×commune répondrait à « **que faire** face au risque {thème} à {commune} » (plan, démarches locales). Verbe : *agir*.

Ce sont deux intentions distinctes (informationnelle-locale vs actionnable-locale), donc deux URLs légitimes **si et seulement si** les titres, H1 et le corps les distinguent franchement. Le danger : si Agir×commune recopie les données de Savoir×commune pour « se justifier », il redevient un doublon. Discipline : Agir×commune ne ré-expose PAS la donnée (il la lie d'un canonical/lien vers Savoir×commune), il n'ajoute que **la démarche localisée** (PPRNi de cette commune, PCS, contacts CCAS, dispositifs d'aide du département). Voir §3.

### 2c. Le sitemap pointe vers des URLs qui ne sont dans aucun des deux quadrants
`sitemap.ts` génère 35 000 entrées `BASE_URL/chaleur/{insee}` — c'est-à-dire la **famille legacy mono-risque**, ni Savoir ni Territoires. Le levier programmatique « officiel » du sitemap n'est donc même pas celui de la matrice tranchée. Trois conséquences :
- le sitemap déclare 34k URLs `/chaleur/{insee}` mais ne déclare AUCUNE `savoir/[slug]/[insee_code]` ni `territoires/...` ;
- il n'y a qu'**un seul thème** (chaleur) couvert programmatiquement dans le sitemap, alors que 6 hubs Savoir existent ;
- l'audit confirme : 25 routes publiques absentes du sitemap, dont `savoir/[slug]/[insee_code]` (le quadrant B, le moat !) et `/ou-vivre` (la destination d'acquisition !).

> Le sitemap est aujourd'hui un artefact de la phase legacy. Il doit être réécrit autour de la famille canonique unique (§2a) une fois celle-ci choisie. C'est un prérequis à l'ouverture.

---

## 3. Le levier programmatique 34k — faut-il l'étendre à Agir×commune ?

### L'état réel
Le programmatique « vit » officiellement (sitemap) sur `/chaleur/[insee]` (legacy), et techniquement aussi sur `savoir/[slug]/[insee_code]` et `territoires/[slug]/[insee_code]` (via `generateStaticParams` qui pré-rend le top 50 par slug). Donc le 34k n'est aujourd'hui ni propre ni unifié.

### Faut-il doubler la surface avec Agir×commune ?
Réponse courte : **non, pas par réplication 34k aveugle, et surtout pas avant d'avoir réglé §2.** Doubler une surface qui souffre déjà de triple cannibalisation, c'est ajouter un quatrième doublon par commune. Le calcul « doubler la surface = doubler le trafic » est exactement le piège du trafic vanité que je refuse.

### Les conditions strictes si Agir×commune devait exister un jour
1. **Génération conditionnée au signal** (déjà dans la doctrine, je la durcis) : une page `agir/inondation/[commune]` ne se génère que si cette commune a un **vrai actif local actionnable** : un PPRNi approuvé, un PCS, un arrêté catnat répété, une couverture Vigicrues. Sans cela, la page serait « les conseils génériques + le nom de la commune collé » = thin content + near-duplicate du quadrant C. **Le déclencheur n'est pas « la donnée existe » mais « la donnée change l'action ».** S'il n'y a pas de PPRNi, l'action à [commune] = l'action générique, donc pas de page : on pointe vers `agir/[thème]` + `savoir/[thème]/[commune]`.
2. **Anti-duplication par construction** : Agir×commune n'inclut jamais les données déjà servies par Savoir×commune. Il les **lie**. Son contenu propre = la couche démarche localisée (zonage de CETTE commune, contacts, aides départementales). Si ce contenu propre fait moins de ~40% de la page, la page ne doit pas exister.
3. **C'est PAYANT** (doctrine) — donc côté SEO, la valeur indexable est mince par design (preview seulement). Un quadrant payant n'est PAS un levier de découvrabilité de masse : c'est une destination de conversion. **Donc l'argument « doubler la surface SEO » ne tient même pas** : Agir×commune payant n'ajoute quasi pas de surface indexable. Il ajoute une promesse de valeur, pas du trafic. Ce qui me fait dire : Agir×commune relève davantage du Product/Business (vaut-il la peine d'être construit comme produit ?) que de la découvrabilité.

### Discipline de génération pour le quadrant B (Savoir×commune, le vrai levier 34k)
C'est lui qu'il faut industrialiser proprement, pas Agir×commune :
- **Unicité par commune** : chaque page doit porter au moins une donnée vraie et distinctive (une valeur DRIAS, un arrêté catnat daté, un indice ATMO, une cote). Les communes sans aucun signal pour un thème donné **ne sont pas générées** pour ce thème (ne pas créer `savoir/feux/[commune-de-plaine-humide]`).
- **Réplicabilité sans thin content** : le gabarit doit dégrader proprement (« données indisponibles » est déjà géré dans le code) — mais une page dont 3 blocs sur 4 disent « indisponible » ne doit PAS être générée ni mise au sitemap. La présence au sitemap doit être conditionnée à un seuil de richesse de données, pas au simple existence de la commune.
- **Graphe de liens internes** : la page `savoir/[slug]/[insee_code]` lie déjà les autres risques de la même commune (bon) et remonte au hub (bon). Manque : les **communes comparables / voisines / même bassin** (lien latéral), et surtout le lien descendant vers `/ou-vivre` pré-amorcé sur cette commune (voir §4).

---

## 4. Maillage — relier les 4 quadrants et mener à l'acquisition

Le maillage actuel (lu dans le code) :
- `savoir/[slug]` (hub) → CTA « Rechercher ma commune » vers `/territoires/[slug]` (⚠️ pointe vers la famille à déprécier — à recâbler vers la famille canonique).
- `savoir/[slug]/[insee_code]` → liens vers les autres risques de la même commune + retour hub. **Aucun lien vers `/ou-vivre`.** Le quadrant moat ne mène pas à l'acquisition horizontale.
- `agir/[thème]` → CtaCard « Trouver où vivre » vers `/ou-vivre` (bon) + liens « page associée » vers `savoir/[thème]`.
- Pas de pont Agir → Savoir×commune (la page canicule lie `savoir/chaleur-sante-mentale` et `territoires/canicule`, pas une commune précise).

### Le maillage cible (la boucle de découverte → acquisition)
La frontière vertical-gratuit / horizontal-payant de la doctrine donne la règle de chaînage :
```
Savoir×thème (A, gratuit, amont) ─┐
Agir×thème   (C, gratuit, geste) ─┼─→ Savoir×commune (B) ─→ /ou-vivre (acquisition horizontale)
                                  │         │                      │
                                  │         └─→ rapport 14€ (décision verticale sur CETTE commune)
                                  └─→ (Agir×commune D, payant) ────┘
```
Principes :
1. **Tout quadrant gratuit pointe vers la décision, ne la tente jamais.** Les pages Agir le font déjà bien (CtaCard sobre). À reproduire sur les hubs Savoir et sur Savoir×commune.
2. **Savoir×commune (B) doit gagner un double CTA** : (a) vertical « comprendre cette commune en entier » → rapport 14€ (déjà via PaywallGate report), (b) horizontal « et si une autre commune vous convenait mieux ? » → `/ou-vivre`. Aujourd'hui seul (a) existe. Le pont (b) est le maillon manquant vers le moteur d'acquisition principal. C'est cohérent avec l'espace vide n°2 du §1.
3. **`/ou-vivre` doit être dans le sitemap et indexable** (il ne l'est pas). C'est la destination de toute la boucle ; la laisser hors index revient à pousser tout le trafic vers une porte invisible aux moteurs (un LLM ne pourra jamais la citer comme réponse à « où vivre face à la chaleur »).
4. **Liens latéraux entre communes** sur le quadrant B (comparables / même bassin) : nourrissent l'autorité topique ET ouvrent naturellement la comparaison (qui est `/ou-vivre`).

---

## 5. Le cluster (autorité topique) — penser la structure, pas écrire

Pour que le quadrant B rank, futur•e doit être perçu comme l'autorité sur la grappe d'intentions autour d'un risque, pas sur une page isolée. Exemple inondation (le mieux doté aujourd'hui) :
```
Savoir×thème : submersion / inondation (définition, aléa, zonage)
  ├─ PPRNi, zone rouge/bleue, cote de crue, crue centennale
  ├─ Vigicrues, crue rapide, ruissellement
  ├─ catnat, arrêté, franchise, Fonds Barnier, surprime assurance
  ├─ IAL / état des risques, acheter en zone inondable, revente
  └─ Agir×thème : batardeau, clapet anti-retour, kit, évacuation, registre
Savoir×commune : risque inondation à [commune]
  └─ (Agir×commune : PPRNi de [commune], PCS, aides locales) — payant, conditionné
```
La page `agir/inondation` couvre déjà une large part de ce cluster dans un seul document (PPRNi, IAL, catnat, Fonds Barnier, Vigicrues, revente). C'est très bon pour la citabilité GEO, mais cela **concentre** le cluster sur une page au lieu de le distribuer. Arbitrage de structure (à confier in fine à l'Editorial pour la prose, mais je pose la question) : faut-il éclater certains sous-thèmes à forte requête propre (« acheter en zone inondable », « franchise catnat 2026 ») en pages dédiées du hub Savoir, reliées ? Mon avis de découvrabilité : oui pour 2-3 intentions transactionnelles à forte valeur (achat, assurance), non pour le reste (la concentration sert la citabilité). **Je ne tranche pas la granularité éditoriale.**

---

## 6. Le chemin vers l'acquisition + une tension grave avec le positionnement

### Le chemin (requête → confiance → rapport → pack)
- Quadrant A (Savoir thème) : requête informationnelle → confiance (sourcé, sobre) → descente vers B. Chemin long mais réel.
- Quadrant C (Agir thème) : requête actionnable → confiance (le contenu est excellent) → CtaCard `/ou-vivre`. Chemin **propre et déjà câblé**. C'est le meilleur entonnoir gratuit du site.
- Quadrant B (Savoir commune) : requête locale chaude → preuve (données réelles) → rapport 14€. **C'est le chemin vers l'argent le plus direct.** Mais le pont vers `/ou-vivre` manque (§4).
- Quadrant D (Agir commune, payant) : n'attire pas de trafic propre (payant) ; il monétise une intention déjà captée. Son chemin vers l'argent existe mais il ne crée pas de découverte. **C'est pourquoi il est secondaire en priorité de découvrabilité.**

### La tension grave (verrou de marque, pas seulement SEO)
Le quadrant B et la famille territoires affichent en hero un **« Score de tension / 100 »** géant, agrégeant 4 indicateurs. Or :
- `positionnement.md` définit l'adversaire de futur•e comme « **les comparateurs qui notent une ville sans dire ce qu'on y risque** » ;
- `ADR-0001` = pas de score synthétique ;
- le risque structurant n°1 du modèle économique = « être lu comme un comparateur de villes de plus ».

Le gabarit commune-niveau actuel **incarne exactement ce que futur•e dit refuser** : une note sur 100 mise en avant avant toute mise en récit. Du point de vue découvrabilité c'est même contre-productif pour le GEO : un LLM cite une donnée sourcée et qualifiée (« 18 jours >35°C en 2050, source DRIAS GWL2.0 »), pas un score maison « 73/100 » qu'il ne peut pas attribuer à une source publique. **Le score synthétique nuit à la citabilité ET trahit le positionnement.** C'est un point que je signale fort, à arbitrer avec l'Editorial et le Business : refondre le quadrant B autour des données qualifiées (citables) plutôt que d'un score (ni citable ni conforme). C'est aussi l'occasion de §2a (jeter `communes_tension`).

### Sous-doctrine d'accès : la donnée est-elle bien gratuite ?
La doctrine tranchée dit « données GRATUITES (surface SEO), synthèse/décision PAYANTE ». Or dans `savoir/[slug]/[insee_code]`, les données DRIAS ne sont **fetchées que si `hasFullAccess`** : pour un visiteur anonyme (= un crawler), DRIAS affiche « indisponible ». La couche données la plus différenciante (les projections 2050) est donc, en l'état du code, **gatée au lieu d'être indexable**. C'est contraire à la doctrine et c'est une perte SEO/GEO sèche : la donnée la plus citable est invisible aux moteurs. À corriger : la couche données (DRIAS, Géorisques, ATMO, Hub'Eau) doit être servie à tous (indexable) ; seul l'arbitrage/la synthèse décisionnelle passe payant.

---

## 7. La bonne surface — page, fonctionnalité, ou rien ?

- **Quadrant A (Savoir thème)** : page. Correct. Surface légère, rôle de captation amont + maillage. Ne pas surinvestir (gagnabilité faible vs Wikipédia).
- **Quadrant C (Agir thème)** : page. **La meilleure surface du site en l'état.** Garder, c'est l'actif GEO. Étendre prudemment le jeu fixe evergreen (la doctrine dit : pas de réplication 34k — d'accord).
- **Quadrant B (Savoir commune)** : page programmatique — **oui, c'est le moat**, mais refondue (sortir du score, libérer la donnée, conditionner la génération au signal, unifier les 3 familles en une).
- **Quadrant D (Agir commune)** : **ne pas en faire une page programmatique 34k.** Deux options plus saines : (a) une **section conditionnelle DANS le rapport 14€** (« votre plan d'action pour ce risque à [commune] ») plutôt qu'une URL publique — ce qui en fait une valeur produit, pas une surface SEO ; (b) si surface publique, alors strictement conditionnée au signal local actionnable (PPRNi/PCS), donc quelques centaines à quelques milliers de pages, pas 34k. **Ma recommandation : (a).** Agir×commune est un argument de valeur du rapport, pas un gisement de découvrabilité. Cela résout le faux espoir « doubler la surface » du §3 et renvoie proprement la décision de construction au Product/Business.

---

## 8. Respect de la voix (subordination à l'Editorial)

Où ma logique de découvrabilité pourrait tordre la prose — et où je me subordonne :
1. **Différencier les H1 Savoir×commune vs Agir×commune** (§2b) est un besoin SEO légitime, mais la formulation revient à l'Editorial. Je donne l'intention (comprendre vs agir), pas les mots. À noter : les H1 actuels « Risque X à [commune] : Analyse et Prévention » sentent déjà le SEO 2010 (« Analyse et Prévention » est un appât de mots-clés, pas la voix futur•e). **Je signale que ce H1 viole probablement la doctrine éditoriale (parler au lecteur, pas au moteur) — et je recommande de le confier à l'Editorial pour réécriture, sans y substituer ma propre formule.**
2. **Éclater le cluster en pages dédiées** (§5) ne doit jamais produire des pages-coquilles écrites pour une requête. Si l'Editorial juge qu'une intention ne mérite pas une vraie page habitée, la voix gagne : pas de page.
3. **Score /100** (§6) : je le combats pour des raisons de citabilité ET de positionnement, ce qui converge avec l'Editorial et l'ADR. Pas de tension ici, alignement.
4. Aucune de mes recommandations n'introduit de bourrage de mots-clés, de meta survendue ou d'ouverture creuse. Là où le code en contient déjà (le H1 « Analyse et Prévention », les `description` qui annoncent un score), je recommande de **retirer**, pas d'ajouter.

---

## 9. Verdict par quadrant

| Quadrant | Verdict | Raison dominante |
|---|---|---|
| A — Savoir × thème | À OPTIMISER (priorité basse) | Bon mapping, faible gagnabilité ; rôle = maillage amont, pas trafic |
| B — Savoir × commune | ANGLE MORT (le moat invisible) | Le vrai levier, mais auto-saboté : triple cannibalisation, score anti-marque, données gatées, hors sitemap, pas de pont vers /ou-vivre |
| C — Agir × thème | DÉCOUVRABLE (le meilleur actif GEO) | Contenu sourcé/structuré/daté, format citable, CTA propre vers acquisition ; garder, ne pas répliquer |
| D — Agir × commune | NE PAS FAIRE (en page 34k) | Payant = pas de surface SEO ; risque thin content max ; mieux comme section du rapport 14€ |

**Hiérarchie d'action (par ce qui déplace l'aiguille) :**
0. (Verrou global) Régler tout le reste **avant** de lever le `noindex`.
1. **Dédoublonner la famille commune-niveau** (§2a) : choisir `savoir/[slug]/[insee_code]` comme canonique, 301/canonical des deux autres familles. Sans ça, rien ne rank.
2. **Réécrire le sitemap** autour de la famille canonique + inclure `/ou-vivre` et les hubs (§2c, §4).
3. **Libérer la couche données** du quadrant B (DRIAS indexable) + **retirer le score /100** (§6).
4. **Ajouter le pont B → /ou-vivre** (§4) et les liens latéraux entre communes.
5. **Ajouter canonical + JSON-LD partout** (0 aujourd'hui) — Place/Dataset sur le quadrant B, HowTo/FAQ envisageable sur le quadrant C (à valider avec l'Architecte : format JSON-LD vérifié contre la doc, pas de mémoire).
6. Laisser Agir×commune parqué, et le reverser comme section du rapport (Product).

---

## 10. La version minimale (≈90% de la valeur)

Si une seule chose doit être faite : **avant l'ouverture au crawl, garantir qu'une intention « risque {thème} à {commune} » = une seule URL canonique, riche en données réelles, sans score synthétique, qui pointe vers /ou-vivre.** C'est-à-dire : choisir la famille canonique, 301 les doublons, libérer la donnée, ajouter le lien d'acquisition. Pas besoin de JSON-LD parfait, ni d'Agir×commune, ni d'éclatement de cluster pour capturer l'essentiel : il faut surtout **ne pas ouvrir au crawl un domaine qui se cannibalise lui-même**. Le reste (GEO fin, clusters, liens latéraux) est itératif.

Périmètre : je reste dans la lentille découvrabilité. Le choix de la famille canonique touche l'archi (Architecte) et le sort de `communes_tension` (Data Curator) ; la réécriture des H1 et la sortie du score touchent l'Editorial ; le sort d'Agir×commune touche Product/Business. Je pose, je ne trad pas.

---

## 11. Frontières / renvois
- **Editorial** : réécrire les H1 commune-niveau (« Analyse et Prévention » = marqueur SEO old-school) ; arbitrer la granularité du cluster (§5) ; valider la sortie du score /100 au profit de données qualifiées.
- **Software Architect** : implémentation 301/canonical de la dédup (§2a) ; réécriture `sitemap.ts` conditionnée au signal ; ajout JSON-LD (vérifier l'API Metadata/format schema.org contre `node_modules/next/dist/docs/`, pas de mémoire) ; coût de génération conditionnée à 34k.
- **Data Curator** : pour quelles communes/thèmes existe-t-il un vrai signal (anti-thin content) ? sort de `communes_tension` (legacy à jeter) ?
- **Product** : Agir×commune comme section du rapport 14€ plutôt que surface publique (§7) ; faut-il cette surface du tout ?
- **Business** : priorité d'acquisition (le quadrant C est l'entonnoir gratuit le plus efficace ; le quadrant B est le chemin direct vers 14€) ; le score /100 comme risque de catégorie (« comparateur de plus »).

## 12. Cohérence (tensions non tranchées, voix gagne par défaut)
- Score /100 vs ADR-0001/positionnement : tension forte, je recommande de le retirer mais ne tranche pas (Editorial + Business + ADR).
- Granularité du cluster : tension entre concentration (citabilité) et éclatement (requêtes propres) — Editorial tranche.
- Famille canonique : tension entre l'existant (territoires/legacy déjà codés) et la doctrine (Savoir×commune) — Architecte/Product tranchent l'implémentation, mais la doctrine désigne Savoir.

---

## Limites de mon regard (ce run)
- **Je n'ai pas vu le SERP réel.** Je ne sais pas qui rank aujourd'hui sur « risque inondation [commune] » ni quel format Google/Perplexity citent en 2026. Mes verdicts de gagnabilité (Wikipédia/Géorisques dominent l'amont, futur•e gagne le croisement local) sont des raisonnements par principe, pas des mesures. Je recommandais un WebFetch SERP ; je ne l'ai pas exécuté ce run (le verrou noindex rend l'exercice secondaire tant que rien n'est indexable — mais à refaire avant l'ouverture).
- **Aucun volume de requête réel.** Je n'affirme aucun trafic. « forte valeur décisionnelle » ≠ « fort volume ».
- **Aucun ranking promis.** Tout ce qui précède décrit des *conditions de découvrabilité*, pas une certitude de résultat. La dédup + canonical + données libérées sont des conditions nécessaires, pas suffisantes.
- **Inventaire statique du code, pas de l'indexation réelle.** L'audit lit les routes et la présence de metadata/sitemap ; il ne mesure pas l'état d'indexation Google (qui est de toute façon nul puisque noindex).
- **Je n'ai pas lu chaque page Agir individuellement** (j'ai lu canicule + inondation en profondeur, supposé la cohérence du gabarit pour cadmium/feux/dépendance-auto/voiture-électrique/pollutions-invisibles d'après l'audit). Si l'une dévie (ex. pollutions-invisibles et voiture-electrique sortent du sitemap selon l'audit), à vérifier.

## Quand rouvrir ce sujet
- **Au moment de lever le `noindex`** : re-auditer obligatoirement (dédup réglée ? sitemap cohérent ? /ou-vivre indexable ?). C'est le déclencheur principal.
- Si le **score /100** est conservé malgré §6 : rouvrir avec l'Editorial et le Business (risque de catégorie).
- Si **Search Console** (post-ouverture) montre du « duplicate, Google a choisi une autre canonique » ou des impressions qui se partagent entre deux URLs pour la même requête : la dédup n'a pas pris, re-trancher.
- Si le **Product décide de construire Agir×commune** en surface publique : rouvrir pour cadrer la génération conditionnée au signal (anti-thin).
- Si un **concurrent gratuit** (City Score, portail immobilier + score climat) commence à ranker sur « risque {thème} {commune} » : re-prioriser le quadrant B en urgence (c'est le risque structurant n°3-4 du modèle).
- Si les **moteurs génératifs** (citation GEO) deviennent une source de trafic mesurable : rouvrir pour pousser le JSON-LD et le format réponse-directe sur le quadrant C.
