# FUT-59 : valeurs aberrantes de l'audit énergétique dans Logement

**Date** : 4 octobre 2026 · **Base** : `main` à `ce941278` · Aucun appel Anthropic, aucune donnée
utilisateur modifiée.

## 1. Symptôme

Pendant l'audit du 03/10/2026, le module Logement d'un dossier payé affichait, sous « Audit
énergétique · 5 scénarios », des valeurs comme « 218538.427059351 kWh/m²/an » (état initial),
« 72592.3284900127 », « 49955.8540228555 », « 23015.7991146665 ». Le DPE attribué au même logement
affichait 418,3 kWh EP/m²/an.

## 2. Reproduction

Lecture seule de l'API publique ADEME. La valeur exacte `218538.427059351` ne correspond qu'à un seul
audit du jeu (`qs=ep_conso_5_usages:218538.427059351`, 1 résultat), dont les cinq étapes reproduisent les
cinq valeurs vues à l'écran. Son numéro et son adresse ne sont pas versionnés ici. Les tests utilisent
une fixture synthétique de même structure.

## 3. Source

ADEME, jeu `audit-opendata` sur data.ademe.fr (« Audits énergétiques logement existants (depuis le
1 septembre 2023) », 3,3 millions de lignes, mis à jour le 30/06/2026). Une ligne par étape de scénario de
travaux. Chargé par `src/lib/audit.ts` (`getAuditByBanId`, `getAuditByCoordinates`), via
`/api/georisques-logement`.

## 4. Champ

Lu avant correction : `ep_conso_5_usages` (titre source « conso_ep_5_usages »).
Lu après correction : `ep_conso_5_usages_m2` (titre source « conso_ep_5_usages_par_m2 »). Même
substitution pour les émissions : `emission_ges_5_usages` remplacé par `emission_ges_5_usages_m2`.

## 5. Définition

Le schéma de la source ne publie ni description ni unité explicite, seulement les titres. Le dépôt ne
documentait pas l'unité (`DATA_SOURCES.md` cite `ep_conso_5_usages` comme « consommation EP »). Le contrat
a donc été **établi sur la donnée** :

| Constat | Résultat |
|---|---|
| Audit de l'incident, 5 étapes | `ep_conso_5_usages` = `ep_conso_5_usages_m2` × 434, à l'identique pour chaque étape ; 434 m² = `surface_habitable_immeuble` (surface du logement non renseignée) |
| 40 lignes publiques avec `surface_habitable_logement` | total = par m² × surface du **logement** : 40/40 |
| 40 lignes avec seulement `surface_habitable_immeuble` | total = par m² × surface de l'**immeuble** : 40/40 |

`ep_conso_5_usages` est donc la consommation **totale** annuelle d'énergie primaire, 5 usages, de
l'objet audité. `ep_conso_5_usages_m2` est la même grandeur **par m²** de sa surface habitable de
référence. Les deux sont conventionnelles (méthode de l'audit), jamais une consommation réelle mesurée.

## 6. Unité

`ep_conso_5_usages` : kWh EP/an. `ep_conso_5_usages_m2` : kWh EP/m²/an. Énergie **primaire**
(préfixe `ep_`), à distinguer de l'énergie finale (`conso_5_usages_m2`, titre « conso_ef_… »).

## 7. Chaîne de transformation

| | Avant | Après |
|---|---|---|
| Colonne demandée | `ep_conso_5_usages` (total) | `ep_conso_5_usages_m2` (par m²) ; les totaux ne sont plus demandés |
| Champ interne | `conso_ep` (unité implicite) | `conso_ep_m2` (unité dans le nom) |
| Objet audité | inconnu | `objet` : `logement` ou `immeuble`, avec sa surface, lu dans les surfaces de la source |
| Rendu | `` `${s.conso_ep} kWh/m²/an` `` (valeur brute, douze décimales, unité inexacte) | `formatKwhEpM2` : au dixième, virgule française, « kWh EP/m²/an » |

## 8. Cause racine

**A : mauvais champ.** Le mapping lisait la consommation totale de l'objet audité et l'écran
l'affichait sous l'unité de la consommation par m². Aucune conversion à faire : la grandeur par m² existe
à la source, c'est elle qu'on lit désormais. Le défaut de formatage (douze décimales, point décimal) était
réel, mais secondaire.

Second défaut, de **grain** : l'audit est trouvé par l'identifiant BAN de l'adresse et porte ici sur
**l'immeuble entier** (434 m²). Il s'affichait sous le DPE du logement (194,7 m², classe F), comme s'il
était le sien.

## 9. Surfaces affectées

| Surface | Effet |
|---|---|
| `EnergieSection` (module Logement), liste des scénarios d'audit | Seul rendu de la valeur : corrigé |
| `/api/audit/[insee]` | Renvoyait `conso_ep` et `emission_ges` en totaux : renvoie désormais les valeurs par m² et l'objet audité |
| `emission_ges` | Même défaut (total), jamais affiché : corrigé avec le même contrat |
| Synthèses LLM, règles du dossier, snapshots | Ne lisent pas l'audit : non affectés |
| DPE (`conso_ep_m2`, source `conso_5_usages_par_m2_ep`) | Champ correct ; seul son rendu passe par le même formatter (« 418,3 » au lieu de « 418.3 »), sans changer la valeur |

## 10. Correction

- `src/lib/audit-record.ts` (nouveau, pur) : colonnes demandées (`AUDIT_SELECT`), lecture
  (`toAuditRecord`), objet audité (`objetAudite`), formatter (`formatKwhEpM2`), libellé de grain
  (`libelleObjet`).
- `src/lib/audit.ts` : ne fait plus que charger, via ce module.
- `src/lib/logement-report-types.ts` : `audit` prend le type `AuditRecord`, sans copie.
- `EnergieSection.tsx` : valeur par m² formatée ; une ligne dit l'objet audité (« Audit de l'immeuble
  entier (434 m² habitables), pas de ce seul logement » ou « Audit d'un logement de N m², rattaché à
  cette adresse ») ; même formatter pour la consommation du DPE.

