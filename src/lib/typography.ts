// Robustesse typographique FR. Safari IGNORE `text-wrap: pretty`, qui est ce qui empêche
// ailleurs un petit mot (le, la, pour, par, de, à…) de rester orphelin en fin de ligne et
// de donner l'impression d'une phrase coupée. La parade portable : lier ces petits mots au
// mot suivant par une espace insécable (U+00A0), que tous les navigateurs respectent.
// Appliquer sur les phrases importantes (heros, synthèses, CTA). cf. AGENTS.md « Largeur du texte ».

const ORPHAN_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "à", "au", "aux", "et", "ou",
  "en", "ce", "ces", "son", "sa", "ses", "leur", "leurs", "ma", "mon", "mes", "ta", "ton",
  "tes", "notre", "votre", "nos", "vos", "par", "pour", "sur", "sans", "qui", "que", "qu",
  "ne", "si", "l",
]);

// Ponctuation « haute » FR : insécable AVANT (la règle veut une espace insécable devant : ; ! ? »).
const HIGH_PUNCT = new Set([":", ";", "!", "?", "»"]);

const NBSP = " ";

export function bindOrphans(text: string): string {
  const parts = text.split(" ");
  return parts
    .map((w, i) => {
      if (i === parts.length - 1) return w;
      const bare = w.toLowerCase().replace(/[.,:;!?«»()]/g, "");
      const bind = ORPHAN_WORDS.has(bare) || HIGH_PUNCT.has(parts[i + 1]);
      return w + (bind ? NBSP : " ");
    })
    .join("");
}
