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
]);

export default eslintConfig;
