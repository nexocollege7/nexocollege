'use server'

import { createClient } from '@/lib/supabase/server'
import { matriculaValida } from '@/lib/enrollment'

async function atualizarTotalAulas(supabase: any, courseId: string) {
  const { count } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)

  await supabase
    .from('courses')
    .update({ total_lessons: count ?? 0 })
    .eq('id', courseId)
}

export async function criarAula(
  moduleId: string,
  courseId: string,
  title: string,
  videoUrl: string,
  materialLinks: string = ''
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: existing } = await supabase
    .from('lessons')
    .select('position')
    .eq('module_id', moduleId)
    .order('position', { ascending: false })
    .limit(1)
  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      course_id: courseId,
      title,
      video_url: videoUrl,
      material_links: materialLinks || null,
      type: 'video',
      position: nextPosition,
      is_free: false,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  await atualizarTotalAulas(supabase, courseId)
  return { data }
}

export async function atualizarAula(
  aulaId: string,
  title: string,
  videoUrl: string,
  materialLinks: string = ''
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('lessons')
    .update({
      title,
      video_url: videoUrl,
      material_links: materialLinks || null,
    })
    .eq('id', aulaId)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function deletarAula(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: aula } = await supabase
    .from('lessons')
    .select('course_id')
    .eq('id', aulaId)
    .single()

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', aulaId)
  if (error) return { error: error.message }

  if (aula?.course_id) {
    await atualizarTotalAulas(supabase, aula.course_id)
  }

  return { success: true }
}

async function temMatriculaAtiva(supabase: any, studentId: string, courseId: string): Promise<boolean> {
  const { data } = await supabase
    .from('enrollments')
    .select('status, expires_at')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle()
  return !!data && matriculaValida(data)
}

export async function getAulasDoAluno(courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []
  if (!(await temMatriculaAtiva(supabase, user.id, courseId))) return []

  const { data: modulos, error } = await supabase
    .from('modules')
    .select('*, lessons(id, title, video_url, position, is_free, type)')
    .eq('course_id', courseId)
    .order('position', { ascending: true })

  if (error || !modulos) return []

  const { data: progresso } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('student_id', user.id)
    .eq('course_id', courseId)

  const progressoMap = new Map(
    (progresso || []).map((p) => [p.lesson_id, p.is_completed])
  )

  return modulos.map((m) => ({
    ...m,
    lessons: (m.lessons || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((l: any) => ({
        ...l,
        completed: progressoMap.get(l.id) || false,
      })),
  }))
}

export async function marcarAulaConcluida(lessonId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  if (!(await temMatriculaAtiva(supabase, user.id, courseId))) {
    return { error: 'Sem matrícula ativa neste curso' }
  }

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      student_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'student_id,lesson_id' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function salvarMateriais(aulaId: string, links: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('lessons')
    .update({ material_links: links || null })
    .eq('id', aulaId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getMateriais(aulaId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .select('material_links')
    .eq('id', aulaId)
    .single()
  return data?.material_links || ''
}
