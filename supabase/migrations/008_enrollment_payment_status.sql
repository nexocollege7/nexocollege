-- Adiciona coluna payment_status na tabela enrollments
-- 'manual' = liberado pelo admin; 'paid' = pago via Mercado Pago; null = legado
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS payment_status text;