Aucun seuil, aucun plafonnement, aucune valeur masquée : une valeur élevée mais conforme au contrat reste
affichée telle quelle.

## 11. Tests

`src/lib/audit-record.test.ts`, 8 tests (T1 à T7), sur fixture synthétique : le total n'est plus lu ni
demandé ; une valeur valide reste visible ; l'unité écrite est celle de la grandeur ; une décimale au
plus ; absence et valeur non finie rendent `null` ; un audit d'immeuble n'est jamais présenté comme celui
du logement ; les émissions, le chargeur, le type du rapport et la route autonome suivent le même contrat.
Mutations : relire `ep_conso_5_usages` fait échouer 3 tests ; réécrire l'unité à la main dans l'écran en
fait échouer 1.

Smoke sur la donnée publique réelle, passée par le nouveau mapping : l'audit de l'incident rend 503,5 /
167,3 / 115,1 / 53 kWh EP/m²/an, « audit de l'immeuble entier » ; un audit de logement rend ses valeurs
avec « Audit d'un logement de 155 m² » ; un identifiant sans audit ne rend rien.

## 12. Limites

- L'unité n'est pas déclarée par la source : elle est démontrée par la relation exacte total = par m² ×
  surface, sur l'incident et sur 80 lignes. Si l'ADEME publiait un jour une définition contraire, ce
  document serait à revoir.
- Le rendu de l'écran n'a pas été vu dans le navigateur : le module Logement exige un dossier connecté
  et un fan-out réseau. La chaîne est vérifiée par les tests, sur le source de l'écran et sur la donnée
  réelle.
- Un audit « de logement » trouvé par l'adresse peut décrire un autre logement de la même adresse.
  L'écran dit « rattaché à cette adresse », jamais « de ce logement », sans résoudre l'attribution.

## 13. Hors périmètre, observés et non traités

1. ~~`getAuditByCoordinates` (adresse sans identifiant BAN) prend le dernier audit trouvé dans un carré de
   50 m : il peut appartenir à un autre bâtiment.~~ **Corrigé en Phase 1.1** (voir plus bas).
2. `classe_dpe_actuel` reprend `classe_bilan_dpe` de la PREMIÈRE ligne lue, alors que cette classe varie
   d'une étape à l'autre (G à l'état initial, A à l'étape finale) et que l'ordre des lignes d'un même
   audit n'est pas garanti. Le champ n'est affiché nulle part aujourd'hui.
3. Quand l'adresse porte plusieurs audits, seul le plus récent est montré.
4. Les libellés de scénario sont les chaînes brutes de la source (« scénario multi étapes "principal" »).
5. Pour les émissions, le total n'égale la valeur par m² multipliée par la surface que sur une partie des
   lignes (17/40 et 26/40). Sans effet ici, puisque seule la valeur par m² est lue désormais.
