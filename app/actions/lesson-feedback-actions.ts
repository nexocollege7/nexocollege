'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { matriculaValida } from '@/lib/enrollment'

type Contexto = { userId: string; courseId: string; schoolId: string }
type Resultado = { error?: string; success?: boolean }

// Confere se o aluno tem matrícula válida no curso e devolve a escola do curso.
async function contextoDoCurso(userId: string, courseId: string): Promise<Contexto | { error: string }> {
  const admin = createAdminClient()
  const [{ data: curso }, { data: matricula }] = await Promise.all([
    admin.from('courses').select('id, school_id').eq('id', courseId).maybeSingle(),
    admin
      .from('enrollments')
      .select('id, status, expires_at')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (!curso) return { error: 'Curso não encontrado' }
  if (!matricula || !matriculaValida(matricula as Parameters<typeof matriculaValida>[0])) {
    return { error: 'Matrícula não encontrada' }
  }
  return { userId, courseId, schoolId: curso.school_id as string }
}

// Mesmo controle, partindo da aula.
async function contextoDaAula(lessonId: string): Promise<Contexto | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const admin = createAdminClient()
  const { data: aula } = await admin.from('lessons').select('id, course_id').eq('id', lessonId).maybeSingle()
  if (!aula?.course_id) return { error: 'Aula não encontrada' }

  return contextoDoCurso(user.id, aula.course_id as string)
}

// Nota já dada pelo aluno e se ele já respondeu o pulso desta aula.
export async function getLessonFeedback(lessonId: string): Promise<{ myRating: number | null; pulseAnswered: boolean }> {
  const ctx = await contextoDaAula(lessonId)
  if ('error' in ctx) return { myRating: null, pulseAnswered: true }

  const admin = createAdminClient()
  const [{ data: nota }, { data: pulso }] = await Promise.all([
    admin.from('lesson_ratings').select('rating').eq('lesson_id', lessonId).eq('student_id', ctx.userId).maybeSingle(),
    admin.from('lesson_pulses').select('id').eq('lesson_id', lessonId).eq('student_id', ctx.userId).maybeSingle(),
  ])

  return { myRating: (nota?.rating as number | undefined) ?? null, pulseAnswered: !!pulso }
}

// Salva (ou atualiza) as estrelas da aula.
export async function rateLesson(lessonId: string, rating: number): Promise<Resultado> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Nota inválida' }

  const ctx = await contextoDaAula(lessonId)
  if ('error' in ctx) return { error: ctx.error }

  const admin = createAdminClient()
  const { error } = await admin.from('lesson_ratings').upsert(
    {
      lesson_id: lessonId,
      course_id: ctx.courseId,
      school_id: ctx.schoolId,
      student_id: ctx.userId,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'lesson_id,student_id' }
  )

  if (error) return { error: 'Erro ao salvar avaliação' }
  return { success: true }
}

// Salva a resposta do pulso "Como está a aula até aqui?" (uma vez por aula).
export async function answerLessonPulse(lessonId: string, answer: 'confusa' | 'boa' | 'otima'): Promise<Resultado> {
  if (!['confusa', 'boa', 'otima'].includes(answer)) return { error: 'Resposta inválida' }

  const ctx = await contextoDaAula(lessonId)
  if ('error' in ctx) return { error: ctx.error }

  const admin = createAdminClient()
  const { error } = await admin.from('lesson_pulses').upsert(
    {
      lesson_id: lessonId,
      course_id: ctx.courseId,
      school_id: ctx.schoolId,
      student_id: ctx.userId,
      answer,
    },
    { onConflict: 'lesson_id,student_id', ignoreDuplicates: true }
  )

  if (error) return { error: 'Erro ao salvar resposta' }
  return { success: true }
}

// Decide se o convite de depoimento deve aparecer agora.
// Regras: aluno sem depoimento no curso; cada momento-chave só uma vez; no máximo 3 convites por curso.
export async function checkReviewInvite(
  courseId: string,
  gatilho: 'concluiu' | 'estrelas',
  concluidas: number,
  total: number
): Promise<{ show: boolean; stage?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { show: false }

  const ctx = await contextoDoCurso(user.id, courseId)
  if ('error' in ctx) return { show: false }

  const admin = createAdminClient()

  const { data: depoimento } = await admin
    .from('course_reviews')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .limit(1)
    .maybeSingle()
  if (depoimento) return { show: false }

  let stage: string | null = null
  if (gatilho === 'estrelas') {
    stage = 'estrelas'
  } else if (total > 0 && concluidas >= total) {
    stage = 'conclusao'
  } else if (total >= 4 && concluidas >= Math.ceil(total / 2)) {
    stage = 'metade'
  } else if (concluidas >= 2) {
    stage = 'aula2'
  }
  if (!stage) return { show: false }

  const { data: convites } = await admin
    .from('review_invites')
    .select('stage')
    .eq('student_id', user.id)
    .eq('course_id', courseId)

  const usados = (convites ?? []).map((c) => c.stage as string)
  if (usados.includes(stage) || usados.length >= 3) return { show: false }

  const { error } = await admin
    .from('review_invites')
    .insert({ student_id: user.id, course_id: courseId, stage })
  if (error) return { show: false }

  return { show: true, stage }
}
