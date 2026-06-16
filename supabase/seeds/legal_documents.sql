-- Seeds dos documentos LGPD padrão da NexoCollege
-- Execute no Supabase SQL Editor.
-- ON CONFLICT por (type, target_role) com is_active=true — não duplica se já existir.

DO $$
DECLARE
  exists_count integer;
BEGIN

  -- 1. Termos de Uso — Escola
  SELECT COUNT(*) INTO exists_count
    FROM public.legal_documents
    WHERE type = 'terms_of_use' AND target_role = 'school' AND is_active = true;
  IF exists_count = 0 THEN
    INSERT INTO public.legal_documents (type, target_role, version, title, content, is_active)
    VALUES ('terms_of_use', 'school', '1.0', 'Termos de Uso da Plataforma NexoCollege',
      '[CONTEUDO_1 — Termos de Uso da Escola]', true);
  END IF;

  -- 2. Política de Privacidade — Escola
  SELECT COUNT(*) INTO exists_count
    FROM public.legal_documents
    WHERE type = 'privacy_policy' AND target_role = 'school' AND is_active = true;
  IF exists_count = 0 THEN
    INSERT INTO public.legal_documents (type, target_role, version, title, content, is_active)
    VALUES ('privacy_policy', 'school', '1.0', 'Política de Privacidade – NexoCollege',
      '[CONTEUDO_2 — Política de Privacidade da Escola]', true);
  END IF;

  -- 3. Política de Cookies — Escola
  SELECT COUNT(*) INTO exists_count
    FROM public.legal_documents
    WHERE type = 'cookie_policy' AND target_role = 'school' AND is_active = true;
  IF exists_count = 0 THEN
    INSERT INTO public.legal_documents (type, target_role, version, title, content, is_active)
    VALUES ('cookie_policy', 'school', '1.0', 'Política de Cookies – NexoCollege',
      '[CONTEUDO_3 — Política de Cookies da Escola]', true);
  END IF;

  -- 4. Termos de Uso — Aluno
  SELECT COUNT(*) INTO exists_count
    FROM public.legal_documents
    WHERE type = 'terms_of_use' AND target_role = 'student' AND is_active = true;
  IF exists_count = 0 THEN
    INSERT INTO public.legal_documents (type, target_role, version, title, content, is_active)
    VALUES ('terms_of_use', 'student', '1.0', 'Termos de Uso do Ambiente do Aluno – NexoCollege',
      '[CONTEUDO_4 — Termos de Uso do Aluno]', true);
  END IF;

  -- 5. Política de Privacidade — Aluno
  SELECT COUNT(*) INTO exists_count
    FROM public.legal_documents
    WHERE type = 'privacy_policy' AND target_role = 'student' AND is_active = true;
  IF exists_count = 0 THEN
    INSERT INTO public.legal_documents (type, target_role, version, title, content, is_active)
    VALUES ('privacy_policy', 'student', '1.0', 'Política de Privacidade do Aluno – NexoCollege',
      '[CONTEUDO_5 — Política de Privacidade do Aluno]', true);
  END IF;

  -- 6. Política de Cookies — Aluno
  SELECT COUNT(*) INTO exists_count
    FROM public.legal_documents
    WHERE type = 'cookie_policy' AND target_role = 'student' AND is_active = true;
  IF exists_count = 0 THEN
    INSERT INTO public.legal_documents (type, target_role, version, title, content, is_active)
    VALUES ('cookie_policy', 'student', '1.0', 'Política de Cookies do Ambiente do Aluno – NexoCollege',
      '[CONTEUDO_6 — Política de Cookies do Aluno]', true);
  END IF;

END $$;
