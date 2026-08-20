import type { UserProject } from "../user-project.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QU'ON SAUVEGARDE QUAND LE LECTEUR MODIFIE SON PROJET.
//
// Le défaut corrigé : `save()` reparse SYSTÉMATIQUEMENT et repart de `parsed = null`. Tant qu'on ne
// sauvegardait qu'après avoir édité le texte, c'était tolérable. Depuis que l'écran permet de
// changer la SEULE intention, un aller-retour « achat / location » un jour où le parseur est
// indisponible enregistrerait le projet sans ses priorités, et le dossier retomberait en « projet
// non structuré » alors que le lecteur n'a pas touché à son texte.
//
// PUR, sans I/O : la règle ne serait autrement vérifiable que par un blocage réseau à la main, donc
// jamais en intégration continue.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Le texte a-t-il changé ? Comparaison sur le texte TAILLÉ : une espace en fin de zone de saisie
 *  n'est pas une modification de projet. */
export function doitReparser(texteSaisi: string, projet: UserProject | null): boolean {
  return texteSaisi.trim() !== (projet?.rawText ?? "").trim();
}

/**
 * Ce que la sauvegarde doit porter dans `parsed`, et s'il faut avertir le lecteur.
 *
 * `parsedRecu` vaut `null` quand le parseur a échoué OU refusé. Dans ce cas on n'écrit PAS l'ancien
 * `parsed` : il décrit l'ancien texte, et l'attacher au nouveau ferait répondre l'analyse à des
 * priorités que le lecteur vient de retirer. On écrit `null` et on le DIT.
 */
export function parsedASauvegarder(input: {
  reparse: boolean;
  parsedRecu: UserProject["parsed"] | null;
  projet: UserProject | null;
  /**
   * Le lecteur n'a rien écrit, ou vient d'effacer ce qu'il avait écrit. C'est un CHOIX, jamais un
   * échec : depuis que le texte est facultatif (20/08/2026), quelqu'un peut déclarer son objectif
   * et son intention sans détailler ses priorités.
   *
   * Sans ce cas, effacer son texte produisait « nous n'avons pas pu extraire vos priorités », qui
   * accuse le parseur d'un retrait volontaire ; et garder l'ancien `parsed` attacherait au projet
   * des priorités que le lecteur vient précisément de retirer.
   */
  texteVide?: boolean;
}): { parsed: UserProject["parsed"] | null; avertir: boolean } {
  if (input.texteVide) return { parsed: null, avertir: false };
  if (!input.reparse) return { parsed: input.projet?.parsed ?? null, avertir: false };
  return { parsed: input.parsedRecu, avertir: input.parsedRecu == null };
}
