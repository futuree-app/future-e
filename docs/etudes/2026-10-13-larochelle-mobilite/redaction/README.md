# Rédaction autonome par commune

But : qu'un rédacteur écrive un article local « vivre en utilisant moins la voiture » à partir d'un seul fichier, sans conversation ni exploration du dépôt. Pas de publication automatique, pas de traitement national.

| Fichier | Rôle |
|---|---|
| `PROMPT_REDACTION.md` | Prompt réutilisable, à donner avec le dossier d'une commune et rien d'autre |
| `parametres_editoriaux.md` | Lecteur, question, formats, règles de choix d'un angle, capacités produit datées (recopiés dans chaque dossier) |
| `<insee>/dossier.md` | Dossier d'entrée autonome : la seule matière du rédacteur |
| `<insee>/dossier.json` | Les mêmes faits, pour vérifier la correspondance du brouillon à la machine |
| `../outil/dossier_redaction.py` | Adaptateur léger : fiche → dossier. Ne calcule aucune donnée ; éclate, étiquette, pré-calcule écarts et scénario |

La voix est recopiée de `../NOTE_EDITORIALE.md` (section 2) à chaque génération : corriger la note, puis régénérer le dossier.

## Produire le dossier d'une commune à partir de son code INSEE

Depuis `docs/etudes/2026-10-13-larochelle-mobilite/`, avec l'environnement de `outil/requirements.txt` (Python 3.11+) et un checkout qui contient `data/rp-mobpro-2022.parquet` et `data/bpe25.parquet` :

```sh
INSEE=79191
# 1. Fiche factuelle (1 min 30 avec cache chaud, 2 à 3 min à froid ; télécharge BAN, IRIS, GTFS, carburants si absents)
python outil/fiche_mobilite.py --insee $INSEE --jour $(date +%F) --out fiches/$INSEE --cache <cache partagé> \
  --mobpro <checkout>/data/rp-mobpro-2022.parquet --bpe <checkout>/data/bpe25.parquet \
  --index <checkout>/data/comparateur-index.json.gz
# 2. Dossier d'entrée de rédaction (instantané)
python outil/dossier_redaction.py --fiche fiches/$INSEE/fiche.json --out redaction/$INSEE \
  --origine-voisines "automatique : communes de la même unité urbaine, au plus les 6 plus peuplées"
```

Si les voisines ont été choisies à la main (`--voisines` à l'étape 1), le dire dans `--origine-voisines`, avec la raison.

Pour Niort, la fiche du 13/10/2026 existe déjà : seule l'étape 2 a été lancée (dossier prêt dans `79191/`).

## Lancer le test (session vierge)

1. Ouvrir une session sans historique.
2. Coller le contenu de `PROMPT_REDACTION.md` (à partir du filet), joindre `79191/dossier.md`, rien d'autre.
3. Contrôler le rendu : chaque ligne de la correspondance (section C) renvoie à un identifiant de `79191/dossier.json` avec la même valeur ; aucun fait `absent` ; aucun groupe de communes sans sa liste.

Ce que le test doit montrer : que le rédacteur choisit un angle propre à Niort (et non le plan rochelais), qu'il sait proposer un format court ou de ne pas publier, et que la correspondance tient sans retouche.

## Ce qui est automatisé, ce qui reste manuel

| Étape | État |
|---|---|
| Faits MOBPRO, IRIS, accès aux adresses, carburant | **Automatisé** (`fiche_mobilite.py`) |
| Faits atomiques, identifiants, statuts, périmètres nommés, faits absents, scénario carburant | **Automatisé** (`dossier_redaction.py`) |
| Carte par secteur et tableau accessible | **Semi-automatisé** : `visuels/generer_visuels.py --insee … --classes <borne>` (pour Niort, `--classes 0.45`) ; libellés des secteurs à poser à la main |
| Choix des communes comparées et sa raison | **Manuel** (la fiche prend l'unité urbaine par défaut et n'enregistre pas l'origine de la liste) |
| Vérification du réseau de bus et du jour de référence | **Manuel** : tant qu'elle n'est pas faite, les faits « bus » restent `fragile` |
| Relecture des libellés d'IRIS avant de les écrire comme noms de quartiers | **Manuel** |
| Contrôle de la hausse du carburant sur les mêmes stations | **Manuel** (`scripts/13` a été écrit pour La Rochelle) ; réextraire les prix la veille de la publication |
| Graphique selon la commune de travail et sa carte de situation | **Manuel** : `barres()` est écrite pour La Rochelle ; la carte de situation (`--communes`) n'a de sens qu'à côté de ce graphique |
| Toute comparaison nationale (rang vélo, voiture) | **Absent** : non calculé par la fiche ; à ne pas écrire |
| Rédaction | **Manuel** : prompt + dossier ; aucune génération lancée le 13/10/2026 |
| Contrôle de la correspondance du brouillon | **Manuel** (lecture de `dossier.json`) ; pas de script de contrôle |
| Relecture finale, capacités produit à revérifier si plus d'un mois, publication | **Manuel** |
| Seuils de choix d'un angle (`parametres_editoriaux.md`) | **À valider** par le porteur : propositions tirées du seul article pilote |
