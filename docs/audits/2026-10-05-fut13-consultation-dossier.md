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

---

## Lot B : version persistée (5 octobre 2026)

### Schéma retenu

`supabase/35_logement_report_versions.sql` (retour arrière : `35_logement_report_versions_down.sql`),
**créé, non appliqué**.

| Colonne | Rôle |
|---|---|
| `id` | identifiant |
| `dossier_id` | FK `address_dossiers(id)`, `on delete cascade` |
| `user_id` | FK `auth.users(id)`, `on delete cascade` |
| `version` | `int >= 1`, `unique (dossier_id, version)` |
| `schema_version` | forme du JSON, 1 |
| `report` | `jsonb`, le `LogementReport` rendu par la route, sans réponse brute de fournisseur |
| `report_hash` | SHA-256 du JSON canonique (clés triées) |
| `sources_absentes` | `text[]`, les sources muettes de la collecte |
| `collected_at` | date de collecte |

Index `(dossier_id, version desc)`. RLS : lecture seule pour le propriétaire d'un dossier **non révoqué**
(`auth.uid() = user_id` et dossier possédé avec `access_revoked_at is null`) ; aucune policy d'écriture ;
`insert, update, delete, truncate` révoqués à `authenticated` et `anon` ; écriture par le service role
seulement, comme `address_dossiers`.

**Pourquoi pas `decision_artifact`** : il porte le dossier de DÉCISION du hub (verdict, cartes,
conclusion), écrit par le hub et versionné par le projet. Le rapport Logement est la matière des preuves
du module, écrite par le module et versionnée par ses sources.

