-- Policies RLS para as 3 tabelas de interações sociais de aulas.
-- RLS já estava HABILITADO (migration 013) mas sem nenhuma policy.
-- Regra geral: ver é livre para autenticados; inserir exige matrícula ativa;
-- deletar é restrito ao próprio registro do usuário.

-- ============================================================
-- lesson_likes
-- ============================================================

create policy "lesson_likes_select"
  on public.lesson_likes for select
  using (auth.uid() is not null);

create policy "lesson_likes_insert"
  on public.lesson_likes for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.enrollments e
      join public.lessons l on l.course_id = e.course_id
      where l.id = lesson_id
        and e.student_id = auth.uid()
        and e.status = 'active'
        and (e.expires_at is null or e.expires_at > now())
    )
  );

create policy "lesson_likes_delete"
  on public.lesson_likes for delete
  using (user_id = auth.uid());

-- ============================================================
-- lesson_favorites
-- ============================================================

create policy "lesson_favorites_select"
  on public.lesson_favorites for select
  using (auth.uid() is not null);

create policy "lesson_favorites_insert"
  on public.lesson_favorites for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.enrollments e
      join public.lessons l on l.course_id = e.course_id
      where l.id = lesson_id
        and e.student_id = auth.uid()
        and e.status = 'active'
        and (e.expires_at is null or e.expires_at > now())
    )
  );

create policy "lesson_favorites_delete"
  on public.lesson_favorites for delete
  using (user_id = auth.uid());

-- ============================================================
-- lesson_comment_likes
-- ============================================================

create policy "lesson_comment_likes_select"
  on public.lesson_comment_likes for select
  using (auth.uid() is not null);

create policy "lesson_comment_likes_insert"
  on public.lesson_comment_likes for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.enrollments e
      join public.lesson_comments lc on lc.school_id = e.school_id
      where lc.id = comment_id
        and e.student_id = auth.uid()
        and e.status = 'active'
        and (e.expires_at is null or e.expires_at > now())
    )
  );

create policy "lesson_comment_likes_delete"
  on public.lesson_comment_likes for delete
  using (user_id = auth.uid());
