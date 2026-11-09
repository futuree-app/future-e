// FUT-41 V5 · état et gestes du prototype, en réducteur PUR. Tout reste en mémoire : rien n'est
// enregistré, payé, analysé ni envoyé. Les gestes d'analyse ne font apparaître que des résultats
// fictifs écrits d'avance (T4 rue de la Convention, T4 place Sainte-Anne, rapport d'Angers).
import {
  analyseServie, appliquer, communeCommeLieu, criteresDepasses, libelleCritere, LIBELLE_STATUT, NOM_CRITERE,
  type CleCritere, type Commune, type Logement, type ModificationProjet, type NatureObservation, type Recherche, type Statut,
} from "./modele5.ts";
import { miseAJour } from "../fut41-v41/etat41.ts";
import {
  AUJOURDHUI, ANALYSE_CONVENTION, ANALYSE_SAINTE_ANNE, COMMUNES, HISTORIQUE_PROJET, LOGEMENTS, PROJET, RAPPORT_ANGERS, SCENARIOS5,
  type Revision, type Vue5,
} from "./scenarios5.ts";

export type Droits = "unite" | "pass";
/** `comparaison` : la dernière comparaison ouverte (mode, sélection, duo affiché sur téléphone), retrouvée au retour. */
export type Comparaison = { mode: NonNullable<Vue5["mode"]>; selection: string[]; duel: [number, number] };
export type Etat5 = Recherche & { scenario: string; vue: Vue5; droits: Droits; passUtilisees: number; annonce: string | null; historique: Revision[]; comparaison: Comparaison | null };

export type Geste5 =
  | { type: "charger"; scenario: string }
  | { type: "naviguer"; vue: Vue5 }
  | { type: "statut"; id: string; statut: Exclude<Statut, "ecarte"> }
  | { type: "ecarter"; id: string; raison: string; cle: CleCritere | null }
  | { type: "reactiver"; id: string }
  | { type: "repondre"; id: string; verification: string; valeur: string | null }
  | { type: "observer"; id: string; texte: string; nature: NatureObservation; cle: CleCritere | null }
  | { type: "ajouter_logement"; logement: Logement }
  | { type: "ajouter_commune"; insee: string }
  | { type: "adresse"; id: string; adresse: string }
  | { type: "analyser"; id: string }
  | { type: "examiner"; insee: string }
  | { type: "mettre_a_jour"; id: string }
  | { type: "adopter"; modification: ModificationProjet; texte: string }
  | { type: "photo"; id: string; url: string | null }
  | { type: "droits"; droits: Droits }
  | { type: "duel"; duel: [number, number] };

export const PASS_INCLUSES = 10;
/** Les analyses que le prototype sait simuler (aucune génération réelle). */
export const ANALYSES_SIMULEES: Record<string, typeof ANALYSE_CONVENTION> = { convention: ANALYSE_CONVENTION, "sainte-anne": ANALYSE_SAINTE_ANNE };
export const peutSimuler = (id: string) => id in ANALYSES_SIMULEES || id === "c:49007";

export function etatInitial5(id = "ref"): Etat5 {
  const sc = SCENARIOS5.find((s) => s.id === id) ?? SCENARIOS5[0]!;
  return {
    scenario: sc.id, vue: sc.vue, droits: "unite", passUtilisees: 3, annonce: null,
    comparaison: sc.vue.ecran === "comparer" ? { mode: sc.vue.mode ?? "logements", selection: sc.vue.selection ?? [], duel: [0, 1] } : null,
    projet: structuredClone(PROJET), historique: structuredClone(HISTORIQUE_PROJET),
    communes: COMMUNES.filter((c) => sc.communes.includes(c.insee)).map((c) => structuredClone(c)),
    logements: LOGEMENTS.filter((l) => sc.logements.includes(l.id)).map((l) => structuredClone(l)).map((l) => (sc.ajuste ? sc.ajuste(l) : l)),
  };
}

const majL = (e: Etat5, id: string, f: (l: Logement) => Logement) => e.logements.map((l) => (l.id === id ? f(l) : l));
const majC = (e: Etat5, id: string, f: (c: Commune) => Commune) => e.communes.map((c) => (`c:${c.insee}` === id || c.insee === id ? f(c) : c));
const nom = (e: Etat5, id: string) => e.logements.find((l) => l.id === id)?.libelle ?? e.communes.find((c) => `c:${c.insee}` === id)?.nom ?? "";
const communeGratuite = (c0: Commune): Commune => ({ ...structuredClone(c0), statut: "envisagee", lecture: "gratuite", analyses: [], apercu: c0.apercu.length ? c0.apercu : ["Repères nationaux disponibles en lecture gratuite."] });

