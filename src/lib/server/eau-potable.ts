import "server-only";
import { EAU_SOURCE, PARAMETRES_EAU, lireEauPotable, reponseLisible, type EauPotableCommune, type ReponseHubeau } from "@/lib/eau-potable";

// L'APPEL À HUB'EAU « Qualité de l'eau potable » (FUT-152). Service public documenté, sans clé. Ne lève jamais.
// Un appel par réseau de la commune, un par paramètre mis en avant : 2 réseaux → 1 + 2 + 5 appels, mis en
// cache une journée (les ARS publient avec quelques semaines de délai).

const TIMEOUT_MS = 8000;
const UNE_JOURNEE = 86_400;
const CHAMPS_PRELEVEMENT = [
  "date_prelevement", "conclusion_conformite_prelevement", "conformite_limites_bact_prelevement",
  "conformite_limites_pc_prelevement", "conformite_references_bact_prelevement", "conformite_references_pc_prelevement", "reseaux",
].join(",");
const CHAMPS_PARAMETRE = "date_prelevement,resultat_alphanumerique,resultat_numerique,libelle_unite,reseaux";

async function hubeau(chemin: string, params: Record<string, string>): Promise<ReponseHubeau | null> {
  const url = new URL(`${EAU_SOURCE.api}/${chemin}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url, { next: { revalidate: UNE_JOURNEE }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    // Hub'Eau répond 206 quand la page ne contient pas tout : c'est une réponse valide.
    if (res.status !== 200 && res.status !== 206) return null;
    return (await res.json()) as ReponseHubeau;
  } catch {
    return null;
  }
}

/** Les réseaux (UDI) de la commune pour l'année en cours, sinon l'année précédente. `null` : liste en panne. */
async function reseauxDe(insee: string, maintenant: Date) {
  for (const annee of [maintenant.getFullYear(), maintenant.getFullYear() - 1]) {
    const r = await hubeau("communes_udi", { code_commune: insee, annee: String(annee), size: "50" });
    if (!reponseLisible(r)) return null;
    if (r.count > 0) {
      const vus = new Map<string, { code: string; nom: string; zone: string | null }>();
      for (const x of r.data) {
        const code = typeof x.code_reseau === "string" ? x.code_reseau : "";
        if (!code || vus.has(code)) continue;
        vus.set(code, {
          code,
          nom: typeof x.nom_reseau === "string" ? x.nom_reseau : code,
          // « - » : la source ne nomme pas de zone (Metz).
          zone: typeof x.nom_quartier === "string" && !/^[\s-]*$/.test(x.nom_quartier) ? x.nom_quartier.trim() : null,
        });
      }
      return [...vus.values()];
    }
  }
  return [];
}

export async function getEauPotableCommune(insee: string, maintenant = new Date()): Promise<EauPotableCommune> {
  const dernier = (filtre: Record<string, string>) =>
    hubeau("resultats_dis", { code_commune: insee, ...filtre, sort: "desc", size: "1", fields: CHAMPS_PRELEVEMENT });

  const [liste, parametres] = await Promise.all([
    reseauxDe(insee, maintenant),
    Promise.all(PARAMETRES_EAU.map((p) =>
      hubeau("resultats_dis", { code_commune: insee, code_parametre: p.code, sort: "desc", size: "1", fields: CHAMPS_PARAMETRE }))),
  ]);
  const reseaux = liste === null
    ? null
    : await Promise.all(liste.map(async (r) => ({ ...r, reponse: await dernier({ code_reseau: r.code }) })));
  const repliCommune = reseaux && reseaux.length > 0 ? null : await dernier({});

  return lireEauPotable({ consulteLe: maintenant.toISOString(), reseaux, repliCommune, parametres });
}
