-- Corrigir RLS de lesson_comments
-- A policy anterior usava school_id IN (SELECT school_id FROM users WHERE id = auth.uid())
-- que falha para alunos sem school_id (enrolled via admin → users.school_id = NULL).
-- Nova política usa EXISTS com enrollments para alunos e owner_id para donos da escola.

DROP POLICY IF EXISTS "Users read comments in their school" ON public.lesson_comments;
DROP POLICY IF EXISTS "Users insert own comments" ON public.lesson_comments;

CREATE POLICY "Users read lesson comments"
  ON public.lesson_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      INNER JOIN public.lessons l ON l.course_id = e.course_id
      WHERE e.student_id = auth.uid()
        AND e.status = 'active'
        AND l.id = lesson_comments.lesson_id
    )
    OR EXISTS (
      SELECT 1 FROM public.schools
      WHERE id = lesson_comments.school_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND school_id = lesson_comments.school_id
    )
  );

CREATE POLICY "Users insert lesson comments"
  ON public.lesson_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.enrollments e
        INNER JOIN public.lessons l ON l.course_id = e.course_id
        WHERE e.student_id = auth.uid()
          AND e.status = 'active'
          AND l.id = lesson_id
      )
      OR EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND school_id = school_id)
    )
  );
