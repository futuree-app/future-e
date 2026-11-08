# FUT-144 : rendre le plan d'urbanisme compréhensible (08/11/2026)

Ticket : https://linear.app/future-e/issue/FUT-144
Base : `origin/main` b818ba5c. Composant : `src/components/report/logement/UrbanismeBlock.tsx`.

## Ce qui change

Le bloc se lit désormais en trois niveaux.

1. **Ce qu'il faut retenir.** Une phrase : le type de zone en mots courants (« zone urbaine », « 2 zones urbaines superposées ») et le document. Quand le plan décrit ses zones en peu de mots (« Zone urbaine d'habitat pavillonnaire », « Secteur d'activités »), cette description suit, entre guillemets.
2. **À vérifier.** Une ligne par nature de prescription : une étiquette courte (« Réservé pour une voie publique »), l'étendue (« sur environ 1 % de la parcelle (≈ 71 m²) »), puis une phrase qui dit ce que ça change et à qui le demander. Viennent ensuite les autres règles citées par famille, les liserés de bordure, la limite du zonage et le lien vers le règlement de la zone.
3. **Détails et sources** (dépliable, anciennement « Comprendre cette lecture »). Codes de zone et parts, intitulés nationaux, codes nationaux, intitulés du producteur, notes complètes, titre complet du document et dates, puis la méthode inchangée.

Les réserves de rattachement (parcelle peut-être voisine) et de vigueur (document non vérifié) restent au premier niveau, avant ce qu'elles conditionnent. Elles sont plus courtes.

Aucun calcul, aucune donnée, aucune règle de qualification n'a changé : `urbanisme-parcelle.ts` et `urbanisme-nomenclature.ts` ne sont pas modifiés. Les mots courants vivent dans `urbanisme-libelles.ts` (présentation seulement). Chaque phrase y résume la note nationale de sa catégorie sans rien y ajouter.

## Mesure : mots lus sans rien déplier

Même fonction `visible()` que les tests, sur les relevés réels :

| Cas | Avant | Après | Écart |
|---|---|---|---|
| Besançon (PSMV, repli à 0,7 m) | 456 | 299 | −34 % |
| Sucy-en-Brie (3 zones, liseré) | 385 | 228 | −41 % |
| Mérignac (2 zones, emplacement réservé) | 286 | 183 | −36 % |
| Lyon (Croix-Rousse) | 268 | 170 | −37 % |
| Six-Fours (emplacement réservé) | 244 | 176 | −28 % |
| La Rochelle (PSMV dans le PLUi, repli) | 211 | 174 | −18 % |
| Vauquois (carte communale, repli) | 140 | 115 | −18 % |
| Moissy-Cramayel (zone unique) | 130 | 99 | −24 % |

Hauteur du bloc à 390 px, Besançon : 3 812 px avant, 2 358 px après.

## Formulations avant / après

