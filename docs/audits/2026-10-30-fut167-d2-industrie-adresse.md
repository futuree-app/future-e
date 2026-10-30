# FUT-167 · D2 · Risques industriels à l'adresse, dans Logement

30/10/2026 · branche `bonjourfuturee/fut-167-d2-industrie-adresse-logement`, empilée sur D1 (PR #122). Décision du porteur du 30/10.

## La question posée, et ses cinq réponses

« Le logement est-il dans le périmètre d'un plan de prévention des risques technologiques ? »

| Réponse | Condition | Exemple réel (30/10/2026) |
|---|---|---|
| Oui (`dans_un_plan`) | le zonage d'un plan couvre le point (`/api/v2/gaspar/pprt?latitude&longitude`) | 1 avenue Albert Ramboz, Feyzin : PPRT « Vallée de la chimie », zone « 1 » (prescriptions) : « logements existants : prescriptions de renforcement du bâti » ; Fos-sur-Mer, PPRT Fos Est 2018, zone L1 |
| Non, plan sur la commune (`plan_sur_la_commune`) | un plan concerne la commune (`/api/v1/gaspar/pprt?codeInsee`), aucun zonage au point | rue de la République, Lyon |
| Non (`aucun_plan`) | aucun plan, requêtes complètes | rue de Rivoli, Paris |
| Incomplet | point lu, liste communale en panne | (simulé) |
| Non déterminable | lecture au point en panne (après une reprise) | 5 rue du Port, La Rochelle, le 30/10 : Géorisques a coupé la connexion |

« Ce que l'on peut établir pour ce bien » : la zone et son régime **tels que publiés**. Le contenu du règlement (travaux, délais, aides) n'est **pas** publié par l'API (`/api/v2/gaspar/pprt/{id}` : « n'a pas de détails de risques associés ») ; la date d'approbation non plus. La section dit où le trouver (état des risques, mairie, DDT), jamais ce qu'il contient. Un point géocodé à la rue (pas au numéro) le dit : la zone exacte se vérifie sur le plan de zonage.

## Les sites Seveso autour du logement

Index local daté (D1) : nom officiel, seuil, état d'activité, distance à vol d'oiseau du point géocodé au point publié du site, arrondie à 10 m, position arrondie ou approchée dite. Un exploitant personne physique n'est pas nommé. Lien vers la fiche Géorisques en complément. Rayon : 8 km, celui du calcul d'exposition industrielle (aucune convention nouvelle). Les autres installations classées et IREP ne sont pas repris.

## Limites dites

Une distance ne mesure aucune exposition ; un site proche n'implique pas un plan ; l'absence de plan n'est pas l'absence de risque (plan particulier d'intervention, DICRIM).

## Coût, pannes, versions

- Deux appels Géorisques en parallèle (au point avec jeton, sans cache ; commune, cache 24 h), délai 8 s, une reprise après coupure. Index Seveso sans réseau.
- Chaque lecture a son état ; sources absentes nommées (`industrie_seveso`, `pprt_point`, `pprt_commune`).
- Aucune horodate dans la lecture : l'empreinte du rapport ne change pas d'une actualisation identique à l'autre ; la date affichée est celle de la collecte de la version.
- Rapport antérieur : la section dit que la lecture n'existait pas et renvoie à « Actualiser les données », sans rien conclure.

## FUT-157

Section posée juste avant « Statut réglementaire à cette adresse », à l'endroit où la PR #118 pose « Sols pollués sur ce terrain » : une fois les deux fusionnées, elles sont voisines. Aucune modification de la branche FUT-157.

## Recette

- `src/lib/fut167-industrie-adresse.test.ts` (17 tests, réponses Géorisques réelles en fixtures).
- Lecture réelle : `node --env-file=.env.local scripts/fut167/lire-adresse.mts`.
- Navigateur : `scripts/fut167/capturer-adresse.mjs` sur `/dev/fut167-adresse` (404 en production). Sur ce banc sans compte, le bloc de synthèse du module affiche en texte la page d'erreur de son API et élargit le module à 3 828 px sur mobile : artefact du banc, antérieur et sans lien avec cette section (rendue seule, elle passe à la ligne).
