# Complément documentaire local : consignes communes

Consigne générale, valable pour toute commune. Les faits d'une commune vont dans `redaction/<insee>/complement.json` ; ce fichier-ci n'en contient aucun. Pilote : Niort (79191), 14/10/2026.

## À quoi il sert

Le dossier de rédaction contient les faits **calculés** (`fiche_mobilite.py`). Certaines informations utiles au lecteur ne se calculent pas : la gratuité d'un réseau, ses jours de circulation, l'endroit où vérifier un trajet. Le complément les apporte, **datées et sourcées**, pour que l'IA de rédaction les reçoive dans le dossier sans dépendre d'une conversation ni de ce qu'elle croit savoir de la commune.

Question servie : **utiliser moins sa voiture** quand on choisit un logement. Le complément ne sert à conclure ni sur la deuxième voiture, ni sur la vie sans voiture, ni sur la faisabilité d'un trajet.

## Procédure

La recherche reste ciblée. Une heure est un **plafond**, pas un objectif ni un coût mesuré : on s'arrête dès que les informations utiles sont suffisamment établies, et ce qui demanderait plus va dans `ecartes`.

1. **Identifier, pour chaque information, la source officielle compétente** : réseau de transport (autorité organisatrice ou exploitant), collectivité (commune, intercommunalité, département, région), opérateur ferroviaire, ou autre opérateur public pertinent. Pas de presse, de blog, de forum ni d'agrégateur.
2. **Chercher, dans l'ordre, et s'arrêter là :**
   - tarification : réseau gratuit ou non, pour qui, sur quelles lignes, exceptions ;
   - jours de circulation des lignes urbaines (dimanche, jours fériés, samedi), avec la période de validité des horaires ;
   - où le lecteur vérifie son propre trajet (calcul d'itinéraire, fiches horaires, temps réel) ;
   - au plus un service particulier (transport à la demande, navette) s'il change la réponse pour une catégorie de lecteurs, avec toutes ses conditions.
3. **Vélo et gare** : une entrée seulement si une source officielle donne une information directement utile à la question du logement. Pas de rubrique pour couvrir tous les modes.
4. **Enregistrer** chaque information au format ci-dessous, avec la date de consultation. Recopier la formulation de la source quand elle compte (« Ne circule pas les dimanches et jours fériés »).
5. **Enregistrer ce qui manque** dans `ecartes` : information cherchée et non trouvée, non vérifiée, ou demandant une recherche disproportionnée. Une absence enregistrée ne s'écrit pas, ne se reconstitue pas.
6. **Régénérer le dossier** (`outil/dossier_redaction.py`) : le complément y entre automatiquement (section « 2 bis »).
7. **La veille de la publication**, recontrôler les pages citées par l'article.

## Ce qu'on n'enregistre pas

- **Pas de chiffre non vérifié ni de généralisation.** Une fréquence ou une information de desserte s'enregistre seulement si une source officielle la donne **explicitement**, avec son périmètre exact : ligne ou service, sens si nécessaire, jours et période de validité (par exemple « ligne 1, du lundi au vendredi en période scolaire, selon la fiche valable à partir du 1er septembre 2026 »). On ne la recompte pas soi-même dans une grille horaire, on ne l'étend pas à d'autres lignes ni à l'ensemble du réseau.
- Le complément ne remplace ni ne valide les faits bus calculés (GTFS) du dossier, qui restent `en attente de validation` tant que leur vérification n'est pas faite.
- Pas d'inventaire des lignes.
- Pas d'intuitions non prouvées : « le centre permet de vivre sans voiture », « la périphérie l'interdit », « ville compacte et peu pentue », affirmations sur les employeurs.
- Pas d'information générale sur la commune (histoire, image, population) : elle ne sert pas la question.

## Format (`redaction/<insee>/complement.json`)

```json
{
  "commune": "79191",
  "consulte_le": "2026-10-14",
  "sources_officielles": ["https://www.tanlib.com"],
  "faits": [
    {
      "id": "doc.<sujet>.<precision>",
      "information": "formulation factuelle, telle qu'on peut l'écrire",
      "source": "nom de la page ou du document, URL précise",
      "consulte_le": "AAAA-MM-JJ",
      "validite": "période de validité donnée par la source, ou \"non précisée\"",
      "perimetre": "lignes, territoire, public concernés ; ce qui n'a pas été vérifié",
      "usage": "oui | avec ses conditions | non",
      "consigne": "ce que l'information ne permet pas de dire (facultatif)"
    }
  ],
  "ecartes": [
    {"sujet": "information cherchée", "raison": "non trouvée / non vérifiée / recherche disproportionnée / hors question"}
  ]
}
```

**Usage** :
- `oui` : à écrire tel quel, avec sa date ou sa période de validité si l'article la rend utile ;
- `avec ses conditions` : vrai et sourcé, mais particulier (un public, un horaire, une réservation) ; à n'écrire qu'avec toutes ses conditions, sinon à laisser ;
- `non` : enregistré pour mémoire (source ambiguë, à confirmer) ; ne s'écrit pas.

Identifiants en `doc.*` : jamais confondus avec les faits calculés (`mobpro.*`, `iris.*`, `acces.*`…).

## Statut des recherches et production par lots (14/10/2026)

Champs ajoutés, facultatifs pour un complément écrit à la main :

- `recherches` : une ligne par sujet cherché, avec un `statut` parmi `vérifié`, `non vérifié` (trouvé, non contrôlé), `introuvable` (cherché sans résultat), `inaccessible` (source hors d'atteinte), `non recherché`. Le dossier les affiche ; seul ce qui est `vérifié` s'écrit. **Une absence d'information ne devient jamais une absence de service.**
- dans un fait : `statut_verification` (seul `vérifié` entre au dossier) et `justificatif` (`url`, `extrait` exact retrouvé sur la page).
- `origine` : `automatique` (régénéré par `outil/lot.py`) ou autre (complément manuel, jamais écrasé).

En production par lots (`lots/README.md`), le pré-complément automatique et gratuit identifie le réseau urbain de l'intercommunalité (transport.data.gouv.fr) et son site (GTFS `agency.txt`, retenu seulement si le nom de l'agence correspond au réseau et si le site répond). La collecte facultative par Claude Code lit seulement les domaines de ce site ; chaque extrait est recherché mot pour mot sur sa page, sinon l'information reste `non vérifié`. Les informations d'un réseau sont mutualisées dans `lots/<lot>/reseaux/` et rattachées aux communes avec le périmètre « réseau X ; application à chaque commune non établie ».

## Ce qui reste manuel par commune

| Étape | Qui |
|---|---|
| Trouver les sources officielles et lire les pages (recherche ciblée, plafond d'une heure) | humain (ou assistant en session, sous contrôle) |
| Remplir `complement.json` et ses `ecartes` | humain |
| Intégration au dossier, contrôle du format | **automatique** (`dossier_redaction.py` refuse un fait sans source, date, périmètre ou usage valide) |
| Recontrôle des pages citées la veille de la publication | humain |
