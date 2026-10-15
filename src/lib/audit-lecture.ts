// L'AUDIT ÉNERGÉTIQUE LU POUR DÉCIDER (FUT-62). Module PUR : aucune I/O, testable sous `node --test`.
//
// FUT-67 a rangé les lignes de la source en un point de départ et des parcours de travaux
// (`parcoursAudit`). L'écran restait un inventaire de consommations : rien ne disait ce que l'audit
// permet de savoir, ce qu'il suggère, ni ce qu'il reste à vérifier. Ce module ajoute, sans rien
// réinterpréter de la source :
//   1. les TRAVAUX de chaque étape, lus dans `travaux_realises` (`lireTravaux`) ;
//   2. une lecture en trois temps, fait → implication → vérification (`lireAuditPourDecision`).
//
// ── CE QUE `travaux_realises` CONTIENT, CONSTATÉ LE 15/10/2026 ────────────────────────────────────
// Échantillon public de 3 000 lignes (audits de janvier-février 2025) et des audits du 1 rue
// Saint-Dominique (Paris 7e) :
//   - une liste FERMÉE de catégories (onze libellés et « autre »), séparées par « , », dans un ordre
//     quelconque. Aucune quantité, aucun matériau, aucun coût : ce sont des CATÉGORIES de travaux ;
//   - vide sur l'état initial (toujours), renseignée sur chaque étape de travaux ;
//   - « autre » seul sur environ une étape sur cinq : des travaux que la source ne nomme pas ;
//   - MALGRÉ SON NOM, ce sont les travaux PROPOSÉS par l'auditeur pour l'étape, pas des travaux faits ;
//   - le plus souvent, chaque étape porte ses propres travaux (545 parcours sur 662, hors « autre ») et
//     la rénovation en une fois porte leur réunion ; mais 117 parcours répètent une catégorie d'une étape
//     à l'autre, et quelques-uns répètent la liste entière à chaque étape. On n'écrit donc jamais
//     « ajoutés à cette étape » : la liste d'une étape est celle que la source donne POUR cette étape.
//
// ── GARDE-FOUS (ticket FUT-62) ────────────────────────────────────────────────────────────────────
// Rien ici ne déduit une classe DPE future, un coût, une aide, un reste à charge, une date de
// réalisation, un vote ou un financement. Une consommation après travaux est une ESTIMATION de
// l'auditeur. Un audit d'immeuble ne devient jamais celui du logement, et seul le numéro de DPE publié
// par la source (`numero_dpe`) rattache un audit au diagnostic retenu.

import {
  formatKwhEpM2, formatSurfaceM2, parcoursAudit,
  type AuditRecord, type AuditScenario, type LectureAudit,
} from "./audit-record.ts";
import { dateFr } from "./decision/autour-permis.ts";

// ── 1. LES TRAVAUX D'UNE ÉTAPE ─────────────────────────────────────────────────────────────────────

export type PosteTravaux = { cle: string; libelle: string };

export type TravauxEtape =
  /** Champ vide ou absent : la source ne dit pas quels travaux composent l'étape. */
  | { statut: "non_renseigne" }
  /** Seulement « autre » : des travaux existent, la source ne les nomme pas. */
  | { statut: "non_detaille" }
  /** Des catégories nommées, et peut-être aussi « autre » (`autres`). */
  | { statut: "detaille"; postes: PosteTravaux[]; autres: boolean };

