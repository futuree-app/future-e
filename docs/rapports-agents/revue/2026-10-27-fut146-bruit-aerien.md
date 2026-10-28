# Revue indépendante FUT-146 (plans de bruit aérien PEB/PGS)

> Relecteur indépendant, 27/10/2026. Branche `bonjourfuturee/fut-146-plans-bruit-aerien`, commit `4a9e90a7`, base `4556ca11`.
> Revue écourtée sur consigne du porteur : ce rapport ne contient que ce qui a été vérifié. Ce qui n'a pas été reproduit est marqué « hypothèse ».
> Scripts de reproduction : `/private/tmp/claude-501/-Users-quentinbrache-Desktop-Futur-e/f34e8207-d6cb-477f-a4ed-c25851c1a75f/scratchpad/fut146/revue/e1.mts` … `e8.mts` (à lancer avec `node <script>` depuis le worktree).
> `node --test src/lib/fut146-bruit-aerien.test.ts` : 31/31 au vert. `npm test` n'a pas été lancé.

## BLOQUANT

### B1. En production, le module Logement ne lit jamais la parcelle et dit à chaque fois « La précision de la localisation n'est pas connue »
- `src/components/report/LogementModule.tsx:166` et `:274` : les deux seuls appels à `/api/georisques-logement` (ouverture et actualisation) envoient `type: null`. `AddressDossierRow` n'a pas de colonne de type BAN.
- `route.ts:74` passe `geocodage: banFeatureType`, donc `null`. Dans `bruit-aerien.ts:128`, cela donne `portee = "non_precisee"`, puis la ligne `:330` met `region = null`. Le grain vaut donc toujours `point`.
- Reproduction (`e1.mts`) : `albi-zone-d`, avec le geocodage `null` qu'envoie la production, donne `grain: point`, `portee: non_precisee`. La phrase lue est « Le point de l'adresse est en zone D… », suivie de « La précision de la localisation n'est pas connue : la lecture porte sur le point de l'adresse. » Même résultat pour `marignane-zone-a`, `marignane-zone-c-pgs` et `villeneuve-le-roi`.
- Ce qu'on attendait : la recette (02-architecture-recette.md, colonne « numéro · au point → parcelle ») annonce une lecture à la parcelle. Elle ne vaut que pour le banc `/dev/fut146`, qui injecte `f.ban.type`. Toute la lecture à la parcelle (`lireALaParcelle`, ses seuils, sa recette) est donc du code mort en production, et chaque rapport Logement porte une réserve de précision fausse pour une adresse géocodée au numéro.
- Les tests passent parce qu'ils fournissent tous `geocodage: x.ban.type` (`test.ts:120`). Aucun test ne suit le chemin réel de la production.

### B2. Un texte faux, voire absurde, quand deux zones se superposent au point (aérodromes voisins, ou recouvrement interne)
- `bruit-aerien-texte.ts:248` : la phrase « La parcelle touche aussi la {zones(autres)} ; la zone {r.zone}, plus exposée, est retenue. » est écrite **quel que soit le grain**. Elle ignore aussi l'aérodrome de la zone citée. Or en production le grain est toujours `point` (B1).
- Les recouvrements ont été mesurés avec Clipper sur la copie (`e3.mts`). Entre CDG et Le Bourget : D∩D 586 ha, D∩C 180 ha, D∩B 84 ha, C∩D 79 ha, D(CDG)∩A(Bourget) 53 ha, C∩C 11 ha. Entre Bâle-Mulhouse et Habsheim : quelques ha. À l'intérieur d'un même plan, Bordeaux et Marseille ont des recouvrements B∩C et B∩A d'environ 200 à 370 m², et Bastia un recouvrement C∩D.
- Reproductions (`e4.mts`, `e5.mts`) :
  - point 2.433304,48.974554 (CDG D ∩ Bourget D) : « Le point de l'adresse est en zone D… **La parcelle touche aussi la zone D ; la zone D, plus exposée, est retenue.** »
  - point 2.454010,48.976925 : « La parcelle touche aussi la zone C ; la zone C, plus exposée, est retenue. »
  - point 2.440031,48.968951 : zone A du Bourget retenue, puis « La parcelle touche aussi la zone D », alors que cette zone D est celle de CDG et qu'elle n'est pas nommée. Le bloc Autour, lui, ne mentionne pas du tout le second aérodrome.
  - point 9.488180,42.563732 (Bastia, un seul aérodrome) : « La parcelle touche aussi la zone D » alors qu'aucune parcelle n'a été lue.
- Ce qu'on attendait : ne jamais parler de parcelle au grain `point`, et nommer l'aérodrome de chaque autre zone. La règle de la notice DGAC (« retenir la plus exposée ») vaut à l'intérieur d'UN plan. Quand deux PEB se superposent, les deux s'appliquent et l'état des nuisances doit les citer tous deux : « indiquant cette zone » n'en cite qu'un.
- C'est un cas de la règle AGENTS.md : « la carte apparaît » ≠ « la carte dit vrai ». Aucun test ne couvre ces recouvrements.

