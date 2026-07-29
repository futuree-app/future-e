# Qualifier une adresse, refuser une vente, encaisser un dossier

- **Date** : 2026-07-30
- **Statut** : conception validée, non implémentée
- **Origine** : `docs/handoff/CURRENT.md` (chantier A, « la porte j'ai une adresse »),
  frontière laissée ouverte par `docs/superpowers/specs/2026-07-29-address-dossiers-design.md`,
  rapport `docs/rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md` §6 et §7.
- **Aucune migration.** `address_dossiers` porte déjà `stripe_payment_intent_id`,
  `amount_paid_cents`, `purchased_at`, `access_revoked_at`. Cette spec n'ajoute aucune colonne et
  aucune table.
- **Ne couvre pas** : l'intake déclaratif et la confirmation du diagnostic (spec B « résolution,
  actualisation et vécu »), le rattachement bâtimentaire par le RNB
  (`docs/audits/2026-07-30-rnb-dpe-rattachement-batiment.md`), le placement manuel d'un bien non
  adressé.

---

## Le blocage que cette spec lève

Aucune surface ne crée de dossier hors de la route administrative. Deux des trois échelles du
produit (Autour, Logement) exigent un dossier. Le webhook Stripe ne sait poser qu'un
`report_grant` communal. Il n'existe donc **aucun chemin par lequel un inconnu paie et reçoit un
dossier**, et rien de payant ne peut exister avant ce chemin.

La variable dominante nommée par le business strategist est le délai jusqu'au premier euro
encaissé. Tout ce qui suit est dimensionné par elle : la qualification existe parce qu'elle mesure
et qu'elle refuse, jamais pour enrichir.

---

## Doctrine du refus

**Le refus porte sur l'identification du bien, jamais sur la matière disponible.**

Un dossier est vendable dès qu'existe un ancrage local stable et non ambigu : une feature BAN de
type `housenumber`. Une feature `street` ou `locality` ne suffit pas : le point désigne alors le
centre d'une voie ou d'un lieu-dit, donc les distances d'Autour se calculeraient depuis le mauvais
endroit, Géorisques au point porterait sur un autre emplacement, et la parcelle éventuellement
trouvée sous ce point pourrait être celle d'un tiers. Le défaut ne serait pas un dossier incomplet :
ce serait **un dossier précis sur le mauvais objet**.

**Une parcelle cadastrale n'est ni nécessaire ni suffisante.** Sans elle, le rapport garde Géorisques
au point, les cavités et mouvements de terrain à 500 m, le GPU patrimonial, Cartofriches au point,
les indicateurs IRIS calculés avec le point, l'altitude, la ZFE et les DPE par `ban_id` :
`georisques-logement/route.ts` a même une branche de `caveat` rédigée pour ce cas. Sous un point
grossier, à l'inverse, elle rend une parcelle réelle qui n'est pas celle du bien.

**L'absence de diagnostic ne refuse jamais rien.** Mesuré sur le chemin BAN réel, communes pondérées
par la population (`docs/audits/2026-07-03-dpe-confort-ete-couverture.md`, résultat 6) : ~20 % des
adresses ont un DPE à l'`identifiant_ban` exact, ~34 % en ont un sous 50 m sous un autre
identifiant, **~44 % n'ont rien**. L'échantillon est de 124 adresses pour ce taux, donc l'intervalle
à 95 % couvre environ 35 % à 53 %, et le biais du tirage (reverse-géocodage près des centres-bourgs)
pousse le vrai taux vers le haut. À 35 % comme à 53 %, refuser sur ce fait refuserait une part
massive d'adresses analysables. Le module Logement est déjà conçu autour de cette dégradation, en
trois états également nobles.

### L'invariant

**La qualification demande de préciser quand le bien n'est pas identifié, avertit quand la matière
manque, nomme toute source qu'elle n'a pas pu interroger, et ne refuse que lorsqu'aucun ancrage
fiable ne peut être établi.**

