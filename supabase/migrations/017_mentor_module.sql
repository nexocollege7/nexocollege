-- 017_mentor_module.sql

-- 1. Flag de ativação do add-on na escola
alter table public.schools
  add column if not exists mentor_module boolean not null default false;

-- 2. Mentorias (produto vendido pela escola)
create table if not exists public.mentorships (
  id            uuid default gen_random_uuid() primary key,
  school_id     uuid references public.schools(id) on delete cascade not null,
  mentor_id     uuid references public.users(id) on delete set null,
  title         text not null,
  slug          text not null,
  description   text,
  cover_url     text,
  price         numeric(10,2) not null default 0,
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- 3. Cronograma da mentoria (timeline de aulas/encontros)
create table if not exists public.mentorship_classes (
  id              uuid default gen_random_uuid() primary key,
  mentorship_id   uuid references public.mentorships(id) on delete cascade not null,
  title           text not null,
  summary         text,
  scheduled_at    timestamptz,
  materials_url   text,
  position        integer not null default 0,
  created_at      timestamptz default now() not null
);

-- 4. Turmas (cada edição da mentoria)
create table if not exists public.mentorship_cohorts (
  id                  uuid default gen_random_uuid() primary key,
  mentorship_id       uuid references public.mentorships(id) on delete cascade not null,
  max_students        integer not null default 0,
  enrollment_start    timestamptz,
  enrollment_end      timestamptz,
  status              text not null default 'open' check (status in ('open','closed','archived')),
  live_url            text,
  live_active         boolean not null default false,
  created_at          timestamptz default now() not null
);

-- 5. Inscrições de alunos em turmas
create table if not exists public.mentorship_enrollments (
  id                uuid default gen_random_uuid() primary key,
  cohort_id         uuid references public.mentorship_cohorts(id) on delete cascade not null,
  student_id        uuid references public.users(id) on delete cascade not null,
  payment_id        text,
  payment_status    text not null default 'paid' check (payment_status in ('paid','manual')),
  enrolled_at       timestamptz default now() not null,
  unique (cohort_id, student_id)
);

-- Índices
create index if not exists mentorships_school_id_idx on public.mentorships(school_id);
create index if not exists mentorships_status_idx on public.mentorships(school_id, status);
create index if not exists mentorship_classes_mentorship_id_idx on public.mentorship_classes(mentorship_id);
create index if not exists mentorship_cohorts_mentorship_id_idx on public.mentorship_cohorts(mentorship_id);
create index if not exists mentorship_enrollments_cohort_id_idx on public.mentorship_enrollments(cohort_id);
create index if not exists mentorship_enrollments_student_id_idx on public.mentorship_enrollments(student_id);

-- RLS
alter table public.mentorships enable row level security;
alter table public.mentorship_classes enable row level security;
alter table public.mentorship_cohorts enable row level security;
alter table public.mentorship_enrollments enable row level security;

-- mentorships: leitura pública das publicadas (vitrine)
create policy "Public read published mentorships"
  on public.mentorships for select
  using (status = 'published');

-- mentorships: dono/equipe da escola leem todas as próprias
create policy "School staff read all mentorships"
  on public.mentorships for select
  using (
    exists (select 1 from public.schools where id = school_id and owner_id = auth.uid())
    or exists (select 1 from public.users where id = auth.uid() and school_id = mentorships.school_id)
  );

-- mentorships: dono/equipe da escola gerenciam (insert/update/delete) as próprias
create policy "School staff manage mentorships"
  on public.mentorships for all
  using (
    exists (select 1 from public.schools where id = school_id and owner_id = auth.uid())
    or exists (select 1 from public.users where id = auth.uid() and school_id = mentorships.school_id)
  )
  with check (
    exists (select 1 from public.schools where id = school_id and owner_id = auth.uid())
    or exists (select 1 from public.users where id = auth.uid() and school_id = mentorships.school_id)
  );

-- mentorship_classes: leitura pública se a mentoria-mãe está publicada
create policy "Public read classes of published mentorships"
  on public.mentorship_classes for select
  using (
    exists (select 1 from public.mentorships m where m.id = mentorship_id and m.status = 'published')
  );

-- mentorship_classes: equipe da escola gerencia o cronograma das próprias mentorias
create policy "School staff manage classes"
  on public.mentorship_classes for all
  using (
    exists (
      select 1 from public.mentorships m
      where m.id = mentorship_id
      and (
        exists (select 1 from public.schools where id = m.school_id and owner_id = auth.uid())
        or exists (select 1 from public.users where id = auth.uid() and school_id = m.school_id)
      )
    )
  )
  with check (
    exists (
      select 1 from public.mentorships m
      where m.id = mentorship_id
      and (
        exists (select 1 from public.schools where id = m.school_id and owner_id = auth.uid())
        or exists (select 1 from public.users where id = auth.uid() and school_id = m.school_id)
      )
    )
  );

-- mentorship_cohorts: leitura pública se a mentoria-mãe está publicada
create policy "Public read cohorts of published mentorships"
  on public.mentorship_cohorts for select
  using (
    exists (select 1 from public.mentorships m where m.id = mentorship_id and m.status = 'published')
  );

-- mentorship_cohorts: equipe da escola gerencia as turmas das próprias mentorias
create policy "School staff manage cohorts"
  on public.mentorship_cohorts for all
  using (
    exists (
      select 1 from public.mentorships m
      where m.id = mentorship_id
      and (
        exists (select 1 from public.schools where id = m.school_id and owner_id = auth.uid())
        or exists (select 1 from public.users where id = auth.uid() and school_id = m.school_id)
      )
    )
  )
  with check (
    exists (
      select 1 from public.mentorships m
      where m.id = mentorship_id
      and (
        exists (select 1 from public.schools where id = m.school_id and owner_id = auth.uid())
        or exists (select 1 from public.users where id = auth.uid() and school_id = m.school_id)
      )
    )
  );

-- mentorship_enrollments: aluno lê a própria inscrição
create policy "Students read own mentorship enrollments"
  on public.mentorship_enrollments for select
  using (student_id = auth.uid());

-- mentorship_enrollments: aluno insere a própria inscrição (matrícula gratuita/manual; pagas via webhook com service role)
create policy "Students insert own mentorship enrollment"
  on public.mentorship_enrollments for insert
  with check (student_id = auth.uid());

-- mentorship_enrollments: equipe da escola lê as inscrições das próprias turmas
create policy "School staff read mentorship enrollments"
  on public.mentorship_enrollments for select
  using (
    exists (
      select 1 from public.mentorship_cohorts c
      join public.mentorships m on m.id = c.mentorship_id
      where c.id = cohort_id
      and (
        exists (select 1 from public.schools where id = m.school_id and owner_id = auth.uid())
        or exists (select 1 from public.users where id = auth.uid() and school_id = m.school_id)
      )
    )
  );

-- mentorship_enrollments: equipe da escola pode atualizar (ex: payment_status manual)
create policy "School staff manage mentorship enrollments"
  on public.mentorship_enrollments for update
  using (
    exists (
      select 1 from public.mentorship_cohorts c
      join public.mentorships m on m.id = c.mentorship_id
      where c.id = cohort_id
      and (
        exists (select 1 from public.schools where id = m.school_id and owner_id = auth.uid())
        or exists (select 1 from public.users where id = auth.uid() and school_id = m.school_id)
      )
    )
  );