6. FUT-58, FUT-60, FUT-43, FUT-13 et FUT-61 : non touchés.

---

## Phase 1.1 : contrat officiel et attribution (4 octobre 2026)

### Contrat ADEME

Documents officiels attachés au jeu (`data.ademe.fr/datasets/audit-opendata`, pièces jointes de
métadonnées) : « Audits énergétique - Dictionnaire de données du jeu de données »
(`AUDIT_dictionnaire_de_données_JDD.xlsx`), « Audits énergétiques - Dictionnaire de données du DUMP »
(`AUDIT_dictionnaire_de_données_DUMP.xlsx`), énumérateurs des tables et journal des évolutions. Les
définitions ci-dessous sont celles du dictionnaire JDD (colonne « Description »), identiques dans le
dictionnaire du DUMP.

| Champ open data | Libellé officiel (table) | Description officielle | Unité officielle | Objet |
|---|---|---|---|---|
| `ep_conso_5_usages` | `conso_ep_5_usages` (`audit_ep_conso`) | consommation annuelle 5 usages (ECS, chauffage, climatisation, éclairage, auxiliaires) en énergie primaire, déduit de la production PV autoconsommée | **kWhep/an** | total de l'objet audité |
| `ep_conso_5_usages_m2` | `conso_ep_5_usages_par_m2` (`audit_ep_conso`) | même grandeur | **kWhep/m²/an** (« m²SHAB » dans les champs de gain) | par m² de surface habitable |
| `emission_ges_5_usages` | `emission_ges_5_usages` (`audit_emission_ges`) | estimation GES totale 5 usages, déduit de la production PV autoconsommée | **kgCO2/an** | total |
| `emission_ges_5_usages_m2` | `emission_ges_5_usages_par_m2` (`audit_emission_ges`) | estimation GES totale 5 usages rapportée au m² | **kgCO2/m²/an** | par m² |
| `surface_habitable_logement` | `surface_habitable_logement` (`audit_logement`) | « surface habitable du logement renseignée sauf dans le cas du dpe à l'immeuble » | m² | logement |
| `surface_habitable_immeuble` | `surface_habitable_immeuble` (`audit_logement`) | « surface habitable totale de l'immeuble dans le cas d'un DPE appartement avec usage collectif ou d'un DPE immeuble » | m² | immeuble |
| `identifiant_ban` | `ban_id` (`audit_t_adresse`) | « identifiant de la BAN référençant l'adresse », issu du géocodage ADEME (score publié dans `score_ban`) | sans unité | adresse |

Ce contrat confirme la correction : l'écran lit une consommation **conventionnelle** d'**énergie
primaire** par m², et l'écrit « kWh EP/m²/an ». `emission_ges_5_usages_m2` est documenté avec son unité
(cas A) : le mapping corrigé est conservé, sans être affiché. Le ratio irrégulier total / par m² des
émissions observé en Phase 1 ne remet pas en cause ce champ, seul lu désormais.

