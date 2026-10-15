# FUT-50 · Chaleur : une réponse visuelle à la priorité, sans narration redondante

15 octobre 2026 · branche `feat/fut-50-accueil-decision` · prototype seulement.

**Inchangés** : seuils, classifications, sources, animations, autres priorités, basculement 30 °C.

## Ce qui change

- **Paragraphe chiffré retiré.** Le paragraphe qui recalculait des gains (« environ 9 nuits tropicales … de plus par an ») ne répète plus les deux mesures.
- **Pastille rétablie**, avec le même gabarit que les autres priorités : carré coloré et libellé. La couleur accompagne toujours un mot, jamais seule.
- **Une seule phrase courte** sous la pastille : elle interprète, et ne contient aucune quantité (seulement des années). Un test le vérifie.
- **Titres éditoriaux** (« Des nuits chaudes plus fréquentes »…) retirés : c'est la pastille qui répond.

**Ordre** : les deux mesures, le basculement 35 °C / 30 °C, « Pour votre priorité » (pastille et phrase), « Comment lire ce résultat ? » replié, « À vérifier », puis les actions.

## La restitution, et ce qui la fonde

| Classement du moteur | Pastille | Couleur | Fondement |
| --- | --- | --- | --- |
| `unfavorable` | Plutôt défavorable | teinte « correspond moins bien » | au moins un axe atteint le seuil (`classifyClimateComfort`) |
| `under_threshold`, et au moins une mesure ≥ 1 par an | **À surveiller** | teinte « à contrôler » | sous les seuils, mais avec des fortes chaleurs |
| `under_threshold`, les deux mesures < 1 par an même en 2050 | Plutôt favorable | teinte « correspond » | palier existant « moins d'un » de l'accueil |
| `absent` / `uncertain` | Donnée indisponible | neutre | inchangé |

**Pourquoi La Rochelle ne reçoit pas de verdict positif.**
- Le moteur ne produit aucune issue favorable pour la chaleur : la branche « alignment » est explicitement différée dans `climat-facts.ts`, faute de rang de trajectoire.
- `under_threshold` dit seulement « aucun seuil atteint ». À La Rochelle, les nuits tropicales sont à 23,4 pour un seuil de 25.
- « À surveiller » répond à la question sans rassurer ni alarmer.

**Le seul « Plutôt favorable »** est le cas où les deux mesures restent sous une par an, même en 2050. C'est un palier qui existait déjà. **Je te le soumets** : si tu préfères qu'aucun cas de chaleur ne soit jamais favorable sans une branche du moteur, ce cas passe aussi en « À surveiller » (une ligne à changer).

## La Rochelle, Nantes, Bordeaux, Nîmes

| Commune | Classement | Pastille | Phrase |
| --- | --- | --- | --- |
| La Rochelle | sous les seuils | À surveiller | Les fortes chaleurs progresseraient, d'abord la nuit, sans atteindre ce que futur•e signale. |
| Nantes | sous les seuils | À surveiller | Les fortes chaleurs progresseraient, d'abord la nuit, sans atteindre ce que futur•e signale. |
| Bordeaux | défavorable (nuits) | Plutôt défavorable | Ce sont les nuits chaudes qui dépassent ce que futur•e signale. |
| Nîmes | défavorable (les deux) | Plutôt défavorable | Les journées très chaudes comme les nuits chaudes dépassent ce que futur•e signale. |
| Pau | sous les seuils | À surveiller | (même phrase que La Rochelle) |
| La Condamine-Châtelard | sous les seuils | Plutôt favorable | Les fortes chaleurs resteraient exceptionnelles ici, même en 2050. |

**Comment se décident les phrases :**
- « d'abord la nuit » ou « d'abord le jour » nomme l'axe dont l'écart avec 1976-2005 est le plus grand. C'est une comparaison des chiffres affichés, sans palier nouveau.
- Quand aucune hausse n'atteint une par an, la phrase devient « … resteraient à peu près au niveau de 1976-2005 … ».
- Sans référence reconstructible, aucune comparaison n'est dite.

**Limite assumée.** La Rochelle et Nantes reçoivent la même restitution, bien que les nuits de La Rochelle soient bien plus proches du seuil (23,4 pour 25, contre 11,1). Aucune règle existante ne permet de dire « proche du seuil ». La valeur exacte figure dans « Comment lire ce résultat ? ». Si tu veux cette nuance sous la pastille, il faut d'abord **décider une convention**, par exemple « au moins 80 % du seuil ». Je ne l'ai pas codée.

## Avant / après (« Pour votre priorité »)

| Commune | Avant (`650abe86`) | Après |
| --- | --- | --- |
| La Rochelle | *Des nuits chaudes plus fréquentes* · À l'horizon 2050, la commune compterait en moyenne environ 18 nuits tropicales et 3 journées au-dessus de 35 °C de plus par an qu'en 1976-2005. Les journées au-dessus de 35 °C y étaient presque absentes sur cette période. | **■ À surveiller** · Les fortes chaleurs progresseraient, d'abord la nuit, sans atteindre ce que futur•e signale. |
| Nantes | *Des nuits chaudes plus fréquentes* · … environ 9 nuits tropicales et 4 journées … | **■ À surveiller** · (même phrase) |
| Bordeaux | *Des nuits chaudes plus fréquentes* · … environ 21 nuits tropicales de plus par an … Cette évolution correspond mal à votre souhait… | **■ Plutôt défavorable** · Ce sont les nuits chaudes qui dépassent ce que futur•e signale. |
| Nîmes | *Des étés plus chauds, de jour comme de nuit* · … environ 36 nuits tropicales et 12 journées … Cette évolution correspond mal… | **■ Plutôt défavorable** · Les journées très chaudes comme les nuits chaudes dépassent ce que futur•e signale. |

## Vérifications

**Tests** :
- tests FUT-50 : 34/34 ;
- suite complète : 2 589/2 589 ;
- `tsc` et `eslint` sans erreur ;
- build de production réussi ;
- `/dev/fut50/c` renvoie 404 en production.

**Navigateur (Chromium)**, pour La Rochelle, Nantes, Bordeaux et Nîmes, à 1440, 390 et 360 px :
- la pastille et la phrase sont conformes au tableau, dans la bonne couleur ;
- au basculement à 30 °C, la hauteur du panneau et les nuits ne changent pas, rien ne déborde ;
- la seule requête observée est la mesure d'audience `clarity.ms`, aucune vers futur•e.

**Navigateur, sans changement** :
- clavier et mouvement réduit ;
- retour à 35 °C après un changement de commune ou de priorité ;
- explication repliable.

**Captures** : `c7-chaleur-{la-rochelle,nantes,bordeaux,nimes}-{1440,390,360}-{35,30}.jpg`.

**Hors périmètre, signalé** : sur mobile, le blanc réservé sous la légende à 35 °C (pour la légende à 30 °C, plus longue) fait environ deux lignes. Raccourcir la légende à 30 °C, en laissant l'horizon à la ligne de source, le réduirait.
