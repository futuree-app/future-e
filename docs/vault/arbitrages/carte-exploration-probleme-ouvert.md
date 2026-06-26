# Arbitrage : la carte-dashboard écartée, l'interaction spatiale ouverte

> Décision en deux temps. Issue du **premier board** (carte de France, 2026-06-26, quorum
> Product/Business/Design/Data), d'un **challenge outsider** (ChatGPT, non tenu par la doctrine)
> et d'une passe **Researcher** (divergence). Synthèse complète :
> `docs/board/traitees/2026-06-26-carte-de-france-synthese.md`. Menu d'ouverture :
> `docs/rapports-agents/researcher/2026-06-26-interactions-spatiales.md`.

## Contexte

Un utilisateur en démo : « il manque une carte pour explorer la France avec des filtres
(risques, climat) ». Consigne posée : ne jamais partir du principe que la carte est la solution.

## Décision — ce qui est FERMÉ

**La carte nationale à filtres / couches / choroplèthe (le « dashboard ») est écartée,
définitivement.** Non par défaut d'exécution, par collision de métier. Les quatre lentilles ont
convergé :
- une choroplèthe nationale = un **score synthétique caché** par commune (invariant n°2, ADR-0001) ;
- la plupart des données étant **infra-communales**, l'aplat communal **ment** (inondation, industrie, bruit, air) ;
- elle **contemple au lieu de décider** et pousse vers le **SIG** que le positionnement refuse ;
- la **couleur dramatise** (rouge alarmiste, contre l'invariant n°6) ;
- c'est la surface la **plus copiable**, elle **arme le portail immobilier** (risque structurant n°4) ;
- elle **ne touche pas le goulot** (consentement à payer B2C non mesuré).

Précédents qui pointaient déjà là : `comparateur-communes-retrograde`, `icu_ilot_chaleur_data`
(ÎCU refusé en carte). La seule forme cartographique honnête connue reste une **carte de contexte
à l'adresse** (objets : PPRi, ICPE/Seveso, trait de côte ; jamais d'aplat de score ; sources
Etalab, non-OSM), **côté rapport**, jamais en exploration nationale.

## Décision — ce qui reste OUVERT

Le board a prouvé qu'**UNE vision** de la carte est mauvaise, **pas que toute interaction
spatiale l'est**. Le challenge outsider a révélé que les quatre agents, tous **critiques** (ils
éliminent, aucun n'invente), partageaient trois angles morts :
1. un produit a souvent une phase de **flânerie / d'envie** AVANT la décision (Spotify, Airbnb, Maps) ; la carte n'est peut-être pas un outil de décision mais un **outil d'envie** ;
2. le segment **« j'ai une direction, pas une commune »** (quitter Paris, vers la mer, juste partir) existe DÉJÀ dans le produit (entrée « quitter Lyon » par unité urbaine) ; la prémisse « le lecteur arrive ancré » est **non testée** ;
3. une carte **pilotée par le moteur de compatibilité** (pas par des couches) n'est **pas copiable** : le moat est « pourquoi cette commune apparaît ».

Donc la vraie question, laissée ouverte : **quelle interaction spatiale est propre à futur•e,
qui augmente la découverte sans devenir un SIG ?**

## Les frontières qu'une réponse devra respecter

- **Jamais de score ni de couleur-valeur** (invariant n°2) : la couleur peut être référence
  géographique (eau, relief), jamais jugement.
- **Jamais d'aplat communal d'une donnée infra-communale** : seuls objets, lignes, zones
  réglementaires, ou apparitions sont honnêtes (cf. Data Curator).
- **Le récit au cœur**, la géographie au service du récit (« raconte avant d'expliquer »).
- **Le moteur, pas les couches**, comme cœur : sinon copiable et anti-moat.
- **Séquençage** : le goulot reste le paiement B2C ; aucune construction prioritaire avant cette
  preuve. Une carte spectaculaire pourrait être un **levier d'acquisition** (viralité, presse,
  démo) plus qu'une feature, mais c'est une hypothèse à tester, pas un acquis.

## Pistes d'ouverture (NON VÉRIFIÉES, Researcher)

À passer en convergence (Data Curator puis board) quand l'exploration spatiale redeviendra
prioritaire. Les plus loin d'un SIG : le **cartogramme de compatibilité** (la géométrie se
déforme selon le projet, incopiable), la **constellation** (communes groupées par parenté de
profil, plus de géographie), les **territoires-jumeaux**, la **France qui se vide** (l'arbitrage
rendu visible), le **couloir relationnel**, le **curseur temps** sur un lieu ancré. Menu complet
dans le rapport Researcher.

## Hypothèses à tester avant toute construction
- Le segment « direction sans commune » est-il significatif ? (PostHog : usage de « quitter X » ; sonde.)
- La flânerie convertit-elle vers la décision, ou disperse-t-elle l'intention ?

## Liens

`docs/board/traitees/2026-06-26-carte-de-france-synthese.md`, `adr/ADR-0009-hierarchie-orchestration-agents.md`
(board, divergence/convergence), `adr/ADR-0001-pas-de-score-synthetique.md`, `adr/ADR-0002`
(moat = transformation), `recherches/inventaire-design.md`, `recherches/inventaire-sources.md`,
`/memory/project_exclusion_ville_uu.md` (« quitter Lyon »).
