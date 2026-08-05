# Ouvrir l'indexation publique

**Date** : 2026-08-04 · **Statut** : **PRÊT, NON APPLIQUÉ.** En attente du feu vert du porteur.

**Goal** : les pages publiques deviennent indexables, l'espace payant et transactionnel reste fermé.

**Pourquoi ce document existe** : la décision d'ouvrir est peu réversible. Une page indexée par
erreur met des semaines à disparaître, et le désindexage se demande page par page. Le plan est donc
écrit avant, pour que l'exécution soit mécanique et que la liste des exclusions soit relue à froid.

## Les deux verrous, à lever DANS LE MÊME COMMIT

Ils sont indépendants, et lever un seul ne change rien :

| Verrou | Où | Aujourd'hui |
|---|---|---|
| Le fichier robots | `public/robots.txt` | `Disallow: /` |
| La balise meta globale | `src/app/layout.tsx:12` | `robots: { index: false, follow: false }`, googleBot compris |

Un `robots.txt` accueillant avec un `noindex` global donne le pire des deux : le crawler passe,
lit, et n'indexe pas. Un `index: true` avec un robots fermé ne se lit jamais.

## Ce qui reste FERMÉ, et par quel moyen

Le produit a des layouts par groupe de routes : deux d'entre eux ferment un sous-arbre entier d'un
seul geste, ce qui vaut mieux qu'une balise par page qu'un futur écran oublierait.

| Périmètre | Moyen | Routes couvertes |
|---|---|---|
| L'espace compte | `metadata` dans `src/app/(account)/layout.tsx` | `/compte`, `/compte/memoire`, `/rapport`, `/rapport/autour`, `/rapport/dossiers`, `/rapport/logement`, `/rapport/quartier`, `/dossier/merci` |
| L'authentification | `metadata` dans `src/app/(auth)/layout.tsx` | `/connexion`, `/inscription` |
| Les pages de développement | `src/app/dev/layout.tsx` **à créer** | `/dev/conclusion`, `/dev/dossier`, `/dev/loading`, `/dev/logo`, `/dev/logo/bifurcation`, `/dev/typo` |
| Le paiement | `metadata` sur les 2 pages | `/checkout/[product]`, `/checkout/dossier` |
| La confirmation | `metadata` sur la page | `/merci` |

Aucun de ces layouts n'est un composant client, ils peuvent donc tous exporter un `metadata`.

**Déjà fermées, à laisser telles quelles** : `/professionnels`, `/comparateur/pack-decision`,
`/territoire/[insee]/debloquer` portent chacune son `robots: { index: false }`, pour des raisons qui
leur appartiennent.

## Ce qui s'ouvre

Les pages publiques éditoriales, territoriales et produit : l'accueil, `/ou-vivre`, `/comparateur`,
`/pourquoi`, `/dossier`, les hubs `/chaleur`, `/inondation`, `/j-utilise-beaucoup-ma-voiture`, leurs
pages `[insee_code]` et leurs classements, les sept pages `/agir/*`, les six `/savoir/*`, et les
trois pages légales, dont les CGV.

## Le fichier robots visé

```text
User-agent: *
Allow: /

Disallow: /api/
Disallow: /compte
Disallow: /rapport
Disallow: /dossier/merci
Disallow: /connexion
Disallow: /inscription
Disallow: /checkout/
Disallow: /merci
Disallow: /dev/

Sitemap: https://futur-e.fr/sitemap.xml
```

**Le `Disallow` et le `noindex` font deux choses différentes, et il faut les deux.** Le `Disallow`
empêche le crawl ; le `noindex` empêche l'indexation. Une page seulement `Disallow` peut apparaître
dans les résultats sans description, sur la foi de liens externes. Une page seulement `noindex` est
crawlée pour rien. Les pages privées portent donc les deux, et c'est volontaire.

**`/dossier` (public) contre `/dossier/merci` (compte)** : le premier s'ouvre, le second se ferme.
La ligne `Disallow: /dossier/merci` doit rester plus précise que `/dossier`, sans quoi la page
publique tomberait avec.

## Les trois preuves de sortie

Elles se font sur le site déployé, jamais en local, parce que c'est le fichier servi qui compte.

- [ ] `curl -s https://futur-e.fr/robots.txt` : contient `Allow: /` et les huit `Disallow`.
- [ ] Une page publique rend `index,follow` :
      `curl -s https://futur-e.fr/ | grep -o '<meta name="robots"[^>]*>'`
- [ ] Une page privée rend `noindex` :
      `curl -s https://futur-e.fr/connexion | grep -o '<meta name="robots"[^>]*>'`

Puis soumission du sitemap dans la Search Console. L'indexation est lente et jamais garantie : la
soumission est le début du délai, pas sa fin.

## Ce que ce plan ne fait pas

**Il ne touche pas au contenu des pages ouvertes.** Le `title` global vaut « futur•e » et la
description « Projection climatique personnelle » : c'est pauvre pour une page de résultat, et
chaque page ouverte mériterait son titre et sa description propres. C'est un chantier éditorial
distinct, qui ne conditionne pas l'ouverture.

**Il ne juge pas si chaque page ouverte est prête.** La liste ci-dessus reprend les pages publiques
existantes. Une relecture page par page, sur la qualité et l'autonomie du contenu, reste un travail
d'éditeur.
