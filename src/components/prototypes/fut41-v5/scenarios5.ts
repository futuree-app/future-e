// FUT-41 V5 · DONNÉES FICTIVES. Les noms et la position des villes sont réels ; TOUTES les valeurs,
// analyses, mesures, annonces, adresses de logements et preuves sont INVENTÉES pour la revue. Aucune
// ne décrit la situation réelle de Nantes, Rennes ou Angers. Le bandeau du prototype le rappelle.
//
// La V5 reprend les fixtures de la V4.1 (sans les modifier) et corrige trois choses :
//   - la position des villes : Rennes est à ~100 km au nord de Nantes, Angers à ~80 km à l'est
//     (la V4.1 plaçait Angers à l'ouest) ;
//   - S8 : « la chambre donne sur cour » ne prouve pas le calme de nuit (réponse réécrite) ;
//   - le dossier ancien de Saint-Félix mesure 23 min : il tenait la limite d'alors (30 min), et
//     pourrait ne plus tenir la limite actuelle (20 min). Rien n'est conclu à sa place.
import type { Analyse, LigneRegistre, Projet, Source } from "./modele5.ts";
import type { Commune, Logement } from "./modele5.ts";
import { ANGERS as A41, ANALYSE_CONVENTION, N1, N2, N3, N4, NANTES as NA41, PROJET as P41, R1, RAPPORT_ANGERS, RENNES as RE41 } from "../fut41-v41/scenarios41.ts";

export { ANALYSE_CONVENTION, RAPPORT_ANGERS };
export const AUJOURDHUI = "2026-11-08";
export const PROJET: Projet = structuredClone(P41);

/** Les révisions du Projet, pour « Ce qui a changé ». La révision 3 est l'actuelle. */
export type Revision = { revision: number; date: string; changement: string };
export const HISTORIQUE_PROJET: Revision[] = [
  { revision: 1, date: "2026-09-01", changement: "Projet créé : acheter, une gare à moins de 30 min, des nuits fraîches l'été, le calme, un médecin, une vie de quartier." },
  { revision: 2, date: "2026-09-12", changement: "Budget déclaré : 320 000 €." },
  { revision: 3, date: "2026-10-08", changement: "La gare passe de 30 à 20 min, toujours sans compromis." },
];

const S = {
  gares: { id: "gares", nom: "Gares SNCF", millesime: "2025" },
  bpe25: { id: "bpe", nom: "BPE", millesime: "2025" },
  bpe24: { id: "bpe", nom: "BPE", millesime: "2024" },
  drias: { id: "drias", nom: "DRIAS", millesime: "2020" },
  dpe: { id: "dpe", nom: "ADEME DPE", millesime: "2025" },
  bruit: { id: "bruit", nom: "Cerema, cartes de bruit", millesime: "2022" },
  osm: { id: "osm", nom: "OpenStreetMap", millesime: "2025" },
} satisfies Record<string, Source>;
const l = (o: LigneRegistre) => o;
const REV3: Analyse["projet"] = structuredClone(NA41.analyses[0]!.projet);
const ana = (o: Omit<Analyse, "conventionsVersion" | "version"> & { version?: number }): Analyse => ({ version: 1, conventionsVersion: "conv-2026-10", ...o });

// ── Communes (positions en km depuis Nantes, nord en haut : approximations des vraies villes) ──
export const NANTES: Commune = { ...structuredClone(NA41), position: { x: 0, y: 0 } };
export const RENNES: Commune = { ...structuredClone(RE41), position: { x: -9, y: -100 } };
// C (revue Work) : la densité de généralistes est une PRÉSENCE ; elle ne dit pas si un médecin accepte
// de nouveaux patients. Les fixtures héritées de la V4.1 la donnaient « favorable » : corrigé ici, comme
// le fait déjà le moteur de production (`src/lib/decision/autour-facts.ts`).
const medecinPrudent = (constat: string) => (x: LigneRegistre): LigneRegistre => (x.cle === "medecin" && x.issue === "favorable" ? { ...x, issue: "to_confirm", constat } : x);
RENNES.analyses = RENNES.analyses.map((a) => ({ ...a, registre: a.registre.map(medecinPrudent("Densité de généralistes au-dessus de la moyenne ; leur disponibilité n'est pas connue.")) }));
export const ANGERS: Commune = { ...structuredClone(A41), position: { x: 76, y: -28 } };

