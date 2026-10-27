# FUT-153 : les aides de la matrice du comparateur, au toucher, à la souris et au clavier

Recette du 27/10/2026, branche `bonjourfuturee/fut-153-aides-comparateur-mobile-clavier`, partie de `main` f1737f86 (PR #95 et #97 fusionnées).

## 1. Le défaut, reproduit avant correction

Chrome piloté (`playwright-core`, canal `chrome`), contexte tactile `hasTouch` + `isMobile` à 390 px, appui réel par `touchscreen.tap` (événements tactiles CDP, le navigateur produit lui-même les événements de compatibilité). Script : `scripts/fut153/reproduire.mjs`. Journal sur l'aide « Étés frais », composant d'origine :

```
38ms pointerover(touch)   → bulle absente
39ms pointerenter(touch)  → bulle absente
40ms pointerdown(touch)   → bulle absente
42ms touchstart           → bulle absente
43ms pointerup(touch)     → bulle absente
44ms touchend             → bulle absente
45ms mouseover            → bulle absente
45ms mouseenter           → bulle absente   (compatibilité : onMouseEnter → setOpen(true))
46ms mousemove            → bulle absente
47ms mousedown            → bulle absente
   mutation               → bulle VISIBLE
56ms focus                → bulle visible   (onFocus → setOpen(true), sans effet)
58ms mouseup              → bulle visible
71ms click(touch)         → bulle visible   (onClick → setOpen(v => !v) : inverse)
   mutation               → bulle ABSENTE
bulle visible 800 ms après l'appui : false
```

Cause : trois gestionnaires concurrents ouvraient ou basculaient la même bulle. Au toucher, le `mouseenter` de compatibilité l'ouvre, puis le `click` l'inverse : visible environ 15 ms. Le même mécanisme touche la souris (survoler puis cliquer referme) et le clavier (le focus ouvre au Tab, Entrée referme : comportement inversé).

Contre-épreuve complète sur le composant d'origine : `recette-avant.txt` (19 ok, 81 échecs). Échecs typiques : chaque aide fermée 1,5 s après un appui et ouverte après le second ; survol puis clic referme ; Entrée et Espace inversés ; à 360 et 390 px, une aide touchée juste sous la barre de navigation sortait de 89 px hors du haut de l'écran (`avant/mobile-*-feu-start.png`).

## 2. Le correctif

- `src/lib/aide-bascule.ts` : l'état de l'aide en pur (`ouvert`, `epingle`). Le click (appui, clic, Entrée, Espace) est le seul événement qui bascule. Le survol n'ouvre qu'avec `pointerType === "mouse"` et, en sortant, ne referme que ce qu'il a ouvert. Le focus n'ouvre plus rien.
- `ThemeMatrix.tsx`, `LabelTip` seul :
  - `onPointerEnter` / `onPointerLeave` remplacent `onMouseEnter` / `onMouseLeave`. Les événements souris de compatibilité émis après un toucher ne sont plus écoutés. `onFocus` et `onBlur` sont retirés.
  - Fermetures : `pointerdown` ou `focusin` hors de l'aide (appui ailleurs, Tab), Échap. Le focus reste sur le bouton. Une seule aide ouverte à la fois dans la page.
  - Accessibilité : `aria-expanded`, `aria-controls` ; la bulle reste dans le DOM (`hidden` quand fermée), donc `aria-describedby` donne l'explication au lecteur d'écran même fermée ; anneau `focus-visible`.
  - Placement mesuré à l'ouverture : au-dessus par défaut, en dessous si le haut de la bulle sortirait de l'écran ou passerait sous la barre collante ; décalage horizontal si elle déborde à droite ; largeur `min(240px, 100vw - 24px)`. Un pseudo-élément comble l'écart de 8 px pour que la souris monte dans la bulle sans la fermer.

Aucun changement du moteur, des scores, seuils, paliers, classements, pondérations, disponibilités ni des textes d'aide. Le diff de `ThemeMatrix.tsx` est confiné aux imports et à `LabelTip`.

## 3. Recette après correction

`scripts/fut153/recette.mjs`, page `/comparateur?communes=69123,38185,73065` (aperçu gratuit, qui réutilise `ThemeMatrix`). Chaque thème est dévoilé sur une page neuve. Résultat : 48 vérifications vertes sur le serveur de dev (`recette-apres.txt`) et de nouveau sur le build de production `next start` (`recette-apres-build-prod.txt`).

| Surface | Vérifié |
|---|---|
| Toucher 360 et 390 px | Climat (Étés frais, Hivers doux, Ensoleillement), Risques naturels (Inondation, Météo propice aux feux, Pluies intenses, Sécheresse), Nature & cadre (3 aides, dont Espaces naturels et Mer), Mobilité (3 aides, dont Sans voiture et Train / gares). Chaque aide à mi-écran puis juste sous la barre : 1 appui ouvre, bulle lisible en entier (dans la fenêtre, au premier plan à ses coins et au centre) 1,5 s après, `aria-expanded=true`, 2e appui ferme, ni l'URL ni le thème ouvert ne changent. Appui extérieur ferme. Passage d'une aide à une autre. |
| Souris 1440 px | Survol ouvre ; le pointeur monte dans la bulle sans la fermer ; sortie ferme ; survol puis clic reste ouvert 1,5 s puis survit à la sortie ; second clic ferme ; clic extérieur ferme ; une aide épinglée se ferme quand on en survole une autre. |
| Clavier seul 1440 et 390 px | Tab atteint l'aide (fermée au simple focus) ; `aria-describedby` relie l'explication ; Entrée ouvre et ferme ; Espace ouvre et ferme ; Échap ferme et laisse le focus sur le contrôle ; Tab vers l'aide suivante ferme la précédente. |

Captures : `apres/` (mobile par thème, aide feu à mi-écran et sous la barre, survol bureau, clavier) et `avant/`.

Aides les plus longues couvertes : « Météo propice aux feux » (183 caractères, thème risques), « Sans voiture » (176, mobilité), « Inondation » (230 avec le texte rendu).

## 4. Limites et réserves

- **Comparaison complète (Pack payant)** : `ComparaisonCompleteView` réutilise le même `ThemeMatrix`, donc le même `LabelTip`. Elle n'a pas été rendue en navigateur (accès payant). Lecture du code : sections animées (`step-enter`), aucun `overflow` qui couperait la bulle ; la bascule sous la barre collante y joue de la même façon.
- **Vrais téléphones** : recette en émulation Chrome avec de vrais événements tactiles CDP. Pas de test sur un iPhone ou un Android physiques (Safari iOS non couvert : Playwright n'a ici que WebKit desktop).
- **`ChipTooltip` a le même défaut**, hors périmètre et non modifié : sur `/comparateur` (puces « Ce qu'on compare »), un appui sur « Climat » laisse la bulle absente 1 s après. Il est aussi utilisé par `/ou-vivre` et `ThermalComfortSection`. L'automate `aide-bascule` peut lui être appliqué tel quel : ticket séparé à ouvrir.
- Le placement est mesuré à l'ouverture ; un défilement pendant qu'une aide est ouverte ne la repositionne pas.
