-- Tabela de comentários por aula
create table if not exists public.lesson_comments (
  id          uuid default gen_random_uuid() primary key,
  lesson_id   uuid references public.lessons(id) on delete cascade not null,
  user_id     uuid references public.users(id) on delete cascade not null,
  school_id   uuid references public.schools(id) on delete cascade not null,
  content     text not null,
  created_at  timestamptz default now() not null
);

alter table public.lesson_comments enable row level security;

-- Alunos e admins leem comentários da própria escola
create policy "Users read comments in their school"
  on public.lesson_comments for select
  using (
    school_id in (
      select school_id from public.users where id = auth.uid()
    )
  );

-- Qualquer usuário autenticado pode inserir comentário na própria escola
create policy "Users insert own comments"
  on public.lesson_comments for insert
  with check (
    user_id = auth.uid()
    and school_id in (
      select school_id from public.users where id = auth.uid()
    )
  );

-- Index para performance
create index if not exists lesson_comments_lesson_id_idx on public.lesson_comments(lesson_id);
create index if not exists lesson_comments_school_id_idx on public.lesson_comments(school_id);
