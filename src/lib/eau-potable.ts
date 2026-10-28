// LE CONTRÔLE SANITAIRE DE L'EAU POTABLE d'une commune (FUT-152, 28/10/2026). Lib PURE : lecture des réponses
// Hub'Eau (« Qualité de l'eau potable », données des ARS) et état qui en découle. L'appel réseau vit dans
// `server/eau-potable.ts`.
//
// TROIS DÉFAUTS CORRIGÉS, mesurés le 28/10/2026 sur l'ancienne route :
//   1. Les codes de paramètres étaient faux. « Plomb » lisait le 1313 (DBO5), « Arsenic » le 1388 (cadmium),
//      « Nitrites » le 1350 (phosphore total), « Pesticides totaux » le 6860 (code inexistant). Les codes
//      ci-dessous sont ceux que Hub'Eau libelle lui-même ainsi (contrôle `fut152-*.test.ts`).
//   2. Une fenêtre de six mois faisait dire « aucun contrôle récent » à une commune contrôlée deux fois par an
//      (L'Abergement-Clémenciat : dernier prélèvement le 05/02/2026). On lit le DERNIER prélèvement publié,
//      quel qu'en soit l'âge, et sa date est affichée. Aucun seuil d'ancienneté : le lecteur juge.
//   3. Un résultat d'un réseau était présenté comme celui de la commune. Une commune peut être desservie par
//      plusieurs réseaux (UDI) : Paris en a 4, Metz 2. Chaque réseau porte son propre dernier prélèvement,
//      et la zone qu'il dessert quand la source la nomme.
// Et la conclusion officielle de l'ARS est rendue telle quelle : à Metz, le prélèvement du 28/08/2026 « ne
// satisfait pas à la référence de qualité » pour le carbone organique total, ce que les deux pastilles
// « Conforme » de l'ancienne route taisaient.
//
// Ce qui n'est JAMAIS dit : qu'une eau est potable aujourd'hui. Un prélèvement décrit l'eau à sa date.

export const EAU_SOURCE = {
  producteur: "Agences régionales de santé, via Hub'Eau",
  api: "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable",
  page: "https://hubeau.eaufrance.fr/page/api-qualite-eau-potable",
  ministere: "https://orobnat.sante.gouv.fr/orobnat/rechercherResultatQualite.do",
} as const;

/** Paramètres mis en avant. Limite de qualité réglementaire (arrêté du 11 janvier 2007). */
export const PARAMETRES_EAU = [
  { code: "1340", libelle: "Nitrates", unite: "mg/L", limite: 50, vigilance: 25 },
  { code: "1339", libelle: "Nitrites", unite: "mg/L", limite: 0.5 },
  { code: "1382", libelle: "Plomb", unite: "µg/L", limite: 10 },
  { code: "1369", libelle: "Arsenic", unite: "µg/L", limite: 10 },
  { code: "6276", libelle: "Total des pesticides analysés", unite: "µg/L", limite: 0.5 },
] as const;

export type Conformite = "conforme" | "non_conforme" | null;

export type PrelevementLu = {
  date: string;
  conclusion: string | null;
  limitesBacterio: Conformite;
  limitesPhysicoChimie: Conformite;
  referencesBacterio: Conformite;
  referencesPhysicoChimie: Conformite;
};

export type ReseauLu = {
  code: string;
  nom: string;
  /** La zone desservie, quand la source la nomme (« du 1° au 13°, 15° et 16° arrondissement »). */
  zone: string | null;
  /** `null` : la source ne publie aucun prélèvement pour ce réseau ; `"indisponible"` : l'appel a échoué. */
  dernier: PrelevementLu | null | "indisponible";
};

export type ParametreLu = {
  code: string;
  libelle: string;
  /** La valeur telle que publiée (« <0,01 », « 22,80 ») : un « < » n'est pas un zéro. */
  valeur: string;
  unite: string;
  date: string;
  reseau: string | null;
  depasseLimite: boolean | null;
  depasseVigilance: boolean | null;
  limite: number;
  vigilance: number | null;
};

export type EauPotableCommune =
  | { etat: "indisponible" }
  | { etat: "absent_dans_source"; consulteLe: string }
  | {
      etat: "disponible" | "partiel";
      consulteLe: string;
      reseaux: ReseauLu[];
      /** Les paramètres mis en avant, chacun avec SA date et SON réseau ; absents s'ils ne sont pas publiés. */
      parametres: ParametreLu[];
    };

const texte = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

/** Hub'Eau code la conformité par une lettre : C (conforme), N (non conforme) ; le reste ne conclut rien. */
export function conformite(v: unknown): Conformite {
  const s = texte(v)?.toUpperCase();
  if (s === "C") return "conforme";
  if (s === "N") return "non_conforme";
  return null;
}

export type ReponseHubeau = { count?: unknown; data?: unknown };
export const reponseLisible = (r: ReponseHubeau | null): r is { count: number; data: Record<string, unknown>[] } =>
  !!r && typeof r.count === "number" && Array.isArray(r.data);

