# Design : critère « Loin des sites industriels à risque » (`faible_exposition_industrielle`)

Date : 2026-06-05
Statut : validé (brainstorming), prêt pour writing-plans
Reconnaissance data : `docs/superpowers/research/2026-06-05-sante-environnementale-reconnaissance.md`

## 1. Identité

- Clé technique : `faible_exposition_industrielle` (interne, honnête : on mesure une exposition
  à des sites industriels).
- Libellé utilisateur : **« Loin des sites industriels à risque »** (vocabulaire utilisateur,
  pas administratif : un·e utilisateur·rice ne connaît ni « Seveso » ni « ICPE »).
- Opt-in, autonome. 28e critère. Distinct de `air_sain` (air de fond PM2.5/NO2) et de
  `faible_pression_agricole` (agriculture).

Première brique d'un futur volet « santé environnementale » : on NE fait PAS un composite flou
(industrie + sols + friches), on livre UNE brique nette et défendable. Sols pollués / friches /
carrières / axes logistiques sont hors V1 (sources instables ou hors sujet, cf. §11).

## 2. Intention & glose

Mesure l'**éloignement des installations industrielles classées à risque** (sites Seveso, IED,
ICPE industrielles) autour du lieu de vie. Descriptif : une **présence administrative**, jamais
un niveau de pollution ni un risque sanitaire avéré.

Glose (UI / tooltip), RESSERRÉE pour ne pas sur-promettre (cas Marcel-Paul, cf. §11) :
> Densité d'installations industrielles classées EN ACTIVITÉ à proximité (sites Seveso, IED).
> Mesure leur présence, pas un niveau de pollution ni un risque sanitaire avéré. Ne couvre pas
> les anciens sites pollués ni les friches (signal distinct à venir).

Note libellé : le chip reste « Loin des sites industriels à risque » (vendeur, et Seveso = risque
est factuel) ; c'est la tooltip qui porte le carve-out « en activité, pas l'héritage pollué ».

## 3. Doctrine (décrire jamais juger, sujet anxiogène)

- On s'appuie sur la **nomenclature réglementaire** (ICPE, Seveso, IED existent légalement) :
  c'est un fait administratif, pas notre opinion. On ne dit JAMAIS « dangereux », « toxique »,
  « pollué », « malsain ».
- On dit explicitement ce qu'on NE mesure PAS : pollution réelle, exposition sanitaire vécue.
- Opt-in strict : le subScore n'est calculé que si la clé est demandée. Loin de tout = score
  haut (jamais une pénalité par défaut du rural).
- Le score HAUT = éloigné des sites à risque (famille des préférences « faible_X »).

## 4. Source (gate data FRANCHI, vérif live 2026-06-05)

Géorisques, API `installations_classees` (ICPE). Vérifié en appel réel :
- **137 103 installations nationales**, géolocalisées au point (lat/lon).
- Fraîches : `date_maj` jusqu'à 2026-05-19.
- Champs de gravité : `statutSeveso` (« Seveso seuil haut » / « Seveso seuil bas »), `ied`
  (bool), `industrie` (bool), `regime`, `prioriteNationale`, + drapeaux `bovins/porcs/volailles`,
  `carriere`, `eolienne`.
