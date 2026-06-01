# Logement, signal territorial — conception (avant toute implémentation)

Chantier déclenché par une question qui revient dès qu'on montre le produit :
« est-ce que je peux raisonnablement me loger ici ? ». On fige d'abord le cadre,
les sources et les choix de conception. **Aucune décision d'implémentation ici,
aucun score, aucune formule, aucune pondération, aucun pipeline technique** : le
porteur veut d'abord l'inventaire des données disponibles et les arbitrages.

Date : 2026-06-01. Document jumeau, dans l'esprit, de
[PRESSION_CLIMATIQUE_ECONOMIE.md](PRESSION_CLIMATIQUE_ECONOMIE.md) et du lot
viabilité (bassin d'emploi) : rigueur, sources, honnêteté sur les trous.

## Objectif produit, et ce qu'on s'interdit pour l'instant

Répondre à : **« est-ce que je peux raisonnablement me loger ici ? »**, comme un
**signal territorial**, pas comme une capacité d'achat personnalisée.

Hors champ V1 (assumé, voir V2) : capacité d'achat du foyer, crédit, simulation
d'emprunt, budget personnel, mensualités. On ne demande pas le revenu de
l'utilisateur, on ne simule rien. On caractérise le **territoire**.

## Doctrine tranchée (2026-06-01)

Validée par le porteur **avant toute acquisition ou implémentation**. Décision
fondatrice : **le logement est un futur MODULE, pas un futur critère de classement.**

Séparation produit jugée saine :
- le **comparateur** répond à « **où vivre ?** » ;
- le **module logement** répond à « **puis-je réellement m'y installer ?** ».

Arbitrages gravés :
- **Logement non scoré, aucun impact sur le tri des communes.** Un score logement
  universel reviendrait à décréter qu'un territoire moins cher est un meilleur
  territoire : ce n'est pas la mission du comparateur. Il pénaliserait la
  désirabilité (un prix élevé signale souvent une demande, des aménités),
  combattrait mécaniquement les autres signaux (emploi, services, climat recherché)
  et rouvrirait par la bande le biais social du revenu.
- **Achat et location séparés**, jamais fusionnés. Achat → CEREMA DV3F ; location →
  Carte des loyers ANIL.
- **Niveau de prix = information narrative** (positionnement relatif au gate, chiffre
  brut réservé au rapport).
- **Accessibilité CEREMA hors classement.** Elle repose sur le revenu médian local,
  délibérément exclu du moteur pour éviter un biais social implicite. Sa place :
  rapport, AskFuture, module logement. Jamais le tri.
- **Tension locative = note complémentaire** (« le marché locatif apparaît tendu /
  relativement détendu »), pas un critère, pas un score.
- **Module logement à trois couches** : niveau de prix, accessibilité, tension. Le
  comparateur ne reçoit que **deux notes narratives** (prix relatif, tension), statut
  identique à la pression climatique sur l'économie. Le reste vit dans le module et
  le rapport.

**Porte V2 explicite (notée, pas ouverte)** : **abordabilité comme préférence
opt-in**, pesée seulement si l'utilisateur la formule (« abordable », « budget
serré »), dans la doctrine maison « on ne score que ce qui est formulé ». Décision
distincte, à n'envisager qu'après épreuve du narratif. Risque connu : « abordable »
est un faux ami (abordable pour qui ? pas cher vs bon rapport vs accessible à mon
revenu) à trancher avant tout score, sinon le biais revient par la fenêtre.
Aujourd'hui : **aucun signal économique implicite réintroduit dans le moteur.**

Répartition des trois couches :

