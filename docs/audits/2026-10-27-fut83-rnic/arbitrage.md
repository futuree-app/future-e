# FUT-83 · Arbitrage

**Date** : 27/10/2026. Légende : **D** démontré par une mesure de ce dossier · **P** probable · **NV** non vérifié.

---

## 1. Les trois options

### Option A · Intégration ciblée

**Faits qui seraient intégrés** (et rien d'autre) :

1. le numéro et le nom d'usage de la copropriété, avec un lien vers sa fiche de l'annuaire, où le lecteur verrait
   lui-même les procédures ;
2. le nombre de **logements** déclarés, dit « de la copropriété » ;
3. le rattachement à une ASL, une AFUL ou une union ;
4. résidence-service : oui ;
5. le syndic, seulement s'il est professionnel.

Le tout seulement quand le rattachement par l'adresse est **unique**. Quand plusieurs copropriétés déclarent
l'adresse, on le dit sans en choisir aucune. Rien n'est affiché quand le registre ne trouve rien.

**Exclus** : période de construction (deux nomenclatures, le DPE fait mieux), mandat (instable), `copro_aidee`
(contradictoire entre millésimes), date de mise à jour (artefact), zonages (déjà connus), nombre total de lots seul.

| Poste | Effort (P) |
|---|---|
| Import hebdomadaire du fichier national vers une table (648 000 copropriétés, environ 710 000 clés d'adresse, 540 000 clés de parcelle), dédoublonnage, contrôle des en-têtes | 1,5 j |
| Normalisation et rapprochement (à partir de `scripts/fut83/rnic_index.py`), états `unique / ambigu / aucun / indisponible`, tests sur les cas de `rattachement.md` | 1,5 j |
| Champ optionnel du rapport Logement, versionné, avec provenance (`consulteLe`, date du fichier) ; absent sur les rapports antérieurs | 1 j |
| Bloc du Relevé, textes, recette | 1,5 j |
| **Total** | **5 à 6 jours** |
| Maintenance | Surveiller les en-têtes : un changement de format a déjà eu lieu en avril 2026 (**D**). Environ une demi-journée par trimestre, plus les incidents (**P**) |
| Temps de génération du dossier | Une requête indexée, moins de 50 ms (**P**) ; aucune dépendance réseau au moment du dossier |
| Stockage | Quelques centaines de Mo avec index (**P**) ; capacité du plan Supabase **NV** |
| Rapports déjà achetés | Champ absent, rapport inchangé, aucune version fantôme (règle de FUT-62) |

**Gain pour l'acheteur** : faible à modéré. Le bloc serait présent pour environ 4 adresses d'immeuble collectif sur 10
(**D**). Il recouperait la taille de la copropriété, que l'annonce donne déjà en lots (**D**, L721-1), et signalerait
une ASL ou une résidence-service, ce qui concerne environ 5 % des copropriétés (**D**). Il ne dit rien des charges,
des travaux, des finances ni des procédures (**D**).

### Option B · Usage technique seulement

Le registre servirait à identifier la copropriété, sans bloc pour le lecteur. Usages possibles :

- dire qu'un immeuble audité est une copropriété quand l'audit ne le dit pas (84 % des audits d'immeuble, FUT-62).
  La phrase actuelle est déjà conditionnelle et juste : le gain est **cosmétique** ;
- regrouper les adresses d'une même copropriété pour chercher ses DPE d'immeuble ou ses audits. FUT-80 le fait déjà
  par le bâtiment RNB ; le registre n'ajouterait que les résidences à plusieurs bâtiments, avec ses propres
  ambiguïtés (cas 3, 5, 13).

Coût : celui de l'import et du rapprochement (3 jours environ), sans bénéfice visible. **Pas de gain qui justifie
une maintenance.**

### Option C · Report

Ne rien intégrer du registre maintenant, garder les mesures et les scripts, et poser des conditions de réouverture.

---

## 2. Recommandation : **Option C, report**

### Preuves favorables au report

1. **Les faits qui changeraient une décision ne sont pas publiés** (**D**). Procédures, arrêtés, finances, fonds de
   travaux, plan pluriannuel : aucun n'est dans le fichier ouvert, malgré la loi (L711-2, IV) et la notice. Les
   procédures ne sont visibles que dans l'annuaire, fiche par fiche, sans API.
2. **Ce qui est publié et utile est déjà dans l'annonce** (**D**). Copropriété, nombre de lots et procédures en cours
   sont des mentions obligatoires (L721-1).
3. **Le rattachement est trop souvent muet ou ambigu pour un module qui vend la précision** (**D**). Sur une adresse
   d'immeuble collectif, le registre ne trouve rien dans 43 % des cas et en trouve plusieurs dans environ 3 %. Il en
   trouve une seule dans 42 %, et celle-ci diffère du numéro saisi par le diagnostiqueur dans environ 4 % des cas,
   estimation basse (**D** puis **P**).
4. **La qualité du fichier impose des garde-fous à chaque champ** (**D**). Doublons, deux nomenclatures de période,
   dates de mise à jour artificielles, indicateur d'aide qui se contredit d'un millésime à l'autre, mandat qui
   change pour une copropriété sur cinq en dix mois.
5. **Le lancement commercial passe avant** : 5 à 6 jours pour un bloc à faible gain, contre des chantiers ouverts
   (FUT-81 en revue, FUT-144).

### Limites et incertitudes de ce verdict

- L'échantillon de vérité de terrain est favorable (diagnostiqueurs qui connaissent la copropriété) : le taux
  d'erreur réel est sans doute **plus élevé** que 4 %, ce qui renforce le report (**P**).
- La valeur perçue d'un « la copropriété compte 40 logements » n'a pas été testée auprès d'acheteurs (**NV**). Si la
  recherche utilisateur montrait que la taille sert à comparer avant même de lire les annonces, l'option A
  regagnerait de l'intérêt.
- Les DROM et les très grands ensembles à volumes sont peu représentés (**NV**).

### Ce que l'acheteur gagnerait vraiment, sans le registre

L'essai de restitution (`scenarios-acheteur.md`, 3.4) montre que **la partie la plus utile ne dépend d'aucune
donnée** : dire à quelqu'un qui achète un appartement quelles pièces exiger, ce qu'il faut y lire (travaux votés,
plan de travaux, impayés, fonds de travaux non remboursé), et dans quel ordre. Cela relève du droit (L721-2) et du
projet déclaré (achat d'un appartement), pas du registre. **C'est une piste distincte de FUT-83**, à arbitrer
séparément ; aucun ticket n'est créé ici.

Une seconde piste, très peu coûteuse, existe aussi : lire `numero_immatriculation_copropriete` sur le DPE retenu
(1 % des DPE d'appartement, 10 % des DPE d'immeuble), source indépendante déjà appelée. Elle ne vaut d'être
faite que si un bloc copropriété existe un jour.

### Conditions de réouverture (une seule suffit)

1. L'Anah publie en données ouvertes, ou par une API documentée, **les procédures et les arrêtés** (II, 2° et 3° de
   L711-2). C'est la seule donnée du registre qui ne figure pas déjà ailleurs avec plus de fiabilité ; même alors,
   elle se restituerait sans jamais parler de « difficulté financière ».
2. Le registre porte un **identifiant de bâtiment (RNB) ou d'adresse (BAN)** : le rattachement deviendrait une
   jointure, et l'ambiguïté se mesurerait au lieu de se deviner.
3. Une recherche utilisateur montre que la taille ou la gouvernance de la copropriété fait réellement partie des
   critères des acheteurs **avant** la visite.

### Si l'intégration est un jour retenue : conditions minimales de réussite

- Rattachement **unique par l'adresse** comme seule condition d'affichage ; jamais par la parcelle seule, jamais par
  la proximité, jamais en choisissant entre plusieurs candidates.
- Le « bis » n'est jamais confondu avec le numéro nu.
- Les logements sont dits « de la copropriété », jamais « de l'immeuble ».
- On date la consultation du registre, jamais la « dernière mise à jour ».
- L'absence ne produit aucun texte.
- Un test de **ce que la carte raconte**, et pas seulement de son apparition (règle du 25/07/2026, `AGENTS.md`) :
  cas de Marseille, Toulouse, Paris 15e, La Rochelle et Issy en fixtures.

### Critères d'abandon d'une intégration retenue

- Sur un nouvel échantillon de vérité de terrain, la concordance des rattachements uniques passe sous 95 %.
- Le bloc est présent sur moins d'un tiers des dossiers d'appartement.
- Le format du fichier change plus d'une fois par semestre.
- La recette montre des lecteurs qui lisent le bloc comme un avis sur la copropriété.
