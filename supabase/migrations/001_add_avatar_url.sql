-- Adiciona coluna avatar_url na tabela users (se ainda não existir)
alter table public.users
  add column if not exists avatar_url text;

-- Políticas RLS para o bucket avatars no Supabase Storage
-- Execute estas políticas no SQL Editor do Supabase após criar o bucket

-- Qualquer usuário autenticado pode fazer upload para sua própria pasta
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatares são públicos para leitura
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Usuários podem substituir o próprio avatar
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuários podem deletar o próprio avatar
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
