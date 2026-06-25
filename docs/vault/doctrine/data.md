# Données : granularité et honnêteté géographique

> Règle durable. Source : `Documentation Notion/.../04 3 — Règles de granularité
> géographique`. Découle de l'invariant n°6 (`principes/invariants.md`). Voir aussi
> `/memory/home_insee_code_pitfall.md`.

futur·e croise des données à des échelles très différentes. C'est normal. **Le risque n'est
pas d'avoir des granularités mixtes, c'est de faire croire qu'elles sont équivalentes.**

## Principe général

Chaque donnée conserve sa **granularité native**. Toute agrégation, approximation ou
correspondance est explicite, documentée et assumée, dans la base comme dans la restitution
éditoriale.

## Règles

1. **Ne jamais surpromettre la précision.** Une donnée communale n'est jamais présentée
   comme une vérité à l'adresse. Pas « Votre immeuble sera exposé à… », mais « Dans votre
   commune… », « Autour de votre localisation… ».
2. **Conserver le niveau géographique d'origine.** Chaque valeur stockée porte son échelle
   réelle (DRIAS = grid_cell, BAN = address/point, Géorisques = commune ou zonage, INSEE =
   commune/IRIS/département, baignade = site).
3. **Hiérarchie géographique explicite.** Ordre de référence auquel toute source se rattache :
   address, point, grid_cell, commune, iris, epci, department, region.
4. **Séparer géocodage et interprétation.** Qu'un utilisateur entre une adresse ne rend pas
   toutes les données précises à cette adresse. Distinguer ce qui vient d'un point géocodé,
   d'une commune, d'une maille climatique, d'un zonage, d'une station proche.
5. **Documenter les règles de rattachement par source.** Ex. : BAN (adresse → coordonnées +
   INSEE), DRIAS (point → maille la plus proche), Géorisques (INSEE ou zonage selon couche),
   ATMO (point → station ou zone), baignade (point → site balnéaire pertinent), Eaufrance
   (commune ou bassin selon disponibilité).
6. **Préférer la cohérence à l'hyper-précision.** Quand deux sources ont des mailles
   incompatibles, remonter à une échelle robuste plutôt que produire un croisement
   artificiellement précis.
7. **L'incertitude géographique apparaît dans le produit.** La narration explicite la limite :
   « Cette projection repose sur la maille DRIAS la plus proche », « Cet indicateur est
   disponible à l'échelle de la commune », « Cette donnée traduit une tendance territoriale,
   pas une mesure à l'adresse ».

## La question de contrôle

Le produit doit toujours pouvoir répondre à : **à quelle échelle cette affirmation est-elle
vraie ?** Si la réponse est floue, la donnée n'est pas utilisée telle quelle dans une
restitution.

## Confidentialité

futur·e **ne stocke jamais l'adresse exacte** de l'utilisateur. La table `accounts` ne porte
que `home_insee_code` (et `report_grants.active_insee_code` pour le territoire actif, voir
ADR-0003) : aucune colonne adresse. L'adresse saisie sert au géocodage en mémoire, pas au
stockage. Cohérent avec la doctrine de granularité : on ne conserve que l'échelle à laquelle
on restitue honnêtement. *(Vérifié dans le schéma Supabase, 2026-06-25.)*

## Doctrine

futur·e gagne sa crédibilité non en promettant une précision absolue, mais en disant
clairement ce qui est local, ce qui est territorial, ce qui est projeté, et ce qui reste
incertain.

## Liens

`doctrine/editoriale.md` (formulations honnêtes), `principes/invariants.md` (n°3 et n°6),
`recherches/inventaire-sources` (à venir, terrain du futur agent Data Curator),
`/memory/home_insee_code_pitfall.md`.
