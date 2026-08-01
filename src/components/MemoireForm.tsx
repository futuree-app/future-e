"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProfileValue = string | number | boolean | string[] | null | undefined;
type Profile = Record<string, unknown>;

interface MemoireFormProps {
  profile: Profile;
}

const CHAUFFAGE_OPTIONS = [
  { value: "gaz", label: "Gaz" },
  { value: "electrique", label: "Électrique" },
  { value: "pompe_chaleur", label: "Pompe à chaleur" },
  { value: "fioul", label: "Fioul" },
  { value: "bois", label: "Bois" },
  { value: "autre", label: "Autre" },
];

const ISOLATION_OPTIONS = [
  { value: "bonne", label: "Bonne" },
  { value: "moyenne", label: "Moyenne" },
  { value: "mauvaise", label: "Mauvaise" },
  { value: "inconnue", label: "Inconnue" },
];

const VEHICULE_OPTIONS = [
  { value: "thermique", label: "Thermique" },
  { value: "hybride", label: "Hybride" },
  { value: "electrique", label: "Électrique" },
  { value: "aucun", label: "Aucun" },
];

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asBool(v: unknown): boolean | null {
  if (v === true || v === false) return v;
  return null;
}

function asArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function MemoireForm({ profile }: MemoireFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savingField, setSavingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const saveField = async (field: string, value: ProfileValue | Record<string, string>) => {
    setSavingField(field);
    setError(null);
    try {
      const communeValue = value as unknown as Record<string, string>;
      const body = field === "commune"
        ? { field: "commune", insee_code: communeValue.insee_code, nom: communeValue.nom }
        : { field, value };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Erreur de sauvegarde.");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      console.error("[MemoireForm] saveField:", err);
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde.");
    } finally {
      setSavingField(null);
    }
  };

  const clearAll = async () => {
    setSavingField("__all__");
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "ask_collected" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Erreur de suppression.");
      }
      setConfirmClearAll(false);
      startTransition(() => router.refresh());
    } catch (err) {
      console.error("[MemoireForm] clearAll:", err);
      setError(err instanceof Error ? err.message : "Erreur de suppression.");
    } finally {
      setSavingField(null);
    }
  };

  const isBusy = isPending || savingField !== null;

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-[13px] text-red-200">
          {error}
        </div>
      )}

      <CommuneBlock
        inseeCode={profile.home_insee_code as string | null}
        communeName={profile.home_commune as string | null}
        onSave={saveField}
        saving={savingField === "commune"}
        disabled={isBusy}
      />

      <TextField
        label="Tranche d'âge"
        field="age_band"
        value={asString(profile.age_band)}
        placeholder="Ex : 30-40"
        onSave={saveField}
        saving={savingField === "age_band"}
        disabled={isBusy}
      />

      <SelectField
        label="Type de logement"
        field="housing_type"
        value={asString(profile.housing_type)}
        options={[
          { value: "maison", label: "Maison" },
          { value: "appartement", label: "Appartement" },
          { value: "autre", label: "Autre" },
        ]}
        onSave={saveField}
        saving={savingField === "housing_type"}
        disabled={isBusy}
      />

      <TextField
        label="Statut logement"
        field="housing_status"
        value={asString(profile.housing_status)}
        placeholder="Ex : propriétaire, locataire"
        onSave={saveField}
        saving={savingField === "housing_status"}
        disabled={isBusy}
      />

      <SelectField
        label="Chauffage"
        field="logement_chauffage"
        value={asString(profile.logement_chauffage)}
        options={CHAUFFAGE_OPTIONS}
        onSave={saveField}
        saving={savingField === "logement_chauffage"}
        disabled={isBusy}
      />

      <SelectField
        label="Isolation"
        field="logement_isolation"
        value={asString(profile.logement_isolation)}
        options={ISOLATION_OPTIONS}
        onSave={saveField}
        saving={savingField === "logement_isolation"}
        disabled={isBusy}
      />

      <BooleanField
        label="Présence d'enfants"
        field="presence_enfants"
        value={asBool(profile.presence_enfants)}
        onSave={saveField}
        saving={savingField === "presence_enfants"}
        disabled={isBusy}
      />

      <TextField
        label="Âge des enfants"
        field="age_enfants"
        value={asString(profile.age_enfants)}
        placeholder="Ex : 3 ans et 7 ans"
        onSave={saveField}
        saving={savingField === "age_enfants"}
        disabled={isBusy}
      />

      <BooleanField
        label="Travail extérieur"
        field="travail_exterieur"
        value={asBool(profile.travail_exterieur)}
        onSave={saveField}
        saving={savingField === "travail_exterieur"}
        disabled={isBusy}
      />

      <SelectField
        label="Véhicule"
        field="vehicule_type"
        value={asString(profile.vehicule_type)}
        options={VEHICULE_OPTIONS}
        onSave={saveField}
        saving={savingField === "vehicule_type"}
        disabled={isBusy}
      />

      <TextField
        label="Catégorie professionnelle"
        field="job_category"
        value={asString(profile.job_category)}
        placeholder="Ex : agriculture, santé, BTP"
        onSave={saveField}
        saving={savingField === "job_category"}
        disabled={isBusy}
      />

      <TextField
        label="Profil mobilité"
        field="mobility_profile"
        value={asString(profile.mobility_profile)}
        placeholder="Ex : voiture quotidienne, sans voiture, vélo"
        onSave={saveField}
        saving={savingField === "mobility_profile"}
        disabled={isBusy}
      />

      <ArrayField
        label="Sensibilités environnementales"
        hint="Ex : asthme, allergies, sensibilité chaleur"
        field="health_flags"
        values={asArray(profile.health_flags)}
        onSave={saveField}
        saving={savingField === "health_flags"}
        disabled={isBusy}
      />

      <ArrayField
        label="Projets de vie mentionnés"
        hint="Ex : achat immobilier, déménagement, enfant"
        field="life_projects"
        values={asArray(profile.life_projects)}
        onSave={saveField}
        saving={savingField === "life_projects"}
        disabled={isBusy}
      />

      <div className="mt-10 glass rounded-2xl p-7 border border-red-400/15">
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2">
          Effacement global
        </p>
        <h3
          className="text-[20px] text-label mb-2"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Tout supprimer (sauf commune)
        </h3>
        <p className="text-[13px] text-muted leading-[1.6] mb-4">
          Remet à zéro toutes les informations affichées sur cette page. Votre
          commune de résidence et votre compte restent intacts. Cette action est immédiate.
        </p>
        {!confirmClearAll ? (
          <button
            type="button"
            onClick={() => setConfirmClearAll(true)}
            disabled={isBusy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] border border-red-400/30 text-red-200 text-[13px] disabled:opacity-40"
          >
            Tout effacer
          </button>
        ) : (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={clearAll}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-400/20 border border-red-400/40 text-red-100 text-[13px] disabled:opacity-40"
            >
              {savingField === "__all__" ? "Suppression…" : "Confirmer la suppression"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmClearAll(false)}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border-1)] text-muted text-[13px] disabled:opacity-40"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ───── Sous-composants ─────────────────────────────────────────────────────

