# Le dossier daté et versionné

**Date** : 2026-08-05 · **Statut** : **SPEC, non implémentée.** · **Avant la première vente réelle.**

**Le problème en une phrase** : futur•e vend une décision, et cette décision se réécrit toute seule.

## Ce qui se passe aujourd'hui

`/rapport` et `/rapport/quartier` sont en `force-dynamic`. `buildCommuneDossier` réassemble le
dossier à chaque ouverture, avec le moteur du jour, le projet courant, et des lectures externes
fraîches. Aucune version du dossier acheté n'est conservée.

Un lecteur qui revient six mois après son achat ne consulte donc ni son dossier, ni un dossier
cohérent : il lit un **hybride**, où les règles et les formulations viennent du moteur courant
pendant que les mesures d'adresse viennent du snapshot d'origine. Rien à l'écran ne le dit.

Pour un produit dont l'argument est la vérifiabilité, la question « qu'est-ce que futur•e m'avait
dit, avec quelles données et quelles règles, quand j'ai pris ma décision ? » n'a aucune réponse.

C'est le patron d'`AGENTS.md` au niveau du produit entier. Chaque fait porte la date de consultation
de sa SOURCE, et c'est bien. Mais **une date de source ne dit rien de la version des RÈGLES.** Un
seuil qui change réécrit le récit sans que rien ne le signale.

## Ce que l'inventaire a établi, et qu'il faut regarder en face

Trois doctrines écrites dans le code vont, chacune pour de bonnes raisons, **contre** le
versionnement. Le motif est constant : le produit a systématiquement choisi la fraîcheur contre la
reproductibilité.

| Où | Ce qu'elle dit | Statut |
|---|---|---|
| `server/autour-response.ts` | « un dossier ouvert six mois après sa génération mêle deux temporalités. Ce n'est acceptable QUE parce que chaque enrichissement affiche sa source et son millésime » | **Conservée**, et généralisée |
| `server/logement-decision-data.ts` | « Fraîcheur (honnête) : on re-fetch depuis la source vivante, JAMAIS on ne persiste/fige en base » | **Amendée** : voir plus bas |
| `server/iris-logement-store.ts` | la valeur n'est pas persistée, « la figer dans un snapshot ferait cohabiter des dossiers qui n'annoncent pas le même millésime » | **Conservée** |

Ces trois positions ne sont pas des oublis. Elles répondent à un vrai risque : un dossier qui fige
un arrêté sécheresse afficherait en 2027 une alerte de l'été 2026. **Le versionnement doit donc
gagner la reproductibilité sans perdre cette honnêteté-là.**

## La décision

> **On fige la décision et tout ce qui la prouve. Le contexte reste vivant, et se présente comme
> vivant.**

Le défaut n'est pas que le rapport mêle deux temps. C'est que rien ne dit lequel on lit.

## Les trois natures, et la frontière se trace CHAMP PAR CHAMP

La frontière ne se déduit pas du nom de l'API. Une même source peut fournir les trois natures.

**1. Preuve historique de la décision.** Toute valeur qui a servi à évaluer une règle, à produire un
fait, une conclusion ou un contrôle. Elle entre dans l'artefact et n'en bouge plus. Cela inclut les
lectures Géorisques du Territoire (`loadModuleFacts` charge `[entry, climat, georisques, radon]`) et
celles de l'adresse (`fetchLogementDecisionData` : Géorisques adresse et parcelle, cavités,
protections patrimoniales, sinistralité), qui alimentent aujourd'hui le moteur en direct.

**2. État en vigueur.** Ce dont le sens même est « en ce moment » : arrêtés sécheresse (Vigieau,
cache 1 h), arrêtés CatNat, zonages en cours de révision. Relu à chaque ouverture, **jamais figé**,
et présenté comme un état daté du jour de la consultation.

**3. Enrichissement millésimé.** Recensement INSEE, artefacts IRIS. Relu, à condition d'afficher son
millésime là où il s'affiche. C'est la doctrine `autour-response.ts`, inchangée.

**Le cas qui décide de tout** : une donnée de nature 2 qui alimente le moteur devient AUSSI une
donnée de nature 1. Sa valeur à la génération est conservée comme observation historique, et l'état
du jour s'affiche à côté, dans un bloc distinct. On ne supprime pas le premier, qui explique la
décision achetée ; on ne présente pas le premier comme l'état actuel.

## L'invariant des preuves

> **Aucune preuve d'une décision figée ne dépend d'une valeur relue au moment de la consultation.**

Sans lui, le verdict d'août 2026 resterait figé pendant que sa démonstration dériverait : « 74 % des
ménages ont une voiture » dans le fait, « 68 % » dans le bloc vers lequel la preuve renvoie. Pour
futur•e, ce serait presque aussi grave que de recalculer le verdict.

Chaque `EvidenceRef` figée doit donc être autosuffisante : valeur observée, source, date
d'observation ou millésime, convention appliquée. Un lien depuis une preuve historique ne vise un
bloc vivant que si ce bloc affiche encore la valeur historique ; sinon il ouvre le dépliable de
preuve contenu dans l'artefact.

## Le contrat

Un emballage distinct, pour ne pas modifier le type métier :

```ts
type DecisionArtifactV1 = {
  schemaVersion: 1;
  generatedAt: string;      // ISO 8601
  engineVersion: string;    // version du moteur ET des conventions
  projectSnapshot: UserProject;
  dossier: Dossier;
};
```

