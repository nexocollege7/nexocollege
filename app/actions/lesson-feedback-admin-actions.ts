'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type ResumoAula = {
  lessonId: string
  titulo: string
  modulo: string
  media: number | null
  totalNotas: number
  pulso: { otima: number; boa: number; confusa: number }
}

export type ResumoCurso = {
  media: number | null
  totalNotas: number
  totalPulsos: number
  aulas: ResumoAula[]
}

// Escola do usuário logado (equipe da escola; alunos não têm acesso).
async function escolaDaEquipe(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('role, school_id').eq('id', user.id).maybeSingle()
  if (!profile || profile.role === 'student' || profile.role === 'mentor_guest') return null
  if (profile.school_id) return profile.school_id as string

  const { data: propria } = await admin.from('schools').select('id').eq('owner_id', user.id).maybeSingle()
  return (propria?.id as string | undefined) ?? null
}

export async function listarCursosParaAvaliacao(): Promise<{ id: string; title: string }[]> {
  const schoolId = await escolaDaEquipe()
  if (!schoolId) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('courses')
    .select('id, title')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  return (data ?? []) as { id: string; title: string }[]
}

export async function getResumoAvaliacoesCurso(courseId: string): Promise<ResumoCurso | { error: string }> {
  const schoolId = await escolaDaEquipe()
  if (!schoolId) return { error: 'Acesso negado' }

  const admin = createAdminClient()
  const { data: curso } = await admin.from('courses').select('id, school_id').eq('id', courseId).maybeSingle()
  if (!curso || curso.school_id !== schoolId) return { error: 'Curso não encontrado' }

  const [{ data: aulas }, { data: modulos }, { data: notas }, { data: pulsos }] = await Promise.all([
    admin.from('lessons').select('id, title, position, module_id').eq('course_id', courseId),
    admin.from('modules').select('id, title, position').eq('course_id', courseId),
    admin.from('lesson_ratings').select('lesson_id, rating').eq('course_id', courseId),
    admin.from('lesson_pulses').select('lesson_id, answer').eq('course_id', courseId),
  ])

  const mapaModulos = new Map((modulos ?? []).map((m) => [m.id as string, { titulo: (m.title as string) ?? '', pos: (m.position as number) ?? 0 }]))

  const listaAulas = (aulas ?? [])
    .map((a) => ({
      id: a.id as string,
      titulo: a.title as string,
      pos: (a.position as number) ?? 0,
      modulo: mapaModulos.get(a.module_id as string) ?? { titulo: '', pos: 0 },
    }))
    .sort((x, y) => x.modulo.pos - y.modulo.pos || x.pos - y.pos)

  const resumo: ResumoAula[] = listaAulas.map((a) => {
    const minhas = (notas ?? []).filter((n) => n.lesson_id === a.id).map((n) => Number(n.rating))
    const meusPulsos = (pulsos ?? []).filter((p) => p.lesson_id === a.id)
    return {
      lessonId: a.id,
      titulo: a.titulo,
      modulo: a.modulo.titulo,
      media: minhas.length ? Math.round((minhas.reduce((s, n) => s + n, 0) / minhas.length) * 10) / 10 : null,
      totalNotas: minhas.length,
      pulso: {
        otima: meusPulsos.filter((p) => p.answer === 'otima').length,
        boa: meusPulsos.filter((p) => p.answer === 'boa').length,
        confusa: meusPulsos.filter((p) => p.answer === 'confusa').length,
      },
    }
  })

  const todas = (notas ?? []).map((n) => Number(n.rating))
  return {
    media: todas.length ? Math.round((todas.reduce((s, n) => s + n, 0) / todas.length) * 10) / 10 : null,
    totalNotas: todas.length,
    totalPulsos: (pulsos ?? []).length,
    aulas: resumo,
  }
}