// ── Logements repris de la V4.1, corrigés pour S8 et le dossier ancien ───────────────────────
const fosse: Logement = structuredClone(N1);
fosse.verifications = fosse.verifications.map((v) => {
  if (v.id === "v-med") return { ...v, reponses: [
    { valeur: "oui", libelle: "Oui, l'un des deux", effet: "Votre appel indique qu'un cabinet proche accepte de nouveaux patients. Il vaut pour ce cabinet, à cette date.", reste: "La donnée publique ne change pas : elle compte les médecins, pas leurs places." },
    { valeur: "non", libelle: "Non, aucun", effet: "Deux cabinets proches ne prennent pas de nouveaux patients, d'après votre appel.", reste: "D'autres cabinets n'ont pas été appelés." },
  ] };
  if (v.id === "v-fen") return { ...v, question: "De quel côté donne la chambre : sur le quai ou sur cour ?", pourquoi: "Des nuits plus chaudes sont projetées à Nantes ; pouvoir dormir fenêtre ouverte dépend du côté et du bruit.", reponses: [
    // S8 : une cour peut être bruyante, et une visite ne dit rien des nuits d'été. La réponse dit ce
    // qu'elle établit (le côté), ce qu'elle rend possible (aérer), et ce qui reste inconnu (le bruit
    // de nuit, la chaleur). Elle ne lève pas la réserve « calme » des abords, mesurée sur le quai.
    { valeur: "cour", libelle: "Sur cour, d'après ma visite", effet: "La chambre donne sur cour : aérer la nuit devient envisageable. La réserve sur le calme du quai ne la concerne peut-être pas.", reste: "Le bruit de la cour la nuit et la chaleur de la chambre en été restent à vérifier : une visite en novembre ne les dit pas." },
    { valeur: "quai", libelle: "Sur le quai", effet: "La chambre donne sur un quai mesuré à 65 à 70 dB le jour : dormir fenêtre ouverte sera difficile.", reste: "La température de la chambre en été reste inconnue." },
  ] };
  return v;
});
const convention: Logement = structuredClone(N2);
const viarme: Logement = structuredClone(N3);
const felix: Logement = structuredClone(N4);
felix.analyses = felix.analyses.map((a) => ({ ...a, registre: a.registre.map((x) => (x.cle === "gare" ? { ...x, mesure: { valeur: 23, unite: "min" }, constat: "La gare est à 23 min à pied depuis l'adresse." } : x)).map(medecinPrudent("Des généralistes nombreux ; leur disponibilité n'est pas connue.")) }));
const thabor: Logement = structuredClone(R1);

