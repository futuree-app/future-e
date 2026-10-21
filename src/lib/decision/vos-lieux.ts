import type { StoredArtifact } from "./decision-artifact.ts";
import type { VerdictTone } from "./conclusion-plan.ts";
import type { UserProject } from "../user-project.ts";
import { artifactScopeKey } from "./decision-artifact.ts";
import { projetAChangeMateriellement } from "./projet-materiel.ts";
import { communeParent } from "../plm.ts";
import { decideTerritoryAccess, type TerritoryClaim } from "../territory-claims.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « VOS LIEUX » : CE QUE CHAQUE LIEU ACCESSIBLE A LE DROIT DE MONTRER (FUT-41, premier lot).
//
// ── CE QUE CE MODULE FAIT ────────────────────────────────────────────────────────────────────
// Il reçoit ce que le compte possède (biens, territoires, résidence), les artefacts DÉJÀ figés et
// le Projet actuel, et rend une ligne par lieu : de quoi le reconnaître, les échelles réellement
// examinées, la conclusion de son dossier TELLE QU'ELLE A ÉTÉ FIGÉE, sa date, sa version, et si
// elle répond encore au Projet. Pur, sans I/O : le chargement vit dans `server/vos-lieux.ts`.
//
// ── CE QU'IL S'INTERDIT ──────────────────────────────────────────────────────────────────────
//   - RECOMPOSER une conclusion. Le texte est `narrativePlan.verdict.headline.text` de l'artefact
//     servi, mot pour mot : un dossier figé sous « une gare à moins de 20 min » ne devient jamais
//     « 30 min » parce que le Projet a changé depuis. L'écart se DIT (`actualite`), il ne s'efface pas.
//   - GÉNÉRER quoi que ce soit. Pas d'artefact : la ligne le dit (`absente`), et rien n'est lancé.
//   - FUSIONNER deux biens d'une même commune. Chaque bien a son artefact (`logement:<id>`), et deux
//     adresses voisines peuvent conclure différemment.
//   - OUVRIR un contenu payant au titre de la résidence. La commune de résidence sans droit reste
//     une lecture gratuite partielle : aucune conclusion de dossier n'y est rattachée, même si un
//     artefact traînait pour cette commune.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Un bien du compte, tel que `listDossiers` le rend (révoqués déjà exclus). */
export type BienPossede = {
  id: string;
  insee: string;
  address_label: string;
  city: string | null;
  created_at: string;
  stripe_payment_intent_id: string | null;
};

/** Un droit territorial acheté (`report_grants`). */
export type TerritoirePossede = { insee: string; commune: string | null; createdAt: string };

export type EntreeVosLieux = {
  biens: BienPossede[];
  territoires: TerritoirePossede[];
  residence: { insee: string | null; commune: string | null };
  /** Les artefacts servis, par clé `cleArtefact(insee, scope)`. Une clé absente : jamais d'artefact. */
  artefacts: ReadonlyMap<string, StoredArtifact>;
  projetActuel: UserProject | null;
};

export type EtatEchelle = "examinee" | "non_examinee" | "inconnue";

export type ConclusionLieu =
  | {
      etat: "disponible";
      /** « Arbitrage », « Correspondance »… tel que le plan figé le porte. */
      label: string;
      /** Le titre du verdict, mot pour mot. */
      texte: string;
      ton: VerdictTone | null;
      version: number;
      generatedAt: string;
      moteur: string;
      /** `a_jour` : même signature décisionnelle ; `projet_change` : le Projet a changé depuis ;
       *  `inconnue` : l'artefact ne porte pas de Projet (avant le 05/08/2026), ou aucun Projet actuel. */
      actualite: "a_jour" | "projet_change" | "inconnue";
      /** Une version plus récente est en préparation, ou a échoué : la version servie reste celle-ci. */
      tentativePlusRecente: "en_preparation" | "echouee" | null;
    }
  | { etat: "absente" }
  | { etat: "en_preparation" }
  | { etat: "illisible" }
  | { etat: "lecture_gratuite" };

export type LienLieu = { href: string; label: string };

