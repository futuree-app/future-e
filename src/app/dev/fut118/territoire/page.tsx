// FUT-118 · TÉMOIN 03 · UN MODULE DENSE DANS LE RELEVÉ. DEV UNIQUEMENT : 404 en production.
//
// Le module Territoire est aujourd'hui en verre arrondi, surtitres mono capitales et valeurs colorées
// par thème (`QuartierClimatData.tsx`). Ce témoin montre la même matière dans la grammaire du
// Relevé : la plaque pour la lecture immédiate, des lignes à marge pour les faits, des chiffres en
// encre, des seuils et des rangs dessinés, la règle du temps, un tableau de relevé, une donnée absente
// dite comme telle, une lecture enrichie qui se prépare sans rien remplacer.
//
// TOUTES LES VALEURS SONT FICTIVES (« Commune témoin »). Aucun appel au moteur ni au modèle.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  releve as s, BandeauPrototype, Surtitre, Ligne, Marge, Registre, Chiffre, Plaque, Grain,
  RegleDuTemps, RegleDeRang, Seuils, CoupeEchelles, TEINTE_REGISTRE,
} from "@/components/releve/primitives";
import t from "../temoins.module.css";

export const dynamic = "force-dynamic";

const HORIZONS = [2030, 2050, 2100] as const;
type Horizon = (typeof HORIZONS)[number];
const PALIER: Record<Horizon, string> = { 2030: "+2 °C en France", 2050: "+2,7 °C en France", 2100: "+4 °C en France" };

// Valeurs fictives, choisies pour exercer les seuils (franchi / non franchi).
const PROJ: Record<Horizon, { j35: number; nuits: number; feux: number }> = {
  2030: { j35: 6, nuits: 31, feux: 22 },
  2050: { j35: 12, nuits: 48, feux: 31 },
  2100: { j35: 27, nuits: 79, feux: 46 },
};
const REF = { j35: 2, nuits: 14, feux: 12 };

