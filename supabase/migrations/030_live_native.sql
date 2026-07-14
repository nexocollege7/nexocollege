-- Migration 030: Live Nativa com Câmera
-- Adiciona suporte a transmissões nativas (Daily.co) como alternativa ao YouTube

-- 1. Nova coluna na tabela plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS can_use_live_native boolean NOT NULL DEFAULT false;

-- 2. Liberar apenas para scale e enterprise
UPDATE plans SET can_use_live_native = true WHERE slug IN ('scale', 'enterprise');

-- 3. Tabela de sessões de live
CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  daily_room_url text,
  daily_room_name text,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'live', 'ended')),
  live_type text NOT NULL DEFAULT 'youtube' CHECK (live_type IN ('youtube', 'native')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'restricted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- 4. Cursos vinculados à live (quando visibility = 'restricted')
CREATE TABLE IF NOT EXISTS live_session_courses (
  live_session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (live_session_id, course_id)
);

-- 5. Comentários temporários da live
CREATE TABLE IF NOT EXISTS live_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id uuid NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  message text NOT NULL CHECK (char_length(message) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. RLS
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_comments ENABLE ROW LEVEL SECURITY;

-- live_sessions: escola vê/edita a própria, alunos leem se public ou se têm matrícula no curso
CREATE POLICY "escola_gerencia_live" ON live_sessions
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "aluno_ve_live_publica" ON live_sessions
  FOR SELECT USING (
    status = 'live' AND visibility = 'public'
  );

CREATE POLICY "aluno_ve_live_restrita" ON live_sessions
  FOR SELECT USING (
    status = 'live'
    AND visibility = 'restricted'
    AND id IN (
      SELECT lsc.live_session_id
      FROM live_session_courses lsc
      JOIN enrollments e ON e.course_id = lsc.course_id
      WHERE e.student_id = auth.uid() AND e.status = 'active'
    )
  );

-- live_session_courses: escola gerencia, alunos leem
CREATE POLICY "escola_gerencia_live_courses" ON live_session_courses
  FOR ALL USING (
    live_session_id IN (
      SELECT id FROM live_sessions WHERE school_id IN (
        SELECT school_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "aluno_le_live_courses" ON live_session_courses
  FOR SELECT USING (true);

-- live_comments: usuário autenticado comenta em live ativa, todos leem
CREATE POLICY "usuario_comenta_live" ON live_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND live_session_id IN (
      SELECT id FROM live_sessions WHERE status = 'live'
    )
  );

CREATE POLICY "todos_leem_comments" ON live_comments
  FOR SELECT USING (true);

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_school ON live_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_comments_session ON live_comments(live_session_id, created_at);
