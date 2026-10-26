# FUT-136 · Les rangs des services, des écoles et de la culture suivent de nouveau leurs scores

*26/10/2026 · index de `main` @ `de009441` (FUT-135 livré), synchronisé avec `cf4a2dab` (#90, sans effet sur les données) · source : FUT-109 §8.2*

## 1. En une phrase

Le dossier ne classe pas une commune sur son score : il lit une « bande de rang » calculée à l'avance. Pour trois priorités (services, écoles, culture), ces bandes avaient été calculées sur d'anciens scores et jamais mises à jour. Résultat : **11 411 communes** recevaient au moins un verdict faux sur l'une de ces trois priorités, dont **375** présentées comme défavorables alors qu'elles sont parmi les plus favorables. Les bandes sont recalculées, et un test bloque désormais toute nouvelle dérive, sur toutes les priorités classées.

## 2. Ce qui n'allait pas

Pour dire « Valserhône se situe parmi les 20 % de communes les moins favorables », le dossier lit la position de la commune dans le classement national, stockée dans l'index (`rankBands`). Cette position doit être recalculée chaque fois que le score change. Elle ne l'a pas été :

| Priorité | Ce qui s'est passé | Bandes fausses (`main`) |
|---|---|---|
| Services | Bandes calculées le 16/07 sur l'ancien indicateur (éloignement des services). Le score est passé au niveau de centralité ANCT le 04/08, sans recalcul. | **34 726** fausses et **54** manquantes : aucune des 34 780 communes notées n'avait la bonne |
| Écoles | Scores recalculés le 21/08 (`0e4ec0fa`), sans recalcul des bandes. | **11 676** |
| Culture | Même commit, même oubli. | **25 792** |

Ces chiffres ont été **remesurés sur le `main` actuel**, avec un calcul indépendant du script de production. Ils confirment le diagnostic, à un détail près : le diagnostic comptait 62 communes sans bande de services ; ce sont **54** communes notées sans bande, plus 8 communes sans score, dont la bande avait déjà été retirée par FUT-109, à juste titre.

Les **dix autres priorités classées** (nature, soins, transports, voiture, démographie, vie locale, calme, emploi, ensoleillement, douceur de l'hiver) étaient **exactes** : 0 écart.

## 3. Les trois communes témoins

Projet de test : les trois priorités déclarées comme importantes (poids 3), sans adresse. Le texte vient du vrai moteur du dossier (`buildModuleFacts` puis `dossierDepuisFaits`).

### Valserhône (01033) · services

| | Avant | Après |
|---|---|---|
| Score de services | 87 (centre structurant) | 87 |
| Bande | [17,45 % ; 18,44 %] | [97,34 % ; 99,47 %] |
| Verdict | **défavorable** | **favorable** |
| Ce que dit le dossier | « Sur le niveau de services de la commune, Valserhône se situe parmi les 20 % de communes les moins favorables de France. » | « Pour le niveau de services de la commune, Valserhône se situe parmi les 5 % de communes qui concentrent le plus de commerces et services en France. » |
| Phrase de verdict | « Cet écart est à peser avant de vous décider. » | « Une partie de vos priorités va dans ce sens. » |

### Sergy (01401, Ain) · écoles

| | Avant | Après |
|---|---|---|
| Score écoles | 25 | 25 |
| Bande | [11,5 % ; 12,5 %] | [24,5 % ; 25,5 %] |
| Verdict | **défavorable** | neutre |
| Ce que dit le dossier | « Sur ce point, Sergy se situe parmi les 20 % de communes les moins favorables de France. » | (rien : la commune est au milieu du classement) |
| Phrase de verdict | « Cet écart est à peser avant de vous décider. » | « Vos priorités ont pu être examinées ici. Aucun écart marqué n'apparaît, aucun avantage net non plus. » |

L'homonyme de l'Aisne (02712) ne change pas de verdict : sa culture (score 6) reste parmi les 10 % les moins favorables, avec une bande corrigée ([7,5 % ; 8,5 %] → [5,5 % ; 6,5 %]).

### Marseille 7ᵉ (13207) · culture, et services

| | Avant | Après |
|---|---|---|
| Score culture | 81 | 81 |
| Bande culture | [10,5 % ; 11,5 %] | [80,5 % ; 81,5 %] |
| Verdict culture | **défavorable** | **favorable** |
| Services (score 100) | pas de bande : « non calculable » | [99,47 % ; 100 %] : favorable |
| Ce que dit le dossier | « … Marseille 7ᵉ se situe parmi les 20 % de communes les moins favorables de France » (culture) | « Pour l'accès à la culture, Marseille 7ᵉ se situe parmi les 20 % de communes où il est le plus favorable en France. » ; idem pour les services, parmi les 5 % |
| Phrase de verdict | « L'accès aux collèges et lycées répond en revanche à votre projet. La décision se joue entre cette correspondance et l'écart relevé. » | « Les critères de votre projet qui ont pu être examinés vont dans ce sens. » |

## 4. L'effet sur les 34 788 communes

### Bandes

| Priorité | Modifiées | Ajoutées | Retirées |
|---|---|---|---|
| Services | 34 726 | 54 | 0 |
| Écoles | 11 676 | 0 | 0 |
| Culture | 25 792 | 0 | 0 |
| Les dix autres | 0 | 0 | 0 |

Les **54 bandes ajoutées** concernent des communes notées qui n'avaient pas de bande : les **45 arrondissements** de Paris, Lyon et Marseille (le score les classe au niveau le plus élevé), et 9 communes au score attesté, dont 6 villages détruits de la Meuse (non-pôles, verdict neutre ; leur affichage reste la question ouverte de FUT-109 §8.6). Les **8 communes sans score de services** (sans ligne ANCT : Conques-en-Rouergue, Aurseulles, Celles, Chalinargues, Chavagnac, Sainte-Anastasie, Orée d'Anjou, Porte des Pierres Dorées) n'ont **pas** de bande : le dossier les dit « non calculables » plutôt que d'inventer un rang.

### Verdicts

| Priorité | Verdicts changés | Défavorable → favorable | Favorable → défavorable | Sortent de « défavorable » | Entrent en « défavorable » | Deviennent « favorable » | Perdent « favorable » |
|---|---|---|---|---|---|---|---|
| Services | **10 291** | 374 | 0 | 6 853 | 0 | 3 805 | 0 |
| Écoles | **388** | 0 | 0 | 110 | 110 | 84 | 84 |
| Culture | **1 263** | 1 (Marseille 7ᵉ) | 0 | 379 | 379 | 253 | 253 |

Détail des transitions : services 6 479 défavorable → neutre, 374 défavorable → favorable, 3 384 neutre → favorable, 54 « non calculable » → favorable (47) ou neutre (7). Écoles et culture : des échanges dans les deux sens autour des seuils des 20 %, ce qu'on attend d'un classement qui s'était simplement décalé.

Toutes priorités confondues : **11 411 communes** ont au moins un verdict qui change, et **375** passent de défavorable à favorable. **Aucune**, critère par critère, ne passe de favorable à défavorable.

Cela ne veut pas dire qu'aucune **conclusion d'ensemble** ne devient moins favorable : quand plusieurs priorités sont posées, une position défavorable nouvellement révélée pèse dans l'arbitrage (constat de la revue indépendante). Exemple, Saint-Saturnin-lès-Avignon (84119), projet services + écoles + culture : les services deviennent favorables (score 70, [19,73 % ; 100 %] → [89,06 % ; 97,34 %]), mais la culture (score 18, [20,5 % ; 21,5 %] → [17,5 % ; 18,5 %]) passe sous le seuil des 20 % et devient un désaccord. La phrase de verdict passe de « Une partie de vos priorités va dans ce sens. » à « L'accès aux collèges et lycées et le niveau de services de la commune répondent en revanche à votre projet. La décision se joue entre ces correspondances et l'écart relevé. » C'est le classement corrigé qui le dit : la culture de cette commune est bien parmi les 20 % les moins dotées.

### Textes du dossier

Mesuré sur la vraie chaîne du dossier, commune par commune, pour un projet qui place la priorité en importance forte :

| Priorité | Dossiers dont le texte change | dont la phrase de verdict | Cartes qui disparaissent | Cartes qui apparaissent |
|---|---|---|---|---|
| Services | 10 291 | 10 291 | 6 479 (« parmi les moins favorables » à tort) | 3 431 (« parmi les plus favorables ») |
| Écoles | 704 | 388 | 194 | 194 |
| Culture | 2 532 | 1 263 | 631 | 631 |

Pour les écoles et la culture, 316 et 1 269 dossiers gardent leur verdict mais corrigent l'ampleur annoncée (par exemple « parmi les 20 % » qui devient « parmi les 10 % »).

**Aucun autre critère ne bouge** : sur un projet qui pose les dix autres priorités classées, 0 dossier change sur l'échantillon déterministe d'une commune sur dix (3 479 dossiers comparés en entier, texte, preuves et structure).

## 5. Ce qui ne change pas

- **Les scores** : aucun score, aucune source, aucun seuil, aucune pondération. Champ par champ, les 34 788 communes sont identiques en dehors des trois clés de rang ; les métadonnées de l'index aussi.
- **L'accueil** : il ne lit que la douceur de l'hiver. Les 34 788 lignes des données légères sont identiques ; seule l'empreinte de l'index source change.
- **Les dossiers déjà vendus** : un dossier acheté est figé dans son artefact (texte compris) et se relit tel qu'il a été vendu. Seules les **nouvelles** évaluations lisent l'index corrigé. La version du moteur reste `engine-7` : les règles ne changent pas, seule la donnée qu'elles lisent est corrigée (même doctrine que FUT-109 et FUT-135). Ce qui distingue une position produite avant FUT-136 d'une position produite après, c'est l'identité de sa distribution (§8).
- **FUT-135** (vie étudiante) : `vie_etudiante`, `etudes_acces`, `etudes_dyn`, le millésime MESR 2024 et les identités étudiantes sont intacts, car identiques champ par champ.

## 6. Le garde permanent

`src/lib/rangs-parite.test.ts`, dans `npm test`. Pour **chaque** clé de rang publiée et **chaque** commune, il recalcule la bande à partir du score (`mismatchRawScore`), avec le même contrat que la production, mais sans réutiliser son code :

- bas = part des communes au score strictement inférieur, haut = part des communes au score inférieur ou égal, sur les communes notées, arrondies au point de base ; les ex æquo partagent la même bande ;
- échec si une bande est fausse, si une commune sans score a une bande, ou si une commune notée n'en a pas (aucune exception admise aujourd'hui ; toute exception devra être justifiée dans le test lui-même) ;
- échec si une clé publiée n'est pas classée par le score, ou si une clé classée n'a aucune bande.

