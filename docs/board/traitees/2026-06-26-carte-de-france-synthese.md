# Synthèse du board — La carte de France de futur•e

> Board joué le 2026-06-26 à la main (orchestrateur `/board` pas encore construit). Quorum :
> Product, Business, Design, Data. Deux passes (pré-mortem + forge). La synthèse n'agrège pas en
> consensus : elle expose les tensions et nomme la décision qu'elles imposent au porteur. Le
> board aiguise, il ne décide pas. Question d'origine : `2026-06-26-carte-de-france.md` (ci-joint).

## 1. Le problème utilisateur réellement identifié
« Il manque une carte » est une **solution déguisée en besoin**. Le board a séparé deux besoins
que la phrase confond :
- **explorer / se repérer** (forme), qui suppose un lecteur sans ancre devant une France vierge ;
- **vérifier qu'un lieu déjà en tête ne me cache rien de spatial** (le vrai métier de futur•e).

L'hypothèse non dite de la demande (l'exploration à froid précède le choix) est **probablement
fausse** pour le lecteur cible : l'archétype dit que le déclencheur est toujours un moment ancré
sur un lieu ou un projet. À tester (sonde/PostHog) avant tout, mais le board penche nettement :
le besoin réel est de **vérifier** un territoire, pas de **scanner** la France.

## 2. Une carte est-elle la meilleure réponse ? — Non, pas sous la forme demandée
Unanimité des 4 lentilles contre la **carte nationale filtrable**, pour des raisons
**consubstantielles à la forme**, pas d'exécution :
- une choroplèthe nationale = un **score synthétique caché** par commune → viole l'invariant n°2 / ADR-0001 ;
- la plupart des données sont **infra-communales** → l'aplat communal **ment** (inondation, industrie, bruit, air) ;
- elle **contemple au lieu de décider** et pousse vers le **SIG/comparateur** que le positionnement refuse ;
- la **couleur dramatise** (rouge alarmiste) → viole « l'émotion vient du récit » + « intelligence, pas peur » ;
- c'est la surface la **plus copiable**, elle **arme le portail immobilier** (risque structurant n°4), ne creuse pas le moat ;
- elle **ne touche pas le goulot** (consentement à payer B2C non mesuré) : coût d'opportunité défavorable vs instrumenter le paywall ;
- déjà tranché **deux fois** : `comparateur-communes-retrograde`, `ÎCU-pas-de-carte` ;
- piège juridique : ODbL (OSM) déclenche le **partage à l'identique** si des couches publiques sont cartographiées.

## 3 & 4. Ce qui répond mieux au besoin (carte nationale écartée)
Par ordre de préférence (du plus simple au plus lourd) :
1. **Une phrase** (la version 100× plus simple) : « la zone inondable est au sud, pas au centre que tu regardes ». Le **passeport Territoire** porte déjà l'essentiel.
2. **Une micro-carte mono-commune dans un drawer**, comme **preuve d'un récit**, seulement là où la donnée est spatiale ET où la voir change l'arbitrage.
3. Si carte il y a : un **plan de situation ancré à l'adresse** (côté rapport), qui **situe sans noter**. Objets honnêtes sur leur géométrie (points ICPE/Seveso, zones PPRi, trait de côte), couleur = **référence géographique** (eau/relief/urbain), jamais valeur. Face d'une carte-indicateur qui ouvre un drawer narratif. Justifié **uniquement** par la **relation spatiale** qu'un paragraphe rend mal (« en aval du barrage », « la zone d'activité est entre toi et la gare »).
   - **Couches honnêtes** (Data) : PPRi/PPRN, ICPE/Seveso, trait de côte/recul, CatNat compté, ZFE — toutes **Etalab** (non-OSM, licence propre), réglementaires/mesurées/historiques, **zéro projeté**.
   - **Liste rouge, jamais en carte** : les percentiles du comparateur (score caché), DRIAS projeté, ÎCU, ATMO (interpolé), sols, OSO, DVF (arme le portail immo).

## 5. Les plus grands risques
1. **Positionnement** : basculer en « SIG / comparateur » = le risque structurant n°1 du modèle.
2. **Moat** : armer le portail immobilier avec notre surface la plus copiable.
3. **Honnêteté** : un aplat qui ment sur la granularité et efface observé/projeté, à 35 000 exemplaires.
4. **Invariant n°2** : le score caché par la couleur.
5. **Allocation** : dépenser les semaines les plus rares sur une feature démo-séduisante pendant que le goulot (paiement B2C) reste non instrumenté.
6. **Juridique** : ODbL partage à l'identique sur des couches OSM cartographiées.

## 6. Recommandation finale du board
**« Le besoin est réel, mais la bonne réponse n'est pas une carte. »**
- **Refuser** la carte nationale d'exploration filtrable en B2C, définitivement (collision de métier, pas défaut d'exécution).
- **Reformuler** le besoin en « vérifier un lieu sans qu'on me cache un fait spatial », servi d'abord par une phrase + le passeport, au plus par une **micro-carte de situation à l'adresse** dans un drawer (objets, pas choroplèthe), côté rapport.
- **Ne pas en faire une priorité** : le goulot reste le consentement à payer B2C ; la prochaine semaine va à instrumenter le paywall.
- **Parquer la dimension B2B** : une carte risque/adresse exportable est un **actif de vente B2B** (type CityScan), à rouvrir seulement quand (1) la preuve B2C est établie et (2) un segment B2B (CGP) est ouvert — jamais avant (ADR-0008).

## Les tensions laissées au porteur (le board aiguise, il ne tranche pas)
1. **Construire la micro-carte de situation, ou pas ?** Même la forme survivante est lourde (tuiles, géométries) pour un gain cantonné aux relations spatiales. À n'investir que si une commune réelle a une relation spatiale décisive qu'aucune carte-indicateur ne rend déjà.
2. **B2C vs B2B** : la carte est une dilution en B2C, un actif en B2B. Quand basculer ? Dépend de la clause de réouverture d'ADR-0008.
3. **À vérifier** : tester (sonde) qu'il n'existe pas un vrai segment « je ne sais pas où aller, montre-moi ». S'il existe, la réponse reste `/ou-vivre` (préférences), pas une carte.

## Prêt à graver (si le porteur valide)
- `arbitrages/carte-nationale-ecartee.md` (matière rédigée par Product + Business + Data).
- Une victoire méthodologique dans `recherches/inventaire-sources.md` (rédigée par Data).
- Une tension ouverte dans `recherches/inventaire-design.md` (rédigée par Design).
- Une note risque n°4 dans `vision/modele-economique.md` (Business : toute surface exposant les couches brutes augmente la copiabilité).
