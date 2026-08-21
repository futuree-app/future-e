# Data Curator — Statut épistémique et régime de conservation des apports du lecteur

**21 août 2026 · rapport d'évaluation, read-only · rien n'est codé ni gravé par ce document.**

Lentille : *cette donnée mérite-t-elle d'entrer dans le système de décision de futur•e, et si
oui comment l'utiliser honnêtement ?* Le chantier n'est pas une source externe, c'est une
**classe entière de données** qui demande à entrer. La question est donc la bonne, et la réponse
par défaut d'un Curator est non tant que la place n'est pas nommée.

Fichiers réellement ouverts pour ce rapport : `docs/vault/doctrine/data.md`,
`docs/vault/doctrine/editoriale.md`, `docs/vault/principes/invariants.md`,
`docs/vault/recherches/inventaire-sources.md`, `docs/vault/briefs/logement-caracteristiques-declarees.md`,
`supabase/11_terrain_observations.sql`, `supabase/16_report_context.sql`,
`supabase/19_logement_dpe_selection.sql`, `supabase/32_dpe_selection_traceability.sql`,
`src/app/api/ask/route.ts`, `src/app/api/logement-dpe/route.ts`,
`src/app/api/terrain-observations/route.ts`, `src/app/api/profile/route.ts`,
`src/app/(account)/compte/QuartierWorkbook.tsx`, `src/app/(account)/rapport/quartier/page.tsx`,
`src/app/api/synthesize-quartier/route.ts`, `src/lib/dpe-attribution.ts`,
`src/lib/dpe-rapprochement.ts`, `src/lib/dpe.ts`, `src/lib/dpe-address-context.ts`,
`src/lib/address-dossier-store.ts`, `src/lib/thermal-evidence.ts`,
`docs/audits/2026-07-30-rnb-dpe-rattachement-batiment.md`,
`docs/audits/2026-07-03-dpe-confort-ete-couverture.md`, `vercel.json`, `AGENTS.md`.

---

## 1. Une déclaration est-elle une « source » ? Non, et le vocabulaire doit le dire

### Ce qui fait une source dans ce dépôt

`inventaire-sources.md` définit sept types (projetée, mesurée, historique, réglementaire,
déclarative/calculée, communautaire, transactionnelle). Les sept partagent **deux propriétés que
la doctrine n'écrit nulle part parce qu'elle les tient pour évidentes** :

1. **Tiers-vérifiabilité.** Un tiers peut refaire l'affirmation en repartant du producteur nommé.
   C'est ce que porte l'attribution visible (`doctrine/editoriale.md`) et c'est ce qui autorise
   un lecteur à opposer un chiffre à un vendeur.
2. **Appartenance à la hiérarchie géographique.** `doctrine/data.md` règle 3 : address, point,
   grid_cell, commune, iris, epci, department, region. Toute valeur stockée porte son échelle
   réelle, et c'est cette échelle qui répond à la question de contrôle.

Un constat de lecteur échoue aux deux. Personne ne peut le refaire : il n'existe qu'une fois, chez
une personne. Et son échelle n'est **pas un rang de la hiérarchie** : « mon quartier tel que je le
vis » n'est ni un point, ni un IRIS, ni une commune. C'est un périmètre mental variable d'un
répondant à l'autre.

> **Règle proposée, formulation prête à graver.** Un apport du lecteur n'entre pas dans la
> hiérarchie géographique de `doctrine/data.md`. Sa portée est **une personne**, jamais un
> territoire. Il ne peut donc ni s'agréger vers le haut, ni se comparer à une valeur communale,
> ni répondre à la question « à quelle échelle cette affirmation est-elle vraie ? » autrement que
> par « pour celui qui l'a dite ».

Cette formulation est plus opérante que « une déclaration n'est pas une source », parce qu'elle
donne un **test mécanique** : si une valeur ne peut pas se ranger sous un des huit rangs, elle
n'est pas une donnée territoriale, quel que soit son contenu.

### La taxonomie exacte proposée

L'invariant n°3 impose de distinguer l'observé, le modélisé, le projeté, l'interprété. Ces quatre
mots forment **un registre unique : celui des sources**, c'est-à-dire du traitement appliqué à une
observation faite par un tiers redevable. La bonne architecture n'ajoute pas un cinquième mot dans
cette liste, elle ajoute **un axe au-dessus** :

