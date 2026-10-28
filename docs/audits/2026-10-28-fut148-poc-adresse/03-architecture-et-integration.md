# 3. Architecture, coût, intégration

## A. Les options

| Option | Verdict | Pourquoi |
|---|---|---|
| API officielle documentée | **N'existe pas** | Ni MCI ni cartefibre n'en publient (§ 1.D). |
| Interroger le GeoServer de MCI ou les tuiles de cartefibre à chaque analyse | **Rejetée** | Non documentés, sans conditions d'usage ni engagement ; espace de noms changé chaque trimestre (`a2026_t2`) ; dépendance à un service tiers à chaque consultation. |
| Télécharger le fichier du département à chaque analyse | **Rejetée** | 20 à 40 Mo et une lecture de fichier CSV par analyse : un appel réseau lourd à chaque consultation. |
| Table nationale embarquée dans le dépôt ou la fonction | **Rejetée** | ≈ 460 Mo bruts. Le traçage automatique copie déjà tout `data/` dans plusieurs fonctions (webhook Stripe, `/rapport`…, constaté en FUT-148). |
| Table Postgres (Supabase), une ligne par adresse | Possible, **pas recommandée** | ≈ 22 millions de lignes, de l'ordre de 2 Go avec l'index : soixante fois la base actuelle (34 Mo), et une réécriture complète chaque trimestre. |
| **Index compact par commune, en stockage objet** | **Recommandée** | ≈ 35 000 fragments JSON, 90 Mo compressés au total, médiane 7 Ko. Une lecture d'un fragment au moment de l'analyse d'adresse, résultat figé dans le rapport. Supabase Storage existe dans le projet actuel (aucun bucket aujourd'hui) : pas de nouveau fournisseur. |
| Variante : un fragment par département | Acceptable | 101 objets au lieu de 35 000, mais ≈ 1 à 3 Mo à lire par analyse. |

## B. Le pipeline recommandé (hors build, hors fonctions)

1. **Collecte trimestrielle**, sur le poste du porteur ou en CI manuelle : `base_imb` national (1,35 Go),
   `Immeuble` cartefibre (835 Mo, lu en flux) ; `actuel` national (1,87 Go) seulement si l'on garde le
   nombre d'opérateurs. Environ 15 à 25 minutes de calcul.
2. **Construction** : clé BAN → statut, et libellé IPE → statut pour les immeubles sans clé BAN. Valeur
   compacte par entrée : une lettre de statut (`D` déployé, `R` sur demande, `Q` sur demande en cours,
   `E` en cours, `S` signé, `C` cible, `A` ambigu) et le nombre d'opérateurs fibre. Exemple réel (La Rochelle) :
   `{"7900_00031":"D5","1430_00185":"E"}`.
3. **Contrôles avant publication** : jointure IPE ≥ 99,9 %, part d'adresses rattachées par département
   comparée au trimestre précédent, échantillon de recette comparé à cartefibre.
4. **Publication atomique** : nouveau préfixe `fibre/2026T3/…`, puis bascule d'un pointeur de version. Les
   rapports déjà figés gardent leur trimestre.
5. **Lecture** : à l'analyse d'une adresse Logement, `ban_id` → fragment de la commune → entrée. Le résultat
   et le trimestre sont enregistrés dans le rapport, comme les autres faits de l'adresse ; rouvrir un rapport
   ne relit rien.

**Coût mesuré ou estimé.** Stockage ≈ 0,1 Go. Lecture : un objet d'environ 7 Ko par nouvelle analyse
d'adresse. Calcul : un quart d'heure de poste par trimestre. Aucun appel modèle, aucune tâche planifiée.
**Maintenance** : quatre reconstructions par an, plus la surveillance de trois risques :
- l'`imb_id` de MCI change à chaque trimestre : on ne le stocke jamais, on joint par le code IPE ;
- la BAN évolue entre deux trimestres (2 093 clés de MCI déjà absentes de la BAN du 28/10) : une adresse
  récente tombe en « à vérifier », jamais sur un voisin ;
- le schéma bouge (`fpb`, `fpban` absents de la documentation v2025T4) : la construction doit échouer sur une
  valeur inconnue plutôt que l'ignorer.

## C. L'intégration produit proposée

**Territoire** : inchangé, le taux communal de la PR #105.

**Logement**, un bloc « Fibre à cette adresse », déterministe, hors des synthèses rédigées et sans effet sur
aucun score :

| Cas | Phrase (à valider avec le porteur) |
|---|---|
| Déployé | « La fibre est déployée jusqu'à ce bâtiment, selon l'Arcep (données au 30 juin 2026). 5 opérateurs y déclarent une offre. » |
| Sur demande | « La fibre est arrivée dans le secteur, mais ce bâtiment n'est raccordable qu'à la demande : le raccordement se fait après la commande d'un opérateur, en six mois au plus. » |
| Sur demande, en cours | « Le raccordement de ce bâtiment a été demandé par un opérateur et il est en cours. » |
| En cours de déploiement | « Le déploiement de la fibre est en cours pour ce bâtiment ; il n'est pas encore raccordable. » |
| Études réalisées (`cible`, `signe`) | « Ce bâtiment est inscrit dans un projet de déploiement de la fibre (études réalisées) ; il n'est pas encore raccordable. » |
| Ambigu, impossible, indisponible | « Raccordement à la fibre à vérifier : les données de l'Arcep ne permettent pas d'attribuer un état certain à cette adresse. » |

Toujours, en dessous : « Avant de vous engager, vérifiez l'adresse exacte sur Ma connexion internet
(Arcep) puis par un test d'éligibilité chez un opérateur. » avec le lien
`https://maconnexioninternet.arcep.fr/`. Dans le volet replié : source, date, définitions, et le rappel qu'un
bâtiment raccordable n'est pas un logement raccordé (le dernier tronçon reste à poser).

Interdits, à tester comme en FUT-148 : pas de statut emprunté à un bâtiment voisin, pas de nom d'opérateur, pas
de débit promis, jamais « sans Internet ».

## D. Ticket

**Créer un ticket Logement distinct** (« Fibre à l'adresse : statut ARCEP du bâtiment dans Logement »),
lié à FUT-148, plutôt qu'étendre FUT-148 :
- FUT-148 est livrable seul (taux communal, aucun stockage nouveau) ;
- l'adresse ajoute une décision d'infrastructure (Supabase Storage), un pipeline trimestriel de 2 à 4 Go et
  un nouveau bloc du rapport Logement : un périmètre et une revue différents ;
- le POC tranche la faisabilité : le ticket peut partir de l'architecture B et des textes C.

À arbitrer par le porteur : le stockage (Supabase Storage par commune, recommandé) et le maintien ou non du
nombre d'opérateurs (+1,87 Go par trimestre pour une information secondaire).
