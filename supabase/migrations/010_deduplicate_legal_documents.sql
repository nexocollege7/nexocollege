-- Desativar documentos LGPD duplicados
-- Mantém apenas o mais recente (maior created_at) por type + target_role
-- Execute no Supabase SQL Editor se a página /aceitar-termos mostrar mais de 3 documentos.

WITH ranked AS (
  SELECT
    id,
    type,
    target_role,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY type, target_role
      ORDER BY created_at DESC
    ) AS rn
  FROM public.legal_documents
  WHERE is_active = true
)
UPDATE public.legal_documents
SET is_active = false
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- Verificar resultado (deve retornar exatamente 6 linhas: 3 school + 3 student)
SELECT type, target_role, version, created_at
FROM public.legal_documents
WHERE is_active = true
ORDER BY target_role, type;