```
PROVENANCE (axe 1, deux valeurs, jamais plus)
├── source   → un producteur nommable, un tiers peut refaire l'affirmation
│   └── REGISTRE (axe 2) : mesuré | projeté | modélisé | interprété
│                          (inchangé, c'est l'invariant n°3)
└── lecteur  → une personne, non reproductible, hors hiérarchie géographique
    └── NATURE (axe 2, doctrine déjà validée) :
        ├── contexte sur soi        (préférences, projet, contraintes)
        ├── constat sur le monde    (place_attribute | self_experience)
        └── désignation de source   (une clé, contrôlée serveur → repasse en `source`)
```

Deux valeurs de provenance, pas quatre : c'est exactement l'arbitrage du brief
(« distinguer OBSERVE et RAPPORTE n'entre pas dans le schéma tant que rien ne le consomme »), et
il tient. La gradation observé/rapporté sert à décider **quelles questions on pose**, jamais à
qualifier une valeur en base.

### Le vocabulaire, mot par mot

| Interdit sur un apport du lecteur | Pourquoi | À dire à la place |
|---|---|---|
| « source », « donnée », « d'après les données » | l'attribution deviendrait fausse (`editoriale.md`) | « d'après ce que vous avez indiqué » |
| « relevé », « mesuré », « constaté », « observé » | verbes du registre des sources | « vous nous avez indiqué » |
| « dans votre quartier », « à {commune} » | replace un témoignage dans la hiérarchie géographique | « chez vous », « pour vous », « votre logement » |
| « les habitants disent », « les riverains constatent » | un témoignage au pluriel est une statistique sans échantillon | rien : futur•e ne parle jamais au nom d'habitants |
| une note, une confiance, un « fiable à 80 % » | ADR-0001 s'applique aussi aux apports du lecteur | l'origine et la date, en clair |

**Preuve que la règle manque aujourd'hui, dans le code.** `src/app/api/ask/route.ts` (lignes
~488-518) traduit les réponses du workbook avant de les injecter dans le prompt :

- `shelter: "resilient"` (libellé lecteur : « Oui, plutôt ») devient
  **« le territoire absorbe encore bien »** ;
- `shelter: "fragilise"` devient **« le territoire montre déjà ses limites »** ;
- le bloc est titré **« Observations terrain (module Territoire) »**.

Un ressenti personnel y devient un attribut du territoire, sous un intitulé qui évoque un relevé.
C'est la conversion exacte que la doctrine validée interdit, et elle est en production. Deuxième
faute superposée : `profile.workbook_quartier` est **global au profil, sans code INSEE**
(`supabase/16_report_context.sql` le dit explicitement, ligne 17-19), donc ces « observations
terrain » sont injectées dans une conversation portant sur **n'importe quelle commune**, y compris
une que le lecteur n'a jamais vue. Le témoignage y est faux de portée deux fois : converti en fait
territorial, et rattaché au mauvais territoire.

Cela ne demande pas de débat : le retrait déjà décidé le règle. Mais il faut que la **raison** soit
gravée, sinon la même traduction reviendra dans le prochain prompt.

---

## 2. Nature 3 (désignation de source) : oui, légitimement sourcée, et voici ce qui manque

### Pourquoi la réponse est oui

`src/app/api/logement-dpe/route.ts` a déjà résolu la question, et son commentaire de tête est la
doctrine : **« LE CLIENT DÉSIGNE, IL NE DÉCRIT PAS »**. Trois gestes, vérifiés dans le code :

1. Le corps de requête ne porte plus qu'un identifiant (`Body = { dossierId, status, dpeId?, source? }`),
   jamais un `DpeRecord`. Une étiquette modifiée dans le navigateur ne peut plus entrer.
2. La fiche est **relue à la source** côté serveur (`findDpeByNumero`), avec le commentaire
   « LA RECHERCHE EST REFAITE ICI […] la seule fiche qui entre dans le dossier est celle que ce
   serveur vient de lire ».
3. Le rattachement est **contrôlé** par `rapprocher` (`src/lib/dpe-rapprochement.ts`), qui n'accepte
   que les niveaux `adresse` et `batiment`, et refuse `commune`, `ailleurs`, `inconnu`.

La valeur qui entre est donc de l'ADEME, intégralement, et l'apport du lecteur est un **pointeur**,
pas un contenu. Épistémiquement, c'est identique à une jointure que futur•e aurait faite seule, à
une différence près qui joue en faveur du lecteur : la preuve d'identité est un document qu'il a en
main, là où la géographie seule se trompait 57 fois sur 65 (mesure du 31/07 citée dans `dpe.ts`).

