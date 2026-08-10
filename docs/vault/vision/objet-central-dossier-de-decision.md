# L'objet central : un dossier de décision, versionné et cumulatif

> Page fondatrice, écrite le 10/08/2026 à partir de **deux audits externes** commandés par le
> porteur (Codex), d'une **contre-lecture** (ChatGPT) et d'une **vérification dans le code**
> conduite en session. Le premier audit portait sur le dépôt et les surfaces publiques ; le second
> sur un **compte authentifié avec dossiers payés**, ce qu'aucun audit antérieur n'avait fait.
> Elle dit ce que futur•e a décidé d'en retenir, ce qu'elle en corrige, et ce qu'elle diffère.
>
> Elle ne remplace pas `manifeste.md` (le pourquoi) ni `positionnement.md` (la voix). Elle répond à
> une question qu'aucune des deux ne posait : **quel est l'objet que futur•e vend et fait vivre ?**

## La question qui a produit cette page

Une IA généraliste bien guidée sait déjà chercher, lire des fichiers, citer des sources et rendre
un beau rapport sourcé. Si futur•e vend un rapport sur un lieu, elle vend ce qu'un assistant
généraliste produira de mieux en mieux, à un prix qui tend vers zéro. La question n'est donc pas
« notre rapport est-il bon », elle est : **que possédons-nous qu'une IA ne peut pas reconstituer à
la demande ?**

## La thèse

> futur•e ne vend pas un rapport sur un lieu. Elle **tient un dossier de décision** rattaché à un
> projet de vie : ce qui correspond, ce qui contredit, ce qui reste inconnu, et ce qui a changé
> depuis la dernière fois.

Ce qui devient défendable, c'est **l'état structuré de la décision**, pas le texte qui le raconte :

```
projet → candidats → critères → faits → preuves → inconnues → actions
```

Une IA imite un texte en quelques secondes. Elle ne maintient pas, pour un lecteur donné, un état
cohérent qui garde la même convention d'un candidat à l'autre, conserve ce qui n'a pas pu être
vérifié, et sait ce qu'il était possible de savoir à la date où la décision a été prise. C'est
exactement ce que futur•e a déjà en matériau et ne montre pas encore.

Corollaire sur le rôle de l'IA, qui devient une règle : **l'IA doit avoir intérêt à interroger ce
registre, pas à imiter son texte final.**

## Ce qui est adopté

1. **L'objet central est le dossier, pas le rapport.** Territoire, Autour et Logement deviennent
   les lieux de la preuve ; la page du dossier devient le lieu de l'arbitrage.
2. **Quatre niveaux reliés, jamais fusionnés** (voir la section dédiée plus bas). Une modification
   au bon niveau doit changer, de façon explicable, ce que les vues disent.
3. **Le triptyque du gratuit** : une correspondance, une contradiction, une inconnue, chacune
   réelle, datée et sourcée. C'est la démonstration de la nature du moteur, pas un aperçu tronqué
   du payant.
4. **Le payant permet une action** : écarter, comparer, visiter, poser une question, vérifier, ou
   assumer un compromis en connaissance de cause.
5. **Une pièce apportée par le lecteur produit une version nouvelle**, l'ancienne restant lisible.
   Premier cas tenu le 10/08/2026 : le diagnostic choisi après l'achat
   (`artefactPerimeParLeDpe`, commit `32a2861`).
6. **AskFuture est une interface secondaire du dossier**, jamais le produit.
7. **La comparaison conserve les compromis** au lieu de désigner un gagnant, ce que
   `adr/ADR-0001` interdisait déjà par une autre porte.
8. **Le rôle de l'IA est borné** : parser le projet et les documents, reformuler des faits déjà
   sélectionnés, expliquer une contradiction, proposer des questions à partir d'inconnues
   déterminées. Jamais décider de la couverture, d'un seuil, du verdict ou de la provenance.

## Quatre niveaux, reliés et distincts

« Une source de vérité » ne veut pas dire « une seule table qui contient tout ». Fusionner ces
niveaux produirait un objet monstrueux et, surtout, poserait chaque donnée au mauvais endroit.
La cohérence vient de leur **relation**, et les cardinalités sont la partie qui décide de
l'architecture.

| Niveau | Ce qu'il porte | Cardinalité |
|---|---|---|
| **Profil** | Ce qui survit aux recherches : santé, mobilité, composition du foyer, préférences durables | Une personne |
| **Projet** | Cette recherche-ci : partir en Bretagne, louer ou acheter, échéance, priorités, contraintes | Plusieurs par personne |
| **Candidat** | Ce bien ou ce territoire : la posture vis-à-vis de CE logement, le diagnostic retenu, les visites, les points à vérifier | Plusieurs par projet |
| **Version d'analyse** | Les faits, sources, règles et la conclusion, calculés à un instant donné | Plusieurs par candidat |

