import "server-only";

// LE POTENTIEL RADON DU SOL, par commune (Géorisques / IRSN).
//
// CE QUE C'EST. Une classification du SOUS-SOL en trois catégories, établie sur la géologie. Ce n'est
// ni une mesure, ni une exposition, ni un risque constaté : c'est la propension des terrains à
// produire du radon. La concentration réellement respirée dans un logement dépend en plus de sa
// construction, de son contact avec le sol et de sa ventilation — que personne ne publie.
//
// LE GRAIN EST COMMUNAL, ET PAS PLUS FIN. Vérifié le 29/07/2026 : l'endpoint exige `code_insee` et
// refuse `latlon` (HTTP 400). Le rapport au point porte bien un `libelleStatutAdresse`, mais il
// recopie le statut communal — égal sur les neuf points testés.
//
// ⚠ SAUF À PARIS, LYON ET MARSEILLE, OÙ C'EST L'ARRONDISSEMENT. `/radon?code_insee=75056` rend zéro
// résultat ; `75104` répond. Et la valeur VARIE d'un arrondissement à l'autre :
//   Paris     11111111111111111111  uniforme, classe 1
//   Lyon      111111113             le 9e en classe 3, les huit autres en 1
//   Marseille 1111111111222215      les 11e à 15e en classe 2
// Interroger « un arrondissement représentatif » afficherait donc classe 1 à un habitant du 9e
// arrondissement de Lyon. Sans adresse, ces trois communes n'ont PAS de valeur : `null`, pas un repli.

import { codePourSourceParArrondissement } from "./plm";

const BASE = "https://www.georisques.gouv.fr/api/v1/radon";

/** La classe de potentiel, telle que la source la rend (une chaîne, jamais un nombre). */
export type RadonClasse = "1" | "2" | "3";

export type RadonPotentiel = {
  classe: RadonClasse;
  /** Le code réellement interrogé : la commune, ou l'arrondissement pour Paris/Lyon/Marseille. */
  codeInterroge: string;
  /** Vrai quand la lecture porte sur un arrondissement et non sur la commune entière. */
  parArrondissement: boolean;
};

function estClasse(v: unknown): v is RadonClasse {
  return v === "1" || v === "2" || v === "3";
}

/**
 * Le potentiel radon pour une adresse.
 *
 * `null` couvre trois cas que l'appelant n'a pas à distinguer, parce qu'aucun ne permet de conclure :
 * source muette, classe illisible, ou commune PLM sans arrondissement connu. Dans tous, la règle se
 * tait — elle ne dit jamais « pas de radon ».
 *
 * @param insee     le code commune du dossier (déjà remonté par `communeParent` le cas échéant)
 * @param citycode  le code que le géocodeur a donné à l'adresse — pour une adresse parisienne, c'est
 *                  DÉJÀ l'arrondissement, et c'est lui qu'il faut interroger.
 */
export async function getRadonPotentiel(
  insee: string | null | undefined,
  citycode?: string | null,
): Promise<RadonPotentiel | null> {
  const code = codePourSourceParArrondissement(insee, citycode);
  if (!code) return null;
  try {
    const res = await fetch(`${BASE}?code_insee=${encodeURIComponent(code)}`, {
      next: { revalidate: 2_592_000 }, // 30 j : une classification géologique ne bouge pas
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ classe_potentiel?: unknown }> };
    const brut = json.data?.[0]?.classe_potentiel;
    if (!estClasse(brut)) return null;
    return { classe: brut, codeInterroge: code, parArrondissement: code !== insee };
  } catch {
    return null;
  }
}