**Preuve** : sur l'index de `main`, le test échoue avec exactement les écarts du §2 (11 676 / 25 792 / 34 726 + 54) ; sur l'index corrigé, il passe. Trois cas synthétiques prouvent qu'il voit les trois formes de dérive rencontrées : score rescoré sans recalcul, bande restée sans score, score sans bande.

## 7. Pour FUT-141 (vie étudiante, 487 communes)

`populate-bpe.py` réécrit **ensemble** `ecoles`, `culture` et `etudes_acces`. C'est ainsi que les rangs des écoles et de la culture ont dérivé le 21/08. Si FUT-141 relance ce script, ou tout autre script qui touche ces scores, le garde échouera tant que les rangs n'auront pas été recalculés :

```bash
npx tsx scripts/populate-mismatch-rank.mts --recalculer acces_ecoles,acces_culture
```

Si les bandes changent effectivement, le test de provenance (§8) exigera en plus une identité nouvelle pour chaque critère concerné, et une ligne de registre portant la nouvelle empreinte, dans `distributions-rang.ts`. Si les scores ressortent identiques, les bandes et l'empreinte aussi, et rien n'est à faire.

`etudes_acces`, `etudes_dyn` et `vie_etudiante` ne sont pas des clés de rang : FUT-141 n'a aucun rang à recalculer pour elles.

