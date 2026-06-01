# Audit sémantique du comparateur de vie (conception, sans code)

Travail de conception déclenché par une intuition du porteur : le principal risque
produit restant n'est plus « le moteur manque d'informations » mais « le moteur ne
comprend pas toujours les mots comme les utilisateurs les comprennent ». Un moteur
techniquement cohérent peut perdre la confiance s'il répond à un sens différent de
celui voulu.

Date : 2026-06-01. Aucune modification moteur, aucune donnée nouvelle. Uniquement :
cartographie des ambiguïtés, hiérarchie des risques, recommandations produit.

Ce document est ancré dans le comportement RÉEL du moteur (`subScore` et les courbes
de `comparateur-vie.ts`, le prompt et la table de traduction de `parse/route.ts`),
pas dans une intuition. Chaque écart est vérifiable dans le code.

## Quatre familles d'écart

La confusion n'est pas la même selon les mots. Il faut les trier, car la solution
diffère. (La famille D a été ajoutée après relecture du porteur : elle distingue le
« pas encore de données » du « pas de mesure satisfaisante possible ».)

- **A. Faux ami** : le mot a un critère, mais le critère mesure autre chose que ce
  que l'utilisateur entend. Le moteur répond précisément, mais à côté. Ex. *doux*.
- **B. Polysémie** : le mot a un critère, mais recouvre plusieurs intentions
  légitimes que le critère écrase en une seule. Ex. *calme*, *proche de la mer*.
- **C. Hors-mesure (donnée absente)** : le mot n'a AUCUN critère, mais une donnée
  publique POURRAIT l'approcher un jour. Le LLM comble le vide, soit au parse (il
  choisit une approximation), soit à la synthèse (il invente une caractérisation non
  vérifiée). Ex. *nature* (couvert forestier mesurable). Dangereuse car invisible,
  mais réparable par de la donnée.
- **D. Non mesurable (notion affective ou culturelle)** : le mot n'a aucun critère ET
  il n'existe probablement AUCUNE mesure satisfaisante à la maille territoriale,
  parce que la notion relève de l'expérience vécue, pas d'une donnée. Ex.
  *authentique*, *chaleureux*, *accueillant*, *convivial*. La bonne réponse n'est pas
  de chercher un faux score, mais de dire honnêtement que cela relève d'une expérience
  personnelle, pas d'une donnée territoriale.

Principe directeur (hérité de la doctrine des ancres « séparer le lieu de sa
connotation ») : **le risque n'est pas que le moteur se trompe, c'est qu'il réponde
silencieusement à un autre sens.** Rendre l'interprétation VISIBLE au gate désamorce
la plupart des cas, sans toucher au score.

## Audit terme par terme

Pour chaque notion : (1) ce que l'utilisateur entend, (2) ce que le moteur mesure
aujourd'hui, (3) l'écart, (4) le risque de résultat contre-intuitif, (5) les
solutions possibles.

### doux  (famille A, faux ami) — RISQUE ÉLEVÉ

1. **Utilisateur** : très souvent une douceur méditerranéenne, du soleil, des
   températures agréables toute l'année, peu de froid. Image affective du Sud.
2. **Moteur** : `douceur_climat` = `0.6 · douceur de l'hiver (NORTMm_seas_DJF) + 0.4 ·
   absence de canicule (NORTX35D)`. La courbe d'hiver culmine vers **9 °C de moyenne
   hivernale (climat océanique)** et REDESCEND au-dessus de 12 °C ; la composante
   canicule PÉNALISE les étés chauds. Optimum réel : **façade atlantique tempérée**
   (Brest, Caen, le littoral ouest), pas la Méditerranée (étés trop chauds → la
   composante canicule chute).
3. **Écart** : maximal. L'utilisateur pense Sud ensoleillé, le moteur récompense
   l'Ouest océanique sans canicule. Deux mondes opposés.
