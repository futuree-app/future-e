# Ce que reçoit un acheteur du dossier d'adresse

**Date** : 2026-07-30 · **Méthode** : lecture du code de rendu, pas du navigateur. Cette carte dit
ce que chaque bloc affiche **et sous quelle condition il se vide**. Elle sert à parcourir le dossier
livré en sachant où regarder, pas à remplacer ce parcours.

**Pourquoi maintenant** : le parcours d'achat est en production depuis le 30/07 et personne n'a lu
en entier ce qu'il livre. Une sollicitation directe est prévue avant le 20/08.

---

## Ce qu'il reçoit hors du site

| Élément | État |
|---|---|
| E-mail de confirmation | Trois lignes. « Le dossier de {adresse} est ouvert : vous le retrouverez dans votre espace. » |
| Facture | **Aucune.** Rien n'est émis, ni envoyé, ni téléchargeable. |
| Document (PDF, export) | **Aucun.** Aucun artefact ne quitte le site. |

Conséquence : la totalité de ce qui est acheté vit derrière la connexion, et rien ne matérialise
l'achat. Pour un acheteur, c'est un accès ; pour une pièce justificative, il n'y a rien.

---

## Le constat central : la lecture interprétée ne s'affiche pas toute seule

`NEXT_PUBLIC_AUTO_SYNTHESIS` **n'existe pas** dans les variables Vercel de production. Le défaut du
code est donc actif : `AUTO_SYNTHESIS = false`.

Trois surfaces en dépendent, dont **deux sont payantes** :

| Surface | Effet en production |
|---|---|
| Module **Logement**, beat 2 « Lecture de ce logement » | Un bouton **« Générer la lecture »**. Rien ne s'écrit tant qu'on ne clique pas. |
| Module **Territoire**, synthèse | Idem, bouton manuel (`QuartierSynthesis.tsx:321`). |
| `/ou-vivre` (gratuit) | Idem. Défendable ici : ne pas dépenser pour un visiteur anonyme. |

L'acheteur paie donc pour un dossier dont le bloc « qu'est-ce que je retiens ? » se présente comme
un bouton d'outil, et dont le contenu n'existe que s'il devine qu'il faut appuyer.

**En revanche** `DOSSIER_NARRATIVE="true"` est bien posé en production : la conclusion rédigée du
dossier de décision (« En une minute », tête de `/rapport`) fonctionne.

---

## Module Logement (`/rapport/logement`)

Cinq beats. Conditions de vide, par ordre de gravité.

### Beat 1 — Passeport du bien
`PropertyPassport` (adresse, parcelle, DPE). La parcelle vient de `findCadastreParcelByPoint`, avec
repli par carrés de 3, 8 puis 15 m : elle manque rarement.

### Beat 2 — « Lecture de ce logement »
Voir le constat central. **Vide par défaut en production.**

### Beat 3a — Énergie & rénovation
| Cas | Ce qui s'affiche |
|---|---|
| DPE attribué | Étiquette, GES, date, consommation, émissions, type, et l'audit énergétique s'il existe. Riche. |
| **Aucun DPE** (`not_found`) | **Une phrase.** « Aucun DPE retrouvé dans la base ouverte pour cette adresse. » |
| DPE rejeté par le lecteur | **Une phrase.** « Aucun des diagnostics retrouvés n'a été attribué à ce logement. » |

L'absence de DPE concerne **75 à 86 % des adresses selon la densité** (`2026-07-31-couverture-dpe-stratifiee.md`, 800 adresses). Le « 35 à 53 % » écrit ici le 30/07 mesurait une recherche incluant un repli à 50 m que le produit ne fait pas.

### Beat 3b — Confort d'été
Dérivé du **même** DPE (`deriveThermalEvidence(dpe)` rend `C_NO_DATA` dès que `dpe == null`). Sans
DPE : « Les données publiques retrouvées ne permettent pas de qualifier le confort d'été de ce
logement », plus un tiroir qui explique pourquoi.

**Le point à voir de ses yeux** : sur une adresse sans DPE, les deux premières sections du module
que l'acheteur a payé disent l'une après l'autre qu'on ne sait pas. C'est honnête, et c'est le
premier endroit à regarder avant de solliciter quelqu'un.

### Beat 3c — Risques du bâti
Sismicité, retrait-gonflement des argiles, cavités et mouvements de terrain à moins de 500 m,
résidu communal. **La section entière disparaît** si aucun des quatre n'est renseigné. La sismicité
étant classée partout en France, le cas est peu probable, à vérifier au passage.

### Beat 3d — Zonage réglementaire et sinistralité
`RegulatoryStatusBlock` si `result.georisques`, `SinistraliteBlock` si `result.sinistralite`.
Disparaissent silencieusement sinon.

### Beat 4 — Renvoi vers Autour
Un paragraphe et un lien. Volontairement sans aperçu.

### Beat 5 — À vérifier avant de décider
`ProjectProbe` (une question de posture) puis `DecisionChecklist`, déterministe. Toujours présent.

---

## Module Autour (`/rapport/autour`)

Une carte, un bloc chaleur, un renvoi.

- **Vie quotidienne** : par catégorie BPE, le type le plus proche et sa distance. Une catégorie sans
  résultat affiche « Aucun recensé · dans les N km analysés », ce qui est correct.
