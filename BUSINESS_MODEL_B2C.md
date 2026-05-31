# BUSINESS MODEL B2C · futur•e

> Document de réflexion stratégique. Issu d'un audit du repo (mai 2026) puis d'une formalisation.
> Règle d'écriture : pas de tiret cadratin, virgule ou deux points.

---

## 0. Idée centrale

Le **rapport interactif** et **Le Fil futur•e** sont deux produits différents, pas deux paliers du même produit. Le Fil appartient à la catégorie stratégique de la **veille territoriale personnalisée**.

> Convention de vocabulaire : dans ce document, **« veille » désigne la catégorie stratégique** (le concept et la mécanique de fond). Côté utilisateur, cette couche porte le nom produit **Le Fil futur•e**. « Suivi » ne reste qu'un slug technique interne, sans valeur marketing.

- Le rapport répond à : « Que faut-il savoir sur mon territoire ? »
- Le Fil répond à : « Qu'est-ce qui a changé depuis la dernière fois ? »

Le Fil n'est pas un accès continu au rapport. C'est un **service de veille territoriale personnalisée** : futur•e garde un œil sur le territoire de l'utilisateur et le prévient quand quelque chose bouge.

Les **newsletters automatisées territoriales sont un canal de diffusion du Fil, pas le produit lui-même.** Le produit est Le Fil. La newsletter, les alertes et l'espace vivant en sont les manifestations.

On distingue donc trois niveaux :

| Niveau | Contenu |
|---|---|
| **Produit** | Le Fil futur•e (catégorie : veille territoriale personnalisée) |
| **Promesse** | « Nous gardons un œil sur votre territoire et nous vous prévenons quand quelque chose change. » |
| **Canal** | Newsletter mensuelle personnalisée + alertes ciblées + espace futur•e vivant |

---

## 1. Ce que le repo raconte déjà (audit)

L'audit montre que la couche récurrente **n'est pas une idée neuve** : elle est déjà nommée, pricée, partiellement codée et entièrement spécifiée côté éditorial. Synthèse par catégorie.

### 1.1 Déjà codé ou partiellement codé

