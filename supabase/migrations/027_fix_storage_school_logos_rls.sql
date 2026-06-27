-- Fix: policies de mutação do bucket school-logos agora exigem que o
-- primeiro segmento do path (o school_id) pertença a uma escola cujo
-- owner_id é o usuário autenticado.
-- Path esperado: {school_id}/{filename}  (ex: "abc-uuid/logo.png")

drop policy if exists "School owners can upload logo"  on storage.objects;
drop policy if exists "School owners can update logo"  on storage.objects;
drop policy if exists "School owners can delete logo"  on storage.objects;
drop policy if exists "Anyone can view school logos"   on storage.objects;

-- Leitura pública permanece sem restrição de ownership
create policy "Anyone can view school logos"
  on storage.objects for select
  using (bucket_id = 'school-logos');

-- INSERT: verifica que o primeiro segmento do path é o ID de uma escola
-- cujo owner_id é o usuário autenticado
create policy "School owners can upload logo"
  on storage.objects for insert
  with check (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.schools
      where id = split_part(storage.objects.name, '/', 1)::uuid
        and owner_id = auth.uid()
    )
  );

-- UPDATE: mesma verificação de ownership
create policy "School owners can update logo"
  on storage.objects for update
  using (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.schools
      where id = split_part(storage.objects.name, '/', 1)::uuid
        and owner_id = auth.uid()
    )
  );

-- DELETE: mesma verificação de ownership
create policy "School owners can delete logo"
  on storage.objects for delete
  using (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.schools
      where id = split_part(storage.objects.name, '/', 1)::uuid
        and owner_id = auth.uid()
    )
  );