export default async function TemoinTerritoire({ searchParams }: { searchParams: Promise<{ h?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const h: Horizon = HORIZONS.find((x) => String(x) === sp.h) ?? 2050;
  const p = PROJ[h];
  const source = { type: "source" as const, texte: "DRIAS · Météo-France, TRACC", grain: "commune" as const };

  return (
    <div className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        FUT-118 · témoin 03 · module dense · valeurs fictives · <Link href="/dev/fut118">index</Link>
      </BandeauPrototype>
      <main className={`${s.feuille} ${t.page}`}>
        <header className={t.tete}>
          <Surtitre numero="Échelle 1">Territoire <Grain grain="commune">la commune</Grain></Surtitre>
          <h1 className={s.display}>Commune témoin</h1>
          <p className={s.chapo}>Ce qui structure la vie dans cette commune, ce à quoi elle est exposée, et ce qui la transforme d&apos;ici à {h}.</p>
          {/* Le sélecteur : un repère qui bouge, des valeurs qui ne s'animent jamais (FUT-75). */}
          <nav aria-label="Horizon de projection" className={t.selecteur}>
            {HORIZONS.map((x) => (
              <Link key={x} href={`?h=${x}`} className={t.option} aria-current={x === h ? "page" : undefined} scroll={false}>{x}</Link>
            ))}
          </nav>
        </header>

        {/* La plaque : la lecture immédiate. Une seule plaque à l'écran. */}
        <Plaque etiquette="Lecture immédiate">
          <div className={s.pile} style={{ gap: 28 }}>
            <p className={s.surtitre}>Lecture immédiate · horizon {h} · {PALIER[h]}</p>
            <div className={s.rangee} style={{ gap: "20px 48px" }}>
              <span className={s.pileSerree}><Chiffre valeur={String(p.j35)} unite="j/an" /><span className={s.nuance}>au-dessus de 35 °C, contre {REF.j35} en 1976-2005</span></span>
              <span className={s.pileSerree}><Chiffre valeur={String(p.nuits)} unite="nuits/an" /><span className={s.nuance}>sans redescendre sous 20 °C, contre {REF.nuits}</span></span>
              <span className={s.pileSerree}><Chiffre valeur={String(p.feux)} unite="j/an" /><span className={s.nuance}>de météo propice aux feux, contre {REF.feux}</span></span>
            </div>
            <RegleDuTemps
              etiquette="Les nuits tropicales de la référence aux trois horizons, valeurs isolées"
              jalons={[
                { annee: 1976, jusqua: 2005, libelle: "référence", valeur: `${REF.nuits}` },
                ...HORIZONS.map((x) => ({ annee: x, libelle: x === h ? "horizon lu" : "projection", valeur: `${PROJ[x].nuits}` })),
              ]}
            />
            {/* MANQUE 7 : la ligne d'état de la lecture enrichie (FUT-75 Q5), rien n'est remplacé d'office. */}
            <p className={t.etat} data-etat="attente">
              <span className={t.etatRepere} aria-hidden />
              <span className={s.dense}>Une lecture enrichie se prépare. La lecture ci-dessus est complète.</span>
            </p>
          </div>
        </Plaque>

        <div style={{ marginTop: 8 }}>
          <div>
            <section className={s.mouvement} aria-labelledby="m1">
              <div className={s.enTeteMouvement}>
                <Surtitre numero="01" id="m1">Ce qui change avec le climat</Surtitre>
              </div>
              <ul className={s.liste}>
                <li>
                  <Ligne marge={<Marge elements={[source, { type: "valeur", valeur: `${p.nuits} nuits/an`, date: `horizon ${h}` }]} />}>
                    <Registre teinte={TEINTE_REGISTRE.mismatches}>Des nuits chaudes nettement plus fréquentes</Registre>
                    <p className={s.corps}>
                      Les nuits où la température ne descend pas sous 20 °C passeraient de {REF.nuits} par an à {p.nuits} à l&apos;horizon {h}.
                      Le corps y récupère mal, surtout dans un logement qui garde la chaleur.
                    </p>
                    <Seuils horizon={h} mesures={[
                      { cle: "tropical_nights", valeur: p.nuits, seuil: 25, defavorable: p.nuits >= 25 },
                      { cle: "days_over_35", valeur: p.j35, seuil: 8, defavorable: p.j35 >= 8 },
                    ]} />
                    <p className={s.nuance}>Lue à l&apos;échelle de la commune, pas de l&apos;adresse ni du logement.</p>
                  </Ligne>
                </li>
                <li>
                  <Ligne marge={<Marge elements={[source, { type: "valeur", valeur: `${p.feux} j/an`, date: `horizon ${h}` }]} />}>
                    {/* Sans projet qui le demande, un constat n'a PAS de trait de registre : il reste à l'encre. */}
                    <Registre>Une météo plus souvent propice aux feux</Registre>
                    <p className={s.corps}>{p.feux} jours par an de danger météorologique élevé, contre {REF.feux} sur la période de référence.</p>
                    <p className={s.nuance}>Cet indice décrit des conditions météorologiques ; il ne mesure ni la végétation ni la probabilité d&apos;un incendie.</p>
                  </Ligne>
                </li>
              </ul>
            </section>

            <section className={s.mouvement} aria-labelledby="m2">
              <div className={s.enTeteMouvement}>
                <Surtitre numero="02" id="m2">Ce que la commune a déjà vécu</Surtitre>
              </div>
              <Ligne marge={<Marge elements={[{ type: "source", texte: "Reconnaissances CatNat (GASPAR)", grain: "commune" }, { type: "date", texte: "1982-2025" }]} />}>
                <p className={s.corps}>Quatre reconnaissances de catastrophe naturelle, dont trois pour la sécheresse des sols.</p>
                <RegleDuTemps
                  etiquette="Années des reconnaissances de catastrophe naturelle"
                  jalons={[
                    // Quatre jalons espacés : la règle n'écarte encore que deux libellés proches (limite
                    // consignée dans le rapport, § C). Cinq dates rapprochées s'y superposent.
                    { annee: 1989, libelle: "sécheresse" }, { annee: 2003, libelle: "sécheresse" }, { annee: 2011, libelle: "inondation" },
                    { annee: 2022, libelle: "sécheresse" },
                  ]}
                />
                <p className={s.nuance}>Un comptage administratif, pas une probabilité.</p>
              </Ligne>
            </section>

            <section className={s.mouvement} aria-labelledby="m3">
              <div className={s.enTeteMouvement}>
                <Surtitre numero="03" id="m3">Sa position parmi les communes de l&apos;Hexagone et de Corse</Surtitre>
              </div>
              {/* MANQUE 2 : le tableau de relevé. Le rang est DESSINÉ, en longueur, à l'encre seule. */}
              <table className={t.tableau}>
                <caption className={s.nuance}>Position parmi 34 788 communes, à l&apos;horizon {h}. Aucune note, aucun total.</caption>
                <thead>
                  <tr><th scope="col">Indicateur</th><th scope="col" className={t.nombre}>Valeur</th><th scope="col">Position</th><th scope="col">Source</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nuits tropicales</td>
                    <td className={t.nombre}>{p.nuits} nuits</td>
                    <td className={t.plein}><RegleDeRang bas={0.1} haut={0.2} sujet="les nuits tropicales" /></td>
                    <td className={`${t.plein} ${s.nuance}`}>DRIAS</td>
                  </tr>
                  <tr>
                    <td>Accès aux soins</td>
                    <td className={t.nombre}>2,9 consult./hab.</td>
                    <td className={t.plein}><RegleDeRang bas={0.7} haut={0.8} sujet="l'accès aux soins" /></td>
                    <td className={`${t.plein} ${s.nuance}`}>DREES, APL</td>
                  </tr>
                  <tr>
                    <td>Revenu médian</td>
                    {/* L'ABSENCE EST UNE INFORMATION : un tiret, une phrase, jamais un zéro ni une case vide. */}
                    <td className={t.nombre} aria-label="donnée absente">—</td>
                    <td className={`${t.plein} ${s.nuance}`}>Non publié pour cette commune (secret statistique).</td>
                    <td className={`${t.plein} ${s.nuance}`}>INSEE, Filosofi</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

        </div>
        {/* La coupe des échelles en pleine largeur. Posée dans une colonne de 320 px, elle passait
            quand même à trois colonnes : son seuil dépend de l'écran, pas de son conteneur (§ C). */}
        <section className={s.mouvementSerre} aria-label="Lire le lieu à une autre échelle">
          <div className={s.enTeteMouvement}><Surtitre numero="04">Lire le lieu à une autre échelle</Surtitre></div>
          <CoupeEchelles courante="territoire" liens={{ territoire: "/dev/fut118/territoire", logement: "/dev/fut87/logement" }} />
        </section>
      </main>
    </div>
  );
}
