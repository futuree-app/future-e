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
au-dessus est celle observée lors de l'analyse, et elle n'était peut-être pas stabilisée.**

Le temps de cette phrase n'est pas un détail de style. Le snapshot est gelé : écrire « celle
d'aujourd'hui » referait, dans la doctrine, le piège de « à ce jour » qu'on a retiré de la phrase
rendue.

### La règle, en une phrase

> La conclusion mentionne un permis non achevé uniquement pour signaler que la configuration
> décrite peut encore changer, sans qualifier la nature ni l'ampleur de cette évolution.

### Pourquoi « non achevé » seulement

Un permis achevé ne signale plus une transformation à venir au moment de l'analyse. Il explique une
vue, une ombre, un voisinage qui vient de changer, et c'est bien pour ça que la doctrine du chantier
a décidé de **conserver** les achevés dans le bloc. Mais il ne change rien à ce que la conclusion
annonce.

Cette formulation est plus étroite que « il appartient déjà au lieu tel qu'il existe », et
volontairement : rien n'établit que l'effet d'un achevé soit visible à la visite, ni qu'il soit
capté par les autres sources du dossier. Ce qu'on sait de lui, c'est seulement qu'il n'annonce plus
rien.

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
| 1 chantier ouvert | un chantier de logements est déclaré ouvert à moins de 50 m ; le dossier a été déposé en 2025. |
| 1 autorisation non commencée | une autorisation créant des logements est recensée à moins de 50 m, sans ouverture de chantier déclarée ; le dossier a été déposé en 2024. |
| Plusieurs, tous ouverts | deux chantiers de logements sont déclarés ouverts à moins de 50 m. |
| Plusieurs, aucun ouvert | trois autorisations créant des logements sont recensées à moins de 50 m, sans ouverture de chantier déclarée. |
| États mixtes | trois autorisations créant des logements sont recensées à moins de 50 m, dont deux chantiers déclarés ouverts. |

Le « 50 m » de ces cinq exemples est illustratif : la phrase écrit le rayon **gelé dans le
snapshot**, jamais la constante du jour. Voir « Le périmètre vient du snapshot ».

**Le point-virgule des deux formes au singulier est porteur.** L'année est celle du DÉPÔT, jamais
celle de l'ouverture du chantier : « déclaré ouvert en 2025 » serait factuellement faux. Un
complément collé au verbe (« ouvert à moins de 50 m sur un dossier déposé en 2025 ») laisse les deux
dates se contaminer, et « dans le cadre d'un dossier déposé en 2025 » remplace la raideur par la
locution des circulaires. Le point-virgule rattache l'année au dépôt, et à lui seul.

### Ce que la composition dit, et pourquoi

**Le nombre total, puis l'état le plus avancé.** Le nombre établit que ce n'est pas un dossier
isolé, et c'est la seule mesure d'ampleur que la source autorise. L'état nommé est le plus certain
des deux : un chantier ouvert est constaté, une autorisation non commencée peut ne jamais l'être.

Dans le cas mixte, les autorisations non commencées **ne sont pas comptées séparément** : le total
permet de les déduire, et les compter produirait une phrase de registre administratif là où on
attend une lecture.

### L'année

**L'année apparaît uniquement lorsque la conclusion mentionne une seule autorisation.** Au pluriel,
elle est toujours omise, **même lorsque tous les dossiers portent le même millésime** : l'ajouter
alourdirait la charnière et la rapprocherait de l'inventaire que le bloc précédent rend déjà.

C'est une règle éditoriale, pas un raccourci d'implémentation : `retenus.length === 1` est la
traduction exacte de la décision, et non son approximation.

Ce qu'elle écarte, au passage : prendre la plus récente ferait paraître l'ensemble aussi récent
qu'elle, prendre la plus ancienne produirait le biais inverse, et donner une plage transformerait
la charnière en inventaire.

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

### L'invariant de rendu : la charnière n'a pas d'ancrage temporel à elle

« Cette configuration peut encore changer » ne porte aucune date. Sur `/rapport/logement`, elle
n'en a pas besoin : le bloc des permis est rendu juste au-dessus et porte « Registre national des
autorisations d'urbanisme, consulté le 1er août 2026 ».

**Cette dépendance est un invariant, pas une coïncidence de mise en page.** Le jour où la conclusion
du module est reprise ailleurs (un PDF, un partage, une synthèse qui en cite le texte), la phrase
flotte : un lecteur de 2028 lira au présent une possibilité constatée en 2026.

La règle : `mouvement` ne s'affiche jamais sur une surface qui ne porte pas, quelque part, la date
de consultation du registre. Charger la phrase elle-même a été écarté, la charnière devant rester
courte et le bloc portant déjà la date au bon endroit.

## Les tests

Onze, sous `node --test`, dans `autour-conclusion.test.ts`.

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
| Aucun futur | `mouvement` ne contient ni « va », ni « futur », ni « d'ici », ni « dense », **en limites de mot** |
| Aucun volume | `mouvement` ne contient aucune construction « N logements », le N étant en chiffres ou en lettres |
| Rayon du snapshot | un snapshot gelé à 80 m écrit « 80 m », jamais 50 |

Les trois derniers verrouillent une doctrine, pas un comportement. Ils sont la raison d'être de ce
tableau : « la conclusion mentionne le permis » et « la conclusion dit vrai du permis » sont deux
assertions distinctes, et la seconde ne se déduit jamais de la première.

**Deux pièges dans l'écriture de ces tests, à ne pas payer deux fois :**

- **Les limites de mot ne sont pas optionnelles.** Cherché en sous-chaîne, « va » frappe *travaux*
  et *évaluation*, deux mots parfaitement légitimes ici. Le test doit viser `\bva\b`, sans quoi il
  échouera sur une phrase juste et sera désarmé plutôt que corrigé.
- **Le volume interdit s'écrit aussi en lettres.** La charnière écrit ses nombres en toutes lettres
  (« trois autorisations »), donc un test sur `\d+\s+logements` laisserait passer « deux
  logements ». L'interdiction porte sur le VOLUME de logements, jamais sur le nombre
  d'autorisations, qui est légitime et attendu.

## Ce que ce lot ne fait pas

**Les permis n'entrent toujours pas dans le moteur.** Aucun `DecisionFact`, aucune règle, aucun
grain déclaré : ils restent absents du verdict, de la minute et de `ControlesDuDossier`. C'est le
point 1 des quatre restes, et c'est un chantier d'une autre nature, à trancher à froid.