Une garantie de plus, souvent oubliée : `findDpeByNumero` n'attribue jamais depuis `DS.legacy`
(diagnostics antérieurs à juillet 2021, tous expirés) ; un numéro trouvé là revient en `expire`, et
la route rend 422. La méthode de calcul qui a changé en juillet 2021 ne peut donc pas contaminer un
dossier payant.

### Ce qui manque pour que l'affirmation reste vraie dans six mois

**La trace de la manière dont le rattachement a été vérifié n'est pas persistée.**
`buildDpeSelectionFields` (`src/lib/address-dossier-store.ts`, lignes 72-88) écrit
`dpe_selection_status`, `selected_dpe_id`, `selected_dpe_snapshot`, `selected_dpe_at`,
`dpe_selection_at`. Ni `body.source` (`"liste"` ou `"numero"`), ni `rapprochement.niveau`
(`"adresse"` ou `"batiment"`) n'y figurent : ils sont calculés, utilisés pour autoriser, puis jetés.

Conséquences concrètes, à six mois :

- Un dossier attribué par numéro au niveau **`batiment`** (une entrée voisine du même bâtiment,
  acceptée par conception) est **indiscernable** d'un dossier choisi dans la liste de l'adresse.
  L'affirmation « ce diagnostic porte sur cette adresse » n'a pas la même force dans les deux cas,
  et rien en base ne permet de le dire.
- Si `rapprocher` se révèle trop permissif, ou si ses règles bougent, **aucune requête ne peut
  identifier les dossiers concernés**. Il faudrait rejouer tous les rapprochements, ce que
  l'expiration des données ADEME rendra progressivement impossible.
- Le lecteur ne peut pas se voir raconter honnêtement ce qui s'est passé (« diagnostic que vous avez
  désigné par son numéro, rattaché au bâtiment de votre adresse »), alors que ce récit est
  précisément ce qui distingue futur•e d'un formulaire.

**Ce que la doctrine doit imposer.** Une désignation de source n'est légitime que si le système
conserve, à côté de la valeur, **par quel chemin l'identité a été établie**. Formulation prête :

> Quand une valeur sourcée entre dans un dossier parce que le lecteur l'a désignée, le dossier
> conserve trois choses en plus de la valeur : le **mode** de désignation, le **niveau** de contrôle
> obtenu, et la **date de lecture à la source**. Sans ces trois-là, l'affirmation « c'est une donnée
> sourcée » devient invérifiable, et le geste du lecteur redevient de la parole.

Incarnation minimale : **une seule colonne jsonb** sur `address_dossiers`, écrite dans la même
transaction que le snapshot.

```
dpe_attribution_trace = {
  mode:   "liste" | "numero" | "auto",
  niveau: "adresse" | "batiment" | null,   -- null quand mode = liste/auto
  jeu:    "existant" | "neuf",
  lu_le:  "2026-08-21T..."                 -- lecture ADEME, distinct de selected_dpe_at
}
```

Une colonne, aucune migration de l'existant (les dossiers antérieurs portent `null`, ce qui est la
vérité : on ne sait pas), aucun changement d'écran obligatoire. C'est le plus petit geste qui rend
l'affirmation durablement défendable.

**Attribution visible, dans les deux sens.** Le producteur nommé reste l'ADEME, jamais le lecteur :
la valeur n'est pas de lui. Mais le **geste** est de lui, et il doit rester visible et réversible ;
le statut `pending` réinscriptible (commentaire de tête de la route) le permet déjà.

---

## 3. LA QUESTION CENTRALE — régime de conservation. Verdict : suppression exécutée, pas de date de revue

### Les faits qui commandent

- **La finalité est éteinte.** `supabase/11_terrain_observations.sql` annonce en commentaire une
  « future intelligence territoriale collective », une historisation datée et une « API d'agrégation
  anonymisée par commune, avec seuil minimum (ex. 30 observations) ». La doctrine validée ferme
  cette porte : toute mutualisation constituerait un autre produit et exigerait une décision
  explicite. La collecte n'avait donc plus qu'une finalité vivante (nourrir la lecture du lecteur),
  et le retrait de l'interface l'éteint.
- **La donnée n'est lue nulle part** pour `terrain_observations` (vérifié par grep : seules
  occurrences dans `src/app/api/terrain-observations/route.ts`, en écriture, et un commentaire de
  `QuartierWorkbook.tsx`).
- **Aucun exécuteur n'existe.** `vercel.json` ne contient pas de `crons`. Il n'y a pas de
  `.github/workflows`. Aucune tâche planifiée ne peut exécuter un `delete_after`.
