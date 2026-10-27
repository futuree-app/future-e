# FUT-82 · 1. Ce que futur•e possède réellement (inventaire de couverture)

> Établi le 27/10/2026 sur `origin/main` 06e043d0 (FUT-143 fusionnée), par lecture du code et des
> appels effectifs, jamais par la seule documentation. Les documents historiques (`DATA_SOURCES.md`,
> `SOURCES_MODULES_MATRIX.md`, benchmark du 10/10) ont servi de point de départ ; plusieurs de leurs
> affirmations sont périmées, signalées ci-dessous.

## Comment lire ce tableau

Une source peut exister à dix niveaux différents. Les niveaux employés :

| Code | Niveau | Preuve recherchée |
|---|---|---|
| doc | mentionnée dans la documentation | `*.md` |
| lib | présente dans le code | `src/lib/<source>.ts` |
| route | interrogée par une route ou un calcul actif | importée par `src/app/api/**` ou `src/lib/server/**` |
| contrat | intégrée au contrat de rapport | type de `logement-report-types.ts`, snapshot Autour, faits Territoire |
| écran | affichée au lecteur | importée par un composant `src/components/**` rendu en parcours |
| moteur | consommée par le moteur de décision | importée par `src/lib/decision/**` ou critère de `PREFERENCE_KEYS` |
| IA | lue par une synthèse ou AskFuture | `src/lib/ask/system-prompt.ts`, prompts de synthèse |
| outil | seulement sur une page ou un outil secondaire | `/agir/*`, `/savoir/*`, pages publiques par commune |
| dormante | intégrée mais débranchée | lib ou route sans appelant |
| abandonnée | retirée volontairement, avec motif | commentaire daté dans le code |

Méthode : matrice des importeurs de chaque lib (`grep` des imports hors tests), puis lecture des
points d'appel. Commande rejouable dans `mesures/README.md`.

## Inventaire par famille candidate

### A. Nuisances et santé environnementale

