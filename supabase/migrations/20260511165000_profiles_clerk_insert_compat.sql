-- Compat insert profiles for Clerk users (non auth.users UUID ids)
-- 1) allow generated uuid for profiles.id
-- 2) drop hard FK to auth.users for `profiles.id`

alter table public.profiles
  alter column id set default gen_random_uuid();

do $$
declare
  fk_name text;
begin
  select tc.constraint_name
  into fk_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'profiles'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'id'
  limit 1;

  if fk_name is not null then
    execute format('alter table public.profiles drop constraint %I', fk_name);
  end if;
end
$$;