- **Le contenu est du personnel non structuré.** `free_text` / `workbook_quartier.note` est du texte
  libre attaché à un `user_id` nominatif : il peut contenir de la santé, du voisinage, des tiers
  nommés. C'est la fraction la plus sensible et la moins exploitable de l'ensemble.
- **futur•e vend son indépendance et sa rigueur** (invariant n°7). Une donnée personnelle gardée
  « au cas où » est exactement ce qu'un lecteur méfiant soupçonne d'un service gratuit.

### Pourquoi le RGPD tranche, et dans un seul sens

Trois principes de l'article 5 pointent tous dans la même direction :

- **Finalité déterminée (5.1.b).** Une donnée conservée pour un usage non décidé est conservée sans
  finalité. « On verra plus tard » est la définition littérale de ce que le texte interdit.
- **Minimisation (5.1.c).** Le workbook résidence n'a même pas de code INSEE : il ne dit rien
  d'exploitable sur un territoire. La quantité de donnée pertinente pour une finalité éteinte est
  zéro.
- **Limitation de conservation (5.1.e).** La durée doit être justifiée par la finalité. Sans
  finalité, il n'existe aucune durée à justifier — donc aucune date, même lointaine, ne peut
  s'argumenter. 21/02/2027 ne se défend pas mieux que 21/02/2029 : les deux sont arbitraires.

Argument supplémentaire, décisif contre la « dormance » : si la mutualisation renaissait un jour,
ces données **ne pourraient pas y servir**. Une donnée collectée sous une finalité individuelle ne
se recycle pas dans une finalité collective sans consentement nouveau. La conserver ne prépare donc
rien : elle ne fait porter qu'un risque, sans option en face.

### Ce qui doit se passer, concrètement

**À la date du retrait de l'interface, dans la même livraison. Pas le 21/02/2027.**

Ordre des gestes (le premier conditionne les suivants) :

1. **Code d'abord.** Retirer l'écran, la route d'écriture `POST /api/terrain-observations`, la
   branche `field === "workbook_quartier"` de `src/app/api/profile/route.ts` (lignes ~104-115), et
   le bloc d'injection de `src/app/api/ask/route.ts` (~488-518). Tant qu'une route écrit, supprimer
   ne fait que vider un seau percé.
2. **Puis la base**, en une migration numérotée à la suite : `drop table public.terrain_observations`
   et `alter table public.user_profiles drop column workbook_quartier`. Supprimer la table emporte
   ses commentaires, et c'est important : **un commentaire SQL est une promesse qui survit à la
   décision qui l'a annulée.** Laisser vivre « intelligence territoriale collective » et « seuil de
   30 observations » dans le dépôt, c'est garantir que quelqu'un les rouvre dans un an comme une
   feuille de route.
3. **Ne pas conserver de copie**, ni dump, ni export hors dépôt. Une copie n'est pas une suppression,
   et une copie non inventoriée est pire que la table.
4. **Ne pas toucher à `report_context.discovery_workbook`**, qui est vivant et légitime : il est lu
   (`src/app/(account)/rapport/quartier/page.tsx` ligne ~79, `src/app/api/synthesize-quartier/route.ts`),
   il est **rattaché à un INSEE** (clé primaire `(user_id, insee)`), et son contenu
   (`{ priority, concern }`, écrit par `src/app/api/report-context/route.ts` ligne ~58) relève de la
   **nature 1, contexte sur soi** : des préférences, pas des constats sur le monde. La doctrine ne
   lui reproche rien. Le distinguer explicitement évite qu'un futur nettoyage l'emporte par
   ressemblance de nom.
5. **Si le porteur veut garder une trace du passage**, garder une **mesure**, jamais la donnée : un
   nombre de comptes ayant répondu, sans identifiant, écrit une fois dans le journal de décision ou
   le vault. C'est ce qui répond au besoin réel (« combien de gens ont joué le jeu ? ») sans
   conserver une ligne personnelle.

### La règle générale à graver, plus utile que le cas d'espèce

> **Toute colonne de données personnelles a un consommateur nommé dans le code.** Une colonne que
> rien ne lit n'est pas un actif dormant, c'est une dette de conservation. Quand son dernier
> consommateur disparaît, elle disparaît dans la même livraison.