4. **Risque** : « un endroit doux » → Brest en tête. AskFuture doit déjà se défendre
   (« ce n'est pas un climat méditerranéen »). Perte de confiance forte, car
   l'utilisateur ne reconnaît pas son intention.
5. **Solutions** : (a) **pédagogie au gate** prioritaire : afficher « doux, nous
   l'entendons comme des hivers tempérés et des étés sans canicule, pas nécessairement
   un climat méditerranéen ». (b) **Décomposition** : distinguer *douceur d'hiver* de
   *chaleur agréable / ensoleillement*, et router selon les marqueurs (« doux ET
   ensoleillé » vs « doux l'hiver »). (c) **Affinage interactif** (V2) : une question
   « plutôt hivers doux, ou plutôt chaleur du Sud ? ». Le label UI « un climat doux »
   est lui-même le piège : envisager « des hivers tempérés ».

### ensoleillé  (famille A/B) — RISQUE ÉLEVÉ

1. **Utilisateur** : de la lumière, du soleil, des journées claires. Notion de
   luminosité, parfois indépendante de la chaleur.
2. **Moteur** : `ensoleillement_recherche` = `0.45 · chaleur d'été (NORTMm_seas_JJA)
   + 0.55 · sécheresse annuelle (peu de pluie, NORRR_yr)`. C'est un proxy
   **chaud + sec**, PAS un ensoleillement mesuré (pas de donnée d'heures de soleil).
3. **Écart** : modéré à fort. Souvent corrélé au réel (le Sud est chaud, sec et
   ensoleillé), mais le moteur récompense la **chaleur**, pas la lumière. Un lieu
   lumineux mais frais ne ressort pas ; un lieu chaud et sec ressort même si l'enjeu
   réel était la luminosité.
4. **Risque** : un utilisateur cherchant « lumineux mais pas la fournaise » obtient
   les communes les plus chaudes. Collision directe avec *doux*.
5. **Solutions** : (a) **renommer honnêtement** côté glose (déjà « plus chaud et plus
   sec » dans le prompt, à propager partout). (b) Pédagogie au gate : « ensoleillé,
   nous l'approchons par la chaleur et la sécheresse estivales ». (c) Noter le **trou
   de données** : pas d'ensoleillement réel ; piste future (rayonnement).

### calme  (famille B, polysémie) — RISQUE ÉLEVÉ

1. **Utilisateur** : peu de monde, tranquillité, pas d'agitation urbaine. Souvent
   confondu avec « la campagne », « un village ».
2. **Moteur** : `cadre_calme` = courbe de **densité** culminant vers **150-400 hab/km²
   (petite ville habitable)** et redescendant aux deux extrêmes : très dense (ville)
   ET très peu dense (la courbe retombe vers 55 sous ~30 hab/km², pour éviter
   l'isolement). « Calme » = densité modérée vivable, pas le vide rural.
3. **Écart** : deux écarts. (a) Une **ville de 60 000 habitants** à densité modérée
   peut être notée « très calme », ce qui surprend (la taille n'entre pas, seule la
   densité compte). (b) Un **hameau rural isolé** est noté MOINS calme qu'une petite
   ville, alors que l'utilisateur « calme = campagne » attend l'inverse.
4. **Risque** : « je veux du calme » → une ville moyenne ; ou inversement l'utilisateur
   « campagne tranquille » trouve le résultat trop urbain. Surprise dans les deux sens.
5. **Solutions** : (a) **décomposition** : séparer *faible densité / tranquillité*
   (calme) de *taille de commune* (ville vs village) de *ruralité* (campagne). (b)
   Pédagogie au gate : « calme, au sens d'une densité apaisée, pas nécessairement la
   campagne isolée ». (c) Clarifier que *calme* et *éviter l'isolement* se tempèrent
   mutuellement (c'est voulu : calme mais habitable).

### proche de la mer  (famille B, polysémie) — RISQUE MOYEN

1. **Utilisateur** : vue mer, accès baignade à pied, OU simplement « pas loin de la
   côte » (30 min en voiture), OU climat maritime. Élastique.
2. **Moteur** : `proximite_mer` (souple) = `100 − distance_côte / 1,5`, dégradé
   linéaire jusqu'à ~150 km ; `nearSea` (dur) = filtre à ~30 km. Mesure une distance
   au trait de côte, pas une « vue » ni un usage.
3. **Écart** : modéré. Une commune à 40 km marque encore ~73 en souple : « proche »
   pour le moteur, « pas vraiment au bord de la mer » pour beaucoup d'utilisateurs.
4. **Risque** : résultats « à une demi-heure de la mer » présentés comme maritimes.
   Couple aussi avec la **façade** (quelle mer) : « la mer » sans précision peut
   mélanger Manche froide et Méditerranée.
5. **Solutions** : (a) le **gradient dur/souple existe déjà** (bien) ; clarifier au
   gate la distance retenue (« proche, au sens d'un accès à la côte, pas
   nécessairement les pieds dans l'eau »). (b) Affinage : « au bord de l'eau, ou à
   proximité ? ». (c) Façade nommée déjà gérée (ancres).

### proche de la nature  (famille C, hors-mesure) — RISQUE ÉLEVÉ

1. **Utilisateur** : verdure, forêts, montagnes, espaces préservés, biodiversité,
   sentiment d'être « dans la nature ».
2. **Moteur** : **AUCUN critère.** Pas de couvert forestier, pas d'espaces naturels,
   pas de biodiversité dans l'index. Le parse n'a aucune règle de traduction pour
   « nature ». Au mieux il rabat vers `cadre_calme` ou `faible_pression_agricole`,
   au pire il l'ignore.
3. **Écart** : total. La notion n'existe pas dans le modèle.
4. **Risque** : le plus pernicieux. Soit la demande est **silencieusement abandonnée**
   (l'utilisateur croit qu'elle a pesé), soit la **synthèse invente** (« entourée de
   nature ») depuis la connaissance du modèle, sans données. Confiance trompée.
5. **Solutions** : (a) **honnêteté au gate** : si « nature » est détecté sans critère,
   le dire sous « ce qui reste ouvert » (« la proximité de la nature n'est pas encore
   un critère mesuré par futur•e »). (b) Interdire à la synthèse d'affirmer la nature
   sans donnée (durcir le firewall, lien avec le risque #3 du roadmap). (c) **Trou de
   données à instruire** : couvert forestier / espaces naturels (source publique
   existe : Corine Land Cover). Candidat sérieux de futur critère.

### vivant / dynamique  (famille A/C) — RISQUE MOYEN

1. **Utilisateur** : vie locale, animation, commerces ouverts, culture, événements,
   « il se passe des choses ». Parfois économique (« ville dynamique »).
2. **Moteur** : *vivant* → `eviter_isolement` = **population** (la commune est-elle
   assez peuplée). *dynamique* → `eviter_isolement` ou, en contexte emploi,
   `viabilite_emploi`. Aucune mesure d'animation, de culture, de commerces.
3. **Écart** : fort sur *vivant* (population ≠ animation : une grande ville-dortoir
   est « vivante » pour le moteur). Modéré sur *dynamique* (la viabilité du bassin
   est un proxy défendable du dynamisme économique, mais pas de la vie culturelle).
4. **Risque** : « un endroit vivant » → une commune peuplée mais éteinte. L'utilisateur
   ne reconnaît pas « vivant ».
5. **Solutions** : (a) clarifier au gate (« vivant, au sens d'une commune assez
   peuplée pour une vie locale réelle »). (b) Décomposer si un jour une donnée de
   commerces / équipements culturels arrive (trou de données). (c) Router *dynamique
   économique* vers `viabilite_emploi` (déjà fait), *vivant culturel* reste hors
   mesure et doit être dit.

### familial  (famille B/C) — RISQUE MOYEN

1. **Utilisateur** : adapté aux enfants, écoles, sécurité, espaces, logement
   accessible, vie de famille.
2. **Moteur** : le parse traduit « famille / enfant » par `eviter_isolement` +
   `acces_services` + `faible_pression_agricole`. Proxy raisonnable d'un cadre vivable,
   mais **écoles, sécurité, logement sont hors périmètre** (renvoyés au rapport).
3. **Écart** : partiel. Le moteur capte « vivable et sain », pas « scolarisable et
   sûr ».
4. **Risque** : modéré, car le proxy va dans le bon sens. Mais sur-promesse possible
   si la reformulation laisse croire que « familial » a été pleinement compris.
5. **Solutions** : (a) cadrage au gate (« le volet écoles et sécurité se lit dans le
   rapport »). (b) Conserver le proxy actuel, honnête sur ses limites.

### authentique / chaleureux / accueillant / convivial  (famille D, non mesurable) — RISQUE CIBLÉ MAIS NET

1. **Utilisateur** : caractère, patrimoine, convivialité, esprit de village, chaleur
   humaine, identité. Notions culturelles et affectives, vécues.
2. **Moteur** : **AUCUN critère, et aucune mesure satisfaisante n'existe** à la maille
   commune, ni aujourd'hui ni de façon crédible demain. Le parse n'a aucune règle ;
   ces mots ne produisent aucun signal.
3. **Écart** : total et **non comblable par de la donnée** (différence clé avec
   *nature*, où une donnée existe). Chercher un proxy serait malhonnête.
4. **Risque** : la **synthèse hallucine** (« village authentique et chaleureux »)
   depuis la culture du modèle. C'est exactement le risque #3 du roadmap (Istres
   « profil industriel »), ici sur des adjectifs invérifiables.
5. **Solutions** : (a) **ne jamais prétendre les mesurer ni les approcher par un
   proxy.** (b) Le dire explicitement : « cette notion relève davantage d'une
   expérience personnelle que d'une donnée territoriale ». (c) Interdire à la synthèse
   de les affirmer. C'est une posture produit assumée, pas un trou à combler.

### Pièges secondaires à acter

- **sec / aride (piège de polarité)** : `faible_secheresse` = ÉVITER la sécheresse
  (sols). Un utilisateur qui « aime le climat sec / aride » exprime l'INVERSE. Le
  parse doit lire la polarité (comme « surtout pas le Sud » pour les ancres) et NE PAS
  activer `faible_secheresse` pour un goût du sec. À vérifier en réel.
- **sain** : `air_sain` + `faible_pression_agricole`. Bon proxy de l'air et de
  l'environnement agricole, mais « sain » peut viser l'eau, les sols, le bruit (hors
  mesure). Ne pas sur-promettre.
- **frais** : `faible_chaleur`, alignement clair, risque faible (cas fondateur des
  ancres déjà traité).

## Hiérarchie des risques

Classement par (fréquence d'usage × gravité du malentendu × perte de confiance).

Ordre revu avec le porteur : *nature* remonte au rang 2, car un trou noir total
(aucun critère robuste) est plus dangereux qu'un critère existant au sens imparfait.

| Rang | Terme | Famille | Pourquoi prioritaire |
|---|---|---|---|
| 1 | **doux** | A | Très fréquent, écart maximal (Ouest océanique vs Sud rêvé), confiance brisée |
| 2 | **proche de la nature** | C | Trou noir total : aucun critère robuste, abandon silencieux OU hallucination, invisible |
| 3 | **calme** | B | Fréquent, surprend dans les deux sens (ville notée calme, campagne notée isolée) |
| 4 | **ensoleillé** | A/B | Fréquent, proxy chaleur ≠ lumière, collision avec *doux* |
| 5 | **vivant / dynamique** | A/C | Population ≠ animation |
| 6 | **proche de la mer** | B | Élasticité « proche », gradient déjà partiellement géré |
| 7 | **authentique / chaleureux / convivial** | D | Non mesurable : hallucination nette, à assumer comme hors périmètre |
| 8 | **familial** | B/C | Proxy va dans le bon sens, limites à cadrer |
| 9 | **sec (polarité)** | piège | Rare mais inversion silencieuse possible |

## Recommandations produit (transverses, par ordre de levier)

1. **La pédagogie au gate est le levier n°1, à coût quasi nul.** Le gate « ce que nous
   avons compris » est l'endroit naturel pour rendre VISIBLE l'interprétation du
   moteur. Plutôt qu'un libellé sec (« un climat doux »), afficher l'interprétation
   assumée (« doux : des hivers tempérés et des étés sans excès, pas nécessairement un
   climat méditerranéen »). Transforme un malentendu silencieux en interprétation
   corrigeable. Aucun changement de score. C'est probablement le meilleur ratio
   qualité perçue / effort de tout le backlog.
2. **Honnêteté sur le hors-mesure (famille C).** Quand un mot sans critère est détecté
   (nature, authentique, chaleureux, vie culturelle), le reconnaître sous « ce qui
   reste ouvert » au lieu de l'abandonner en silence ou de le laisser halluciner par
   la synthèse. Durcir le firewall de la synthèse en conséquence (lien roadmap #3).
3. **Renommage des libellés trompeurs.** `douceur_climat` → exposer « hivers
   tempérés » ; `ensoleillement_recherche` → « plus chaud et plus sec » (déjà dans le
   prompt, à propager à l'UI et aux gloses). Le label est le premier contrat de sens.
4. **Décomposition des notions composites** (chantier moteur, donc plus tard, après
   validation) : *doux* → douceur d'hiver vs chaleur agréable ; *calme* → densité vs
   ruralité vs taille. À ne faire que si la pédagogie au gate ne suffit pas.
5. **Affinage interactif au gate (V2 structurant).** La vraie réponse à la polysémie :
   une question ciblée quand l'ambiguïté est forte (« doux plutôt hiver, ou plutôt
   chaleur du Sud ? »). C'est le chantier déjà noté (roadmap, gate V2). L'audit
   confirme sa valeur : *doux*, *calme*, *proche de la mer* en sont les cas d'usage.
6. **Trous de données candidats** (famille C, futurs critères) : couvert forestier /
   espaces naturels (Corine Land Cover) pour *nature* ; commerces / équipements pour
   *vivant*. À instruire séparément, hors de cet audit.

## Mini-chantier « interprétations visibles » (conception validée 2026-06-01)

Premier chantier retenu, issu de la recommandation n°1. Aucun score, aucune donnée,
aucun changement de classement. Objectif : rendre EXPLICITE ce que le moteur entend,
pour transformer un malentendu silencieux en interprétation corrigeable au gate.

**Traitement UI retenu : sous-ligne sous la puce.** On garde les puces actuelles ;
seuls les critères à écart de sens portent une glose discrète en dessous. Les
critères dont le libellé dit déjà tout restent de simples puces (anti-bloat).

Critères AVEC interprétation (faux amis / polysémie) :

| Critère | Interprétation affichée |
|---|---|
| Climat doux | hivers tempérés, étés sans excès |
| Cadre calme | densité modérée, sans isolement |
| Ensoleillé | plus chaud et plus sec |
| Proche de la mer | accès rapide à la côte |
| Vie locale (pas isolé) | commune assez peuplée pour une vie locale |

Restent simples (le mot = la mesure) : étés plus frais, faible risque de feu, sols
peu exposés à la sécheresse, bon accès aux soins, services accessibles, air plus pur,
bassin d'emploi dynamique.

**Hors-mesure sans nouveau bloc** : réutiliser le « ⚠ Ce qui reste ouvert » existant,
deux formulations selon la famille :
- C (donnée absente) : « La proximité de la nature n'est pas encore un critère mesuré
  par futur•e. »
- D (non mesurable) : « Le caractère authentique ou chaleureux relève d'une
  expérience personnelle, pas d'une donnée territoriale. »

**Phasage** :
- Phase 1 (prototype, pur UI) : table de glose statique sous les ~5 critères ambigus.
  Ni score, ni donnée, ni parse. Mesure directement si expliciter réduit la surprise.
- Phase 2 (prompt seul) : détection des termes hors-mesure au parse → affichage sous
  « ce qui reste ouvert ». Ni score ni donnée.

## Conclusion

Le moteur est techniquement honnête mais sémantiquement muet sur son propre sens :
il répond juste, sans dire à quelle question. Trois mouvements suffisent à reprendre
la main, par effort croissant : **rendre l'interprétation visible au gate**
(pédagogie, levier immédiat), **assumer le hors-mesure** (honnêteté, anti-hallucination),
puis, seulement si nécessaire, **décomposer et affiner** (moteur, V2). Aucun de ces
trois ne demande de nouvelle donnée pour démarrer ; le premier seul couvrirait
l'essentiel de la perte de confiance identifiée.
