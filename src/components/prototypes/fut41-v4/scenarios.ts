// FUT-41 V4 · DONNÉES FICTIVES DU PROTOTYPE. Communes, adresses, annonces, analyses, mesures et
// preuves sont INVENTÉES (communes fictives aux codes 99xxx, qui n'existent pas). Aucune ne vient
// d'un compte, d'un dossier vendu ni d'un appel de modèle. Les formes suivent les contrats réels
// (`modele.ts`) pour que la revue juge la composition, pas une maquette décorative.
import type { Analyse, Lieu, LigneRegistre, Projet, Source } from "./modele.ts";

export const AUJOURDHUI = "2026-11-08";

// ── Le Projet ────────────────────────────────────────────────────────────────────────────────

const CRITERES_BASE: Projet["criteres"] = [
  { cle: "mer", nature: "sans_compromis", valeur: 15 },
  { cle: "gare", nature: "sans_compromis", valeur: 20 },
  { cle: "nuits", nature: "priorite", poids: 3 },
  { cle: "calme", nature: "priorite", poids: 2 },
  { cle: "medecin", nature: "priorite", poids: 2 },
  { cle: "quartier", nature: "priorite", poids: 1 },
];

/** Révision 3 du 8 oct. : la gare passe de 30 à 20 minutes. */
export const PROJET: Projet = {
  revision: 3,
  date: "2026-10-08",
  intention: "location",
  criteres: CRITERES_BASE,
  budget: { montant: 1100, periodicite: "mois" },
};

const REV2: Analyse["projet"] = {
  revision: 2, date: "2026-09-12",
  criteres: CRITERES_BASE.map((c) => (c.cle === "gare" ? { ...c, valeur: 30 } : c)),
};
const REV3: Analyse["projet"] = { revision: 3, date: "2026-10-08", criteres: CRITERES_BASE };

// ── Sources (millésimes fictifs, noms réels des familles de sources) ─────────────────────────

const S = {
  ign: { id: "ign-bdcarto", nom: "IGN BD Carto", millesime: "2024" },
  gares: { id: "gares", nom: "Gares SNCF", millesime: "2025" },
  bpe25: { id: "bpe", nom: "BPE", millesime: "2025" },
  bpe24: { id: "bpe", nom: "BPE", millesime: "2024" },
  drias: { id: "drias", nom: "DRIAS", millesime: "2020" },
  dpe: { id: "dpe", nom: "ADEME DPE", millesime: "2025" },
  bruit: { id: "bruit", nom: "Cerema, cartes de bruit", millesime: "2022" },
  osm: { id: "osm", nom: "OpenStreetMap", millesime: "2025" },
} satisfies Record<string, Source>;

const l = (o: LigneRegistre) => o;

function analyse(o: Omit<Analyse, "conventionsVersion" | "version"> & { version?: number }): Analyse {
  return { version: 1, conventionsVersion: "conv-2026-10", ...o };
}

// ── Les lieux ────────────────────────────────────────────────────────────────────────────────

const PORT_ANVEL = { insee: "99001", nom: "Port-Anvel" };
const PLOUBREC = { insee: "99002", nom: "Ploubrec" };
const KERMOAL = { insee: "99003", nom: "Kermoal" };
const LANDEVEN = { insee: "99004", nom: "Landéven" };
const TY_MOOR = { insee: "99005", nom: "Ty-Moor" };

const MER_PORT_ANVEL = l({ cle: "mer", issue: "favorable", grain: "commune", mesure: { valeur: 3, unite: "km" }, constat: "La mer est à 3 km du centre de Port-Anvel.", preuve: { source: "IGN BD Carto", date: "2024" }, sources: [S.ign] });
const MEDECIN_PORT_ANVEL = l({ cle: "medecin", issue: "to_confirm", grain: "commune", constat: "Six médecins généralistes exercent dans la commune ; leur disponibilité n'est pas connue.", preuve: { source: "BPE", date: "2025" }, sources: [S.bpe25] });