## 8. Provenance : une identité par distribution publiée

**Le défaut** (revue indépendante, au SHA `fbd523c7`) : chaque position du dossier porte, dans sa preuve structurée figée par l'artefact, l'identité de la distribution qui l'a produite (`basis.distributionVersion`). Elle valait `mismatch-dist-2026-07-15` pour tous les critères, avant comme après le recalcul. À Valserhône, la preuve services défavorable d'avant ([17,45 % ; 18,44 %]) et la preuve favorable d'après ([97,34 % ; 99,47 %]) portaient la même identité et le même moteur (`engine-7`) : rien ne disait de quelles données venait chacune. Cette identité n'est pas affichée au lecteur ; elle est la traçabilité de l'artefact payant.

**La correction** (`src/lib/decision/distributions-rang.ts`) :

| Critère | Identité avant FUT-136 | Identité après | Empreinte des bandes publiées |
|---|---|---|---|
| Services | `mismatch-dist-2026-07-15` (empreinte `61490bd1…`, 34 726 communes) | `mismatch-dist-2026-10-26-acces_services` | `c8e94c94…`, 34 780 communes |
| Écoles | `mismatch-dist-2026-07-15` (`ad399efb…`) | `mismatch-dist-2026-10-26-acces_ecoles` | `9cf57165…`, 34 788 |
| Culture | `mismatch-dist-2026-07-15` (`e299bb2b…`) | `mismatch-dist-2026-10-26-acces_culture` | `4556218a…`, 34 788 |
| Les dix autres | `mismatch-dist-2026-07-15` | inchangée | empreinte relevée, inchangée par FUT-136 |

