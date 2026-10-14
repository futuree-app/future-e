# Rédaction autonome par commune

But : qu'une IA de rédaction écrive un article local « vivre en utilisant moins la voiture » à partir d'un seul fichier, sans conversation ni exploration du dépôt. Pas de publication automatique, pas de traitement national.

Chaîne visée :

code INSEE → calculs déterministes (`fiche_mobilite.py`) → dossier factuel autonome (`dossier_redaction.py`) → rédaction par l'IA → contrôle ciblé → validation humaine avant publication.

L'IA de rédaction sélectionne les faits, choisit un angle et écrit. Elle ne recherche pas de nouvelles données, ne refait pas les calculs et ne complète pas les absences avec ses connaissances générales.

| Fichier | Rôle |
|---|---|
| `PROMPT_REDACTION.md` | Prompt réutilisable de l'IA de rédaction, à donner avec le dossier d'une commune et rien d'autre |
| `parametres_editoriaux.md` | Lecteur, question, conditions obligatoires, indices éditoriaux (non décisionnels), capacités produit autorisées (recopiés dans chaque dossier) |
| `<insee>/dossier.md` | Dossier d'entrée autonome : la seule matière de l'IA de rédaction |
| `<insee>/dossier.json` | Les mêmes faits, pour vérifier la correspondance du brouillon à la machine |
| `<insee>/complement-alternatives.md` | Facultatif, manuel : informations documentaires datées sur les alternatives (réseau de transport), distinctes des résultats calculés ; à joindre avec le dossier. Niort seulement (14/10/2026) |
| `../outil/dossier_redaction.py` | Adaptateur léger : fiche → dossier. Ne calcule aucune donnée ; éclate, étiquette (statut et usage), pré-calcule écarts et scénario |

Statuts et usage : `utilisable` → `oui` ; `fragile` (faible précision statistique) → `ordre de grandeur` ; `en attente de validation` (vérification humaine non faite : réseau de bus, jour de référence) → `non`, valeur retirée du `.md` ; `absent` → `non`. Accès aux équipements : parts d'**adresses** BAN à vol d'oiseau (à la commune, chaque secteur pèse selon son nombre de ménages), pas des parts de ménages.

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

Pour Niort, la fiche du 13/10/2026 existe déjà : seule l'étape 2 a été lancée (dossier régénéré le 13/10/2026 après correction des consignes ; valeurs identiques à la fiche, seuls les faits bus passent « en attente de validation »).

## Lancer le test (session vierge)

1. Ouvrir une session sans historique, sans accès au dépôt.
2. Joindre deux fichiers et rien d'autre : `redaction/PROMPT_REDACTION.md` et `redaction/79191/dossier.md` (chemins depuis `docs/etudes/2026-10-13-larochelle-mobilite/`).
3. Contrôler le rendu : chaque ligne de la correspondance renvoie à un identifiant de `79191/dossier.json` avec la même valeur ; aucun fait d'usage `non` (bus compris) ; chaque groupe de communes présenté avec sa liste à sa première apparition ; populations (actifs, ménages, adresses) justes ; conclusion sans temps de trajet.

Essais conservés dans `79191/essais/` (sortie brute + constat). Essai 1 (13/10/2026) : faits propres à Niort et exclusions respectées, mais une section par famille de données et des formulations au-delà des données ; consignes resserrées ensuite (une question principale, écriture sélective, formulations exactes).

Essai 2 (13/10/2026) : retenu pour la prévisualisation. Version éditée `79191/article.md` (corrections ciblées et correspondance dans `79191/correspondance-faits.md`), visuels dans `../visuels/79191/`, prévisualisation locale `/dev/article-niort` (captures dans `79191/captures/`).

Ce que le test doit montrer : que l'IA de rédaction choisit un angle justifié par les résultats de Niort (proche de La Rochelle ou non, mais pas recopié), qu'elle sait proposer un format court ou de ne pas publier, et que la correspondance tient sans retouche. Préparer le test ne démontre rien : seule la copie rendue le dira.

## Ce qui est automatisé, ce qui reste manuel

