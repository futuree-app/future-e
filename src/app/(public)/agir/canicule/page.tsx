import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Metadata } from 'next';
import { getCurrentSessionUser } from '@/lib/user-account';
import { canAccessActionPage, normalizeAccount } from '@/lib/access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Se préparer à la canicule : ce qui protège vraiment · futur•e",
  description:
    "Les gestes efficaces et les conditions qui déterminent votre exposition lors d'un épisode caniculaire : ventilation nocturne, hydratation adaptée, personnes vulnérables, registre municipal.",
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

  h1{font-family:var(--font-serif);font-weight:400;font-size:clamp(40px,6vw,60px);line-height:1.08;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fg-1);}
  h1 em{font-style:italic;color:var(--accent);}

  .lede{font-family:var(--font-serif);font-size:clamp(19px,2.2vw,23px);line-height:1.55;color:var(--fg-1);font-weight:400;margin:0 0 48px;padding:0 0 48px;border-bottom:1px solid var(--border-1);}

  .assoc-link{display:inline-flex;align-items:center;gap:10px;padding:12px 18px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:6px;font-size:14px;color:var(--fg-3);text-decoration:none;margin-bottom:56px;transition:border-color 0.2s,color 0.2s;}
  .assoc-link:hover{border-color:var(--accent-border);color:var(--accent);}
  .assoc-link-label{font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fg-4);margin-right:4px;}

  h2{font-family:var(--font-serif);font-weight:400;font-size:clamp(24px,3vw,32px);line-height:1.22;letter-spacing:-0.01em;margin:56px 0 20px;color:var(--fg-1);position:relative;}
  h2::before{content:"";position:absolute;left:-28px;top:18px;width:14px;height:1px;background:var(--accent);}

  p{margin:0 0 20px;color:var(--fg-1);font-size:17px;line-height:1.72;}
  p strong{font-weight:500;color:#fff;}

  .keystat{margin:40px 0;padding:28px 32px;background:var(--bg-elev);backdrop-filter:blur(10px);border:1px solid var(--border-1);border-left:2px solid var(--accent);border-radius:4px;position:relative;overflow:hidden;}
  .keystat::after{content:"";position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,var(--accent-soft) 0%,transparent 70%);pointer-events:none;}
  .keystat-number{font-family:var(--font-serif);font-size:52px;line-height:1;color:var(--accent);font-weight:400;letter-spacing:-0.02em;margin-bottom:8px;display:block;}
  .keystat-label{font-size:15px;color:var(--fg-3);line-height:1.5;position:relative;z-index:1;}
  .keystat-src{display:block;margin-top:10px;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);letter-spacing:0.05em;}

  .leviers{display:flex;flex-direction:column;gap:2px;margin:28px 0 40px;}
  .levier{display:grid;grid-template-columns:28px 1fr;gap:16px;align-items:start;padding:18px 0;border-bottom:1px solid var(--border-1);}
  .levier:last-child{border-bottom:none;}
  .levier-icon{width:22px;height:22px;border-radius:50%;background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:11px;font-family:var(--font-mono);flex-shrink:0;margin-top:2px;}
  .levier-title{font-size:15px;font-weight:600;color:var(--fg-1);margin:0 0 5px;}
  .levier-desc{font-size:15px;color:var(--fg-3);line-height:1.65;margin:0 0 6px;}
  .levier-src{font-family:var(--font-mono);font-size:10px;color:var(--fg-4);letter-spacing:0.06em;}

  .steps{display:flex;flex-direction:column;gap:2px;margin:20px 0 40px;}
  .step{display:grid;grid-template-columns:36px 1fr;gap:18px;align-items:start;padding:20px 0;border-bottom:1px solid var(--border-1);}
  .step:last-child{border-bottom:none;}
  .step-num{width:28px;height:28px;border-radius:50%;background:var(--bg-elev);border:1px solid var(--border-hi);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--fg-4);flex-shrink:0;margin-top:1px;}
  .step-title{font-size:15px;font-weight:600;color:var(--fg-1);margin:0 0 6px;}
  .step-desc{font-size:15px;color:var(--fg-3);line-height:1.65;margin:0;}
  .step-link{display:inline-block;margin-top:8px;font-family:var(--font-mono);font-size:11px;color:var(--accent);text-decoration:none;letter-spacing:0.04em;border-bottom:1px solid var(--accent-border);transition:border-color 0.2s;}
  .step-link:hover{border-color:var(--accent);}

  .profiles{display:flex;flex-direction:column;gap:16px;margin:24px 0 40px;}
  .profile{padding:22px 24px;background:var(--bg-elev);border:1px solid var(--border-1);border-radius:8px;}
  .profile-title{font-size:14px;font-weight:600;color:var(--fg-1);margin:0 0 8px;}
  .profile-title span{font-family:var(--font-mono);font-size:10px;font-weight:400;letter-spacing:0.08em;color:var(--accent);text-transform:uppercase;margin-right:10px;}
  .profile-desc{font-size:14px;color:var(--fg-3);line-height:1.65;margin:0;}

  .nolist{display:flex;flex-direction:column;gap:2px;margin:20px 0;}
  .noitem{display:grid;grid-template-columns:28px 1fr;gap:16px;padding:18px 0;border-bottom:1px solid var(--border-1);}
  .noitem:last-child{border-bottom:none;}
  .no-icon{width:22px;height:22px;border-radius:50%;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-top:2px;}
  .no-title{font-size:15px;font-weight:600;color:var(--fg-1);margin:0 0 5px;}
  .no-desc{font-size:15px;color:var(--fg-3);line-height:1.65;margin:0;}

  .actions-card{margin:48px 0 32px;padding:28px;background:var(--bg-elev);backdrop-filter:blur(10px);border:1px solid var(--border-1);border-radius:8px;}
  .actions-card-head{font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--fg-4);margin-bottom:18px;}
  .actions-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;}
  .actions-list li a{display:flex;align-items:center;justify-content:space-between;padding:16px 0;color:var(--fg-1);text-decoration:none;border-bottom:1px solid var(--border-1);font-family:var(--font-serif);font-size:19px;font-style:italic;transition:padding 0.25s,color 0.25s;}
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
    h1{font-size:36px;}
    h2{font-size:24px;margin:44px 0 16px;}
    h2::before{display:none;}
    .lede{font-size:18px;}
    p,.step-desc,.levier-desc,.no-desc,.profile-desc{font-size:15px;}
    .keystat{padding:22px 20px;}
    .keystat-number{font-size:42px;}
  }
