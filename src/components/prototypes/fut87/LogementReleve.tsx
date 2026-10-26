// FUT-87 · PROTOTYPE 3 · LE MODULE LOGEMENT DANS LA DIRECTION « LE RELEVÉ ». DEV UNIQUEMENT.
//
// Mêmes données que la page « avant » (fixtures anonymisées, lectures dérivées par les fonctions de
// production). La composition change :
//
//   1. Le passeport devient une PLANCHE : l'échelle DPE complète où la lettre se lit par sa position,
//      la consommation en grand, la fiche du bien en marge, et la règle du temps du bâtiment.
//   2. L'audit énergétique se DESSINE, sur une bande : une barre par étape, longueur proportionnelle à
//      la consommation de la source, du point de départ à l'étape finale.
//   3. L'exposition se lit PAR GRAIN : ce qui est établi au point de l'adresse, puis ce qui vaut pour
//      la commune entière, chaque ligne avec sa source en marge.
//   4. Les vérifications deviennent un registre numéroté, la sortie naturelle de la lecture.
//
// LES ABSENCES SE DISENT (revue V2, DESIGN.md § 3.1). Sans diagnostic, sans audit, sans réponse d'une
// source : la planche garde sa place et dit ce qui manque, avec la formulation de production quand elle
// existe. Une panne n'est jamais présentée comme une absence de risque.
import { DPE_COLORS, DPE_LABELS } from "@/components/report/logement/kit";
import { formatKwhEpM2, formatGesM2, formatSurfaceM2, libelleObjet } from "@/lib/audit-record";
import { dateFr } from "@/lib/decision/autour-permis";
import {
  releve as s, Surtitre, Ligne, Marge, Plaque, RegleDuTemps, CoupeEchelles, Grain, Chiffre, Registre,
  type ElementDeMarge, type JalonTemps,
} from "@/components/releve/primitives";
import { ONRN_COUT, ONRN_FREQ, lecturesDe, type CasDeLogement } from "./fixture-logement";

const LETTRES = ["A", "B", "C", "D", "E", "F", "G"] as const;

function EchelleDpe({ lettre, titre }: { lettre: string | null; titre: string }) {
  return (
    <figure style={{ margin: 0, display: "grid", gap: 8 }} aria-label={lettre ? `${titre} : classe ${lettre}, ${DPE_LABELS[lettre] ?? ""}` : `${titre} : aucune classe attribuée`}>
      <div className={s.echelleDpe} style={{ alignItems: "end", height: 48 }}>
        {LETTRES.map((l) => (
          <div key={l} className={`${s.caseDpe} ${l === lettre ? s.caseDpeActive : ""}`}
            style={{ background: lettre ? DPE_COLORS[l] : "var(--r-filet-fort)", color: lettre ? undefined : "var(--r-meta)" }} aria-hidden>
            {l}
          </div>
        ))}
      </div>
      <figcaption className={`${s.mono} ${s.legendeDpe}`} style={{ color: "var(--r-meta)" }}>
        <span>plus performant</span><span className={s.legendeDpeMilieu}>{lettre ? titre : "aucune classe attribuée"}</span><span>moins performant</span>
      </figcaption>
    </figure>
  );
}

const sansUnite = (t: string) => t.replace(/\s*(kWh|kg).*$/, "");

