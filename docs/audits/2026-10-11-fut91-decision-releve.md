# FUT-91 · « Le relevé » dans le vrai écran Ma décision

Date : 11 octobre 2026 · Branche : `feat/fut-91-decision-releve`, depuis `origin/main` (`0480b422`, FUT-87 #47, après FUT-54 #46).
Statut : **livré pour revue, non activé.** La nouvelle présentation est derrière un drapeau serveur
(`DECISION_RELEVE=true`) ; sans lui, la production rend exactement l'écran actuel.

## 1. Où vit l'écran

`src/app/(account)/rapport/page.tsx` rend le dossier communal (`DossierDecisionSection` puis
`ControlesDuDossier`, deux fois : repli pendant l'analyse d'adresse, et dossier communal seul) ;
`src/components/report/DossierAvecLogement.tsx` rend le dossier d'adresse (mêmes deux composants, avec
artefact, provenance, changements de projet et de voisinage). **Aucun de ces deux appelants n'est
modifié** : la bascule se fait à l'intérieur de `DossierDecisionSection` et de `ControlesDuDossier`, ce
qui couvre les trois chemins sans toucher aux fichiers que FUT-10 fait évoluer.

## 2. Matrice de parité

Légende : **=** conservé à l'identique (même composant ou même donnée) · **≈** conservé, présentation
adaptée · **+** ajouté par le relevé · **doc** écart documenté.

| Comportement de production | Ancien écran | Prototype FUT-87 | Nouvelle version |
| --- | --- | --- | --- |
| Verdict déterministe (`ConclusionBlock`, titre jamais généré) | oui | texte du plan seulement | **=** même `ConclusionBlock`, variante « plaque » |
| Lecture enrichie (`ConclusionRedigee` : gating `DOSSIER_NARRATIVE`, prefetch, hash, cache, génération, validation, persistance) | oui | non | **=** même composant, seule une prop de présentation le traverse ; aucune ligne de génération touchée |
| Repli déterministe sous `Suspense`, streaming | oui | non | **=** même structure (`Suspense` + repli identique au rendu final) |
| Pas de second appel au modèle pendant `pending` | oui | sans objet | **=** même branche `pending` → bloc déterministe |
| Niveau de titre (`h1` sur `/rapport`) | oui | `h1` fixe | **=** prop `titre` respectée |
| Condition portée par le bloc (`conditionPorteeParLeBloc`) et sa preuve | oui | preuves seulement | **=** dans le bloc, preuve en marge |
| Priorités non couvertes (`uncovered_priorities`) | oui | oui | **=** |
| Gestes prioritaires (`PriorityControlActions` : ancres actives, mesure PostHog, « ensuite ») | oui | liste statique | **=** même composant dans la plaque |
| Date de génération (artefact seulement, jamais « aujourd'hui ») | oui | non | **=** |
| Projet changé / voisinage changé (`AnalyseAncienProjet`, mise à jour explicite) | oui | non | **=** même composant, au-dessus de la plaque |
| `logementStatus` `pending` (commune lue, adresse en cours) | bandeau | non | **≈** bandeau relevé, même texte |
| `logementStatus` `unavailable` (jamais présenté comme adresse lue) | bandeau | non | **≈** bandeau relevé, même texte ; périmètre communal dans l'emblème |
| Colonne d'appui (`supportingPane`, navigateur d'échelles) | colonne droite / entre verdict et cartes | non | **=** même emplacement |
| Sections de la minute (`sectionsDeLaMinute`), ordre du plan | oui | oui | **=** même sélection, aucune seconde sélection |
| Teinte des registres, conditions sans blocage en « contrôle » | oui | oui | **=** |
| Correspondances en deux lignes (sujet + `faceStatement`) | oui | oui | **=** |
| Grain affiché une fois / par carte | intertitres | marge | **≈** glyphe et mention en marge, par carte |
| « Au-delà de vos priorités » (intro de section, constat ambiant en section mixte) | oui | oui | **=** |
| `FactBody` : statut, énoncé, limitation | oui | oui | **=** mêmes champs |
| Preuves chiffrées (`Chip`) et sources nommées | pastilles | marge, sans `provenance` | **≈** marge ; **lien construit avec `evidenceHref(cible, href, provenance)`**, comme en production |
| Geste d'une carte (`ActionCue`) | oui | oui | **=** mêmes glyphes |
| « Données et limites » (`MethodDetails` : à vérifier, méthode du signal) | oui | oui | **=** même contenu, deux zones |
| Compositions : arbitrage en regard, vérifications groupées, écart + geste, cause partagée | oui | oui | **=** tous les côtés, preuves, statuts, limites et gestes |
| Faits absorbés non racontés par la face (dépliable) | oui | oui | **=** |
| Ancres des cartes (`dossierAnchorId`, `tabIndex=-1`, `scroll-margin`) | oui | oui | **=** |
| Conditions sans carte (FUT-7) | oui | oui | **=** |
| Lien « Voir l'analyse du logement » / « Affiner avec une adresse » sans colonne d'appui | oui | non | **=** |
| Projet non structuré (`project_not_structured`) | lien masqué | non | **=** |
| Liste complète des contrôles (`ControlesDuDossier` : `controlesParEchelle`, vérifications non réalisées, groupes repliés, comptes, provenance) | oui | non | **≈** même vue du moteur, présentée en registre par échelle |
| Sommaire du dossier | non | oui | **+** comptes de cartes de la minute, liens vers les sections |
| Emblème : échelles examinées / sans constat / non examinées | non | oui | **+** périmètre du dossier ; prudence sur le voisinage (§ 4) |
| Balance correspond / correspond moins bien | non | oui | **+** en regard sur grand écran, empilée sur mobile |
| Rangs et seuils dessinés (`basis`) | non | oui | **+** |
| En-tête du dossier (`EnTeteDossier`) | oui | non | **doc** inchangé dans ce lot (zone partagée avec FUT-10) |

