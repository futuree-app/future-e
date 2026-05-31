# Comparateur de vie — chantier recherche : santé environnementale élargie

> Audit de sources pour la roadmap du comparateur. Objectif : renforcer la promesse
> « choisir où vivre dans un monde qui change, en prenant aussi en compte la santé
> environnementale », sans dériver vers un classement socio-économique.
> Règle d'écriture : pas de tiret cadratin.

Principe transverse retenu (déjà acté V1.5) : **score national déterministe**
(données propres, communales, stables) vs **enrichissement synthèse** (données
mesurées mais dynamiques, lacunaires ou nuancées) vs **exclusion du score**
(données à biais socio-économique ou à fort risque de faux signal).

Distinction clé pour tout ce chantier : **pression** (potentiel, ex. cultures
traitées autour) vs **exposition mesurée** (ce qu'on respire ou ce qu'on boit).
La pression différencie ; l'exposition rassure. Les deux ont leur place, mais
pas le même statut.

---

## 1. Pesticides

> MISE À JOUR (mini-test concluant) : le dataset ADEME `data_communes` (déjà
> bulk-fetché pour population/air/soins) contient directement **l'IFT (Indice de
> Fréquence de Traitement) par commune** (`ift_t`, `ift_h`, `iftbc`…) ainsi que la
> SAU et la part bio (`sau`, `p_sau`, `sau_bio`, `p_bio`). La pression
> phytosanitaire est donc **nationale, communale et immédiate**, sans CLC ni RPG.
> Test : Épernay 16,1 (Champagne) · Pithiviers 4,8 (Beauce) · Guéret 0,57
> (élevage) · Chamonix 0 (montagne). Signal très discriminant et crédible.
> CLC/RPG deviennent inutiles en V1.6.

Aucune donnée communale d'exposition résidentielle mesurée n'existe en France.
On approche une **pression phytosanitaire territoriale** via l'IFT (intensité de
traitement sur les terres de la commune) pondéré par la part agricole. C'est une
**pression**, pas une exposition des habitants : le libellé doit rester honnête.

| Source | Couverture | Granularité | Coût | Robustesse | Scoring | Synthèse |
|---|---|---|---|---|---|---|
| **RPG** (Registre Parcellaire Graphique, ASP/IGN) | nationale | parcelle | élevé (SIG, précalcul offline) | élevée pour l'occupation, proxy fort de pression (vigne, vergers, grandes cultures = IFT élevé ; prairies/forêt = faible) | possible comme proxy de pression, avec caveat | oui |
| **Corine Land Cover** (Copernicus) | nationale | 25 ha / 100 m | léger | bonne pour % agricole + type, plus grossier que RPG | possible (MVP rapide) | oui |
| **BNVD** (ventes de produits phyto par distributeurs) | nationale | code postal de l'acheteur | moyen (CSV bulk) | **biaisée** : lieu d'achat ≠ lieu d'épandage, coopératives concentrent les volumes | déconseillé | avec caveat fort |
| **Agreste** (recensement agricole, enquête pratiques culturales) | nationale | commune / canton / dept ; pratiques plutôt régionales | moyen | bonne en contexte, pas en pression locale fine | non | oui (contexte) |
| **Solagro** (IFT / usage pesticides cartographié) | nationale | maille fine selon publication | à vérifier (licence) | proxy prêt-à-l'emploi si licence ok | possible | oui |
| **Hub'Eau Naïades / ADES** (pesticides dans eaux de surface / nappes) | nationale | station | API | mesure d'exposition du milieu, rattachement station→commune approximatif | non (maille) | oui (shortlist) |

**Approche raisonnable** : proxy de pression = **CLC en MVP** (rapide), **RPG en
version fine** (buffer autour de la commune, pondéré par l'intensité de traitement
des cultures présentes). À présenter honnêtement comme « environnement agricole à
traitements fréquents à proximité », **pression et non exposition**. Synthèse
d'abord ; scoring envisageable plus tard avec libellé explicite.
Différenciation maximale : aucun concurrent grand public ne le fait.

---

## 2. Eau

