// INDEX LOCAL DES LOTS D'ARTICLES MOBILITÉ. DEV UNIQUEMENT.
//
// Une ligne par commune : état, titre et chapeau de l'article s'il existe, liens vers dossier, complément, rendu,
// contrôles et visuels, anomalies et interventions manuelles restantes, durées et dépense équivalente. Relit l'état
// écrit par `outil/lot.py` à chaque requête. Aucun état affiché ne vaut autorisation de publication.
import { existsSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { articleDe, lireLot, listeLots, LOTS } from "./source";

export const dynamic = "force-dynamic";

const css = `
  .lot{background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);min-height:100vh;padding:40px 24px 80px;}
  .lot-page{max-width:1100px;margin:0 auto;}
  .lot h1{font-family:var(--font-serif);font-weight:var(--weight-title);font-size:var(--text-title);margin:0 0 6px;}
  .lot .sous{color:var(--fg-3);font-size:14px;margin:0 0 28px;}
  .lot h2{font-size:18px;margin:36px 0 12px;}
  .lot-carte{border:1px solid var(--border-1);border-radius:10px;padding:16px 18px;margin:0 0 12px;}
  .lot-tete{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:baseline;}
  .lot-nom{font-weight:600;font-size:16px;}
  .lot-etat{font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:99px;border:1px solid var(--border-hi);color:var(--fg-2);}
  .lot-etat.ok{border-color:#3c8f5a;color:#3c8f5a;} .lot-etat.ko{border-color:#c0563c;color:#c0563c;}
  .lot-meta{font-size:12.5px;color:var(--fg-4);}
  .lot-titre{font-family:var(--font-serif);font-size:17px;margin:10px 0 4px;}
  .lot-chapeau{font-size:14px;color:var(--fg-3);line-height:1.55;margin:0 0 8px;}
  .lot-liens{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;margin:8px 0 0;}
  .lot a{color:var(--fg-1);text-decoration:underline;text-decoration-color:var(--border-hi);text-underline-offset:3px;}
  .lot ul{margin:8px 0 0;padding-left:18px;font-size:13px;color:var(--fg-3);}
  .lot li{margin:2px 0;}
  .lot .alerte{color:#c0563c;}
`;

const bon = new Set(["dossier prêt", "prêt à relire"]);
const lien = (lot: string, f: string) => `/dev/lot/fichier?lot=${lot}&f=${encodeURIComponent(f)}`;

export default async function IndexLots() {
  if (process.env.NODE_ENV === "production") notFound();
  const lots = await listeLots();
  const vues = await Promise.all(lots.map(lireLot));
  return (
    <div className="lot">
      <style>{css}</style>
      <div className="lot-page">
        <h1>Lots d&apos;articles mobilité</h1>
        <p className="sous">Prévisualisation interne · non publiée · état écrit par <code>outil/lot.py</code>. Aucun état ne vaut autorisation de publication.</p>
        {vues.map((v) => (
          <section key={v.nom}>
            <h2>
              {v.nom} · moteur {v.conf.moteur?.outil ?? "?"} · dépense {v.depenses.toFixed(2)} $ équivalent
            </h2>
            {Object.entries(v.communes).map(async ([cle, c]) => {
              const insee = c.insee;
              const art = insee ? await articleDe(v.nom, insee, c) : null;
              const titre = art?.match(/^# (.+)$/m)?.[1];
              const chapeau = art?.match(/^\*\*(.+)\*\*$/m)?.[1];
              const echecs = Object.entries(c.etapes ?? {}).filter(([, e]) => !e.ok);
              const f = (rel: string) => insee && existsSync(path.join(LOTS, v.nom, insee, rel));
              return (
                <div className="lot-carte" key={cle}>
                  <div className="lot-tete">
                    <span className="lot-nom">{c.nom}</span>
                    <span className="lot-meta">{insee ?? c.demande}</span>
                    <span className={`lot-etat ${bon.has(c.statut) ? "ok" : echecs.length || c.statut === "données insuffisantes" ? "ko" : ""}`}>{c.statut}</span>
                    {c.duree_preparation_s != null && <span className="lot-meta">préparation {c.duree_preparation_s} s (mesuré)</span>}
                  </div>
                  {c.motif && <p className="lot-meta alerte">{c.motif}</p>}
                  {titre && <p className="lot-titre">{titre}</p>}
                  {chapeau && <p className="lot-chapeau">{chapeau}</p>}
                  {insee && (
                    <div className="lot-liens">
                      {art && <a href={`/dev/lot/${v.nom}/${insee}`}>Lire l&apos;article</a>}
                      {f("dossier/dossier.md") && <a href={lien(v.nom, `${insee}/dossier/dossier.md`)}>Dossier</a>}
                      {f("dossier/complement.json") && <a href={lien(v.nom, `${insee}/dossier/complement.json`)}>Complément et sources</a>}
                      {f("fiche/comparaison_voiture.json") && <a href={lien(v.nom, `${insee}/fiche/comparaison_voiture.json`)}>Repère de comparaison</a>}
                      {c.article && <a href={lien(v.nom, `${insee}/generation/${c.article}`)}>Rendu complet (A à E)</a>}
                      {f("generation/redaction.controle.json") && <a href={lien(v.nom, `${insee}/generation/redaction.controle.json`)}>Contrôle</a>}
                      {f("generation/relecture.anomalies.json") && <a href={lien(v.nom, `${insee}/generation/relecture.anomalies.json`)}>Relecture</a>}
                      {f(`visuels/tableau_iris_${insee}.html`) && <a href={lien(v.nom, `${insee}/visuels/tableau_iris_${insee}.html`)}>Tableau des secteurs</a>}
                    </div>
                  )}
                  {(echecs.length > 0 || (c.anomalies_restantes?.length ?? 0) > 0 || (c.manuel?.length ?? 0) > 0) && (
                    <ul>
                      {echecs.map(([k, e]) => <li key={k} className="alerte">Étape {k} en échec : {e.erreur}</li>)}
                      {c.anomalies_restantes?.map((a, i) => <li key={`a${i}`} className="alerte">{a.type ?? a.categorie} : {a.detail ?? a.probleme}</li>)}
                      {c.manuel?.map((m, i) => <li key={`m${i}`}>À faire à la main : {m}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        ))}
        {vues.length === 0 && <p>Aucun lot. Créer <code>lots/&lt;nom&gt;/lot.json</code>, puis <code>python outil/lot.py preparer lots/&lt;nom&gt;</code>.</p>}
      </div>
    </div>
  );
}
