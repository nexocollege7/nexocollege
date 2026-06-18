-- Novas colunas de features por plano (custom domain reaproveita has_custom_domain já existente)
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS max_collaborators integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS can_use_coupons boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_reviews boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_live_events boolean NOT NULL DEFAULT false;

-- Starter — grátis, 1 curso, 50 alunos, sem features extras
UPDATE public.plans SET
  price_yearly = 0,
  max_courses = 1,
  max_students = 50,
  max_collaborators = 0,
  can_use_coupons = false,
  can_use_reviews = false,
  can_use_live_events = false,
  has_certificate = true,
  has_custom_domain = false
WHERE slug = 'starter';

-- Creator — R$697/ano, 5 cursos, 300 alunos, cupons + depoimentos, 1 colaborador
UPDATE public.plans SET
  price_yearly = 697,
  max_courses = 5,
  max_students = 300,
  max_collaborators = 1,
  can_use_coupons = true,
  can_use_reviews = true,
  can_use_live_events = false,
  has_certificate = true,
  has_custom_domain = false
WHERE slug = 'creator';

-- Pro — R$1.597/ano, 20 cursos, 1.000 alunos, + eventos ao vivo, 3 colaboradores
-- (corrige bug: domínio próprio não é deste plano, só do Scale)
UPDATE public.plans SET
  price_yearly = 1597,
  max_courses = 20,
  max_students = 1000,
  max_collaborators = 3,
  can_use_coupons = true,
  can_use_reviews = true,
  can_use_live_events = true,
  has_certificate = true,
  has_custom_domain = false
WHERE slug = 'pro';

-- Scale — R$3.597/ano, 50 cursos, 3.000 alunos, + domínio próprio, 10 colaboradores
UPDATE public.plans SET
  price_yearly = 3597,
  max_courses = 50,
  max_students = 3000,
  max_collaborators = 10,
  can_use_coupons = true,
  can_use_reviews = true,
  can_use_live_events = true,
  has_certificate = true,
  has_custom_domain = true
WHERE slug = 'scale';

-- Enterprise — plano legado/customizado (fora do catálogo público), mantém preço e limites,
-- libera todas as features por ser o topo da hierarquia
UPDATE public.plans SET
  max_collaborators = 999,
  can_use_coupons = true,
  can_use_reviews = true,
  can_use_live_events = true,
  has_certificate = true,
  has_custom_domain = true
WHERE slug = 'enterprise';
