import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/*.test.ts",
    // CE QUI N'EST PAS LE PRODUIT. `npx eslint` sans argument rendait 5 421 erreurs et 70 466
    // warnings : plus personne ne pouvait s'en servir comme signal, et un vrai défaut s'y serait
    // noyé sans laisser de trace. Mesuré le 25/07/2026 : 99,8 % du bruit venait de trois dossiers
    // qui n'ont jamais été écrits ici.
    //
    // Profils Chrome jetables laissés par les captures d'écran (58 533 problèmes, dont des
    // extensions Google minifiées) :
    ".tmp-audit-screenshots/**",
    // Configuration et plugins de l'outillage d'assistance (17 219 problèmes) :
    ".claude/**",
    // Archive de design décompressée, jamais suivie par git :
    "Futur.e Design System/**",
  ]),
  {
    // MÊME CIBLE QUE LE PLUGIN `react` DE NEXT. eslint-config-next ne déclare `react` (et
    // `react-hooks`) que pour `**/*.{js,jsx,mjs,ts,tsx,mts,cts}` : ni `.cjs`, ni rien d'autre. Sans
    // `files`, cet objet s'appliquait à tout le dépôt ; dès qu'un `.cjs` entrait dans le lint,
    // ESLint s'arrêtait sur « could not find plugin "react" » et `npm run lint` ne rendait plus
    // aucun diagnostic (FUT-121). Les `.cjs` gardent les contrôles JavaScript (règles de base et
    // typescript-eslint), ils ne reçoivent simplement pas une règle JSX qui ne les concerne pas.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      // L'APOSTROPHE N'EST PAS ÉCHAPPÉE. La règle protège d'un rendu ambigu pour `>`, `"` et `}` ;
      // pour `'`, elle n'apporte aucune correction utile et coûte cher à un produit dont les textes
      // français sont la matière première : 82 occurrences, et un JSX où « L&apos;exposition
      // n&apos;est pas établie » remplace « L'exposition n'est pas établie ». On garde donc la règle
      // pour les caractères réellement ambigus, et on autorise l'apostrophe.
      //
      // Le corollaire : plus d'incohérence entre fichiers (certains échappaient, d'autres non).
      "react/no-unescaped-entities": ["error", { forbid: [">", "\"", "}"] }],
    },
  },
  {
    // UN `.cjs` EST UN MODULE COMMONJS, PAS UN MODULE ES. Node le charge comme tel quel que soit
    // `package.json`. Sans ce bloc, ESLint l'analysait avec `sourceType: "module"`, la portée d'un
    // module ES.
    //
    // UNE SEULE RÈGLE EST LEVÉE, ET SEULEMENT ICI. `@typescript-eslint/no-require-imports` demande
    // de remplacer `require()` par `import`. Or `require()` est la syntaxe d'import de CommonJS :
    // un `import` statique serait une erreur de syntaxe dans ce fichier. Lever la règle ici, c'est
    // reconnaître un format de module. Ce n'est pas désactiver un contrôle : la règle reste en
    // erreur sur tout le code `.ts`, `.tsx`, `.mts` et `.mjs`, et les `.cjs` gardent toutes les
    // autres règles actives (variables inutilisées, `any`, règles Next…). En particulier,
    // `@next/next/no-assign-module-variable` reste active : masquer l'objet `module` est aussi un
    // piège en CommonJS. Ses deux occurrences ont été corrigées dans le code, pas exemptées.
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
