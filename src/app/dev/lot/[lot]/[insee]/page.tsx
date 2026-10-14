// PRÉVISUALISATION D'UN ARTICLE DE LOT. DEV UNIQUEMENT. Même rendu que /dev/article-* (`../../../_apercu-article/rendu`).
// Les emplacements de visuels de l'article pointent vers les fichiers produits pour lui ; un visuel absent s'affiche
// comme une note, sans bloquer la lecture.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { ArticleEtude, texteHtml } from "../../../_apercu-article/rendu";
import { articleDe, lireLot, LOTS, nomValide } from "../../source";

export const dynamic = "force-dynamic";

function Png({ lot, insee, base, alt }: { lot: string; insee: string; base: string; alt: string }) {
  const src = (t: string, m: boolean) => `/dev/lot/fichier?lot=${lot}&f=${encodeURIComponent(`${insee}/visuels/${base}${m ? "_mobile" : ""}_${t}.png`)}`;
  return (
    <>
      {(["sombre", "clair"] as const).map((t) => (
        <div key={t} className={`apv-surface apv-v-${t}`}>
          <picture>
            <source media="(max-width: 640px)" srcSet={src(t, true)} />
            <img src={src(t, false)} alt={alt} />
          </picture>
        </div>
      ))}
    </>
  );
}

export default async function ArticleLot({ params }: { params: Promise<{ lot: string; insee: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { lot, insee } = await params;
  if (!nomValide(lot) || !/^\d[\dAB]\d{3}$/.test(insee)) notFound();
  const v = await lireLot(lot);
  const c = v.communes[insee];
  const md = c && (await articleDe(lot, insee, c));
  if (!md) notFound();
  const vis = path.join(LOTS, lot, insee, "visuels");
  const svg = (b: string) => path.join(vis, `${b}_sombre.svg`);
  const alt = async (b: string) => {
    if (!existsSync(svg(b))) return "";
    // Le texte alternatif est écrit par le générateur dans la balise <desc> du SVG (même source que le PNG).
    return texteHtml((await readFile(svg(b), "utf8")).match(/<desc[^>]*>([\s\S]*?)<\/desc>/)?.[1] ?? "").replace(/&#x27;/g, "'");
  };
  const carte = `carte_iris_${insee}`, barres = `barres_lieu_travail_${insee}`;
  const altCarte = await alt(carte), altBarres = await alt(barres);
  return (
    <ArticleEtude
      md={md}
      bandeau={`Prévisualisation interne · lot ${lot} · ${c.statut} · non publiée`}
      visuel={(l, _s, k) => {
        const quoi = /carte|secteur|quartier|iris/i.test(l) ? "carte" : /travail|graphique|barres/i.test(l) ? "barres" : null;
        const base = quoi === "carte" ? carte : quoi === "barres" ? barres : null;
        if (base && existsSync(path.join(vis, `${base}_sombre.png`)))
          return { noeud: <figure key={k}><Png lot={lot} insee={insee} base={base} alt={quoi === "carte" ? altCarte : altBarres} /></figure> };
        return { noeud: <p key={k} className="apv-legende">Visuel prévu, non produit : {l}</p> };
      }}
    />
  );
}
