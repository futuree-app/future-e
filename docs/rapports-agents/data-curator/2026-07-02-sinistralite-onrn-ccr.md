# Évaluation de source : indicateurs de sinistralité ONRN/CCR (Géorisques)

> Data Curator, 2026-07-02 (après-midi). Suite directe du refus des balances comptables 6161
> du matin, dont la condition de réouverture était : « CCR ou France Assureurs publient une
> donnée communale côté ménages ». Cette famille de données existe : elle est instruite ici.
> Candidat : signal « sinistralité assurantielle / assurabilité » pour le module Logement
> (vulnérabilité), éventuellement le rapport Territoire. Nourrit le pari #9 (`paris.md`).

## Source

- **Nom** : indicateurs de sinistralité de l'ONRN (Observatoire National des Risques
  Naturels), partenariat **État (DGPR) × CCR × MRN**, publiés sur Géorisques.
- **URL** : https://www.georisques.gouv.fr/observatoire-national-des-risques-naturels ;
  fichiers à `files.georisques.fr/onrn/2025/` (millésime 2025, fiches v10 nov. 2024,
  période 1995-2021 pour les coûts/S/P, 1982/1988-2024 pour les reconnaissances ; mise à
  jour ~annuelle).
- **Contenu, par péril (inondation, sécheresse/RGA, mouvement de terrain, séisme), à la
  COMMUNE** : nombre de reconnaissances CatNat ; **coût moyen** des sinistres ;
  **coût cumulé** (+ variante par habitant et par TRI pour l'inondation) ; **fréquence**
  (sinistres / risques assurés) ; **ratio S/P** (sinistres / primes CatNat acquises
  extrapolées au marché). Tempête-grêle-neige : départemental seulement (MRN, 1987-2023) —
  hors périmètre, mauvaise échelle.
- **Ce que j'ai réellement inspecté (2026-07-02)** : `ONRN_SsurP_INON_9521.xlsx` et
  `ONRN_CoutMoyen_INON_9521.xlsx` (téléchargés, parsés openpyxl), fiches PDF
  `ONRN_SsurP_Sech_9521.pdf`, `ONRN_CoutMoyen_Inon_9521.pdf`, `ONRN_Frequence_Sech_9521.pdf`,
  `ONRN_CoutCumu_Inon_Hab_9521.pdf` (texte intégral extrait), la page ONRN et les mentions
  légales Géorisques. Plus le repérage amont (sécheresse) que j'ai recoupé.

### Structure vérifiée des xlsx

3 feuilles : « Lisez moi » (méthodo courte), la donnée (Code INSEE + nom + **classe**
catégorielle), et **« Représentativité »** : la part de marché des sinistres présents dans la
base CCR, PAR COMMUNE, en classes (`> 50%`, `Entre 30 et 50%`, `Entre 15 et 30%`, `< 15%`,
`Pas de sinistre répertorié à CCR`). Cette 3e feuille est un actif d'honnêteté : elle permet
de **gater le récit sur la robustesse locale**, commune par commune.

Distribution inondation S/P (vérifiée) : 17 506 « Pas de sinistre ou de prime répertoriés »,
8 183 « 0-10 % », 5 486 « 10-50 % », 1 677 « 50-100 % », 984 « 100-200 % », 1 003 « >200 % ».
Coût moyen inondation : 18 086 sans sinistre, puis classes 0-2,5 k€ (4 976) → >20 k€ (1 103).

## Pièges techniques : instruits, plusieurs se dissolvent

1. **« 39 776 lignes > 35 000 communes » : faux problème.** Vérifié : 4 937 lignes sont
   **entièrement vides** (code INSEE compris) — du padding de fin de fichier, pas des
   communes sans donnée. Restent **34 839 communes réelles**, zéro doublon, Corse 2A/2B
   présente, **pas de DOM** (préfixe 97 absent), **Paris = 1 ligne** (pas d'arrondissements,
   notre piège PLM habituel). Le référentiel est l'« INSEE 2021 » (fiche coût/hab) : un petit
   mapping fusions 2021→courant reste nécessaire, pas une explosion de codes historiques.
2. **Classes catégorielles, pas de valeurs.** Assumé par CCR : « l'extrapolation…ajoute une
   incertitude à cet indicateur, d'où la fourniture sous forme de classes ». On stocke et on
   restitue la classe VERBATIM, on n'invente jamais un chiffre au milieu de la classe.
3. **« À chaque mise à jour, chaque commune peut changer de classe »** (toutes les fiches).
   Conséquence dure pour le récit : **interdiction de narrer un mouvement entre millésimes**
   (« la sinistralité s'aggrave ici ») ; le changement de classe peut être un artefact
   d'extrapolation. On raconte un niveau sur 1995-2021, jamais une tendance ONRN.
4. **« Pas de sinistre ou de prime répertoriés à CCR » ≠ « pas de sinistre survenu ».**
   L'échantillon couvre ~50 % du marché en sinistres. Formulation obligatoire : « répertorié »,
   jamais « aucun sinistre ». Et la fiche le dit : **un S/P faible n'exclut pas une forte
   exposition** (faible historique 27 ans vs périodes de retour longues).
5. **Sécheresse : Outre-Mer non couvert** (et DOM absents des fichiers inondation vérifiés).
   Couverture = métropole, à assumer.

## Problème utilisateur résolu / décision permise

Le manque identifié ce matin reste vrai : entre « la commune a eu 12 arrêtés CatNat »
(GASPAR, qu'on a) et « pourrai-je assurer ma maison ici » (que personne ne publie), il manque
la **gravité en euros et la densité de sinistres côté biens assurés**. C'est exactement ce
que portent coût moyen et fréquence : ils distinguent la commune aux 12 arrêtés sans dégâts
notables de la commune aux 5 arrêtés où les maisons ont réellement fissuré/été inondées et
coûté cher. Pour un ménage qui achète (module Logement, vulnérabilité, RGA en tête), c'est
une information décisionnelle : elle qualifie la matérialité du risque, pas seulement son
existence administrative. Décision permise : pondérer un achat, provisionner des travaux,
poser les bonnes questions (fissures, sinistres antérieurs) au vendeur.

## La question structurante : « l'échelle pertinente est l'échelle nationale »

Vérifié : la phrase figure **dans toutes les fiches** (S/P, coût moyen, fréquence, coût
cumulé/hab), ce n'est pas une réserve propre au S/P. Est-ce un désaveu rédhibitoire ? Non,
pour trois raisons tirées des documents du producteur lui-même :

- **Le même producteur publie la donnée à la commune, avec un indicateur de représentativité
  PAR COMMUNE, et l'affiche en cartes communales sur Géorisques.** Les sections « Usage » des
  fiches décrivent explicitement une lecture communale : « l'indicateur donne une indication
  de la gravité des sinistres survenus **sur une commune** entre 1995 et 2021 ». La phrase
  « échelle nationale » se lit comme une discipline d'usage (pas de valeur absolue, pas de
  classement fin, incertitude d'extrapolation), pas comme une interdiction de lecture locale
  que le producteur violerait lui-même à chaque carte.
- **Différence avec le refus ÎCU** : l'iuhi était un score normalisé par département, donc
  **non comparable entre communes** — la valeur était détruite par construction à l'échelle
  où on voulait l'utiliser. Ici les classes sont **nationales et homogènes** (mêmes seuils
  partout) : une commune « >20 k€ de coût moyen » est comparable à une « 0-2,5 k€ ». La
  construction supporte la lecture communale qualitative ; c'est la précision (valeur exacte,
  rang fin) qu'elle ne supporte pas.
- **Cohérent avec la règle 6 de `doctrine/data.md`** (préférer la cohérence à
  l'hyper-précision) et la règle 7 (l'incertitude apparaît dans le produit) : classes larges
  + gate de représentativité + limites nommées = exactement le régime prévu par notre
  doctrine pour ce type de donnée.

MAIS cette lecture impose trois interdits fermes : **jamais au scoring `/ou-vivre`**
(un classement de 34 000 communes est précisément la lecture fine que le producteur
désavoue), **jamais de tendance inter-millésimes**, **jamais de valeur chiffrée inventée**.
Récit qualitatif gaté, ou rien.

## Honnêteté du signal pour un MÉNAGE : soutenable vs interdit

Périmètre réel : « biens assurés hors véhicules » = habitations ET
entreprises/professionnels mélangés (fiche coût moyen : « tous les types de risques assurés,
particuliers et professionnels »). Et le S/P a un défaut de dénominateur : « la prime Cat Nat
n'est pas ventilée par péril » — le S/P sécheresse rapporte les sinistres sécheresse à une
prime qui couvre TOUS les périls.

**Inférences soutenables** (mesuré, passé, marché) :
- « Entre 1995 et 2021, les sinistres indemnisés au titre des catastrophes naturelles
  sécheresse dans cette commune ont été [fréquents / d'un coût moyen élevé], d'après les
  données des assureurs collectées par la CCR (échantillon couvrant ici plus de la moitié du
  marché). »
- « Les biens assurés de cette commune ont peu/beaucoup déclaré de sinistres inondation
  reconnus CatNat sur la période. »

**Inférences interdites** :
- Tout futur individuel : « vous serez refusé/surprimé », « votre maison fissurera ». La
  surprime CatNat est nationale et uniforme (20 % depuis le 01/01/2025) : le S/P communal ne
  prédit PAS le prix de l'assurance du lecteur.
- « Les maisons d'ici… » : le périmètre inclut les entreprises. Dire « les biens assurés ».
- « Aucun sinistre ici » quand la classe dit « pas de sinistre répertorié à CCR ».
- Toute lecture du S/P comme rentabilité locale d'un péril (prime non ventilée) : si le S/P
  entre un jour, c'est en contexte marché (« les indemnisations ont largement dépassé les
  primes CatNat collectées ici »), pas en signal ménage. Coût moyen + fréquence racontent la
  même matérialité SANS le problème de dénominateur : ils suffisent.

## Doublon

Inspecté : `src/lib/georisques.ts` (GASPAR `/gaspar/catnat` : nombre, années et familles
d'arrêtés, déjà au rapport via la bande des années + flags risques), fiches
`inondation_scoring` et `risque_enrichment_eaip` (/memory), inventaire (RGA Géorisques,
PPRN, scores inondation/submersion).

- **Reconnaissances ONRN (Reco_*) = doublon quasi pur de GASPAR/CatNat** qu'on a déjà, en
  moins bien (xlsx statique vs API, familles déjà simplifiées chez nous). À refuser.
- **Coût moyen et fréquence = NON doublonnés.** GASPAR dit « l'État a reconnu N événements » ;
  rien chez nous ne dit ce que ça a coûté ni combien de biens ont déclaré. C'est la dimension
  gravité-en-euros absente de tout l'inventaire risques (GASPAR, PPRN, zonages RGA, DRIAS).
- **Coût cumulé / par habitant / par TRI** : corrélés à la taille et au stock assuré, la
  fiche le dit elle-même (« très fortement liées au nombre de risques assurés »). Redondants
  avec coût moyen × fréquence pour notre usage ; ne pas prendre.
- **S/P** : partiellement redondant avec coût moyen + fréquence pour le récit ménage, et
  porteur du défaut de dénominateur. Ne pas surfacer côté lecteur.

## Type

**Historique / transactionnelle assurantielle, extrapolée.** Sinistres réellement indemnisés
(mesuré) mais extrapolés au marché (modélisé) et livrés en classes. Récit imposé : passé
factuel daté (« sur 1995-2021 »), toujours adossé à la représentativité locale, jamais
prédictif.

## Échelle & granularité

Native : commune (classes nationales homogènes), référentiel INSEE 2021, métropole,
Paris/Lyon/Marseille = 1 ligne. L'affirmation est vraie à l'échelle « la commune, en classes
larges, sur 27 ans, pour l'échantillon CCR extrapolé ». Elle n'est vraie ni à l'adresse, ni
en valeur exacte, ni en tendance. Réponse à la question de contrôle : oui, à condition du
triple interdit (pas de scoring, pas de tendance, pas de chiffre inventé).

## Licence : le point à lever AVANT toute intégration

- Les fichiers et fiches ne portent **aucune mention de licence** (vérifié).
- Les mentions légales de Géorisques disent que la **Licence Ouverte** s'applique aux données
  en téléchargement, MAIS avec la réserve : les données dont l'État ne détient pas la
  propriété intellectuelle exigent l'autorisation du propriétaire. La page ONRN mentionne la
  « propriété intellectuelle des contributeurs ». Or le producteur des indicateurs est la
  **CCR** (réassureur public à statut de société anonyme) via un partenariat, pas l'État seul.
- Situation : **présomption favorable** (diffusion volontaire sur le portail open data de
  l'État, dispositif public officiel), mais pas de certitude écrite. Pour un produit
  commercial, je recommande **une confirmation écrite au contact ONRN** (les fiches ont une
  section contact) avant toute mise en production, et une attribution visible
  « ONRN (État / CCR / Mission Risques Naturels), via Géorisques ».
- À ne pas confondre avec l'interdit Callendar : l'ONRN est un observatoire public officiel,
  l'attribution est autorisée et même souhaitable. CCR apparaît ici comme membre d'un
  dispositif public, pas comme prestataire privé caché.

## Couverture, maintenance, criticité

- **Couverture** : 34 839 communes métropolitaines (vérifiée sur l'inondation), Corse
  incluse, DOM exclus (à assumer dans le récit), pas d'arrondissements PLM.
- **Maintenance : faible.** Fichiers xlsx statiques, un millésime par an, pas d'API tierce à
  runtime. Coûts réels : parsing xlsx (padding à purger), mapping INSEE 2021→courant, purge
  du récit de toute mémoire inter-millésimes. Si la source disparaissait demain : futur•e
  perdrait la gravité-en-euros du passé assurantiel ; le socle (GASPAR, PPRN, RGA, DRIAS)
  resterait debout. Famille qui se corrobore, conforme à la doctrine.
- **Criticité** : enrichissement (jamais fondatrice).

## Verdict : DIFFÉRER (admissible sur le principe, pas d'intégration maintenant)

Détail par indicateur :
- **Coût moyen + fréquence (sécheresse/RGA et inondation)** : ADMISSIBLES, ce sont les deux
  seuls à retenir le jour venu. Surface cible : **module Logement, chantier vulnérabilité**,
  en récit qualitatif gaté (drawer), classes verbatim, gate de représentativité (feuille 3 :
  ne raconter que si représentativité ≥ « Entre 30 et 50% », sinon silence), attribution
  ONRN visible, limites nommées (période, échantillon, biens assurés incluant les
  professionnels). Éventuel écho Territoire (drawer risques) à décider plus tard, pas
  d'office. **Jamais au scoring `/ou-vivre`.**
- **Reconnaissances (Reco_*)** : REFUSER, doublon de GASPAR/CatNat en place.
- **S/P** : NE PAS SURFACER côté lecteur (dénominateur non ventilé par péril, inférence
  assurantielle individuelle indéfendable) ; au mieux un matériau interne/éditorial national.
- **Coût cumulé / par habitant / par TRI, tempête départementale** : REFUSER (redondance
  taille-dépendante, mauvaise échelle).

Pourquoi DIFFÉRER et pas INTÉGRER : (1) le **pari #9 est non testé** — « la pression
assurantielle fait payer » n'a aucune observation ; intégrer maintenant, c'est la donnée qui
précède la preuve du besoin, l'exact anti-pattern de la phrase-mère. (2) Le **module Logement
n'est pas cadré** jusqu'à la vulnérabilité : pas de surface d'accueil honnête aujourd'hui.
(3) La **licence n'est pas confirmée par écrit**. Aucun de ces trois verrous n'est technique ;
le jour où ils sautent, l'intégration est un petit chantier (xlsx statiques, doctrine d'usage
déjà écrite ici).

## Victoire méthodologique (prête à graver dans inventaire-sources.md)

| Source | Décision | Pourquoi | Gain | Référence |
|---|---|---|---|---|
| **Sinistralité ONRN/CCR** (Géorisques, millésime 2025, 1995-2021) | différée, périmètre tranché | seule paire admise = **coût moyen + fréquence** (sécheresse, inondation) en récit gaté par la représentativité communale, module Logement/vulnérabilité ; **Reco = doublon GASPAR refusé ; S/P non surfacé** (prime non ventilée par péril) ; « échelle nationale » de CCR lue comme discipline (pas de scoring, pas de tendance inter-millésimes, classes verbatim), pas comme veto ; les « 39 776 lignes » = 34 839 communes + padding vide (vérifié) | évite un signal « assurabilité » prédictif indéfendable et un 5e doublon CatNat ; doctrine d'usage prête le jour où le pari #9 (pression assurantielle) donne un signal et où Logement atteint la vulnérabilité ; licence à confirmer par écrit (ONRN) avant production | `docs/rapports-agents/data-curator/2026-07-02-sinistralite-onrn-ccr.md` |

## Cohérence (tensions posées à l'humain, je ne tranche pas)

1. **Producteur vs produit** : j'ai lu « l'échelle pertinente est l'échelle nationale » comme
   une discipline d'usage, pas un veto, parce que le producteur publie lui-même des cartes
   communales avec représentativité par commune. C'est une interprétation défendable mais
   c'est une interprétation : si le porteur juge qu'afficher une classe communale contre la
   phrase du producteur fragilise la promesse d'honnêteté de futur•e, le refus pur est
   cohérent aussi. Le choix lui revient.
2. **Pari #9** : mon DIFFÉRER lie l'intégration à un signal du pari (questions assurance
   spontanées) OU au cadrage Logement/vulnérabilité. Si le porteur veut au contraire utiliser
   cette donnée pour TESTER le pari (surfacer pour voir si ça mord), c'est un choix
   business/produit légitime mais inverse du mien : à arbitrer avec Business/Product.
3. **Le sujet « assurabilité » reste un gap ouvert du module Logement** (déjà acté ce matin) :
   cette source le nourrit partiellement (le passé indemnisé), elle ne le clôt pas (aucune
   donnée publique ne dit le refus/la franchise futurs d'un ménage).

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)

1. Remplacer le paragraphe « Sinistralité assurantielle ONRN/CCR » (piste du repérage) par un
   paragraphe statuant : **différée, périmètre tranché** (coût moyen + fréquence sécheresse/
   inondation seulement, récit gaté représentativité, module Logement/vulnérabilité ; Reco
   refusé doublon GASPAR ; S/P non surfacé ; ni scoring ni tendance inter-millésimes ;
   34 839 communes métropole, référentiel INSEE 2021, Paris sans arrondissements ; licence
   présumée LO via Géorisques, confirmation écrite ONRN requise avant production).
2. Ajouter la ligne de victoire méthodologique ci-dessus.
3. Ne PAS créer de ligne d'inventaire actif (rien n'est intégré).
4. `paris.md`, pari #9 : corriger « aucun chantier data à financer » en « chantier data
   instruit et prêt (ONRN coût moyen + fréquence), gelé jusqu'au premier signal ».

## Version minimale

Le jour où les verrous sautent, la plus petite incarnation qui capture ~90 % de la valeur :
**une seule phrase gatée dans le drawer sécheresse/RGA du module Logement**, construite sur
deux classes verbatim (coût moyen + fréquence sécheresse), affichée uniquement si la
représentativité communale est ≥ « Entre 30 et 50% », avec l'attribution ONRN et la période
1995-2021 nommées. Pas de carte, pas de S/P, pas d'inondation dans un premier temps (déjà
racontée par GASPAR + scores), pas de scoring. Aujourd'hui, la version minimale est encore
plus petite : graver la doctrine d'usage dans l'inventaire et ne rien coder.

## Quand rouvrir ce sujet ?

- **Pari #9 donne un signal** : des interlocuteurs ou des questions AskFuture évoquent
  spontanément l'assurance (prime, refus, franchise) dans une décision → intégrer la paire
  coût moyen + fréquence selon la doctrine ci-dessus.
- **Le cadrage du module Logement atteint la vulnérabilité** : même déclencheur, même geste.
- **Réponse licence ONRN** : si la confirmation écrite est refusée ou assortie de conditions
  incompatibles → refus définitif, tracer.
- **La surprime CatNat devient modulée localement** (débats post-Langreney) : le lien
  sinistralité locale → prix ménage deviendrait réel ; ré-instruire le S/P lui-même.
- **CCR publie des valeurs (pas des classes) ou une ventilation habitation/professionnel** :
  le périmètre admissible s'élargirait ; ré-évaluer.
- **Millésime 2026** : vérifier la stabilité des classes sur un échantillon avant de
  reconduire tout récit (le producteur prévient que les classes bougent).

Avis daté du 2026-07-02, sur le millésime ONRN 2025 (fiches v10, période 1995-2021),
fichiers inondation vérifiés ligne à ligne, sécheresse recoupée du repérage du même jour.
