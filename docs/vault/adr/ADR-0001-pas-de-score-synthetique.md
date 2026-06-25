# ADR-0001 : Pas de score synthétique

- **Statut** : accepté, non négociable
- **Date** : 2026-04-17
- **Source** : `Documentation Notion/.../02 7 — Journal des décisions produit`, principe 1 de
  `02 1 — Vision produit`.

## Contexte

La tentation naturelle d'un produit qui croise climat, santé, logement et territoire est de
condenser le tout en un score unique (« cette commune : 7,4/10 »), individuel ou foyer.

## Décision

**Aucun score synthétique.** Ni note globale par lieu, ni note par personne ou par foyer.
La lecture se fait en **dimensions séparées**, racontées, chacune avec sa propre échelle de
validité.

## Pourquoi

Un score unique invite à la compétition, à la culpabilité et à l'optimisation. Il écrase la
nuance que le produit existe pour porter, et il transforme une aide à la décision en
classement. Cohérent avec le manifeste (« informer et éclairer, ne jamais décider à la place
du lecteur ») et avec la doctrine d'honnêteté du signal.

## Conséquences

Structure le dashboard, l'UX, les prompts de synthèse. Le comparateur de compatibilité
territoriale (voir ADR-0002) classe par **préférences exprimées**, pas par un score absolu
du lieu : il révèle des arbitrages, il ne décerne pas de note.

## Liens

`vision/manifeste.md`, `doctrine/interface.md` (honnêteté du signal),
`adr/ADR-0002-pivot-compatibilite-territoriale.md`.