Elle est **testable par grep**, ce qui la rend vivante là où une « date de revue » compte sur une
mémoire humaine à six mois. Et elle évite la faute qui coûterait le plus cher à ce produit :
**écrire une échéance et ne pas l'exécuter**. Une date affichée non tenue est une preuve datée d'un
engagement non tenu ; c'est strictement plus dommageable, pour un produit qui vend sa rigueur, que
l'absence de date.

---

## 4. Une nouvelle question peut-elle « récupérer » les anciennes réponses ? Non, sur les cinq champs

La règle d'équivalence est celle que le brief a déjà trouvée pour la surface (Carrez contre surface
habitable) : **deux valeurs ne se rapprochent que si elles décrivent la même chose sous la même
définition**, et c'est plus exigeant que le même grain. Ici il faut trois identités : même **objet**,
même **sujet grammatical** (qui parle de quoi), même **ancrage géographique**.

Les questions sont dans `src/app/(account)/compte/QuartierWorkbook.tsx`, lignes 44-86.

| Champ | Libellé | Nature réelle | Récupérable ? | Motif |
|---|---|---|---|---|
| `heat` | « L'été, comment tenez-vous déjà dans votre quartier ? » | mixte : question `self_experience`, options rédigées en `place_attribute` (« L'été reste supportable ») | **Non** | la question porte sur la personne, les réponses sur le monde. Une réponse ne dit pas laquelle des deux le répondant a comprise. Aucun champ nouveau ne peut hériter d'une ambiguïté de sujet. |
| `water` | « L'eau est-elle déjà devenue un sujet dans votre quartier ? » | `place_attribute` | **Non** | options non homogènes entre elles : « Je ne me sens pas concerné » parle du répondant, « J'ai déjà vu quelques tensions » parle du quartier. L'échelle est de surcroît absente (aucun INSEE). Deux ruptures d'équivalence, pas une. |
| `shelter` | « Votre quartier reste-t-il agréable pendant les fortes chaleurs ? » | `place_attribute` | **Non** | c'est exactement l'affirmation que `doctrine/data.md` § « un équipement n'est pas un refuge » refuse de laisser porter sans caractérisation. Une question admissible existe (« avez-vous, à moins de dix minutes à pied, un lieu où vous allez quand il fait trop chaud ? ») mais elle porte sur un **fait d'usage vérifiable par le répondant**, pas sur l'agrément d'un quartier : question différente, réponse non transférable. |
| `change` | « Avez-vous observé des changements dans votre quartier ces dernières années ? » | `place_attribute`, non daté, non borné | **Non** | doublon d'une source en place, et c'est l'argument le plus dur : la question demande au lecteur ce que **ERA5-Land (1961→) et DRIAS-TRACC** racontent déjà, mieux, avec une échelle et une période. `inventaire-sources.md` : « existe-t-il déjà une donnée qui raconte la même chose ? » — oui, et elle est meilleure. La question n'aurait pas dû être posée. |
| `note` | note libre | texte non structuré | **Non, et à supprimer en priorité** | contenu inconnu, potentiellement des tiers nommés ou des catégories sensibles. Aucun champ structuré ne peut « récupérer » du texte libre sans que quelqu'un le lise, ce que personne n'a le droit de faire ici. |

**Bilan : 0 sur 5.** Ce n'est pas un accident, c'est un diagnostic : les quatre questions ont été
écrites pour alimenter une ambiance, pas une décision. Deux échouent sur le sujet grammatical, une
sur la doctrine du refuge, une sur le doublon avec une source mesurée, la cinquième sur sa nature.
La conclusion de conception qui en découle est plus précieuse que les données perdues :

> Une question admissible se reconnaît avant d'être posée : elle porte sur un **fait que le
> répondant peut regarder** (ses volets, son brasseur d'air), elle a **un sujet unique et explicite**,
> et **aucune source publique ne la porte déjà**. Les quatre questions du workbook échouent aux
> trois critères ; les quatre champs de la V1 Logement les passent.

---

## 5. Sources publiques qui rendraient la question inutile — vérifié, pas supposé

Règle du dépôt : vérifier avant d'affirmer une lacune. Voici la vérification, champ par champ de la
V1 proposée dans le brief.

### Ce qu'aucune source publique ne porte (la lacune est réelle)

**Logement traversant, protections solaires extérieures, brasseur d'air fixe.** Ces trois champs
n'existent, en France, que dans **le DPE lui-même** : `indicateur_confort_ete`,
`logement_traversant`, `protection_solaire_exterieure`, `presence_brasseur_air` — présents dans
l'API ADEME (audit `docs/audits/2026-07-03-dpe-confort-ete-couverture.md`, ligne 9) et typés dans
`DpeRecord` (`src/lib/dpe-attribution.ts`, lignes 27-36). Hors diagnostic attribué, rien ne les
porte :

- **RNB** : identité bâtimentaire seulement (empreinte au sol, adresses), aucune caractéristique
  thermique, et aucun `rnb_id` dans les DPE — vérifié dans
  `docs/audits/2026-07-30-rnb-dpe-rattachement-batiment.md` (points 1 et 2).
- **Cadastre / API Carto** : géométrie et propriété, rien sur l'enveloppe.
- **ÎCU CSTB / LCZ CEREMA** : échelle IRIS/quartier, déjà réservés au Logement/quartier et
  explicitement écartés d'une lecture Territoire (`inventaire-sources.md`, victoires
  méthodologiques). Ils décrivent **l'extérieur**, jamais le confort intérieur : ce n'est pas la
  même question, et les substituer serait la fausse granularité que la doctrine refuse.
