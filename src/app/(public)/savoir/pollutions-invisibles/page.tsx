import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pollutions invisibles : ce que votre sol et votre air contiennent — futur•e',
  description:
    'Hydrocarbures dans les nappes, métaux lourds dans les terres agricoles, émissions industrielles dans l\'air ambiant. Ces pollutions s\'accumulent et dépendent de l\'histoire industrielle de votre commune.',
};

const css = `
  :root {
    --accent: #a78bfa;
    --accent-soft: rgba(167,139,250,0.12);
    --accent-border: rgba(167,139,250,0.28);
    --red: #f87171;
    --blue: #60a5fa;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.32;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:520px;height:520px;background:radial-gradient(circle,#a78bfa 0%,transparent 70%);top:-140px;left:-120px;}
  .orb-2{width:460px;height:460px;background:radial-gradient(circle,#60a5fa 0%,transparent 70%);bottom:-120px;right:-100px;animation-delay:-5s;}
  .orb-3{width:380px;height:380px;background:radial-gradient(circle,#f87171 0%,transparent 70%);top:50%;left:60%;opacity:0.16;animation-delay:-9s;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.15) translate(20px,-30px);}}

  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.028 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border-1);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--font-serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--fg-1);text-decoration:none;}
  .brand-dot{color:var(--accent);font-style:normal;}
  .nav-crumb{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--fg-3);text-decoration:none;}
  .nav-crumb .sep{margin:0 10px;}

  .article{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:72px 28px 120px;}

  .article-tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:var(--accent-soft);border:1px solid var(--accent-border);font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:28px;}
  .article-tag::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);}

  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(36px,5vw,54px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 24px;color:var(--fg-1);}
  h1 em{font-style:italic;color:var(--accent);}

  .article-intro{font-family:var(--font-serif);font-size:clamp(18px,2vw,22px);line-height:1.6;color:var(--fg-3);margin:0 0 48px;border-bottom:1px solid var(--border-1);padding-bottom:40px;}

  .article-meta{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:48px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-4);}

  h2{font-family:var(--font-serif);font-weight:400;font-size:clamp(24px,3vw,32px);line-height:1.2;letter-spacing:-0.01em;margin:64px 0 20px;color:var(--fg-1);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:18px;width:14px;height:1px;background:var(--accent);}

  h3{font-family:var(--font-serif);font-weight:400;font-size:20px;line-height:1.3;margin:36px 0 12px;color:var(--fg-1);font-style:italic;}

  p{margin:0 0 20px;color:var(--fg-1);font-size:17px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}
  .src{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);font-style:normal;}

  .keystat{margin:40px 0;padding:28px 32px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-left:2px solid var(--accent);border-radius:4px;position:relative;overflow:hidden;}
  .keystat::after{content:"";position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,var(--accent-soft) 0%,transparent 70%);pointer-events:none;}
  .keystat-number{font-family:var(--font-serif);font-size:52px;line-height:1;color:var(--accent);font-weight:400;letter-spacing:-0.02em;margin-bottom:8px;display:block;}
  .keystat-label{font-size:15px;color:var(--fg-3);line-height:1.5;position:relative;z-index:1;}
  .keystat-src{display:block;margin-top:10px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.05em;}

  .keystat.alert{border-left-color:var(--red);}
  .keystat.alert::after{background:radial-gradient(circle,rgba(248,113,113,0.1) 0%,transparent 70%);}
  .keystat.alert .keystat-number{color:var(--red);}

  .keystat.blue{border-left-color:var(--blue);}
  .keystat.blue::after{background:radial-gradient(circle,rgba(96,165,250,0.1) 0%,transparent 70%);}
  .keystat.blue .keystat-number{color:var(--blue);}

  .substance-table{width:100%;border-collapse:collapse;margin:32px 0;font-size:14px;}
  .substance-table th{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);font-weight:400;padding:10px 14px;border-bottom:1px solid var(--border-hi);text-align:left;}
  .substance-table td{padding:14px;border-bottom:1px solid var(--border-1);color:var(--fg-3);vertical-align:top;line-height:1.55;}
  .substance-table td:first-child{color:var(--fg-1);font-weight:500;}
  .substance-table tr:last-child td{border-bottom:none;}
  .badge{display:inline-block;font-family:var(--font-mono);font-size:9px;letter-spacing:0.08em;text-transform:uppercase;padding:2px 7px;border-radius:3px;white-space:nowrap;}
  .badge-red{background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.25);color:#fca5a5;}
  .badge-orange{background:rgba(251,146,60,0.12);border:1px solid rgba(251,146,60,0.25);color:#fdba74;}
  .badge-violet{background:var(--accent-soft);border:1px solid var(--accent-border);color:#c4b5fd;}
  .badge-blue{background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.25);color:#93c5fd;}

  .exposure-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:32px 0;}
  .exposure-card{padding:20px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:6px;}
  .exposure-icon{font-size:22px;margin-bottom:10px;}
  .exposure-title{font-weight:500;font-size:14px;color:var(--fg-1);margin-bottom:6px;}
  .exposure-desc{font-size:13px;color:var(--fg-3);line-height:1.55;}

  .irep-note{margin:32px 0;padding:20px 24px;background:rgba(167,139,250,0.06);border:1px solid var(--accent-border);border-radius:6px;font-size:14px;color:var(--fg-3);line-height:1.65;}
  .irep-note strong{color:var(--fg-1);}
  .irep-note a{color:var(--accent);text-decoration:none;border-bottom:1px solid var(--accent-border);}

  .actions-card{margin:56px 0 32px;padding:28px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:8px;}
  .actions-card-head{font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);margin-bottom:18px;}
  .actions-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;}
  .actions-list li a{display:flex;align-items:center;justify-content:space-between;padding:16px 0;color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-1);font-family:var(--font-serif);font-size:20px;font-style:italic;transition:padding 0.25s ease,color 0.25s ease;}
  .actions-list li:last-child a{border-bottom:none;}
  .actions-list li a:hover{padding-left:8px;color:var(--accent);}
  .actions-list .arrow{font-family:var(--font-sans);font-style:normal;font-size:14px;color:var(--fg-4);transition:transform 0.25s ease,color 0.25s ease;}
  .actions-list li a:hover .arrow{transform:translateX(4px);color:var(--accent);}

  .sources{margin-top:72px;padding-top:40px;border-top:1px solid var(--border-1);}
  .sources h2{font-size:18px;font-family:var(--font-mono);font-style:normal;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-3);margin-bottom:24px;}
  .sources h2::before{display:none;}
  .sources ul{list-style:none;padding:0;margin:0;display:grid;gap:14px;}
  .sources li{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:baseline;font-size:14px;color:var(--fg-3);line-height:1.55;}
  .src-tag{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-4);padding:3px 8px;border:1px solid var(--border-1);border-radius:3px;white-space:nowrap;}
  .sources a{color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-hi);transition:color 0.2s,border-color 0.2s;}
  .sources a:hover{color:var(--accent);border-color:var(--accent);}

  .page-footer{position:relative;z-index:2;border-top:1px solid var(--border-1);padding:28px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;}
  .footer-note{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.06em;text-transform:uppercase;line-height:1.7;}

  @media(max-width:680px){
    .article{padding:48px 20px 80px;}
    h2::before{display:none;}
    .exposure-grid{grid-template-columns:1fr;}
    .substance-table{font-size:13px;}
    .substance-table th,.substance-table td{padding:10px 8px;}
  }
`;

