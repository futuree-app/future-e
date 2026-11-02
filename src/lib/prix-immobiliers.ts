// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE FUTUR•E DIT DES PRIX IMMOBILIERS D'UNE COMMUNE (FUT-138). PUR, DÉTERMINISTE, SANS MODÈLE.
//
// UNE SEULE REPRÉSENTATION pour toutes les surfaces : le champ `logement` de l'index et sa provenance
// (`meta.logement`), écrits par scripts/populate-logement.mjs. Territoire, Où vivre, le comparateur, le
// dossier Logement et AskFuture formulent les mêmes chiffres par les fonctions de ce fichier, jamais par un
// calcul à eux.
//
// DOCTRINE, vérifiée par les tests sur toutes les sorties :
//   - prix de vente OBSERVÉS (médiane des ventes passées) ≠ prix d'annonce ≠ valeur d'un bien ;
//   - prix passés ≠ prix futurs : aucun verbe d'évolution ;
//   - achat et location toujours séparés, chacun avec son unité, sa période, sa source et sa maille ;
//   - un prix communal ou intercommunal n'est jamais le prix d'une adresse ;
//   - aucun jugement d'abordabilité (« abordable », « accessible », « bon marché ») : le budget du lecteur
//     n'est pas connu ;
//   - un manque se dit avec sa raison (Alsace-Moselle hors DVF, trop peu de ventes), jamais « moyen ».
// ════════════════════════════════════════════════════════════════════════════════════════════
import { bindOrphans } from "./typography.ts";

export type NiveauPrix = "tres_bas" | "bas" | "moyen" | "haut" | "tres_haut";
export type PrixDuType = { eur_m2: number; maille: string; ventes?: number };

/** Le champ `logement` d'une commune de l'index (cf. IndexCommune). */
export type LogementIndex = {
  achat:
    | { dispo: false; motif?: "hors_dvf" | "ventes_insuffisantes" }
    | { dispo: true; niveau?: NiveauPrix; maison: PrixDuType | null; appart: PrixDuType | null };
  location: {
    niveau: NiveauPrix;
    appart_eur_m2: number | null;
    maison_eur_m2: number | null;
    fiabilite: "observee" | "estimee";
  } | null;
};

/** La provenance (`meta.logement` de l'index). Tout est optionnel : un index ancien se lit encore. */
export type MetaPrix = {
  achat?: { periode?: { debut?: string; fin?: string }; livraison?: string; source?: string };
  location?: { source?: string; attribution?: string };
};

export type LecturePrix = {
  code: string;
  /** Le nom à écrire dans les phrases (« La Rochelle », « Paris 11e Arrondissement », « Paris »). */
  nom: string;
  /** null : la commune n'est pas dans l'index. */
  logement: LogementIndex | null;
  meta: MetaPrix | null;
};

const NBSP = " ";
const entier = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[   ]/g, NBSP);
const decimal = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const eurM2 = (n: number) => `${entier(n)}${NBSP}€/m²`;
const loyerM2 = (n: number) => `${decimal(n)}${NBSP}€/m²`;

const anneeDe = (iso: string | undefined) => (iso && /^\d{4}/.test(iso) ? iso.slice(0, 4) : null);
/** « 2022 à 2025 » (période des ventes), lue dans la provenance. */
export function periodeVentes(meta: MetaPrix | null): string | null {
  const d = anneeDe(meta?.achat?.periode?.debut), f = anneeDe(meta?.achat?.periode?.fin);
  if (!d || !f) return null;
  return d === f ? d : `${d} à ${f}`;
}
const periodeCourte = (meta: MetaPrix | null) => periodeVentes(meta)?.replace(" à ", "-") ?? null;