- **Cartes de bruit, canopée, OCS GE** : refusées ou différées, et sans rapport avec le confort d'été
  intérieur.

**Verdict** : demander ces trois éléments au lecteur est légitime. C'est le seul cas où le produit
ne peut pas savoir sans demander, et c'est exactement là que la parole du lecteur a une valeur que
rien ne remplace. Le critère du brief (« on ne demande que ce qui se regarde ») coïncide ici avec le
critère du Curator (« aucune source ne le porte ») : c'est le signe d'un chantier bien cadré.

### Ce que le produit sait déjà, et ne devrait donc pas demander partout

**Type de bâtiment (maison / appartement).** Le dépôt calcule déjà `buildingTypes` dans
`AddressDpeContext` (`src/lib/dpe-address-context.ts`) : les types distincts des diagnostics trouvés
à l'adresse. Quand l'adresse ne porte qu'un type et que la BAN a rendu un `housenumber`, poser la
question revient à demander une information qu'on tient. **Mais** le fichier interdit en toutes
lettres de convertir un contexte d'adresse en caractéristique du logement, et il a raison. Usage
admissible, et un seul : **ne pas poser la question quand elle n'a qu'une réponse possible à
l'adresse**, sans jamais écrire la valeur inférée comme une déclaration. Dans le doute, on demande.

**Année de construction et type, via la BDNB (CSTB).** Vérifié sur data.gouv.fr le 21/08/2026 :
BDNB, licence **ODbL**, dernière mise à jour **22/05/2026**, millésime 2026-02.a, ~32 millions de
bâtiments, agrégeant une cinquantaine de sources publiques, avec fichiers fonciers et
« prédictions énergétiques ». Elle porterait l'année de construction et la typologie sans rien
demander. Trois réserves qui la font **DIFFÉRER**, pas refuser :

1. **ODbL** : attribution *et* partage à l'identique. La contrainte est déjà assumée pour OSM, mais
   elle se réexamine à chaque nouvelle brique, pas une fois pour toutes.
2. **Performances prédites** : l'audit du 30/07 pose déjà la ligne, et elle tient — une couche
   d'identité (géométrie, rattachement, période de construction issue du foncier) est admissible ;
   une **performance modélisée n'entre jamais** dans un dossier payant à la place d'un diagnostic.
   Le risque n'est pas théorique : le jour où `energyState` lirait une classe prédite BDNB, le
   produit aurait franchi sa propre ligne sans qu'aucune décision ne soit prise.