`Dossier` ne contient aucune fonction : il est sérialisable en JSON tel quel, et
`DossierDecisionSection` le reçoit déjà assemblé. **Il n'est donc pas nécessaire de rejouer le
moteur pour ressortir un dossier de 2026** : il suffit de le relire et de le rendre.

## La table

Patron des migrations 23 et 27 : RLS `own`, aucun `update`, un artefact ne se modifie pas.

```sql
create table if not exists public.decision_artifact (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  insee_code     text not null,
  scope_key      text not null,          -- "commune" | "logement:<dossier_id>"
  version        int  not null default 1,
  status         text not null,          -- 'generating' | 'ready' | 'failed'
  schema_version int  not null,
  engine_version text not null,
  generated_at   timestamptz,
  payload        jsonb,                  -- DecisionArtifactV1, null tant que generating
  created_at     timestamptz not null default now(),
  unique (user_id, insee_code, scope_key, version)
);
```

La contrainte unique porte l'idempotence : un webhook rejoué ou deux ouvertures concurrentes ne
créent jamais deux artefacts pour la même version.

## Où et quand il se génère

**À la délivrance, pas à la première ouverture.** Quelqu'un qui achète le 5 août et revient le
20 septembre recevrait sinon le moteur de septembre, ce qui est précisément le défaut qu'on corrige.

Le point de création est le webhook Stripe, après la pose des droits :

1. Stripe confirme le paiement.
2. Le droit est créé (inchangé).
3. La ligne `decision_artifact` est insérée en `generating`.
4. La génération part dans `after()` de `next/server`, qui répond d'abord à Stripe puis travaille
   (`waitUntil` sur Vercel, dans la limite du `maxDuration` de la route).
5. Succès : `payload` écrit, `status = 'ready'`, `generated_at` posé.
6. Échec : `status = 'failed'`. **Le droit reste ouvert**, et la génération est retentable.

**On n'enregistre jamais un dossier de repli.** Si l'augmentation Adresse échoue,
`DossierAvecLogement` retombe aujourd'hui sur le dossier communal : ce repli est acceptable à
l'écran, il ne doit pas devenir l'artefact définitif d'un dossier d'adresse payé.

## La relecture, et ce qui la protège

`schemaVersion` ne suffit pas : TypeScript ne valide rien au moment de relire un JSON. Il faut

- un **parseur d'exécution** qui valide la forme et refuse plutôt que de caster (patron de
  `decision-narrative-store.ts`, « le JSON de la base est VALIDÉ, jamais casté ») ;
- une **fixture V1 réelle**, produite par le code du jour, conservée dans les tests.

La question que la fixture protège :

> Le code de février 2027 sait-il encore ouvrir un artefact réellement produit en août 2026 ?

## Ce que l'écran doit montrer

Trois registres éditoriaux distincts, pas une petite date grise partout :

- en tête de la décision : **« Analyse générée le 5 août 2026 »**, avec la version du moteur ;
- sur un bloc vivant : **« État consulté le 5 août 2026 à 11 h 30 »**, jamais « en direct » ni « mis
  à jour à l'ouverture » quand la valeur vient d'un cache d'une heure ou d'un jour ;
- sur une donnée millésimée : **« Insee, recensement 2022 »**, là où elle s'affiche ;
- en cas de panne d'une source vivante : **« État actuel non disponible »**, jamais la dernière
  valeur connue présentée comme actuelle.

## L'amendement de doctrine, à écrire explicitement

`server/logement-decision-data.ts` dit « JAMAIS on ne persiste/fige en base ». Ce lot le contredit,
et le contredit **pour une raison précise** : ce qui est figé n'est pas la donnée réglementaire
courante, c'est **la valeur qui a fondé une décision vendue**. Les deux coexistent, et l'écran les
sépare. La phrase devient :

> On ne fige jamais une donnée réglementaire pour la présenter comme actuelle. On conserve la valeur
> qui a fondé la décision achetée, et l'état du jour se relit à côté.

Sans cet amendement écrit, un futur agent lira la doctrine, verra la persistance, et conclura à un
bug.

## Le test d'acceptation

> Générer un dossier. Modifier un seuil du moteur ET la valeur d'une source vivante. Rouvrir.
> **La décision et ses preuves sont identiques ; seul le bloc explicitement présenté comme actuel a
> changé.**

## Ce que ce lot ne fait pas

Ni régénération, ni comparaison entre versions, ni interface d'historique. **Une version 1
immuable**, et rien de plus. Une actualisation future créera un artefact de version 2, distinct,
sans réécrire le premier : c'est une décision commerciale à prendre plus tard, pas une dette de ce
lot.

Il ne rend pas non plus le dossier exportable. Le PDF reste un chantier autonome, qui dépendra de
cette version datée plutôt que de la précéder.

## Ce qu'il faudra corriger quand il sera livré

Les CGV disent aujourd'hui que le dossier est recalculé à chaque ouverture et qu'aucune copie figée
n'est conservée. **C'est vrai aujourd'hui et ce sera faux le jour de la livraison.** La réécriture
de ce paragraphe est la dernière tâche du lot, pas un oubli à rattraper :

> L'achat donne lieu à la génération d'un dossier daté, établi avec les données et la version du
> moteur disponibles lors de sa production. Cette version est conservée dans votre compte et n'est
> pas modifiée rétroactivement. Les évolutions ultérieures de futur•e pourront donner lieu à de
> nouvelles versions distinctes.
