// FUT-41 V4.1 · DONNÉES FICTIVES. Les noms de Nantes, Rennes et Angers sont réels ; TOUTES les
// valeurs, analyses, mesures, annonces, adresses de logements et preuves sont INVENTÉES pour la revue.
// Aucune ne décrit la situation réelle de ces communes. Le bandeau du prototype le rappelle en permanence.
import type { Analyse, LigneRegistre, Projet, Source } from "../fut41-v4/modele.ts";
import type { Commune, Logement } from "./modele41.ts";

export const AUJOURDHUI = "2026-11-08";

const BASE: Projet["criteres"] = [
  { cle: "gare", nature: "sans_compromis", valeur: 20 },
  { cle: "nuits", nature: "priorite", poids: 3 },
  { cle: "calme", nature: "priorite", poids: 2 },
  { cle: "medecin", nature: "priorite", poids: 2 },
  { cle: "quartier", nature: "priorite", poids: 1 },
];
export const PROJET: Projet = { revision: 3, date: "2026-10-08", intention: "achat", criteres: BASE, budget: { montant: 320000, periodicite: "total" } };
const REV2: Analyse["projet"] = { revision: 2, date: "2026-09-12", criteres: BASE.map((c) => (c.cle === "gare" ? { ...c, valeur: 30 } : c)) };
const REV3: Analyse["projet"] = { revision: 3, date: "2026-10-08", criteres: BASE };

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
const ana = (o: Omit<Analyse, "conventionsVersion" | "version"> & { version?: number }): Analyse => ({ version: 1, conventionsVersion: "conv-2026-10", ...o });