3. **Coût** : dump national lourd pour un solo, pour deux champs qui **ne débloquent pas
   `deriveThermalEvidence`** (`C_NO_DATA` tombe sur `type_batiment`/`isResidential`, pas sur
   l'année). Le gain est le passeport et la synthèse, pas la lecture thermique.

**Conclusion de la vérification** : la V1 du brief demande le bon minimum. Aucune source publique ne
rend inutile de demander le traversant, les protections solaires et le brasseur d'air. Le type peut
souvent être évité par ce qu'on sait déjà de l'adresse. L'année de construction est la seule
candidate à un remplacement par source, et elle ne presse pas.

---

## 6. Ce que je recommande de REFUSER dans ce chantier

1. **La mutualisation, y compris « anonymisée au seuil de 30 ».** Un seuil statistique ne répare pas
   une finalité absente : il rend seulement la restitution moins ré-identifiante. Le seuil répond à
   une question de confidentialité, pas à la question de savoir si futur•e a le droit de parler d'un
   territoire avec la parole de ses lecteurs. Et sur le fond éditorial, une agrégation de ressentis
   serait une **statistique sans échantillon** : ni représentativité, ni tirage, ni redressement,
   affichée à côté de DRIAS et de l'INSEE. C'est le doublon dégradé d'une source mesurée.
2. **Les commentaires SQL qui promettent l'évolution abandonnée.** Ils partent avec la table.
3. **Toute réinjection d'un constat lecteur dans un prompt sans garde-fou déterministe.** Le dépôt
   a déjà payé (11/08 : trois synthèses Logement sur trois enfreignant leur propre prompt). Un prompt
   n'est pas une frontière de sûreté ; les libellés `SHELTER_LABELS` de `ask/route.ts` montrent que
   la faute peut même précéder le modèle, dans le code qui prépare le payload.
4. **L'étiquette DPE déclarée.** Position du brief, à confirmer par le porteur : je la soutiens sans
   réserve. C'est un résultat de calcul, pas un fait observable ; c'est le seul chiffre que le lecteur
   ira opposer à un vendeur ; et le produit sait déjà dire une phrase **vraie** à la place
   (« aucune étiquette n'est attribuée à ce logement »). Échanger une vérité contre une
   vraisemblance sur le point le plus opposable du dossier est le pire échange disponible.
5. **Un `delete_after` sans exécuteur, et une « date de revue ».** Aucun cron n'existe (`vercel.json`
   sans `crons`, pas de `.github/workflows`). Une échéance qu'aucune machine ne tient est une
   promesse à soi-même.
6. **Tout champ déclaré que rien ne consomme** (inertie, ventilation, étage). C'est la doctrine
   anti-catalogue appliquée au lecteur : une question dont la réponse ne change aucune sortie est un
   formulaire qui commence.
7. **Toute note de fiabilité d'une déclaration** (étoiles, « confiance 3/5 », pastille verte/orange).
   ADR-0001 vaut aussi ici : on décrit l'origine et la date, on ne note pas.
8. **Une provenance à quatre valeurs en base.** Le brief a raison : deux valeurs. Une gradation que
   rien ne consomme est une complexité déguisée en rigueur.
9. **Toute modification de `expectedCoverage` par l'existence de la saisie.** On vend ce que les
   bases portent, jamais ce qu'une saisie ultérieure pourrait produire.
10. **La déclaration écrite au profil plutôt qu'au dossier d'adresse.** C'est la faute exacte du
    workbook (global, sans INSEE, contaminant toutes les communes). La leçon vient d'être payée, il
    serait absurde de la rejouer un module plus loin.
11. **La conservation de tout texte libre**, ancien comme nouveau, tant qu'aucun consommateur nommé
    n'existe et qu'aucune règle de traitement des tiers nommés n'est écrite.

---

## Victoire méthodologique (prête à graver dans `inventaire-sources.md`)

| Source | Décision | Pourquoi | Gain | Référence |
|---|---|---|---|---|
| **Observations de terrain des lecteurs** (`terrain_observations`, `user_profiles.workbook_quartier`, 4 questions de vécu + note libre, collectées depuis 2026) | **Refusée comme source, retirée, supprimée** | un constat de lecteur n'entre dans aucun rang de la hiérarchie géographique de `doctrine/data.md` : sa portée est une personne, jamais un territoire. Le code convertissait pourtant le ressenti en attribut territorial (« le territoire absorbe encore bien », `ask/route.ts`) et l'injectait sans code INSEE, donc sur n'importe quelle commune. Une des quatre questions (« changements observés ») doublonnait ERA5-Land et DRIAS, qui répondent mieux, datés et bornés. La mutualisation promise en commentaire SQL (agrégation au seuil de 30) aurait produit une statistique sans échantillon à côté de sources mesurées. | évite une couche « ressenti » indéfendable au cœur d'un produit dont l'actif est la provenance ; évite une dette RGPD (finalité éteinte, donnée jamais lue, texte libre nominatif) ; produit le critère réutilisable d'une question admissible (fait regardable, sujet unique, aucune source publique existante) | ce rapport |

---

## Cohérence et tensions (posées, jamais tranchées par moi)

1. **Suppression immédiate contre conservation dormante.** Je recommande la suppression exécutée à
   la date du retrait. Le seul argument contraire serait la valeur d'un usage futur : il est éteint
   par la doctrine, et de toute façon inaccessible juridiquement sans consentement nouveau. Si le
   porteur choisit malgré tout de conserver, alors la conservation doit être **écrite comme une
   décision assumée avec sa finalité**, pas comme une dormance — parce qu'une donnée sans finalité
   écrite est le seul cas ici qui soit indéfendable devant un lecteur.
2. **Le témoignage attribué change la lecture thermique** alors que l'invariant n°3 exige une source.
   Le brief a déjà résolu la tension architecturalement (`DecisionFact` sourcé, `CaracteristiqueDeclaree`
   à côté, `LectureThermique` consomme les deux sans convertir). Je n'ai rien à y ajouter, sinon que
   cette séparation ne survivra que si elle est **testée**, pas seulement écrite : « la carte apparaît »
   et « la carte dit vrai » sont deux assertions distinctes (`AGENTS.md`).
3. **BDNB et l'ODbL.** Partage à l'identique sur une brique du chemin payant : à instruire au moment
   où la question se pose, pas maintenant.
4. **Faut-il un droit d'accès/portabilité avant suppression ?** Je penche pour non (personne n'a reçu
   de promesse de restitution, et la donnée reste visible dans `/compte` tant que l'écran existe),
   mais c'est un choix du porteur, pas du Curator.

## Mise à jour de l'inventaire (prêt à écrire)

1. **Nouvelle section** dans `docs/vault/recherches/inventaire-sources.md`, après la typologie :
   *« Les apports du lecteur ne sont pas des sources »* — l'axe provenance à deux valeurs (§1), la
   règle « hors hiérarchie géographique », et le renvoi à la doctrine des trois natures.
2. **Une ligne** dans « Les victoires méthodologiques » : le tableau ci-dessus, tel quel.
3. **`doctrine/data.md`, règle 3** : ajouter la phrase « un apport du lecteur n'entre dans aucun de
   ces rangs ; sa portée est une personne ». C'est le point d'ancrage le plus durable de tout ce
   rapport.
4. **`doctrine/editoriale.md`** : le tableau de vocabulaire du §1, dans la section attribution.
5. **Ne rien changer** à `DATA_SOURCES.md` ni à `SOURCES_MODULES_MATRIX.md` : aucune source externe
   n'entre ni ne sort ici.

---

## La version minimale (~90 % de la valeur)

Trois gestes, dans cet ordre, et rien d'autre :

1. **Une migration** qui supprime `terrain_observations` et `user_profiles.workbook_quartier`, après
   le retrait des trois points d'écriture/lecture (`ask/route.ts`, `profile/route.ts`,
   `terrain-observations/route.ts`).