/** « de maisons », « d'appartements ». */
const de = (mot: string) => (/^[aeiouyéèh]/i.test(mot) ? `d'${mot}` : `de ${mot}`);
const estArrondissement = (code: string) => /^(751\d\d|6938\d|132\d\d)$/.test(code);
const VILLE_PLM: Record<string, string> = { "75": "Paris", "69": "Lyon", "13": "Marseille" };
const villeDe = (code: string) => (estArrondissement(code) ? VILLE_PLM[code.slice(0, 2)] : null);
/** « dans la commune », « dans l'arrondissement ». */
const lieuDe = (l: LecturePrix) => (estArrondissement(l.code) ? "l'arrondissement" : "la commune");

export const SOURCE_ACHAT_COURTE = "DGFiP, DVF";
export const SOURCE_LOYER_COURTE = "ANIL, Carte des loyers 2025";

type Ligne = { type: "appart" | "maison"; libelle: string; pluriel: string; prix: PrixDuType };

/** Les prix de vente disponibles, appartements d'abord. */
export function prixDeVente(l: LecturePrix): Ligne[] {
  const a = l.logement?.achat;
  if (!a?.dispo) return [];
  const out: Ligne[] = [];
  if (a.appart) out.push({ type: "appart", libelle: "Appartements", pluriel: "appartements", prix: a.appart });
  if (a.maison) out.push({ type: "maison", libelle: "Maisons", pluriel: "maisons", prix: a.maison });
  return out;
}

/** Le marché dominant de la commune : le type qui a le plus de ventes à la maille communale. */
function typePrincipal(lignes: Ligne[]): Ligne | null {
  if (lignes.length === 0) return null;
  const poids = (x: Ligne) => (estRepli(x.prix) ? 0 : 1e9) + (x.prix.ventes ?? 0);
  return [...lignes].sort((x, y) => poids(y) - poids(x))[0];
}

/** La maille réelle d'un prix : « commune », « arrondissement », « ville de Paris », « intercommunalité ». */
export function mailleLisible(p: PrixDuType, l: LecturePrix): string {
  if (p.maille === "EPCI") return "intercommunalité";
  if (p.maille === "ville") return `ville de ${villeDe(l.code) ?? l.nom}`;
  return estArrondissement(l.code) ? "arrondissement" : "commune";
}
const estRepli = (p: PrixDuType) => p.maille === "EPCI" || p.maille === "ville";

/** Pourquoi il n'y a pas de prix de vente, en une phrase. null si des prix existent. */
export function raisonSansPrix(l: LecturePrix): string | null {
  const a = l.logement?.achat;
  if (!l.logement) return `Les prix immobiliers de ${l.nom} ne sont pas lus par futur•e.`;
  if (a?.dispo) return null;
  if (a?.motif === "hors_dvf") {
    return "En Alsace-Moselle, les ventes sont enregistrées au livre foncier et ne figurent pas dans la base publique des valeurs foncières (DVF) : aucun prix de vente n'est publié pour cette commune.";
  }
  const p = periodeVentes(l.meta);
  return `Trop peu de ventes de logements ${p ? `de ${p} ` : ""}dans ${lieuDe(l)} et dans son intercommunalité pour publier un prix médian.`;
}

export const LIMITE_VENTES =
  "Ce sont des prix de ventes passées, constatés par l'administration fiscale. Ils ne donnent ni la valeur d'un logement précis, ni les prix à venir : l'état, la surface, l'étage et l'emplacement d'un bien le placent souvent loin de cette médiane.";
export const LIMITE_LOYERS =
  "Les loyers sont des loyers d'annonce, charges comprises, pour un logement type loué vide : un loyer demandé, pas un loyer signé.";

export type TextePrix = {
  manquant: boolean;
  /** Face : la valeur principale, sa ligne secondaire, la source courte. */
  valeur: string;
  sousTitre: string;
  source: string;
  /** Volet : titre, phrase, chiffres, limites, méthode. */
  titreVolet: string;
  phrase: string;
  faits: { label: string; value: string }[];
  limites: string[];
  methode: string;
};

