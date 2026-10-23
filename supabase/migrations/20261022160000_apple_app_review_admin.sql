-- Compte App Store Review : admin + éditorial + droits RLS complets.
-- Email : testtalkfootapple@gmail.com

insert into public.admin_users (email)
values ('testtalkfootapple@gmail.com')
on conflict (email) do nothing;

insert into public.editorial_users (email, role)
values ('testtalkfootapple@gmail.com', 'admin')
on conflict (email) do update
set role = excluded.role;
