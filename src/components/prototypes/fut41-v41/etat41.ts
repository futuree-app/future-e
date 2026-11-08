// FUT-41 V4.1 · état et gestes du prototype, en réducteur PUR. Tout reste en mémoire : rien n'est
// enregistré, payé, analysé ni envoyé.
import {
  analyseServie, appliquer, communeCommeLieu, criteresDepasses, libelleCritere, LIBELLE_STATUT, NOM_CRITERE,
  type Analyse, type CleCritere, type Commune, type Logement, type ModificationProjet, type NatureObservation, type Projet, type Recherche, type Statut,
} from "./modele41.ts";
import { AUJOURDHUI, ANALYSE_CONVENTION, COMMUNES, LOGEMENTS, PROJET, RAPPORT_ANGERS, SCENARIOS41, type Vue41 } from "./scenarios41.ts";

export type Droits = "unite" | "pass";
export type Etat41 = Recherche & { scenario: string; vue: Vue41; droits: Droits; passUtilisees: number; annonce: string | null };

export type Geste41 =
  | { type: "charger"; scenario: string }
  | { type: "naviguer"; vue: Vue41 }
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
  | { type: "adopter"; modification: ModificationProjet }
  | { type: "photo"; id: string; url: string | null }
  | { type: "droits"; droits: Droits };

export const PASS_INCLUSES = 10;

export function etatInitial41(id = "ref"): Etat41 {
  const sc = SCENARIOS41.find((s) => s.id === id) ?? SCENARIOS41[0]!;
  return {
    scenario: sc.id, vue: sc.vue, droits: "unite", passUtilisees: 3, annonce: null,
    projet: structuredClone(PROJET),
    communes: COMMUNES.filter((c) => sc.communes.includes(c.insee)).map((c) => structuredClone(c)),
    logements: LOGEMENTS.filter((l) => sc.logements.includes(l.id)).map((l) => structuredClone(l)).map((l) => (sc.ajuste ? sc.ajuste(l) : l)),
  };
}

const majL = (e: Etat41, id: string, f: (l: Logement) => Logement) => e.logements.map((l) => (l.id === id ? f(l) : l));
const majC = (e: Etat41, id: string, f: (c: Commune) => Commune) => e.communes.map((c) => (`c:${c.insee}` === id || c.insee === id ? f(c) : c));
const nom = (e: Etat41, id: string) => e.logements.find((l) => l.id === id)?.libelle ?? e.communes.find((c) => `c:${c.insee}` === id)?.nom ?? "";

/** Mise à jour simulée : nouvelle version sous le Projet courant ; seules les issues à mesure changent. */
export function miseAJour(a: Analyse, projet: Projet, libelle: string): Analyse {
  const registre = a.registre.map((r) => {
    const c = projet.criteres.find((x) => x.cle === r.cle);
    if (!c || c.valeur == null || !r.mesure) return r;
    return { ...r, issue: r.mesure.valeur <= c.valeur ? "favorable" as const : c.nature === "sans_compromis" ? "incompatible" as const : "mismatch" as const };
  });
  const bloc = registre.find((r) => r.issue === "incompatible");
  const cb = bloc ? projet.criteres.find((x) => x.cle === bloc.cle) : undefined;
  return {
    ...a, version: a.version + 1, generatedAt: AUJOURDHUI, engineVersion: "engine-6", simulee: true,
    projet: { revision: projet.revision, date: projet.date, criteres: projet.criteres },
    // Une mise à jour relit aussi les sources : les millésimes passent à ceux du jour (fixture : BPE 2025).
    registre: registre.map((r) => ({ ...r, sources: r.sources.map((s) => (s.id === "bpe" ? { ...s, millesime: "2025" } : s)), preuve: r.preuve && r.preuve.source === "BPE" ? { ...r.preuve, date: "2025" } : r.preuve })),
    conclusion: bloc && cb ? { etiquette: "Condition non tenue", ton: "critique", phrase: `${libelle} ne tient pas votre condition sans compromis : ${libelleCritere(cb).toLowerCase()}.` } : a.conclusion,
  };
}