`;

export default async function CaniculePage() {
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
            <Link href="/savoir/canicule" className="step-home">Savoir</Link>
            <span className="sep">/</span>
            <Link href="/savoir/chaleur-sante-mentale">Santé</Link>
            <span className="sep">/</span>
            Agir
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <article className="article">

        <div className="article-meta">
          <span className="tag">Santé</span>
          <span className="read-info">Guide pratique · Lecture 5 min · Avril 2026</span>
        </div>

        <h1>Se préparer à la canicule :<br /><em>ce qui protège vraiment</em></h1>

        <p className="lede">
          Lors de la canicule d&apos;août 2003, environ 15 000 personnes sont mortes en France en moins de trois semaines. Neuf décès sur dix ont eu lieu à domicile. Ce que les bilans de 2019 et 2022 ont montré : cette mortalité diminue quand les personnes vulnérables ne sont pas isolées et quand des gestes simples sont en place avant le début de l&apos;épisode. Cette page décrit ces gestes.
        </p>

        <Link href="/savoir/chaleur-sante-mentale" className="assoc-link">
          <span className="assoc-link-label">Page associée</span>
          La chaleur et la santé mentale
          <span style={{ color: 'var(--fg-4)' }}>→</span>
        </Link>

        <h2>Ce qui fonctionne au niveau du logement</h2>

        <p>L&apos;essentiel de la protection se joue à domicile. Trois gestes ont un effet documenté et ne coûtent rien.</p>

        <div className="leviers">
          <div className="levier">
            <div className="levier-icon">01</div>
            <div>
              <p className="levier-title">Ventilation la nuit, occultation le jour</p>
              <p className="levier-desc">Ouvrir les fenêtres la nuit quand l&apos;air extérieur se rafraîchit, puis tout fermer et occulter dès le matin avant que le soleil chauffe la façade. Cette technique peut maintenir l&apos;intérieur à 5 à 10 degrés de moins que l&apos;extérieur en journée. Des volets fermés bloquent 60 à 80 % du rayonnement solaire entrant selon l&apos;orientation. Sans volets extérieurs, des rideaux épais apportent une protection partielle mais réelle.</p>
              <span className="levier-src">Cerema · ANSES recommandations chaleur 2024</span>
            </div>
          </div>
          <div className="levier">
            <div className="levier-icon">02</div>
            <div>
              <p className="levier-title">Rester à l&apos;ombre entre 11 h et 19 h</p>
              <p className="levier-desc">L&apos;exposition directe au soleil est un facteur de risque indépendant de la température ambiante. Planifier les sorties avant 11 h ou après 19 h est l&apos;une des mesures les plus efficaces documentées dans les bilans de Santé publique France. Les activités physiques intenses restent déconseillées même à l&apos;ombre au-delà de 35 degrés, quelle que soit votre condition habituelle.</p>
              <span className="levier-src">Santé publique France, bilans caniculaires 2022 · ANSES 2024</span>
            </div>
          </div>
          <div className="levier">
            <div className="levier-icon">03</div>
            <div>
              <p className="levier-title">Boire régulièrement, sans attendre la soif</p>
              <p className="levier-desc">La sensation de soif est un indicateur retardé, particulièrement peu fiable chez les personnes âgées. Attendre d&apos;avoir soif signifie commencer à s&apos;hydrater après que la déshydratation est déjà amorcée. Pour les personnes âgées lors d&apos;épisodes prolongés, l&apos;eau seule n&apos;est pas toujours suffisante : les solutions de réhydratation orale disponibles en pharmacie sans ordonnance apportent les sels minéraux nécessaires. Cette précision est rarement mentionnée dans les campagnes générales.</p>
              <span className="levier-src">ANSES recommandations nutrition chaleur · HAS fiches pratiques canicule</span>
            </div>
          </div>
        </div>

        <div className="keystat">
          <span className="keystat-number">9 sur 10</span>
          <span className="keystat-label">Décès lors de la canicule de 2003 ont eu lieu à domicile. La plupart concernaient des personnes âgées vivant seules, dans des logements peu ventilés, sans contact régulier.</span>
          <span className="keystat-src">Source : Inserm · Santé publique France, analyse canicule 2003</span>
        </div>

        {hasFullAccess ? (
          <>
            <h2>Ce que vous pouvez faire avant le prochain épisode</h2>

            <div className="steps">
              <div className="step">
                <div className="step-num">01</div>
                <div className="step-content">
                  <p className="step-title">Configurer les alertes Météo-France pour votre département</p>
                  <p className="step-desc">Les seuils de vigilance canicule sont fixés par département selon sa zone climatique. Ceux de Marseille ne sont pas ceux de Strasbourg. L&apos;application Météo-France permet de recevoir une notification dès le passage en vigilance orange ou rouge pour votre zone. Le configurer avant un épisode prend deux minutes.</p>
                  <a className="step-link" href="https://vigilance.meteofrance.fr" target="_blank" rel="noopener">vigilance.meteofrance.fr ↗</a>
                </div>
              </div>
              <div className="step">
                <div className="step-num">02</div>
                <div className="step-content">
                  <p className="step-title">Identifier la pièce la plus fraîche de votre logement</p>
                  <p className="step-desc">Dans la plupart des logements, c&apos;est une pièce orientée au nord ou au nord-est, au rez-de-chaussée. Repérer cet espace avant un épisode, et préparer un endroit où vous pouvez vous installer plusieurs heures, est une mesure recommandée par le Plan national canicule. Vaporiser un peu d&apos;eau sur le sol avant de fermer la pièce la rafraîchit légèrement.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">03</div>
                <div className="step-content">
                  <p className="step-title">Repérer les espaces frais publics proches de chez vous</p>
                  <p className="step-desc">Lors des vigilances orange et rouge, les mairies ont l&apos;obligation d&apos;ouvrir ou de signaler des espaces rafraîchisseurs accessibles gratuitement. En dehors des alertes, bibliothèques, grandes surfaces et certains musées sont utilisables. Connaître les deux ou trois plus proches avant un épisode réduit le délai de décision quand vous ou votre entourage en avez besoin.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">04</div>
                <div className="step-content">
                  <p className="step-title">Vérifier avec votre médecin si votre traitement demande une attention particulière</p>
                  <p className="step-desc">Certains médicaments, notamment les diurétiques, certains antihypertenseurs et les antipsychotiques, réduisent la capacité à supporter la chaleur ou augmentent le risque de déshydratation. La démarche utile est d&apos;en parler avant l&apos;été, en consultation programmée, pour connaître les signes à surveiller. Ne modifiez jamais votre traitement sans avis médical.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">05</div>
                <div className="step-content">
                  <p className="step-title">Inscrire une personne vulnérable sur le registre communal canicule</p>
                  <p className="step-desc">Depuis 2004, les communes peuvent tenir un registre des personnes âgées ou en situation de handicap pour faciliter leur contact lors des alertes. Ce registre est volontaire, géré par le Centre communal d&apos;action sociale et confidentiel. Votre mairie peut vous indiquer s&apos;il existe dans votre commune et comment y inscrire un proche.</p>
                </div>
              </div>
            </div>

            <h2>Selon votre situation</h2>

            <div className="profiles">
              <div className="profile">
                <p className="profile-title"><span>Prioritaire</span>Personne âgée isolée, logement sous les toits</p>
                <p className="profile-desc">C&apos;est le profil qui a représenté la grande majorité des décès de 2003 et 2022 selon Santé publique France et l&apos;Inserm : plus de 75 ans, vivant seul, logement en dernier étage sans occultation efficace, peu de contacts réguliers. La priorité est d&apos;identifier ce profil dans votre entourage et d&apos;établir un contact quotidien pendant les épisodes d&apos;alerte orange ou rouge.</p>
              </div>
              <div className="profile">
                <p className="profile-title"><span>Vigilance</span>Personne sous traitement affectant la thermorégulation</p>
                <p className="profile-desc">Les diurétiques, certains antihypertenseurs, les antipsychotiques et les médicaments antiparkinsoniens peuvent réduire la tolérance à la chaleur. La démarche utile est d&apos;en parler avant l&apos;été, pas d&apos;attendre l&apos;alerte, pour connaître la conduite à tenir avec son traitement spécifique.</p>
              </div>
              <div className="profile">
                <p className="profile-title"><span>Standard</span>Adulte en bonne santé, logement ventilable</p>
                <p className="profile-desc">Les mesures de base suffisent dans la grande majorité des épisodes : limiter l&apos;exposition directe aux heures chaudes, boire régulièrement, appliquer la ventilation nocturne et l&apos;occultation diurne. Le risque principal n&apos;est souvent pas personnel mais vient de la méconnaissance des personnes vulnérables dans l&apos;entourage immédiat.</p>
              </div>
              <div className="profile">
                <p className="profile-title"><span>À connaître</span>Travailleur exposé à la chaleur</p>
                <p className="profile-desc">Le Code du travail impose des obligations lors de chaleur extrême : aménagement des horaires, fourniture d&apos;eau fraîche, accès à l&apos;ombre. Si ces mesures sont absentes lors d&apos;une vigilance orange ou rouge, vous pouvez contacter l&apos;inspection du travail.</p>
              </div>
            </div>

            <h2>Ce que vous n&apos;avez pas à faire</h2>

            <div className="nolist">
              <div className="noitem">
                <div className="no-icon">×</div>
                <div>
                  <p className="no-title">Utiliser un ventilateur seul quand la température dépasse 35 degrés</p>
                  <p className="no-desc">Au-delà de 35 degrés ambiants, un ventilateur souffle de l&apos;air chaud et accélère la perte hydrique sans abaisser la température corporelle. L&apos;ANSES recommande de l&apos;associer à une vaporisation régulière d&apos;eau sur la peau, ou de préférer un espace climatisé.</p>
                </div>
              </div>
              <div className="noitem">
                <div className="no-icon">×</div>
                <div>
                  <p className="no-title">Supposer que la climatisation de l&apos;immeuble suffit toujours</p>
                  <p className="no-desc">Les systèmes collectifs peuvent tomber en panne lors d&apos;épisodes prolongés ou de pics de consommation simultanée. Connaître les espaces frais alternatifs proches de chez soi avant un épisode évite de dépendre d&apos;un seul système lors d&apos;une alerte rouge.</p>
                </div>
              </div>
              <div className="noitem">
                <div className="no-icon">×</div>
                <div>
                  <p className="no-title">Modifier votre traitement sans avis médical pendant une canicule</p>
                  <p className="no-desc">Même si certains médicaments sont des facteurs de risque par forte chaleur, les arrêter ou modifier la dose sans avis médical peut être dangereux. La bonne démarche est d&apos;en avoir discuté avant l&apos;été, en consultation programmée.</p>
                </div>
              </div>
            </div>

            <div className="actions-card">
              <div className="actions-card-head">Pour aller plus loin</div>
              <ul className="actions-list">
                <li>
                  <Link href="/savoir/chaleur-sante-mentale">
                    La chaleur et la santé mentale <span className="arrow">→</span>
                  </Link>
                </li>
                <li>
                  <Link href="/territoires/canicule">
                    Comprendre l&apos;exposition canicule de votre commune <span className="arrow">→</span>
                  </Link>
                </li>
              </ul>
            </div>

            <section className="sources">
              <h2>Sources</h2>
              <ul>
                <li>
                  <span className="src-tag">SPF</span>
                  <span>Santé publique France, bilan de la surveillance sanitaire des canicules 2022 et 2003 par tranche d&apos;âge, lieu de décès et facteurs de risque, <a href="https://www.santepubliquefrance.fr" target="_blank" rel="noopener">santepubliquefrance.fr</a>.</span>
                </li>
                <li>
                  <span className="src-tag">Inserm</span>
                  <span>Analyse épidémiologique de la canicule d&apos;août 2003, surmortalité et facteurs de risque associés, <a href="https://www.inserm.fr" target="_blank" rel="noopener">inserm.fr</a>.</span>
                </li>
                <li>
                  <span className="src-tag">ANSES</span>
                  <span>Recommandations pour la protection de la santé face aux vagues de chaleur, fiches pratiques 2024. Inclut les interactions médicamenteuses et l&apos;usage du ventilateur, <a href="https://www.anses.fr" target="_blank" rel="noopener">anses.fr</a>.</span>
                </li>
                <li>
                  <span className="src-tag">Cerema</span>
                  <span>Confort d&apos;été dans les bâtiments, données mesurées sur l&apos;efficacité du free cooling passif et de l&apos;occultation solaire selon l&apos;orientation, <a href="https://www.cerema.fr" target="_blank" rel="noopener">cerema.fr</a>.</span>
                </li>
                <li>
                  <span className="src-tag">HAS</span>
                  <span>Haute Autorité de Santé, fiche mémo sur les précautions médicamenteuses en situation de chaleur extrême, classes thérapeutiques à surveiller.</span>
                </li>
                <li>
                  <span className="src-tag">Météo-France</span>
                  <span>Plan national canicule, seuils de vigilance départementaux et niveaux d&apos;alerte, <a href="https://vigilance.meteofrance.fr" target="_blank" rel="noopener">vigilance.meteofrance.fr</a>.</span>
                </li>
              </ul>
            </section>
          </>
        ) : (
          <div style={{ position: 'relative', marginTop: '40px' }}>
            <div style={{ maxHeight: '260px', overflow: 'hidden', pointerEvents: 'none', userSelect: 'none', opacity: 0.45 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '28px', color: 'var(--fg-1)', margin: '0 0 20px' }}>
                Ce que vous pouvez faire avant le prochain épisode
              </h2>
              <p style={{ color: 'var(--fg-3)', fontSize: '15px', lineHeight: 1.7 }}>Configurer les alertes Météo-France, identifier la pièce la plus fraîche, repérer les espaces frais publics, vérifier votre traitement avec votre médecin…</p>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px', background: 'linear-gradient(to bottom, transparent, var(--bg))', pointerEvents: 'none' }} />
            <div style={{ marginTop: '40px', padding: '40px 36px', background: 'var(--bg-elev)', border: '1px solid var(--border-1)', borderLeft: '2px solid var(--accent)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px' }}>
                Réservé aux abonnés Suivi
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', lineHeight: 1.4, color: 'var(--fg-1)', margin: '0 0 28px', fontWeight: 400 }}>
                Les étapes et profils détaillés sont<br />disponibles dans votre abonnement.
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/inscription" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', background: 'var(--accent)', color: '#060812', fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 600, textDecoration: 'none', borderRadius: '6px' }}>
                  S&apos;abonner — Accès Suivi
                </Link>
                <Link href="/connexion" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', border: '1px solid var(--border-1)', color: 'var(--fg-3)', fontFamily: 'var(--font-sans)', fontSize: '15px', textDecoration: 'none', borderRadius: '6px' }}>
                  Déjà abonné ? Se connecter
                </Link>
              </div>
            </div>
          </div>
        )}

      </article>

      <footer className="page-footer">
        <div>futur•e · Agir / Santé</div>
        <div>
          <Link href="/pourquoi">Pourquoi futur•e</Link>
          {' · '}
          <Link href="/territoires/canicule">Territoires / Canicule</Link>
        </div>
      </footer>
    </>
  );
}