- **Ménages et voiture** : quatre états, aucun n'est un trou. Bien traité.
- **Espace vert** : le plus proche, ou l'absence, ou « en cours de récupération » si OSM est froid
  (un seul réessai automatique, à 4,5 s).
- **Îlot de chaleur** : seulement si `snapshot.icu` existe.
- **Aucune conclusion.** Le module rend des faits et s'arrête. Manque déjà identifié.

C'est le module le plus mince des trois, et c'est celui dont le titre promet le plus.

---

## Module Territoire (`/rapport/quartier`)

Le plus fourni (`QuartierClimatData`, 1 247 lignes ; passeport et grands signaux livrés). Sa
synthèse est soumise au même bouton manuel que le Logement.

---

## Le hub `/rapport`

Tête de page : le dossier de décision « En une minute », avec sa conclusion rédigée active.
Bandeaux d'état corrects (territoire refusé, territoire actif, biens dans une autre commune).

---

## Parcours réel au navigateur, 30/07/2026

**Méthode** : compte de test jeté, deux dossiers posés en base sans passer par Stripe, parcours
Playwright sur la production, puis suppression complète (compte, profil, dossiers ; aucune ligne
`payments` n'a été créée). Deux adresses choisies pour opposer les cas :
**1 Place du Capitole, Toulouse** (DPE et parcelle présents, immeuble collectif) et
**2 Le Cros, Anglards-de-Saint-Flour** (parcelle présente, aucun DPE, rural).

### Ce qui marche

- La **synthèse automatique fonctionne** depuis le déploiement du 30/07 : trois blocs rédigés sur
  Territoire (« ce qui domine », « ce qui tient, ce qui se tend », « ce qu'on sous-estime ici »),
  spécifiques à la commune, et une lecture rédigée sur Logement. Plus aucun bouton à deviner.
- Le **module Territoire est le plus solide des trois** : passeport, synthèse rédigée, mémoire des
  catastrophes depuis 1982, treize cartes de signaux réparties en territoire, climat et risques.
- Le **module Autour rend bien son contenu** (pharmacie 68 m, école maternelle 287 m, gare 1,2 km,
  banque 28 m, 39,7 % de ménages avec voiture, parc 65 m, îlot de chaleur +7,3 °C). Il reste mince
  et s'arrête sans conclusion.
- Les bandeaux du hub sont justes une fois le territoire posé.

### Les deux problèmes que seul le navigateur montre

**1. En ville, le module Logement s'ouvre sur un devoir à faire.** À 1 Place du Capitole, la base
DPE contient **24 diagnostics**. `PreciseLogementStep` bloque tout le rapport et demande à
l'acheteur de désigner le sien dans une liste d'appartements anonymes : « appartement · 10,2 m² ·
Etage 4 ; Porte 37 · 2026 », « appartement · 23,3 m² · R+2 · 2024 »… Quelqu'un qui **envisage**
d'acheter ne connaît ni l'étage ni le numéro de porte. S'il répond « mon logement n'est pas dans
cette liste », l'état passe à `rejected` et la section Énergie se réduit à une phrase. Fréquent en
ville, sûrement ; « majoritaire » reste une hypothèse non mesurée. Un seul acheteur bloqué devant
vingt-quatre diagnostics anonymes suffit à établir que le choix du DPE ne peut pas être la porte
obligatoire du module.

**2. En rural sans DPE, le dossier conclut qu'il n'y a rien à dire.** Le module rend tout son
contenu, honnêtement, et la synthèse générée se termine par :

> « L'adresse ne porte pas d'enjeu structurant identifié. »

Précédée de « Aucun diagnostic énergétique n'est rattaché à ce logement », « Les données publiques
retrouvées ne permettent pas de qualifier le confort d'été », « Aucune règle de construction
particulière à cette adresse », « Aucun sinistre de sécheresse remboursé dans cette commune ». Tout
est vrai. Le problème n'est pas l'honnêteté, c'est que **le dossier vaut cher là où il y a un
problème et ne vaut rien là où il n'y en a pas**, et que l'acheteur ne peut pas le savoir avant de
payer. La qualification annonce la MATIÈRE disponible, jamais l'ENJEU.

### Corrections de la lecture de code

- **Le « 35 à 53 % » tient, mon objection ne tenait pas.** J'avais écrit que onze adresses le
  contredisaient. Vérification faite : ce taux vient de 124 adresses, communes pondérées par la
  population (`docs/audits/2026-07-03-dpe-confort-ete-couverture.md`), sur le MÊME chemin de
  recherche que ma sonde, repli géographique à 50 m compris. Deux absences sur onze donnent un
  intervalle à 95 % d'environ 5 % à 48 %, qui recouvre largement les 44 % mesurés. Onze tirages ne
  réfutent rien. Ce qu'ils suggèrent, sans le prouver, c'est que **l'absence n'est pas répartie
  uniformément** : elle se concentre en rural et en faible densité. Une mesure stratifiée (urbain
  dense, périurbain, petites villes, rural adressé) trancherait ; elle n'existe pas.
- La bande « mémoire du lieu » paraissait vide en capture : c'est un artefact. Elle est à
  `opacity: 0` jusqu'à ce qu'un `IntersectionObserver` la révèle au défilement, ce qu'une capture
  pleine page en headless ne déclenche pas.
- Le module Autour ne rendait pas « que son en-tête » : la longueur du texte m'avait trompé.
