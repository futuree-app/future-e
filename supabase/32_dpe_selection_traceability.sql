begin;

-- ════════════════════════════════════════════════════════════════════════════
-- DATER LE GESTE, PAS SEULEMENT SON RÉSULTAT.
--
-- Cas d'origine, remonté par un test réel le 19/08/2026 : une personne clique
-- sur le mauvais diagnostic dans la liste de son adresse, et rien ne lui permet
-- de revenir dessus. La correction ouvre le retour à l'état non attribué
-- (`pending`), ce qui découvre un second défaut, plus grave.
--
-- `selected_dpe_at` date le diagnostic FIGÉ. C'est juste, et c'est pour ça
-- qu'il s'efface quand plus aucun diagnostic n'est attribué. Mais c'est cette
-- colonne que lit `artefactPerimeParLeDpe` pour décider si une conclusion
-- vendue a été écrite avant ou après le choix du lecteur. Tant que le seul
-- chemin possible allait de « rien » vers « un diagnostic », l'effacement ne
-- coûtait rien. Dès que le RETRAIT existe, la date repasse à null, la
-- comparaison ne périme plus rien, et le dossier continue de servir une
-- conclusion rédigée à partir du diagnostic que la personne vient justement de
-- retirer.
--
-- D'où deux colonnes, deux questions :
--   selected_dpe_at   : depuis quand CE diagnostic est-il attribué ?
--   dpe_selection_at  : quand la sélection a-t-elle changé pour la dernière
--                       fois, dans quelque direction que ce soit ?
--
-- La seconde ne s'efface jamais. Ajout, remplacement et retrait la posent.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.address_dossiers
  add column if not exists dpe_selection_at timestamptz;

-- Reprise de l'existant : pour les dossiers qui portent déjà un diagnostic, le
-- dernier changement de sélection EST la date de ce diagnostic. Les dossiers
-- sans diagnostic gardent null, ce qui reproduit exactement le comportement
-- actuel (rien ne se périme), sans inventer une date de geste qu'on n'a pas.
update public.address_dossiers
   set dpe_selection_at = selected_dpe_at
 where selected_dpe_at is not null
   and dpe_selection_at is null;

commit;
