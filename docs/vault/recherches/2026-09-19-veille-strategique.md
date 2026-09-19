# Veille stratégique et produit, 19 septembre 2026

**Document source, intact : `2026-09-19-veille-strategique-v6.docx`.**
Transcription texte (extraction automatique, pour la lecture par grep et par les agents) :
`2026-09-19-veille-strategique-v6.transcription.txt`. En cas d'écart, le `.docx` fait foi.

Produit par le porteur avec Claude et ChatGPT, à partir d'un travail de veille sur les
réutilisations publiées sur data.gouv.fr et les sources publiques. Six versions, 62 000
caractères, environ 25 chantiers cotés P0 à P3.

Cette page ne résume pas le document, elle dit ce qu'on en retient et pourquoi. Le contenu
complet vit dans le `.docx`.

## Ce que ce document apporte, et qui est nouveau

**Le constat de commoditisation.** Huit acteurs identifiés et sourcés couvrent désormais, chacun
à leur façon, l'adresse ou la commune à partir des mêmes données publiques : Tuveuxvivreou
(projection climatique des 34 740 communes, sur le terrain de `/ou-vivre`), EcoBuilding (fiche
bâtiment multi-sources avec API publique), Choisir sa ville, Indice Fissure IDF, Parcelle Info,
Aucadastre, Avertine (rapport avant achat à un prix inférieur au Dossier Adresse), ImmoClimat,
TOISE. Plusieurs documentent déjà source, date et maille.

Conséquence retenue : **la traçabilité seule n'est plus une différenciation**, et « nous agrégeons
beaucoup de données publiques » ne l'est plus non plus. Le document le dit lui-même en section 7.

**La thèse de la section 7.1**, qui est la seule idée stratégique neuve : la commoditisation
déplace le risque du technique vers le marché. Une lecture différenciante invisible avant le
paiement améliore le produit sans prouver sa valeur au moment de convertir.

Deux points méthodologiques utiles : Tuveuxvivreou s'appuie sur un modèle unique (ALADIN, RCP 4.5)
là où futur•e tient une logique multi-modèles TRACC, différence qui ne vaut que si elle est
expliquée simplement ; et le baromètre OneDPE (11,2 M de diagnostics, 40,2 % en confort d'été
insuffisant) établit que le champ confort d'été décrit le bâtiment et jamais le climat local.

## Ce qui a été vérifié dans le code le 19/09/2026

**Recherche d'adresse : alerte confirmée, et c'est la seule urgence.** Le produit utilise les deux
géocodeurs en parallèle. Le nouveau (`data.geopf.fr`) sert déjà pour les lieux nommés, les
itinéraires, les isochrones et l'altitude. L'ancien (`api-adresse.data.gouv.fr`, signalé déprécié)
sert pour la recherche d'adresse, `src/lib/ban.ts` inclus, donc dans le parcours d'achat. La
migration est à moitié faite et c'est la moitié critique qui est restée en arrière.

**Argiles (RGA) : alerte atténuée.** Le produit interroge directement `/api/v2/rga` de Géorisques,
sans couche recopiée en cache : la version servie est donc la version courante. Ce qui manque est
la seconde partie de la recommandation, l'affichage de la version, de la date et du producteur
dans la preuve.

**Diagnostic 2027 (coefficient électricité 1,9 → 1,7) :** juste sur le fond, échéance au
1er janvier 2027, aucune urgence.

## Ce qui est retenu

1. Migrer la recherche d'adresse vers le géocodeur Géoplateforme. Menace le tunnel de vente.
2. Rendre visible avant le paiement ce que le moteur ajoute à la donnée brute. Le socle existe
   déjà : l'écran de qualification annonce ce que l'adresse permettra de lire, en disant le manque
   avant ce qui reste (`src/lib/dossier-couverture-attendue.ts`). Le chantier est de montrer la
   façon de raisonner, pas la liste des bases mobilisées.
3. Afficher version et date des couches réglementaires dans les preuves.

## Ce qui est écarté, et pourquoi

**La liste des 25 chantiers ne devient pas une feuille de route.** Dix priorités pour un porteur
seul revient à aucune priorité. Et la liste contredit le diagnostic du document : celui-ci conclut
que l'agrégation ne différencie plus, puis propose une douzaine de sources à ajouter (PFAS, LCZ,
DRIAS-Eau, SISPEA, BatEnR, LiDAR, EGMS, Copernicus, éclairage nocturne, cours d'eau, copropriété,
GPU).

**Le document ne parle jamais du lecteur.** Or les défauts mesurés les 16 et 18/09 sont tous entre
la donnée et la personne : priorités inventées par le parse (2 essais sur 5), affirmation « le
vendeur détient le diagnostic de ce logement » dans 3 synthèses payées sur 6, un seul dossier payé
sur 14 avec un diagnostic attribué, 6 sur 14 sans aucune personnalisation. Aucune source nouvelle
ne corrige cela.

**Ce que les gens demandent ne recoupe pas les sources proposées.** Les 5 projets réellement
enregistrés nomment inondation, calme, feu, chaleur, accès aux soins, dépendance à la voiture.
Aucun ne nomme un PFAS, une zone climatique locale ou l'état d'un cours d'eau. n=5 et ce sont des
proches, donc aucune représentativité, mais c'est le seul signal disponible.

**La composition chaleur (confort d'été × nuits tropicales TRACC × morphologie urbaine LCZ) est
différée.** L'idée est la meilleure du document et elle est cohérente avec la doctrine
« modules-calques ». Mais la couche LCZ ne couvre que 93 territoires de plus de 50 000 habitants,
quand la promesse porte sur ~35 000 communes : elle serait muette presque partout et ne peut donc
pas porter la démonstration principale du moat.

## Tension à surveiller

Le document recommande de « produire des faits dérivés propres à futur•e », sous condition de
méthode déterministe, versionnée et auditable. La condition est la bonne et le produit sait déjà
le faire (exposition industrielle, mobilité quotidienne). La pente vers l'indice composite reste
ouverte, et ADR-0001 l'interdit.

Lié à : `vision/modele-economique.md`, `adr/ADR-0001`, `paris.md`.
