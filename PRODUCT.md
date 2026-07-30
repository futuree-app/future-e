# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Lecteur primaire** : une personne qui doit prendre une **décision résidentielle concrète à partir de son projet de vie**. Son parcours va du large au précis : choisir entre plusieurs territoires, approfondir une commune retenue, puis examiner un bien précis. Le point d'entrée varie (comparateur, commune connue, page thématique), la nature du travail reste la même : hiérarchiser des faits, voir les compromis, faire les vérifications utiles.

Le déclencheur est un **moment**, jamais une catégorie démographique : ouvrir un portail immobilier, attendre un enfant, obtenir un télétravail complet, hériter d'une maison, préparer une retraite, se projeter à 10, 20 ou 30 ans. L'invariant est comportemental : quelqu'un prêt à investir du temps et de l'argent dans une décision importante quand il en perçoit la valeur, qui lit, cherche et compare, sans avoir le temps ni les outils pour assembler seul l'information pertinente.

Sa question fondatrice : **« Qu'est-ce que je risque d'oublier dans cette décision ? »** Ce qu'il a à perdre : acheter au mauvais endroit, sur-payer un territoire qui se dégrade, en sous-estimer un autre qui tient, et vivre dix ans avec le doute de s'être trompé.

**Lecteur secondaire important** : l'habitant qui cherche à comprendre son lieu actuel et sa trajectoire, sans projet de départ.

**Non prioritaire** : le professionnel (notaire, CGP, assureur). Le B2B est un relais envisagé pour 2027 (ADR-0008) et n'est pas le lecteur de référence du produit.

Ce que ce lecteur rejette : discours militants stéréotypés, visualisations incompréhensibles, contenus alarmistes sans prise concrète, synthèses vagues, outils qui paraissent crédibles sans l'être, gestes individuels présentés comme solutions systémiques, ton qui infantilise. Ce qu'il valorise : qu'on lui montre les compromis plutôt que des certitudes, qu'on lui dise « on ne sait pas » quand c'est le cas, qu'on relie plusieurs sujets au lieu d'additionner des données.

## Product Purpose

