# Board Logement, revue critique. Siège : Editorial Writer

**Date** : 2026-07-07 · **Terrain** : `src/components/report/LogementModule.tsx` (1195 lignes, lu en entier), `src/components/report/ThermalComfortSection.tsx`, `src/components/report/LogementSynthesis.tsx`, `SYSTEM_PROMPT` de `src/app/api/synthesize-logement/route.ts`, `docs/vault/doctrine/editoriale.md`, ma passe `2026-07-07-synthese-logement-prompt.md`.

**Lecture d'ensemble** : le bas du module (sinistralité, statut réglementaire, autour de l'adresse, synthèse) porte la voix de futur•e. Le haut du module (hero, aside « briques », deuxième intro, bloc Énergie, bloc Risques du bâti, cartes d'action) est une strate antérieure qui parle du produit, promet ce que le code a retiré, et affiche du jargon brut. La page ne raconte pas une histoire : elle empile deux générations d'écriture, et la plus ancienne est en tête, là où le lecteur forme son jugement.

---

## Critique 1 (BLOQUANT) : le hero promet ce que le module a cessé de faire

**Texte** (`LogementModule.tsx` l.871-876, première chose lue) :
> « Ce que votre habitat devient. *Confort, risques, valeur.* »
> « Ce module lit le bien lui-même : DPE, risques par adresse, pression assurantielle et trajectoire de valeur. Il ne raconte pas tout le territoire. Il raconte ce que ce logement absorbe, perd ou protège. »

**Problème.** Trois violations superposées :
1. **Promesse morte.** « Valeur », « trajectoire de valeur », « pression assurantielle » : les briques assurance et valeur ont été RETIRÉES le 2026-07-02 (commentaire l.78-80 du même fichier : « déduites de labels, elles affichaient une supposition comme une mesure »). Le titre vend ce que le code a supprimé pour raison d'honnêteté. Invariant n°5 (ne pas affirmer au-delà de la preuve) violé à l'endroit le plus visible du module. La sinistralité ONRN dit ensuite explicitement « Ces chiffres ne prédisent ni un sinistre pour ce logement, ni le prix de son assurance » : le module se contredit entre son titre et son contenu.
2. **La page parle d'elle-même.** « Ce module lit le bien lui-même » est littéralement le gabarit que `editoriale.md` § « La page s'adresse au lecteur, pas à elle-même » donne en exemple à bannir (« ce module lit ce qui change autour de chez vous »).
3. **Antithèse d'emphase.** « Il ne raconte pas tout le territoire. Il raconte ce que… » : construction « pas X, mais Y » explicitement détestée du porteur (`feedback_no_antithese`).

**Impact.** Le lecteur forme sa attente sur une promesse fausse ; tout ce qui suit paraît en-dessous de l'annonce. C'est l'inverse du contrat futur•e : la déception est fabriquée par le texte, pas par la donnée.

**Recommandation** (réécriture, prête à coller) :
- H1 : « Ce que ce logement affronte.<br/><span italic>Énergie, risques, entourage.</span> » (modèle doctrine : « Ce que La Rochelle devient. Chaleur, eau, risques. »)
- Intro : « Une adresse suffit. Vous y lisez la performance énergétique du bien, son exposition aux risques naturels, ce que les sinistres ont déjà coûté à assurer dans la commune, et ce qui entoure la porte. »
- « Valeur » ne revient dans un titre que le jour où une face valeur existe sur donnée réelle.

---

## Critique 2 (BLOQUANT) : l'aside « Les briques du module » ne devrait pas exister

**Texte** (l.888-908) : eyebrow « Lecture du bien », titre « Les briques du module. », trois tuiles dont « Assurance et sécheresse · Lecture à venir » et « Risques du bâti · {n} signal(s) ».

**Problème.** C'est une table des matières du produit, écrite pour l'équipe. Le lecteur n'a encore rien saisi et on lui présente l'architecture. « Lecture à venir » énumère une absence : corollaire doctrine explicite (« on ne décrit jamais ce qu'on ne fait pas ; le statut d'un contenu se porte par l'interface, pas par une phrase »). Au passage, une faute : `signal${n > 1 ? "s" : ""}` produit « 3 signals » ; le pluriel français est « signaux ».

**Impact.** Contemplation du produit à froid, avant toute valeur livrée ; et l'aveu « à venir » installe le doute au moment exact où il faut la confiance.

**Bloquant.** Recommandation : **suppression du bloc**. Ce que cette colonne devient (le champ d'adresse remonté ? du vide ?) est une décision d'écran : je la renvoie au Design Critic. Ma part est tranchée : ce texte ne devrait pas exister.

---

## Critique 3 (BLOQUANT) : deux introductions qui disent la même chose

**Texte** (l.913-921) : eyebrow « Lecture par défaut », H2 « Analyser un logement précis. », puis « Entrez une adresse pour lire ce logement précis : sa performance énergétique, les risques du bâti, ce que le passé a coûté à assurer, et ce qui se trouve autour. »

**Problème.** C'est la deuxième énumération du sommaire en un écran (le hero venait d'en donner une). Le lecteur lit deux fois la table des matières avant d'avoir tapé une adresse. « Lecture par défaut » est un eyebrow écrit pour l'équipe (défaut par rapport à quoi ? le lecteur n'a aucun référentiel).

**Impact.** Rythme d'entrée épuisé avant l'action ; sensation de page qui se présente au lieu de servir.

**Recommandation.** Une seule intro porte l'énumération (le hero, réécrit, cf. critique 1). Celle-ci se réduit à l'invitation : H2 « Analyser un logement précis. » conservé, phrase remplacée par « Entrez une adresse : l'analyse porte sur ce logement, à cette adresse. » Eyebrow « Lecture par défaut » supprimé ou remplacé par « Votre logement ».

---

## Critique 4 (BLOQUANT) : « Risques du bâti » affiche du jargon Géorisques brut, en rouge, sans phrase

**Texte** (l.1090-1116) : eyebrow « Risques du bâti », sous-tête « Risques référencés », puis des chips mono rouges contenant les labels Géorisques verbatim, puis deux Block « Sismicité » / « Retrait-gonflement argiles » avec les libellés source.

**Problème.** C'est la strate la plus ancienne et elle jure violemment avec la sinistralité et le statut réglementaire (qui ont, eux, la structure phrase-en-langage-courant → faits → repli méthode). Ici : zéro phrase, zéro glose, des tags administratifs en couleur d'alerte. « Retrait-gonflement argiles » n'est pas glosé alors que le glossaire doctrine impose « mouvements des sols argileux qui peuvent fissurer les maisons », et alors que le bloc sinistralité, trente lignes plus bas, le glose correctement en tooltip. Même donnée, deux traitements : le module n'a pas une voix, il en a deux. « Référencés » est un mot d'administration, pas de lecteur.

**Impact.** C'est le bloc le plus anxiogène de la page (rouge + jargon + aucun cadre de lecture) : dramatisation par défaut de traduction, l'exact contraire de l'invariant n°6 (intelligence, pas peur).

**Recommandation.** Reconstruire sur le gabarit des blocs Face 2 : une phrase de tête en langage courant (« Voici les aléas que Géorisques référence à cette adresse. Un aléa référencé décrit une exposition possible, pas un dommage constaté. »), chaque aléa traduit via le glossaire avec le terme officiel conservé en second, la sévérité typographique alignée sur la sévérité réelle (le rouge systématique disparaît ; le comment relève du Design Critic, le fait que chaque label doive être glosé relève de moi).

---

## Critique 5 (BLOQUANT) : la carte « Comparer ce logement avec d'autres territoires » ne devrait pas exister sous cette forme

**Texte** (l.1177-1181) : « Le comparateur futur•e permet de mesurer comment ce bien se situe face à des territoires alternatifs sur les mêmes dimensions. »

**Problème.** Quatre fautes en une phrase : l'offre est sujet (« Le comparateur futur•e permet », interdit `feedback_offre_pas_sujet`) ; la promesse est fausse (le comparateur compare des communes, il ne situe pas « ce bien » ; un bien ne se compare pas à un territoire, la catégorie est incohérente) ; « territoires alternatifs » et « dimensions » sont du vocabulaire d'équipe ; et « mesurer » promet une métrique que le comparateur, volontairement sans score, refuse.

**Impact.** Une phrase qui ment sur le produit ET qui sonne générée, en clôture de module : c'est la dernière impression laissée.

**Recommandation.** Réécrire depuis le lecteur : titre « Et si la question dépasse ce logement ? », desc « Si ce bien engage un changement de commune, comparez plusieurs communes sur la chaleur, l'eau et les risques avant de trancher. » (le verbe qui décide reste chez le lecteur, doctrine « Tranchez sans deviner »).

---

## Critique 6 (secondaire, mais révélateur) : « Actions documentées » contredit la sinistralité et duplique « Ce que cela mérite de vérifier »

**Textes** (l.1145-1184) :
- « Vérifier votre couverture assurance : Contacter votre assureur pour anticiper toute évolution de prime ou de garantie sur votre zone. » Or le bloc sinistralité vient d'écrire : « Ces données ne permettent pas de prévoir votre cotisation. La surprime CatNat est fixée nationalement. » Un bloc désamorce l'angoisse assurantielle, la carte d'action la rallume (« anticiper toute évolution de prime »). Et le href `/savoir/assurance-littorale` est servi pour n'importe quel risque, y compris l'argile en plaine : le lien promet un contenu qui ne correspond pas.
- La carte redit ce que `Face2Implication` (« Ce que cela mérite de vérifier ») vient de dire (vérifier, demander, consulter). Deux blocs d'injonction douce à quinze lignes d'écart : le second dilue le premier.
- « Devis-type par typologie de bien, MaPrimeRénov' applicable, retour sur investissement à 10 ans » : à vérifier que la page `/savoir/renovation-cout` livre réellement cela ; sinon c'est une promesse au-delà de la preuve.

**Recommandation.** Fusionner : `Face2Implication` est le bon organe (déterministe, posture-sensible, dans la voix) ; les ActionCards survivantes ne gardent que ce qui pointe vers un contenu documenté réel, avec une desc qui décrit le contenu de la page, pas un geste anxieux. La carte assurance se réécrit : « Comprendre votre couverture : Ce que la garantie catastrophes naturelles couvre, ce qui se vérifie dans un contrat, à qui poser la question. »

---

## Critique 7 (secondaire) : la prose de « Faire face à la chaleur » parle du dispositif, pas du logement

**Textes** (`ThermalComfortSection.tsx`) :
- « Le DPE signale une capacité limitée à préserver le confort d'été dans ses conditions conventionnelles d'évaluation. » (l.83) : phrase administrative ; « dans ses conditions conventionnelles d'évaluation » est illisible à voix haute.
- « Le DPE classe l'indicateur réglementaire de confort d'été de ce logement comme bon. » (l.84) : triple génitif, sujet = le DPE, jamais le logement.
- « Plusieurs caractéristiques renseignées contribuent à cette évaluation. » (l.87) : phrase de remplissage, sujet = l'évaluation. Texte de trop : les chips se suffisent.
- ClimateFuture (l.50-55) : « les caractéristiques décrites ci-dessus prendront davantage d'importance » renvoie à la page elle-même (« ci-dessus ») ; et en état C, « Les données retrouvées ne permettent pas encore de la qualifier » répète mot pour mot le titre du bloc affiché huit lignes plus haut (« Les données publiques retrouvées ne permettent pas de qualifier… »). Même idée, deux fois, même écran.

**Réécritures proposées** :
- Insuffisant : « D'après son diagnostic, ce logement garde difficilement la fraîcheur en été. Cette évaluation est conventionnelle : elle situe le bien, elle ne mesure pas ce que vous y vivrez. »
- Bon/moyen : « Au diagnostic, le confort d'été de ce logement est évalué “bon”. L'évaluation est réglementaire : une catégorie, pas une température. »
- « Plusieurs caractéristiques renseignées… » : supprimer, ou réduire à « Ce qui joue, d'après le diagnostic : ».
- ClimateFuture, une seule matrice : « Les nuits chaudes progressent à {commune} : ce que ce logement sait faire de la chaleur comptera de plus en plus. » (variante B1/C : ajouter la phrase d'inconnu UNE fois, pas deux).

---

## Critique 8 (secondaire) : le DPE apparaît trois fois, et « Passoire thermique. » agit comme un label du bien

Le DPE est affiché dans le Passeport (sceau + sous-titre `DPE_LABELS`), dans « Faire face à la chaleur » (dérivé), puis dans « Énergie & rénovation » (badge lg + « Étiquette F, Très énergivore » + chiffres). Trois strates pour une donnée. Le plus sensible : dans le Passeport, la seule ligne de prose sous l'adresse est « Passoire thermique. » (l.183 via `DPE_LABELS.G`). Isolée sous le nom du bien, cette ligne fonctionne comme un verdict du logement, ce que le prompt de synthèse interdit précisément (« ne qualifiez jamais le logement dans son ensemble »). Le terme est quasi réglementaire, mais sa position en fait un label. Proposition minimale : « Classé G au diagnostic énergétique. » (le fait, daté, sans adjectif d'identité). Le bloc « Énergie & rénovation » (eyebrow à l'esperluette, registre dashboard, « rénovation » que le bloc ne traite pas) est une strate à réaligner : « Le diagnostic de ce logement » suffirait.

## Critique 9 (secondaire) : ordre du récit et avertissement égaré

L'avertissement « Adresse hors commune » (l.962-977) arrive APRÈS la lecture chaleur : le lecteur apprend qu'il regarde peut-être le mauvais référentiel après avoir déjà lu une interprétation. La sonde « Quel est votre projet sur ce logement ? » arrive elle aussi après une lecture interprétée. Et la synthèse « Lecture de ce logement » (l'épine dorsale voulue) arrive en quatrième position. Le porteur a déjà nommé le problème (« foutraque ») et le réordonnancement (synthèse → identité → preuves → limites → suite) est spécifié et parqué : je confirme depuis ma lentille que l'ordre actuel casse le récit, et je renvoie l'exécution du réordonnancement à l'Architecte/Design Critic. Côté prose de l'avertissement : « les modules Territoire et Santé restent calés sur votre commune principale » parle de l'architecture ; réécrire « Cette analyse porte sur ce bien à {ville}. Le reste de votre rapport décrit {defaultCommune}, votre commune déclarée. »

## Critique 10 (à surveiller, pas une faute) : le SYSTEM_PROMPT tient, la preuve manque

Le `SYSTEM_PROMPT` en route est exactement ma proposition (attaque par le bien, renoncer pas répartir, interdit du label de bien, échelle dite, clôture qui oriente sans prescrire). La doctrine « oriente sans introduire de fait » tient donc au texte du prompt. Deux points de vigilance : (1) seule la lecture de sorties réelles prouvera l'obéissance ; (2) micro-copy du composant `LogementSynthesis` : « Régénérer » et « La lecture n'a pas pu être générée » exposent la machinerie (le mot « générer » dit « une IA fabrique ceci »). Proposition : bouton « Relire ce logement », erreur « La lecture n'a pas abouti. Réessayez dans un instant. » Ce point est mineur et discutable (la transparence IA peut être voulue) : je le pose, je ne le tranche pas.

---

## Ce que je conserverais absolument

- **`SinistraliteBlock` en entier** : c'est le bloc-étalon du module. « Ce que les assureurs ont historiquement indemnisé dans la commune. Ces chiffres ne prédisent ni un sinistre pour ce logement, ni le prix de son assurance » ; « Un historique vide n'exclut pas une exposition future » : lucidité sans peur, échelle dite, trois niveaux de profondeur. C'est LUI le gabarit de reconstruction des autres blocs.
- **`RegulatoryStatusBlock`** et ses gloses `REGIME_GLOSS` (terme officiel + langage courant + « le règlement local seul les porte ») ; l'état A honnête (« Cela ne signifie pas que le logement est exempt de tout risque »).
- **Le SYSTEM_PROMPT** tel qu'en route.
- **La sobriété de Face 3** (« env. 400 m », familles en métadonnée, footer sources, aucun adjectif de proximité).
- **Les états vides honnêtes du DPE** (« Cela ne signifie pas nécessairement qu'aucun diagnostic n'existe »).

## Ce que je reconstruirais complètement

1. **Tout le haut de page** : hero (promesse morte + antithèse + méta), aside « briques » (suppression), deuxième intro (réduction). Un seul geste d'entrée : une promesse honnête, un champ d'adresse.
2. **« Risques du bâti »** : de la liste de tags rouges au gabarit sinistralité (phrase → faits glosés → repli).
3. **« Actions documentées »** : fusion avec `Face2Implication`, suppression de la carte comparateur actuelle, desc alignées sur le contenu réel des pages Savoir.

## Les 3 décisions à plus fort impact sur 12 mois

1. **Réordonner le module autour de la synthèse et imposer le gabarit sinistralité à tous les blocs de preuve.** C'est ce qui transforme une juxtaposition de composants en récit ; tout le reste est cosmétique tant que l'ordre et le gabarit ne sont pas unifiés.
2. **Interdire structurellement la promesse morte** : aucun titre/hero ne peut nommer une capacité (« valeur », « pression assurantielle ») retirée du code. Règle candidate pour `editoriale.md` : *« Un titre de module ne promet que ce qu'un bloc rendu à l'écran livre aujourd'hui. Quand une brique est retirée du code, son mot est retiré du hero dans le même commit. »*
3. **Faire des sorties réelles de la synthèse le juge de paix éditorial** : lire 20 générations sur des cas variés (A récent, F ancien argile+PPRI, C_NO_DATA) avant tout durcissement de prompt ou réagencement définitif.

## Désaccords probables avec les autres sièges

- **Product Strategist** : voudra garder « Confort, risques, valeur » (le mot « valeur » vend). Ma position : c'est une promesse que le code a retirée pour raison d'honnêteté ; la garder au titre, c'est vendre le mensonge qu'on a soi-même corrigé.
- **Business Strategist** : voudra conserver la carte comparateur (cross-sell vers le moteur). Je ne demande pas sa mort, je demande qu'elle cesse de faire de l'offre le sujet et de promettre une comparaison de « bien » que le produit ne fait pas ; un cross-sell honnête convertit mieux qu'un cross-sell faux.
- **Software Architect** : pourrait défendre l'aside « briques » comme état de chargement/complétude utile. La complétude se montre par l'interface (états des blocs), pas par une liste qui dit « à venir ».
- **Design Critic** (absent du board) : plusieurs de mes critiques (ordre, couleur rouge, suppression de l'aside) débordent sur son terrain ; je nomme les fautes de prose et de promesse, je lui laisse la reconstruction de l'écran.

## Cohérence (tensions posées, non tranchées)

- « Passoire thermique » : terme d'usage courant ET label de bien. Le bannir du Passeport (ma recommandation) tout en le gardant dans les ActionCards (« passoires thermiques » au pluriel, catégorie réglementaire) est défendable mais demande arbitrage porteur.
- Transparence IA : faut-il que le lecteur sache que la « Lecture de ce logement » est générée (bouton « Régénérer ») ? Question de positionnement, pas de prose.

## Mise à jour de la doctrine (prête à écrire)

Ajouter à `editoriale.md`, section « La page s'adresse au lecteur, pas à elle-même » : *« Un titre ou un hero ne promet que ce que la page livre à l'écran aujourd'hui. Retirer une brique du code retire son mot du titre dans le même geste. Cas d'école (2026-07-07) : le hero Logement promettait “pression assurantielle et trajectoire de valeur” cinq jours après le retrait des briques assurance et valeur. »*

## Version minimale (~90 % de la valeur)

Réécrire le sous-titre du hero et sa phrase d'intro : remplacer « Confort, risques, valeur » par « Énergie, risques, entourage » et supprimer la phrase « Ce module lit le bien lui-même : DPE, risques par adresse, pression assurantielle et trajectoire de valeur. Il ne raconte pas tout le territoire. Il raconte ce que ce logement absorbe, perd ou protège. » au profit de « Une adresse suffit. Vous y lisez la performance énergétique du bien, son exposition aux risques naturels, ce que les sinistres ont déjà coûté à assurer dans la commune, et ce qui entoure la porte. » Ce seul geste supprime la promesse morte, la méta et l'antithèse au point le plus lu de la page.

## Quand rouvrir ce sujet

- **Retour des faces valeur/assurance sur donnée réelle** (ONRN coût+fréquence, roadmap vault logement) : « valeur » redevient légitime au hero, réviser la triade.
- **Réordonnancement 1b livré** (synthèse en tête) : revalider l'attaque de la synthèse et la première impression ; l'aside supprimée change l'équilibre du hero, revoir alors la colonne droite avec le Design Critic.
- **20 premières générations réelles de la synthèse** : si labels de bien, remplissage des trois cases ou sources entre parenthèses apparaissent, durcir le prompt avec exemples négatifs verbatim (modèle Quartier).
- **Analytics ActionCards** : si les clics sont quasi nuls sur les cartes réécrites, la bonne réponse devient la suppression du bloc entier, pas une nouvelle réécriture.
- **Création des pages Savoir promises** (`/savoir/renovation-cout`, `/savoir/dpe-calendrier`) : tant qu'elles n'existent pas ou ne livrent pas ce que les desc annoncent, les desc doivent être réduites à ce qui existe.

## Limites de mon regard (ce run)

- Je n'ai pas le rendu visuel : je juge l'ordre et le rythme dans le code, pas l'effet réel à l'écran (l'aside « briques » est peut-être moins présente visuellement que dans le JSX ; le rouge des chips est peut-être atténué par les tokens).
- Je n'ai pas vérifié l'existence ni le contenu des pages Savoir liées (`/savoir/renovation-cout`, `/savoir/assurance-littorale`…) : ma critique « promesse au-delà de la preuve » sur les desc est conditionnelle à cette vérification.
- Je n'ai lu aucune sortie réelle du LLM de synthèse : mon « le prompt tient » est un jugement de texte, pas de comportement.
- Je juge la prose, pas la conversion : je ne sais pas si le hero « valeur » convertit mieux malgré sa fausseté ; ma position est doctrinale (l'honnêteté est le moat), pas mesurée.
- Je n'ai pas relu `DpeSelector` ni `AddressAutocomplete` (chaînes visibles possibles hors de mon périmètre lu) : angle mort assumé de cette passe.
