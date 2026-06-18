-- Depoimentos de alunos sobre cursos concluídos
create table if not exists public.course_reviews (
  id                  uuid default gen_random_uuid() primary key,
  school_id           uuid references public.schools(id) on delete cascade not null,
  course_id           uuid references public.courses(id) on delete cascade not null,
  student_id          uuid references public.users(id) on delete cascade not null,
  content             text not null check (char_length(content) <= 300),
  student_name        text not null,
  student_avatar_url  text,
  is_active           boolean default true not null,
  created_at          timestamptz default now() not null
);

alter table public.course_reviews enable row level security;

-- Leitura pública dos depoimentos ativos (vitrine, sem login)
create policy "Public read active reviews"
  on public.course_reviews for select
  using (is_active = true);

-- Donos/equipe da escola podem ler todos (inclusive inativos) para moderação
create policy "School staff read all reviews"
  on public.course_reviews for select
  using (
    exists (select 1 from public.schools where id = school_id and owner_id = auth.uid())
    or exists (select 1 from public.users where id = auth.uid() and school_id = course_reviews.school_id)
  );

-- Aluno só pode inserir depoimento sobre curso em que está matriculado, como ele mesmo
create policy "Students insert own review"
  on public.course_reviews for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.student_id = auth.uid() and e.course_id = course_reviews.course_id and e.status = 'active'
    )
  );

-- Apenas donos/equipe da escola podem moderar (ativar/desativar)
create policy "School staff update review status"
  on public.course_reviews for update
  using (
    exists (select 1 from public.schools where id = school_id and owner_id = auth.uid())
    or exists (select 1 from public.users where id = auth.uid() and school_id = course_reviews.school_id)
  );

create index if not exists course_reviews_school_id_idx on public.course_reviews(school_id);
create index if not exists course_reviews_course_id_idx on public.course_reviews(course_id);
create index if not exists course_reviews_active_idx on public.course_reviews(school_id, is_active);
