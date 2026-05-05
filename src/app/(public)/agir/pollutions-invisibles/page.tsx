import Link from 'next/link';
import type { Metadata } from 'next';
import { getCurrentSessionUser } from '@/lib/user-account';
import { canAccessActionPage, normalizeAccount } from '@/lib/access';
import { PollutionLookup } from '@/components/PollutionLookup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Face aux pollutions invisibles : agir à sa juste échelle — futur•e',
  description:
    "Connaître la situation de votre commune, adapter quelques gestes, comprendre les recours collectifs. Un guide structuré pour agir sans se culpabiliser de ce qui dépasse votre portée.",
};

const css = `
  :root {
    --accent: #34d399;
    --accent-soft: rgba(52,211,153,0.10);
    --accent-border: rgba(52,211,153,0.25);
    --violet: #a78bfa;
    --red: #f87171;
    --blue: #60a5fa;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg-1);font-family:var(--font-sans);font-size:16px;line-height:1.65;overflow-x:hidden;max-width:100vw;-webkit-font-smoothing:antialiased;}

  .orb{position:fixed;border-radius:50%;filter:blur(120px);opacity:0.28;pointer-events:none;z-index:0;animation:breathe 14s ease-in-out infinite;}
  .orb-1{width:520px;height:520px;background:radial-gradient(circle,#34d399 0%,transparent 70%);top:-140px;left:-120px;}
  .orb-2{width:440px;height:440px;background:radial-gradient(circle,#a78bfa 0%,transparent 70%);bottom:-120px;right:-100px;animation-delay:-5s;}
  .orb-3{width:360px;height:360px;background:radial-gradient(circle,#60a5fa 0%,transparent 70%);top:50%;left:62%;opacity:0.14;animation-delay:-9s;}
  @keyframes breathe{0%,100%{transform:scale(1) translate(0,0);}50%{transform:scale(1.15) translate(20px,-30px);}}

  body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.026 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;mix-blend-mode:overlay;}

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

  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(34px,5vw,52px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 24px;color:var(--fg-1);}
  h1 em{font-style:italic;color:var(--accent);}

  .article-intro{font-family:var(--font-serif);font-size:clamp(17px,2vw,21px);line-height:1.62;color:var(--fg-3);margin:0 0 40px;border-bottom:1px solid var(--border-1);padding-bottom:36px;}

  .savoir-link{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;margin-bottom:48px;background:var(--bg-elev);border:1px solid var(--border-1);text-decoration:none;color:var(--fg-3);font-family:var(--font-mono);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;transition:border-color 0.2s,color 0.2s;}
  .savoir-link:hover{border-color:var(--accent-border);color:var(--accent);}

  .tone-block{padding:28px 32px;margin:0 0 48px;background:var(--bg-elev);border:1px solid var(--border-1);border-left:2px solid var(--accent);font-family:var(--font-serif);font-size:19px;line-height:1.65;color:var(--fg-3);font-style:italic;}
  .tone-block strong{color:var(--fg-1);font-style:normal;font-weight:500;}

  h2{font-family:var(--font-serif);font-weight:400;font-size:clamp(24px,3vw,32px);line-height:1.2;letter-spacing:-0.01em;margin:64px 0 20px;color:var(--fg-1);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:18px;width:14px;height:1px;background:var(--accent);}

  h3{font-family:var(--font-serif);font-weight:400;font-size:19px;line-height:1.35;margin:36px 0 12px;color:var(--fg-1);font-style:italic;}

  p{margin:0 0 20px;color:var(--fg-1);font-size:17px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}
  .src{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);}

  .level-header{display:flex;align-items:center;gap:14px;margin:56px 0 20px;padding-bottom:16px;border-bottom:1px solid var(--border-1);}
  .level-num{font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);flex-shrink:0;}
  .level-title{font-family:var(--font-serif);font-size:clamp(22px,2.5vw,28px);font-weight:400;color:var(--fg-1);margin:0;letter-spacing:-0.01em;}
  .level-scope{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;margin-left:auto;flex-shrink:0;}
  .scope-self{background:rgba(52,211,153,0.10);border:1px solid rgba(52,211,153,0.22);color:#6ee7b7;}
  .scope-collective{background:rgba(96,165,250,0.10);border:1px solid rgba(96,165,250,0.22);color:#93c5fd;}
  .scope-structural{background:rgba(167,139,250,0.10);border:1px solid rgba(167,139,250,0.22);color:#c4b5fd;}

  /* ── LOOKUP BLOCKS ── */
  .lookup-block{margin:28px 0;border:1px solid var(--border-1);background:var(--bg-elev);overflow:hidden;}
  .lookup-header{padding:16px 20px;border-bottom:1px solid var(--border-1);background:rgba(255,255,255,0.02);display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .lookup-title{font-size:14px;font-weight:500;color:var(--fg-1);}
  .lookup-sub{font-family:var(--font-mono);font-size:10px;letter-spacing:0.07em;text-transform:uppercase;color:var(--fg-4);margin-top:3px;}
  .lookup-body{padding:20px;}
  .lookup-desc{font-size:14px;color:var(--fg-3);line-height:1.6;margin:0 0 16px;}

  .lookup-form{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:16px;}
  .lookup-input{background:rgba(255,255,255,0.04);border:1px solid var(--border-hi);color:var(--fg-1);padding:10px 14px;font-family:var(--font-sans);font-size:14px;outline:none;border-radius:0;transition:border-color 0.2s;}
  .lookup-input::placeholder{color:var(--fg-4);}
  .lookup-input:focus{border-color:var(--accent-border);}
  .lookup-btn{padding:10px 18px;background:var(--accent);border:none;color:#060812;font-family:var(--font-mono);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:background 0.15s;white-space:nowrap;}
  .lookup-btn:hover{background:#6ee7b7;}
  .lookup-btn:disabled{background:var(--bg-elev);color:var(--fg-4);cursor:not-allowed;border:1px solid var(--border-1);}

  .lookup-results{min-height:0;max-height:320px;overflow-y:auto;border-top:1px solid var(--border-1);}
  .lookup-results.visible{display:block;}
  .lookup-result-item{padding:14px 20px;border-bottom:1px solid var(--border-1);font-size:13px;line-height:1.55;}
  .lookup-result-item:last-child{border-bottom:none;}
  .result-name{font-weight:500;color:var(--fg-1);margin-bottom:4px;}
  .result-meta{color:var(--fg-3);font-size:12px;}
  .result-badge{display:inline-block;font-family:var(--font-mono);font-size:10px;letter-spacing:0.06em;padding:2px 7px;border-radius:3px;margin-left:6px;}
  .badge-alert{background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.25);color:#fca5a5;}
  .badge-ok{background:rgba(52,211,153,0.10);border:1px solid rgba(52,211,153,0.22);color:#6ee7b7;}
  .badge-warn{background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.2);color:#fde68a;}
  .badge-neutral{background:rgba(255,255,255,0.04);border:1px solid var(--border-1);color:var(--fg-4);}

  .lookup-empty{padding:20px;font-size:13px;color:var(--fg-4);text-align:center;font-style:italic;font-family:var(--font-serif);}
  .lookup-loading{padding:20px;font-size:12px;color:var(--fg-4);text-align:center;font-family:var(--font-mono);letter-spacing:0.08em;text-transform:uppercase;}
  .lookup-error{padding:16px 20px;font-size:13px;color:#fca5a5;background:rgba(248,113,113,0.06);border-top:1px solid rgba(248,113,113,0.15);}

  .commune-wrap{position:relative;}
  .commune-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:rgba(6,8,18,0.98);backdrop-filter:blur(16px);border:1px solid var(--border-hi);z-index:20;max-height:200px;overflow-y:auto;display:none;}
  .commune-dropdown.open{display:block;}
  .commune-opt{padding:10px 14px;font-size:14px;color:var(--fg-3);cursor:pointer;border-bottom:1px solid var(--border-1);transition:background 0.1s,color 0.1s;}
  .commune-opt:last-child{border-bottom:none;}
  .commune-opt:hover{background:rgba(52,211,153,0.08);color:var(--fg-1);}
  .commune-opt-meta{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);margin-left:8px;}

  /* ── ACTIONS & GESTES ── */
  .action-list{display:flex;flex-direction:column;gap:2px;margin:24px 0;}
  .action-item{padding:20px 0;border-bottom:1px solid var(--border-1);display:grid;grid-template-columns:24px 1fr;gap:16px;align-items:start;}
  .action-item:last-child{border-bottom:none;}
  .action-check{width:20px;height:20px;border-radius:4px;border:1px solid var(--border-hi);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;font-size:11px;color:var(--accent);}
  .action-title{font-size:16px;font-weight:500;color:var(--fg-1);margin-bottom:6px;}
  .action-desc{font-size:14px;color:var(--fg-3);line-height:1.6;margin:0;}
  .action-note{display:inline-block;margin-top:8px;font-family:var(--font-mono);font-size:10px;color:var(--fg-4);letter-spacing:0.06em;}

  .limit-block{margin:40px 0;padding:24px 28px;background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.18);border-radius:6px;}
  .limit-block-head{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(248,113,113,0.6);margin-bottom:12px;}
  .limit-block p{font-size:15px;color:var(--fg-3);line-height:1.65;margin:0;}
  .limit-block p+p{margin-top:12px;}
  .limit-block strong{color:var(--fg-1);font-weight:500;}

  .rights-block{margin:32px 0;padding:22px 26px;background:var(--bg-elev);border:1px solid var(--border-1);border-left:2px solid var(--blue);border-radius:4px;}
  .rights-block-head{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--blue);opacity:0.7;margin-bottom:10px;}
  .rights-block p{font-size:14px;color:var(--fg-3);line-height:1.65;margin:0 0 10px;}
  .rights-block p:last-child{margin:0;}

  .closing{margin:56px 0 0;padding:32px;background:var(--bg-elev);border:1px solid var(--border-1);font-family:var(--font-serif);font-size:clamp(17px,2vw,21px);line-height:1.65;color:var(--fg-3);font-style:italic;}
  .closing strong{color:var(--fg-1);font-style:normal;}

  .actions-card{margin:56px 0 32px;padding:28px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:8px;}
  .actions-card-head{font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);margin-bottom:18px;}
  .actions-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;}
  .actions-list li a{display:flex;align-items:center;justify-content:space-between;padding:16px 0;color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-1);font-family:var(--font-serif);font-size:20px;font-style:italic;transition:padding 0.25s ease,color 0.25s ease;}
  .actions-list li:last-child a{border-bottom:none;}
  .actions-list li a:hover{padding-left:8px;color:var(--accent);}
  .actions-list .arrow{font-family:var(--font-sans);font-style:normal;font-size:14px;color:var(--fg-4);transition:transform 0.25s ease,color 0.25s ease;}
  .actions-list li a:hover .arrow{transform:translateX(4px);color:var(--accent);}

  .page-footer{position:relative;z-index:2;border-top:1px solid var(--border-1);padding:28px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;}
  .footer-note{font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.06em;text-transform:uppercase;line-height:1.7;}

  @media(max-width:680px){
    .article{padding:48px 20px 80px;}
    h2::before{display:none;}
    .level-scope{display:none;}
    .action-item{grid-template-columns:1fr;gap:8px;}
    .action-check{display:none;}
    .lookup-form{grid-template-columns:1fr;}
  }
`;