## 3. Ce que la nouvelle version ajoute, et ce qu'elle s'interdit

Elle ajoute la plaque, le sommaire, la marge de preuve, l'emblème, la balance et les dessins de
fondement. Elle s'interdit : tout recalcul du verdict, toute seconde sélection de faits, toute
génération au modèle pour des raisons visuelles, tout score.

## 4. Limite reprise de FUT-87

Le périmètre `commune+adresse` dit que le moteur a été relancé à l'adresse, pas que toutes les sources
du voisinage ont répondu. Le `Dossier` ne porte pas cette information : l'emblème dit « examiné »
sans jamais affirmer une couverture complète du secteur.

## 5. Ce qui a été construit

| Fichier | Rôle |
| --- | --- |
| `src/components/releve/primitives.tsx`, `releve.module.css` | Les primitives FUT-87, **déplacées** (historique conservé) et partagées ; `.releveSection` porte les jetons dans une page existante sans imposer fond ni hauteur |
| `src/components/releve/lecture-dossier.ts` | L'adaptateur du dossier (déplacé) ; ajoute `lireCarteDuDossier`, les zones « À vérifier » / « Méthode du signal », et compte l'emblème sur toute la page |
| `src/components/releve/marge.ts` | La marge de preuve en logique pure ; **liens avec `provenance`** |
| `src/components/releve/EntreeReleve.tsx` | Une carte du dossier (minute et liste complète) |
| `src/components/releve/DossierDecisionReleve.tsx` | Le hub relevé : mêmes props que `DossierDecisionSection` |
| `src/components/releve/ControlesReleve.tsx` | La liste complète des contrôles |
| `src/components/releve/activation.ts` | Le drapeau `DECISION_RELEVE` (éteint par défaut) |
| `ConclusionBlock.tsx` | Variante `releve` (plaque) ; la variante classique est inchangée |
| `ConclusionRedigee.tsx` | Transmet la présentation à ses quatre rendus ; logique de génération intacte |
| `DossierDecisionSection.tsx`, `ControlesDuDossier.tsx` | Bascule en tête, prop `presentation` optionnelle |
| `src/app/dev/fut91/` | Banc : même dossier, deux présentations, tous les états (404 en production) |
| `src/app/dev/fut87/decision` | Rend désormais le composant de production ; `DecisionReleve.tsx` du prototype est **supprimé** (une seule implémentation) |