export type LieuAffiche = {
  cle: string;
  type: "adresse" | "commune" | "residence";
  /** L'adresse, ou le nom de la commune. */
  titre: string;
  /** La commune, pour une adresse. */
  commune: string | null;
  /** Le code de la commune de l'artefact (grain commune : arrondissements remontés). */
  inseeCommune: string;
  depuis: string | null;
  /** Comment ce lieu est accessible. `ouvert` : dossier ouvert par futur•e sans paiement. */
  acces: "achete" | "ouvert" | "lecture_gratuite";
  estResidence: boolean;
  echelles: { territoire: EtatEchelle; autour: EtatEchelle; logement: EtatEchelle };
  conclusion: ConclusionLieu;
  principal: LienLieu;
  /** Les échelles d'un bien, ouvrables une à une. */
  parEchelle: LienLieu[];
};

/** La clé d'un artefact : la commune (grain commune) et le scope. */
export function cleArtefact(insee: string, scopeKey: string): string {
  return `${communeParent(insee)}|${scopeKey}`;
}

/** Les clés que la page doit lire : un artefact par bien, un par territoire sans bien. */
export function clesALire(biens: BienPossede[], territoires: TerritoirePossede[]): { insee: string; scopeKey: string }[] {
  const territoiresSeuls = territoiresSansBien(biens, territoires);
  return [
    ...biens.map((b) => ({ insee: communeParent(b.insee), scopeKey: artifactScopeKey(b.id) })),
    ...territoiresSeuls.map((t) => ({ insee: communeParent(t.insee), scopeKey: artifactScopeKey(null) })),
  ];
}

/**
 * Les territoires qu'aucun bien ne porte, UN PAR COMMUNE : deux droits sur deux arrondissements de
 * Paris désignent le même artefact communal (75056), donc une seule ligne. Le plus ancien droit date
 * la ligne. Même règle que `listTerritoiresSansBien` (les communes portées par un bien s'effacent :
 * le bien est la porte la plus riche).
 */
