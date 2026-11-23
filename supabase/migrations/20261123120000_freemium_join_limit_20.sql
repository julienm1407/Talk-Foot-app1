-- Supporter (gratuit) : 20 tribunes max au total, aligné sur le client.

create or replace function public.talkfoot_max_groups_joined(p_tier text)
returns int
language sql
immutable
as $$
  select case p_tier
    when 'freemium' then 20
    else null
  end;
$$;

comment on function public.talkfoot_max_groups_joined is
  'Supporter: 20 tribunes max. Ultra/Ambassadeur: illimité.';
