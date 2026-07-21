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

// « de Antibes » est une faute : élision devant voyelle (« d'Antibes », « d'Orléans »). Les h
// (Honfleur) et les articles (« Le Havre ») restent en « de », le cas voyelle est le seul tranché
// sans ambiguïté. Couvre les voyelles accentuées (É, Î…) et la ligature œ (Œting).
export function deCommune(nom: string): string {
  return /^[aàâäeéèêëiîïoôöuùûüyœ]/i.test(nom) ? `d'${nom}` : `de ${nom}`;
}

// « à » ne s'élide JAMAIS devant une voyelle (« à Antibes », « à Orléans ») : à la différence de
// `deCommune`, le seul cas à traiter est la CONTRACTION avec l'article défini d'un nom composé.
// « Le Havre » -> « au Havre », « Les Sables-d'Olonne » -> « aux Sables-d'Olonne ». Le féminin et
// l'élidé se laissent tels quels (« à La Rochelle », « à L'Haÿ-les-Roses »). La frontière de mot est
// obligatoire : « Lespinasse » n'est pas « Les » suivi de « pinasse ».
export function aCommune(nom: string): string {
  if (/^Les\s/.test(nom)) return `aux ${nom.slice(4)}`;
  if (/^Le\s/.test(nom)) return `au ${nom.slice(3)}`;
  return `à ${nom}`;
}

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
