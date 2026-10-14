# FUT-93 · Suivi : les autres relectures du rapport, et l'annonce de la nouvelle version

Date : 12 et 13 octobre 2026 · Branche : `fix/fut-93-relectures-rapport`, depuis
`fix/fut-93-version-affichee` (PR #54, non fusionnée) : ce lot en dépend.
Suite de `2026-10-12-fut93-version-affichee.md`. Banc : `/dev/fut93` (développement uniquement).

## 1. Les six autres relectures étaient bien exposées

Une relecture du routeur SANS changement de version servie (ce que font `CriteresDuProjet`,
`LienAvecCeBien`, `ProjectSummaryCard`, `LectureFactuelleDuBien`, `RepriseRecherche` et
`CommuneSetupBanner` après leur action) n'était validée par React **dans aucun des 3 essais** sur la
section complète. La clé de version de la PR #54 ne pouvait pas les couvrir : la version ne change pas.
(`MemoireForm` vit sur `/compte/memoire`, sans conclusion rédigée.)

## 2. Ce que la bissection établit de plus

Relecture sans changement de version, build de production local (Next 16.2.4, React 19.2.4), sonde
dont le jeton change à chaque rendu serveur :

| Arbre | Relecture validée |
| --- | --- |
| frontière `Suspense` révélée, contenu asynchrone (`await headers()`, simple `await`, ou synchrone) | 3 / 3 chaque |
| idem avec `ConclusionBlock`, ou la vraie `ConclusionRedigee`, et son vrai repli | 3 / 3 chaque |
| section `pending` (sans frontière) puis frontière minimale APRÈS elle | 3 / 3 |
| frontière minimale AVANT la section | **0 / 3** |
| frontière minimale avant : le bandeau seul, `ConclusionBlock` seul, un `Link` seul | 3 / 3 chaque |
| frontière minimale avant un arbre HTML inerte de 50 / 500 / 3 000 lignes | 3/3 · **0/3** · 3/3 |

**Établi** : le blocage n'est propre à aucun de nos composants. Il survient quand une frontière
`Suspense` déjà révélée, au contenu asynchrone et d'identité inchangée, est suivie d'une certaine
quantité de rendu ; il dépend de cette quantité sans en être monotone. C'est la signature d'une course
dans l'ordonnancement des transitions de React (la reprise de la frontière se perd selon le moment où
elle arrive). **Non établi** : la ligne de React en cause. Les correctifs 19.2.5 à 19.2.8 ne touchent que
les Server Components ; la 19.3.0 contient « Always instrument the lazy initializer thenable » (#35521),
qui pourrait s'y rapporter, sans preuve. Aucune montée de version n'a été faite.

## 3. Le correctif

La frontière de `ConclusionRedigee` change d'identité à CHAQUE rendu serveur (`jetonDeRendu()`,
`src/lib/rendu/jeton-de-rendu.ts`), dans les deux présentations ; la version servie reste lisible dans
la clé. Une frontière neuve n'est pas soumise à la course.

| Mesure, après correctif | Résultat |
| --- | --- |
| cas bloquant (frontière + 500 lignes) : page validée · contenu de la frontière validé | 12/12 · 12/12 (contre 1/4) |
| relecture sans changement de version, section complète, classique et Le relevé, 0 ou 7 s | 25 / 25 |
| frontière EXTÉRIEURE du rapport (section servie en 7 s) suivie de contenu, fenêtre de 25 s | 18 / 18 |

Le prix : à chaque relecture, la conclusion peut montrer un instant son repli déterministe avant la
version rédigée, relue depuis le cache (aucune nouvelle génération).

Q1 en profite : un premier rafraîchissement au contenu encore ancien est maintenant suivi d'une
seconde relecture qui aboutit, sans rechargement (16 sur 16, 21 à 25 s), et l'état « Afficher la
nouvelle analyse » arrive en 21 s au lieu de 35. « Relire la page » (état « déjà en cours ») garde le
rechargement complet de la PR #54.

## 4. L'annonce persistante aux lecteurs d'écran

`AnnonceVersion` : une région `role="status"` invisible, posée à côté de la date de l'analyse, HORS du
bandeau, dans les deux présentations. Elle existe avant la mise à jour et reste après ; elle ne parle
que lorsque la page sert la version annoncée par le serveur pour ce dossier et cette portée (mémoire
posée par `AnalyseAncienProjet` à la livraison). Vérifié dans les deux présentations, par relecture et
par rechargement de récupération : vide avant ; « La nouvelle analyse est affichée. Elle a été générée
le … » après, toujours présente 3 s plus tard ; muette pour une relecture sans mise à jour.

## 5. Vérifications

Suite complète 2550/2550, TypeScript, lint (42 signalements préexistants, aucun dans les fichiers
modifiés), build Webpack. Scénarios Q1 sur le banc, deux présentations, tous conformes après mise à
jour de deux attentes devenues fausses parce que les relectures se valident désormais (`retard=3` pour
éprouver l'état « Afficher la nouvelle analyse »).

## 6. Limites

- **Les six composants n'ont pas été rejoués un par un** : leurs actions demandent une session et des
  écritures. Ce qui est vérifié, c'est le mécanisme qu'ils partagent (`router.refresh()` sur la structure
  du rapport, sans changement de version), sur le banc.
- **Un échec isolé** : lors de la première série Q1 après le jeton, un passage du scénario « premier
  rafraîchissement sans effet » n'a ni affiché la v2 ni déclenché la récupération en 60 s. Non reproduit
  en 16 passages suivants ; non expliqué. La récupération bornée aurait dû recharger la page : à surveiller.
- **Pas de test réel** en production pour ce lot.
- **Montée de React (19.3) ou de Next (16.4)** : à évaluer dans un lot dédié ; le banc et sa sonde
  permettent de vérifier en quelques minutes si la course disparaît, auquel cas le jeton pourrait être
  retiré.
