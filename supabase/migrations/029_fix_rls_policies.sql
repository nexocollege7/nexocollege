-- Migration 029: corrige 3 problemas de RLS identificados na auditoria.

-- ============================================================
-- PROBLEMA 1 — platform_settings: policy "Master pode tudo"
-- usava USING (true) sem verificar identidade.
-- Corrigido: restringe ao email do master via auth.email().
-- ============================================================

DROP POLICY IF EXISTS "Master pode tudo" ON public.platform_settings;

CREATE POLICY "Master pode tudo"
  ON public.platform_settings FOR ALL
  USING (auth.email() = 'fe.jose7@gmail.com')
  WITH CHECK (auth.email() = 'fe.jose7@gmail.com');

-- ============================================================
-- PROBLEMA 2 — payments: policy INSERT com WITH CHECK = true
-- permitia qualquer autenticado inserir pagamentos arbitrários.
-- Corrigido: student_id deve corresponder ao usuário logado.
-- ============================================================

DROP POLICY IF EXISTS "payments_insert" ON public.payments;

CREATE POLICY "payments_insert"
  ON public.payments FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ============================================================
-- PROBLEMA 3 — lesson_resources: sem policies de mutação.
-- A tabela tinha apenas SELECT; qualquer autenticado poderia
-- inserir/atualizar/deletar recursos via service role bypass.
-- Corrigido: operações de escrita exigem ser dono da escola.
-- ============================================================

CREATE POLICY "lesson_resources_insert"
  ON public.lesson_resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.schools s ON s.id = c.school_id
      WHERE l.id = lesson_resources.lesson_id
        AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "lesson_resources_update"
  ON public.lesson_resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.schools s ON s.id = c.school_id
      WHERE l.id = lesson_resources.lesson_id
        AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "lesson_resources_delete"
  ON public.lesson_resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      JOIN public.schools s ON s.id = c.school_id
      WHERE l.id = lesson_resources.lesson_id
        AND s.owner_id = auth.uid()
    )
  );