2. **Une phrase dans `doctrine/data.md` règle 3** : l'apport du lecteur n'entre dans aucun rang de la
   hiérarchie géographique, sa portée est une personne. Une phrase gouverne ici mieux qu'une page :
   elle donne un test mécanique applicable à toute future question.
3. **Une colonne `dpe_attribution_trace`** sur `address_dossiers`, écrite dans la transaction
   existante.

Ce qui peut attendre sans coût : la refonte du vocabulaire dans toutes les surfaces, l'instruction
BDNB, et toute question nouvelle au lecteur au-delà des quatre champs de la V1 Logement.

## Quand rouvrir ce sujet

- **Mutualisation** : si un acheteur B2B (collectivité, bailleur) demande explicitement une lecture
  collective du vécu, et **finance** une collecte conçue pour ça, avec consentement dédié. Ce serait
  un autre produit, à instruire par le Business Strategist avant moi. Rien dans les signaux actuels
  ne l'appelle.
- **Confort d'été sans demander** : si un jeu national ouvert publie l'orientation, la traversée ou
  les protections solaires au grain logement hors DPE. Aucun signal aujourd'hui ; le seul candidat
  crédible serait une extension des champs BDNB issus du foncier.
- **BDNB** : à instruire si (a) le passeport se plaint réellement du vide sur l'année de
  construction chez des acheteurs, ou (b) le rattachement bâtimentaire RNB est mis en chantier, où
  les deux sujets se traitent d'un coup.
- **Trace d'attribution DPE** : à durcir immédiatement si un acheteur conteste un diagnostic qui
  n'est pas le sien (c'est déjà le signal de réouverture posé par l'audit du 30/07), ou si les règles
  de `rapprocher` bougent.
- **Ce qui invaliderait ma recommandation de suppression** : la découverte d'un consommateur réel de
  `terrain_observations` que le grep aurait manqué, ou une obligation légale de conservation — je
  n'en vois aucune ici, ces données ne sont ni comptables ni contractuelles.

*Rapport daté. Il vaut pour l'état du dépôt au 21/08/2026, pas au-delà.*
