// FUT-118 R0 · LES MARQUEURS DE L'IDENTITÉ HISTORIQUE, comptés fichier par fichier.
//
// Le Relevé devient la seule grammaire (DESIGN.md v3.0). La migration se fait par lots, donc ces
// marqueurs vont rester un temps dans les écrans historiques. Le test-cliquet (`canon.test.ts`) garde
// une règle simple : un fichier ne peut qu'en PERDRE, et un fichier nouveau n'en contient aucun. Sans
// lui, chaque nouvel écran recréerait sa petite branche graphique à côté du canon.
//
// La référence (`heritage-reference.json`) se régénère avec `node scripts/fut118/heritage-reference.ts`,
// SEULEMENT quand un lot de migration retire des marqueurs (le nombre baisse) : jamais pour en ajouter.
// Elle ne se modifie jamais à la main ; son total est en plus plafonné dans `canon.test.ts` (K1b).
//
// UN GARDE-FOU, PAS UN JUGE ESTHÉTIQUE. Ces expressions sont des approximations :
//   faux positifs  le mot « glass » dans un commentaire ou un texte ; un emoji ou un symbole (☀, ✓) dans
//                  un contenu ; « italic » et « orange » sur une même ligne sans lien ; des capitales mono
//                  pour un code légitime (un code INSEE, une référence de parcelle).
//   oublis         des capitales posées par `text-transform` dans un module CSS ou par `style=` ; un
//                  verre écrit `backdrop-blur` ; les rayons larges, les couleurs en dur, les halos et
//                  orbes, les animations qui ignorent le mouvement réduit. Rien de cela n'est compté.
// Un passage au vert ne vaut donc pas conformité : la revue de design reste nécessaire.
//
// LES EXCEPTIONS LÉGITIMES se déclarent dans `heritage-exceptions.json`, une entrée par fichier et par
// marqueur : { fichier, marqueur, nombre, motif }. Le motif dit pourquoi ce n'est pas l'identité
// historique (faux positif, ou usage justifié) ; K1 vérifie qu'il est écrit, et qu'une exception sert
// encore (une exception devenue inutile fait échouer le test, pour qu'on la retire).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const MARQUEURS: Record<string, RegExp> = {
  /** La carte de verre comme unité universelle (classe `.glass`). */
  verre: /\bglass\b/g,
  /** Le kit déprécié de `report/kit.tsx`. */
  kitDeprecie: /\b(?:GlassCard|ReportSection)\b/g,
  /** Les capitales mono espacées : surtitres, étiquettes, boutons. */
  capitalesMono: /font-mono[^"'`\n]*uppercase|uppercase[^"'`\n]*font-mono/g,
  /** Le titre à suite en italique orange (ou d'accent). */
  italiqueAccent: /italic[^"'`\n]{0,60}(?:accent|orange)|(?:accent|orange)[^"'`\n]{0,60}italic/g,
  /** Les emoji employés comme icônes. */
  emoji: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
};

/** Le code de PRODUCTION qui porte une interface : pages, composants, styles. */
const RACINES = ["src/app", "src/components"];
// Ce fichier est exclu : il nomme les marqueurs qu'il compte.
const EXCLUS = [/^src\/app\/dev\//, /^src\/components\/prototypes\//, /\.test\.tsx?$/, /^src\/components\/releve\/heritage\.ts$/];

export function fichiersDInterface(racine = process.cwd()): string[] {
  const out: string[] = [];
  const parcourir = (d: string) => {
    for (const n of readdirSync(join(racine, d))) {
      const rel = `${d}/${n}`;
      if (statSync(join(racine, rel)).isDirectory()) parcourir(rel);
      else if (/\.(tsx|ts|css)$/.test(n) && !EXCLUS.some((x) => x.test(rel))) out.push(rel);
    }
  };
  for (const r of RACINES) parcourir(r);
  return out.sort();
}

export function compter(texte: string): Record<string, number> {
  const c: Record<string, number> = {};
  for (const [nom, rx] of Object.entries(MARQUEURS)) {
    const n = texte.match(rx)?.length ?? 0;
    if (n) c[nom] = n;
  }
  return c;
}

export function releverHeritage(racine = process.cwd()): Record<string, Record<string, number>> {
  const ref: Record<string, Record<string, number>> = {};
  for (const f of fichiersDInterface(racine)) {
    const c = compter(readFileSync(join(racine, f), "utf8"));
    if (Object.keys(c).length) ref[f] = c;
  }
  return ref;
}