export default function PollutionsInvisiblesPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="brand">
            futur<span className="brand-dot">•</span>e
          </Link>
          <div className="nav-crumb">
            <Link href="/savoir">Pages Savoir</Link>
            <span className="sep">/</span>
            Pollutions invisibles
          </div>
        </div>
      </nav>

      <article className="article">

        <div className="article-tag">Santé environnementale</div>

        <h1>
          Ce que votre sol<br />
          et votre air<br />
          <em>contiennent vraiment.</em>
        </h1>

        <p className="article-intro">
          Hydrocarbures dans les nappes, métaux lourds dans les terres agricoles, émissions industrielles dans l&apos;air ambiant. Ces pollutions ne se voient pas, n&apos;ont pas d&apos;odeur, ne déclenchent pas d&apos;alerte. Elles s&apos;accumulent, et leur présence dépend largement de l&apos;histoire industrielle et géologique de votre commune.
        </p>

        <div className="article-meta">
          <span>Santé publique France</span>
          <span>IREP · Géorisques</span>
          <span>GisSol · ANSES</span>
          <span>Mai 2026</span>
        </div>

        <p>
          En France, <strong>plus de 7 000 sites industriels classés ICPE</strong> rejettent chaque année des substances dans l&apos;air, les eaux et les sols environnants. À côté de ces rejets mesurés et déclarés, des milliers d&apos;anciens sites industriels laissent des héritages invisibles dans les terrains qui les ont remplacés : parkings, zones pavillonnaires, jardins. La pollution ne disparaît pas avec les cheminées.
        </p>

        <p>
          Ce n&apos;est pas une question abstraite de politiques publiques. C&apos;est une question de territoire. Deux communes distantes de dix kilomètres peuvent avoir des profils de pollution radicalement différents selon ce qui s&apos;y est construit, extrait ou fabriqué au cours du siècle passé.
        </p>

        <h2>Ce qui se trouve dans les sols</h2>

        <p>
          Les sols sont des archives. Ils gardent la trace de ce qui a été épandu, déversé ou accidentellement répandu pendant des décennies. Contrairement à l&apos;air ou à l&apos;eau, ils ne se régénèrent pas spontanément. Un sol contaminé en 1970 l&apos;est encore en 2026, souvent sans que les habitants actuels le sachent.
        </p>

        <h3>Les métaux lourds</h3>

        <p>
          Le cadmium, le plomb, l&apos;arsenic, le mercure et le zinc sont présents naturellement dans certains types de roches, mais leurs concentrations peuvent être fortement amplifiées par l&apos;activité humaine. Les zones ayant accueilli des fonderies, des tanneries, des mines ou une agriculture intensive aux engrais phosphatés présentent souvent des teneurs supérieures aux valeurs de référence nationales.
        </p>

        <p>
          <strong>Le plomb</strong> est particulièrement documenté dans les sols urbains anciens. Les peintures au plomb, les carburants plombés utilisés jusqu&apos;en 2000 et les anciennes canalisations ont laissé des dépôts persistants, notamment dans les jardins de centre-ville et les espaces verts des quartiers anciens. <span className="src">Source : BRGM, cartographie des sols urbains</span>
        </p>

        <p>
          <strong>L&apos;arsenic</strong> est présent à des concentrations préoccupantes dans les communes ayant accueilli des industries du verre, des arsenicières ou des traitements du bois. Certaines zones viticoles du Languedoc et du Bordelais présentent également des teneurs élevées liées à l&apos;usage historique de pesticides arsenicaux. <span className="src">Source : GisSol · ADEME</span>
        </p>

        <div className="keystat alert">
          <span className="keystat-number">4 400</span>
          <div className="keystat-label">sites et sols pollués ou potentiellement pollués recensés dans la base nationale Basias/Basol, dont une large part sous des zones aujourd&apos;hui résidentielles ou agricoles.</div>
          <span className="keystat-src">Source : Ministère de la Transition écologique · Géorisques 2025</span>
        </div>

        <h3>Les hydrocarbures</h3>

        <p>
          Les hydrocarbures — pétrole, gazole, huiles usagées — contaminent les sols à la faveur de fuites de cuves enterrées, d&apos;accidents de transport ou de déversements industriels. Les anciennes stations-service, dépôts de carburant et garages mécaniques sont les sources les plus courantes de contamination résiduelle. <strong>La présence de ces composés dans un sol ne se détecte ni à l&apos;odeur ni à la vue</strong> dans les concentrations habituellement rencontrées.
        </p>

        <p>
          Certains hydrocarbures aromatiques polycycliques (HAP), comme le benzo[a]pyrène, sont classés cancérogènes certains pour l&apos;homme par le Centre international de recherche sur le cancer (CIRC). Leur présence dans les sols d&apos;anciens sites industriels est fréquente et bien documentée. <span className="src">Source : CIRC · ANSES</span>
        </p>

        <h3>Les solvants chlorés</h3>

        <p>
          Le trichloréthylène et le tétrachloréthylène ont été massivement utilisés dans les industries du nettoyage, de l&apos;électronique et de la métallurgie. Ces composés migrent facilement vers les nappes phréatiques, ce qui les rend difficiles à confiner une fois déversés. Plusieurs communes en France ont fait l&apos;objet de mesures de restriction d&apos;usage des eaux souterraines suite à la détection de ces molécules dans les captages d&apos;eau potable. <span className="src">Source : BRGM · ARS</span>
        </p>

        <h2>Ce qui se trouve dans l&apos;air</h2>

        <p>
          La qualité de l&apos;air est mieux surveillée que la qualité des sols. Les réseaux ATMO mesurent en continu les principaux polluants dans les grandes agglomérations. Mais la surveillance a des limites géographiques et des angles morts : elle ne couvre pas systématiquement les zones péri-urbaines et rurales proches d&apos;installations industrielles isolées.
        </p>

        <div className="exposure-grid">
          <div className="exposure-card">
            <div className="exposure-icon">🏭</div>
            <div className="exposure-title">Émissions industrielles déclarées</div>
            <div className="exposure-desc">Les installations classées ICPE déclarent annuellement leurs rejets dans l&apos;air via le registre IREP. Dioxines, métaux lourds, composés organiques volatils, particules fines. Toutes les communes dans un rayon de plusieurs kilomètres d&apos;une telle installation sont potentiellement concernées.</div>
          </div>
          <div className="exposure-card">
            <div className="exposure-icon">🚗</div>
            <div className="exposure-title">Trafic et combustion</div>
            <div className="exposure-desc">Le NO₂ et les particules fines issues du trafic routier sont les polluants les plus documentés en termes d&apos;impact sanitaire. Les axes à fort trafic génèrent des expositions chroniques dans un rayon de 150 à 300 mètres. Les populations qui vivent à proximité de rocades ou d&apos;autoroutes sont structurellement plus exposées.</div>
          </div>
          <div className="exposure-card">
            <div className="exposure-icon">🌾</div>
            <div className="exposure-title">Agriculture et pesticides</div>
            <div className="exposure-desc">Les produits phytosanitaires appliqués sur les cultures se retrouvent dans l&apos;air ambiant par volatilisation et dérive. Les riverains de zones agricoles intensives, notamment viticoles ou maraîchères, sont exposés à des mélanges de substances dont les effets combinés sont encore peu étudiés.</div>
          </div>
          <div className="exposure-card">
            <div className="exposure-icon">🔥</div>
            <div className="exposure-title">Incinération et chauffage</div>
            <div className="exposure-desc">Les unités d&apos;incinération d&apos;ordures ménagères, les chaufferies au bois non normées et les épisodes de brûlage agricole génèrent des dioxines et des HAP. Ces émissions ponctuelles mais intenses peuvent dépasser les seuils réglementaires lors d&apos;épisodes défavorables de dispersion atmosphérique.</div>
          </div>
        </div>

        <table className="substance-table">
          <thead>
            <tr>
              <th>Substance</th>
              <th>Source principale</th>
              <th>Voie d&apos;exposition</th>
              <th>Effet documenté</th>
              <th>Classement CIRC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Benzo[a]pyrène (HAP)</td>
              <td>Industrie, trafic, chauffage bois</td>
              <td>Air, sol, alimentation</td>
              <td>Cancérogène pulmonaire, cutané</td>
              <td><span className="badge badge-red">Groupe 1</span></td>
            </tr>
            <tr>
              <td>Plomb</td>
              <td>Anciens sites industriels, peintures, carburants</td>
              <td>Sol ingéré, poussières</td>
              <td>Neurotoxique, développement enfant</td>
              <td><span className="badge badge-red">Groupe 1</span></td>
            </tr>
            <tr>
              <td>Arsenic</td>
              <td>Industries du verre, pesticides historiques</td>
              <td>Sol, eau, alimentation</td>
              <td>Cancérogène peau, poumon, vessie</td>
              <td><span className="badge badge-red">Groupe 1</span></td>
            </tr>
            <tr>
              <td>Trichloréthylène</td>
              <td>Nettoyage industriel, mécanique</td>
              <td>Air intérieur, eau souterraine</td>
              <td>Cancérogène rénal</td>
              <td><span className="badge badge-red">Groupe 1</span></td>
            </tr>
            <tr>
              <td>Dioxines / furanes</td>
              <td>Incinération, industrie chimique</td>
              <td>Air, alimentation (graisses)</td>
              <td>Perturbateur endocrinien, cancérogène</td>
              <td><span className="badge badge-red">Groupe 1</span></td>
            </tr>
            <tr>
              <td>Cadmium</td>
              <td>Engrais phosphatés, fonderies</td>
              <td>Alimentation, inhalation</td>
              <td>Cancérogène rénal et pulmonaire</td>
              <td><span className="badge badge-red">Groupe 1</span></td>
            </tr>
            <tr>
              <td>NO₂ (dioxyde d&apos;azote)</td>
              <td>Trafic routier, combustion</td>
              <td>Air</td>
              <td>Atteinte pulmonaire, développement enfant</td>
              <td><span className="badge badge-orange">Non classé</span></td>
            </tr>
            <tr>
              <td>PM2.5 (particules fines)</td>
              <td>Trafic, chauffage, industrie</td>
              <td>Air</td>
              <td>Cardiovasculaire, pulmonaire, mortalité</td>
              <td><span className="badge badge-red">Groupe 1</span></td>
            </tr>
            <tr>
              <td>Solvants chlorés</td>
              <td>Industrie électronique, nettoyage à sec</td>
              <td>Air intérieur, eau</td>
              <td>Hépatotoxique, neurotoxique</td>
              <td><span className="badge badge-violet">Groupe 2A/2B</span></td>
            </tr>
          </tbody>
        </table>

        <h2>Pourquoi ces expositions dépendent de votre commune</h2>

        <p>
          La présence de ces substances dans votre environnement immédiat n&apos;est pas uniforme sur le territoire français. Elle dépend de trois facteurs superposés : l&apos;histoire industrielle locale, la géologie du sous-sol et les activités agricoles passées et présentes.
        </p>

        <p>
          Une commune qui a accueilli une fonderie au XIXe siècle peut présenter des teneurs en métaux lourds durablement élevées dans ses sols, même si l&apos;usine a disparu depuis soixante ans. Une commune en zone de grandes cultures intensives cumule des expositions aux pesticides et aux nitrates que ses voisines à dominante forestière n&apos;ont pas. Une commune traversée par un axe autoroutier est structurellement plus exposée au NO₂ et aux PM2.5 qu&apos;une commune rurale à faible trafic, même si leur indice ATMO annuel moyen est voisin.
        </p>

        <div className="keystat blue">
          <span className="keystat-number">38 %</span>
          <div className="keystat-label">des cours d&apos;eau français présentaient en 2023 des dépassements de normes pour au moins un pesticide. La contamination des nappes phréatiques et des sols environnants suit une logique similaire dans les bassins agricoles intensifs.</div>
          <span className="keystat-src">Source : Agences de l&apos;eau · Rapport sur l&apos;état des eaux 2024</span>
        </div>

        <h2>Ce que vous pouvez vérifier</h2>

        <p>
          Plusieurs bases de données publiques permettent de commencer à cartographier la situation de votre commune, sans expertise technique préalable.
        </p>

        <div className="irep-note">
          <strong>Le registre IREP</strong> (Inspection des installations classées pour la protection de l&apos;environnement) recense toutes les déclarations annuelles de rejets polluants des installations industrielles françaises, par commune et par substance. Vous pouvez y rechercher ce qu&apos;une usine proche de chez vous déclare rejeter dans l&apos;air ou dans l&apos;eau. Ce registre ne couvre que les rejets déclarés et mesurés — il ne dit rien des pollutions héritées ou des émissions diffuses non mesurées.{' '}
          <a href="https://www.georisques.gouv.fr/risques/installations" target="_blank" rel="noopener noreferrer">Consulter les installations sur Géorisques →</a>
        </div>

        <p>
          <strong>La base Basias</strong> recense les anciens sites industriels et de service susceptibles d&apos;avoir engendré une pollution des sols. Elle ne garantit pas la présence d&apos;une pollution, mais elle signale les zones de vigilance. La base <strong>Basol</strong> recense quant à elle les sites dont la pollution est avérée et fait l&apos;objet d&apos;une procédure administrative. <span className="src">Source : Géorisques · Ministère de la Transition écologique</span>
        </p>

        <p>
          <strong>Le réseau GisSol</strong> publie des cartographies des teneurs en métaux lourds des sols agricoles français à l&apos;échelle départementale et régionale. Ces données permettent de situer votre commune dans son contexte géologique et agronomique. <span className="src">Source : GisSol · ADEME · INRAE</span>
        </p>

        <h2>Ce que cela change pour votre vie quotidienne</h2>

        <p>
          Ces expositions ne provoquent pas de symptômes immédiats identifiables. Elles agissent dans la durée, par accumulation, à des niveaux que les études épidémiologiques ont progressivement associés à des effets sur la santé — développement neurologique des enfants, risques cardiovasculaires, cancers à long terme — sans qu&apos;il soit possible d&apos;établir un lien de causalité individuel.
        </p>

        <p>
          Ce que cela change concrètement dépend de votre situation. <strong>Si vous avez un jardin potager</strong> en zone urbaine ancienne ou à proximité d&apos;un ancien site industriel, une analyse de sol est utile avant de consommer ce que vous y cultivez. <strong>Si vous avez de jeunes enfants</strong> qui jouent dans des espaces extérieurs dans des zones potentiellement concernées, le lavage des mains et la limitation du contact avec la terre sont des gestes simples et documentés. <strong>Si vous êtes locataire ou propriétaire d&apos;un bien</strong> situé sur ou à proximité d&apos;un ancien site recensé dans Basol, vous avez le droit d&apos;accéder aux études de diagnostic réalisées par les autorités.
        </p>

        <div className="keystat">
          <span className="keystat-number">150 m</span>
          <div className="keystat-label">c&apos;est le rayon dans lequel les émissions atmosphériques d&apos;une installation industrielle ont un impact mesurable et persistant sur la qualité de l&apos;air ambiant, selon les études de modélisation de dispersion de l&apos;INERIS. Au-delà, les concentrations diminuent rapidement mais restent mesurables jusqu&apos;à plusieurs kilomètres pour certains polluants.</div>
          <span className="keystat-src">Source : INERIS · Modélisation de la dispersion atmosphérique</span>
        </div>

        <h2>La question des seuils et de ce qu&apos;ils ne disent pas</h2>

        <p>
          Les valeurs réglementaires qui définissent ce qui est &quot;acceptable&quot; ou &quot;dangereux&quot; sont des compromis entre protection sanitaire, faisabilité technique et intérêts économiques. Elles sont révisées à la hausse régulièrement à mesure que la recherche affine sa compréhension des effets chroniques à faible dose.
        </p>

        <p>
          <strong>Il n&apos;existe pas de seuil en dessous duquel une exposition est sans effet.</strong> C&apos;est la position de l&apos;OMS sur les particules fines PM2.5, du CIRC sur les cancérogènes du groupe 1, et de l&apos;ANSES sur plusieurs métaux lourds. Ce que les seuils réglementaires garantissent, c&apos;est l&apos;absence d&apos;effet aigu documenté à court terme, pas l&apos;absence de tout risque sur une vie entière.
        </p>

        <p>
          Cela ne signifie pas qu&apos;il faut s&apos;alarmer pour chaque substance détectée en trace. Cela signifie que <strong>la question pertinente n&apos;est pas &quot;est-ce conforme ?&quot; mais &quot;quelle est mon exposition cumulée, et que puis-je en réduire ?&quot;</strong>. C&apos;est une question de territoire autant que de comportement individuel.
        </p>

        <div className="actions-card">
          <div className="actions-card-head">Pages associées</div>
          <ul className="actions-list">
            <li>
              <Link href="/agir/pollutions-invisibles">
                Agir face aux pollutions invisibles
                <span className="arrow">→</span>
              </Link>
            </li>
            <li>
              <Link href="/savoir/cadmium">
                Le cadmium dans l&apos;alimentation
                <span className="arrow">→</span>
              </Link>
            </li>
            <li>
              <Link href="/savoir/dependance-auto">
                Dépendance automobile et qualité de l&apos;air local
                <span className="arrow">→</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="sources">
          <h2>Sources</h2>
          <ul>
            <li>
              <span className="src-tag">ANSES</span>
              <span>Agence nationale de sécurité sanitaire — avis et rapports sur les substances chimiques dans les sols et l&apos;air. <a href="https://www.anses.fr" target="_blank" rel="noopener noreferrer">anses.fr</a></span>
            </li>
            <li>
              <span className="src-tag">CIRC</span>
              <span>Centre international de recherche sur le cancer — monographies sur les cancérogènes, groupes de classification 1 à 4. <a href="https://monographs.iarc.who.int" target="_blank" rel="noopener noreferrer">monographs.iarc.who.int</a></span>
            </li>
            <li>
              <span className="src-tag">IREP</span>
              <span>Registre français des émissions polluantes — rejets déclarés par installation industrielle, par commune et par substance. <a href="https://www.georisques.gouv.fr" target="_blank" rel="noopener noreferrer">georisques.gouv.fr</a></span>
            </li>
            <li>
              <span className="src-tag">GisSol</span>
              <span>Groupement d&apos;intérêt scientifique sur les sols — cartographies des teneurs en métaux lourds des sols français. <a href="https://www.gissol.fr" target="_blank" rel="noopener noreferrer">gissol.fr</a></span>
            </li>
            <li>
              <span className="src-tag">BRGM</span>
              <span>Bureau de recherches géologiques et minières — base de données Basias et Basol sur les anciens sites industriels et les sites pollués. <a href="https://www.georisques.gouv.fr" target="_blank" rel="noopener noreferrer">georisques.gouv.fr</a></span>
            </li>
            <li>
              <span className="src-tag">INERIS</span>
              <span>Institut national de l&apos;environnement industriel et des risques — études de modélisation de la dispersion atmosphérique et valeurs guide de qualité de l&apos;air. <a href="https://www.ineris.fr" target="_blank" rel="noopener noreferrer">ineris.fr</a></span>
            </li>
            <li>
              <span className="src-tag">OMS</span>
              <span>Organisation mondiale de la santé — lignes directrices sur la qualité de l&apos;air, révision 2021. <a href="https://www.who.int/publications/i/item/9789240034228" target="_blank" rel="noopener noreferrer">who.int</a></span>
            </li>
            <li>
              <span className="src-tag">Agences de l&apos;eau</span>
              <span>Rapport sur l&apos;état des eaux 2024 — dépassements de normes pesticides dans les cours d&apos;eau et les nappes phréatiques.</span>
            </li>
          </ul>
        </div>

      </article>

      <footer className="page-footer">
        <Link href="/" className="brand" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '18px', color: 'var(--fg-3)', textDecoration: 'none' }}>
          futur<span style={{ color: 'var(--accent)', fontStyle: 'normal' }}>•</span>e
        </Link>
        <div className="footer-note">
          Données publiques françaises · Aucune publicité<br />
          Page Savoir · Santé environnementale · Mai 2026
        </div>
      </footer>
    </>
  );
}