export default async function AgirPollutionsInvisiblesPage() {
  const { supabase, user } = await getCurrentSessionUser();
  let hasFullAccess = false;

  if (user) {
    const { data: accountRow } = await supabase
      .from('user_accounts')
      .select('plan, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const account = normalizeAccount(
      accountRow
        ? { plan: accountRow.plan, status: accountRow.status, email: user.email ?? null }
        : { email: user.email ?? null },
    );
    hasFullAccess = canAccessActionPage(account);
  }

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
            <Link href="/agir">Guides Agir</Link>
            <span className="sep">/</span>
            Pollutions invisibles
          </div>
        </div>
      </nav>

      <article className="article">

        <div className="article-tag">Page Agir · Santé environnementale</div>

        <h1>
          Face aux pollutions<br />
          invisibles :<br />
          <em>agir à sa juste échelle.</em>
        </h1>

        <p className="article-intro">
          Certaines pollutions sont hors de votre portée. D&apos;autres peuvent être réduites à la marge. Quelques-unes appellent une réponse collective. Cette page ne prétend pas que l&apos;action individuelle suffit — elle dit ce qui est utile, ce qui ne l&apos;est pas, et où trouver des relais quand votre propre périmètre ne suffit plus.
        </p>

        <Link href="/savoir/pollutions-invisibles" className="savoir-link">
          <span>Lire d&apos;abord · Ce que votre sol et votre air contiennent</span>
          <span>→</span>
        </Link>

        <div className="tone-block">
          Ce que vous allez lire ne cherche pas à vous rendre responsable de pollutions que vous n&apos;avez pas créées. <strong>La grande majorité des expositions environnementales documentées sont le produit de décisions industrielles, agricoles et d&apos;urbanisme qui précèdent votre présence sur un territoire.</strong> Les gestes individuels ont un rôle — limité, réel, jamais suffisant seul.
        </div>

        {/* Niveau 1 header always visible */}
        <div className="level-header">
          <div className="level-num">Niveau 01</div>
          <h2 style={{ margin: 0 }} className="level-title">Connaître votre situation</h2>
          <span className="level-scope scope-self">À votre portée</span>
        </div>

        <p>
          Avant d&apos;agir, savoir. Plusieurs bases publiques permettent de vérifier ce qui concerne votre commune directement ici, sans quitter la page.
        </p>

        {hasFullAccess ? (
          <>
            {/* Level 1 — lookup blocks */}
            <PollutionLookup />

            <div className="limit-block">
              <div className="limit-block-head">Limite de ce niveau</div>
              <p>Ces bases disent ce qui est déclaré, mesuré, recensé. Elles ne disent pas ce qui est diffus, accidentel, ou non surveillé. Une commune sans installation IREP n&apos;est pas nécessairement sans pollution — elle peut avoir des sources agricoles, des pollutions historiques non inventoriées, ou des émissions de trafic non mesurées localement.</p>
              <p><strong>Savoir ce qui concerne votre commune est utile. Ce n&apos;est pas suffisant pour établir votre exposition réelle.</strong></p>
            </div>

            {/* Level 2 */}
            <div className="level-header">
              <div className="level-num">Niveau 02</div>
              <h2 style={{ margin: 0 }} className="level-title">Adapter quelques gestes</h2>
              <span className="level-scope scope-self">À votre portée · ciblé</span>
            </div>

            <p>
              Certains gestes réduisent l&apos;exposition dans des configurations précises. Ils ne valent que si votre situation les rend pertinents — ils ne remplacent pas une réduction des sources à l&apos;origine.
            </p>

            <h3>Si vous avez un jardin potager en zone urbaine ancienne ou à proximité d&apos;un site industriel</h3>

            <div className="action-list">
              <div className="action-item">
                <div className="action-check">✓</div>
                <div className="action-body">
                  <div className="action-title">Faire analyser votre sol avant de consommer ce que vous y cultivez</div>
                  <p className="action-desc">Une analyse complète — métaux lourds, HAP — coûte entre 80 et 200 euros selon le laboratoire et le panel de substances. Elle donne une image fiable de la teneur réelle de votre terre, indépendamment des bases nationales. Ce n&apos;est utile que si vous cultivez et consommez ce que vous produisez.</p>
                  <span className="action-note">80–200 € · Laboratoire accrédité Cofrac</span>
                </div>
              </div>
              <div className="action-item">
                <div className="action-check">✓</div>
                <div className="action-body">
                  <div className="action-title">Privilégier les cultures hors-sol ou sur substrat apporté</div>
                  <p className="action-desc">Si une analyse révèle des teneurs préoccupantes, les cultures en bac avec un substrat acheté permettent de continuer à jardiner sans exposition aux métaux du sol en place.</p>
                  <span className="action-note">Applicable immédiatement</span>
                </div>
              </div>
            </div>

            <h3>Si vous avez de jeunes enfants</h3>

            <div className="action-list">
              <div className="action-item">
                <div className="action-check">✓</div>
                <div className="action-body">
                  <div className="action-title">Lavage des mains systématique après jeux extérieurs en zone identifiée</div>
                  <p className="action-desc">Les enfants ingèrent davantage de sol que les adultes par contact main-bouche. Dans les zones où des métaux lourds sont documentés dans les sols, ce geste simple réduit l&apos;ingestion accidentelle. Il ne supprime pas l&apos;exposition — il la réduit. <span className="src">Source : ANSES</span></p>
                </div>
              </div>
              <div className="action-item">
                <div className="action-check">✓</div>
                <div className="action-body">
                  <div className="action-title">Aérer en dehors des pics de pollution, ventiler la nuit</div>
                  <p className="action-desc">En épisode de pollution signalé par ATMO, limiter l&apos;aération en journée réduit l&apos;entrée de polluants extérieurs. Ce conseil s&apos;inverse en dehors des épisodes : l&apos;air intérieur est souvent plus chargé que l&apos;air extérieur. La ventilation régulière reste indispensable. <span className="src">Source : ADEME</span></p>
                </div>
              </div>
            </div>

            <h3>Si vous habitez à proximité d&apos;un axe à fort trafic</h3>

            <div className="action-list">
              <div className="action-item">
                <div className="action-check">✓</div>
                <div className="action-body">
                  <div className="action-title">Éviter les activités physiques prolongées en bord de voie aux heures de pointe</div>
                  <p className="action-desc">Les concentrations en NO₂ et PM2.5 sont maximales dans les 150 premiers mètres d&apos;un axe à fort trafic pendant les heures de pointe. Décaler les sorties ou choisir des itinéraires moins chargés réduit l&apos;exposition lors d&apos;activités physiques, où la ventilation pulmonaire est accrue. <span className="src">Source : INERIS</span></p>
                </div>
              </div>
            </div>

            <div className="limit-block">
              <div className="limit-block-head">Ce que ces gestes ne font pas</div>
              <p>Ils ne réduisent pas les émissions à la source. Ils ne protègent pas ceux qui n&apos;ont pas les moyens de choisir leur trajet ou leur jardin. <strong>Ces ajustements sont utiles dans votre situation personnelle. Ils ne constituent pas une réponse à la hauteur du problème.</strong></p>
            </div>

            {/* Level 3 */}
            <div className="level-header">
              <div className="level-num">Niveau 03</div>
              <h2 style={{ margin: 0 }} className="level-title">Ce qui dépasse votre échelle</h2>
              <span className="level-scope scope-structural">Collectif</span>
            </div>

            <p>
              La majorité de l&apos;exposition aux pollutions invisibles est déterminée par des décisions qui n&apos;appartiennent pas aux individus exposés. Ces décisions se prennent dans des arènes où des droits d&apos;accès existent — et des recours collectifs aussi.
            </p>

            <div className="rights-block">
              <div className="rights-block-head">Accès aux études de diagnostic de pollution</div>
              <p>Si votre logement est situé sur ou à proximité d&apos;un site Basol, vous avez le droit d&apos;accéder aux études de diagnostic réalisées par les autorités. Ces documents sont communicables sur demande auprès de la préfecture ou de la DREAL. Ils peuvent contenir des informations que les propriétaires ou bailleurs n&apos;ont pas communiquées spontanément.</p>
            </div>

            <div className="rights-block">
              <div className="rights-block-head">Enquêtes publiques et participation</div>
              <p>Toute modification d&apos;une installation industrielle classée fait l&apos;objet d&apos;une enquête publique. Ces enquêtes sont ouvertes à tous, leurs résultats sont publics, et vos observations y ont une valeur juridique. Elles sont annoncées dans les journaux locaux et sur les sites des préfectures — et passent inaperçues dans la grande majorité des cas.</p>
            </div>

            <div className="rights-block">
              <div className="rights-block-head">Signalement à l&apos;inspection des installations classées</div>
              <p>Si vous observez des rejets anormaux ou des nuisances persistantes attribuables à une installation, vous pouvez le signaler à la DREAL de votre région. Ces signalements alimentent les contrôles. Leur accumulation compte, même quand les effets ne sont pas immédiats.</p>
            </div>

            <div className="rights-block">
              <div className="rights-block-head">Recours collectifs et associations locales</div>
              <p>Des associations agréées de protection de l&apos;environnement peuvent engager des recours juridiques ou administratifs contre des installations polluantes, une dépollution insuffisante ou une autorisation contestable. Si des riverains dans votre commune sont organisés sur ce sujet, se rapprocher d&apos;eux est souvent plus efficace qu&apos;une démarche individuelle isolée. France Nature Environnement fédère un réseau régional d&apos;associations locales auxquelles vous pouvez vous adresser pour connaître les recours actifs dans votre territoire.</p>
            </div>

            <div className="closing">
              Ce que vous pouvez faire à votre échelle, <strong>faites-le sans vous culpabiliser de ce qui dépasse votre portée</strong>. Ce qui dépasse votre portée individuelle, cherchez si des recours collectifs existent — souvent, ils existent déjà.
            </div>

            <div className="actions-card">
              <div className="actions-card-head">Pages Savoir associées</div>
              <ul className="actions-list">
                <li>
                  <Link href="/savoir/pollutions-invisibles">
                    Ce que votre sol et votre air contiennent vraiment
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
          </>
        ) : (
          <div style={{ position: 'relative', marginTop: '40px' }}>
            <div style={{ maxHeight: '260px', overflow: 'hidden', opacity: 0.45 }}>
              <div className="lookup-block">
                <div className="lookup-header">
                  <div>
                    <div className="lookup-title">Installations industrielles à proximité</div>
                    <div className="lookup-sub">Registre IREP · Géorisques · Rejets déclarés par substance</div>
                  </div>
                </div>
                <div className="lookup-body">
                  <p className="lookup-desc">Les installations classées ICPE déclarent annuellement leurs rejets dans l&apos;air, l&apos;eau et les sols.</p>
                  <div className="lookup-form">
                    <input className="lookup-input" type="text" placeholder="Nom de commune…" disabled />
                    <button className="lookup-btn" disabled>Rechercher</button>
                  </div>
                </div>
              </div>
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 75%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'relative',
              marginTop: '24px',
              padding: '32px',
              background: 'var(--bg-elev)',
              border: '1px solid var(--border-hi)',
              borderTop: '2px solid var(--accent)',
              textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--fg-4)',
                margin: '0 0 12px',
              }}>
                Accès Suivi
              </p>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '22px',
                lineHeight: '1.4',
                color: 'var(--fg-1)',
                margin: '0 0 8px',
              }}>
                Interrogez les bases publiques<br />depuis cette page
              </p>
              <p style={{
                fontSize: '14px',
                color: 'var(--fg-3)',
                margin: '0 0 28px',
                lineHeight: '1.6',
              }}>
                IREP, sites pollués, qualité de l&apos;air, eau potable — pour votre commune, sans quitter la page.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/inscription" style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  background: 'var(--accent)',
                  color: '#060812',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}>
                  S&apos;abonner — Accès Suivi
                </Link>
                <Link href="/connexion" style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  border: '1px solid var(--border-hi)',
                  color: 'var(--fg-3)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}>
                  Déjà abonné ? Se connecter
                </Link>
              </div>
            </div>
          </div>
        )}

      </article>

      <footer className="page-footer">
        <Link href="/" className="brand" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '18px', color: 'var(--fg-3)', textDecoration: 'none' }}>
          futur<span style={{ color: 'var(--accent)', fontStyle: 'normal' }}>•</span>e
        </Link>
        <div className="footer-note">
          Données publiques françaises · Aucune publicité<br />
          Page Agir · Santé environnementale · Mai 2026
        </div>
      </footer>
    </>
  );
}
