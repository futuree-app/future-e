import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Le cadmium dans l'alimentation · futur•e",
  description:
    "Près d'un Français sur deux est surexposé au cadmium par son alimentation. Pourquoi nos sols contiennent-ils ces doses, et qu'est-ce qui peut changer ?",
};

const css = `
  :root {
  --accent: #f87171;
    --accent-soft: rgba(248, 113, 113, 0.14);
    --accent-border: rgba(248, 113, 113, 0.3);
}

  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: var(--bg);
    color: var(--fg-1);
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.65;
    overflow-x: hidden;
    max-width: 100vw;
    -webkit-font-smoothing: antialiased;
  }

  .orb {
    position: fixed; border-radius: 50%;
    filter: blur(120px); opacity: 0.35;
    pointer-events: none; z-index: 0;
    animation: breathe 14s ease-in-out infinite;
  }
  .orb-1 { width:520px;height:520px;background:radial-gradient(circle,#f87171 0%,transparent 70%);top:-140px;left:-120px; }
  .orb-2 { width:460px;height:460px;background:radial-gradient(circle,#a78bfa 0%,transparent 70%);bottom:-120px;right:-100px;animation-delay:-5s; }
  .orb-3 { width:380px;height:380px;background:radial-gradient(circle,#fb923c 0%,transparent 70%);top:50%;left:60%;opacity:0.18;animation-delay:-9s; }
  @keyframes breathe {
    0%,100% { transform: scale(1) translate(0,0); }
    50% { transform: scale(1.15) translate(20px,-30px); }
  }

  body::before {
    content:""; position:fixed; inset:0;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.035 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events:none; z-index:1; mix-blend-mode:overlay;
  }

  .nav { position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border-1); }
  .nav-inner { max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px; }
  .brand { font-family:var(--font-serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--fg-1);text-decoration:none; }
  .brand-dot { color:var(--accent);font-style:normal; }
  .nav-crumb { font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase; }
  .nav-crumb a { color:var(--fg-3);text-decoration:none;transition:color 0.2s; }
  .nav-crumb a:hover { color:var(--fg-1); }
  .nav-crumb .sep { margin:0 10px;color:var(--fg-4); }

  .article { position:relative;z-index:2;max-width:760px;margin:0 auto;padding:64px 28px 120px; }

  .article-meta { display:flex;align-items:center;gap:16px;margin-bottom:28px;flex-wrap:wrap; }
  .tag { display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:var(--accent-soft);border:1px solid var(--accent-border);font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent); }
  .tag::before { content:"";width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent); }
  .read-info { font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase; }

  h1 { font-family:var(--font-serif);font-weight:400;font-size:clamp(40px,6vw,64px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fg-1); }
  h1 em { font-style:italic;color:var(--accent); }

  .lede { font-family:var(--font-serif);font-size:clamp(20px,2.2vw,24px);line-height:1.5;color:var(--fg-1);font-weight:400;margin:0 0 48px;padding:0 0 48px;border-bottom:1px solid var(--border-1); }

  .dates { display:flex;align-items:center;gap:20px;margin:0 0 40px;padding:16px 20px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:6px;width:fit-content;max-width:100%; }
  .date-item { display:flex;flex-direction:column;gap:4px; }
  .date-label { font-family:var(--font-mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4); }
  .date-value { font-family:var(--font-sans);font-size:14px;color:var(--fg-1);font-weight:500; }
  .date-value-muted { color:var(--fg-4);font-weight:400; }
  .date-sep { width:1px;height:28px;background:var(--border-hi); }

  h2 { font-family:var(--font-serif);font-weight:400;font-size:clamp(26px,3vw,34px);line-height:1.2;letter-spacing:-0.01em;margin:56px 0 20px;color:var(--fg-1);position:relative; }
  h2::before { content:"";position:absolute;left:-28px;top:18px;width:14px;height:1px;background:var(--accent); }

  p { margin:0 0 20px;color:var(--fg-1);font-size:17px;line-height:1.72; }
  p strong { font-weight:500;color:#fff; }

  .src { font-family:var(--font-mono);font-size:12px;color:var(--fg-4);font-style:normal; }

  .keystat { margin:40px 0;padding:28px 32px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-left:2px solid var(--accent);border-radius:4px;position:relative;overflow:hidden; }
  .keystat::after { content:"";position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,var(--accent-soft) 0%,transparent 70%);pointer-events:none; }
  .keystat-number { font-family:var(--font-serif);font-size:52px;line-height:1;color:var(--accent);font-weight:400;letter-spacing:-0.02em;margin-bottom:8px;display:block; }
  .keystat-label { font-size:15px;color:var(--fg-3);line-height:1.5;position:relative;z-index:1; }
  .keystat-src { display:block;margin-top:10px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.05em; }

  .actions-card { margin:48px 0 32px;padding:28px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:8px; }
  .actions-card-head { font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);margin-bottom:18px; }
  .actions-list { list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px; }
  .actions-list li a { display:flex;align-items:center;justify-content:space-between;padding:16px 0;color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-1);font-family:var(--font-serif);font-size:20px;font-style:italic;transition:padding 0.25s ease,color 0.25s ease; }
  .actions-list li:last-child a { border-bottom:none; }
  .actions-list li a:hover { padding-left:8px;color:var(--accent); }
  .actions-list .arrow { font-family:var(--font-sans);font-style:normal;font-size:14px;color:var(--fg-4);transition:transform 0.25s ease,color 0.25s ease; }
  .actions-list li a:hover .arrow { transform:translateX(4px);color:var(--accent); }

  .map-figure { margin:44px -20px;padding:32px 28px 28px;background:var(--bg-elev);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:8px;position:relative;overflow:hidden; }
  .map-figure::before { content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 30%,rgba(248,113,113,0.06) 0%,transparent 50%);pointer-events:none; }
  .france-map { display:block;width:100%;max-width:460px;height:auto;margin:0 auto 20px;position:relative;z-index:1; }
  .map-figure figcaption { font-size:13px;color:var(--fg-3);line-height:1.55;text-align:center;padding:18px 0 0;border-top:1px solid var(--border-1);position:relative;z-index:1; }
  .map-figure figcaption a { color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-hi);transition:color 0.2s,border-color 0.2s; }
  .map-figure figcaption a:hover { color:var(--accent);border-color:var(--accent); }

  .sources { margin-top:72px;padding-top:40px;border-top:1px solid var(--border-1); }
  .sources h2 { font-size:20px;font-family:var(--font-mono);font-style:normal;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-3);margin-bottom:24px; }
  .sources h2::before { display:none; }
  .sources ul { list-style:none;padding:0;margin:0;display:grid;gap:14px; }
  .sources li { display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:baseline;font-size:14px;color:var(--fg-3);line-height:1.55; }
  .sources .src-tag { font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-4);padding:3px 8px;border:1px solid var(--border-1);border-radius:3px;white-space:nowrap; }
  .sources a { color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-hi);transition:color 0.2s,border-color 0.2s; }
  .sources a:hover { color:var(--accent);border-color:var(--accent); }

  .page-footer { position:relative;z-index:2;max-width:760px;margin:0 auto;padding:40px 28px 80px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase; }
  .page-footer a { color:var(--fg-3);text-decoration:none; }
  .page-footer a:hover { color:var(--accent); }

  @media (max-width: 768px) {
    .article { padding:40px 22px 80px; }
    .nav-inner { padding:14px 22px; }
    h1 { font-size:38px; }
    h2 { font-size:26px;margin:44px 0 16px; }
    h2::before { display:none; }
    .lede { font-size:19px;padding-bottom:36px;margin-bottom:36px; }
    p { font-size:16px; }
    .keystat { padding:22px 20px; }
    .keystat-number { font-size:42px; }
    .actions-card { padding:22px; }
    .actions-list li a { font-size:17px;padding:14px 0; }
    .nav-crumb .step-home { display:none; }
    .nav-crumb .step-home + .sep { display:none; }
    .dates { padding:14px 16px;gap:16px; }
    .date-value { font-size:13px; }
    .map-figure { margin:36px -8px;padding:20px 14px 18px; }
    .map-figure figcaption { font-size:12px; }
  }
`;

