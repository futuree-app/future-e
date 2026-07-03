# Module Logement

> Page de module, centrée sur la **frontière éditoriale**. Le cadrage vivant (audit du module
> existant, structure en 4 faces, faisabilité des données, séquence de build) vit dans
> `/memory/project_module_logement.md` et les rapports d'agents du 2026-07-02
> (`docs/rapports-agents/{product-strategist,design-critic,researcher,data-curator}/2026-07-02-*`).

## Objet

Logement = lecture au **grain ADRESSE** de CE logement précis. C'est le **seul module qui
descend à la parcelle et au point géocodé** ; c'est là qu'est son moat. Question cible :
« que dois-je engager sur ce logement ? » (acheter, négocier, renoncer, rénover, provisionner,
rester). Là où Territoire pose le décor communal, Logement traduit ce décor dans le bien que
l'utilisateur habite ou vise.

**Principe organisateur : le grain adresse.** Toute donnée qui n'existe qu'à l'échelle commune
appartient à Territoire, sauf si Logement ajoute le niveau parcelle, le point, ou le coût.
La valeur n'est pas une donnée neuve, c'est une **transformation nouvelle** (ADR-0002) : le
buffer autour du point, la gravité en euros d'un aléa, la dette datée d'un DPE.

## Périmètre : quatre faces

**Intègre :**
1. **Le bien lui-même (dedans)** : DPE (performance, confort d'été), audit de rénovation.
   Récit : le DPE lu comme dette datée (échéance légale), le confort thermique en 2050
   (DRIAS croisé à l'isolation).
2. **Les risques du BÂTI / de l'actif** : retrait-gonflement des argiles à la parcelle,
   inondation / submersion à l'adresse, sismicité, gravité sécheresse (coût moyen + fréquence
   ONRN, échelle commune, gaté par la représentativité). Ce qui menace le mur et sa valeur.
3. **L'autour immédiat (à votre porte)** : buffer de marche autour du point géocodé.
   Sources déjà en repo, sans API : équipements BPE au point (~800-1000 m), espaces verts OSM
   (gatés « cartographié »), distance à une infrastructure bruyante OSM (proxy d'exposition,
   jamais un décibel). En **liste + distances**, jamais un score composite.
4. **Ce que ça engage (le financier)** : assurance (voir règle de frontière), coûts de
   rénovation, statut réglementaire au point (PPR). Récit : le coût qu'un acquéreur doit
   documenter avant de s'engager. (Ancienne formule « le coût futur que le marché ignore
   encore » retirée le 2026-07-03 : elle supposait de savoir ce que le marché a intégré,
   soit exactement la supposition que l'ADR-0001 interdit.)

**Exclut** (renvoyer au module légitime) :
- **Expositions pollution / santé → Santé** : sols pollués et friches, industrie proche,
  radon, qualité de l'air. Logement garde ce qui menace le bâti, Santé prend ce qui expose le
  corps.
- **Agrégats communaux → Territoire / comparateur** : vie locale, calme sonore, démographie,
  typologie. Logement n'en fait la lecture qu'au grain adresse (« à votre porte »).
- **Trajets quotidiens → Mobilité.** **Composition sociale (HLM) : exclue** (donnée dormante).
- **Valeur immobilière individuelle : parquée.** Formulation corrigée le 2026-07-03 (« pas de
  donnée de marché honnête » était imprécis) : il **existe** des données de transactions
  honnêtes (DVF) et des effets statistiques observés (valeur verte notariale), mais **aucune
  ne permet d'estimer honnêtement la valeur actuelle ou future d'un logement précis** à partir
  de son adresse, de son DPE ou de ses risques. Restent interdits : estimation du bien, prix
  cible, décote climatique, trajectoire de valeur, label « résilient / fragilisé », application
  d'un % de valeur verte au bien, DVF en bloc de comparaison (il « arme le portail immo », hors
  moat). L'**engagement financier et réglementaire documenté**, lui, est déparqué (voir État de
  mise en œuvre, Face 4).
- **Ce que l'open data ne porte pas** : logement traversant, luminosité / orientation réelle.
  À ne pas promettre ; au mieux à demander à l'utilisateur.

## Règles éditoriales de frontière

- **Grain adresse obligatoire.** La ligne à tenir : **« à votre porte » (buffer adresse =
  Logement) vs « dans la commune » (agrégats = Territoire).** Réafficher un agrégat communal
  sous couvert de Logement est de la cannibalisation.
