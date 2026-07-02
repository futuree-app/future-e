# Rapport d'impact — Veille « demande où-vivre × climat » (deep-research 2026-07-01)

> Produit par l'Archiviste, read-only. Matière source : `docs/rapports-agents/deep-research/2026-07-01-demande-ou-vivre-climat-brut.md`.
> Mémoire inspectée avant proposition : `docs/vault/doctrine/data.md`, `docs/vault/doctrine/editoriale.md`,
> `docs/vault/doctrine/positionnement.md`, `docs/vault/recherches/inventaire-sources.md`,
> `docs/vault/vision/modele-economique.md`, `docs/vault/paris.md`, `docs/vault/adr/ADR-0009-hierarchie-orchestration-agents.md`,
> `docs/rapports-agents/discoverability-strategist/2026-06-26-inondation.md`,
> `/Users/quentinbrache/.claude/projects/-Users-quentinbrache-Desktop-Futur-e/memory/MEMORY.md` (index complet),
> `/memory/icu_ilot_chaleur_data.md`. Aucun fichier écrit par moi : ce rapport est une proposition, Claude
> principal exécute.

## Verdict d'ensemble

Sur les 4 livrables proposés par la critique externe (A/B/C/D) + le constat méthodologique, **aucun ne
mérite un fichier neuf**. Trois touchent une doctrine ou un inventaire déjà existants et doivent les
**mettre à jour** (pas les dupliquer) ; un (D, Orpi/GEO) ne franchit pas le seuil de connaissance durable
en l'état ; le constat méthodologique (convergence avant vérification) mérite une fiche `/memory` nouvelle,
faute d'ADR ou de doctrine existante sur le protocole deep-research. Les chiffres datés (leboncoin,
France Armor, PFAS 0,4 %/0,3 %) ne sont **jamais gravés comme faits** : au mieux en note de prudence
attachée à une règle, jamais comme donnée à citer.

---

## 1. Maille de la donnée (UDI eau, air rue) — UPDATE `docs/vault/doctrine/data.md`

**Quoi** : deux pièges d'agrégation concrets et sourcés — eau potable (SISE-Eaux/Hub'Eau agrégée par
Unité de Distribution, pas par commune ; une commune peut dépendre de plusieurs UDI de qualité
différente) et qualité de l'air (l'indice Atmo classique se calcule « en situation de fond », sans les
phénomènes de proximité : effet canyon, bord d'axe routier).

**Pourquoi durable** : ce ne sont pas des faits d'actualité, ce sont des **règles de rattachement par
source**, exactement la matière que `doctrine/data.md` catalogue déjà (règle 5 : « documenter les règles
de rattachement par source », avec une liste BAN/DRIAS/Géorisques/ATMO/Eaufrance). Le fichier existe,
la doctrine est juste, mais la liste actuelle décrit Eaufrance et ATMO en une ligne générique (« commune
ou bassin selon disponibilité », « point → station ou zone ») sans le détail UDI et sans le détail
effet-canyon — cette recherche fournit exactement la précision manquante, avec source vérifiée.

**Destination** : `docs/vault/doctrine/data.md`, section « Règles », dans la règle 5 (liste des
rattachements par source). Pas de nouvelle fiche `/memory` : le fichier vault est déjà la référence
opérationnelle citée par tout le monde (`/memory/home_insee_code_pitfall.md` le pointe déjà), inutile de
dupliquer une projection.

**Action** : `update docs/vault/doctrine/data.md`.

