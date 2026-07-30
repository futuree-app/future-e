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

L'absence de DPE concerne **35 à 53 % des adresses** (mesure de la session de qualification).

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

## À vérifier au navigateur, dans cet ordre

1. Une adresse **sans DPE**. Lire le module Logement en entier et juger les deux premières sections.
2. La même adresse **avec DPE**, pour mesurer l'écart entre les deux dossiers.
3. Cliquer « Générer la lecture » sur Logement et sur Territoire, et juger le texte obtenu. C'est
   lui qui décide si le flag doit être allumé.
4. L'aller-retour Territoire → Autour → Logement, jamais parcouru en entier.
5. Le module Autour seul : est-ce qu'il vaut son titre sans conclusion ?
