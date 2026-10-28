'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { IrepAutour, Milieu } from '@/lib/data/irep-registre';
import type { CategorieLue, FicheSsp, SitesSolsCommune } from '@/lib/sites-sols';
import type { EauPotableCommune, ParametreLu, ReseauLu, Conformite } from '@/lib/eau-potable';
import type { AtmoAirQuality, AtmoLevel } from '@/lib/atmo';

// LES QUATRE RECHERCHES DE /agir/pollutions-invisibles (FUT-152, 28/10/2026).
//
// Une recherche rend des DONNÉES, que ce composant met en forme : aucune chaîne HTML n'est plus construite ni
// injectée. Avant FUT-152, les noms et adresses venus de Géorisques entraient tels quels dans un
// `dangerouslySetInnerHTML` ; React les échappe désormais, et un lien n'est rendu que s'il pointe vers un
// domaine public attendu (`lienFicheSur`).
//
// Chaque recherche distingue quatre issues, et aucune ne se déguise en une autre :
//   - un résultat, avec son périmètre et sa date ;
//   - aucun élément DANS LA SOURCE, dit avec la limite de cette source ;
//   - un résultat partiel, nommé comme tel ;
//   - une source indisponible : rien n'en est conclu.

// ── Types ────────────────────────────────────────────────────────────────────

type Commune = {
  nom: string;
  code: string;
  codesPostaux?: string[];
  departement?: { nom: string };
  centre?: { type: string; coordinates: [number, number] }; // [lon, lat]
};

type Lecture<T> =
  | { statut: 'idle' }
  | { statut: 'loading' }
  | { statut: 'erreur' }
  | { statut: 'ok'; data: T; commune: Commune };

// ── Mise en forme ────────────────────────────────────────────────────────────

const dateFr = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};
const km = (m: number) => `${(m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
const nombre = (n: number) => n.toLocaleString('fr-FR');
const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);

function Badge({ ton, children }: { ton: 'ok' | 'warn' | 'alert' | 'neutral'; children: ReactNode }) {
  return <span className={`result-badge badge-${ton}`}>{children}</span>;
}

function Lien({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="lookup-link">
      {children}
    </a>
  );
}

function Precisions({ children }: { children: ReactNode }) {
  return (
    <details className="lookup-details">
      <summary>Précisions sur la source</summary>
      <div className="lookup-details-body">{children}</div>
    </details>
  );
}

/** Une liste longue s'ouvre à la demande : rien n'est tronqué, tout est accessible. */
function ListeDepliable<T>({ items, rendre, premiers = 8, cle }: {
  items: T[]; rendre: (x: T) => ReactNode; premiers?: number; cle: (x: T) => string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const visibles = ouvert ? items : items.slice(0, premiers);
  return (
    <>
      {visibles.map((x) => <div key={cle(x)} className="lookup-result-item">{rendre(x)}</div>)}
      {items.length > premiers && (
        <button type="button" className="lookup-more" onClick={() => setOuvert((o) => !o)}>
          {ouvert ? 'Réduire la liste' : `Afficher les ${items.length - premiers} autres`}
        </button>
      )}
    </>
  );
}

// ── Commune autocomplete ──────────────────────────────────────────────────────

async function fetchCommunes(q: string): Promise<Commune[]> {
  if (q.length < 2) return [];
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux,departement,centre&boost=population&limit=6`
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/** Une réponse non 2xx, ou un réseau coupé, est une erreur : jamais un résultat vide. */
async function lireJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return (await res.json()) as T;
}

// ── IREP — établissements déclarant des rejets ───────────────────────────────

const MILIEU_LIBELLE: Record<Milieu, string> = {
  air: 'Air', eau_directe: 'Eau (rejet direct)', eau_indirecte: 'Eau (via une station d’épuration)', sol: 'Sol',
};
const IREP_CONSULTATION = 'https://www.georisques.gouv.fr/risques/registre-des-emissions-polluantes/accueil';
const IREP_PAGE = 'https://www.georisques.gouv.fr/donnees/bases-de-donnees/installations-industrielles-rejetant-des-polluants';

type IrepLu = Exclude<IrepAutour, { etat: 'indisponible' }>;

async function searchIrep(commune: Commune): Promise<IrepLu> {
  const c = commune.centre?.coordinates;
  if (!c) throw new Error('Commune sans centre');
  return lireJson<IrepLu>(`/api/proxy/irep?lat=${c[1]}&lon=${c[0]}`);
}

