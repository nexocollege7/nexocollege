-- 020_mentor_module_activated_at.sql

-- Data em que o Módulo Mentor foi ativado pela escola (compra do add-on ou reativação manual no painel master).
-- Nullable: escolas que já tinham mentor_module = true antes desta migration não têm data retroativa.
alter table public.schools
  add column if not exists mentor_module_activated_at timestamptz null;
