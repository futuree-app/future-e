import type { StoredArtifact } from "./decision-artifact.ts";
import type { VerdictTone } from "./conclusion-plan.ts";
import type { UserProject } from "../user-project.ts";
import { artifactScopeKey } from "./decision-artifact.ts";
import { projetAChangeMateriellement } from "./projet-materiel.ts";
import { communeParent } from "../plm.ts";
import { decideTerritoryAccess, type TerritoryClaim } from "../territory-claims.ts";
// Le calcul des échelles du Relevé (FUT-91), réutilisé tel quel : « examinée » vient du périmètre du
// dossier, « avec constats » du nombre de cartes qui la touchent. Aucune seconde définition.
import { lireDossier, lireCarteDuDossier, lectureDesEchelles } from "../../components/releve/lecture-dossier.ts";
import { controlesParEchelle } from "./dossier-view.ts";
import type { Dossier } from "./decision-fact.ts";

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

/** `constats` : examinée, des constats y sont retenus ; `examinee` : examinée, aucun constat retenu ;
 *  `non_examinee` : hors du périmètre lu ; `inconnue` : sans dossier lisible, on ne sait pas. */
export type EtatEchelle = "constats" | "examinee" | "non_examinee" | "inconnue";

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
      /** La version servie succède à une autre : l'analyse a été mise à jour. */
      miseAJour: boolean;
      /** Une version plus récente est en préparation, ou a échoué : la version servie reste celle-ci. */
      tentativePlusRecente: "en_preparation" | "echouee" | null;
    }
  | { etat: "absente" }
  | { etat: "en_preparation" }
  | { etat: "illisible" }
  | { etat: "lecture_gratuite" };

export type LienLieu = { href: string; label: string; /** pour une échelle : examinée par le dossier servi ? */ examinee?: boolean | null };

export type LieuAffiche = {
  cle: string;
  type: "adresse" | "commune" | "residence";
  /** La commune : le premier repère de chaque lieu, adresse comprise. */
  commune: string;
  /** L'adresse, sans le code postal ni la commune qu'elle répète ; nulle pour une commune seule. */
  adresse: string | null;
  /** Le code de la commune de l'artefact (grain commune : arrondissements remontés). */
  inseeCommune: string;
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
  return [
    ...biens.map((b) => ({ insee: communeParent(b.insee), scopeKey: artifactScopeKey(b.id) })),
    ...territoiresAchetes(territoires).map((t) => ({ insee: communeParent(t.insee), scopeKey: artifactScopeKey(null) })),
  ];
}

/**
 * Les territoires achetés, UN PAR COMMUNE : deux droits sur deux arrondissements de Paris désignent le
 * même artefact communal (75056), donc une seule ligne. Le plus ancien droit date la ligne.
 *
 * UN TERRITOIRE RESTE LISTÉ MÊME QUAND UN BIEN EXISTE DANS SA COMMUNE (revue du 21/10/2026). Le rapport
 * de territoire (14 €) et le dossier d'adresse (25 €) ont chacun leur conclusion, figée sous leur propre
 * scope (`commune`, `logement:<id>`) : effacer l'un rendait une conclusion achetée introuvable.
 */
function territoiresAchetes(territoires: TerritoirePossede[]): TerritoirePossede[] {
  const parCommune = new Map<string, TerritoirePossede>();
  for (const t of territoires) {
    const c = communeParent(t.insee);
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
    miseAJour: stocke.servedVersion > 1,
    tentativePlusRecente: tentative,
  };
}

/** Les échelles, lues dans le dossier SERVI par la fonction du Relevé ; sans dossier lisible, on ne sait pas. */
function echellesDe(stocke: StoredArtifact | undefined): LieuAffiche["echelles"] {
  const dossier = stocke?.artifact?.dossier as Dossier | undefined;
  if (!dossier) return { territoire: "inconnue", autour: "inconnue", logement: "inconnue" };
  try {
    // Le même appel que le Relevé (`DossierDecisionReleve`) : la minute ET la liste complète des contrôles.
    const autres = controlesParEchelle(dossier).flatMap((g) => g.cards.map((c) => lireCarteDuDossier(dossier, c)));
    const parEchelle = Object.fromEntries(lectureDesEchelles(lireDossier(dossier), autres).map((e) => [e.echelle, e.etat === "non_examinee" ? "non_examinee" : e.constats > 0 ? "constats" : "examinee"])) as Record<string, EtatEchelle>;
    return { territoire: parEchelle.territoire ?? "inconnue", autour: parEchelle.quartier ?? "inconnue", logement: parEchelle.logement ?? "inconnue" };
  } catch {
    // Un dossier ancien dont la forme ne se relit pas : on le dit inconnu, on ne l'invente pas.
    return { territoire: "inconnue", autour: "inconnue", logement: "inconnue" };
  }
}