| Étape | État |
|---|---|
| Faits MOBPRO, IRIS, accès aux adresses, carburant | **Automatisé** (`fiche_mobilite.py`) |
| Faits atomiques, identifiants, statuts, périmètres nommés, faits absents, scénario carburant | **Automatisé** (`dossier_redaction.py`) |
| Carte par secteur et tableau accessible | **Semi-automatisé** : `visuels/generer_visuels.py --insee … --classes <borne>` (pour Niort, `--classes 0.45`) ; libellés des secteurs à poser à la main |
| Choix des communes comparées et sa raison | **Manuel** (la fiche prend l'unité urbaine par défaut et n'enregistre pas l'origine de la liste) |
| Vérification du réseau de bus et du jour de référence | **Manuel** : tant qu'elle n'est pas faite, les faits « bus » sont `en attente de validation` (usage `non`) |
| Relecture des libellés d'IRIS avant de les écrire comme noms de quartiers | **Manuel** |
| Contrôle de la hausse du carburant sur les mêmes stations | **Manuel** (`scripts/13` a été écrit pour La Rochelle) ; réextraire les prix la veille de la publication |
| Graphique selon la commune de travail et sa carte de situation | **Manuel** : `barres()` est écrite pour La Rochelle ; la carte de situation (`--communes`) n'a de sens qu'à côté de ce graphique |
| Toute comparaison nationale (rang vélo, voiture) | **Absent** : non calculé par la fiche ; à ne pas écrire. Piste notée le 14/10/2026 : la produire dans le moteur déterministe, avec population, millésime et règle de comparaison explicites, avant de l'ouvrir à la rédaction |
| Rédaction | **IA de rédaction** : prompt + dossier, en session vierge ; aucune génération lancée le 13/10/2026 |
| Contrôle de la correspondance du brouillon | **Manuel** (lecture de `dossier.json`) ; pas de script de contrôle |
| Relecture finale, publication | **Manuel** |
| Capacités produit autorisées dans la conclusion | **Manuel** : décision du porteur ; repérée dans le code ≠ autorisée. Temps de trajet exclu tant que sa restitution n'est pas validée (FUT-98) |
| Indices éditoriaux (`parametres_editoriaux.md`) | **Indices**, pas des règles : tirés du seul article pilote, ils signalent une piste sans décider de l'angle ni de la publication |

## Articulation avec l'article général (13/10/2026)

L'article général `/savoir/dependance-auto` (page publique existante, révisée sur cette branche) explique pourquoi certains territoires rendent la voiture difficile à remplacer, avec les seuls chiffres nationaux de l'Insee Première n° 1835. Les deux études locales y renvoient, et il renvoie vers elles.

| Lien | État sur la branche | À la publication |
|---|---|---|
| La Rochelle → article général | `[notre article sur la dépendance automobile](/savoir/dependance-auto)`, fin de la section « Travailler à La Rochelle, ou juste à côté » | rien à changer (URL publique existante) |
| Niort → article général | même phrase, fin de la section « Travailler à Niort ou ailleurs » | rien à changer |
| Article général → La Rochelle | `/dev/article-larochelle`, section « Deux villes regardées de près », **affichée en développement seulement** (`etudesLocales` dans `page.tsx`) | remplacer par l'URL publique de l'étude |
| Article général → Niort | `/dev/article-niort`, même section | remplacer par l'URL publique, puis retirer la condition `NODE_ENV` |

Légendes des visuels allégées le même jour : l'image porte titre, millésime, définition et source ; la légende HTML n'ajoute que ce qui manque. Textes alternatifs et tableaux accessibles inchangés.

### Avant publication (ne bloque pas la prévisualisation)

- Prix du carburant : réextraction la veille et contrôle de la hausse sur les mêmes stations (La Rochelle et Niort).
- Dossier d'adresse : la conclusion de La Rochelle promet les équipements les plus proches et la part des ménages motorisés du secteur ; à vérifier sur un dossier réel (parcours payant, non consulté). Celle de Niort (14/10/2026) n'invite plus qu'à explorer l'adresse à partir de son projet : vérifier que le parcours part bien du projet de la personne.
- Niort : libellés d'IRIS cités comme noms de secteurs, intérêt du groupe Chauray, Aiffres, Bessines ; pages Tanlib citées à recontrôler (complément du 14/10/2026).
- Article général : date « Mis à jour » à fixer au jour de publication ; liens vers les études à activer (tableau ci-dessus).