function RenduIrep({ data, commune }: { data: IrepLu; commune: Commune }) {
  const n = data.avecRejet.length;
  return (
    <>
      <div className="lookup-scope">
        Dans un rayon de {km(data.rayonM)} autour du centre de {commune.nom} · déclarations {data.annee}
      </div>
      {data.etat === 'absent_dans_source' ? (
        <div className="lookup-empty">
          Aucun établissement du registre IREP {data.annee} dans ce rayon. Le registre ne couvre que les
          établissements soumis à déclaration : d’autres activités peuvent rejeter des polluants sans y figurer.
        </div>
      ) : (
        <>
          <div className="lookup-section-head">
            {n === 0
              ? 'Aucun établissement avec un rejet chiffré publié dans ce rayon'
              : `${n} ${pluriel(n, 'établissement avec au moins un rejet chiffré publié', 'établissements avec au moins un rejet chiffré publié')}`}
          </div>
          <ListeDepliable
            items={data.avecRejet}
            cle={(e) => e.id}
            rendre={(e) => (
              <>
                <div className="result-name">{e.nom}</div>
                <div className="result-meta">
                  À {km(e.distanceM)} · {e.commune}{e.activite ? ` · ${e.activite}` : ''}
                </div>
                <div className="result-meta">
                  Rejets publiés dans : {e.milieux.map((m) => MILIEU_LIBELLE[m]).join(', ')}
                </div>
                <div className="result-meta">Polluants : {e.polluants.join(', ')}</div>
              </>
            )}
          />
          {data.sansRejetChiffre > 0 && (
            <div className="lookup-note">
              {nombre(data.sansRejetChiffre)} {pluriel(data.sansRejetChiffre, 'autre établissement du registre', 'autres établissements du registre')} dans
              ce rayon, sans rejet chiffré publié au-dessus des seuils (déclarations de déchets, de prélèvements d’eau, ou
              rejets sous les seuils de publication).
            </div>
          )}
        </>
      )}
      <div className="lookup-note">
        Une déclaration porte sur les quantités rejetées par le site. Elle ne mesure pas l’exposition d’un logement voisin.
      </div>
      <Precisions>
        <p>
          Registre des émissions polluantes (IREP), INERIS et ministère de la Transition écologique : export annuel
          {' '}{data.annee} publié sur <Lien href={IREP_PAGE}>Géorisques</Lien>. Un rejet n’est publié en quantité que s’il
          dépasse le seuil fixé pour ce polluant (arrêté du 31 janvier 2008) ; seuls les noms des polluants sont repris ici.
        </p>
        <p>
          Distances à vol d’oiseau entre le centre de la commune et la position déclarée du site. La commune indiquée est
          celle que l’établissement a déclarée, parfois celle de son siège. {data.exclusNational} établissements du registre
          national, dont la position déclarée se trouve hors de leur département, sont écartés de la recherche.
        </p>
        <p><Lien href={IREP_CONSULTATION}>Consulter le registre sur Géorisques</Lien>, par établissement ou par polluant.</p>
      </Precisions>
    </>
  );
}

// ── Sites et sols ─────────────────────────────────────────────────────────────

const CARTE_GEORISQUES = 'https://www.georisques.gouv.fr/cartes-interactives#/';

async function searchSitesSols(commune: Commune): Promise<SitesSolsCommune> {
  return lireJson<SitesSolsCommune>(`/api/proxy/sis?insee=${encodeURIComponent(commune.code)}`);
}

function Fiche({ f }: { f: FicheSsp }) {
  return (
    <>
      <div className="result-name">
        {f.nom}
        {f.statut && <Badge ton="neutral">{f.statut}</Badge>}
      </div>
      <div className="result-meta">
        {[f.adresse, f.commune].filter(Boolean).join(', ') || 'Adresse non renseignée'}
        {f.fiche && <> · <Lien href={f.fiche}>fiche officielle</Lien></>}
      </div>
    </>
  );
}

