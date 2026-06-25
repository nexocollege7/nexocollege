-- 025_payment_receipts_storage_policies.sql

-- Caminho dos arquivos: {student_id}/{school_id}/{pendingId}.{ext}
-- Bucket privado: sem policy de leitura pública.

-- Aluno faz upload do próprio comprovante (1º segmento do path = student_id)
create policy "Students upload own receipt"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Aluno pode substituir o próprio comprovante (reenvio)
create policy "Students update own receipt"
  on storage.objects for update
  using (
    bucket_id = 'payment-receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Aluno lê o próprio comprovante
create policy "Students read own receipt"
  on storage.objects for select
  using (
    bucket_id = 'payment-receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Dono da escola lê os comprovantes da própria escola (2º segmento do path = school_id)
create policy "School owner read receipts"
  on storage.objects for select
  using (
    bucket_id = 'payment-receipts'
    and exists (
      select 1 from public.schools
      where id::text = (storage.foldername(name))[2]
      and owner_id = auth.uid()
    )
  );
