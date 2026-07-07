# Board Logement — revue critique produit (Product Strategist)

**Date** : 2026-07-07 · **Cadre** : board extrêmement critique (Business Strategist, Editorial Writer, Software Architect). Mandat : erreurs de CONCEPTION, pas améliorations incrémentales.

**Lu avant de juger** : `docs/vault/vision/archetype-lecteur.md`, `docs/vault/vision/positionnement.md`, `docs/vault/principes/invariants.md`, `docs/vault/modules/logement.md`, `docs/board/2026-07-03-vision-module-logement-chatgpt.md`, `docs/superpowers/specs/2026-07-07-logement-synthese-auto-artefact-design.md`, et le code réel : `src/components/report/LogementModule.tsx` (1194 l.), `LogementSynthesis.tsx`, `ThermalComfortSection.tsx`, `src/app/api/synthesize-logement/route.ts`, `src/lib/logement-synthesis-cache.ts`, `src/app/(public)/savoir/[slug]/page.tsx` (vérification des slugs).

---

## La question à laquelle le module doit répondre

La doctrine la pose bien : **« que dois-je engager sur ce logement ? »** (acheter, négocier, renoncer, rénover, provisionner, rester). C'est une excellente question produit : elle est décisionnelle, datée (un moment de vie), et personne d'autre n'y répond au grain adresse avec les risques comme matière.

Le constat central de ma revue : **le module actuel répond à une autre question, « que sait-on de cette adresse ? »**. C'est un dossier d'inspection, pas encore une aide à l'engagement. Presque toutes mes critiques en découlent.

---

## Critique 1 — Le hero promet exactement le produit que la doctrine interdit (BLOQUANT)

**Problème.** `LogementModule.tsx:873-876` : le H1 dit « Ce que votre habitat devient. Confort, risques, **valeur**. » et l'intro promet « DPE, risques par adresse, **pression assurantielle et trajectoire de valeur** ». Or la valeur immobilière individuelle est PARQUÉE avec interdits fermes (estimation, décote climatique, trajectoire de valeur — `modules/logement.md`, décision Face 4 du 2026-07-03), et l'assurance est « documentée, jamais prédite ». L'aside « Les briques du module » (l.897) affiche même « Assurance et sécheresse — Lecture à venir » : une promesse en attente permanente, du méta produit-parlant-de-lui-même.

