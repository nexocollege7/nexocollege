-- Transmissão ao vivo da escola (banner na vitrine)
alter table public.schools
  add column if not exists live_url    text,
  add column if not exists live_active boolean default false not null;
