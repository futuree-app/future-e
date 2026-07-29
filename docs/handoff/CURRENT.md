# Passation — journée du 29/07 : six thèmes deviennent trois échelles, et l'entourage prend son module

**Horodatage** : 2026-07-29 16:46, **complété à 17:40 par la seconde session** (§6, et les ajouts
signés dans Doctrine / La suite / Pièges) · **Branche** : `main` = `473d2fa` (poussé).
**Tree propre**, un seul non suivi à NE JAMAIS committer : `Futur.e Design System.zip`.

**983 tests · tsc 0 · lint global à 20 problèmes (8 erreurs)** — toutes antérieures à cette session
(`useTheme.ts`, `ConclusionRedigee.tsx`, `DossierAvecLogement.tsx`, un `any` dans la landing).

> **Deux sessions ont travaillé en parallèle dans le MÊME working tree aujourd'hui.** Celle-ci a fait
> la bascule des modules ; l'autre a fait Cartofriches, le secteur dans le moteur de décision et le
> radon. Les commits sont entrelacés (`d14e5b4`, `2c79618`, `0115f22` d'un côté ; `f98a002`, `ef17ffc`,
> `b01b8f2`, `473d2fa` de l'autre). Aucun conflit : chaque session n'a stagé que ses propres fichiers,
> nommément. **C'est la seule discipline qui a rendu ça possible — ne pas faire `git add -A` ici.**

---

## 1. LA BASCULE : six modules thématiques → trois échelles (`d14e5b4`)

Le produit annonçait six modules (Territoire, Logement, Métier, Santé, Mobilité, Projets) **dont
quatre ne s'ouvraient pas** : la grille du hub affichait un tiret en guise de lien. C'était un
inventaire de ce qu'on n'avait pas.

Il en tient trois, et ce sont trois **échelles emboîtées** :

| Module | Id technique | Échelle | Ce qu'il tranche |
|---|---|---|---|
| Territoire | `quartier` | la commune | ce qui structure la vie ici et ce qui la transforme |
| Autour de l'adresse | `autour` | le voisinage | ce qui se trouve et se mesure à proximité du point |
| Logement | `logement` | le bâtiment | ce que le diagnostic établit, ce qui expose, ce qu'il reste à demander |

**Les thèmes retirés n'ont pas disparu, ils TRAVERSENT désormais les échelles.** La chaleur, par
exemple : trajectoire projetée dans Territoire, îlot de chaleur du quartier dans Autour, inertie et
protections solaires dans Logement. C'est ce que les six modules empêchaient.

**PIÈGE D'IDENTIFIANT, à lire avant de toucher aux ids** : `quartier` est l'id historique du module
**Territoire** et désigne l'échelle **communale**, jamais le voisinage. Il est antérieur à l'existence
d'un module « Autour ». Conservé parce qu'il est écrit en base (`terrain_observations.module`), dans
les URLs et dans l'analytics. L'analytics émet désormais `module_semantic_key`
(`territory` / `surroundings` / `housing`) à côté, pour que les analyses futures n'aient pas à
connaître cette histoire. `module_index` a bougé (logement 2 → 3) : c'est une **position d'écran**,
pas une identité — toute comparaison à cheval sur le 29/07 compare deux mises en page.

---

## 2. L'ENTOURAGE PREND SON MODULE — et révèle deux couplages cachés

L'« autour de l'adresse » était le **beat 4 du module Logement** : on ne pouvait le lire qu'après
avoir fait analyser un bâti. Ce n'est ni la même question, ni la même échelle, ni le même moment.

Nouveau : `/rapport/autour` + `AutourModule.tsx`. Il réutilise `AutourSection` (donc le
`CarOwnershipBlock` de l'autre session part avec lui, à sa place naturelle) et passe par
`buildAutourResponse` — **aucun chemin ne renvoie le snapshot directement**, la règle tient toujours.
L'**îlot de chaleur revient avec lui** : il avait atterri dans « les risques du bâti » faute de place,
mais il décrit un quartier, pas des murs.

### Les deux régressions silencieuses, et pourquoi elles étaient invisibles

1. **La ligne d'artefact naissait d'un EFFET DE BORD de l'appel « autour ».** L'extraction faite,
   plus rien ne la créait — et comme `/api/logement-dpe` et `saveSynthesis` font des **UPDATE ciblés**,
   ils seraient devenus des no-op **sans lever d'erreur** : l'API répond 200, rien n'est sauvegardé,
   chaque analyse repart de zéro. D'où `/api/logement-artefact` + `upsertLogementAddress`, **awaité**
   avant la persistance DPE (les lancer en concurrence rendait la sauvegarde dépendante de l'ordre
   d'arrivée de deux requêtes).
2. **La rehydratation Logement exigeait un snapshot d'entourage.** Ce module n'en produit plus :
   l'exiger aurait rendu **tout bien nouvellement analysé impossible à rouvrir**.

Six tests figent maintenant le contrat d'écriture (`logement-artefact-lifecycle.test.ts`) : un upsert
d'identité ne touche ni au snapshot, ni à la posture, ni au DPE, ni à la synthèse ; une parcelle
inconnue est **OMISE** plutôt qu'écrite en `null` ; le conflit se résout sur `(user_id, logement_id)`.

### La synthèse Logement en v8

L'autour a quitté le payload. La règle du fichier : **le payload ne contient QUE des faits affichés
sous le texte** — c'est ce qui autorise le prompt à dire « les blocs portent déjà chaque donnée ».
Le hash de contenu porte la version du prompt, donc les textes écrits avant se régénèrent **seuls** :
aucune migration à faire. Le gate `autourPhase` qui retardait la synthèse a disparu avec sa cause.

---

## 3. LA REVUE EXTERNE A TROUVÉ CE QUE LE GREP AVAIT MANQUÉ (`2c79618`, `0115f22`)

La bascule avait été cherchée par grep sur « six modules », « 6 modules », « Six dimensions »,
« module Santé ». **Deux lignes disaient exactement la même chose sans jamais employer le mot
« module »** :

- la **grille tarifaire** — la surface la plus commerciale du site — annonçait « 6 analyses
  personnalisées : logement, territoire, santé, mobilité, métier, projets » sous un prix de 14 € ;
- le bloc « votre rapport interactif en 2 minutes » promettait les mêmes six.

> **Leçon de méthode : chercher le NOM d'un concept ne trouve pas ses paraphrases. Une énumération est
> une définition qui ne se nomme pas.** Quand un concept est retiré, greffer la recherche sur ce qu'il
> ÉNUMÉRAIT, pas seulement sur son nom.

Trois corrections de promesse ont suivi, toutes dans le même sens — **la vitrine était plus étroite,
ou plus fausse, que ce que les modules font déjà** :

- **Le délai était faux.** Le checkout promettait « envoyé par email sous 24 heures ouvrées ». Le
  webhook Stripe pose les droits **dès le paiement confirmé** et les modules se lisent en ligne : rien
  n'est produit en différé, rien n'est envoyé. On faisait attendre un acheteur qui pouvait déjà lire,
  sur la page où il sort sa carte.
- **Territoire était réduit au climat.** Il rend aussi l'accès aux services, la trajectoire de
  population, les résidences secondaires, les logements inoccupés, les espaces naturels, le boisement.
  Une promesse plus étroite que le contenu fait passer un rapport de territoire pour un bulletin de
  risques, et n'intéresse que les gens déjà inquiets du climat.
- **Logement se vendait par son contenu, pas par sa SORTIE.** Le module se termine sur « à vérifier
  avant de décider » (des gestes, jamais des cases) — l'élément le plus actionnable du produit, absent
  de toute surface de vente.

**Aucune promesse de périmètre sur Autour.** « À portée de pas » serait faux pour la moitié de ses
faits : BPE à **3 km à vol d'oiseau**, îlot de chaleur au **grand-IRIS**, équipement automobile au
secteur **avec repli sur la commune entière**. Le grain se dit fait par fait, là où il s'affiche —
jamais dans le titre du module. C'est gravé en tête de `product.ts`.

---

## 4. BRAINSTORMING EN COURS, INTERROMPU : le « dossier adresse » à 39 €

**Rien n'est construit. Rien n'est écrit en spec.** La session s'est arrêtée juste avant de lancer le
`business-strategist`. Voici l'état exact du raisonnement, pour ne pas le refaire.

### Le constat qui a lancé le sujet
**Aujourd'hui, les 14 € donnent déjà le dossier adresse.** `canAccessCompleteReport` est un flag de
plan **global**, `report_grants` déverrouille une **commune** : dès qu'un acheteur a payé, Autour et
Logement s'ouvrent pour n'importe quelle adresse de cette commune. **Il n'existe aucune notion de
droit par adresse.** Un dossier à 39 € n'est donc pas une entrée de plus : c'est un **re-découpage**
de ce que les 14 € contiennent.

### Tranché
- **14 € = Territoire (commune seule) · 39 € = commune + adresse (Autour + Logement).** On vend
  l'échelle, pas le module.
- **Un dossier acheté = UNE adresse**, pas la commune. L'argument est la **réversibilité asymétrique** :
  devenir plus généreux ensuite est facile, retirer un droit accordé ne l'est pas. Ni PostHog ni aucune
  donnée ne pouvait trancher ça — il n'y a **aucune donnée** (rien lancé, aucun achat à ce jour).
- **Objet `address_dossiers`, UNE seule table.** Deux tables (`addresses` + dossiers) seraient une
  normalisation prématurée : la BAN EST déjà le référentiel. L'argument décisif n'est pas la
  spéculation sur l'évolution des ids BAN, c'est un défaut **déjà présent** : voir §5.
- **Aucun choix de DPE avant paiement.** Le `DpeSelector` est un travail d'attribution ; le placer
  avant l'encaissement met la friction au pire endroit.
- **Grandfathering : SANS OBJET.** Personne n'a acheté. Resserrer le 14 € sur Territoire ne coûte rien
  et ne lèse personne.

### Non tranché
- **Le 14 € survit-il ?** Puisqu'il n'a aucun acheteur, sa suppression est gratuite.
- **La qualification avant paiement** (montrer la COUVERTURE sans les valeurs, puis refuser la vente si
  le socle est insuffisant) : la discussion y a convergé, le porteur avait d'abord répondu
  « remboursement sur seuil ». **À re-valider explicitement.**
- **La mission du `business-strategist`** : moments du parcours immobilier où plusieurs adresses sont
  comparées, modèles après le premier dossier (2ᵉ à l'unité / pack de 3 / pass / accès communal),
  cannibalisation, protocole de test **sans historique payant**, événements à instrumenter dès le
  lancement.

### Faits vérifiés à réutiliser
- **Le dossier n'est jamais vide.** Couverture nationale : BPE (« aucun dans les 3 km » EST une
  information en rural), équipement automobile (4 états, jamais « pas de donnée »), sismicité, RGA,
  sinistres indemnisés, statut réglementaire, parcelle. Ce qui varie : le **DPE** (seul trou fréquent)
  et l'**ICU** (1955 grand-IRIS sur 596 communes).
- **Mais matière ≠ valeur.** « Parcelle identifiée, sismicité faible, aucun risque réglementaire,
  pharmacie à 1,8 km » est honnête et décevant à 39 €.
- **La qualification est une route PUBLIQUE qui tape des API externes.** `/api/georisques-logement` est
  explicitement réservée au rapport complet (« fan-out ~10 API dont Géorisques token »). Une
  qualification pré-paiement doit être une **autre** route, légère, cachée par adresse, avec limite de
  débit — sinon on offre un scraper gratuit de la base DPE avec notre token.
- **Ne lister que les manques propres à CETTE adresse** (« aucun diagnostic retrouvé »), jamais
  l'inventaire des sources que le produit n'a pas : le pré-check deviendrait un catalogue anxiogène.

---

## 5. LE DÉFAUT LATENT À CONNAÎTRE : deux appartements du même immeuble s'écrasent

`logement` a pour clé primaire `(user_id, logement_id)` avec `logement_id = ban_id`. Or
**`PreciseLogementStep` existe précisément parce que plusieurs logements partagent une même adresse
BAN** (« quand plusieurs diagnostics existent à l'adresse, on demande LEQUEL est le bon »).

Conséquence : **un utilisateur qui analyse l'appartement du 2ᵉ étage puis celui du 4ᵉ, au même
immeuble, écrase le premier.** Même ligne, même snapshot, choix de DPE remplacé.

C'est gratuit aujourd'hui. **Ça devient une réclamation le jour où chaque dossier coûte 39 €.** C'est
l'argument décisif pour que le droit porte sur un `address_dossier` et non sur `ban_id`.

---

## 6. L'AUTRE SESSION : neuf faux silencieux, et le grain qui devient une propriété du fait

Ajouté par la seconde session (fils `f98a002`, `ef17ffc`, `b01b8f2`, `473d2fa`, et les commits
antérieurs de la journée). Elle a passé la journée sur **une seule classe de défaut** : *une réponse
plausible, aucune erreur levée, aucun test capable de la voir* — parce que les tests éprouvaient
notre logique contre nos propres chaînes, jamais contre les valeurs des sources.

### Les neuf, dans l'ordre où ils sont tombés

1. **Les IRIS étaient cherchés PAR NOM.** La France compte quatre Saint-Denis : la requête ramenait
   103 IRIS, dont 62 à La Réunion, et en faisait la moyenne. **Motorisation de Saint-Denis (93)
   affichée 39,9 % au lieu de 21,0 %.** Le dataset ne porte aucun code commune — il n'existe que dans
   le préfixe du code IRIS — d'où requête par préfixe **puis filtre d'appartenance côté application**
   (`iris-scope.ts`) : l'invariant ne se délègue pas à l'API. Débloque au passage Paris, Lyon et
   Marseille, qui n'avaient **aucune** donnée IRIS (940 pour Paris contre `size=200` en dur).
2. **La règle « bruit » rendait `satisfied` SANS aucun fait.** Donc aucune carte, donc aucune
   limitation — alors que `criteria-registry` en tirait « favorable » et faisait monter la couverture.
   Le lecteur recevait une bonne nouvelle sur SON adresse, tirée du centroïde communal. `uncertain`
   dès qu'une adresse existe. **Les 900 tests passaient avant ; l'un d'eux verrouillait le
   comportement fautif.**
3. **`sol_pollue` valait `false` pour les 28 373 friches de France**, dont 485 en pollution avérée :
   le champ porte sept libellés français, le code testait `=== true || === "true" || === "1"`.
4. **Puis j'ai refait l'erreur en plus petit** : sept libellés écrasés en quatre états, « traitée »
   rangée avec « avérée » et « peu probable » avec « inexistante ». Six états désormais, plus le
   **libellé brut conservé** — c'est lui qui distingue une modalité nouvelle d'un vrai « inconnu ».
5. **La fenêtre de recherche était plus étroite que le rayon**, d'est en ouest : `rayon / 111 000`
   appliqué aux deux axes, alors qu'un degré de longitude vaut `111 km × cos(lat)`. Perte de 27 à
   37 % aux latitudes françaises.
6. **Le plafond mordait avant le tri** : `size: 20` pris dans l'ordre de l'API, tri par distance
   ensuite. **Friche « la plus proche » annoncée à 314 m alors qu'il y en avait une à 78 m.**
7. **Une friche sans coordonnées triait en premier** (`?? 0`), donc se présentait comme la plus proche.
8. **Cartofriches était interrogé au grain COMMUNE** par la route Logement : cinquante friches situées
   n'importe où, sans distance.
9. **`sante-facts.ts` affirmait que le radon est vrai au grain ADRESSE et vit dans Logement.** Faux —
   et c'est cette phrase qui expliquait pourquoi personne ne le cherchait au bon endroit.

### Ce que le modèle a gagné

**`EvidenceRef.relation` (`attribut` | `proximite`) ferme la limite qu'`echelles.ts` annonçait.**
L'échelle se dérive du couple *ancre × relation* : une proximité ancrée sur l'adresse décrit le
QUARTIER, un attribut du bien reste au LOGEMENT. Aucune exception par règle — une règle déclare ce
qu'elle **mesure**, jamais où elle s'affiche.

⚠ **Garde-fou gravé** : `relation` ne veut pas dire « la preuve est un rayon ». Une cavité à 300 m est
mesurée en rayon mais atteint le **bien** : elle reste au logement. Le test : le constat parle-t-il de
ce qu'on **vivra autour**, ou de ce qui **atteint le bien** ?

**L'échelle « quartier » n'est plus vide.** `secteur-rules.ts` émet le premier `grain: "secteur"` :
l'équipement automobile du secteur, comparé à sa commune. Le test qui figeait « aucune règle n'émet
le grain SECTEUR » disait lui-même qu'il tomberait ce jour-là ; il vérifie maintenant l'inverse —
que **seules** les règles de secteur émettent ce grain.

**Un seul texte par geste.** `decision/logement-gestes.ts` est la source unique, lue par le moteur ET
par la checklist. Les deux portaient leur copie et avaient divergé : la checklist disait encore
« Vérifier le diagnostic… » là où le dossier dit « Regardez le détail… ». Le **confort d'été** entre
au passage dans le moteur (zéro source nouvelle : `deriveThermalEvidence` est pure).

**Le radon existe enfin.** Classe 3 seulement (19,5 % des communes, mesuré sur 200) — et **à Lyon,
c'est l'arrondissement qui parle** : `/radon?code_insee=69123` rend zéro, `69389` répond, et le 9ᵉ est
en classe 3 quand les huit autres sont en 1. D'où `arrondissementsDe` et
`codePourSourceParArrondissement` dans `plm.ts`, qui ne portait que le sens inverse. **Sans adresse,
ces trois communes n'ont pas de valeur** : la règle se tait.

### Deux documents à lire avant de reprendre

- **`docs/cadrage-sources-par-echelle.md`** — les 35 sources rangées par grain réel, le tri « existe-t-il
  plus fin ? » en trois piles, et **§9 le registre des sources dormantes** (sept sources intégrées et
  non branchées, avec ce qu'il faut pour les réveiller). Rien n'est supprimé, rien ne prétend être
  couvert.
- **`docs/cadrage-radon.md`** — la table de vérité, écrite avant le code.

### L'analyse d'« Autour », en cours au moment de la coupure

**Ce qu'il contient aujourd'hui : quatre choses.** BPE (le plus proche par catégorie), espace vert
OSM, équipement automobile du secteur, îlot de chaleur (596 communes). Deux des quatre datent d'hier.

**Le gisement immédiat : `potentiallyNoisyInfrastructure` est calculé et rendu NULLE PART.** Autoroute,
voie rapide et voie ferrée, avec la distance réelle **depuis l'adresse**, dans le snapshot depuis
toujours. Un commentaire dit pourquoi : « déplacée vers le futur module Santé » — module qui n'a
jamais existé. C'est la meilleure donnée de santé environnementale du produit, et elle dort.
⚠ **À afficher comme inventaire de sources potentielles, jamais comme verdict acoustique** : ce qu'on
entend dépend du trafic, des horaires, du relief, de l'étage, des fenêtres.

**Métier et Mobilité n'ont rien perdu.** Les modules étaient des ÉCRANS ; leurs critères vivent dans
le moteur et décident déjà (`acces_transports`, `mobilite_quotidienne`, `viabilite_emploi`,
`faible_dependance_auto`). La question n'est pas « où les remettre » mais « à quelle échelle chaque
critère se lit » — et `faible_dependance_auto` montre le patron : lecture communale (position
nationale) nuancée par lecture sectorielle.

**Sitadel : je m'étais trompé hier en l'écartant.** Vérifié le 29/07 : le jeu SDES des autorisations
d'urbanisme est **national, mensuel, mis à jour le jour même**, 1 905 937 autorisations de logements
depuis 2013, et l'API DiDo filtre par commune :
`…/datafiles/8b35affb-55fc-4c1f-915b-7750f974446a/csv?COMM=eq:17300&columns=…`. Il n'a **pas** de
lat/lon mais porte les **parcelles cadastrales** (`SEC_CADASTRE1`/`NUM_CADASTRE1`) — et le produit
résout déjà la parcelle d'une adresse. C'est le seul contenu qui répond à une question qu'aucune
visite ne peut trancher : ce qui va être construit à côté.

**Ordre proposé pour « Autour »** : 1. afficher les infrastructures bruyantes (déjà calculées, une
session) · 2. compter dans un rayon plutôt que le plus proche (même donnée BPE : « une boulangerie »
n'est pas « un quartier commerçant ») · 3. les permis Sitadel autour de l'adresse · 4. le zonage PLU
des parcelles voisines (même appel GPU que la servitude ABF déjà en place).
**Écarté pour coût** : les fréquences GTFS (parsing multi-opérateurs, pas « une source de plus ») et
les cartes de bruit stratégiques (~100 DDT + agglomérations, aucun agrégat national).

---

## Doctrine (à ne pas re-litiger)
- **Une absence de couverture n'est jamais une absence de phénomène.** L'ICU non couvert ne dit PAS
  « pas d'îlot ici » : il dit que cette source ne mesure pas cette adresse. Erreur commise dans cette
  session, corrigée. **Tension à trancher plus tard** : `IcuExposure` fait `if (!icu) return null` et
  le type assume « jamais de *non renseigné* » — un silence qui peut se lire comme un examen rassurant.
- **Le payload d'une synthèse ne contient que des faits AFFICHÉS sous elle.** C'est ce qui interdit au
  modèle de commenter ce que le lecteur ne peut pas vérifier d'un coup d'œil.
- **Un module ne promet jamais un périmètre unique** quand il agrège des méthodes spatiales
  différentes. Le grain se dit au niveau du fait.
- **Ne jamais dégrader ce qu'un autre module a écrit** : un upsert d'identité OMET les colonnes qu'il
  ne connaît pas (parcelle), il ne les écrit pas en `null`.
- **Un UPDATE ciblé sur une ligne absente est un no-op SILENCIEUX.** Toute écriture qui suppose une
  ligne doit être précédée — et `await` — de sa création.
- **Chercher le nom d'un concept ne trouve pas ses paraphrases.**
- **Vendre l'échelle, pas le module** : les thèmes traversent les trois échelles.
- **Une valeur d'API jamais confrontée à la source est un mensonge en attente.** Trois fois le même
  défaut (« feux de foret » au pluriel, `libelle_observation`, `sol_pollue`). La parade est écrite
  dans `fixtures-sources-externes.ts` : **la valeur qui a causé le bug entre dans le corpus AVANT le
  correctif**, relevée telle quelle, avec sa date.
- **Un booléen ne peut pas porter un état de connaissance.** « inconnu » et « pollution inexistante »
  rendus tous deux `false`, c'est « sol sain » là où personne n'a regardé. Quand une source distingue
  des états, changer le TYPE, pas la comparaison — et conserver la valeur brute.
- **Ne jamais prétendre au plus proche quand la liste des candidats a pu être coupée.** Un plafond qui
  mord avant le tri transforme « le plus proche » en « le plus proche d'un échantillon arbitraire ».
- **Une règle déclare ce qu'elle MESURE, jamais où elle s'affiche.** L'échelle se dérive du couple
  ancre × relation. Une exception « telle règle va dans Quartier » rétablirait l'appartenance que la
  projection existe pour supprimer.
- **Une valeur volontairement non persistée doit être produite par CHAQUE chemin de sortie**, sinon
  elle clignote (constaté : le clic « J'y vis » faisait disparaître l'équipement automobile). D'où
  `server/autour-response.ts` : aucun chemin ne renvoie le snapshot directement.
- **Une source fetchée mais jamais interprétée n'est pas une capacité du produit.** Retirer l'APPEL
  ne retire pas la source : la lib, ses pièges et ses contrats restent (cf. §9 du cadrage).

## La suite
1. **Reprendre le brainstorming §4** — re-valider la qualification avant paiement, puis lancer le
   `business-strategist` (rapport à déposer dans `docs/rapports-agents/business-strategist/`), puis
   spec dans `docs/superpowers/specs/`. **Ne pas coder avant la spec.**
2. **`address_dossiers`** — nécessaire dans tous les scénarios de §4, et corrige §5. Peut démarrer
   avant l'agent.
3. **Le test manuel de la bascule, jamais fait** : un dossier existant, un nouveau, une adresse sans
   DPE, l'aller-retour Territoire → Autour → Logement. Demande un compte payant avec commune
   débloquée.
4. **La porte « j'ai une adresse » sur la home** — arbitrage porteur. Les deux CTA sont aujourd'hui
   `Trouver où vivre` et `Analyser ma commune` : aucune entrée par l'adresse, alors que deux des trois
   modules l'exigent.
5. **`checkout-products.ts`** — le champ `features` décrit encore « la lecture du territoire… qui
   s'enrichit au fil des prochains modules ». **Il n'est affiché nulle part** (vérifié), mais c'est une
   source de vérité dormante et divergente. À nettoyer quand l'offre sera tranchée.
6. **« Autour » : quatre chantiers, dans l'ordre** — afficher les infrastructures bruyantes déjà
   calculées (une session, aucune donnée nouvelle) · compter dans un rayon plutôt que le plus proche ·
   les permis Sitadel autour de l'adresse (API vérifiée, jointure par parcelle) · le zonage PLU des
   parcelles voisines. Détail et réserves en §6.
7. **Le radon attend une décision produit, pas du code** : libellé exact de la carte, et si le geste
   « faire mesurer » mérite un annuaire — auquel cas la doctrine diagnostiqueurs s'applique (annuaire
   qualifié SANS commission, le moteur ne connaît jamais les rémunérations).
8. **La conclusion déterministe d'« Autour »** — le module rend des faits sans synthèse. Ne PAS créer
   un troisième prompt : assembler des énoncés déterministes à partir de `secteur-facts.ts`
   (`equipementAutoStatement` fait déjà ce geste). Mémoire : `project_futuree_autour_conclusion`.

## Pièges
- **Deux sessions dans le même tree** : stager par chemin, jamais `git add -A`. Vérifier `git diff`
  avant d'ajouter un fichier partagé (`synthesize-logement/route.ts` a porté les deux ce matin).
- `tsconfig.json` exclut `**/*.test.ts` du typecheck ; **eslint les ignore aussi** — un lint vert ne
  dit rien d'eux.
- Un commentaire JSX `{/* … */}` DANS un ternaire y met deux enfants et casse le build.
- Le hook pre-commit lance `index:verify` (OK). Push direct sur `main`, pas de PR.
- Sonde `probe-conclusion.ts` : **NE PAS lancer** (45 appels LLM facturés).
- **`data/iris-logement.json` n'est régénéré par AUCUN automatisme.** `scripts/build-iris-logement.mjs`
  existe, rien ne le lance, et l'URL INSEE contient l'identifiant de publication (`8647012`) qui change
  à chaque millésime : le script devra être **édité**, pas seulement relancé.
- **Le contrat client porte `irisScope` et `part_deplacements_motorises` que rien n'affiche.** Un champ
  transporté que personne ne consomme finit supprimé « parce qu'il ne sert à rien », ou branché plus
  tard par quelqu'un qui n'a pas lu ce qu'`irisScope` protège.
- **`LAB_IRIS` est transporté sans sémantique** : la documentation INSEE ne publie pas ses modalités.
  Ne pas la déduire par corrélation — ce serait reconstruire officieusement une doctrine du producteur.
- **Les sept autres indicateurs IRIS de l'ADEME sont ESTIMÉS** (ENL 2022 par sondage, GEODIP 2017).
  Seul l'équipement automobile a été basculé vers une source mesurée (INSEE RP 2022). Les autres —
  en particulier les passoires, qui portent une décision produit — méritent le même examen.