export function LogementReleve({ cas }: { cas: CasDeLogement }) {
  const r = cas.rapport;
  const dpe = cas.dpe;
  const l = lecturesDe(cas);
  const g = r.georisques?.parcel ?? r.georisques?.address;
  const plan = g?.regulatoryPlans?.[0];
  const zone = plan?.zones[0];
  const depart = l.audit?.depart?.conso_ep_m2 ?? null;
  const max = Math.max(depart ?? 0, ...(l.audit?.parcours ?? []).flatMap((p) => p.etapes.map((e) => e.scenario.conso_ep_m2 ?? 0)));
  // La plus basse consommation que la source donne en fin de parcours : la seule « arrivée » qu'on cite.
  const finales = (l.audit?.parcours ?? []).flatMap((p) => p.etapes.slice(-1).map((e) => e.scenario.conso_ep_m2)).filter((v): v is number => v != null);
  const arrivee = finales.length > 0 ? Math.min(...finales) : null;
  const sin = r.sinistralite;
  const anneeDpe = dpe?.date_dpe ? Number(dpe.date_dpe.slice(0, 4)) : null;
  const anneeAudit = r.audit?.date_audit ? Number(r.audit.date_audit.slice(0, 4)) : null;
  const jalons: JalonTemps[] = [
    ...(dpe?.annee_construction ? [{ annee: dpe.annee_construction, libelle: "construction" }] : []),
    ...(anneeDpe && anneeAudit && anneeDpe === anneeAudit
      ? [{ annee: anneeDpe, libelle: "diagnostic et audit" }]
      : [
          ...(anneeDpe ? [{ annee: anneeDpe, libelle: "diagnostic" }] : []),
          ...(anneeAudit ? [{ annee: anneeAudit, libelle: "audit" }] : []),
        ]),
  ];
  const fiche: ElementDeMarge[] = [
    { type: "grain", grain: "batiment", libelle: "ce logement" },
    { type: "valeur", libelle: "Surface", valeur: dpe?.surface_m2 ? formatSurfaceM2(dpe.surface_m2) : "—" },
    { type: "valeur", libelle: "Construction", valeur: dpe?.annee_construction ? String(dpe.annee_construction) : "—" },
    { type: "valeur", libelle: "Type", valeur: dpe?.type_batiment ?? "—" },
    ...(r.parcel ? [{ type: "valeur" as const, libelle: "Parcelle", valeur: r.parcel.contenance ? `${r.parcel.parcelCode} · ${formatSurfaceM2(r.parcel.contenance)}` : r.parcel.parcelCode }] : []),
    { type: "source", texte: dpe ? "ADEME, base des DPE · cadastre (Etalab)" : "Cadastre (Etalab)" },
  ];
  const confortNiveau = l.confort.level;

  return (
    <div className={s.feuille}>
      {/* ── En-tête ────────────────────────────────────────────────────────────────────── */}
      <header style={{ padding: "36px 0 28px", display: "grid", gap: 14 }}>
        <div className={s.rangee}>
          <Surtitre numero="Échelle 3">Logement</Surtitre>
          <Grain grain="batiment">le bâtiment et sa parcelle</Grain>
        </div>
        <h1 className={`${s.display} ${s.titreAdresse}`}>{r.address?.label}</h1>
        <p className={s.chapo} style={{ maxWidth: 640 }}>
          Ce que son diagnostic établit, ce à quoi son adresse l&apos;expose, et ce qu&apos;il reste à demander avant de décider.
        </p>
      </header>

      {/* ── 1. La planche du bien ──────────────────────────────────────────────────────── */}
      <Plaque etiquette="Passeport du logement">
        <div className={s.ligne}>
          <div className={s.pile} style={{ gap: 22 }}>
            <p className={s.etiquette}>Passeport du logement · diagnostic de performance énergétique</p>
            {dpe && dpe.conso_ep_m2 != null ? (
              <div className={s.rangee} style={{ gap: "10px 28px", alignItems: "flex-end" }}>
                <div className={s.pileSerree}>
                  <Chiffre valeur={sansUnite(formatKwhEpM2(dpe.conso_ep_m2))} unite="kWh/m²/an" />
                  <span className={s.nuance}>consommation d&apos;énergie primaire</span>
                </div>
                {dpe.emission_ges_m2 != null ? (
                  <div className={s.pileSerree}>
                    <Chiffre valeur={sansUnite(formatGesM2(dpe.emission_ges_m2))} unite="kg CO₂/m²/an" />
                    <span className={s.nuance}>émissions de gaz à effet de serre</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className={s.pileSerree}>
                <Chiffre valeur="—" />
                {/* Formulation de production (`EnergieSection`), y compris la distinction FUT-65. */}
                <p className={s.dense}>
                  {cas.dpeNonVerifiable
                    ? "La base des diagnostics de performance énergétique (ADEME) n'a pas répondu lors de cette collecte : les diagnostics de cette adresse n'ont pas pu être vérifiés."
                    : "Aucun diagnostic de performance énergétique n'est rattaché à cette adresse dans la base ouverte. Cela ne veut pas dire qu'aucun n'existe : il peut ne pas y avoir été versé, ou y être enregistré à une entrée voisine."}
                </p>
              </div>
            )}
            <EchelleDpe lettre={dpe?.etiquette_dpe ?? null} titre="classe énergie" />
            {dpe?.etiquette_dpe ? (
              <p className={s.dense}>
                <span className={s.encre}>Classé {dpe.etiquette_dpe} · {DPE_LABELS[dpe.etiquette_dpe]}</span>
                {dpe.date_dpe ? <> au diagnostic du {dateFr(dpe.date_dpe)}.</> : "."}
                {dpe.methode_dpe?.toLowerCase().includes("immeuble") ? <> Diagnostic établi à partir des caractéristiques de l&apos;immeuble.</> : null}
              </p>
            ) : null}
          </div>
          <Marge etiquette="Fiche du bien" elements={fiche} />
        </div>
        {jalons.length > 0 ? (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--r-filet)" }}>
            <p className={s.etiquette} style={{ marginBottom: 6 }}>Ce bien dans le temps</p>
            <RegleDuTemps etiquette="Chronologie du bien : construction, diagnostic, audit" jalons={jalons} />
          </div>
        ) : null}
      </Plaque>

      {/* ── 2. L'énergie : l'audit dessiné, sur une bande ──────────────────────────────── */}
      {l.audit && r.audit ? (
        <section className={`${s.mouvement} ${s.bande}`} aria-labelledby="m-audit">
          <div className={s.enTeteMouvement}>
            <Surtitre numero="01" id="m-audit">Ce que l&apos;audit propose</Surtitre>
            {depart != null && arrivee != null ? (
              <h2 className={s.titre}>
                De {formatKwhEpM2(depart)} à {formatKwhEpM2(arrivee)}, en {l.audit.parcours.length} parcours de travaux
              </h2>
            ) : null}
          </div>
          <Ligne marge={<Marge elements={[
            { type: "grain", grain: r.audit.objet?.grain === "immeuble" ? "adresse" : "batiment", libelle: libelleObjet(r.audit.objet).replace(/\.$/, "") },
            { type: "valeur", libelle: "Audit", valeur: `n° ${r.audit.n_audit}` },
            ...(r.audit.date_audit ? [{ type: "date" as const, texte: `établi le ${dateFr(r.audit.date_audit)}` }] : []),
            { type: "source", texte: "ADEME, base des audits énergétiques" },
          ]} />}>
            <div className={s.pile} style={{ gap: 26 }}>
              {depart != null ? <BarreAudit libelle="Point de départ, avant travaux" valeur={depart} max={max} fort /> : null}
              {l.audit.parcours.map((p) => (
                <div key={p.cle} className={s.pile} style={{ gap: 10 }}>
                  <p className={s.sousTitre} style={{ fontSize: 15.5 }}>{p.titre}</p>
                  {p.etapes.map((e, i) => (
                    e.scenario.conso_ep_m2 != null
                      ? <BarreAudit key={`${p.cle}-${i}`} libelle={e.libelle} valeur={e.scenario.conso_ep_m2} max={max} />
                      : <p key={`${p.cle}-${i}`} className={s.nuance}>{e.libelle} · consommation non renseignée par la source</p>
                  ))}
                </div>
              ))}
              <p className={s.nuance}>
                Consommations estimées par l&apos;auditeur après chaque étape, en énergie primaire. Le coût des travaux et l&apos;étiquette visée ne figurent pas ici.
              </p>
            </div>
          </Ligne>
        </section>
      ) : r.auditStatus === "unavailable" ? (
        <section className={s.mouvementSerre}>
          <div className={s.enTeteMouvement}><Surtitre numero="01">Ce que l&apos;audit propose</Surtitre></div>
          {/* Formulation de production (`EnergieSection`, FUT-65). */}
          <p className={s.dense}>Audit énergétique non vérifiable pour le moment : la base ADEME n&apos;a pas répondu lors de cette collecte.</p>
        </section>
      ) : null}

      {/* ── 3. Le confort d'été ────────────────────────────────────────────────────────── */}
      <section className={s.mouvementSerre} aria-labelledby="m-ete">
        <div className={s.enTeteMouvement}>
          <Surtitre numero="02" id="m-ete">Faire face à la chaleur</Surtitre>
        </div>
        <Ligne marge={<Marge elements={[
          { type: "grain", grain: confortNiveau === "B1_EXACT_BUILDING" ? "adresse" : "batiment", libelle: confortNiveau === "B1_EXACT_BUILDING" ? "l'immeuble" : "ce logement" },
          ...(anneeDpe ? [{ type: "source" as const, texte: `Diagnostic de performance énergétique, ${anneeDpe}` }] : []),
        ]} />}>
          {/* Les trois niveaux et leurs phrases sont ceux de `ThermalComfortSection`. */}
          {confortNiveau === "A_EXACT_UNIT" ? (
            <Registre teinte="var(--r-encre)">
              {l.confort.indicator === "insuffisant"
                ? "D'après le diagnostic, ce logement garde mal la fraîcheur quand il fait chaud."
                : l.confort.indicator === "bon"
                  ? "D'après le diagnostic, ce logement garde plutôt bien la fraîcheur en été."
                  : "D'après le diagnostic, ce logement garde moyennement la fraîcheur en été."}
            </Registre>
          ) : confortNiveau === "B1_EXACT_BUILDING" ? (
            <>
              <Registre teinte="var(--r-encre)">Ce que le diagnostic décrit du bâtiment</Registre>
              <p className={s.nuance}>
                {l.confort.methodWording === "immeuble"
                  ? "Ce diagnostic reprend principalement des caractéristiques de l'immeuble. Elles ne permettent pas de qualifier précisément le confort d'été de ce logement."
                  : "Ce diagnostic ne renseigne pas le confort d'été de ce logement."}
              </p>
            </>
          ) : (
            <>
              <Registre teinte="var(--reg-non-su)">Les données publiques retrouvées ne permettent pas de qualifier le confort d&apos;été de ce logement.</Registre>
              <p className={s.nuance}>La position sous toiture, les protections solaires et la capacité du logement à se rafraîchir la nuit permettraient d&apos;affiner cette lecture.</p>
            </>
          )}
          {[...l.confort.factors, ...l.confort.drawerFields].length > 0 ? (
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
          ) : null}
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
            <Ligne marge={<Marge elements={[
              { type: "grain", grain: "adresse", libelle: "au point de l'adresse" },
              { type: "source", texte: "Géorisques, PPRN au point géocodé" },
              ...(plan?.updatedAt ? [{ type: "date" as const, texte: `fiche modifiée le ${dateFr(plan.updatedAt)}` }] : []),
            ]} />}>
              {/* Les trois états de `RegulatoryStatusBlock`, avec ses phrases. */}
              {!g ? (
                <>
                  <Registre teinte="var(--reg-non-su)">Risques réglementés non déterminés</Registre>
                  <p className={s.dense}>Les données Géorisques interrogées n&apos;ont pas permis de dire si un plan de prévention des risques s&apos;applique à cette adresse.</p>
                </>
              ) : plan ? (
                <>
                  <Registre teinte="var(--r-encre)">
                    Zonage réglementaire inondation{zone ? ` · ${zone.zoneName ?? "zone"}${zone.zoneCode ? ` (${zone.zoneCode})` : ""}${zone.regime ? `, ${zone.regime.toLowerCase()}` : ""}` : ""}
                  </Registre>
                  <p className={s.dense}>{plan.plan}. Des conditions particulières peuvent s&apos;appliquer aux projets et aux travaux. Le détail dépend du règlement officiel de cette zone.</p>
                </>
              ) : (
                <>
                  <Registre teinte="var(--r-encre)">Ni plan de prévention des risques ni périmètre patrimonial à cette adresse</Registre>
                  <p className={s.dense}>La commune peut avoir un plan de prévention des risques sans que ce logement tombe dans l&apos;une de ses zones à règles.</p>
                </>
              )}
            </Ligne>
          </li>
          <li>
            <Ligne marge={<Marge elements={[{ type: "grain", grain: "adresse", libelle: "au point de l'adresse" }, { type: "source", texte: "Géorisques, aléa retrait-gonflement et zonage sismique" }]} />}>
              <div className={s.rangee} style={{ gap: "8px 40px" }}>
                <div className={s.pileSerree}>
                  <span className={s.etiquette}>Retrait-gonflement des argiles</span>
                  <span className={s.sousTitre} style={{ color: g?.rga?.label ? undefined : "var(--fg-absent)" }}>{g?.rga?.label ?? "—"}</span>
                  {!g?.rga?.label ? <span className={s.nuance}>non lu : la source n&apos;a pas répondu</span> : null}
                </div>
                <div className={s.pileSerree}>
                  <span className={s.etiquette}>Sismicité réglementaire</span>
                  <span className={s.sousTitre} style={{ color: g?.seismic?.label ? undefined : "var(--fg-absent)" }}>{g?.seismic?.label ?? "—"}</span>
                  {!g?.seismic?.label ? <span className={s.nuance}>non lue : la source n&apos;a pas répondu</span> : null}
                </div>
              </div>
            </Ligne>
          </li>
          {r.heritage && (r.heritage.items.length > 0 || r.heritage.sourceStatus === "unavailable") ? (
            <li>
              <Ligne marge={<Marge elements={[{ type: "grain", grain: "adresse", libelle: "au point de l'adresse" }, { type: "source", texte: "Servitudes publiées au Géoportail de l'urbanisme" }]} />}>
                {r.heritage.sourceStatus === "unavailable" ? (
                  <>
                    {/* Formulation du prototype : la production ne dit rien de cette panne, alors que le
                        type exige de la distinguer d'une absence de servitude (`gpu-servitudes.ts`). */}
                    <Registre teinte="var(--reg-non-su)">Patrimoine protégé · non vérifié</Registre>
                    <p className={s.dense}>Le service des servitudes n&apos;a pas répondu : l&apos;absence de périmètre protégé n&apos;est pas établie.</p>
                  </>
                ) : (
                  <>
                    <Registre teinte="var(--r-encre)">Patrimoine protégé · {r.heritage.items[0]?.label}</Registre>
                    <p className={s.dense}>Certains travaux modifiant l&apos;aspect extérieur peuvent nécessiter une autorisation et l&apos;avis de l&apos;Architecte des Bâtiments de France.</p>
                  </>
                )}
              </Ligne>
            </li>
          ) : null}
          {l.inondation || (sin && (sin.secheresse.kind !== "indispo" || sin.inondation.kind !== "indispo")) ? (
            <li>
              <Ligne marge={<Marge elements={[
                { type: "grain", grain: "commune", libelle: `à l'échelle de ${cas.commune}` },
                ...(l.inondation ? [{ type: "source" as const, texte: "Reconnaissances CatNat inondation (GASPAR)" }] : []),
                ...(sin && sin.secheresse.kind !== "indispo" ? [{ type: "source" as const, texte: "ONRN / CCR via Géorisques, 1995-2021" }] : []),
              ]} />}>
                {l.inondation?.groupes.find((x) => x.titre === "À l'échelle de la commune")?.lignes.map((t) => (
                  <p key={t} className={`${s.corps} ${s.encre}`}>{t}</p>
                ))}
                {sin?.secheresse.kind === "lecture" ? (
                  <div className={s.pileSerree} style={{ marginTop: 6 }}>
                    <span className={s.etiquette}>Sinistres sécheresse indemnisés</span>
                    <span className={s.sousTitre}>{ONRN_FREQ[sin.secheresse.frequence] ?? sin.secheresse.frequence} biens assurés</span>
                    <span className={s.nuance}>coût moyen {ONRN_COUT[sin.secheresse.cout] ?? sin.secheresse.cout}</span>
                  </div>
                ) : null}
              </Ligne>
            </li>
          ) : (
            <li>
              <Ligne marge={<Marge elements={[{ type: "grain", grain: "commune", libelle: `à l'échelle de ${cas.commune}` }]} />}>
                {/* Formulation du prototype : la production masque le bloc quand les deux périls sont
                    indisponibles. Le relevé dit qu'il n'a pas pu lire, sans conclure. */}
                <Registre teinte="var(--reg-non-su)">Mémoire des sinistres non lue</Registre>
                <p className={s.dense}>Les reconnaissances et les sinistres indemnisés de la commune n&apos;ont pas pu être lus lors de cette collecte.</p>
              </Ligne>
            </li>
          )}
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
        {l.points.length === 0 ? (
          <p className={s.dense}>Cette lecture ne fait remonter aucun point particulier à vérifier pour ce logement.</p>
        ) : (
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
        )}
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
        <div style={{ position: "absolute", inset: "7px 0 auto 0", height: 1, background: "var(--r-filet)" }} />
        <div style={{ position: "absolute", left: 0, top: fort ? 0 : 2, height: fort ? 16 : 12, width: `${pct}%`, background: fort ? "var(--r-encre)" : "var(--r-texte)", borderRadius: 1 }} />
      </div>
      <span className={`${s.mono} ${s.etapeAuditValeur}`} style={{ fontSize: 13, color: "var(--r-encre)", whiteSpace: "nowrap" }}>{formatKwhEpM2(valeur)}</span>
    </div>
  );
}