const articleBody = `
  <div class="article-meta">
    <span class="tag">Santé</span>
    <span class="read-info">Lecture 7 min</span>
  </div>

  <h1>Le cadmium dans<br/><em>l'alimentation</em></h1>

  <div class="dates">
    <div class="date-item">
      <span class="date-label">Publié</span>
      <span class="date-value">18 avril 2026</span>
    </div>
    <div class="date-sep"></div>
    <div class="date-item">
      <span class="date-label">Mis à jour</span>
      <span class="date-value date-value-muted">Aucune révision</span>
    </div>
  </div>

  <p class="lede">
    En mars 2026, l'Agence nationale de sécurité sanitaire a fait une annonce rare. Près d'un Français sur deux est surexposé au cadmium par son alimentation quotidienne. Le pain, les pommes de terre, les céréales du petit-déjeuner en sont les principales sources. Ce métal lourd, classé cancérogène, mutagène et toxique pour la reproduction, ne relève pas d'un comportement individuel à corriger. Il pose une question qui dépasse le geste alimentaire : pourquoi nos sols, et donc notre table, contiennent-ils ces doses, et qu'est-ce qui peut changer ?
  </p>

  <h2>De quoi parle-t-on précisément</h2>
  <p>
    Le cadmium est un métal présent naturellement dans la croûte terrestre. Sa particularité tient à sa mobilité chimique : il se solubilise facilement dans l'eau du sol et migre vers les plantes, qui l'absorbent par leurs racines comme s'il s'agissait d'un nutriment. Il se concentre ensuite dans les grains, les tubercules et les feuilles. Une fois ingéré par l'humain, il s'accumule dans le foie et les reins sur plusieurs décennies. Sa demi-vie biologique est estimée entre vingt et trente ans, ce qui signifie que chaque apport s'additionne lentement au stock déjà présent dans l'organisme.
  </p>
  <p>
    Le seuil sanitaire de référence est fixé par l'Autorité européenne de sécurité des aliments à 2,5 microgrammes par kilogramme de poids corporel et par semaine. L'étude de l'ANSES publiée en mars 2026 a montré que la population française moyenne dépasse ce seuil, avec des taux particulièrement marqués chez les enfants de moins de trois ans, dont <strong>36 %</strong> se situent au-dessus des seuils tolérables. À l'échelle de la population générale, <strong>14 %</strong> des adultes sont concernés.
  </p>

  <div class="keystat">
    <span class="keystat-number">1 sur 2</span>
    <span class="keystat-label">Français surexposé au cadmium par son alimentation quotidienne.</span>
    <span class="keystat-src">Source : ANSES, alerte de mars 2026</span>
  </div>

  <h2>D'où cela vient</h2>
  <p>
    Deux origines principales coexistent. D'abord une présence naturelle d'origine géologique : certains sols calcaires, comme ceux de Champagne, des Charentes, du Jura ou des Causses, contiennent naturellement plus de cadmium que d'autres, parce que la roche dont ils sont issus en contient déjà. Ces zones sont cartographiées par le Réseau de mesure de la qualité des sols (RMQS), opéré par le BRGM et l'INRAE. Ensuite, une source agricole : les engrais phosphatés utilisés depuis des décennies contiennent des résidus de cadmium issus des minerais dont ils sont tirés. Leur épandage sur les grandes zones céréalières a ajouté, au fil du temps, une dose supplémentaire à celle déjà présente dans la roche.
  </p>
  <p>
    La plante la plus efficace pour absorber et concentrer le cadmium est le blé dur, ce qui explique pourquoi les pâtes et le pain en sont les premiers vecteurs alimentaires. Le règlement européen sur les fertilisants adopté en 2019 a introduit un plafond de cadmium dans les engrais phosphatés, mais son application est progressive, et les sols déjà chargés le resteront plusieurs dizaines d'années.
  </p>

  <h2>Ce que cela change concrètement</h2>
  <p>
    Les effets documentés concernent principalement les reins, où le cadmium dégrade le fonctionnement des filtres rénaux sur le long terme, et le squelette, où il fragilise la densité osseuse. Le Centre international de recherche sur le cancer le classe cancérogène certain pour l'homme (groupe 1), principalement pour le cancer du poumon en exposition professionnelle, et cancérogène probable pour les cancers du rein et du sein en exposition alimentaire. Les études épidémiologiques montrent aussi un lien avec le diabète de type 2 et certaines maladies cardiovasculaires, même si les mécanismes exacts sont encore à l'étude.
  </p>
  <p>
    Chez les enfants, l'enjeu est double. Leur rapport entre quantité ingérée et poids corporel est plus défavorable, et leur alimentation est très concentrée sur les céréales, qui sont précisément les vecteurs principaux. L'ANSES recommande de ne pas modifier brutalement leur régime, les céréales et le pain restant des apports nutritionnels importants, mais d'en varier les origines et les formes.
  </p>

  <h2>Quels territoires sont concernés en France</h2>
  <p>
    La carte des teneurs en cadmium des sols publiée par GisSol distingue plusieurs zones où les teneurs sont plus élevées que la moyenne nationale. Les sols calcaires du bassin parisien, les Charentes, le Poitou, le Jura, les Causses du Quercy et certaines parties de la Provence calcaire présentent les teneurs les plus fortes. La Nouvelle-Aquitaine intérieure et le Centre-Val de Loire sont particulièrement concernés par la combinaison sols calcaires et céréaliculture intensive.
  </p>

  <p>
    À l'inverse, les sols acides du Massif central, de Bretagne ou des Vosges présentent des teneurs plus faibles. Mais la géographie des sols ne détermine pas seule l'exposition des habitants. Le blé consommé dans une ville peut provenir d'une région à teneur élevée, et les produits transformés mélangent des farines d'origines variées. C'est ce qui rend la question de l'étiquetage d'origine géographique des céréales, aujourd'hui partiel, un levier discuté pour les années à venir.
  </p>

  <h2>Ce qui est débattu, ce qui ne l'est pas</h2>
  <p>
    Le consensus scientifique est établi sur plusieurs points. Le cadmium est toxique aux niveaux mesurés, les sols français en contiennent suffisamment pour générer une exposition chronique, et les enfants sont proportionnellement plus exposés que les adultes. Les organismes publics concernés (ANSES, EFSA, OMS) convergent sur ces constats.
  </p>
  <p>
    Les discussions portent sur l'ampleur exacte des effets à faibles doses répétées sur le long terme, sur la vitesse à laquelle le cadmium s'accumule réellement selon l'âge et le régime alimentaire, et sur l'efficacité comparée des politiques publiques pour le réduire. Les chercheurs s'interrogent encore sur la part relative de l'origine naturelle et de l'origine agricole dans les teneurs actuelles des sols. Du côté politique, la trajectoire de réduction du cadmium dans les engrais phosphatés prévue par le règlement européen est contestée sur son calendrier par plusieurs associations environnementales, qui la jugent trop lente au regard des données sanitaires.
  </p>

  <div class="actions-card">
    <div class="actions-card-head">Pour passer à l'action</div>
    <ul class="actions-list">
      <li><a href="/savoir/cadmium/actionnable">Comment limiter votre exposition au cadmium alimentaire<span class="arrow">→</span></a></li>
      <li><a href="#">Lire l'étiquette d'origine des céréales<span class="arrow">→</span></a></li>
      <li><a href="#">Que demander à votre médecin sur le dosage urinaire<span class="arrow">→</span></a></li>
    </ul>
  </div>

  <section class="sources">
    <h2>Sources et pour aller plus loin</h2>
    <ul>
      <li>
        <span class="src-tag">ANSES</span>
        <span>Étude de l'alimentation totale infantile 3 et alerte nationale sur l'exposition au cadmium, <a href="https://www.anses.fr" target="_blank" rel="noopener">anses.fr</a>, mars 2026.</span>
      </li>
      <li>
        <span class="src-tag">EFSA</span>
        <span>Autorité européenne de sécurité des aliments, avis scientifique sur le cadmium alimentaire, dose hebdomadaire tolérable de 2,5 µg/kg p.c., <a href="https://www.efsa.europa.eu" target="_blank" rel="noopener">efsa.europa.eu</a>.</span>
      </li>
      <li>
        <span class="src-tag">GisSol</span>
        <span>Groupement d'intérêt scientifique sur les sols, cartes du Réseau de mesure de la qualité des sols (RMQS) et teneurs en cadmium des horizons de surface, <a href="https://www.gissol.fr" target="_blank" rel="noopener">gissol.fr</a>.</span>
      </li>
      <li>
        <span class="src-tag">INRAE</span>
        <span>Institut national de recherche pour l'agriculture, l'alimentation et l'environnement, travaux sur le transfert sol-plante du cadmium et le rôle des engrais phosphatés.</span>
      </li>
      <li>
        <span class="src-tag">CIRC</span>
        <span>Centre international de recherche sur le cancer, classification du cadmium en groupe 1 (cancérogène pour l'homme).</span>
      </li>
      <li>
        <span class="src-tag">UE</span>
        <span>Règlement 2019/1009 relatif aux fertilisants UE, plafonds progressifs de cadmium dans les engrais phosphatés.</span>
      </li>
    </ul>
  </section>
`;

export default function CadmiumPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">
            futur<span className="brand-dot">•</span>e
          </Link>
          <div className="nav-crumb">
            <span className="step-home">Savoir</span>
            <span className="sep">/</span>
            <span>Santé</span>
            <span className="sep">/</span>
            Cadmium
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <article
        className="article"
        dangerouslySetInnerHTML={{ __html: articleBody }}
      />

      <footer className="page-footer">
        <div>futur•e · Savoir / Santé</div>
        <div>
          <a href="#">Signaler une imprécision</a> · <a href="#">Méthodologie</a>
        </div>
      </footer>
    </>
  );
}