| Couche | Comparateur (« où vivre ? ») | Module logement / rapport / AskFuture (« puis-je m'y installer ? ») |
|---|---|---|
| **Niveau de prix** (achat + location) | note narrative qualitative (positionnement relatif) | chiffres €/m², détail maison / appartement |
| **Accessibilité** (CEREMA) | **absente** (biais revenu) | cœur du module |
| **Tension locative** | note légère (tendu / détendu) | détail (zonage tendu, vacance) |

## Principes directeurs (repris du porteur)

1. **Signal compréhensible.** Pas de score immobilier abstrait. Chaque chiffre
   doit dire précisément ce qu'il mesure (un prix de vente au m², un loyer
   d'annonce au m²), jamais un index opaque.
2. **Sources publiques et défendables.** Officielles ou de référence (DGFiP,
   CEREMA, Ministère du Logement / ANIL, INSEE). Aucun scraping, aucune donnée
   privée non sourçable (les portails d'annonces ne sont mobilisés que via les
   jeux publics qui les agrègent légalement).
3. **Achat et location séparés.** Deux réalités, deux signaux, jamais fusionnés
   en un indicateur unique. Acheter et louer ne répondent pas à la même question
   ni au même public.
4. **Réutilisable ailleurs.** La donnée préparée doit servir au comparateur, au
   rapport futur•e, à AskFuture et aux futurs modules logement. Donc : préparée
   en amont (script statique, champ d'index), maille cohérente, qualitatif scellé
   pour le firewall comme pour l'emploi.
5. **Héritage territorial cohérent.** Comme l'emploi a hérité de la zone d'emploi,
   le logement doit choisir et justifier sa maille (commune / EPCI / aire
   d'attraction / IRIS), avec gestion explicite des communes à faible volume.

---

## 1. Quelles sources existent réellement aujourd'hui ?

### Achat (prix de vente)

**A. DVF — Demandes de Valeurs Foncières (données brutes).**
- **Producteur** : DGFiP, diffusion Etalab (data.gouv.fr, cadastre.data.gouv.fr).
- **Maille** : la mutation (transaction) géolocalisée à la parcelle ; agrégeable
  à n'importe quelle échelle (commune, section, EPCI…) par soi-même.
- **Fréquence** : mise à jour **semestrielle** (avril et octobre). Avril 2026 =
  données jusqu'au 2ᵉ semestre 2025. Historique 5 ans glissants.
- **Couverture** : France métropolitaine + DROM, **sauf Mayotte et l'Alsace-Moselle
  (57 Moselle, 67 Bas-Rhin, 68 Haut-Rhin)**, qui relèvent du livre foncier et non
  du cadastre DGFiP. Trou de couverture majeur pour l'achat (Strasbourg, Mulhouse,
  Colmar, Metz absents).
- **Qualité** : exhaustive sur les ventes soumises à publicité foncière, donnée
  officielle. **Mais brute** : il faut filtrer (mutations multiples, ventes de
  dépendances/garages/terrains, prix aberrants, biens démembrés), distinguer
  maison / appartement, et calculer soi-même les surfaces et les prix au m².
- **Limites** : bruit sur les petites communes (peu de ventes → médiane instable),
  pas de prix « affiché » mais réalisé (c'est une qualité), aucun enrichissement.

**B. CEREMA DV3F — indicateurs de marché (données enrichies, agrégées). [recommandé]**
- **Producteur** : CEREMA (établissement public de référence), à partir de DV3F
  (DVF enrichie par croisement fichiers fonciers).
- **Maille** : indicateurs **déjà agrégés** à plusieurs échelles, en téléchargement
  libre : **commune, EPCI, aire d'attraction des villes (zonage INSEE 2020),
  département, région, national**.
- **Indicateurs** : prix (médian au m²), volumes de transactions, **accessibilité
  financière des logements pour les ménages locaux**, taux de rotation des
  propriétaires (activité du marché).
- **Fréquence / version** : version courante intègre **DV3F 2025-1** ; cartographies
  prix sur période glissante (ex. 2020-2022). Pas de cadence stricte affichée.
- **Format** : tableur **xlsx** libre. Une **API Données foncières** existe (flux
  ouverts + flux restreints réservés aux acteurs publics).
- **Couverture** : mêmes exclusions que DVF (57, 67, 68, 976 Mayotte).
- **Qualité** : c'est la **source robuste et défendable**, déjà nettoyée et agrégée
  par un organisme public, avec gestion implicite du volume (indicateurs non
  produits là où le marché est trop mince). Évite de refaire le nettoyage DVF.
- **Limites** : granularité commune absente ou peu fiable sur les très petits
  marchés ; latence (données arrêtées au semestre publié) ; exclusions Alsace-Moselle.

**C. Indices Notaires (Notaires de France / INSEE).**
- **Producteur** : Notaires (bases BIEN en Île-de-France, PERVAL ailleurs), indice
  Notaires-INSEE.
- **Maille** : national, régional, grandes agglomérations. **Pas la commune fine.**
- **Usage** : référence pour les tendances et l'évolution, **pas pour un signal
  communal**. Certaines séries sont publiques (indice), les bases détaillées non.
- **Verdict** : utile au rapport pour le contexte/tendance, inutilisable comme
  signal communal MVP.

### Location (loyers)

**D. Carte des loyers — indicateurs de loyers d'annonce par commune. [recommandé]**
- **Producteur** : Ministère de la Transition écologique, mise en œuvre **ANIL**,
  méthodologie avec une équipe de recherche (ex-Agrosup Dijon / INRAE), à partir
  des annonces **leboncoin + Groupe SeLoger** (partenariat public, agrégation
  légale ; nous ne scrapons rien).
- **Maille** : **commune**, France entière **hors Mayotte**, géographie au 1ᵉʳ
  janvier de l'année.
- **Variables** : **loyer en €/m² charges comprises**, distinct **appartement**
  (tous types, T1-T2, T3+) et **maison**, sur des caractéristiques de référence
  standardisées (ex. 52 m² appartement, 92 m² maison).
- **Fréquence** : **annuelle**, millésimes 2022, 2023, 2024, **2025** (réf. annonces
  T3 2025, base 2019-2025).
- **Qualité** : couverture nationale, indicateurs de fiabilité fournis par commune
  (**R²**, **nombre d'observations**, **intervalle de prédiction**) ; pour les
  communes sans annonce, **imputation par les communes voisines similaires**.
- **Limites** : **loyers d'ANNONCE, pas les baux réellement signés** (tendance à
  surestimer et à refléter le marché à la relocation, pas le stock) ; **non
  meublé** ; prudence requise si R² < 0,5, observations < 30 ou intervalle large.

**E. Observatoires Locaux des Loyers (OLL).**
- **Producteur** : réseau OLL agréé (ANIL/ministère).
- **Maille** : agglomérations, loyers **observés** (baux réels, plus précis).
- **Couverture** : **partielle** (~ quelques dizaines d'agglomérations), pas
  national. Inutilisable comme signal national homogène, utile en contrepoint local.

**F. Zonage tendu / encadrement des loyers (réglementaire).**
- **Producteur** : État (zonage A/Abis/B1/B2/C, liste des communes en « zone
  tendue », communes en encadrement des loyers).
- **Maille** : commune (binaire/catégoriel).
- **Usage** : marqueur **officiel de tension** du marché locatif, et loyers de
  référence là où l'encadrement s'applique (Paris, Lille, Lyon, Montpellier,
  Bordeaux, etc.). Catégoriel, pas un prix.

### Revenu / contexte (pour situer, pas pour scorer)

**G. INSEE Filosofi — revenu médian par commune.**
- Sert à rapporter prix/loyers au niveau de vie local (c'est ce que fait
  l'accessibilité CEREMA). **Point de vigilance produit majeur, voir §4.**

---

## 2. Quelle donnée est la plus robuste ?

- **Achat → CEREMA DV3F (indicateurs agrégés).** Déjà nettoyé, agrégé multi-maille
  par un organisme public, avec un indicateur d'accessibilité prêt à l'emploi.
  DVF brut reste la source de repli/contrôle, mais refaire le nettoyage nous-mêmes
  n'apporte rien que le CEREMA ne fasse déjà mieux et de façon plus défendable.
- **Location → Carte des loyers (ANIL).** Seule source **communale, nationale,
  homogène et publique** des loyers. Ses indicateurs de fiabilité permettent de
  masquer ou nuancer honnêtement les communes peu fiables. Les OLL servent de
  contrepoint qualitatif local, pas de socle national.

Asymétrie de fiabilité à retenir : **la location couvre toute la France (hors
Mayotte) ; l'achat a un trou en Alsace-Moselle.** À assumer dans l'UI (on peut
avoir un loyer sans prix d'achat sur Strasbourg/Mulhouse/Colmar/Metz).

---

## 3. Quelle maille retenir ?

| Maille | Avantages | Inconvénients |
|---|---|---|
| **Commune** | la plus parlante pour l'utilisateur (« ici »), cohérente avec l'index | bruyante pour l'achat sur petits marchés (peu de ventes) ; la Carte des loyers l'impute déjà pour le locatif |
| **EPCI (interco)** | volume suffisant, maille administrative stable | parfois hétérogène (une interco mêle centre cher et périphérie) |
| **Aire d'attraction des villes (AAV 2020)** | **maille de marché** réelle (bassin de vie/marché), celle du CEREMA pour l'accessibilité | un peu abstraite à nommer pour l'utilisateur |
| **IRIS** | très fin (intra-communal) | pas couvert par ces sources agrégées, secret statistique fréquent, sur-promesse de précision |

**Recommandation** : **commune comme maille d'affichage, marché comme maille de
calcul**, avec héritage explicite — exactement la logique de l'emploi (zone
d'emploi héritée par commune).
- **Achat** : viser la **commune** quand le CEREMA fournit un indicateur fiable
  (volume suffisant) ; sinon **hériter de l'EPCI, puis de l'aire d'attraction**.
  L'accessibilité CEREMA est d'ailleurs nativement pensée « aire locale de marché ».
- **Location** : **commune** directement (la Carte des loyers gère elle-même
  l'imputation des petites communes), en **portant le drapeau de fiabilité**
  (R², n) pour nuancer ou masquer.
- **IRIS écarté en V1** : ni couvert ni défendable à cette échelle ici.

Toujours afficher **la maille réellement utilisée** quand on a hérité (« à l'échelle
du bassin de marché »), même honnêteté que les `convention` des zones.

---

## 4. Quels signaux produit peut-on construire ? (liste argumentée, sans formule)

Décrits comme **intentions de signal**, pas comme calculs (pas de pondération ici).

1. **Prix d'achat au m² (maison / appartement, séparés).** Le plus simple et le
   plus compréhensible. Source CEREMA. Lecture relative à la France (situer la
   commune), jamais une promesse de prix individuel. **Robuste.**
2. **Loyer au m² charges comprises (appartement / maison).** Symétrique, source
   Carte des loyers. **Robuste**, avec drapeau de fiabilité.
3. **Accessibilité financière (territoriale).** L'indicateur CEREMA : rapport entre
   les prix locaux et la capacité des **ménages locaux** (revenu médian du
   territoire), pas de l'utilisateur. Répond le plus directement à « peut-on
   raisonnablement se loger ici ». **MAIS point de vigilance** : il s'appuie sur le
   revenu médian local, or le comparateur a **délibérément exclu le revenu médian
   du score** (anti-biais social, cf. journal). Donc l'accessibilité a sa place
   dans le **rapport / narratif / AskFuture**, et son entrée éventuelle dans un
   score du comparateur est un **arbitrage produit à part entière** (voir §risques).
4. **Tension locative.** Pas de prix mais une réalité (trouver à louer). Proxies
   publics : **zonage tendu / encadrement** (catégoriel, officiel) et **taux de
   logements vacants** (INSEE). Signal plus faible et composite : à traiter comme
   **narratif** d'abord, jamais comme un prix. **Moins robuste**, honnête à dire.
5. **Niveau de prix relatif (positionnement national).** Percentile du prix et du
   loyer sur la France, dans l'esprit des autres signaux de l'index (situe sans
   donner un chiffre brut au gate). Dérivé des signaux 1-2.
6. **Écart achat / location (signal de structure de marché), à débattre.** Là où
   acheter est cher mais louer raisonnable (ou l'inverse) : éclaire le choix
   acheter/louer. Intéressant mais **interprétatif** ; candidat V2, pas MVP.

Ce qu'on **n'a pas** comme signal robuste : qualité/état du parc, DPE / passoires
thermiques à la maille fine, délai de vente, dynamique de prix projetée. Trous
assumés.

---

## 5. MVP réaliste (faisable immédiatement)

Sans écrire de code, le périmètre tenable tout de suite :

- **Deux champs d'index préparés par script statique** (discipline emploi / altitude
  / relief), committés, sans clé ni appel runtime :
  - **prix d'achat médian au m²** (maison / appartement) depuis le CEREMA, maille
    commune avec héritage EPCI/AAV documenté ;
  - **loyer médian au m² charges comprises** (appartement / maison) depuis la Carte
    des loyers, maille commune, avec **drapeau de fiabilité** (R², n).
- **Signaux d'affichage** : prix d'achat et loyer, **séparés**, en lecture relative
  (positionnement national) + le chiffre brut réservé au **rapport** (firewall :
  le comparateur et AskFuture ne reçoivent que du qualitatif, comme l'emploi).
- **Couverture honnête** : Alsace-Moselle sans prix d'achat (affiché comme tel),
  communes peu fiables en loyer nuancées ou masquées via le drapeau.
- **Réutilisable** d'emblée par le rapport et AskFuture (champ d'index partagé).

L'accessibilité CEREMA peut être **portée en MVP côté narratif/rapport** (pas dans
le score), parce qu'elle répond le mieux à la question produit tout en restant
territoriale.

## 6. Ce qui relève clairement d'une V2

- **Capacité d'achat personnalisée** (revenu du foyer, apport, mensualités).
- **Simulation d'emprunt / crédit** (taux, durée, assurance).
- **Budget logement du foyer** et reste à vivre.
- **Tension locative fine** (délais, rotation, demande/offre observée par OLL).
- **Dynamique et projection de prix** (tendance, pas seulement niveau).
- **Qualité du parc** (DPE, passoires, ancienneté, vacance structurelle).
- **Écart achat/location** comme signal scoré.
- **Signal logement scoré** dans le classement, seulement après épreuve réelle du
  narratif (même prudence que la pression climatique : narratif d'abord).

---

## Recommandations explicites

1. **Deux signaux séparés**, achat (CEREMA DV3F) et location (Carte des loyers
   ANIL), jamais fusionnés.
2. **Maille : commune affichée, marché calculé**, héritage EPCI/AAV pour l'achat,
   commune imputée + drapeau de fiabilité pour la location. IRIS écarté.
3. **MVP = deux champs d'index + lecture relative**, chiffre brut au rapport,
   qualitatif scellé pour comparateur/AskFuture (firewall).
4. **Accessibilité CEREMA = narratif/rapport en MVP**, pas dans le score, à cause
   du choix anti-biais social sur le revenu.
5. **Narratif d'abord, score plus tard** (doctrine maison, comme l'emploi et la
   pression climatique).
6. **Honnêteté de couverture** : trou Alsace-Moselle (achat), loyers d'annonce ≠
   baux, fiabilité communale variable. Tout affiché comme convention.

## Risques

- **Loyers d'annonce ≠ loyers réels** : surestiment et reflètent la relocation.
  Risque de sembler plus cher que le vécu. À nommer.
- **Trou Alsace-Moselle sur l'achat** : asymétrie de couverture, à assumer dans
  l'UI sans bricoler un proxy.
- **Accessibilité et biais social** : réintroduire le revenu médian, même
  territorialement, peut heurter la doctrine anti-biais du comparateur. Arbitrage
  réel, pas un détail.
- **Latence / millésime** : prix et loyers sont datés ; ne jamais laisser croire à
  un prix « en direct ».
- **Petits marchés** : médianes instables (achat) ou imputées (location) ; le
  drapeau de fiabilité doit gouverner l'affichage, sinon fausse précision.
- **Confusion signal territorial / capacité personnelle** : l'utilisateur peut lire
  « je peux me loger » comme une promesse personnelle. Le wording devra tenir la
  distinction (territoire, pas foyer).

## Décisions

### Tranchées (2026-06-01, voir Doctrine tranchée)

- **Source achat** : CEREMA DV3F agrégé (pas de retraitement DVF brut maison).
- **Source location** : Carte des loyers ANIL.
- **Maille** : commune affichée, marché calculé ; héritage commune → EPCI → aire
  d'attraction pour l'achat ; commune imputée + drapeau de fiabilité pour la location.
- **Accessibilité CEREMA** : narratif / rapport / module seulement, hors classement.
- **Tension locative** : note narrative dès le MVP, jamais un critère.
- **Statut global** : non scoré, aucun impact sur le tri. Logement = module, pas
  axe de classement.

### Encore ouvertes (détails d'implémentation, à trancher au lancement du chantier)

1. **Affichage au gate** : positionnement relatif seul (cohérent firewall, recommandé)
   ou un chiffre €/m² visible, le détail restant au rapport ?
2. **Couverture Alsace-Moselle (achat)** : masquer proprement le prix d'achat (et le
   dire), ou tenter un complément local hors champ public homogène (livre foncier) ?
   Recommandation : masquer proprement, ne pas bricoler de proxy.
3. **Nom du signal / module** : « accessibilité au logement », « se loger ici »,
   « marché du logement » ? À fixer au lancement, comme « pression climatique sur
   l'économie locale ».
4. **Porte V2 (hors chantier actuel)** : faut-il, plus tard, une préférence
   d'abordabilité opt-in ? Décision distincte, après épreuve du narratif.

---

## Trous de données actés (honnêteté)

- **Achat en Alsace-Moselle** : absent de DVF/DV3F (livre foncier).
- **Loyers réels** : pas de source nationale communale de baux signés (seulement
  annonces ANIL + OLL partiels).
- **Tension fine, délais, qualité du parc, projection** : pas de source robuste
  communale homogène en V1.
- **Capacité personnelle** : hors champ V1 par choix (V2).

Sources : DVF / DGFiP-Etalab (data.gouv.fr, cadastre.data.gouv.fr) ; CEREMA
Datafoncier DV3F (indicateurs de marché, Dynmark, API Données foncières) ; Carte
des loyers (Ministère de la Transition écologique / ANIL, data.gouv.fr) ;
Observatoires Locaux des Loyers ; zonage tendu / encadrement (État) ; INSEE
Filosofi (revenu). État vérifié en juin 2026.
