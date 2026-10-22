# FUT-125 · L'en-tête, « Votre projet » et « Ce bien » dans la grammaire du Relevé

22/10/2026. Lot de présentation, issu de la recette du pilote individuel (FUT-118). Il ne touche
**que la présentation `releve`** : le rendu classique, utilisé par les autres comptes, est identique au
pixel et à la propriété près (preuve ci-dessous). Aucune règle métier, aucune donnée enregistrée, aucun
artefact, aucune génération.

## Ce qui change, sous le Relevé seulement

| Zone | Avant (recette) | Après |
| --- | --- | --- |
| En-tête | « Vous consultez La Rochelle · 6 autres communes vous sont ouvertes », surtitre « ● DOSSIER » orange, adresse, « Changer de bien » : le lieu deux fois, deux liens vers `/rapport/dossiers` | « ← Vos lieux » (seule navigation), le lieu **une fois** (l'adresse du dossier, ou la commune seule), la résidence **seulement si elle diffère** du lieu lu (« Votre résidence est Lorient. Y revenir »), le projet du jour |
| Votre projet | carte en verre, pastille orange, cinq « Inspiré de Brest : … » suivis chacun de « GARDER CE CRITÈRE · ÇA NE COMPTE PAS POUR MOI » en capitales orange, puces pleines orange | titre de bloc, projet en chapeau, critères **en trois groupes** (ce que vous demandez · inspirés de Brest · écartés), l'origine dite une fois, gestes discrets soulignés d'un filet, condition sans compromis au trait de registre ; lien avec la commune en sélecteur |
| Ce bien | carte en verre, grosses puces, surtitres en capitales mono | titre, adresse, deux sélecteurs (« Pourquoi vous l'examinez », « Votre lien actuel avec ce logement ») ; une phrase dit ce que ces réponses ne touchent pas : le projet et le lien avec la commune |
| Commune seule | carte arrondie « Préciser cette lecture à une adresse » | même porte, en ligne à filets (forme de `DossierDecisionReleve`) |
| Pied | bouton arrondi, « RETOUR AU SITE » en capitales mono | `.bouton`, `.lien` du Relevé |

**Distinctions préservées.** Résidence, territoire lu et dossier actif : la résidence n'apparaît que si
elle diffère, avec son retour (`<a>` vers la Route Handler `/rapport/residence`, jamais un `<Link>`).
Projet du jour et version servie : l'en-tête ne cite ni date ni grain de l'artefact (ils restent au-dessus
du verdict). Raison d'examiner, relation au logement, projet durable : trois objets, trois places, et la
phrase « Pour la commune entière, quel que soit le logement étudié » sous « J'y vis ».

**Aucun geste perdu.** Garder, écarter, reprendre, faire une condition (avec précision ou seuil), retirer
une condition, garder ou retirer une condition à revoir, modifier le projet, déclarer le lien avec la
commune, la raison d'examiner et la relation au bien : mêmes routes, mêmes corps de requête (vérifié au
clavier, ci-dessous). Chaque geste discret a un nom accessible qui dit son critère (« Garder : une ville
étudiante »).

## Ce qui est nouveau dans le code

- `Selecteur` (primitive, `src/components/releve/`) : une question et ses réponses, `aria-pressed`, repère
  de 2 px à l'encre (forme du témoin FUT-75 Q2), cible de 44 px. Deux domaines s'en servent déjà (projet,
  bien) ; DESIGN.md § 9.1 l'annonçait comme manquant.
- `.action` (classe canon) : le geste secondaire répété sur une liste ; 44 px sur écran tactile.
- `EnTeteDossierReleve` et `autour-du-releve.module.css` (domaine report) ; `groupesDeCriteres` (pur, testé).
- `CritereVue.court` : le critère sans son origine. Champ additif, tiré de `presenterCritere` ; aucune règle
  ne change.
- `ProjectSummaryCard`, `CriteresDuProjet`, `LienAvecCeBien`, `TrackedAddressCta` reçoivent `presentation`
  (classique par défaut). La logique (états, enregistrements) est partagée ; seule la forme se branche.

## Preuves

- **Classique inchangé** : `scripts/fut125/empreinte-classique.sh` avant / après, comparées par
  `scripts/fut118/comparer-empreintes.mjs` : 16 rendus (quatre cas, 1440 et 390, sombre et clair),
  **0 propriété calculée différente, 0 élément ajouté ou retiré**. Les seuls pixels qui bougent (c-sans,
  ~58 000, et 14 px de coin sur c-fut91) bougent aussi entre deux passes « avant » sans aucun changement
  de code : le flou des orbes et l'anticrénelage.
- **Tests permanents** : `src/components/report/autour-du-releve.test.ts` (13 tests : en-tête, groupes
  sans perte ni doublon, gestes conservés, noms accessibles, routes inchangées, absence de marqueurs
  historiques dans les branches Relevé, classique par défaut). Suite complète : 2937 / 2937.
- **Clavier et tactile** : `scripts/fut125/clavier.mjs` (Chrome, 1440 px, puis 360 px tactile). Les trois
  routes d'écriture sont interceptées par le navigateur : rien n'atteint le serveur. Chaque geste est
  atteint à la tabulation, avec un contour de focus visible, et envoie le corps attendu ; 19 cibles
  tactiles, toutes ≥ 44 px.
- **TypeScript, lint ciblé, build** : propres.
- **Captures** (`captures/`) : banc `/dev/fut92` (gabarit de `/rapport`, composants de production, dossier
  réel du moteur sur l'hôtel de ville de La Rochelle, projet fictif reproduisant la recette), 1440 / 390 /
  360, Chrome ; WebKit à 1440 et 390 ; demande de thème clair (le conteneur du dossier reste sombre, comme
  la page, cf. FUT-118 A3) ; aucun débordement horizontal.

## Ce qui reste (hors de ce lot)

- Le Relevé de `/rapport` reste sombre en thème clair : c'est la page qui l'est (lot R2 de FUT-118).
- `RepriseRecherche` (reprise d'une recherche « Où vivre ») garde sa forme historique ; elle n'apparaît
  qu'après une recherche récente dans ce navigateur.
- « 3 ÉCHELLES OUVERTES » en capitales mono dans `EchelleNavigator`, l'air sous son texte : FUT-126 (§ 7).
- Le carré de ton de la plaque, le bandeau « Votre projet a changé » : lot R2 de FUT-118.
- Android réel, Safari sur iPhone et vraie session : contrôles du porteur avant activation générale.
