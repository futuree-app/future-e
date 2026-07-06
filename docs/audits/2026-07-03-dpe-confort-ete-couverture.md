# Audit — Couverture DPE pour la lecture « confort d'été » du Logement

**Date** : 2026-07-03 · **Source** : `dpe03existant` (data-fair ADEME, API que futur•e interroge déjà) · **Méthode** : échantillons stratifiés par année (2021-2025, 3000 DPE/an) + segmentation par `methode_application_dpe` + contrôle d'utilité sémantique (distributions, pas seulement non-nullité).

## Question posée
Le dataset plat contient-il un profil de sensibilité au confort d'été exploitable, et pour quelle proportion de logements réels ? (Verrous : remplissage ≠ modèle, utilité sémantique ≠ non-nullité, stock ≠ flux récent.)

## Résultat 1 — Le dataset plat contient bien le bloc confort
`indicateur_confort_ete`, `logement_traversant`, `protection_solaire_exterieure`, `isolation_toiture`, `presence_brasseur_air`, `type_ventilation`, `classe_inertie_batiment`, `qualite_isolation_*` sont dans l'API actuelle. **Pas besoin de la base relationnelle complète ni de BDNB Expert** pour le signal de base.

## Résultat 2 — Le « trou appartements » = méthode d'application (confirmé par la donnée)
Sur 11 293 appartements stratifiés :
| Méthode | Bloc confort présent | Poids |
|---|---|---|
| `dpe appartement individuel` | **75 %** | ~45 % des appart |
| `dpe appartement généré à partir des données DPE immeuble` | **2 %** | ~55 % des appart |

L'hypothèse est validée : les appartements issus d'un DPE immeuble ne portent pas le bloc confort. Et ils sont **la majorité** des appartements → la couverture appartement réelle du bloc confort est ~40 %, pas 62 %.

Corollaire : la présence du bloc **swingue par année** (appart : 19 % en 2021, 64 % en 2022, 5 % en 2023, 37 % en 2024, 49 % en 2025) parce que le **mix individuel/immeuble varie selon les dépôts**. Donc on ne cite jamais un % stable ; on segmente par méthode, jamais par année. (2021 = année de transition post-réforme, maisons à 25 % : DPE legacy incomplets.)

