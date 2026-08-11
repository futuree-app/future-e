import { communeParent } from "./plm.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// QUEL BIEN LE HUB LIT, QUAND LE COMPTE EN POSSÈDE PLUSIEURS.
//
// ── LE DÉFAUT ────────────────────────────────────────────────────────────────────────────────
// `/rapport` prenait le premier dossier de la commune que `listDossiers` rendait, c'est-à-dire le
// plus récemment CRÉÉ. Ouvrir le dossier du 1 rue Saint-Dominique puis revenir au hub réaffichait
// donc le 29 rue de l'Evescot, sans un mot. Le produit possédait un territoire actif et une
// collection d'adresses ; il ne possédait pas de BIEN actif.
//
// La route d'ouverture ne persistait que la commune (`active_insee_code`), ce qui suffisait tant
// qu'un compte n'avait qu'un bien par commune. Sept dossiers plus tard, le hub choisissait à la
// place du lecteur, et le silence est ce qui rendait ce choix grave : rien à l'écran ne disait
// lequel des sept était lu.
//
// ── CE QUE CE MODULE DÉCIDE, ET CE QU'IL NE DÉCIDE PAS ───────────────────────────────────────
// Il choisit, il n'affiche pas. Le bien retenu doit être NOMMÉ à l'écran, avec le moyen d'en
// changer : un choix implicite juste est encore un choix implicite.
//
// Pur et testable : aucune I/O, aucun accès base. La persistance vit dans la route d'ouverture, la
// lecture dans le hub.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Le strict nécessaire pour choisir. Le hub passe des `AddressDossierRow` entiers. */
export type DossierChoisissable = { id: string; insee: string };

export type ChoixDossier<T extends DossierChoisissable> = {
  /** Le bien à lire, ou `null` si la commune lue n'en porte aucun. */
  dossier: T | null;
  /**
   * Pourquoi celui-là. Sert le texte de l'écran : « le dernier ouvert » ne se dit pas comme
   * « le seul de cette commune », et un repli doit s'annoncer comme tel.
   */
  raison: "actif" | "unique" | "repli_plus_recent" | "aucun";
  /** Les AUTRES biens de la même commune. Vide, l'écran n'a pas à proposer de changer. */
  autres: T[];
};

/**
 * Le bien lu pour une commune donnée.
 *
 * `actifId` est le dossier que le lecteur a ouvert en dernier (`user_profiles.active_dossier_id`).
 * Il ne gagne QUE s'il appartient à la commune lue : un lecteur qui bascule de Nantes à La Rochelle
 * ne doit pas se voir servir son appartement nantais.
 *
 * L'ordre d'entrée fait foi pour le repli : `listDossiers` trie par date de création décroissante,
 * donc le premier de la liste est le plus récent. Ce module ne retrie pas, il ne connaît pas les
 * dates.
 */
export function choisirDossierActif<T extends DossierChoisissable>(
  dossiers: readonly T[], inseeLu: string | null | undefined, actifId: string | null | undefined,
): ChoixDossier<T> {
  if (!inseeLu) return { dossier: null, raison: "aucun", autres: [] };
  const commune = communeParent(inseeLu);
  const candidats = dossiers.filter((d) => communeParent(d.insee) === commune);
  if (candidats.length === 0) return { dossier: null, raison: "aucun", autres: [] };

  const actif = actifId ? candidats.find((d) => d.id === actifId) ?? null : null;
  const retenu = actif ?? candidats[0]!;
  const autres = candidats.filter((d) => d.id !== retenu.id);

  const raison: ChoixDossier<T>["raison"] =
    actif ? "actif" : candidats.length === 1 ? "unique" : "repli_plus_recent";
  return { dossier: retenu, raison, autres };
}
