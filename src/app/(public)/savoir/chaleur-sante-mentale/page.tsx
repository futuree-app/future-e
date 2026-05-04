import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'La chaleur et la santé mentale · futur•e',
  description:
    "Les effets documentés de la chaleur sur la santé psychique : sommeil, humeur, violences, hospitalisations psychiatriques. Ce qui est établi, ce qui reste débattu, et les profils les plus exposés.",
};

const css = `
  :root {
    --accent: #f87171;
    --accent-soft: rgba(248,113,113,0.12);
    --accent-border: rgba(248,113,113,0.28);
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.32;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:520px;height:520px;background:radial-gradient(circle,#f87171 0%,transparent 70%);top:-140px;left:-120px;}
  .orb-2{width:460px;height:460px;background:radial-gradient(circle,#a78bfa 0%,transparent 70%);bottom:-120px;right:-100px;animation-delay:-5s;}
  .orb-3{width:380px;height:380px;background:radial-gradient(circle,#fb923c 0%,transparent 70%);top:50%;left:60%;opacity:0.16;animation-delay:-9s;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.15) translate(20px,-30px);}}

  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.035 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

  .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:var(--bg-card);border-bottom:1px solid var(--border-1);}
  .nav-inner{max-width:1100px;margin:0 auto;padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .brand{font-family:var(--font-serif);font-size:22px;font-style:italic;letter-spacing:-0.01em;color:var(--fg-1);text-decoration:none;}
  .brand-dot{color:var(--accent);font-style:normal;}
  .nav-crumb{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .nav-crumb a{color:var(--fg-3);text-decoration:none;transition:color 0.2s;}
  .nav-crumb a:hover{color:var(--fg-1);}
  .nav-crumb .sep{margin:0 10px;color:var(--fg-4);}

  .article{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:64px 28px 120px;}

  .article-meta{display:flex;align-items:center;gap:16px;margin-bottom:28px;flex-wrap:wrap;}
  .tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:var(--accent-soft);border:1px solid var(--accent-border);font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);}
  .tag::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);}
  .read-info{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}

  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(40px,6vw,64px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fg-1);}
  h1 em{font-style:italic;color:var(--accent);}

  .lede{font-family:var(--font-serif);font-size:clamp(20px,2.2vw,24px);line-height:1.5;color:var(--fg-1);font-weight:400;margin:0 0 48px;padding:0 0 48px;border-bottom:1px solid var(--border-1);}

  h2{font-family:var(--font-serif);font-weight:400;font-size:clamp(26px,3vw,34px);line-height:1.2;letter-spacing:-0.01em;margin:56px 0 20px;color:var(--fg-1);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:18px;width:14px;height:1px;background:var(--accent);}

  p{margin:0 0 20px;color:var(--fg-1);font-size:17px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}
  p em{font-style:italic;color:var(--fg-3);}

  .keystat{margin:40px 0;padding:28px 32px;background:var(--bg-elev);backdrop-filter:blur(10px);border:1px solid var(--border-1);border-left:2px solid var(--accent);border-radius:4px;position:relative;overflow:hidden;}
  .keystat::after{content:"";position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,var(--accent-soft) 0%,transparent 70%);pointer-events:none;}
  .keystat-number{font-family:var(--font-serif);font-size:52px;line-height:1;color:var(--accent);font-weight:400;letter-spacing:-0.02em;margin-bottom:8px;display:block;}
  .keystat-label{font-size:15px;color:var(--fg-3);line-height:1.5;position:relative;z-index:1;}
  .keystat-src{display:block;margin-top:10px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.05em;}

  .nuance-block{margin:40px 0;display:grid;grid-template-columns:1fr 1fr;gap:2px;border:1px solid var(--border-1);border-radius:8px;overflow:hidden;}
  .nuance-col{padding:22px 24px;background:var(--bg-elev);}
  .nuance-col:first-child{border-right:1px solid var(--border-1);}
  .nuance-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:14px;display:block;}
  .nuance-col:first-child .nuance-label{color:var(--accent);}
  .nuance-col:last-child .nuance-label{color:var(--fg-4);}
  .nuance-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;}
  .nuance-list li{font-size:14px;color:var(--fg-3);line-height:1.55;padding-left:14px;position:relative;}
  .nuance-list li::before{content:"·";position:absolute;left:0;color:var(--fg-4);}

  .vuln-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0 40px;}
  .vuln-card{padding:20px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:8px;}
  .vuln-card-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);display:block;margin-bottom:8px;}
  .vuln-card p{font-size:14px;color:var(--fg-3);line-height:1.6;margin:0;}

  .actions-card{margin:48px 0 32px;padding:28px;background:var(--bg-elev);backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:8px;}
  .actions-card-head{font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);margin-bottom:18px;}
  .actions-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;}
  .actions-list li a{display:flex;align-items:center;justify-content:space-between;padding:16px 0;color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-1);font-family:var(--font-serif);font-size:20px;font-style:italic;transition:padding 0.25s,color 0.25s;}
  .actions-list li:last-child a{border-bottom:none;}
  .actions-list li a:hover{padding-left:8px;color:var(--accent);}
  .arrow{font-family:var(--font-sans);font-style:normal;font-size:14px;color:var(--fg-4);transition:transform 0.25s,color 0.25s;}
  .actions-list li a:hover .arrow{transform:translateX(4px);color:var(--accent);}

  .sources{margin-top:72px;padding-top:40px;border-top:1px solid var(--border-1);}
  .sources h2{font-size:13px;font-family:var(--font-mono);font-style:normal;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-3);margin-bottom:24px;}
  .sources h2::before{display:none;}
  .sources ul{list-style:none;padding:0;margin:0;display:grid;gap:14px;}
  .sources li{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:baseline;font-size:14px;color:var(--fg-3);line-height:1.55;}
  .src-tag{font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fg-4);padding:3px 8px;border:1px solid var(--border-1);border-radius:3px;white-space:nowrap;}
  .sources a{color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-hi);transition:color 0.2s,border-color 0.2s;}
  .sources a:hover{color:var(--accent);border-color:var(--accent);}

  .page-footer{position:relative;z-index:2;max-width:760px;margin:0 auto;padding:40px 28px 80px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.08em;text-transform:uppercase;}
  .page-footer a{color:var(--fg-3);text-decoration:none;}
  .page-footer a:hover{color:var(--accent);}

  @media(max-width:768px){
    .article{padding:40px 22px 80px;}
    .nav-inner{padding:14px 22px;}
    h1{font-size:38px;}
    h2{font-size:26px;margin:44px 0 16px;}
    h2::before{display:none;}
    .lede{font-size:19px;padding-bottom:36px;margin-bottom:36px;}
    p{font-size:16px;}
    .keystat{padding:22px 20px;}
    .keystat-number{font-size:42px;}
    .nuance-block{grid-template-columns:1fr;}
    .nuance-col:first-child{border-right:none;border-bottom:1px solid var(--border-1);}
    .vuln-grid{grid-template-columns:1fr;}
  }
`;