## Résultat 3 — Les signaux de POSITION sont sémantiquement morts (abandon)
Sur appartements AVEC bloc :
- `numero_etage_appartement` : **85 % = `0`** (valeur par défaut, pas l'étage réel) → inexploitable.
- `nombre_niveau_logement` : **~92 % = `1`** → décrit les niveaux internes du logement, pas la position dans l'immeuble.
- `nombre_niveau_immeuble` : rempli à **9 %** seulement.

→ **La déduction « dernier étage / sous toiture » pour les appartements est impossible.** C'est le seul item de la liste initiale que la donnée tue. À retirer du périmètre, ne pas promettre.

## Résultat 4 — Les signaux thermiques réels sont bons et bien distribués
Sur appartements avec bloc :
- `indicateur_confort_ete` : moyen 52 % / insuffisant 29 % / bon 19 % (vraie 3-way, non dégénérée).
- `logement_traversant` : 53 % oui / 47 % non (booléen réel).
- `protection_solaire_exterieure` : 65 % oui / 35 % non (booléen réel).
- `type_ventilation` : 34 modalités distinctes.
- `classe_inertie_batiment` : ~100 % partout.

## Résultat 5 — Repli pour appartement issu d'un DPE immeuble
Ce qui SURVIT (n=3000) : `etiquette_dpe`, `type_ventilation`, `classe_inertie_batiment`, `qualite_isolation_murs`, `qualite_isolation_menuiseries` = **100 %**. Ce qui manque : `isolation_toiture` et `indicateur_confort_ete` = 3 % (logique : logement en milieu d'immeuble). Le repli = enveloppe + ventilation + inertie, sans l'indicateur réglementaire tout prêt.

## Matrice de couverture PAR SEGMENT DE DPE (doctrine qualitative, chiffres = protocole daté ci-dessus, jamais affichés en produit)
| Segment | Lecture disponible |
|---|---|
| **Maison avec DPE récent compatible** | Bloc confort généralement complet. Lecture riche quasi systématique. |
| **Appartement avec DPE individuel** | Bloc confort fréquemment disponible (~3 fois sur 4 dans l'échantillon). |
| **Appartement issu d'un DPE immeuble** (~moitié du parc appart) | Pas de bloc confort ni toiture. Repli = **« caractéristiques thermiques renseignées pour le bâtiment »** (étiquette + ventilation + inertie + isolation murs/menuiseries), JAMAIS présenté comme « caractéristiques de ce logement » : ces champs peuvent être bâtimentaux/collectifs. |

## Résultat 6 — CHEMIN BAN RÉEL (le taux qui décide l'architecture)
Protocole : 200 puis 124 adresses tirées de communes **pondérées par la population** (les utilisateurs sont des gens), vraie adresse par reverse-géocodage BAN, pipeline exact futur•e. Biais connu : reverse près du centre-bourg (léger sur-poids des adresses de centre denses). Chiffre = premier proxy, direction robuste.

Sur les adresses résolues à un numéro :
- **~20 %** ont un DPE résidentiel à l'`identifiant_ban` **exact** → lecture attribuable avec confiance ; ~18-20 % atteignent le niveau A (candidat individuel + bloc confort).
- **+34 %** n'ont rien à l'id exact mais un DPE **à moins de 50 m** sous un autre id → récupérable par repli coordonnées, MAIS attribution **par proximité, non certaine** (risque du DPE du voisin). Vaut comme **contexte thermique bâtiment/voisinage à confirmer**, pas « votre logement ».
- **~44 %** n'ont aucun DPE à moins de 50 m → **vrai niveau C** (mini-intake).

Couverture « un DPE existe » : 20 % (id exact) → 55 % (avec repli 50 m). auto_confirmé (maison, 1 candidat) : ~7 % des adresses résolues.

**Conséquence produit majeure** : le DPE n'est PAS le socle central de la Face 1 pour la majorité des adresses. C'est un **enrichissement puissant qui upgrade ~20 % des adresses en lecture riche et ~34 % de plus en contexte bâtiment**, tandis que **~44 % passent par un mini-intake**. La Face 1 doit être conçue autour de la dégradation, avec 3 (voire 4) états également nobles.

## Modèle à niveaux (à concevoir en Face 1)
- **Niveau A — lecture complète du logement** : DPE individuel/maison à l'id exact + bloc confort. Indicateur réglementaire confort d'été + traversant + protections + ventilation + inertie + isolation toiture.
- **Niveau B — contexte thermique du bâtiment** : DPE immeuble OU DPE proche (repli 50 m) à confirmer. Enveloppe + ventilation + inertie, sans qualification individuelle du confort d'été. Sémantique « pour le bâtiment ».
- **Niveau C — données insuffisantes** : aucun DPE attribuable. Aucun faux remplissage ; 2-3 questions + renvoi vers le diagnostic du logement.

## Étage / position sous toiture : question utilisateur, pas donnée publique
Signaux morts (`numero_etage_appartement` 85 % = `0`, `nombre_niveau_logement` ~92 % = `1`, `nombre_niveau_immeuble` 9 %). → Retiré de toute promesse automatique. Devient une **question utilisateur simple à fort rendement** : « Le logement est-il au dernier étage ou directement sous la toiture ? »

## Ce qui RESTE à mesurer avant une promesse produit (non fait)
- **E. Contrôle manuel API vs PDF** (~20 cas : 5 maisons / 5 appart individuels / 5 appart immeuble / 5 incomplets) : vérifier que confort/traversant/protections/ventilation/inertie/méthode racontent la même chose dans le PDF que dans la ligne API, et notamment si ventilation/inertie/menuiseries d'un DPE immeuble sont spécifiques au lot ou hérités du modèle immeuble.
- Raffinement du taux de couverture par une trame pondérée par le vécu utilisateur (logs) quand ils existeront.

## Décisions déjà sûres
1. BDNB Expert (ISB-DH) n'est plus un prérequis → piste d'enrichissement/partenariat, pas dépendance.
2. Face 1 « dedans » à repenser autour du DPE confirmé (confort été + enveloppe + ventilation + inertie), absences traitées champ par champ.
3. Ne PAS recalculer un score futur•e : réutiliser `indicateur_confort_ete` réglementaire tel quel, l'expliquer (facteurs, limites), le croiser plus tard avec la pression climatique locale.
4. Wording : « Indicateur réglementaire de confort d'été du DPE : {bon/moyen/insuffisant} », jamais « le logement sera confortable ». Indicateur conventionnel ≠ vécu ni état actuel des équipements.
5. Intake réduit à 2-3 questions : (a) ces caractéristiques sont-elles toujours actuelles ? (b) refroidit-il la nuit lors des fortes chaleurs ? (c) inconfort déjà vécu en été ?