export function reduire41(e: Etat41, g: Geste41): Etat41 {
  switch (g.type) {
    case "charger": return { ...etatInitial41(g.scenario), droits: e.droits };
    case "naviguer": return { ...e, vue: g.vue, annonce: null };
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
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l, statut: "a_etudier", journal: [...l.journal, { date: AUJOURDHUI, type: "reactive", texte: "Remis en course." }] })), annonce: `${nom(e, g.id)} est de nouveau en course.` };
    case "repondre":
      return { ...e, logements: majL(e, g.id, (l) => {
        const v = l.verifications.find((x) => x.id === g.verification);
        if (!v) return l;
        const nature: NatureObservation = v.moment === "avant_engagement" ? "declaration" : "observation";
        const rep = g.valeur ? v.reponses.find((x) => x.valeur === g.valeur) : undefined;
        return { ...l,
          verifications: l.verifications.map((x) => (x.id !== g.verification ? x : g.valeur ? { ...x, reponse: { valeur: g.valeur, date: AUJOURDHUI, nature } } : { ...x, reponse: undefined })),
          journal: rep ? [...l.journal, { date: AUJOURDHUI, type: "verification", texte: `${NOM_CRITERE[v.cle]} : « ${rep.libelle} ».` }] : l.journal };
      }), annonce: g.valeur ? "Réponse enregistrée : la lecture du logement est mise à jour." : "Réponse retirée." };
    case "observer":
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l,
        observations: [...l.observations, { id: `o-${l.id}-${l.observations.length + 1}`, date: AUJOURDHUI, nature: g.nature, texte: g.texte, ...(g.cle ? { cle: g.cle } : {}) }],
        journal: [...l.journal, { date: AUJOURDHUI, type: "observation", texte: "Note ajoutée." }] })), annonce: "Note enregistrée." };
    case "ajouter_logement": {
      const existe = e.communes.some((c) => c.insee === g.logement.commune.insee);
      const c0 = COMMUNES.find((c) => c.insee === g.logement.commune.insee);
      return { ...e, logements: [...e.logements, g.logement], communes: existe || !c0 ? e.communes : [...e.communes, { ...structuredClone(c0), lecture: c0.lecture === "rapport" ? "gratuite" : c0.lecture, analyses: [] }], vue: { ecran: "fiche", id: g.logement.id }, annonce: `${g.logement.libelle} est ajouté à vos pistes.` };
    }
    case "ajouter_commune": {
      if (e.communes.some((c) => c.insee === g.insee)) return e;
      const c0 = COMMUNES.find((c) => c.insee === g.insee);
      if (!c0) return e;
      return { ...e, communes: [...e.communes, { ...structuredClone(c0), lecture: "gratuite", analyses: [], apercu: c0.apercu.length ? c0.apercu : ["Repères nationaux disponibles en lecture gratuite."] }], annonce: `${c0.nom} est ajoutée à vos pistes, en lecture gratuite.` };
    }
    case "adresse":
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l, adresse: g.adresse, journal: [...l.journal, { date: AUJOURDHUI, type: "statut", texte: `Adresse ajoutée : ${g.adresse}.` }] })), annonce: "Adresse ajoutée." };
    case "analyser": {
      if (g.id !== "convention") return e;
      const pass = e.droits === "pass";
      return { ...e, passUtilisees: pass ? e.passUtilisees + 1 : e.passUtilisees,
        logements: majL(e, g.id, (l) => ({ ...l, droit: "adresse", viaPass: pass, analyses: [ANALYSE_CONVENTION], journal: [...l.journal, { date: AUJOURDHUI, type: "analyse", texte: `Dossier d'adresse simulé${pass ? " (Pass)" : ""}.` }] })),
        annonce: "Analyse simulée : les abords et le logement sont lus." };
    }
    case "examiner": {
      if (g.insee !== "49007") return e;
      const pass = e.droits === "pass";
      return { ...e, communes: majC(e, g.insee, (c) => ({ ...c, lecture: "rapport", analyses: [RAPPORT_ANGERS], viaPass: pass })), annonce: "Rapport de territoire simulé : Angers est lue pour votre Projet." };
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
        return a && criteresDepasses(a, e.projet).length ? { ...l, analyses: [...l.analyses, miseAJour(a, e.projet, l.libelle)], journal: [...l.journal, { date: AUJOURDHUI, type: "analyse", texte: `Analyse mise à jour (simulée, version ${a.version + 1}) ; la version ${a.version} reste lisible.` }] } : l;
      }), annonce: "Analyse mise à jour (simulée) ; l'ancienne version reste lisible." };
    }
    case "adopter": {
      const p = appliquer(e.projet, g.modification);
      return { ...e, projet: { ...p, revision: e.projet.revision + 1, date: AUJOURDHUI }, annonce: `Votre Projet passe à la révision ${e.projet.revision + 1}. Les analyses déjà faites restent lisibles telles quelles.` };
    }
    case "photo":
      return { ...e, logements: majL(e, g.id, (l) => ({ ...l, photo: g.url })) };
  }
}

export function vueVersHash41(v: Vue41): string {
  if (v.ecran === "accueil") return "#/";
  if (v.ecran === "fiche") return `#/logement/${v.id}`;
  if (v.ecran === "commune") return `#/commune/${v.id}`;
  if (v.ecran === "releve") return `#/releve/${v.id}`;
  return `#/comparer/${(v.selection ?? []).join(",")}${v.echelle ? `/${v.echelle}` : ""}`;
}
export function hashVersVue41(h: string): Vue41 | null {
  const p = h.replace(/^#\/?/, "").split("/");
  if (p[0] === "" || p[0] === undefined) return { ecran: "accueil" };
  if (p[0] === "logement" && p[1]) return { ecran: "fiche", id: p[1] };
  if (p[0] === "commune" && p[1]) return { ecran: "commune", id: p[1] };
  if (p[0] === "releve" && p[1]) return { ecran: "releve", id: p[1] };
  if (p[0] === "comparer") return { ecran: "comparer", selection: (p[1] ?? "").split(",").filter(Boolean), ...(p[2] ? { echelle: p[2] } : {}) };
  return null;
}
