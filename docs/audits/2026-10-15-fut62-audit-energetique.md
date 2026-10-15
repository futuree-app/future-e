# FUT-62 — L'audit énergétique comme information de décision (15/10/2026)

Branche `feat/fut-62-audit-energetique-decision`, partie de `origin/main` `6c496676`.
Linear n'a pas pu être lu dans cette session (connecteur non authentifié) : le travail suit le brief du ticket transmis en session.

## 1. Ce qui existait déjà (FUT-59, FUT-65, FUT-67, FUT-68)

- **FUT-59** : l'audit est lu par m² (`ep_conso_5_usages_m2`, kWh EP/m²/an), jamais le total ; il n'est attribué que par l'identifiant BAN exact ; un audit voisin est un `AuditCandidatProche` sans aucune valeur, jamais affiché ; l'objet audité (logement ou immeuble) est lu dans les surfaces.
- **FUT-65** : une panne ADEME (`unavailable`) n'est jamais une absence ; le voisin n'est cherché que sur une absence établie.
- **FUT-67** : `parcoursAudit()` sépare l'état initial des parcours, regroupe et ordonne les étapes, garde les numéros d'étape de la source, ne fusionne jamais deux parcours, garde un second état initial à part.
- **FUT-68** : la sélection du DPE reste compacte.

Rien de cela n'a été réimplémenté. `parcoursAudit` est la base de la nouvelle lecture ; ses tests (A1 à A3, R1 à R4) passent inchangés sur le fond.

## 2. Ce que les données montrent (échantillon public, lecture seule)

Inspecté : 3 000 lignes ADEME (audits de janvier-février 2025), 3 000 et 5 000 états initiaux récents, et les audits réels du 1 rue Saint-Dominique (Paris 7e). Aucune collecte massive, rien d'écrit.

**`travaux_realises`**
- Une liste **fermée** : onze libellés (isolation des murs, de la toiture, des planchers bas ; remplacement des menuiseries extérieures, du chauffage, de l'eau chaude sanitaire, de la ventilation, du refroidissement ; installation d'une ventilation, d'un refroidissement, d'une production photovoltaïque) et « autre ». Séparés par « , », ordre quelconque, apostrophe typographique.
- Ce sont des **catégories**, sans quantité, matériau ni coût.
- **Malgré son nom, ce sont les travaux proposés** par l'auditeur pour l'étape, pas des travaux réalisés.
- Vide sur l'état initial (toujours), renseigné sur chaque étape de travaux. « autre » seul sur environ une étape sur cinq.
- Le plus souvent, chaque étape porte **ses propres** travaux (545 parcours sur 662, hors « autre ») et la rénovation en une fois porte leur réunion (578 sur 661). Mais **117 parcours répètent une catégorie** d'une étape à l'autre, et quelques-uns répètent la liste entière. On ne peut donc jamais écrire « ajoutés à cette étape » : l'écran dit les travaux que la source donne **pour** l'étape.

**Rattachement aux étapes** : `travaux_realises` est sur la même ligne que l'étape (une ligne par étape) : le rattachement est exact par construction. Les tests vérifient que chaque étape affichée porte les travaux de **sa** ligne source, jamais ceux d'une autre étape ni d'un autre parcours.

**Unités** : `ep_conso_5_usages_m2` est bien en kWh EP/m²/an (contrat FUT-59, revérifié).

**Logement / immeuble** : `methode_application_dpe` (« dpe maison individuelle », « dpe appartement individuel… », « dpe immeuble collectif… ») concorde à 100 % (3 000/3 000) avec la règle des surfaces de FUT-59. Environ 9 % des audits portent sur un immeuble.

**Champs utiles jusqu'ici ignorés**
- `numero_dpe` (« numero_dpe_rattache ») : le DPE dont l'audit est issu, renseigné sur 73 % des audits. C'est une **preuve publiée** qui relie un audit au diagnostic retenu pour le logement.
- `n_immatriculation_copro` : renseigné sur **16 %** seulement des audits d'immeuble. La plupart des immeubles audités ne disent pas s'ils sont en copropriété (l'audit réglementaire vise d'abord les monopropriétés). D'où une phrase **conditionnelle** quand l'immatriculation manque.
- `nb_appartement`, `n_audit_remplace`.