function Inventaire({ titre, sens, lu, vide }: { titre: string; sens: string; lu: CategorieLue; vide: string }) {
  return (
    <div className="lookup-section">
      <div className="lookup-section-head">
        {titre}{lu.etat === 'disponible' || lu.etat === 'partiel' ? ` : ${nombre(lu.total)}` : ''}
      </div>
      <div className="lookup-section-desc">{sens}</div>
      {lu.etat === 'indisponible' && (
        <div className="lookup-error">Inventaire momentanément indisponible : rien ne peut en être conclu pour cette commune.</div>
      )}
      {lu.etat === 'absent_dans_source' && <div className="lookup-empty">{vide}</div>}
      {lu.etat === 'partiel' && (
        <div className="lookup-note">Liste incomplète : la source annonce davantage de fiches que celles lues ici.</div>
      )}
      {(lu.etat === 'disponible' || lu.etat === 'partiel') && (
        <ListeDepliable items={lu.fiches} cle={(f) => f.id} premiers={5} rendre={(f) => <Fiche f={f} />} />
      )}
    </div>
  );
}

function RenduSitesSols({ data, commune }: { data: SitesSolsCommune; commune: Commune }) {
  const { perimetre: p, casias } = data;
  const autresCodes = p.codes.length - 1;
  return (
    <>
      <div className="lookup-scope">
        Commune de {commune.nom}{autresCodes > 0 ? ' et les codes qui la composent ou l’ont composée' : ''} · consulté le {dateFr(data.consulteLe)}
      </div>
      <Inventaire
        titre="Secteurs d’information sur les sols (SIS)"
        sens="Pollution connue de l’État. Des études de sols sont exigées pour construire ou changer d’usage, et le secteur figure dans l’état des risques remis à l’acheteur ou au locataire."
        lu={data.sis}
        vide="Aucun secteur d’information sur les sols arrêté dans cette commune."
      />
      <Inventaire
        titre="Pollutions suivies par l’administration (ex-BASOL)"
        sens="Pollution suspectée ou avérée, sur laquelle l’administration est intervenue ou intervient."
        lu={data.instructions}
        vide="Aucune pollution suivie par l’administration dans la source pour cette commune."
      />
      <Inventaire
        titre="Servitudes d’utilité publique liées à une pollution"
        sens="Restrictions d’usage inscrites sur un terrain pollué."
        lu={data.sup}
        vide="Aucune servitude de ce type dans la source pour cette commune."
      />
      <div className="lookup-section">
        <div className="lookup-section-head">
          Anciennes activités industrielles et de services (CASIAS)
          {casias.etat === 'disponible' && ` : ${nombre(casias.total)} ${pluriel(casias.total, 'fiche', 'fiches')}`}
          {casias.etat === 'partiel' && ` : au moins ${nombre(casias.total)} fiches`}
        </div>
        {casias.etat === 'indisponible' ? (
          <div className="lookup-error">Inventaire momentanément indisponible : rien ne peut en être conclu pour cette commune.</div>
        ) : (
          <div className="lookup-section-desc">
            {casias.etat === 'absent_dans_source' ? 'Aucune fiche dans l’inventaire pour cette commune. ' : ''}
            {casias.etat === 'partiel' ? 'La lecture s’est arrêtée avant la dernière page : le nombre réel est plus élevé. ' : ''}
            Une fiche indique qu’une activité a existé, sans qu’une pollution ait été constatée. L’inventaire est historique
            et incomplet. Pour situer ces activités près d’une adresse : <Lien href={CARTE_GEORISQUES}>carte Géorisques</Lien>.
          </div>
        )}
      </div>
      <div className="lookup-note">Un même terrain peut figurer dans plusieurs inventaires : les nombres ne s’additionnent pas.</div>
      <Precisions>
        <p>
          Géorisques (ministère de la Transition écologique, BRGM), service « sites et sols pollués », interrogé le
          {' '}{dateFr(data.consulteLe)} sur {p.codes.length} {pluriel(p.codes.length, 'code commune', 'codes commune')}.
          Chaque nombre compte des fiches distinctes : la source répète certaines fiches, qui ne sont comptées qu’une fois.
        </p>
        <p>
          Les fiches sont rattachées à un code commune. Pour Paris, Lyon et Marseille, la recherche couvre la ville et ses
          arrondissements ; pour une commune issue d’une fusion, elle couvre aussi les anciennes communes, dont certaines
          fiches portent encore le code.{p.elargiALaVille ? ' Un arrondissement est lu avec toute sa ville : rien dans la source ne dit à quel arrondissement une fiche de la ville appartient.' : ''}
        </p>
      </Precisions>
    </>
  );
}

// ── ATMO — qualité de l'air ──────────────────────────────────────────────────

const ATMO_LABELS: Record<string, string> = { pm25: 'PM2.5', pm10: 'PM10', no2: 'NO₂', o3: 'O₃' };
const tonAtmo = (v: number) => (v <= 2 ? 'ok' : v <= 3 ? 'warn' : 'alert');