export default function ChaleurSanteMentalePage() {
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
            <Link href="/savoir" className="step-home">Savoir</Link>
            <span className="sep">/</span>
            <Link href="/savoir/sante">Santé</Link>
            <span className="sep">/</span>
            Chaleur
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <article className="article">

        <div className="article-meta">
          <span className="tag">Santé</span>
          <span className="read-info">Lecture 7 min · Avril 2026</span>
        </div>

        <h1>La chaleur et<br /><em>la santé mentale</em></h1>

        <p className="lede">
          Les canicules tuent. Ce fait est documenté, suivi, quantifié chaque été par Santé publique France. Ce qui l&apos;est moins, c&apos;est que la chaleur agit aussi en profondeur sur la vie psychique : le sommeil, l&apos;humeur, les relations, les violences. Ces effets existent, ils progressent avec la fréquence des épisodes caniculaires, et ils touchent certains profils bien plus que d&apos;autres.
        </p>

        <h2>Ce qui se passe dans le corps et le cerveau</h2>

        <p>La chaleur n&apos;est pas qu&apos;une contrainte physique. Au-delà d&apos;un certain seuil, elle perturbe des mécanismes neurochimiques qui régulent l&apos;humeur, le jugement et le contrôle émotionnel. La thermorégulation mobilise l&apos;hypothalamus, une structure cérébrale étroitement connectée aux centres émotionnels. Quand l&apos;hypothalamus est en surchauffe, il perturbe la production de sérotonine, qui joue un rôle central dans la régulation de l&apos;humeur et du sommeil.</p>

        <p>À cette perturbation neurochimique s&apos;ajoute la libération accrue d&apos;hormones de stress, adrénaline et cortisol, qui augmentent l&apos;irritabilité, l&apos;agitation et la sensibilité émotionnelle. Ces effets sont amplifiés par le manque de sommeil : les nuits trop chaudes fragmentent le sommeil réparateur, et c&apos;est ce déficit cumulé qui aggrave les troubles anxieux et dépressifs chez les personnes déjà vulnérables.</p>

        <p>En résumé : la chaleur n&apos;est pas une cause directe de maladie mentale, mais elle est un amplificateur documenté des états psychiques existants. Elle abaisse les seuils de tolérance, augmente la réactivité émotionnelle, et fragilise les personnes qui vivent déjà sous tension.</p>

        <div className="keystat">
          <span className="keystat-number">+129 %</span>
          <span className="keystat-label">La fréquence des vagues de chaleur en Europe a augmenté de 129 % sur la décennie 2015-2024 par rapport à 1991-2000. Chaque été supplémentaire à haute température allonge la durée d&apos;exposition aux effets psychiques de la chaleur.</span>
          <span className="keystat-src">Source : Lancet Countdown Europe, rapport 2026</span>
        </div>

        <h2>Les effets documentés</h2>

        <p>Plusieurs effets sont suffisamment documentés pour être considérés comme établis, même si les données françaises restent partielles sur certains d&apos;entre eux.</p>

        <p><strong>Hausse des hospitalisations psychiatriques d&apos;urgence.</strong> Des études européennes montrent une corrélation entre les épisodes de chaleur extrême et l&apos;augmentation des passages aux urgences pour troubles psychiatriques aigus et des hospitalisations en psychiatrie. Cet effet est observé notamment chez les personnes sous traitement psychotrope, dont certains réduisent la tolérance à la chaleur et augmentent le risque d&apos;hyperthermie.</p>

        <p><strong>Lien avec les comportements suicidaires.</strong> Plusieurs études de synthèse, dont une publiée en 2023 dans <em>The Lancet Planetary Health</em>, documentent un lien entre la hausse des températures et les risques de suicide. Ce lien est observé avec un décalage de quelques jours après les pics de chaleur. Les données restent hétérogènes selon les pays et les méthodologies, mais la direction du lien est cohérente entre les études.</p>

        <p><strong>Augmentation des comportements agressifs et des violences.</strong> Une étude de synthèse publiée dans <em>Health Science Reports</em> en 2023 établit que les températures élevées sont corrélées à une hausse des comportements agressifs. Une étude espagnole documente une augmentation de 28 % des féminicides durant les vagues de chaleur. L&apos;initiative Spotlight de l&apos;ONU estime que chaque augmentation de 1°C de la température mondiale est associée à une hausse de 4,7 % des violences conjugales. Ces données appellent à la prudence sur les effets directs, mais le lien avec la chaleur est documenté dans plusieurs pays.</p>

        <p><strong>Perturbation du sommeil et aggravation des troubles anxieux.</strong> Le lien entre nuits chaudes, sommeil fragmenté et aggravation des troubles anxieux est le plus directement observable. Santé publique France surveille depuis plusieurs années l&apos;indicateur de santé mentale pendant les canicules, notamment les passages aux urgences pour idées suicidaires, qui se maintiennent à des niveaux élevés pendant les périodes de chaleur.</p>

        <h2>Ce qui reste débattu</h2>

        <div className="nuance-block">
          <div className="nuance-col">
            <span className="nuance-label">Ce qui est établi</span>
            <ul className="nuance-list">
              <li>La chaleur perturbe la neurochimie de l&apos;humeur et du sommeil</li>
              <li>Les hospitalisations psychiatriques d&apos;urgence augmentent pendant les canicules</li>
              <li>Un lien entre chaleur et comportements suicidaires est observé dans plusieurs études</li>
              <li>Les personnes sous traitement psychotrope sont plus vulnérables à la chaleur</li>
              <li>Les violences domestiques augmentent pendant les épisodes de forte chaleur</li>
            </ul>
          </div>
          <div className="nuance-col">
            <span className="nuance-label">Ce qui est encore discuté</span>
            <ul className="nuance-list">
              <li>L&apos;ampleur précise des effets à des températures modérément élevées</li>
              <li>La part respective de la chaleur et des autres facteurs de stress liés aux canicules (isolement, chômage partiel, inconfort)</li>
              <li>Les seuils de température au-delà desquels les effets psychiques deviennent mesurables à l&apos;échelle d&apos;une population</li>
              <li>L&apos;efficacité comparée des mesures de prévention spécifiquement ciblées sur la santé mentale</li>
            </ul>
          </div>
        </div>

        <h2>Quels profils sont les plus exposés</h2>

        <p>Les effets de la chaleur sur la santé mentale ne se répartissent pas uniformément. Plusieurs facteurs augmentent l&apos;exposition.</p>

        <div className="vuln-grid">
          <div className="vuln-card">
            <span className="vuln-card-label">Personnes sous traitement psychotrope</span>
            <p>Certains médicaments, antidépresseurs, neuroleptiques, lithium, réduisent la capacité de thermorégulation ou augmentent la sudation, exposant à un risque d&apos;hyperthermie et d&apos;aggravation de l&apos;état psychique. Ce groupe est identifié comme prioritaire dans les plans canicule.</p>
          </div>
          <div className="vuln-card">
            <span className="vuln-card-label">Personnes isolées socialement</span>
            <p>L&apos;isolement amplifie tous les effets de la chaleur. Sans contact régulier, les signaux de dégradation de l&apos;état psychique ne sont pas détectés. Les personnes âgées vivant seules et certains profils de précarité sociale sont les plus concernés.</p>
          </div>
          <div className="vuln-card">
            <span className="vuln-card-label">Logements sans climatisation ni espaces verts</span>
            <p>Les ménages vivant dans des logements mal isolés, sans possibilité de rafraîchissement nocturne, accumulent un déficit de sommeil qui aggrave les états anxieux et dépressifs sur la durée d&apos;un épisode caniculaire. Les appartements de petite surface en étage supérieur sont les plus concernés.</p>
          </div>
          <div className="vuln-card">
            <span className="vuln-card-label">Travailleurs exposés à la chaleur</span>
            <p>Les travailleurs en extérieur, dans des entrepôts non climatisés ou sur des chantiers, cumulent la contrainte thermique physique avec une charge mentale liée à la vigilance permanente. L&apos;été 2024 a compté sept accidents du travail mortels potentiellement liés à la chaleur, selon la Direction Générale du Travail.</p>
          </div>
        </div>

        <h2>Ce que cela change pour votre commune</h2>

        <p>Les projections DRIAS pour la France métropolitaine montrent une augmentation du nombre de jours de canicule dans toutes les régions, avec des contrastes marqués. Le pourtour méditerranéen, le Languedoc, la vallée du Rhône et le bassin aquitain sont les zones où le nombre de jours de chaleur extrême augmente le plus vite. Mais les communes du nord et du centre de la France, moins habituées à gérer ces épisodes, y sont parfois plus vulnérables faute d&apos;adaptation du bâti et des comportements.</p>

        <p>La densité urbaine joue un rôle important : les communes denses avec peu d&apos;espaces verts et une forte proportion de logements anciens mal isolés concentrent les facteurs de risque. Les communes rurales isolées posent un problème différent : moins exposées aux îlots de chaleur, elles sont plus vulnérables par l&apos;isolement social qui amplifie les effets psychiques des épisodes prolongés.</p>

        <p>La fréquence croissante des canicules signifie aussi que les personnes vulnérables sont exposées de façon répétée, sans toujours récupérer complètement entre deux épisodes. C&apos;est cet effet cumulatif qui préoccupe le plus les épidémiologistes.</p>

        <div className="keystat">
          <span className="keystat-number">62 000</span>
          <span className="keystat-label">Décès attribués à la chaleur en Europe lors de l&apos;été 2024, le plus chaud jamais enregistré sur le continent. En France, Santé publique France dénombre plus de 3 700 décès attribuables à la chaleur pour cet été, toutes causes confondues.</span>
          <span className="keystat-src">Source : Lancet Countdown Europe 2026 · Santé publique France, bilan été 2024</span>
        </div>

        <h2>Ce qui peut changer à l&apos;échelle collective</h2>

        <p>Les plans canicule existants en France identifient les personnes vulnérables sur le plan physique mais intègrent encore insuffisamment la dimension santé mentale. Plusieurs mesures documentées dans d&apos;autres pays européens — extension des horaires des centres de soins psychiques pendant les vagues de chaleur, déclenchement automatique de visites à domicile pour les personnes isolées sous traitement psychiatrique, adaptation des protocoles de médication pendant les épisodes caniculaires — ne font pas encore partie du dispositif standard français.</p>

        <p>À l&apos;échelle du logement, la rénovation thermique des bâtiments a un double effet : réduire les émissions et protéger les occupants des effets de la chaleur. L&apos;abandon progressif des aides à la rénovation en France, documenté par plusieurs associations, va à l&apos;encontre de cet objectif de santé publique.</p>

        <div className="actions-card">
          <div className="actions-card-head">Pour passer à l&apos;action</div>
          <ul className="actions-list">
            <li>
              <Link href="/agir/canicule">
                Comment protéger votre foyer pendant une canicule <span className="arrow">→</span>
              </Link>
            </li>
            <li>
              <Link href="/">
                Comprendre l&apos;exposition canicule de votre commune <span className="arrow">→</span>
              </Link>
            </li>
          </ul>
        </div>

        <section className="sources">
          <h2>Sources et pour aller plus loin</h2>
          <ul>
            <li>
              <span className="src-tag">Lancet</span>
              <span>Lancet Countdown on Health and Climate Change, édition européenne 2026, liens entre réchauffement climatique et santé humaine en Europe, <a href="https://info.thelancet.com/hubfs/Press%20embargo/EuropeCountdown26.pdf" target="_blank" rel="noopener">thelancet.com</a>.</span>
            </li>
            <li>
              <span className="src-tag">SPF</span>
              <span>Santé publique France, Chaleur et santé — bilan de l&apos;été 2024, surveillance des indicateurs sanitaires liés à la chaleur, <a href="https://www.santepubliquefrance.fr" target="_blank" rel="noopener">santepubliquefrance.fr</a>, mars 2025.</span>
            </li>
            <li>
              <span className="src-tag">Lancet PH</span>
              <span>Étude de synthèse sur les liens entre hausse des températures et risques de suicide, <em>The Lancet Planetary Health</em>, 2023.</span>
            </li>
            <li>
              <span className="src-tag">HSR</span>
              <span>Étude de synthèse sur la réponse physiologique au stress thermique et ses effets comportementaux, <em>Health Science Reports</em>, 2023.</span>
            </li>
            <li>
              <span className="src-tag">ONU</span>
              <span>Initiative Spotlight de l&apos;ONU sur les violences faites aux femmes en lien avec le changement climatique et les épisodes de chaleur extrême.</span>
            </li>
            <li>
              <span className="src-tag">DRIAS</span>
              <span>Projections climatiques DRIAS, nombre de jours de canicule par commune à l&apos;horizon 2050 et 2100 selon les scénarios TRACC-2023, <a href="https://www.drias-climat.fr" target="_blank" rel="noopener">drias-climat.fr</a>.</span>
            </li>
            <li>
              <span className="src-tag">DGT</span>
              <span>Direction Générale du Travail, accidents du travail mortels en lien avec la chaleur, bilan été 2024.</span>
            </li>
          </ul>
        </section>

      </article>

      <footer className="page-footer">
        <div>futur•e · Savoir / Santé</div>
        <div>
          <Link href="#">Signaler une imprécision</Link>
          {' · '}
          <Link href="#">Méthodologie</Link>
        </div>
      </footer>
    </>
  );
}
