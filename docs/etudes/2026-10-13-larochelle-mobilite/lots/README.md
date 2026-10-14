# Production par lots des articles mobilité

Le plus petit traitement par lots qui fasse passer une liste de communes dans la chaîne existante, sans intervention commune par commune. Ce n'est ni un CMS ni une plateforme : un script (`outil/lot.py`), un dossier par lot, un index local (`/dev/lot`). Aucun état ne vaut autorisation de publication.

## Commandes

Depuis `docs/etudes/2026-10-13-larochelle-mobilite/`, avec le venv des outils (`<checkout>/.venv-etudes`, `outil/requirements.txt`) :

```sh
PY=<checkout>/.venv-etudes/bin/python
$PY outil/lot.py preparer  lots/2026-10-lot-01              # gratuit : faits, repère voiture, pré-complément, dossier
$PY outil/lot.py collecter lots/2026-10-lot-01              # simulation de la collecte documentaire (aucun appel)
$PY outil/lot.py collecter lots/2026-10-lot-01 --executer   # collecte réelle par réseau (Claude Code)
$PY outil/lot.py rediger   lots/2026-10-lot-01              # simulation de la rédaction (aucun appel)
$PY outil/lot.py rediger   lots/2026-10-lot-01 --executer   # rédaction, contrôle, relecture, correction unique, visuels
$PY outil/lot.py etat      lots/2026-10-lot-01
```

Suivi : `http://localhost:3155/dev/lot` (serveur de développement). Option `--communes 86194,49007` pour restreindre, `--refaire fiche,complement` pour refaire une étape réussie.

## Un lot

`lots/<lot>/lot.json` : liste des communes (nom, « Nom (département) » si homonymes, ou code INSEE), jour de référence, chemins des données, moteur et modèles par étape, plafond. `etat.json` : état et étapes de chaque commune (écrit par le script). `depenses.jsonl` : un enregistrement par appel. `reseaux/` : informations mutualisées par réseau de transport. `<insee>/` : `fiche/` (faits, repère), `dossier/` (complément, dossier.md, dossier.json), `generation/` (rendus, métadonnées, contrôles), `visuels/`, `journaux/`.

## Étapes et états

| Étape | Outil existant | Coût | Si elle échoue |
|---|---|---|---|
| Résolution du code INSEE | index du comparateur (nom exact ; homonymes refusés) | gratuit | commune « à préparer » avec le motif |
| Faits calculés | `fiche_mobilite.py` | gratuit | erreur enregistrée, les autres communes continuent |
| Repère de comparaison | `comparaison_voiture.py` (règle fixe) | gratuit | idem ; « indisponible » sous 10 communes |
| Pré-complément | transport.data.gouv.fr + GTFS `agency.txt` (réseau, autorité, site, site joint ou non) | gratuit | sujets marqués `introuvable` / `inaccessible` |
| Collecte documentaire (facultative) | Claude Code, lecture limitée aux domaines du réseau ; chaque extrait est revérifié sur sa page | forfait | extrait non retrouvé → `non vérifié`, n'entre pas au dossier |
| Dossier | `dossier_redaction.py` | gratuit | erreur enregistrée |
| Rédaction | Claude Code ou Codex, session vierge : `PROMPT_REDACTION.md` + dossier de la commune seulement | forfait | commune signalée, pas de relance automatique |
| Contrôle déterministe | `controle_article.py` (identifiants, usages, valeurs, chiffres sans correspondance, bornes) | gratuit | anomalies listées |
| Relecture | session vierge distincte : `RELECTURE.md` + dossier + rendu ; anomalies précises en JSON, pas de réécriture | forfait | idem |
| Correction | au plus une, ciblée : `CORRECTION.md` ; puis contrôle déterministe | forfait | « prêt à relire » avec le motif |
| Visuels | `generer_visuels.py --classes auto --reperes …` : seulement ceux que l'article annonce ; repères numérotés + liste + tableau accessible, aucun placement manuel | gratuit | note « visuel prévu, non produit » |

États : `à préparer`, `dossier prêt`, `rédigé`, `à corriger`, `prêt à relire`, `données insuffisantes`. Une recommandation de ne pas publier mène à « prêt à relire » avec ce motif.

**Reprise et doublons.** Une étape réussie n'est pas refaite. Un appel de génération est identifié par l'empreinte de son moteur, de ses réglages et de ses entrées : mêmes entrées, pas de nouvel appel. Un marqueur est écrit avant chaque appel ; s'il reste sans réponse (coupure), la relance refuse de renvoyer l'appel et le signale. Un verrou empêche deux lancements simultanés. Chaque génération enregistre outil et version, modèle, effort, empreintes des consignes et du dossier, durée, session et coût équivalent.

**Isolement des sessions.** `claude -p` lancé dans un dossier vide hors du dépôt (ni `CLAUDE.md`, ni mémoire de projet), prompt système remplacé par les consignes, aucun outil (sauf lecture web limitée pour la collecte), MCP désactivés (`--strict-mcp-config`), réglages utilisateur, plugins et hooks non chargés (`--setting-sources project`), aucune session conservée. Le mode `--bare`, plus strict, exige une clé API : il n'est pas utilisé. Codex : `codex exec --ephemeral --ignore-user-config --ignore-rules -s read-only` dans un dossier vide.

## Ce qui reste manuel par commune

- Confirmer les homonymes (Saint-Nazaire : 44 retenu à la main).
- Compléter le complément documentaire quand la collecte ne trouve pas (tarifs, jours de circulation) : quelques minutes par réseau, pas par commune.
- Relire les libellés d'IRIS cités comme noms de quartiers et le groupe de communes voisines (liste automatique).
- Réextraire les prix du carburant avant publication (les faits carburant viennent de l'instantané du 5 octobre 2026).
- Relecture humaine de chaque article « prêt à relire » : la seule autorisation de publication.

Les durées de préparation affichées sont mesurées par le script (cache des téléchargements déjà rempli pour la plupart des sources ; un premier passage sur un nouveau département télécharge la BAN et coûte une à deux minutes de plus).
