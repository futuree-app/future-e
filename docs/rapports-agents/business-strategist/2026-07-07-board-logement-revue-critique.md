# Board Logement — revue critique (lentille Business Strategist)

**Date** : 2026-07-07 · **Contexte** : board EXTRÊMEMENT critique du module Logement (avec Product Strategist, Editorial Writer, Software Architect). Question du porteur : quelles erreurs de conception empêcheraient futur•e de devenir une entreprise de plusieurs millions d'euros ?

**Lu avant de juger** : `docs/vault/vision/modele-economique.md`, `docs/vault/modules/logement.md`, `src/app/api/synthesize-logement/route.ts` (SYSTEM_PROMPT inclus), `src/components/report/LogementModule.tsx` (structure des sections), `docs/superpowers/specs/2026-07-07-logement-synthese-auto-artefact-design.md`, fiches mémoire modèle économique / paywall / module Logement. Vérifié : ERRIAL (errial.georisques.gouv.fr), service d'État, « évaluer simplement et rapidement les risques de votre bien », à l'adresse.

---

## Le goulot aujourd'hui

**La disposition à payer B2C, non mesurée.** C'est le pari central du modèle (hiérarchie de preuve de `modele-economique.md` : « le consentement à payer B2C, précédent CityScan parti en B2B »). Rien dans ce board ne doit se lire autrement qu'à travers cette question : le module Logement, tel que construit, augmente-t-il la probabilité qu'un ménage sorte sa carte, et le saura-t-on ? Toute critique qui ne touche ni ce goulot ni le moat est secondaire par construction.

---

## Critique 1 : le module vend surtout ce que l'État donne gratuitement, et sous-investit la seule brique qui incarne la thèse