type AtmoLu = { etat: 'disponible'; indice: AtmoAirQuality } | { etat: 'absent_dans_source' };

async function searchAtmo(commune: Commune): Promise<AtmoLu> {
  const res = await fetch(`/api/atmo/${encodeURIComponent(commune.code)}`);
  if (res.status === 404) return { etat: 'absent_dans_source' };
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return { etat: 'disponible', indice: (await res.json()) as AtmoAirQuality };
}

function RenduAtmo({ data }: { data: AtmoLu }) {
  if (data.etat === 'absent_dans_source') {
    return <div className="lookup-empty">Aucun indice ATMO publié pour cette commune aujourd’hui ni hier.</div>;
  }
  const { indice } = data;
  const polluants = (Object.entries(indice.pollutants) as [string, AtmoLevel | null][]).filter(([, v]) => v !== null);
  return (
    <div className="lookup-result-item">
      <div className="result-name">
        Indice ATMO du {dateFr(indice.date)} <Badge ton={tonAtmo(indice.index.value)}>{indice.index.label}</Badge>
      </div>
      <div className="result-meta">
        {polluants.length
          ? polluants.map(([k, v], i) => (
              <span key={k}>{i > 0 && ' · '}{ATMO_LABELS[k] ?? k} <Badge ton={tonAtmo(v!.value)}>{v!.label}</Badge></span>
            ))
          : 'Détail par polluant non publié'}
      </div>
      {indice.source && <div className="result-meta">Publié par {indice.source}, association agréée de surveillance de la qualité de l’air.</div>}
    </div>
  );
}

// ── EAU POTABLE ───────────────────────────────────────────────────────────────

type EauLu = Exclude<EauPotableCommune, { etat: 'indisponible' }>;

async function searchEau(commune: Commune): Promise<EauLu> {
  return lireJson<EauLu>(`/api/proxy/eau?insee=${encodeURIComponent(commune.code)}`);
}

function BadgeConformite({ c, oui, non }: { c: Conformite; oui: string; non: string }) {
  if (c === 'conforme') return <Badge ton="ok">{oui}</Badge>;
  if (c === 'non_conforme') return <Badge ton="alert">{non}</Badge>;
  return null;
}

function Reseau({ r }: { r: ReseauLu }) {
  const p = r.dernier;
  return (
    <>
      <div className="result-name">Réseau {r.nom}</div>
      {r.zone && <div className="result-meta">Dessert : {r.zone}</div>}
      {p === 'indisponible' && <div className="result-meta">Résultat indisponible pour ce réseau : rien ne peut en être conclu.</div>}
      {p === null && <div className="result-meta">Aucun prélèvement publié pour ce réseau.</div>}
      {p && p !== 'indisponible' && (
        <>
          <div className="result-meta">Dernier prélèvement publié : {dateFr(p.date)}</div>
          {p.conclusion && <div className="result-quote">« {p.conclusion} »</div>}
          <div className="result-meta">
            <BadgeConformite c={p.limitesBacterio === 'non_conforme' || p.limitesPhysicoChimie === 'non_conforme' ? 'non_conforme' : p.limitesBacterio && p.limitesPhysicoChimie ? 'conforme' : null}
              oui="Limites de qualité respectées" non="Limite de qualité dépassée" />
            <BadgeConformite c={p.referencesBacterio === 'non_conforme' || p.referencesPhysicoChimie === 'non_conforme' ? 'non_conforme' : p.referencesBacterio && p.referencesPhysicoChimie ? 'conforme' : null}
              oui="Références de qualité respectées" non="Référence de qualité non respectée" />
          </div>
        </>
      )}
    </>
  );
}

function Parametre({ p }: { p: ParametreLu }) {
  const badge = p.depasseLimite ? <Badge ton="alert">Au-dessus de la limite</Badge>
    : p.depasseVigilance ? <Badge ton="warn">Vigilance</Badge>
    : p.depasseLimite === false ? <Badge ton="ok">Sous la limite</Badge>
    : null;
  return (
    <div className="result-meta">
      {p.libelle} : <strong className="result-value">{p.valeur} {p.unite}</strong>{badge}
      <span className="result-date"> · {dateFr(p.date)}{p.reseau ? ` · réseau ${p.reseau}` : ''}</span>
    </div>
  );
}

