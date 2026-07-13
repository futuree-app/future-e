# Passation — session en cours

**Horodatage** : 2026-07-14 · **Branche** : `feat/dossier-slice-2-conclusion-redigee`

## Où on en est

**Slices 2 et 2.1 du dossier de décision LIVRÉES** : la conclusion est rédigée par l'IA sous contrat
strict, et le verdict répond enfin à « ce lieu me correspond-il ? » au lieu de « aucune contrainte
n'est contredite ». Codé, testé (262 verts), buildé, **sondé sur le vrai modèle (15/15)** et
**vérifié à l'écran, flag allumé**, sur un projet riche (Toulouse, 7 rue du Taur).

Reste : pousser, ouvrir la PR, puis **attaquer la couverture** (c'est l'urgence, cf. plus bas).

## Ce que fait la slice 2.1

- **Le déterministe gagne le droit de dire qu'un lieu CORRESPOND, à condition de le prouver.** Deux
  mesures dans `src/lib/decision/criteria-registry.ts` : **couverture** (part des critères DÉCLARÉS
  réellement examinés, avec le **couperet** : une contrainte dure non examinée interdit « élevée »)
  × **orientation** (`favorable` / `minor_reserves` / `major_reserves` / `incompatible`), jamais un
  solde : rien ne rachète une réserve critique. `favorableCount` : « plusieurs dimensions » exige ≥ 2.
- **La couverture est une conséquence OBSERVÉE des règles.** `COVERED_PREFERENCE_KEYS` (liste tenue à
  la main, qui dérivait en silence) a disparu.
- **Contrat d'outcome tranché** : `not_applicable` = hors sujet, `satisfied` = examiné, rien à redire.
  Avant, une exposition inondation FAIBLE rendait `not_applicable` : une bonne nouvelle comptée comme
  un trou de couverture.
- **Règle `departements`** : le dossier annonçait « nous n'avons pas examiné les départements visés »
  sur un rapport intitulé Toulouse, à qui avait écrit « impérativement en Haute-Garonne ».
- **La conclusion NOMME, les cartes DÉMONTRENT.** `DecisionFact.topic` (le SUJET, 3-6 mots, distinct du
  constat, exigé par `assertFactValid`, **sans le grain**) ; libellés de contraintes **instanciés**
  depuis le projet (« la gare Matabiau », pas « un lieu ») ; **commune nommée** (« Toulouse »).
- **Le rendu ne l'aplatit plus** : 5 strates étiquetées (`ConclusionBlock.tsx`), label dérivé de la
  même table que le verdict, redondances supprimées.

## Pièges / doctrine à ne pas perdre

- **La SONDE est l'outil de non-régression du prompt** : `node --env-file=.env.local
  scripts/probe-conclusion.ts`. Elle a rattrapé **5 contraintes qui ne tenaient pas** alors que 100+
  tests étaient verts (dont une limite de longueur qui contredisait ce que le prompt exigeait). Toute
  retouche du prompt impose de bumper `DECISION_NARRATIVE_PROMPT_VERSION` (`conclusion-hash.ts`), et
  `DECISION_NARRATIVE_CONTRACT_VERSION` si `conclusion-validate` change de contrat. Actuellement v6/c2.
- **Le `lead` (single/tied) est de la TUYAUTERIE.** Ne jamais écrire « aucun ne prend le dessus » : le
  lecteur demande quoi regarder, pas comment le moteur trie. On LISTE.
- **Le verdict n'est JAMAIS généré** (`generable: false`), et aucune phrase ne promet un positif
  inexistant (`hasFavorable`, `favorableCount`, cas « rien d'examiné »).
- `server-only` n'est pas résolvable par Node (piège maison) : `src/lib/server/sha256.ts` ne porte pas
  la directive.
- Aucune génération quand `logementStatus === "pending"` : le dossier n'est pas final.

## L'URGENCE SUIVANTE : la couverture

**Le verdict restera tiède tant que la matière n'aura pas grandi, et aucune prose ne le corrigera.**

- 3 contraintes dures sur 11 sont examinées (mer, taille, département).
- Sur le dossier de test, **3 priorités déclarées sur 6 ne sont examinées par aucune règle**. Le
  registre l'a mis au jour : `faible_chaleur` n'est plus examinée **dès qu'une adresse est renseignée**
  (la règle de confort d'été se désactive, et la règle de compromis exige que l'accès aux transports
  soit aussi déclaré).
- La case « couverture élevée » de la table de vérité est **inatteignable aujourd'hui** : son code n'est
  couvert que par des tests unitaires, jamais par l'écran. C'est assumé, et c'est le signal.
- Module **Santé** à absorber : un fait Santé est un `DecisionFact` de plus, l'architecture l'accueille
  sans changement.

## À faire pour clore

1. Pousser la branche, ouvrir la PR.
2. **Ne pas oublier `DOSSIER_NARRATIVE=true` côté Vercel** si la conclusion rédigée doit vivre en prod.
3. Le compte de test : le mot de passe a traîné dans le dépôt (purgé de l'historique, branche jamais
   poussée). **Aucun identifiant ne doit être écrit dans le dépôt.**

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, puis `project_dossier_decision`.
2. `docs/superpowers/specs/2026-07-13-dossier-decision-slice-2-1-verdict-correspondance-design.md`
   (§3.1 le contrat d'outcome, §5 la table de vérité du verdict).
3. `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md`.
