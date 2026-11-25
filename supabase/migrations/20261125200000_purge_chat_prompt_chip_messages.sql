-- Messages envoyés par erreur : le clic sur une suggestion chat postait le libellé.
delete from public.live_match_messages
where btrim(body) ~* '^(ton score exact|ta compo r[eê]v[eé]e|qui marque en premier)\s*\??\s*$';
