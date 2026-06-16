-- Adiciona coluna logo_url na tabela schools (se ainda não existir)
alter table public.schools
  add column if not exists logo_url text;

-- Políticas RLS para o bucket school-logos no Supabase Storage
-- Execute estas políticas no SQL Editor do Supabase após criar o bucket

-- Donos de escola podem fazer upload da própria logo
create policy "School owners can upload logo"
  on storage.objects for insert
  with check (bucket_id = 'school-logos');

-- Logos são públicas para leitura
create policy "Anyone can view school logos"
  on storage.objects for select
  using (bucket_id = 'school-logos');

-- Donos de escola podem atualizar a própria logo
create policy "School owners can update logo"
  on storage.objects for update
  using (bucket_id = 'school-logos');

-- Donos de escola podem deletar a própria logo
create policy "School owners can delete logo"
  on storage.objects for delete
  using (bucket_id = 'school-logos');