| Avant | Après |
|---|---|
| Cette parcelle est en zone UE du plan local d'urbanisme (PLU). Correspondant aux secteurs… · zone urbaine dans la nomenclature nationale | Cette parcelle est en zone urbaine du plan local d'urbanisme (PLU). Le plan la décrit ainsi : « Correspondant aux secteurs… ». |
| Cette parcelle est partagée entre 2 zones du PLUi : US7 (environ 62 %), US9 (environ 38 %). | Cette parcelle est partagée entre 2 zones urbaines du PLUi. (Les parts US7 62 % / US9 38 % passent au détail.) |
| Emplacement réservé à une voie publique · sur environ 1 % de la parcelle (≈ 71 m²) / « Emplacement réservé - Voirie tertiaire » / Le plan réserve cette partie du terrain à une voie publique (création ou élargissement). Demandez en mairie le projet et son bénéficiaire : elle ne peut pas accueillir une construction contraire à cette destination. | Réservé pour une voie publique · sur environ 1 % de la parcelle (≈ 71 m²) / Cette partie ne peut pas accueillir une construction contraire à cette destination. Demandez en mairie le projet et qui le porte. |
| Immeuble bâti non protégé, soumis à des dispositions particulières · … / « Immeuble non protégé pouvant être conservé… » / Le plan de sauvegarde identifie cet élément sans le protéger… | Immeuble non protégé, à règles particulières · … / Non protégé, mais des règles particulières du plan de sauvegarde peuvent s'y appliquer : à lire avant tout projet. |
| Le point de l'adresse ne tombe dans aucune parcelle. La plus proche (…), à moins d'un mètre, a été retenue : elle peut être celle d'un voisin. Les règles ci-dessous ne valent pour ce logement que si c'est bien sa parcelle ; vérifiez la référence cadastrale sur l'acte ou le compromis. | L'adresse ne tombe dans aucune parcelle : la lecture porte sur la plus proche (…), à moins d'un mètre, qui peut être celle d'un voisin. Tout ce qui suit en dépend. Vérifiez la référence cadastrale sur l'acte ou le compromis. |
| Ce zonage ne dit pas, à lui seul, ce qui est autorisé. Avant d'acheter en vue d'une extension, d'une annexe, d'une surélévation ou d'un changement d'usage, lisez dans le règlement le chapitre de la zone UE et ses dispositions générales, puis faites confirmer le projet par le service urbanisme de la mairie. Un certificat d'urbanisme opérationnel peut aussi être demandé. | Ce zonage ne dit pas, à lui seul, ce qui est autorisé. Avant d'agrandir, d'ajouter une annexe, de surélever ou de changer l'usage, lisez le règlement de la zone et faites confirmer le projet par le service urbanisme de la mairie. (Dispositions générales et certificat d'urbanisme opérationnel : au détail.) |
| La parcelle retenue est dans un secteur ouvert à la construction de la carte communale (secteur « C »). | La parcelle retenue est dans un secteur de la carte communale où des constructions peuvent être admises. |
| Sucy : deux lignes « Élément de paysage préservé pour un motif écologique », chacune avec sa note | Une ligne « Élément naturel préservé pour l'écologie · sur environ 109 m² de la parcelle ; traverse la parcelle sur environ 14 m », une seule fois l'effet. |

## Ce qui est garanti (tests)

`src/lib/fut81-urbanisme-parcelle.test.ts` : 44 tests (40 adaptés, 4 nouveaux), tous sur le texte rendu.

- Les 40 tests existants vérifient la même chose qu'avant ; chaque assertion déplacée vérifie désormais le premier niveau ET le détail (codes, parts, intitulés du producteur, notes complètes).
- Toute catégorie de `CATEGORIES` a ses mots courants, sans conclusion abusive ; les sous-codes non protégés du PSMV ne sont jamais dits protégés, les protégés le sont toujours.
- Sur les 10 relevés réels et les 4 cas du banc : aucun jargon de nomenclature au premier niveau ; chaque zone et chaque prescription restent présentes (étiquette au premier niveau, code et note complète au détail) ; une prescription incertaine reste dite incertaine au premier niveau.
- Les réserves de rattachement et de vigueur précèdent toute conclusion qui en dépend.
- Au moins 20 % de mots en moins sur cinq cas réels ; les liens vers les documents et les règlements restent dans le HTML.

## Recette visuelle

Banc `/dev/fut81` en dev local (Turbopack), Chrome sans tête, bureau 1 280 px, 390 px et 360 px, 14 cas. Planches avant/après dans `2026-11-08-fut144-urbanisme/planches/`. Aucun débordement horizontal à 360 px.

Deux artefacts du banc ont été masqués à la capture (scripts joints) : la synthèse IA du module, qui échoue en dev et affiche une page HTML brute non coupée (elle élargit toute la colonne à 390 px, cas « panne » compris, sans lien avec ce bloc), et le bandeau de consentement fixe.

## Limites restantes

- **Les codes de zone restent au premier niveau dans le lien vers le règlement** (« Lire le règlement des zones UILO1O1O1O1O, UIO1O1O1O1OO, UIO2O1O1O2OO »). Ils servent à trouver le chapitre dans le PDF ; à Sucy, ils restent illisibles.
- **Les descriptions du producteur sont citées telles quelles**, parfois sans accents (« Secteur d'activites »). Au-delà de 160 caractères (Lyon), elles passent au détail.
- **Le cas « sans preuve »** (parcelle non mesurable, réponse demandée sur la parcelle) reste long : 4 prescriptions incertaines, chacune nommée. C'est voulu : aucune n'est supprimée.
- **Le test `sansAbus` ne voit pas « est autorisé. »** en fin de phrase : `\b` après « é » ne joue pas en JavaScript sans drapeau `u`. Aucun texte actuel n'en abuse, mais le garde-fou est plus faible qu'il n'y paraît. Hors périmètre ; à corriger avec une exception pour « ce qui est autorisé ».
- Les 5 échecs de `npm test` dans ce worktree sont préexistants (FUT-27, FUT-7) : les tests lisent le dossier par une URL où le « · » de `Futur·e` est encodé. Même résultat sur `main`.