**Plusieurs audits à une adresse** : environ 3 % des adresses (143 sur 4 423 dans l'échantillon), jusqu'à 24. Au 1 rue Saint-Dominique : **trois audits établis le même jour** (immeuble de 434 m², « immeuble » d'un seul logement de 55 m², appartement de 195 m²). L'écran en montrait un, choisi par l'ordre de l'API, et taisait les deux autres. La requête (20 lignes) coupait aussi le troisième audit d'une adresse, sans le dire.

## 3. Les vrais problèmes restants (avant ce lot)

1. Les étapes étaient une liste de consommations ; les travaux, déjà chargés, n'étaient pas affichés.
2. Rien ne disait ce que l'audit implique pour un achat, ni ce qu'il reste à vérifier.
3. **L'audit n'apparaissait que si un DPE était attribué au logement.** Tant que le lecteur n'avait pas choisi parmi les diagnostics de l'adresse, l'audit de l'immeuble restait invisible.
4. Plusieurs audits à une adresse : un seul affiché, de façon arbitraire, les autres tus, la liste coupée à 20 lignes.
5. Aucune phrase ne reliait l'audit d'immeuble (503,5) au DPE du logement (418,3) (FUT-67, point laissé à FUT-62).
6. « scénario complémentaire 1 » apparaissait tel quel (« Scénario complémentaire 1 »).

## 4. Ce qui a été fait

**Données (`audit-record.ts`, `audit.ts`)**
- `toAuditRecords` : tous les audits de l'adresse, dans un ordre écrit (le plus récent ; à date égale l'immeuble avant un logement, puis la plus grande surface, puis le numéro). Un audit déclaré remplacé par un autre audit présent est écarté. `toAuditRecord` garde son contrat (le premier).
- Requête à 60 lignes, triée par date puis numéro d'audit ; si la page est pleine, le dernier audit (peut-être coupé) est écarté et la liste est dite incomplète (« au moins »).
- `AuditRecord` porte, **seulement s'ils sont publiés**, `numero_dpe`, `copropriete`, `nb_logements`. Un rapport sans ces champs garde exactement sa forme et son empreinte : pas de version fantôme à l'actualisation.
- Le rapport Logement porte `autresAudits` (et `autresAuditsIncomplets`) seulement quand il y en a.

**Lecture (`audit-lecture.ts`, pur, testé)**
- `lireTravaux` / `phraseTravaux` : catégories de la source, rangées (enveloppe puis équipements), dédoublonnées, isolations regroupées en une phrase, « autre » dit comme tel, libellé inconnu conservé tel quel. Libellés en langage d'acheteur (« Remplacement des fenêtres et portes extérieures »), sans rien ajouter.
- `choisirAudit` : seul un audit dont la source publie le **même numéro de DPE** que le diagnostic retenu peut passer devant ; surface ou consommation voisines ne comptent pas.
- `lireAuditPourDecision` : fait → implication → vérification, réglé par le grain et par la voix du lecteur (`voixAudit`, depuis la relation **déclarée** au bien, FUT-10/FUT-26).
- Valeur après rénovation complète : **seulement si chaque parcours finit sur une étape finale** ; plage si les fins diffèrent ; sinon « non établie ».

**Écran (`AuditEnergetiqueBlock.tsx`, monté par `EnergieSection` dans tous ses états)**
1. *Le fait* : « Un audit énergétique existe pour cet immeuble / ce logement / un logement de cette adresse », ou « est publié pour cette adresse » (objet inconnu) ; sa portée ; sa date.
2. Deux valeurs côte à côte, visuellement distinctes : avant travaux (trait plein, relevé) et après la rénovation complète proposée (pointillés, « estimation de l'auditeur, pas une garantie »).
3. Le nombre et la nature des parcours, puis le lien avec le DPE du logement.
4. Les parcours **repliés** (`<details>` natif, accessible au clavier) : étapes dans l'ordre de la source, consommation, travaux de l'étape.
5. Les autres audits de l'adresse, attribués à personne.
6. *À vérifier avant d'acheter* (ou « À suivre » pour un habitant, « À vérifier avant de vous engager » sans relation déclarée) : une à trois questions concrètes.

## 5. Comment les travaux ADEME sont interprétés

| Source | Affiché |
|---|---|
| `Isolation des murs, Isolation de la toiture, Isolation des planchers bas` | Isolation des murs, de la toiture et des planchers bas |
| `Remplacement des menuiseries extérieures` | Remplacement des fenêtres et portes extérieures |
| `Remplacement du système de production d’eau chaude sanitaire` | Remplacement de la production d'eau chaude |
| `autre` seul | Travaux non détaillés par la source |
| `…, autre` | … · Autres travaux, non détaillés par la source |
| vide | Travaux de l'étape non renseignés par la source |
| libellé inconnu | rendu tel quel |

Ce qui n'est **jamais** produit : classe DPE future, coût, aide, reste à charge, date de réalisation, vote, financement, garantie. « votés, financés ou planifiés » et « déjà réalisés » n'apparaissent que dans des **questions** (test G1).

## 6. Avant / après

Captures dans `docs/audits/fut62-captures/`, prises sur le banc `/dev/audit-energetique` (fixtures au format exact des lignes ADEME, identifiants synthétiques ; la version « avant » est le code de `origin/main` sur les mêmes fixtures).

| Vue | Avant | Après |
|---|---|---|
| Immeuble (desktop) | `avant-immeuble-desktop.jpg` | `apres-immeuble-desktop.jpg` |
| Immeuble, détails ouverts | — | `apres-immeuble-ouvert-desktop.jpg`, `apres-immeuble-ouvert-mobile.jpg` |
| Logement rattaché au DPE, détails ouverts | — | `apres-logement-ouvert-desktop.jpg` |
| Information incomplète | — | `apres-incomplet-ouvert-desktop.jpg`, `…-mobile.jpg` |
| Trois audits à l'adresse | `avant-plusieurs-desktop.jpg` | `apres-plusieurs-desktop.jpg`, `apres-plusieurs-lie-desktop.jpg`, `…-mobile.jpg` |
| DPE pas encore choisi | `avant-sans-dpe-desktop.jpg` (aucun audit) | `apres-sans-dpe-desktop.jpg` |
| Copropriété immatriculée, habitant, panne | — | `apres-copro-…`, `apres-habitant-…`, `apres-panne-…` |

Mobile (390 px) : aucun débordement horizontal.

## 7. Tests

- `src/lib/audit-lecture.test.ts` (20 tests) : les dix cas obligatoires (C1 à C10), le rattachement des travaux à la bonne étape et au bon parcours, la forme inchangée d'un audit sans les nouveaux champs, et les garde-fous (G1 à G4 : aucune surinterprétation dans aucune voix, l'immeuble jamais « ce logement », la voix jamais devinée, l'unité).
- Tests existants recibles sur le nouveau composant (ils lisaient le source d'`EnergieSection`), intention inchangée : `audit-record.test.ts` (T3, T5, T6, T7), `fut67-restitution.test.ts` (A4, R3, R4), `logement-source-indisponible.test.ts` (A8, A13, A14).

## 8. Limites et ambiguïtés non résolues

- **Un audit de logement sans numéro de DPE publié** reste « un logement de cette adresse », même quand sa surface et sa consommation coïncident avec le DPE retenu (cas réel : 194,66 m² et 418,4 contre 194,7 m² et 418,3). C'est volontaire : une coïncidence n'est pas une preuve. Le lecteur voit les deux surfaces et la question à poser.
- **Le choix de l'audit principal** parmi plusieurs (immeuble d'abord, à date égale) est une règle de lecture, pas une attribution ; il est dit, et les autres sont listés.
- **Un « immeuble » d'un seul logement de 55 m²** existe dans la source (`methode_application_dpe` = immeuble collectif, `nb_appartement` = 1). Le contrat de la source est suivi tel quel.
- **Copropriété** : absente de 84 % des audits d'immeuble ; la phrase reste conditionnelle dans ce cas. Le RNIC (FUT-83) pourrait l'établir.
- Les émissions par étape (`emission_ges_m2`) ne sont toujours pas affichées : ce n'était pas nécessaire à la décision et aurait ajouté une seconde colonne de chiffres.
- Le banc de revue ne passe pas par un vrai dossier : la relation déclarée (voix) et le DPE retenu y sont fixés à la main. Le câblage réel (`LogementModule` → `voixAudit(relationDeLAdresse(dossier))`) est vérifié par test de source, pas en navigateur sur un dossier réel.