Corollaire, qui est la raison d'être de l'écran : une source en panne ne se présente jamais comme
une absence de donnée. Confondre les deux ferait dire « aucun diagnostic à cette adresse » là où il
faut dire « nous n'avons pas pu vérifier maintenant ».

### Ce que le refus ne couvre pas, et il faut le savoir avant de l'écrire

La qualification réduit le risque de socle absent. Elle ne réduit pas la déception. « Parcelle
identifiée, sismicité faible, aucun risque réglementaire, pharmacie à 1,8 km » reste un résultat
honnête et décevant à 39 €. Aucun seuil ne couvre ce risque ; seul le contenu du dossier le couvre.

---

## La route de qualification

`POST /api/dossier/qualification`, **publique et anonyme**. C'est le capteur du visiteur froid, et
le visiteur froid est précisément le moment d'achat.

### Deux appels externes, et l'exclusion qui compte

La parcelle cadastrale au point, et les candidats DPE par `ban_id`. **Géorisques n'est jamais appelé
ici.** Cette route porterait notre token sur une surface publique, ce qui publierait gratuitement le
cœur du fan-out payant. La contrainte est de conception, pas de coût.

Un troisième appel a lieu **uniquement** quand la feature reçue est grossière, pour distinguer les
deux issues non vendables (voir ci-dessous).

### Le contrat

```ts
type QualificationOutcome =
  | { status: "qualified";
      anchorSource: "ban_housenumber";
      warnings: QualificationWarning[];
      quote: Quote }
  | { status: "needs_precision";
      reason: "missing_house_number";
      candidates: NearbyHouseNumber[] }   // proposables, voir plus bas
  | { status: "unsupported_at_launch";
      reason: "no_reliable_local_anchor" };

type QualificationWarning =
  | { code: "no_dpe_found" }
  | { code: "no_parcel_reading" }
  | { code: "source_unavailable"; source: "ademe" | "cadastre" };

// Ce que le reverse rend, réduit à ce qu'il faut pour proposer un clic. Aucune
// coordonnée n'est conservée ici : sélectionner un candidat relance une
// qualification complète sur son `banId`, seul chemin qui repasse par l'ancrage.
type NearbyHouseNumber = { banId: string; label: string; distanceM: number };
```

**Trois issues, et l'indisponibilité technique n'en est pas une.** Un échec de vérification répond
par un code HTTP distinct (503, `code: "BAN_VERIFICATION_FAILED"`). Un quatrième état de domaine
aurait offert une symétrie de façade en mélangeant « ce bien n'est pas identifiable » et « notre
appel a échoué ».

**`source_unavailable` nomme sa source.** Sans elle, une panne de l'ADEME et une panne du cadastre
produisent la même phrase, alors que l'une parle du diagnostic et l'autre de la parcelle.

### Distinguer `needs_precision` de `unsupported_at_launch`

Le fait observable est un **reverse-géocodage filtré sur les numéros**, au point de la feature
grossière :

```
GET /reverse/?lon=…&lat=…&type=housenumber&limit=5
```

Des numéros à proximité donnent `needs_precision`, **et l'écran les propose** plutôt que de demander
au lecteur de deviner. Aucun numéro donne `unsupported_at_launch`, appuyé sur un fait vérifié.

Éprouvé le 30/07/2026 : sur « le Cros » à Méounes-lès-Montrieux (83136), une feature `street`, le
reverse rend « 1986 le Cros » à 9 m et « 850 le Vallon » à 44 m. **Le rural est adressé**, par
numérotation métrique des routes, donc le refus y est plus rare que supposé et se règle souvent par
un clic.

