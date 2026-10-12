# Relation au lieu : ce que FUT-26 livre, et le contrat qu'il laisse à FUT-10

**Date** : 11/10/2026 · **Branche** : `feat/fut-26-relation-au-lieu` · **Tickets** : FUT-26 (livré), FUT-10 (suite)

## Ce qui existe après FUT-26

| Objet | Source de vérité | Valeurs |
|---|---|---|
| Projet | `user_profiles.user_project` | L'objectif (`posture`) ne règle plus que le vocabulaire « votre projet » / « ce que vous avez demandé ». |
| Relation à la commune | `report_context` (inchangé) | j'y vis / j'envisage d'y vivre / je la découvre / inconnue, avec son origine : déduite ou confirmée. |
| Relation à l'adresse | `address_dossiers.place_relation` (migration 36) | `lives_here` (j'y habite) / `studying` (j'étudie ce bien) / `NULL` (inconnue). Toujours déclarée. |

Le moteur reçoit la relation du lieu évalué (`ModuleFacts.relationAuLieu`) et en tire une **voix** (`voixDuLecteur`, `src/lib/relation-au-lieu.ts`), qui règle les gestes, la règle inondation, les titres « À contrôler… » et le verbe du verdict.

### L'ordre de la voix (décisions du porteur, 11/10/2026)

1. « j'y habite » **déclaré à l'adresse** prime sur l'intention globale du projet ;
2. l'intention (achat, location) vaut pour tout lieu dont on ne sait rien de plus précis, et prime sur la résidence communale ;
3. la résidence communale, confirmée ou **déduite** de la commune de résidence déclarée : voix d'habitant ;
4. « j'envisage d'y vivre » **confirmée** seulement (déduite, elle ne dit que « ce n'est pas votre commune ») ; « j'étudie ce bien » ;
5. sinon : voix neutre (« À contrôler »).

### Limite connue

Le locataire qui **achète le logement qu'il occupe** et déclare « j'y habite » reçoit la voix d'un habitant, pas celle d'un acheteur. Il habite **et** envisage d'acheter : ce sont deux informations, et seule la première existe aujourd'hui. Le test `9 bis (limite documentée)` fige ce comportement pour qu'il ne passe pas pour voulu.

**Levée par FUT-10** : l'objectif de l'analyse (`place_objective`), déclaré pour ce bien, prime sur la relation sans l'effacer. Sans objectif déclaré, la limite subsiste telle quelle.

## Le contrat pour FUT-10

### 1. Deux informations distinctes, à l'adresse

FUT-10 doit séparer :

- **la relation effective au bien** : `place_relation` (j'y habite / j'étudie ce bien / inconnue) ;
- **l'objectif de l'analyse de ce bien** : pourquoi la personne ouvre CE dossier (l'acheter, le louer, mieux le connaître…).

Une intention explicitement associée à l'adresse pourra alors primer sur l'intention globale **sans effacer** le fait que la personne y habite : le locataire acheteur garde `lives_here` et reçoit les contrôles d'achat. Il ne faut **pas** lui demander de répondre `studying` pour obtenir ces contrôles.

### 2. Le timing : la relation doit exister AVANT la génération de l'artefact

Chemins vérifiés le 11/10/2026 :

1. **Avant le paiement** : `src/app/api/stripe/create-payment-intent/route.ts` (≈ l. 286) écrit `dossier_intents`, côté serveur, en service role. Cette table existe précisément pour ne pas transmettre à Stripe une intention de vie (migration 26).
2. **Au paiement** : `src/app/api/stripe/webhook/route.ts` (≈ l. 233) relit `dossier_intents`, puis crée la ligne `address_dossiers` (`upsert`, ≈ l. 266).
3. **Juste après** : le webhook appelle `planifierArtefact` (dans `after()`), qui lance `generateDecisionArtifact`. Celui-ci **lit déjà** `place_relation` en base (`lireRelationsAuLieu`, `src/lib/server/generate-decision-artifact.ts`).

La ligne `address_dossiers` n'existe pas avant le webhook : on ne peut donc pas y écrire la relation avant le paiement. Le contrat proposé :

- la relation (et, demain, l'objectif de l'analyse) est demandée **avant le paiement** et stockée dans **`dossier_intents`** (nouvelle colonne, même contrainte de valeurs que `place_relation`) ;
- le webhook la **recopie** dans `address_dossiers.place_relation` (avec `place_relation_set_at`) **dans le même `upsert`** qui crée le dossier ;
- l'artefact, généré ensuite, la trouve en base.

Ne pas répondre reste permis : la colonne reste `NULL`, et le dossier se lit avec une voix neutre.

### 3. Décision encore ouverte : une relation modifiée APRÈS la génération

Aujourd'hui, modifier la relation (`PATCH /api/dossier/relation`) **ne périme pas** l'artefact figé : la relation enregistrée et la conclusion déjà produite peuvent diverger. Options :

| Option | Effet | Coût |
|---|---|---|
| A. La modification périme la version, comme le DPE (`artefactPerimeParLeDpe`) | La version suivante est générée avec la nouvelle relation ; la précédente reste lisible | Une génération (et éventuellement une conclusion rédigée) par modification |
| B. La version reste, l'écran signale l'écart | Le lecteur voit que le dossier a été produit avec une autre relation | Une ligne d'interface, aucune génération |
| C. Rien | Divergence silencieuse | Contraire à la doctrine : à écarter |

À trancher dans FUT-10.

**Tranché par FUT-10 (11/10/2026)** : option B, avec la mise à jour explicite de A. La modification est enregistrée, la version vendue reste, l'écart est signalé s'il change la voix ou les gestes, et la version suivante se demande (`/api/dossier/actualiser`). Voir `docs/audits/2026-10-11-fut10-projet-relation-checkout.md`, C.4.

## À l'intégration de FUT-67

`src/components/report/AutourModule.tsx` envoie encore `posture: "residence"` à `/api/logement-autour`. La route **l'ignore depuis FUT-26** et n'écrit plus aucune posture. Le retrait de cette ligne est laissé à l'intégration de FUT-67, qui modifie déjà ce fichier : le faire sur la branche FUT-26 aurait créé un recouvrement.

## Ce qui reste hors de FUT-26

- **Migration 36** à appliquer dans Supabase avant toute interface d'édition de la relation. Le code tolère son absence (relation lue « inconnue »), seul l'enregistrement échoue.
- **Tests Supabase / RLS** : la route est testée avec un stockage simulé (propriétaire, autre utilisateur, dossier révoqué, valeur invalide). Cela vérifie notre logique, pas les politiques de la base.
- **Suppression de la colonne `posture`** : étape 6 de la spec du 25/09 (nettoyage des reliquats).
- **P0 de `conclusion-plan.ts`** relevé par FUT-67 : relève de FUT-54, non traité ici.
