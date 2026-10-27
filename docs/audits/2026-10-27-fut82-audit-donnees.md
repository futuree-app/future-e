# FUT-82 · Audit des données manquantes et feuille de route d'enrichissement

> Audit du 27/10/2026, branche documentaire `docs/fut-82-audit-donnees` (depuis `main` 06e043d0).
> **Aucune modification du produit.** Lecture en cinq minutes ci-dessous ; le détail et les preuves sont
> dans `docs/audits/2026-10-27-fut82/`.

## En une phrase

Sur une trentaine de sources examinées et mesurées, **deux** améliorent vraiment une décision
résidentielle à faible risque et à faible coût, et aucune des deux n'était dans l'ordre pressenti en
tête de liste : **les zones de bruit aérien (PEB) et l'obligation de débroussailler (OLD)** à l'adresse.
L'IREP détaillé, première candidate pressentie, déçoit.

## Ce que futur•e possède réellement

Le socle est solide là où on l'attendait : climat projeté et observé, inondation lue à l'adresse
(FUT-127, FUT-129), argiles, cavités, radon (désormais intégré), servitudes patrimoniales, DPE et
bâtiment (FUT-80, FUT-143), services, mobilité, industrie à risque au grain commune.

Trois constats moins visibles :

1. **Le seul bruit lu à l'adresse ignore l'aérien.** À Villeneuve-le-Roi (zone B du plan de bruit
   d'Orly) et Goussainville (zone C de Roissy), la mesure de calme de futur•e désigne le **rail** comme
   source dominante.
2. **Le dossier parle du débroussaillement sans savoir si l'adresse y est soumise.**
3. **Deux défauts existants**, hors du dossier payant mais visibles : la page publique « pollutions
   invisibles » affirme qu'il n'existe « aucune installation classée » dans les 10 km de Metz, où le
   registre officiel 2024 compte 25 établissements déclarant des rejets (source IREP de 2019,
   incomplète) ; AskFuture reçoit un nombre « d'incendies
   récents » dont personne ne connaît la source ni la période.

## Les sources les plus intéressantes

| | Pourquoi | Mesure |
|---|---|---|
| **Plan d'exposition au bruit (PEB) et plan de gêne sonore (PGS)** | Zonage officiel au point, avec effet légal : le vendeur doit fournir un document, l'extension d'un logement est limitée en zones A à C, une aide à l'insonorisation existe en zone PGS | 3 % des logements tirés, réponse en 0,1 s, 100 % de disponibilité |
| **Obligation légale de débroussaillement (OLD)** | Charge concrète pour une maison, information obligatoire du vendeur dès l'annonce depuis 2025, se combine avec le danger d'incendie que futur•e lit déjà | 10 % des logements tirés (très concentré au sud), 0,04 s |
| **Réseaux de chaleur** | Option de rénovation et obligation de raccordement dans certains périmètres | 21 % des logements « à portée », 11 % en périmètre d'obligation |
| **Remontées de nappe** (sous condition) | Décisif pour une cave ou un sous-sol, inutile sinon | 60 % des logements classés « sujets » : ne trie pas seule |

## Les sources décevantes

- **IREP détaillé par polluant** : le détail existe (registre 2024 : 13 507 établissements, contre
  1 495 dans l'extrait que lit futur•e), mais 89 % des valeurs sont « sous le seuil » et les rejets les
  plus déclarés sont du CO₂ et de l'ammoniac d'élevage. Ce qu'une usine déclare émettre ne dit pas ce
  qu'un riverain respire. **Ne pas réactiver.**
- **BDIFF (feux observés)** : vraie mémoire du lieu, mais seulement par commune, et la licence se
  contredit (ouverte sur data.gouv, usage commercial exclu dans les mentions jointes à chaque export).
- **Espaces protégés** : aucun des 200 logements tirés n'est dans un site Natura 2000 ; leur valeur
  tient au voisinage (cadre de vie) et aux terrains à bâtir.
- **Lignes électriques, antennes** : rares à proximité, et l'interprétation sanitaire ne permet pas de
  conclure : elles inquiéteraient sans aider.
- **Sécurité (SSMSI), indice social des collèges (IPS), taxe foncière** : écartés, la mesure confirme
  les décisions éditoriales de juillet (48 % des données communales de délinquance sont même non
  diffusées).

## Les deux meilleures candidates pour une première intégration

1. **A1. Zone de bruit aérien (PEB et PGS) à l'adresse.**
2. **A2. Obligation légale de débroussaillement à l'adresse.**

Même forme pour les deux : un zonage officiel lu au point et à la parcelle, qui produit un fait daté,
ses limites, et une chose à vérifier ou à demander. Effort estimé : 3 à 4 jours pour les deux, tests
compris. Elles servent trois des quatre moats : l'incertitude actionnable (la pièce à demander), le
Projet (agrandir, vivre en maison), la composition (le feu déjà lu ; plus tard bruit et ventilation).

Exemple de restitution (Villeneuve-le-Roi) :
- **À retenir** : zone B du plan d'exposition au bruit d'Orly (arrêté du 21 décembre 2012).
- **Pour votre projet** : agrandir pour loger plus de monde y est en principe exclu ; isoler ou rénover
  reste possible.
- **À vérifier** : le document sur la zone de bruit que le vendeur doit remettre, l'isolation des
  fenêtres, une visite aux heures de passage ; une aide à l'insonorisation peut exister (zone 2 du PGS).
- **Comprendre la donnée** : plan réglementaire fondé sur des prévisions de trafic ; il ne mesure pas le
  bruit dans le logement.

## Ce qui doit attendre

- **Après le lancement (vague B)** : la mémoire des feux par commune (si le producteur autorise l'usage),
  les nappes pour les biens avec sous-sol, les espaces protégés au voisinage, les réseaux de chaleur.
- **Pour des profils particuliers (vague C)** : le solaire (production estimée, potentiel du toit après
  le rattachement au bâtiment RNB) et la fibre pour le télétravail.
- **Le reste** : en veille ou écarté, avec ses raisons (`docs/audits/2026-10-27-fut82/07-feuille-de-route.md`).

## Ce que je recommande ensuite

1. Décider de la vague A (les deux, une seule, ou aucune).
2. Attendre la fusion de FUT-81 (urbanisme de la parcelle), dont la section et le calcul de parcelle
   seraient réutilisés, puis ouvrir les deux tickets.
3. Corriger rapidement, et indépendamment, la phrase fausse de la page « pollutions invisibles ».
4. Écrire au producteur de BDIFF pour lever la contradiction de licence, et à la DGAC pour confirmer
   celle des plans de bruit.

Les dix décisions détaillées sont dans le journal d'arbitrage.

## Niveau de confiance

- **Élevé** sur ce que les sources rendent, leurs pièges et leurs latences (mesures rejouables).
- **Moyen** sur les parts de logements concernés (200 logements diagnostiqués, qui sur-représentent
  les biens vendus ou loués récemment ; intervalles dans le journal).
- **À compléter** sur trois points juridiques (décret OLD, art. L112-10 lu en source secondaire, licence
  DGAC), signalés comme tels.

## Le dossier complet

| Livrable demandé | Fichier |
|---|---|
| A. Synthèse exécutive | ce fichier |
| Inventaire de couverture (ce que futur•e possède) | `2026-10-27-fut82/01-inventaire-couverture.md` |
| B. Matrice exhaustive (32 candidates, 23 colonnes) | `2026-10-27-fut82/02-matrice-candidates.md` et `matrice-candidates.csv` |
| C. Dossiers techniques par famille | `2026-10-27-fut82/03-dossiers-techniques.md` |
| Contre-épreuves et risques d'interprétation | `2026-10-27-fut82/04-contre-epreuves.md` |
| Valeur de décision (8 scénarios) | `2026-10-27-fut82/05-scenarios-decision.md` |
| F. Architecture de la vague A et fiches pour Le Relevé | `2026-10-27-fut82/06-architecture-vague-a.md` |
| Vagues et E. backlog proposé | `2026-10-27-fut82/07-feuille-de-route.md` |
| G. Journal d'arbitrage | `2026-10-27-fut82/08-journal-arbitrage.md` |
| D. Preuves reproductibles | `2026-10-27-fut82/mesures/` et `scripts/research/fut82/` |