**Activer pour revue** : ajouter `DECISION_RELEVE=true` à l'environnement du serveur (local : `.env.local`).
Le banc : `/dev/fut91` (réglages en tête de page), lancé avec `DOSSIER_NARRATIVE=false` pour n'appeler
aucun modèle.

## 6. Vérifications

- **Tests** : 25 tests du relevé (fidélité, provenance, périmètre, activation, liens avec provenance,
  ancres, complétude des contrôles, structure de production, lecture enrichie, absence de seconde
  sélection, plaque FUT-54) ; mutations détectées (provenance retirée, génération pendant `pending`,
  plus celles de FUT-87). Suite complète 2427/2427, typecheck, build. Lint : un seul signalement, déjà
  présent sur `main` (`ConclusionRedigee.tsx`, JSX dans un `try`).
- **Vrai `/rapport`** (session du porteur, lecture seule, drapeau actif, aucune capture conservée) :
  artefact daté, projet changé, plaque, sommaire, deux gestes, navigateur, emblème, balance, liste
  complète ; aucun identifiant en double, aucun débordement.
- **Banc** : dossier communal, dossier d'adresse réel (bâtiment public), `pending`, `unavailable`,
  artefact, projet et voisinage changés, colonne d'appui, condition ouverte, nombreuses réserves, titre
  long, texte enrichi long (simulé, sans modèle). 1440, 1280, 390 et 360 px, sans débordement.
- **Clavier** : sommaire, gestes, navigateur, liens de preuve, « Données et limites », groupes de
  contrôles ; contour de 2 px. **Mouvement** : aucune animation ; les seules transitions sont sous
  `prefers-reduced-motion: no-preference`.

## 7. Problèmes trouvés en route

1. **L'emblème ne comptait que la minute** (hérité de FUT-87) : sur un vrai dossier d'adresse, il disait
   « Logement : aucun constat affiché » au-dessus d'une liste de trois contrôles au logement. Il compte
   désormais toutes les cartes affichées sur la page, sans doublon (test D2).
2. **Les liens de preuve du prototype ignoraient la provenance** de l'artefact servi : corrigé (test B1).
3. **La liste complète aurait dupliqué les ancres** de la minute : elle n'en pose plus, comme en production
   (test C2).
4. **Artefact antérieur à FUT-54** : le dossier réel consulté, figé le 21/09, affiche « Bonne
   correspondance » au-dessus d'un écart. Le relevé le sert tel quel et ne le masque pas (le sommaire
   compte l'écart) ; sa régénération relève du produit, pas de ce lot.
5. **FUT-90 conservé** : à Nîmes, `confirmer=faible_chaleur` fait toujours échouer l'assemblage
   (« fait absorbé inexistant »), sur `/dev/dossier` comme sur le banc (erreur 500). Non masqué.

## 8. Écarts connus et limites

- `EnTeteDossier` et `AnalyseAncienProjet` gardent leur dessin actuel (zone partagée avec FUT-10) : le
  bandeau « Votre projet a changé » reste une carte arrondie au-dessus de la plaque.
- Sur grand écran, l'emblème du navigateur (colonne d'appui) et celui de « D'où viennent ces constats »
  coexistent. Les fondre (l'état des échelles dans le navigateur) est la suite naturelle, hors de ce lot.
- La lecture enrichie réelle n'a pas été rendue (aucune génération autorisée) : sa mise en page est
  éprouvée par un détail trois fois plus long que le repli.
- Safari non testé (pas de moteur WebKit installé pour l'automate).
- La limite du voisinage reste entière (§ 4).