| Élément | Fichier | Statut |
|---|---|---|
| Plans et matrice de capacités (`free` / `one_shot` / `suivi` / `foyer`) | `src/lib/access.ts` | Codé |
| Lecture du statut d'abonnement serveur | `src/lib/subscription.ts` | Codé |
| Produits checkout (rapport 14 €, suivi 9 €) | `src/lib/checkout-products.ts` | Codé |
| Entitlements Stripe (suivi-solo, suivi-foyer, one-shot) | `src/app/api/stripe/webhook/route.ts` | Codé |
| Crédit 14 € one-shot vers Suivi + email programmé J+7 | `src/app/api/stripe/webhook/route.ts` | Codé (email Resend planifié) |
| Création PaymentIntent (one-shot 14 €, suivi-solo 9 €) | `src/app/api/stripe/create-payment-intent/route.ts` | Codé (pas de prix foyer) |
| Liste d'attente Suivi (table + API + RLS) | `migrations/003_suivi_waitlist.sql`, `api/suivi-waitlist/route.ts` | Codé |
| Toggles `newsletter_enabled` / `notifications_enabled` par compte | `src/lib/user-account.ts`, `access.ts` | Codé (flags, pas d'envoi) |
| Comparateur de villes (annoncé exclusif Foyer) | `src/app/(public)/comparateur/page.tsx` | Partiel |
| Infra email transactionnel (Resend) | `src/lib/resend.ts`, webhook | Codé |

### 1.2 Écrans déjà présents

| Écran | Fichier | Statut |
|---|---|---|
| Landing « Suivi · Bientôt disponible » (hero, 4 features, prix 9 €/mois, 30 j offerts, closing band) | `src/app/(public)/suivi-bientot/page.tsx` | Codé, `noindex` |
| Formulaire liste d'attente (email, commune, motivation) | `src/components/SuiviWaitlistForm.tsx` | Codé |
| Bloc fin de module « Les données évoluent. Le territoire aussi. » | `src/components/report/SuiviWaitlistBlock.tsx` | Codé |
| Paywall pages Agir « Le Suivi · prochainement » | `src/components/PaywallGate.tsx` | Codé |
| Carte pricing « Suivi » sur la landing (9 €/mois, à venir) | `src/components/FutureELanding.tsx` | Codé |
| Espace compte : promesse « une alerte si les données changent » (gratuit) | `src/app/(account)/compte/page.tsx` | Codé |
| Teaser wizard « Suivi 9 €/mois · prochainement » | `src/components/wizard/WizardTeaser.tsx` | Codé |

### 1.3 Composants liés au suivi

- `SuiviWaitlistForm`, `SuiviWaitlistBlock` : capture d'intérêt.
- `PaywallGate` : gate des contenus actionnables derrière l'ouverture du Suivi.
- Events PostHog déjà instrumentés : `suivi_waitlist_joined`, `follow_waitlist_cta_viewed`, `follow_waitlist_cta_clicked`, `payment_completed`, `payment_intent_created`, `pricing_page_viewed`.

### 1.4 Textes marketing existants

- Landing Suivi : « Le rapport interactif ne s'arrête pas à un PDF. Avec le Suivi, il devient vivant. »
- Closing band : « Ce n'est plus une projection qu'on consulte. C'est une relation qu'on tient avec son territoire. »
- Bloc fin de module : « Ce rapport est une photographie. Votre commune continuera d'évoluer. »
- Compte gratuit : « Un fil continu, pas un faux dashboard. »
- Signature newsletter : « Pour votre lecture lente, L'équipe futur•e. »

### 1.5 TODO et commentaires pertinents

- `docs/synthesis-cache-todo.md` : cacher les synthèses IA « non scalable une fois les abonnements lancés ». Prérequis technique au scale de la veille.
- `checkout-products.ts` : « Les 14 € seront déduits à l'ouverture du Suivi (prochainement). »
- `SuiviWaitlistBlock.tsx` : « jamais présenté comme un produit commercialisable » tant que non lancé.
- `navigation.ts` : pages thématiques `air`, `eau` en badge « Bientôt » (futures sources de veille).

### 1.6 Idées produit déjà présentes dans la documentation

- **Vision produit (02.1)** : la couche 6 du produit est nommée « La couche de suivi, notifications et alertes. Newsletter mensuelle personnalisée, alertes ciblées sur événements publics, mises à jour du rapport. **Ce qui justifie l'abonnement récurrent dans le temps.** »
- **Features transversales (02.4)** : Mode Foyer (2 à 6 membres, matrice croisée, comparateur, section newsletter dédiée), Newsletter mensuelle (mode artisanal via Buttondown puis automatisé à 200-300 abonnés), Notifications ciblées (max 2/mois Suivi, 3/mois Foyer).
- **Prompt 8 — Notification personnalisée** : entièrement spécifié. Quatre types (seuil franchi, alerte sanitaire, amélioration positive, décision locale), test à trois critères (réel + concerne le profil + info utile), contraintes de format et de fréquence.
- **Prompt 9 — Newsletter mensuelle** : entièrement spécifié. Six sections, ton « lecture personnalisée du mois climatique à travers le prisme d'un profil », positionnement explicite « c'est ce qui justifie l'abonnement récurrent dans l'esprit de l'abonné ».
- **Prompt 7 — Synthèse Foyer** : existe (couche household).
- **Journal des décisions produit (02.7)** : pricing validé 17/04/2026, crédit one-shot vers Suivi, newsletter dans le MVP en mode artisanal, notifications automatisées repoussées en v1.5/v2.

### 1.7 Éléments abandonnés ou incomplets

- **Plan Foyer** : présent dans le code (entitlements, matrice, plan label) mais pas de prix Foyer dans `create-payment-intent` (seuls one-shot et suivi-solo sont câblés). Comparateur annoncé exclusif Foyer mais accessible publiquement aujourd'hui.
- **Envoi réel** newsletter/notifications : flags `newsletter_enabled` / `notifications_enabled` existent, mais aucun moteur d'envoi ni de veille (cron, Buttondown, file d'événements) n'est codé. C'est le chaînon manquant.
- **Notifications push** : spécifiées (Prompt 8) mais décision documentée de les repousser en v1.5/v2.

