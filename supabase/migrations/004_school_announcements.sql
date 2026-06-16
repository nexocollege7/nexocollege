-- Tabela de comunicados da escola
create table if not exists public.school_announcements (
  id          uuid default gen_random_uuid() primary key,
  school_id   uuid references public.schools(id) on delete cascade not null,
  title       text not null,
  content     text not null,
  created_by  uuid references public.users(id) not null,
  created_at  timestamptz default now() not null
);

alter table public.school_announcements enable row level security;

-- Membros da escola (alunos e admins) leem os comunicados da própria escola
create policy "School members read announcements"
  on public.school_announcements for select
  using (
    school_id in (
      select school_id from public.users where id = auth.uid()
    )
  );

-- Admins e colaboradores podem criar comunicados
create policy "Admins create announcements"
  on public.school_announcements for insert
  with check (
    created_by = auth.uid()
    and school_id in (
      select school_id from public.users where id = auth.uid()
      and role in ('admin', 'collaborator')
    )
  );

-- Index para performance
create index if not exists school_announcements_school_id_idx on public.school_announcements(school_id);