C'est cette structure, et non un objet unique, qui réalise
`projet → candidats → preuves → arbitrages → décision`.

Elle explique aussi un symptôme relevé sur le compte réel : le module Logement redemande après
l'analyse si le lecteur achète, loue ou habite. Cette donnée appartient au **candidat**, jamais à la
personne, et elle était cherchée au mauvais niveau.

Conséquence sur le gel : un changement matériel au niveau du **projet** ou du **candidat** (posture,
diagnostic) ne réécrit jamais l'analyse vendue, il produit une **version nouvelle**, datée, la
précédente restant lisible. C'est la même règle que pour le diagnostic, tenue depuis le 10/08/2026.

## Un prompt n'est pas une frontière de sûreté

Formulation retenue de la contre-lecture du 10/08/2026, et elle vaut pour tout le produit.
« Ne déduis jamais X » est une préférence exprimée à un modèle, pas une garantie d'exécution.

La preuve est dans notre propre code, en creux : le verdict décisionnel est fiable parce qu'il
**n'est jamais généré** (`generable: false` sur le bloc du plan de conclusion), et non parce qu'une
instruction le lui interdirait. Les synthèses de module, elles, ne reposent que sur l'instruction,
et c'est exactement là que des inférences interdites ont été observées.

Règle qui en découle : une propriété qui doit être vraie **doit être structurellement impossible à
enfreindre** (elle n'est pas générée), ou **vérifiée après coup par un validateur qui refuse**
(patron de `FORMULATIONS_INTERDITES` dans `src/lib/coverage-closure.ts`). Un texte qui échoue à la
validation ne s'affiche pas ; l'afficher en journalisant revient à n'avoir aucun garde-fou.

## Intégrité contre conversion : deux natures de défaut

Distinction plus utile qu'une liste de priorités numérotées. Un défaut d'**intégrité** peut livrer
au lecteur une analyse fausse, invérifiable ou rattachée au mauvais bien. Un défaut de
**conversion** rend le produit moins compréhensible ou moins désirable, sans corrompre le dossier.

Intégrité : les synthèses libres, l'identité du bien tout au long du parcours, le recalcul explicite
après un changement matériel, la chaîne de preuve visible.
Conversion : la conclusion qui arrive après plusieurs écrans, la longueur du rapport, la barre
AskFuture sur mobile.

Une précision qui évite un mois de travail mal orienté : **aucune donnée fausse n'a été observée**.
Ce qui est cassé, c'est la couche qui MONTRE la preuve, jamais la preuve.

## Ce que futur•e doit posséder

- Les contrats de données, les conventions, les versions et les tests qui les tiennent.
- Le graphe projet → critère → fait → preuve → inconnue → action.
- L'historique de ce qui était connu à chaque décision.
- Une base cumulative de vérifications et de corrections confirmées.
- Le workflow qui va de la comparaison à la préparation d'une visite ou d'une offre.

## Ce qui devient une commodité, et qu'il ne faut pas défendre

Les résumés, les reformulations, les explications génériques, la recherche libre, les FAQ, la mise
en page d'un PDF. Ce sont des couches de présentation. Les traiter comme de la valeur revient à
défendre le terrain sur lequel une IA généraliste gagne par construction.

## Ce que futur•e corrige dans les audits

- **futur•e couvre deux moments, pas un.** Les audits font glisser le produit vers la due diligence
  d'un acheteur immobilier. Le premier moment reste **choisir un territoire où envisager sa vie**,
  et il concerne des locataires, des personnes en mobilité, des gens sans bien identifié. Le dossier
  relie les deux moments ; il ne réduit pas futur•e à préparer une offre.
- **Le positionnement ne se définit pas contre l'IA.** « Un dossier de décision, pas un rapport
  IA » est une bonne doctrine interne et un mauvais titre : il fait de l'adversaire le sujet, et il
  emploie la forme d'antithèse que la doctrine éditoriale proscrit. La façade parle au lecteur :
  « Ce lieu correspond-il vraiment à votre projet ? »
- **Le registre est un moteur, pas une esthétique.** En profondeur : preuves, versions, conventions,
  historique. En façade : projet, lieux, compromis, décisions. Un dossier qui ressemble à un système
  d'archivage a perdu le lecteur.
- **Les réponses brutes du questionnaire ne se suppriment pas.** Elles restent comme historique.
  Ce qu'il faut, c'est une représentation canonique et versionnée du projet, dérivée d'elles, et
  utilisée partout.
- **Le `noindex` n'est pas un oubli.** Il est volontaire tant que le site n'est pas jugé prêt.
  Le plan d'ouverture existe et attend un feu vert
  (`docs/superpowers/plans/2026-08-04-ouverture-indexation.md`).
- **Le B2B reste une hypothèse à interroger, pas un verdict.** Chasseurs et relocation sont des
  pistes crédibles ; les fourchettes de prix avancées ne reposent sur aucune vente observée.
  Cohérent avec `adr/ADR-0008` : relais, jamais pilier.
- **« Aucun moat démontré » est vrai et normal.** Un moat ne se démontre pas avant le premier
  client. Ce que les audits établissent vraiment : **la partie vulnérable de futur•e est celle que
  le site donne l'impression de vendre ; la partie défendable existe dans le moteur, sans être
  unifiée, visible, ni transformée en usage.**

## L'écart entre la thèse et le produit du jour

La thèse n'est pas tenue aujourd'hui, et l'audit sur compte réel le prouve en trois points
vérifiés dans le code. Ils sont détaillés, avec leurs numéros de ligne, dans
`/memory/audit_compte_reel_p0.md` :

1. Une **synthèse générée peut enfreindre le prompt qui la borne**, donc la promesse « l'IA
   n'invente pas l'analyse » n'est pas vraie partout. Elle l'est pour la conclusion décisionnelle,
   qui n'est jamais générée.
2. La **chaîne de preuve visible ne permet pas d'auditer une conclusion** : les faits du logement
   affichent l'adresse analysée comme leur source.
3. Le **bien actif n'existe pas** : le hub suit une commune, et retombe sur le premier dossier
   qu'elle contient.

Tant que ces trois points tiennent, futur•e revendique une traçabilité que son écran ne sert pas.
C'est le vrai coût du retard, davantage qu'une fonctionnalité manquante.

## Ce qui est différé, et pourquoi

Le porteur a arbitré le 10/08/2026 : **la priorité est la vente avant le 20 août**
(`/memory/project_csp_activite_conservee.md`). Les chantiers structurants de cette page sont donc
des chantiers de septembre, dans cet ordre de valeur :

1. Borner les synthèses génératives, ou les rendre déterministes.
2. Réparer la chaîne de preuve visible.
3. Porter le `dossierId` de bout en bout, et faire du dossier le contexte persistant.
4. Placer la conclusion avant le climat et les modules (mesuré : 1 316 px avant le verdict sur
   desktop, 1 844 px sur mobile).
5. Unifier projet, mémoire, intention et version d'artefact.

La collaboration, l'import de documents et la carte d'Autour viennent après. Ajouter des
fonctionnalités à un dossier dont la preuve et l'identité du bien ne sont pas fiables amplifierait
le mauvais problème.

## La kill list

Ce que futur•e s'interdit de construire ou de mettre en avant :

- Le « rapport personnalisé généré par IA » comme proposition centrale.
- Un chatbot généraliste présenté comme l'avantage premium.
- La vente de prose, de résumés ou de PDF statiques.
- De nouveaux thèmes et de nouveaux logos de sources avant d'avoir prouvé l'usage des critères
  actuels.
- Un score unique ou un classement universel des territoires (`adr/ADR-0001`).
- Un abonnement B2C permanent sans fréquence démontrée
  (`arbitrages/recurrence-b2c-episodique-pas-mensuelle.md`).
- Une API, du white label ou un produit portefeuille avant demande répétée d'acheteurs identifiés.
- Une page B2B qui adresse simultanément notaires, assureurs, diagnostiqueurs, banques et
  collectivités.
- Les recommandations vagues (« ville idéale », « logement sûr »).
- Les pages qui transforment un indicateur technique en verdict plus fort que sa source. Cas
  ouvert : « jours de canicule » désigne aujourd'hui les jours au-dessus de 30 °C, alors qu'une
  canicule suppose une durée, des nuits chaudes et des seuils départementaux.
- Une ingestion documentaire ouverte avant de maîtriser le DPE, les diagnostics et leur provenance.
- La personnalisation purement narrative, qui ne change ni règle, ni hiérarchie, ni action.

## Ce qui reste à trancher

- Le score sur 100 du teaser du questionnaire contredit le refus des indices composites affiché
  ailleurs. Le retirer, le renommer, ou assumer l'indice thématique.
- Faut-il garder des synthèses génératives dans les modules payants, ou revenir à un assemblage
  déterministe et réserver la prose à une demande explicite ?
- Le dossier doit-il rester figé quand le **projet** change, comme il l'est aujourd'hui ? Le gel
  protège la décision achetée ; il rend aussi le projet moins agissant qu'annoncé.

## Liens

`vision/manifeste.md`, `vision/positionnement.md`, `vision/modele-economique.md`,
`arbitrages/moat-assemblage-largeur-en-tunnel.md`,
`arbitrages/deterministe-selectionne-ia-formule.md`, `adr/ADR-0001-pas-de-score-synthetique.md`,
`adr/ADR-0008-b2b-relais-pas-pilier.md`, `paris.md` (paris #10 et #11),
`/memory/audit_compte_reel_p0.md`, `/memory/business_moat_assemblage.md`.
