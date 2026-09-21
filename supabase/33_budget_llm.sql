begin;

-- ════════════════════════════════════════════════════════════════════════════
-- LE DISJONCTEUR DES APPELS AU MODÈLE.
--
-- POURQUOI EN BASE ET NON EN MÉMOIRE. Le compteur par adresse réseau vit dans une instance et ne
-- voit ni les autres instances, ni une attaque venue de cent machines. Celui-ci est partagé : il
-- protège le portefeuille, là où l'autre ne fait que gêner l'abus trivial.
--
-- POURQUOI UN POIDS ET NON UN COMPTE D'APPELS. Une extraction structurée courte et un assistant
-- qui traîne un historique ne coûtent pas la même chose. Compter des appels donnerait une fausse
-- sensation de maîtrise.
--
-- UNE LIGNE PAR JOUR, jamais purgée : quelques lignes par an, et l'historique dit après coup quel
-- jour a consommé quoi.
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.budget_llm (
  jour  date primary key,
  poids integer not null default 0 check (poids >= 0)
);

alter table public.budget_llm enable row level security;
-- Aucune policy : seul le service role écrit et lit. Un client qui pourrait toucher ce compteur
-- remettrait le budget à zéro avant de lancer sa boucle.
revoke all on public.budget_llm from authenticated, anon;

-- CONSOMME ET RÉPOND DANS LA MÊME OPÉRATION.
--
-- Lire puis écrire en deux temps laisserait passer autant d'appels que d'instances concurrentes
-- pendant la fenêtre : c'est exactement le moment d'une attaque que ce compteur doit tenir.
-- `insert … on conflict do update` est atomique, et le `returning` rend le total APRÈS ajout.
--
-- Rend `true` quand le plafond est franchi. Le poids est compté même dans ce cas : une tentative
-- refusée n'a rien coûté au fournisseur, mais la compter garde la trace d'une journée anormale et
-- évite qu'une boucle continue de tester le plafond gratuitement.
create or replace function public.consommer_budget_llm(
  p_jour date,
  p_poids integer,
  p_plafond integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  insert into public.budget_llm (jour, poids)
  values (p_jour, p_poids)
  on conflict (jour) do update set poids = public.budget_llm.poids + p_poids
  returning poids into v_total;

  return v_total > p_plafond;
end;
$$;

revoke all on function public.consommer_budget_llm(date, integer, integer) from public, anon, authenticated;

commit;