// ── Logements ajoutés pour la situation « dix candidats » (non analysés pour la plupart) ─────
const vide: Pick<Logement, "visiteLe" | "analyses" | "observations" | "verifications" | "photo"> = { visiteLe: null, analyses: [], observations: [], verifications: [], photo: null };
const chantenay: Logement = {
  ...vide, id: "chantenay", libelle: "T2 Chantenay", commune: { insee: "44109", nom: "Nantes" }, adresse: "40 rue de la Marseillaise, Nantes",
  annonce: { url: null, site: null, nature: "vente", montant: 198000, surface: 41, pieces: 2 }, statut: "ecarte", ajouteLe: "2026-10-01", droit: "aucun", position: null,
  journal: [{ date: "2026-10-01", type: "ajoute", texte: "Ajouté (à vendre, 198 000 €, déclaré)." }, { date: "2026-10-04", type: "ecarte", texte: "Écarté.", raison: "Trop petit pour deux", contexte: { revision: 2 } }],
};
const doulon: Logement = {
  ...vide, id: "doulon", libelle: "Maison à Doulon", commune: { insee: "44109", nom: "Nantes" }, adresse: null,
  annonce: { url: "https://annonces.exemple/vente/maison-doulon", site: "annonces.exemple", nature: "vente", montant: 335000, surface: 95, pieces: 4 }, statut: "a_etudier", ajouteLe: "2026-11-07", droit: "aucun", position: null,
  journal: [{ date: "2026-11-07", type: "ajoute", texte: "Ajouté depuis une annonce, sans adresse exacte (à vendre, 335 000 €, déclaré)." }],
};
const sainteAnne: Logement = {
  ...vide, id: "sainte-anne", libelle: "T4 place Sainte-Anne", commune: { insee: "35238", nom: "Rennes" }, adresse: "2 place Sainte-Anne, Rennes",
  annonce: { url: "https://immobilier.exemple/annonce/t4-sainte-anne", site: "immobilier.exemple", nature: "vente", montant: 318000, surface: 84, pieces: 4 }, statut: "a_etudier", ajouteLe: "2026-11-02", droit: "aucun", position: null,
  journal: [{ date: "2026-11-02", type: "ajoute", texte: "Ajouté depuis une annonce (à vendre, 318 000 €, déclaré)." }],
};
const colombier: Logement = {
  ...vide, id: "colombier", libelle: "T3 Colombier", commune: { insee: "35238", nom: "Rennes" }, adresse: "9 rue du Colombier, Rennes",
  annonce: { url: null, site: null, nature: "vente", montant: 349000, surface: 74, pieces: 3 }, statut: "ecarte", ajouteLe: "2026-09-20", droit: "aucun", position: null,
  journal: [{ date: "2026-09-20", type: "ajoute", texte: "Ajouté (à vendre, 349 000 €, déclaré)." }, { date: "2026-09-25", type: "ecarte", texte: "Écarté.", raison: "Au-dessus du budget", contexte: { revision: 2 } }],
};
const doutre: Logement = {
  ...vide, id: "doutre", libelle: "T3 quartier Doutre", commune: { insee: "49007", nom: "Angers" }, adresse: null,
  annonce: { url: "https://annonces.exemple/vente/t3-doutre", site: "annonces.exemple", nature: "vente", montant: 236000, surface: 69, pieces: 3 }, statut: "a_etudier", ajouteLe: "2026-11-05", droit: "aucun", position: null,
  journal: [{ date: "2026-11-05", type: "ajoute", texte: "Ajouté depuis une annonce, sans adresse exacte (à vendre, 236 000 €, déclaré)." }],
};

export const COMMUNES: Commune[] = [NANTES, RENNES, ANGERS];
export const LOGEMENTS: Logement[] = [felix, fosse, viarme, convention, thabor, chantenay, doulon, sainteAnne, colombier, doutre];

