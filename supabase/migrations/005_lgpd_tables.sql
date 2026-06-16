-- =============================================
-- LGPD: Tabelas de documentos legais e aceites
-- =============================================

-- Tabela de documentos legais (versões)
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text        NOT NULL CHECK (type IN ('terms_of_use', 'privacy_policy', 'cookie_policy')),
  version     text        NOT NULL DEFAULT '1.0',
  target_role text        NOT NULL CHECK (target_role IN ('school', 'student')),
  title       text        NOT NULL,
  content     text        NOT NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Tabela de aceites eletrônicos (histórico permanente — nunca deletar)
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid        NOT NULL REFERENCES public.legal_documents(id),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address  text,
  user_agent  text,
  school_id   uuid        REFERENCES public.schools(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_id ON public.legal_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_document_id ON public.legal_acceptances(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_active ON public.legal_documents(is_active, target_role);

-- RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Documentos: leitura pública (sem autenticação)
CREATE POLICY "Documentos ativos publicos" ON public.legal_documents
  FOR SELECT USING (is_active = true);

-- Aceites: usuário lê os próprios
CREATE POLICY "Usuario le proprios aceites" ON public.legal_acceptances
  FOR SELECT USING (auth.uid() = user_id);

-- Aceites: usuário insere os próprios
CREATE POLICY "Usuario insere proprios aceites" ON public.legal_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Seed: documentos iniciais (conteúdo placeholder)
-- O conteúdo real será inserido via painel Master
-- =============================================

INSERT INTO public.legal_documents (type, version, target_role, title, content) VALUES
(
  'terms_of_use', '1.0', 'school',
  'Termos de Uso — NexoCollege (Escola)',
  'TERMOS DE USO — NEXOCOLLEGE
Versão 1.0 — Junho de 2026

[Conteúdo será atualizado via painel Master]

Ao criar e utilizar uma escola na plataforma NexoCollege, você concorda com estes Termos de Uso. Leia com atenção antes de prosseguir.'
),
(
  'privacy_policy', '1.0', 'school',
  'Política de Privacidade — NexoCollege (Escola)',
  'POLÍTICA DE PRIVACIDADE — NEXOCOLLEGE
Versão 1.0 — Junho de 2026

[Conteúdo será atualizado via painel Master]

A NexoCollege está comprometida com a proteção dos seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).'
),
(
  'cookie_policy', '1.0', 'school',
  'Política de Cookies — NexoCollege (Escola)',
  'POLÍTICA DE COOKIES — NEXOCOLLEGE
Versão 1.0 — Junho de 2026

[Conteúdo será atualizado via painel Master]

Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação e sessão). Não utilizamos cookies de rastreamento ou publicidade de terceiros.'
),
(
  'terms_of_use', '1.0', 'student',
  'Termos de Uso — Aluno',
  'TERMOS DE USO — ALUNO NEXOCOLLEGE
Versão 1.0 — Junho de 2026

[Conteúdo será atualizado via painel Master]

Ao criar uma conta de aluno na plataforma NexoCollege, você concorda com estes Termos de Uso.'
),
(
  'privacy_policy', '1.0', 'student',
  'Política de Privacidade — Aluno',
  'POLÍTICA DE PRIVACIDADE — ALUNO NEXOCOLLEGE
Versão 1.0 — Junho de 2026

[Conteúdo será atualizado via painel Master]

Seus dados pessoais são tratados com segurança e em conformidade com a LGPD (Lei nº 13.709/2018).'
),
(
  'cookie_policy', '1.0', 'student',
  'Política de Cookies — Aluno',
  'POLÍTICA DE COOKIES — ALUNO NEXOCOLLEGE
Versão 1.0 — Junho de 2026

[Conteúdo será atualizado via painel Master]

Utilizamos cookies essenciais para manter sua sessão ativa e garantir o acesso seguro aos cursos.'
);