export function reduire5(e: Etat5, g: Geste5): Etat5 {
  switch (g.type) {
    case "charger": return { ...etatInitial5(g.scenario), droits: e.droits };
    case "naviguer": {
      // Retrouver sa comparaison : Comparer ouvert sans sélection reprend la dernière (même mode).
      if (g.vue.ecran !== "comparer") return { ...e, vue: g.vue, annonce: null };
      const mode = g.vue.mode ?? e.comparaison?.mode ?? "logements";
      const reprise = g.vue.selection === undefined && e.comparaison && e.comparaison.mode === mode;
      const selection = reprise ? e.comparaison!.selection : g.vue.selection ?? [];
      const meme = e.comparaison && e.comparaison.mode === mode && e.comparaison.selection.join() === selection.join();
      return { ...e, vue: { ...g.vue, mode, selection }, comparaison: { mode, selection, duel: meme ? e.comparaison!.duel : [0, 1] }, annonce: null };
    }
    case "duel": return e.comparaison ? { ...e, comparaison: { ...e.comparaison, duel: g.duel } } : e;
    case "droits": return { ...e, droits: g.droits };
    case "statut":
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l, statut: g.statut, journal: [...l.journal, { date: AUJOURDHUI, type: "statut", texte: `${LIBELLE_STATUT[g.statut]}.` }] })), annonce: `${nom(e, g.id)} : ${LIBELLE_STATUT[g.statut].toLowerCase()}.` };
    case "ecarter": {
      const c = g.cle ? e.projet.criteres.find((x) => x.cle === g.cle) : undefined;
      const contexte = { revision: e.projet.revision, ...(c ? { cle: c.cle, condition: libelleCritere(c).toLowerCase(), valeur: c.valeur } : {}) };
      if (g.id.startsWith("c:")) return { ...e, communes: majC(e, g.id, (x) => ({ ...x, statut: "ecartee", raisonEcart: g.raison })), annonce: `${nom(e, g.id)} est écartée ; sa raison est gardée.` };
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l, statut: "ecarte", journal: [...l.journal, { date: AUJOURDHUI, type: "ecarte", texte: "Écarté.", raison: g.raison, contexte }] })), annonce: `${nom(e, g.id)} est écarté ; sa raison et votre Projet d'aujourd'hui sont gardés.` };
    }
    case "reactiver":
      if (g.id.startsWith("c:")) return { ...e, communes: majC(e, g.id, (x) => ({ ...x, statut: "envisagee" })), annonce: `${nom(e, g.id)} est de nouveau envisagée.` };
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l, statut: "a_etudier", journal: [...l.journal, { date: AUJOURDHUI, type: "reactive", texte: "Remis en course ; la raison de l'écart reste dans l'historique." }] })), annonce: `${nom(e, g.id)} est de nouveau en course.` };
    case "repondre":
      return { ...e, logements: majL(e, g.id, (l) => {
        const v = l.verifications.find((x) => x.id === g.verification);
        if (!v) return l;
        const nature: NatureObservation = v.moment === "avant_engagement" ? "declaration" : "observation";
        const rep = g.valeur ? v.reponses.find((x) => x.valeur === g.valeur) : undefined;
        return { ...l,
          verifications: l.verifications.map((x) => (x.id !== g.verification ? x : g.valeur ? { ...x, reponse: { valeur: g.valeur, date: AUJOURDHUI, nature } } : { ...x, reponse: undefined })),
          journal: rep ? [...l.journal, { date: AUJOURDHUI, type: "verification", texte: `${NOM_CRITERE[v.cle]} : « ${rep.libelle} » (${nature === "declaration" ? "déclaration" : "votre observation"}).` }] : l.journal };
      }), annonce: g.valeur ? "Réponse enregistrée avec sa date et son origine. La donnée publique ne change pas." : "Réponse retirée." };
    case "observer":
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l,
        observations: [...l.observations, { id: `o-${l.id}-${l.observations.length + 1}`, date: AUJOURDHUI, nature: g.nature, texte: g.texte, ...(g.cle ? { cle: g.cle } : {}) }],
        journal: [...l.journal, { date: AUJOURDHUI, type: "observation", texte: "Note ajoutée." }] })), annonce: "Note enregistrée avec son origine." };
    case "ajouter_logement": {
      const existe = e.communes.some((c) => c.insee === g.logement.commune.insee);
      const c0 = COMMUNES.find((c) => c.insee === g.logement.commune.insee);
      const communes = existe ? e.communes.map((c) => (c.insee === g.logement.commune.insee ? { ...c, statut: "envisagee" as const } : c)) : c0 ? [...e.communes, communeGratuite(c0)] : e.communes;
      return { ...e, logements: [...e.logements, g.logement], communes, vue: { ecran: "logement", id: g.logement.id }, annonce: `${g.logement.libelle} est ajouté${existe ? "" : `, avec sa commune ${c0?.nom ?? ""}`}.` };
    }
    case "ajouter_commune": {
      if (e.communes.some((c) => c.insee === g.insee && c.statut === "ecartee")) return { ...e, communes: majC(e, g.insee, (x) => ({ ...x, statut: "envisagee" })), annonce: "Commune de nouveau envisagée." };
      if (e.communes.some((c) => c.insee === g.insee)) return e;
      const c0 = COMMUNES.find((c) => c.insee === g.insee);
      if (!c0) return e;
      return { ...e, communes: [...e.communes, communeGratuite(c0)], annonce: `${c0.nom} est ajoutée, en lecture gratuite.` };
    }
    case "adresse":
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l, adresse: g.adresse, journal: [...l.journal, { date: AUJOURDHUI, type: "statut", texte: `Adresse renseignée : ${g.adresse}. Pas encore analysée.` }] })), annonce: "Adresse enregistrée. Elle n'est pas encore analysée." };
    case "analyser": {
      const a = ANALYSES_SIMULEES[g.id];
      if (!a) return e;
      const pass = e.droits === "pass";
      return { ...e, passUtilisees: pass ? e.passUtilisees + 1 : e.passUtilisees,
        logements: majL(e, g.id, (l) => ({ ...l, droit: "adresse", viaPass: pass, analyses: [structuredClone(a)], journal: [...l.journal, { date: AUJOURDHUI, type: "analyse", texte: `Dossier d'adresse simulé${pass ? " (Pass)" : ""}.` }] })),
        annonce: "Analyse simulée : les abords et le logement sont étudiés." };
    }
    case "examiner": {
      if (g.insee !== "49007") return e;
      const pass = e.droits === "pass";
      return { ...e, communes: majC(e, g.insee, (c) => ({ ...c, lecture: "rapport", analyses: [structuredClone(RAPPORT_ANGERS)], viaPass: pass })), annonce: "Rapport simulé : Angers est étudiée pour votre Projet." };
    }
    case "mettre_a_jour": {
      if (g.id.startsWith("c:")) {
        return { ...e, communes: majC(e, g.id, (c) => {
          const a = analyseServie(communeCommeLieu(c));
          return a && criteresDepasses(a, e.projet).length ? { ...c, analyses: [...c.analyses, miseAJour(a, e.projet, c.nom)] } : c;
        }), annonce: "Rapport mis à jour (simulé) ; l'ancienne version reste lisible." };
      }
      return { ...e, logements: majL(e, g.id, (l) => {
        const a = analyseServie(l);
        return a && criteresDepasses(a, e.projet).length ? { ...l, analyses: [...l.analyses, miseAJour(a, e.projet, l.libelle)], journal: [...l.journal, { date: AUJOURDHUI, type: "analyse", texte: `Dossier mis à jour (simulé, version ${a.version + 1}) ; la version ${a.version} reste lisible.` }] } : l;
      }), annonce: "Dossier mis à jour (simulé) ; l'ancienne version reste lisible." };
    }
    case "adopter": {
      const p = appliquer(e.projet, g.modification);
      const revision = e.projet.revision + 1;
      return { ...e, projet: { ...p, revision, date: AUJOURDHUI }, historique: [...e.historique, { revision, date: AUJOURDHUI, changement: g.texte }], annonce: "Votre Projet est modifié. Les analyses déjà faites restent lisibles telles quelles." };
    }
    case "photo":
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l, photo: g.url })) };
  }
}