**Piège écarté, et il a coûté un contrôle** : `GET /search/?q=rue+Crebillon&citycode=44109&type=housenumber`
rend **zéro** résultat, sur une rue pleine de numéros. Le score plein texte de la BAN ne fait pas
remonter les numéros quand la requête n'en porte pas. L'absence de résultat sur `/search` ne prouve
donc jamais l'absence de numéro : seul le `/reverse` filtré répond à cette question.

### Le cache, et ce qu'il ne met jamais en cache

| Résultat | Cache |
|---|---|
| Parcelle trouvée, parcelle absente confirmée | 24 h par `ban_id` |
| DPE trouvés, aucun DPE confirmé | 24 h par `ban_id` |
| `source_unavailable` (timeout, erreur réseau, 5xx) | **jamais, ou 60 s au plus** |
| Le devis | **jamais** |

Une panne de deux minutes chez l'ADEME afficherait autrement « source indisponible » toute la
journée sur cette adresse. Et un devis dépend des droits d'un compte : mis en cache par adresse, il
fuirait d'un lecteur à l'autre.

Limite de débit par IP sur la route, parce qu'elle interroge nos quotas sans authentification.

---

## Le parcours, et l'identité au dernier moment utile

```
saisie d'adresse (page publique, anonyme)
  → qualification : issue, manques nommés, prix affiché
  → « Créer mon dossier »
  → connexion ou création minimale de l'espace
  → le serveur revalide l'adresse et RECALCULE le prix
  → paiement
  → le webhook crée le dossier
  → page de succès qui attend le webhook
```

**Le compte devient obligatoire après le clic d'achat et avant toute création de PaymentIntent.**
Le droit d'ouvrir un dossier est l'existence de la ligne `address_dossiers`, et cette ligne
appartient à un `user_id` déclaré `not null`. Un encaissement anonyme produirait donc un paiement
sans objet analysable.

**La création de compte ne demande rien d'autre qu'une identité de récupération** : pas de
résidence, pas de projet, pas de préférences, aucun onboarding. Le mot « compte » ou « espace » est
dit plutôt que déguisé, et le motif est fonctionnel : retrouver le dossier, ses sources et ses mises
à jour après l'achat.

### Le trou du 14 €, fermé au passage

`checkout/[product]/page.tsx:97` lit l'utilisateur sans jamais l'exiger, et
`create-payment-intent` accepte `userId: user?.id ?? "anonymous"`. Le webhook, lui, ne pose
entitlements et `report_grant` que sous `if (userId && userId !== "anonymous")`. **Aujourd'hui, en
production, un visiteur non connecté peut payer 14 € et ne recevoir qu'un e-mail.** Personne n'a
payé, donc personne n'a été lésé.

L'invariant est plus large que le dossier : **aucun PaymentIntent n'est créé sans utilisateur
authentifié, pour aucun des trois produits**, tous livrant un droit rattaché à un compte. Le tunnel
14 € y gagne l'écran de connexion qui lui manque.

### La porte

Page publique dédiée, appelée depuis les pages commune (là où le SEO dépose le trafic), depuis la
landing et depuis `/rapport`. Elle prend place à côté des deux autres portes : `/ou-vivre` départage
des territoires, la nouvelle qualifie un bien, `/rapport/dossiers` retrouve les dossiers possédés.

`/dossier` comme nom d'URL de travail. Le libellé public relève du chantier éditorial ; « Analyser
une adresse » nomme l'action plutôt que le livrable, ce qui se comprend mieux dans une navigation.

---

## La frontière de confiance

**Le navigateur désigne une adresse ; le serveur décide de l'adresse réellement achetée.**

`feature_type` décide de l'éligibilité et vient du client. Un client qui affirme `housenumber` sur
une rue obtiendrait le droit de payer 39 € pour une lecture floue, et le dossier créé porterait un
`ban_id` de voie, donc tout se calculerait au centroïde. C'est le défaut que la doctrine du refus
existe pour empêcher.