| Donnée | Niveaux atteints | Preuve | Constat |
|---|---|---|---|
| Bruit structurel au point (autoroute, route à grande circulation, voie ferrée dans un rayon, OSM) | lib, route, contrat, **écran** (Autour) | `logement-osm.ts`, `decision/autour-infrastructures.ts` importé par `AutourModule.tsx` et `AutourSection.tsx` | Affiché comme une distance, avec la limite « une distance n'est pas un niveau de bruit ». **Les aéroports n'y figurent pas.** |
| Calme sonore communal (exposition cumulée autoroutes, rail, aéroports, depuis le point de référence de la commune) | index, **moteur** (critère `calme_sonore`, `sante-facts.ts`), comparateur | `comparateur-index.json.gz` champ `calmeSonore`, `decision/sante-facts.ts` | Grain commune. À une adresse, la règle rend `uncertain` (correction du 28/07). Mesuré ici : à Villeneuve-le-Roi (zone B du PEB d'Orly) et Goussainville (zone C de Roissy), la source dominante calculée est le **rail**, pas l'aéroport. |
| Plans d'exposition au bruit (PEB) et plans de gêne sonore (PGS) | doc seulement | benchmark §1, §15 | **Absent du code.** |
| Cartes de bruit stratégiques (Lden, Ln) | doc seulement | `docs/cadrage-sources-par-echelle.md` §7 pile B | Jugées « chantier de données » le 28/07 (diffusion fragmentée). Confirmé : une seule CBS départementale (Ardennes) est publiée sur la Géoplateforme. |
| ICPE et Seveso | index, **moteur** (`faible_exposition_industrielle`, `sante-facts.ts`), comparateur | champ `expoIndustrielle` | Grain commune (site dominant + bassin). |
| IREP (rejets industriels déclarés) | lib, route orpheline (`/api/irep`), **outil** (`/api/proxy/irep` → `PollutionLookup` sur `/agir/pollutions-invisibles`) ; **abandonnée** dans le dossier | `src/app/api/georisques-logement/route.ts` (commentaire « IREP DÉBRANCHÉ LE 29/07/2026 »), `logement-report-types.ts` | Voir le dossier IREP : l'outil public lit un extrait ADEME **2019** de **1 495** établissements, depuis le **centre de la commune** (10 km), et affiche en cas de vide une phrase fausse (« Aucune installation industrielle classée ICPE recensée… ») : rejoué, Metz rend 0 quand le registre 2024 compte 25 établissements déclarants dans le même rayon. |
| Sites et sols pollués (SIS, BASIAS, BASOL) | **outil** seulement (`/api/proxy/sis`) | `PollutionLookup.tsx` | Volontairement hors dossier (« ne pas crier au loup », cadrage §9). |
| Cartofriches (friches, `sol_pollue`, `zonage_enviro`) | lib, route, contrat | `cartofriches.ts`, `georisques-logement` | Transporté dans le contrat Logement ; aucun composant ne l'importe ; ignoré par la synthèse (`logement-synthesis-cache.ts`). Le champ `zonage_enviro` (Natura 2000, ZNIEFF) n'est lu nulle part. |
| Qualité de l'air de fond (ADEME, PM2,5, NO₂) | index, **moteur** (`air_sain`, `sante-facts.ts`) | `comparateur-index` champ `viv` | Grain commune. |
| Indice Atmo du jour | route, **outil** | `PollutionLookup`, `/chaleur/[insee]`, `wizard-preview` | Non utilisé par le dossier. |
| Radon | **moteur** (`radon-facts.ts`, `territory-facts.ts`) | importé par `decision/*` | Le « vrai trou » du cadrage du 28/07 est **comblé** depuis (classe 3 seule parle). |
| Lignes électriques aériennes, pylônes | doc ; script de recherche | `scripts/research/gpu-servitudes-adresse.mjs` (servitude I4 explorée) | **Absent du produit.** Les servitudes lues au point sont AC1, AC2, AC4 seulement (`gpu-servitudes.ts`). |
| Antennes (ANFR) | doc | benchmark | **Absent.** Sondé le 09/07 sans succès (portail migré). |
| Pollution lumineuse | doc | benchmark | **Absent.** |

### B. Eau, inondations, nappes

| Donnée | Niveaux | Preuve | Constat |
|---|---|---|---|
| Inondation à l'adresse (PPRN, zonage réglementaire, ONRN, CatNat) | lib, route, contrat, écran, **moteur** | `pprn-zonage.ts`, `onrn-sinistralite.ts`, `decision/inondation-lecture.ts` (FUT-127, FUT-129) | Socle solide et récent. |
| Remontées de nappe | **commune seulement** : risque GASPAR « Remontées de nappes » (page publique `/inondation/[insee]`), type de péril CatNat, libellé PPRN | `src/app/(public)/inondation/[insee_code]/page.tsx`, `pprn-zonage.ts`, `comparateur/inondation-historique.ts` | **Aucune lecture au point.** Le rapport Géorisques au point (`resultats_rapport_risque`) porte un champ `remonteeNappe` que le code ne lit pas. |
| Piézométrie (Hub'Eau niveaux de nappe) | doc | benchmark | **Absent.** |
| Qualité de l'eau distribuée (Hub'Eau, ARS) | lib, route, **IA** (AskFuture), **outil** | `eaufrance.ts` → `system-prompt.ts`, `PollutionLookup` | Pas de carte dans le dossier ; lue par AskFuture. |
| Restrictions d'eau (VigiEau), écoulement des cours d'eau (ONDE) | lib, route, **écran** (Territoire), IA | `vigieau.ts`, `eaufrance.ts` → `QuartierClimatData.tsx`, `territoire/screen.ts` | Actif. |
| Prix et service de l'eau (SISPEA) | doc | benchmark | **Absent.** |
| Baignade | lib, **IA** seulement | `baignade.ts` → `system-prompt.ts` | Dormante côté écran. |

### C. Risques naturels observés (feu)

| Donnée | Niveaux | Preuve | Constat |
|---|---|---|---|
| Danger météorologique de feu projeté (DRIAS, IFM > 40) | index, **moteur**, comparateur (`faible_risque_feu`) | `comparateur-vie.ts` (`NORIFM40_yr`), `decision/climat-facts.ts` | Le critère du comparateur repose **uniquement** sur l'indice projeté. |
| Risque « Feu de forêt » déclaré pour la commune (GASPAR) | **moteur** (dossier), écran | `decision/territory-facts.ts` (« Vu à l'écran sur Lège-Cap-Ferret… ») | Grain commune. |
| Nombre d'incendies (champ `nombre_dincendies` du jeu ADEME `data_communes`) | lib, contrat, **IA** (« Incendies récents (nombre) ») | `commune-data.ts`, `ask/system-prompt.ts` l. 168 | **Provenance non documentée** dans la fiche du jeu ADEME (aucune des cinq sources décrites ne la produit). Voir contre-épreuves. |
| Feux observés (BDIFF) | doc (roadmap P4) | `SOURCES_MODULES_MATRIX.md` | **Absent.** |
| Obligations légales de débroussaillement (OLD) | texte seulement | `decision/climat-facts.ts` l. 237 (« L'obligation de débroussaillement… pèse sur… »), pages `/agir/feux-forets` | **Aucune lecture du zonage.** Le dossier évoque l'obligation sans savoir si l'adresse y est soumise. |

### D. Nature, paysage, biodiversité

| Donnée | Niveaux | Preuve | Constat |
|---|---|---|---|
| Caractère naturel (OSO 2023, 15 km) | index, **moteur** (critère `nature`) | `NATURE_TERRITORIAL.md`, `comparateur-scores.ts` | « Perçu comme naturel », ni biodiversité ni statut. |
| Espaces verts utilisables autour de l'adresse (OSM) | route, contrat, **écran** (Autour) | `logement-osm.ts`, FUT-73 | Actif. |
| Statuts de protection (Natura 2000, parcs, réserves, APB, ZNIEFF) | doc | benchmark | **Absent.** Seul indice : le champ `zonage_enviro` de Cartofriches, non lu. |

### E. Connectivité et infrastructures

| Donnée | Niveaux | Constat |
|---|---|---|
| Fibre, couverture mobile (ARCEP) | doc | **Absent.** Sondé le 09/07 (« identifiant de ressource inconnu »). |
| Réseaux de chaleur (France Chaleur Urbaine) | doc | **Absent.** |
| Bornes de recharge (IRVE) | doc (roadmap P10) | **Absent.** Les ZFE sont présentes (`zfe.ts`, route Logement, contrat). |

### F. Bâtiment, énergie, solaire

| Donnée | Niveaux | Constat |
|---|---|---|
| RNB (identité du bâtiment) | **écran** (FUT-80, fusionnée le 26/10) | `batiment-rnb.ts` importé par 14 fichiers. |
| DPE, audits, sélection contradictoire | **écran**, moteur (étiquette) | FUT-143 fusionnée le 26/10. |
| Rayonnement solaire communal (ERA5) | index, **moteur** (`ensoleillement_recherche`) | Grain commune. |
| Potentiel solaire de toiture, production photovoltaïque | doc | **Absent.** |
| Coûts de rénovation ADEME (2017-2018), artisans RGE | lib, **routes orphelines** | `renovation.ts`, `rge.ts` : aucune interface ne les appelle (dormantes, cadrage §9). |

### G. Conditions de vie et services

| Donnée | Niveaux | Constat |
|---|---|---|
| Accès aux écoles, à la culture (BPE pondérée) | index, **moteur** (`acces_ecoles`, `acces_culture`), Autour | « Accès, jamais la qualité » (commentaire de `PREFERENCE_KEYS`). |
| IPS, IVAL, IVAC | doc | **Absent par décision éditoriale** (audit du 09/07 : « puissant et toxique »). |
| Sécurité (SSMSI) | doc | **Absent par décision éditoriale.** |
| Fiscalité locale | doc | **Absent** : « fausse bonne découverte » (audit du 09/07, base locative manquante). |

### H. Morphologie, confort d'été

| Donnée | Niveaux | Constat |
|---|---|---|
| Îlot de chaleur urbain (CSTB) | lib, **écran** (`IcuExposure.tsx`, Logement/Autour) | 596 communes. |
| LCZ (Cerema) | doc | **Absent** ; jugé trop limité (benchmark §16). |
| BD TOPO généraliste | ponctuel (lien RNB, FUT-80) | Pas de lecture d'attributs d'environnement. |

## Ce que l'inventaire change par rapport aux documents existants

1. **`DATA_SOURCES.md` est périmé** sur IREP (le décrit comme branché au module Santé, qui n'existe plus) et
   ne mentionne ni RNB, ni radon, ni les lectures FUT-127. Il ne faut plus s'y fier comme registre.
2. **Le benchmark du 10/10 surestime ce qui est « déjà intégré »** pour IREP (« même dataset que
   `irep.ts` ») : le jeu lu par `irep.ts` n'est pas le registre officiel (voir dossier IREP).
3. **Deux dettes réelles hors périmètre** apparaissent et sont consignées au journal d'arbitrage :
   la phrase de vide de `PollutionLookup` (fausse réassurance sur une page publique) et le champ
   `nombre_dincendies` servi à AskFuture sans provenance.
4. **Le seul bruit lu à l'adresse ignore l'aérien** : ni les infrastructures Autour, ni la règle
   communale ne portent l'information réglementaire qui existe et se lit en 90 ms (dossier PEB).

## Statut des chantiers voisins (recontrôlé le 27/10/2026)

| Ticket | État | Effet sur FUT-82 |
|---|---|---|
| FUT-80 RNB | fusionné (PR #94, 26/10) | Le lien `BDTOPO_V3:batiment_rnb_lien_bdtopo` permet de rattacher le potentiel solaire du bâti (couche BD TOPO) au bâtiment RNB de l'adresse : dépendance utile en vague C. |
| FUT-143 DPE | fusionné (PR #96, 26/10) | Aucune. |
| FUT-81 urbanisme parcellaire | **PR #95 ouverte**, tête e73ec075, en revue | Le PEB et les servitudes I4 (lignes électriques) relèvent aussi du droit de la parcelle : la restitution PEB doit se coordonner avec la section « Statut réglementaire à cette adresse » que FUT-81 modifie. Ne pas ouvrir ce chantier avant sa fusion. |
| FUT-83 RNIC | backlog | Aucune dépendance relevée (copropriété ≠ données de cet audit). |
| FUT-118 Relevé | en cours (worktree `fut118-releve`) | Destinataire des fiches de restitution (`06-architecture-vague-a.md`). |