function RenduEau({ data, commune }: { data: EauLu; commune: Commune }) {
  if (data.etat === 'absent_dans_source') {
    return <div className="lookup-empty">Aucun prélèvement publié pour {commune.nom} dans la base des contrôles sanitaires des ARS.</div>;
  }
  const n = data.reseaux.length;
  return (
    <>
      <div className="lookup-scope">
        {n > 1
          ? `${commune.nom} est desservie par ${n} réseaux de distribution : chaque résultat ne vaut que pour son réseau.`
          : `Contrôle sanitaire de ${commune.nom} · consulté le ${dateFr(data.consulteLe)}`}
      </div>
      {data.etat === 'partiel' && (
        <div className="lookup-note">Lecture incomplète : une partie des résultats n’a pas pu être obtenue.</div>
      )}
      <ListeDepliable items={data.reseaux} cle={(r) => r.code || r.nom} rendre={(r) => <Reseau r={r} />} />
      {data.parametres.length > 0 && (
        <div className="lookup-result-item">
          <div className="result-name">Dernières valeurs publiées</div>
          {data.parametres.map((p) => <Parametre key={p.code} p={p} />)}
        </div>
      )}
      <div className="lookup-note">Un prélèvement décrit l’eau à sa date. Il ne garantit pas la qualité de l’eau aujourd’hui.</div>
      <Precisions>
        <p>
          Résultats du contrôle sanitaire des agences régionales de santé, publiés par <Lien href="https://hubeau.eaufrance.fr/page/api-qualite-eau-potable">Hub’Eau</Lien>,
          consultés le {dateFr(data.consulteLe)}. Les ARS publient avec quelques semaines de délai, et une petite commune peut
          n’être contrôlée que quelques fois par an : la date de chaque résultat est affichée.
        </p>
        <p>
          Limites de qualité réglementaires (arrêté du 11 janvier 2007) : nitrates 50 mg/L, nitrites 0,5 mg/L, plomb 10 µg/L,
          arsenic 10 µg/L, total des pesticides 0,5 µg/L. Le repère « vigilance » au-delà de 25 mg/L de nitrates est retenu par
          futur•e ; il n’a pas de valeur réglementaire. Une valeur précédée de « &lt; » est sous le seuil de quantification du laboratoire.
        </p>
        <p>
          Le plomb se mesure au robinet : il provient surtout des canalisations intérieures du bâtiment où le prélèvement a
          été fait, et ne décrit pas tout le réseau.
        </p>
      </Precisions>
    </>
  );
}

// ── Bloc générique ────────────────────────────────────────────────────────────

type LookupBlockProps<T> = {
  title: string;
  sub: string;
  desc: string;
  rechercher: (c: Commune) => Promise<T>;
  rendre: (data: T, commune: Commune) => ReactNode;
  panne: ReactNode;
};

