-- Apenas o dono da escola pode excluir depoimentos (diferente de SELECT/UPDATE,
-- que também liberam colaboradores com school_id vinculado)
create policy "School owner deletes review"
  on public.course_reviews for delete
  using (
    exists (select 1 from public.schools where id = school_id and owner_id = auth.uid())
  );
