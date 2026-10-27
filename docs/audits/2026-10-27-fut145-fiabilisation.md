# FUT-145 · Trois lectures qui disaient plus que leurs preuves

Date : 27/10/2026. Base : `main` à `06e043d0` (merge de la PR #96). Défauts découverts par l'audit FUT-82
(`docs/audits/2026-10-27-fut82-audit-donnees.md`, branche `docs/fut-82-audit-donnees`, commit `77349bf9`),
dont les mesures servent ici de témoins, jamais de valeurs codées dans le produit. Aucune donnée nouvelle,
aucun score, seuil, pondération ni rang modifié.

## A · /agir/pollutions-invisibles affirmait une absence d'ICPE

### Avant (reproduit sur `main`)

Source ADEME réelle, rayon de 10 km depuis le centre communal (coordonnées de geo.api.gouv.fr, comme la page) :

| Commune | Extrait ADEME 2019 | Registre 2024 (audit FUT-82) | Ce que la page écrivait |
|---|---|---|---|
| Metz | 0 | 25 | « Aucune installation industrielle classée ICPE recensée dans un rayon de 10 km autour de cette commune selon les données ADEME. » |
| Montlouis-sur-Loire | 0 | 23 | idem |
| Abbeville | 0 | 7 | idem |
| Saint-Amand-Montrond | 0 | 6 | idem |
| Guéret | 0 | 5 | idem |
| Paris 4e | 8 | 121 | une liste de 8, sans dire qu'elle est partielle |

Pannes simulées sur `getIrepNearPoint` :

| Cas | Réponse sur `main` | Conséquence à l'écran |
|---|---|---|
| Amont 500 | `{count: 0, installations: []}` | phrase d'absence |
| Amont 502 | `{count: 0, installations: []}` | phrase d'absence |
| HTTP 200 sans `results` | `{count: 0, installations: []}` | phrase d'absence |
| Réseau coupé | exception → route 502 | « Données temporairement indisponibles » (déjà correct) |
| 45 lignes dans la source, 20 servies | `{count: 20}`, aucun signal | liste présentée comme complète |

### Décision

L'extrait compte environ 1 500 établissements, une petite partie du registre national ; même non vide, il
sous-compte d'un ordre de grandeur. Il ne permet ni de conclure à une absence ni de dresser une liste utile.
Le bloc interactif IREP est donc remplacé par un bloc explicatif : ce que le registre recense (déclarants
au-delà de seuils réglementaires, pas toutes les ICPE), pourquoi la recherche n'est pas proposée ici (extrait
de 2019 incomplet), la limite sanitaire (une déclaration porte sur des quantités rejetées, pas sur une
exposition du logement), et un lien vers la recherche officielle Géorisques
(`https://www.georisques.gouv.fr/risques/registre-des-emissions-polluantes/accueil`). Les trois autres
recherches restent. IREP reste débranché du dossier payé ; le commentaire de `georisques-logement` qui
présentait l'extrait comme rebranchable tel quel est corrigé.

### Après

- La page n'appelle plus `/api/proxy/irep` et ne contient plus aucune phrase d'absence.
- `src/lib/irep.ts`, encore servi par `/api/proxy/irep` et `/api/irep`, est durci :

| Cas | Réponse après |
|---|---|
| Résultats présents | `count`, liste triée par distance, `tronque: false`, `source: { producteur: "ADEME", jeu: "data_risk_IREP", millesime: 2019, exhaustif: false }` |
| Vide dans l'extrait | `count: 0`, `source.exhaustif: false` |
| Amont 500 / 502 | exception `irep:<statut>` → route 502 |
| HTTP 200 sans `results` | exception `irep:reponse-sans-resultats` → route 502 |
| Réseau coupé | exception → route 502 avec message |
| Page coupée (`total` > lignes servies, ou page pleine sans `total`) | `tronque: true` |

## B · AskFuture recevait « Incendies récents (nombre) »

### Avant

`formatAdemeBlock` (`src/lib/ask/system-prompt.ts`) poussait `- Incendies récents (nombre) : 41` pour
Fos-sur-Mer, depuis le champ ADEME `nombre_dincendies` (période et source primaire inconnues).

### Recensement des chemins vers un modèle

