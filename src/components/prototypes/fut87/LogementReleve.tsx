// FUT-87 · PROTOTYPE 3 · LE MODULE LOGEMENT DANS LA DIRECTION « LE RELEVÉ ». DEV UNIQUEMENT.
//
// Mêmes données que la page « avant » (fixture anonymisée, lectures dérivées par les fonctions de
// production). La composition change :
//
//   1. Le passeport devient une PLANCHE : l'échelle DPE complète où la lettre se lit par sa position,
//      la consommation en grand, la fiche du bien en marge, et la règle du temps du bâtiment.
//   2. L'audit énergétique se DESSINE : une barre par étape, longueur proportionnelle à la
//      consommation de la source, du point de départ à l'étape finale.
//   3. L'exposition se lit PAR GRAIN : ce qui est établi au point de l'adresse, puis ce qui vaut pour
//      la commune entière, chaque ligne avec sa source en marge.
//   4. Les vérifications deviennent un registre numéroté, la sortie naturelle de la lecture.
import { DPE_COLORS, DPE_LABELS } from "@/components/report/logement/kit";
import { formatKwhEpM2, formatGesM2, formatSurfaceM2, libelleObjet } from "@/lib/audit-record";
import { dateFr } from "@/lib/decision/autour-permis";
import {
  releve as s, Surtitre, Ligne, Marge, Plaque, RegleDuTemps, CoupeEchelles, Grain, Chiffre, Registre,
} from "./primitives";
import { RAPPORT_TEMOIN, DPE_TEMOIN, COMMUNE_TEMOIN, ONRN_COUT, ONRN_FREQ, lecturesTemoin } from "./fixture-logement";

const LETTRES = ["A", "B", "C", "D", "E", "F", "G"] as const;

function EchelleDpe({ lettre, titre }: { lettre: string; titre: string }) {
  return (
    <figure style={{ margin: 0, display: "grid", gap: 8 }} aria-label={`${titre} : classe ${lettre}, ${DPE_LABELS[lettre] ?? ""}`}>
      <div className={s.echelleDpe} style={{ alignItems: "end", height: 48 }}>
        {LETTRES.map((l) => (
          <div key={l} className={`${s.caseDpe} ${l === lettre ? s.caseDpeActive : ""}`} style={{ background: DPE_COLORS[l] }} aria-hidden>
            {l}
          </div>
        ))}
      </div>
      <figcaption className={`${s.mono} ${s.legendeDpe}`} style={{ color: "var(--r-meta)" }}>
        <span>plus performant</span><span className={s.legendeDpeMilieu}>{titre}</span><span>moins performant</span>
      </figcaption>
    </figure>
  );
}

