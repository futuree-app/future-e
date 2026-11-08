// FUT-41 V4 · l'état du prototype et ses gestes, en réducteur PUR (testé sans rendu). Tout se passe en
// mémoire, sur des fixtures : rien n'est enregistré, payé, analysé ni envoyé.
import {
  analyseServie, appliquer, criteresDepasses, dateCourte, libelleCritere, LIBELLE_STATUT, NOM_CRITERE,
  type Analyse, type CleCritere, type Lieu, type ModificationProjet, type NatureObservation, type Projet, type Statut,
} from "./modele.ts";
import { AUJOURDHUI, ANALYSE_SIMULEE_LAVOIR, PROJET, SCENARIOS, TOUS, type Vue } from "./scenarios.ts";

export type ModeDroits = "unite" | "pass";

export type Etat = {
  scenario: string;
  lieux: Lieu[];
  projet: Projet;
  vue: Vue;
  droits: ModeDroits;
  /** Analyses d'adresse consommées sur le Pass (hypothèse de revue, aucun quota décidé). */
  passUtilisees: number;
  /** La dernière phrase d'état à annoncer (région `aria-live`). */
  annonce: string | null;
};

export type Geste =
  | { type: "charger"; scenario: string }
  | { type: "naviguer"; vue: Vue }
  | { type: "statut"; lieu: string; statut: Exclude<Statut, "ecarte"> }
  | { type: "ecarter"; lieu: string; raison: string; cle: CleCritere | null }
  | { type: "reactiver"; lieu: string }
  | { type: "repondre"; lieu: string; verification: string; valeur: string | null }
  | { type: "observer"; lieu: string; texte: string; nature: NatureObservation; cle: CleCritere | null }
  | { type: "ajouter"; lieu: Lieu }
  | { type: "adresse"; lieu: string; adresse: string }
  | { type: "analyser"; lieu: string }
  | { type: "mettre_a_jour"; lieu: string }
  | { type: "adopter"; modification: ModificationProjet }
  | { type: "droits"; mode: ModeDroits };

export const PASS_INCLUSES = 10;

export function etatInitial(scenario = "complet"): Etat {
  const sc = SCENARIOS.find((x) => x.id === scenario) ?? SCENARIOS[0]!;
  const lieux = TOUS.filter((x) => sc.lieux.includes(x.id)).map((x) => structuredClone(x)).map((x) => (sc.ajuste ? sc.ajuste(x) : x));
  return { scenario: sc.id, lieux, projet: structuredClone(PROJET), vue: sc.vue, droits: "unite", passUtilisees: 3, annonce: null };
}

const maj = (e: Etat, id: string, f: (l: Lieu) => Lieu): Lieu[] => e.lieux.map((l) => (l.id === id ? f(l) : l));
const nomDe = (e: Etat, id: string) => e.lieux.find((l) => l.id === id)?.libelle ?? "";

/**
 * METTRE À JOUR UNE ANALYSE (simulé) : une version n+1 sous le Projet courant ; la version servie
 * avant reste lisible. Seules les issues qu'une mesure figée permet de recalculer changent (la règle
 * d'une condition à seuil) ; les autres sont reprises. Une vraie mise à jour relance le moteur
 * (`/api/dossier/actualiser`, gratuite pour un dossier acquis).
 */
export function analyseMiseAJour(a: Analyse, projet: Projet, lieu: Lieu): Analyse {
  const registre = a.registre.map((r) => {
    const c = projet.criteres.find((x) => x.cle === r.cle);
    if (!c || c.valeur == null || !r.mesure) return r;
    const tient = r.mesure.valeur <= c.valeur;
    const issue = tient ? "favorable" as const : c.nature === "sans_compromis" ? "incompatible" as const : "mismatch" as const;
    const constat = r.constat;
    return { ...r, issue, constat };
  });
  const bloquante = registre.find((r) => r.issue === "incompatible");
  const c = bloquante ? projet.criteres.find((x) => x.cle === bloquante.cle) : undefined;
  return {
    ...a,
    version: a.version + 1,
    generatedAt: AUJOURDHUI,
    projet: { revision: projet.revision, date: projet.date, criteres: projet.criteres },
    registre,
    simulee: true,
    conclusion: bloquante && c
      ? { etiquette: "Condition non tenue", ton: "critique", phrase: `${lieu.libelle} ne tient pas votre condition sans compromis : ${libelleCritere(c).toLowerCase()}.` }
      : a.conclusion,
  };
}