// Une analyse d'adresse simulée pour Sainte-Anne (la V5 en simule deux : Convention et Sainte-Anne).
export const ANALYSE_SAINTE_ANNE: Analyse = ana({
  id: "art-sainte-anne", generatedAt: AUJOURDHUI, engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV3, simulee: true,
  conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "T4 place Sainte-Anne répond à votre Projet, avec un compromis : le calme aux abords." },
  registre: [
    l({ cle: "gare", issue: "favorable", grain: "secteur", mesure: { valeur: 17, unite: "min" }, constat: "La gare est à 17 min à pied depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
    l({ cle: "nuits", issue: "to_confirm", grain: "batiment", constat: "Diagnostic de 2019, classe D ; orientation non décrite.", preuve: { source: "ADEME DPE", date: "2025" }, sources: [S.dpe, S.drias] }),
    l({ cle: "calme", issue: "reserve", grain: "secteur", constat: "Place animée le soir : 60 à 65 dB.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
    l({ cle: "medecin", issue: "to_confirm", grain: "commune", constat: "Densité de généralistes au-dessus de la moyenne ; leur disponibilité n'est pas connue.", preuve: { source: "BPE", date: "2024" }, sources: [S.bpe24] }),
    l({ cle: "quartier", issue: "favorable", grain: "secteur", constat: "Marché, commerces et métro à 3 min.", preuve: { source: "BPE, OpenStreetMap", date: "2025" }, sources: [S.bpe25, S.osm] }),
  ],
});
void S.bpe25;

// ── Scénarios ───────────────────────────────────────────────────────────────────────────────

export type Ecran5 = "ensemble" | "comparer" | "projet" | "commune" | "logement" | "releve";
export type Mode = "communes" | "logements";
/** `essai` : le changement essayé dans Comparer, transmis à Mon Projet (« nature.quartier », « valeur.gare.20 »). */
export type Vue5 = { ecran: Ecran5; id?: string; mode?: Mode; selection?: string[]; ancre?: string; essai?: string };

export type Scenario5 = {
  id: string; titre: string; resume: string;
  communes: string[]; logements: string[]; vue: Vue5;
  ajuste?: (l: Logement) => Logement;
};

export const SCENARIOS5: Scenario5[] = [
  { id: "ref", titre: "Deux appartements à Nantes, un à Rennes (référence)", resume: "Deux rapports de territoire. À Nantes, un appartement analysé et un autre seulement enregistré ; à Rennes, une annonce sans adresse.", communes: ["44109", "35238"], logements: ["fosse", "convention", "thabor"], vue: { ecran: "ensemble" } },
  { id: "communes", titre: "Nantes contre Rennes, sans adresse", resume: "Deux communes, aucun logement : comparer les deux territoires pour votre Projet.", communes: ["44109", "35238"], logements: [], vue: { ecran: "ensemble" } },
  { id: "meme", titre: "Plusieurs logements dans une même commune", resume: "Trois logements à Nantes : un analysé, un analysé sous votre ancien Projet, un seulement enregistré ; un quatrième écarté.", communes: ["44109"], logements: ["fosse", "felix", "convention", "viarme"], vue: { ecran: "comparer", mode: "logements", selection: ["fosse", "felix", "convention"] } },
  { id: "non-analyse", titre: "Un logement pas encore analysé", resume: "Ce que la commune dit déjà du T4 rue de la Convention, et ce qu'une analyse de l'adresse apprendrait.", communes: ["44109", "35238"], logements: ["fosse", "convention", "thabor"], vue: { ecran: "logement", id: "convention" } },
  { id: "ancien", titre: "Un dossier fait sous votre ancien Projet", resume: "Saint-Félix a été analysé quand la gare était à 30 min ; Rennes aussi. Votre limite est aujourd'hui de 20 min.", communes: ["44109", "35238"], logements: ["fosse", "felix"], vue: { ecran: "logement", id: "felix" } },
  { id: "visite", titre: "Après une visite", resume: "Le quai de la Fosse a été visité le 6 nov. : répondre aux questions, noter ce qui a été vu.", communes: ["44109", "35238"], logements: ["fosse", "convention", "thabor"], vue: { ecran: "logement", id: "fosse", ancre: "verifier" },
    ajuste: (x) => (x.id === "fosse" ? { ...x, statut: "visite", visiteLe: "2026-11-06", journal: [...x.journal.slice(0, 2), { date: "2026-11-06", type: "statut", texte: "Visité." }] } : x) },
  // Deuxième revue Work : un scénario FICTIF conçu pour éprouver un arbitrage établi entre deux
  // adresses (même date, mêmes règles, même Projet, mêmes données). Il sert à tester l'interaction ;
  // seules de vraies analyses diront si de tels arbitrages se présentent.
  { id: "arbitrage", titre: "Deux adresses analysées : un vrai arbitrage", resume: "Deux appartements de Nantes analysés dans les mêmes conditions : l'un offre le calme et des nuits fraîches, l'autre la vie de quartier. Données inventées pour éprouver la comparaison.", communes: ["44109"], logements: ["fosse", "convention"], vue: { ecran: "comparer", mode: "logements", selection: ["fosse", "convention"] },
    ajuste: (x) => (x.id === "convention" ? { ...x, statut: "a_visiter", droit: "adresse", analyses: [{ ...structuredClone(ANALYSE_CONVENTION), generatedAt: "2026-11-04", simulee: false }], journal: [...x.journal, { date: "2026-11-04", type: "analyse", texte: "Dossier d'adresse : commune, abords et logement analysés." }] } : x) },
  { id: "dix", titre: "Dix logements, dont trois écartés", resume: "Trois communes, dix logements : trois écartés pour leur raison, plusieurs sans adresse ou sans analyse.", communes: ["44109", "35238", "49007"], logements: LOGEMENTS.map((x) => x.id), vue: { ecran: "ensemble" } },
  { id: "vide", titre: "Je découvre Ma décision", resume: "Le Projet existe ; aucune commune ni aucun logement n'est encore gardé.", communes: [], logements: [], vue: { ecran: "ensemble" } },
];