export function LogementReleve() {
  const r = RAPPORT_TEMOIN;
  const dpe = DPE_TEMOIN;
  const l = lecturesTemoin();
  const g = r.georisques?.address;
  const plan = g?.regulatoryPlans?.[0];
  const zone = plan?.zones[0];
  const depart = l.audit.depart?.conso_ep_m2 ?? null;
  const max = Math.max(depart ?? 0, ...l.audit.parcours.flatMap((p) => p.etapes.map((e) => e.scenario.conso_ep_m2 ?? 0)));
  const sin = r.sinistralite!;
  // La plus basse consommation que la source donne en fin de parcours : la seule « arrivée » qu'on cite.
  const arrivee = Math.min(...l.audit.parcours.flatMap((p) => p.etapes.slice(-1).map((e) => e.scenario.conso_ep_m2 ?? Infinity)));
  const anneeDpe = dpe.date_dpe ? Number(dpe.date_dpe.slice(0, 4)) : null;
  const anneeAudit = r.audit?.date_audit ? Number(r.audit.date_audit.slice(0, 4)) : null;

  return (
    <div className={s.feuille}>
      {/* ── En-tête ────────────────────────────────────────────────────────────────────── */}
      <header style={{ padding: "40px 0 32px", display: "grid", gap: 16 }}>
        <div className={s.rangee}>
          <Surtitre numero="Échelle 3">Logement</Surtitre>
          <Grain grain="batiment">le bâtiment et sa parcelle</Grain>
        </div>
        <h1 className={s.display} style={{ fontSize: "clamp(30px, 3.6vw, 46px)" }}>{r.address?.label}</h1>
        <p className={s.chapo} style={{ maxWidth: 640 }}>
          Ce que son diagnostic établit, ce à quoi son adresse l&apos;expose, et ce qu&apos;il reste à demander avant de décider.
        </p>
      </header>

      {/* ── 1. La planche du bien ──────────────────────────────────────────────────────── */}
      <Plaque etiquette="Passeport du logement">
        <div className={s.ligne}>
          <div className={s.pile} style={{ gap: 22 }}>
            <p className={s.etiquette}>Passeport du logement · diagnostic de performance énergétique</p>
            <div className={s.rangee} style={{ gap: "10px 28px", alignItems: "flex-end" }}>
              <div className={s.pileSerree}>
                <Chiffre valeur={formatKwhEpM2(dpe.conso_ep_m2!).replace(/\s*kWh.*$/, "")} unite="kWh/m²/an" />
                <span className={s.nuance}>consommation d&apos;énergie primaire</span>
              </div>
              <div className={s.pileSerree}>
                <Chiffre valeur={formatGesM2(dpe.emission_ges_m2!).replace(/\s*kg.*$/, "")} unite="kg CO₂/m²/an" />
                <span className={s.nuance}>émissions de gaz à effet de serre</span>
              </div>
            </div>
            <EchelleDpe lettre={dpe.etiquette_dpe!} titre="classe énergie" />
            <p className={s.dense}>
              <span className={s.encre}>Classé {dpe.etiquette_dpe} · {DPE_LABELS[dpe.etiquette_dpe!]}</span> au diagnostic du {dateFr(dpe.date_dpe!)}.
            </p>
          </div>
          <Marge etiquette="Fiche du bien" elements={[
            { type: "grain", grain: "batiment", libelle: "ce logement" },
            { type: "valeur", libelle: "Surface", valeur: formatSurfaceM2(dpe.surface_m2!) },
            { type: "valeur", libelle: "Construction", valeur: String(dpe.annee_construction) },
            { type: "valeur", libelle: "Type", valeur: dpe.type_batiment ?? "—" },
            { type: "valeur", libelle: "Parcelle", valeur: `${r.parcel!.parcelCode} · ${formatSurfaceM2(r.parcel!.contenance!)}` },
            { type: "source", texte: "ADEME, base des DPE · cadastre (Etalab)" },
          ]} />
        </div>
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--r-filet)" }}>
          <p className={s.etiquette} style={{ marginBottom: 6 }}>Ce bien dans le temps</p>
          <RegleDuTemps
            etiquette="Chronologie du bien : construction, diagnostic, audit"
            jalons={[
              { annee: dpe.annee_construction!, libelle: "construction" },
              ...(anneeDpe && anneeAudit && anneeDpe === anneeAudit
                ? [{ annee: anneeDpe, libelle: "diagnostic et audit" }]
                : [
                    ...(anneeDpe ? [{ annee: anneeDpe, libelle: "diagnostic" }] : []),
                    ...(anneeAudit ? [{ annee: anneeAudit, libelle: "audit" }] : []),
                  ]),
            ]}
          />
        </div>
      </Plaque>

      {/* ── 2. L'énergie : l'audit dessiné ─────────────────────────────────────────────── */}
      <section className={s.mouvement} aria-labelledby="m-audit">
        <div className={s.enTeteMouvement}>
          <Surtitre numero="01" id="m-audit">Ce que l&apos;audit propose</Surtitre>
          <h2 className={s.titre}>De {formatKwhEpM2(depart!)} à {formatKwhEpM2(arrivee)}, en {l.audit.parcours.length} parcours de travaux</h2>
        </div>
        <Ligne marge={<Marge elements={[
          { type: "grain", grain: "batiment", libelle: libelleObjet(r.audit!.objet).replace(/\.$/, "") },
          { type: "valeur", libelle: "Audit", valeur: `n° ${r.audit!.n_audit}` },
          { type: "date", texte: `établi le ${dateFr(r.audit!.date_audit!)}` },
          { type: "source", texte: "ADEME, base des audits énergétiques" },
        ]} />}>
          <div className={s.pile} style={{ gap: 26 }}>
            <BarreAudit libelle="Point de départ, avant travaux" valeur={depart!} max={max} fort />
            {l.audit.parcours.map((p) => (
              <div key={p.cle} className={s.pile} style={{ gap: 10 }}>
                <p className={s.sousTitre} style={{ fontSize: 15.5 }}>{p.titre}</p>
                {p.etapes.map((e, i) => (
                  <BarreAudit key={`${p.cle}-${i}`} libelle={e.libelle} valeur={e.scenario.conso_ep_m2!} max={max} />
                ))}
              </div>
            ))}
            <p className={s.nuance}>
              Consommations estimées par l&apos;auditeur après chaque étape, en énergie primaire. Le coût des travaux et l&apos;étiquette visée ne figurent pas ici.
            </p>
          </div>
        </Ligne>
      </section>

      {/* ── 3. Le confort d'été ────────────────────────────────────────────────────────── */}
      <section className={s.mouvementSerre} aria-labelledby="m-ete">
        <div className={s.enTeteMouvement}>
          <Surtitre numero="02" id="m-ete">Faire face à la chaleur</Surtitre>
        </div>
        <Ligne marge={<Marge elements={[
          { type: "grain", grain: "batiment", libelle: "ce logement" },
          { type: "source", texte: `Indicateur de confort d'été du DPE, ${anneeDpe}` },
        ]} />}>
          <Registre teinte="var(--r-encre)">Confort d&apos;été au diagnostic : {l.confort.indicator}</Registre>
          <ul className={s.liste} style={{ marginTop: 4 }}>
            {[...l.confort.factors, ...l.confort.drawerFields].map((f) => (
              <li key={f.key} style={{ padding: "8px 0", display: "flex", gap: 12, alignItems: "baseline" }}>
                <span className={s.mono} style={{ width: 14, color: "var(--r-discret)" }} aria-label={f.polarity === "favorable" ? "favorable" : f.polarity === "defavorable" ? "défavorable" : "neutre"}>
                  {f.polarity === "favorable" ? "+" : f.polarity === "defavorable" ? "−" : "·"}
                </span>
                <span className={s.dense}>{f.label}</span>
              </li>
            ))}
          </ul>
        </Ligne>
      </section>

      {/* ── 4. L'exposition, par grain ─────────────────────────────────────────────────── */}
      <section className={s.mouvement} aria-labelledby="m-expo">
        <div className={s.enTeteMouvement}>
          <Surtitre numero="03" id="m-expo">Ce à quoi cette adresse est exposée</Surtitre>
          <p className={s.nuance}>Ce qui est établi au point de l&apos;adresse, puis ce qui vaut pour la commune entière.</p>
        </div>
        <ul className={s.liste}>
          <li>
            <Ligne marge={<Marge elements={[{ type: "grain", grain: "adresse", libelle: "au point de l'adresse" }, { type: "source", texte: "Géorisques, PPRN au point géocodé" }, ...(plan?.updatedAt ? [{ type: "date" as const, texte: `fiche modifiée le ${dateFr(plan.updatedAt)}` }] : [])]} />}>
              <Registre teinte="var(--r-encre)">Zonage réglementaire inondation · {zone?.zoneName} ({zone?.zoneCode}), {zone?.regime?.toLowerCase()}</Registre>
              <p className={s.dense}>{plan?.plan}. Des conditions particulières peuvent s&apos;appliquer aux projets et aux travaux. Le détail dépend du règlement officiel de cette zone.</p>
            </Ligne>
          </li>
          <li>
            <Ligne marge={<Marge elements={[{ type: "grain", grain: "adresse", libelle: "au point de l'adresse" }, { type: "source", texte: "Géorisques, aléa retrait-gonflement et zonage sismique" }]} />}>
              <div className={s.rangee} style={{ gap: "8px 40px" }}>
                <div className={s.pileSerree}><span className={s.etiquette}>Retrait-gonflement des argiles</span><span className={s.sousTitre}>{g?.rga?.label}</span></div>
                <div className={s.pileSerree}><span className={s.etiquette}>Sismicité réglementaire</span><span className={s.sousTitre}>{g?.seismic?.label}</span></div>
              </div>
            </Ligne>
          </li>
          <li>
            <Ligne marge={<Marge elements={[{ type: "grain", grain: "adresse", libelle: "au point de l'adresse" }, { type: "source", texte: "Servitudes publiées au Géoportail de l'urbanisme" }]} />}>
              <Registre teinte="var(--r-encre)">Patrimoine protégé · {r.heritage?.items[0]?.label}</Registre>
              <p className={s.dense}>Certains travaux modifiant l&apos;aspect extérieur peuvent nécessiter une autorisation et l&apos;avis de l&apos;Architecte des Bâtiments de France.</p>
            </Ligne>
          </li>
          <li>
            <Ligne marge={<Marge elements={[{ type: "grain", grain: "commune", libelle: `à l'échelle de ${COMMUNE_TEMOIN}` }, { type: "source", texte: l.inondation?.constats.find((c) => c.cle === "catnat_commune")?.source.replace(/\s·\s[^·]*$/, "") ?? "GASPAR" }]} />}>
              {l.inondation?.groupes.find((x) => x.titre === "À l'échelle de la commune")?.lignes.map((t) => (
                <p key={t} className={`${s.corps} ${s.encre}`}>{t}</p>
              ))}
              <div className={s.rangee} style={{ gap: "8px 40px", marginTop: 6 }}>
                {sin.secheresse.kind === "lecture" ? (
                  <div className={s.pileSerree}>
                    <span className={s.etiquette}>Sinistres sécheresse indemnisés</span>
                    <span className={s.sousTitre}>{ONRN_FREQ[sin.secheresse.frequence] ?? sin.secheresse.frequence} biens assurés</span>
                    <span className={s.nuance}>coût moyen {ONRN_COUT[sin.secheresse.cout] ?? sin.secheresse.cout}</span>
                  </div>
                ) : null}
              </div>
            </Ligne>
          </li>
        </ul>
        {l.inondation ? (
          <div style={{ marginTop: 28 }}>
            <Ligne>
              <details className={s.details}>
                <summary>Pourquoi ces lectures ne disent pas la même chose</summary>
                <div className={s.pile} style={{ marginTop: 10, paddingLeft: 14, borderLeft: "1px solid var(--r-filet)" }}>
                  <p className={s.dense}>{l.inondation.pourquoi}</p>
                  <p className={s.nuance}>{l.inondation.limite}</p>
                </div>
              </details>
            </Ligne>
          </div>
        ) : null}
      </section>

      {/* ── 5. Avant de décider ────────────────────────────────────────────────────────── */}
      <section className={s.mouvement} aria-labelledby="m-verif">
        <div className={s.enTeteMouvement}>
          <Surtitre numero="04" id="m-verif">À vérifier avant de décider</Surtitre>
          <p className={s.nuance}>{l.introPoints}</p>
        </div>
        <ol className={s.liste}>
          {l.points.map((p, i) => {
            const [geste, ...suite] = p.text.split(/(?<=\.)\s/);
            return (
              <li key={p.id}>
                <Ligne>
                  <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr)", gap: 4 }}>
                    <span className={s.chiffre} style={{ fontSize: 22, color: "var(--r-discret)" }}>{String(i + 1).padStart(2, "0")}</span>
                    <div className={s.pileSerree}>
                      <p className={s.sousTitre}>{geste}</p>
                      {suite.length > 0 ? <p className={s.dense}>{suite.join(" ")}</p> : null}
                    </div>
                  </div>
                </Ligne>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={s.mouvementSerre} aria-label="Changer d'échelle">
        <div className={s.enTeteMouvement}><Surtitre numero="05">Lire le lieu à une autre échelle</Surtitre></div>
        <CoupeEchelles courante="logement" liens={{ territoire: "/dev/fut87/decision", autour: "#", logement: "/dev/fut87/logement" }} />
      </section>
      <div style={{ height: 64 }} />
    </div>
  );
}

function BarreAudit({ libelle, valeur, max, fort = false }: { libelle: string; valeur: number; max: number; fort?: boolean }) {
  // La barre occupe sa part de la PISTE, jamais de la ligne entière : la longueur reste
  // proportionnelle quelle que soit la largeur de l'écran.
  const pct = Math.max(0.6, (valeur / max) * 100);
  return (
    <div className={s.etapeAudit}>
      <span className={`${s.dense} ${s.etapeAuditLibelle}`} style={{ color: fort ? "var(--r-encre)" : undefined }}>{libelle}</span>
      <div className={s.etapeAuditPiste} aria-hidden>
        <div style={{ position: "absolute", inset: "6px 0 auto 0", height: 1, background: "var(--r-filet)" }} />
        <div style={{ position: "absolute", left: 0, top: fort ? 0 : 2, height: fort ? 14 : 10, width: `${pct}%`, background: fort ? "var(--r-encre)" : "var(--r-texte)", borderRadius: 1 }} />
      </div>
      <span className={`${s.mono} ${s.etapeAuditValeur}`} style={{ fontSize: 13, color: "var(--r-encre)", whiteSpace: "nowrap" }}>{formatKwhEpM2(valeur)}</span>
    </div>
  );
}