type SaveFn = (field: string, value: ProfileValue | Record<string, string>) => void | Promise<void>;

type CommuneResult = { code: string; nom: string; codeDepartement: string };

// LA COMMUNE S'ÉDITE, POUR TOUT LE MONDE (30/07/2026). Le verrou `canEdit` était posé par les
// plans `suivi` et `foyer`, retirés, et il ne verrouillait rien : /api/profile écrit `field=commune`
// sans consulter le plan. Son texte de repli invitait d'ailleurs à « passer au Fil », un produit
// écarté. Et le geste n'a plus d'enjeu d'accès : la résidence n'ouvre aucun rapport par elle-même,
// le droit vient des grants et des dossiers.
function CommuneBlock({
  inseeCode,
  communeName,
  onSave,
  saving,
  disabled,
}: {
  inseeCode: string | null;
  communeName: string | null;
  onSave: SaveFn;
  saving: boolean;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommuneResult[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setFetching(true);
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codeDepartement&boost=population&limit=6`,
      );
      const data: CommuneResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setFetching(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 220);
  }

  async function handleSelect(commune: CommuneResult) {
    setOpen(false);
    setEditing(false);
    setQuery("");
    await onSave("commune", { insee_code: commune.code, nom: commune.nom });
  }

  return (
    <div className="glass rounded-2xl p-7 mb-3 border border-[var(--border-1)]">
      <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
        <div>
          <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-1">
            Commune de résidence
          </p>
          {!editing ? (
            <p className="text-[20px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {communeName ?? "Non renseignée"}
              {inseeCode && (
                <span className="text-ghost text-[14px] ml-2 font-mono">{inseeCode}</span>
              )}
            </p>
          ) : (
            <div className="relative mt-1">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Rechercher une commune…"
                className="bg-transparent border border-[var(--border-hi)] rounded-lg px-3 py-2 text-[15px] text-label placeholder:text-ghost outline-none w-64"
                onBlur={() => setTimeout(() => { setOpen(false); setEditing(false); setQuery(""); }, 150)}
              />
              {fetching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ghost">…</span>
              )}
              {open && results.length > 0 && (
                <ul className="absolute left-0 top-full mt-1 z-10 w-72 glass border border-[var(--border-2)] rounded-xl overflow-hidden shadow-xl">
                  {results.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onMouseDown={() => handleSelect(c)}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-label hover:bg-[var(--bg-elev-2)] flex justify-between gap-2"
                      >
                        <span>{c.nom}</span>
                        <span className="text-ghost font-mono text-[11px]">{c.code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-[11px] text-ghost">Enregistrement…</span>}
          {!editing && !saving && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={disabled}
              className="font-mono text-[10px] tracking-[0.08em] uppercase text-ghost hover:text-muted border border-[var(--border-1)] rounded-full px-3 py-1 disabled:opacity-40"
            >
              Modifier
            </button>
          )}
        </div>
      </div>
      <p className="text-[13px] text-muted leading-[1.6]">
        Modifiez votre commune si vous avez déménagé. C&apos;est celle que votre rapport lit par
        défaut. Les communes et les biens que vous avez débloqués restent les vôtres.
      </p>
    </div>
  );
}

function FieldShell({
  label,
  saving,
  onClear,
  canClear,
  disabled,
  children,
}: {
  label: string;
  saving: boolean;
  onClear: () => void;
  canClear: boolean;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl p-5 border border-[var(--border-1)]">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost">
          {label}
        </p>
        <div className="flex items-center gap-3">
          {saving && <span className="text-[11px] text-ghost">Enregistrement…</span>}
          {canClear && !saving && (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="text-[11px] font-mono tracking-[0.06em] uppercase text-ghost hover:text-muted disabled:opacity-40"
            >
              Vider
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  field,
  value,
  placeholder,
  onSave,
  saving,
  disabled,
}: {
  label: string;
  field: string;
  value: string;
  placeholder?: string;
  onSave: SaveFn;
  saving: boolean;
  disabled: boolean;
}) {
  const [local, setLocal] = useState(value);

  const handleBlur = () => {
    if (local.trim() === value.trim()) return;
    void onSave(field, local.trim() === "" ? null : local.trim());
  };

  return (
    <FieldShell
      label={label}
      saving={saving}
      onClear={() => {
        setLocal("");
        void onSave(field, null);
      }}
      canClear={value.length > 0}
      disabled={disabled}
    >
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-transparent border-none outline-none text-[15px] text-label placeholder:text-ghost"
      />
    </FieldShell>
  );
}

function SelectField({
  label,
  field,
  value,
  options,
  onSave,
  saving,
  disabled,
}: {
  label: string;
  field: string;
  value: string;
  options: { value: string; label: string }[];
  onSave: SaveFn;
  saving: boolean;
  disabled: boolean;
}) {
  // Si la valeur en base n'est pas dans la liste, on l'affiche quand même en option grisée.
  const hasUnknown = value.length > 0 && !options.some((o) => o.value === value);
  return (
    <FieldShell
      label={label}
      saving={saving}
      onClear={() => void onSave(field, null)}
      canClear={value.length > 0}
      disabled={disabled}
    >
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => void onSave(field, opt.value)}
              className={`px-4 py-2 rounded-full text-[13px] border transition-colors ${
                selected
                  ? "bg-accent/[0.18] border-accent/50 text-label"
                  : "bg-[var(--bg-elev)] border-[var(--border-1)] text-muted hover:text-label"
              } disabled:opacity-40`}
            >
              {opt.label}
            </button>
          );
        })}
        {hasUnknown && (
          <span className="px-4 py-2 rounded-full text-[13px] border border-amethyst/40 bg-amethyst/[0.10] text-muted">
            {value}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

function BooleanField({
  label,
  field,
  value,
  onSave,
  saving,
  disabled,
}: {
  label: string;
  field: string;
  value: boolean | null;
  onSave: SaveFn;
  saving: boolean;
  disabled: boolean;
}) {
  return (
    <FieldShell
      label={label}
      saving={saving}
      onClear={() => void onSave(field, null)}
      canClear={value !== null}
      disabled={disabled}
    >
      <div className="flex gap-2">
        {(
          [
            { v: true, label: "Oui" },
            { v: false, label: "Non" },
          ] as const
        ).map((opt) => {
          const selected = value === opt.v;
          return (
            <button
              key={opt.label}
              type="button"
              disabled={disabled}
              onClick={() => void onSave(field, opt.v)}
              className={`px-4 py-2 rounded-full text-[13px] border ${
                selected
                  ? "bg-accent/[0.18] border-accent/50 text-label"
                  : "bg-[var(--bg-elev)] border-[var(--border-1)] text-muted"
              } disabled:opacity-40`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

function ArrayField({
  label,
  hint,
  field,
  values,
  onSave,
  saving,
  disabled,
}: {
  label: string;
  hint?: string;
  field: string;
  values: string[];
  onSave: SaveFn;
  saving: boolean;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft("");
      return;
    }
    setDraft("");
    void onSave(field, [...values, v]);
  };

  const removeItem = (v: string) => {
    void onSave(
      field,
      values.filter((x) => x !== v),
    );
  };

  return (
    <FieldShell
      label={label}
      saving={saving}
      onClear={() => void onSave(field, [])}
      canClear={values.length > 0}
      disabled={disabled}
    >
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-accent/[0.12] border border-accent/30 text-label"
            >
              {v}
              <button
                type="button"
                onClick={() => removeItem(v)}
                disabled={disabled}
                aria-label={`Supprimer ${v}`}
                className="text-ghost hover:text-label disabled:opacity-40"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-ghost mb-3">Aucune information enregistrée.</p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={hint}
          disabled={disabled}
          className="flex-1 bg-transparent border border-[var(--border-1)] rounded-lg px-3 py-2 text-[13px] text-label placeholder:text-ghost outline-none focus:border-[var(--border-hi)]"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={disabled || draft.trim().length === 0}
          className="px-4 py-2 rounded-lg bg-[var(--bg-elev-2)] border border-[var(--border-1)] text-[12px] text-muted disabled:opacity-40"
        >
          Ajouter
        </button>
      </div>
    </FieldShell>
  );
}
