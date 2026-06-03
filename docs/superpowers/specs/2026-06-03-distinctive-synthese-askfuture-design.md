# Brancher le trait distinctif dans la synthèse et AskFuture

Date : 2026-06-03
Statut : design validé, prêt pour plan d'implémentation

## Contexte

`MatchResult.distinctive` est un libellé unique par commune, calculé côté moteur
par `buildDistinctive` (cf. `src/lib/comparateur-vie.ts`), relatif aux communes
affichées (ex. « les étés les plus supportables des trois », « la plus pluvieuse
des trois »). Il est narratif, hors-score, hors-tri. Il a résolu le problème des
« cartes jumelles » côté UI (rendu sur les cartes, `OuVivreClient.tsx` ~ligne 933).

Aujourd'hui ce champ n'est transmis NI à `/api/comparateur-vie/synthesize` NI à
`/api/comparateur-vie/ask`. Résultat : la synthèse et AskFuture peuvent lisser les
territoires entre eux, alors que les cartes, elles, les distinguent.

Objectif : faire remonter `distinctive` dans les deux prompts pour que la synthèse
raconte l'arbitrage réel entre les communes (« ce qui les rapproche, mais aussi ce
qui les sépare ») sans toucher au moteur ni au scoring.

## Périmètre (validé)

On touche :
- le transport du champ (client → 2 routes) ;
- les types `Body` des 2 routes ;
- les 2 prompts SYSTEM.

On ne touche pas :
- `buildDistinctive` ni le moteur. `distinctive` reste mono-trait, relatif au
  groupe, narratif, hors-score, hors-tri. (Décision : incrémental. On observe
  d'abord la qualité réelle des synthèses avant d'envisager un enrichissement
  gain + revers.)
- les cartes (`OuVivreClient.tsx` rendu inchangé) ;
- le fallback déterministe `fallbackSynthesis` (raffinement possible, hors V1) ;
- le scoring, le tri, le firewall de `/ask`.

## Doctrine (validée)

`distinctive` est un signal MESURÉ par le moteur, même quand il ne correspond pas
à un critère explicitement demandé par l'utilisateur. Il peut donc être utilisé
par la synthèse et AskFuture pour expliquer ce qui différencie les territoires.

C'est sa raison d'être : révéler une différence utile entre les communes
proposées, même hors critère demandé (ex. projet « nature + famille », Aurillac
ressort, le moteur détecte qu'Aurillac est la plus pluvieuse des trois : info
utile pour arbitrer, pas un critère, mais à ne pas cacher).

