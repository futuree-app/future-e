# Lot 2026-10-lot-01 : consommation à approuver avant la première génération

Rien n'a été lancé : `depenses.jsonl` n'existe pas, `plafond_usd_equivalent` vaut 0 dans `lot.json`, et `rediger --executer` refuse de partir tant qu'il est nul.

## Moteur

Claude Code (`claude -p`, version 2.1.299), avec l'abonnement du terminal : **aucun appel à l'API Claude**. Chaque appel est une session vierge (voir `../README.md`, « Isolement des sessions »). Codex (`codex exec`, 0.160.0) est branché comme alternative pour la rédaction, la relecture et la correction (`"outil": "codex"` et un modèle Codex dans `lot.json`). Il ne l'est pas pour la collecte, faute de lecture web limitable à des domaines.

| Étape | Modèle proposé | Effort | Pourquoi |
|---|---|---|---|
| Collecte documentaire (une par réseau, 7 réseaux joignables) | Claude Sonnet 5.5 | moyen | lecture et extraction de pages ; chaque extrait est revérifié sans IA |
| Rédaction | Claude Opus 5.5 | élevé | choix de l'angle, sélection, populations : le cœur de la qualité |
| Relecture (session distincte) | Claude Opus 5.5 | élevé | populations, croisements, conditions : mêmes exigences que la rédaction |
| Correction (au plus une, si anomalie bloquante) | Claude Opus 5.5 | moyen | modifications ciblées |

## Estimation pour les dix communes (en dollars « équivalent API », comme les rapporte Claude Code)

Avec un abonnement, Claude Code ne facture rien de plus par appel. Il rapporte pour chaque session un coût calculé au tarif de l'API (`total_cost_usd`) : c'est cette mesure qui sert de compteur et de plafond, et ce qu'elle représente réellement est une part de la limite d'usage du forfait.

Hypothèses mesurées : consignes + dossier ≈ 72 000 à 84 000 caractères par commune (simulation du 14/10/2026), soit environ 25 000 à 30 000 jetons d'entrée. Hypothèses non mesurées : réflexion et sortie de 15 000 à 25 000 jetons pour la rédaction, 8 000 à 15 000 pour la relecture ; correction nécessaire pour environ six articles sur dix ; collecte d'environ 40 000 jetons lus par réseau. Tarifs Opus 5.5 : 4 $ / 20 $ par million de jetons (entrée / sortie) ; Sonnet 5.5 : 2 $ / 10 $ (page officielle des prix, consultée le 14/10/2026).

| Poste | Par unité | Unités | Total |
|---|---:|---:|---:|
| Rédaction | 0,40 à 0,65 $ | 10 | 4 à 6,50 $ |
| Relecture | 0,25 à 0,45 $ | 10 | 2,50 à 4,50 $ |
| Correction | 0,35 à 0,55 $ | environ 6 | 2 à 3,50 $ |
| Collecte | 0,15 à 0,40 $ | 7 | 1 à 3 $ |
| **Total** | | | **environ 10 à 18 $ équivalent** |

Incertitude principale : la longueur de la réflexion, qui peut doubler le poste rédaction. Durée attendue : 3 à 8 minutes par session, en série, soit 1 h 30 à 3 h pour le lot.

## Ce qui a été appliqué au lancement (14/10/2026, accord du porteur)

- **Abonnement seulement.** Claude Code connecté par le compte claude.ai (abonnement Pro, `claude auth status`). Chaque session est lancée sans aucune variable `ANTHROPIC_*` ni variable d'autre fournisseur ; la source d'authentification déclarée par la session (`apiKeySource`) est enregistrée et vaut `none` (OAuth de l'abonnement) pour tous les appels. Une autre valeur arrête le lot.
- **Le compteur « équivalent API » n'est pas une mesure du quota.** `total_cost_usd` est calculé localement par Claude Code (jetons × tarif public de l'API). Il est conservé à titre d'information ; il ne dit rien de la part consommée de la limite d'usage Pro, qui n'est pas exposée.
- **Limite appliquée : le nombre d'appels.** Une collecte par réseau, une rédaction, une relecture et au plus une correction par commune. Un appel fait n'est jamais refait, un appel échoué n'est pas retenté. `--max-budget-usd` reste posé par appel comme garde-fou de longueur.
- **Limite d'usage :** une réponse de limite arrête proprement tout le lot et conserve l'avancement ; aucune nouvelle tentative.

Le bilan réel (appels, durées mesurées) est dans `BILAN.md`.
