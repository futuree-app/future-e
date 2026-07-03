# Vision étendue du module Logement (source : ChatGPT, transmise par le porteur)

> **Statut : PARQUÉ. À challenger après la livraison de la Face 3.** Le porteur trouve cette vision
> forte à plusieurs égards et demande à Claude de la confronter à sa connaissance du projet — mais
> **une fois la Face 3 terminée**, pas avant. Ce document préserve la vision verbatim + les points de
> tension que Claude veut soulever, pour que la reprise soit productive et ne reparte pas de zéro.

## Thèse centrale de la vision

Question centrale du module : **« Que change précisément ce logement et cette adresse dans la
manière dont vous vivrez ce territoire ? »** Territoire raconte la trajectoire de la commune ;
Logement montre pourquoi deux personnes de la même commune ne vivent pas la même réalité. Le moteur :
**relier bâtiment × parcelle × environnement immédiat × situation du lecteur** — « relier ce que
personne ne relie normalement ».

## Structure proposée (6 sorties)

1. **Ce que cette adresse change** — synthèse courte (protège / fragilise / à vérifier), sur le
   principe de la synthèse Territoire.
2. **Le logement comme enveloppe** (Face 1) — bâti, confort d'été, humidité ; données saisies par
   l'utilisateur (étage, dernier étage, orientation, traversant, volets, ventilation, clim, inconfort
   observé, humidité, fissures…) + données publiques (DPE, période, énergie, surface, emprise,
   parcelle). Interpréter prudemment ce que la donnée dit ET ne dit pas.
3. **Les expositions à l'adresse** (Face 2) — risques réellement localisés ; distinguer 3 niveaux de
   preuve : la commune a connu / la parcelle est en zone cartographiée / le logement a déjà été
   touché. « Waouh » = contraste commune/adresse.
4. **Autour de cette adresse** (Face 3) — la face en cours ; s'intègre parfaitement (BPE, bruit, verts,
   distances brutes, aucune note).
5. **À vérifier avant de décider** — checklist personnalisée (à la visite / auprès du vendeur-syndic).
   Levier de valeur payante : transformer une donnée abstraite en chose précise à regarder ou demander.
6. **Ce que les données ne permettent pas de conclure** — transparence (savoir vs ne pas savoir).

## Postures

- **Résidence** : la personne connaît le logement → mobilise ses observations, canicules vécues,
  travaux, ressenti. Question : « Comment ce logement tient-il aujourd'hui, comment évoluera-t-il ? »
- **Découverte avec bien précis** : données publiques + annonce + saisie + checklist. Question :
  « Que peut-on déjà savoir, que faut-il vérifier avant de choisir ? »
- **Découverte sans adresse** : ne rien simuler, état vide honnête.

## Hiérarchie de confiance des données (vision)

- **Niveau 1 (solide)** : adresse/coords/parcelle, type+âge saisis, DPE, Géorisques à l'adresse, BPE
  autour, OSM prudent, observations utilisateur.
- **Niveau 2 (garde-fous)** : forme/hauteur du bâti, étage, orientation, toiture exposée, densité
  bâtie, ombrage, CBS bruit, ruissellement local, OCS GE fine.
- **Niveau 3 (séduisant mais dangereux)** : score de confort d'été, température intérieure estimée,
  note de calme/verdure, prédiction de perte de valeur, estimation assurantielle individuelle,
  verdict « bon investissement ». → prudence extrême.

## Ce que le module ne doit jamais devenir

Diagnostic réglementaire, DPE alternatif, expertise immo, promesse d'assurabilité, évaluation
médicale, note de quartier, doublon de Territoire, liste interminable de risques.

---

## Points de challenge (Claude, à DÉVELOPPER après la Face 3)

Notés à chaud pour ne pas les perdre. Chacun s'appuie sur l'état réel du projet.

1. **La Face 1 « enveloppe » suppose un questionnaire de saisie qui n'existe pas — et que la doctrine
   demande de MESURER avant de construire.** `project_module_logement` : « Dédoublement acheteur /
   résident : à instrumenter et mesurer AVANT de construire. » La vision embarque étage/orientation/
   traversant/volets/ventilation… : un intake riche, non trivial, à ne pas bâtir avant d'avoir mesuré
   la conversion acheteur/résident (l'instrumentation `logement_analyzed`/`logement_projet_declare`
   existe justement pour ça).