**Doublon** : la doctrine générale (règle 2, 5, 6, 7 + « question de contrôle ») couvre déjà le principe.
Ce n'est pas un doublon de contenu, c'est un **enrichissement d'un exemple déjà prévu par la structure du
fichier** (la ligne 5 liste déjà Eaufrance et ATMO, incomplète). Vérifié aussi contre
`recherches/inventaire-sources.md` ligne 140 (Hub'Eau listé « commune/bassin/station », cohérent, pas
besoin d'y toucher) et contre `/memory/icu_ilot_chaleur_data.md` (même famille de piège, déjà tranché
pour l'ÎCU, cité en lien croisé par le rapport de recherche lui-même).

**Confiance** : haute (deux sources primaires vérifiées directement dans le rapport de recherche : ARS/
SISE-Eaux, atmo-hdf.fr).

**Durée de validité estimée** : pérenne (règle de structure de la donnée, indépendante du calendrier
réglementaire).

**Contenu exact proposé** (à insérer dans la règle 5 de `doctrine/data.md`, en remplaçant/complétant la
ligne actuelle « ATMO (point → station ou zone), Eaufrance (commune ou bassin selon disponibilité) ») :

> - **Eaufrance / SISE-Eaux (eau potable)** : la donnée n'est pas nativement communale, elle est agrégée
>   par Unité de Distribution (UDI). Une commune peut dépendre de plusieurs UDI de qualité différente : ne
>   jamais présenter « l'eau de la commune X » sans préciser (ou sans réduire l'affirmation à) l'UDI de
>   rattachement. *(Vérifié sur data.gouv.fr, fiche SISE-Eaux, 2026-07-01.)*
> - **ATMO (qualité de l'air)** : l'indice classique se calcule « en situation de fond », sans tenir
>   compte des phénomènes de proximité (effet canyon entre bâtiments, exposition en bord d'axe routier).
>   Un indice communal moyen masque une surexposition réelle à l'échelle de la rue. Ne jamais dire « l'air
>   à {commune} est bon » sans nommer cette limite si le contenu s'approche d'une lecture à la rue.
>   *(Vérifié sur atmo-hdf.fr, « Carte stratégique de l'air », 2026-07-01.)*

---

## 2. Affirmations marketing autorisées/non autorisées sur le signal climat-demande — UPDATE `docs/vault/doctrine/editoriale.md`

**Quoi** : une règle de discipline de citation pour les statistiques externes sur « le climat pèse sur le
choix résidentiel » : distinguer une **partie commercialement intéressée non tierce** (leboncoin, France
Armor, Ipsos BVA *pour* Bouygues Immobilier) d'un **institut réellement indépendant**, et ne jamais fondre
deux études à méthodologies différentes en une fausse série temporelle (« doublement du signal »).

**Pourquoi durable** : c'est une règle de discipline de preuve applicable à *toute* future statistique
marketing que futur•e pourrait vouloir citer (pas seulement celle de ce rapport) — exactement le type de
garde-fou qu'`doctrine/editoriale.md` porte déjà (section « Ne pas citer Callendar comme source » = même
famille : distinguer source publique fiable de source à intérêt commercial ; section « On ne raconte que
ce qu'on mesure exactement » = même discipline appliquée aux labels internes). Sans cette règle, rien
n'empêche une prochaine session de citer « un Français sur trois choisit son lieu de vie selon le climat »
comme un fait établi.

**Destination** : `docs/vault/doctrine/editoriale.md`, nouvelle section après « Ne pas citer Callendar
comme source » (même famille : discipline de source). Pas de fiche `/memory` séparée : c'est une règle de
rédaction consultée au moment d'écrire un contenu, donc sa place naturelle est le vault directement (comme
Callendar, qui n'a pas non plus de fiche memory dédiée — vérifié, `feedback_callendar.md` en a une en
fait, courte, qui pointe vers le vault). **Correction** : vu que Callendar a sa fiche memory miroir
(`/memory/feedback_callendar.md`), je propose la même symétrie ici pour la cohérence de convention : vault
= règle complète, memory = rappel court qui pointe vers le vault.

**Action** : `update docs/vault/doctrine/editoriale.md` (create section) + `create /memory/feedback_statistiques_marketing_climat.md`.

**Doublon** : aucun doublon direct. Point de **cohérence à trancher par l'humain**, voir section
Cohérence plus bas : `vision/modele-economique.md` cite déjà « intention de mobilité climatique doublée
(13 % en 2023 → 28 % en 2025, Odoxa) » dans deux endroits (« Preuves fortes » et « Contexte
d'accélération ») — Odoxa est un institut tiers réel (pas le même problème que leboncoin/France Armor),
mais la formulation « doublée » sur deux années est exactement le type de lecture que cette nouvelle règle
interdit si ce sont deux enquêtes ponctuelles non comparables plutôt qu'un baromètre suivi. Je n'ai pas pu
vérifier la source Odoxa moi-même (hors périmètre de la matière fournie) : signalé, pas tranché.

**Confiance** : haute sur la règle générale (constat 0 du rapport, deux sources croisées) ; moyenne sur
l'exemple Odoxa cité en cohérence (je ne l'ai pas revérifié).

**Durée de validité estimée** : pérenne pour la règle ; les exemples numériques cités dans la fiche
doivent être marqués « à requalifier » si jamais réutilisés au-delà de juillet 2026 (les études datent de
2025-2026, un nouveau chiffre écrasera vite celui-ci).

**Contenu exact proposé** (nouvelle section dans `doctrine/editoriale.md`, après « Ne pas citer Callendar
comme source ») :

> ## Statistiques marketing tierces : partie intéressée vs institut indépendant
>
> Avant de citer un chiffre externe sur le comportement résidentiel ou climatique (déménagement,
> intention, critère de choix), vérifier qui a produit l'étude. **Une entreprise dont le chiffre-cadeau
> sert son propre marché (portail immobilier, déménageur, promoteur, assureur) n'est pas une source
> neutre**, même si le chiffre est vrai. Elle peut être mentionnée mais jamais présentée comme la voix
> objective du marché — nommer la source et son intérêt (« selon une étude leboncoin », pas « selon une
> étude »).
>
> **Autorisé, prudent** : « les fortes chaleurs et les risques environnementaux commencent à entrer dans
> les réflexions résidentielles » (affirmation de tendance, sourcée, sans chiffre absolu).
> **Non autorisé sans meilleure preuve** : « un Français sur trois choisit désormais son lieu de vie selon
> le climat » (généralisation d'un chiffre de panel propriétaire d'un acteur commercial, présenté comme
> fait établi).
>
> **Ne jamais construire une série temporelle avec deux études différentes.** Deux enquêtes menées à des
> dates différentes, par des instituts différents, avec des méthodologies différentes, ne forment pas une
> évolution mesurée même si les chiffres semblent raconter une progression (« 13 % en 2023, 28 % en
> 2025 » n'est une preuve de doublement que si c'est le même baromètre, suivi dans le temps, par la même
> méthode). Sinon, présenter chaque chiffre isolément, avec sa date et sa source, jamais relié par « donc
> le signal double ».

**Contenu exact proposé pour la fiche `/memory/feedback_statistiques_marketing_climat.md`** :

> # Feedback : statistiques marketing tierces sur le climat-demande
>
> Doctrine complète : `docs/vault/doctrine/editoriale.md#statistiques-marketing-tierces-vs-institut-independant`.
> Ne jamais citer un chiffre d'acteur commercial intéressé (leboncoin, déménageur, promoteur) comme fait
> établi neutre — nommer la source et son intérêt. Ne jamais relier deux études à méthodologies
> différentes en fausse série temporelle. Déclenché par la veille deep-research du 2026-07-01
> (`docs/rapports-agents/deep-research/2026-07-01-demande-ou-vivre-climat-brut.md`), constat : aucun
> institut tiers indépendant ne confirme aujourd'hui « le climat pèse sur le choix résidentiel ».

---

## 3. Veille PFAS eau potable — UPDATE `docs/vault/recherches/inventaire-sources.md`

**Quoi** : nouvelle obligation réglementaire (surveillance de 20 substances PFAS dans l'eau distribuée
dès le 1er janvier 2026, seuil 0,1 µg/L), source data.gouv.fr en Licence Ouverte 2.0, mise à jour
mensuelle, Ministère de la Santé — candidate pour le futur module Santé/eau, avec le même piège
d'agrégation UDI que l'eau bactériologique (point 1 ci-dessus) et un piège propre : la moyenne nationale
rassurante (0,024 µg/L) masque une exposition concentrée sur une trentaine de réseaux précis.

**Pourquoi durable** : `recherches/inventaire-sources.md` a **déjà** une ligne PFAS, dans la section
« Statut de la roadmap de la matrice repo » : *« Restent non intégrés : Métier […], PFAS (eau), DVF au
moteur (V2). »* PFAS est donc déjà identifié comme piste connue mais vide de détail. Ce rapport apporte
exactement le détail manquant (source précise, calendrier, deux chiffres de couverture concordants, piège
d'agrégation) : c'est un enrichissement d'une entrée existante, pas une nouvelle connaissance.

**Destination** : `docs/vault/recherches/inventaire-sources.md`, section « Statut de la « roadmap » de la
matrice repo » (remplacer la mention sèche « PFAS (eau) » par un paragraphe détaillé), ET ajout d'une
ligne dans le tableau « Les victoires méthodologiques » n'est pas approprié (PFAS n'est pas un refus, c'est
une piste ouverte) — plutôt ajouter une ligne dans le tableau « Gaps validés par une décision réelle » est
aussi inexact (ce n'est pas un gap du dogfood Brest/Lorient). Le bon endroit reste le paragraphe « Statut
de la roadmap », étendu. Pas de fiche `/memory` : ce n'est pas un rappel opérationnel de session, c'est une
entrée de catalogue de sources, déjà chez elle dans `inventaire-sources.md` (qui n'a pas de miroir memory
non plus, cohérent avec le reste du fichier).

**Action** : `update docs/vault/recherches/inventaire-sources.md`.

**Doublon** : vérifié, aucune autre mention de PFAS dans le vault ni dans `/memory/ademe_datasets.md` (à
vérifier par Claude principal si ce fichier existe encore sous ce nom — je ne l'ai pas ouvert dans cette
session, seulement grep sur le vault).

**Confiance** : haute sur le calendrier réglementaire et le seuil (deux sources concordantes citées dans
le rapport recherche) ; moyenne sur les deux chiffres de couverture (31/8036 vs 24/8827 — deux périmètres
différents, écart non expliqué, à ne pas trancher entre les deux tant qu'aucune vérification directe
SISE-Eaux n'a été faite par un agent Data Curator).

**Durée de validité estimée** : le calendrier réglementaire est pérenne (directive UE, 1er janvier 2026
passé) ; les deux chiffres de couverture (0,4 %/0,3 %) sont **volatiles** — mise à jour mensuelle de la
source, donc à requalifier à chaque usage, jamais gravés comme un chiffre fixe.

**Contenu exact proposé** (remplace la phrase « Restent non intégrés : […] PFAS (eau) […] » par) :

> Reste non intégré : **Métier** (le plus pauvre, France Stratégie/INRS/Dares non câblés), **DVF au
> moteur** (V2). **PFAS (eau)** : piste précisée par la veille du 2026-07-01
> (`docs/rapports-agents/deep-research/2026-07-01-demande-ou-vivre-climat-brut.md`) — surveillance de 20
> PFAS dans l'eau distribuée obligatoire en France depuis le 1er janvier 2026 (directive UE, seuil somme
> 0,1 µg/L), source data.gouv.fr/Ministère de la Santé (Licence Ouverte 2.0, mise à jour mensuelle),
> quelques dizaines de réseaux sur ~8 000-8 800 dépassent le seuil (ordre de grandeur 0,3-0,4 % des
> réseaux, chiffre à revérifier à l'usage). **Même piège d'agrégation que l'eau bactériologique** : donnée
> par UDI/réseau, pas par commune, et une moyenne nationale rassurante masquerait une exposition
> concentrée sur les réseaux qui dépassent. Pas encore auditée par le Data Curator ; intérêt pour un futur
> module Santé/eau au-delà de la conformité microbiologique classique. Rien qui touche le goulot
> d'acquisition (ne justifie aucune priorité produit immédiate).

---

## 4. Note GEO Orpi/Kleio — PAS de capture vault/memory dédiée

**Quoi** : Orpi (1 250 agences françaises) a connecté son catalogue à ChatGPT/Google AI/Claude via une
plateforme tierce (Kleio).

**Pourquoi durable → refusé** : le rapport de recherche lui-même conclut que ce signal « renforce
l'urgence GEO déjà actée, ne crée pas de nouvelle piste ». J'ai vérifié : le rapport
`docs/rapports-agents/discoverability-strategist/2026-06-26-inondation.md` porte déjà, en détail et avec
plan d'action priorisé, exactement la même urgence (JSON-LD, sitemap, robots, canonical — priorité n°3
« ajouter les données structurées schema.org […] plus fort levier GEO, zéro risque voix »). Un concurrent
isolé qui confirme une direction déjà écrite et déjà priorisée n'est pas une connaissance nouvelle, c'est
une **preuve de confiance** à la marge sur une décision déjà prise. Créer une fiche pour ça reviendrait à
graver une anecdote de renforcement, pas un « pourquoi » durable neuf.

**Ce que je propose à la place** (minimal, pas une fiche) : si Claude principal veut tout de même laisser
une trace, la case appropriée est un **ajout d'une ligne à `paris.md`** au pari existant le plus proche
(aucun pari GEO dédié n'existe actuellement dans `paris.md` — vérifié, aucune occurrence de « GEO » ou
« LLM » dans les 8 paris recensés) — mais ouvrir un 9e pari sur la base d'un seul signal Orpi non généralisé
serait disproportionné par rapport à la matière (« signal isolé, un seul acteur français documenté », dixit
le rapport lui-même). Je recommande de **ne rien graver**, et de laisser ce fait vivre uniquement dans le
rapport deep-research déjà sur disque, cité si un futur audit Discoverability veut l'invoquer comme
antécédent.

**Signal de révision** : si un deuxième acteur français (SeLoger, Bien'ici, ou un autre réseau d'agences)
documente publiquement une intégration LLM similaire, ce n'est plus un signal isolé — à ce moment, ouvrir
soit un pari `paris.md` (« la distribution immobilière bascule vers les agents IA »), soit une mise à jour
du risque n°4 de `modele-economique.md` (« un portail immobilier qui ajoute un score climat »).

---

## 5. Constat méthodologique : « converger avant de vérifier » — CREATE `/memory/feedback_deep_research_convergence.md`

**Quoi** : la vérification adversariale automatisée du harnais deep-research a produit un faux verdict
(« 0 confirmée/25 rejetées ») par abstention en cascade sur une limite de session, pas par jugement de
fond. La leçon n'est pas « moins de collecte » (la divergence large a trouvé PFAS/UDI/Orpi, invisibles à
une recherche à 3 questions fermées) mais **« converger avant de vérifier »** : sélectionner à la main les
affirmations qui changent réellement une décision produit avant de lancer une vérification adversariale
coûteuse sur l'ensemble.

**Pourquoi durable** : c'est un mode opératoire réutilisable pour tout futur run deep-research ou tout
audit multi-agents à fan-out large (60 affirmations, 108 agents) suivi d'une passe de vérification — le
type d'erreur (abstention comptée comme rejet, épuisement de session sur une vérification exhaustive plutôt
que ciblée) coûtera à nouveau cher si elle se répète. Vérifié : ni `ADR-0009-hierarchie-orchestration-agents.md`
(qui régit l'escalade entre spécialistes/board/ADR, pas le protocole de vérification d'une collecte
divergente) ni aucun autre fichier vault ne porte cette règle aujourd'hui — pas de doublon.

**Destination** : `/memory/feedback_deep_research_convergence.md` **seul**, sans entrée vault. Justification
de ce choix (pas vault) : c'est un rappel opérationnel pour la *prochaine session* qui lance un pareil
run, pas encore une doctrine stabilisée par la répétition — un seul run a eu lieu à ce jour (« Statut »
en tête du rapport source : « premier run »). Un vault ADR/doctrine se justifierait après un deuxième run
qui confirme le pattern, ou si Claude principal préfère graver la règle tout de suite par prudence (à
trancher par l'humain, voir Cohérence).

**Action** : `create /memory/feedback_deep_research_convergence.md`.

**Doublon** : aucun. Le plus proche conceptuellement est `paris.md` (ligne directrice n°1 : « on réduit
l'incertitude au coût le plus faible possible ») — même famille d'esprit (arbitrer le coût de la preuve),
mais `paris.md` documente des paris produit, pas un protocole d'agent. Pas un doublon, un cousin
conceptuel à citer en lien.

**Confiance** : moyenne — n=1 (un seul run, un seul échec de ce type), la règle est bonne par
raisonnement mais pas encore éprouvée par la répétition.

**Durée de validité estimée** : à revoir au 2e run deep-research (confirmera ou nuancera le mode
opératoire), ou à graver en doctrine vault si le pattern se répète.

**Contenu exact proposé** :

> # Feedback : converger avant de vérifier (deep-research)
>
> Le premier run deep-research (2026-07-01, `docs/rapports-agents/deep-research/2026-07-01-demande-ou-vivre-climat-brut.md`)
> a eu une collecte large réussie (108 agents, 60 affirmations, trouvailles réelles : PFAS/UDI, piège
> Landes, Orpi/Kleio — invisibles à une recherche à questions fermées) mais sa vérification adversariale
> automatisée a échoué techniquement : abstention en cascade sur une limite de session, comptée à tort
> comme rejet (faux verdict « 0 confirmée/25 rejetées »).
>
> Leçon retenue : **ne pas réduire la divergence** (elle a trouvé ce qu'une recherche étroite aurait
> manqué), mais **sélectionner à la main les affirmations qui changent une décision AVANT de lancer une
> vérification adversariale coûteuse sur la totalité**. Vérifier 6 affirmations porteuses en refetchant
> les sources primaires vaut mieux qu'une passe automatisée sur 25 qui s'épuise avant la fin. Cousin
> conceptuel : `docs/vault/paris.md` (« on réduit l'incertitude au coût le plus faible possible »).
>
> À revoir : au prochain run deep-research (confirme ou nuance ce protocole) ; si le pattern se répète
> deux fois, faire remonter en doctrine vault (`adr/ADR-0009` ou nouvelle fiche `doctrine/`).

---

## Refusé

- **Les 19 affirmations non revérifiées de l'annexe** (mobilité résidentielle MySweetImmo, assurance
  habitation par région, 22 %/57 % Ipsos BVA/architecturebois.fr) : aucune n'a de « pourquoi durable »
  propre — ce sont des chiffres d'étude datés, non vérifiés individuellement par le porteur, dont la
  moitié n'a même pas de source primaire recroisée. À ne pas graver. Si l'un d'eux devient un jour
  déterminant pour une décision produit, il devra d'abord être revérifié comme les 6 affirmations
  porteuses l'ont été.
- **Le chiffre PFAS exact (31/8036 vs 24/8827)** : volatile par construction (mise à jour mensuelle), ne
  mérite pas d'être gravé comme un fait fixe — voir §3, gravé en ordre de grandeur qualifié seulement.
- **GD4H vide en beta** : correction ponctuelle d'un rapport de collecte, pas une connaissance durable en
  soi. Si Claude principal veut néanmoins tracer qu'il ne faut pas y retourner avant sa sortie de beta, la
  seule modification proportionnée serait de retirer la mention GD4H de l'annexe non vérifiée du rapport
  deep-research existant (déjà sur disque) plutôt que de créer une entrée vault pour un non-événement.
- **data.gouv.fr pas de rupture en 2026** : un non-événement rassurant n'est pas une connaissance à
  archiver ; il n'y a rien à retenir opérationnellement (aucune action, aucun garde-fou). Pas de capture.
- **Le financement immobilier / refus de prêt climatique** (point 3 du rapport) : anecdote de
  professionnel non confirmée statistiquement. Utile comme argument de conviction ponctuel pour un
  contenu paywall territoire si le porteur le souhaite un jour, mais ce n'est pas une connaissance
  structurante — à laisser dans le rapport source, pas à graver.
- **Cas des Landes (stock +4,8 %, demandes -11,5 %)** : bon exemple pédagogique mais **anecdotique et
  daté** (mars-mai 2026, un marché local) — un exemple concret n'est pas une règle. Il illustre déjà une
  règle qui existe (doctrine « décrire jamais juger » / anti-lecture-abusive d'un signal), il n'en crée pas
  une nouvelle. Ne pas graver l'anecdote elle-même ; la règle qu'elle illustre est déjà couverte par la
  proposition 2 (statistiques marketing) sans besoin de citer les Landes nommément dans la doctrine.

## Cohérence

**Point à trancher par l'humain, pas par moi** : `vision/modele-economique.md` cite en deux endroits
(« Preuves fortes » et « Contexte d'accélération 2025-2026 ») un chiffre « intention de mobilité
climatique doublée (13 % en 2023 → 28 % en 2025, Odoxa) ». La nouvelle règle proposée en §2 interdit
justement de relier deux études à méthodologies différentes en fausse série « doublée ». Je n'ai pas pu
vérifier moi-même si le chiffre Odoxa 13 %→28 % provient d'un même baromètre suivi dans le temps (auquel
cas la formulation « doublée » reste honnête et rien ne change) ou de deux enquêtes ponctuelles distinctes
(auquel cas `modele-economique.md` devrait lui-même être corrigé pour ne plus dire « doublée » mais citer
les deux chiffres séparément avec leurs dates). Trois options pour l'humain : (1) vérifier la source Odoxa
et confirmer/infirmer la formulation actuelle, (2) modifier `modele-economique.md` par prudence pour
désolidariser les deux chiffres en attendant vérification, (3) documenter explicitement pourquoi ce cas
Odoxa échappe à la règle (ex. : c'est effectivement un baromètre suivi). Je ne tranche pas.

## Pépites

- **La distinction « signal isolé vs pattern »** appliquée à Orpi (un seul acteur documenté, pas de
  généralisation) est une discipline de lecture bien tenue dans le rapport source, cohérente avec la
  discipline de preuve déjà en place dans `modele-economique.md` (hiérarchie certitudes/preuves
  fortes/moyennes/hypothèses). Ça vaudrait la peine, un jour, d'expliciter cette hiérarchie comme un
  patron réutilisable pour *tout* rapport d'agent (pas seulement le modèle économique) — piste pour un
  futur enrichissement du gabarit de rapport d'agent (`docs/rapports-agents/_README.md`), pas pour
  aujourd'hui.
- **Le constat 0 du rapport** (aucune des deux sources de demande n'est indépendante) est plus fort que
  la somme de ses parties : c'est un rappel utile que futur•e n'a, à ce jour, **aucun chiffre public
  fiable et citable** pour justifier publiquement sa thèse « le climat pèse sur le choix résidentiel ».
  Si le porteur veut un jour un chiffre à afficher en page d'accueil ou en argumentaire presse, ce
  manque est à traiter comme un besoin de recherche actif (commander/chercher une étude d'institut
  tiers), pas comme un détail. Signalé, pas tranché : ce n'est pas à l'Archiviste de décider si futur•e
  doit financer une étude.

## Version minimale (la plus petite capture qui préserve ~90 % de l'apprentissage)

Si Claude principal ne devait retenir qu'une phrase par proposition :

1. **Maille** : « Eaufrance (UDI ≠ commune) et ATMO (indice de fond ≠ rue) rejoignent la liste des
   rattachements par source dans `doctrine/data.md`, règle 5. »
2. **Marketing** : « Ne jamais citer un chiffre d'un acteur commercial intéressé comme fait neutre ; ne
   jamais relier deux études différentes en fausse série temporelle — nouvelle section dans
   `doctrine/editoriale.md`. »
3. **PFAS** : « La ligne sèche "PFAS (eau)" de `inventaire-sources.md` devient un paragraphe avec
   calendrier, source, piège d'agrégation — toujours en piste non intégrée, rien ne change côté produit. »
4. **Orpi** : rien à graver, le rapport discoverability du 2026-06-26 porte déjà tout le plan d'action.
5. **Méthode** : « Avant de vérifier 25 affirmations adversarialement, en sélectionner 5-6 porteuses de
   décision — `/memory/feedback_deep_research_convergence.md`, à confirmer au 2e run. »

## Quand rouvrir ce sujet ?

- **§1 (maille)** : si le module Santé/eau se construit un jour et a besoin d'afficher une valeur eau à la
  commune — c'est le moment de vérifier si le fichier de correspondance UDI→commune est exploitable
  proprement (le rapport le signale mais ne le teste pas).
- **§2 (statistiques marketing)** : si une nouvelle étude climat-demande sort (probable, le sujet est
  chaud) — revérifier si elle change le constat 0 (toujours aucun institut tiers) avant de l'intégrer à un
  contenu.
- **§3 (PFAS)** : quand le Data Curator audite formellement la source (pas fait à ce jour), ou si le
  module Santé passe en construction active — c'est le déclencheur naturel pour sortir PFAS de « piste » et
  l'auditer pour de vrai.
- **§4 (Orpi)** : si un deuxième acteur français documente une intégration LLM similaire (signal devient
  pattern, pas isolé) — voir Signal de révision dans la section 4 elle-même.
- **§5 (méthode)** : au 2e run deep-research, quel qu'en soit le sujet — vérifier si la sélection manuelle
  avant vérification adversariale a effectivement évité l'échec en cascade observé cette fois.
- **Cohérence Odoxa** : dès que le porteur ou un futur agent Business Strategist a le temps de vérifier la
  source Odoxa 13 %→28 % citée dans `modele-economique.md` — actuellement non vérifiée dans cette session.
