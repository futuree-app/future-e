# Trois synthèses Logement, trois inférences interdites

> Capture du 11/08/2026, faite depuis `address_dossiers.synthesis_text` sur la base de production.
> **Ce sont les sorties réelles, mot pour mot.** Elles sont le matériau des tests de régression :
> une synthèse se régénère et s'écrase, donc ce fichier est la seule trace stable.
> Copie brute des trois entrées : `/tmp/syntheses-capturees.json` (volatile, recapturable par la
> requête en fin de page).

Origine : audit externe sur compte payant (10/08/2026), qui en signalait deux. La troisième a été
trouvée en capturant les textes. **Trois synthèses stockées, trois fautes.** Ce n'est pas un
accident occasionnel, c'est le régime normal du dispositif actuel.

## Faute 1 : l'altitude devenue signal, et une inférence sur le bâti

**29 Rue de l'Evescot 17000 La Rochelle**, générée le 10/08/2026 à 22:02 UTC.

> Le secteur où se trouve ce logement est classé en exposition forte au sol argileux qui gonfle avec
> l'humidité et se rétracte en période sèche. Ce phénomène concerne le terrain à cette adresse, pas
> seulement la commune, et il est d'autant plus à considérer que **le bâti est bas : à 7,5 mètres
> d'altitude, les fondations sont proches d'un sol qui, selon les saisons, travaille.**

Trois interdits franchis d'un coup :

- l'altitude est transformée en signal, ce que le prompt proscrit mot pour mot ;
- « le bâti est bas » est une affirmation sur le BÂTIMENT tirée de l'altitude du TERRAIN, deux
  grandeurs sans rapport ;
- « les fondations sont proches d'un sol qui travaille » est un mécanisme physique inventé, alors
  que le prompt interdit de suggérer un mécanisme dont on n'a pas la donnée.

## Faute 2 : l'absence de zonage racontée comme une absence de risque

**2 Rue Crébillon 44000 Nantes**, générée le 10/08/2026 à 22:19 UTC.

> **L'adresse ne porte aucune exposition aux inondations ni aux mouvements de sol.** La sinistralité
> communale liée aux inondations repose sur un échantillon trop restreint pour être significatif à
> l'échelle de Nantes.

Le prompt dit : « Une absence de zonage réglementaire au point ne se raconte pas. Ne dites jamais
"aucun risque signalé", "pas de plan de prévention". » La phrase produite est plus forte encore que
les deux exemples interdits : elle conclut l'absence d'exposition, pas seulement l'absence de
document.

## Faute 3 : la même altitude, sous une autre tournure

**1 Rue Saint-Dominique 17000 La Rochelle**, générée le 05/08/2026 à 15:20 UTC. Non relevée par
l'audit.

> L'exposition au sol argileux concentre l'enjeu à la parcelle, d'autant que **l'altitude de
> 8 mètres environ n'éloigne pas le bien des contraintes de sol propres à ce secteur.**

Formulation négative, faute identique : l'altitude est mobilisée comme argument sur l'exposition du
sol. Elle montre qu'un validateur par motifs devra viser la MENTION de l'altitude dans un
raisonnement, pas une tournure particulière.

## La cause racine : la donnée est fournie, puis son usage est interdit

`src/lib/logement-synthesis-cache.ts:161` place `altitude` dans le payload envoyé au modèle. Le
prompt (`src/app/api/synthesize-logement/route.ts:240`) lui interdit ensuite d'en tirer quoi que ce
soit. L'altitude n'a **aucun usage autorisé** dans cette synthèse : elle ne sert à aucun fait, à
aucune règle, à aucune preuve. On la donne pour rien, et le modèle, à qui l'on donne rarement une
information inutile, la mobilise.

C'est le cas d'école de la doctrine du vault : un prompt n'est pas une frontière de sûreté. La
frontière, ici, est de **ne pas transmettre la donnée**.

Effet de bord assumé du retrait : `buildFactHash` dérive du payload, donc l'identité de cache
change et les synthèses stockées se régénèrent. C'est souhaitable, ce sont précisément les trois
textes ci-dessus.

## Ce que le retrait ne règle pas

La faute 2 ne vient pas d'une donnée en trop : le modèle raconte une absence à partir d'un payload
correct. Elle demande un validateur qui REFUSE le texte, sur le patron de
`FORMULATIONS_INTERDITES` (`src/lib/coverage-closure.ts`), et non une relance qui finit par laisser
passer (`synthesize-logement/route.ts`, ~ligne 410 : « un second échec LAISSE PASSER le texte et
journalise »).

## Recapturer

```js
sb.from('address_dossiers')
  .select('address_label,insee,dpe_selection_status,synthesis_generated_at,synthesis_text')
  .not('synthesis_text','is',null)
```