### 1.8 Tout ce qui ressemble à un futur abonnement

Le faisceau est sans ambiguïté : page coming-soon dédiée, waitlist en base, deux plans récurrents (`suivi`, `foyer`), crédit de conversion one-shot vers récurrent codé, deux prompts système prêts, et une couche produit nommée dans la vision. **Le Fil futur•e est le produit central de la phase 2, déjà à 70 % pensé.**

---

## 2. Synthèse stratégique

### A. La vision implicite de la veille aujourd'hui

La veille est conçue comme **la transformation d'une photographie en relation**. Le rapport est un instantané ; la veille est ce qui maintient le lien dans le temps et brise le « cycle d'amnésie climatique » (formule du journal des décisions). La valeur n'est pas l'accès, c'est l'**attention déléguée** : quelqu'un lit les données publiques à la place de l'utilisateur et ne le dérange que lorsque c'est utile. La newsletter mensuelle est posée comme le cœur battant, les notifications comme l'exception à haute valeur, le tout sous un principe de **non anxiété** (jamais de sur-notification, jamais de pics ponctuels, jamais la nuit).

### B. Ce qui manque pour en faire un produit cohérent

1. **Le moteur** : aucune file d'événements territoriaux ni cron d'envoi. Tout l'éditorial est prêt, rien ne se déclenche.
2. **La source d'événements** : la veille a besoin d'un flux à surveiller (nouveaux arrêtés CatNat GASPAR, changements VigiEau, nouvelles données intégrées, avis sanitaires). Les connecteurs data existent côté rapport mais pas de détection de **changement** (diff entre deux états).
3. **Le canal d'envoi** : Resend transactionnel est là, mais pas l'outil newsletter (Buttondown prévu).
4. **Un nom qui porte la valeur** (voir section 4).
5. **Le cache des synthèses** : prérequis de coût avant d'ouvrir les vannes.

### C. Contradictions à arbitrer

1. **Prix récurrent** : le repo dit **9 €/mois** (et 15 €/mois Foyer) ; la note stratégique actuelle parle de **49 €/an** et garde 9 €/mois « disponible mais non mis en avant ». 49 €/an ≈ 4 €/mois : c'est un repositionnement fort (veille à faible engagement annuel) vs le mensuel à haute intention. À trancher.
2. **Prix du rapport** : repo **14 €** ; note actuelle **14 € fondateur / 19,99 € public**. Cohérent (le 14 € devient le prix fondateur), à acter.
3. **Crédit 14 € vers Suivi** : codé pour un Suivi à 9 €/mois (« couvre le mois 1 et 5 € du mois 2 »). Si le Suivi passe à 49 €/an, la mécanique de crédit doit être réécrite.
4. **Le mot « Suivi »** lui-même décrit une fonctionnalité, pas une valeur (voir section 4).

### D. Opportunités les plus fortes

1. **Tout l'éditorial est déjà écrit.** Le coût restant est surtout technique (moteur + canal), pas conceptuel. Time-to-market court.
2. **La newsletter mensuelle artisanale** peut lancer Le Fil **sans moteur automatisé** : 6 mois de rédaction assistée suffisent à valider la rétention et le willingness-to-pay avant tout investissement backend.
3. **Le crédit one-shot vers récurrent** est un tunnel de conversion rare et déjà codé : il transforme l'achat de rapport en porte d'entrée d'abonnement.
4. **Le repositionnement de nom** (de « Suivi » vers « Le Fil ») peut à lui seul augmenter le willingness-to-pay, car il vend une relation et un service rendu, pas un accès.

---

## 3. Modèle économique et tarification

### 3.1 Deux produits distincts

| Produit | Question | Forme | Tarif |
|---|---|---|---|
| **Rapport interactif** | Que faut-il savoir sur mon territoire ? | One-shot, à conserver | 14 € fondateur, puis 19,99 € public |
| **Le Fil futur•e** (catégorie : veille territoriale personnalisée) | Qu'est-ce qui a changé depuis la dernière fois ? | Récurrent | 49 €/an (hypothèse principale) ; 9 €/mois disponible mais non mis en avant |