2. **~~Le « waouh » contraste parcelle/commune est data-bloqué pour l'inondation~~ — CORRIGÉ
   (2026-07-03, porteur).** Mon point initial était **trop pessimiste** : il confondait l'EAIP (piste
   effectivement close, `risque_enrichment_eaip`) avec « toute donnée inondation à l'adresse ». Faux.
   L'inondation **est localisable à l'adresse dans de nombreux cas**, via des couches Géorisques
   distinctes :
   - **PPRI/PPRN (zone réglementaire au point/parcelle)** — **DÉJÀ récupéré par le projet** :
     `src/lib/georisques.ts` interroge `/api/v2/gaspar/pprn` et reçoit `libelleAlea`,
     `libelleSousAlea` et `zonageReglementaire.{zoneRegExists, codeZone}`, + détecte
     `marineSubmersion`. On **aplatit** aujourd'hui ces champs en chips « risques référencés » ; le
     contraste « la commune est concernée / cette adresse est en zone réglementaire B » est
     atteignable **sans nouvelle API**, juste en exploitant le zonage déjà renvoyé.
   - **TRI (scénario de probabilité au point)** et **remontée de nappe (couche nationale, cave)** —
     couches Géorisques **à ajouter** (non fetchées aujourd'hui), grain point, couverture
     hétérogène (TRI = territoires sélectionnés ; nappe = métropole + Corse).
   - Discipline maintenue : PPRI = information **réglementaire**, pas une probabilité de sinistre ;
     et surtout **absence d'intersection ≠ absence de risque** → afficher « non déterminé »/« n'intersecte
     pas le zonage disponible », **jamais** « cette adresse n'est pas exposée ».
   - **Structure de preuve cible (4 lignes distinctes, grains séparés)** pour la Face 2 : Historique
     CatNat (commune) · PPRI/PPRN (point/parcelle) · TRI (point, si couvert) · Remontée de nappe
     (point). Produit exactement le contraste « la commune a connu / le point est cartographié / le
     logement a réellement été touché » sans confondre les niveaux.
   - Nuance point vs parcelle : l'API consolidée répond au **point géocodé** (lon/lat) ; une V2 plus
     robuste intersecterait la **géométrie de la parcelle** cadastrale avec les polygones PPR/TRI (une
     grande parcelle peut être partiellement en zone alors que le point est juste dehors).
   → **La Face 2 peut créer un vrai effet waouh sur l'inondation dès maintenant** (exploiter le zonage
   PPRN déjà renvoyé), TRI/nappe en enrichissement. À traiter dans le chantier Face 2 étendue, après
   la Face 3.

3. **Face 1 rejoue le piège « supposition affichée comme mesure » déjà corrigé.** Les briques
   « assurance » et « valeur » ont été RETIRÉES le 2026-07-02 précisément parce que « déduites de
   labels, elles affichaient une supposition comme une mesure ». Inférer un confort d'été depuis
   étage+orientation, sans donnée mesurée, marche sur la même ligne. La vision le sait à moitié (son
   Niveau 3 range bien « score de confort d'été » en dangereux), mais Face 1 s'appuie beaucoup sur cet
   interprétatif : garder la discipline « ce que la donnée NE dit pas ».

4. **La vision réimporte la frontière Santé dans Logement.** Sa Face 2 liste « sites industriels ou
   anciens sites pollués » ; or la doctrine exclut explicitement pollution/industrie/friches/radon/air
   → **Santé** (« Logement garde ce qui menace le bâti, Santé ce qui expose le corps »). À retrancher
   ou à traiter comme renvoi, pas comme contenu Logement.

5. **Six sorties = risque d'« inventaire d'indicateurs » que la doctrine proscrit** — sauf si la
   synthèse « Ce que cette adresse change » porte réellement, et si « À vérifier avant de décider »
   reste une conclusion actionnable (pas une 7ᵉ face). Le meilleur de la vision (relier les niveaux,
   traduire en décision, honnêteté savoir/ne-pas-savoir) est fort ; le risque est le volume.

**Accord de fond** : la thèse « le territoire donne le contexte, l'adresse et le bâti déterminent
comment ce contexte entre dans la vie quotidienne » est juste et défendable, et « À vérifier avant de
décider » est probablement le vrai levier de valeur payante. Le désaccord porte sur le SÉQUENÇAGE
(mesurer avant d'instrumenter la saisie) et sur 2-3 promesses data que le projet a déjà closes.