Garde-fous (s'appliquent aux deux prompts) :
- ne commenter que le contenu exact du champ ;
- ne pas inventer un second trait ;
- ne pas en faire un critère de classement supplémentaire ;
- présenter comme une différence RELATIVE entre les communes proposées ;
- ne pas extrapoler au-delà du libellé transmis.

### Nuance éditoriale (cœur de la V1)

L'usage de `distinctive` doit rester **sélectif et utile au récit**. La synthèse
ne doit PAS utiliser tous les traits disponibles ni paraphraser mécaniquement les
cartes. Règle :
- utiliser `distinctive` quand il aide réellement à raconter l'arbitrage ;
- ne pas lister ;
- ne pas inventer, ne pas surinterpréter ;
- ne pas en faire un critère de classement ;
- ne pas l'utiliser si cela alourdit le récit.

Pour AskFuture, usage plus conditionnel encore :
- s'appuyer sur `distinctive` surtout quand la question porte sur les différences,
  les compromis ou le choix entre territoires ;
- ne pas le dérouler spontanément à chaque réponse.

La différenciation devient un objectif assumé de la synthèse (ne plus lisser les
communes), mais servi par le jugement éditorial, pas par l'exhaustivité.

## Flux de données

```
MatchResult.distinctive  (déjà calculé, mono-trait, relatif au groupe)
        │
        ├─→ payload synthesize : territoires[].distinctive
        │       └─→ SYSTEM : bloc doctrine (liste blanche) + beat différenciation
        │           dans STRUCTURE
        │
        └─→ payload ask : context.territoires[].distinctive
                └─→ SYSTEM : bloc doctrine parallèle, usage conditionnel à la question
```

Aucune donnée nouvelle ne franchit le firewall : `distinctive` est déjà du
qualitatif sans chiffre produit par le moteur, au même titre que
`reasons`/`tradeoff`. Le firewall de `/ask` (frontière d'import) reste intact :
le champ vient du contexte scellé envoyé par le client, pas d'un import de donnée
profonde.

## Changements détaillés

### A. `OuVivreClient.tsx` (transport)

Deux payloads, ajout d'un champ chacun :
- appel `/synthesize` (~ligne 187) : `results[].distinctive = r.distinctive`.
- appel `/ask` (~ligne 428) : `context.territoires[].distinctive = r.distinctive`.

Commentaire en regard : « trait distinctif relatif au groupe (narratif, hors-score),
firewall préservé » (cohérent avec les commentaires `pressionEco`/`logement`/`littoral`).

### B. `synthesize/route.ts`

1. Type `Body.results[]` : ajouter `distinctive?: string | null`.
2. Payload `territoires` : ajouter `trait_distinctif: r.distinctive ?? null`.
3. SYSTEM :
   - Section « NE COMMENTEZ QUE CE QUI A ÉTÉ MESURÉ » : ajouter `trait_distinctif`
     à la liste des signaux commentables, avec les garde-fous ci-dessus.
   - Section STRUCTURE : le point « logique d'ensemble » intègre la
     différenciation (« ce qui les rapproche, et ce qui distingue chaque
     territoire quand un trait distinctif le permet »), avec la nuance « usage
     sélectif, pas de liste, pas de paraphrase des cartes ».

### C. `ask/route.ts`

1. Type `Territoire` : ajouter `distinctive?: string | null`.
2. `buildContextBlock` : mapper `trait_distinctif: t.distinctive ?? null`.
3. SYSTEM : bloc doctrine parallèle, usage conditionnel (surtout quand la question
   porte sur différences / compromis / choix entre territoires ; pas déroulé
   spontanément ; mêmes garde-fous ; un seul compromis maintenu).

## Cas limites

- **Communes sans `distinctive` (null)** : le moteur n'en renvoie que pour celles
  qui se détachent. Les prompts précisent : utiliser les traits présents, ne rien
  inventer pour les autres.
- **IA indisponible** : le client bascule déjà sur `fallbackSynthesis`
  (déterministe, liste les `reasons`). Inchangé en V1.

## Doctrine respectée (rappel)

- Le scoring ne passe jamais par l'IA : inchangé, `distinctive` est calculé en
  amont par le moteur.
- Pas de tiret cadratin dans les prompts ajoutés (virgule / deux points).
- Pas de chiffre, pas de date, pas d'horizon : `distinctive` est déjà qualitatif.
- Vouvoiement, ton sobre : conservés.

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` : types des deux routes + client compilent.
2. `npm run lint`.
3. Appels réels `curl` sur le serveur dev (port 3000) :
   - `/api/comparateur-vie/synthesize` avec un payload de 3 territoires portant
     des `distinctive` variés (un présent, un autre, un null) ;
     contrôler que la synthèse différencie quand c'est utile, sans lister, sans
     inventer, sans chiffrer.
   - `/api/comparateur-vie/ask` : une question « quelle différence entre X et Y ? »
     (doit s'appuyer sur distinctive) et une question générique (ne doit PAS
     dérouler distinctive spontanément).
4. Contrôle manuel du rendu dans `/ou-vivre` sur un cas réel.

## Hors périmètre

- Enrichissement `buildDistinctive` (gain + revers, second trait) : seulement si
  la V1 prouve que le mono-trait est insuffisant.
- Fallback déterministe.
- Élargissement de la palette du trait distinctif à la mobilité (roadmap #6).