/** L'adresse sans sa fin « 30000 Nîmes » quand elle répète la commune affichée au-dessus. */
export function adresseCourte(label: string, commune: string | null): string {
  if (!commune) return label;
  const fin = new RegExp(`[\\s,]+\\d{5}\\s+${commune.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
  const court = label.replace(fin, "").trim();
  return court.length > 0 ? court : label;
}

/**
 * LES LIEUX, REGROUPÉS PAR COMMUNE. Dans chaque commune : le rapport de territoire s'il a été acheté,
 * puis ses biens (le plus récent d'abord). Les communes viennent dans l'ordre de leur lieu le plus
 * récent. La commune de résidence sans droit ferme la liste.
 *
 * Les liens mènent aux routes existantes, qui vérifient elles-mêmes le droit et posent le lieu lu.
 * Ce sont des Route Handlers : la page les rend en `<a>` natifs, jamais préchargés.
 */
export function assemblerVosLieux(e: EntreeVosLieux): LieuAffiche[] {
  const residenceCommune = e.residence.insee ? communeParent(e.residence.insee) : null;
  const groupes = new Map<string, { recent: string; commune: LieuAffiche[]; biens: { lieu: LieuAffiche; cree: string }[] }>();
  const groupe = (insee: string, date: string) => {
    const g = groupes.get(insee) ?? { recent: date, commune: [], biens: [] };
    if (date > g.recent) g.recent = date;
    groupes.set(insee, g);
    return g;
  };
  const principal = (href: string, c: ConclusionLieu): LienLieu =>
    ({ href, label: c.etat === "disponible" && c.actualite === "projet_change" ? "Ouvrir le dossier pour le mettre à jour" : "Ouvrir le dossier" });

  for (const b of e.biens) {
    const insee = communeParent(b.insee);
    const stocke = e.artefacts.get(cleArtefact(insee, artifactScopeKey(b.id)));
    const echelles = echellesDe(stocke);
    const conclusion = conclusionDe(stocke, e.projetActuel);
    const id = encodeURIComponent(b.id);
    const lue = (x: EtatEchelle) => (x === "inconnue" ? null : x !== "non_examinee");
    const commune = b.city ?? `Commune ${insee}`;
    groupe(insee, b.created_at).biens.push({ cree: b.created_at, lieu: {
      cle: `bien:${b.id}`,
      type: "adresse",
      commune,
      adresse: adresseCourte(b.address_label, b.city),
      inseeCommune: insee,
      acces: b.stripe_payment_intent_id ? "achete" : "ouvert",
      estResidence: residenceCommune === insee,
      echelles,
      conclusion,
      principal: principal(`/rapport/dossiers/ouvrir?id=${id}&vers=dossier`, conclusion),
      // Les pages d'échelle restent ouvrables (droit acquis) ; chacune dit si le dossier servi l'a examinée.
      parEchelle: [
        { href: `/rapport/dossiers/ouvrir?id=${id}&vers=commune`, label: "Territoire", examinee: lue(echelles.territoire) },
        { href: `/rapport/dossiers/ouvrir?id=${id}&vers=autour`, label: "Autour de l'adresse", examinee: lue(echelles.autour) },
        { href: `/rapport/dossiers/ouvrir?id=${id}&vers=logement`, label: "Logement", examinee: lue(echelles.logement) },
      ],
    } });
  }

  for (const t of territoiresAchetes(e.territoires)) {
    const insee = communeParent(t.insee);
    const stocke = e.artefacts.get(cleArtefact(insee, artifactScopeKey(null)));
    const conclusion = conclusionDe(stocke, e.projetActuel);
    groupe(insee, t.createdAt).commune.push({
      cle: `territoire:${insee}`,
      type: "commune",
      commune: t.commune ?? `Commune ${insee}`,
      adresse: null,
      inseeCommune: insee,
      acces: "achete",
      estResidence: residenceCommune === insee,
      echelles: echellesDe(stocke),
      conclusion,
      // Le nom n'est plus transmis : `/rapport/territoire` le lit dans le référentiel (FUT-119).
      principal: principal(`/rapport/territoire?insee=${encodeURIComponent(t.insee)}`, conclusion),
      parEchelle: [],
    });
  }

  const out = [...groupes.values()]
    .sort((a, b) => b.recent.localeCompare(a.recent))
    .flatMap((g) => [...g.commune, ...g.biens.sort((x, y) => y.cree.localeCompare(x.cree)).map((x) => x.lieu)]);

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
        commune: e.residence.commune ?? `Commune ${residenceCommune}`,
        adresse: null,
        inseeCommune: residenceCommune,
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