**La revalidation a lieu au checkout, pas à la qualification.** La qualification est un capteur à
haut volume sans conséquence financière ; le checkout est rare et c'est là que l'argent bouge. Avant
de créer le PaymentIntent, le serveur retrouve la feature par `?q=<label>&citycode=<insee>`,
vérifie que l'identifiant rendu est bien celui reçu, et lit **son** type. Éprouvé :
`?q=2 rue Crebillon&citycode=44109` rend `44109_2300_00002`, `housenumber`.

**Après cette vérification, toutes les valeurs viennent de la feature canonique** : `ban_id`, type,
coordonnées, `citycode`, label, ville, code postal. Aucune valeur reçue du navigateur n'est
transmise au webhook. Sécuriser le type en continuant à faire confiance au client pour les
coordonnées analyserait un point choisi par le client.

**L'invariant, à graver** : aucune donnée décidant de l'éligibilité ou du prix ne provient du
navigateur sans vérification serveur. Les résultats de matière se mettent en cache par adresse ; les
droits et le prix ne se mettent jamais en cache.

---

## Le prix

Troisième entrée dans la carte de prix serveur de `create-payment-intent`, à côté de `one-shot`
(14 €) et `pack-decision` (39 €) :

```ts
"address-dossier": { fullCents: 3900, deepeningCents: 2500 }
```

Le montant se décide par `decidePaidTerritory(claims, insee)`, **déjà livré**
(`src/lib/territory-claims.ts`), sur le `communeParent()` de l'adresse canonique. Vrai donne 25 €,
faux donne 39 €.

- **La déduction est un état recalculé, jamais un crédit consommable.** Elle vaut pour tous les biens
  d'une commune déjà payée, pas seulement le premier.
- Elle est vraie pour un 14 € direct sur cette commune, pour un grant de source `pack_decision`, et
  pour un dossier antérieur payé dans cette commune.
- Elle est fausse pour la seule résidence (un accès offert n'est pas une acquisition, sinon
  `home_insee_code`, qui est déclaratif, deviendrait un bon de réduction) et fausse pour un dossier
  administratif (`stripe_payment_intent_id is null`), sans quoi un dossier de test à Nantes offrirait
  la remise sur tous les biens nantais alors que rien n'a été encaissé.

**Le devis porte son statut**, parce que la qualification anonyme ne connaît pas les droits du
lecteur :

```ts
type Quote =
  | { status: "final"; basePriceCents: 3900;
      territoryDeductionCents: 0 | 1400; amountDueCents: 3900 | 2500;
      checkoutAttemptId: string }
  | { status: "provisional"; basePriceCents: 3900; amountDueCents: 3900 };
```

Un visiteur anonyme voit 39 € avec la déduction **annoncée** : « si vous possédez déjà la lecture de
cette commune, 14 € sont déduits après connexion ». La baisse à 25 € doit être conçue, jamais
surgir comme une mutation inexpliquée du prix. Un visiteur déjà connecté reçoit directement un
devis final.

Renversement assumé, déjà gravé le 29/07 et **à ne pas re-litiger** : le business strategist
recommandait le deuxième dossier à plein tarif pour ne pas brouiller la mesure. Revendre le tiers
d'un ensemble que le compte possède déjà est un fait que futur•e connaîtrait au moment de
l'encaisser, et l'invariant n°1 passe avant la propreté de la mesure.

---

## Le checkout

`checkoutAttemptId` est un uuid **généré par le serveur** avec le devis final, renvoyé par le client
à `create-payment-intent`, et utilisé comme clé d'idempotence Stripe.