| Source | Couverture | Granularité | Coût | Robustesse | Statut conseillé |
|---|---|---|---|---|---|
| **Contrôle sanitaire eau potable** (ARS / SISE-Eaux, via Hub'Eau `qualité_eau_potable`) | nationale | UDI / commune | API (déjà branché en partie) | mesurée = exposition réelle ; dynamique ; lacunes sur petites UDI | **nitrates : score-éligible** ; pesticides eau + conformité : synthèse/shortlist |
| nitrates | nationale | commune | déjà dans `eaufrance.ts` | stable, valeur moyenne fiable | score national possible |
| pesticides dans l'eau potable (total + substances) | nationale | commune | Hub'Eau, à ajouter | plus lacunaire, plus variable | synthèse / shortlist |
| conformité bactério / physico-chimique | nationale | commune | déjà dans `eaufrance.ts` | transitoire (un dépassement ponctuel ≠ danger durable) | synthèse |
| Naïades (surface), ADES (nappes) | nationale | station | API | qualité des milieux | contexte / synthèse |

**L'eau est la dimension la plus exploitable et la plus robuste** : communale,
mesurée, c'est littéralement ce qu'on boit, et la moitié est déjà branchée.
Les **nitrates dans l'eau potable** sont le seul candidat de ce chantier que je
considérerais **score-éligible** à terme (valeur moyenne stable, lecture claire).
Les pesticides dans l'eau, plus lacunaires, restent en synthèse.

---

## 3. Sols / métaux lourds

| Source | Couverture | Granularité | Robustesse | Risque faux signal | Statut |
|---|---|---|---|---|---|
| **GISSOL RMQS** | ~2200 sites, grille ~16 km | point interpolé | faible à l'échelle communale | **élevé** | synthèse seulement, prudence |
| `gissol.ts` (repo) : cadmium + carte dept | dept (grossier) + point | dept / point | très grossier | élevé | synthèse |
| BRGM / atlas géochimique | nationale | géologie | fond naturel, pas exposition | moyen | contexte |

Le cadmium est surtout un enjeu **alimentaire** (céréales complètes, sols
calcaires), pas résidentiel. À l'échelle communale, le maillage RMQS est trop
lâche pour une lecture crédible. **Synthèse uniquement, jamais score, priorité
basse.** Le risque de faire peur à tort dépasse la valeur informative.

---

## 4. Héritage industriel

Le bon objet n'est pas « ICPE » (installations actuelles, présence ≠ nocivité).
La question utilisateur est : « ce territoire porte-t-il une exposition liée à son
passé industriel ? »

| Source | Nature | Couverture | Risque biais | Statut |
|---|---|---|---|---|
| **BASOL** | ~6000 sites pollués appelant action publique | nationale, géoréférencée | modéré (sites avérés) | synthèse, nuance prudente |
| **SIS** (Géorisques, secteurs d'info sols) | réglementaire, ciblé | nationale | modéré | synthèse |
| **BASIAS** | inventaire historique, centaines de milliers de sites | nationale | **très élevé** (toute ville en a ; présence ≠ pollution) | éviter pour tout signal |
| ICPE | installations actuelles | nationale | élevé | hors sujet « héritage » |

Le moins mauvais objet est **BASOL + SIS**, en **synthèse seulement**, formulé
sans jugement (« plusieurs sites suivis par les pouvoirs publics à proximité »).
**Jamais dans le score** : pénaliser l'histoire industrielle d'un territoire est
exactement le biais social que nous refusons. Priorité basse.

---

## 5. Priorisation argumentée

Notation qualitative sur les 5 axes demandés (élevé = favorable ; pour le risque
d'interprétation, « faible » est favorable).

| Dimension | Impact utilisateur | Cohérence futur•e | Disponibilité | Risque interprétation | Différenciation |
|---|---|---|---|---|---|
| **Eau (nitrates + pesticides eau)** | élevé | élevée | **élevée** (communal, à moitié branché) | **faible** (mesuré) | moyenne à élevée |
| **Pesticides (pression RPG/CLC)** | élevé | élevée | moyenne (précalcul SIG) | moyen à élevé (pression ≠ exposition) | **très élevée** |
| **Sols / cadmium** | moyen | moyenne | faible (maillage lâche) | élevé | moyenne |
| **Héritage industriel** | moyen | moyenne (risque dérive) | moyenne (BASOL) | **très élevé** (biais) | moyenne |

### Recommandation

Ton intuition (pesticides > eau > sols > industriel) est juste sur la **valeur
stratégique**, mais je distingue deux lectures :

- **Quick-win le plus robuste : l'eau.** Communale, mesurée, déjà à moitié dans
  le repo, faible risque. C'est ce que je construirais **en premier**
  opérationnellement (nitrates score-éligible, pesticides-eau en synthèse).
- **Différenciateur stratégique : les pesticides.** C'est l'angle que personne
  d'autre n'offre et qui parle directement aux familles. À construire **en
  parallèle** comme couche **synthèse** (proxy de pression CLC puis RPG), scoring
  optionnel plus tard avec un libellé explicite « pression, pas exposition ».
- **Sols/cadmium et héritage industriel : synthèse seulement, prudence, priorité
  basse.** Jamais dans le score. Utiles pour nuancer une recommandation, risqués
  si mis en avant.

### Séquencement proposé (révisé après découverte IFT)

V1.6, maintenant, avant l'interface :
1. **Pression agricole (IFT + SAU + bio)** : couche **nationale** dans l'index
   (bulk ADEME déjà fait), préférence optionnelle `faible_pression_agricole` +
   synthèse. Libellés « pression / potentielle », jamais « exposition ». C'est le
   différenciateur, et il est immédiat.
2. **Eau** (nitrates, conformité, pesticides-eau) : **enrichissement synthèse de
   shortlist** via Hub'Eau (`eaufrance.ts`), pas de score national.
3. **Cadmium + héritage industriel (BASOL/SIS)** : **synthèse prudente**, jamais
   score, formulé sans jugement.

V2, recherche : nitrates eau en score national (bulk Hub'Eau ~35k), RPG fin,
pesticides-eau en score.

### Garde-fou éditorial

Toute donnée de santé environnementale est présentée comme **un facteur parmi
d'autres**, jamais comme un verdict. On nomme la nature du signal (pression vs
exposition, mesuré vs modélisé), on cite la source, et on assume l'incertitude.
Cohérent avec la plateforme de marque et les principes Lucides / Sourcés / Honnêtes.

---

*Document futur•e · chantier recherche comparateur · à arbitrer.*
