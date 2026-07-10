# Synthèse : ce que la session du 9 juillet 2026 a établi

> Point d'entrée des trois audits produits ce jour. Tout est mesuré sur données réelles, aucun PDF
> n'a été lu, aucun LLM n'a été appelé pour produire un chiffre. Branche `spike/le-fil-mesures`.
>
> 1. `2026-07-09-le-fil-icpe-verdict-spike.md` — l'ICPE ne peut pas porter Le Fil
> 2. `2026-07-09-rapport-vivant-matiere-par-critere.md` — de quoi vivrait un « rapport vivant »
> 3. `2026-07-09-inventaire-sources-angles-morts.md` — balayage large des sources non exploitées

## En une page

**Le Fil ne se construit pas sur l'ICPE.** 7 % seulement des inspections produisent un acte, donc les
14 834 rapports d'inspection ne doivent pas être lus : le pipeline OCR + LLM qui motivait le spike
n'a pas d'objet. Sous une définition stricte, l'ICPE produit 614 mouvements par an en France, soit
une commune touchée tous les 57 ans. Sous une définition large, elle produit un fil de mises en
demeure, que la doctrine éditoriale récuse (il punirait les territoires bien contrôlés).

**Un « rapport vivant » a peu de matière, et pas là où on croit.** Deux critères sur vingt-huit
bougent sur un événement daté : `faible_risque_inondation` (arrêtés CatNat) et
`faible_exposition_industrielle` (créations d'ICPE). Les vingt-six autres bougent quand un
référentiel se republie, c'est-à-dire pour toutes les communes le même jour. Environ **33 % des
lecteurs** connaissent au moins un mouvement durable par an.

**La valeur non exploitée est au grain adresse, dans le module Logement.** Trois sources l'établissent
par des chemins indépendants : les servitudes, les logements neufs livrés, et le Géoportail de
l'urbanisme.

## Les faits, avec leur chiffre

| Fait établi | Chiffre | Où |
|---|---|---|
| Les inspections ICPE ne mènent à rien | 7 % suivies d'un acte sous 180 j | audit 1 |
| L'extrapolation nationale se fait par installation, non par commune | 8 200 P0/P1 par an, non 19 000 | audit 1 |
| Le tri P0/P1 classe des bonnes nouvelles en priorité maximale | 25 % des P0 sont des levées de mise en demeure | audit 1 |
| Les servitudes sont récupérables, avec géométrie | 836 SUP + 5 682 SIS, 51 % de la population | audit 1 |
| Une adresse sur six a une servitude à moins de 500 m | 16 % (32 % à 1 km) | audit 1 |
| Latence des arrêtés CatNat | médiane 99 j, **p90 640 j** | audit 2 |
| Deux critères sur 28 portent un flux daté | inondation, exposition industrielle | audit 2 |
| Logements neufs livrés (DPE ADEME) | 91 % des lecteurs, grain adresse | audit 2 |
| Le PLU et toutes les servitudes répondent à l'adresse | PLU versé pour 85 % des communes | audit 3 |
| Logements en périmètre ABF (isolation extérieure refusée) | **25 %**, et 55 % en ville | audit 3 |
| DVF ne couvre pas l'Alsace-Moselle | 0 commune sur 1 605 | audit 3 |
| Défaut du calcul de prix en production | p90 +9,7 %, p99 +30,7 % | audit 3, **corrigé** |
| Indice de détour route / vol d'oiseau | médiane 1,38, max 2,21 | audit 3 |

## Les trois décisions que ces chiffres portent

**1. Fermer l'ICPE comme flux éditorial, la garder comme source de critère.** Les créations et
extensions rafraîchissent `faible_exposition_industrielle`. Le Fil ne raconte un événement que si ce
rafraîchissement déplace assez le score pour changer ce que le lecteur lit.

**2. Ne jamais écrire « rien n'a changé ».** Le p90 de publication d'un arrêté CatNat est à 640 jours.
À tout instant, une part inconnue des événements de l'année n'est pas publiée. Un écran de diff doit
nommer les sources surveillées et dater la dernière vérification, jamais affirmer une absence. La
règle existe déjà dans `editorial-writer/2026-07-09-le-fil-classe-b-grammaire.md`, §5.

**3. Créer le critère avant le moteur.** Le principal pourvoyeur de matière est la servitude, et
aucun critère ne la porte. Un moteur de diff des critères serait aveugle à la donnée la plus décisive
au grain adresse. L'ordre des travaux s'inverse.

## Deux distinctions à graver

**Mouvement et état ne sont pas deux gravités, mais deux produits.** Le mouvement (une servitude
instituée, une usine autorisée, un plan de prévention approuvé) est rare, durable, mesurable en
delta ; il sert celui qui **choisit**. L'état (l'eau restreinte, un arrêté de catastrophe naturelle)
est saisonnier, répétitif, il a une date de fin ; il sert celui qui **habite**. Ils n'ont pas la même
unité de temps, ni la même exigence de fiabilité, ni la même responsabilité. Un rapport vivant de
résident doit **oublier** ; un diff, par nature, empile.

**Un fait qui compte et ne déplace aucun critère est une demande de critère manquant.** C'est ce qui
est arrivé aux servitudes, au PLU, aux logements neufs. Le Fil, en cherchant quoi raconter, a désigné
ce qu'il reste à mesurer.

## Le lien que personne n'avait fait

Une adresse en périmètre de monument historique (`AC1`) ou de site patrimonial remarquable (`AC4`)
est soumise à l'avis de l'Architecte des Bâtiments de France, qui refuse le plus souvent l'isolation
par l'extérieur. Or la Face 1 « lecture thermique » et `renovation.ts` recommandent des travaux.