- Une seule fonction pure, `distributionVersionDe(clé)`, donne l'identité aux deux familles de règles (favorables et défavorables) : elles ne peuvent pas diverger.
- **Le lien avec les données est vérifié, pas déclaré.** Un registre en ajout seul associe chaque identité à l'empreinte des bandes qu'elle désigne : le sha256 des lignes `insee, bas, haut`, triées, de l'index versionné. Le test `distributions-rang.test.ts` recalcule l'empreinte sur l'index publié. Il échoue si une distribution change sans identité nouvelle, si l'identité en vigueur ne désigne pas les bandes publiées, si une règle favorable et une défavorable posent des identités différentes, ou si une clé non concernée reçoit une nouvelle identité. Les quatre cas ont été provoqués volontairement : chacun fait échouer le test.
- L'ancienne identité reste au registre pour les trois critères, avec l'empreinte des bandes périmées : un dossier vendu avant FUT-136 désigne toujours, sans ambiguïté, la distribution qui l'a produit.

**Ce qui ne change pas** : `engine-7`, les dix autres identités, les artefacts historiques (un artefact Valserhône produit avant le correctif est figé en fixture et se relit à l'identique, `mismatch-dist-2026-07-15` compris), et toute conclusion. Sur l'index corrigé, l'ancien code (`fbd523c7`) et le nouveau produisent des dossiers **identiques** pour 34 788 communes × 2 projets (les trois critères à poids 3 ; les treize à poids 2) : 69 576 dossiers, 0 écart une fois l'identité neutralisée. Seule la provenance change, sur 38 794 d'entre eux.

**Dette connue, hors périmètre** : FUT-109 (25/10) avait recalculé les rangs de `vie_locale`, `croissance_demographique`, `acces_soins`, `faible_dependance_auto` et `viabilite_emploi` sans changer d'identité. Pour ces critères, `mismatch-dist-2026-07-15` a donc désigné deux distributions successives. Ce n'est pas corrigé ici (consigne : ne pas toucher aux dix autres identités). Mais le registre les fige désormais : tout recalcul futur exigera une identité nouvelle.

## 9. Vérifications

| Contrôle | Résultat |
|---|---|
| Garde des rangs (`rangs-parite.test.ts`) | 7/7 ; échoue sur l'index de `main` |
| Règles d'accord et de désaccord (`mismatch-rules`, `alignment-rules`, `fut110`, `fut96`, `fact-compositions`) | inclus dans la suite complète |
| `npm test`, suite lancée seule | **3 205/3 205** sur `de009441` (3 198 + les 7 nouveaux) ; **3 227/3 227** après synchronisation avec `main` @ `cf4a2dab` (#90 fusionnée : + 22) ; **3 236/3 236** avec le correctif de provenance (+ 9) |
| `tsc --noEmit` | 0 erreur |
| `eslint` (fichiers modifiés, test compris avec `--no-ignore`) | 0 problème |
| `next build` (prébuild compris : `index-verify`, données de l'accueil) | OK, avec des clés Supabase factices (aucun appel réel) |
| `index:verify` | OK |
| Second recalcul | 0 bande modifiée, empreinte identique `4f33d782…` |
| Reproductibilité depuis l'index de `main` | worktree neuf, même commande : empreinte identique `4f33d782…` |
| Avant / après champ par champ | 0 commune modifiée hors des trois clés ; métadonnées identiques |
| Accueil | 34 788 / 34 788 lignes identiques |
| Provenance (`distributions-rang.test.ts`) | 9/9 ; quatre mutations (ancien index, recalcul sans identité, règles divergentes, clé non concernée) font chacune échouer le test |
| Équivalence de l'ancien et du nouveau code | 69 576 dossiers identiques hors identité de distribution |

## 10. Rejouer

```bash
npm run index:unpack
npx tsx scripts/populate-mismatch-rank.mts --recalculer acces_services,acces_ecoles,acces_culture
npm run index:pack && npm run index:verify
node scripts/accueil/donnees-accueil.mjs --ecrire       # seule l'empreinte de la source change
# avant / après (index de main extrait dans /tmp) :
git show origin/main:data/comparateur-index.json.gz > /tmp/avant.json.gz
node scripts/rangs/avant-apres-rangs.mjs /tmp/avant.json.gz data/comparateur-index.json.gz \
  --cles acces_services,acces_ecoles,acces_culture --temoins 01033,01401,02712,13207
```