function faitVente(x: Ligne, l: LecturePrix): { label: string; value: string } {
  const n = x.prix.ventes;
  const grain = mailleLisible(x.prix, l);
  return {
    label: `${x.libelle}, prix de vente médian`,
    value: `${eurM2(x.prix.eur_m2)} · ${grain}${n ? `, ${entier(n)}${NBSP}ventes` : ""}`,
  };
}

function faitsLoyer(l: LecturePrix): { label: string; value: string }[] {
  const loc = l.logement?.location;
  if (!loc) return [];
  const grain = loc.fiabilite === "observee" ? "estimation communale" : "estimée depuis des communes voisines";
  const out: { label: string; value: string }[] = [];
  if (loc.appart_eur_m2 != null) out.push({ label: "Appartement, loyer d'annonce", value: `${loyerM2(loc.appart_eur_m2)} par mois · ${grain}` });
  if (loc.maison_eur_m2 != null) out.push({ label: "Maison, loyer d'annonce", value: `${loyerM2(loc.maison_eur_m2)} par mois · ${grain}` });
  return out;
}

/** La carte « Prix immobiliers » de Territoire, et la section du dossier Logement. */
export function textePrix(l: LecturePrix): TextePrix {
  const ventes = prixDeVente(l);
  const principal = typePrincipal(ventes);
  const periode = periodeVentes(l.meta);
  const loyers = faitsLoyer(l);
  const limites: string[] = [];
  for (const maille of ["ville", "EPCI"]) {
    const replis = ventes.filter((x) => x.prix.maille === maille);
    if (!replis.length) continue;
    const ou = maille === "ville" ? `toute la ville de ${villeDe(l.code) ?? l.nom}` : "l'intercommunalité";
    limites.push(
      `Moins de 10 ventes ${replis.map((x) => de(x.pluriel)).join(" et ")} dans ${lieuDe(l)}${periode ? ` de ${periode}` : ""} : le chiffre est celui de ${ou}, un ordre de grandeur pour ${l.nom}.`,
    );
  }
  const raison = raisonSansPrix(l);
  // Sans aucun prix de vente, la raison EST la phrase : elle n'est pas répétée dans les limites.
  if (raison && ventes.length) limites.push(raison);
  if (ventes.length) limites.push(LIMITE_VENTES);
  if (loyers.length) limites.push(LIMITE_LOYERS);
  if (!loyers.length && l.logement) {
    limites.push(`Aucun loyer d'annonce n'est publié pour ${l.nom} dans la Carte des loyers.`);
  }

  const methode = [
    `Achat : ${l.meta?.achat?.source ?? "DVF, DGFiP"}${l.meta?.achat?.livraison ? ` (${l.meta.achat.livraison})` : ""}. Médiane des prix au m² de surface habitable des ventes d'un seul logement${periode ? ` de ${periode}` : ""}, dépendances comprises ; ventes de plusieurs logements écartées. Commune si au moins 10 ventes du type ; pour un arrondissement de Paris, Lyon ou Marseille, sinon la ville entière ; sinon intercommunalité.`,
    loyers.length ? `Location : ${l.meta?.location?.source ?? "Carte des loyers 2025 (ANIL)"}. ${l.meta?.location?.attribution ?? "Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin"}.` : "",
  ].filter(Boolean).join(" ");

  if (!principal) {
    return {
      manquant: loyers.length === 0,
      valeur: loyers.length ? loyers[0].value.split(" · ")[0] : "—",
      sousTitre: loyers.length ? `loyer d'annonce d'un appartement · prix de vente non disponible` : "Prix non disponibles",
      source: loyers.length ? SOURCE_LOYER_COURTE : SOURCE_ACHAT_COURTE,
      titreVolet: "Prix de vente non disponibles",
      phrase: bindOrphans(raison ?? ""),
      faits: loyers,
      limites: limites.filter(Boolean).map(bindOrphans),
      methode,
    };
  }

  // CHAQUE CHIFFRE À SON ÉCHELLE : un prix d'intercommunalité ou de ville entière n'est jamais dit « à L'Oie ».
  const ou = (x: Ligne) =>
    x.prix.maille === "EPCI" ? `dans l'intercommunalité de ${l.nom}`
      : x.prix.maille === "ville" ? `dans toute la ville de ${villeDe(l.code) ?? l.nom}`
        : `${estArrondissement(l.code) ? "dans" : "à"} ${l.nom}`;
  const vendus = (x: Ligne) => `${x.pluriel} vendu${x.type === "maison" ? "e" : ""}s ${ou(x)}`;
  const debut = periode ? `De ${periode}, l` : "L";
  const phrase = ventes.length === 2
    ? `${debut}a moitié des ${vendus(ventes[0])} l'ont été à plus de ${eurM2(ventes[0].prix.eur_m2)}, et la moitié des ${vendus(ventes[1])} à plus de ${eurM2(ventes[1].prix.eur_m2)}.`
    : `${debut}a moitié des ${vendus(principal)} l'ont été à plus de ${eurM2(principal.prix.eur_m2)}.`;

  return {
    manquant: false,
    valeur: eurM2(principal.prix.eur_m2),
    sousTitre: `prix de vente médian des ${principal.pluriel}${periode ? `, ${periode}` : ""}${estRepli(principal.prix) ? ` (${mailleLisible(principal.prix, l)})` : ""}`,
    source: `${SOURCE_ACHAT_COURTE} · ${mailleLisible(principal.prix, l)}`,
    titreVolet: `${principal.libelle} : ${eurM2(principal.prix.eur_m2)}`,
    phrase: bindOrphans(phrase),
    faits: [...ventes.map((x) => faitVente(x, l)), ...loyers],
    limites: limites.filter(Boolean).map(bindOrphans),
    methode,
  };
}