**Il ne dérive pas de `(userId, banId, decisionJourneyId)`.** Le produit autorise délibérément
plusieurs dossiers sur le même `ban_id` (deux appartements d'un immeuble sont deux dossiers
légitimes, et l'unicité a été explicitement retirée de la clé). Une idempotence fondée sur le
`ban_id` rendrait à l'acheteur du second bien le PaymentIntent du premier. **L'idempotence empêche le
doublon technique, elle n'interdit pas un second achat métier** : un double clic ou une reprise
réseau réutilise la tentative, un clic explicite sur « créer un autre dossier » en ouvre une
nouvelle.

Aucune table : le devis se recalcule à chaque requête, donc rien ne dépend de la confiance accordée
à ce jeton, qui n'est qu'une clé.

**Les métadonnées du PaymentIntent portent l'adresse canonique entière**, pour que le webhook crée le
dossier sans état intermédiaire : `productType: "address-dossier"`, `banId`, `insee`, `label`,
`city`, `postcode`, `latitude`, `longitude`, `amountDueCents`, `deducted`, `phDistinctId`,
`decisionJourneyId`. Stripe plafonne à 500 caractères par valeur, ce qui suffit.

Contrôles rejoués avant le paiement, dans cet ordre : utilisateur authentifié, adresse revalidée par
la BAN, ancrage toujours vendable, droit territorial relu, prix recalculé serveur.

---

## Le webhook

Une branche `productType === "address-dossier"`, en service role, qui crée la ligne :

```sql
insert into address_dossiers (user_id, ban_id, insee, address_label, city, postcode,
                              latitude, longitude,
                              stripe_payment_intent_id, amount_paid_cents, purchased_at)
values (…)
on conflict (stripe_payment_intent_id) do nothing;

select id from address_dossiers where stripe_payment_intent_id = $1;
```

**L'index unique fait échouer un doublon ; le `do nothing` suivi de la relecture fait réussir le
rejeu.** Le webhook n'a aucune idempotence propre : toute sa protection vient des contraintes de
table, et la spec précédente a explicitement laissé le `ON CONFLICT` à celle-ci. Confondre les deux
ferait croire le rejeu traité alors qu'il lèverait une erreur à chaque fois.

`amount_paid_cents` et `purchased_at` sont écrits **ensemble** avec
`stripe_payment_intent_id` : la contrainte `check` du schéma n'admet que deux états, tout nul ou
tout renseigné.

Le webhook pose ensuite le territoire actif de lecture sur la commune du dossier
(`communeParent()`, sinon PLM ferait lire « Paris 1er »), et il écrit la ligne `payments`.

**Aucun `report_grant` dérivé.** Le droit territorial se déduit de l'existence du dossier, donc
`access_revoked_at` le retire sans laisser un grant orphelin derrière lui.

---

## La page de succès

Elle **ne peut pas supposer le dossier créé** : Stripe confirme côté client avant que le webhook
n'arrive.

Elle interroge une petite route de statut par `payment_intent_id`, qui répond « en attente » ou rend
l'identifiant du dossier. Intervalle court, et une issue explicite au bout d'une trentaine de
secondes : « votre paiement est enregistré, votre dossier s'ouvre dans un instant, vous le
retrouverez dans vos dossiers ». Jamais une page qui tourne indéfiniment, jamais une page qui
affirme un dossier qui n'existe pas encore.

Discipline d'attente déjà en place dans le produit (`src/lib/loading-messages.ts`) : la matière
d'abord, ce que cette lecture permet ensuite, la transparence sur le délai en dernier.

---

## L'instrumentation

### Le défaut à corriger d'abord

**Deux conventions d'identité PostHog cohabitent dans le code.** Le navigateur identifie sur l'UUID
Supabase (`PostHogProvider.tsx:52`, `identify(user.id)`). Les événements serveur émettent sur
l'e-mail (`create-payment-intent:141`, `webhook:157`, et `auth/actions.ts:107` fait un
`identify({ distinctId: email })`). Deux `identify` sur deux clés créent **deux personnes**, pas un
alias : `payment_completed` n'appartient donc pas à la même personne que le parcours qui l'a
précédé.

Le projet porte déjà le bon patron : `ou-vivre` transmet `posthog.get_distinct_id()` au serveur, et
`comparateur-vie/ask/route.ts:70` l'accepte pour émettre sous la même identité.

