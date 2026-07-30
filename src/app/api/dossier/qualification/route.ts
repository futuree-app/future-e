import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSelectedBanAddress } from "@/lib/selected-ban-address";
import {
  isSellableAnchor,
  admissibleCandidates,
  type NearbyHouseNumber,
} from "@/lib/dossier-qualification";
import { reverseHouseNumbers } from "@/lib/ban";
import { probeDpeByBanId } from "@/lib/dpe";
import { probeCadastreAtPoint } from "@/lib/cadastre";
import { quoteForDossier, DOSSIER_PRICE } from "@/lib/dossier-pricing";
import { hasPaidTerritory } from "@/lib/active-territory";
import { communeParent } from "@/lib/plm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ════════════════════════════════════════════════════════════════════════════
// La qualification est PUBLIQUE ET ANONYME : c'est le capteur du visiteur froid, et le visiteur
// froid est précisément le moment d'achat. Elle mesure et elle refuse ; elle n'enrichit jamais.
//
// GÉORISQUES N'EST JAMAIS APPELÉ ICI. Cette route porterait notre token sur une surface publique,
// ce qui publierait gratuitement le cœur du fan-out payant.
//
// LE DEVIS N'EST JAMAIS MIS EN CACHE : il dépend des droits d'un compte. La matière (parcelle,
// DPE) se met en cache par adresse via le `revalidate` des sondes ; une PANNE ne se met jamais en
// cache, puisque les sondes rendent alors un statut distinct plutôt qu'une absence.
// ════════════════════════════════════════════════════════════════════════════

// LA MATIÈRE, ET NON SEULEMENT LES MANQUES. La qualification annonce ce qui sera examiné à cette
// adresse ; l'écran porte l'état de chaque élément par son interface plutôt que par une phrase qui
// énumère des absences (doctrine de marque). Trois états, jamais deux : `found` dit qu'un élément
// existe, `none` qu'il n'existe pas, `unavailable` que la source n'a pas répondu.
//
// AUCUNE VALEUR N'EST TRANSMISE : la classe d'un diagnostic ou le numéro d'une parcelle
// appartiennent au dossier payé. On dit qu'il y a de la matière, jamais ce qu'elle vaut.
type MatterState = "found" | "none" | "unavailable";

// Limite de débit en mémoire, par instance. Elle arrête l'abus trivial, pas un attaquant
// distribué : le vrai garde-fou est l'absence de Géorisques ci-dessus. Fluid Compute réutilise les
// instances, donc le compteur survit entre requêtes voisines.
const HITS = new Map<string, { n: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cur = HITS.get(ip);
  if (!cur || cur.resetAt < now) {
    HITS.set(ip, { n: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  cur.n += 1;
  return cur.n > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { address?: unknown } | null;
  const sel = validateSelectedBanAddress(body?.address);
  if (!sel) {
    return NextResponse.json({ error: "Adresse BAN invalide." }, { status: 400 });
  }

  // ── Adresse non ancrée : préciser, ou refuser sur un fait vérifié ──────────────────────
  if (!isSellableAnchor(sel.type)) {
    // UNE COMMUNE SAISIE SEULE N'EST PAS UN REFUS. Le lecteur n'a pas encore donné d'adresse :
    // lui répondre « nous ne pouvons pas identifier ce bien » lui ferait croire que sa commune
    // n'est pas couverte, ce qui est faux et décourageant. Aucun reverse n'est lancé, il n'aurait
    // rendu que les numéros du centre-bourg. Constaté sur « Kerlaz Locronan », feature
    // `municipality`, qui répondait un refus définitif.
    if (sel.type !== "street" && sel.type !== "locality") {
      return NextResponse.json({
        status: "needs_precision",
        reason: "missing_house_number",
        candidates: [],
      });
    }

    const hits = await reverseHouseNumbers(sel.longitude, sel.latitude);
    if (hits === null) {
      // Une panne du reverse ne devient JAMAIS « aucun numéro n'existe » : ce serait refuser une
      // vente sur un appel qui a échoué.
      return NextResponse.json(
        { error: "Vérification indisponible.", code: "BAN_VERIFICATION_FAILED" },
        { status: 503 },
      );
    }
    const candidates: NearbyHouseNumber[] = admissibleCandidates(
      { banId: sel.banId, citycode: sel.citycode, type: sel.type },
      hits,
    );
    if (candidates.length === 0) {
      return NextResponse.json({
        status: "unsupported_at_launch",
        reason: "no_reliable_local_anchor",
      });
    }
    return NextResponse.json({
      status: "needs_precision",
      reason: "missing_house_number",
      candidates,
    });
  }

  // ── Adresse ancrée : la matière, puis le devis ─────────────────────────────────────────
  const [dpe, cadastre] = await Promise.all([
    probeDpeByBanId(sel.banId),
    probeCadastreAtPoint(sel.longitude, sel.latitude),
  ]);

  const matter: { dpe: MatterState; parcel: MatterState } = {
    dpe: dpe.status,
    parcel: cadastre.status,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonyme : le prix de base, avec la déduction ANNONCÉE. Elle doit être conçue plutôt que
  // surgir après connexion comme une mutation inexpliquée du prix.
  if (!user) {
    return NextResponse.json({
      status: "qualified",
      anchorSource: "ban_housenumber",
      matter,
      quote: {
        status: "provisional",
        basePriceCents: DOSSIER_PRICE.fullCents,
        amountDueCents: DOSSIER_PRICE.fullCents,
      },
    });
  }

  // La clé d'idempotence NE NAÎT PAS ICI : elle naît dans la page de checkout, qui est le vrai
  // devis final (elle revalide l'adresse contre la BAN et recalcule le prix). La produire ici
  // obligerait à la traverser jusqu'au formulaire à travers une éventuelle connexion, sans rien
  // garantir de plus.
  const paid = await hasPaidTerritory(supabase, user.id, communeParent(sel.citycode));
  return NextResponse.json({
    status: "qualified",
    anchorSource: "ban_housenumber",
    matter,
    quote: { status: "final", ...quoteForDossier(paid) },
  });
}