// ── Lignes communales (une seule lecture de chaque commune, réutilisée par ses dossiers d'adresse) ──
const NANTES_L = {
  gare: l({ cle: "gare", issue: "favorable", grain: "commune", constat: "Une gare TGV et TER dans la commune.", preuve: { source: "Gares SNCF", date: "2025" }, sources: [S.gares] }),
  nuits: l({ cle: "nuits", issue: "mismatch", grain: "commune", constat: "Parmi les 30 % de communes où les nuits chaudes augmentent le plus d'ici 2050.", preuve: { source: "DRIAS", date: "2020" }, sources: [S.drias] }),
  calme: l({ cle: "calme", issue: "reserve", grain: "commune", constat: "Une part importante des logements exposée au bruit routier.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
  medecin: l({ cle: "medecin", issue: "to_confirm", grain: "commune", constat: "Des généralistes nombreux ; leur disponibilité n'est pas connue.", preuve: { source: "BPE", date: "2025" }, sources: [S.bpe25] }),
  quartier: l({ cle: "quartier", issue: "favorable", grain: "commune", constat: "Commerces et services parmi les plus denses de France.", preuve: { source: "BPE", date: "2025" }, sources: [S.bpe25] }),
};

export const NANTES: Commune = {
  insee: "44109", nom: "Nantes", statut: "envisagee", ajouteLe: "2026-09-20", lecture: "rapport",
  analyses: [ana({ id: "art-nantes", generatedAt: "2026-10-02", engineVersion: "engine-6", perimetre: "commune", projet: REV3,
    conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "Nantes répond moins bien à une de vos priorités : des nuits fraîches l'été." },
    registre: Object.values(NANTES_L) })],
  apercu: [], position: { x: 0, y: 0 }, gare: { x: 0.6, y: -0.3 },
};

export const RENNES: Commune = {
  insee: "35238", nom: "Rennes", statut: "envisagee", ajouteLe: "2026-09-15", lecture: "rapport",
  analyses: [ana({ id: "art-rennes", generatedAt: "2026-09-18", engineVersion: "engine-6", perimetre: "commune", projet: REV2,
    conclusion: { etiquette: "Correspondance", ton: "positif", phrase: "Rennes répond à votre Projet." },
    registre: [
      l({ cle: "gare", issue: "favorable", grain: "commune", constat: "Une gare TGV et TER dans la commune.", preuve: { source: "Gares SNCF", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "favorable", grain: "commune", constat: "Hausse des nuits chaudes plus modérée que la moyenne d'ici 2050.", preuve: { source: "DRIAS", date: "2020" }, sources: [S.drias] }),
      l({ cle: "calme", issue: "favorable", grain: "commune", constat: "Exposition au bruit routier plus faible que dans les grandes villes comparables.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
      l({ cle: "medecin", issue: "favorable", grain: "commune", constat: "Densité de généralistes au-dessus de la moyenne.", preuve: { source: "BPE", date: "2024" }, sources: [S.bpe24] }),
      l({ cle: "quartier", issue: "favorable", grain: "commune", constat: "Commerces et services très denses.", preuve: { source: "BPE", date: "2024" }, sources: [S.bpe24] }),
    ] })],
  apercu: [], position: { x: -95, y: -55 }, gare: { x: -94.6, y: -55.4 },
};

export const ANGERS: Commune = {
  insee: "49007", nom: "Angers", statut: "envisagee", ajouteLe: "2026-11-04", lecture: "gratuite", analyses: [],
  apercu: ["Commerces et services : parmi les 20 % de communes les mieux dotées.", "Nuits chaudes vers 2050 : dans la moitié haute des communes de France."],
  position: { x: -78, y: 22 }, gare: { x: -78, y: 22.4 },
};

// ── Logements ─────────────────────────────────────────────────────────────────────────────────
export const N1: Logement = {
  id: "fosse", libelle: "T3 quai de la Fosse", commune: { insee: "44109", nom: "Nantes" }, adresse: "8 quai de la Fosse, Nantes",
  annonce: { url: "https://annonces.exemple/vente/t3-quai-fosse", site: "annonces.exemple", nature: "vente", montant: 289000, surface: 68, pieces: 3 },
  statut: "a_visiter", ajouteLe: "2026-10-12", visiteLe: "2026-11-14", droit: "adresse", position: { x: -1.2, y: 0.4 }, photo: null, viaPass: true,
  analyses: [ana({ id: "art-fosse", generatedAt: "2026-10-15", engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV3,
    conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "T3 quai de la Fosse répond à votre Projet, avec deux compromis : le calme aux abords et des nuits chaudes à la commune." },
    registre: [
      l({ cle: "gare", issue: "favorable", grain: "secteur", mesure: { valeur: 9, unite: "min" }, constat: "La gare est à 9 min à vélo depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "to_confirm", grain: "batiment", constat: "Diagnostic de 2021, classe D ; séjour orienté sud-ouest, sans protection solaire décrite.", preuve: { source: "ADEME DPE", date: "2025" }, sources: [S.dpe, S.drias] }),
      l({ cle: "calme", issue: "reserve", grain: "secteur", constat: "Quai très circulé : 65 à 70 dB le jour.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
      NANTES_L.medecin,
      l({ cle: "quartier", issue: "favorable", grain: "secteur", constat: "Commerces, marché et tramway à moins de 5 min à pied.", preuve: { source: "BPE, OpenStreetMap", date: "2025" }, sources: [S.bpe25, S.osm] }),
    ] })],
  journal: [
    { date: "2026-10-12", type: "ajoute", texte: "Ajouté depuis une annonce (à vendre, 289 000 €, déclaré)." },
    { date: "2026-10-15", type: "analyse", texte: "Dossier d'adresse (Pass Recherche) : commune, abords et logement analysés." },
    { date: "2026-11-05", type: "statut", texte: "À visiter : visite prévue le 14 nov." },
  ],
  observations: [],
  verifications: [
    { id: "v-med", cle: "medecin", moment: "avant_visite", question: "Appeler deux cabinets de Nantes proches du quai : acceptent-ils de nouveaux patients ?", pourquoi: "La commune compte de nombreux médecins, mais leur disponibilité ne se mesure pas.",
      reponses: [
        { valeur: "oui", libelle: "Oui, l'un des deux", effet: "Un médecin disponible devient votre observation favorable, datée. Elle vaut pour les logements de Nantes proches de ce cabinet.", reste: "Une réponse au téléphone vaut pour aujourd'hui." },
        { valeur: "non", libelle: "Non, aucun", effet: "Un médecin disponible reste un point faible pour vous à Nantes.", reste: "D'autres cabinets n'ont pas été appelés." },
      ] },
    { id: "v-fen", cle: "nuits", moment: "sur_place", question: "La chambre peut-elle rester fenêtre ouverte la nuit, compte tenu du bruit du quai ?", pourquoi: "Des nuits plus chaudes sont projetées à Nantes ; dormir fenêtre ouverte dépend de l'orientation et du bruit.",
      reponses: [
        { valeur: "cour", libelle: "Oui, la chambre donne sur cour", effet: "La ventilation nocturne devient possible d'après votre visite ; le bruit du quai ne touche pas la chambre.", reste: "Une visite en novembre ne dit pas la température d'une chambre en juillet." },
        { valeur: "quai", libelle: "Non, elle donne sur le quai", effet: "Le bruit et la chaleur se cumulent dans la chambre : un compromis lourd pour vos nuits.", reste: "La température réelle l'été reste inconnue." },
      ] },
    { id: "v-dpe", cle: "nuits", moment: "avant_engagement", question: "Demander le diagnostic complet et les factures d'été (climatisation, ventilateurs).", pourquoi: "C'est l'information la plus directe sur la chaleur dans ce logement.",
      reponses: [
        { valeur: "frais", libelle: "Rien d'anormal l'été", effet: "Une déclaration favorable du vendeur, enregistrée comme telle : elle n'a pas la force d'une mesure.", reste: "Aucune mesure indépendante." },
        { valeur: "chaud", libelle: "Climatisation ajoutée en 2023", effet: "Un indice clair de chaleur estivale dans ce logement.", reste: "L'ampleur n'est pas mesurée." },
      ] },
  ],
};

export const N2: Logement = {
  id: "convention", libelle: "T4 rue de la Convention", commune: { insee: "44109", nom: "Nantes" }, adresse: "21 rue de la Convention, Nantes",
  annonce: { url: "https://annonces.exemple/vente/t4-convention", site: "annonces.exemple", nature: "vente", montant: 315000, surface: 82, pieces: 4 },
  statut: "a_etudier", ajouteLe: "2026-11-03", visiteLe: null, droit: "aucun", position: { x: 1.8, y: -1.6 }, photo: null,
  analyses: [], journal: [{ date: "2026-11-03", type: "ajoute", texte: "Ajouté depuis une annonce (à vendre, 315 000 €, déclaré)." }], observations: [], verifications: [],
};

export const N3: Logement = {
  id: "viarme", libelle: "T2 place Viarme", commune: { insee: "44109", nom: "Nantes" }, adresse: "3 place Viarme, Nantes",
  annonce: { url: "https://annonces.exemple/vente/t2-viarme", site: "annonces.exemple", nature: "vente", montant: 214000, surface: 46, pieces: 2 },
  statut: "ecarte", ajouteLe: "2026-10-10", visiteLe: null, droit: "adresse", position: { x: -0.4, y: -1.9 }, photo: null,
  analyses: [ana({ id: "art-viarme", generatedAt: "2026-10-12", engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV3,
    conclusion: { etiquette: "Condition non tenue", ton: "critique", phrase: "T2 place Viarme ne tient pas votre condition sans compromis : une gare à moins de 20 min." },
    registre: [
      l({ cle: "gare", issue: "incompatible", grain: "secteur", mesure: { valeur: 24, unite: "min" }, constat: "La gare est à 24 min à pied depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "favorable", grain: "batiment", constat: "Logement traversant au 2e étage, diagnostic de 2024 classe C.", preuve: { source: "ADEME DPE", date: "2025" }, sources: [S.dpe, S.drias] }),
      l({ cle: "calme", issue: "favorable", grain: "secteur", constat: "Place piétonne.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
      NANTES_L.medecin,
      l({ cle: "quartier", issue: "favorable", grain: "secteur", constat: "Commerces à 3 min.", preuve: { source: "BPE, OpenStreetMap", date: "2025" }, sources: [S.bpe25, S.osm] }),
    ] })],
  journal: [
    { date: "2026-10-10", type: "ajoute", texte: "Ajouté depuis une annonce (à vendre, 214 000 €, déclaré)." },
    { date: "2026-10-12", type: "analyse", texte: "Dossier d'adresse : commune, abords et logement analysés." },
    { date: "2026-10-13", type: "ecarte", texte: "Écarté.", raison: "Gare à 24 min à pied", contexte: { revision: 3, cle: "gare", condition: "une gare à moins de 20 min", valeur: 20 } },
  ],
  observations: [], verifications: [],
};

export const N4: Logement = {
  id: "felix", libelle: "T3 Saint-Félix", commune: { insee: "44109", nom: "Nantes" }, adresse: "14 rue Saint-Félix, Nantes",
  annonce: { url: "https://annonces.exemple/vente/t3-saint-felix", site: "annonces.exemple", nature: "vente", montant: 299000, surface: 71, pieces: 3 },
  statut: "a_etudier", ajouteLe: "2026-08-30", visiteLe: null, droit: "adresse", position: { x: 0.9, y: -2.6 }, photo: null,
  analyses: [ana({ id: "art-felix", generatedAt: "2026-09-02", engineVersion: "engine-5", perimetre: "commune+adresse", projet: REV2,
    conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "T3 Saint-Félix répond moins bien à une de vos priorités : des nuits fraîches l'été." },
    registre: [
      l({ cle: "gare", issue: "favorable", grain: "secteur", mesure: { valeur: 16, unite: "min" }, constat: "La gare est à 16 min à pied depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "mismatch", grain: "batiment", constat: "Dernier étage sous toiture, diagnostic de 2015 classe E.", preuve: { source: "ADEME DPE", date: "2024" }, sources: [S.dpe, S.drias] }),
      l({ cle: "calme", issue: "favorable", grain: "secteur", constat: "Rue résidentielle, sous 55 dB.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
      l({ cle: "medecin", issue: "favorable", grain: "commune", constat: "Des généralistes nombreux.", preuve: { source: "BPE", date: "2024" }, sources: [S.bpe24] }),
      l({ cle: "quartier", issue: "favorable", grain: "secteur", constat: "Commerces à 6 min.", preuve: { source: "BPE, OpenStreetMap", date: "2024" }, sources: [S.bpe24, S.osm] }),
    ] })],
  journal: [
    { date: "2026-08-30", type: "ajoute", texte: "Ajouté depuis une annonce (à vendre, 299 000 €, déclaré)." },
    { date: "2026-09-02", type: "analyse", texte: "Dossier d'adresse, sous votre Projet du 12 sept. (une gare à moins de 30 min)." },
  ],
  observations: [], verifications: [],
};

export const R1: Logement = {
  id: "thabor", libelle: "T3 près du Thabor", commune: { insee: "35238", nom: "Rennes" }, adresse: null,
  annonce: { url: "https://immobilier.exemple/annonce/t3-thabor", site: "immobilier.exemple", nature: "vente", montant: 298000, surface: 70, pieces: 3 },
  statut: "a_etudier", ajouteLe: "2026-11-06", visiteLe: null, droit: "aucun", position: null, photo: null,
  analyses: [], journal: [{ date: "2026-11-06", type: "ajoute", texte: "Ajouté depuis une annonce, sans adresse exacte (à vendre, 298 000 €, déclaré)." }], observations: [], verifications: [],
};

export const COMMUNES: Commune[] = [NANTES, RENNES, ANGERS];
export const LOGEMENTS: Logement[] = [N4, N1, N3, N2, R1];

// ── Scénarios ───────────────────────────────────────────────────────────────────────────────

export type Ecran41 = "accueil" | "fiche" | "commune" | "comparer" | "releve";
export type Vue41 = { ecran: Ecran41; id?: string; selection?: string[]; echelle?: string };

export type Scenario41 = {
  id: string; code: string; titre: string; resume: string;
  communes: string[]; logements: string[]; vue: Vue41;
  ajuste?: (l: Logement) => Logement;
};

export const SCENARIOS41: Scenario41[] = [
  { id: "ref", code: "★", titre: "Nantes ou Rennes (référence)", resume: "Deux rapports de territoire ; à Nantes un appartement analysé et un autre seulement enregistré ; à Rennes une annonce sans adresse.", communes: ["44109", "35238"], logements: ["fosse", "convention", "thabor"], vue: { ecran: "accueil" } },
  { id: "complet", code: "+", titre: "Toute la recherche", resume: "Trois communes (dont Angers en lecture gratuite), cinq logements dont un dossier ancien et un écarté.", communes: ["44109", "35238", "49007"], logements: LOGEMENTS.map((x) => x.id), vue: { ecran: "accueil" } },
  { id: "vide", code: "A", titre: "Je découvre Ma décision", resume: "Le Projet existe ; aucune piste n'est encore gardée.", communes: [], logements: [], vue: { ecran: "accueil" } },
  { id: "b", code: "B", titre: "Nantes ou Rennes, sans logement", resume: "Comparer deux communes sur le seul Territoire.", communes: ["44109", "35238"], logements: [], vue: { ecran: "comparer", selection: ["c:44109", "c:35238"] } },
  { id: "c", code: "C", titre: "Trois annonces : laquelle visiter ?", resume: "Ce qui se compare à la commune, aux abords, au logement ; ce qu'il manque pour aller plus loin.", communes: ["44109", "35238"], logements: ["fosse", "convention", "thabor"], vue: { ecran: "comparer", selection: ["fosse", "convention", "thabor"] } },
  { id: "d", code: "D", titre: "Un logement pas encore analysé", resume: "Ce que futur•e sait déjà grâce à la commune, et ce qu'une analyse apprendrait.", communes: ["44109", "35238"], logements: ["fosse", "convention", "thabor"], vue: { ecran: "fiche", id: "convention" } },
  { id: "e", code: "E", titre: "Deux analyses de dates différentes", resume: "Saint-Félix (2 sept., anciennes règles, données 2024) face au quai de la Fosse (15 oct.).", communes: ["44109"], logements: ["fosse", "felix"], vue: { ecran: "comparer", selection: ["fosse", "felix"] } },
  { id: "f", code: "F", titre: "Mon Projet a changé depuis", resume: "Rennes a été lue quand la gare était à 30 min ; Nantes à 20 min.", communes: ["44109", "35238"], logements: [], vue: { ecran: "commune", id: "c:35238" } },
  { id: "g", code: "G", titre: "Après une visite", resume: "Le quai de la Fosse a été visité le 6 nov. : noter ce qui a été vu, répondre aux questions.", communes: ["44109", "35238"], logements: ["fosse", "convention", "thabor"], vue: { ecran: "fiche", id: "fosse" },
    ajuste: (x) => (x.id === "fosse" ? { ...x, statut: "visite", visiteLe: "2026-11-06", journal: [...x.journal.slice(0, 2), { date: "2026-11-06", type: "statut", texte: "Visité." }] } : x) },
  { id: "h", code: "H", titre: "Écarter, puis retrouver pourquoi", resume: "Le T2 place Viarme a été écarté pour sa gare ; et si vous acceptiez 30 min ?", communes: ["44109", "35238"], logements: ["fosse", "convention", "thabor", "viarme"], vue: { ecran: "fiche", id: "viarme" } },
];

// ── Analyses SIMULÉES par les gestes du prototype (aucune génération réelle) ─────────────────
export const ANALYSE_CONVENTION: Analyse = ana({
  id: "art-convention", generatedAt: AUJOURDHUI, engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV3, simulee: true,
  conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "T4 rue de la Convention répond à votre Projet, avec un compromis : des nuits chaudes à la commune." },
  registre: [
    l({ cle: "gare", issue: "favorable", grain: "secteur", mesure: { valeur: 14, unite: "min" }, constat: "La gare est à 14 min à vélo depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
    l({ cle: "nuits", issue: "favorable", grain: "batiment", constat: "Logement traversant, volets extérieurs décrits par le diagnostic de 2023, classe C.", preuve: { source: "ADEME DPE", date: "2025" }, sources: [S.dpe, S.drias] }),
    l({ cle: "calme", issue: "favorable", grain: "secteur", constat: "Rue résidentielle : sous 55 dB le jour.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
    NANTES_L.medecin,
    l({ cle: "quartier", issue: "reserve", grain: "secteur", constat: "Commerces à 12 min à pied.", preuve: { source: "BPE, OpenStreetMap", date: "2025" }, sources: [S.bpe25, S.osm] }),
  ],
});

export const RAPPORT_ANGERS: Analyse = ana({
  id: "art-angers", generatedAt: AUJOURDHUI, engineVersion: "engine-6", perimetre: "commune", projet: REV3, simulee: true,
  conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "Angers répond à votre Projet, avec un compromis : des nuits fraîches l'été." },
  registre: [
    l({ cle: "gare", issue: "favorable", grain: "commune", constat: "Une gare TGV et TER dans la commune.", preuve: { source: "Gares SNCF", date: "2025" }, sources: [S.gares] }),
    l({ cle: "nuits", issue: "reserve", grain: "commune", constat: "Nuits chaudes en hausse, dans la moitié haute des communes.", preuve: { source: "DRIAS", date: "2020" }, sources: [S.drias] }),
    l({ cle: "calme", issue: "favorable", grain: "commune", constat: "Exposition au bruit routier modérée.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
    l({ cle: "medecin", issue: "to_confirm", grain: "commune", constat: "Densité de généralistes dans la moyenne ; disponibilité inconnue.", preuve: { source: "BPE", date: "2025" }, sources: [S.bpe25] }),
    l({ cle: "quartier", issue: "favorable", grain: "commune", constat: "Commerces et services très denses.", preuve: { source: "BPE", date: "2025" }, sources: [S.bpe25] }),
  ],
});
