// PRÉVISUALISATION DE L'ARTICLE « À Niort, la voiture ne tient pas la même place d'un secteur à l'autre ». DEV UNIQUEMENT.
//
// Version éditée de l'essai 2 de rédaction autonome. La page relit à chaque requête le texte
// (`redaction/79191/article.md`), les légendes et textes alternatifs (`visuels/79191/legendes.html`) et les PNG de
// l'étude : corriger l'étude suffit, rien n'est recopié ici. Rendu commun avec /dev/article-larochelle.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { ArticleEtude, lecteurLegendes, Visuel } from "../_apercu-article/rendu";
import { ARTICLE, VISUELS } from "./source";

export const dynamic = "force-dynamic";

const ROUTE = "/dev/article-niort/visuel";

async function legendes() {
  const l = lecteurLegendes(await readFile(path.join(VISUELS, "legendes.html"), "utf8"));
  return {
    carte: { alt: l.alt("carte_iris_79191_sombre.png"), legende: l.bloc(/class="fig-carte">[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>/) },
    barres: { alt: l.alt("barres_lieu_travail_79191_sombre.png"), legende: l.bloc(/class="fig-barres">[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>/) },
  };
}

export default async function PrevisualisationArticleNiort() {
  if (process.env.NODE_ENV === "production") notFound();
  const [md, leg] = await Promise.all([readFile(ARTICLE, "utf8"), legendes()]);
  return (
    <ArticleEtude
      md={md}
      bandeau="Prévisualisation interne · non publiée · redaction/79191/article.md"
      visuel={(l, _suivante, k) => {
        if (l.startsWith("[CARTE :"))
          return {
            noeud: (
              <figure key={k}>
                <Visuel route={ROUTE} base="carte_iris_79191" alt={leg.carte.alt} largeur={1000} />
                <figcaption>{leg.carte.legende}</figcaption>
              </figure>
            ),
          };
        if (l.startsWith("[GRAPHIQUE :"))
          return {
            noeud: (
              <figure key={k} className="apv-etroite">
                <Visuel route={ROUTE} base="barres_lieu_travail_79191" alt={leg.barres.alt} largeur={600} />
                <figcaption>{leg.barres.legende}</figcaption>
              </figure>
            ),
          };
        return null;
      }}
    />
  );
}
