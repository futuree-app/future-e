# Pression climatique inondation (signal narratif) — design

Date : 2026-06-03
Statut : design validé (porteur), prêt pour plan d'implémentation.

## Intention

Chantier #4 de la roadmap, ex « amplificateur inondation V2 ». Le V1 a livré le critère opt-in
`faible_risque_inondation` fondé sur l'**historique observé** (arrêtés CatNat inondation, GASPAR,
percentile national → `c.inondation.risque`). Dette identifiée : le projeté DRIAS (pluies extrêmes
en intensification) n'est pas pris en compte, et l'observé communal peut sous-estimer une
trajectoire climatique.

**Décision porteur (verrouillée)** : on ne fusionne PAS observé et projeté dans un score hybride.
La vraie force de futur•e est justement d'avoir séparé :
- **Risque inondation** = ce qui s'est réellement produit (CatNat) ;
- **Précipitations extrêmes** = ce que le climat projette (`faible_precip_extremes`).

Le V2 n'est donc **pas un amplificateur de score** mais un **signal narratif complémentaire**,
`climatInondation`, qui n'apparaît que lorsque la trajectoire climatique change réellement la
lecture du territoire observé.

## Doctrine (non négociable)

- **Score et tri = historique observé CatNat**, strictement inchangés (V1).
- `climatInondation` n'entre **jamais** dans le score, le tri, ni les *reasons* du critère.
- **Jamais** présenté comme une prédiction d'inondation ni un « risque futur ».
- Affiché **uniquement quand il apporte une information nouvelle** (le climat modifie la lecture).
  Sinon silence : on ne commente pas une donnée climatique parce qu'elle existe.
- L'utilisateur ne voit **jamais** NORRx1d, NORRRq99, terciles ni percentiles.
- Ton **sobre, point de vigilance, jamais alerte/anxiogène**.

## Donnée & moteur — zéro repopulation