/**
 * LA LIGNE DES CARTES DU COMPARATEUR ET D'OÙ VIVRE. Un fait posé APRÈS le classement : elle ne change ni
 * l'ordre ni la sélection. Achat et location séparés, chacun avec sa source.
 */
export function lignePrixComparateur(l: LecturePrix): string {
  const ventes = prixDeVente(l);
  const p = periodeCourte(l.meta);
  const loc = l.logement?.location;
  const parts: string[] = [];
  if (ventes.length) {
    const v = ventes.map((x) => `${x.pluriel} ${eurM2(x.prix.eur_m2)}${estRepli(x.prix) ? ` (${mailleLisible(x.prix, l)})` : ""}`).join(", ");
    parts.push(`Prix de vente médians${p ? ` ${p}` : ""} : ${v} (${SOURCE_ACHAT_COURTE}).`);
  } else if (l.logement?.achat?.dispo === false && l.logement.achat.motif === "hors_dvf") {
    parts.push("Prix de vente : non publiés en Alsace-Moselle (hors DVF).");
  } else {
    parts.push("Prix de vente : trop peu de ventes pour un prix médian.");
  }
  if (loc && (loc.appart_eur_m2 != null || loc.maison_eur_m2 != null)) {
    const v = [
      loc.appart_eur_m2 != null ? `appartement ${loyerM2(loc.appart_eur_m2)}` : null,
      loc.maison_eur_m2 != null ? `maison ${loyerM2(loc.maison_eur_m2)}` : null,
    ].filter(Boolean).join(", ");
    parts.push(`Loyers d'annonce : ${v} par mois, charges comprises (ANIL).`);
  }
  return parts.join(" ");
}

/**
 * LE BLOC DONNÉ AUX MODÈLES (AskFuture, réponses du comparateur, synthèses). Des faits étiquetés et des
 * consignes : le modèle cite ces chiffres, il n'en fabrique aucun.
 */
