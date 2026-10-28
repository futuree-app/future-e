# FUT-148 · POC : la fibre à l'adresse (Charente-Maritime)

> 28/10/2026. Demande du porteur : savoir si la fibre est déployée et disponible **à l'adresse ou au bâtiment**
> étudié dans Logement, avant toute fusion de la PR #105 (qui reste ouverte, ni fusionnée ni déployée).
> Rien n'a été modifié dans l'application : ce dossier contient les preuves, les scripts et une proposition.

## Conclusion

**Oui, l'intégration à l'adresse est faisable avec une fiabilité suffisante, à une condition : ne conclure
que sur un rattachement exact, et dire « raccordement à vérifier » partout ailleurs.**

| Question | Réponse |
|---|---|
| Fiabilité | Sur les 49 adresses réelles du POC, le géocodeur de futur•e redonne la clé BAN exacte 49 fois sur 49, et les 43 immeubles rattachés ont **exactement** le statut que montre la carte officielle (43 / 43). |
| Source la plus adaptée | **Les deux, jointes** : « Ma connexion internet » (`base_imb`) pour la **clé BAN** de l'immeuble, et `2026T2-Immeuble` (cartefibre) pour le **statut de déploiement**. Elles se joignent par le code immeuble IPE (406 217 / 406 220 en Charente-Maritime). La table d'éligibilité (`actuel`) n'ajoute que la liste des opérateurs : son « éligible fibre » équivaut exactement à « déployé ». |
| Rattachement exact | Identifiant BAN de l'adresse (`ban_id`, déjà stocké par Logement) = `addr_code` de `base_imb` → immeuble(s) IPE → `imb_etat`. Second barreau, strict : même commune, même numéro, même indice, même nom de voie normalisé, pour les immeubles IPE sans clé BAN. **Jamais la proximité.** |
| Couverture réelle (435 586 adresses BAN du département) | **80,9 % rattachées avec un statut** (80,4 % par la clé, 0,5 % par le libellé), 0,07 % ambiguës, 0,4 % sans immeuble fibre recensé, **18,6 % sans rattachement** possible. |
| Coût national | Hors ligne, une fois par trimestre : ≈ 2,2 Go téléchargés (4 Go avec la liste des opérateurs), ≈ 15 à 25 min de calcul local. Index compact ≈ 460 Mo bruts / 90 Mo compressés, découpé par commune (médiane 7 Ko). À la consultation : une lecture d'un fragment d'environ 7 Ko au moment de l'analyse d'adresse, figée dans le rapport. |
| Ticket | **Créer un ticket Logement distinct.** FUT-148 (taux communal, PR #105) est autonome et peut avancer seul ; l'adresse demande un stockage hors fonction (un nouvel usage d'infrastructure), un arbitrage du porteur, et touche le rapport Logement. |

## Ce que la donnée dit, et ne dit pas

| Notion | Où | Ce que futur•e peut écrire |
|---|---|---|
| **Déploiement au bâtiment** | cartefibre `imb_etat` | « La fibre est déployée jusqu'à ce bâtiment » (`deploye`), « en cours de déploiement », « études réalisées » (`cible`, `signe`, libellé officiel de la carte) |
| **Raccordable sur demande** | cartefibre `raccordable demande`, `rad en cours de deploiement` | « Le raccordement se fait à la demande d'un opérateur, dans un délai d'au plus six mois » |
| **Éligibilité commerciale** | MCI `actuel`, techno `FO`, par opérateur | « N opérateurs y déclarent une offre fibre ». Aucun nom d'opérateur, aucune promesse de délai ni de prix |
| **Indisponible / non attribuable** | clé absente, plusieurs immeubles de statuts différents, aucun immeuble fibre | « Raccordement à vérifier », sans conclusion |

Ni l'une ni l'autre ne garantit qu'un abonnement sera possible à la date d'emménagement : le test
d'éligibilité chez un opérateur reste le seul geste qui engage. Les deux sites officiels le rappellent.

## Le dossier

- `01-sources-et-schemas.md` : sources, schémas, licences, définitions, absence d'API documentée.
- `02-poc-charente-maritime.md` : mesures sur tout le département, échantillon de 49 adresses, vérification
  contre la carte officielle, analyse des échecs.
- `03-architecture-et-integration.md` : options comparées, coût, maintenance, textes proposés pour Logement.
- `echantillon-49-adresses.json` : l'échantillon et ses résultats bruts.
- Scripts : `scripts/research/fut148-adresse/` (lecture en flux du fichier national, index, mesures,
  échantillon). Ils lisent des fichiers téléchargés hors dépôt ; aucun n'est branché au build.
