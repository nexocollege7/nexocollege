-- Professor convidado: lê a própria mentoria (mesmo se ainda não publicada)
create policy "Guest mentor read own mentorship"
  on public.mentorships for select
  using (mentor_id = auth.uid());

-- Professor convidado: lê o cronograma da própria mentoria
create policy "Guest mentor read own mentorship classes"
  on public.mentorship_classes for select
  using (
    exists (select 1 from public.mentorships m where m.id = mentorship_id and m.mentor_id = auth.uid())
  );

-- Professor convidado: edita materials_url do cronograma da própria mentoria
create policy "Guest mentor update own mentorship classes"
  on public.mentorship_classes for update
  using (
    exists (select 1 from public.mentorships m where m.id = mentorship_id and m.mentor_id = auth.uid())
  )
  with check (
    exists (select 1 from public.mentorships m where m.id = mentorship_id and m.mentor_id = auth.uid())
  );

-- Professor convidado: lê as turmas da própria mentoria
create policy "Guest mentor read own mentorship cohorts"
  on public.mentorship_cohorts for select
  using (
    exists (select 1 from public.mentorships m where m.id = mentorship_id and m.mentor_id = auth.uid())
  );

-- Professor convidado: ativa/desativa transmissão das turmas da própria mentoria
create policy "Guest mentor update own mentorship cohorts"
  on public.mentorship_cohorts for update
  using (
    exists (select 1 from public.mentorships m where m.id = mentorship_id and m.mentor_id = auth.uid())
  )
  with check (
    exists (select 1 from public.mentorships m where m.id = mentorship_id and m.mentor_id = auth.uid())
  );

-- Professor convidado: lê os comentários dos alunos na própria mentoria
-- (fecha uma lacuna da Fase 2 — "professor lê comentários" só funcionava até agora
-- porque o mentor era sempre alguém da equipe, com acesso via policy de staff)
create policy "Guest mentor read own mentorship comments"
  on public.mentorship_comments for select
  using (
    exists (
      select 1 from public.mentorship_classes mc
      join public.mentorships m on m.id = mc.mentorship_id
      where mc.id = mentorship_comments.class_id
      and m.mentor_id = auth.uid()
    )
  );
