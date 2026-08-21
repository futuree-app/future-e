// LES TROIS ÉCHELLES DU DOSSIER D'ADRESSE — SOURCE UNIQUE.
//
// Elles vivaient dans `DossierQualificationClient.tsx`, donc sur le seul écran de qualification. La
// page de paiement, elle, ne montrait que l'adresse et un montant : quelqu'un qui arrive par un lien
// partagé, ou qui revient après avoir créé son compte (le parcours passe par `/connexion?next=…`),
// voyait un prix sans savoir ce qu'il achète. Les deux surfaces lisent maintenant la même table :
// deux copies auraient divergé, et c'est la promesse du produit qui aurait divergé avec elles.
//
// CE QU'ELLES DISENT, ET CE QU'ELLES NE DISENT PAS. Elles décrivent ce que le dossier EXAMINE, dans
// l'ordre de lecture : le territoire, ce qui l'entoure, le bâtiment. Elles ne promettent AUCUNE
// couverture à une adresse donnée — ça, c'est le rôle de `dossier-couverture-attendue.ts`, qui parle
// après avoir mesuré la matière réellement disponible. Ne jamais faire dire à cette table ce qu'une
// adresse contiendra : elle ne le sait pas.
//
// L'IDENTITÉ D'UNE ÉCHELLE EST SON RANG, SON NOM ET SON GRAIN. Ni couleur, ni icône. Le même
// vocabulaire est rendu avant l'achat et dans le dossier livré : une surface ne doit jamais recréer
// sa propre table de noms ou de bénéfices.

export type EchelleDuDossier = {
  key: "commune" | "autour" | "logement";
  moduleId: "quartier" | "autour" | "logement";
  rank: "01" | "02" | "03";
  title: string;
  grain: string;
  body: string;
};

export const ECHELLES_DU_DOSSIER: readonly EchelleDuDossier[] = [
  {
    key: "commune",
    moduleId: "quartier",
    rank: "01",
    title: "Territoire",
    grain: "la commune",
    body: "Ce qui structure la vie dans cette commune, ce à quoi elle est exposée et ce qui la transforme.",
  },
  {
    key: "autour",
    moduleId: "autour",
    rank: "02",
    title: "Autour de l'adresse",
    grain: "le voisinage",
    body: "Ce qui se trouve et se mesure à proximité, et ce que ce voisinage change au quotidien.",
  },
  {
    key: "logement",
    moduleId: "logement",
    rank: "03",
    title: "Logement",
    grain: "le bâtiment",
    body: "Ce que le bâtiment et sa parcelle établissent, ce qui les expose et ce qu'il reste à demander.",
  },
] as const;

export function libelleEchelle(echelle: EchelleDuDossier, commune?: string | null): string {
  const identite = `${echelle.title} · ${echelle.grain}`;
  return echelle.key === "commune" && commune ? `${identite} — ${commune}` : identite;
}

// LA PHRASE QUI RELIE LE FAIT À CE QU'ON EN FAIT. C'est la promesse de la page d'accueil (« Ce que
// nous savons. Ce que cela change pour vous. Ce qu'il reste à vérifier. ») dite dans les termes du
// dossier, au moment de payer. Elle décrit la STRUCTURE de ce qui sera rendu — source, limite,
// contrôle — donc elle reste vraie quelle que soit la matière trouvée à l'adresse.
export const CE_QUE_LE_DOSSIER_REND =
  "Chaque constat porte sa source et sa limite, et nomme, quand il en appelle un, le contrôle à mener avant de vous engager.";