export function reduire(e: Etat, g: Geste): Etat {
  switch (g.type) {
    case "charger": return { ...etatInitial(g.scenario), droits: e.droits };
    case "naviguer": return { ...e, vue: g.vue, annonce: null };
    case "statut":
      return { ...e, lieux: maj(e, g.lieu, (l) => ({ ...l, statut: g.statut, journal: [...l.journal, { date: AUJOURDHUI, type: "statut", texte: `${LIBELLE_STATUT[g.statut]}.` }] })), annonce: `${nomDe(e, g.lieu)} : ${LIBELLE_STATUT[g.statut].toLowerCase()}.` };
    case "ecarter": {
      const c = g.cle ? e.projet.criteres.find((x) => x.cle === g.cle) : undefined;
      return {
        ...e,
        lieux: maj(e, g.lieu, (l) => ({ ...l, statut: "ecarte", journal: [...l.journal, {
          date: AUJOURDHUI, type: "ecarte", texte: "Écarté.", raison: g.raison,
          // LE CONTEXTE MINIMAL (réserve de minimisation du 08/11) : la révision, et la seule condition
          // invoquée avec sa valeur d'alors. Jamais une copie du Projet entier.
          contexte: { revision: e.projet.revision, ...(c ? { cle: c.cle, condition: libelleCritere(c).toLowerCase(), valeur: c.valeur } : {}) },
        }] })),
        annonce: `${nomDe(e, g.lieu)} est écarté. La raison et votre Projet d'aujourd'hui sont gardés.`,
      };
    }
    case "reactiver":
      return { ...e, lieux: maj(e, g.lieu, (l) => ({ ...l, statut: "a_etudier", journal: [...l.journal, { date: AUJOURDHUI, type: "reactive", texte: "Remis en course : à étudier." }] })), annonce: `${nomDe(e, g.lieu)} est de nouveau en course.` };
    case "repondre":
      return {
        ...e,
        lieux: maj(e, g.lieu, (l) => {
          const v = l.verifications.find((x) => x.id === g.verification);
          if (!v) return l;
          const nature: NatureObservation = v.moment === "avant_engagement" ? "declaration" : "observation";
          const rep = g.valeur ? v.reponses.find((r) => r.valeur === g.valeur) : undefined;
          return {
            ...l,
            verifications: l.verifications.map((x) => (x.id !== g.verification ? x : g.valeur ? { ...x, reponse: { valeur: g.valeur, date: AUJOURDHUI, nature } } : { ...x, reponse: undefined })),
            journal: rep ? [...l.journal, { date: AUJOURDHUI, type: "verification", texte: `${NOM_CRITERE[v.cle]} : « ${rep.libelle} » (${nature === "declaration" ? "déclaration" : "votre observation"}).` }] : l.journal,
          };
        }),
        annonce: g.valeur ? "Réponse enregistrée. La lecture du logement est réévaluée ci-dessous." : "Réponse retirée.",
      };
    case "observer":
      return {
        ...e,
        lieux: maj(e, g.lieu, (l) => ({
          ...l,
          observations: [...l.observations, { id: `o-${l.id}-${l.observations.length + 1}`, date: AUJOURDHUI, nature: g.nature, texte: g.texte, ...(g.cle ? { cle: g.cle } : {}) }],
          journal: [...l.journal, { date: AUJOURDHUI, type: "observation", texte: "Note ajoutée." }],
        })),
        annonce: "Note enregistrée. Elle reste la vôtre : aucune preuve publique ne change.",
      };
    case "ajouter":
      return { ...e, lieux: [...e.lieux, g.lieu], vue: { ecran: "fiche", lieu: g.lieu.id }, annonce: `${g.lieu.libelle} est ajouté à vos logements.` };
    case "adresse":
      return { ...e, lieux: maj(e, g.lieu, (l) => ({ ...l, adresse: g.adresse, journal: [...l.journal, { date: AUJOURDHUI, type: "statut", texte: `Adresse ajoutée : ${g.adresse}.` }] })), annonce: "Adresse ajoutée." };
    case "analyser": {
      if (g.lieu !== "lavoir") return e;
      const pass = e.droits === "pass";
      return {
        ...e,
        passUtilisees: pass ? e.passUtilisees + 1 : e.passUtilisees,
        lieux: maj(e, g.lieu, (l) => ({ ...l, droit: "adresse", analyses: [...l.analyses, ANALYSE_SIMULEE_LAVOIR], journal: [...l.journal, { date: AUJOURDHUI, type: "analyse", texte: `Dossier d'adresse (simulé${pass ? ", sur le Pass" : ""}) : commune, abords et logement analysés.` }] })),
        annonce: "Analyse simulée : l'adresse est lue aux trois échelles.",
      };
    }
    case "mettre_a_jour":
      return {
        ...e,
        lieux: maj(e, g.lieu, (l) => {
          const a = analyseServie(l);
          if (!a || !criteresDepasses(a, e.projet).length) return l;
          return { ...l, analyses: [...l.analyses, analyseMiseAJour(a, e.projet, l)], journal: [...l.journal, { date: AUJOURDHUI, type: "analyse", texte: `Analyse mise à jour avec votre Projet du ${dateCourte(e.projet.date)} (simulé, version ${a.version + 1}) ; la version ${a.version} reste lisible.` }] };
        }),
        annonce: "Analyse mise à jour (simulée). L'ancienne version reste lisible.",
      };
    case "adopter": {
      const p = appliquer(e.projet, g.modification);
      return { ...e, projet: { ...p, revision: e.projet.revision + 1, date: AUJOURDHUI }, annonce: `Votre Projet passe à la révision ${e.projet.revision + 1}. Les analyses existantes restent lisibles telles qu'elles ont été faites.` };
    }
    case "droits": return { ...e, droits: g.mode };
  }
}

// ── L'adresse de la vue (le lieu est porté par l'URL, décision Y3) ────────────────────────────

export function vueVersHash(v: Vue): string {
  switch (v.ecran) {
    case "decision": return "#/decision";
    case "point": return "#/point";
    case "fiche": return `#/lieu/${v.lieu}`;
    case "releve": return `#/releve/${v.lieu}`;
    case "comparer": return `#/comparer/${v.mode ?? "ensemble"}/${(v.selection ?? []).join(",")}${v.critere ? `/${v.critere}` : ""}`;
  }
}

export function hashVersVue(h: string): Vue | null {
  const p = h.replace(/^#\/?/, "").split("/");
  if (p[0] === "decision") return { ecran: "decision" };
  if (p[0] === "point") return { ecran: "point" };
  if (p[0] === "lieu" && p[1]) return { ecran: "fiche", lieu: p[1] };
  if (p[0] === "releve" && p[1]) return { ecran: "releve", lieu: p[1] };
  if (p[0] === "comparer") return { ecran: "comparer", mode: p[1] === "face" ? "face" : "ensemble", selection: (p[2] ?? "").split(",").filter(Boolean), ...(p[3] ? { critere: p[3] } : {}) };
  return null;
}
