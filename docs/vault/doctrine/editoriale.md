# Voix et honnêteté du texte

> Règle durable. Fiches miroir : `/memory/feedback_no_em_dash.md`,
> `/memory/feedback_signature_identitaire.md`, `/memory/feedback_callendar.md`.

Trois exigences sur tout texte que produit futur·e : une voix typographique constante, un
récit du territoire qui raconte le lieu plutôt que sa donnée, des sources honnêtes.

## 1. Pas de tiret cadratin

Ne jamais employer de tiret cadratin (—) dans le texte rédigé : copy UI, prose, messages.
Préférer une virgule ou deux points selon le sens.

- **Pourquoi** : préférence stylistique constante du porteur.
- **Exception unique** : un modèle ou prompt figé fourni par le porteur qu'il demande de
  ne pas modifier (ex. blocs STYLE/NEGATIVE des prompts d'illustration). Le « — » comme
  marqueur « pas de donnée » dans une valeur d'UI reste une convention distincte et
  acceptable (voir `doctrine/interface.md`).

## 2. Signature territoriale : distinctive ET identitaire

Tout élément affiché pour « décrire » un lieu doit être **distinctif ET identitaire** :
une chose par laquelle un humain décrit spontanément le territoire.

- Identitaire : « Aux portes des Alpes », « Côte méditerranéenne », « Bassin de Grenoble ».
- Donnée vraie mais **inerte** : « Altitude 286 m », « altitude modérée », « température
  moyenne X ». Personne ne choisit Limoges parce qu'elle est à 286 m. Les afficher est une
  **fuite de donnée** dans l'interface.

Corollaires :
- Une signature peut être courte, n'a pas besoin de trois éléments, on ne remplit jamais
  pour remplir. « Limoges, Bassin de Limoges » est préférable à « Limoges, Bassin de
  Limoges · Altitude modérée ».
- L'altitude n'est identitaire qu'en haute altitude (la montagne EST le lieu, ex.
  Aurillac, Le Puy ≥ 600 m), jamais dans la bande 200 à 600 m où le label massif porte
  déjà le relief. Climat « méditerranéen » sur les façades concernées (plus évocateur que
  « maritime »).
- **Pourquoi** : le porteur (2026-06-01) a tranché que « raconter un territoire, pas
  remplir un emplacement » prime sur le correctif Limoges/Dijon qui l'a révélé. Risque
  sinon : déguiser une donnée saturée ou inerte en caractéristique du lieu. Principe
  transverse : **ne jamais déguiser une position relative en caractéristique absolue**.
- Implémenté dans `buildSignature` (`src/lib/comparateur-vie.ts`), commit 4c56923.

## 3. Ne pas citer Callendar comme source

Ne pas citer « Callendar » dans les contenus affichés : cartes signaux, attributions de
données, mentions de méthodologie côté front.

- **Pourquoi** : Callendar est un concurrent commercial sur l'analyse climat × immobilier,
  pas une source publique française. Les citer reviendrait à leur faire de la pub gratuite
  et à induire en erreur sur la nature des données (futur·e s'appuie sur des données
  publiques).
- **Comment** : pour les attributions de source dans l'UI (ex. `SLUG_SOURCES` dans
  `WizardTeaser.tsx`), ne citer que les sources publiques réelles : IGN (RGE Alti),
  Géorisques, BRGM, ADEME, INSEE, DRIAS / Météo-France, Prométhée / DREAL, GisSol / RMQS,
  Agences de l'eau. Le code peut comparer en interne des données d'autres acteurs ; les
  attributions visibles ne les nomment jamais.

## Liens

Doctrine des gloses et de l'interface : `doctrine/interface.md`. Positionnement :
`doctrine/positionnement.md`.
