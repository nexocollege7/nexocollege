-- 024_pending_enrollments.sql

create table if not exists public.pending_enrollments (
  id                    uuid default gen_random_uuid() primary key,
  school_id             uuid references public.schools(id) on delete cascade not null,
  student_id            uuid references public.users(id) on delete cascade not null,
  course_id             uuid references public.courses(id) on delete cascade not null,
  payment_method        text not null default 'pix_manual',
  status                text not null default 'awaiting_payment'
                          check (status in ('awaiting_payment', 'awaiting_release', 'released', 'refused', 'expired')),
  receipt_url           text,
  admin_note            text,
  expires_at            timestamptz not null,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null,
  unique (student_id, course_id)
);

-- Índices
create index if not exists pending_enrollments_school_status_idx
  on public.pending_enrollments(school_id, status);
create index if not exists pending_enrollments_student_id_idx
  on public.pending_enrollments(student_id);
create index if not exists pending_enrollments_expires_at_idx
  on public.pending_enrollments(expires_at)
  where status in ('awaiting_payment', 'awaiting_release');

-- RLS
alter table public.pending_enrollments enable row level security;

-- Aluno lê apenas as próprias pendências
create policy "Students read own pending enrollments"
  on public.pending_enrollments for select
  using (student_id = auth.uid());

-- Aluno cria apenas as próprias pendências
create policy "Students insert own pending enrollment"
  on public.pending_enrollments for insert
  with check (student_id = auth.uid());

-- Aluno atualiza apenas a própria pendência (colunas restritas via trigger abaixo)
create policy "Students update own pending enrollment"
  on public.pending_enrollments for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Dono da escola gerencia todas as pendências da própria escola
create policy "School owner manage pending enrollments"
  on public.pending_enrollments for all
  using (
    exists (
      select 1 from public.schools
      where id = school_id and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.schools
      where id = school_id and owner_id = auth.uid()
    )
  );

-- Trigger: quando quem atualiza é o próprio aluno, só permite mudar receipt_url e status
create or replace function public.pending_enrollments_guard_student_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.student_id then
    if new.school_id is distinct from old.school_id
      or new.student_id is distinct from old.student_id
      or new.course_id is distinct from old.course_id
      or new.payment_method is distinct from old.payment_method
      or new.admin_note is distinct from old.admin_note
      or new.expires_at is distinct from old.expires_at
      or new.created_at is distinct from old.created_at
      or new.updated_at is distinct from old.updated_at
    then
      raise exception 'Aluno só pode atualizar receipt_url e status';
    end if;
  end if;
  return new;
end;
$$;

create trigger pending_enrollments_student_update_guard
  before update on public.pending_enrollments
  for each row
  execute function public.pending_enrollments_guard_student_update();