const normaliser = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Le vocabulaire de la source, dans un ordre de lecture fixe (l'enveloppe, puis les équipements) : la
 * source les rend dans un ordre quelconque, l'écran les range toujours de la même façon. Les libellés
 * remplacent le jargon (« menuiseries extérieures ») sans rien ajouter (ni matériau, ni performance).
 */
const VOCABULAIRE: Array<{ source: string; cle: string; libelle: string; isolation?: string }> = [
  { source: "isolation des murs", cle: "murs", libelle: "Isolation des murs", isolation: "des murs" },
  { source: "isolation de la toiture", cle: "toiture", libelle: "Isolation de la toiture", isolation: "de la toiture" },
  { source: "isolation des planchers bas", cle: "planchers_bas", libelle: "Isolation des planchers bas", isolation: "des planchers bas" },
  { source: "remplacement des menuiseries exterieures", cle: "menuiseries", libelle: "Remplacement des fenêtres et portes extérieures" },
  { source: "remplacement du systeme de chauffage", cle: "chauffage", libelle: "Remplacement du chauffage" },
  { source: "remplacement du systeme de production d'eau chaude sanitaire", cle: "eau_chaude", libelle: "Remplacement de la production d'eau chaude" },
  { source: "remplacement du systeme de ventilation", cle: "ventilation", libelle: "Remplacement de la ventilation" },
  { source: "installation d'un systeme de ventilation", cle: "ventilation_installation", libelle: "Installation d'une ventilation" },
  { source: "remplacement du systeme de refroidissement", cle: "refroidissement", libelle: "Remplacement du système de refroidissement" },
  { source: "installation d'un systeme de refroidissement", cle: "refroidissement_installation", libelle: "Installation d'un système de refroidissement" },
  { source: "installation d'un systeme de production photovoltaique", cle: "photovoltaique", libelle: "Installation d'une production photovoltaïque" },
];
const PAR_SOURCE = new Map(VOCABULAIRE.map((v, i) => [v.source, { ...v, rang: i }]));

/**
 * Les travaux d'une étape, tels que la source les publie. Un libellé hors vocabulaire n'est JAMAIS
 * perdu : il est rendu tel quel, après les catégories connues. Les doublons d'une même étape sont
 * fusionnés (une catégorie ne compte qu'une fois par étape).
 */
export function lireTravaux(travaux: string | null | undefined): TravauxEtape {
  const morceaux = (travaux ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  if (morceaux.length === 0) return { statut: "non_renseigne" };
  let autres = false;
  const vus = new Map<string, PosteTravaux & { rang: number }>();
  for (const m of morceaux) {
    const n = normaliser(m);
    if (n === "autre" || n === "autres") { autres = true; continue; }
    const connu = PAR_SOURCE.get(n);
    const poste = connu
      ? { cle: connu.cle, libelle: connu.libelle, rang: connu.rang }
      : { cle: `source:${n}`, libelle: m.charAt(0).toUpperCase() + m.slice(1), rang: VOCABULAIRE.length };
    if (!vus.has(poste.cle)) vus.set(poste.cle, poste);
  }
  if (vus.size === 0) return { statut: "non_detaille" };
  const postes = [...vus.values()].sort((a, b) => a.rang - b.rang).map(({ cle, libelle }) => ({ cle, libelle }));
  return { statut: "detaille", postes, autres };
}

/**
 * Une liste de postes, lisible d'un coup d'œil : les isolations regroupées en une phrase (« Isolation
 * des murs, de la toiture et des planchers bas »), le reste séparé par « · ». Rien n'est inventé ni retiré.
 */
export function phrasePostes(postes: PosteTravaux[], autres = false): string {
  const isolations = postes
    .map((p) => VOCABULAIRE.find((v) => v.cle === p.cle)?.isolation)
    .filter((v): v is string => v != null);
  const morceaux: string[] = [];
  if (isolations.length > 0) morceaux.push(`Isolation ${listeFr(isolations)}`);
  for (const p of postes) if (!VOCABULAIRE.find((v) => v.cle === p.cle)?.isolation) morceaux.push(p.libelle);
  if (autres) morceaux.push(morceaux.length > 0 ? "Autres travaux, non détaillés par la source" : "Travaux non détaillés par la source");
  return morceaux.join(" · ");
}

/** La phrase des travaux d'une étape, ou `null` quand la source n'en dit rien. */
export function phraseTravaux(t: TravauxEtape): string | null {
  if (t.statut === "non_renseigne") return null;
  if (t.statut === "non_detaille") return "Travaux non détaillés par la source";
  return phrasePostes(t.postes, t.autres);
}

function listeFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

// ── 2. LES PARCOURS, AVEC LEURS TRAVAUX ────────────────────────────────────────────────────────────

export type EtapeLue = { libelle: string; conso_ep_m2: number | null; travaux: TravauxEtape };

export type ParcoursLu = {
  cle: string;
  titre: string;
  etapes: EtapeLue[];
  /** La consommation estimée à la FIN du parcours : seulement si sa dernière étape est une étape finale. */
  arrivee: number | null;
  /** La réunion des travaux cités par ses étapes (« ce que le parcours touche »), ou `null` si aucun. */
  travaux: string | null;
  /** Au moins une étape sans travaux renseignés : la réunion est peut-être incomplète. */
  travauxIncomplets: boolean;
};

const estFinale = (libelle: string) => libelle === "Étape finale" || libelle === "Après travaux";

/**
 * Chaque parcours de `parcoursAudit`, sans en changer ni l'ordre, ni les étapes, ni les libellés. Les
 * travaux d'une étape viennent de SA ligne de la source (`scenario.travaux`) : une étape ne reçoit jamais
 * les travaux d'une autre, ni ceux d'un autre parcours.
 */
export function parcoursLus(lecture: LectureAudit): ParcoursLu[] {
  return lecture.parcours.map((p) => {
    const etapes = p.etapes.map(({ libelle, scenario }) => ({
      libelle, conso_ep_m2: scenario.conso_ep_m2, travaux: lireTravaux(scenario.travaux),
    }));
    const derniere = etapes[etapes.length - 1];
    const union = new Map<string, PosteTravaux & { rang: number }>();
    let autres = false;
    for (const e of etapes) {
      if (e.travaux.statut === "non_detaille") autres = true;
      if (e.travaux.statut !== "detaille") continue;
      autres ||= e.travaux.autres;
      for (const poste of e.travaux.postes) {
        const rang = VOCABULAIRE.findIndex((v) => v.cle === poste.cle);
        if (!union.has(poste.cle)) union.set(poste.cle, { ...poste, rang: rang === -1 ? VOCABULAIRE.length : rang });
      }
    }
    const postes = [...union.values()].sort((a, b) => a.rang - b.rang).map(({ cle, libelle }) => ({ cle, libelle }));
    return {
      cle: p.cle,
      titre: p.titre,
      etapes,
      arrivee: derniere && estFinale(derniere.libelle) ? derniere.conso_ep_m2 : null,
      travaux: postes.length > 0 || autres ? phrasePostes(postes, autres) : null,
      travauxIncomplets: etapes.some((e) => e.travaux.statut === "non_renseigne"),
    };
  });
}

// ── 3. QUEL AUDIT, POUR CE BIEN ────────────────────────────────────────────────────────────────────

/**
 * Parmi les audits de l'adresse, celui que l'écran lit. Une seule règle peut détrôner l'ordre de
 * `toAuditRecords` : un audit que la source rattache au diagnostic retenu pour ce logement (même numéro
 * de DPE). C'est une preuve publiée, pas un rapprochement de surfaces ou de consommations.
 */
export function choisirAudit(
  audit: AuditRecord, autres: AuditRecord[], numeroDpeRetenu: string | null,
): { retenu: AuditRecord; autres: AuditRecord[]; rattacheAuDpe: boolean } {
  const tous = [audit, ...autres];
  const lie = numeroDpeRetenu ? tous.find((a) => a.numero_dpe != null && a.numero_dpe === numeroDpeRetenu) : undefined;
  if (!lie) return { retenu: audit, autres, rattacheAuDpe: false };
  return { retenu: lie, autres: tous.filter((a) => a !== lie), rattacheAuDpe: true };
}

// ── 4. LA LECTURE EN TROIS TEMPS ───────────────────────────────────────────────────────────────────

/**
 * QUI LIT. La relation déclarée à ce bien (FUT-10, FUT-26) règle le titre et l'adresse des vérifications.
 * Jamais devinée : sans déclaration, la voix est neutre.
 */
export type VoixAudit = "achat" | "habitant" | "neutre";

export type DepartLu =
  | { statut: "unique"; valeur: number }
  | { statut: "multiple"; valeurs: number[] }
  | { statut: "absent" };

export type ArriveeLue =
  | { statut: "unique"; valeur: number }
  | { statut: "plage"; min: number; max: number }
  | { statut: "non_etablie" };

export type LectureDecisionAudit = {
  /** Le fait, en une phrase : un audit existe, et pour quoi. */
  titre: string;
  /** Sa portée réelle : l'objet audité, et ce qui le relie (ou non) au diagnostic retenu. */
  portee: string;
  /** « Établi le 30 mai 2025 », ou `null`. */
  date: string | null;
  depart: DepartLu;
  arrivee: ArriveeLue;
  /** « Deux parcours de travaux sont documentés : … », ou `null` s'il n'y en a aucun. */
  phraseParcours: string | null;
  parcours: ParcoursLu[];
  /** Ce que les valeurs de l'audit disent, ou ne disent pas, du diagnostic de ce logement. */
  lienDpe: string | null;
  /** Les autres audits publiés pour l'adresse, ou `null`. */
  autresAudits: string | null;
  titreVerifications: string;
  verifications: string[];
  rattacheAuDpe: boolean;
};

const ARRONDI = (v: number) => Math.round(v * 10) / 10;
const distincts = (vs: number[]) => [...new Set(vs.map(ARRONDI))];
const NOMBRES = ["Aucun", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six"];
const nombre = (n: number) => NOMBRES[n] ?? String(n);

/** Le point de départ : la (ou les) consommation(s) avant travaux, dédoublonnée(s) au dixième. */
export function departAudit(lecture: LectureAudit): DepartLu {
  const valeurs = distincts([lecture.depart, ...lecture.autresDeparts]
    .map((s: AuditScenario | null) => s?.conso_ep_m2)
    .filter((v): v is number => v != null));
  if (valeurs.length === 0) return { statut: "absent" };
  return valeurs.length === 1 ? { statut: "unique", valeur: valeurs[0] } : { statut: "multiple", valeurs };
}

/**
 * La consommation après la rénovation complète proposée, SEULEMENT SI ELLE EST ÉTABLIE SANS AMBIGUÏTÉ :
 * chaque parcours doit finir sur une étape FINALE avec une valeur. Un seul parcours coupé, ou fini sur un
 * libellé inconnu, et l'on ne sait plus où mène « la » rénovation complète : rien n'est affiché au premier
 * niveau (chaque parcours garde sa propre fin dans le détail). Deux parcours qui finissent différemment
 * donnent une plage, jamais une moyenne ni un choix.
 */
export function arriveeAudit(parcours: ParcoursLu[]): ArriveeLue {
  if (parcours.length === 0 || parcours.some((p) => p.arrivee == null)) return { statut: "non_etablie" };
  const valeurs = distincts(parcours.map((p) => p.arrivee as number));
  if (valeurs.length === 1) return { statut: "unique", valeur: valeurs[0] };
  return { statut: "plage", min: Math.min(...valeurs), max: Math.max(...valeurs) };
}

function phraseParcoursAudit(parcours: ParcoursLu[]): string | null {
  if (parcours.length === 0) return null;
  const decrit = (p: ParcoursLu) => {
    const t = p.titre.charAt(0).toLowerCase() + p.titre.slice(1);
    return p.etapes.length > 1 ? `${t} (${p.etapes.length} étapes)` : t;
  };
  const liste = listeFr(parcours.map(decrit));
  return parcours.length === 1
    ? `Un parcours de travaux est documenté : ${liste}.`
    : `${nombre(parcours.length)} parcours de travaux sont documentés : ${liste}.`;
}

function surfaceCourte(a: AuditRecord): string {
  return a.objet ? formatSurfaceM2(Math.round(a.objet.surface_m2)) : "surface non précisée";
}

function decrireAutre(a: AuditRecord): string {
  const quoi = a.objet?.grain === "immeuble" ? "un audit d'immeuble" : a.objet?.grain === "logement" ? "un audit de logement" : "un audit sans objet précisé";
  const date = a.date_audit ? dateFr(a.date_audit) : null;
  return `${quoi} (${surfaceCourte(a)}${date ? `, établi le ${date}` : ""})`;
}

export function phraseAutresAudits(autres: AuditRecord[], incomplets: boolean): string | null {
  if (autres.length === 0 && !incomplets) return null;
  if (autres.length === 0) return "La source publie peut-être d'autres audits pour cette adresse : tous n'ont pas pu être lus.";
  const n = autres.length;
  const tete = incomplets
    ? `Cette adresse porte au moins ${n === 1 ? "un autre audit" : `${n} autres audits`}`
    : `Cette adresse porte aussi ${n === 1 ? "un autre audit" : `${n} autres audits`}`;
  const montres = autres.slice(0, 3).map(decrireAutre);
  const reste = n > 3 ? `, et ${n - 3} de plus` : "";
  return `${tete} : ${listeFr(montres)}${reste}. ${n === 1 ? "Il n'est" : "Aucun n'est"} attribué à ce bien.`;
}

export function voixAudit(relation: { relation?: string | null; objectif?: string | null } | null | undefined): VoixAudit {
  if (relation?.objectif === "buy") return "achat";
  if (relation?.relation === "lives_here" || relation?.objectif === "understand") return "habitant";
  return "neutre";
}

const TITRE_VERIFICATIONS: Record<VoixAudit, string> = {
  achat: "À vérifier avant d'acheter",
  habitant: "À suivre",
  neutre: "À vérifier avant de vous engager",
};

/** Le diagnostic retenu pour ce logement, tel que la section l'a : son numéro et sa consommation. */
export type DpeRetenu = { numero: string | null; conso_ep_m2: number | null } | null;

/**
 * L'AUDIT LU POUR DÉCIDER : le fait (il existe, il porte sur ceci, il dit cela), son implication (ce
 * qu'il permet de comprendre, et ce qu'il ne dit pas de ce logement), puis les vérifications concrètes.
 */
export function lireAuditPourDecision({
  audit, autres = [], autresIncomplets = false, dpe = null, voix = "neutre",
}: {
  audit: AuditRecord;
  autres?: AuditRecord[];
  autresIncomplets?: boolean;
  dpe?: DpeRetenu;
  voix?: VoixAudit;
}): LectureDecisionAudit {
  const choix = choisirAudit(audit, autres, dpe?.numero ?? null);
  const a = choix.retenu;
  const lecture = parcoursAudit(a.scenarios);
  const parcours = parcoursLus(lecture);
  const date = a.date_audit ? dateFr(a.date_audit) : null;
  const grain = a.objet?.grain ?? null;
  const dpeAutre = !choix.rattacheAuDpe && dpe?.numero && a.numero_dpe && a.numero_dpe !== dpe.numero ? a.numero_dpe : null;

  // ── Le fait ──
  let titre: string;
  let portee: string;
  if (grain === "immeuble") {
    titre = "Un audit énergétique existe pour cet immeuble.";
    const n = a.nb_logements;
    const detail = n != null && n > 1 ? `${n} logements, ${surfaceCourte(a)} habitables` : `${surfaceCourte(a)} habitables`;
    portee = `Il porte sur l'immeuble entier (${detail}), pas sur ce seul logement.`;
    if (choix.rattacheAuDpe) portee += ` Il a été établi à partir du diagnostic retenu ici (n° ${a.numero_dpe}).`;
  } else if (grain === "logement" && choix.rattacheAuDpe) {
    titre = "Un audit énergétique existe pour ce logement.";
    portee = `Il porte sur un logement de ${surfaceCourte(a)}, et a été établi à partir du diagnostic retenu pour ce logement (n° ${a.numero_dpe}).`;
  } else if (grain === "logement") {
    titre = "Un audit énergétique existe pour un logement de cette adresse.";
    portee = dpeAutre
      ? `Il porte sur un logement de ${surfaceCourte(a)}, et a été établi à partir d'un autre diagnostic (n° ${dpeAutre}) que celui retenu ici : il peut s'agir d'un autre logement de l'adresse, ou d'un état antérieur de celui-ci.`
      : `Il porte sur un logement de ${surfaceCourte(a)}. La source ne le rattache pas au diagnostic de ce bien : il peut s'agir d'un autre logement de l'adresse.`;
  } else {
    titre = "Un audit énergétique est publié pour cette adresse.";
    portee = "La source ne dit pas s'il porte sur un logement ou sur l'immeuble entier : ses résultats ne sont attribués ni à ce logement, ni à l'immeuble.";
  }

  // ── L'implication ──
  let lienDpe: string | null = null;
  if (grain === "immeuble") {
    lienDpe = dpe?.conso_ep_m2 != null
      ? `Ces valeurs décrivent l'immeuble entier. Pour ce logement, le diagnostic retenu indique ${formatKwhEpM2(dpe.conso_ep_m2)} : l'audit ne le remplace pas, et ne dit pas quelle étiquette ce logement aurait après travaux.`
      : "Ces valeurs décrivent l'immeuble entier : elles ne disent ni la consommation de ce logement, ni l'étiquette qu'il aurait après travaux.";
  } else if (grain === "logement" && !choix.rattacheAuDpe && dpe?.conso_ep_m2 != null) {
    lienDpe = `Pour comparaison, le diagnostic retenu pour ce bien indique ${formatKwhEpM2(dpe.conso_ep_m2)}.`;
  }

  // ── Les vérifications ──
  const verifications: string[] = [];
  const aupres = voix === "habitant" ? "au syndic" : "au vendeur ou au syndic";
  if (grain === null) {
    verifications.push(voix === "habitant"
      ? "Le rapport d'audit complet dit s'il porte sur ce logement ou sur l'immeuble entier."
      : "Demandez au vendeur le rapport d'audit complet : lui seul dit s'il porte sur ce logement ou sur l'immeuble entier.");
  } else if (grain === "logement" && !choix.rattacheAuDpe && voix !== "habitant") {
    verifications.push(`Demandez au vendeur si cet audit porte bien sur ce bien : il concerne un logement de ${surfaceCourte(a)}.`);
  }
  if (choix.autres.length > 0 && voix !== "habitant") {
    verifications.push("Plusieurs audits sont publiés pour cette adresse : demandez au vendeur lequel concerne ce bien.");
  }
  if (grain === "immeuble" && parcours.length > 0) {
    verifications.push(a.copropriete
      ? `L'immeuble est immatriculé comme copropriété (n° ${a.copropriete}) : les travaux que propose l'audit s'y décident en assemblée générale. Demandez ${aupres} lesquels ont été votés, financés ou planifiés, et les procès-verbaux des dernières assemblées.`
      : `L'audit propose des travaux pour l'immeuble entier. Si l'immeuble est en copropriété, leur réalisation dépend de décisions collectives : demandez ${aupres} lesquels ont été votés, financés ou planifiés.`);
  } else if (grain === "logement" && parcours.length > 0) {
    verifications.push(voix === "habitant"
      ? `L'audit décrit l'état du logement${date ? ` au ${date}` : ""} : les travaux réalisés depuis n'y figurent pas.`
      : `Demandez au vendeur lesquels de ces travaux ont déjà été réalisés${date ? ` depuis le ${date}` : ""}, et leurs factures.`);
  }

  return {
    titre,
    portee,
    date: date ? `Établi le ${date}` : null,
    depart: departAudit(lecture),
    arrivee: arriveeAudit(parcours),
    phraseParcours: phraseParcoursAudit(parcours),
    parcours,
    lienDpe,
    autresAudits: phraseAutresAudits(choix.autres, autresIncomplets),
    titreVerifications: TITRE_VERIFICATIONS[voix],
    verifications: verifications.slice(0, 3),
    rattacheAuDpe: choix.rattacheAuDpe,
  };
}