### B3. Une géométrie non mesurable rend « incertaine » toute adresse dans un rayon de 5 km de son emprise, Dijon et Versailles compris
- `bruit-aerien.ts:286-288` (`horsZone`) : `if (!r) return vide("incertain")` se déclenche pour **chaque** candidate du préfiltre à 5 km. Il suffit que l'emprise de la zone soit à moins de 5 km : la distance réelle n'est jamais mesurée. Or `regionDe` rend `null` pour les trois zones non mesurables (LFSD A id 258, LFPV C 767, LFPV B 772) (`e7.mts`).
- Reproduction (`e8.mts`). Toutes ces adresses obtiennent le titre Logement « Bruit aérien : zone non établie » et la phrase « le tracé publié **près de l'adresse** n'est pas mesurable » :
  - Dijon, place de la Libération (5.0415, 47.3220) : à 5,8 km de la géométrie invalide ; zone D valide à 4,9 km. Attendu : « hors zone, D à 4,9 km ».
  - Dijon gare (5.0270, 47.3233) : à 6,6 km de la géométrie invalide ; aucune zone à moins de 5 km. Attendu : le silence (`absent`).
  - Versailles château : à 4,9 km de Villacoublay ; la zone la plus proche est la C de Saint-Cyr, à 2,3 km.
  - Vélizy, Meudon-la-Forêt, Chaville : même résultat.
- Aggravant : 767 et 772 sont des quasi-doublons (3 sommets diffèrent de 1e-6°) des zones **valides** 770 et 769. Le tracé de Villacoublay est donc lisible.
- Ce qu'on attendait : « incertain » seulement si la géométrie non mesurable est réellement à moins de la distance qui compte (50 m au point, ou à moins de la zone retenue la plus proche). Sinon, ignorer le doublon invalide quand un jumeau valide existe. La documentation (« lecture incertaine à leurs abords ») et le test Villacoublay (un sommet de la zone) ne voient pas ce halo de 5 km.

## IMPORTANT

### I1. Parts de parcelle doublées pour les zones publiées en double (Les Mureaux, Saint-Cyr-l'École, Semur-en-Auxois, Villacoublay)
- Dans la copie, LFXU (4 zones), LFPZ (A, B, C), LFGQ (C) et LFPV ont chacune 2 entités par zone, à géométrie identique (LFXU 407 = 411, LFGQ 687 = 688, vérifié octet pour octet). `dedoublonner` (`bruit-aerien.ts:194-205`) **additionne** les parts et les surfaces.
- Reproduction (`e2.mts`) : une parcelle couverte à 30 % (aire Clipper) donne « La parcelle est pour **60 %** en zone C ». Une part réelle de 70 % est plafonnée à 1, et la part disparaît du texte.
- Ce qu'on attendait : dédoublonner les entités identiques à l'extraction, ou faire l'union géométrique plutôt qu'une somme. Les effets en production sont masqués par B1 tant que la parcelle n'est pas lue.

### I2. « aussi » contradictoire, et PGS passé sous silence, quand le PGS déborde du PEB (Orly, Toulouse)
- Le commentaire de `bruit-aerien-texte.ts:126` affirme que les zones du PGS sont incluses dans l'emprise des PEB. C'est faux. Sur des points tirés dans le PGS d'Orly (`e6.mts`), 209 sur 546 sont hors des zones du PEB, et 3 n'ont aucune zone de PEB à 5 km.
- Reproductions :
  - 2.36207,48.72437. Autour : « Ce secteur est hors des zones du PEB… zone B à 60 m » puis « Le secteur est **aussi** en zone III du PGS ». Logement : titre « Hors des zones du PEB », puis « Le logement est **aussi** en zone III ».
  - 2.58864,48.75975 (PEB `absent`) : Autour ne dit rien, et la zone III du PGS est perdue. Logement : « Le logement est aussi en zone III » sans rien avant.
  - Toulouse 1.36979,43.59874 : même chose.
- Par ailleurs, `textePgsLogement` dit « Le logement est… » même au grain `point` ou à la portée `non_precisee` : c'est une précision affirmée que l'on n'a pas (cf. B1).

### I3. « la zones A et C » : faute d'accord quand plusieurs zones sont citées
- `zones()` rend « zones A et C », et les gabarits le précèdent de « la » : `texte.ts:147`, `:150`, `:253`, `:254`, `:258`, `:259`.
- Reproduction (`e5.mts`, Albertville 6.328593,45.628370) : « à moins de 50 m de la zones A et C » et « La zones A et C passe à moins de 50 m ». Même défaut à CDG : « de la zones C et D ».

