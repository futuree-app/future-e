// PRÉVISUALISATION DE L'ARTICLE PILOTE « Vivre à La Rochelle en utilisant moins la voiture ». DEV UNIQUEMENT.
//
// Sert à juger le rythme de lecture et la taille réelle des visuels, rien de plus : ce n'est pas un gabarit
// d'article. La page relit à chaque requête le texte (`article/article-v3.md`), les légendes et textes
// alternatifs (`visuels/legendes.html`) et les PNG de l'étude : corriger l'étude suffit, rien n'est recopié ici.
// Rendu commun avec /dev/article-niort : `../_apercu-article/rendu.tsx`.
//
// Le bloc graphique + carte des communes passe de côte à côte à l'un sous l'autre sous 760 px.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { ArticleEtude, lecteurLegendes, Visuel } from "../_apercu-article/rendu";
import { ARTICLE, VISUELS } from "./source";

export const dynamic = "force-dynamic";

const ROUTE = "/dev/article-larochelle/visuel";

async function legendes() {
  const l = lecteurLegendes(await readFile(path.join(VISUELS, "legendes.html"), "utf8"));
  return {
    carte: { alt: l.alt("carte_iris_17300_sombre.png"), legende: l.bloc(/class="fig-carte">[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>/) },
    barres: { alt: l.alt("barres_lieu_travail_sombre.png") },
    communes: { alt: l.alt("carte_communes_17300_sombre.png"), legende: l.bloc(/<p class="legende-bloc">([\s\S]*?)<\/p>/) },
  };
}

export default async function PrevisualisationArticle() {
  if (process.env.NODE_ENV === "production") notFound();
  const [md, leg] = await Promise.all([readFile(ARTICLE, "utf8"), legendes()]);
  return (
    <ArticleEtude
      md={md}
      bandeau="Prévisualisation interne · non publiée · article-v3.md"
      visuel={(l, suivante, k) => {
        if (l.startsWith("[CARTE :"))
          return {
            noeud: (
              <figure key={k}>
                <Visuel route={ROUTE} base="carte_iris_17300" alt={leg.carte.alt} largeur={1000} />
                <figcaption>{leg.carte.legende}</figcaption>
              </figure>
            ),
          };
        if (l.startsWith("[GRAPHIQUE :"))
          // Le graphique et la carte des communes forment UN bloc : la ligne [CARTE DES COMMUNES] qui suit est absorbée.
          return {
            absorbe: !!suivante?.startsWith("[CARTE DES COMMUNES"),
            noeud: (
              <div key={k} className="apv-bloc" role="group" aria-label="Lieu de travail et situation des communes comparées">
                <div className="apv-bloc-visuels">
                  <figure><Visuel route={ROUTE} base="barres_lieu_travail" alt={leg.barres.alt} largeur={600} /></figure>
                  <figure className="apv-communes"><Visuel route={ROUTE} base="carte_communes_17300" alt={leg.communes.alt} largeur={300} /></figure>
                </div>
                <p className="apv-legende">{leg.communes.legende}</p>
              </div>
            ),
          };
        return null;
      }}
    />
  );
}