Plan **Foyer** (multi-membres) : palier supérieur du Fil, déjà prévu côté code (matrice, comparateur exclusif, section newsletter dédiée). Prix à fixer (repo : 15 €/mois).

### 3.2 Réflexion tarifaire conservée (état actuel)

- **14 €** : prix fondateur possible du rapport interactif (déjà en place dans le repo).
- **19,99 €** : prix public envisagé du rapport interactif.
- **49 €/an** : hypothèse de prix du Fil (engagement annuel, faible friction, cohérent avec un service de fond plutôt qu'un usage actif).
- **9 €/mois** : éventuellement disponible mais **non mis en avant** (capte la haute intention, mais le mensuel signale un usage actif que la veille n'a pas besoin de revendiquer).

Point de vigilance : la mécanique « 14 € déduits à l'ouverture du Suivi » est codée pour un mensuel à 9 €. Si Le Fil devient annuel à 49 €, réécrire le crédit (par exemple : 14 € déduits de la première année du Fil).

### 3.3 Exemples de valeur du Fil

- nouveaux arrêtés CatNat reconnus pour la commune ;
- évolution des restrictions d'eau (VigiEau) ;
- alertes qualité de l'air ;
- nouvelles données publiques intégrées à futur•e ;
- événements (décisions locales, plans climat) touchant la commune ;
- nouvelles analyses éditoriales ;
- évolution observée du territoire dans le temps.

---

## 4. Le produit récurrent : Le Fil futur•e

### 4.1 Décision de naming

Le mot **« Suivi »** décrit une fonctionnalité, pas une valeur : il dit « vous gardez accès », pas « quelque chose vit pour vous ». **« Veille »** est juste mais trop professionnel et trop froid (registre B2B : veille juridique, veille concurrentielle). Le bon registre pour le grand public n'est pas « on surveille pour vous » mais « vous recevez l'essentiel, sans effort ».

Nom maître retenu : **Le Fil futur•e**. Moins froid que « veille », moins fermé que « journal », moins anxiogène que « surveillance », et assez large pour contenir lecture mensuelle, alertes, recommandations et dashboard sans enfermer le produit dans une seule logique. Il prolonge le vocabulaire déjà présent dans le produit (« un fil continu, pas un faux dashboard », espace compte).

### 4.2 Architecture en quatre niveaux

**1. Le produit**
**Le Fil futur•e.** La relation calme et continue avec son territoire. Un produit récurrent distinct du rapport (voir section 0).

**2. La promesse**
> **Ce qui change autour de chez vous, suivi et expliqué.**

Une relation, pas un flux. Le Fil n'est pas un feed qui défile : c'est un fil qu'on garde. Signature de positionnement :
> **Pas un fil qui défile. Un fil qu'on garde.**

**3. Les canaux** (par où Le Fil arrive jusqu'à l'utilisateur)
- **La lecture mensuelle** : le rendez-vous éditorial, par email, le premier lundi du mois. Rythme calme et synthétique.
- **Les Signaux** : alertes ponctuelles, par notification ou email, uniquement quand quelque chose change vraiment.
- **L'espace futur•e** : la consultation à la demande sur le web (dashboard + bibliothèque Agir).

**4. Les briques internes** (ce que Le Fil contient)
- **Une lecture mensuelle** : la synthèse personnalisée du mois (rythme).
- **Les Signaux** : la couche d'alertes, déclenchée seulement sur un changement réel et pertinent (nouvel arrêté CatNat, évolution VigiEau, qualité de l'air, canicule, nouvelles données).
- **Les recommandations Agir** : la bibliothèque de leviers documentés, accessible dans le Fil.
- **Un dashboard vivant** : les indicateurs du territoire, suivis dans le temps.

Note : la lecture mensuelle et les Signaux sont à la fois des **briques** (ce qu'elles sont) et des **canaux** (par où elles arrivent). Agir et le dashboard vivent dans l'espace futur•e. Conformément au principe directeur, **la newsletter reste un canal de diffusion, jamais le produit.**

### 4.3 Cadre stratégique : deux promesses qui coexistent

Le Fil tient ensemble deux promesses que la plupart des produits opposent :

- **Le rythme** : recevoir une lecture régulière, calme, synthétique. C'est le registre digest/briefing (couper le bruit, recevoir l'essentiel). Porté par **la lecture mensuelle**.
- **Le signal** : ne pas manquer ce qui compte vraiment pour son territoire. C'est le registre alerte personnalisée (stay ahead, le produit prépare la lecture pour vous). Porté par **les Signaux**.

L'intérêt de « Le Fil » est précisément qu'il **peut contenir les deux** sans enfermer le produit dans une seule logique. Un nom trop centré rythme (« Journal », « Digest ») exclurait le signal ; un nom trop centré signal (« Signaux », « Alertes ») durcirait la marque et perdrait le calme. Le Fil reste le contenant neutre et chaleureux des deux.

### 4.4 Positionnement : ne jamais présenter Le Fil comme un feed

Le seul angle mort du mot « fil » est sa proximité avec le fil d'actualité (scroll infini, flux anxiogène). C'est l'exact inverse du positionnement futur•e. Il faut donc contre-positionner **explicitement et systématiquement** :

- Le Fil est une **relation calme et continue** avec son territoire, pas un flux à consommer.
- Signature de rappel : **« Pas un fil qui défile. Un fil qu'on garde. »**
- Pas de logique d'engagement, pas de notifications de remplissage : les Signaux ne se déclenchent que sur un changement réel (test à trois critères du Prompt 8).

### 4.5 Classement final des noms étudiés

1. **Le Fil futur•e** : retenu. Compromis optimal, moins froid que veille, moins fermé que journal, non anxiogène, contenant des deux promesses.
2. **Les Signaux** : excellent, mais **comme brique d'alertes à l'intérieur du Fil**, pas comme nom maître. Trop centré signal pour porter seul le calme de la marque.
3. **Votre territoire, mois après mois** : pas un nom de produit, mais une **excellente accroche** (claire, non anxiogène, très B2C).
4. **Journal de votre territoire** : écarté, chaleureux mais **en collision avec le rapport interactif**, déjà narratif et éditorial. Brouille la frontière rapport / produit récurrent.
5. **La Vigie futur•e** : intéressant et poétique (quelqu'un qui regarde au loin et prévient), mais **trop conceptuel**, pas immédiatement compris. À garder en réserve de test, pas en candidat principal.

Mots écartés en amont : **Surveillance** (anxiogène, casse la marque), **Veille** (trop B2B/froid), **Bulletin** (nomme le canal, pas le service).

### 4.6 « Suivi » : slug technique, plus jamais la valeur

« Suivi » peut rester un **nom technique interne** (plan `suivi` en base, `suivi-solo` / `suivi-foyer` côté Stripe, routes existantes). Il ne doit plus porter la valeur marketing ni apparaître dans la copy destinée à l'utilisateur. Toute la communication passe par **Le Fil**.

---

## 5. Comparateur de vie et modèle multi-territoires

### 5.1 Le changement de nature du produit

futur•e passe d'un **produit d'analyse** (« Que vaut cette commune ? ») à un **produit d'orientation** (« Où est ma place ? »). Le comparateur de vie n'est pas une fonctionnalité de plus : c'est potentiellement la **nouvelle porte d'entrée** du produit, et une catégorie plus large que le rapport.

Funnel actuel :
> Nom de commune → Rapport → Le Fil

Funnel cible :
> Projet de vie → Comparateur → Rapport → AskFuture → Le Fil

Cette bascule colle au slogan « Choisir où vivre dans un monde qui change ». La question « Où devrais-je vivre ? » a un marché plus large et plus fréquent que « Que vaut cette commune ? ».

### 5.2 Parcours produit visé

1. **Texte libre** : l'utilisateur décrit son projet de vie (« Nous avons un enfant de 5 ans et cherchons un endroit sain pour grandir »).
2. **Reformulation IA** : futur•e reformule et confirme la compréhension. C'est ici qu'on **extrait les contraintes dures et les préférences molles** (voir 5.3), sans afficher de formulaire.
3. **Cadrage optionnel et conversationnel** : « Souhaitez-vous limiter la recherche à une région ? » → boutons « Toute la France » / « Oui, préciser ». Pas de filtres région/taille imposés d'emblée : on ne retombe pas dans un moteur immobilier classique.
4. **Résultats** : 3 territoires compatibles + synthèse courte.
5. **« Pourquoi ces territoires ? »** (V2) : explicitation des critères privilégiés (qualité de l'air, exposition limitée aux fortes chaleurs, services, cadre familial). Transforme le moteur en **conseiller**.

### 5.3 Le vrai défi n'est pas le scoring, c'est l'absurdité

Le risque produit n'est pas un classement imparfait, c'est un résultat manifestement absurde (« proche de l'océan » qui renvoie Angoulême parce que son score climat est excellent). Un seul résultat absurde et l'utilisateur conclut « ce truc ne comprend rien ».

Règle d'architecture : **séparer contraintes dures et préférences molles.**

- **Contraintes dures (éliminent avant tout scoring)** : littoral, proximité d'une zone, budget, « pas trop loin de ma famille ». Filtres d'exclusion.
- **Préférences molles (optimisées par score)** : qualité de l'air, chaleur, pollution, vitalité.

Les filtres existent donc, mais ils sont **déduits du texte libre, pas demandés**. On garde le conversationnel et on devient increvable sur les incompatibilités évidentes, même avec un scoring V1 modeste.

### 5.4 Compatible ET réaliste

Optimiser le climat dans le vide mène à la Creuse, la Lozère, le Cantal : climat idéal, mais personne n'y déménage. futur•e ne minimise pas le risque climatique, il cherche **un lieu où une vie tient** : climat + viabilité (services, emploi, connexion, vitalité). C'est aussi une vérité que la voix éditoriale peut assumer (« les havres climatiques les plus purs se vident ; voici la frontière réaliste »). C'est un différenciateur défendable, pas un compromis.

### 5.5 Logique économique : le comparateur ne se vend pas, il débloque

Le comparateur est un **produit de recherche** (créer l'intention), pas un produit d'analyse (générer du revenu direct). Analogie : Google ne vend pas la recherche, SeLoger ne vend pas le moteur, Meilleurs Agents ne vend pas l'estimation. Ces outils créent l'intention ; le revenu vient après.

Donc : **le comparateur est gratuit** (3 territoires + synthèse courte + aperçus), et il sert de machine d'acquisition vers les produits payants.

Garde-fou non négociable : **le matching et le classement sont déterministes** (calcul sur indicateurs pré-calculés, zéro appel LLM par recherche). L'IA n'intervient que sur deux points bon marché et cachables : (a) parser le texte libre en contraintes + préférences, (b) le « pourquoi ces territoires ». La prose narrative coûteuse reste dans le rapport payant. Sans cette règle, le comparateur gratuit devient une machine à brûler des tokens.

### 5.6 Le compte devient centré personne/foyer, pas commune

Le comparateur casse l'hypothèse « 1 utilisateur = 1 commune = 1 rapport ». Le compte se réorganise autour d'une personne ou d'un foyer qui détient une **collection de territoires** :

- **Mon territoire actuel** (ex. La Rochelle)
- **Territoires suivis** (ex. Vannes, Angoulême)
- **Territoires explorés** (ex. Niort, Rennes)
- **Mes rapports** : la liste des rapports achetés, par territoire.

Le rapport devient un **produit unitaire** (un territoire), accumulable dans le compte.

### 5.7 Échelle de prix consolidée

| Palier | Prix | Contenu |
|---|---|---|
| **Comparateur** | Gratuit | Projet de vie → 3 territoires compatibles + synthèse courte + aperçus |
| **Rapport** | 19 € (14 € fondateur) | Analyse complète d'un territoire, modules, AskFuture |
| **Pack Décision** | 39 € | 3 territoires (composé depuis la sortie du comparateur). **Probable hero SKU.** |
| **Le Fil futur•e** | 49 €/an | 1 territoire principal (dashboard vivant complet) + 1 à 2 territoires observés (Signaux + mention mensuelle). Foyer : davantage d'observés. |

Le **Pack Décision** est sans doute le meilleur produit : 3 rapports valent 57 € à l'unité, le pack à 39 € fait *deal* et monte le panier moyen. Surtout, il change la proposition de valeur : on n'achète plus « un rapport » mais « de l'aide à choisir entre plusieurs futurs », ce qui vaut psychologiquement bien plus que 19 €. Son CTA est déjà écrit par le comparateur (« Explorer ces 3 territoires, 39 € »).

### 5.8 Le funnel le plus puissant : Pack Décision → Le Fil

Le Pack et Le Fil ne sont pas séparés : **le Pack est le meilleur point d'entrée du Fil.** Qui achète 3 rapports pour décider veut suivre ces territoires *pendant* qu'il décide (la décision dure des mois).

> Pack Décision 39 € (3 rapports) → « Gardez votre shortlist en veille pendant que vous décidez » → Le Fil 49 €/an (1 principal + territoires observés).

C'est l'usage qui justifie enfin les « territoires observés » du Fil, et il branche directement sur l'upsell Foyer déjà prévu (Foyer = plus de territoires observés). Le principal a le dashboard vivant complet ; les observés n'ont que les Signaux et une mention dans la lecture mensuelle (léger à produire).

### 5.9 SEO : la longue traîne climato-consciente

Le head term (« où vivre avec un enfant ») est saturé (SeLoger, Meilleurs Agents, palmarès presse). futur•e ne gagne pas là frontalement. Sa mine d'or est la **longue traîne de la relocation climat** : « ville fraîche pour la retraite », « où vivre près de l'océan sans risque de submersion », « commune où l'eau ne manquera pas en 2050 ». Concurrence quasi nulle, angle futur•e gagnant. Objectif : **posséder la longue traîne, pas concurrencer le palmarès des villes.**

### 5.10 Objectif d'apprentissage de la V1

La V1 ne sert pas à valider le scoring ni l'algorithme. Elle sert à répondre à une question : **les gens préfèrent-ils commencer par leur projet de vie plutôt que par une commune ?**

Signal mesurable : le taux de conversion **comparateur → rapport/pack**, comparé à celui des entrées par nom de commune. Si le trafic comparateur convertit mieux, la thèse « machine d'acquisition » est validée ; s'il convertit moins, c'est un canal de notoriété, pas d'acquisition. Instrumenter les deux origines dès le jour 1.

Principe de prudence V1 : **étroite et increvable sur les incompatibilités évidentes** plutôt que large et maligne. Accepter un scoring imparfait, refuser tout résultat absurde.

### 5.11 Le vrai coût de la V1 est la data, pas l'UI

Un rapport se génère à la demande sur la commune choisie. Un comparateur doit **scorer les ~35 000 communes** sur des indicateurs harmonisés et comparables nationalement, plus une couche **viabilité/services** qui n'existe pas encore. C'est le vrai gros lift de la V1, à budgéter comme tel, bien plus que l'interface.

---

## 6. Prochaines décisions à prendre

1. Trancher le prix récurrent : **49 €/an** (recommandé comme mise en avant) vs 9 €/mois (secondaire).
2. Acter rapport **14 € fondateur / 19,99 € public** (ou 19 € net dans l'échelle comparateur).
3. Nom : **Le Fil futur•e** (validé). À tester sur la compréhension immédiate (Le Fil vs Les Signaux) et sur la connotation feed.
4. Réécrire la mécanique de crédit 14 € si Le Fil devient annuel.
5. Décider du séquencement : lecture mensuelle artisanale d'abord (rétention), moteur de Signaux et alertes ensuite.
6. Fixer le prix et le périmètre du palier Foyer.
7. Valider le passage du compte à un modèle **personne/foyer multi-territoires** (actuel / suivis / explorés / mes rapports).
8. Acter le **Pack Décision (39 €, 3 territoires)** et le funnel Pack → Le Fil.
9. Décider du périmètre data V1 du comparateur : indicateurs nationaux comparables + couche viabilité/services.
10. Confirmer la règle de **matching déterministe** (coût) et l'architecture **contraintes dures vs préférences molles** (anti-absurdité).

---

*Document futur•e · réflexion business model B2C · à faire vivre.*
