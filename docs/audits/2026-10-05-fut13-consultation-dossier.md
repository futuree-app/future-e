# FUT-13 : consulter un dossier acquis sans attendre

**Date** : 5 octobre 2026 · **Base** : `main` à `32d00430` (FUT-59 inclus) · **Statut** : lot A
implémenté (sources bornées, route parallèle, ZFE filtrée à la source) ; **lot B arrêté au diagnostic**,
parce qu'il demande une migration et des décisions de produit.

## 1. Parcours actuel (module Logement d'un dossier acquis)

```text
GET /rapport/logement?dossierId=…            page serveur : dossier, projet, snapshot de décision (CatNat)
  └─ LogementModule (client), au montage
       ├─ POST /api/dossier/actif             marque le bien actif (MarquerBienActif)
       └─ POST /api/georisques-logement       ~14 sources externes, RECALCULÉES À CHAQUE OUVERTURE
             └─ réponse → passeport, énergie, audit, risques, patrimoine…   (premier contenu utile)
                   └─ POST /api/synthesize-logement   seulement APRÈS, sur les faits re-téléchargés
```

Réponses aux questions de la phase 0 :

- **A, ce qui est stocké** : sur la ligne `address_dossiers`, l'adresse, le DPE choisi
  (`selected_dpe_snapshot`, statut et date du choix) et la synthèse (`synthesis_text`,
  `synthesis_fact_hash`, `synthesis_generated_at`). Dans `decision_artifact`, le dossier de décision du
  hub et un `dataSnapshot` qui ne contient aujourd'hui que le décompte CatNat. **Le rapport Logement
  lui-même n'est stocké nulle part.**
- **B, ce qui est recalculé à chaque ouverture** : tout le rapport Logement (parcelle, DPE candidats,
  audit, Géorisques commune, point et parcelle, altitude, ZFE, Cartofriches, données communales et IRIS,
  sinistralité ONRN, cavités, mouvements de terrain, servitudes patrimoniales GPU).
- **C, ce qui bloque le montage** : `POST /api/georisques-logement`. Le module n'affiche que sa coquille
  tant qu'elle n'a pas répondu.
- **D, ce qui pourrait s'afficher immédiatement** : le DPE choisi et la synthèse, déjà sur la ligne du
  dossier ; le dossier de décision du hub, déjà figé. Le reste n'existe qu'au retour des sources.
- **E, pourquoi `/api/synthesize-logement` est appelé à chaque ouverture** : le client recalcule le hash
  des faits **re-téléchargés** et interroge le serveur, qui compare au hash stocké. S'ils sont égaux, la
  synthèse stockée est renvoyée sans appel au modèle (cache trouvé, mesuré ici à chaque ouverture). Si une
  source live a bougé, le hash change, une nouvelle synthèse Claude est générée et **écrase l'ancienne,
  sans que le lecteur l'ait demandé**.

## 2. Chronologie mesurée