### I4. Le contrôle d'exhaustivité du script peut laisser passer une copie tronquée
- `build-bruit-aerien.mjs:170-174` : on vérifie seulement que chaque aérodrome **présent** dans le PGS a ses trois zones. Un KML qui n'en livrerait que 5 sur 11 passe. La liste des 11 n'est vérifiée que par le test, qui relit le `meta` que le script a lui-même écrit.
- Pour le PEB, on vérifie seulement « au moins une zone par aérodrome à arrêté ». Rien ne vérifie le nombre de zones par aérodrome, ni l'écart avec la copie précédente.
- Un `<Placemark>` sans `id="…"` exactement à cette forme est ignoré en silence par la regex (`:74`) : le nombre de `<Placemark` n'est jamais comparé au nombre d'entités lues (hypothèse sur la forme réelle du KML : il n'a pas été relu).
- L'écriture n'est pas atomique (`:206`). Ce dernier point est mineur.

## MINEUR

- M1. Préfiltre en latitude (`candidates`, `:209`) : 111 000 m par degré, alors qu'un degré de latitude mesure environ 110 600 m près de l'équateur. En Guyane (4,8° N), une zone située à 4 981-5 000 m plein nord ou plein sud est ratée : on lit `absent` au lieu de `hors_zone`. Calcul vérifié, pas de cas réel reproduit.
- M2. Au grain parcelle, si la parcelle touche une zone sur moins de 25 m², on obtient « hors zone ». La distance se mesure alors depuis le point, ce qui peut afficher « la zone C est à 0 m » ou « à 10 m » (hypothèse construite d'après le code, non exécutée).
- M3. Actualisation : contrairement à `urbanisme_parcelle` (FUT-81, troisième revue), une lecture parcelle qui retombe au grain point est acceptée sans être signalée comme une perte. Une panne de la copie sur un rapport antérieur à FUT-146 refuse l'actualisation. C'est cohérent avec FUT-80 (`batiment`), mais pas avec FUT-81. Il faut en décider.
- M4. `server/bruit-aerien-jeu.ts:17` : un JSON qui se lit mais n'a pas la bonne forme est mémorisé à `null` sans nouvel essai, alors que le commentaire dit « la prochaine lecture retente ».
- M5. Assertion vide (`test.ts`, cas « à 80 m ») : `if (a80.peb.enLimite.length === 0)` n'affirme rien dans l'autre branche. L'oracle (pair-impair en degrés) ressemble beaucoup à `classer`, il n'est donc qu'à moitié indépendant. Il ne couvre ni les recouvrements, ni le halo d'incertitude, ni le `geocodage: null`.
- M6. Doc 01-sources : « coordonnées à 5 décimales » ; le script dit 6. « Licence Ouverte Etalab » est affiché comme un fait, alors que c'est la licence par défaut (aucune n'est déclarée).
- M7. Le certificat d'urbanisme « signale la zone de bruit et ses règles » : L112-13 dit seulement qu'il signale la zone. « et ses règles » est une légère extrapolation.

## Vérifié sans défaut
- Contact exact, chevauchement de 1 cm, liseré et recouvrement franc à la parcelle : tests relus, logique conforme à FUT-81.
- Panne de la copie : rend `indisponible`, l'écran ne dit jamais « hors zone ». `sourcesAbsentes` ne réagit qu'à `indisponible`. Un rapport antérieur n'affiche rien.
- Traces Vercel : `bruit-aerien.json` est inclus pour `/api/georisques-logement`, `/api/logement-autour` et `/rapport/autour`, les seuls appelants (vérifié par grep). Aucun fichier du comparateur, de `calme_sonore` ou des scores n'est touché.
- Performance : 11 940 lectures au point en 7,2 s, 104 ms au pire.
- Aucun mot interdit (dB, constructible, droit à l'aide, « pas de bruit ») dans les textes produits par l'échantillonnage.

## Hypothèses non vérifiées
- LFDX et LFIV ont des zones mais aucun arrêté dans la liste du WFS. Ce sont peut-être des plans abrogés ; ils sont affichés comme valides.
- Les liens d'arrêté en `http://` n'ont pas été testés.
- `npm test`, `tsc` et le lint n'ont pas été lancés.

## Verdict : NO GO
B1 vide la promesse du module Logement (lecture à la parcelle) et ajoute une réserve fausse à chaque rapport. B2 produit des phrases fausses ou absurdes sur une dizaine de km² très peuplés (Le Bourget, Dugny, Le Blanc-Mesnil, Gonesse). B3 met Dijon et le plateau de Vélizy-Versailles en « zone non établie, tracé non mesurable près de l'adresse ». Les trois se corrigent localement : faire voyager le type BAN, ou le relire depuis le rapport et la BAN ; écrire un gabarit au grain point et nommer l'aérodrome de chaque zone ; borner l'incertitude à une distance réelle et dédoublonner à l'extraction. Il faut ajouter les tests correspondants avant de fusionner.