function LookupBlock<T>({ title, sub, desc, rechercher, rendre, panne }: LookupBlockProps<T>) {
  const [input, setInput] = useState('');
  const [commune, setCommune] = useState<Commune | null>(null);
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [lecture, setLecture] = useState<Lecture<T>>({ statut: 'idle' });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demande = useRef(0);

  const onInput = useCallback((value: string) => {
    setInput(value);
    setCommune(null);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setOuvert(false);
      return;
    }
    timer.current = setTimeout(async () => {
      const communes = await fetchCommunes(value.trim());
      setSuggestions(communes);
      setOuvert(communes.length > 0);
    }, 280);
  }, []);

  const onSelect = useCallback((c: Commune) => {
    setInput(c.nom);
    setCommune(c);
    setOuvert(false);
    setSuggestions([]);
  }, []);

  const onSearch = useCallback(async () => {
    if (!commune) return;
    // Seule la dernière recherche lancée s'affiche : une réponse lente ne remplace pas une plus récente.
    const n = ++demande.current;
    setLecture({ statut: 'loading' });
    try {
      const data = await rechercher(commune);
      if (n === demande.current) setLecture({ statut: 'ok', data, commune });
    } catch {
      if (n === demande.current) setLecture({ statut: 'erreur' });
    }
  }, [commune, rechercher]);

  return (
    <div className="lookup-block">
      <div className="lookup-header">
        <div>
          <div className="lookup-title">{title}</div>
          <div className="lookup-sub">{sub}</div>
        </div>
      </div>
      <div className="lookup-body">
        <p className="lookup-desc">{desc}</p>
        <div className="lookup-form">
          <div className="commune-wrap">
            <input
              className="lookup-input"
              type="text"
              placeholder="Nom de commune…"
              autoComplete="off"
              aria-label={`Commune pour la recherche : ${title}`}
              value={input}
              onChange={(e) => onInput(e.target.value)}
              onBlur={() => setTimeout(() => setOuvert(false), 200)}
              onKeyDown={(e) => { if (e.key === 'Escape') setOuvert(false); }}
            />
            {ouvert && (
              <div className="commune-dropdown open">
                {suggestions.map((c) => (
                  <div key={c.code} className="commune-opt" onMouseDown={(e) => { e.preventDefault(); onSelect(c); }}>
                    {c.nom}
                    <span className="commune-opt-meta">{c.codesPostaux?.[0] ?? ''} · {c.departement?.nom ?? ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="lookup-btn" disabled={!commune || lecture.statut === 'loading'} onClick={onSearch}>
            {lecture.statut === 'loading' ? '…' : 'Rechercher'}
          </button>
        </div>

        {lecture.statut !== 'idle' && (
          <div className="lookup-results visible" aria-live="polite">
            {lecture.statut === 'loading' && <div className="lookup-loading">Chargement…</div>}
            {lecture.statut === 'erreur' && <div className="lookup-error">{panne}</div>}
            {lecture.statut === 'ok' && rendre(lecture.data, lecture.commune)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function PollutionLookup() {
  return (
    <>
      <LookupBlock<IrepLu>
        title="Installations industrielles déclarant des rejets"
        sub="Registre IREP · Géorisques · Déclarations annuelles"
        desc="Certains établissements industriels, élevages et grandes stations d’épuration déclarent chaque année leurs rejets de polluants dans l’air, l’eau et les sols. Une quantité n’est publiée que si elle dépasse le seuil fixé pour le polluant. La recherche porte sur 10 km autour du centre de la commune."
        rechercher={searchIrep}
        rendre={(data, commune) => <RenduIrep data={data} commune={commune} />}
        panne={<>Registre momentanément indisponible : rien ne peut en être conclu. Consultez-le sur <Lien href={IREP_CONSULTATION}>Géorisques</Lien>.</>}
      />
      <LookupBlock<SitesSolsCommune>
        title="Sites et sols pollués ou potentiellement pollués"
        sub="Géorisques · SIS, instructions, servitudes, CASIAS"
        desc="Quatre inventaires publics, de portée différente : une pollution connue de l’État ne pèse pas comme le souvenir d’une ancienne activité. Beaucoup de quartiers sont construits sur d’anciens terrains industriels dont l’histoire est oubliée."
        rechercher={searchSitesSols}
        rendre={(data, commune) => <RenduSitesSols data={data} commune={commune} />}
        panne={<>Inventaires momentanément indisponibles : Géorisques ne répond pas, rien ne peut en être conclu. Consultez directement <Lien href={CARTE_GEORISQUES}>la carte Géorisques</Lien>.</>}
      />
      <LookupBlock<AtmoLu>
        title="Qualité de l'air aujourd'hui"
        sub="Indice ATMO · PM2.5, PM10, NO₂, O₃"
        desc="L'indice ATMO intègre les principaux polluants atmosphériques. Il est utile pour les épisodes de pollution, moins pour comprendre l'exposition chronique de fond, qui est plus déterminante sur le long terme que les pics ponctuels."
        rechercher={searchAtmo}
        rendre={(data) => <RenduAtmo data={data} />}
        panne={<>Indice ATMO momentanément indisponible : la source ne répond pas. Consultez <Lien href="https://www.atmo-france.org/">atmo-france.org</Lien>.</>}
      />
      <LookupBlock<EauLu>
        title="Qualité de l'eau potable"
        sub="ARS · Contrôle sanitaire par réseau de distribution"
        desc="Les agences régionales de santé contrôlent l'eau du robinet réseau par réseau. Vous voyez le dernier prélèvement publié de chaque réseau qui dessert la commune, avec la conclusion de l'ARS, et les dernières valeurs de nitrates, nitrites, plomb, arsenic et pesticides."
        rechercher={searchEau}
        rendre={(data, commune) => <RenduEau data={data} commune={commune} />}
        panne={<>Résultats momentanément indisponibles : rien ne peut en être conclu. Consultez <Lien href="https://orobnat.sante.gouv.fr/orobnat/rechercherResultatQualite.do">le site du ministère de la Santé</Lien>.</>}
      />
    </>
  );
}