// ── Adresses ─────────────────────────────────────────────────────────────────────────────────

export function vueVersHash5(v: Vue5): string {
  switch (v.ecran) {
    case "ensemble": return "#/";
    case "projet": return v.ancre ? `#/projet/${v.ancre}${v.essai ? `/${v.essai}` : ""}` : "#/projet";
    case "logement": return `#/logement/${v.id}${v.ancre ? `/${v.ancre}` : ""}`;
    case "commune": return `#/commune/${v.id}`;
    case "releve": return `#/releve/${v.id}`;
    case "comparer": return `#/comparer/${v.mode ?? "logements"}${v.selection?.length ? `/${v.selection.join(",")}` : ""}`;
  }
}

export function hashVersVue5(h: string): Vue5 | null {
  const p = h.replace(/^#\/?/, "").split("/");
  if (!p[0]) return { ecran: "ensemble" };
  if (p[0] === "projet") return { ecran: "projet", ...(p[1] ? { ancre: p[1] } : {}), ...(p[1] && p[2] ? { essai: p[2] } : {}) };
  if (p[0] === "logement" && p[1]) return { ecran: "logement", id: p[1], ...(p[2] ? { ancre: p[2] } : {}) };
  if (p[0] === "commune" && p[1]) return { ecran: "commune", id: p[1] };
  if (p[0] === "releve" && p[1]) return { ecran: "releve", id: p[1] };
  if (p[0] === "comparer") return { ecran: "comparer", mode: p[1] === "communes" ? "communes" : "logements", selection: (p[2] ?? "").split(",").filter(Boolean) };
  return null;
}
