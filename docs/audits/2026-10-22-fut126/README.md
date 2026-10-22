# FUT-126 · Finitions du Relevé, première passe : la présentation seulement

22/10/2026. Six corrections de lecture validées par le porteur, appliquées à la seule présentation
`releve`. **Aucune règle métier, aucun texte d'artefact, aucune génération ne change**, et le rendu classique
est identique (preuve ci-dessous). Les trois corrections de textes produits par le moteur sont la seconde
passe, consignée dans FUT-126 et non implémentée ici.

## Ce qui change, sous le Relevé

| Retour de recette | Correction | Où |
| --- | --- | --- |
| « communes de France » au milieu de la graduation | l'étiquette du milieu disparaît ; les deux pôles restent ; l'univers reste dans la phrase de rang et le nom accessible | `RegleDeRang` |
| « Faites contrôler les fondations… » rangé parmi les limites | le complément d'un geste se lit sous ce geste ; « Données et limites » ne porte plus que la méthode et les constats détaillés. Même texte, déplacé, rien de perdu (test G1) | `EntreeReleve` |
| « retrait-gonflement des argiles » sans explication | un dépliant natif « Qu'est-ce que le retrait-gonflement des argiles ? » sous la carte qui emploie le terme ; il distingue l'aléa du sol d'un dommage constaté. Le texte du moteur n'est pas touché | `glossaire.ts`, `EntreeReleve` |
| Critère « Une ville à taille humaine » et constat « Une grande agglomération » au même rang | l'état d'un écart se lit « Constat : une grande agglomération » | `statut-affiche.ts` |
| Glyphe de l'agglomération (cercle pointé) | cercle doublé, sans point plein : le point de l'emblème désigne l'adresse. Libellé textuel conservé. Vérifié à 360 px, écran ordinaire et Retina | `GlypheGrain` |
| Le même « Logement » en losange plein et en losange vide sur une page | la rubrique d'échelle prend le losange vide de l'emblème | `ControlesReleve` |
| Transition synthèse → liste complète peu visible | un nouveau mouvement (filet fort, titre au rang de la balance), une phrase qui dit vrai (« chaque rubrique liste tous les contrôles établis à son échelle, y compris ceux déjà cités »), « Déplier / Replier » en mots ; sous 640 px, le compte passe sous le nom | `ControlesReleve`, `releve.module.css` |
| Indication du navigateur collée au filet ; capitales mono | air sous l'indication (le filet de la colonne ne s'arrête plus sur le texte), « 3 échelles ouvertes » en casse normale. Relevé seulement : le composant est partagé avec le classique | `EchelleNavigator` |
| (constaté en recette tactile) dépliants en ligne de 22 px | 44 px au doigt sur écran tactile | `releve.module.css` |

## Preuves

- **Classique inchangé** : `scripts/fut126/empreinte-classique.sh` (La Rochelle adresse et commune, Nîmes,
  `/dev/fut91`), 16 rendus, 1440 et 390, sombre et clair : **0 propriété calculée différente, 0 élément
  ajouté ou retiré**. Les seuls pixels qui bougent bougent aussi entre deux passes « avant » sans aucun
  changement (flou des orbes) ; la passe « avant 2 » contre la passe « après » donne 0 pixel sur les cas
  où le bruit ne tombe pas.
- **Tests permanents** : `src/components/releve/finitions-releve.test.ts` (12 tests), dont G1 : sur un cas
  reproduisant La Rochelle, chaque ligne « À vérifier » de la production est rendue sous un geste. Suite
  complète : 2965 / 2965.
- **Clavier et tactile** : `scripts/fut126/clavier.mjs` (Chrome 1440 au clavier, 360 tactile) ; toute
  requête autre qu'une lecture est bloquée par le navigateur.
- **TypeScript, lint ciblé, build** : propres. Aucun débordement horizontal (1440, 1024, 390, 360 ; Chrome et
  WebKit).
- **Captures** : `captures/` (avant / après, banc `/dev/fut92`, dossier réel du moteur sur l'hôtel de ville
  de La Rochelle, priorités de la recette, Supabase neutralisé, aucune clé de modèle).

## Seconde passe (non implémentée) : ce qu'elle toucherait

Les trois formulations validées sur le principe (vie locale, taille, bruit) sont des textes du moteur.

- **Versionnement** : précédents FUT-20 et FUT-96, une formulation qui ne change ni verdict, ni issue, ni
  registre ne relève pas `ENGINE_VERSION` ; un test le prouve (matrice avant / après).
- **Artefacts figés** : aucun effet ; ils gardent leurs textes et se rendent à l'identique.
- **Nouvelles versions** (achat, « Mettre à jour l'analyse », rattrapage d'un dossier sans artefact) : nouveaux
  textes. Leur lecture enrichie est de toute façon générée pour une nouvelle version.
- **Dossiers assemblés à l'ouverture** (sans artefact servi) : le plan change, donc l'empreinte de la lecture
  enrichie ; une nouvelle rédaction (appel Anthropic) partira à la prochaine ouverture de chacun d'eux. Leur
  nombre se mesure en lecture seule avant la décision.
- **Accueil public** : la phrase de taille (`categoryStatementFragment`) est aussi lue par `lecture-accueil.ts`
  et `pastilles.ts` ; la vérification des données de l'accueil au build devra être relancée.
