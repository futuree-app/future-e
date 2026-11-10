-- ════════════════════════════════════════════════════════════════════════════════════════════
-- FUT-173 · EFFACER DES VERSIONS PRÊTES SANS SUPPRIMER LE COMPTE. OPÉRATION D'ADMINISTRATION.
--
-- LE CAS ORDINAIRE N'EST PAS ICI. Une demande d'effacement du compte se traite par la suppression du
-- compte (Supabase > Authentication > Users > Delete user, ou `auth.admin.deleteUser`) : la cascade de
-- `user_id` emporte toutes ses versions, prêtes comprises, et le trigger de la migration 40 la laisse
-- passer. Rien à faire ici.
--
-- CE FICHIER SERT AU SEUL CAS RESTANT : effacer des versions précises d'un compte qui reste (demande
-- ciblée de la personne, réparation décidée par le porteur). Le trigger les protège, y compris du
-- service role ; seul le propriétaire de la table (`postgres`, rôle du SQL Editor) peut le suspendre,
-- et seulement le temps de cette transaction.
--
-- TRAÇABILITÉ : consigner AVANT l'opération, dans le ticket qui la demande, le motif, le compte
-- (identifiant, jamais l'e-mail), les versions visées, et le résultat de l'étape 3.
-- Ne JAMAIS laisser la transaction ouverte : `alter table ... disable trigger` tient un verrou exclusif
-- sur la table, et le trigger doit être réactivé avant le `commit` (étape 4).
-- ════════════════════════════════════════════════════════════════════════════════════════════

begin;

-- 1. Les lignes visées, À REMPLACER (identifiant du compte, scope, versions).
create temporary table fut173_cible on commit drop as
  select id, user_id, insee_code, scope_key, version, status
    from public.decision_artifact
   where user_id = '00000000-0000-0000-0000-000000000000'::uuid   -- ← compte
     and scope_key = 'commune'                                     -- ← scope
     and version in (1);                                           -- ← versions

select * from fut173_cible;   -- 2. Relire : c'est exactement ce qui sera effacé.

alter table public.decision_artifact disable trigger decision_artifact_integrite;
delete from public.decision_artifact a using fut173_cible c where a.id = c.id;
alter table public.decision_artifact enable trigger decision_artifact_integrite;

-- 3. Contrôle : aucune ligne visée ne reste, et le trigger est de nouveau actif ('O').
select (select count(*) from public.decision_artifact a join fut173_cible c on c.id = a.id) as restantes,
       (select tgenabled from pg_trigger where tgname = 'decision_artifact_integrite') as trigger_etat;

-- 4. `commit;` si « restantes = 0 » et « trigger_etat = O », sinon `rollback;`.
