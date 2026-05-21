-- Realtime UPDATE doit inclure toutes les colonnes (ex. color) pour les upserts tifo.
alter table public.match_tifo_pixels replica identity full;
