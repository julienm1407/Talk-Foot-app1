-- Compte Google Play Review : admin + éditorial + droits RLS complets.
-- Email : talkfoottest@gmail.com

insert into public.admin_users (email)
values ('talkfoottest@gmail.com')
on conflict (email) do nothing;

insert into public.editorial_users (email, role)
values ('talkfoottest@gmail.com', 'admin')
on conflict (email) do update
set role = excluded.role;