Build de production local de `32d00430`, vrai Supabase, compte de test, dossier de référence (immeuble
parisien de l'incident FUT-59), onglet **visible**. Une première série, avec l'onglet piloté en
arrière-plan, donnait 18 s avant la coquille : c'était le ralentissement des onglets cachés par Chrome,
pas le produit.

**Avant (route en série), ouverture n°1, cache de synthèse trouvé :**

```text
coquille de la page                        T+3,6 s   (serveur juste démarré)
/api/georisques-logement   T+3,6 s → T+9,6 s   6,0 s
   cadastre            0,2 s   (étape 1)
   DPE, audit          0,2 s   (étape 2)
   9 sources           0,1 à 0,5 s, sauf GPU patrimoine 4,9 s   (étape 3)
   Géorisques point    0,2 s   (étape 4)
   Géorisques parcelle 0,1 s   (étape 5)
   total route 5,7 s, réponse 7,2 Ko
premier contenu utile (TTUD)               T+10,4 s
/api/synthesize-logement   T+9,7 s → T+10,7 s   cache trouvé, 0 appel Claude
synthèse affichée                          T+11,3 s
```

**Après le lot A (route parallèle), quatre ouvertures :**

| Ouverture | Coquille | `/api/georisques-logement` | GPU | TTUD |
|---|---:|---:|---:|---:|
| 1 (serveur chaud) | 0,5 s | 0,7 → 8,5 s | ~8 s (délai) | ~8,5 s |
| 2 | ~0,5 s | 0,6 → 8,9 s | ~8 s | ~8,9 s |
| 3 | ~0,5 s | 0,7 → 8,9 s | ~8 s | ~8,9 s |
| 4 (serveur juste démarré) | 3,6 s | 3,6 → 6,0 s | 2,1 s | ~6,0 s |

Sur l'ouverture n°4, instrumentée source par source, **toutes les sources répondent en 0,55 s ou moins,
sauf GPU** (servitudes patrimoniales, Géoportail de l'Urbanisme). Sa latence varie de 2 à 8 s, son délai
maximal, d'une ouverture à l'autre.

**Le Preview du 04/10 (environ 2 minutes)** n'a pas pu être instrumenté : aucun accès aux logs détaillés
(500 et 403). D'après les horodatages, `/api/georisques-logement` y a duré environ 2 min 12 s. C'est
compatible avec une source **sans délai** restée pendue : quatre sources n'en avaient aucun (audit,
ZFE, données communales et IRIS, Cartofriches), et la route n'a pas de `maxDuration`. C'est plausible, pas
démontré.

## 3. Ce qui bloque

1. **Rien n'est figé** : le premier contenu utile attend la fin de toutes les sources live.
2. **Des sources sans délai** : une réponse ADEME qui traîne tenait tout le module.
3. **Une route en série** : son temps était la somme des étapes, pas la plus lente des sources.
4. **GPU** : la source la plus lente (2 à 8 s), qui fixe désormais le plancher.
5. **ZFE** : 2,29 Mo de contours téléchargés à chaque instance neuve, sans délai, trop gros pour le cache
   de données de Next.
6. **La synthèse attend les sources**, alors que son texte est déjà sur la ligne du dossier.

## 4. Cause racine

La consultation d'un dossier acquis est **un recalcul**. Le module n'a aucune version à lire : il
reconstruit le rapport à partir de sources externes à chaque ouverture. Sa vitesse est donc celle de la
source la plus lente du moment, et, tant que quatre sources n'avaient pas de délai, il pouvait attendre
indéfiniment.

## 5. L'avertissement `Failed to…`

**Identifié** en reproduction locale :

> `Failed to set Next.js data cache for https://data.ademe.fr/data-fair/api/v1/datasets/qljefeuzxpqx-98b60-a6n6d/lines?size=50&select=…,_geoshape, items over 2MB can not be cached (2293759 bytes)`

Source : `src/lib/zfe.ts`. Il téléchargeait les contours de **toutes** les zones à faibles émissions
(2,29 Mo) pour tester le point localement. Trop gros pour le cache de données (plafond de 2 Mo), donc
retéléchargé par chaque instance neuve. Ce n'est pas la cause des 2 minutes (environ 0,5 s localement),
mais c'était un coût inutile et sans délai.

## 6. Correction réalisée (lot A)

| Changement | Fichier | Effet |
|---|---|---|
| Délai de 8 s (la convention des autres sources du module) | `audit.ts`, `commune-data.ts` (3 requêtes), `cartofriches.ts`, `zfe.ts` | Plus aucune source ne peut tenir le module indéfiniment ; un dépassement devient une absence (la route rattrape chaque source) |
| Route parallèle | `api/georisques-logement/route.ts` | Toutes les sources partent ensemble ; seules deux dépendances réelles restent chaînées (parcelle puis Géorisques-parcelle ; audit exact puis voisin). Temps = la source la plus lente, plus la somme des étapes |
| ZFE filtrée à la source | `zfe.ts` | `geo_distance=lon,lat,0` : Data Fair ne renvoie que les zones qui contiennent le point (une zone et 55 Ko à Paris, rien ailleurs) ; le test géométrique local est conservé ; l'avertissement de cache disparaît |

Plus de délai global de route ni de `maxDuration` : avec toutes les sources bornées et parallèles, la
route est bornée par sa plus longue chaîne (cadastre puis Géorisques-parcelle).

## 7. Avant / après

| Cas | Avant TTUD | Après TTUD | Synthèse |
|---|---:|---:|---|
| Dossier déjà généré, local | 10,4 s | 6,0 à 8,9 s (plancher : GPU) | cache trouvé, 0 appel |
| Source sans délai qui traîne (Preview du 04/10) | ~2 min | ≤ ~8 s (délai de la source) | sans objet |
| Démarrage à froid raisonnable | 10,4 s | 6,0 s | cache trouvé |

**Le lot A ne tient pas l'objectif de moins de 2 s**, et il ne le peut pas : tant que la consultation
recalcule, elle attend GPU. Il supprime le mode d'échec de 2 minutes et borne le pire cas.

## 8. Appels Claude

Aucun appel réel au modèle : chacune des ouvertures mesurées a trouvé la synthèse stockée (cache
trouvé, journalisé lors de la mesure instrumentée, réponse en 0,2 à 1 s ensuite). Budget de 5 non
entamé.

## 9. Lot B, proposé et non implémenté : lire une version, puis actualiser

C'est ce qui atteint l'objectif (moins de 1 à 2 s) et tient la doctrine « consultation ≠ mise à jour ».
Il demande une migration de la base de production et trois décisions du porteur : c'est la clause
d'arrêt de ce ticket.

```text
ouverture
  → page serveur : lit la DERNIÈRE VERSION VALIDE du rapport Logement (comme le DPE et la synthèse)
  → rendu immédiat de tout le module, synthèse stockée comprise, avec sa date      (TTUD ≈ rendu de page)
  → actualisation séparée, non bloquante : POST /api/georisques-logement
        succès et rapport valide → compute → validate → persist N+1 → switch
        échec, délai, source muette → la version N reste affichée, limite nommée
  → la synthèse n'est régénérée que si la VERSION change, jamais sur un aléa de source live
```

**Décisions à prendre**

1. **Où stocker la version** :
   - une colonne `logement_report_snapshot jsonb` et sa date sur `address_dossiers` (simple, une seule
     version) ;
   - ou une table de versions par dossier (historique, bascule atomique par statut, sur le modèle de
     `decision_artifact`) ;
   - ou le `dataSnapshot` de `decision_artifact`, conçu pour « ce qu'une autre surface doit réafficher à
     l'identique », mais écrit par le hub et non par le module.
2. **Politique de fraîcheur** : actualiser à chaque ouverture en arrière-plan, ou seulement au-delà
   d'un âge (par exemple 7 jours), ou seulement sur demande.
3. **Remplacement visible** : remplacer en place et dire « actualisé le … », ou proposer « une nouvelle
   version est disponible ».

**Ce que le lot B change à la synthèse** : son hash porterait sur la version figée. La régénération
silencieuse observée ici (un aléa de source live change le hash, Claude réécrit et écrase) disparaît ; une
nouvelle synthèse ne naît que d'une nouvelle version.

**Tests prévus pour le lot B** (T1 à T8 du ticket) : version rendue sans attendre ; synthèse stockée sans
appel ; données visibles pendant une génération ; source lente et source en erreur sans effet sur la
version affichée ; actualisation réussie qui remplace seulement une fois valide ; actualisation ratée qui
conserve l'ancienne ; dossier jamais généré qui l'annonce honnêtement.

**Découpage proposé** : FUT-13A (ce lot, à merger), FUT-13B (version figée et actualisation séparée,
après décision sur les trois points), éventuellement FUT-13C (GPU : mise en cache ou lecture déléguée,
puisqu'il reste la source la plus lente même en arrière-plan).

## 10. Limites

- Mesures locales, depuis une IP française ; le Preview n'a pas pu être instrumenté.
- La cause exacte des 2 minutes du Preview n'est pas démontrée, seulement rendue impossible au-delà de
  8 s par source.
- Une source ZFE en panne rend toujours « hors ZFE » (`inZfe: false`) au lieu d'une absence : ce
  comportement est antérieur, il est noté ici et non corrigé.
- Hors périmètre : FUT-60, FUT-58, FUT-43, FUT-61, design Logement, prompts, AskFuture.
