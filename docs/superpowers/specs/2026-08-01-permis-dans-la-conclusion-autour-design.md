# Les permis dans la conclusion du module Autour

**Date** : 2026-08-01 · **Statut** : SPÉCIFIÉ, pas implémenté. · **Point 2 des quatre restes de**
`2026-08-01-permis-autour-adresse-design.md`.

## Ce que ça répare

`autour-conclusion.ts` ne contient **aucune occurrence de « permis »**. La conclusion déterministe
du module s'assemble sur quatre nombres (portée de pas, équipement automobile, espace vert, ÎCU)
écrits avant le chantier des autorisations d'urbanisme.

À l'écran, l'ordre de rendu est : les repères du quotidien, les infrastructures, **le bloc des
permis**, puis la conclusion. Un lecteur lit donc « un chantier de logements est déclaré ouvert à
moins de 50 m », et juste en dessous une conclusion de module qui n'en tient aucun compte.

C'est exactement le défaut que cette conclusion avait été écrite pour corriger. Son propre en-tête
le dit : « le module rendait des faits et s'arrêtait, le lecteur repartait avec des nombres et sans
lecture ». Le défaut est revenu sur le bloc suivant.

## Ce que le permis apporte à une conclusion

**Une lecture temporelle, et rien d'autre.** Le bloc des permis porte déjà toute la charge
factuelle : présence ou absence, périmètre, objet du registre, année de dépôt, état du dossier,
date de consultation. Une conclusion qui redirait ces faits recopierait le tableau au lieu d'en
donner la lecture.

Ce que les faits ne disent pas, et que la conclusion doit poser : **la configuration décrite
au-dessus est celle d'aujourd'hui, et elle n'est peut-être pas stabilisée.**

### La règle, en une phrase

> La conclusion mentionne un permis non achevé uniquement pour signaler que la configuration
> décrite peut encore changer, sans qualifier la nature ni l'ampleur de cette évolution.

### Pourquoi « non achevé » seulement

Un permis achevé appartient déjà au lieu tel qu'il existe. Il explique une vue, une ombre, un
voisinage qui vient de changer, et c'est bien pour ça que la doctrine du chantier a décidé de
**conserver** les achevés dans le bloc. Mais il ne change rien à ce que la conclusion annonce : ce
qu'il a produit est dans le paysage que le lecteur a visité.

L'absence, elle, n'entre pas non plus dans la conclusion. Elle est déjà dite par le bloc au-dessus,
bornée et vérifiable, et elle concerne trois adresses sur quatre. La répéter coûterait une phrase
sur tous les dossiers pour ne rien ajouter.

Conséquence chiffrée : la conclusion parle de permis sur **une adresse sur quatre au plus** (mesure
du 01/08/2026, 160 adresses, 24,4 % ont un permis à moins de 50 m déposé depuis trois ans, et une
partie de ceux-là sont achevés). Quand elle en parle, ça veut dire quelque chose.

### « changer », jamais « évoluer »

*Évoluer* penche vers l'amélioration en français (« la situation a évolué favorablement » est le
sens par défaut). Sur une phrase dont tout l'enjeu est de ne rien qualifier, le verbe doit être
neutre : **changer**.

### Le modal est obligatoire

