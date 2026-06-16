-- Campos de cupom de desconto na tabela courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS coupon_discount_percent integer CHECK (coupon_discount_percent BETWEEN 1 AND 100);

-- Campos de cupom utilizado na tabela payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_percent integer;