- **Assurance : documentée, jamais prédite.** L'objet autorisé de la phrase = la **matérialité
  passée** du risque (sinistres indemnisés, coût, fréquence, échelle commune, classes verbatim,
  gaté par la représentativité) + l'**exposition de la parcelle** + la **pédagogie du régime
  CatNat** (surprime nationale uniforme aujourd'hui, 20 % depuis le 01/01/2025 ; hook moat = une
  modulation *locale* de la surprime est débattue, **dé-datée dans l'UI** : ne plus nommer
  « rapport Langreney » ni « en cours », qui périment vite). Interdits fermes : « vous serez
  surprimé / refusé », « votre maison fissurera », « les maisons d'ici » (dire « les biens
  assurés »), tout euro faux-précis. **« Ne fixe pas le prix » est trop large** : dire « ne permet
  pas de prédire le montant ni les conditions » (la surprime n'est qu'une part de la prime MRH).
  **Classes verbatim ONRN reformatables typographiquement** si les BORNES restent identiques
  (« Entre 10 et 20k€ » → « 10 000 à 20 000 € ») : la doctrine verbatim interdit d'inventer une
  précision, pas de corriger une typo. **Fréquence ‰ = pour mille biens assurés** ; ne PAS inventer
  « par an » (définition ONRN du dénominateur/période non vérifiée).
- **Récit décisionnel en défaut, pas un inventaire d'indicateurs.** Pas de grille brute
  label/valeur en vue principale, pas de synthèse planquée derrière un bouton.
- **Aucun score composite ni verdict global calculé** (ADR-0001 : on pose, on ne note pas).
- **Dédoublement acheteur / résident** (comme résidence / découverte de Territoire) : même
  donnée, posture opposée. À instrumenter et mesurer avant de construire.
- **Toujours dire l'échelle** : ne jamais faire passer une classe communale (sécheresse ONRN)
  pour « votre adresse ».
- **Ne jamais conclure à la place de Santé ou Territoire.**

## État de mise en œuvre

- **Face 2 (risques du bâti / matérialité) : PARTIELLEMENT BRANCHÉE (2026-07-03).** Le bloc
  « Ce que le risque a déjà coûté ici » affiche la **sinistralité ONRN** (coût moyen + fréquence
  des sinistres CatNat indemnisés 1995-2021) pour **sécheresse** ET **inondation** (tous types),
  à l'échelle commune, classes verbatim, **gaté par la représentativité** (≥ « Entre 30 et
  50% », sinon `aucun`/`faible_repr`/`indispo`), avec pédagogie CatNat non prédictive
  (« ce passé local ne fixe pas le prix de votre assurance ») et attribution ONRN. Lib
  `src/lib/onrn-sinistralite.ts`, données `data/onrn-{secheresse,inondation}.json`. Reste de la
  Face 2 (RGA/inondation/sismicité à la parcelle déjà là via Géorisques) inchangé.
- **Limite documentée** : les 107 communes fusionnées 2021→courant tombent en `indispo`
  (mapping non codé). Bon patron de désamorçage d'inférence à réutiliser : « ce passé local ne
  fixe pas le prix de votre assurance ».
