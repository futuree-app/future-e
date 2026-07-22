# Lot A : les trois points d'arbitrage, tranchés

**Date** : 2026-07-22 · **Périmètre** : les cartes du dossier « En une minute » (tête de `/rapport`).
**Statut** : tranché par le porteur, après contre-relecture externe. Étend le Lot A livré sur la branche
`feat/lot-a-depate-en-une-minute` (commit `65480b4`, non mergé).

Le Lot A livré avait laissé trois points ouverts, listés dans sa note d'implémentation. Ce document
les ferme, et redécoupe le lot en deux temps mergeables séparément.

---

## Point 1 : la pastille de preuve

### Ce qui était en place

`DecisionFactRenderParts.tsx` rendait `label = e.href ? "Preuve" : e.label`. Toute référence
cliquable perdait son libellé et affichait le mot « Preuve ». Sans valeur mesurée, la pastille se
réduisait à « PREUVE » tout nu, sur la même ligne que l'étiquette d'action, elle aussi en mono 10px
majuscules : deux titres de colonnes côte à côte, dont l'un ne voulait rien dire.

Le Lot A livré a corrigé en `e.href && e.observedValue ? "Preuve" : e.label`, ce qui fait remonter
dans la pastille des libellés de source (« INDUSTRIE · TOULOUSE », l'adresse complète du logement).

### La décision

**Une pastille porte une observation lisible et sa valeur. Sans valeur mesurable, il n'y a pas de
pastille sur la face : la source vit dans le dépliable.**

```
AIR · PM2,5 12,4 µg/m³        observation + valeur : pastille bordée, cliquable
BRUIT · VOIE FERRÉE À 400 M   idem
DPE · F                       idem
(rien sur la face)            fait booléen sans valeur : la source part au dépliable
```

Trois choses disparaissent de la face :

1. **le mot « Preuve »**. C'est du vocabulaire de moteur posé devant le lecteur, au même titre que
   « les éléments examinés indiquent que » que la table du verdict s'interdit déjà. Il n'apprend rien
   et il masque la destination du clic ;
2. **le score interne**. `scoreEvidence` (`materiality-rules.ts:49`) produit « 72/100 ». Le lecteur
   ne peut ni l'expliquer ni l'opposer, et le spec du bloc conclusion interdit déjà « aucun compteur /
   badge / score ». Ce helper n'est appelé que **deux fois**, dans la seule règle de compromis
   transport × chaleur (`:71-72`) : le corpus est déjà conforme partout ailleurs ;
3. **le nom de la commune dans le libellé**. `label: \`Territoire · ${nom}\`` répète dans chaque
   pastille ce que tout le rapport dit déjà. Le libellé devient le nom de la **mesure**.

### Ce qui a été écarté, et pourquoi

**Garder « Preuve » et créer un style « source » distinct** (un lien discret « Voir dans Territoire →»
sous les pastilles). Écarté : le Lot A livré vient d'introduire `ActionCue`, qui rend `→ label` en
casse basse avec une flèche colorée. Un lien de navigation sans bordure, à flèche, empilé au même
endroit, remplacerait la confusion preuve / action par une confusion navigation / action.

**Fabriquer une valeur pour les faits booléens** (« PPR · APPLICABLE », « ALÉA ARGILES · MOYEN OU
FORT »). Écarté : tautologique. Les cinq faits Logement concernés (`expositionBati`,
`zoneReglementee`, `caviteProche`, `perimetrePatrimonial`, `sinistraliteActive`,
`decision-fact.ts:133-137`) ne sont émis **que si** le booléen est vrai, et le détail lisible est déjà
dans le `statement` affiché juste au-dessus (« un plan de prévention des risques s'applique : PPRI de
la Garonne »). Une pastille qui recopie le constat en majuscules ajoute du bruit à une carte qu'on
désengorge.

### Table des cas

| Fait | Valeur mesurée | Face |
|---|---|---|
| Qualité de l'air | PM2,5 12,4 µg/m³ | `AIR · PM2,5 12,4 µg/m³` |
| Bruit | voie ferrée à 400 m | `BRUIT · VOIE FERRÉE À 400 M` |
| DPE | F | `DPE · F` |
| Mismatch relatif | parmi les 10 % les moins favorables | `TERRITOIRE · PARMI LES 10 %…` |
| Absence attestée | aucune desserte crédible à portée de marche | pastille, libellé de la mesure |
| Air quand `pm25 == null` | aucune | aucune pastille |
| Exposition industrielle | aucune | aucune pastille |
| Argiles / PPR / cavités / patrimoine / sinistralité | aucune | aucune pastille |
| Compromis transport × chaleur | `72/100` (score interne) | à remplacer par une observation, ou rien |

### L'invariant

**Une pastille affirme une mesure. Ce qui ne se mesure pas ne prend pas la forme d'une mesure.**

---

## Point 2 : les libellés d'action

### La décision

Le contrat d'action se dédouble :

```ts
action: { type: VerificationActionType; label: string; detail?: string }
```

- `label` : la démarche, courte, sans point final. Elle répond à « quelle démarche dois-je entreprendre ».
- `detail` : la checklist, phrase complète avec ponctuation. Elle répond à « quoi regarder pendant ».

Le `detail` part dans le dépliable, qui gagne **deux zones nommées sous un seul contrôle de dépliage**
(multiplier les accordéons par carte reproduirait l'encombrement) :

```
Détails
  À vérifier          la checklist de l'action
  Méthode du signal   la convention de seuil futur•e, la source
```

**Garde-fou automatisé.** `assertFactValid` (`materiality-rules.ts:450`) rejette déjà un `topic` de
plus de 70 caractères ou contenant une ponctuation de phrase. La même garde s'applique à
`action.label` : au-delà de 70 caractères, ou avec un point, l'assemblage échoue. Le retour progressif
des checklists sur la face devient impossible plutôt que déconseillé.

### L'ampleur réelle

Le brief citait sept libellés longs. Les actions Logement sont **posture-aware** :
`batiAction`, `pprnAction`, `caviteAction`, `patrimoineAction`, `siniAction` et l'action DPE sont
chacune un `Record<Bucket, string>` de quatre variantes (achat / location / réside / neutre),
`logement-rules.ts:59-64`. La migration porte sur **24 variantes**, pas sept.

### Les réécritures retenues

| Règle | `label` (face, sans point) | `detail` (dépliable, phrase) |
|---|---|---|
| bruit routier `materiality-rules.ts:342` | Vérifiez l'exposition du logement au bruit routier | Repérez la distance aux axes routiers et la façade sur laquelle donnent les chambres. |
| feux `:252` | Vérifiez la protection du terrain face au feu | Examinez la végétation environnante, l'éventuelle obligation de débroussaillement, l'accès des secours et les matériaux de la toiture. |
| confort d'été `:221` | Vérifiez le confort d'été du logement | Regardez l'orientation, l'étage, l'inertie des murs, les protections solaires et la possibilité de rafraîchir le logement la nuit. |
| ruissellement `:284` | Vérifiez l'exposition de l'adresse au ruissellement | Observez la pente du terrain, la présence d'un sous-sol, les réseaux d'évacuation et l'historique des dégâts des eaux. |
| bruit stratégique `:378` | Écoutez le bruit sur place | Consultez la carte de bruit et écoutez depuis le logement à plusieurs heures, fenêtres ouvertes. |
| bâti (achat) `logement-rules.ts:59` | Vérifiez l'historique du bâti | Demandez l'historique des fissures et des sinistres. Faites contrôler les fondations si un doute subsiste. |
| patrimoine (achat) `:62` | Vérifiez les règles applicables aux travaux extérieurs | Consultez la mairie sur les travaux autorisés dans le périmètre et sur l'éventuel avis de l'Architecte des Bâtiments de France. |

Les trois autres variantes de chaque table Logement suivent le même découpage, à écrire dans la passe
éditoriale.

**Refusé** : « Évaluez le bruit **réel** autour du logement ». Qualifier de réel ce que le lecteur va
constater dit implicitement que la mesure affichée au-dessus ne l'est pas.

**Refusé** : la troncature à l'affichage avec ellipse. Une ellipse ne sait pas quelle information est
secondaire, elle produit une phrase mutilée.

---

## Point 3 : la largeur de lecture

### La décision

```
conteneur de page          1100 px (partagé avec Territoire et /rapport/quartier : intouchable)
bloc « En une minute »      max-width 860 px, ALIGNÉ À GAUCHE
  eyebrow, bandeaux de statut, verdict, condition, strate, cartes, les deux CTA
headline du verdict         max-width ~540 px (titre en espace ouvert)
```

La largeur porte sur les **conteneurs**, jamais sur les paragraphes : les cartes rétrécissent, leur
texte continue de les remplir, donc aucune phrase ne se coupe à mi-bloc.

### Ce qui a été écarté, et pourquoi

**Centrer la colonne dans les 1100 px.** Écarté : le contenu utile fait 1044 px (1100 moins `px-7`).
Une colonne de 860 centrée se décale de 92 px, soit 8 %. Toute la page partage un axe gauche (hero,
bandeaux, modules Territoire). Un décalage de 92 px est trop faible pour se lire comme une intention
et trop visible pour passer inaperçu. Si la rupture de rythme doit se voir, elle se marquera par l'air
et la taille du héros.

**Headline à 760 px.** Écarté : en Serif 32 px, un headline de 95 caractères y tient sur deux lignes
très longues, ce qui produit un paragraphe agrandi. À 500-560 px il casse en deux ou trois lignes
courtes et redevient un signal.

**Resserrer le conteneur de page.** Écarté : il est partagé avec Territoire et `/rapport/quartier`.

### L'exception de doctrine

Le `max-width` du headline est l'usage prévu de l'exception que `feedback_text_maxwidth` admet (un
titre de hero mesuré en espace ouvert sous un grand titre). Elle ne s'étend jamais aux paragraphes des
cartes.

---

## Le découpage d'exécution

Ces arbitrages étendent le Lot A bien au-delà de ce que porte la branche livrée (trois composants de
rendu). Deux temps, mergeables séparément.

**A1, mécanique.** Aucune réécriture éditoriale, testable et mergeable seul.
- pastilles : libellé de la mesure, suppression du mot « Preuve », suppression des pastilles sans
  valeur, retrait du nom de commune des libellés d'evidence ;
- les deux pastilles de score du compromis transport × chaleur ;
- dépliable à deux zones nommées ;
- garde de longueur sur `action.label` dans `assertFactValid` ;
- largeurs 860 (le 540 du headline appartient au Lot B, qui crée le headline).

**A2, éditorial.** C'est là que vit le risque de voix.
- `action.detail` dans le contrat partagé ;
- migration des 24 variantes posture-aware ;
- passe Editorial Writer sur l'ensemble.

## Ce qui reste ouvert

- La valeur d'observation à substituer aux deux pastilles `72/100` du compromis transport × chaleur.
  Les données lisibles existent des deux côtés (jours de forte chaleur pour le climat, desserte pour
  les transports) : à choisir à l'implémentation, à défaut retirer l'`observedValue`.
- Le Lot A livré sur `feat/lot-a-depate-en-une-minute` reste non mergé. A1 se construit dessus.
