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
   rénovation. Récit : le coût futur que le marché ignore encore.

**Exclut** (renvoyer au module légitime) :
- **Expositions pollution / santé → Santé** : sols pollués et friches, industrie proche,
  radon, qualité de l'air. Logement garde ce qui menace le bâti, Santé prend ce qui expose le
  corps.
- **Agrégats communaux → Territoire / comparateur** : vie locale, calme sonore, démographie,
  typologie. Logement n'en fait la lecture qu'au grain adresse (« à votre porte »).
- **Trajets quotidiens → Mobilité.** **Composition sociale (HLM) : exclue** (donnée dormante).
- **Valeur immobilière prédite : parquée** (pas de donnée de marché honnête aujourd'hui ;
  question « le lecteur veut-il un chiffre de prix ? » non tranchée).
- **Ce que l'open data ne porte pas** : logement traversant, luminosité / orientation réelle.
  À ne pas promettre ; au mieux à demander à l'utilisateur.

## Règles éditoriales de frontière

- **Grain adresse obligatoire.** La ligne à tenir : **« à votre porte » (buffer adresse =
  Logement) vs « dans la commune » (agrégats = Territoire).** Réafficher un agrégat communal
  sous couvert de Logement est de la cannibalisation.
- **Assurance : documentée, jamais prédite.** L'objet autorisé de la phrase = la **matérialité
  passée** du risque (sinistres indemnisés, coût, fréquence, échelle commune, classes verbatim,
  gaté par la représentativité) + l'**exposition de la parcelle** + la **pédagogie du régime
  CatNat** (surprime nationale uniforme aujourd'hui, débat post-Langreney sur la modulation
  locale). Interdits fermes : « vous serez surprimé / refusé », « votre maison fissurera »,
  « les maisons d'ici » (dire « les biens assurés »), tout euro faux-précis.
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
- **Faces 1, 3, 4 : non branchées** (voir `/memory/project_module_logement.md`).

## Liens

`doctrine/positionnement.md`, `doctrine/editoriale.md`, `doctrine/data.md`,
`modules/territoire.md`, `adr/ADR-0001` (pas de note composite), `adr/ADR-0002` (le moat est la
transformation), `recherches/inventaire-sources.md`, `/memory/project_module_logement.md`.