- **Face 3 (l'autour immédiat) : BRANCHÉE (2026-07-03).** Bloc « Autour de cette adresse » =
  buffer local au point géocodé (jamais un temps de marche), 3 briques hiérarchisées : vie
  quotidienne **BPE** (socle, local : plus proche par catégorie santé/alimentation/éducation/
  transports/services, distances brutes à vol d'oiseau, cap 3 km) > **infra bruyantes OSM**
  (vigilance, « à ~X m d'un axe cartographié », jamais un dB) > **espaces verts OSM** (repère,
  « cartographié », jamais « pas de verdure »). Architecture : shards BPE en grille
  (`data/bpe-points`, `populate-bpe.py --face3-shards`) ; OSM récupéré **à la génération** via
  Overpass `out geom`, mis en cache par cellule (`osm_tile_cache`, service-role) et **figé dans un
  snapshot** (table `logement`, artefact sauvegardé par (user, commune) + posture
  residence/prospection) ; l'affichage ne touche JAMAIS Overpass. Distances point↔géométrie
  (segments/polygones), pas point↔sommet. `sourceStatus` par source (panne observable). Vérifié
  bout-en-bout (Toulouse : rail 1006 m, vert 40 m, cache chaud). Libs pures TDD (18 tests).
  Spec/plan : `docs/superpowers/{specs,plans}/2026-07-03-logement-face3-*`.
- **Face 4 (le financier) : direction tranchée le 2026-07-03, non branchée.** Décision après un
  aller-retour ChatGPT (trace : `docs/board/2026-07-03-decision-face4-valeur-vs-engagement.md`) :
  la valeur immobilière individuelle **reste parquée** ; l'**engagement financier et réglementaire
  documenté** se déparque. Son seul nouveau morceau **industrialisable aujourd'hui** est le
  **statut réglementaire au point** (en zone réglementée oui/non ; régime prescriptions /
  interdiction si disponible ; code + libellé local ; date d'approbation ; renvoi au règlement
  officiel). Il vit en **Face 2** (exposition), pas dans une Face 4 autonome ; la sortie transverse
  « À vérifier avant de décider » porte la conclusion actionnable, adaptée à la posture (résident :
  « ce que ce logement peut vous conduire à adapter, vérifier ou anticiper »). Le reste (audit,
  coût conventionnel DPE, échéances passoires) est **déjà affiché en Face 1**. **NE PAS construire** :
  synthèse des droits à construire, verdict de « marge de manœuvre », éligibilité Barnier « pour ce
  bien », Face 4 dupliquant l'énergétique. **Spike API FAIT le 2026-07-03 (16 adresses bord d'eau,
  12 intersectantes) : `/api/v2/gaspar/pprn` — celui qu'on appelle DÉJÀ — SUFFIT.** `code` (typeReg
  COVADIS normalisé) + `libelle` + `codeZone` remplis **12/12** sur les points intersectants ; régimes
  vus `02` Prescriptions / `03` Interdiction / `04` Interdiction stricte, + `nom` de zone auto-descriptif
  + `libPpr` + `dateModification`. La couche de zonage cartographique n'est **pas** nécessaire.
  Restituable au point : régime + code/libellé de zone local + nom du PPR + date. Hors portée sans le
  règlement : prescriptions chiffrées (extension X m², cote de plancher). Cas `zoneRegExists:false`
  avec PPRN présents (Agen : 3 PPRN) = « la commune a un PPRI, ce point n'intersecte pas le zonage »,
  jamais « pas exposé ». **Brique « Statut réglementaire à cette adresse » BRANCHÉE (2026-07-03, `main`).** En Face 2, entre
  l'exposition (« Risques du bâti ») et la sinistralité ONRN communale. Lib pure testée
  `src/lib/pprn-zonage.ts` (`buildRegulatoryPlans` : écarte les plans hors zone au point, ordonne par
  régime le plus contraignant, gère l'état C listTypeReg vide) ; `georisques.ts` remonte
  `regulatoryPlans` (address + parcel, transparent via la route) ; rendu `LogementModule.tsx` : terme
  officiel + glose, multi-plans multi-aléa nommés (`modeleProcedure`), 3 états A/B/C distincts, date =
  « fiche mise à jour le » (jamais « approuvé »), lien fiche Géorisques depuis `idGaspar` (HTTP 200
  vérifié), jamais les travaux autorisés/interdits. Chips PPRN retirées du bloc « Risques du bâti »
  (dé-doublonnage, décision porteur). **Grain « adresse » (jamais « parcelle »)** : l'API répond au
  point géocodé, pas à la géométrie cadastrale (bug corrigé le 2026-07-03). Polissage même jour :
  couleur du titre par sévérité réglementaire (prescriptions ambre / interdiction orange /
  interdiction stricte rouge, plus de rouge global sur une simple prescription) ; date =
  « Date de référence Géorisques » (jamais « approuvé » ni « fiche mise à jour » : seul
  `dateModification` existe, sémantique non certaine). **Bloc sinistralité refondu même jour** :
  titre « Sinistralité indemnisée dans la commune » (l'ancien « Ce que le risque a déjà coûté ici »
  sur-promettait), métriques (coût moyen / fréquence) au lieu d'un paragraphe, classes ONRN
  reformatées, « inondation (tous types) » sans liste fausse-exhaustive, phrase assurance corrigée.
- **Doctrine de divulgation progressive (2026-07-03, réutilisable hors Logement).** Un bloc dense
  doit répondre DANS L'ORDRE : « qu'est-ce que ça veut dire ? » (Niveau 1, phrase langage courant en
  tête) → « quels sont les faits ? » (Niveau 2, métriques valeur-en-évidence, ‰ traduit en « pour
  1 000 ») → « qu'est-ce que j'en fais ? » (sortie décisionnelle adaptée à la posture) → « comment
  c'est produit ? » (Niveau 3, méthode/sources/mentions repliées dans un `<details>`, jamais
  supprimées, jamais au premier plan). Appliqué à la Face 2 : composants `Disclosure`, `Metric`,
  `Face2Implication` dans `LogementModule.tsx`. Garde-fous : **pas de comparaison générée** entre
  périls (« la sécheresse a été plus fréquente que… » = conclusion, viole ADR-0001) ; **pas de
  chapeau « ce qu'il faut retenir » global** (redondant avec la synthèse IA) ; le terme réglementaire
  officiel reste présent, en secondaire sous la phrase courante (jamais remplacé par une version
  édulcorée). Interdits UX : « risque élevé », « logement à risque », jauge rouge, score 1-10.
- **Face 1 (l'enveloppe) : non branchée** (intake étage / orientation / etc. à MESURER avant de
  construire, cf. `/memory/project_module_logement.md`). Face 2 étendue (contraste PPRI / TRI /
  nappe au point) et vision module = `docs/board/2026-07-03-vision-module-logement-chatgpt.md`.

## Liens

`doctrine/positionnement.md`, `doctrine/editoriale.md`, `doctrine/data.md`,
`modules/territoire.md`, `adr/ADR-0001` (pas de note composite), `adr/ADR-0002` (le moat est la
transformation), `recherches/inventaire-sources.md`, `/memory/project_module_logement.md`.