Précautions : les valeurs sont **conventionnelles** (méthode 3CL 2021 de l'audit harmonisé), jamais une
consommation mesurée. Le dictionnaire range `ep_conso_5_usages` sous la catégorie « Consommation en énergie
finale » alors que sa description dit « énergie primaire » et `kWhep` : la description, cohérente avec le
préfixe `ep_` et avec les valeurs, fait foi ici.

### Attribution

Le repli spatial servait un seul consommateur : `/api/georisques-logement`, donc l'écran Logement → Énergie.
Il a d'abord été supprimé, puis rétabli **sous un autre type** (Phase 1.2, ci-dessous) : une proximité
n'attribue pas un audit énergétique, mais elle reste une piste qu'une preuve future pourra confirmer. Le type
`AuditRecord` porte sa provenance, `correspondance: "identifiant_ban"`, seule valeur possible ; la lecture
ne garde que les lignes dont l'identifiant BAN est exactement celui de l'adresse ; l'écran refuse tout
audit d'une autre provenance.

| Correspondance | Affiché dans Logement ? | Formulation |
|---|---|---|
| Identifiant BAN exact, audit d'un logement | Oui | « Audit d'un logement de N m², rattaché à cette adresse » |
| Identifiant BAN exact, audit de l'immeuble | Oui | « Audit de l'immeuble entier (N m² habitables), pas de ce seul logement » |
| Proximité seule (carré d'environ 50 m) | **Non** | Aucune ; conservé côté API comme `auditProche` (référence, date, distance, aucune valeur) |
| Adresse sans identifiant BAN | Non | Aucune |

Avant : une adresse sans identifiant BAN recevait le dernier audit trouvé dans un carré d'environ 50 m de
côté. Mesuré sur l'adresse de l'incident : le carré contient 20 lignes d'audit portant sur 2 adresses
différentes. Après : aucun audit.

`/api/audit/[insee]` rend le même `AuditRecord` : provenance, objet audité (logement ou immeuble, avec sa
surface), valeurs nommées avec leur unité (`conso_ep_m2`, `emission_ges_m2`).

### Limites ajoutées

- **Plusieurs audits à la même adresse** : seul le plus récent est montré, avec sa référence et sa date.
  L'écran ne prétend pas qu'il décrit le logement examiné. Pas de refonte multi-audits dans FUT-59.
- La correspondance repose sur le géocodage BAN de l'ADEME : un audit mal géocodé à la source ne sera pas
  trouvé (absence, jamais une fausse attribution).

### Dettes laissées hors périmètre

- `classe_dpe_actuel` est pris sur une ligne arbitraire alors que `classe_bilan_dpe` varie d'une étape à
  l'autre. Non affiché : à traiter dans un ticket dédié si le champ doit servir.
- Le DPE garde, lui, un repli par coordonnées pour les adresses sans identifiant BAN
  (`getDpeByCoordinates`) : il relève de l'attribution du DPE, pas de l'audit.
- Multi-audits, classes et libellés des scénarios, FUT-58, FUT-60, FUT-43, FUT-13, FUT-61.

### Tests

13 au total (T1 à T12). T8 : correspondance exacte, provenance, référence et date. T9 : un audit voisin
n'est ni retenu, ni affichable, et le repli n'existe plus dans le chargeur ni dans la route. T10 : grain
immeuble. T11 : jamais « votre logement ». T12 : aucune clé sans unité, aucune colonne totale demandée.
Mutation : supprimer le filtre par identifiant BAN fait échouer T9.

Smoke sur la donnée publique : A (immeuble exact) 503,5 kWh EP/m²/an avec mention immeuble ; B (logement
exact) 408 kWh EP/m²/an, « rattaché à cette adresse » ; C (sans audit) rien ; D (carré de 50 m, adresse
voisine) rien.

### Phase 1.2 : la proximité, un candidat et jamais un audit (4 octobre 2026)

Le défaut n'était pas de chercher à proximité : c'était de présenter le résultat comme l'audit de
l'adresse. Les deux concepts vivent désormais dans deux types.

| Concept | Type | Contenu | Usage |
|---|---|---|---|
| `exact_address` | `AuditRecord` | Valeurs par m², objet audité, référence, date | Seul audit affichable dans `EnergieSection` |
| `nearby_candidate` | `AuditCandidatProche` | Référence, date, distance en mètres. Aucune valeur, aucune classe, aucun scénario | API seulement, pour une confirmation future (parcelle, identifiant de bâtiment, BDNB) |

- `getNearbyAuditCandidate` interroge le même carré d'environ 50 m, mais ne demande à la source **que**
  `n_audit`, `identifiant_ban`, `date_etablissement_audit` et `_geopoint` : aucune valeur n'est téléchargée.
  Il écarte les audits de l'adresse elle-même et garde le plus proche.
- `/api/georisques-logement` ne le lance que **sans** audit exact, et `resultatAudit` garantit que l'exact
  gagne toujours. La réponse porte `audit` (exact ou `null`) et `auditProche` (candidat ou `null`).
- `EnergieSection` n'affiche rien du candidat, et n'accepte que `correspondance === "exact_address"`.

Smoke sur la donnée publique : à l'adresse de l'incident, l'audit exact (immeuble, 503,5 kWh EP/m²/an) est
rendu et aucun candidat n'est cherché ; pour une adresse voisine sans audit, aucun audit, et un candidat à
22 m, sans valeur.

Tests : T9 (un voisin n'est jamais l'audit de l'adresse), T10 (le candidat est détecté, le plus proche,
hors audits de l'adresse), T11 (l'exact gagne), T12 (aucune valeur d'un voisin n'existe ni n'atteint
l'écran). Mutations : rendre l'exact et le voisin ensemble fait échouer T11 ; demander une valeur dans la
recherche spatiale fait échouer T12.