Toutes les entrées sont **déjà dans l'index** ; le V2 est purement moteur + narration, aucune
relance des scripts longs (`populate-inondation.py`, ~1h40) :
- `c.inondation.risque` : percentile CatNat (V1).
- `c.pct.NORRx1d_yr` : **tendance** projetée des pluies extrêmes (Δ, « est-ce que ça s'intensifie ? »).
- `c.pct.NORRRq99_yr` : **niveau** de pluie extrême journalière (p99, « parle-t-on déjà d'un niveau
  significatif ? »).

Les deux derniers sont déjà lus par `faible_precip_extremes` ; on les réutilise tels quels.

### Règle de « pression climatique marquée » (entièrement cachée dans le moteur)

```
pressionMarquee(c) =
  pct(NORRx1d_yr) dans le HAUT de distribution (tendance forte, moteur principal)
  ET pct(NORRRq99_yr) PAS dans le bas (niveau déjà significatif, garde-fou)
```

- Le moteur ne déclenche **pas** sur « il pleut déjà fort » seul, ni sur « forte hausse à partir
  d'un niveau négligeable » seul. On détecte les situations où **le climat pourrait devenir un
  facteur supplémentaire de vigilance**.
- Garde-fou données : DRIAS manquant (`NORRx1d_yr` ou `NORRRq99_yr` null) → `climatInondation = null`
  (silence).
- **Seuils** (tendance = haut de distribution ; niveau = pas-bas) : point de départ, **calés sur
  témoins réels pendant l'implémentation**, pas gravés ici.

## Bandes de sortie & formulations

Le signal n'existe **que si `pressionMarquee`**. Quand elle est vraie, la phrase s'adapte à
l'historique observé (`c.inondation.risque`, par terciles cohérents avec les bandes ambiantes V1) :

| Historique CatNat | Pression | `climatInondation` |
|---|---|---|
| limité **ou** intermédiaire | marquée | « Peu d'inondations recensées à ce jour ; les pluies extrêmes tendent à s'intensifier. » |
| notable | marquée | « Historique d'inondation déjà présent ; les pluies extrêmes tendent à s'intensifier. » |
| quelconque | non marquée | `null` (silence) |

Le tercile **intermédiaire** rejoint la famille « peu d'inondations recensées » : c'est précisément
le cas où le climat ajoute de l'information (territoire moyen dont la trajectoire devient plus
sensible). Formulations **factuelles** (porteur) : on sépare l'observé (« peu d'inondations
recensées » / « historique déjà présent ») du projeté (« les pluies extrêmes tendent à
s'intensifier »), sans verbe interprétatif type « à surveiller ».

**Seuils calés sur témoins réels (porteur)** : `pct(NORRx1d_yr) >= 88` ET `pct(NORRRq99_yr) >= 75`
→ ~12,5 % des communes. Garde Nîmes (94/93) et Arles (88/79) en « historique déjà présent » ;
exclut Lens (3/1) et Paris (4/8 : crue de Seine fluviale, non captée par la tendance pluies
extrêmes — limite assumée). Préférence porteur : signal rare mais crédible plutôt qu'une cible de
prévalence ; ne pas forcer Marseille/Lyon si cela élargit trop.

## Surfaces

Nouveau champ calculé sur le résultat, **sur le modèle exact de `pressionEco`** (narratif, hors
score, hors tri) :

```ts
climatInondation: string | null
```

Frontière d'affichage (verrouillée porteur) :
- **Synthèse** : `climatInondation` n'apparaît **que si** `faible_risque_inondation` a été demandé
  **ET** `climatInondation` est présent. La synthèse n'introduit jamais ce signal spontanément si
  l'utilisateur n'a pas parlé d'inondation.
- **AskFuture** : disponible si l'utilisateur pose une question sur l'inondation, les pluies
  extrêmes ou le climat.

## Prompts (`synthesize/route.ts`, `ask/route.ts`)

Note de doctrine ajoutée aux deux prompts :
- `climatInondation` est un **signal complémentaire**, jamais un risque futur ni une prédiction ;
- ne le mentionner **que s'il est présent**, jamais de chiffre ;
- ne pas le confondre avec le critère `faible_risque_inondation` (observé) ni avec
  `faible_precip_extremes` (projeté, critère distinct) ;
- côté synthèse : ne le sortir que si l'inondation a été demandée (cf. frontière ci-dessus).

## Hors périmètre

- **TRI** : `c.inondation.tri` vaut toujours `false` (jamais peuplé). On ne rouvre pas le score :
  il reste le CatNat percentile comme en V1. TRI = enrichissement futur.
- **Submersion marine** : exclue. La pression repose sur les pluies extrêmes (fluvial/pluvial),
  cohérent avec le V1 qui exclut déjà « vague » du CatNat.
- **Modulation du score** (options 1 et 2 du brainstorming) : rejetées par le porteur (score hybride
  opaque, distinction observé/projeté perdue).
- Aucun nouveau critère opt-in, aucune nouvelle clé `PREFERENCE_KEYS` : `climatInondation` est un
  narratif, pas un critère.

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint` (aucune erreur sur les fichiers touchés).
2. **Calage des seuils sur témoins** : exhiber des communes par cas —
   - historique limité + pression marquée → phrase « à surveiller » ;
   - historique notable + pression marquée → phrase « accentuer » ;
   - historique notable + pression non marquée → silence (l'historique parle déjà) ;
   - DRIAS manquant → silence.
3. `curl /match` : le **classement** `faible_risque_inondation` est **identique** au V1 (le signal
   n'altère ni score ni tri ni reasons) ; témoin Nîmes/Arles toujours écartés ; témoin d'une commune
   à `climatInondation` présent dont le rang n'a pas bougé.
4. `curl /ask` (« et côté inondation / climat ? » sur une commune au signal présent) → la nuance
   est reprise qualitativement, zéro chiffre, jamais formulée comme une prédiction.
5. `curl /synthesize` : avec `faible_risque_inondation` demandé + commune au signal → la nuance
   apparaît ; **sans** le critère demandé → le signal n'apparaît pas.

## Notes doctrine

Cf. [[inondation_scoring]] (V1 CatNat, accroche `risque`, distinction observé/projeté),
[[project_signaux_ambiants_askfuture]] (patron signal narratif + AskFuture « et côté X ? »),
[[feedback_signature_identitaire]] (n'afficher que ce qui raconte le lieu, jamais une donnée inerte),
[[feedback_callendar]] (DRIAS = source publique, ne pas citer Callendar), [[feedback_no_em_dash]].