export function prelevement(r: Record<string, unknown> | undefined): PrelevementLu | null {
  const date = texte(r?.date_prelevement);
  if (!r || !date) return null;
  return {
    date: date.slice(0, 10),
    conclusion: texte(r.conclusion_conformite_prelevement),
    limitesBacterio: conformite(r.conformite_limites_bact_prelevement),
    limitesPhysicoChimie: conformite(r.conformite_limites_pc_prelevement),
    referencesBacterio: conformite(r.conformite_references_bact_prelevement),
    referencesPhysicoChimie: conformite(r.conformite_references_pc_prelevement),
  };
}

const nomReseau = (r: Record<string, unknown>): string | null => {
  const rs = Array.isArray(r.reseaux) ? (r.reseaux as Record<string, unknown>[]) : [];
  const noms = [...new Set(rs.map((x) => texte(x?.nom)).filter((x): x is string => !!x))];
  return noms.length ? noms.join(", ") : null;
};

/** Une valeur publiée → nombre comparable, ou `null` pour « <LQ », « traces », etc. */
export function valeurComparable(alpha: string): number | null {
  if (/^[<>]/.test(alpha.trim())) return null;
  const n = Number(alpha.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** « <0,5 » face à une limite de 10 : sous la limite. « <20 » face à 10 : on ne sait pas. */
function sousBorne(alpha: string, limite: number): false | null {
  const m = /^<\s*([\d.,]+)/.exec(alpha.trim());
  const borne = m ? Number(m[1]!.replace(",", ".")) : NaN;
  return Number.isFinite(borne) && borne <= limite ? false : null;
}

export function parametre(def: (typeof PARAMETRES_EAU)[number], r: Record<string, unknown> | undefined): ParametreLu | null {
  const date = texte(r?.date_prelevement);
  const alpha = texte(r?.resultat_alphanumerique) ?? (typeof r?.resultat_numerique === "number" ? String(r.resultat_numerique) : null);
  if (!r || !date || !alpha) return null;
  const n = valeurComparable(alpha);
  const vigilance = "vigilance" in def ? def.vigilance : null;
  return {
    code: def.code,
    libelle: def.libelle,
    valeur: alpha,
    unite: texte(r.libelle_unite) ?? def.unite,
    date: date.slice(0, 10),
    reseau: nomReseau(r),
    depasseLimite: n !== null ? n > def.limite : sousBorne(alpha, def.limite),
    depasseVigilance: vigilance === null || n === null ? null : n > vigilance && n <= def.limite,
    limite: def.limite,
    vigilance,
  };
}

/**
 * Assemble la lecture. `reseaux` : la liste des UDI de la commune et, pour chacune, la réponse de son dernier
 * prélèvement (`null` = appel en échec). `repliCommune` : le dernier prélèvement de la commune, lu quand la
 * source ne liste aucun réseau. `parametres` : une réponse par paramètre (`null` = échec).
 */
export function lireEauPotable(o: {
  consulteLe: string;
  reseaux: { code: string; nom: string; zone: string | null; reponse: ReponseHubeau | null }[] | null;
  repliCommune: ReponseHubeau | null;
  parametres: (ReponseHubeau | null)[];
}): EauPotableCommune {
  let partiel = o.parametres.some((p) => !reponseLisible(p));
  let reseaux: ReseauLu[] = [];

  if (o.reseaux && o.reseaux.length > 0) {
    reseaux = o.reseaux.map((r) => {
      if (!reponseLisible(r.reponse)) {
        partiel = true;
        return { code: r.code, nom: r.nom, zone: r.zone, dernier: "indisponible" as const };
      }
      return { code: r.code, nom: r.nom, zone: r.zone, dernier: prelevement(r.reponse.data[0]) };
    });
    if (reseaux.every((r) => r.dernier === "indisponible")) return { etat: "indisponible" };
  } else {
    // Aucun réseau listé (ou liste en panne) : le dernier prélèvement de la commune, avec ses réseaux.
    if (!reponseLisible(o.repliCommune)) return { etat: "indisponible" };
    if (o.reseaux === null) partiel = true;
    const r0 = o.repliCommune.data[0];
    const p = prelevement(r0);
    if (p && r0) reseaux = [{ code: "", nom: nomReseau(r0) ?? "Réseau non nommé", zone: null, dernier: p }];
  }

  const parametres = o.parametres.flatMap((rep, i) => {
    if (!reponseLisible(rep)) return [];
    const lu = parametre(PARAMETRES_EAU[i]!, rep.data[0]);
    return lu ? [lu] : [];
  });

  const aucunPrelevement = reseaux.every((r) => r.dernier === null) && parametres.length === 0;
  if (aucunPrelevement && !partiel) return { etat: "absent_dans_source", consulteLe: o.consulteLe };
  return { etat: partiel ? "partiel" : "disponible", consulteLe: o.consulteLe, reseaux, parametres };
}
