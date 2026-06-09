-- Débats indépendants des tribunes : group_id facultatif, accès ouvert par défaut.

alter table public.debates
  alter column group_id drop not null;

alter table public.debates
  alter column salon_access set default 'public';

update public.debates
set salon_access = 'public'
where salon_access = 'members';

comment on column public.debates.group_id is
  'Tribune associée (facultatif). Les messages du fil peuvent aussi vivre sur tf-global-debates.';