- **Problème.** Le test décisif du porteur (« sans le logo, quelqu'un peut-il reconstruire cette page avec ChatGPT + APIs publiques ? ») donne aujourd'hui une réponse inconfortable : **oui, pour environ 70 % de la page**. Géorisques expose les risques à l'adresse ; **ERRIAL, service d'État gratuit, produit déjà une évaluation des risques de « votre bien » à l'adresse** ; l'ERP (état des risques et pollutions) est de toute façon **remis obligatoirement à tout acquéreur/locataire** ; le DPE est public (observatoire ADEME) ; BPE/OSM sont ouverts. Un utilisateur outillé de ChatGPT reconstitue le Passeport, les risques du bâti, le statut PPR et une lecture prosée en une session. Ce qui n'est PAS reconstructible en un prompt : la sinistralité ONRN mise en lecture décisionnelle, le statut réglementaire au point trié par régime (`buildRegulatoryPlans`), le snapshot figé « autour », la hiérarchisation ≤3 phénomènes, et surtout **le croisement climat futur × bâti (confort d'été DRIAS × isolation, « ce logement en 2050 »)**. Or cette dernière brique, la seule qui incarne littéralement la thèse-mère (« le climat n'est plus le marché, c'est le différenciant »), est **la moins avancée** : Face 1 socle sur branche non mergée, le croisement DRIAS×DPE promis par la doctrine (`logement.md`, Face 1 : « le confort thermique en 2050 ») pas livré.
- **Pourquoi.** Le module a été construit dans l'ordre de la faisabilité des données (Face 2 et 3 branchées, faciles), pas dans l'ordre de la défendabilité. Résultat : la page payante actuelle est **documentaire** (concurrence gratuite d'État frontale) là où le moat revendiqué est **prospectif** (personne ne fait « ce bien sous +2,7 °C »).
- **Impact business.** Direct sur le goulot : un acheteur qui découvre qu'ERRIAL + l'ERP du vendeur couvrent gratuitement l'essentiel de la page ne paie pas, et pire, il requalifie futur•e en « site de risques » (risque structurant n°1, catégorie mal comprise, et n°3, concurrence gratuite). Le vrai moat de la page, ALORS, n'est ni la donnée ni même la transformation actuelle : c'est (a) le croisement prospectif climat×bâti non livré, (b) l'accumulation (artefact par utilisateur, capital de compréhension, distribution SEO), (c) la voix qui hiérarchise. (a) est absent, (b) est embryonnaire, (c) est réel mais copiable en un prompt s'il n'est pas nourri par (a).
- **Bloquant ou secondaire.** **BLOQUANT.** C'est l'erreur de conception n°1 du module au sens du porteur.
- **Recommandation.** Inverser la priorité : merger et pousser la lecture thermique prospective (Face 1 + croisement DRIAS) AVANT tout raffinement des faces documentaires. Chaque bloc documentaire doit gagner sa place en servant le croisement, pas en existant seul.

## Critique 2 : la clé de persistance `(user, insee)` contredit le moment de vie qui paie

- **Problème.** L'artefact Logement (table `logement`, synthèse comprise, cf. `saveSynthesis(supabase, user.id, insee, …)` dans la route) est persisté par **(utilisateur, commune)**. Or le moment de vie à plus forte intention et solvabilité est l'**acheteur en recherche active**, qui visite typiquement **plusieurs biens dans la même commune**. Architecturalement, analyser le bien n°2 écrase le bien n°1.
- **Pourquoi.** Le grain revendiqué du module est l'ADRESSE (« le seul module qui descend à la parcelle », `logement.md`), mais le grain de persistance est la COMMUNE. Le moat déclaré et la structure de données ne disent pas la même chose.
- **Impact business.** Triple. (1) C'est la réponse à « quel est le modèle économique d'un produit à usage ponctuel ? » : une adresse s'analyse une fois, mais **une décision d'achat en analyse cinq**. Le multi-adresses est au module Logement ce que le Pack (N communes) est au comparateur : la forme naturelle de monétisation du moment. On se l'interdit dans le schéma. (2) La comparaison de biens visités est exactement ce que ChatGPT ne fait pas avec mémoire et artefacts figés : c'est un moat d'accumulation par utilisateur. (3) C'est la structure dont le **B2B 2027 a besoin** (CGP/notaire = flux d'adresses, pas une adresse par commune) ; CityScan facture précisément **à l'adresse** (6-8,50 € HT). Le module actuel ne prépare pas ce relais.
- **Bloquant ou secondaire.** **BLOQUANT à 12 mois** (pas cette semaine : le paiement B2C d'abord). Plus on attend, plus la migration coûte.
- **Recommandation.** Décider maintenant, migrer tôt : clé `(user, address_id)` (point géocodé ou identifiant BAN), la commune devenant un attribut. Puis, seulement après preuve de paiement, tester une offre « décision d'achat » multi-biens (pendant du Pack Décision, même logique ADR-0007).

## Critique 3 : la face à plus forte willingness to pay (l'engagement financier) est la moins construite

- **Problème.** Ce que l'acheteur achète *vraiment* (hypothèse à tester, pas un fait) : ni la connaissance des risques (il la reçoit légalement via l'ERP), mais **« qu'est-ce que ça m'engage : négocier combien, provisionner quoi, renoncer quand ? »**. C'est la Face 4 de la doctrine (« le coût qu'un acquéreur doit documenter avant de s'engager »). Elle est réduite aujourd'hui à une brique PPR (excellente) et à quatre `ActionCard` génériques (« Comprendre le calendrier DPE », « Vérifier votre couverture assurance ») qui sont des liens documentaires, pas de la transformation.
- **Pourquoi.** La doctrine a (justement) parqué la valeur immobilière individuelle, et le module a traité ce parcage comme un parcage de toute la face financière. Or entre « estimer le bien » (interdit, à raison) et « lien vers le calendrier DPE » (gratuit partout), il existe un étage : coûts conventionnels de rénovation datés, échéances passoires appliquées à CE bien, pédagogie CatNat chiffrée nationale, franchise/surprime documentées, coût moyen ONRN déjà là. L'ancre de prix du modèle (« 14 € contre 600-800 € de diagnostics ») ne fonctionne que si la page parle le langage des euros engagés.
- **Impact business.** C'est la variable de **valeur perçue** au moment du paiement. La valeur réelle (statut PPR trié, sinistralité verbatim) est forte mais froide ; la valeur perçue naît quand le lecteur voit ce que ça change à son chèque. Sans cette face, le refus du verdict (voir critique 4) n'est pas compensé.
- **Bloquant ou secondaire.** Majeur, non bloquant immédiatement (dépend de la preuve de paiement).
- **Recommandation.** Faire de la Face 4 documentée (jamais prédite) le deuxième chantier de contenu après le croisement climat×bâti. Interdits doctrinaux inchangés.

## Critique 4 : le refus du verdict, position assumée : atout de confiance, MAIS la clôture posture-neutre de la synthèse sacrifie de la willingness to pay sans nécessité doctrinale

- **Problème.** Le porteur demande une position : je la prends. **Le refus du score/verdict est le bon pari économique** : c'est un actif de confiance différenciant (tout le gratuit note ; ERRIAL évalue ; un « 6/10 » nous rendrait comparables et attaquables), et c'est la condition du B2B notaire/CGP (un professionnel réglementé ne peut pas s'appuyer sur un verdict, il peut s'appuyer sur un document). MAIS la doctrine a sur-étendu ce refus dans la synthèse : le SYSTEM_PROMPT interdit à la clôture de « s'adresser à aucun projet particulier (ni achat, ni location, ni résidence) ». Les gens paient pour qu'on les aide à trancher **leur** question. Une synthèse qui refuse de savoir si le lecteur achète ou habite plafonne sa valeur perçue au moment exact du paiement. Le bloc déterministe `Face2Implication` porte la posture, certes, mais le héros déclaré de la page (la synthèse) est posture-aveugle par conception, ET la spec grave « la posture ne touche jamais le prompt » pour une raison qui est en réalité **économique** (ne pas payer 2 générations), présentée comme doctrinale.
- **Pourquoi c'est important.** La distinction qui compte : **verdict** (interdit, ADR-0001) ≠ **lecture adressée au projet** (autorisée partout ailleurs dans le produit : Territoire a résidence/découverte, Face2Implication a les postures). « Pour un achat, l'enjeu se concentre sur X à documenter avant de vous engager » n'est pas un verdict.
- **Impact business.** Conversion et perception de personnalisation, au point le plus chaud du tunnel. Coût réel d'une synthèse par posture : ~0,015 €/appel × 2-3 postures, négligeable ; le coût n'est pas le levier ici, c'est un choix de design déguisé en économie de tokens.
- **Bloquant ou secondaire.** Secondaire aujourd'hui (le texte doit d'abord exister et être bon) ; à rouvrir dès l'instrumentation.
- **Recommandation.** Garder zéro verdict, zéro label de bien. Tester (A/B, quand le trafic le permet) une clôture adressée au projet déclaré, hash incluant alors la posture. Désaccord assumé avec l'Editorial Writer et probablement le Product Strategist (voir plus bas).

## Critique 5 : usage ponctuel non raccordé au récurrent ni à la prescription

- **Problème.** Le moteur dit : « pourquoi revient-il ? » est le maillon faible. Le module Logement, produit à usage ponctuel par excellence, ne raccorde rien : pas de hook vers Le Fil (« ce statut PPR peut changer ; le zonage est révisé »), pas de sortie partageable (l'acheteur montre au conjoint, au notaire, au vendeur pour négocier : c'est LA boucle de prescription du module, et l'artefact persisté rend un PDF/lien de partage trivial). La synthèse cachée sert « le reload et le PDF » (spec) mais aucun PDF n'existe.
- **Impact business.** Le one-shot qui ne laisse ni retour ni prescription est exactement le « revenu vanité » que le modèle refuse. À l'inverse, un rapport d'adresse partagé au vendeur pour négocier est un vecteur d'acquisition à coût zéro dans la cible la plus chaude. Et l'export PDF est nommément **le seul manquant du segment CGP** (ADR-0008 : « export PDF seul manquant »).
- **Bloquant ou secondaire.** Secondaire aujourd'hui, structurant à 12 mois : c'est le pont B2C→B2B le moins cher du portefeuille.
- **Recommandation.** L'export/partage du rapport Logement avant tout nouveau bloc de donnée. Un artefact partageable transforme un usage ponctuel en canal.

## Ce qui est bien conçu (à dire dans un board critique)

- **La discipline d'artefact** (hash de faits, posture hors hash, cache → zéro LLM, `after()`) : unit economics saines par construction, et le patron qui rendra le B2B viable à la marge. À généraliser, ne pas y retoucher.
- **Le verbatim ONRN gaté + « toujours dire l'échelle » + assurance documentée-jamais-prédite** : c'est le socle de crédibilité réglementaire sans lequel aucun notaire ne signera en 2027. Actif B2B dormant.
- **Le statut réglementaire au point trié par régime** : vraie transformation (ADR-0002), non triviale à reconstruire en un prompt.
- **Le prompt de synthèse** (renoncer/pas répartir, ≤3 phénomènes, attaquer par le bien) : la voix est un composant du moat d'accumulation, à condition d'être nourrie par des croisements que ChatGPT n'a pas.

## Niveau de preuve (rappel d'hygiène)

Tout ce rapport repose lui-même sur des hypothèses non mesurées : « l'acheteur multi-visites est le payeur type », « la valeur perçue est dans les euros engagés », « ERRIAL cannibalise la perception » sont des **hypothèses à tester**, pas des faits. Le module n'a aujourd'hui, à ma connaissance, **aucune mesure de disposition à payer à l'entrée adresse** (pas de dashboard PostHog Logement, noté « RESTE » en mémoire). Décider l'ordre des chantiers sans cette mesure serait le pari déguisé en acquis que je sanctionne.

## Désaccords assumés avec le Product Strategist

1. **Clôture de synthèse adressée au projet** (critique 4) : il défendra la simplicité et la neutralité de posture (un seul texte, pas de bifurcation) ; je soutiens que le payeur veut une lecture qui sait ce qu'il est en train de décider, et que le surcoût est nul. À trancher par le porteur, idéalement par la mesure.
2. **Multi-adresses** (critique 2) : il y verra de la complexité produit (gestion de biens, listes) ; j'y vois la forme économique du moment acheteur et la charpente du B2B. Je concède le séquencement (après preuve de paiement), pas la décision de schéma.
3. **Face 4 financière** : il craindra la dérive « site de coûts » et défendra la lecture ; je réponds que sans les euros engagés, la page perd le test de la carte bleue face au gratuit d'État. La doctrine (documenté, jamais prédit) borne déjà le risque.
Point d'accord probable : critique 1 (le croisement climat×bâti comme héros) sert aussi sa lentille.

## Ce que je conserverais absolument / reconstruirais / les 3 décisions

**Conserver** : discipline artefact+cache ; verbatim ONRN et règles d'échelle ; statut PPR au point ; refus du score et du label de bien ; la voix de synthèse.

**Reconstruire** : la clé de persistance `(user, insee)` → `(user, adresse)` ; la Face 4 comme engagement financier documenté (pas des liens) ; la clôture de synthèse (posture-neutre → adressée au projet, sous A/B) ; l'ordre de priorité des faces (prospectif avant documentaire).

**Les 3 décisions à plus fort impact sur 12 mois** :
1. **Faire du croisement climat futur × bâti (« ce logement sous +2,7 °C ») le héros du module** : merger la Face 1, brancher DRIAS×DPE. C'est la seule brique qui passe le test « sans le logo » et qui incarne la thèse. Tout le reste de la page devient contexte de cette brique.
2. **Migrer le grain de persistance à l'adresse et préparer l'offre multi-biens** : c'est à la fois le modèle économique du moment acheteur (pendant du Pack) et l'architecture du B2B 2027 (facturation à l'adresse, précédent CityScan).
3. **Instrumenter la disposition à payer sur l'entrée adresse avant tout nouveau contenu** : événements paywall Logement, clic CTA, taux paywall→paiement, + export/partage PDF comme premier test de prescription. Sans cette mesure, les décisions 1 et 2 restent des paris non calibrés.

## Si refus ou report (à graver)

Si le board reporte le multi-adresses : le graver comme **report calibré, pas abandon** : « Le grain de persistance à l'adresse est reconnu comme la cible ; la migration est différée après la première preuve de paiement B2C sur le module, pour ne pas dépenser du temps porteur sur une structure dont le tunnel n'est pas encore prouvé. Aucun nouveau chantier ne doit épaissir la dépendance à la clé (user, insee). »

## Cohérence (tensions non tranchées, posées à l'humain)

- La clôture posture-neutre est présentée comme doctrine éditoriale ; son vrai fondement est économique (un seul appel). Si on la garde, qu'on la garde pour la bonne raison, écrite.
- « Le climat est le différenciant » (vision) vs un module dont les faces livrées sont à 80 % non climatiques-prospectives : la doctrine et le build divergent ; l'un des deux doit bouger.
- IREP/friches encore affichés dans Logement en attendant Santé : dette de frontière acceptée, mais chaque mois elle renforce la lecture « site de risques » (risque n°1).

## Mise à jour de la doctrine si décisions prises

Dans `modele-economique.md` : ajouter au moteur B2C la ligne « module Logement = produit du moment d'achat, multi-adresses par décision (pendant du Pack) ; grain de facturation cible = l'adresse (référence CityScan 6-8,50 € HT/adresse) ». Dans la hiérarchie de preuve : « disposition à payer à l'entrée adresse : non mesurée, à instrumenter au même rang que le paywall commune ». Dans `modules/logement.md` : « le croisement climat futur × bâti est le bloc-héros du module ; les faces documentaires se justifient par leur contribution à ce croisement ; risque nommé : recouvrement ERRIAL/ERP sur la partie documentaire ».

## La version minimale

La plus petite incarnation qui capture ~90 % de la valeur de ce rapport : **une semaine, deux gestes**. (1) Brancher 3 événements PostHog sur l'entrée adresse (soumission adresse, hit paywall, clic CTA payer) ; (2) merger le socle Face 1 lecture thermique existant (branche `feat/logement-face1-lecture-thermique`) pour que la page contienne au moins UNE brique non reconstructible. Ni migration de schéma, ni Face 4, ni A/B : ces chantiers attendent la mesure.

## Quand rouvrir ce sujet

- **≥ 200 sessions Logement instrumentées** : rouvrir prix/packaging (module dans le 14 € vs entrée adresse propre) et la clôture posture-adressée (A/B).
- **Première preuve de paiement B2C attribuable au module** : lancer la migration `(user, adresse)` et le multi-biens.
- **ERRIAL ou un portail (SeLoger/Bien'ici) ajoute un volet prospectif climat à l'adresse** : la critique 1 devient existentielle, re-board immédiat.
- **Signal B2B entrant (CGP/notaire demandant un export)** : prioriser le PDF avant la date planifiée.
- **Si après 90 jours le croisement DRIAS×DPE n'est toujours pas mergé** : le module doit être requalifié honnêtement de « documentaire » et son prix repensé en conséquence.

## Table d'allocation

| | |
|---|---|
| **Goulot actuel** | Disposition à payer B2C, non mesurée (pari central du modèle, précédent CityScan) |
| **Variable dominante** | La part non-reconstructible de la page (croisement climat×bâti) + la mesure du tunnel adresse |
| **Temps à investir** | ~1 semaine : instrumentation PostHog entrée adresse (1-2 j) + merge Face 1 thermique (2-3 j) |
| **Impact attendu** | Fort : première brique moat visible + première mesure du goulot sur le module |
| **Temps à NE PAS investir** | Raffinements des faces documentaires (Face 2 étendue PPRI/TRI/nappe), polish visuel (PassportTiltScene), débat de prix du module sans données |
| **Priorité suivante** | Face 4 « engagement financier documenté » + export/partage PDF (pont prescription + B2B) |
| **Sujet à rouvrir** | Multi-adresses et clôture posture-adressée : à ≥200 sessions instrumentées ou 1re preuve de paiement module |

**Si j'étais CEO** : je mergerais la lecture thermique prospective et j'instrumenterais l'entrée adresse cette semaine, je gèlerais tout nouveau bloc documentaire tant que la page ne contient pas une brique que ChatGPT + Géorisques ne reconstruisent pas, et je graverais dès maintenant la cible « grain de facturation = l'adresse » sans la construire avant la première preuve de paiement.
