-- Adicionar colunas de resposta do professor em lesson_comments
ALTER TABLE public.lesson_comments
  ADD COLUMN IF NOT EXISTS reply_content text,
  ADD COLUMN IF NOT EXISTS reply_at timestamptz,
  ADD COLUMN IF NOT EXISTS replied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_comments_reply ON public.lesson_comments(replied_by) WHERE reply_content IS NOT NULL;