`grep` sur `.incendies` et `nombre_dincendies` : seul `system-prompt.ts` lisait le champ. Le rapport logement
ne transmet que nom et population de la commune (`logement-synthesis-cache.ts`) ; le snapshot Territoire
lit densité et boisement, jamais ce champ ; les routes du comparateur et `/qna` ne passent pas par
`commune-data`. Le champ brut reste servi par `/api/commune-data`, sans affichage ; un commentaire au mapper
interdit de l'afficher ou de le transmettre.

### Après : capture du `system` réel

Route `/api/ask` exécutée telle quelle ; SDK Anthropic et Supabase simulés ; enrichissement **réel** (ADEME,
DRIAS, Géorisques, GASPAR interrogés en direct) :

| Commune | `incendies` brut ADEME | « Incendies » dans le system | DRIAS IFM > 40 transmis (+2 / +2,7 / +4 °C) | Géorisques « feux de forêt » |
|---|---|---|---|---|
| Fos-sur-Mer (13039) | 41 | non | 69 / 72 / 87,5 j | oui |
| Monteux (84080) | null | non | 33,5 / 37,5 / 56 j | oui |
| 69114 (rattachement, données de l'ancien code) | null | non | 3 / 5 / 8 j | non |
| 33008 (périmètre modifié, abstention ADEME) | null | non | 2 / 4 / 5,5 j | non |

Dans les tests (fixtures réelles relevées le 02/10) : Fos-sur-Mer (41) et Chamonix (2) avec valeur, Monteux
sans valeur, et une commune au périmètre antérieur portant une valeur fictive (4817) : la ligne et la valeur
sont absentes du system dans tous les cas ; DRIAS, Géorisques, GASPAR et les autres faits ADEME restent.

## C · Le comparateur appelait « risque de feu » un rang de météo projetée

### Calcul vérifié

`subScore("faible_risque_feu") = 100 - percentile national` des jours d'indice forêt-météo > 40 (DRIAS,
scénario gwl20, soit +2,7 °C en France vers 2050, `scripts/build-comparateur-index.mjs`). Paliers par coupes
66 / 34 (`bandIndex`) : des terciles de position RELATIVE, jamais un seuil de risque absolu. Communes témoins :
Brest (1 jour par an, tiers favorable), Martillac (3 jours, intermédiaire), Châteauneuf-le-Rouge (26,5 jours,
tiers défavorable). Saint-Médard-en-Jalles, 5,5 jours, est dans le tiers défavorable : le palier est un rang.

### Textes

| Surface | Avant | Après |
|---|---|---|
| Ligne de comparaison | Feu | Météo propice aux feux |
| Paliers | Risque de feu faible / Risque modéré / Risque élevé | Moins de jours propices aux feux qu'ailleurs / Nombre intermédiaire de jours propices aux feux / Plus de jours propices aux feux qu'ailleurs |
| Aide | L'exposition du secteur au risque d'incendie. | Nombre de jours où la météo favorise les feux de forêt, projeté vers 2050 et comparé aux autres communes. Il ne dit pas à lui seul le risque d'incendie de la commune ni d'une adresse. |
| Donnée absente | Non concernée | Non mesurée |
| Raison de carte | faible risque de feu | météo moins propice aux feux |
| Compromis | risque de feu notable | météo plus souvent propice aux feux |
| Signal AskFuture comparateur | risque de feu plus faible / intermédiaire / plus marqué | météo moins souvent / à un niveau intermédiaire / plus souvent propice aux feux, vers 2050 |
| Note d'économie locale | exposées au risque de feu | exposées à une météo propice aux feux |
| Bulle de la puce de préférence | (aucune) | même texte que l'aide |
| Liste des signaux, prompt AskFuture comparateur | risque de feu | météo propice aux feux |

Le souhait du lecteur garde ses mots (« un faible risque de feu ») dans la puce, le parseur et la synthèse,
comme pour l'inondation (FUT-129) ; la bulle dit ce qui est lu.

### Équivalence avant/après des résultats

Sept recherches rejouées sur le vrai moteur et l'index, avant (sur `main`) puis après :

1. feu seul, Var + Bouches-du-Rhône ;
2. feu seul, Gironde + Landes ;
3. feu + nature, Hérault ;
4. feu + vie locale + soins, Rhône + Isère ;
5. feu + mer, Bretagne ;
6. feu, La Réunion (aucun résultat, avant comme après) ;
7. témoin sans feu : inondation, Charente-Maritime.

30 résultats et 6 comparaisons complètes. Ordre, compatibilités, couverture, sous-score feu, et pour chaque
cellule des comparaisons : avantage, disponibilité, alerte. **Strictement identiques.** Seuls les textes changent.