**Taille** : 7 130 octets de JSON pour le dossier de référence (immeuble parisien, 5 étapes d'audit),
aucun blob : le rapport ne contient déjà que la représentation métier.

**Hors de la version** : le DPE choisi et la synthèse restent sur `address_dossiers`, où ils vivent déjà.
Un geste sur le DPE ne touche donc jamais une version, et une version ne peut pas contredire le DPE que le
lecteur vient de choisir (T8).

### Lecture

```text
page /rapport/logement → lireDerniereVersion(dossier)      une requête indexée
  version → LogementModule la pose, aucune source, aucun appel au modèle
            + synthèse enregistrée affichée telle quelle, son empreinte n'est pas recalculée
  pas de version → le module construit une fois (route), qui écrit la version 1
```

La route applique la même règle (`consulterOuActualiser`, testée sans réseau) : une version existante est
rendue sans construire, même si un client rappelle la route.

### Actualisation (geste explicite)

Bandeau « Données collectées le … · Actualiser les données ». Pendant le calcul, le rapport reste affiché
(« Actualisation en cours… »). Décision avant toute écriture (`issueActualisation`) :

- collecte invalide, ou qui perd une source que N avait (délai dépassé, 500) : `refusee`, N reste la
  dernière version, « L'actualisation n'a pas abouti. La dernière version disponible reste affichée. » ;
- empreinte identique : `identique`, aucune version créée ;
- sinon : écriture de N+1 (service role, numéro suivant, une reprise sur collision), puis remplacement à
  l'écran à la fin de la requête, le DPE choisi en session étant conservé.

Pas de délai de fraîcheur automatique, pas de traitement en arrière-plan.

### Synthèse

- **Ouverture d'une version** : la synthèse enregistrée s'affiche, 0 appel.
- **Actualisation ou choix du DPE** : si les faits changent, le composant demande la synthèse, et le
  serveur garde sa règle (même empreinte : texte réutilisé, 0 appel ; empreinte différente : génération).

### Rattrapage paresseux

Aucun backfill. Un dossier antérieur au lot n'a pas de version : sa prochaine ouverture construit en live
et écrit la version 1, les suivantes sont immédiates. Un script de backfill pourrait parcourir les dossiers
payés ; il n'est ni écrit ni lancé.

Sans la table (migration pas encore appliquée), lecture et écriture échouent proprement (vérifié :
« Could not find the table »), et le module garde le comportement du lot A.

### Mesures

| Cas | TTUD | Appels sources | Appels Claude |
|---|---:|---:|---:|
| Avant (lot 0) | 10,4 s | ~14 | 0 (cache trouvé) |
| Lot A, sans version | 6,0 à 12,1 s (GPU 2 à 8 s) | ~14 | 0 |
| Lot B, version, à froid* | 1,12 s (premier affichage, le module rendu dans la foulée) | 0 | 0 |
| Lot B, version, à chaud* | 1,15 s | 0 | 0 |
| Actualisation explicite* | rapport visible tout du long ; réponse en 8,6 s | ~14 | 0 |

\* **Simulé localement** : la migration n'étant pas appliquée, la lecture de version a été remplacée, le
temps de la mesure, par la lecture d'un vrai rapport capturé (7 130 octets). Décomposition à froid :
document reçu à 0,29 s, premier affichage à 1,12 s, seul appel `/api/dossier/actif`. Ce temps est celui de
l'application (session, page, hydratation) ; la lecture d'une version y ajoute une requête indexée. Lors de
l'actualisation mesurée, GPU a de nouveau dépassé son délai : la collecte perdait le patrimoine, et la
version N a été conservée (cas T4 observé en réel).

### Tests

`src/lib/logement-report-version.test.ts`, 16 tests : T1, T9 (version lue, 0 source), T3 (sans version :
une collecte, version 1), T4, T5 (source muette ou en erreur : N intacte), T6 (N+1 après la collecte ;
collecte identique sans version), T7 (écriture ratée ou rapport invalide : rien d'écrit), T2 (synthèse
enregistrée sans appel), T8 (DPE hors version, conservé en session), T10 (RLS). Mutations : rouvrir les
sources sur une version (T1, T3, T9 échouent), écrire avant de valider (5 échecs), retirer le contrôle
propriétaire de la RLS (T10 échoue).

### À décider avant la migration de production

1. Relire le schéma et la RLS ; appliquer `35_logement_report_versions.sql`.
2. Les synthèses des anciennes versions ne sont pas conservées : une seule synthèse par dossier, la
   dernière. Les figer par version demanderait de les écrire dans la version, après sa création.
3. La règle « aucune source perdue » peut bloquer une actualisation tant que GPU dépasse son délai : FUT-63.
4. Le plancher de l'application (environ 1,1 s ici, plus sur un démarrage à froid Vercel) n'est pas traité ici.

## Passe finale : synthèse versionnée et preuve d'absence de perte

### Synthèse portée par la version
Chaque ligne de `logement_report_versions` porte sa synthèse : `synthesis_text`, `synthesis_fact_hash` (même empreinte serveur que `address_dossiers.synthesis_fact_hash`), `synthesis_generated_at`, `synthesis_dpe_numero`. Un trigger refuse toute modification du rapport et toute réécriture d'une synthèse déjà posée. Le seul geste permis sur une ligne existante est de poser sa synthèse, une fois, de null à son texte.

`rangementSynthese(derniere, empreinte)` décide :
- pas de version : rien n'est écrit (fallback live) ;
- version sans synthèse : `attacher`, écriture conditionnelle `synthesis_text is null` ;
- même empreinte : `deja_la`, rien n'est écrit ;
- empreinte différente (autre DPE choisi, autre projet) : `nouvelle_version`, insertion de N+1 avec le même rapport, le même `report_hash`, la même `collected_at` et la nouvelle synthèse. N garde S1.

### Dossiers existants
Aucun backfill. À la première ouverture, la version 1 se construit en live. La synthèse arrive ensuite par `/api/synthesize-logement` :
- si l'empreinte des faits de la version 1 égale `address_dossiers.synthesis_fact_hash`, le cache sert le texte existant, et `rangerSynthese` l'attache à la version 1 (0 appel Anthropic) ;
- sinon, la synthèse est générée normalement et rangée dans la version qui correspond à ses faits.

Une ancienne synthèse n'est jamais attachée à des faits différents.

### Garde DPE
À l'affichage, la synthèse d'une version n'est montrée que si `synthesis_dpe_numero` égale le DPE choisi sur le dossier (`syntheseCompatible`). Sinon, le module régénère pour le DPE affiché.

### Aller-retour live → JSON → restauré
Sur un rapport réel capturé (immeuble parisien) : égalité profonde, 129 chemins de champs, 6 699 octets. Le client recevait déjà exactement ce JSON. L'entrée de la synthèse (rapport + ligne DPE + projet) est donc identique avant et après.

### Ce qui n'est pas persisté
Les réponses brutes des fournisseurs ne sont pas conservées : géométries ZFE complètes, réponses Géorisques brutes, colonnes ADEME non mappées, features BAN et cadastre complètes.

Limite analytique : une nouvelle métrique dérivée de ces réponses ne peut pas être recalculée sur une ancienne version. Il faut une actualisation, qui interroge les sources du jour.

### Contrat de fraîcheur
Le bandeau affiche « Données collectées le … » et un bouton « Actualiser les données ». Aucune actualisation n'est automatique, et rien n'est présenté comme du temps réel.

### Absence et indisponibilité
- Une source en délai dépassé ou en erreur rend `null`, et `sources_absentes` la nomme. Le bandeau la liste comme non vérifiable, pas comme absente.
- Correction de cette passe : une erreur HTTP de la ZFE ou de Cartofriches rendait `[]`, lu comme « hors ZFE » ou « aucune friche ». Elle lève désormais, et la route rend `null`.
- La base des audits rend encore `[]` sur une erreur. Cette confusion n'a pas été corrigée : elle n'affirme aucun risque.
- Une première collecte incomplète est écrite comme version 1, avec ses absences nommées. Une actualisation qui retrouve la source est acceptée. Une actualisation qui perd une source présente est refusée, et N reste affichée.

### ZFE
10 points réels sur 10 donnent un résultat identique entre l'ancienne méthode (toutes les zones, filtre local) et la nouvelle (`geo_distance` au point, puis le même `pointInShape`) : dedans, dehors, près d'une limite, zones imbriquées (Strasbourg, 4).

### Géorisques
Si une version valide existe, une panne de Géorisques n'empêche pas sa consultation : la lecture ne touche aucune source. Une actualisation pendant la panne est refusée, car elle perd une source présente. Les données affichées ne sont donc jamais remplacées par du vide.