futur•e transforme des milliers de données publiques (climat, santé environnementale, eau, qualité de l'air, risques naturels, démographie, mobilité, vie locale) en une lecture claire, personnalisée et utile pour une décision de vie.

**Vision** : habiter dans un monde qui change.
**Problème** : le monde devient plus difficile à lire. Les données existent mais elles sont dispersées ; les signaux existent mais ils sont difficiles à interpréter ; les conséquences existent mais elles restent invisibles au moment où les décisions se prennent.
**Promesse** : futur•e aide à prendre de meilleures décisions de vie en donnant une compréhension claire des territoires.

**Le succès** se mesure à une décision prise en connaissance de cause : le lecteur sait ce qu'il arbitre, ce qu'il accepte, ce qu'il ignore encore. Le verbe qui décide reste toujours de son côté. futur•e n'a droit qu'au rôle de retrait : enlever le hasard, l'angle mort, le doute d'avoir oublié l'essentiel.

## Positioning

futur•e est un **site de choix de vie qui utilise les risques pour éclairer ces choix**. La promesse centrale est la **compatibilité territoriale à long terme**.

Le différenciant : la prise en compte des **nuisances et risques invisibles** que les comparateurs immobiliers ou de services ignorent (chaleur future, inondation et submersion, qualité de l'air, bruit, sites industriels à risque, sols, pression agricole), croisés avec les critères de vie ordinaires (mobilité, vie locale, démographie, écoles, culture). Le moteur est un **moteur de compatibilité territoriale**, ce qui dépasse le seul moteur climat.

Le moat est l'**assemblage** : près de 30 critères déterministes, sourcés et calculables sur environ 35 000 communes, assemblés en arbitrages lisibles. Aucun composant pris isolément n'est propriétaire ; la largeur et la cohérence du croisement le sont.

Ce que futur•e n'est pas : un observatoire climatique, un tableau de bord d'indicateurs, un classement des meilleures villes, un produit anxiogène.

## Operating Context

- Le lecteur arrive à un **moment de décision**, souvent en parallèle d'un portail immobilier, d'une recherche d'emploi, d'un projet familial. Il compare futur•e à ce qu'il ferait autrement : quelques recherches Google et des récits contradictoires.
- Trois portes d'entrée coexistent : le **comparateur** (« où vivre », arbitrage entre communes), l'**entrée commune** (rapport sur un territoire donné), les **pages thématiques** Savoir / Agir et les pages territoriales indexées (levier de découvrabilité à l'échelle des ~35 000 communes).
- Le parcours descend en échelle : territoire (commune), puis autour, quartier, et **adresse** (module Logement). Chaque descente d'échelle demande une donnée que le lecteur fournit.
- Usage majoritairement en session longue de lecture et de comparaison, sur desktop comme sur mobile. Pas d'application native (décision documentée : `docs/vault/arbitrages/app-native-reportee.md`).
- Le contenu se lit en français, s'adresse à un public français, sur des territoires français.

## Capabilities and Constraints

**Ce qui existe et fonctionne**

- Comparateur de compatibilité territoriale sur ~35 000 communes, avec près de 30 critères (`PREFERENCE_KEYS`), déterministe, sans score synthétique.
- Comparaison de 2 ou 3 communes (Pack Décision, 39 €), matrice d'arbitrages sur 7 thèmes.
- Rapport territoire d'une commune (14 €), lecture de ce que le territoire devient face au climat, sources publiques croisées, AskFuture (3 questions).
- Modules et échelles : Territoire, Autour, Quartier, Logement (grain adresse), Dossier de décision.
- Pages Savoir (comprendre) et Agir (faire), pages thématiques indexables par commune.
- Registre de matérialité déterministe au-dessus des modules payants (evaluate() + couverture, faits de décision typés).
- Compte, projet persisté, dossiers d'adresse, droit territorial par territoire lu.

**Contraintes techniques et de données**

- Stack : Next.js 16 (App Router) sur Vercel, React 19, Tailwind 4, Supabase (auth, données, RLS), Stripe (paiement), Resend (email), PostHog + Clarity (analytics). Node 24.
- Cette version de Next comporte des ruptures d'API : consulter `node_modules/next/dist/docs/` avant d'écrire du code.
- Déploiement en production au push sur `main`. Pas d'étape Preview dans les plans.
- La maille de référence est la **commune (code INSEE)**, jamais le code postal. Certaines données descendent au grain adresse, d'autres restent communales ; l'échelle réelle s'affiche toujours.
- Les données proviennent de sources publiques identifiables : INSEE, DRIAS / Météo-France (TRACC), Géorisques, BRGM, ADEME, IGN, BPE, Hub'Eau, Prométhée / DREAL, GisSol / RMQS, Agences de l'eau, RNA, OSM.
- Référentiel de réchauffement : +1,5 / +2 / +3 °C global équivaut à +2 / +2,7 / +4 °C en France. Toute production qui cite un horizon porte cette équivalence.
- L'IA rédige à partir de faits déterministes déjà sélectionnés ; elle ne sélectionne jamais les faits ni ne calcule les valeurs.

**Modèle économique**

**« Disponible » veut dire achetable ET livré.** Quatre états, pas trois. Un futur travail ne doit jamais traiter « décidé » comme une idée non validée, ni « écarté » comme une piste encore ouverte, ni « achetable » comme « fini ».

| État | Offre | Prix | Contenu |
| --- | --- | --- | --- |
| **Achetable et livré** | Rapport Territoire | 14 €, achat unique | La lecture d'une commune : ce qu'elle devient (climat, eau, risques), sources croisées, AskFuture 3 questions |
| **Achetable et livré** | Pack Décision | 39 €, achat unique | Comparaison complète de 2 ou 3 communes, matrice d'arbitrages sur 7 thèmes |
| **Achetable, pas encore éprouvé** | **Dossier Adresse** | **39 €, ou 25 € si le territoire est déjà payé** | **Territoire + Autour + Logement, au grain adresse.** Parcours d'achat déployé en production le 30/07/2026, **aucun achat réel à ce jour**, et le module Logement reste incomplet |
| Écarté | Le Fil payant (veille) | — | Abandonné |
| Écarté | Plan Foyer | — | Abandonné : le foyer n'est pas une échelle du produit |
| Écarté | Abonnement mensuel | — | Abandonné ; une récurrence épisodique (pass 3 ou 6 mois) reste une hypothèse ouverte, non décidée |

- **Les deux offres à 39 € ne sont pas un problème à résoudre par le prix.** Le **Pack élargit** la recherche entre plusieurs territoires ; le **Dossier Adresse approfondit** un lieu précis. Ce sont deux mouvements opposés au même moment de la décision, et un lecteur qui hésite entre les deux n'a pas le même besoin dans les deux cas.
- Le prix du Dossier le dit déjà dans le code : **39 € plein, 25 € quand le territoire de la commune est déjà payé** (`DOSSIER_PRICE`, déduction de 14 €). Le Dossier absorbe le Territoire au lieu de le revendre. La déduction est un état recalculé, jamais un crédit consommable, et elle vaut pour tous les biens d'une commune payée.
- Le **Dossier Adresse** porte les échelles Autour et Logement, et c'est pourquoi le Rapport Territoire à 14 € ne promet aucun enrichissement gratuit par les modules à venir. Concevoir futur•e autour du seul duo 14 € / Pack serait concevoir l'offre précédente.
- Nuance de câblage, à connaître avant d'affirmer quoi que ce soit sur l'offre : `checkout-products.ts` ne décrit que le Rapport Territoire. Les trois produits sont câblés côté serveur dans `api/stripe/create-payment-intent` (`one-shot`, `pack-decision`, `address-dossier`). Lire le premier fichier seul donne une image fausse.
- Gratuit : la largeur, le tunnel de découverte, l'Agir générique.
- Franchise en base de TVA. La mention exacte est « TVA non applicable, art. 293 B du CGI ». Jamais « TVA incluse ».
- B2B envisagé comme relais à horizon 2027, hors périmètre produit actuel.

**Explicitement non décidé ou abandonné**

- Récurrence B2C : un pass de recherche épisodique (3 ou 6 mois) reste une hypothèse ouverte. L'abonnement mensuel, le plan Foyer et la couche « Le Fil » sont **abandonnés** ; `BUSINESS_MODEL_B2C.md` décrit un état antérieur du produit et ne fait pas autorité (il présente notamment Le Fil comme « le produit central de la phase 2 », ce qui est faux aujourd'hui).
- Le **Dossier Adresse** est achetable depuis le 30/07/2026 sans avoir été éprouvé : aucun achat réel n'a eu lieu, et le module Logement qu'il porte reste incomplet. Son périmètre exact par échelle et son intake restent à préciser. Sa relation au Rapport Territoire déjà acheté, elle, **est tranchée** : déduction de 14 €, donc 25 €.
- Le foyer n'est pas une échelle du produit : la composition du ménage est une contrainte du projet. L'unité métier est le projet, puis le dossier.
- Prix immobiliers (DVF) absents du moteur : aucune promesse immobilière tant qu'ils n'y sont pas.
- Surface de représentation spatiale : problème ouvert. La carte a été écartée comme donnée inerte.

**Terminologie**

Le glossaire de traduction (technique vers formulation futur•e) fait autorité : `docs/vault/doctrine/editoriale.md`. Exemples : « scénario optimiste / médian / pessimiste » pour RCP, « manque d'eau » pour stress hydrique, « empreinte carbone » toujours (« Bilan Carbone » est une méthodologie déposée, interdite). On dit « critères » plutôt qu'« indicateurs ».

## Brand Commitments

- **Nom** : futur•e, en minuscules, avec le point médian. Logo et fontes présents dans `logo/` et `public/fonts/`.
- **Vouvoiement** systématique, sans exception.
- **Tirets cadratins (—) interdits** dans tout texte produit. Virgule, parenthèses, deux points ou point.
- **Points d'exclamation interdits.**
- Pas de tournure antithétique en emphase (« c'est X, pas Y ») : affirmer directement.
- Formules bannies : « il ne tient qu'à vous », « à l'heure où », « à l'ère de », « dans un monde où », « en résumé », « pour conclure », « en somme », « globalement ».
- **La page s'adresse au lecteur, jamais à elle-même.** On ne décrit ni le format, ni l'architecture, ni les modules, ni ce qu'on ne fait pas encore. Le statut d'un contenu se porte par l'interface, jamais par une phrase qui énumère des absences.
- **L'offre n'est jamais le sujet de la phrase.** On part de la situation du lecteur, on nomme l'inconnu décisif, jamais une quantité de fonctionnalités.
- **Jamais de verdict ni de score synthétique**, ni sur un lieu ni sur une personne.
- Ne jamais citer Callendar (concurrent commercial) comme source.
- Trois piliers de ton : lucidité sans panique, données sans opinions, respect de l'intelligence du lecteur.
- Le corpus de référence est le vault `docs/vault/` (invariants, doctrines, ADR, arbitrages). Il fait autorité sur toute autre note du dépôt.

## Evidence on Hand

**Ce qui peut être mobilisé** : les **données publiques seules**, sourcées et datées, et les caractéristiques réellement observables du produit. La force de futur•e vient de sa méthode, de ses sources, de son exactitude et de ce que le produit montre à l'écran.

- Sources publiques citables : INSEE, DRIAS / Météo-France, Géorisques, BRGM, ADEME, IGN (RGE Alti), BPE, Hub'Eau, GisSol / RMQS, Prométhée / DREAL, Agences de l'eau, RNA, OSM.
- Chiffre externe le plus solide disponible : Odoxa pour ICI, 13 164 répondants, septembre 2025, **28 % des Français se disent prêts à déménager pour une commune moins exposée aux risques climatiques, 12 % changeraient de région**. À citer comme un instantané daté, jamais comme une tendance mesurée dans le temps.
- Perception du risque environnemental : Baromètre santé environnement, Santé publique France, édition 2021. Chiffre d'inquiétude uniquement, jamais transformé en chiffre de comportement.
- Assets visuels réels : photographies et couvertures dans `public/`, logo dans `logo/`.

**Absences que le futur travail ne doit jamais combler par invention**

- **Aucun témoignage, aucun client citable, aucun verbatim.** Une citation entre guillemets exige un auteur réel et nommable.
- **Aucun chiffre d'usage, d'audience ou de vente** n'est mobilisable aujourd'hui, même si le site est en ligne. Ni « déjà utilisé par », ni « des centaines de recherches », ni un événement analytics sorti de son contexte. Cette catégorie pourra s'ouvrir plus tard sous une règle stricte : un chiffre d'usage ne se cite que s'il est daté, défini, vérifiable dans l'analytics et non trompeur.
- **Aucune mention presse, aucun partenariat, aucune reconnaissance institutionnelle.**
- Aucune étude produite par une partie commercialement intéressée (portail immobilier, déménageur, promoteur, assureur) ne peut être présentée comme une source neutre.
- Jamais de série temporelle construite avec deux enquêtes différentes.

## Product Principles

1. **On éclaire, on ne décide jamais à la place du lecteur.** Recommander un choix de vie ou trancher ce qui relève de l'intime est hors du produit.
2. **Une décision vaut mieux qu'une note.** Aucun score synthétique. On révèle des compromis lisibles.
3. **Rien n'est affirmé sans source, et on montre aussi ce qu'on ignore.** L'observé, le modélisé, le projeté et l'interprété restent distincts. L'incertitude se montre.
4. **Une donnée n'a de valeur que si elle aide une décision.** Une donnée vraie mais inerte (l'altitude d'une commune de plaine) est une fuite, pas un fait. Ce qui décrit un lieu doit être distinctif et identitaire.
5. **On n'affirme jamais au-delà de ce que permet la preuve.** Un label ne promet jamais une grandeur que le calcul ne contient pas. Test avant d'afficher : si le lecteur ouvrait le calcul, se sentirait-il trahi par le mot employé ?
6. **On parle à une intelligence, jamais à une peur.** Lucidité sans alarmisme, précision sans culpabilisation. Toute copy de positionnement ouvre par le projet de vie, jamais par un danger.
7. **L'indépendance ne se monétise pas.** Ni publicité, ni vente de leads, ni affiliation immobilière, ni placement territorial payé, ni score pondéré par un intérêt commercial.

## Accessibility & Inclusion

**Cible : WCAG 2.2 AA**, comme plancher de conception et de développement. Aucun engagement public de conformité ni audit formel à ce stade, et donc aucune déclaration d'accessibilité à afficher.

Le plancher couvre : contraste suffisant, parcours clavier complet, focus visible, structure sémantique et hiérarchie de titres correctes, cibles tactiles dimensionnées, et respect de `prefers-reduced-motion` (déjà pris en charge dans `src/app/globals.css`).

Inclusion : le lecteur n'a pas à être expert du climat, de la santé environnementale ou des données publiques. Le vocabulaire technique se traduit systématiquement (glossaire éditorial), sans simplifier au point de perdre l'incertitude.