« Peut encore changer » est plus faible que la donnée elle-même : une autorisation **est** une
permission de changer, elle ne prouve pas que le changement aura lieu. Supprimer le modal
transformerait une autorisation en effet déjà établi, ce que la doctrine du chantier interdit
depuis le premier jour (« autorisé » n'est jamais « prévu »).

## Les cinq formes, gravées

Toutes précédées de la charnière « Cette configuration peut encore changer : ».

| Composition | Phrase |
|---|---|
| 1 chantier ouvert | un chantier de logements est déclaré ouvert à moins de 50 m, sur un dossier déposé en 2025. |
| 1 autorisation non commencée | une autorisation créant des logements est recensée à moins de 50 m, sans ouverture de chantier déclarée, sur un dossier déposé en 2024. |
| Plusieurs, tous ouverts | deux chantiers de logements sont déclarés ouverts à moins de 50 m. |
| Plusieurs, aucun ouvert | trois autorisations créant des logements sont recensées à moins de 50 m, sans ouverture de chantier déclarée. |
| États mixtes | trois autorisations créant des logements sont recensées à moins de 50 m, dont deux chantiers déclarés ouverts. |

Le « 50 m » de ces cinq exemples est illustratif : la phrase écrit le rayon **gelé dans le
snapshot**, jamais la constante du jour. Voir « Le périmètre vient du snapshot ».

### Ce que la composition dit, et pourquoi

**Le nombre total, puis l'état le plus avancé.** Le nombre établit que ce n'est pas un dossier
isolé, et c'est la seule mesure d'ampleur que la source autorise. L'état nommé est le plus certain
des deux : un chantier ouvert est constaté, une autorisation non commencée peut ne jamais l'être.

Dans le cas mixte, les autorisations non commencées **ne sont pas comptées séparément** : le total
permet de les déduire, et les compter produirait une phrase de registre administratif là où on
attend une lecture.

### L'année

**Elle apparaît si et seulement si un seul dossier est retenu.**

La justification est sémantique : l'année ne se dit que si elle peut être attribuée à tout ce que
la phrase désigne. Au pluriel, prendre la plus récente ferait paraître l'ensemble aussi récent
qu'elle, prendre la plus ancienne produirait le biais inverse, et donner une plage transformerait
la charnière en inventaire, rôle que le bloc précédent tient déjà.

**La règle CODÉE est le comptage** (`retenus.length === 1`), pas la sémantique. Elles divergent sur
un cas : deux chantiers ouverts déposés tous deux en 2025, où l'année pourrait légitimement être
attribuée. Arbitré au plus simple : deux permis dans 50 m du même millésime est rare, et la fidélité
complète coûterait une branche, un accord pluriel et un test pour une phrase que presque personne
ne lira. Le jour où ce cas compte, la règle sémantique est écrite ici et il suffira de l'appliquer.

## Ce qui a été écarté, faute de données

Un second filtre avait été envisagé : ne mentionner le permis que s'il peut changer quelque chose à
la configuration racontée (volume de logements, commerce modifiant l'accès quotidien, opération
importante, dossier annulé ou périmé). **Aucun des trois critères n'est décidable sur ce qui est
gelé**, vérifié dans le code le 01/08/2026 :

- `PermisRetenu = { annee, etat }` (`sitadel-selection.ts:65`). Le snapshot ne porte ni volume, ni
  nature, ni distance fine : la jointure passe par la parcelle, donc « à moins de 50 m » est tout
  ce qu'on sait.
- Les dix colonnes demandées (`sitadel-csv.ts:28`) sont les trois parcelles, l'année de dépôt et
  les trois dates. Aucun nombre de logements.
- Le registre SDES ne recense **que** les autorisations créant des logements. Un commerce, un
  entrepôt, une extension sans logement nouveau n'y figurent pas, donc « équipement modifiant
  l'accès » n'existe pas dans ce jeu.
- L'état se déduit des trois dates, et vaut achevé, chantier ouvert, autorisé non commencé, ou sans
  date. Il n'y a **pas d'état annulé**, et un dossier autorisé jamais commencé peut être périmé
  sans que le registre le dise.

Les porter demanderait de nouvelles colonnes, un `SOURCES_VERSION` bumpé et un recalcul complet de
tous les dossiers existants. Hors périmètre de ce lot.

Le « achevé depuis longtemps » du même filtre est déjà couvert : la fenêtre de sélection est de
trois ans.

## L'implémentation

### Le contrat

```ts
export type AutourConclusion = {
  lead: string;
  /** La charnière temporelle. `null` quand rien de non achevé n'est retenu. */
  mouvement: string | null;
  absences: string[];
  limite: string;
};
```

**Un champ séparé, sans concaténation au `lead`.** Le `lead` décrit l'existant, la charnière parle
du temps : les garder distincts permet au rendu de les poser en deux paragraphes, et rend le test
direct. Une assertion `includes` dans une phrase de trois cents caractères ne dit pas ce qu'elle
vérifie.

`buildAutourConclusion` lit `s.permis`, déjà présent dans le `Face3Snapshot` qu'elle reçoit. Aucun
paramètre nouveau, aucune signature changée.

### Le périmètre vient du snapshot

Le rayon écrit dans la phrase est `p.rayonMeters`, **jamais** la constante `RAYON_PERMIS_M`. C'est
la règle déjà gravée dans `autour-permis.ts` : un dossier créé sous un ancien rayon doit continuer
de décrire le périmètre qui l'a réellement sélectionné. Une phrase bâtie sur la constante du jour
mentirait sur tous les dossiers antérieurs au prochain changement de rayon.

### Les trois façons dont `mouvement` vaut `null`

1. **Aucun permis non achevé retenu**, y compris quand le registre en a trouvé, tous achevés.
2. **`s.permis` absent** : registre non consulté (dossier antérieur au 01/08/2026, ou API muette au
   moment de l'analyse). Le bloc disparaît déjà pour cette raison, et la conclusion doit se taire
   pour la même : un registre non consulté ne se lit jamais comme un voisinage stable.
3. **Source BPE en échec** : `buildAutourConclusion` rend `null` en entier, et un chantier ouvert
   ne la ressuscite pas. « Cette configuration peut encore changer » n'a pas de référent quand
   aucune configuration n'a été décrite. L'information n'est pas perdue pour autant : le bloc des
   permis reste affiché juste au-dessus.

### Le rendu

`AutourModule.tsx`, dans le bloc de conclusion déjà en place : `mouvement` se rend en paragraphe
distinct sous le `lead`, avant les `absences`. Aucun style nouveau, aucun encadré, aucune couleur
d'alerte. La charnière est une phrase de la conclusion, pas un avertissement.

## Les tests

Dix, sous `node --test`, dans `autour-conclusion.test.ts`.

| Cas | Attendu |
|---|---|
| 1 chantier ouvert | l'année est dite |
| 1 autorisation non commencée | « sans ouverture de chantier déclarée », l'année est dite |
| 2 chantiers ouverts | pluriel, aucune année |
| 3 dossiers dont 2 ouverts | « dont deux chantiers déclarés ouverts », aucune année |
| 3 dossiers, aucun ouvert | « sans ouverture de chantier déclarée », aucune année |
| Que des achevés | `mouvement === null` |
| `permis` absent | `mouvement === null` |
| BPE en échec, avec un chantier ouvert | conclusion `null` en entier |
| Aucun futur, aucune ampleur | `mouvement` ne contient ni « va », ni « futur », ni « d'ici », ni « dense », ni un nombre de logements |
| Rayon du snapshot | un snapshot gelé à 80 m écrit « 80 m », jamais 50 |

Les deux derniers verrouillent une doctrine, pas un comportement. Ils sont la raison d'être de ce
tableau : « la conclusion mentionne le permis » et « la conclusion dit vrai du permis » sont deux
assertions distinctes, et la seconde ne se déduit jamais de la première.

## Ce que ce lot ne fait pas

**Les permis n'entrent toujours pas dans le moteur.** Aucun `DecisionFact`, aucune règle, aucun
grain déclaré : ils restent absents du verdict, de la minute et de `ControlesDuDossier`. C'est le
point 1 des quatre restes, et c'est un chantier d'une autre nature, à trancher à froid.
