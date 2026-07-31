# Arbitrage : on refuse de vendre un dossier quand le bien n'est pas identifié, jamais quand la matière manque

- **Date** : tranché porteur 2026-07-30, pendant la conception de la qualification pré-paiement.
- **Source** : `docs/rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md` §2
  (qualification plutôt que remboursement), spec
  `docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md`.
- **Code** : `src/lib/dossier-qualification.ts` (lib pure, 11 tests),
  `src/app/api/dossier/qualification/route.ts`, livrés le 30/07/2026.

## Ce qui est gravé

> **Le refus de vente porte sur l'identification du bien, jamais sur la matière disponible. La
> qualification demande de préciser quand le bien n'est pas identifié, avertit quand la matière
> manque, nomme toute source qu'elle n'a pas pu interroger, et ne refuse que lorsqu'aucun ancrage
> fiable ne peut être établi.**

Quatre issues, et elles ne se confondent jamais : vendable, à préciser, non couvert pour l'instant,
et l'indisponibilité technique, qui n'est pas un état du domaine mais un code HTTP.

## Pourquoi le refus porte là et pas ailleurs

**Un ancrage manquant produit un dossier faux, pas un dossier pauvre.** Sous une feature BAN
`street` ou `locality`, le point désigne le centre d'une voie ou d'un lieu-dit : les distances
d'Autour se calculent depuis le mauvais endroit, Géorisques au point porte sur un autre
emplacement, et la parcelle trouvée sous ce point peut appartenir à un tiers. On ne vendrait pas un
dossier incomplet, on vendrait **un dossier précis sur le mauvais objet**. C'est la seule
défaillance que le lecteur ne peut ni voir ni corriger.

**L'absence de diagnostic est le cas MAJORITAIRE, mesuré par strate le 31/07/2026**
(`docs/audits/2026-07-31-couverture-dpe-stratifiee.md`, 160 adresses tirées au hasard). Sur le
chemin que le produit emprunte vraiment, l'identifiant BAN exact, **73 % des adresses urbaines
denses n'ont aucun diagnostic, 85 % en péri-urbain, 86 % en petite ville, 92 % en rural**.

> Le chiffre de « 35 à 53 % » qui figurait ici, tiré de l'audit du 03/07/2026, mesurait une
> recherche INCLUANT le repli géographique à 50 m. Le produit ne fait pas ce repli, et il a raison :
> vérification faite sur 65 adresses, le diagnostic trouvé à moins de 50 m appartient à une adresse
> VOISINE dans 57 cas et à la même sous un autre identifiant dans **zéro** cas. La jointure est
> juste ; le repli n'améliorerait pas la couverture, il attribuerait le diagnostic du voisin.

Refuser là-dessus reviendrait donc à fermer la porte non pas à une adresse sur deux, mais à trois
sur quatre. Le module Logement est déjà conçu autour de cette dégradation, en trois états également
nobles.

**L'absence de parcelle ne retire presque rien.** Sans elle, le rapport garde Géorisques au point,
les cavités et mouvements de terrain, le GPU patrimonial, Cartofriches, les indicateurs IRIS
calculés avec le point, l'altitude et la ZFE.

## Ce que ce refus fait gagner, et ce qu'il ne couvre pas

Il incarne l'invariant n°1 plus littéralement qu'aucune page de marque : un écran qui dit « sur cette
adresse, nous n'avons pas de quoi vous être utile, ne payez pas » parle en faisant. Le rapport
business le préfère au remboursement sur seuil, qui inscrirait notre propre doute sur la page de
vente, transformerait chaque déception en échange avec le porteur, et retirerait un prescripteur à
chaque incident, là où un refus en crée un.

**Il ne couvre pas la déception.** « Parcelle identifiée, sismicité faible, aucun risque
réglementaire, pharmacie à 1,8 km » reste un résultat honnête et décevant à 39 €. Aucun seuil ne
protège de ça ; seul le contenu du dossier le fait.

## Trois faits découverts en construisant, qui ont déplacé la règle

**Le rural est adressé.** Mesuré le 30/07/2026 sur six hameaux (Aubrac, Doubs, Queyras, Lozère,
Var) : le premier numéro est entre 3 et 59 m, par numérotation métrique des routes, et les six
rendent des features `street`. Le refus rural est donc rare, et il se règle le plus souvent par un
clic sur un numéro proposé.

**L'identifiant BAN porte la voie.** Un numéro s'écrit `citycode_idvoie_numero`, donc la
compatibilité de voie est un test de préfixe exact, sans heuristique sur les libellés. Aucun seuil
de distance n'est inventé sur une voie : « 451 le Cros » est légitime à 58 m, et tout `MAX_DISTANCE`
de 50 m l'aurait écarté. Pour un lieu-dit, qui n'a pas de voie pour le protéger, un périmètre de
proposition nommé (`LOCALITY_RADIUS_M = 150`) tient ce rôle, sur le patron de
`CARTOFRICHES_RAYON_RECHERCHE_M` : un périmètre de recherche, jamais un seuil de qualité.

**Une commune saisie seule n'est pas un refus.** Constaté à l'exécution sur « Kerlaz Locronan » :
répondre « nous ne pouvons pas identifier ce bien » à quelqu'un qui n'a pas encore donné d'adresse
lui fait croire que sa commune n'est pas couverte, ce qui est faux. Elle demande de préciser.

## Le corollaire, qui est la raison d'être de l'écran

**Une source en panne ne se présente jamais comme une absence de donnée.** Les libs existantes
rendaient `[]` ou `null` dans les deux cas, ce qui aurait fait dire « aucun diagnostic à cette
adresse » pendant un incident ADEME. Trois sondes dédiées distinguent désormais `found`, `none` et
`unavailable`, et la copie ne dit « le diagnostic exact de ce logement n'a pas été retrouvé » que
lorsque la source a répondu.

## Quand rouvrir

Le geste de placement manuel d'un bien non adressé (carte, confirmation de parcelle) redevient
prioritaire **si le refus dépasse 20 % globalement, ou s'il exclut durablement une part majeure d'un
segment stratégique même quand le taux global reste bas**. Un taux global de 12 % peut cacher 2 % en
ville et 45 % en rural, et la masse urbaine rendrait alors l'échec rural statistiquement invisible.