## Recette navigateur

Serveur de production local (`next build` puis `next start`), `ANTHROPIC_API_KEY` invalide et
`ANTHROPIC_BASE_URL` inatteignable. Chrome (Playwright), bureau 1440 × 900 et mobile 390 × 844.

| Contrôle | Bureau | Mobile |
|---|---|---|
| /agir/pollutions-invisibles : bloc « Installations industrielles déclarant des rejets », lien Géorisques | oui | oui |
| Aucune phrase d'absence, aucun appel à `/api/proxy/irep` | oui | oui |
| 4 blocs (IREP explicatif + sites pollués, ATMO, eau) | oui | oui |
| Débordement horizontal | non | non |
| /comparateur Brest, Martillac, Châteauneuf-le-Rouge, thème Risques ouvert : trois paliers dans le bon ordre, « Avantage Brest » | oui | oui |
| /comparateur Châteauneuf-le-Rouge, Montauroux, Fuveau : « Plus de jours… qu'ailleurs », à égalité | oui | oui |
| Aide affichée | au survol, oui | **non** (anomalie 3 ci-dessous, préexistante) |
| Ancien vocabulaire (« risque de feu », « Risque élevé ») dans la page | aucun | aucun |
| Appel au modèle pendant la recette | 0 | 0 |

`/ou-vivre` n'a pas été recetté au navigateur : sa recherche passe par le parseur (appel au modèle), exclu
ici. Ses raisons, compromis et signaux sont vérifiés sur le moteur réel (tests C et équivalence ci-dessus).

## Contrôles

| Contrôle | Résultat |
|---|---|
| `src/lib/fut145-fiabilite.test.ts` | 18 / 18 |
| Même fichier sur `main` non corrigé | 13 échecs ; 5 réussites = invariants (dossier payé sans IREP, réseau coupé déjà en 502, commune sans valeur, faits légitimes transmis, rang inchangé) |
| `npm test` complet | 3 503 / 3 503 |
| `tsc --noEmit` | 0 erreur |
| `eslint` sur les fichiers modifiés | 0 erreur (1 avertissement préexistant : `tailleVilleFrom` inutilisé) |
| `npm run lint` sans argument | plante sur `main` à l'identique (règle `react/no-unescaped-entities` sans plugin) |
| `next build` | réussi |
| Appel Anthropic réel | aucun (SDK simulé dans les tests, clé invalide et adresse inatteignable partout) |

## Anomalies distinctes, non corrigées ici

1. **Points forts contradictoires (à traiter avant lancement).** Dans `matchProjects`, quand aucun critère
   d'une commune n'atteint 55, la carte affiche quand même son meilleur critère relatif comme raison positive,
   même sous 50, alors que le compromis nomme ce même critère. Reproduction : « faible risque de feu » seul,
   Var + Bouches-du-Rhône. Châteauneuf-le-Rouge (sous-score feu 3 sur 100) affichait « faible risque de feu »
   et « En échange, risque de feu notable » ; après ce lot, « météo moins propice aux feux » et « En échange,
   météo plus souvent propice aux feux ». Le mécanisme vaut pour tous les critères ; il n'est pas modifié ici.
2. **Recherche des sites pollués toujours indisponible.** `/api/proxy/sis` interroge
   `data.georisques.gouv.fr`, domaine inexistant (NXDOMAIN) : le bloc affiche « Données temporairement
   indisponibles » pour toute commune. Le message est honnête, la recherche ne fonctionne pas.
3. **Aides du comparateur inaccessibles au toucher.** `LabelTip` (`ThemeMatrix.tsx`) ouvre la bulle sur
   `mouseenter` puis la referme sur `click` : au toucher, les deux se succèdent et la bulle se ferme aussitôt.
   Vaut pour toutes les lignes.
4. **« Non concernée »** reste le palier d'une donnée absente pour les autres dimensions climatiques (pluies,
   sécheresse, étés). Aucune commune de l'index n'en manque aujourd'hui.
5. Le libellé DRIAS « Jours risque feu (IFM > 40) » du prompt AskFuture garde le mot « risque » (donnée
   légitime, hors demande).
6. `/professionnels` annonce « sites ICPE à proximité (BRGM / IREP) » dans l'offre B2B.
7. Deux styles préexistants de `/agir/pollutions-invisibles` signalés par le contrôle de design (bordure
   latérale ligne 131, animation de dimension ligne 142), hors de ce lot.