**Règle pour tous les événements de ce parcours** : le client transmet son `distinct_id` PostHog, le
serveur émet avec **ce** `distinct_id`. Le webhook, seul point sans client, le lit dans les
métadonnées Stripe (`phDistinctId`). Ainsi `identify(user.id)` au `SIGNED_IN` fusionne le parcours
anonyme avec le compte.

**`decision_journey_id` est une propriété métier de parcours, jamais une identité PostHog.** Il
distingue deux recherches du même navigateur à six mois d'écart, là où PostHog agrège tout sur la
même personne. Il vit dans un cookie signé `HttpOnly`, il survit au retour d'authentification, et
**il ne transporte jamais une décision de prix ou d'éligibilité**.

Aucune table de parcours, aucune réclamation atomique, aucun refus de journey appartenant à un autre
utilisateur : sans table, ce cas ne peut pas se produire. La clé d'analyse est le parcours, jamais
le `user_project` (qui est une colonne de `user_profiles`, donc absente chez le visiteur froid, qui
est le moment d'achat).

### Les événements

| Événement | Propriétés | Ce qu'il tranche |
|---|---|---|
| `address_qualification_viewed` | `decision_journey_id`, `insee` | volume d'intention à l'échelle adresse |
| `address_qualification_result` | `status`, `warnings[]`, `has_dpe`, `ban_feature_type`, `insee`, classe de densité | le taux de refus réel, **par segment** |
| `address_qualification_repeat` | `distinct_addresses`, `distinct_communes`, `days_since_first` | **la variable dominante** (pack, pass ou unité) |
| `address_qualification_exit` | `choice: territory_14 \| notified \| left` | ce que devient un refus |
| `address_checkout_viewed` | `amount_due_cents`, `deducted` | dénominateur de conversion |
| `address_dossier_purchased` | `amount_paid_cents`, `deducted`, `rank_in_project`, `days_since_first_qualification` | questions 1 et 4 du rapport business |
| `address_dossier_reopened` | `days_since_purchase` | valeur dans la durée, préalable au pass |

La sortie après un refus est un **événement distinct** du résultat : un événement ne peut pas porter
une décision postérieure à son émission. Les mélanger rendrait le comptage impossible.

Propriété persistante sur la personne : `addresses_qualified_total`.

### Le seuil de réouverture, segmenté

**Le geste de placement manuel redevient prioritaire si le refus dépasse 20 % globalement, ou s'il
exclut durablement une part majeure d'un segment stratégique même quand le taux global reste bas.**

Un taux global de 12 % peut cacher 2 % en ville et 45 % dans le rural, qui est un segment cœur. La
masse urbaine rendrait alors l'échec rural statistiquement invisible.

---

## Cas limites

| Cas | Issue | Ce que le lecteur voit |
|---|---|---|
| `housenumber`, parcelle et DPE trouvés | vendable | prix, et rien de plus à dire |
| `housenumber`, aucun DPE (35 à 53 % des adresses) | vendable | le manque nommé avant paiement |
| `housenumber`, aucune parcelle | vendable | la lecture parcellaire annoncée absente |
| `housenumber`, ADEME en panne | vendable | « nous n'avons pas pu vérifier le diagnostic maintenant » |
| `street`, numéros trouvés à proximité | à préciser | les numéros proposés au clic |
| `locality` sans aucun numéro au reverse | non vendable | le refus, son motif, la commune à 14 € offerte comme information |
| BAN injoignable à la revalidation | 503 | « réessayez dans un instant », aucun PaymentIntent créé |
| Client affirmant `housenumber` sur une voie | bloqué au checkout | la revalidation refuse, l'adresse canonique prime |
| Second bien au même `ban_id` | vendable | panneau de choix, prix d'approfondissement calculé |
| Webhook rejoué | idempotent | le même dossier, un succès |

Le renvoi vers la lecture de commune à 14 € est **offert comme une information, jamais mis en avant
comme le CTA principal**. Un refus qui débouche sur une vente devient une technique commerciale et
perd exactement ce qui le rendait crédible.

---

## Tests

Ils visent des faits, pas nos propres chaînes de caractères.

- `decidePaidTerritory` répond faux pour la seule résidence, faux pour un dossier administratif dans
  la commune, vrai pour un `pack_decision`, vrai pour un dossier antérieur payé. **Déjà couvert**
  (`src/lib/address-dossier-store.test.ts`), à étendre au calcul du montant : 2500 contre 3900.
- La décision de vente est une fonction pure de `(banFeatureType, nearbyHouseNumbers)`, testable sans
  réseau, y compris le cas `street` avec numéros et le cas `locality` sans numéro.
- Une panne de source produit un avertissement portant sa source, jamais `no_dpe_found`. C'est le
  test qui empêche une panne de mentir sur l'adresse.
- Le cache ne retient pas `source_unavailable`.
- Le webhook rejoué sur le même `payment_intent_id` rend le dossier existant **et répond en succès**,
  éprouvé contre la base réelle. La contrainte unique garantit qu'un doublon échoue ; ce test
  garantit que le rejeu réussit, ce qui est une autre affirmation.
- `create-payment-intent` refuse un appel non authentifié, pour les trois produits.
- Une adresse dont le type est falsifié par le client est refusée au checkout.
- Deux tentatives avec le même `checkoutAttemptId` rendent un seul PaymentIntent ; deux tentatives
  distinctes sur le même `ban_id` en rendent deux.

---

## Ce qu'on ne construit pas

Carte, sélecteur de parcelle, placement manuel d'un bien non adressé. Table de parcours, table de
qualifications, rattachement post-paiement par e-mail. Pack, pass de recherche, remise dégressive,
grille tarifaire, test A/B de prix, tableau de bord. Téléversement de documents. Rattachement
bâtimentaire RNB. Intake déclaratif et confirmation de diagnostic, qui appartiennent à la spec B et
vivent **après** le paiement, parce qu'aucune déclaration ne peut fournir ce qui manque à un ancrage
absent : ce qui manque est la position du bien.

---

## Pièges

- **Un `<Link>` vers une Route Handler ne navigue pas.** Tout lien vers un `route.ts` est un `<a>`.
  Le router demande un payload RSC, la Route Handler répond une redirection HTML, et le clic reste
  sans effet, sans erreur console ni signal serveur.
- **`GET /search/?…&type=housenumber` ne prouve pas l'absence de numéro** (contrôle positif échoué
  sur rue Crébillon). Seul `/reverse/?…&type=housenumber` répond à cette question.
- **PLM** : `communeParent()` sert au droit et au prix, la colonne `insee` du dossier garde le code
  local de l'arrondissement, dont dépendent les données fines. Ne jamais normaliser la colonne.
- **Code INSEE, jamais code postal**, sinon ADEME, DRIAS et Hub'Eau échouent en silence.
- **`ENABLE_ADMIN_DOSSIER_CREATION` et `FUTUREE_ADMIN_EMAILS` sont à retirer de la production** le
  jour où ce checkout existe. Ce genre de porte reste ouverte des années.
- `tsconfig.json` exclut `**/*.test.ts` du typecheck et eslint les ignore : un lint vert ne dit rien
  d'eux. Un module qui importe `server-only` casse sous `node --test`. Un commentaire JSX dans un
  ternaire casse le build. Un backtick dans un commentaire CSS ferme le template literal d'un bloc
  `<style>`.
- Le hook de pre-commit lance `index:verify`. Push direct sur `main`, pas de PR, **un push déploie en
  production**.
- Deux sessions dans le même arbre de travail : stager par chemin, jamais `git add -A`.
