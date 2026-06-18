-- Comentários de alunos por encontro (aula) da mentoria
create table if not exists public.mentorship_comments (
  id          uuid default gen_random_uuid() primary key,
  class_id    uuid references public.mentorship_classes(id) on delete cascade not null,
  student_id  uuid references public.users(id) on delete cascade not null,
  content     text not null check (char_length(content) <= 1000),
  created_at  timestamptz default now() not null
);

alter table public.mentorship_comments enable row level security;

create index if not exists mentorship_comments_class_id_idx on public.mentorship_comments(class_id);
create index if not exists mentorship_comments_student_id_idx on public.mentorship_comments(student_id);

-- Aluno inscrito na mentoria (em qualquer turma) insere comentário como ele mesmo
create policy "Enrolled students insert mentorship comments"
  on public.mentorship_comments for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.mentorship_classes mc
      join public.mentorship_cohorts co on co.mentorship_id = mc.mentorship_id
      join public.mentorship_enrollments me on me.cohort_id = co.id
      where mc.id = mentorship_comments.class_id
      and me.student_id = auth.uid()
    )
  );

-- Alunos inscritos leem todos os comentários da aula (mural da turma)
create policy "Enrolled students read mentorship comments"
  on public.mentorship_comments for select
  using (
    exists (
      select 1 from public.mentorship_classes mc
      join public.mentorship_cohorts co on co.mentorship_id = mc.mentorship_id
      join public.mentorship_enrollments me on me.cohort_id = co.id
      where mc.id = mentorship_comments.class_id
      and me.student_id = auth.uid()
    )
  );

-- Dono/equipe da escola leem todos os comentários das próprias mentorias
create policy "School staff read mentorship comments"
  on public.mentorship_comments for select
  using (
    exists (
      select 1 from public.mentorship_classes mc
      join public.mentorships m on m.id = mc.mentorship_id
      where mc.id = mentorship_comments.class_id
      and (
        exists (select 1 from public.schools where id = m.school_id and owner_id = auth.uid())
        or exists (select 1 from public.users where id = auth.uid() and school_id = m.school_id)
      )
    )
  );