export function blocPrixPourModele(l: LecturePrix): string {
  const ventes = prixDeVente(l);
  const periode = periodeVentes(l.meta);
  const loc = l.logement?.location;
  const lignes: string[] = [`Prix immobiliers, ${l.nom} :`];
  if (ventes.length) {
    lignes.push(`- Prix de vente OBSERVÉS, médiane au m² de surface habitable des ventes d'un seul logement${periode ? `, ventes de ${periode}` : ""} (Source : ${SOURCE_ACHAT_COURTE}) :`);
    for (const x of ventes) {
      const grain = estRepli(x.prix) ? `${mailleLisible(x.prix, l)}, faute de 10 ventes dans ${lieuDe(l)}` : mailleLisible(x.prix, l);
      lignes.push(`  - ${x.pluriel} : ${eurM2(x.prix.eur_m2)} (échelle : ${grain}${x.prix.ventes ? `, ${entier(x.prix.ventes)} ventes` : ""})`);
    }
  } else {
    lignes.push(`- Prix de vente : non disponibles. ${raisonSansPrix(l) ?? ""}`.trim());
  }
  if (loc && (loc.appart_eur_m2 != null || loc.maison_eur_m2 != null)) {
    const fiab = loc.fiabilite === "observee" ? "estimation communale" : "estimation depuis des communes voisines, peu d'annonces ici";
    const v = [
      loc.appart_eur_m2 != null ? `appartement ${loyerM2(loc.appart_eur_m2)}` : null,
      loc.maison_eur_m2 != null ? `maison ${loyerM2(loc.maison_eur_m2)}` : null,
    ].filter(Boolean).join(", ");
    lignes.push(`- Loyers d'ANNONCE mensuels au m², charges comprises, logement type loué vide : un indicateur estimé par l'ANIL à partir des annonces, pas une médiane (Source : ${SOURCE_LOYER_COURTE}) : ${v} (${fiab}).`);
  } else {
    lignes.push("- Loyers : non disponibles à cette échelle.");
  }
  lignes.push(
    "- CONSIGNES PRIX : ce sont des médianes de ventes passées et des loyers d'annonce, à l'échelle indiquée. À une question sur le « prix moyen », donnez la médiane en disant que c'est une médiane. Jamais la valeur ni une estimation d'un logement précis (même avec sa surface : multiplier une médiane n'estime pas un bien), jamais un prix futur ni une tendance, jamais « abordable » ou « accessible » sans budget connu. Achat et location toujours séparés. Toujours dire la période, l'échelle et la source.",
  );
  return lignes.join("\n");
}

// ── LE BESOIN, DANS LES MOTS DU LECTEUR ──────────────────────────────────────────────────────

// Un budget, un prix, un loyer, l'immobilier. Pas « acheter » seul (« acheter local »), ni « marché » seul
// (le marché du samedi).
const PRIX = /\bbudget\b|\bprix\b|\bloyers?\b|immobili|€|\beuros?\b|\bk€|\b\d+\s?k\b|\bau m(²|2|ètre)|\bm²|\bcher\b|\bchère?s?\b|\bco[uû]t du logement/i;

/** Ce terme du lecteur parle-t-il de prix immobiliers ou de budget ? */
export function termeDePrix(terme: string | null | undefined): boolean {
  return typeof terme === "string" && PRIX.test(terme);
}

/**
 * La phrase de « ce qui reste ouvert » pour un budget ou une question de prix (Où vivre). Les prix sont
 * indiqués sur chaque carte ; ils n'ont pas classé les communes, et futur•e ne dit pas ce qui tient dans un
 * budget : il ne connaît ni l'apport, ni le financement, ni le logement visé.
 */
export const PHRASE_PRIX =
  "futur•e n'en fait pas un critère et n'a pas classé les communes sur leurs prix ; les prix de vente médians et les loyers d'annonce sont indiqués pour chaque commune proposée, sans juger de ce qui tient dans votre budget.";
