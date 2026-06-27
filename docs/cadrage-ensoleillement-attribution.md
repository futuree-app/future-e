# Cadrage — corriger l'attribution fausse du critère « ensoleillement »

> Issu du dogfood réel Brest/Lorient (2026-06-27) et du rapport Data Curator
> `docs/rapports-agents/data-curator/2026-06-27-donnees-manquantes-conversation.md`.
> Statut : **cadrage** (la décision de quelle voie suivre revient au porteur ; la voie A touche la voix → Editorial/Design).

## Le problème (dette d'honnêteté en production)

Le critère `ensoleillement_recherche` **affiche** « ensoleillé / soleil » mais **mesure** la chaleur d'été
et la faible pluie. Aucune donnée d'insolation n'entre dans le calcul.

```
// src/lib/comparateur-vie.ts:970
case "ensoleillement_recherche": {
  const summer = c.pct.NORTMm_seas_JJA;            // température moyenne d'été (percentile)
  const dry = 100 - c.pct.NORRR_yr;                // 100 - volume de pluie annuel (percentile)
  return Math.round(0.45 * summer + 0.55 * dry);   // → "chaud et sec", PAS "ensoleillé"
}
```

Le code l'avoue déjà : `scripts/build-comparateur-index.mjs:42` (« proxy ensoleillement »),
`src/lib/comparateur-vie.ts:35` (« proxy soleil »).

**Pourquoi c'est un vrai problème, pas un détail.** Deux communes au même été chaud et au même faible
cumul de pluie obtiennent le même score « ensoleillement » — même si l'une est régulièrement sous le
crachin/la grisaille et l'autre sous un ciel clair. Le volume de pluie (mm) et le **nombre de jours de
pluie / l'insolation** sont des grandeurs différentes (cf. la conversation : Brest et La Rochelle ont des
cumuls proches mais ~700 h d'écart d'ensoleillement). Le label promet une donnée que le produit n'a pas.
C'est exactement ce que la doctrine d'honnêteté (`doctrine/data.md`, attribution) interdit.

## Périmètre exact à toucher (les 6 emprises du claim « soleil »)

| Fichier · ligne | Contenu actuel (faux) |
|---|---|
| `src/lib/comparateur-vie.ts:1107` | paliers `["Chaud et ensoleillé", "Ensoleillement modéré", "Frais et peu ensoleillé"]`, label « Ensoleillement », `aide` « Le caractère ensoleillé et chaud… » |
| `src/lib/comparateur-vie.ts:35` | commentaire « proxy soleil » |
| `src/lib/comparateur-vie.ts:1740 / 1800` | « plus chaud et plus sec, ensoleillé » / « climat plus frais et humide » |
| `src/lib/comparateur-labels.ts:15 / 55` | « du soleil et de la chaleur » / « Plus chaud et plus sec » |
| `src/app/api/comparateur-vie/synthesize/route.ts:31 / 132` | « du soleil et de la chaleur » / « bénéficie d'un ensoleillement plus marqué » |
| `src/app/api/comparateur-vie/parse/route.ts:164 / 181 / 196` | hints d'intention « rechercher le soleil », « plus ensoleillé » |
| `scripts/build-comparateur-index.mjs:42` | commentaire « proxy ensoleillement/sécheresse perçue » |

À noter : **l'intention utilisateur est légitime** (« je veux du soleil » est un vrai souhait). Ce n'est pas
l'intention `ensoleillement_recherche` côté parse qu'il faut supprimer — c'est la **description de ce qu'on
mesure** et la **promesse affichée** qui doivent dire la vérité.

## Les deux voies (non exclusives ; A ne doit PAS attendre B)

### Voie A — relabel honnête, zéro donnée nouvelle, applicable maintenant

Renommer la sortie pour qu'elle décrive ce que le critère calcule réellement, tout en captant toujours
l'intention « je cherche le soleil ». Le pont honnête : dire qu'on **approxime** le soleil par un été chaud
et peu pluvieux, en attendant une vraie mesure d'insolation.

- Paliers : `["Été chaud et sec", "Été intermédiaire", "Été frais et humide"]` (à arbitrer par Editorial).
- `aide`/glose : « Approché par un été chaud et peu pluvieux. futur•e ne mesure pas encore l'ensoleillement
  réel (heures de soleil) : à interpréter comme un climat estival chaud et sec, pas comme une garantie de
  ciel clair. »
- Synthèse : remplacer « bénéficie d'un ensoleillement plus marqué » par « a un été plus chaud et plus sec ».
- Garder l'intention parse (le lecteur peut toujours demander « du soleil »), mais l'intitulé du critère et
  toute glose visible cessent de promettre l'insolation.
- **Touche la voix → passage Editorial Writer (+ Design Critic sur les paliers).** C'est une réécriture, pas
  une refactor : à ne pas appliquer unilatéralement.

### Voie B — vraie donnée d'ensoleillement, chantier Data Curator séparé

Intégrer les **normales Météo-France** : insolation (h/an) + nombre de jours de pluie ≥ 1 mm.
Caractéristiques (rapport Data Curator) : donnée **mesurée/historique** (≠ projetée), maille **station**
(réseau insolation clairsemé → interpolation/rattachement à instruire), Licence Ouverte, **hors sélecteur
d'horizon DRIAS** (ne pas la mettre sous les onglets 2030/2050/2100). Une fois en place, un critère
« ensoleillement » *honnête* devient possible, et la Voie A peut être relue.

## Recommandation

1. **Faire la Voie A en premier**, indépendamment de B : c'est une correction d'honnêteté, pas un
   enrichissement. Tant qu'elle n'est pas faite, le produit affiche une promesse qu'il ne tient pas.
2. **Ne pas laisser A bloquée par B.** La vraie donnée est un chantier réel (maille station, interpolation) ;
   l'attribution fausse, elle, se corrige en une passe de réécriture.
3. Inscrire B dans la roadmap data (déjà tracée dans `vault/recherches/inventaire-sources.md` →
   « Gaps validés par une décision réelle »).

## Liens

`docs/rapports-agents/data-curator/2026-06-27-donnees-manquantes-conversation.md`,
`docs/vault/recherches/inventaire-sources.md`, `docs/vault/doctrine/data.md`,
`docs/rapports-agents/_sources/2026-06-27-conversation-brest-lorient.md`.