- Fetch national, 2 voies (à confirmer à l'implémentation, préférer la 1re) : (a) **geojson
  national** sur data.gouv « Base des installations classées (ICPE) » ; (b) pagination API,
  plafond `page_size=1000` -> 138 pages. Recherche géo `rayon`+`latlon` OK aussi (tuilage
  possible). PLUS besoin de 34 788 appels par commune.

Piège PLM : la donnée est indexée par code COMMUNE (Marseille 13055), pas arrondissement
(13201 = 0 résultat). CONTOURNÉ PAR LA GÉOMÉTRIE (cf. §6) : on travaille sur le nuage de points
national, jamais sur une jointure code_insee, donc le piège disparaît.

## 5. Filtre : ce qui compte

On GARDE : Seveso (seuil haut, seuil bas), IED (`ied=true`), ICPE `industrie` en régime
autorisation/enregistrement.

On EXCLUT (sciemment) :
- élevages (`bovins`/`porcs`/`volailles`) : hors sujet, esprit déjà couvert par
  `faible_pression_agricole`. Pénaliser une commune pour un élevage casserait la confiance.
- éoliennes (`eolienne`) : ICPE mais zéro enjeu pollution.
- carrières (`carriere`) : nuisance poussière/bruit/trafic, pas l'imaginaire « industrie lourde » ;
  c'est de la nuisance locale, déjà l'esprit de `calme_sonore`. Réserve V2.
- régime déclaratif : trop banal (poids 0, exclu).

## 6. Pondération par gravité (la hiérarchie est dans la donnée)

Le compte brut mentirait (vérif live : Paris 1427 ICPE / 0 Seveso ; Marseille 411 / Seveso seuil
haut). Poids de DÉPART (brutaux exprès, on réduira l'écart par sonde si besoin, l'inverse est
plus dur) :

| Classe | Poids |
|---|---|
| Seveso seuil haut | 10 |
| Seveso seuil bas | 5 |
| IED | 3 |
| ICPE industrie (autorisation / enregistrement) | 1 |
| Déclaratif / autres | 0 (exclu) |

## 7. Exposition : hybride dominant + bassin

Doctrine porteur (à encoder littéralement) :
> L'exposition industrielle est d'abord déterminée par le site le plus préoccupant à proximité,
> puis légèrement ajustée par la concentration d'installations autour.

```
contribution(site) = poids(site) × max(0, 1 - d/R)      # d = distance chef-lieu -> site
dominant  = max sur les sites de contribution(site)      # le site le plus préoccupant proche
bassin    = somme sur les sites de contribution(site)     # la concentration alentour
E         = dominant + λ × bassin                         # λ FAIBLE
```

- Distance depuis le **chef-lieu** (lat/lon de l'index), par **géométrie** (PLM contourné).
- Rayon `R`, demi-vie `H` (cf. §8) et `λ` : boutons PROVISOIRES, FIGÉS PAR SONDE sur témoins.
- INVARIANT À GARANTIR (gate) : un site majeur proche pèse TOUJOURS plus qu'un empilement de
  petites ICPE. `λ` est calé pour que jamais une somme de poids-1 ne dépasse un Seveso seuil
  haut proche. Le terme `dominant` est là précisément pour blinder cet invariant ; `bassin` ne
  fait qu'ajouter le signal de concentration (Fos > un Seveso isolé).

## 8. Score & null

```
score = round(100 × 0.5^(E / H))
```
- E = 0 (loin de toute source) -> **score 100**. Absolu (pas de percentile), comme `calme_sonore`.
- subScore = `c.expoIndustrielle?.score ?? 100` : **JAMAIS null** au sens « non noté ». L'absence
  de site est la mesure même (loin = propre = 100), pas une donnée manquante.
- Score haut = éloigné des sites à risque.

## 9. Récit (NARRATIF, gaté, SANS chiffre)

Deux niveaux en langage courant (l'utilisateur ne voit jamais « Seveso » / « IED ») :

| `sourceDominante` interne | Récit affiché |
|---|---|
| `seveso_haut` / `seveso_bas` | « la proximité d'un site industriel à risque majeur » |
| `ied` / `industrie` | « la proximité d'un site industriel » |

- « à risque majeur » = sens factuel de Seveso (sites à risque d'accident majeur), pas un
  jugement. Les sites IED/industrie n'ont PAS « à risque » (ce serait sur-vendre).
- AUCUN chiffre (doctrine : pas de donnée précise en synthèse/AskFuture). La distance reste
  interne. null = silence (aucun site préoccupant assez proche pour être nommé).
- Construit au match -> transmis par le map results de `OuVivreClient.tsx` -> gaté côté route
  synthesize par « critère demandé » (même frontière que `calme_sonore` / `demographie`).

## 10. Plomberie

Script : `scripts/populate-exposition-industrielle.py` (venv `.venv-bpe`, modèle
`populate-calme-sonore.py`) : fetch national (geojson data.gouv, fallback pagination API) + dédup
par `codeAIOT` + filtre §5 + classe de gravité + grille + exposition hybride §7, modes
`--selftest` (assertions, dont l'invariant dominant>bassin) / `--summary` / `--probe` / `--matrix`
/ `--write-index` / `--refresh`.

Champ index : `expoIndustrielle: { score, sourceDominante: 'seveso_haut'|'seveso_bas'|'ied'|'industrie'|null }`.
(distance interne possible en plus si utile à une fiche, mais JAMAIS exposée au récit.)

Câblage TS (7 points, cf. câblage `calme_sonore`) :
1. `PREFERENCE_KEYS` + type `IndexCommune` (champ `expoIndustrielle`).
2. `subScore` : `c.expoIndustrielle?.score ?? 100`.
3. `REASON_POS` (« à l'écart des sites industriels à risque ») / `REASON_NEG` (Record exhaustif).
4. `PREFERENCE_LABELS` / `PREFERENCE_TOOLTIP` (`comparateur-labels.ts`).
5. `AMBIENT_DIMENSIONS` (bandes : à l'écart / présence intermédiaire / environnement industriel marqué).
6. `MatchResult` (champ `expoIndustrielle`) + helper récit §9 + assemblage + transmission
   `OuVivreClient.tsx` + `PREF_LABELS` et gating dans `synthesize/route.ts`.
7. Routage `parse/route.ts` + désambiguïsation (« loin des usines », « éviter les zones
   industrielles », « pas de site Seveso à côté »).

## 11. Sonde à gates

1. **Gate data** : FRANCHI (vérif live). Reste à confirmer la voie de fetch (geojson national
   vs pagination) au début de l'implémentation.
2. **Sonde poids / λ / R / H** sur communes témoins -> gate porteur -> matrice témoins -> gate
   porteur -> patch index.

Témoins LOURDS obligatoires (doivent sortir en tête d'exposition) :
Fos-sur-Mer, Feyzin, Lacq, Gonfreville-l'Orcher, Donges.
Contrôles : une commune pleine de petites ICPE SANS Seveso (ne doit PAS dépasser les lourds),
une commune rurale vide (attendue à 100). Codes INSEE à vérifier par NOM dans l'index avant la
sonde (piège connu : faux témoins, PLM = arrondissements).

## 12. Hors V1 (V2 ou signal de fiche)

Sols pollués (BASOL/BASIAS/SIS, en refonte InfoSols 2024-25, instable), friches (Cartofriches,
non exhaustif -> faux « rien ici »), carrières, axes logistiques. Plutôt en signal de fiche
qu'en score tant que les sources ne sont pas stables et sans trou.

**Axe V2 distinct « héritage industriel & sites pollués »** (décidé après le cas Marcel-Paul).
La V1 mesure le risque industriel EN ACTIVITÉ ; elle rate volontairement l'HÉRITAGE pollué.
Exemple canonique : le chantier Marcel-Paul à La Rochelle (ancienne usine à gaz EDF-GDF, sols
pollués HAP/BTEX/cyanures, dépollution en cours) est `regime=Déclaration`, NON Seveso, NON IED :
invisible en V1, et c'est CORRECT (ce n'est pas un risque industriel actif). Il appartient à un
futur axe « héritage », à construire comme critère ou signal de fiche SÉPARÉ, jamais fondu dans
l'exposition industrielle active (réalités et données différentes). Sources à EXPLORER (pas
seulement BASOL/BASIAS, instables) ; Marcel-Paul = témoin de référence : si l'axe héritage ne le
fait pas ressortir, il est raté.