**Pourquoi c'est réellement un problème.** Ce n'est pas une copy périmée, c'est une promesse non dérivée de la doctrine : la première chose que lit l'utilisateur annonce le produit que le porteur a explicitement refusé de construire. Le lecteur cible (archétype : il rejette « les outils qui paraissent crédibles sans l'être ») verra l'écart entre la promesse (« trajectoire de valeur ») et la livraison (aucune valeur nulle part). L'écart promesse/livraison est la seule chose qu'un produit d'honnêteté ne peut pas se permettre.

**Impact produit-business.** Confiance entamée au premier écran ; et juridiquement/éditorialement, « pression assurantielle » écrite en dur contredit la ligne « ne permet pas de prédire le montant ni les conditions ».

**Bloquant.** Oui, trivial à corriger, mais la leçon de conception ne l'est pas : le hero d'un module doit être généré depuis sa question cible (« que dois-je engager sur ce logement ? »), jamais écrit avant le module. L'aside « briques » doit disparaître : le module ne se présente pas, il répond.

---

## Critique 2 — L'unité de persistance (user, insee) contredit l'unité du module (l'adresse) (BLOQUANT, fondation)

**Problème.** L'artefact logement (snapshot Face 3, choix DPE, synthèse, posture) est sauvegardé dans la table `logement` à clé `(user_id, insee)` : **un seul logement par utilisateur et par commune**. Le `factHash` de la synthèse contient bien lat/lon et dpeId, mais la ligne de cache est écrasée à chaque nouvelle adresse dans la même commune (`saveSynthesis` sur `(user, insee)`).

**Pourquoi c'est réellement un problème.** Le moment déclencheur du lecteur cible est l'ACHAT : il compare 2-3 biens, très souvent **dans la même commune** (il a déjà choisi le territoire, c'est le rôle des autres modules). C'est précisément le parcours que le modèle de données rend impossible : chaque adresse analysée détruit l'artefact de la précédente. Le cache de synthèse rate systématiquement, l'historique n'existe pas, et « comparer le bien A et le bien B » — la forme décisionnelle la plus évidente de la question « que dois-je engager ? » — n'a aucun support.

**Impact produit-business.** C'est le cas d'usage PAYANT central du module qui est structurellement cassé. Dans 5 ans, `(user, insee)` est une dette de conception, pas une fondation. Le Pack Décision a établi que futur•e vend l'ARBITRAGE (N∈{2,3}) : Logement reproduit le pattern ou passe à côté de sa monétisation naturelle.

**Bloquant.** Oui. **Recommandation** : l'unité de sauvegarde devient le logement (clé adresse/point), avec N logements par utilisateur ; la comparaison de biens vient après, mais le modèle de données doit l'autoriser dès maintenant. C'est le moment de le faire : la table est jeune, la migration 20 n'est même pas encore appliquée en base.

**Hypothèse porteuse, nommée** : je crois que le moment de vérité du module est l'arbitrage entre quelques biens précis dans une fenêtre courte (achat/location), pas la consultation contemplative de son propre logement. Si c'est faux (majorité « j'y vis »), la clé `(user, insee)` est défendable. C'est mesurable AUJOURD'HUI : `logement_analyzed.relation_inferee` + `logement_projet_declare` sont instrumentés. Regarder les chiffres avant de migrer.

---

## Critique 3 — Trois blocs d'exposition empilés au lieu du récit à niveaux de preuve : le « waouh » différenciant n'est pas construit (BLOQUANT produit)

**Problème.** L'exposition est éclatée en trois sections successives non reliées : « Risques du bâti » (chips rouges de labels Géorisques bruts + sismicité/RGA en grille, l.1091-1116), « Statut réglementaire à cette adresse » (excellent bloc), « Sinistralité indemnisée dans la commune » (bon bloc). Chacune est honnête ; ensemble, elles forment l'inventaire d'indicateurs que la doctrine proscrit (« récit décisionnel en défaut, pas un inventaire »).

**Pourquoi c'est réellement un problème.** La vision parquée (`docs/board/2026-07-03-vision-module-logement-chatgpt.md`) a identifié le vrai différenciant : **le contraste entre niveaux de preuve** — « la commune a connu / le point est cartographié / le bien a déjà été touché ». Ce contraste est LA transformation (ADR-0002) que ni Géorisques ni un portail immo ne font : Géorisques donne les couches, personne ne les met en récit hiérarchisé au point. Or les briques existent déjà toutes les trois dans la page ; il manque uniquement la mise en relation. Le bloc « Risques du bâti » en chips est le résidu SIG : des labels bruts, rouges, comptés (« 3 signaux » dans l'aside), sans hiérarchie ni implication — une donnée vraie mais inerte (invariant n°4).

**Impact.** La page a le coût cognitif de trois blocs et la valeur décisionnelle d'un seul. Le moment « je comprends ce que je risque ICI et pas dans la commune en général » — le moment qu'on ne peut pas copier — n'arrive jamais.

**Bloquant.** Oui pour la promesse du module. **Recommandation** : fusionner en UNE section « À quoi cette adresse est exposée » ordonnée par grain de preuve (le point est en zone réglementée → le point est cartographié pour tel aléa → la commune a indemnisé), les chips brutes disparaissent (elles deviennent la matière du récit, plus un bloc). Nappe/TRI s'y insèrent plus tard sans créer de 4e et 5e blocs.

---

## Critique 4 — Le bloc de clôture « Actions documentées » envoie vers le vide : 4 cartes sur 5 mènent à des 404 (BLOQUANT confiance)

**Problème, vérifié dans le code.** Les ActionCards pointent vers `/savoir/dpe-calendrier`, `/savoir/renovation-cout`, `/savoir/assurance-littorale`, `/savoir/sols-pollues` (l.1148-1176). Le registre `SAVOIR_HUBS` de `src/app/(public)/savoir/[slug]/page.tsx` ne contient AUCUN de ces slugs, et aucune route dédiée n'existe → `notFound()`. La dernière carte, « Comparer ce logement avec d'autres territoires », est une confusion catégorielle (on ne compare pas un bien à des territoires) qui renvoie vers un produit qui ne fait pas ça.

**Pourquoi c'est réellement un problème.** C'est la SORTIE du module : le moment où la lecture devient un geste. La vision et le vault s'accordent pour dire que « À vérifier avant de décider » est probablement **le vrai levier de valeur payante** (transformer une donnée abstraite en chose précise à regarder ou à demander au vendeur/syndic). À la place, le module se termine par des liens morts et une carte hors-sujet. Par ailleurs la carte « Pollution des sols à proximité » (conditionnée à `cartofriches.sol_pollue`) viole dans le bloc Agir la frontière Logement/Santé qu'on vient de purger partout ailleurs.

**Impact.** Le point de conversion émotionnel du module (le lecteur repart avec quelque chose à FAIRE) est le point le plus pauvre de la page. Et un 404 en fin de rapport payant détruit exactement la confiance que toute la rigueur amont a construite.

**Bloquant.** Oui. **Recommandation** : supprimer les cartes en l'état (un module sans bloc Agir vaut mieux qu'un bloc Agir qui ment), et reconstruire la sortie comme **« À vérifier avant de décider »** : checklist déterministe, dérivée des blocs (zone réglementée → « demandez le règlement de zone et l'état des risques ERP au vendeur » ; RGA fort → « cherchez les fissures en façade, demandez l'historique de sinistres » ; DPE non trouvé → « exigez le DPE, vérifiez le confort d'été »), adaptée à la posture déjà sondée. `Face2Implication` en est l'embryon (2 phrases) : c'est lui qu'on promeut en sortie de module, pas les cartes.

---

## Critique 5 — « Faire face à la chaleur » : la bonne discipline, au mauvais endroit, avec une phrase-gabarit creuse (secondaire, mais symptomatique)

**Problème (a) — position.** `ThermalComfortSection` est le 2e bloc de la page, avant la sonde projet et avant la synthèse. Pour ~44 % des adresses (audit couverture DPE), c'est un état C : le 2e bloc de la page est un constat d'ignorance (« ne permettent pas de qualifier »). L'honnêteté est juste (invariant n°3) ; sa position en tête d'écran est un choix de hiérarchie que rien ne justifie sinon l'ordre de dev.

**Problème (b) — `ClimateFuture` échoue au test d'inertie.** La même phrase (« Avec la progression des nuits chaudes à {commune}, … prendront davantage d'importance ») s'affiche pour toutes les communes de France, seul le nom varie. C'est de la pseudo-personnalisation en gabarit : une phrase vraie partout n'aide aucune décision nulle part (invariant n°4, fiche `feedback_signature_identitaire`). Elle a l'air intelligente ; elle est creuse. Soit elle mobilise la donnée DRIAS réelle de la commune (nombre de nuits chaudes projetées, déjà dans le produit côté Territoire), soit elle disparaît.

**Problème (c) — le socle de la Face 1 n'est pas le DPE.** L'audit l'a dit : DPE = enrichissement conditionnel, pas socle. Pour presque la moitié des adresses, le « dedans » du module n'a RIEN d'adresse-spécifique. La seule voie vers une lecture du dedans à couverture totale est la question à l'utilisateur (spec B, intake mesuré d'abord — l'étage/orientation sont des données publiques mortes). Tant que spec B n'existe pas, la Face 1 doit assumer d'être petite, pas d'occuper la 2e position de l'écran.

**Recommandation** : (a) et (c) relèvent de la spec 1b (l'ordre) et de la spec B — déjà planifiées, je les confirme ; (b) est une suppression ou une vraie donnée, pas un ajustement.

---

## Critique 6 — Face 3 « la boulangerie à 55 m » : construite avec talent, différenciante pour personne (secondaire, décision de NON-extension)

**Problème.** Le bloc « Autour de cette adresse » liste l'équipement le plus proche par catégorie (pharmacie 91 m, boulangerie 55 m…) et l'espace vert le plus proche. Architecture remarquable (snapshot, cache de tuiles, distances point↔géométrie). Mais : **un concurrent crédible le fait-il ? Oui, tous.** SeLoger, Bien'ici, Google Maps affichent les commodités autour d'une adresse, mieux (hypothèse concurrentielle à confirmer par WebFetch, mais le risque d'erreur est faible). Et le lecteur qui visite le bien VOIT la boulangerie. Ce bloc enrichit la page, il ne creuse pas le moat.

**Pourquoi je ne demande pas sa suppression.** Il est construit, sobre, honnête, il nourrit le mouvement « environnement immédiat » de la synthèse, et son coût marginal est nul désormais. Supprimer ce qui est payé et inoffensif est de l'idéologie.

**Ce que je demande** : le geler. Aucune extension (pas d'OCS GE, pas de POI commerces, pas d'« espace vert précis avec nom »). Le « autour » qui serait DIFFÉRENCIANT au grain adresse est ailleurs et déjà en stock : l'**îlot de chaleur urbain** (CSTB ICU, explicitement réservé « Logement/quartier » dans la veille) et le contraste d'exposition (critique 3). Une adresse à 200 m d'un parc mais dans une poche ICU sévère : ÇA, personne ne le montre, et ça croise la Face 1 chaleur. La boulangerie, si.

---

## Critique 7 — Le DPE affiché trois fois, l'audit en table brute (secondaire, fusion)

Le même DPE apparaît en sceau du Passeport, en fondement de « Faire face à la chaleur », puis dans un bloc « Énergie & rénovation » complet (badge + étiquette + GES + conso + audit). Trois promesses pour une donnée. Le bloc Énergie affiche en outre les scénarios d'audit en table brute kWh (l.1065-1084) : inventaire d'indicateurs, zéro lecture décisionnelle (que dois-je en conclure ? quel scénario, quel ordre, quelle échéance légale ?). **Recommandation** : fusionner Énergie dans une seule face « dedans » (lecture thermique + énergie), le Passeport gardant le sceau (identité, pas doublon). L'audit brut : soit lu (« l'audit propose N scénarios, le premier vise l'étiquette X »), soit replié.

## Critique 8 — La sonde projet promet plus qu'elle ne rend (secondaire, honnêteté du dispositif)

`ProjectProbe` demande « Quel est votre projet sur ce logement ? » et l'effet total visible est… deux variantes de deux phrases dans `Face2Implication`. En tant qu'instrument de MESURE (doctrine : instrumenter avant de construire le dédoublement), elle est légitime et je la défends. Mais une question posée à l'utilisateur est une promesse : si la réponse ne module pas visiblement la lecture, il apprend que répondre ne sert à rien — et il ne répondra plus le jour où ça servira. La réponse : c'est la future checklist « À vérifier avant de décider » (critique 4) qui doit être le débouché visible de la sonde. Et elle doit passer AVANT la lecture (spec 1b), pas après le 3e bloc.

## Critique 9 — L'API charge encore les données des frontières fermées (secondaire, hygiène qui deviendra produit)

`ApiResponse` transporte toujours `zfe` (retiré → Mobilité), `irep`, `cartofriches` (→ Santé), et un `communeData` riche (qualité de l'air, revenu médian, HLM, accès médecins…) dont la synthèse ne garde à juste titre que nom+population. Ces données mortes sont fetchées à chaque analyse : coût, latence, et surtout tentation permanente de re-cannibalisation (une carte sols-pollués s'en nourrit déjà, cf. critique 4). Décision produit : ce qui a quitté le module quitte l'API du module. (Détail d'exécution → Software Architect.)

---

## Ce que je conserverais absolument

1. **La synthèse-artefact** (route + prompt + règle « régénérée seulement quand un fait change »). C'est la meilleure pièce du module : prose disciplinée, hiérarchise et renonce, n'introduit aucun fait absent des blocs, ne pose jamais de label de bien. Le patron « artefact par hash de faits » est une fondation pour tous les modules.
2. **Le statut réglementaire au point.** Le bloc le plus différenciant de la page : terme officiel + glose, jamais les travaux déduits, « n'intersecte pas ≠ pas exposé ». Personne ne fait ça lisiblement.
3. **Les 3 états A/B1/C de la lecture thermique** (la méthode prime, jamais une supposition affichée comme mesure) : la discipline elle-même, indépendamment de la position du bloc.
4. **La doctrine de divulgation progressive** (Niveau 1 phrase courante → faits → implication → méthode repliée) et la sinistralité ONRN gatée par représentativité.
5. **Le grain adresse comme principe organisateur** et la frontière par sujet (bâti vs corps). Le périmètre est bien gardé ; c'est l'assemblage qui ne l'est pas.

## Ce que je reconstruirais complètement

1. **La sortie du module** : « Actions documentées » meurt ; « À vérifier avant de décider » (déterministe, par posture, dérivée des blocs) devient la conclusion. C'est là que vit la transformation du lecteur ET le levier payant.
2. **L'assemblage de l'exposition** : un récit unique à niveaux de preuve (critique 3), pas trois blocs.
3. **Le hero** : dérivé de la question cible, sans « valeur », sans « pression assurantielle », sans aside auto-descriptive.
4. **Le modèle de persistance** : l'adresse comme unité, N logements par utilisateur (après lecture des chiffres PostHog, cf. hypothèse porteuse).

## Les 3 décisions produit à plus fort impact sur 12 mois

1. **Faire du module un outil d'ENGAGEMENT, pas d'inspection** : sortie « À vérifier avant de décider » + persistance par adresse + (ensuite) 2-3 logements comparables. C'est ce qui aligne le module sur le moment payant du lecteur (l'achat) et sur le pattern déjà validé du Pack (vendre l'arbitrage).
2. **Construire le contraste des niveaux de preuve** (commune a connu / point cartographié / bien touché) comme LE bloc signature — les données sont déjà à 80 % dans la page, nappe en enrichissement. C'est le morceau incopiable.
3. **Refuser toute extension de surface non différenciante** (Face 3 gelée, pas de nouveau bloc tant que 1 et 2 ne sont pas livrés) et réorienter le « autour » vers l'ICU quand son tour vient. Le module a assez de blocs ; il manque d'assemblage.

## Tensions assumées avec le Business Strategist

- **Face 3 et la richesse visible.** Il défendra probablement la parité de surface avec les portails (« les acheteurs attendent les commodités ») et la richesse comme argument de conversion. Ma lentille : la richesse commodity n'a jamais fait un moat ; chaque bloc de parité nous rapproche du portail immo qu'on refuse d'être. Je gèle, il voudra étendre. Non tranché ici.
- **L'assurance comme pont B2B.** Le modèle économique mise sur le relais assureurs/CGP 2027 ; il voudra muscler la brique assurantielle (le hero « pression assurantielle » est peut-être son fantôme). Ma ligne : « documentée, jamais prédite » n'est pas négociable côté lecteur B2C ; le B2B se nourrira de la rigueur, pas d'une prédiction.
- **La migration du modèle de données.** Coût réel, zéro revenu immédiat : il peut la juger prématurée avant preuve de conversion. Je réponds : c'est précisément le goulot du débit payant du module ; mais j'accepte son ordre de preuve — lire `relation_inferee` d'abord.
- **Accord probable** : sur la critique 4 (les 404 en fin de rapport payant détruisent la conversion, il le verra avant moi) et sur le gel des extensions (allocation de ressources rares).

## Ce qu'on ne sait pas (et comment l'apprendre avant de construire)

- **Répartition des postures** : `logement_analyzed.relation_inferee` + `logement_projet_declare` sont instrumentés → dashboard PostHog (déjà dans le RESTE du module) AVANT la migration de persistance.
- **Le lecteur veut-il comparer des biens ?** Hypothèse, pas fait. Signal faible dès maintenant : compter les utilisateurs analysant ≥2 adresses distinctes (même commune) dans une session.
- **La checklist est-elle le levier payant ?** Testable en sonde légère : une version 5 items statiques par posture, mesurer l'engagement, avant d'industrialiser.
- **La parité commodités compte-t-elle ?** (position Business) : entretien ou sonde, pas un a priori de part et d'autre.

## Mise à jour de la doctrine (prête à écrire par Claude principal)

- `modules/logement.md` : graver « la sortie du module = À vérifier avant de décider ; le bloc Agir en cartes génériques est retiré » + « l'exposition se lit en niveaux de preuve, jamais en blocs parallèles » + « l'unité produit du module est le logement (adresse), pas la commune » (après validation PostHog).
- Nouvel `arbitrages/logement-face3-gelee.md` : victoire produit — le « autour » commodity n'est pas étendu ; le « autour » différenciant = ICU + contraste d'exposition. Déclencheur de réouverture ci-dessous.
- Corriger le hero = exécution immédiate, pas doctrine.

## Les quatre questions de clôture

1. **Si on reconstruisait futur•e aujourd'hui, construirait-on encore ça ?** La synthèse-artefact, le statut réglementaire au point, les états A/B1/C : oui, à l'identique. Le bloc Actions, l'aside « briques », les chips de risques bruts, ClimateFuture en gabarit : non. La Face 3 : probablement pas en premier, mais on ne la détruirait pas.
2. **Qu'est-ce qu'on perd si on supprime ?** Supprimer les ActionCards : on perd une promesse d'action qui était fausse (404) — perte nulle, gain de confiance. Supprimer les chips de risques : on perd un inventaire, à condition que le récit fusionné reprenne CHAQUE aléa nommé (sinon perte d'exhaustivité honnête). Supprimer ClimateFuture : on perd le seul pont climat-futur du module — d'où « remplacer par la donnée DRIAS réelle », pas supprimer sec.
3. **Une version dix fois plus simple ?** La sortie du module : cinq lignes de checklist déterministe par posture valent mieux que tout système de cartes. Le contraste de preuve : trois phrases hiérarchisées avant les blocs existants suffisent pour une v1, sans nouvelle donnée.
4. **Plus difficile à copier, ou seulement plus riche ?** Plus riche aujourd'hui : Face 3, bloc Énergie complet, chips. Plus difficile à copier : synthèse-artefact disciplinée, statut réglementaire glosé, contraste des niveaux de preuve (à construire), checklist par posture (à construire). Les 12 prochains mois doivent déplacer l'effort de la première colonne vers la seconde.

## Si j'étais le gardien du produit

Je corrigerais le hero et supprimerais les ActionCards cette semaine ; je livrerais la spec 1b comme fusion (un récit d'exposition, une sortie « À vérifier avant de décider ») et non comme simple réordonnancement ; je gèlerais toute nouvelle surface tant que le module ne sait pas sauvegarder deux logements.

## Quand rouvrir ce sujet

- **Persistance par adresse** : rouvrir (et trancher) dès que le dashboard PostHog montre >30 % de `relation_inferee = prospection` OU ≥2 adresses analysées par session chez >10 % des utilisateurs du module. Si la résidence domine massivement (>85 %), abandonner ma critique 2 et le dire.
- **Face 3 gelée** : rouvrir le jour où la donnée ICU (CSTB/LCZ) est intégrable au point, ou si des entretiens montrent que l'absence de commodités est citée comme raison de non-achat du Pack.
- **Checklist « À vérifier »** : si la sonde 5-items ne montre aucun engagement (ni clic ni copie) sur 4 semaines, ma conviction « c'est le levier payant » est morte, le dire dans `paris.md`.
- **Retour de la valeur immobilière** : uniquement si une donnée permettant une estimation honnête d'un bien précis apparaît (aujourd'hui inexistante) — hypothèse parquée, jamais supprimée.
- **Ce rapport est daté** : si la spec 1b livrée règle les critiques 3, 4 et 5a, les requalifier de « réglées » plutôt que de re-débattre.