Mesuré sur **210 adresses réelles de logements** (tirées des DPE, 70 communes au prorata de la
population, chaque point interrogé auprès du GPU) : **25 % des logements sont en périmètre ABF**
(IC 95 % : 19-31 %), et **55 % dans les communes de plus de 50 000 habitants** (IC : 38-70 %). Un
premier run indépendant sur 60 adresses donnait 18 %, dans l'intervalle du second.

**futur•e conseille aujourd'hui des travaux d'isolation à un logement sur quatre qui n'a peut-être
pas le droit de les faire.** Le code ne mentionne nulle part l'ABF. Le GPU répond à la question, à
l'adresse, gratuitement, sur la même API que `cadastre.ts` appelle déjà.

## Post-scriptum : la dernière porte de la veille, fermée

Le Researcher a proposé la **veille déléguée** (le lecteur définit une fois ce qui changerait son
avis, futur•e se tait jusqu'à ce que le seuil soit franchi). C'est la seule mécanique qui ne ment
jamais sur le silence. Elle semblait condamnée par la rareté des événements territoriaux, sauf sur le
seul critère mobile du produit : **le prix**.

Backtest sur les millésimes DVF 2022 à 2025, prix médian par commune et par année,
`scripts/research/veille-prix-backtest.mjs` :

- **Le prix communal ne bouge pas de façon locale.** Variation absolue médiane d'une année sur
  l'autre : **5,8 %**. Or le bruit d'échantillonnage pur, calibré sur la dispersion réelle des prix
  intra-commune (σ des log-prix = 0,369, mesuré sur six communes), vaut **9,4 % à 20 ventes par an,
  6,2 % à 50, 4,7 % à 100**. La variation observée est donc **entièrement compatible avec du hasard**.
- **Quand le prix bouge vraiment, il bouge ensemble.** 2023 → 2024 : médiane **‑4,1 %**, **69 % des
  communes en baisse**. Les deux autres transitions : +0,6 % et +0,5 %, avec **47 %** de communes en
  baisse, soit un tirage à pile ou face.

Autrement dit, une veille sur le prix notifierait soit du **bruit d'échantillonnage** (les années
calmes), soit une **nouvelle nationale** (2024), jamais un événement local.

**Les quatre sources de flux sont maintenant toutes qualifiées** :

| Flux | Verdict |
|---|---|
| Événements territoriaux (ICPE, CatNat, servitudes) | trop rares : 87 % des communes muettes sur un an |
| Millésimes de référentiel (BPE, INSEE, DRIAS) | synchrones : toutes les communes le même jour |
| Prix (le seul critère mobile) | bruit, ou mouvement national synchrone |
| Climat qui se réalise (ERA5) | continu et honnête, mais c'est un fait au passé |

**futur•e n'a pas de flux dense, et n'en aura pas.** Le récurrent ne viendra donc pas d'une veille.
Il reste trois candidats, tous mesurés ou proposés ce jour : la **personne qui change** (le cycle de
vie re-classe les critères sur un territoire immobile), le **débit d'inconnus** (un revenu récurrent
porté par une population qui traverse, sans rétention), et le **produit qui grandit** (nos critères
s'enrichissent quand la commune ne bouge pas).

## Ce que j'ai livré

Un correctif : `fix(logement)` écarte les ventes de plusieurs logements dans l'agrégation DVF.
L'index **n'a pas été régénéré** ; relancer `node scripts/populate-logement.mjs` pour propager.

Neuf scripts de recherche dans `scripts/research/`, tous reproductibles, qui écrivent leurs sorties
dans `tmp/` (git-ignoré).

## Trois fois où les données m'ont donné tort

Cela mérite d'être consigné, parce que c'est la leçon la plus réutilisable de la session.

- J'ai annoncé **le prix comme « le trou béant »** du produit après avoir lu `PREFERENCE_KEYS`. Il
  était déjà là, calculé depuis DVF, avec les loyers de l'ANIL, et son exclusion des critères de
  classement était une doctrine écrite en tête du script. *Lire l'index, pas seulement les types.*
- J'ai voulu **écarter toutes les ventes multi-lots** de DVF. 42 % sont des maisons avec garage, cas
  normal et conforme à la convention du marché. C'est ma méthode « stricte » qui biaisait.
- J'ai affirmé que « **années de loyer pour acheter** » mesurait la captation touristique. La
  corrélation de rang est de ‑0,152. L'indicateur ne mesure rien de tel : il détecte un extrême
  (centile supérieur : 73 % des communes ont plus de 40 % de résidences secondaires).

Et une quatrième, de méthode : le « rayon équivalent » d'un isochrone mesure une aire, pas une
portée. Une calibration en distance l'a montré. L'indice de détour, lui, répond à la question.

## Ce qui reste ouvert

- **Sécurité** (base communale SSMSI, mise à jour le 9 juillet 2026) et **IPS des collèges** :
  disponibles, décisionnels, et porteurs d'un dommage social que futur•e n'a pas vocation à produire.
  Ils exigent un arbitrage éditorial explicite, jamais une intégration par défaut.
- **Taxe foncière** : les taux vont de 4 % à 107 %, mais sans la base locative moyenne le ratio est
  trompeur. Conclusion suspendue.
- **Sitadel** (permis de construire) : la seule source qui dirait ce qui *va* se construire. Pas
  d'API. Les DPE de logements neufs ne disent que ce qui est déjà livré.
- **Isochrones** : corriger les sept critères d'accès là où le détour est fort (23 % des communes
  dépassent 1,6), plutôt que tout recalculer.
- **Le repli EPCI de `populate-logement.mjs`** couvre les petites communes ; un cumul de millésimes
  ferait passer la couverture communale de 7,8 % à 24,2 %, au prix de l'actualité.