const A: Lieu = {
  id: "sternes",
  libelle: "12 rue des Sternes",
  commune: PORT_ANVEL,
  adresse: "12 rue des Sternes, Port-Anvel",
  annonce: { url: "https://annonces.exemple/location/t3-sternes", site: "annonces.exemple", nature: "location", montant: 980, surface: 62, pieces: 3 },
  statut: "a_visiter",
  ajouteLe: "2026-10-03",
  visiteLe: "2026-11-14",
  droit: "adresse",
  analyses: [analyse({
    id: "art-sternes", generatedAt: "2026-10-09", engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV3,
    conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "12 rue des Sternes répond à votre Projet, avec un compromis : le calme aux abords." },
    registre: [
      MER_PORT_ANVEL,
      l({ cle: "gare", issue: "favorable", grain: "secteur", mesure: { valeur: 12, unite: "min" }, constat: "La gare de Port-Anvel est à 12 min à pied depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "to_confirm", grain: "batiment", constat: "Le diagnostic ne dit rien du confort d'été ; 18 nuits tropicales par an sont projetées à la commune vers 2050.", preuve: { source: "ADEME DPE, DRIAS", date: "2025" }, sources: [S.dpe, S.drias] }),
      l({ cle: "calme", issue: "reserve", grain: "secteur", constat: "Une départementale passe à 60 m : bruit routier de 60 à 65 dB le jour.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
      MEDECIN_PORT_ANVEL,
      l({ cle: "quartier", issue: "favorable", grain: "secteur", constat: "Commerces et marché à moins de 5 min à pied.", preuve: { source: "BPE, OpenStreetMap", date: "2025" }, sources: [S.bpe25, S.osm] }),
    ],
  })],
  journal: [
    { date: "2026-10-03", type: "ajoute", texte: "Ajouté depuis une annonce (à louer, 980 € par mois, déclaré)." },
    { date: "2026-10-09", type: "analyse", texte: "Dossier d'adresse : commune, abords et logement analysés." },
    { date: "2026-11-05", type: "statut", texte: "À visiter : visite prévue le 14 nov." },
  ],
  observations: [],
  verifications: [
    {
      id: "v-medecin", cle: "medecin", moment: "avant_visite",
      question: "Appeler deux cabinets de Port-Anvel : acceptent-ils de nouveaux patients ?",
      pourquoi: "La commune compte des médecins, mais leur disponibilité ne se mesure pas.",
      reponses: [
        { valeur: "oui", libelle: "Oui, l'un des deux", effet: "Un médecin disponible devient une observation favorable, datée et attribuée à votre appel. La donnée publique (six généralistes) ne change pas.", reste: "Une réponse au téléphone vaut pour aujourd'hui." },
        { valeur: "non", libelle: "Non, aucun", effet: "Un médecin disponible reste un point faible pour vous à Port-Anvel. Il vaut aussi pour 5 allée des Goélands : même commune, même lecture.", reste: "Les cabinets des communes voisines n'ont pas été appelés." },
      ],
    },
    {
      id: "v-fenetre", cle: "nuits", moment: "sur_place",
      question: "La chambre peut-elle rester fenêtre ouverte la nuit, compte tenu du bruit côté rue ?",
      pourquoi: "Des nuits plus chaudes sont projetées ; dormir fenêtre ouverte dépend de l'orientation et du bruit, que l'annonce ne dit pas.",
      reponses: [
        { valeur: "cour", libelle: "Oui, la chambre donne sur cour", effet: "Des nuits fraîches l'été : la ventilation nocturne devient possible d'après votre visite. Le compromis de calme ne touche plus la chambre.", reste: "Une visite en novembre ne dit pas la température d'une chambre en juillet." },
        { valeur: "rue", libelle: "Non, elle donne sur la rue", effet: "Le bruit de la départementale et la chaleur se cumulent dans la chambre : à peser avant de vous engager.", reste: "La température réelle l'été reste inconnue." },
      ],
    },
    {
      id: "v-volets", cle: "nuits", moment: "sur_place",
      question: "Le séjour et la chambre ont-ils des volets ou des stores extérieurs ?",
      pourquoi: "Une protection extérieure limite la chaleur qui entre l'après-midi ; le diagnostic ne la décrit pas.",
      reponses: [
        { valeur: "oui", libelle: "Oui, volets extérieurs", effet: "Une protection solaire est observée : un des deux leviers du confort d'été est présent.", reste: "L'isolation de la toiture n'est pas connue." },
        { valeur: "non", libelle: "Aucune protection", effet: "Aucune protection extérieure : le confort d'été repose sur la seule ventilation.", reste: "Des stores pourraient être posés ; à demander." },
      ],
    },
    {
      id: "v-ete", cle: "nuits", moment: "avant_engagement",
      question: "Demander au propriétaire ou à l'agence comment le logement se comporte l'été (températures relevées, ventilateurs).",
      pourquoi: "C'est la seule information directe sur la chaleur dans ce logement.",
      reponses: [
        { valeur: "frais", libelle: "Reste frais selon le propriétaire", effet: "Une déclaration favorable du propriétaire, enregistrée comme telle : elle n'a pas la force d'une mesure.", reste: "Aucune mesure indépendante." },
        { valeur: "chaud", libelle: "Chaud en juillet selon le propriétaire", effet: "Une déclaration défavorable : des nuits fraîches deviennent improbables dans ce logement.", reste: "L'ampleur n'est pas mesurée." },
      ],
    },
  ],
};

const B: Lieu = {
  id: "goelands",
  libelle: "5 allée des Goélands",
  commune: PORT_ANVEL,
  adresse: "5 allée des Goélands, Port-Anvel",
  annonce: { url: "https://annonces.exemple/location/maison-goelands", site: "annonces.exemple", nature: "location", montant: 1150, surface: 85, pieces: 4 },
  statut: "visite",
  ajouteLe: "2026-09-28",
  visiteLe: "2026-11-02",
  droit: "adresse",
  analyses: [analyse({
    id: "art-goelands", generatedAt: "2026-09-30", engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV2,
    conclusion: { etiquette: "Correspondance", ton: "positif", phrase: "5 allée des Goélands répond à votre Projet." },
    registre: [
      MER_PORT_ANVEL,
      l({ cle: "gare", issue: "favorable", grain: "secteur", mesure: { valeur: 18, unite: "min" }, constat: "La gare de Port-Anvel est à 18 min à pied depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "favorable", grain: "batiment", constat: "Diagnostic de 2023, classe C ; confort d'été jugé « bon ».", preuve: { source: "ADEME DPE", date: "2025" }, sources: [S.dpe, S.drias] }),
      l({ cle: "calme", issue: "favorable", grain: "secteur", constat: "Rue résidentielle : bruit routier sous 55 dB le jour.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
      MEDECIN_PORT_ANVEL,
      l({ cle: "quartier", issue: "reserve", grain: "secteur", constat: "Commerces à 14 min à pied ; aucun marché proche.", preuve: { source: "BPE, OpenStreetMap", date: "2025" }, sources: [S.bpe25, S.osm] }),
    ],
  }), analyse({
    id: "art-goelands", version: 2, generatedAt: "2026-10-12", engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV3,
    conclusion: { etiquette: "Correspondance", ton: "positif", phrase: "5 allée des Goélands répond à votre Projet." },
    registre: [
      MER_PORT_ANVEL,
      l({ cle: "gare", issue: "favorable", grain: "secteur", mesure: { valeur: 18, unite: "min" }, constat: "La gare de Port-Anvel est à 18 min à pied depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "favorable", grain: "batiment", constat: "Diagnostic de 2023, classe C ; confort d'été jugé « bon ».", preuve: { source: "ADEME DPE", date: "2025" }, sources: [S.dpe, S.drias] }),
      l({ cle: "calme", issue: "favorable", grain: "secteur", constat: "Rue résidentielle : bruit routier sous 55 dB le jour.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
      MEDECIN_PORT_ANVEL,
      l({ cle: "quartier", issue: "reserve", grain: "secteur", constat: "Commerces à 14 min à pied ; aucun marché proche.", preuve: { source: "BPE, OpenStreetMap", date: "2025" }, sources: [S.bpe25, S.osm] }),
    ],
  })],
  journal: [
    { date: "2026-09-28", type: "ajoute", texte: "Ajouté depuis une annonce (à louer, 1 150 € par mois, déclaré)." },
    { date: "2026-09-30", type: "analyse", texte: "Dossier d'adresse : commune, abords et logement analysés." },
    { date: "2026-10-12", type: "analyse", texte: "Analyse mise à jour avec votre Projet du 8 oct. (version 2) ; la version 1 reste lisible." },
    { date: "2026-11-02", type: "statut", texte: "Visité." },
  ],
  observations: [
    { id: "o-goel-1", date: "2026-11-02", nature: "observation", cle: "calme", texte: "Chambre côté jardin, très calme à 18 h." },
    { id: "o-goel-2", date: "2026-11-02", nature: "declaration", texte: "L'agence indique un chauffage refait en 2022." },
  ],
  verifications: [
    {
      id: "v-medecin-b", cle: "medecin", moment: "avant_visite",
      question: "Appeler deux cabinets de Port-Anvel : acceptent-ils de nouveaux patients ?",
      pourquoi: "Même question que pour 12 rue des Sternes : une seule lecture de la commune.",
      reponses: [
        { valeur: "oui", libelle: "Oui, l'un des deux", effet: "Un médecin disponible devient une observation favorable pour Port-Anvel.", reste: "Une réponse au téléphone vaut pour aujourd'hui." },
        { valeur: "non", libelle: "Non, aucun", effet: "Un médecin disponible reste un point faible pour vous à Port-Anvel.", reste: "Les communes voisines n'ont pas été appelées." },
      ],
    },
  ],
};

const C: Lieu = {
  id: "kervily",
  libelle: "31 route de Kervily",
  commune: PLOUBREC,
  adresse: "31 route de Kervily, Ploubrec",
  annonce: { url: "https://annonces.exemple/location/duplex-kervily", site: "annonces.exemple", nature: "location", montant: 1020, surface: 74, pieces: 4 },
  statut: "a_etudier",
  ajouteLe: "2026-09-15",
  visiteLe: null,
  droit: "adresse",
  analyses: [analyse({
    id: "art-kervily", generatedAt: "2026-09-17", engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV2,
    conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "31 route de Kervily répond à votre Projet, avec un compromis : des nuits fraîches l'été." },
    registre: [
      l({ cle: "mer", issue: "favorable", grain: "commune", mesure: { valeur: 9, unite: "km" }, constat: "La mer est à 9 km du centre de Ploubrec.", preuve: { source: "IGN BD Carto", date: "2024" }, sources: [S.ign] }),
      l({ cle: "gare", issue: "favorable", grain: "secteur", mesure: { valeur: 26, unite: "min" }, constat: "La gare de Ploubrec est à 26 min à pied depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "reserve", grain: "batiment", constat: "Diagnostic de 2016, classe E ; chambres sous les combles.", preuve: { source: "ADEME DPE", date: "2025" }, sources: [S.dpe, S.drias] }),
      l({ cle: "calme", issue: "favorable", grain: "secteur", constat: "Aucune voie bruyante cartographiée à moins de 300 m.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
      l({ cle: "medecin", issue: "favorable", grain: "commune", constat: "Une maison de santé et quatre généralistes dans la commune.", preuve: { source: "BPE", date: "2025" }, sources: [S.bpe25] }),
      l({ cle: "quartier", issue: "indeterminate", grain: "secteur", sources: [S.osm] }),
    ],
  })],
  journal: [
    { date: "2026-09-15", type: "ajoute", texte: "Ajouté depuis une annonce (à louer, 1 020 € par mois, déclaré)." },
    { date: "2026-09-17", type: "analyse", texte: "Dossier d'adresse, sous votre Projet du 12 sept. (une gare à moins de 30 min)." },
  ],
  observations: [],
  verifications: [],
};

const D: Lieu = {
  id: "lavoir",
  libelle: "4 impasse du Lavoir",
  commune: KERMOAL,
  adresse: "4 impasse du Lavoir, Kermoal",
  annonce: { url: "https://annonces.exemple/vente/appartement-lavoir", site: "annonces.exemple", nature: "vente", montant: 210000, surface: 58, pieces: 3 },
  statut: "a_etudier",
  ajouteLe: "2026-09-01",
  visiteLe: null,
  droit: "territoire",
  analyses: [analyse({
    id: "art-kermoal", generatedAt: "2026-09-02", engineVersion: "engine-5", perimetre: "commune", projet: REV2,
    conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "Kermoal répond moins bien à une de vos priorités : des nuits fraîches l'été." },
    registre: [
      l({ cle: "mer", issue: "favorable", grain: "commune", mesure: { valeur: 1, unite: "km" }, constat: "La mer est à 1 km du centre de Kermoal.", preuve: { source: "IGN BD Carto", date: "2024" }, sources: [S.ign] }),
      l({ cle: "gare", issue: "favorable", grain: "commune", constat: "Une gare dans la commune.", preuve: { source: "Gares SNCF", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "mismatch", grain: "commune", constat: "Kermoal est parmi les 15 % de communes où les nuits chaudes augmentent le plus d'ici 2050.", preuve: { source: "DRIAS", date: "2020" }, sources: [S.drias] }),
      l({ cle: "calme", issue: "non_examine", grain: null, sources: [] }),
      l({ cle: "medecin", issue: "favorable", grain: "commune", constat: "Neuf généralistes dans la commune.", preuve: { source: "BPE", date: "2024" }, sources: [S.bpe24] }),
      l({ cle: "quartier", issue: "favorable", grain: "commune", constat: "Commerces et services nombreux dans la commune.", preuve: { source: "BPE", date: "2024" }, sources: [S.bpe24] }),
    ],
  })],
  journal: [
    { date: "2026-09-01", type: "ajoute", texte: "Ajouté depuis une annonce (à vendre, 210 000 €, déclaré)." },
    { date: "2026-09-02", type: "analyse", texte: "Rapport de territoire : la commune de Kermoal est analysée, pas l'adresse." },
  ],
  observations: [],
  verifications: [],
};

/** L'analyse d'adresse de 4 impasse du Lavoir, SIMULÉE par le geste « Analyser l'adresse » (aucune génération réelle). */
export const ANALYSE_SIMULEE_LAVOIR: Analyse = analyse({
  id: "art-lavoir", generatedAt: AUJOURDHUI, engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV3, simulee: true,
  conclusion: { etiquette: "Arbitrage", ton: "reserve", phrase: "4 impasse du Lavoir répond moins bien à une de vos priorités : des nuits fraîches l'été." },
  registre: [
    l({ cle: "mer", issue: "favorable", grain: "commune", mesure: { valeur: 1, unite: "km" }, constat: "La mer est à 1 km du centre de Kermoal.", preuve: { source: "IGN BD Carto", date: "2024" }, sources: [S.ign] }),
    l({ cle: "gare", issue: "favorable", grain: "secteur", mesure: { valeur: 9, unite: "min" }, constat: "La gare de Kermoal est à 9 min à pied depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
    l({ cle: "nuits", issue: "mismatch", grain: "batiment", constat: "Dernier étage sous toiture, diagnostic de 2012 classe F ; nuits chaudes en hausse marquée à la commune.", preuve: { source: "ADEME DPE, DRIAS", date: "2025" }, sources: [S.dpe, S.drias] }),
    l({ cle: "calme", issue: "favorable", grain: "secteur", constat: "Impasse sans circulation de transit.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
    l({ cle: "medecin", issue: "favorable", grain: "commune", constat: "Neuf généralistes dans la commune.", preuve: { source: "BPE", date: "2025" }, sources: [S.bpe25] }),
    l({ cle: "quartier", issue: "favorable", grain: "secteur", constat: "Commerces à 4 min à pied.", preuve: { source: "BPE, OpenStreetMap", date: "2025" }, sources: [S.bpe25, S.osm] }),
  ],
});

const E: Lieu = {
  id: "landeven",
  libelle: "T2 avec balcon",
  commune: LANDEVEN,
  adresse: null,
  annonce: { url: "https://annonces.exemple/location/t2-balcon-landeven", site: "annonces.exemple", nature: "location", montant: 890, surface: 41, pieces: 2 },
  statut: "a_etudier",
  ajouteLe: "2026-11-02",
  visiteLe: null,
  droit: "aucun",
  analyses: [],
  journal: [{ date: "2026-11-02", type: "ajoute", texte: "Ajouté depuis une annonce, sans adresse (à louer, 890 € par mois, déclaré)." }],
  observations: [],
  verifications: [],
};

const G: Lieu = {
  id: "jardin",
  libelle: "Maison avec jardin",
  commune: PLOUBREC,
  adresse: null,
  annonce: { url: "https://immobilier.exemple/annonce/maison-jardin-ploubrec", site: "immobilier.exemple", nature: "location", montant: 1050, surface: 90, pieces: 4 },
  statut: "a_etudier",
  ajouteLe: "2026-11-05",
  visiteLe: null,
  droit: "aucun",
  analyses: [],
  journal: [{ date: "2026-11-05", type: "ajoute", texte: "Ajouté depuis une annonce, sans adresse (à louer, 1 050 € par mois, déclaré)." }],
  observations: [],
  verifications: [],
};

const F: Lieu = {
  id: "thoniers",
  libelle: "Studio, quai des Thoniers",
  commune: TY_MOOR,
  adresse: "9 quai des Thoniers, Ty-Moor",
  annonce: { url: "https://annonces.exemple/location/studio-thoniers", site: "annonces.exemple", nature: "location", montant: 720, surface: 29, pieces: 1 },
  statut: "ecarte",
  ajouteLe: "2026-10-09",
  visiteLe: null,
  droit: "adresse",
  analyses: [analyse({
    id: "art-thoniers", generatedAt: "2026-10-10", engineVersion: "engine-6", perimetre: "commune+adresse", projet: REV3,
    conclusion: { etiquette: "Condition non tenue", ton: "critique", phrase: "Studio, quai des Thoniers ne tient pas votre condition sans compromis : une gare à moins de 20 min." },
    registre: [
      l({ cle: "mer", issue: "favorable", grain: "commune", mesure: { valeur: 0.5, unite: "km" }, constat: "Le port est en bord de mer.", preuve: { source: "IGN BD Carto", date: "2024" }, sources: [S.ign] }),
      l({ cle: "gare", issue: "incompatible", grain: "secteur", mesure: { valeur: 35, unite: "min" }, constat: "La gare la plus proche est à 35 min à pied depuis l'adresse.", preuve: { source: "Gares SNCF, IGN", date: "2025" }, sources: [S.gares] }),
      l({ cle: "nuits", issue: "favorable", grain: "batiment", constat: "Logement traversant au premier étage ; diagnostic de 2024, classe C.", preuve: { source: "ADEME DPE", date: "2025" }, sources: [S.dpe, S.drias] }),
      l({ cle: "calme", issue: "favorable", grain: "secteur", constat: "Quai piéton.", preuve: { source: "Cerema, cartes de bruit", date: "2022" }, sources: [S.bruit] }),
      l({ cle: "medecin", issue: "favorable", grain: "commune", constat: "Trois généralistes dans la commune.", preuve: { source: "BPE", date: "2025" }, sources: [S.bpe25] }),
      l({ cle: "quartier", issue: "favorable", grain: "secteur", constat: "Commerces du port à 2 min.", preuve: { source: "BPE, OpenStreetMap", date: "2025" }, sources: [S.bpe25, S.osm] }),
    ],
  })],
  journal: [
    { date: "2026-10-09", type: "ajoute", texte: "Ajouté depuis une annonce (à louer, 720 € par mois, déclaré)." },
    { date: "2026-10-10", type: "analyse", texte: "Dossier d'adresse : commune, abords et logement analysés." },
    { date: "2026-10-12", type: "ecarte", texte: "Écarté.", raison: "Gare trop loin, 35 min à pied", contexte: { revision: 3, condition: "une gare à moins de 20 min", cle: "gare", valeur: 20 } },
  ],
  observations: [],
  verifications: [],
};

export const TOUS: Lieu[] = [D, C, B, A, F, E, G];

// ── Scénarios de revue ───────────────────────────────────────────────────────────────────────

export type Ecran = "decision" | "fiche" | "comparer" | "point" | "releve";
export type Vue = { ecran: Ecran; lieu?: string; selection?: string[]; mode?: "ensemble" | "face"; critere?: string };

export type Scenario = {
  id: string;
  numero: string;
  titre: string;
  resume: string;
  lieux: string[];
  vue: Vue;
  /** Ajustements d'état propres au scénario (ex. un lieu écarté remis en course). */
  ajuste?: (l: Lieu) => Lieu;
};

export const SCENARIOS: Scenario[] = [
  { id: "complet", numero: "★", titre: "Toute la recherche", resume: "Sept logements, deux annonces sans adresse, un écarté, un Projet révisé le 8 oct.", lieux: TOUS.map((x) => x.id), vue: { ecran: "decision" } },
  { id: "vide", numero: "0", titre: "Avant tout logement", resume: "Le Projet existe, aucun logement n'est encore gardé.", lieux: [], vue: { ecran: "decision" } },
  { id: "un", numero: "1", titre: "Un seul logement", resume: "Utile dès un logement : sa conclusion, ce qui reste à vérifier, sa visite.", lieux: ["sternes"], vue: { ecran: "decision" } },
  { id: "s1", numero: "S1", titre: "Location, dont un logement à vendre", resume: "Votre Projet est une location ; une annonce est à vendre. futur•e n'en déduit rien.", lieux: ["sternes", "lavoir", "landeven"], vue: { ecran: "decision" } },
  { id: "s2", numero: "S2", titre: "Deux adresses d'une même commune", resume: "Une seule lecture de Port-Anvel : elle ne départage pas les deux adresses.", lieux: ["sternes", "goelands"], vue: { ecran: "comparer", selection: ["sternes", "goelands"], mode: "face" } },
  { id: "s3", numero: "S3", titre: "Trois communes différentes", resume: "Vue d'ensemble : ce qui départage, ce qui pourrait, ce qui ne se compare pas.", lieux: ["sternes", "kervily", "lavoir"], vue: { ecran: "comparer", selection: ["sternes", "kervily", "lavoir"], mode: "ensemble" } },
  { id: "s4", numero: "S4", titre: "Un logement analysé, deux annonces", resume: "Ce que déclare une annonce n'est jamais confondu avec une conclusion.", lieux: ["sternes", "landeven", "jardin"], vue: { ecran: "decision" } },
  {
    id: "s5", numero: "S5", titre: "Une condition sans compromis non tenue", resume: "Le studio est remis en course : sa gare ne tient pas, rien ne le compense.",
    lieux: ["sternes", "goelands", "thoniers"], vue: { ecran: "comparer", selection: ["sternes", "goelands", "thoniers"], mode: "ensemble" },
    ajuste: (x) => (x.id === "thoniers" ? { ...x, statut: "a_etudier", journal: x.journal.filter((e) => e.type !== "ecarte") } : x),
  },
  { id: "s6", numero: "S6", titre: "Projet modifié entre deux analyses", resume: "Kervily a été analysé sous une gare à 30 min : seule la gare sort du cadre.", lieux: ["sternes", "kervily"], vue: { ecran: "comparer", selection: ["sternes", "kervily"], mode: "face" } },
  { id: "s7", numero: "S7", titre: "Deux dossiers aux données non comparables", resume: "Moteur, millésime et échelle diffèrent : chaque refus est expliqué.", lieux: ["sternes", "lavoir"], vue: { ecran: "comparer", selection: ["sternes", "lavoir"], mode: "face" } },
  { id: "s8", numero: "S8", titre: "Plusieurs inconnues avant la visite", resume: "Quatre vérifications, et ce que chaque réponse changerait.", lieux: ["sternes"], vue: { ecran: "fiche", lieu: "sternes" } },
];

export const COMMUNES_FICTIVES = [PORT_ANVEL, PLOUBREC, KERMOAL, LANDEVEN, TY_MOOR];
