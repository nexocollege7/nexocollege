-- Adiciona updated_at em school_announcements e policies de update/delete
ALTER TABLE public.school_announcements
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE POLICY "Admins update announcements"
  ON public.school_announcements FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'collaborator')
    )
  );

CREATE POLICY "Admins delete announcements"
  ON public.school_announcements FOR DELETE
  USING (
    school_id IN (
      SELECT school_id FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'collaborator')
    )
  );