function territoiresSansBien(biens: BienPossede[], territoires: TerritoirePossede[]): TerritoirePossede[] {
  const avecBien = new Set(biens.map((b) => communeParent(b.insee)));
  const parCommune = new Map<string, TerritoirePossede>();
  for (const t of territoires) {
    const c = communeParent(t.insee);
    if (avecBien.has(c)) continue;
    const deja = parCommune.get(c);
    if (!deja || t.createdAt < deja.createdAt) parCommune.set(c, t);
  }
  return [...parCommune.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function conclusionDe(stocke: StoredArtifact | undefined, projetActuel: UserProject | null): ConclusionLieu {
  if (!stocke) return { etat: "absente" };
  const tentative = stocke.headVersion !== stocke.servedVersion
    ? (stocke.headStatus === "generating" ? "en_preparation" : stocke.headStatus === "failed" ? "echouee" : null)
    : null;
  const a = stocke.artifact;
  if (!a || stocke.servedVersion == null) {
    return stocke.headStatus === "generating" ? { etat: "en_preparation" } : { etat: "illisible" };
  }
  const plan = a.dossier?.narrativePlan;
  const texte = plan?.verdict?.headline?.text;
  if (!texte) return { etat: "illisible" };
  // L'ABSENCE DE SNAPSHOT N'EST PAS UN CHANGEMENT (`projet-materiel.ts`) : sans point de comparaison,
  // on ne dit ni « à jour » ni « dépassée ».
  const snapshot = (a as { projectSnapshot?: UserProject | null }).projectSnapshot ?? null;
  const actualite = !snapshot || !projetActuel ? "inconnue"
    : projetAChangeMateriellement(snapshot, projetActuel) ? "projet_change" : "a_jour";
  return {
    etat: "disponible",
    label: plan.verdictLabel ?? "",
    texte,
    ton: plan.verdictTone ?? null,
    version: stocke.servedVersion,
    generatedAt: a.generatedAt,
    moteur: a.engineVersion,
    actualite,
    tentativePlusRecente: tentative,
  };
}

/** Les échelles examinées, lues dans le périmètre de l'artefact SERVI ; sans lui, on ne sait pas. */
function echellesDe(conclusionStockee: StoredArtifact | undefined, type: "adresse" | "commune"): LieuAffiche["echelles"] {
  const scope = conclusionStockee?.artifact?.dossier?.scope;
  if (type === "commune") return { territoire: scope ? "examinee" : "inconnue", autour: "non_examinee", logement: "non_examinee" };
  if (scope === "commune+adresse") return { territoire: "examinee", autour: "examinee", logement: "examinee" };
  // Un dossier d'adresse servi au périmètre commune : l'adresse n'a pas pu être lue (repli de production).
  if (scope === "commune") return { territoire: "examinee", autour: "non_examinee", logement: "non_examinee" };
  return { territoire: "inconnue", autour: "inconnue", logement: "inconnue" };
}

/**
 * LES LIEUX, DANS L'ORDRE : les biens (le plus récent d'abord, comme la page d'avant), puis les
 * territoires achetés seuls, puis la commune de résidence quand aucun droit ne la couvre.
 *
 * Les liens mènent aux routes existantes, qui vérifient elles-mêmes le droit et posent le lieu lu.
 * Ce sont des Route Handlers : la page les rend en `<a>` natifs, jamais préchargés.
 */
export function assemblerVosLieux(e: EntreeVosLieux): LieuAffiche[] {
  const out: LieuAffiche[] = [];
  const residenceCommune = e.residence.insee ? communeParent(e.residence.insee) : null;

  for (const b of e.biens) {
    const insee = communeParent(b.insee);
    const stocke = e.artefacts.get(cleArtefact(insee, artifactScopeKey(b.id)));
    const id = encodeURIComponent(b.id);
    out.push({
      cle: `bien:${b.id}`,
      type: "adresse",
      titre: b.address_label,
      commune: b.city,
      inseeCommune: insee,
      depuis: b.created_at,
      acces: b.stripe_payment_intent_id ? "achete" : "ouvert",
      estResidence: residenceCommune === insee,
      echelles: echellesDe(stocke, "adresse"),
      conclusion: conclusionDe(stocke, e.projetActuel),
      principal: { href: `/rapport/dossiers/ouvrir?id=${id}&vers=dossier`, label: "Ouvrir le dossier" },
      parEchelle: [
        { href: `/rapport/dossiers/ouvrir?id=${id}&vers=commune`, label: "Territoire" },
        { href: `/rapport/dossiers/ouvrir?id=${id}&vers=autour`, label: "Autour de l'adresse" },
        { href: `/rapport/dossiers/ouvrir?id=${id}&vers=logement`, label: "Logement" },
      ],
    });
  }

  for (const t of territoiresSansBien(e.biens, e.territoires)) {
    const insee = communeParent(t.insee);
    const stocke = e.artefacts.get(cleArtefact(insee, artifactScopeKey(null)));
    out.push({
      cle: `territoire:${insee}`,
      type: "commune",
      titre: t.commune ?? `Commune ${insee}`,
      commune: null,
      inseeCommune: insee,
      depuis: t.createdAt,
      acces: "achete",
      estResidence: residenceCommune === insee,
      echelles: echellesDe(stocke, "commune"),
      conclusion: conclusionDe(stocke, e.projetActuel),
      // Le nom n'est plus transmis : `/rapport/territoire` le lit dans le référentiel (FUT-119).
      principal: { href: `/rapport/territoire?insee=${encodeURIComponent(t.insee)}`, label: "Ouvrir le dossier" },
      parEchelle: [],
    });
  }

  // LA RÉSIDENCE N'EST UN DOSSIER QUE SI UN DROIT LA COUVRE (FUT-120). Sinon, elle se montre pour ce
  // qu'elle est : la lecture gratuite et partielle de sa commune, sans conclusion de dossier.
  if (residenceCommune) {
    const claims: TerritoryClaim[] = [
      ...e.territoires.map((t): TerritoryClaim => ({ kind: "grant", insee: t.insee })),
      ...e.biens.map((b): TerritoryClaim => ({ kind: "dossier", insee: b.insee, paid: b.stripe_payment_intent_id !== null })),
    ];
    if (!decideTerritoryAccess(claims, residenceCommune)) {
      out.push({
        cle: `residence:${residenceCommune}`,
        type: "residence",
        titre: e.residence.commune ?? `Commune ${residenceCommune}`,
        commune: null,
        inseeCommune: residenceCommune,
        depuis: null,
        acces: "lecture_gratuite",
        estResidence: true,
        echelles: { territoire: "non_examinee", autour: "non_examinee", logement: "non_examinee" },
        conclusion: { etat: "lecture_gratuite" },
        principal: { href: "/rapport/residence", label: "Ouvrir la lecture gratuite" },
        parEchelle: [],
      });
    }
  }
  return out;
}
